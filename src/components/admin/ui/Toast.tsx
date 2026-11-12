import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onUndo?: () => void;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || (toast.onUndo ? 15000 : 4000);
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`p-3.5 rounded-lg border shadow-lg flex items-start gap-3 ${
          isSuccess
            ? 'bg-slate-900 text-white border-slate-800'
            : isError
            ? 'bg-rose-900 text-white border-rose-800'
            : 'bg-slate-800 text-white border-slate-700'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        ) : null}

        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
          {toast.onUndo && (
            <button
              type="button"
              onClick={() => {
                toast.onUndo?.();
                onClose();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Urungkan (15 detik)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
