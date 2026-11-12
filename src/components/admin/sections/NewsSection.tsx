import React, { useState, useEffect } from 'react';
import { NewsArticle } from '@/context/ContentContext';
import { ArticleListView } from '../news/ArticleListView';
import { ArticleEditor } from '../news/ArticleEditor';
import { ArticlePreviewModal } from '../news/ArticlePreviewModal';
import {
  getAdminNewsArticles,
  saveNewsArticle,
  deleteNewsArticle,
  listNewsArticleRevisions,
} from '@/lib/supabase';
import { Loader2, History, RotateCcw, X } from 'lucide-react';
import { ConfirmDialog } from '../ui';

interface NewsSectionProps {
  initialNews?: NewsArticle[];
  showToast: (msg: string, onUndo?: () => void) => void;
}

const PRESET_CATEGORIES = [
  { id: 'Program Mobilitas', en: 'Mobility Program' },
  { id: 'Kemitraan Global', en: 'Global Partnership' },
  { id: 'Mahasiswa Asing', en: 'International Students' },
  { id: 'Beasiswa Internasional', en: 'International Scholarships' },
  { id: 'Riset & Konferensi', en: 'Research & Conference' },
  { id: 'Kunjungan Delegasi', en: 'Delegation Visit' },
  { id: 'Adaptasi Budaya', en: 'Cultural Immersion' },
  { id: 'Pengumuman Resmi', en: 'Official Announcement' },
];

export function NewsSection({ initialNews = [], showToast }: NewsSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialNews);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // Revisions Modal State
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Load articles from relational table news_articles on mount
  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await getAdminNewsArticles();
        if (isMounted && data && data.length > 0) {
          setArticles(data);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNew = () => {
    setEditingArticle(null);
    setViewMode('editor');
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setViewMode('editor');
  };

  const handleSave = async (article: NewsArticle, isPublish: boolean) => {
    setLoading(true);
    try {
      const payload: Partial<NewsArticle> = {
        ...article,
        status: isPublish ? 'published' : 'draft',
      };

      const res = await saveNewsArticle(payload);
      if (res.success && res.article) {
        const saved = res.article;
        setArticles((prev) => {
          const index = prev.findIndex((a) => a.id === saved.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [saved, ...prev];
        });

        showToast(
          isPublish
            ? 'Artikel berita berhasil diterbitkan dan langsung tayang di website.'
            : 'Draf artikel berita berhasil disimpan.'
        );
        setViewMode('list');
      } else {
        alert(res.error || 'Gagal menyimpan berita.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    const target = articles.find((a) => a.id === articleToDelete);
    setLoading(true);
    try {
      const res = await deleteNewsArticle(articleToDelete, target?.slug);
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.id !== articleToDelete));
        showToast('Artikel berhasil dihapus dari sistem.');
      } else {
        alert(res.error || 'Gagal menghapus artikel.');
      }
    } finally {
      setLoading(false);
      setArticleToDelete(null);
    }
  };

  const handleOpenRevisions = async (articleId: string) => {
    setShowRevisions(true);
    setLoadingRevisions(true);
    try {
      const list = await listNewsArticleRevisions(articleId);
      setRevisions(list);
    } finally {
      setLoadingRevisions(false);
    }
  };

  if (viewMode === 'editor') {
    return (
      <div className="space-y-4">
        {editingArticle?.id && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleOpenRevisions(editingArticle.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat Riwayat Revisi</span>
            </button>
          </div>
        )}

        <ArticleEditor
          initialArticle={editingArticle}
          categories={PRESET_CATEGORIES}
          onBack={() => setViewMode('list')}
          onSave={handleSave}
          onPreview={(art) => setPreviewArticle(art)}
        />

        {previewArticle && (
          <ArticlePreviewModal
            article={previewArticle}
            onClose={() => setPreviewArticle(null)}
          />
        )}

        {/* Revisions Drawer */}
        {showRevisions && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Riwayat Revisi Artikel</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevisions(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingRevisions ? (
                  <div className="flex items-center justify-center p-8 text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                    Memuat riwayat revisi...
                  </div>
                ) : revisions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Belum ada riwayat revisi yang tercatat untuk artikel ini.
                  </p>
                ) : (
                  revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          Revisi v{rev.version}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">
                        Judul: {rev.revision_data?.title?.id || rev.revision_data?.title?.en || '-'}
                      </p>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Pulihkan data revisi ini ke dalam editor?')) {
                              setEditingArticle({
                                ...editingArticle!,
                                ...rev.revision_data,
                              });
                              setShowRevisions(false);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Terapkan ke Editor</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ArticleListView
        articles={articles}
        categories={PRESET_CATEGORIES}
        activeLang="id"
        onNewArticle={handleNew}
        onEditArticle={handleEdit}
        onPreviewArticle={(art) => setPreviewArticle(art)}
        onDeleteArticle={(id) => setArticleToDelete(id)}
      />

      {previewArticle && (
        <ArticlePreviewModal
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(articleToDelete)}
        title="Hapus Artikel Berita"
        message="Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini akan menghapus artikel dari database publik dan relasi sitemap."
        confirmLabel="Hapus Artikel"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setArticleToDelete(null)}
      />
    </div>
  );
}
