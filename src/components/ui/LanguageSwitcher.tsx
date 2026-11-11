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
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname || '/';
    const search = window.location.search || '';
    const hash = window.location.hash || '';

    // Split pathname into segments, e.g. ["en", "news"] or ["id"]
    const segments = pathname.split('/').filter(Boolean);

    let newPath = '';
    if (segments.length > 0 && (segments[0] === 'en' || segments[0] === 'id')) {
      segments[0] = newLocale;
      newPath = '/' + segments.join('/');
      // Preserve trailing slash if original pathname had one
      if (pathname.endsWith('/') && !newPath.endsWith('/')) {
        newPath += '/';
      }
    } else {
      // If there is no locale prefix in pathname (e.g. "/" or "/news")
      newPath = `/${newLocale}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    }

    window.location.href = `${newPath}${search}${hash}`;
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

