'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Eye,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NewsArticle } from '@/context/ContentContext';

interface ArticleListViewProps {
  articles: NewsArticle[];
  categories: { id: string; en: string }[];
  activeLang: 'id' | 'en';
  onNewArticle: () => void;
  onEditArticle: (article: NewsArticle) => void;
  onPreviewArticle: (article: NewsArticle) => void;
  onDeleteArticle: (id: string) => void;
}

export function ArticleListView({
  articles,
  categories,
  activeLang,
  onNewArticle,
  onEditArticle,
  onPreviewArticle,
  onDeleteArticle,
}: ArticleListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);

  // Filter & Search Logic
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      // 1. Status Filter
      const itemStatus = item.status || 'published';
      if (statusFilter !== 'all' && itemStatus !== statusFilter) {
        return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        const catName = typeof item.category === 'object' ? item.category.id : item.category;
        if (catName !== categoryFilter) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleId = (item.title?.id || '').toLowerCase();
        const titleEn = (item.title?.en || '').toLowerCase();
        const summaryId = (item.summary?.id || '').toLowerCase();
        const summaryEn = (item.summary?.en || '').toLowerCase();
        const author = (item.author || '').toLowerCase();

        return (
          titleId.includes(q) ||
          titleEn.includes(q) ||
          summaryId.includes(q) ||
          summaryEn.includes(q) ||
          author.includes(q)
        );
      }

      return true;
    });
  }, [articles, statusFilter, categoryFilter, searchQuery]);

  // Helper to extract localized text
  const getTitle = (item: NewsArticle) => {
    if (!item.title) return 'Tanpa Judul';
    if (typeof item.title === 'object') {
      return item.title[activeLang] || item.title.id || item.title.en || 'Tanpa Judul';
    }
    return String(item.title);
  };

  const getCategory = (item: NewsArticle) => {
    if (!item.category) return 'Umum';
    if (typeof item.category === 'object') {
      return item.category[activeLang] || item.category.id || item.category.en || 'Umum';
    }
    return String(item.category);
  };

  const getDate = (item: NewsArticle) => {
    if (!item.date) return '-';
    if (typeof item.date === 'object') {
      return item.date[activeLang] || item.date.id || item.date.en || '-';
    }
    return String(item.date);
  };

  const hasIdContent = (item: NewsArticle) => {
    return Boolean(item.title?.id?.trim() && item.summary?.id?.trim());
  };

  const hasEnContent = (item: NewsArticle) => {
    return Boolean(item.title?.en?.trim() && item.summary?.en?.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            Berita & Kegiatan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola publikasi siaran pers, artikel kegiatan, dan berita internasional UNRAM.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewArticle}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Berita</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul, ringkasan, atau penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unram-900/20 focus:border-unram-900 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({articles.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'published'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terbit
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'draft'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Draft
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-unram-900/20"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c[activeLang] || c.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Article List Cards */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-800">
              Tidak Ada Berita Ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Tidak ada artikel yang cocok dengan filter atau kata kunci pencarian Anda.'
                : 'Belum ada berita yang ditulis. Mulai publikasikan siaran pers atau kegiatan internasional pertama Anda.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewArticle}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-unram-900 text-white text-xs font-bold hover:bg-unram-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tulis Berita Baru</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((item) => {
            const isDraft = item.status === 'draft';
            const isIdOk = hasIdContent(item);
            const isEnOk = hasEnContent(item);

            return (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                {/* Left Section: Thumbnail & Metadata */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <Image
                      src={item.image || '/images/news-1.jpg'}
                      alt={getTitle(item)}
                      fill
                      sizes="112px"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {/* Status Badge */}
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Terbit</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {getCategory(item)}
                      </span>

                      {/* Date */}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {getDate(item)}
                      </span>
                    </div>

                    {/* Article Title */}
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 group-hover:text-unram-900 line-clamp-1 transition-colors">
                      {getTitle(item)}
                    </h3>

                    {/* Language Completeness Indicator */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEnOk ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                        />
                        <span className={isEnOk ? 'font-semibold text-slate-700' : 'text-amber-700'}>
                          EN (Utama) {isEnOk ? '✓' : '-'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1 text-slate-500">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isIdOk ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className={isIdOk ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                          ID (Otomatis) {isIdOk ? '✓' : 'akan dibuat'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => onPreviewArticle(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    title="Pratinjau tampilan publik"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pratinjau</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditArticle(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold transition-colors shadow-xs"
                    title="Edit konten artikel"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArticleToDelete(item)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                    title="Hapus artikel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Hapus Artikel Berita?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Anda akan menghapus artikel{' '}
                <strong className="text-slate-800">&ldquo;{getTitle(articleToDelete)}&rdquo;</strong>.
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteArticle(articleToDelete.id);
                  setArticleToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                Ya, Hapus Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
