'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  locale: string;
}

export function ShareButton({ title, locale }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const isEn = locale === 'en';

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall back to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-hairline bg-surface text-xs font-medium text-ink-soft hover:text-ink transition-colors"
      aria-label={isEn ? 'Share article' : 'Bagikan artikel'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-700">{isEn ? 'Link Copied!' : 'Tautan Disalin!'}</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>{isEn ? 'Share' : 'Bagikan'}</span>
        </>
      )}
    </button>
  );
}
