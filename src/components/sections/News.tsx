'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultNews, NewsArticle } from '@/context/ContentContext';

interface NewsProps {
  locale: string;
}

export function News({ locale }: NewsProps) {
  const t = useTranslations('news');
  const isEn = locale === 'en';
  const lang = isEn ? 'en' : 'id';
  const { content } = useSiteContent();

  const articles: NewsArticle[] = Array.isArray(content?.news) && content.news.length > 0
    ? content.news
    : defaultNews;

  return (
    <section id="news" className="py-20 lg:py-28 bg-unram-50 border-b border-hairline">
      <Container>
        {/* Section Heading with Numbered Eyebrow (DESIGN.md) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 lg:mb-16">
          <SectionHeading
            kicker={`06 — ${t('kicker')}`}
            title={t('title')}
            subtitle={t('subtitle')}
            className="mb-0"
          />

          {/* Link to All News Archive */}
          <a
            href={`/${locale}/news/`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-unram-600 hover:text-unram-800 underline-offset-4 hover:underline flex-shrink-0"
          >
            <span>{isEn ? 'View all news & releases' : 'Lihat semua arsip berita'}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Editorial News Grid (DESIGN.md Section 7) */}
        {(() => {
          const publishedArticles = articles.filter((a) => a.status !== 'draft');
          if (publishedArticles.length === 0) {
            return (
              <div className="text-center py-12 px-4 rounded-[4px] border border-hairline bg-surface max-w-xl mx-auto">
                <BookOpen className="w-8 h-8 text-ink-soft/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-ink-soft">
                  {isEn ? 'No news articles published yet.' : 'Belum ada berita yang diterbitkan.'}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {publishedArticles.map((item, index) => {
            const title =
              typeof item.title === 'object'
                ? item.title[lang] || item.title.id || item.title.en || ''
                : (item.title as string);
            const summary =
              typeof item.summary === 'object'
                ? item.summary[lang] || item.summary.id || item.summary.en || ''
                : (item.summary as string);
            const category =
              typeof item.category === 'object'
                ? item.category[lang] || item.category.id || item.category.en || ''
                : (item.category as string);
            const date =
              typeof item.date === 'object'
                ? item.date[lang] || item.date.id || item.date.en || ''
                : (item.date as string);
            const image = item.image || '/images/news-1.jpg';
            const articleHref = `/${locale}/news/?id=${encodeURIComponent(item.id)}`;

            return (
              <motion.article
                key={item.id || index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group flex flex-col justify-between"
              >
                <div>
                  {/* Image 3:2 with 4px radius and 1px hairline border (DESIGN.md) */}
                  <a href={articleHref} className="block relative aspect-[3/2] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100 mb-4 focus-visible:rounded">
                    <Image
                      src={image}
                      alt={title || 'News'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </a>

                  {/* Small Eyebrow Label: Date & Category */}
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-2">
                    <span>{date}</span> {category && <>&bull; <span>{category}</span></>}
                  </p>

                  {/* Title in Newsreader --text-h3 (DESIGN.md) */}
                  <h3 className="font-serif text-xl sm:text-[22px] font-normal text-ink leading-snug group-hover:text-unram-600 transition-colors">
                    <a href={articleHref}>
                      {title}
                    </a>
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-ink-soft leading-[1.65] mt-2.5 line-clamp-3">
                    {summary}
                  </p>
                </div>

                {/* Text Link: --blue-600, arrow glyph shifts 2px on hover (DESIGN.md Section 6) */}
                <div className="pt-4">
                  <a
                    href={articleHref}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-unram-600 group-hover:text-unram-700 underline-offset-4 hover:underline transition-colors"
                  >
                    <span>{isEn ? 'Read article' : 'Baca selengkapnya'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      );
    })()}
  </Container>
</section>
  );
}
