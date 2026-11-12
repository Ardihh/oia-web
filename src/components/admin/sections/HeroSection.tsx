import React, { useState, useEffect } from 'react';
import { FormSection, BilingualField, TextInput, ImageField, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';

interface HeroSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function HeroSection({
  initialData,
  version,
  onSaved,
  showToast,
}: HeroSectionProps) {
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

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('hero', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi Hero tersimpan dan langsung tayang di website.', async () => {
        // Undo: save previous snapshot
        await saveLiveSection('hero', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi hero.');
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengaturan Teks & Judul Hero"
        description="Judul utama dan ringkasan pengantar yang tampil di bagian paling atas beranda."
      >
        <BilingualField
          label="Label Kicker / Badge Atas"
          value={data.badge || { id: '', en: '' }}
          onChange={(val) => handleChange('badge', val)}
          placeholderId="KANTOR URUSAN INTERNASIONAL"
          placeholderEn="OFFICE OF INTERNATIONAL AFFAIRS"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualField
            label="Awalan Judul (Prefix)"
            value={data.titlePrefix || { id: '', en: '' }}
            onChange={(val) => handleChange('titlePrefix', val)}
            placeholderId="Gerbang Global"
            placeholderEn="Gateway to Global"
          />

          <BilingualField
            label="Sorotan Judul (Highlight)"
            value={data.titleHighlight || { id: '', en: '' }}
            onChange={(val) => handleChange('titleHighlight', val)}
            placeholderId="Universitas Mataram"
            placeholderEn="Universitas Mataram"
          />
        </div>

        <BilingualField
          label="Deskripsi / Subtitle Hero"
          value={data.subtitle || { id: '', en: '' }}
          onChange={(val) => handleChange('subtitle', val)}
          multiline
          rows={3}
          placeholderId="Menghubungkan civitas akademika UNRAM dengan kemitraan global..."
          placeholderEn="Connecting UNRAM academia with worldwide opportunities..."
        />
      </FormSection>

      <FormSection
        title="Tombol Aksi (Call-to-Action) & Gambar Latar"
        description="Teks tombol navigasi cepat dan foto latar belakang hero."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BilingualField
            label="Tombol Utama (CTA 1)"
            value={data.ctaPrimary || { id: '', en: '' }}
            onChange={(val) => handleChange('ctaPrimary', val)}
            placeholderId="Jelajahi Program"
            placeholderEn="Explore Programs"
          />

          <BilingualField
            label="Tombol Kedua (CTA 2)"
            value={data.ctaSecondary || { id: '', en: '' }}
            onChange={(val) => handleChange('ctaSecondary', val)}
            placeholderId="Hubungi Kami"
            placeholderEn="Contact Us"
          />
        </div>

        <ImageField
          label="Foto Latar Belakang Hero (Campus Background)"
          value={data.bgImage || ''}
          onChange={(url) => handleChange('bgImage', url)}
          aspectRatio="wide"
          hint="Gunakan gambar lanskap resolusi tinggi (min. 1600x900px). Gambar otomatis dikompresi menjadi WebP."
        />
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
