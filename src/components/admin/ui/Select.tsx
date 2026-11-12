import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-10 px-3 text-sm text-slate-800 bg-white border rounded-md transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/15 hover:border-slate-400'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
