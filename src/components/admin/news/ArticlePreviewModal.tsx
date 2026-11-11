'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Smartphone,
  Monitor,
  Share2,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { NewsArticle } from '@/context/ContentContext';
import { sanitizeHtml } from '@/lib/newsUtils';

interface ArticlePreviewModalProps {
  article: NewsArticle;
  onClose: () => void;
}

export function ArticlePreviewModal({ article, onClose }: ArticlePreviewModalProps) {
  const [previewLang, setPreviewLang] = useState<'id' | 'en'>('id');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  // Localized field extractors
  const getTitle = () => {
    if (!article.title) return 'Tanpa Judul';
    if (typeof article.title === 'object') {
      return article.title[previewLang] || article.title.id || article.title.en || 'Tanpa Judul';
    }
    return String(article.title);
  };

  const getSummary = () => {
    if (!article.summary) return '';
    if (typeof article.summary === 'object') {
      return article.summary[previewLang] || article.summary.id || article.summary.en || '';
    }
    return String(article.summary);
  };

  const getCategory = () => {
    if (!article.category) return 'Umum';
    if (typeof article.category === 'object') {
      return article.category[previewLang] || article.category.id || article.category.en || 'Umum';
    }
    return String(article.category);
  };

  const getDate = () => {
    if (!article.date) return '-';
    if (typeof article.date === 'object') {
      return article.date[previewLang] || article.date.id || article.date.en || '-';
    }
    return String(article.date);
  };

  const getContent = () => {
    if (!article.content) return '';
    if (typeof article.content === 'object') {
      return article.content[previewLang] || article.content.id || article.content.en || '';
    }
    return String(article.content);
  };

  const getCaption = () => {
    if (!article.imageCaption) return '';
    if (typeof article.imageCaption === 'object') {
      return article.imageCaption[previewLang] || article.imageCaption.id || article.imageCaption.en || '';
    }
    return String(article.imageCaption);
  };

  const title = getTitle();
  const summary = getSummary();
  const category = getCategory();
  const date = getDate();
  const content = getContent();
  const caption = getCaption();
  const author = article.author || 'Tim Redaksi KUI UNRAM';
  const image = article.image || '/images/news-1.jpg';

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Top Preview Controls Bar */}
      <div className="h-14 px-4 bg-unram-950 text-white border-b border-unram-800 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Pratinjau Artikel Publik
          </span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-xs hidden sm:inline">
            {title}
          </span>
        </div>

        {/* Center Controls: Language & Device Mode */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center p-0.5 bg-white/10 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreviewLang('id')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                previewLang === 'id' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              Indonesia
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                previewLang === 'en' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Device Toggle */}
          <div className="flex items-center p-0.5 bg-white/10 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'desktop' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Tampilan Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'mobile' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Tampilan Ponsel (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-800/40">
        <div
          className={`bg-paper rounded-xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            deviceMode === 'mobile' ? 'w-[375px] my-4' : 'w-full max-w-4xl my-2'
          }`}
        >
          {/* Section 1: Homepage Card Appearance */}
          <div className="p-6 sm:p-8 border-b border-hairline bg-unram-50/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">
              1. Tampilan Kartu di Beranda (Homepage News Grid):
            </span>

            <div className="max-w-sm mx-auto bg-surface p-4 rounded-[4px] border border-hairline group">
              <div className="relative aspect-[3/2] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100 mb-4">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="384px"
                  className="object-cover"
                />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-2">
                <span>{date}</span> &bull; <span>{category}</span>
              </p>

              <h4 className="font-serif text-lg font-normal text-ink leading-snug line-clamp-2">
                {title}
              </h4>

              <p className="text-sm text-ink-soft leading-[1.65] mt-2 line-clamp-3">
                {summary}
              </p>

              <div className="pt-3 mt-4 border-t border-hairline">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-unram-600">
                  <span>{previewLang === 'en' ? 'Read article' : 'Baca selengkapnya'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Full Article Page Appearance */}
          <div className="p-6 sm:p-12 space-y-8 bg-paper flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pb-2 border-b border-hairline">
              2. Tampilan Halaman Artikel Lengkap:
            </span>

            {/* Meta Eyebrow */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft mb-3">
                <span>{category}</span> &bull; <span>{date}</span>
              </p>

              {/* Main Headline */}
              <h1 className="font-serif text-2xl sm:text-4xl font-normal text-ink leading-[1.18] tracking-[-0.02em] mb-6">
                {title}
              </h1>

              {/* Author Byline */}
              <div className="flex items-center gap-3 pt-4 border-t border-hairline text-xs text-ink-soft">
                <span className="font-medium text-ink">{author}</span>
                <span>&bull;</span>
                <span>Universitas Mataram, Lombok</span>
              </div>
            </div>

            {/* Cover Image with Caption & Credit */}
            <div className="space-y-2">
              <div className="relative aspect-[16/9] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="800px"
                  className="object-cover"
                />
              </div>

              {(caption || article.imageCredit) && (
                <p className="text-xs text-ink-soft font-normal tracking-wide flex items-center justify-between gap-4">
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
              <p className="text-base sm:text-lg text-ink font-normal leading-[1.65] font-serif italic border-l-2 border-unram-600 pl-4 py-1">
                &ldquo;{summary}&rdquo;
              </p>
            )}

            {/* Body Content */}
            {isHtml ? (
              <div
                className="prose prose-slate max-w-none text-base sm:text-lg text-ink/90 leading-[1.75] font-normal"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
              />
            ) : (
              <div className="space-y-6 text-base sm:text-lg text-ink/90 leading-[1.75]">
                {content
                  .split(/\n\s*\n/)
                  .filter(Boolean)
                  .map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
