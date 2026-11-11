'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, FileDown, FileText } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent, defaultGuides, GuideItem, defaultSiteContent } from '@/context/ContentContext';

interface AdmissionProps {
  locale: string;
}

export function Admission({ locale }: AdmissionProps) {
  const t = useTranslations('admission');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';
  const isEn = locale === 'en';

  const guideList: GuideItem[] =
    Array.isArray(content.guides) && content.guides.length > 0
      ? content.guides
      : defaultGuides;

  // Use dynamic steps from ContentContext if available, otherwise fall back to i18n strings
  const sourceSteps = Array.isArray(content.admissionSteps) && content.admissionSteps.length > 0
    ? content.admissionSteps
    : defaultSiteContent.admissionSteps!;

  const steps = sourceSteps.map((step, index) => ({
    num: String(index + 1).padStart(2, '0'),
    title: typeof step.title === 'object' ? (step.title[lang] || step.title.en || step.title.id || '') : String(step.title),
    desc: typeof step.desc === 'object' ? (step.desc[lang] || step.desc.en || step.desc.id || '') : String(step.desc),
  }));

  const getField = (field: any) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return field[lang] || field.id || field.en || '';
    }
    return String(field);
  };

  return (
    <section id="admission" className="py-20 lg:py-28 bg-paper border-b border-hairline">
      <Container>
        {/* Numbered Section Heading (DESIGN.md) */}
        <SectionHeading
          kicker={`07 — ${t('kicker')}`}
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-16 lg:mb-20"
        />

        {/* Numbered Horizontal Sequence with Thin Connecting Line (DESIGN.md Section 7) */}
        <div className="relative">
          {/* Thin connecting hairline on desktop */}
          <div className="hidden lg:block absolute top-6 left-10 right-10 h-[1px] bg-hairline z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="flex flex-col text-left space-y-3"
              >
                {/* Step Number Box (DESIGN.md: 4px radius, hairline border, no shadow) */}
                <div className="w-12 h-12 rounded-[4px] border border-hairline bg-surface flex items-center justify-center font-serif text-lg font-normal text-unram-600 tabular-nums">
                  {step.num}
                </div>

                {/* Step Title in Newsreader */}
                <h3 className="font-serif text-xl font-normal text-ink leading-snug pt-1">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-ink-soft leading-[1.65]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Downloadable Guidebooks Section (Set via Admin CMS) */}
        <div className="mt-16 pt-12 border-t border-hairline">
          <div className="mb-8">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-1.5">
              {isEn ? 'Official Publications & Resources' : 'Pusat Unduhan & Dokumen Resmi'}
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
              {isEn ? 'Downloadable Handbooks & Guidelines' : 'Buku Panduan & Formulir Resmi KUI UNRAM'}
            </h3>
            <p className="text-sm text-ink-soft mt-1 max-w-[64ch]">
              {isEn
                ? 'Official handbooks for prospective international students, outgoing exchange awardees, and visiting researchers.'
                : 'Unduh dokumen pedoman resmi untuk mahasiswa asing, peserta program mobilitas luar negeri, dan peneliti internasional.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guideList.map((guide, idx) => {
              const guideTitle = getField(guide.title);
              const guideCategory = getField(guide.category);
              const guideDesc = getField(guide.desc);

              return (
                <motion.div
                  key={guide.id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="rounded-[4px] border border-hairline bg-surface p-6 flex flex-col justify-between hover:border-unram-400 transition-colors group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-unram-600">
                        {guideCategory || 'Dokumen'}
                      </span>
                      <span className="text-xs font-mono text-ink-soft px-2 py-0.5 rounded-[4px] bg-unram-50 border border-hairline">
                        {guide.fileSize || 'PDF'}
                      </span>
                    </div>

                    <h4 className="font-serif text-lg sm:text-xl font-normal text-ink group-hover:text-unram-600 transition-colors leading-snug">
                      {guideTitle}
                    </h4>

                    <p className="text-xs sm:text-sm text-ink-soft leading-[1.6]">
                      {guideDesc}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-hairline flex items-center justify-between">
                    <span className="text-xs text-ink-soft font-normal">
                      {guide.updatedAt ? `Update: ${guide.updatedAt}` : 'Terbaru 2026'}
                    </span>

                    {guide.fileUrl &&
                    guide.fileUrl.trim() !== '' &&
                    !guide.fileUrl.startsWith('https://io.unram.ac.id') &&
                    guide.fileUrl !== '#contact' ? (
                      <a
                        href={guide.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={guideTitle}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-unram-50 hover:bg-unram-100 border border-hairline text-unram-600 text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Download' : 'Unduh File'}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-ink-soft italic">
                        {isEn ? 'Available on request' : 'Tersedia via narahubung'}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
