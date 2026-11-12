import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, Check } from 'lucide-react';
import { uploadMedia, mediaUrl } from '@/lib/supabase';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  required?: boolean;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  className?: string;
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
  required = false,
  aspectRatio = 'video',
  className = '',
}: ImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reductionInfo, setReductionInfo] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = mediaUrl(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setReductionInfo(null);

    try {
      const res = await uploadMedia(file, 'images');
      if (res.success && res.publicUrl) {
        onChange(res.publicUrl);
        if (res.reductionPercent && res.reductionPercent > 0) {
          setReductionInfo(`Dikompresi: hemat ${res.reductionPercent}%`);
        }
      } else {
        setUploadError(res.error || 'Gagal mengunggah gambar.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'auto'
      ? 'min-h-[160px]'
      : 'aspect-[16/9]';

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
            placeholder="https://... atau /images/..."
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
            <div className={`relative ${aspectClass} max-w-md w-full bg-slate-100 border border-slate-200 rounded-lg overflow-hidden group`}>
              <img
                src={displayUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-slate-800 text-xs font-medium rounded-md shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`max-w-md w-full ${aspectClass} border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-600">Mengompresi & mengunggah...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Klik untuk unggah gambar</span>
                  <span className="text-[11px] text-slate-400">PNG, WebP, JPG (Otomatis WebP optimal)</span>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {reductionInfo && <p className="text-[11px] text-emerald-600 font-medium">{reductionInfo}</p>}
      {uploadError && <p className="text-[11px] text-rose-600">{uploadError}</p>}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
