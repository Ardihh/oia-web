import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormSection, BilingualField, TextInput, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { StatItem } from '@/context/ContentContext';

interface StatsSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function StatsSection({
  initialData,
  version,
  onSaved,
  showToast,
}: StatsSectionProps) {
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

  const handleItemChange = (index: number, key: keyof StatItem, val: any) => {
    const currentItems: StatItem[] = [...(data.items || [])];
    currentItems[index] = { ...currentItems[index], [key]: val };
    handleChange('items', currentItems);
  };

  const handleAddItem = () => {
    const currentItems: StatItem[] = [...(data.items || [])];
    const newItem: StatItem = {
      id: `stat-${Date.now()}`,
      value: '10',
      suffix: '+',
      label: { id: 'Metrik Baru', en: 'New Metric' },
      desc: { id: 'Keterangan metrik...', en: 'Metric detail...' },
    };
    handleChange('items', [...currentItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const currentItems: StatItem[] = [...(data.items || [])];
    handleChange('items', currentItems.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('stats', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi Statistik Dampak tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('stats', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi statistik.');
    }
  };

  const items: StatItem[] = data.items || [];

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar Capaian & Dampak"
        description="Judul dan subjudul pengantar angka capaian internasionalisasi UNRAM."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Capaian & Dampak"
          placeholderEn="Global Footprint"
        />

        <BilingualField
          label="Judul Utama Seksi"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Jejaring Internasional dalam Angka"
          placeholderEn="International Impact in Numbers"
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
        title="Daftar Angka Metrik"
        description="Kelola kartu statistik capaian (MoU, mahasiswa asing, negara mitra, program aktif)."
        action={
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Metrik</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">Metrik #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Metrik"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nilai Angka
                  </label>
                  <input
                    type="text"
                    value={item.value || ''}
                    onChange={(e) => handleItemChange(idx, 'value', e.target.value)}
                    placeholder="45"
                    className="w-full h-9 px-3 text-sm font-semibold bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Akhiran / Simbol
                  </label>
                  <input
                    type="text"
                    value={item.suffix || ''}
                    onChange={(e) => handleItemChange(idx, 'suffix', e.target.value)}
                    placeholder="+ atau %"
                    className="w-full h-9 px-3 text-sm font-semibold bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <BilingualField
                label="Nama Label Metrik"
                value={item.label || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'label', val)}
              />

              <BilingualField
                label="Keterangan Ringkas"
                value={item.desc || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'desc', val)}
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
