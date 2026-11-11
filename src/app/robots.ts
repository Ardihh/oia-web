import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-static';

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
