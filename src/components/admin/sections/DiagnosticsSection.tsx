import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { FormSection } from '../ui';
import { runSupabaseDiagnostics, DiagnosticItem } from '@/lib/supabase';

export function DiagnosticsSection() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runSupabaseDiagnostics();
      setItems(results);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      <FormSection
        title="Pemeriksaan Kesehatan & Keamanan Sistem (Diagnostics)"
        description="Verifikasi otomatis terhadap koneksi basis data Supabase, tabel live editing, izin akses storage, serta kebijakan keamanan RLS."
        action={
          <button
            type="button"
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Jalankan Diagnostik Ulang</span>
          </button>
        }
      >
        <div className="space-y-3">
          {items.map((item) => {
            const isSuccess = item.status === 'success';
            const isFailure = item.status === 'failure';
            const isPending = item.status === 'pending';

            return (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isFailure ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold text-slate-800">{item.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFailure
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.details}</p>
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
