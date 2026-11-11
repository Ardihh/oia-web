'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveInternalHref, isLegacyHash } from '@/lib/routes';

interface LegacyHashRedirectProps {
  locale: string;
}

export function LegacyHashRedirect({ locale }: LegacyHashRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawHash = window.location.hash;
    if (rawHash && isLegacyHash(rawHash)) {
      const target = resolveInternalHref(rawHash, locale);
      if (target && target !== window.location.pathname) {
        // Fast instant replace without adding history state
        window.location.replace(target);
      }
    }
  }, [locale, router]);

  return null;
}
