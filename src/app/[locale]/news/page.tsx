'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultNews, NewsArticle } from '@/context/ContentContext';
import { getArticleSlug } from '@/lib/newsUtils';
import { getSiteUrl } from '@/lib/siteUrl';

function NewsContent() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const lang = isEn ? 'en' : 'id';
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('id');
  const { content } = useSiteContent();

  const articles: NewsArticle[] = Array.isArray(content?.news) && content.news.length > 0
    ? content.news
    : defaultNews;

  // Client-side backward-compatibility redirect for legacy /news/?id=1 links
  useEffect(() => {
    if (articleId && typeof window !== 'undefined') {
      const found = articles.find((a) => a.id === articleId || getArticleSlug(a) === articleId);
      if (found) {
        const slug = getArticleSlug(found);
        router.replace(`/${locale}/news/${slug}/`);
      }
    }
  }, [articleId, articles, locale, router]);

  // Helper to extract localized string with fallback awareness
  const getField = (field: any) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return field[lang] || field.id || field.en || '';
    }
    return String(field);
  };

  const publishedArticles = articles.filter((a) => a.status !== 'draft');

  const siteUrl = getSiteUrl();
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
    ],
  };

  const jsonLdString = JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <div className="py-16 lg:py-24 bg-paper min-h-screen">
        <Container>
          <div className="mb-12">
            <Link
              href={`/${locale}/`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-unram-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Back to Home' : 'Kembali ke Beranda'}</span>
            </Link>

            <SectionHeading
              kicker={isEn ? '06 — News & Press Releases' : '06 — Portal Berita & Pengumuman'}
              title={isEn ? 'International Affairs Press & Activities' : 'Arsip Berita & Agenda Internasional UNRAM'}
              subtitle={
                isEn
                  ? 'Official news releases, delegation visits, cross-border research collaborations, and student mobility orientations.'
                  : 'Pemberitaan resmi, kunjungan delegasi dunia, kerja sama riset internasional, dan kegiatan mahasiswa asing di Universitas Mataram.'
              }
            />
          </div>

          {/* Full Grid of All News */}
          {publishedArticles.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-[4px] border border-hairline bg-surface max-w-xl mx-auto my-8">
              <BookOpen className="w-10 h-10 text-ink-soft/40 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-normal text-ink mb-1">
                {isEn ? 'No News Articles' : 'Belum Ada Berita'}
              </h3>
              <p className="text-sm text-ink-soft">
                {isEn
                  ? 'There are currently no news articles published.'
                  : 'Saat ini belum ada artikel berita yang diterbitkan.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {publishedArticles.map((item, index) => {
                const title = getField(item.title);
                const summary = getField(item.summary);
                const category = getField(item.category);
                const date = getField(item.date);
                const slug = getArticleSlug(item);
                const href = `/${locale}/news/${slug}/`;

                return (
                  <article key={item.id || index} className="group flex flex-col justify-between">
                    <div>
                      <Link
                        href={href}
                        className="block relative aspect-[3/2] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100 mb-4"
                      >
                        <Image
                          src={item.image || '/images/hero-campus.jpg'}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </Link>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-2">
                        <span>{date}</span> {category && <>&bull; <span>{category}</span></>}
                      </p>
                      <h3 className="font-serif text-xl font-normal text-ink leading-snug group-hover:text-unram-600 transition-colors">
                        <Link href={href}>{title}</Link>
                      </h3>
                      <p className="text-sm text-ink-soft leading-[1.65] mt-2 line-clamp-3">
                        {summary}
                      </p>
                    </div>
                    <div className="pt-4">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-unram-600 group-hover:text-unram-700 underline-offset-4 hover:underline transition-colors"
                      >
                        <span>{isEn ? 'Read article' : 'Baca selengkapnya'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </div>
    </>
  );
}

export default function NewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-unram-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewsContent />
    </Suspense>
  );
}
