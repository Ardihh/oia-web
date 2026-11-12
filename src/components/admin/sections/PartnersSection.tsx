import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { FormSection, BilingualField, TextInput, ImageField, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { PartnerItem } from '@/context/ContentContext';

interface PartnersSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function PartnersSection({
  initialData,
  version,
  onSaved,
  showToast,
}: PartnersSectionProps) {
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

  const handlePartnerChange = (index: number, key: keyof PartnerItem, val: any) => {
    const currentItems: PartnerItem[] = [...(data.items || [])];
    currentItems[index] = { ...currentItems[index], [key]: val };
    handleChange('items', currentItems);
  };

  const handleAddPartner = () => {
    const currentItems: PartnerItem[] = [...(data.items || [])];
    const newPartner: PartnerItem = {
      id: `partner-${Date.now()}`,
      name: 'Nama Universitas / Institusi',
      logo: '',
      url: 'https://',
      country: 'Negara Mitra',
    };
    handleChange('items', [...currentItems, newPartner]);
  };

  const handleRemovePartner = (index: number) => {
    const currentItems: PartnerItem[] = [...(data.items || [])];
    handleChange('items', currentItems.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('partners', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Daftar Kemitraan tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('partners', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi mitra.');
    }
  };

  const items: PartnerItem[] = data.items || [];

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar Kemitraan Global"
        description="Judul dan subjudul pada halaman direktori kemitraan universitas mitra."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Kemitraan & Kolaborasi"
          placeholderEn="Global Partnerships"
        />

        <BilingualField
          label="Judul Utama Direktori"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Jejaring Universitas & Lembaga Mitra"
          placeholderEn="Global Partner Consortium"
        />

        <BilingualField
          label="Deskripsi / Subtitle"
          value={data.subtitle || { id: '', en: '' }}
          onChange={(val) => handleChange('subtitle', val)}
          multiline
          rows={2}
        />

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tautan Menjadi Mitra (Become a Partner URL)
          </label>
          <TextInput
            value={data.becomePartnerUrl || ''}
            onChange={(e) => handleChange('becomePartnerUrl', e.target.value)}
            placeholder="/contact atau https://..."
          />
        </div>
      </FormSection>

      <FormSection
        title="Daftar Institusi Mitra"
        description="Kelola logo, nama, negara asal, dan tautan resmi institusi mitra bilateral."
        action={
          <button
            type="button"
            onClick={handleAddPartner}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mitra</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((partner, idx) => (
            <div
              key={partner.id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">Mitra #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePartner(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Mitra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Institusi
                </label>
                <input
                  type="text"
                  value={partner.name || ''}
                  onChange={(e) => handlePartnerChange(idx, 'name', e.target.value)}
                  placeholder="e.g. University of Queensland"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Negara Asal
                  </label>
                  <input
                    type="text"
                    value={partner.country || ''}
                    onChange={(e) => handlePartnerChange(idx, 'country', e.target.value)}
                    placeholder="e.g. Australia"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Website Resmi
                  </label>
                  <input
                    type="text"
                    value={partner.url || ''}
                    onChange={(e) => handlePartnerChange(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <ImageField
                label="Logo Institusi Mitra"
                value={partner.logo || ''}
                onChange={(url) => handlePartnerChange(idx, 'logo', url)}
                aspectRatio="square"
                hint="Gunakan logo berlatar transparan atau persegi."
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
