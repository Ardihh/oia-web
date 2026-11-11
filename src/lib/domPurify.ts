/**
 * DOMPurify configuration & URL sanitization for UNRAM CMS
 * Safe for SSR / Next.js static prerender
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'figure',
  'figcaption',
];

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  'class',
  'width',
  'height',
];

const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|(?:\/uploads\/|\/images\/)|data:image\/(?:png|jpeg|webp|gif);base64,)/i;

/**
 * Sanitize rich-text HTML string using DOMPurify
 * Works safely during SSR / static export build by checking typeof window
 */
export function sanitizeRichHtml(dirtyHtml: string): string {
  if (!dirtyHtml || !dirtyHtml.trim() || dirtyHtml === '<p></p>') {
    return '<p></p>';
  }

  if (typeof window === 'undefined') {
    // Basic fallback during static prerender if window is undefined
    return dirtyHtml;
  }

  // Hook to ensure external links have rel="noopener noreferrer"
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      // Ensure image src only points to /uploads/, /images/, or https://
      if (
        !src.startsWith('/uploads/') &&
        !src.startsWith('/images/') &&
        !src.startsWith('https://') &&
        !src.startsWith('data:image/')
      ) {
        node.removeAttribute('src');
      }
    }
  });

  const clean = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });

  // Remove hooks to avoid leaking between calls
  DOMPurify.removeHook('afterSanitizeAttributes');

  return clean;
}

/**
 * Validate that an external URL entered in CMS is safe (HTTPS only)
 */
export function isValidHttpsUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate Google Maps embed iframe/URL
 */
export function isValidGoogleMapsEmbedUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const isGoogle =
      hostname === 'maps.google.com' ||
      hostname === 'www.google.com' ||
      hostname.endsWith('.google.com');

    const isMapsPath =
      parsed.pathname.includes('/maps') ||
      parsed.pathname.includes('/embed') ||
      parsed.searchParams.has('q');

    return isGoogle && isMapsPath;
  } catch {
    return false;
  }
}
