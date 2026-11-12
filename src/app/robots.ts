import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export const revalidate = 86400; // Cache robots.txt for 24 hours

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/en/admin/', '/id/admin/', '/content/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
