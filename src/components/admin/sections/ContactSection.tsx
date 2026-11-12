import React, { useState, useEffect } from 'react';
import { FormSection, BilingualField, TextInput, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';
import { isValidGoogleMapsEmbedUrl } from '@/lib/domPurify';

interface ContactSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function ContactSection({
  initialData,
  version,
  onSaved,
  showToast,
}: ContactSectionProps) {
  const [data, setData] = useState(initialData || {});
  const [savedSnapshot, setSavedSnapshot] = useState(initialData || {});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
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

    if (field === 'googleMapsEmbed') {
      if (val && !isValidGoogleMapsEmbedUrl(val)) {
        setMapError('URL Google Maps embed tidak valid. Harus diawali dengan https://www.google.com/maps/embed.');
      } else {
        setMapError(null);
      }
    }
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
    setMapError(null);
  };

  const handleSave = async () => {
    if (data.googleMapsEmbed && !isValidGoogleMapsEmbedUrl(data.googleMapsEmbed)) {
      alert('Tautan embed Google Maps tidak valid.');
      return;
    }

    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('contact', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi Kontak & Peta tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('contact', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi kontak.');
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar Narahubung"
        description="Judul dan subjudul pada bagian footer narahubung."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Kontak & Lokasi"
          placeholderEn="Contact & Location"
        />

        <BilingualField
          label="Judul Utama"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Hubungi Kantor Urusan Internasional"
          placeholderEn="Get in Touch with OIA"
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
        title="Saluran Komunikasi & Jam Operasional"
        description="Alamat email resmi, nomor telepon, dan jam pelayanan kantor."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alamat Email Resmi
            </label>
            <TextInput
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="oia@unram.ac.id"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nomor Telepon Kantor
            </label>
            <TextInput
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+62 370 633007"
            />
          </div>
        </div>

        <BilingualField
          label="Alamat Fisik Kantor"
          value={data.address || { id: '', en: '' }}
          onChange={(val) => handleChange('address', val)}
          multiline
          rows={2}
          placeholderId="Gedung Rektorat Lantai 1, Jl. Majapahit No. 62, Mataram, NTB"
          placeholderEn="Rectorate Building 1st Floor, Jl. Majapahit No. 62, Mataram, West Nusa Tenggara"
        />

        <BilingualField
          label="Jam Pelayanan Kantor"
          value={data.officeHours || { id: '', en: '' }}
          onChange={(val) => handleChange('officeHours', val)}
          placeholderId="Senin - Jumat: 08.00 - 16.00 WITA"
          placeholderEn="Monday - Friday: 08:00 AM - 04:00 PM (GMT+8)"
        />
      </FormSection>

      <FormSection
        title="Peta Lokasi Google Maps"
        description="Tautan semat (embed iframe URL) untuk lokasi Gedung Rektorat UNRAM."
      >
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Google Maps Embed URL
          </label>
          <TextInput
            value={data.googleMapsEmbed || ''}
            onChange={(e) => handleChange('googleMapsEmbed', e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
            error={Boolean(mapError)}
          />
          {mapError ? (
            <p className="text-[11px] text-rose-600 mt-1">{mapError}</p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Hanya tautan embed resmi (https://www.google.com/maps/embed) yang diizinkan.
            </p>
          )}
        </div>

        {data.googleMapsEmbed && !mapError && (
          <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-200 mt-2 bg-slate-100">
            <iframe
              src={data.googleMapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
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
