import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/routing';
import { getServerSiteContent } from '@/lib/serverContent';
import { getSiteUrl } from '@/lib/siteUrl';
import { getArticleSlug } from '@/lib/newsUtils';
import { ArticleDetailView } from '@/components/news/ArticleDetailView';

export async function generateStaticParams() {
  const { content } = await getServerSiteContent();
  const articles = Array.isArray(content?.news) ? content.news : [];
  const published = articles.filter((a) => a.status !== 'draft');

  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const article of published) {
      const slug = getArticleSlug(article);
      if (slug) {
        params.push({ locale, slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl();
  const { content } = await getServerSiteContent();
  const articles = Array.isArray(content?.news) ? content.news : [];

  const article = articles.find((a) => getArticleSlug(a) === slug || a.id === slug);
  if (!article) {
    return {
      title: isEn ? 'Article Not Found' : 'Artikel Tidak Ditemukan',
    };
  }

  const title = (isEn ? article.title?.en || article.title?.id : article.title?.id || article.title?.en) || 'News';
  const description = (isEn ? article.summary?.en || article.summary?.id : article.summary?.id || article.summary?.en) || '';
  const canonicalUrl = `${siteUrl}/${locale}/news/${slug}/`;
  const imageUrl = article.image?.startsWith('http')
    ? article.image
    : `${siteUrl}${article.image?.startsWith('/') ? '' : '/'}${article.image || 'images/hero-campus.jpg'}`;

  const hasBothLanguages =
    Boolean(article.title?.en?.trim()) && Boolean(article.title?.id?.trim());

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      ...(hasBothLanguages
        ? {
            languages: {
              en: `${siteUrl}/en/news/${slug}/`,
              id: `${siteUrl}/id/news/${slug}/`,
              'x-default': `${siteUrl}/en/news/${slug}/`,
            },
          }
        : {}),
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      publishedTime: article.publishedAt,
      siteName: isEn ? 'OIA Universitas Mataram' : 'KUI Universitas Mataram',
      locale: isEn ? 'en_US' : 'id_ID',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl();

  const { content } = await getServerSiteContent();
  const articles = Array.isArray(content?.news) ? content.news : [];
  const article = articles.find((a) => getArticleSlug(a) === slug || a.id === slug);

  if (!article) {
    notFound();
  }

  const title = (isEn ? article.title?.en || article.title?.id : article.title?.id || article.title?.en) || '';
  const summary = (isEn ? article.summary?.en || article.summary?.id : article.summary?.id || article.summary?.en) || '';

  const imageUrl = article.image?.startsWith('http')
    ? article.image
    : `${siteUrl}${article.image?.startsWith('/') ? '' : '/'}${article.image || 'images/hero-campus.jpg'}`;

  // Safe JSON-LD for NewsArticle and Breadcrumbs (for search bots)
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: summary,
    image: [imageUrl],
    datePublished: article.publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Office of International Affairs Universitas Mataram',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Universitas Mataram',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: `${siteUrl}/${locale}/news/${slug}/`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEn ? 'Home' : 'Beranda',
        item: `${siteUrl}/${locale}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEn ? 'News & Announcements' : 'Berita & Pengumuman',
        item: `${siteUrl}/${locale}/news/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${siteUrl}/${locale}/news/${slug}/`,
      },
    ],
  };

  const jsonLdString = JSON.stringify([newsArticleJsonLd, breadcrumbJsonLd]).replace(/</g, '\\u003c');

  const otherArticles = articles
    .filter((a) => (getArticleSlug(a) !== slug && a.id !== article.id) && a.status !== 'draft')
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <ArticleDetailView
        initialArticle={article}
        initialOtherArticles={otherArticles}
        slug={slug}
        locale={locale}
      />
    </>
  );
}
