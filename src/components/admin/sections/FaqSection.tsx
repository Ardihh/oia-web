import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormSection, BilingualField, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { FaqItem } from '@/context/ContentContext';

interface FaqSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function FaqSection({
  initialData,
  version,
  onSaved,
  showToast,
}: FaqSectionProps) {
  const [data, setData] = useState(initialData || {});
  const [savedSnapshot, setSavedSnapshot] = useState(initialData || {});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [conflictModal, setConflictModal] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData || {});
    setSavedSnapshot(initialData || {});
    setIsDirty(false);
  }, [initialData]);

  const handleChange = (field: string, val: any) => {
    const updated = { ...data, [field]: val };
    setData(updated);
    setIsDirty(JSON.stringify(updated) !== JSON.stringify(savedSnapshot));
  };

  const handleItemChange = (index: number, key: keyof FaqItem, val: any) => {
    const currentItems: FaqItem[] = [...(data.items || [])];
    currentItems[index] = { ...currentItems[index], [key]: val };
    handleChange('items', currentItems);
  };

  const handleAddItem = () => {
    const currentItems: FaqItem[] = [...(data.items || [])];
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      q: { id: 'Pertanyaan baru?', en: 'New question?' },
      a: { id: 'Jawaban penjelasan...', en: 'Detailed answer...' },
    };
    handleChange('items', [...currentItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const currentItems: FaqItem[] = [...(data.items || [])];
    handleChange('items', currentItems.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('faq', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi FAQ tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('faq', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi FAQ.');
    }
  };

  const items: FaqItem[] = data.items || [];

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar Tanya Jawab (FAQ)"
        description="Judul dan subjudul pengantar seksi FAQ untuk pengunjung website."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Tanya Jawab"
          placeholderEn="Frequently Asked Questions"
        />

        <BilingualField
          label="Judul Utama FAQ"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Pertanyaan yang Sering Diajukan"
          placeholderEn="Everything You Need to Know"
        />

        <BilingualField
          label="Deskripsi / Subtitle"
          value={data.subtitle || { id: '', en: '' }}
          onChange={(val) => handleChange('subtitle', val)}
          multiline
          rows={2}
        />
      </FormSection>

      <FormSection
        title="Daftar Pertanyaan & Jawaban"
        description="Kelola pertanyaan umum seputar admisi, beasiswa, dan studi di Lombok."
        action={
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah FAQ</span>
          </button>
        }
      >
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">FAQ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <BilingualField
                label="Pertanyaan (Q)"
                value={item.q || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'q', val)}
              />

              <BilingualField
                label="Jawaban (A)"
                value={item.a || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'a', val)}
                multiline
                rows={3}
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
