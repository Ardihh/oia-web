'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent } from '@/context/ContentContext';

interface AboutProps {
  locale: string;
}

export function About({ locale }: AboutProps) {
  const t = useTranslations('about');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const desc1 = content.about?.description1?.[lang] || t('description1');
  const desc2 = content.about?.description2?.[lang] || t('description2');
  const visionTitle = content.about?.visionTitle?.[lang] || t('visionTitle');
  const visionDesc = content.about?.visionDesc?.[lang] || t('visionDesc');
  const missionTitle = content.about?.missionTitle?.[lang] || t('missionTitle');
  const missionItems =
    Array.isArray(content.about?.missionItems?.[lang]) && content.about.missionItems[lang].length > 0
      ? content.about.missionItems[lang]
      : [
          t('missionItems.0'),
          t('missionItems.1'),
          t('missionItems.2'),
          t('missionItems.3'),
        ];
  const messageQuote = content.about?.messageQuote?.[lang] || t('messageQuote');
  const messageAuthor = content.about?.messageAuthor?.[lang] || t('messageAuthor');
  const messageRole = content.about?.messageRole?.[lang] || t('messageRole');
  const messageOffice = content.about?.messageOffice?.[lang] || t('messageOffice');
  const headPhoto = content.about?.headPhoto || '/images/head-of-office.jpg';

  return (
    <section id="about" className="py-20 lg:py-28 bg-unram-50 border-b border-hairline">
      <Container>
        {/* Section Heading with Numbered Eyebrow (DESIGN.md) */}
        <SectionHeading
          kicker={`02 — ${t('kicker')}`}
          title={content.about?.title?.[lang] || t('title')}
          className="mb-14 lg:mb-16"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Institutional Narrative & Head of Office Pull Quote */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-5 text-base sm:text-lg text-ink-soft leading-[1.65]">
              <p>{desc1}</p>
              <p>{desc2}</p>
            </div>

            {/* Head of Office Message — Pull Quote in Italic Newsreader (DESIGN.md Section 7) */}
            <div className="pt-6 border-t border-hairline">
              <blockquote className="font-serif italic text-lg sm:text-xl text-ink leading-relaxed border-l-2 border-unram-600 pl-4 py-1">
                &ldquo;{messageQuote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3.5 mt-5 pl-4">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-hairline flex-shrink-0 bg-unram-200">
                  <Image
                    src={headPhoto}
                    alt={messageAuthor}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-sm text-ink leading-tight">
                    {messageAuthor}
                  </h4>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {messageRole} &bull; {messageOffice}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Vision & Mission as Plain List with Hairline Separators (DESIGN.md) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="lg:col-span-6 bg-surface p-7 sm:p-9 rounded-[4px] border border-hairline space-y-6"
          >
            {/* Vision */}
            <div className="space-y-2">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-ink">
                {visionTitle}
              </h3>
              <p className="text-sm sm:text-base text-ink-soft leading-[1.65]">
                {visionDesc}
              </p>
            </div>

            {/* Mission List with Hairline Dividers */}
            <div className="pt-4 border-t border-hairline">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-ink mb-4">
                {missionTitle}
              </h3>
              <ul className="divide-y divide-hairline">
                {missionItems.map((item, idx) => (
                  <li key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    <span className="font-serif text-unram-600 text-sm font-normal tabular-nums pt-0.5">
                      0{idx + 1}
                    </span>
                    <span className="text-sm sm:text-base text-ink leading-[1.6]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
