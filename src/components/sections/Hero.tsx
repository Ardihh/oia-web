'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { useSiteContent } from '@/context/ContentContext';

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const t = useTranslations('hero');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const badge = content.hero.badge[lang] || t('badge');
  const titlePrefix = content.hero.titlePrefix[lang] || t('titlePrefix');
  const titleHighlight = content.hero.titleHighlight[lang] || t('titleHighlight');
  const subtitle = content.hero.subtitle[lang] || t('subtitle');
  const ctaStudy = content.hero.ctaStudy[lang] || t('ctaStudy');
  const ctaPartner = content.hero.ctaPartner[lang] || t('ctaPartner');
  const bgImage = content.hero.bgImage || '/images/hero-campus.jpg';

  const handleHeroNav = (e: React.MouseEvent<HTMLAnchorElement>, targetKey: string) => {
    if (typeof window !== 'undefined') {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('unram_navigate_section', { detail: targetKey })
      );
    }
  };

  return (
    <section
      id="hero"
      aria-label="Hero"
      className="py-16 sm:py-24 lg:py-28 bg-paper border-b border-hairline"
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 text-left space-y-6 sm:space-y-8">
            {/* Eyebrow Label with Number (DESIGN.md) */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] text-ink-soft"
            >
              01 — {badge}
            </motion.p>

            {/* Display Headline: Newsreader with 1 Italic word emphasis */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="font-serif text-3xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-normal text-ink leading-[1.08] tracking-[-0.02em]"
            >
              {titlePrefix}{' '}
              <em className="italic font-serif font-normal text-unram-600 not-italic-fallback">
                {titleHighlight}
              </em>
            </motion.h1>

            {/* Subtitle / Lead Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-base sm:text-lg text-ink-soft leading-[1.65] max-w-[56ch]"
            >
              {subtitle}
            </motion.p>

            {/* Two Action Buttons (DESIGN.md Section 6) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
            >
              <a
                href="#admission"
                onClick={(e) => handleHeroNav(e, 'admission')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors"
              >
                <span>{ctaStudy}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#contact"
                onClick={(e) => handleHeroNav(e, 'contact')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[6px] border border-unram-600 text-unram-600 hover:bg-unram-50 bg-transparent font-semibold text-sm transition-colors"
              >
                <span>{ctaPartner}</span>
              </a>
            </motion.div>
          </div>

          {/* Right Column: Tall 4:5 Real Campus Photo (DESIGN.md) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[4/5] w-full rounded-[4px] border border-hairline overflow-hidden bg-unram-100">
              <Image
                src={bgImage}
                alt={locale === 'en' ? 'Universitas Mataram International Affairs Office Campus' : 'Gedung Kantor Urusan Internasional Universitas Mataram'}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-ink-soft mt-2.5 font-normal tracking-wide">
              {locale === 'en'
                ? 'Universitas Mataram Rectorate & International Affairs Office, Lombok'
                : 'Gedung Rektorat & Kantor Urusan Internasional Universitas Mataram, Lombok'}
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
