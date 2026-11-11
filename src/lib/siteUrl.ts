/**
 * Site URL helper ensuring a canonical base URL
 * Reads NEXT_PUBLIC_SITE_URL or falls back to production https://oia.unram.ac.id
 */

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!envUrl) {
    return 'https://oia.unram.ac.id';
  }

  let normalized = envUrl;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slashes and any trailing /en or /id locale paths
  normalized = normalized.replace(/\/+$/, '');
  normalized = normalized.replace(/\/(en|id)$/, '');
  normalized = normalized.replace(/\/+$/, '');

  return normalized || 'https://oia.unram.ac.id';
}

/**
 * Build an absolute canonical URL from a relative path
 */
export function getAbsoluteUrl(path = ''): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
