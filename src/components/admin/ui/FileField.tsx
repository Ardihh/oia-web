import React, { useState, useRef } from 'react';
import { FileDown, Upload, X, Loader2, FileText } from 'lucide-react';
import { uploadMedia, mediaUrl } from '@/lib/supabase';

interface FileFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function FileField({
  label,
  value,
  onChange,
  hint,
  required = false,
  className = '',
}: FileFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = mediaUrl(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadMedia(file, 'files');
      if (res.success && res.publicUrl) {
        onChange(res.publicUrl);
      } else {
        setUploadError(res.error || 'Gagal mengunggah berkas.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 tracking-wide">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
        >
          {showManualUrl ? 'Mode Unggah Berkas' : 'Input URL Manual'}
        </button>
      </div>

      {showManualUrl ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... atau /files/..."
            className="flex-1 h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-slate-200 rounded"
            >
              Hapus
            </button>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md max-w-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-slate-800 hover:text-blue-600 truncate block underline"
                  >
                    {value.split('/').pop() || 'Lihat Berkas'}
                  </a>
                  <span className="text-[11px] text-slate-400">Tersimpan di Supabase Storage</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs text-slate-700 hover:bg-white border border-slate-200 rounded transition-colors"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Hapus tautan berkas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="max-w-md border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-md p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Mengunggah dokumen...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Pilih berkas PDF atau dokumen (Maks. 15MB)</span>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {uploadError && <p className="text-[11px] text-rose-600">{uploadError}</p>}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
