import staticSnapshot from '../../public/content/site-content.json';
import { SiteContent, NewsArticle, defaultSiteContent } from '@/context/ContentContext';
import { validateSiteContent } from '@/lib/schemaValidator';
import { getArticleSlug } from '@/lib/newsUtils';

export interface ServerSiteContentResult {
  content: SiteContent;
  publishedAt?: string;
  source: 'supabase-live' | 'supabase-published' | 'snapshot' | 'bundled';
  version?: number;
}

/**
 * Format an ISO date or timestamptz into localized Indonesian and English date strings
 */
export function formatNewsDate(dateStr?: string): { id: string; en: string } {
  if (!dateStr) {
    const now = new Date();
    return {
      en: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      id: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { id: dateStr, en: dateStr };
    }
    return {
      en: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      id: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  } catch {
    return { id: dateStr, en: dateStr };
  }
}

/**
 * Transform a database row from public.news_articles into the frontend NewsArticle model
 */
export function transformDbNewsRow(row: any): NewsArticle {
  const publishedAt = row.published_at || row.created_at || new Date().toISOString();
  const date = row.date && typeof row.date === 'object' ? row.date : formatNewsDate(publishedAt);

  return {
    id: String(row.id || ''),
    slug: row.slug || getArticleSlug({ title: row.title, id: row.id }),
    status: row.status === 'draft' ? 'draft' : 'published',
    publishedAt,
    date,
    category: row.category && typeof row.category === 'object' 
      ? row.category 
      : { en: 'News', id: 'Berita' },
    author: row.author || 'OIA Team',
    image: row.image || '',
    imageCaption: row.image_caption ?? row.imageCaption ?? undefined,
    imageCredit: row.image_credit ?? row.imageCredit ?? undefined,
    title: row.title && typeof row.title === 'object' 
      ? row.title 
      : { en: String(row.title || ''), id: String(row.title || '') },
    summary: row.summary && typeof row.summary === 'object' 
      ? row.summary 
      : { en: '', id: '' },
    content: row.body && typeof row.body === 'object' 
      ? row.body 
      : (row.content && typeof row.content === 'object' ? row.content : { en: '<p></p>', id: '<p></p>' }),
    translationMeta: row.translation_meta ?? row.translationMeta ?? undefined,
  };
}

/**
 * Fetch live published news articles with ISR cache tags ('news')
 */
export async function getLiveNewsArticles(): Promise<NewsArticle[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/news_articles?status=eq.published&order=published_at.desc&select=*`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        next: { tags: ['news'], revalidate: 300 },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map(transformDbNewsRow);
        }
      }
    } catch (err: any) {
      console.warn('[serverContent] Failed to fetch news_articles from Supabase:', err?.message || err);
    }
  }

  // Fallback: check static snapshot or bundled default
  try {
    const snapshotArticles = (staticSnapshot as any)?.news;
    if (Array.isArray(snapshotArticles) && snapshotArticles.length > 0) {
      return snapshotArticles.map((a: any) => ({
        ...a,
        slug: a.slug || getArticleSlug(a),
      }));
    }
  } catch {
    // ignore
  }

  return (defaultSiteContent.news || []).map((a) => ({
    ...a,
    slug: a.slug || getArticleSlug(a),
  }));
}

/**
 * Fetch a single live published news article by slug with ISR cache tags ('news:<slug>', 'news')
 */
export async function getLiveNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const cleanSlug = slug?.trim();
  if (!cleanSlug) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/news_articles?slug=eq.${encodeURIComponent(cleanSlug)}&status=eq.published&select=*`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        next: { tags: [`news:${cleanSlug}`, 'news'], revalidate: 300 },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return transformDbNewsRow(rows[0]);
        }
      }
    } catch (err: any) {
      console.warn(`[serverContent] Failed to fetch article by slug (${cleanSlug}):`, err?.message || err);
    }
  }

  // Fallback: search fallback articles list
  const fallbackList = await getLiveNewsArticles();
  const matched = fallbackList.find(
    (a) => (a.slug && a.slug.toLowerCase() === cleanSlug.toLowerCase()) || a.id === cleanSlug
  );
  return matched || null;
}

/**
 * Server-only ISR loader that fetches live site content from Supabase.
 * Fallback chain:
 * 1. Supabase public.site_content (live sections)
 * 2. Supabase public.site_content_published (legacy published row during transition)
 * 3. Static snapshot bundled at build time (public/content/site-content.json)
 * 4. Bundled default content
 */
export async function getServerSiteContent(): Promise<ServerSiteContentResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // 1. Try public.site_content (Live editing model)
  if (supabaseUrl && supabaseKey) {
    try {
      const liveEndpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/site_content?id=eq.main&select=content,version,updated_at`;
      const liveRes = await fetch(liveEndpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        next: { tags: ['site-content'], revalidate: 300 },
      });

      if (liveRes.ok) {
        const rows = await liveRes.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.content) {
          const sections = rows[0].content;
          // Combine sections with live news articles
          const news = await getLiveNewsArticles();
          const assembled: SiteContent = {
            ...defaultSiteContent,
            ...sections,
            news,
            updatedAt: rows[0].updated_at || new Date().toISOString(),
          };

          const validation = validateSiteContent(assembled);
          if (validation.valid && validation.sanitizedContent) {
            return {
              content: validation.sanitizedContent,
              publishedAt: rows[0].updated_at,
              source: 'supabase-live',
              version: rows[0].version || 1,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[serverContent] Failed to fetch live site_content:', err?.message || err);
    }

    // 2. Fallback to legacy site_content_published (pre-migration compatibility)
    try {
      const pubEndpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/site_content_published?id=eq.main&select=content,published_at`;
      const pubRes = await fetch(pubEndpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        next: { tags: ['site-content'], revalidate: 300 },
      });

      if (pubRes.ok) {
        const rows = await pubRes.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.content) {
          const validation = validateSiteContent(rows[0].content);
          if (validation.valid && validation.sanitizedContent) {
            return {
              content: validation.sanitizedContent,
              publishedAt: rows[0].published_at,
              source: 'supabase-published',
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[serverContent] Failed to fetch legacy site_content_published:', err?.message || err);
    }
  }

  // 3. Fallback: bundled static snapshot import (eliminates serverless fs readFileSync issues)
  try {
    const validation = validateSiteContent(staticSnapshot);
    if (validation.valid && validation.sanitizedContent) {
      return {
        content: validation.sanitizedContent,
        publishedAt: (staticSnapshot as any).updatedAt,
        source: 'snapshot',
      };
    }
  } catch (err: any) {
    console.warn('[serverContent] Failed to parse static snapshot import:', err?.message || err);
  }

  // 4. Final fallback: Bundled defaults
  return {
    content: defaultSiteContent,
    publishedAt: defaultSiteContent.updatedAt,
    source: 'bundled',
  };
}
