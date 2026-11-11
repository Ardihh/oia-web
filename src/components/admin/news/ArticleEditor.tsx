'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  Eye,
  Save,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Wand2,
  Calendar,
  Tag,
  User,
  SlidersHorizontal,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { NewsArticle } from '@/context/ContentContext';
import { TiptapEditor } from './TiptapEditor';
import {
  translateText,
  translateHtml,
  slugify,
  calcReadingTime,
  getTodayFormatted,
  plainTextToHtml,
} from '@/lib/newsUtils';
import { uploadMedia } from '@/lib/supabase';

interface ArticleEditorProps {
  initialArticle?: NewsArticle | null;
  categories: { id: string; en: string }[];
  onBack: () => void;
  onSave: (article: NewsArticle, isPublish: boolean) => void;
  onPreview: (article: NewsArticle) => void;
}

export function ArticleEditor({
  initialArticle,
  categories,
  onBack,
  onSave,
  onPreview,
}: ArticleEditorProps) {
  // Current editing language tab (English is primary authoring language)
  const [editorLang, setEditorLang] = useState<'id' | 'en'>('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Article state
  const [article, setArticle] = useState<NewsArticle>(() => {
    if (initialArticle) {
      // Migrate legacy plain text into HTML paragraphs
      return {
        ...initialArticle,
        status: initialArticle.status || 'published',
        slug: initialArticle.slug || slugify(initialArticle.title?.id || initialArticle.title?.en || ''),
        content: {
          id: plainTextToHtml(initialArticle.content?.id || ''),
          en: plainTextToHtml(initialArticle.content?.en || ''),
        },
      };
    }

    const today = getTodayFormatted();
    return {
      id: Date.now().toString(),
      category: categories[0] || { id: 'Program Mobilitas', en: 'Mobility Program' },
      date: today,
      title: { id: '', en: '' },
      summary: { id: '', en: '' },
      content: { id: '<p></p>', en: '<p></p>' },
      image: '/images/news-1.jpg',
      author: 'Tim Redaksi KUI UNRAM',
      status: 'draft',
      slug: { id: '', en: '' },
      imageCaption: { id: '', en: '' },
      imageCredit: 'Dokumentasi KUI UNRAM',
    };
  });

  // Track modified / unsaved state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveTime, setAutosaveTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  // Modals & alerts
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [customToast, setCustomToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCustomToast({ message, type });
    setTimeout(() => setCustomToast(null), 3000);
  };

  // Debounced Autosave (2 seconds)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const articleRef = useRef(article);
  articleRef.current = article;

  const triggerAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setIsSaving(true);
      const curr = articleRef.current;
      onSave(curr, false);
      const now = new Date();
      setAutosaveTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setHasUnsavedChanges(false);
      setIsSaving(false);
    }, 2000);
  }, [onSave]);

  const updateArticle = (updater: Partial<NewsArticle>) => {
    setArticle((prev) => {
      const next = { ...prev, ...updater };
      return next;
    });
    setHasUnsavedChanges(true);
    triggerAutosave();
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowPublishConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article]);

  // Handle manual save
  const handleManualSave = async (isPublish: boolean) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setIsSaving(true);

    let updated = {
      ...article,
      status: isPublish ? ('published' as const) : ('draft' as const),
    };

    // Auto-generate Indonesian translation from English if missing or empty
    if (updated.title?.en?.trim()) {
      const needsId =
        !updated.title?.id?.trim() ||
        !updated.summary?.id?.trim() ||
        !updated.content?.id ||
        updated.content.id === '<p></p>';

      if (needsId) {
        try {
          const trTitle = updated.title?.id?.trim()
            ? updated.title.id
            : await translateText(updated.title.en, 'en', 'id');

          const trSummary = updated.summary?.id?.trim()
            ? updated.summary.id
            : (updated.summary?.en ? await translateText(updated.summary.en, 'en', 'id') : '');

          const trContent = (updated.content?.id && updated.content.id !== '<p></p>')
            ? updated.content.id
            : (updated.content?.en ? await translateHtml(updated.content.en, 'en', 'id') : '<p></p>');

          updated = {
            ...updated,
            title: {
              id: updated.title?.id?.trim() || trTitle || updated.title.en,
              en: updated.title.en,
            },
            summary: {
              id: updated.summary?.id?.trim() || trSummary || updated.summary?.en || '',
              en: updated.summary?.en || '',
            },
            content: {
              id: (updated.content?.id && updated.content.id !== '<p></p>')
                ? updated.content.id
                : (trContent || updated.content?.en || '<p></p>'),
              en: updated.content?.en || '<p></p>',
            },
          };
        } catch {
          // Graceful fallback to English content without throwing error
          updated = {
            ...updated,
            title: {
              id: updated.title?.id?.trim() || updated.title.en,
              en: updated.title.en,
            },
            summary: {
              id: updated.summary?.id?.trim() || updated.summary?.en || '',
              en: updated.summary?.en || '',
            },
            content: {
              id: (updated.content?.id && updated.content.id !== '<p></p>')
                ? updated.content.id
                : (updated.content?.en || '<p></p>'),
              en: updated.content?.en || '<p></p>',
            },
          };
        }
      }
    }

    setArticle(updated);
    articleRef.current = updated;
    onSave(updated, isPublish);

    const now = new Date();
    setAutosaveTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
    setHasUnsavedChanges(false);
    setIsSaving(false);

    showToast(
      isPublish
        ? 'Artikel berhasil diterbitkan ke situs publik!'
        : 'Draf artikel berhasil disimpan (Terjemahan ID otomatis disinkronkan)!'
    );
  };

  // Translation helpers
  const handleTranslateAll = async () => {
    const sourceLang = editorLang === 'en' ? 'id' : 'en';
    const targetLang = editorLang;

    // Check if target already has content
    const targetHasContent = Boolean(
      article.title?.[targetLang]?.trim() ||
      article.summary?.[targetLang]?.trim() ||
      (article.content?.[targetLang] && article.content[targetLang] !== '<p></p>')
    );

    if (targetHasContent) {
      setShowTranslateConfirm(true);
      return;
    }

    executeFullTranslation(sourceLang, targetLang);
  };

  const executeFullTranslation = async (sourceLang: 'id' | 'en', targetLang: 'id' | 'en') => {
    setIsTranslating(true);
    setShowTranslateConfirm(false);

    try {
      const titleSrc = article.title?.[sourceLang] || '';
      const summarySrc = article.summary?.[sourceLang] || '';
      const contentSrc = article.content?.[sourceLang] || '';

      const trTitle = titleSrc ? await translateText(titleSrc, sourceLang, targetLang) : '';
      const trSummary = summarySrc ? await translateText(summarySrc, sourceLang, targetLang) : '';
      const trContent = contentSrc ? await translateHtml(contentSrc, sourceLang, targetLang) : '<p></p>';

      updateArticle({
        title: { ...article.title, [targetLang]: trTitle },
        summary: { ...article.summary, [targetLang]: trSummary },
        content: {
          id: targetLang === 'id' ? trContent : (article.content?.id || ''),
          en: targetLang === 'en' ? trContent : (article.content?.en || ''),
        },
        translationMeta: {
          ...article.translationMeta,
          [targetLang === 'id' ? 'idStatus' : 'enStatus']: 'auto',
          lastTranslated: new Date().toISOString(),
        },
      });

      showToast(
        `Terjemahan ke ${targetLang === 'en' ? 'Bahasa Inggris' : 'Bahasa Indonesia'} berhasil diperbarui!`
      );
    } catch {
      showToast('Gagal menerjemahkan teks. Silakan coba lagi.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingleField = async (
    field: 'title' | 'summary' | 'content',
    sourceLang: 'id' | 'en',
    targetLang: 'id' | 'en'
  ) => {
    setTranslatingField(field);
    try {
      if (field === 'title') {
        const text = article.title?.[sourceLang] || '';
        const res = await translateText(text, sourceLang, targetLang);
        updateArticle({ title: { ...article.title, [targetLang]: res } });
      } else if (field === 'summary') {
        const text = article.summary?.[sourceLang] || '';
        const res = await translateText(text, sourceLang, targetLang);
        updateArticle({ summary: { ...article.summary, [targetLang]: res } });
      } else if (field === 'content') {
        const text = article.content?.[sourceLang] || '';
        const res = await translateHtml(text, sourceLang, targetLang);
        updateArticle({
          content: {
            id: targetLang === 'id' ? res : (article.content?.id || ''),
            en: targetLang === 'en' ? res : (article.content?.en || ''),
          },
        });
      }
      showToast(`Bagian ${field} berhasil diterjemahkan.`);
    } catch (e) {
      console.error(e);
      showToast('Gagal menerjemahkan bagian ini.', 'error');
    } finally {
      setTranslatingField(null);
    }
  };

  // Image Upload Handler (Compressed & saved to Supabase Storage)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMedia(file, 'images');
      if (result.success && result.publicUrl) {
        updateArticle({ image: result.publicUrl });
        const origKb = Math.round((result.originalSize || file.size) / 1024);
        const compKb = Math.round((result.compressedSize || file.size) / 1024);
        showToast(
          `Foto sampul berhasil dikompresi (${origKb} KB → ${compKb} KB, hemat ${result.reductionPercent || 0}%) & diunggah!`
        );
      } else {
        showToast(result.error || 'Gagal mengunggah gambar ke storage.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses gambar.', 'error');
    }
  };

  // Active language data
  const currentTitle = article.title?.[editorLang] || '';
  const currentSummary = article.summary?.[editorLang] || '';
  const currentContent = article.content?.[editorLang] || '';
  const currentCaption =
    typeof article.imageCaption === 'object'
      ? article.imageCaption?.[editorLang] || ''
      : article.imageCaption || '';

  const readingMetrics = calcReadingTime(currentContent);

  // Content completeness checks
  const hasIdContent = Boolean(article.title?.id?.trim() && article.summary?.id?.trim());
  const hasEnContent = Boolean(article.title?.en?.trim() && article.summary?.en?.trim());

  const isPublishReady = Boolean(
    (article.title?.en?.trim() || article.title?.id?.trim()) &&
    (article.summary?.en?.trim() || article.summary?.id?.trim()) &&
    ((article.content?.en && article.content.en !== '<p></p>') ||
      (article.content?.id && article.content.id !== '<p></p>'))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {customToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              customToast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-unram-950 text-white border-unram-800'
            }`}
          >
            {customToast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{customToast.message}</span>
          </div>
        </div>
      )}

      {/* Editor Top Bar (Fixed right below the navy CMS header) */}
      <header className="h-16 flex-shrink-0 px-4 sm:px-8 bg-white border-b border-slate-200/90 shadow-2xs flex items-center justify-between gap-4 z-40">
        {/* Left: Back & Document Status */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm('Ada perubahan yang belum disimpan. Tetap ingin kembali ke daftar?')) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Kembali ke Daftar Berita"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                article.status === 'published'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {article.status === 'published' ? 'Terbit' : 'Draft'}
            </span>

            <span className="text-xs text-slate-400 font-medium hidden md:inline">
              {isSaving ? (
                <span className="flex items-center gap-1 text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                </span>
              ) : autosaveTime ? (
                `Tersimpan otomatis ${autosaveTime}`
              ) : (
                'Draft baru'
              )}
            </span>
          </div>
        </div>

        {/* Center: Language Tabs (English First + Auto Indonesian) */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setEditorLang('en')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              editorLang === 'en'
                ? 'bg-white text-unram-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasEnContent ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span>English (Utama)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorLang('id')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              editorLang === 'id'
                ? 'bg-white text-unram-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasIdContent ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span>Indonesia (Otomatis)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(article)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            title="Pratinjau tampilan publik"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Pratinjau</span>
          </button>

          <button
            type="button"
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            title="Simpan sebagai draft (Ctrl+S)"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Simpan Draft</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPublishConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
            title="Terbitkan ke situs publik (Ctrl+Enter)"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Terbitkan</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              sidebarOpen
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Pengaturan Artikel"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Centered Writing Column */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-12 bg-white">
          <div className="max-w-[720px] mx-auto space-y-8">
            {/* English-First Mode Notice */}
            {editorLang === 'en' && (
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/70 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-unram-700 flex-shrink-0" />
                  <div className="text-[12px] text-slate-700">
                    <span className="font-bold text-unram-950">Mode Penulisan Bahasa Inggris:</span> Cukup tulis naskah sekali dalam Bahasa Inggris. Versi Bahasa Indonesia akan otomatis diterjemahkan &amp; di-generate saat artikel disimpan atau diterbitkan.
                  </div>
                </div>
              </div>
            )}

            {/* Indonesian Preview Notice */}
            {editorLang === 'id' && (
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <div className="text-[12px] text-emerald-950">
                    <span className="font-bold">Pratinjau Terjemahan Bahasa Indonesia:</span> Naskah ini dihasilkan secara otomatis dari naskah Bahasa Inggris Anda. Anda dapat menyesuaikannya secara manual jika diperlukan.
                  </div>
                </div>

                {hasEnContent && (
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => executeFullTranslation('en', 'id')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors disabled:opacity-50 flex-shrink-0 self-end sm:self-auto shadow-xs"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Sinkronkan Ulang dari English</span>
                  </button>
                )}
              </div>
            )}

            {/* Cover Image Upload Area */}
            <div className="space-y-3">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group/cover">
                <Image
                  src={article.image || '/images/news-1.jpg'}
                  alt="Foto Sampul Berita"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover transition-transform duration-300 group-hover/cover:scale-101"
                />

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold shadow-md hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Foto Sampul</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Caption and Photo Credit Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  placeholder={`Keterangan foto (${editorLang.toUpperCase()})...`}
                  value={currentCaption}
                  onChange={(e) => {
                    const val = e.target.value;
                    const prevCap = (typeof article.imageCaption === 'object' && article.imageCaption !== null ? article.imageCaption : {}) as { id?: string; en?: string };
                    updateArticle({
                      imageCaption: {
                        id: editorLang === 'id' ? val : (prevCap?.id || val),
                        en: editorLang === 'en' ? val : (prevCap?.en || val),
                      },
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Kredit foto (misal: Humas UNRAM)..."
                  value={article.imageCredit || ''}
                  onChange={(e) => updateArticle({ imageCredit: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Title Input (Borderless, Newsreader Serif Style) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Judul Berita ({editorLang === 'en' ? 'English (Utama)' : 'Bahasa Indonesia (Otomatis)'})
                </span>
                {editorLang === 'id' && article.title?.en && (
                  <button
                    type="button"
                    disabled={translatingField === 'title'}
                    onClick={() => handleTranslateSingleField('title', 'en', 'id')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                  >
                    {translatingField === 'title' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Sinkronkan judul dari English</span>
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                placeholder={
                  editorLang === 'en'
                    ? 'Write article headline in English...'
                    : 'Judul berita Bahasa Indonesia (otomatis terisi saat disimpan)...'
                }
                value={currentTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  const newTitle = { ...article.title, [editorLang]: val };
                  updateArticle({
                    title: newTitle,
                    slug: editorLang === 'en' ? slugify(val) : (article.slug || slugify(val)),
                  });
                }}
                className="w-full font-serif text-3xl sm:text-4xl text-slate-900 placeholder:text-slate-300 font-normal leading-tight focus:outline-none border-b border-transparent focus:border-slate-200 resize-none transition-colors"
              />
            </div>

            {/* Summary Input (Lead Paragraph / Muted text with character counter) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-400">
                  Ringkasan / Paragraf Pembuka ({editorLang === 'en' ? 'ENGLISH (UTAMA)' : 'INDONESIA (OTOMATIS)'})
                </span>
                <div className="flex items-center gap-3">
                  {editorLang === 'id' && article.summary?.en && (
                    <button
                      type="button"
                      disabled={translatingField === 'summary'}
                      onClick={() => handleTranslateSingleField('summary', 'en', 'id')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                    >
                      {translatingField === 'summary' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>Sinkronkan dari English</span>
                    </button>
                  )}
                  <span
                    className={`font-mono ${
                      currentSummary.length > 200
                        ? 'text-amber-600 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {currentSummary.length}/160 karakter
                  </span>
                </div>
              </div>
              <textarea
                rows={3}
                placeholder={
                  editorLang === 'en'
                    ? 'Write a concise lead summary in English (recommended ~160 characters)...'
                    : 'Ringkasan berita Bahasa Indonesia (otomatis terisi saat disimpan)...'
                }
                value={currentSummary}
                onChange={(e) => {
                  const val = e.target.value;
                  updateArticle({
                    summary: { ...article.summary, [editorLang]: val },
                  });
                }}
                className="w-full text-base sm:text-lg text-slate-600 placeholder:text-slate-300 font-normal leading-relaxed focus:outline-none border-b border-transparent focus:border-slate-200 resize-none transition-colors"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Rich-Text Body Editor (Tiptap) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Isi Lengkap Berita ({editorLang === 'en' ? 'ENGLISH (UTAMA)' : 'INDONESIA (OTOMATIS)'})
                </span>
                {editorLang === 'id' && article.content?.en && article.content.en !== '<p></p>' && (
                  <button
                    type="button"
                    disabled={translatingField === 'content'}
                    onClick={() => handleTranslateSingleField('content', 'en', 'id')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                  >
                    {translatingField === 'content' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Sinkronkan bodi dari English</span>
                  </button>
                )}
              </div>

              <TiptapEditor
                key={editorLang}
                content={currentContent}
                placeholder={
                  editorLang === 'en'
                    ? 'Start writing article narrative in English here (use headings, quotes, lists, bold)...'
                    : 'Isi lengkap berita dalam Bahasa Indonesia (otomatis terisi saat disimpan)...'
                }
                onChange={(html) => {
                  updateArticle({
                    content: {
                      id: editorLang === 'id' ? html : (article.content?.id || ''),
                      en: editorLang === 'en' ? html : (article.content?.en || ''),
                    },
                  });
                }}
              />

              {/* Word Count and Reading Time Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {readingMetrics.words} kata &bull; perkiraan waktu baca ~{readingMetrics.minutes} menit
                  </span>
                </span>
                <span className="text-[11px]">
                  Pintasan: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">Ctrl+S</kbd> simpan draf &bull; <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">Ctrl+Enter</kbd> terbitkan
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Settings & Publish Checklist */}
        <aside
          className={`w-80 border-l border-slate-200 p-6 overflow-y-auto transition-all duration-200 flex-shrink-0 fixed lg:static top-[60px] lg:top-0 right-0 bottom-0 z-40 shadow-xl lg:shadow-none bg-white lg:bg-slate-50/70 ${
            sidebarOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
                Pengaturan Berita
              </h3>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Setting */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Publikasi
              </label>
              <select
                value={article.status || 'draft'}
                onChange={(e) => updateArticle({ status: e.target.value as 'draft' | 'published' })}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
              >
                <option value="draft">Draft (Belum Ditampilkan)</option>
                <option value="published">Terbit (Tampil di Website)</option>
              </select>
            </div>

            {/* Category Setting */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Kategori Berita
              </label>
              <select
                value={
                  typeof article.category === 'object'
                    ? article.category.id
                    : article.category
                }
                onChange={(e) => {
                  const matched = categories.find((c) => c.id === e.target.value);
                  if (matched) {
                    updateArticle({ category: matched });
                  }
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} / {c.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Publication Date Setting */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tanggal Publikasi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayFormatted();
                    updateArticle({ date: today });
                    showToast('Tanggal publikasi diatur ke hari ini.');
                  }}
                  className="text-[10px] font-bold text-unram-600 hover:text-unram-800"
                >
                  Hari Ini
                </button>
              </div>
              <input
                type="text"
                placeholder="11 Nov 2026"
                value={typeof article.date === 'object' ? article.date.id : article.date}
                onChange={(e) => {
                  const val = e.target.value;
                  updateArticle({
                    date: {
                      id: val,
                      en: val,
                    },
                  });
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Slug URL Setting */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Slug URL (SEO)
              </label>
              <input
                type="text"
                placeholder="slug-judul-berita"
                value={
                  typeof article.slug === 'object'
                    ? article.slug.id
                    : (article.slug as string) || ''
                }
                onChange={(e) => updateArticle({ slug: slugify(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-600"
              />
            </div>

            {/* Author Setting */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Penulis / Redaksi
              </label>
              <input
                type="text"
                value={article.author || ''}
                onChange={(e) => updateArticle({ author: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Checklist Kesiapan Terbit */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Checklist Kesiapan Terbit
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {article.title?.en?.trim() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span className={article.title?.en?.trim() ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                    Judul Bahasa Inggris terisi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {article.summary?.en?.trim() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span className={article.summary?.en?.trim() ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                    Ringkasan Bahasa Inggris terisi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {article.image ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span className={article.image ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                    Foto sampul terpasang
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {article.content?.en && article.content.en !== '<p></p>' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                  )}
                  <span
                    className={
                      article.content?.en && article.content.en !== '<p></p>'
                        ? 'text-slate-800 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    Naskah Bahasa Inggris telah ditulis
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-700 font-medium text-[11px]">
                    Terjemahan ID: Otomatis saat Simpan / Terbit
                  </span>
                </div>
              </div>
            </div>

            {/* Status Peninjauan Terjemahan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Peninjauan Terjemahan
              </h4>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={article.translationMeta?.idStatus === 'reviewed'}
                  onChange={(e) => {
                    updateArticle({
                      translationMeta: {
                        ...article.translationMeta,
                        idStatus: e.target.checked ? 'reviewed' : 'auto',
                      },
                    });
                  }}
                  className="mt-0.5 rounded border-slate-300 text-unram-900 focus:ring-unram-900"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  Tandai terjemahan Bahasa Indonesia sudah ditinjau oleh manusia
                </span>
              </label>
              {article.translationMeta?.idStatus === 'auto' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/60 leading-relaxed">
                  ⚠️ Terjemahan saat ini berstatus draf mesin otomatis.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Overwrite Confirmation Dialog */}
      {showTranslateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Timpa Konten yang Sudah Ada?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Versi {editorLang === 'en' ? 'Bahasa Inggris' : 'Bahasa Indonesia'} sudah memiliki teks. Melanjutkan translasi otomatis akan menimpa judul, ringkasan, dan isi berita yang ada.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTranslateConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const source = editorLang === 'en' ? 'id' : 'en';
                  executeFullTranslation(source, editorLang);
                }}
                className="px-4 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold transition-colors"
              >
                Ya, Terjemahkan & Timpa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-unram-100 text-unram-900 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Terbitkan Berita ke Publik?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Artikel akan langsung muncul di beranda dan halaman arsip berita situs KUI UNRAM.
              </p>

              {!isPublishReady && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span>Judul dan ringkasan Bahasa Indonesia wajib diisi sebelum menerbitkan.</span>
                </div>
              )}

              {!hasEnContent && isPublishReady && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Versi Bahasa Inggris belum lengkap. Pengunjung berbahasa Inggris akan melihat versi Bahasa Indonesia sebagai fallback.</span>
                </div>
              )}

              {article.translationMeta?.idStatus === 'auto' && isPublishReady && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Perhatian: Terjemahan Bahasa Indonesia dihasilkan otomatis oleh mesin dan belum ditandai sudah ditinjau oleh manusia. Anda tetap dapat menerbitkannya.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!isPublishReady}
                onClick={() => {
                  setShowPublishConfirm(false);
                  handleManualSave(true);
                  onBack();
                }}
                className="px-5 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                Konfirmasi & Terbitkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
