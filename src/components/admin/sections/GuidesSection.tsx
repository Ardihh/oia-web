import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormSection, BilingualField, FileField, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { GuideItem } from '@/context/ContentContext';

interface GuidesSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function GuidesSection({
  initialData,
  version,
  onSaved,
  showToast,
}: GuidesSectionProps) {
  const [data, setData] = useState<GuideItem[]>(Array.isArray(initialData) ? initialData : []);
  const [savedSnapshot, setSavedSnapshot] = useState<GuideItem[]>(Array.isArray(initialData) ? initialData : []);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [conflictModal, setConflictModal] = useState<string | null>(null);

  useEffect(() => {
    const arr = Array.isArray(initialData) ? initialData : [];
    setData(arr);
    setSavedSnapshot(arr);
    setIsDirty(false);
  }, [initialData]);

  const handleItemChange = (index: number, key: keyof GuideItem, val: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: val };
    setData(updated);
    setIsDirty(JSON.stringify(updated) !== JSON.stringify(savedSnapshot));
  };

  const handleAddItem = () => {
    const newItem: GuideItem = {
      id: `guide-${Date.now()}`,
      title: { id: 'Buku Panduan Baru', en: 'New Guidebook' },
      category: { id: 'Mahasiswa Internasional', en: 'International Students' },
      desc: { id: 'Deskripsi berkas panduan...', en: 'Guidebook description...' },
      fileUrl: '',
      fileSize: 'PDF • 2.0 MB',
      updatedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    const updated = [...data, newItem];
    setData(updated);
    setIsDirty(true);
  };

  const handleRemoveItem = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    setData(updated);
    setIsDirty(true);
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = [...savedSnapshot];

    const res = await saveLiveSection('guides', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Daftar Panduan & Berkas tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('guides', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi panduan.');
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Buku Panduan & Unduhan Resmi"
        description="Kelola berkas pedoman mobilitas, formulir pendaftaran, dan regulasi visa KUI."
        action={
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Dokumen</span>
          </button>
        }
      >
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">Dokumen #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <BilingualField
                label="Judul Dokumen"
                value={item.title || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'title', val)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BilingualField
                  label="Kategori Panduan"
                  value={item.category || { id: '', en: '' }}
                  onChange={(val) => handleItemChange(idx, 'category', val)}
                />

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Label Ukuran & Format
                  </label>
                  <input
                    type="text"
                    value={item.fileSize || ''}
                    onChange={(e) => handleItemChange(idx, 'fileSize', e.target.value)}
                    placeholder="PDF • 2.5 MB"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <BilingualField
                label="Ringkasan Isi Panduan"
                value={item.desc || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'desc', val)}
                multiline
                rows={2}
              />

              <FileField
                label="Unggah Berkas PDF"
                value={item.fileUrl || ''}
                onChange={(url) => handleItemChange(idx, 'fileUrl', url)}
                hint="Tombol unduh di website hanya akan tampil jika berkas valid telah diunggah."
              />
            </div>
          ))}
        </div>
      </FormSection>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      <ConfirmDialog
        isOpen={Boolean(conflictModal)}
        title="Konflik Versi Server"
        message={conflictModal || ''}
        confirmLabel="Muat Ulang Halaman"
        onConfirm={() => window.location.reload()}
        onCancel={() => setConflictModal(null)}
      />
    </div>
  );
}
