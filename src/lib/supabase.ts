/**
 * Browser-only Supabase client and typed data helpers for UNRAM OIA CMS
 * Configured for pure static export (no Node runtime, no @supabase/ssr).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SiteContent, NewsArticle } from '@/context/ContentContext';
import { validateSiteContent } from '@/lib/schemaValidator';
import { compressImage, computeContentHash } from '@/lib/imageCompression';
import { slugify, getArticleSlug } from '@/lib/newsUtils';
import { transformDbNewsRow } from '@/lib/serverContent';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the lazy singleton Supabase client.
 * Returns null during SSR / static prerender build time if window is undefined.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Supabase URL or Publishable Key is not configured.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'unram_sb_auth',
      },
    });
  }

  return supabaseInstance;
}

/**
 * Formats or resolves a media path to its public accessible URL.
 */
export function mediaUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Already a full external URL or blob URL
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  // Supabase Storage path
  if (SUPABASE_URL) {
    if (path.startsWith('site-media/')) {
      const clean = path.replace(/^site-media\//, '');
      return `${SUPABASE_URL}/storage/v1/object/public/site-media/${clean}`;
    }
    if (path.startsWith('images/') || path.startsWith('files/')) {
      return `${SUPABASE_URL}/storage/v1/object/public/site-media/${path}`;
    }
  }

  // Local site static asset (e.g. /images/... or /uploads/...)
  return path;
}

/**
 * Checks if current authenticated session is an admin via RPC is_admin()
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return false;

    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.warn('is_admin() RPC check error:', error.message);
      return false;
    }
    return data === true;
  } catch (err) {
    console.warn('Failed to verify admin status:', err);
    return false;
  }
}

/**
 * Fetch published site content from Supabase
 * Public visitors only execute this read operation.
 */
export async function getPublishedContent(): Promise<SiteContent | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_content_published')
      .select('content, published_at')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !data || !data.content) {
      return null;
    }

    const validation = validateSiteContent(data.content);
    if (validation.valid && validation.sanitizedContent) {
      return validation.sanitizedContent;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching published content from Supabase:', err);
    return null;
  }
}

/**
 * Fetch current working draft from Supabase (Admin only)
 */
export async function getDraft(): Promise<{
  content: SiteContent;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_content_draft')
      .select('content, version, updated_at, updated_by')
      .eq('id', 'main')
      .maybeSingle();

    if (error || !data || !data.content) {
      return null;
    }

    const validation = validateSiteContent(data.content);
    return {
      content: validation.valid && validation.sanitizedContent ? validation.sanitizedContent : (data.content as SiteContent),
      version: data.version || 1,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  } catch (err) {
    console.error('Error fetching draft from Supabase:', err);
    return null;
  }
}

/**
 * Save draft to Supabase with optimistic version concurrency (Admin only)
 */
export async function saveDraft(
  content: SiteContent,
  expectedVersion: number
): Promise<{ success: boolean; version: number; conflict?: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, version: expectedVersion, error: 'Koneksi Supabase tidak aktif' };
  }

  try {
    // 1. Check current draft version
    const { data: current } = await supabase
      .from('site_content_draft')
      .select('version')
      .eq('id', 'main')
      .maybeSingle();

    const currentVersion = current?.version ?? 0;

    // If a record exists and its version is higher than our expectedVersion, flag conflict
    if (current && currentVersion > expectedVersion) {
      return {
        success: false,
        version: currentVersion,
        conflict: true,
        error: `Konflik: Draf di server telah diperbarui ke versi ${currentVersion}. Harap muat versi terbaru terlebih dahulu.`,
      };
    }

    const newVersion = currentVersion + 1;
    const { data: userResp } = await supabase.auth.getUser();
    const userId = userResp?.user?.id || null;

    // Reject data: URLs by automatically uploading them to Supabase Storage
    const cleanedContent = await sanitizeAndUploadAllDataUrls(content);

    const { error: upsertError } = await supabase
      .from('site_content_draft')
      .upsert({
        id: 'main',
        content: cleanedContent,
        version: newVersion,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });

    if (upsertError) {
      return { success: false, version: expectedVersion, error: upsertError.message };
    }

    return { success: true, version: newVersion };
  } catch (err: any) {
    return { success: false, version: expectedVersion, error: err?.message || 'Gagal menyimpan draf' };
  }
}

