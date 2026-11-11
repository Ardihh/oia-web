'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Calendar, Tag, User, Globe, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ShareButton } from '@/components/ui/ShareButton';
import { useSiteContent, NewsArticle } from '@/context/ContentContext';
import { getArticleSlug, sanitizeArticleHtml, isHtmlContent } from '@/lib/newsUtils';

interface ArticleDetailViewProps {
  initialArticle: NewsArticle;
  initialOtherArticles: NewsArticle[];
  slug: string;
  locale: string;
}

export function ArticleDetailView({
  initialArticle,
  initialOtherArticles,
  slug,
  locale,
}: ArticleDetailViewProps) {
  const { content } = useSiteContent();
  const isEn = locale === 'en';
  const lang = isEn ? 'en' : 'id';

  // Reactively use articles from context (syncs with CMS draft when admin, or published row)
  const articles: NewsArticle[] =
    Array.isArray(content?.news) && content.news.length > 0
      ? content.news
      : [initialArticle, ...initialOtherArticles];

  // Check if article still exists in live/draft content
  const activeArticle = articles.find(
    (a) => getArticleSlug(a) === slug || a.id === initialArticle.id
  );

  // If deleted or unpublished in CMS
  if (!activeArticle || activeArticle.status === 'draft') {
    return (
      <div className="py-20 lg:py-28 bg-paper min-h-[60vh] flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center space-y-4 p-8 rounded-[4px] border border-hairline bg-surface">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="font-serif text-2xl font-normal text-ink">
              {isEn ? 'Article Unavailable' : 'Artikel Tidak Tersedia'}
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              {isEn
                ? 'This article has been deleted or is no longer available in the public pressroom.'
                : 'Artikel ini telah dihapus atau sudah tidak tersedia dalam arsip berita publik.'}
            </p>
            <div className="pt-2">
              <Link
                href={`/${locale}/news/`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isEn ? 'Back to All News' : 'Kembali ke Semua Berita'}</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const title =
    (isEn
      ? activeArticle.title?.en || activeArticle.title?.id
      : activeArticle.title?.id || activeArticle.title?.en) || '';
  const summary =
    (isEn
      ? activeArticle.summary?.en || activeArticle.summary?.id
      : activeArticle.summary?.id || activeArticle.summary?.en) || '';
  const category =
    (isEn
      ? activeArticle.category?.en || activeArticle.category?.id
      : activeArticle.category?.id || activeArticle.category?.en) || '';
  const date =
    (isEn
      ? activeArticle.date?.en || activeArticle.date?.id
      : activeArticle.date?.id || activeArticle.date?.en) || '';
  const rawContent =
    (isEn
      ? activeArticle.content?.en || activeArticle.content?.id
      : activeArticle.content?.id || activeArticle.content?.en) || '';
  const author =
    activeArticle.author ||
    (isEn ? 'OIA UNRAM Editorial Team' : 'Tim Redaksi KUI UNRAM');

  const hasActiveLangTitle =
    typeof activeArticle.title === 'object' &&
    Boolean(activeArticle.title?.[lang]?.trim());
  const hasActiveLangContent =
    typeof activeArticle.content === 'object' &&
    Boolean(activeArticle.content?.[lang]?.trim()) &&
    activeArticle.content?.[lang] !== '<p></p>';
  const isLanguageMissing = !hasActiveLangTitle && !hasActiveLangContent;

  const isHtml = isHtmlContent(rawContent);
  const sanitizedBodyHtml = isHtml ? sanitizeArticleHtml(rawContent) : '';

  const fallbackParagraphs: string[] =
    !isHtml && rawContent.length > 50
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

  // DYNAMIC RECOMMENDATIONS:
  // Filters out the current article, drafts, and ANY deleted articles from the active context
  const dynamicOtherArticles = articles
    .filter(
      (a) =>
        getArticleSlug(a) !== slug &&
        a.id !== activeArticle.id &&
        a.status !== 'draft'
    )
    .slice(0, 3);

  return (
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

          <ShareButton title={title} locale={locale} />
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
              src={activeArticle.image || '/images/hero-campus.jpg'}
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

        {/* Dynamic Recommendations: More News & Announcements */}
        {dynamicOtherArticles.length > 0 && (
          <div className="max-w-[76ch] mx-auto mt-16 pt-12 border-t border-hairline">
            <h2 className="font-serif text-2xl font-normal text-ink mb-6">
              {isEn ? 'More News & Announcements' : 'Berita & Pengumuman Lainnya'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {dynamicOtherArticles.map((other) => {
                const otherSlug = getArticleSlug(other);
                const otherTitle = isEn
                  ? other.title?.en || other.title?.id
                  : other.title?.id || other.title?.en;
                const otherDate = isEn
                  ? other.date?.en || other.date?.id
                  : other.date?.id || other.date?.en;
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
  );
}
