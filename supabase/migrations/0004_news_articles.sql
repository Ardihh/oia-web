-- ==============================================================================
-- UNRAM Office of International Affairs (OIA) CMS
-- Migration: 0004_news_articles.sql
-- Description: Dedicated relational news_articles table with strict RLS (drafts
--              hidden from anon/public), revision tracking, and automated migration.
-- ==============================================================================

-- 1. Table: news_articles
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  published_at timestamptz,
  category jsonb,
  author text,
  image text,
  image_caption jsonb,
  image_credit text,
  title jsonb NOT NULL,
  summary jsonb NOT NULL,
  body jsonb NOT NULL DEFAULT '{"en":"<p></p>","id":"<p></p>"}'::jsonb,
  translation_meta jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes for lightning fast queries and sorting
CREATE INDEX IF NOT EXISTS idx_news_articles_status_published_at
  ON public.news_articles (status, published_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_slug
  ON public.news_articles (slug);

-- 2. Table: news_article_revisions (Track last 20 revisions per article)
CREATE TABLE IF NOT EXISTS public.news_article_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  revision_data jsonb NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_news_article_revisions_lookup
  ON public.news_article_revisions (article_id, created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_article_revisions ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY RULE:
-- Anonymous and public authenticated users can ONLY SELECT published articles
-- whose published_at date is in the past. Drafts and scheduled articles are 100% invisible.
DROP POLICY IF EXISTS "Public read published news" ON public.news_articles;
CREATE POLICY "Public read published news"
  ON public.news_articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

-- Admins have full access (CRUD) to all news articles
DROP POLICY IF EXISTS "Admin full access news" ON public.news_articles;
CREATE POLICY "Admin full access news"
  ON public.news_articles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can view article revisions
DROP POLICY IF EXISTS "Admin view news revisions" ON public.news_article_revisions;
CREATE POLICY "Admin view news revisions"
  ON public.news_article_revisions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Trigger: news_article_revisions on UPDATE
CREATE OR REPLACE FUNCTION public.trg_record_news_article_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Record previous state
  INSERT INTO public.news_article_revisions (article_id, revision_data, version, created_at, created_by)
  VALUES (
    OLD.id,
    to_jsonb(OLD),
    OLD.version,
    OLD.updated_at,
    OLD.updated_by
  );

  -- Retain only latest 20 revisions for this article
  DELETE FROM public.news_article_revisions
  WHERE article_id = OLD.id
    AND id NOT IN (
      SELECT id
      FROM public.news_article_revisions
      WHERE article_id = OLD.id
      ORDER BY id DESC
      LIMIT 20
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_article_revision ON public.news_articles;
CREATE TRIGGER trg_news_article_revision
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_news_article_revision();

-- 5. Data Migration: Copy existing articles from site_content_published
DO $$
DECLARE
  v_elem jsonb;
  v_slug text;
  v_pub_at timestamptz;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.site_content_published
    WHERE id = 'main' AND jsonb_typeof(content->'news') = 'array'
  ) THEN
    FOR v_elem IN
      SELECT jsonb_array_elements(content->'news')
      FROM public.site_content_published
      WHERE id = 'main'
    LOOP
      -- 1. Compute stable slug
      v_slug := COALESCE(
        NULLIF(trim(v_elem->>'slug'), ''),
        NULLIF(lower(trim(regexp_replace(regexp_replace(COALESCE(v_elem->'title'->>'en', v_elem->'title'->>'id', 'article'), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))), ''),
        'article-' || substr(md5(random()::text), 1, 8)
      );

      -- 2. Compute published_at timestamp
      BEGIN
        IF v_elem->>'publishedAt' IS NOT NULL AND v_elem->>'publishedAt' ~ '^\d{4}-\d{2}-\d{2}' THEN
          v_pub_at := (v_elem->>'publishedAt')::timestamptz;
        ELSIF v_elem->'date'->>'en' IS NOT NULL AND v_elem->'date'->>'en' ~ '^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}' THEN
          v_pub_at := to_timestamp(v_elem->'date'->>'en', 'DD Mon YYYY');
        ELSE
          v_pub_at := now();
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_pub_at := now();
      END;

      -- 3. Insert article
      INSERT INTO public.news_articles (
        slug,
        status,
        published_at,
        category,
        author,
        image,
        image_caption,
        image_credit,
        title,
        summary,
        body,
        translation_meta,
        version,
        created_at,
        updated_at
      )
      VALUES (
        v_slug,
        COALESCE(NULLIF(v_elem->>'status', ''), 'published'),
        v_pub_at,
        COALESCE(v_elem->'category', jsonb_build_object('en', 'General', 'id', 'Umum')),
        v_elem->>'author',
        COALESCE(v_elem->>'image', '/images/news-1.jpg'),
        v_elem->'imageCaption',
        v_elem->>'imageCredit',
        COALESCE(v_elem->'title', jsonb_build_object('en', 'Untitled Article', 'id', 'Berita Tanpa Judul')),
        COALESCE(v_elem->'summary', jsonb_build_object('en', '', 'id', '')),
        COALESCE(v_elem->'content', jsonb_build_object('en', '<p></p>', 'id', '<p></p>')),
        v_elem->'translationMeta',
        1,
        v_pub_at,
        v_pub_at
      )
      ON CONFLICT (slug) DO NOTHING;
    END LOOP;
  END IF;
END $$;
