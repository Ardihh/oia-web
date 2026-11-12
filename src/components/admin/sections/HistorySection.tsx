import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormSection, ConfirmDialog } from '../ui';
import { listSiteContentHistory, restoreSiteContentHistory } from '@/lib/supabase';

interface HistorySectionProps {
  showToast: (msg: string) => void;
  onRestored: () => void;
}

export function HistorySection({ showToast, onRestored }: HistorySectionProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await listSiteContentHistory();
      setHistoryList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRestoreConfirm = async () => {
    if (!selectedHistoryId) return;
    setRestoring(true);
    try {
      const res = await restoreSiteContentHistory(selectedHistoryId);
      if (res.success) {
        showToast('Konten berhasil dipulihkan ke versi riwayat yang dipilih.');
        onRestored();
        fetchHistory();
      } else {
        alert(res.error || 'Gagal memulihkan versi konten.');
      }
    } finally {
      setRestoring(false);
      setSelectedHistoryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Riwayat Perubahan Konten (Audit Trail)"
        description="Daftar 50 snapshot riwayat perubahan seksi situs yang tersimpan secara otomatis setiap kali admin melakukan penyimpanan."
        action={
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Segarkan</span>
          </button>
        }
      >
        {loading && historyList.length === 0 ? (
          <div className="flex items-center justify-center p-12 text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            Memuat riwayat perubahan konten...
          </div>
        ) : historyList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Belum Ada Riwayat Tercatat</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
              Riwayat akan terisi otomatis setiap kali Anda menyimpan perubahan seksi konten di dashboard.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
            {historyList.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    v{item.version}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        Pembaruan Seksi: <span className="font-mono text-blue-700 uppercase">{item.section_changed || 'Umum'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">ID Snapshot #{item.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Waktu simpan: {new Date(item.updated_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHistoryId(item.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan ke Versi Ini</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <ConfirmDialog
        isOpen={Boolean(selectedHistoryId)}
        title="Pulihkan Riwayat Konten"
        message={`Apakah Anda yakin ingin memulihkan seluruh konten situs ke snapshot versi #${selectedHistoryId}? Perubahan ini akan langsung aktif dan menimpa konten saat ini.`}
        confirmLabel="Pulihkan Sekarang"
        variant="warning"
        isLoading={restoring}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setSelectedHistoryId(null)}
      />
    </div>
  );
}
