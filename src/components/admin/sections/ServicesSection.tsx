import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormSection, BilingualField, TextInput, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { ServiceItem } from '@/context/ContentContext';

interface ServicesSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function ServicesSection({
  initialData,
  version,
  onSaved,
  showToast,
}: ServicesSectionProps) {
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

  const handleItemChange = (index: number, key: keyof ServiceItem, val: any) => {
    const currentItems: ServiceItem[] = [...(data.items || [])];
    currentItems[index] = { ...currentItems[index], [key]: val };
    handleChange('items', currentItems);
  };

  const handleAddItem = () => {
    const currentItems: ServiceItem[] = [...(data.items || [])];
    const newItem: ServiceItem = {
      id: `service-${Date.now()}`,
      title: { id: 'Layanan Baru', en: 'New Service' },
      desc: { id: 'Deskripsi lengkap mengenai layanan...', en: 'Detailed service description...' },
      href: '/contact',
    };
    handleChange('items', [...currentItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const currentItems: ServiceItem[] = [...(data.items || [])];
    handleChange('items', currentItems.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('services', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi Layanan tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('services', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi layanan.');
    }
  };

  const items: ServiceItem[] = data.items || [];

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar Seksi Layanan"
        description="Judul dan subjudul pengantar daftar layanan komprehensif KUI UNRAM."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Layanan Kami"
          placeholderEn="Our Services"
        />

        <BilingualField
          label="Judul Utama Seksi"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Dukungan Komprehensif Mobilitas & Kemitraan"
          placeholderEn="End-to-End International Support"
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
        title="Daftar Layanan"
        description="Kelola kartu-kartu layanan yang tersedia untuk mahasiswa dan akademisi."
        action={
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Layanan</span>
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
                <span className="text-xs font-bold text-slate-700">Layanan #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Layanan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <BilingualField
                label="Nama Layanan"
                value={item.title || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'title', val)}
              />

              <BilingualField
                label="Uraian Layanan"
                value={item.desc || { id: '', en: '' }}
                onChange={(val) => handleItemChange(idx, 'desc', val)}
                multiline
                rows={2}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tautan Aksi (Route URL)
                </label>
                <input
                  type="text"
                  value={item.href || ''}
                  onChange={(e) => handleItemChange(idx, 'href', e.target.value)}
                  placeholder="/admission atau /contact"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
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
