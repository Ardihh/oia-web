'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { useSiteContent } from '@/context/ContentContext';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tContact = useTranslations('contact');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';
  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/';

  const addressContent =
    (lang === 'en'
      ? content?.contact?.addressContent?.en || content?.contact?.addressContent?.id
      : content?.contact?.addressContent?.id || content?.contact?.addressContent?.en) ||
    tContact('info.addressContent');
  const emailValue = content?.contact?.emailValue || tContact('info.emailValue');
  const phoneValue = content?.contact?.phoneValue || tContact('info.phoneValue');
  const hoursValue =
    (lang === 'en'
      ? content?.contact?.hoursValue?.en || content?.contact?.hoursValue?.id
      : content?.contact?.hoursValue?.id || content?.contact?.hoursValue?.en) ||
    tContact('info.hoursValue');

  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
      setIsAdminPath(true);
    }
  }, []);

  // Suppress public footer on admin pages
  if ((pathname && pathname.includes('/admin')) || isAdminPath) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { href: '#about', label: tNav('links.about') },
    { href: '#services', label: tNav('links.services') },
    { href: '#stats', label: tNav('links.stats') },
    { href: '#partners', label: tNav('links.partners') },
    { href: '#news', label: tNav('links.news') },
    { href: '#admission', label: tNav('links.admission') },
    { href: '#faq', label: tNav('links.faq') },
    { href: '#contact', label: tNav('links.contact') },
  ];

  const externalLinks = [
    { href: 'https://unram.ac.id', label: t('unramMainSite') },
    { href: 'https://library.unram.ac.id', label: t('unramLibrary') },
    { href: 'https://lppm.unram.ac.id', label: t('unramLppm') },
    { href: 'https://siakad.unram.ac.id', label: t('unramAcademic') },
  ];

  return (
    <footer className="bg-unram-950 text-blue-200/80 pt-16 pb-12 border-t border-unram-900">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-unram-900/80">
          {/* Brand & Narrative Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo Universitas Mataram"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-serif font-normal text-paper text-base leading-tight">
                  {t('aboutTitle')}
                </h3>
                <p className="text-xs text-blue-300 font-medium uppercase tracking-[0.12em]">
                  {tCommon('unramName')}
                </p>
              </div>
            </div>

            <p className="text-sm text-blue-200/75 leading-[1.65] max-w-md">
              {t('aboutDesc')}
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-paper">
              {t('quickLinksTitle')}
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={isHomePage ? link.href : `/${locale}/${link.href}`}
                    className="text-blue-300/80 hover:text-paper hover:underline underline-offset-4 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Portals Column */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-paper">
              {t('unramLinksTitle')}
            </h4>
            <ul className="space-y-2 text-xs">
              {externalLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-300/80 hover:text-paper transition-colors"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Address Column */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-paper">
              {tNav('links.contact')}
            </h4>
            <div className="space-y-2 text-xs leading-relaxed text-blue-200/75">
              <p>{addressContent}</p>
              <p>
                <a
                  href={`mailto:${emailValue}`}
                  className="text-paper hover:underline underline-offset-4"
                >
                  {emailValue}
                </a>
              </p>
              <p>{phoneValue}</p>
              <p className="text-blue-300/60 pt-1">{hoursValue}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Navigation */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-300/60">
          <p>{t('copyright')}</p>
          <div className="flex items-center gap-6">
            <a
              href={`/${locale}/admin/`}
              className="hover:text-paper transition-colors"
            >
              {locale === 'en' ? 'Admin Portal' : 'Portal Admin'}
            </a>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 hover:text-paper transition-colors cursor-pointer"
            >
              <span>{tCommon('backToTop')}</span>
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}
