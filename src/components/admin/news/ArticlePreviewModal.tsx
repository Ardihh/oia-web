'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Smartphone,
  Monitor,
  Share2,
  ArrowLeft,
  Check,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { NewsArticle } from '@/context/ContentContext';
import { sanitizeHtml } from '@/lib/newsUtils';

interface ArticlePreviewModalProps {
  article: NewsArticle;
  onClose: () => void;
}

export function ArticlePreviewModal({ article, onClose }: ArticlePreviewModalProps) {
  const [previewLang, setPreviewLang] = useState<'id' | 'en'>('en');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Localized field extractors
  const getTitle = () => {
    if (!article.title) return 'Tanpa Judul';
    if (typeof article.title === 'object') {
      return article.title[previewLang] || article.title.en || article.title.id || 'Tanpa Judul';
    }
    return String(article.title);
  };

  const getSummary = () => {
    if (!article.summary) return '';
    if (typeof article.summary === 'object') {
      return article.summary[previewLang] || article.summary.en || article.summary.id || '';
    }
    return String(article.summary);
  };

  const getCategory = () => {
    if (!article.category) return 'Umum';
    if (typeof article.category === 'object') {
      return article.category[previewLang] || article.category.en || article.category.id || 'Umum';
    }
    return String(article.category);
  };

  const getDate = () => {
    if (!article.date) return '-';
    if (typeof article.date === 'object') {
      return article.date[previewLang] || article.date.en || article.date.id || '-';
    }
    return String(article.date);
  };

  const getContent = () => {
    if (!article.content) return '';
    if (typeof article.content === 'object') {
      return article.content[previewLang] || article.content.en || article.content.id || '';
    }
    return String(article.content);
  };

  const getCaption = () => {
    if (!article.imageCaption) return '';
    if (typeof article.imageCaption === 'object') {
      return article.imageCaption[previewLang] || article.imageCaption.en || article.imageCaption.id || '';
    }
    return String(article.imageCaption);
  };

  const title = getTitle();
  const summary = getSummary();
  const category = getCategory();
  const date = getDate();
  const content = getContent();
  const caption = getCaption();
  const author = article.author || (previewLang === 'en' ? 'IAO UNRAM Editorial Team' : 'Tim Redaksi KUI UNRAM');
  const image = article.image || '/images/news-1.jpg';

  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  const isEn = previewLang === 'en';

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Top Preview Controls Bar */}
      <div className="h-14 px-4 bg-unram-950 text-white border-b border-unram-800 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex-shrink-0">
            Pratinjau Halaman Pembaca
          </span>
          <span className="text-white/30 hidden sm:inline">&bull;</span>
          <span className="text-xs text-slate-300 font-medium truncate hidden sm:inline max-w-sm">
            {title}
          </span>
        </div>

        {/* Center Controls: Language & Device Mode */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center p-0.5 bg-white/10 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-3 py-1 rounded-md transition-colors ${
                previewLang === 'en' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('id')}
              className={`px-3 py-1 rounded-md transition-colors ${
                previewLang === 'id' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Indonesia
            </button>
          </div>

          {/* Device Toggle */}
          <div className="flex items-center p-0.5 bg-white/10 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                deviceMode === 'desktop' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Tampilan Desktop / Layar Penuh"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                deviceMode === 'mobile' ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="Tampilan Layar Ponsel (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Ponsel (375px)</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Tutup Pratinjau (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preview Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 flex justify-center bg-slate-900/60">
        <div
          className={`bg-paper rounded-lg shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-hairline/60 ${
            deviceMode === 'mobile' ? 'w-[375px] my-2' : 'w-full max-w-4xl my-2'
          }`}
        >
          {/* Simulated Browser Bar */}
          <div className="px-4 py-2.5 bg-slate-100 border-b border-hairline flex items-center gap-3 text-xs text-slate-500 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div className="flex-1 bg-white px-3 py-1 rounded border border-hairline text-[11px] font-mono text-slate-600 truncate flex items-center gap-2">
              <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">https://unram.ac.id/{previewLang}/news?id={article.id || 'preview'}</span>
            </div>
          </div>

          {/* Full Public Article Reader Canvas */}
          <div className="p-6 sm:p-10 lg:p-12 space-y-8 bg-paper flex-1">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between pb-6 border-b border-hairline">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-soft cursor-default">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isEn ? 'Back to Overview' : 'Kembali ke Beranda'}</span>
              </span>

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

            {/* Article Header (Headline & Meta) */}
            <div className="space-y-4">
              {/* Category & Date Eyebrow */}
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-unram-700">
                <span>{category}</span> &bull; <span>{date}</span>
              </p>

              {/* Main Headline (Newsreader Serif) */}
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-[40px] font-normal text-ink leading-[1.18] tracking-[-0.02em]">
                {title}
              </h1>

              {/* Author Byline */}
              <div className="flex items-center gap-3 pt-3 border-t border-hairline text-xs text-ink-soft">
                <span className="font-medium text-ink">{author}</span>
                <span>&bull;</span>
                <span>Universitas Mataram, Lombok</span>
              </div>
            </div>

            {/* Featured Cover Image */}
            <div className="space-y-2">
              <div className="relative aspect-[16/9] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes={deviceMode === 'mobile' ? '375px' : '800px'}
                  className="object-cover"
                />
              </div>

              {(caption || article.imageCredit) && (
                <p className="text-xs text-ink-soft font-normal tracking-wide flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span>{caption || title}</span>
                  {article.imageCredit && (
                    <span className="text-slate-400 text-[11px]">
                      Foto: {article.imageCredit}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Lead Summary */}
            {summary && (
              <p className="text-base sm:text-lg text-ink font-normal leading-[1.65] font-serif italic border-l-2 border-unram-600 pl-4 py-1 bg-unram-50/30 rounded-r">
                &ldquo;{summary}&rdquo;
              </p>
            )}

            {/* Body Content */}
            {isHtml ? (
              <div
                className="article-prose prose prose-slate max-w-none text-base sm:text-lg text-ink/90 leading-[1.75] font-normal font-sans"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
              />
            ) : (
              <div className="space-y-6 text-base sm:text-lg text-ink/90 leading-[1.75]">
                {content
                  ? content
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((p, idx) => <p key={idx}>{p}</p>)
                  : (
                    <p className="text-slate-400 italic">
                      {isEn ? 'No body content written yet.' : 'Belum ada isi berita yang ditulis.'}
                    </p>
                  )}
              </div>
            )}

            {/* Official Inquiries Callout Box (per news reader design) */}
            <div className="mt-10 p-5 sm:p-6 rounded-[4px] border border-hairline bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  {isEn ? 'Official Press & Academic Inquiries' : 'Pertanyaan Media & Informasi Akademik Resmi'}
                </h4>
                <p className="text-xs text-ink-soft mt-1">
                  {isEn
                    ? 'Contact International Affairs Office Universitas Mataram for official statements.'
                    : 'Hubungi Kantor Urusan Internasional Universitas Mataram untuk konfirmasi resmi.'}
                </p>
              </div>
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-[4px] bg-unram-900 text-white text-xs font-medium cursor-default flex-shrink-0">
                {isEn ? 'Contact IAO Team' : 'Hubungi Tim KUI'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
