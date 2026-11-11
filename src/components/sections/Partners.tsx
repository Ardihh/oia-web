'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultPartners } from '@/context/ContentContext';
import { resolveInternalHref } from '@/lib/routes';

interface PartnersProps {
  locale: string;
}

export function Partners({ locale }: PartnersProps) {
  const t = useTranslations('partners');
  const { content, mediaUrl } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const partnersData = content.partners || defaultPartners;
  const partnerList = Array.isArray(partnersData.items) && partnersData.items.length > 0
    ? partnersData.items
    : defaultPartners.items;

  const kickerText = partnersData.kicker?.[lang] || t('kicker');
  const titleText = partnersData.title?.[lang] || t('title');
  const subtitleText = partnersData.subtitle?.[lang] || t('subtitle');
  const summaryText = partnersData.summary?.[lang] || (
    locale === 'en'
      ? 'Active institutional partnerships spanning Australia, Japan, Germany, Malaysia, United Kingdom, United States, and 20+ countries.'
      : 'Kemitraan institusi aktif di Australia, Jepang, Jerman, Malaysia, Inggris, Amerika Serikat, dan 20+ negara mitra lainnya.'
  );

  const becomeTitle = partnersData.becomePartnerTitle?.[lang] || t('becomePartnerTitle');
  const becomeDesc = partnersData.becomePartnerDesc?.[lang] || t('becomePartnerDesc');
  const becomeBtn = partnersData.becomePartnerBtn?.[lang] || t('becomePartnerBtn');
  const becomeUrl = resolveInternalHref(partnersData.becomePartnerUrl || '#contact', locale);

  return (
    <section id="partners" className="py-20 lg:py-28 bg-paper border-b border-hairline">
      <Container>
        {/* Section Heading with Numbered Eyebrow (DESIGN.md) */}
        <SectionHeading
          kicker={`05 — ${kickerText}`}
          title={titleText}
          subtitle={subtitleText}
          className="mb-14 lg:mb-16"
        />

        {/* Hairline-Bordered Grid of Logos (DESIGN.md Section 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {partnerList.map((partner, index) => {
            const logoSrc = mediaUrl(partner.logo);
            const logoContent = (
              <div className="relative w-full h-10 flex items-center justify-center grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200">
                <Image
                  src={logoSrc}
                  alt={partner.name || `Partner University ${index + 1}`}
                  width={160}
                  height={50}
                  className="object-contain max-h-9 w-auto"
                />
              </div>
            );

            return (
              <motion.div
                key={partner.id || index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group p-5 rounded-[4px] bg-surface border border-hairline hover:border-unram-400 transition-colors flex items-center justify-center min-h-[100px]"
                title={partner.name ? `${partner.name}${partner.country ? ` (${partner.country})` : ''}` : undefined}
              >
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    aria-label={partner.name}
                  >
                    {logoContent}
                  </a>
                ) : (
                  logoContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Single Line Listing Countries (DESIGN.md Section 7) */}
        <p className="text-xs text-ink-soft mt-6 font-normal tracking-wide text-left">
          {summaryText}
        </p>

        {/* Quiet Editorial Partnership Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-[4px] bg-unram-50 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg sm:text-xl font-normal text-ink">
              {becomeTitle}
            </h3>
            <p className="text-sm text-ink-soft max-w-xl">
              {becomeDesc}
            </p>
          </div>

          <a
            href={becomeUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-unram-600 text-unram-600 hover:bg-unram-100 bg-transparent text-xs font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
          >
            <span>{becomeBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>
    </section>
  );
}
