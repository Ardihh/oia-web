import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-10 px-3 text-sm text-slate-800 bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/15 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