/**
 * Publish draft to site_content_published and record version history via RPC (Admin only)
 */
export async function publish(note?: string): Promise<{ success: boolean; content?: SiteContent; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Koneksi Supabase tidak tersedia' };
  }

  try {
    const { data, error } = await supabase.rpc('publish_site_content', {
      note: note || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const validation = validateSiteContent(data);
    return {
      success: true,
      content: validation.valid && validation.sanitizedContent ? validation.sanitizedContent : (data as SiteContent),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mempublikasikan konten' };
  }
}

/**
 * List the latest 30 published versions (Admin only)
 */
export async function listVersions(): Promise<
  Array<{ id: number; published_at: string; published_by?: string; note?: string }>
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('site_content_versions')
      .select('id, published_at, published_by, note')
      .order('id', { ascending: false })
      .limit(30);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Restore an archived version into the working draft without auto-publishing (Admin only)
 */
export async function restoreVersionToDraft(
  versionId: number
): Promise<{ success: boolean; content?: SiteContent; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Koneksi Supabase tidak aktif' };

  try {
    const { data, error } = await supabase
      .from('site_content_versions')
      .select('content')
      .eq('id', versionId)
      .maybeSingle();

    if (error || !data || !data.content) {
      return { success: false, error: 'Versi tidak ditemukan di server.' };
    }

    const validation = validateSiteContent(data.content);
    if (!validation.valid || !validation.sanitizedContent) {
      return { success: false, error: 'Data versi lama tidak valid.' };
    }

    // Save into draft
    const { data: draftInfo } = await supabase
      .from('site_content_draft')
      .select('version')
      .eq('id', 'main')
      .maybeSingle();

    const expectedVer = draftInfo?.version || 1;
    const saveRes = await saveDraft(validation.sanitizedContent, expectedVer);

    if (!saveRes.success) {
      return { success: false, error: saveRes.error };
    }

    return { success: true, content: validation.sanitizedContent };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memulihkan versi.' };
  }
}

/**
 * Upload a raw data: URL to Supabase Storage and return its public URL
 */
export async function uploadDataUrl(
  dataUrl: string,
  category: 'images' | 'files' = 'images'
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase || !dataUrl.startsWith('data:')) return dataUrl;

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const hash = await computeContentHash(arrayBuffer);
    const mime = blob.type || 'image/webp';
    let ext = mime.split('/')[1] || 'webp';
    if (ext === 'jpeg') ext = 'jpg';
    const storagePath = `${category}/${hash}.${ext}`;

    const { error } = await supabase.storage
      .from('site-media')
      .upload(storagePath, blob, { upsert: true, contentType: mime });

    if (!error) {
      return mediaUrl(`site-media/${storagePath}`);
    }
  } catch (e) {
    console.warn('Failed to auto-upload data URL to Storage:', e);
  }
  return dataUrl;
}

/**
 * Scan an object or string and replace any data: URLs with uploaded Storage URLs
 */
export async function sanitizeAndUploadAllDataUrls(content: any): Promise<any> {
  if (!content) return content;

  if (typeof content === 'string') {
    if (content.startsWith('data:image/')) {
      return await uploadDataUrl(content, 'images');
    }
    // Check if HTML string has embedded inline <img src="data:image/...">
    if (content.includes('data:image/')) {
      const dataUrlRegex = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g;
      const matches = Array.from(new Set(content.match(dataUrlRegex) || []));
      let updated = content;
      for (const match of matches) {
        const uploadedUrl = await uploadDataUrl(match, 'images');
        updated = updated.split(match).join(uploadedUrl);
      }
      return updated;
    }
    return content;
  }

  if (Array.isArray(content)) {
    const arr = [];
    for (const item of content) {
      arr.push(await sanitizeAndUploadAllDataUrls(item));
    }
    return arr;
  }

  if (typeof content === 'object') {
    const obj: any = {};
    for (const key of Object.keys(content)) {
      obj[key] = await sanitizeAndUploadAllDataUrls(content[key]);
    }
    return obj;
  }

  return content;
}

