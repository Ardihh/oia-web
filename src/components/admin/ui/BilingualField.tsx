import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Field } from './Field';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { translateText } from '@/lib/newsUtils';

interface BilingualFieldProps {
  label: string;
  value: { id: string; en: string };
  onChange: (val: { id: string; en: string }) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
  placeholderId?: string;
  placeholderEn?: string;
  className?: string;
}

export function BilingualField({
  label,
  value = { id: '', en: '' },
  onChange,
  multiline = false,
  rows = 3,
  required = false,
  hint,
  placeholderId = 'Tulis teks dalam Bahasa Indonesia...',
  placeholderEn = 'Enter text in English...',
  className = '',
}: BilingualFieldProps) {
  const [activeLang, setActiveLang] = useState<'id' | 'en'>('id');
  const [translating, setTranslating] = useState(false);

  const idFilled = Boolean(value.id && value.id.trim().length > 0);
  const enFilled = Boolean(value.en && value.en.trim().length > 0);

  const handleTranslate = async () => {
    if (activeLang === 'id' && idFilled) {
      // Translate ID -> EN
      setTranslating(true);
      try {
        const res = await translateText(value.id, 'id', 'en');
        if (res) {
          onChange({ ...value, en: res });
          setActiveLang('en');
        }
      } finally {
        setTranslating(false);
      }
    } else if (activeLang === 'en' && enFilled) {
      // Translate EN -> ID
      setTranslating(true);
      try {
        const res = await translateText(value.en, 'en', 'id');
        if (res) {
          onChange({ ...value, id: res });
          setActiveLang('id');
        }
      } finally {
        setTranslating(false);
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 tracking-wide">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>

        {/* Language Tabs & Auto-translate */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || (activeLang === 'id' ? !idFilled : !enFilled)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title={activeLang === 'id' ? 'Terjemahkan ID ke EN' : 'Terjemahkan EN ke ID'}
          >
            {translating ? (
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-500" />
            )}
            <span>{activeLang === 'id' ? 'Terjemahkan ke EN' : 'Terjemahkan ke ID'}</span>
          </button>

          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => setActiveLang('id')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeLang === 'id'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  idFilled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <span>ID</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('en')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeLang === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  enFilled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <span>EN</span>
            </button>
          </div>
        </div>
      </div>

      {multiline ? (
        <TextArea
          rows={rows}
          value={activeLang === 'id' ? value.id || '' : value.en || ''}
          onChange={(e) =>
            onChange({
              ...value,
              [activeLang]: e.target.value,
            })
          }
          placeholder={activeLang === 'id' ? placeholderId : placeholderEn}
        />
      ) : (
        <TextInput
          value={activeLang === 'id' ? value.id || '' : value.en || ''}
          onChange={(e) =>
            onChange({
              ...value,
              [activeLang]: e.target.value,
            })
          }
          placeholder={activeLang === 'id' ? placeholderId : placeholderEn}
        />
      )}

      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
