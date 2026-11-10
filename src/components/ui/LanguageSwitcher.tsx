'use client';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const currentLocale = useLocale();

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    window.location.href = `/${newLocale}/${hash}`;
  };

  return (
    <div
      className={cn('inline-flex items-center gap-1.5 text-xs tracking-wider', className)}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={cn(
          'transition-all duration-150 focus-visible:rounded',
          currentLocale === 'en'
            ? 'font-semibold text-ink underline underline-offset-4 decoration-2 decoration-unram-600'
            : 'font-normal text-ink-soft hover:text-ink'
        )}
        aria-pressed={currentLocale === 'en'}
        aria-label="Select English"
      >
        EN
      </button>
      <span className="text-hairline font-light" aria-hidden="true">/</span>
      <button
        type="button"
        onClick={() => switchLocale('id')}
        className={cn(
          'transition-all duration-150 focus-visible:rounded',
          currentLocale === 'id'
            ? 'font-semibold text-ink underline underline-offset-4 decoration-2 decoration-unram-600'
            : 'font-normal text-ink-soft hover:text-ink'
        )}
        aria-pressed={currentLocale === 'id'}
        aria-label="Pilih Bahasa Indonesia"
      >
        ID
      </button>
    </div>
  );
}

