'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useSiteContent } from '@/context/ContentContext';

interface ImpactStatsProps {
  locale: string;
}

export function ImpactStats({ locale }: ImpactStatsProps) {
  const t = useTranslations('stats');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const statsConfig = content?.stats;
  const kicker = statsConfig?.kicker?.[lang] || t('kicker');
  const title = statsConfig?.title?.[lang] || t('title');
  const subtitle = statsConfig?.subtitle?.[lang] || t('subtitle');
  const statItems = Array.isArray(statsConfig?.items) ? statsConfig.items : [];

  return (
    <section
      id="stats"
      aria-label="Impact Statistics"
      className="py-20 lg:py-28 bg-unram-950 text-paper border-b border-unram-900"
    >
      <Container>
        {/* Section Heading (Light on Dark per DESIGN.md) */}
        <SectionHeading
          kicker={`04 — ${kicker}`}
          title={title}
          subtitle={subtitle}
          light
          className="mb-14 lg:mb-16"
        />

        {/* Four Columns Separated by Vertical Hairlines, No Icons, No Cards (DESIGN.md) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-unram-800/80 divide-y sm:divide-y-0 sm:divide-x divide-unram-800/80">
          {statItems.map((stat, index) => {
            const label = stat.label?.[lang] || stat.label?.id || '';
            const desc = stat.desc?.[lang] || stat.desc?.id || '';

            return (
              <motion.div
                key={stat.id || index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="py-8 sm:py-10 px-6 sm:px-8 text-left flex flex-col justify-start"
              >
                {/* Newsreader Numeral Count-Up Animation */}
                <div className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-normal text-paper tabular-nums leading-none tracking-tight">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={1.5}
                  />
                </div>

                {/* Small Label (Instrument Sans 500) */}
                <h3 className="font-sans font-medium text-sm sm:text-base text-blue-100 mt-4 leading-snug">
                  {label}
                </h3>

                {/* Description */}
                <p className="text-xs text-blue-300/80 mt-1 leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
