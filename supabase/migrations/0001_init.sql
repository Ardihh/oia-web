-- ==============================================================================
-- UNRAM Office of International Affairs (OIA) CMS
-- Database Initialization & Security Migration
-- Migration: 0001_init.sql
-- Idempotent script for Supabase SQL Editor
-- ==============================================================================

-- 1. Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Table: site_content_draft
CREATE TABLE IF NOT EXISTS public.site_content_draft (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  content jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- 3. Table: site_content_published
CREATE TABLE IF NOT EXISTS public.site_content_published (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  content jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid REFERENCES auth.users(id)
);

-- 4. Table: site_content_versions
CREATE TABLE IF NOT EXISTS public.site_content_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid,
  note text
);

-- Create index on versions table for quick lookup
CREATE INDEX IF NOT EXISTS idx_site_content_versions_published_at
  ON public.site_content_versions (published_at DESC);

-- ==============================================================================
-- Functions (SECURITY DEFINER with empty search_path for SQL injection protection)
-- ==============================================================================

-- Check if current authenticated user has an active admin record
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Publish draft to published table and record in version history
CREATE OR REPLACE FUNCTION public.publish_site_content(note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_draft RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun admin yang dapat mempublikasikan konten.'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_draft
  FROM public.site_content_draft
  WHERE id = 'main';

  IF NOT FOUND OR v_draft.content IS NULL THEN
    RAISE EXCEPTION 'Draf tidak ditemukan atau kosong. Harap simpan draf terlebih dahulu.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Upsert to published table
  INSERT INTO public.site_content_published (id, content, published_at, published_by)
  VALUES ('main', v_draft.content, now(), auth.uid())
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    published_at = EXCLUDED.published_at,
    published_by = EXCLUDED.published_by;

  -- Record version in history
  INSERT INTO public.site_content_versions (content, published_at, published_by, note)
  VALUES (v_draft.content, now(), auth.uid(), note);

  -- Keep only the latest 30 versions
  DELETE FROM public.site_content_versions
  WHERE id NOT IN (
    SELECT id
    FROM public.site_content_versions
    ORDER BY id DESC
    LIMIT 30
  );

  RETURN v_draft.content;
END;
$$;

-- Permissions on functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.publish_site_content(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_site_content(text) TO authenticated;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_draft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_versions ENABLE ROW LEVEL SECURITY;

-- 1. admin_users policies
DROP POLICY IF EXISTS "Users can view own admin row" ON public.admin_users;
CREATE POLICY "Users can view own admin row"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. site_content_published policies
-- Anyone (anonymous public visitors or authenticated users) can SELECT published content
DROP POLICY IF EXISTS "Public read published content" ON public.site_content_published;
CREATE POLICY "Public read published content"
  ON public.site_content_published FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policy on site_content_published:
-- Client cannot write directly. Writes happen ONLY via publish_site_content() RPC.

-- 3. site_content_draft policies
-- Only verified admins can read, create, or update the working draft
DROP POLICY IF EXISTS "Admin select draft" ON public.site_content_draft;
CREATE POLICY "Admin select draft"
  ON public.site_content_draft FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin insert draft" ON public.site_content_draft;
CREATE POLICY "Admin insert draft"
  ON public.site_content_draft FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin update draft" ON public.site_content_draft;
CREATE POLICY "Admin update draft"
  ON public.site_content_draft FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. site_content_versions policies
-- Only verified admins can read past versions
DROP POLICY IF EXISTS "Admin select versions" ON public.site_content_versions;
CREATE POLICY "Admin select versions"
  ON public.site_content_versions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- Supabase Storage Setup (Bucket: site-media)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  10485760, -- 10 MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read site media" ON storage.objects;
CREATE POLICY "Public read site media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "Admin insert site media" ON storage.objects;
CREATE POLICY "Admin insert site media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admin update site media" ON storage.objects;
CREATE POLICY "Admin update site media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete site media" ON storage.objects;
CREATE POLICY "Admin delete site media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-media' AND public.is_admin());
