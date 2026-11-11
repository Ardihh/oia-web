/**
 * Publish Bundle ZIP generator & importer
 * Packages static /content/site-content.json and /uploads/[hash].[ext] assets
 */

import JSZip from 'jszip';
import { SiteContent, NewsArticle, GuideItem } from '@/context/ContentContext';
import { getAllBlobsFromDb, saveBlobToDb, saveDraftToDb, setMetadata } from './db';
import { computeContentHash } from './imageCompression';
import { validateSiteContent, CURRENT_SCHEMA_VERSION } from './schemaValidator';
import { sanitizeRichHtml } from './domPurify';

export interface BundleStats {
  articlesCount: number;
  guidesCount: number;
  uploadsCount: number;
  totalSizeBytes: number;
}

export interface ImportPreview {
  content: SiteContent;
  blobs: Array<{ path: string; blob: Blob; filename: string; mimeType: string }>;
  summary: {
    articles: number;
    guides: number;
    files: number;
    updatedAt: string;
  };
  apply: () => Promise<void>;
}

/**
 * Convert a base64 data URL to a binary Blob
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string; ext: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  let ext = 'bin';
  if (mimeType === 'image/webp') ext = 'webp';
  else if (mimeType === 'image/jpeg') ext = 'jpg';
  else if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/gif') ext = 'gif';
  else if (mimeType === 'application/pdf') ext = 'pdf';

  return { blob: new Blob([uint8Array], { type: mimeType }), mimeType, ext };
}

/**
 * Generate a complete "Publish Bundle" ZIP containing:
 * - content/site-content.json
 * - uploads/[hash].[ext]
 * - README.txt
 */
