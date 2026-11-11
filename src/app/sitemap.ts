import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';
import { getServerSiteContent } from '@/lib/serverContent';
import { SECTIONS } from '@/lib/routes';
import { getArticleSlug } from '@/lib/newsUtils';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const { content } = await getServerSiteContent();
  const buildDate = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // 1. Home pages (/en/ and /id/)
  for (const locale of ['en', 'id'] as const) {
    entries.push({
      url: `${siteUrl}/${locale}/`,
      lastModified: buildDate,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${siteUrl}/en/`,
          id: `${siteUrl}/id/`,
          'x-default': `${siteUrl}/en/`,
        },
      },
    });
  }

  // 2. Section pages (/about/, /services/, /impact/, /partners/, /admission/, /faq/, /contact/, /news/)
  for (const section of SECTIONS) {
    for (const locale of ['en', 'id'] as const) {
      entries.push({
        url: `${siteUrl}/${locale}/${section.slug}/`,
        lastModified: buildDate,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: {
            en: `${siteUrl}/en/${section.slug}/`,
            id: `${siteUrl}/id/${section.slug}/`,
            'x-default': `${siteUrl}/en/${section.slug}/`,
          },
        },
      });
    }
  }

  // 3. News Articles (all published articles with real lastmod)
  const articles = Array.isArray(content?.news) ? content.news : [];
  const publishedArticles = articles.filter((a) => a.status !== 'draft');

  for (const article of publishedArticles) {
    const slug = getArticleSlug(article);
    if (!slug) continue;

    const articleLastMod = article.publishedAt
      ? new Date(article.publishedAt)
      : buildDate;

    for (const locale of ['en', 'id'] as const) {
      entries.push({
        url: `${siteUrl}/${locale}/news/${slug}/`,
        lastModified: articleLastMod,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: {
            en: `${siteUrl}/en/news/${slug}/`,
            id: `${siteUrl}/id/news/${slug}/`,
            'x-default': `${siteUrl}/en/news/${slug}/`,
          },
        },
      });
    }
  }

  return entries;
}
