'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent } from '@/context/ContentContext';

interface FaqProps {
  locale: string;
}

export function Faq({ locale }: FaqProps) {
  const t = useTranslations('faq');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems =
    Array.isArray(content.faq?.items) && content.faq.items.length > 0
      ? content.faq.items.map((item) => ({
          q: item.q[lang] || item.q.id,
          a: item.a[lang] || item.a.id,
        }))
      : [
          { q: t('items.0.q'), a: t('items.0.a') },
          { q: t('items.1.q'), a: t('items.1.a') },
          { q: t('items.2.q'), a: t('items.2.a') },
          { q: t('items.3.q'), a: t('items.3.a') },
          { q: t('items.4.q'), a: t('items.4.a') },
          { q: t('items.5.q'), a: t('items.5.a') },
        ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-paper border-b border-hairline">
      <Container>
        {/* Numbered Section Heading (DESIGN.md) */}
        <SectionHeading
          kicker={`08 — ${t('kicker')}`}
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-14 lg:mb-16"
        />

        {/* Clean Accordion with Hairline Separators & +/- Indicators (DESIGN.md Section 7) */}
        <div className="max-w-3xl border-t border-hairline divide-y divide-hairline">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-btn-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={index} className="py-2">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(index)}
                  className="w-full py-5 text-left flex items-start justify-between gap-6 group focus-visible:rounded focus-visible:outline-none"
                >
                  <span className="font-serif text-lg sm:text-xl font-normal text-ink group-hover:text-unram-600 transition-colors leading-snug">
                    {item.q}
                  </span>

                  {/* + / - indicator (DESIGN.md Section 7) */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-[4px] border border-hairline flex items-center justify-center text-ink-soft group-hover:text-unram-600 transition-colors mt-0.5">
                    {isOpen ? (
                      <Minus className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pr-10 text-sm sm:text-base text-ink-soft leading-[1.65]">
                        <p>{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