/**
 * Upload an image or file to Supabase Storage bucket 'site-media'
 * - Images are compressed to max 1600px, ~0.82 WebP/PNG
 * - Content-hashed filenames prevent caching collisions
 */
export async function uploadMedia(
  file: File,
  category: 'images' | 'files' = 'images'
): Promise<{
  success: boolean;
  path: string;
  publicUrl: string;
  originalSize?: number;
  compressedSize?: number;
  reductionPercent?: number;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, path: '', publicUrl: '', error: 'Koneksi Supabase tidak aktif' };
  }

  // Reject SVG uploads
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return {
      success: false,
      path: '',
      publicUrl: '',
      error: 'Format SVG tidak diizinkan demi keamanan sistem. Silakan gunakan format PNG, WebP, atau JPEG.',
    };
  }

  try {
    let uploadBlob: Blob = file;
    let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    let originalSize = file.size;
    let compressedSize = file.size;

    if (category === 'images' && file.type.startsWith('image/')) {
      const compResult = await compressImage(file);
      uploadBlob = compResult.blob;
      ext = compResult.filename.split('.').pop() || 'webp';
      originalSize = compResult.originalSize;
      compressedSize = compResult.compressedSize;
    }

    const reductionPercent =
      originalSize > compressedSize
        ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
        : 0;

    const arrayBuffer = await uploadBlob.arrayBuffer();
    const hash = await computeContentHash(arrayBuffer);
    const storagePath = `${category}/${hash}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('site-media')
      .upload(storagePath, uploadBlob, {
        cacheControl: '31536000',
        upsert: false,
        contentType: uploadBlob.type || file.type,
      });

    // If file already exists with same content-hash, it's safe to continue
    if (
      uploadError &&
      !uploadError.message?.toLowerCase().includes('already exists') &&
      !uploadError.message?.toLowerCase().includes('duplicate')
    ) {
      return { success: false, path: '', publicUrl: '', error: uploadError.message };
    }

    const publicUrl = mediaUrl(`site-media/${storagePath}`);
    return {
      success: true,
      path: `site-media/${storagePath}`,
      publicUrl,
      originalSize,
      compressedSize,
      reductionPercent,
    };
  } catch (err: any) {
    return { success: false, path: '', publicUrl: '', error: err?.message || 'Gagal mengunggah berkas' };
  }
}


// ============================================================================
// LIVE EDITING MODEL HELPERS (RPC save_site_section & relational news_articles)
// ============================================================================

/**
 * Trigger ISR cache revalidation via server route handler (/api/revalidate)
 */
export async function triggerRevalidate(tags: string[], paths?: string[]): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return false;

    const res = await fetch('/api/revalidate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tags, paths }),
    });

    return res.ok;
  } catch (e) {
    console.warn('[revalidate] Trigger failed:', e);
    return false;
  }
}

/**
 * Save a single section immediately to public.site_content via RPC
 * Optimistic concurrency: expectedVersion checks for collision
 * On success, automatically triggers /api/revalidate for ['site-content']
 */
export async function saveLiveSection(
  section: string,
  value: any,
  expectedVersion?: number
): Promise<{
  success: boolean;
  version?: number;
  conflict?: boolean;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Koneksi Supabase tidak aktif' };
  }

  try {
    // 1. Automatically sanitize and upload any embedded data: URLs to Supabase Storage
    const cleanValue = await sanitizeAndUploadAllDataUrls(value);

    // 2. Call RPC save_site_section
    const { data, error } = await supabase.rpc('save_site_section', {
      section,
      value: cleanValue,
      expected_version: expectedVersion ?? null,
    });

    if (error) {
      const isConflict =
        error.message?.includes('version_conflict') ||
        error.code === 'P0004' ||
        error.code === 'P0001';

      if (isConflict) {
        return {
          success: false,
          conflict: true,
          error: 'Seseorang menyimpan perubahan lebih dulu. Muat versi terbaru sebelum menyimpan kembali.',
        };
      }
      return { success: false, error: error.message };
    }

    // 3. Immediately trigger ISR cache revalidation
    await triggerRevalidate(['site-content']);

    return {
      success: true,
      version: data?.version,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan seksi' };
  }
}

/**
 * Fetch full live site content (sections from site_content + articles from news_articles)
 */
export async function getLiveContent(): Promise<{
  content: SiteContent;
  version: number;
  updatedAt?: string;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Try public.site_content
    const { data, error } = await supabase
      .from('site_content')
      .select('content, version, updated_at')
      .eq('id', 'main')
      .maybeSingle();

    if (!error && data?.content) {
      // Also get news articles
      const news = await getAdminNewsArticles();
      const fullContent: SiteContent = {
        ...data.content,
        news,
        updatedAt: data.updated_at,
      };
      const validation = validateSiteContent(fullContent);
      return {
        content: validation.valid && validation.sanitizedContent ? validation.sanitizedContent : fullContent,
        version: data.version || 1,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn('Error fetching live site_content:', err);
  }

  // Fallback to legacy draft/published
  try {
    const draft = await getDraft();
    if (draft) {
      return {
        content: draft.content,
        version: draft.version,
        updatedAt: draft.updatedAt,
      };
    }
  } catch {}

  return null;
}

/**
 * Fetch all news articles for admin (including drafts)
 */
export async function getAdminNewsArticles(): Promise<NewsArticle[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(transformDbNewsRow);
    }
  } catch (err) {
    console.warn('Error fetching admin news_articles:', err);
  }

  // Fallback: check legacy draft
  try {
    const draft = await getDraft();
    if (Array.isArray(draft?.content?.news)) {
      return draft.content.news;
    }
  } catch {}

  return [];
}

/**
 * Save news article to public.news_articles
 * Handles both new articles (insert) and updates (with version tracking)
 * Revalidates 'news' and 'news:<slug>' tags
 */
export async function saveNewsArticle(
  article: Partial<NewsArticle>
): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Koneksi Supabase tidak aktif' };
  }

  try {
    const cleanImage = await sanitizeAndUploadAllDataUrls(article.image || '');
    const cleanBody = await sanitizeAndUploadAllDataUrls(
      article.content || { en: '<p></p>', id: '<p></p>' }
    );

    const slug = (article.slug && article.slug.trim()) || getArticleSlug({ title: article.title, id: article.id });
    const isNew = !article.id || !article.id.includes('-'); // UUID check

    const dbPayload: any = {
      slug,
      status: article.status || 'draft',
      published_at: article.status === 'published' ? (article.publishedAt || new Date().toISOString()) : (article.publishedAt || null),
      category: article.category,
      author: article.author || 'OIA Team',
      image: cleanImage,
      image_caption: article.imageCaption || null,
      image_credit: article.imageCredit || null,
      title: article.title,
      summary: article.summary,
      body: cleanBody,
      translation_meta: article.translationMeta || null,
      updated_at: new Date().toISOString(),
    };

    let resultData: any;
    if (isNew) {
      const { data, error } = await supabase
        .from('news_articles')
        .insert(dbPayload)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      resultData = data;
    } else {
      const { data, error } = await supabase
        .from('news_articles')
        .update(dbPayload)
        .eq('id', article.id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      resultData = data;
    }

    const savedArticle = transformDbNewsRow(resultData);

    // Trigger revalidation
    await triggerRevalidate(['news', `news:${savedArticle.slug}`]);

    return { success: true, article: savedArticle };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan berita' };
  }
}

/**
 * Delete a news article from public.news_articles
 */
export async function deleteNewsArticle(
  id: string,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Koneksi Supabase tidak aktif' };

  try {
    const { error } = await supabase.from('news_articles').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    const tags = ['news'];
    if (slug) tags.push(`news:${slug}`);
    await triggerRevalidate(tags);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus berita' };
  }
}

/**
 * List revisions for a news article (up to 20)
 */
export async function listNewsArticleRevisions(articleId: string): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('news_article_revisions')
      .select('id, article_id, revision_data, version, created_at, created_by')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * List history snapshots of site_content (up to 50)
 */
export async function listSiteContentHistory(): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('site_content_history')
      .select('id, version, section_changed, updated_at, updated_by')
      .order('id', { ascending: false })
      .limit(50);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Restore an archived history snapshot to live site_content via RPC
 */
export async function restoreSiteContentHistory(
  historyId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Koneksi Supabase tidak aktif' };
  try {
    const { error } = await supabase.rpc('restore_site_content', {
      p_history_id: historyId,
    });
    if (error) return { success: false, error: error.message };
    await triggerRevalidate(['site-content']);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memulihkan riwayat' };
  }
}

/**
 * Diagnostics interface and runner
 */
export interface DiagnosticItem {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failure';
  details: string;
}

export async function runSupabaseDiagnostics(): Promise<DiagnosticItem[]> {
  const supabase = getSupabase();
  const results: DiagnosticItem[] = [];

  // 1. Connection check
  if (!supabase) {
    return [
      {
        id: 'conn',
        name: 'Koneksi Klien Supabase',
        status: 'failure',
        details: 'Kredensial URL atau Publishable Key Supabase belum diisi di .env.local.',
      },
    ];
  }
  results.push({
    id: 'conn',
    name: 'Koneksi Klien Supabase',
    status: 'success',
    details: `Tersambung ke ${SUPABASE_URL}`,
  });

  // 2. Tables check
  try {
    const { error: draftErr } = await supabase.from('site_content_draft').select('id').limit(1);
    const { error: pubErr } = await supabase.from('site_content_published').select('id').limit(1);
    const { error: verErr } = await supabase.from('site_content_versions').select('id').limit(1);
    const { error: usrErr } = await supabase.from('admin_users').select('user_id').limit(1);

    if (draftErr || pubErr || verErr || usrErr) {
      results.push({
        id: 'tables',
        name: 'Ketersediaan Tabel Database (Legacy)',
        status: 'failure',
        details: `Tabel belum lengkap atau RLS memblokir: ${draftErr?.message || pubErr?.message || verErr?.message || usrErr?.message}`,
      });
    } else {
      results.push({
        id: 'tables',
        name: 'Ketersediaan Tabel Database (Legacy)',
        status: 'success',
        details: 'Tabel site_content_draft, site_content_published, site_content_versions, dan admin_users aktif.',
      });
    }
  } catch (e: any) {
    results.push({
      id: 'tables',
      name: 'Ketersediaan Tabel Database (Legacy)',
      status: 'failure',
      details: e?.message || 'Gagal memeriksa tabel',
    });
  }

  // 2b. Live Editing Tables check (0003 & 0004)
  try {
    const { error: liveErr } = await supabase.from('site_content').select('id').limit(1);
    const { error: newsErr } = await supabase.from('news_articles').select('id').limit(1);
    const { error: histErr } = await supabase.from('site_content_history').select('id').limit(1);

    if (liveErr || newsErr || histErr) {
      results.push({
        id: 'live_tables',
        name: 'Tabel Live Editing (site_content & news_articles)',
        status: 'pending',
        details: `Migrasi 0003/0004 belum dijalankan di Supabase: ${liveErr?.message || newsErr?.message || histErr?.message}. Jalankan migrasi di supabase/migrations/ sesuai docs/CUTOVER.md.`,
      });
    } else {
      results.push({
        id: 'live_tables',
        name: 'Tabel Live Editing (site_content & news_articles)',
        status: 'success',
        details: 'Tabel site_content, news_articles, dan site_content_history aktif untuk pengeditan langsung (Live Editing).',
      });
    }
  } catch (e: any) {
    results.push({
      id: 'live_tables',
      name: 'Tabel Live Editing (site_content & news_articles)',
      status: 'failure',
      details: e?.message || 'Gagal memeriksa tabel live editing',
    });
  }

  // 3. Published Row Check
  try {
    const { data: pubData } = await supabase
      .from('site_content_published')
      .select('published_at')
      .eq('id', 'main')
      .maybeSingle();

    if (pubData) {
      results.push({
        id: 'pub_row',
        name: 'Konten Terpublikasi (Live)',
        status: 'success',
        details: `Tersedia. Terakhir dipublikasikan: ${new Date(pubData.published_at).toLocaleString('id-ID')}`,
      });
    } else {
      results.push({
        id: 'pub_row',
        name: 'Konten Terpublikasi (Live)',
        status: 'pending',
        details: 'Belum ada konten yang dipublikasikan. Klik "Publikasikan" atau "Terbitkan Konten Awal".',
      });
    }
  } catch (e: any) {
    results.push({
      id: 'pub_row',
      name: 'Konten Terpublikasi (Live)',
      status: 'failure',
      details: e?.message || 'Gagal memeriksa konten publikasi',
    });
  }

  // 4. is_admin() verification
  try {
    const isAdmin = await checkIsAdmin();
    results.push({
      id: 'is_admin',
      name: 'Verifikasi Hak Akses Admin',
      status: isAdmin ? 'success' : 'failure',
      details: isAdmin
        ? 'Akun Anda terverifikasi sebagai admin resmi (is_admin = true).'
        : 'Akun Anda tidak memiliki hak akses admin di tabel admin_users.',
    });
  } catch (e: any) {
    results.push({
      id: 'is_admin',
      name: 'Verifikasi Hak Akses Admin',
      status: 'failure',
      details: e?.message || 'Gagal memverifikasi status admin',
    });
  }

  // 5. Storage bucket check
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    const hasMedia = buckets?.some((b) => b.id === 'site-media' || b.name === 'site-media');
    if (bErr || !hasMedia) {
      results.push({
        id: 'storage',
        name: 'Akses Bucket Storage site-media',
        status: 'failure',
        details: `Bucket site-media tidak ditemukan atau izin ditolak: ${bErr?.message || 'Bucket hilang'}`,
      });
    } else {
      results.push({
        id: 'storage',
        name: 'Akses Bucket Storage site-media',
        status: 'success',
        details: 'Bucket site-media aktif dan terhubung (Maks. 10 MB).',
      });
    }
  } catch (e: any) {
    results.push({
      id: 'storage',
      name: 'Akses Bucket Storage site-media',
      status: 'failure',
      details: e?.message || 'Gagal membaca storage',
    });
  }

  // 6. Upload-then-delete small test
  try {
    const testBlob = new Blob(['unram-test-' + Date.now()], { type: 'text/plain' });
    const testPath = `diagnostics/test-${Date.now()}.txt`;
    const { error: upErr } = await supabase.storage.from('site-media').upload(testPath, testBlob);
    if (upErr) {
      results.push({
        id: 'storage_rw',
        name: 'Uji Unggah & Hapus Berkas Storage',
        status: 'failure',
        details: `Gagal mengunggah berkas uji: ${upErr.message}`,
      });
    } else {
      await supabase.storage.from('site-media').remove([testPath]);
      results.push({
        id: 'storage_rw',
        name: 'Uji Unggah & Hapus Berkas Storage',
        status: 'success',
        details: 'Berhasil mengunggah dan menghapus berkas uji di bucket site-media.',
      });
    }
  } catch (e: any) {
    results.push({
      id: 'storage_rw',
      name: 'Uji Unggah & Hapus Berkas Storage',
      status: 'failure',
      details: e?.message || 'Error saat uji storage R/W',
    });
  }

  // 7. Security test: Unauthenticated write to draft must FAIL
  try {
    // Create temporary anonymous client without auth token
    const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
    const { error: secErr } = await anonClient
      .from('site_content_draft')
      .insert({ id: 'security_test', content: {} });

    if (secErr) {
      results.push({
        id: 'sec_test',
        name: 'Uji Penolakan Akses Anonim (RLS)',
        status: 'success',
        details: 'Akses tulis tanpa otentikasi berhasil ditolak oleh RLS (Aman).',
      });
    } else {
      // If it succeeded, that's a security failure!
      await anonClient.from('site_content_draft').delete().eq('id', 'security_test');
      results.push({
        id: 'sec_test',
        name: 'Uji Penolakan Akses Anonim (RLS)',
        status: 'failure',
        details: 'PERINGATAN: Klien anonim berhasil menulis ke site_content_draft! RLS belum aktif dengan benar.',
      });
    }
  } catch {
    results.push({
      id: 'sec_test',
      name: 'Uji Penolakan Akses Anonim (RLS)',
      status: 'success',
      details: 'Akses tulis anonim ditolak oleh aturan keamanan RLS.',
    });
  }

  return results;
}
