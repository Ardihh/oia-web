'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent } from '@/context/ContentContext';
import { resolveInternalHref } from '@/lib/routes';

interface ServicesProps {
  locale: string;
}

export function Services({ locale }: ServicesProps) {
  const t = useTranslations('services');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const servicesConfig = content?.services;
  const kicker = servicesConfig?.kicker?.[lang] || t('kicker');
  const title = servicesConfig?.title?.[lang] || t('title');
  const subtitle = servicesConfig?.subtitle?.[lang] || t('subtitle');
  const servicesList = Array.isArray(servicesConfig?.items) ? servicesConfig.items : [];

  return (
    <section id="services" className="py-20 lg:py-28 bg-paper border-b border-hairline">
      <Container>
        {/* Numbered Section Heading (DESIGN.md) */}
        <SectionHeading
          kicker={`03 — ${kicker}`}
          title={title}
          subtitle={subtitle}
          className="mb-14 lg:mb-16"
        />

        {/* Vertical List of Rows separated by Hairlines (DESIGN.md Section 7) */}
        <div className="border-y border-hairline divide-y divide-hairline">
          {servicesList.slice(0, 6).map((service, index) => {
            const itemTitle = service.title?.[lang] || service.title?.id || '';
            const desc = service.desc?.[lang] || service.desc?.id || '';
            const href = resolveInternalHref(service.href || '#contact', locale);
            const numStr = String(index + 1).padStart(2, '0');

            return (
              <motion.a
                key={service.id || index}
                href={href}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group flex flex-col md:flex-row md:items-center justify-between py-6 lg:py-8 px-4 -mx-4 hover:bg-unram-50 transition-colors rounded-[4px]"
              >
                {/* Number + Title + Description */}
                <div className="flex items-start md:items-baseline gap-4 sm:gap-8 flex-1">
                  <span className="font-serif text-unram-600 text-lg sm:text-xl font-normal tabular-nums w-8 flex-shrink-0 pt-0.5 md:pt-0">
                    {numStr}
                  </span>
                  <div className="flex-1 space-y-1.5 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 md:items-baseline">
                    <h3 className="font-serif text-xl sm:text-2xl font-normal text-ink group-hover:text-unram-600 transition-colors md:col-span-5">
                      {itemTitle}
                    </h3>
                    <p className="text-sm sm:text-base text-ink-soft leading-normal md:col-span-7">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Arrow Glyph shifted 2px on hover (DESIGN.md Section 6) */}
                <div className="mt-3 md:mt-0 flex items-center justify-end pl-12 md:pl-6 text-unram-600 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
