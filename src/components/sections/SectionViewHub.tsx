'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';
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

interface TabDef {
  key: SectionTabKey;
  labelId: string;
  labelEn: string;
}

const SECTION_DEFS: TabDef[] = [
  { key: 'about', labelId: 'Profil & Misi', labelEn: 'About & Mission' },
  { key: 'services', labelId: 'Layanan KUI', labelEn: 'Services' },
  { key: 'stats', labelId: 'Statistik', labelEn: 'Impact Stats' },
  { key: 'partners', labelId: 'Mitra Global', labelEn: 'Global Partners' },
  { key: 'news', labelId: 'Berita & Agenda', labelEn: 'News & Events' },
  { key: 'admission', labelId: 'Penerimaan & Panduan', labelEn: 'Admission & Guidelines' },
  { key: 'faq', labelId: 'Tanya Jawab', labelEn: 'FAQ' },
  { key: 'contact', labelId: 'Kontak & Lokasi', labelEn: 'Contact & Office' },
];

export function SectionViewHub({ locale }: SectionViewHubProps) {
  const isEn = locale === 'en';
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

  // Determine Next and Previous Section for the bottom pager
  const currentIdx = SECTION_DEFS.findIndex((s) => s.key === activeSection);
  const prevSection = currentIdx > 0 ? SECTION_DEFS[currentIdx - 1] : null;
  const nextSection = currentIdx < SECTION_DEFS.length - 1 ? SECTION_DEFS[currentIdx + 1] : null;

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

      {/* Bottom Pager: Allows smooth progression to next/prev section without scrolling back to top */}
      <div className="bg-paper border-t border-hairline py-6">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(prevSection.key, true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] border border-hairline bg-surface hover:bg-unram-50 hover:border-unram-300 text-ink text-xs font-medium transition-colors w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {isEn ? 'Previous:' : 'Sebelumnya:'}{' '}
                  <strong>{isEn ? prevSection.labelEn : prevSection.labelId}</strong>
                </span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextSection && (
              <button
                type="button"
                onClick={() => handleSelectSection(nextSection.key, true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-unram-900 hover:bg-unram-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors w-full sm:w-auto justify-center shadow-subtle"
              >
                <span>
                  {isEn ? 'Next:' : 'Lanjut ke:'}{' '}
                  {isEn ? nextSection.labelEn : nextSection.labelId}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
