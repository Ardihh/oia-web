'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Calendar, Tag, User, Share2, Check, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultNews, NewsArticle } from '@/context/ContentContext';

function NewsContent() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const lang = isEn ? 'en' : 'id';
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');
  const { content } = useSiteContent();

  const [copied, setCopied] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>(
    Array.isArray(content?.news) && content.news.length > 0 ? content.news : defaultNews
  );

  useEffect(() => {
    if (Array.isArray(content?.news) && content.news.length > 0) {
      setArticles(content.news);
      return;
    }
    try {
      const custom = localStorage.getItem('unram_custom_news');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
          return;
        }
      }
    } catch {}
    setArticles(defaultNews);
  }, [content?.news]);

  // Find active article if query parameter `id` is given
  const currentArticle = articleId
    ? articles.find((a) => a.id === articleId) || articles[0]
    : null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper to extract localized string
  const getField = (field: any) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return field[lang] || field.id || field.en || '';
    }
    return String(field);
  };

  // 1. DETAIL ARTICLE VIEW
  if (currentArticle) {
    const title = getField(currentArticle.title);
    const summary = getField(currentArticle.summary);
    const category = getField(currentArticle.category);
    const date = getField(currentArticle.date);
    const rawContent = getField(currentArticle.content);
    const author = currentArticle.author || (isEn ? 'IAO UNRAM Editorial Team' : 'Tim Redaksi KUI UNRAM');
    const otherArticles = articles.filter((a) => a.id !== currentArticle.id).slice(0, 3);

    // Generate realistic multi-paragraph body text if content is short
    const bodyParagraphs: string[] = rawContent && rawContent.length > 100
      ? rawContent.split('\n\n')
      : [
          summary,
          isEn
            ? `The International Affairs Office (IAO) of Universitas Mataram continues to demonstrate sustained dedication to elevating higher education internationalization across the Nusa Tenggara archipelago. Through proactive academic facilitation, student welfare support, and strategic global consortia, UNRAM fosters an ecosystem where Indonesian scholars thrive globally while welcoming international fellows to Lombok.`
            : `Kantor Urusan Internasional (KUI) Universitas Mataram terus memperkuat komitmennya dalam memperluas jangkauan kerja sama global dan memberikan pendampingan komprehensif bagi civitas akademika. Melalui penyelenggaraan agenda ini, mahasiswa dan tenaga pengajar UNRAM didorong untuk secara aktif mengambil peran dalam program internasionalisasi di berbagai belahan dunia.`,
          isEn
            ? `Prospective candidates and university stakeholders interested in participating in upcoming bilateral academic initiatives or requesting institutional endorsement letters are encouraged to consult directly with IAO officers at the UNRAM Rectorate Building or via our official inquiry channels.`
            : `Bagi mahasiswa, dosen, maupun mitra institusi internasional yang membutuhkan informasi lebih lanjut mengenai pelaksanaan program, permohonan surat rekomendasi resmi, atau konsultasi kerja sama, dipersilakan menghubungi narahubung KUI UNRAM di Gedung Rektorat Lantai 1 atau melalui email resmi io@unram.ac.id.`,
        ];

    return (
      <div className="py-12 lg:py-20 bg-paper">
        <Container>
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex items-center justify-between pb-8 mb-8 border-b border-hairline">
            <a
              href={`/${locale}/#news`}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-unram-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Back to Overview' : 'Kembali ke Beranda'}</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-hairline bg-surface text-xs font-medium text-ink-soft hover:text-ink transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{isEn ? 'Link Copied!' : 'Tautan Disalin!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Share Article' : 'Bagikan Berita'}</span>
                </>
              )}
            </button>
          </div>

          {/* Article Header */}
          <div className="max-w-3xl">
            {/* Meta Eyebrow */}
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-3">
              <span>{category}</span> &bull; <span>{date}</span>
            </p>

            {/* Main Headline (Newsreader) */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal text-ink leading-[1.15] tracking-[-0.02em] mb-6">
              {title}
            </h1>

            {/* Author Byline */}
            <div className="flex items-center gap-3 pt-4 border-t border-hairline text-xs text-ink-soft">
              <span className="font-medium text-ink">{author}</span>
              <span>&bull;</span>
              <span>Universitas Mataram, Lombok</span>
            </div>
          </div>

          {/* Featured Image (3:2 or 16:9 straight crop, 4px radius, hairline border per DESIGN.md) */}
          <div className="my-10 max-w-4xl">
            <div className="relative aspect-[16/9] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
              <Image
                src={currentArticle.image || '/images/news-1.jpg'}
                alt={title}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-ink-soft mt-2.5 font-normal tracking-wide">
              {title} &mdash; Dokumentasi Kegiatan Kantor Urusan Internasional UNRAM.
            </p>
          </div>

          {/* Article Narrative Body */}
          <div className="max-w-3xl space-y-6 text-base sm:text-lg text-ink/90 leading-[1.75] font-normal">
            {/* Lead Summary Paragraph */}
            <p className="text-lg sm:text-xl text-ink font-normal leading-[1.65] pb-2 font-serif italic border-l-2 border-unram-600 pl-5">
              &ldquo;{summary}&rdquo;
            </p>

            {bodyParagraphs.map((para: string, idx: number) => (
              <p key={idx}>{para}</p>
            ))}

            {/* Callout Box */}
            <div className="my-8 p-6 rounded-[4px] bg-unram-50 border border-hairline space-y-2">
              <h4 className="font-serif text-lg font-normal text-ink">
                {isEn ? 'Information & Official Inquiries' : 'Layanan Informasi & Narahubung'}
              </h4>
              <p className="text-sm text-ink-soft leading-relaxed">
                {isEn
                  ? 'For further inquiries regarding this press release, academic exchange eligibility, or international partnership MoUs, contact the UNRAM International Affairs Office via email at io@unram.ac.id.'
                  : 'Untuk konfirmasi berita, permohonan liputan, maupun pengajuan kerja sama dan beasiswa mobilitas, silakan menghubungi Sekretariat KUI UNRAM melalui surel resmi di io@unram.ac.id.'}
              </p>
            </div>
          </div>

          {/* Other Articles Section */}
          {otherArticles.length > 0 && (
            <div className="mt-16 pt-12 border-t border-hairline">
              <h3 className="font-serif text-2xl font-normal text-ink mb-8">
                {isEn ? 'Other News & Announcements' : 'Berita & Informasi Terkait Lainnya'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {otherArticles.map((item) => (
                  <a
                    key={item.id}
                    href={`/${locale}/news/?id=${encodeURIComponent(item.id)}`}
                    className="group block space-y-3"
                  >
                    <div className="relative aspect-[3/2] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
                      <Image
                        src={item.image || '/images/news-1.jpg'}
                        alt={getField(item.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
                      {getField(item.date)}
                    </p>
                    <h4 className="font-serif text-lg font-normal text-ink group-hover:text-unram-600 transition-colors leading-snug">
                      {getField(item.title)}
                    </h4>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    );
  }

  // 2. ALL NEWS ARCHIVE VIEW (When no specific article ID is selected)
  return (
    <div className="py-16 lg:py-24 bg-paper min-h-screen">
      <Container>
        <div className="mb-12">
          <a
            href={`/${locale}/`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-unram-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEn ? 'Back to Home' : 'Kembali ke Beranda'}</span>
          </a>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {articles.map((item, index) => {
            const title = getField(item.title);
            const summary = getField(item.summary);
            const category = getField(item.category);
            const date = getField(item.date);
            const href = `/${locale}/news/?id=${encodeURIComponent(item.id)}`;

            return (
              <article key={item.id || index} className="group flex flex-col justify-between">
                <div>
                  <a href={href} className="block relative aspect-[3/2] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100 mb-4">
                    <Image
                      src={item.image || '/images/news-1.jpg'}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </a>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-2">
                    <span>{date}</span> {category && <>&bull; <span>{category}</span></>}
                  </p>
                  <h3 className="font-serif text-xl font-normal text-ink leading-snug group-hover:text-unram-600 transition-colors">
                    <a href={href}>{title}</a>
                  </h3>
                  <p className="text-sm text-ink-soft leading-[1.65] mt-2 line-clamp-3">
                    {summary}
                  </p>
                </div>
                <div className="pt-4">
                  <a
                    href={href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-unram-600 group-hover:text-unram-700 underline-offset-4 hover:underline transition-colors"
                  >
                    <span>{isEn ? 'Read article' : 'Baca selengkapnya'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </div>
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
