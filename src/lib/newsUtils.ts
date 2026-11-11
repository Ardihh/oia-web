import sanitizeHtmlLib from 'sanitize-html';

/**
 * Utility functions for News Articles CMS & Public Site
 */

/**
 * Translation utility with dual provider resilience:
 * 1. Google Translate API (gtx client) - fast, handles long paragraphs, no CORS issues
 * 2. MyMemory API - reliable secondary fallback
 * 3. Silent error handling: never throws or triggers dev error overlays
 */
export async function translateText(
  text: string,
  from: 'id' | 'en',
  to: 'id' | 'en'
): Promise<string> {
  const clean = text?.trim();
  if (!clean) return '';

  // 1. Primary: Google Translate (gtx client)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(gtxUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((s: any) => s[0]).join('');
        if (translated?.trim()) {
          return translated.trim();
        }
      }
    }
  } catch {
    // Silently continue to fallback provider
  }

  // 2. Secondary: MyMemory API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const clipped = clean.length > 450 ? clean.substring(0, 450) : clean;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clipped)}&langpair=${from}|${to}`;
    const res = await fetch(myMemoryUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch {
    // Silently continue to fallback
  }

  return clean;
}

/**
 * Translate HTML content by translating inner text of block elements
 * (p, h2, h3, li, blockquote) while preserving structure and formatting
 */
export async function translateHtml(
  html: string,
  from: 'id' | 'en',
  to: 'id' | 'en'
): Promise<string> {
  if (!html || !html.trim() || html === '<p></p>') return '<p></p>';

  const normalizedHtml = isHtmlContent(html) ? html : plainTextToHtml(html);
  const blockRegex = /<((?:p|h2|h3|h4|li|blockquote)(?:\s+[^>]*)?)>([\s\S]*?)<\/\1>/gi;
  const matches: { full: string; tag: string; inner: string }[] = [];
  let m;
  while ((m = blockRegex.exec(normalizedHtml)) !== null) {
    matches.push({ full: m[0], tag: m[1], inner: m[2] });
  }

  if (matches.length === 0) {
    const rawText = normalizedHtml.replace(/<[^>]*>/g, ' ').trim();
    if (!rawText) return '<p></p>';
    const translated = await translateText(rawText, from, to);
    return `<p>${translated}</p>`;
  }

  const translatedBlocks: string[] = [];
  for (const block of matches) {
    const cleanInnerText = block.inner.replace(/<[^>]*>/g, '').trim();
    if (!cleanInnerText) {
      translatedBlocks.push(block.full);
      continue;
    }
    const translatedInner = await translateText(cleanInnerText, from, to);
    translatedBlocks.push(`<${block.tag}>${translatedInner || cleanInnerText}</${block.tag}>`);
  }

  return translatedBlocks.join('');
}

/**
 * Generate a clean URL-friendly slug from title
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Robust slug getter for news articles supporting string, localized object, or fallback title
 */
export function getArticleSlug(article: {
  slug?: string | { id?: string; en?: string };
  title?: { id?: string; en?: string };
  id?: string;
}): string {
  if (typeof article.slug === 'string' && article.slug.trim()) {
    return slugify(article.slug);
  }
  if (typeof article.slug === 'object' && article.slug) {
    const s = article.slug.en || article.slug.id;
    if (s?.trim()) return slugify(s);
  }
  const title = article.title?.en || article.title?.id || '';
  if (title.trim()) return slugify(title);
  return article.id || 'article';
}

/**
 * Strict server & client HTML sanitizer using sanitize-html
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtmlLib(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'b', 'i', 'strong', 'em', 'strike',
      'code', 'hr', 'br', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption',
      'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      span: ['class'],
      div: ['class'],
      th: ['colspan', 'rowspan', 'scope', 'class'],
      td: ['colspan', 'rowspan', 'class'],
      p: ['class'],
      blockquote: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

/**
 * Check if a string contains HTML tags
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Convert legacy plain text with blank lines (\n\n) into clean HTML paragraphs
 */
export function plainTextToHtml(text: string): string {
  if (!text || !text.trim()) return '<p></p>';
  if (isHtmlContent(text)) return text;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '<p></p>';

  return paragraphs
    .map((p) => {
      // Escape HTML entities to prevent XSS
      const safeText = p
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      return `<p>${safeText}</p>`;
    })
    .join('');
}

/**
 * HTML sanitizer using sanitize-html
 */
export function sanitizeHtml(html: string): string {
  return sanitizeArticleHtml(html);
}

/**
 * Calculate word count and estimated reading time
 */
export function calcReadingTime(htmlOrText: string): { words: number; minutes: number } {
  if (!htmlOrText) return { words: 0, minutes: 1 };
  // Strip HTML tags to count words
  const cleanText = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText ? cleanText.split(/\s+/).length : 0;
  // Average reading speed is ~200 words per minute
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, minutes };
}

/**
 * Format a human-readable date for Indonesia & English
 */
export function getTodayFormatted(): { id: string; en: string } {
  const now = new Date();
  const monthsId = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const monthsEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = String(now.getDate()).padStart(2, '0');
  const monthId = monthsId[now.getMonth()];
  const monthEn = monthsEn[now.getMonth()];
  const year = now.getFullYear();

  return {
    id: `${day} ${monthId} ${year}`,
    en: `${day} ${monthEn} ${year}`,
  };
}
