import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormSection, BilingualField, TextInput, ImageField, SaveBar, ConfirmDialog } from '../ui';
import { saveLiveSection } from '@/lib/supabase';

interface AboutSectionProps {
  initialData: any;
  version: number;
  onSaved: (newVersion: number) => void;
  showToast: (msg: string, onUndo?: () => void) => void;
}

export function AboutSection({
  initialData,
  version,
  onSaved,
  showToast,
}: AboutSectionProps) {
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

  const handleMissionChange = (index: number, lang: 'id' | 'en', text: string) => {
    const currentItems = data.missionItems || { id: [], en: [] };
    const nextId = [...(currentItems.id || [])];
    const nextEn = [...(currentItems.en || [])];

    if (lang === 'id') nextId[index] = text;
    if (lang === 'en') nextEn[index] = text;

    handleChange('missionItems', { id: nextId, en: nextEn });
  };

  const handleAddMission = () => {
    const currentItems = data.missionItems || { id: [], en: [] };
    handleChange('missionItems', {
      id: [...(currentItems.id || []), 'Poin misi baru'],
      en: [...(currentItems.en || []), 'New mission point'],
    });
  };

  const handleRemoveMission = (index: number) => {
    const currentItems = data.missionItems || { id: [], en: [] };
    handleChange('missionItems', {
      id: (currentItems.id || []).filter((_: any, i: number) => i !== index),
      en: (currentItems.en || []).filter((_: any, i: number) => i !== index),
    });
  };

  const handleDiscard = () => {
    setData(savedSnapshot);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousSnapshot = { ...savedSnapshot };

    const res = await saveLiveSection('about', data, version);
    setIsSaving(false);

    if (res.success) {
      setSavedSnapshot(data);
      setIsDirty(false);
      onSaved(res.version || version + 1);

      showToast('Seksi Profil & Visi Misi tersimpan dan langsung tayang.', async () => {
        await saveLiveSection('about', previousSnapshot);
        setData(previousSnapshot);
        setSavedSnapshot(previousSnapshot);
        setIsDirty(false);
      });
    } else if (res.conflict) {
      setConflictModal(res.error || 'Terjadi konflik versi di server.');
    } else {
      alert(res.error || 'Gagal menyimpan seksi profil.');
    }
  };

  const missionListId = data.missionItems?.id || [];
  const missionListEn = data.missionItems?.en || [];
  const maxMissionLength = Math.max(missionListId.length, missionListEn.length);

  return (
    <div className="space-y-6">
      <FormSection
        title="Pengantar & Deskripsi Kantor"
        description="Informasi umum mengenai peran strategis Kantor Urusan Internasional UNRAM."
      >
        <BilingualField
          label="Label Kicker"
          value={data.kicker || { id: '', en: '' }}
          onChange={(val) => handleChange('kicker', val)}
          placeholderId="Tentang Kami"
          placeholderEn="About Us"
        />

        <BilingualField
          label="Judul Bagian Profil"
          value={data.title || { id: '', en: '' }}
          onChange={(val) => handleChange('title', val)}
          placeholderId="Menghubungkan Universitas Mataram dengan Komunitas Akademik Global"
          placeholderEn="Connecting Universitas Mataram with the Global Academic Community"
        />

        <BilingualField
          label="Paragraf Deskripsi 1"
          value={data.description1 || { id: '', en: '' }}
          onChange={(val) => handleChange('description1', val)}
          multiline
          rows={3}
        />

        <BilingualField
          label="Paragraf Deskripsi 2"
          value={data.description2 || { id: '', en: '' }}
          onChange={(val) => handleChange('description2', val)}
          multiline
          rows={3}
        />
      </FormSection>

      <FormSection
        title="Visi & Misi Strategis"
        description="Rumusan visi institusi dan butir-butir misi internasionalisasi."
      >
        <BilingualField
          label="Judul Visi"
          value={data.visionTitle || { id: '', en: '' }}
          onChange={(val) => handleChange('visionTitle', val)}
        />

        <BilingualField
          label="Uraian Visi"
          value={data.visionDesc || { id: '', en: '' }}
          onChange={(val) => handleChange('visionDesc', val)}
          multiline
          rows={2}
        />

        <BilingualField
          label="Judul Misi"
          value={data.missionTitle || { id: '', en: '' }}
          onChange={(val) => handleChange('missionTitle', val)}
        />

        {/* Mission items list */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Daftar Poin Misi</span>
            <button
              type="button"
              onClick={handleAddMission}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Poin Misi</span>
            </button>
          </div>

          {Array.from({ length: maxMissionLength }).map((_, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Misi #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMission(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus Misi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={missionListId[idx] || ''}
                  onChange={(e) => handleMissionChange(idx, 'id', e.target.value)}
                  placeholder="Misi (Bahasa Indonesia)..."
                  className="h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={missionListEn[idx] || ''}
                  onChange={(e) => handleMissionChange(idx, 'en', e.target.value)}
                  placeholder="Mission point (English)..."
                  className="h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Sambutan Kepala Kantor"
        description="Kutipan pesan sambutan dan foto resmi Kepala Kantor Urusan Internasional."
      >
        <BilingualField
          label="Judul Bagian Pesan"
          value={data.messageTitle || { id: '', en: '' }}
          onChange={(val) => handleChange('messageTitle', val)}
          placeholderId="Pesan Kepala Kantor"
          placeholderEn="Message from the Head of Office"
        />

        <BilingualField
          label="Kutipan Pesan (Quote)"
          value={data.messageQuote || { id: '', en: '' }}
          onChange={(val) => handleChange('messageQuote', val)}
          multiline
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BilingualField
            label="Nama Lengkap & Gelar"
            value={data.messageAuthor || { id: '', en: '' }}
            onChange={(val) => handleChange('messageAuthor', val)}
          />

          <BilingualField
            label="Jabatan"
            value={data.messageRole || { id: '', en: '' }}
            onChange={(val) => handleChange('messageRole', val)}
          />

          <BilingualField
            label="Instansi"
            value={data.messageOffice || { id: '', en: '' }}
            onChange={(val) => handleChange('messageOffice', val)}
          />
        </div>

        <ImageField
          label="Foto Resmi Kepala Kantor"
          value={data.headPhoto || ''}
          onChange={(url) => handleChange('headPhoto', url)}
          aspectRatio="square"
          hint="Gunakan foto potret resmi persegi atau 3:4."
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
