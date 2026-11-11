/**
 * Utility functions for News Articles CMS & Public Site
 */

// Existing translation provider (MyMemory API) reused exactly as-is
export async function translateText(
  text: string,
  from: 'id' | 'en',
  to: 'id' | 'en'
): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${from}|${to}`
    );
    const data = await res.json();
    if (data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (e) {
    console.error('Translation error:', e);
  }
  return text;
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
 * Basic client-side HTML sanitizer to prevent malicious script injection
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Remove script tags, onload attributes, javascript: URLs
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');
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
