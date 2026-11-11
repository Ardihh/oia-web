import fs from 'fs';
import path from 'path';
import { SiteContent, defaultSiteContent } from '@/context/ContentContext';
import { validateSiteContent } from '@/lib/schemaValidator';

export interface ServerSiteContentResult {
  content: SiteContent;
  publishedAt?: string;
  source: 'supabase' | 'snapshot' | 'bundled';
}

let cachedResult: ServerSiteContentResult | null = null;

/**
 * Server-only build-time loader that fetches published content from Supabase.
 * Fallback chain: Supabase REST -> public/content/site-content.json -> bundled default.
 * Safe for build time: logs warnings on network/schema failure and never crashes the build.
 */
export async function getServerSiteContent(): Promise<ServerSiteContentResult> {
  if (cachedResult) {
    return cachedResult;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // 1. Try Supabase REST endpoint
  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/site_content_published?id=eq.main&select=content,published_at`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0]?.content) {
          const validation = validateSiteContent(rows[0].content);
          if (validation.valid && validation.sanitizedContent) {
            cachedResult = {
              content: validation.sanitizedContent,
              publishedAt: rows[0].published_at || undefined,
              source: 'supabase',
            };
            return cachedResult;
          } else {
            console.warn(
              '[serverContent] Supabase published content failed validation:',
              validation.errors
            );
          }
        }
      } else {
        console.warn(
          `[serverContent] Supabase REST returned status ${res.status}: ${res.statusText}`
        );
      }
    } catch (err: any) {
      console.warn(
        '[serverContent] Failed to fetch from Supabase REST endpoint, falling back to static snapshot:',
        err?.message || err
      );
    }
  }

  // 2. Secondary fallback: public/content/site-content.json snapshot
  try {
    const snapshotPath = path.join(process.cwd(), 'public', 'content', 'site-content.json');
    if (fs.existsSync(snapshotPath)) {
      const fileRaw = fs.readFileSync(snapshotPath, 'utf-8');
      const json = JSON.parse(fileRaw);
      const validation = validateSiteContent(json);
      if (validation.valid && validation.sanitizedContent) {
        cachedResult = {
          content: validation.sanitizedContent,
          publishedAt: json.updatedAt,
          source: 'snapshot',
        };
        return cachedResult;
      }
    }
  } catch (err: any) {
    console.warn(
      '[serverContent] Failed to read static snapshot fallback, falling back to bundled defaults:',
      err?.message || err
    );
  }

  // 3. Final fallback: Bundled defaults
  cachedResult = {
    content: defaultSiteContent,
    publishedAt: defaultSiteContent.updatedAt,
    source: 'bundled',
  };
  return cachedResult;
}
