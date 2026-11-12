-- ==============================================================================
-- UNRAM Office of International Affairs (OIA) CMS
-- Migration: 0003_live_content.sql
-- Description: Real-time single-source site content with section-level locking,
--              optimistic concurrency, version history, and instant publication.
-- Notice: DEPRECATING site_content_draft, site_content_published, and publish_site_content().
--         Existing tables and data remain untouched for backward compatibility.
-- ==============================================================================

-- 1. Table: site_content (Single live source of truth for site sections)
CREATE TABLE IF NOT EXISTS public.site_content (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  content jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Seed site_content from site_content_published (excluding news, which moves to news_articles in 0004)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.site_content WHERE id = 'main') THEN
    INSERT INTO public.site_content (id, content, version, updated_at, updated_by)
    SELECT
      'main',
      COALESCE(content - 'news', '{}'::jsonb),
      1,
      now(),
      published_by
    FROM public.site_content_published
    WHERE id = 'main'
    LIMIT 1;

    -- If site_content_published did not exist or was empty, initialize fallback row
    IF NOT FOUND THEN
      INSERT INTO public.site_content (id, content, version, updated_at)
      VALUES ('main', '{}'::jsonb, 1, now())
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- 2. Table: site_content_history (Past 100 snapshots for rollback & audit)
CREATE TABLE IF NOT EXISTS public.site_content_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content jsonb NOT NULL,
  version integer NOT NULL,
  section_changed text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_site_content_history_updated_at
  ON public.site_content_history (updated_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_history ENABLE ROW LEVEL SECURITY;

-- Anyone (anon and authenticated) may SELECT live content
DROP POLICY IF EXISTS "Public read live site content" ON public.site_content;
CREATE POLICY "Public read live site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

-- No direct INSERT/UPDATE/DELETE on site_content.
-- All writes must go through the SECURITY DEFINER RPC save_site_section().

-- Only verified admins can view content history
DROP POLICY IF EXISTS "Admin view site content history" ON public.site_content_history;
CREATE POLICY "Admin view site content history"
  ON public.site_content_history FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Trigger: site_content_history on UPDATE
CREATE OR REPLACE FUNCTION public.trg_record_site_content_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.site_content_history (content, version, section_changed, updated_at, updated_by)
  VALUES (
    OLD.content,
    OLD.version,
    current_setting('unram.current_section', true),
    OLD.updated_at,
    OLD.updated_by
  );

  -- Keep only the latest 100 history records
  DELETE FROM public.site_content_history
  WHERE id NOT IN (
    SELECT id
    FROM public.site_content_history
    ORDER BY id DESC
    LIMIT 100
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_content_history ON public.site_content;
CREATE TRIGGER trg_site_content_history
  AFTER UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_site_content_history();

-- 5. RPC: save_site_section(section text, value jsonb, expected_version integer)
-- Updates only the target section in jsonb, verifies expected_version, bumps version
CREATE OR REPLACE FUNCTION public.save_site_section(
  section text,
  value jsonb,
  expected_version integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current RECORD;
  v_new_version integer;
  v_new_updated_at timestamptz := now();
  v_allowed_sections text[] := ARRAY[
    'hero',
    'about',
    'admissionSteps',
    'stats',
    'services',
    'faq',
    'contact',
    'guides',
    'partners'
  ];
BEGIN
  -- Verify admin authorization
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun admin yang dapat menyimpan perubahan.'
      USING ERRCODE = '42501';
  END IF;

  -- Validate allowlist
  IF NOT (section = ANY(v_allowed_sections)) THEN
    RAISE EXCEPTION 'Seksi tidak valid: "%". Seksi harus terdaftar dalam allowlist resmi.', section
      USING ERRCODE = '22023';
  END IF;

  -- Lock row for concurrency check
  SELECT * INTO v_current
  FROM public.site_content
  WHERE id = 'main'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baris konten utama tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Optimistic concurrency check
  IF expected_version IS NOT NULL AND v_current.version <> expected_version THEN
    RAISE EXCEPTION 'version_conflict: Konten telah diperbarui oleh pengguna lain (versi server: %, versi Anda: %).', v_current.version, expected_version
      USING ERRCODE = 'P0004';
  END IF;

  v_new_version := v_current.version + 1;

  -- Set transaction context for history trigger
  PERFORM set_config('unram.current_section', section, true);

  -- Update only the target section
  UPDATE public.site_content
  SET
    content = jsonb_set(COALESCE(content, '{}'::jsonb), ARRAY[section], value, true),
    version = v_new_version,
    updated_at = v_new_updated_at,
    updated_by = auth.uid()
  WHERE id = 'main';

  RETURN jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'updated_at', v_new_updated_at,
    'section', section
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_site_section(text, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_site_section(text, jsonb, integer) TO authenticated;

-- 6. RPC: restore_site_content(history_id bigint)
-- Restores a previous snapshot as a brand new live version
CREATE OR REPLACE FUNCTION public.restore_site_content(history_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_history RECORD;
  v_current RECORD;
  v_new_version integer;
  v_new_updated_at timestamptz := now();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun admin yang dapat memulihkan riwayat.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_history
  FROM public.site_content_history
  WHERE id = history_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Riwayat versi dengan ID % tidak ditemukan.', history_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_current
  FROM public.site_content
  WHERE id = 'main'
  FOR UPDATE;

  v_new_version := COALESCE(v_current.version, 0) + 1;

  PERFORM set_config('unram.current_section', 'restore_history_' || history_id::text, true);

  UPDATE public.site_content
  SET
    content = v_history.content,
    version = v_new_version,
    updated_at = v_new_updated_at,
    updated_by = auth.uid()
  WHERE id = 'main';

  RETURN jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'updated_at', v_new_updated_at,
    'restored_from_history_id', history_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_site_content(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_site_content(bigint) TO authenticated;