export async function generatePublishBundle(
  draft: SiteContent
): Promise<{ zipBlob: Blob; stats: BundleStats; filename: string }> {
  const zip = new JSZip();
  const uploadsFolder = zip.folder('uploads')!;
  const contentFolder = zip.folder('content')!;

  // Deep clone draft to manipulate URLs
  const publishContent: SiteContent = JSON.parse(JSON.stringify(draft));
  publishContent.schemaVersion = CURRENT_SCHEMA_VERSION;
  publishContent.updatedAt = new Date().toISOString();

  const fileMap = new Map<string, { blob: Blob; filename: string }>();

  // 1. Collect all stored blobs from IndexedDB
  const storedBlobs = await getAllBlobsFromDb();
  for (const item of storedBlobs) {
    const filename = item.path.replace(/^\/uploads\//, '');
    fileMap.set(filename, { blob: item.blob, filename });
  }

  // Helper to extract & replace data URLs
  const processUrl = async (urlStr: string): Promise<string> => {
    if (!urlStr || typeof urlStr !== 'string') return urlStr;

    if (urlStr.startsWith('data:')) {
      const { blob, ext } = dataUrlToBlob(urlStr);
      const arrayBuf = await blob.arrayBuffer();
      const hash = await computeContentHash(arrayBuf);
      const filename = `${hash}.${ext}`;
      fileMap.set(filename, { blob, filename });
      return `/uploads/${filename}`;
    }

    return urlStr;
  };

  // Helper to extract inline images from HTML
  const processHtmlImages = async (html: string): Promise<string> => {
    if (!html || typeof html !== 'string') return html;

    let clean = sanitizeRichHtml(html);
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    const replacements: Array<{ original: string; replacement: string }> = [];

    while ((match = imgRegex.exec(clean)) !== null) {
      const src = match[1];
      if (src.startsWith('data:')) {
        const newPath = await processUrl(src);
        replacements.push({ original: src, replacement: newPath });
      }
    }

    for (const r of replacements) {
      clean = clean.split(r.original).join(r.replacement);
    }

    return clean;
  };

  // Process Hero Image
  if (publishContent.hero?.bgImage) {
    publishContent.hero.bgImage = await processUrl(publishContent.hero.bgImage);
  }

  // Process Head Photo
  if (publishContent.about?.headPhoto) {
    publishContent.about.headPhoto = await processUrl(publishContent.about.headPhoto);
  }

  // Process Guides
  if (Array.isArray(publishContent.guides)) {
    for (const guide of publishContent.guides) {
      if (guide.fileUrl) {
        guide.fileUrl = await processUrl(guide.fileUrl);
      }
    }
  }

  // Process News Articles
  if (Array.isArray(publishContent.news)) {
    for (const article of publishContent.news) {
      if (article.image) {
        article.image = await processUrl(article.image);
      }
      if (article.content) {
        if (article.content.id) {
          article.content.id = await processHtmlImages(article.content.id);
        }
        if (article.content.en) {
          article.content.en = await processHtmlImages(article.content.en);
        }
      }
    }
  }

  // Add all files into uploads/ folder in ZIP
  for (const [filename, item] of fileMap.entries()) {
    uploadsFolder.file(filename, item.blob);
  }

  // Add site-content.json
  const jsonStr = JSON.stringify(publishContent, null, 2);
  contentFolder.file('site-content.json', jsonStr);

  // Add README.txt
  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const readme = `====================================================================
PANDUAN PUBLIKASI WEBSITE KANTOR URUSAN INTERNASIONAL (KUI) UNRAM
Waktu Paket Dibuat: ${dateStr}
====================================================================

File ZIP ini adalah "Paket Publikasi" resmi yang siap diunggah ke server web hosting UNRAM.
Server universitas hanya membutuhkan file statis tanpa runtime Node.js atau database.

LANGKAH PENERAPAN DI SERVER:
1. Ekstrak file zip ini di komputer Anda. Anda akan melihat dua folder:
   - folder "content" (berisi site-content.json)
   - folder "uploads" (berisi file gambar dan dokumen PDF)

2. Buka cPanel / File Manager / FTP akun hosting website UNRAM.

3. Masuk ke folder root publikasi (biasanya public_html atau htdocs).

4. Unggah dan timpa (overwrite) folder "content" dan "uploads" ke direktori tersebut.

5. SELESAI!
   Perubahan berita, informasi, foto, dan dokumen langsung tampil
   secara instan kepada seluruh pengunjung tanpa perlu build ulang program.

====================================================================
KUI Universitas Mataram (Office of International Affairs - UNRAM)
Lombok, Nusa Tenggara Barat, Indonesia
====================================================================`;

  zip.file('README.txt', readme);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Update export metadata in IndexedDB
  await setMetadata('last_exported_at', new Date().toISOString());
  await setMetadata('has_unexported_changes', false);

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const bundleFilename = `unram-publish-bundle-${dateFormatted}.zip`;

  const stats: BundleStats = {
    articlesCount: publishContent.news?.length || 0,
    guidesCount: publishContent.guides?.length || 0,
    uploadsCount: fileMap.size,
    totalSizeBytes: zipBlob.size,
  };

  return { zipBlob, stats, filename: bundleFilename };
}

/**
 * Import a published bundle (ZIP or plain site-content.json) into draft
 */
export async function inspectPublishBundle(file: File): Promise<ImportPreview> {
  const isZip = file.name.endsWith('.zip') || file.type.includes('zip');

  if (isZip) {
    const zip = await JSZip.loadAsync(file);
    const contentFile = zip.file('content/site-content.json') || zip.file('site-content.json');

    if (!contentFile) {
      throw new Error('File ZIP tidak valid: tidak ditemukan "content/site-content.json".');
    }

    const jsonText = await contentFile.async('text');
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error('File "content/site-content.json" di dalam ZIP rusak (bukan JSON valid).');
    }

    const validation = validateSiteContent(parsed);
    if (!validation.valid || !validation.sanitizedContent) {
      throw new Error(`Skema konten tidak valid: ${validation.errors.join(', ')}`);
    }

    // Extract uploads folder
    const blobsToSave: Array<{ path: string; blob: Blob; filename: string; mimeType: string }> = [];
    const uploadsFolder = zip.folder('uploads');

    if (uploadsFolder) {
      const entries: Array<JSZip.JSZipObject> = [];
      uploadsFolder.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) entries.push(zipEntry);
      });

      for (const entry of entries) {
        const filename = entry.name.split('/').pop() || entry.name;
        const ext = filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'pdf') mimeType = 'application/pdf';

        const blob = await entry.async('blob');
        blobsToSave.push({
          path: `/uploads/${filename}`,
          blob: new Blob([blob], { type: mimeType }),
          filename,
          mimeType,
        });
      }
    }

    const content = validation.sanitizedContent;

    return {
      content,
      blobs: blobsToSave,
      summary: {
        articles: content.news?.length || 0,
        guides: content.guides?.length || 0,
        files: blobsToSave.length,
        updatedAt: content.updatedAt || 'Tidak diketahui',
      },
      apply: async () => {
        // Save all blobs into IndexedDB
        for (const item of blobsToSave) {
          await saveBlobToDb(item.path, item.blob, item.filename, item.mimeType);
        }
        // Save draft into IndexedDB
        await saveDraftToDb(content);
      },
    };
  }

  // Plain JSON file import
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File yang dipilih bukan JSON valid.');
  }

  const validation = validateSiteContent(parsed);
  if (!validation.valid || !validation.sanitizedContent) {
    throw new Error(`Skema file tidak valid: ${validation.errors.join(', ')}`);
  }

  const content = validation.sanitizedContent;

  return {
    content,
    blobs: [],
    summary: {
      articles: content.news?.length || 0,
      guides: content.guides?.length || 0,
      files: 0,
      updatedAt: content.updatedAt || 'Tidak diketahui',
    },
    apply: async () => {
      await saveDraftToDb(content);
    },
  };
}
