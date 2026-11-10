'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { About } from '@/components/sections/About';
import { Services } from '@/components/sections/Services';
import { ImpactStats } from '@/components/sections/ImpactStats';
import { Partners } from '@/components/sections/Partners';
import { News } from '@/components/sections/News';
import { Admission } from '@/components/sections/Admission';
import { Faq } from '@/components/sections/Faq';
import { Contact } from '@/components/sections/Contact';

export type SectionTabKey =
  | 'about'
  | 'services'
  | 'stats'
  | 'partners'
  | 'news'
  | 'admission'
  | 'faq'
  | 'contact';

interface SectionViewHubProps {
  locale: string;
}


export function SectionViewHub({ locale }: SectionViewHubProps) {
  const hubRef = useRef<HTMLDivElement>(null);

  // Active section controlled directly by the top navbar
  const [activeSection, setActiveSection] = useState<SectionTabKey>('about');

  const handleSelectSection = (key: SectionTabKey, shouldScroll = true) => {
    setActiveSection(key);

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${key}`);
      window.dispatchEvent(
        new CustomEvent('unram_active_section_changed', { detail: key })
      );

      if (shouldScroll && hubRef.current) {
        const yOffset = -76; // Account for 72px sticky navbar + 4px breathing room
        const y = hubRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  // Sync with URL Hash on Mount and HashChange
  useEffect(() => {
    const parseHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (!hash) return;

      const validKeys: SectionTabKey[] = [
        'about',
        'services',
        'stats',
        'partners',
        'news',
        'admission',
        'faq',
        'contact',
      ];

      if (validKeys.includes(hash as SectionTabKey)) {
        setActiveSection(hash as SectionTabKey);
        window.dispatchEvent(
          new CustomEvent('unram_active_section_changed', { detail: hash })
        );
      }
    };

    parseHash();

    const handleHashChange = () => parseHash();
    const handleCustomNav = (e: any) => {
      const target = e.detail as SectionTabKey;
      if (target) {
        handleSelectSection(target, true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('unram_navigate_section', handleCustomNav);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('unram_navigate_section', handleCustomNav);
    };
  }, []);

  return (
    <div id="section-hub" ref={hubRef} className="w-full relative scroll-mt-20">
      {/* Active Section Body with smooth crossfade animation - No redundant second menu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          {activeSection === 'about' && <About locale={locale} />}
          {activeSection === 'services' && <Services locale={locale} />}
          {activeSection === 'stats' && <ImpactStats locale={locale} />}
          {activeSection === 'partners' && <Partners locale={locale} />}
          {activeSection === 'news' && <News locale={locale} />}
          {activeSection === 'admission' && <Admission locale={locale} />}
          {activeSection === 'faq' && <Faq locale={locale} />}
          {activeSection === 'contact' && <Contact locale={locale} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
