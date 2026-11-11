import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { locales } from '@/i18n/routing';
import { getServerSiteContent } from '@/lib/serverContent';
import { getSiteUrl } from '@/lib/siteUrl';
import { getArticleSlug, sanitizeArticleHtml, isHtmlContent } from '@/lib/newsUtils';
import { Container } from '@/components/ui/Container';
import { ArrowLeft, Calendar, Tag, User, Globe } from 'lucide-react';
import { ShareButton } from '@/components/ui/ShareButton';

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
  const lang = isEn ? 'en' : 'id';
  const oppositeLang = isEn ? 'id' : 'en';
  const siteUrl = getSiteUrl();

  const { content } = await getServerSiteContent();
  const articles = Array.isArray(content?.news) ? content.news : [];
  const article = articles.find((a) => getArticleSlug(a) === slug || a.id === slug);

  if (!article) {
    notFound();
  }

  const title = (isEn ? article.title?.en || article.title?.id : article.title?.id || article.title?.en) || '';
  const summary = (isEn ? article.summary?.en || article.summary?.id : article.summary?.id || article.summary?.en) || '';
  const category = (isEn ? article.category?.en || article.category?.id : article.category?.id || article.category?.en) || '';
  const date = (isEn ? article.date?.en || article.date?.id : article.date?.id || article.date?.en) || '';
  const rawContent = (isEn ? article.content?.en || article.content?.id : article.content?.id || article.content?.en) || '';
  const author = article.author || (isEn ? 'OIA UNRAM Editorial Team' : 'Tim Redaksi KUI UNRAM');

  const hasActiveLangTitle = typeof article.title === 'object' && Boolean(article.title?.[lang]?.trim());
  const hasActiveLangContent =
    typeof article.content === 'object' &&
    Boolean(article.content?.[lang]?.trim()) &&
    article.content?.[lang] !== '<p></p>';
  const isLanguageMissing = !hasActiveLangTitle && !hasActiveLangContent;

  const imageUrl = article.image?.startsWith('http')
    ? article.image
    : `${siteUrl}${article.image?.startsWith('/') ? '' : '/'}${article.image || 'images/hero-campus.jpg'}`;

  // Safe JSON-LD for NewsArticle and Breadcrumbs
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

  // Multi-paragraph or HTML sanitized body
  const isHtml = isHtmlContent(rawContent);
  const sanitizedBodyHtml = isHtml ? sanitizeArticleHtml(rawContent) : '';

  const fallbackParagraphs: string[] = !isHtml && rawContent.length > 50
    ? rawContent.split('\n\n')
    : [
        summary,
        isEn
          ? 'The Office of International Affairs (OIA) of Universitas Mataram continues to demonstrate sustained dedication to elevating higher education internationalization across the Nusa Tenggara archipelago.'
          : 'Kantor Urusan Internasional (KUI) Universitas Mataram terus memperkuat komitmennya dalam memperluas jangkauan kerja sama global dan memberikan pendampingan komprehensif bagi civitas akademika.',
        isEn
          ? 'Prospective candidates and university stakeholders interested in participating in upcoming bilateral academic initiatives or requesting institutional endorsement letters are encouraged to consult directly with OIA officers at the UNRAM Rectorate Building or via our official inquiry channels.'
          : 'Bagi mahasiswa, dosen, maupun mitra institusi internasional yang membutuhkan informasi lebih lanjut mengenai pelaksanaan program, permohonan surat rekomendasi resmi, atau konsultasi kerja sama, dipersilakan menghubungi narahubung KUI UNRAM di Gedung Rektorat Lantai 1 atau melalui email resmi io@unram.ac.id.',
      ];

  const otherArticles = articles
    .filter((a) => (getArticleSlug(a) !== slug && a.id !== article.id) && a.status !== 'draft')
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <div className="py-12 lg:py-20 bg-paper">
        <Container>
          {/* Breadcrumb Bar */}
          <div className="flex items-center justify-between pb-8 mb-8 border-b border-hairline">
            <Link
              href={`/${locale}/news/`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-unram-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'All News' : 'Semua Berita'}</span>
            </Link>

            <ShareButton
              title={title}
              locale={locale}
            />
          </div>

          <article className="max-w-[76ch] mx-auto">
            {/* Language Missing Disclaimer */}
            {isLanguageMissing && (
              <div className="mb-6 p-4 rounded-[4px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  {isEn ? (
                    <>
                      This article was originally published in <strong>Indonesian</strong> and has not yet been officially translated into English. Displaying Indonesian text below.
                    </>
                  ) : (
                    <>
                      Artikel ini awalnya diterbitkan dalam <strong>Bahasa Inggris</strong> dan belum diterjemahkan secara resmi ke Bahasa Indonesia. Menampilkan versi asli di bawah.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Category & Date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-unram-50 border border-hairline font-medium text-unram-600 uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                {category}
              </span>
              <span className="inline-flex items-center gap-1.5 font-normal">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
              <span className="inline-flex items-center gap-1.5 font-normal">
                <User className="w-3.5 h-3.5" />
                {author}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal text-ink leading-tight sm:leading-[1.18] mb-6">
              {title}
            </h1>

            {/* Summary Lead */}
            <p className="text-base sm:text-lg text-ink font-normal leading-[1.65] pb-8 mb-8 border-b border-hairline">
              {summary}
            </p>

            {/* Hero Image */}
            <div className="relative aspect-[16/9] w-full rounded-[4px] border border-hairline overflow-hidden mb-10 bg-unram-100">
              <Image
                src={article.image || '/images/hero-campus.jpg'}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 760px, 100vw"
              />
            </div>

            {/* Article Body */}
            {isHtml ? (
              <div
                className="prose prose-slate max-w-none text-ink font-normal leading-[1.75] text-[15px] sm:text-base space-y-5"
                dangerouslySetInnerHTML={{ __html: sanitizedBodyHtml }}
              />
            ) : (
              <div className="space-y-6 text-ink font-normal leading-[1.75] text-[15px] sm:text-base">
                {fallbackParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {/* Official Contact Note */}
            <div className="mt-12 p-6 rounded-[4px] bg-unram-50 border border-hairline text-xs text-ink-soft leading-relaxed">
              <p className="font-semibold text-ink uppercase tracking-wider mb-1">
                {isEn ? 'Official Press & Mobility Inquiries' : 'Layanan Pers & Konfirmasi Resmi KUI UNRAM'}
              </p>
              <p>
                {isEn
                  ? 'For further inquiries regarding this press release, academic exchange eligibility, or international partnership MoUs, contact the UNRAM Office of International Affairs via email at io@unram.ac.id.'
                  : 'Untuk konfirmasi berita, permohonan liputan, maupun pengajuan kerja sama dan beasiswa mobilitas, silakan menghubungi Sekretariat KUI UNRAM melalui surel resmi di io@unram.ac.id.'}
              </p>
            </div>
          </article>

          {/* Related Articles */}
          {otherArticles.length > 0 && (
            <div className="max-w-[76ch] mx-auto mt-16 pt-12 border-t border-hairline">
              <h2 className="font-serif text-2xl font-normal text-ink mb-6">
                {isEn ? 'More News & Announcements' : 'Berita & Pengumuman Lainnya'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {otherArticles.map((other) => {
                  const otherSlug = getArticleSlug(other);
                  const otherTitle = isEn ? other.title?.en || other.title?.id : other.title?.id || other.title?.en;
                  const otherDate = isEn ? other.date?.en || other.date?.id : other.date?.id || other.date?.en;
                  return (
                    <Link
                      key={other.id}
                      href={`/${locale}/news/${otherSlug}/`}
                      className="group block space-y-2"
                    >
                      <div className="relative aspect-[16/10] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
                        <Image
                          src={other.image || '/images/hero-campus.jpg'}
                          alt={otherTitle || 'Related news'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(min-width: 640px) 240px, 100vw"
                        />
                      </div>
                      <p className="text-[11px] text-ink-soft">{otherDate}</p>
                      <h3 className="font-serif text-sm font-normal text-ink group-hover:text-unram-600 transition-colors line-clamp-2 leading-snug">
                        {otherTitle}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
