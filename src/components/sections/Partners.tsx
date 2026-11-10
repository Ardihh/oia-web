'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface PartnersProps {
  locale: string;
}

export function Partners({ locale }: PartnersProps) {
  const t = useTranslations('partners');

  const partnerLogos = [
    { id: 1, file: '/partners/partner-1.svg', alt: 'TODO: replace (Partner University 1)' },
    { id: 2, file: '/partners/partner-2.svg', alt: 'TODO: replace (Partner University 2)' },
    { id: 3, file: '/partners/partner-3.svg', alt: 'TODO: replace (Partner University 3)' },
    { id: 4, file: '/partners/partner-4.svg', alt: 'TODO: replace (Partner University 4)' },
    { id: 5, file: '/partners/partner-5.svg', alt: 'TODO: replace (Partner University 5)' },
    { id: 6, file: '/partners/partner-6.svg', alt: 'TODO: replace (Partner University 6)' },
  ];

  return (
    <section id="partners" className="py-20 lg:py-28 bg-paper border-b border-hairline">
      <Container>
        {/* Section Heading with Numbered Eyebrow (DESIGN.md) */}
        <SectionHeading
          kicker={`05 — ${t('kicker')}`}
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-14 lg:mb-16"
        />

        {/* Hairline-Bordered Grid of Logos (DESIGN.md Section 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {partnerLogos.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="group p-5 rounded-[4px] bg-surface border border-hairline hover:border-unram-400 transition-colors flex items-center justify-center min-h-[100px]"
            >
              <div className="relative w-full h-10 flex items-center justify-center grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200">
                <Image
                  src={partner.file}
                  alt={partner.alt}
                  width={160}
                  height={50}
                  className="object-contain max-h-9 w-auto"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Single Line Listing Countries (DESIGN.md Section 7) */}
        <p className="text-xs text-ink-soft mt-6 font-normal tracking-wide text-left">
          {locale === 'en'
            ? 'Active institutional partnerships spanning Australia, Japan, Germany, Malaysia, United Kingdom, United States, and 20+ countries.'
            : 'Kemitraan institusi aktif di Australia, Jepang, Jerman, Malaysia, Inggris, Amerika Serikat, dan 20+ negara mitra lainnya.'}
        </p>

        {/* Quiet Editorial Partnership Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-[4px] bg-unram-50 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg sm:text-xl font-normal text-ink">
              {t('becomePartnerTitle')}
            </h3>
            <p className="text-sm text-ink-soft max-w-xl">
              {t('becomePartnerDesc')}
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-unram-600 text-unram-600 hover:bg-unram-100 bg-transparent text-xs font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
          >
            <span>{t('becomePartnerBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>
    </section>
  );
}
