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
      className="relative py-20 lg:py-28 bg-unram-950 text-paper border-b border-unram-900 overflow-hidden"
    >
      {/* Ambient Radial Mesh Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.18),transparent_70%)] pointer-events-none" />

      <Container className="relative z-10">
        {/* Section Heading (Light on Dark per DESIGN.md) */}
        <SectionHeading
          kicker={`04 — ${kicker}`}
          title={title}
          subtitle={subtitle}
          light
          className="mb-14 lg:mb-16"
        />

        {/* Four Columns Separated by Vertical Hairlines, No Icons, No Cards (DESIGN.md) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-unram-800/80 divide-y sm:divide-y-0 sm:divide-x divide-unram-800/80 bg-unram-950/40 backdrop-blur-xs">
          {statItems.map((stat, index) => {
            const label = stat.label?.[lang] || stat.label?.id || '';
            const desc = stat.desc?.[lang] || stat.desc?.id || '';

            return (
              <motion.div
                key={stat.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group py-8 sm:py-10 px-6 sm:px-8 text-left flex flex-col justify-start hover:bg-white/[0.025] transition-colors duration-300"
              >
                {/* Metric Index & Decorative Accent Line */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-blue-300/50 font-semibold tracking-widest uppercase">
                    0{index + 1}
                  </span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    className="h-px w-8 bg-gradient-to-r from-accent/80 to-transparent origin-left"
                  />
                </div>

                {/* Newsreader Numeral (DESIGN.md Section 2) */}
                <div className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-normal text-paper tabular-nums leading-none tracking-tight">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={1.8}
                  />
                </div>

                {/* Small Label (Instrument Sans 500) */}
                <h3 className="font-sans font-medium text-sm sm:text-base text-blue-100 mt-5 leading-snug group-hover:text-white transition-colors">
                  {label}
                </h3>

                {/* Description */}
                <p className="text-xs text-blue-300/70 mt-1.5 leading-relaxed group-hover:text-blue-200/90 transition-colors">
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
