import React, { useState } from 'react';
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, HardDrive, ArrowRight } from 'lucide-react';
import { FormSection } from '../ui';
import { SiteContent } from '@/context/ContentContext';
import { downloadRawBackup, validateSiteContent } from '@/lib/schemaValidator';
import { getSupabase, saveLiveSection, saveNewsArticle, triggerRevalidate } from '@/lib/supabase';

interface BackupSectionProps {
  currentContent: SiteContent;
  showToast: (msg: string) => void;
  onRefreshContent: () => void;
}

export function BackupSection({
  currentContent,
  showToast,
  onRefreshContent,
}: BackupSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const jsonStr = JSON.stringify(currentContent, null, 2);
      const filename = `oia-unram-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadRawBackup(jsonStr, filename);
      showToast('Berkas cadangan JSON berhasil diunduh ke komputer Anda.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Membaca dan memvalidasi berkas...');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = validateSiteContent(parsed);

      if (!validation.valid || !validation.sanitizedContent) {
        alert('Format berkas JSON tidak sesuai skema konten resmi OIA UNRAM.');
        setImportStatus(null);
        return;
      }

      if (confirm('Terapkan seluruh data dari berkas cadangan ini ke sistem live?')) {
        const content = validation.sanitizedContent;
        // Save live sections
        const sections = ['hero', 'about', 'services', 'stats', 'guides', 'faq', 'contact', 'partners'];
        for (const sec of sections) {
          if ((content as any)[sec]) {
            await saveLiveSection(sec, (content as any)[sec]);
          }
        }

        // Save news articles
        if (Array.isArray(content.news)) {
          for (const article of content.news) {
            await saveNewsArticle(article);
          }
        }

        await triggerRevalidate(['site-content', 'news']);
        showToast('Cadangan berhasil dipulihkan ke sistem live.');
        onRefreshContent();
        setImportStatus('Pemulihan cadangan selesai dengan sukses.');
      }
    } catch (err: any) {
      alert(`Gagal mengimpor berkas: ${err?.message || err}`);
      setImportStatus(null);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleCutoverTool = async () => {
    if (!confirm('Salin konten dari tabel lama (site_content_published) ke sistem Live Editing baru?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationLog('Mengambil data dari site_content_published...');

    const supabase = getSupabase();
    if (!supabase) {
      setMigrationLog('Gagal: Supabase tidak terhubung.');
      setIsMigrating(false);
      return;
    }

    try {
      const { data: legacyRow, error } = await supabase
        .from('site_content_published')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();

      if (error || !legacyRow?.content) {
        setMigrationLog(`Gagal mengambil data lama: ${error?.message || 'Data tidak ditemukan'}`);
        setIsMigrating(false);
        return;
      }

      const legacyContent = legacyRow.content;
      setMigrationLog('Menyimpan seksi-seksi ke sistem live baru...');

      const sections = ['hero', 'about', 'services', 'stats', 'guides', 'faq', 'contact', 'partners'];
      for (const sec of sections) {
        if (legacyContent[sec]) {
          await saveLiveSection(sec, legacyContent[sec]);
        }
      }

      setMigrationLog('Memindahkan artikel berita ke tabel relational news_articles...');
      if (Array.isArray(legacyContent.news)) {
        for (const art of legacyContent.news) {
          await saveNewsArticle({
            ...art,
            status: art.status || 'published',
          });
        }
      }

      await triggerRevalidate(['site-content', 'news']);
      setMigrationLog('Sukses! Semua konten berhasil dimigrasikan ke sistem Live Editing.');
      showToast('Migrasi konten berhasil diselesaikan.');
      onRefreshContent();
    } catch (err: any) {
      setMigrationLog(`Error selama migrasi: ${err?.message || err}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Alat Sinkronisasi & Cutover Konten"
        description="Fasilitas satu-klik untuk menyalin seluruh data dari sistem terdahulu (site_content_published) ke tabel live (site_content dan news_articles)."
      >
        <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-blue-900">
                Salin Konten Saat Ini ke Sistem Live Editing
              </h4>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Tindakan ini aman dan idempoten. Konten seksi dan berita yang ada di tabel publikasi lama akan dipetakan ke tabel baru tanpa menghapus data sebelumnya.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCutoverTool}
              disabled={isMigrating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses Migrasi...</span>
                </>
              ) : (
                <>
                  <span>Jalankan Sinkronisasi Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {migrationLog && (
            <p className="text-xs font-mono p-2.5 bg-white border border-blue-200 rounded text-slate-800">
              {migrationLog}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Ekspor & Impor Berkas Cadangan JSON"
        description="Unduh berkas cadangan komprehensif atau pulihkan data dari berkas JSON eksternal."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-semibold text-slate-800">Ekspor Cadangan Lengkap</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh seluruh struktur data website (seksi dan berita) ke dalam satu berkas format JSON berstempel waktu.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas JSON</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-semibold text-slate-800">Impor & Pulihkan dari JSON</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih berkas JSON cadangan yang valid untuk diterapkan ke sistem.
            </p>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{isImporting ? 'Memproses Berkas...' : 'Pilih Berkas JSON'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            {importStatus && <p className="text-xs text-blue-700 mt-1">{importStatus}</p>}
          </div>
        </div>
      </FormSection>
    </div>
  );
}
