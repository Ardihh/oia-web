'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Calendar, Tag } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultNews } from '@/context/ContentContext';
import { SECTIONS, sectionHref } from '@/lib/routes';
import { getArticleSlug } from '@/lib/newsUtils';

interface HomeOverviewProps {
  locale: string;
}

export function HomeOverview({ locale }: HomeOverviewProps) {
  const { content } = useSiteContent();
  const isEn = locale === 'en';
  const lang = isEn ? 'en' : 'id';

  const articles = Array.isArray(content?.news) && content.news.length > 0
    ? content.news
    : defaultNews;

  const latestNews = articles
    .filter((a) => a.status !== 'draft')
    .slice(0, 3);

  return (
    <>
      {/* 1. Explore Sections Overview (DESIGN.md hairline rows) */}
      <section className="py-20 lg:py-28 bg-paper border-b border-hairline">
        <Container>
          <SectionHeading
            kicker={isEn ? '02 — EXPLORE' : '02 — JELAJAHI'}
            title={
              isEn
                ? 'Academic Mobility, Global Consortia & Direct Concierge'
                : 'Mobilitas Akademik, Kemitraan Global & Layanan Terpadu'
            }
            subtitle={
              isEn
                ? 'Navigate through the dedicated branches of Universitas Mataram Office of International Affairs.'
                : 'Akses cepat seluruh layanan, program, data capaian, dan regulasi resmi KUI Universitas Mataram.'
            }
            className="mb-14 lg:mb-16"
          />

          {/* Hairline Row List */}
          <div className="border-y border-hairline divide-y divide-hairline">
            {SECTIONS.map((sec) => {
              const href = sectionHref(locale, sec.key);
              const title = sec.title[lang];
              const desc = sec.description[lang];

              return (
                <Link
                  key={sec.key}
                  href={href}
                  className="group flex flex-col md:flex-row md:items-center justify-between py-6 lg:py-7 px-4 -mx-4 hover:bg-unram-50/60 transition-colors rounded-[4px]"
                >
                  <div className="flex items-start md:items-baseline gap-4 sm:gap-8 flex-1">
                    <span className="font-serif text-unram-600 text-lg sm:text-xl font-normal tabular-nums w-8 flex-shrink-0 pt-0.5 md:pt-0">
                      {sec.kickerNumber}
                    </span>
                    <div className="flex-1 space-y-1 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 md:items-baseline">
                      <h3 className="md:col-span-4 font-serif text-lg sm:text-xl font-normal text-ink group-hover:text-unram-600 transition-colors leading-snug">
                        {title}
                      </h3>
                      <p className="md:col-span-8 text-xs sm:text-sm text-ink-soft leading-[1.6]">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 flex items-center gap-1 text-unram-600 font-semibold text-xs uppercase tracking-wider pl-12 md:pl-6 flex-shrink-0">
                    <span className="hidden sm:inline group-hover:underline underline-offset-4">
                      {isEn ? 'Open' : 'Buka'}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 2. Latest News Section */}
      <section className="py-20 lg:py-28 bg-surface border-b border-hairline">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
            <SectionHeading
              kicker={isEn ? '06 — NEWSROOM' : '06 — KABAR TERKINI'}
              title={
                isEn
                  ? 'Latest Official Announcements & Global Activities'
                  : 'Berita & Agenda Internasional Terkini'
              }
              subtitle={
                isEn
                  ? 'Key announcements on student exchange, visiting foreign delegates, and scholarship opportunities.'
                  : 'Kabar penting mengenai mobilitas mahasiswa, delegasi luar negeri, dan peluang beasiswa global.'
              }
            />

            <Link
              href={`/${locale}/news/`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-unram-600 hover:text-unram-700 transition-colors pb-1 flex-shrink-0"
            >
              <span>{isEn ? 'View all news' : 'Lihat semua berita'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestNews.map((item, idx) => {
              const slug = getArticleSlug(item);
              const href = `/${locale}/news/${slug}/`;
              const title = isEn ? item.title?.en || item.title?.id : item.title?.id || item.title?.en;
              const summary = isEn ? item.summary?.en || item.summary?.id : item.summary?.id || item.summary?.en;
              const date = isEn ? item.date?.en || item.date?.id : item.date?.id || item.date?.en;
              const category = isEn ? item.category?.en || item.category?.id : item.category?.id || item.category?.en;

              return (
                <article
                  key={item.id || idx}
                  className="group flex flex-col justify-between bg-paper p-5 sm:p-6 rounded-[4px] border border-hairline hover:border-unram-400 transition-colors"
                >
                  <div className="space-y-3">
                    <Link
                      href={href}
                      className="block relative aspect-[16/10] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100"
                    >
                      <Image
                        src={item.image || '/images/hero-campus.jpg'}
                        alt={title || 'News image'}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-ink-soft pt-1">
                      <span className="font-mono">{date}</span>
                      {category && (
                        <>
                          <span>&bull;</span>
                          <span className="text-unram-600 font-medium uppercase tracking-wider text-[11px]">
                            {category}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="font-serif text-lg font-normal text-ink group-hover:text-unram-600 transition-colors leading-snug">
                      <Link href={href}>{title}</Link>
                    </h4>

                    <p className="text-xs sm:text-sm text-ink-soft leading-[1.6] line-clamp-3">
                      {summary}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-hairline">
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-unram-600 group-hover:text-unram-700 transition-colors uppercase tracking-wider"
                    >
                      <span>{isEn ? 'Read article' : 'Baca artikel'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
