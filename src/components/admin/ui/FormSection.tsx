import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  action,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}
