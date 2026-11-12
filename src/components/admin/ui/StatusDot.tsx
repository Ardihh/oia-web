import React from 'react';

export type StatusVariant = 'published' | 'draft' | 'scheduled' | 'error' | 'neutral';

interface StatusDotProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<StatusVariant, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  published: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    defaultLabel: 'Terbit',
  },
  draft: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    defaultLabel: 'Draf',
  },
  scheduled: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    defaultLabel: 'Terjadwal',
  },
  error: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    defaultLabel: 'Bermasalah',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    defaultLabel: 'Netral',
  },
};

export function StatusDot({ status, label, className = '' }: StatusDotProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
  const displayLabel = label || cfg.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
