'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/lib/utils';

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('about');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
      setIsAdminPath(true);
    }

    const handleActiveChange = (e: any) => {
      if (e.detail) setActiveSection(e.detail);
    };
    window.addEventListener('unram_active_section_changed', handleActiveChange);
    return () => window.removeEventListener('unram_active_section_changed', handleActiveChange);
  }, []);

  const isHomePage =
    pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const targetKey = href.replace('#', '');
    setMobileMenuOpen(false);

    if (isHomePage) {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('unram_navigate_section', { detail: targetKey })
      );
    } else {
      e.preventDefault();
      window.location.href = `/${locale}/#${targetKey}`;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Suppress public navigation bar on admin pages (called after all hooks to respect Rules of Hooks)
  if ((pathname && pathname.includes('/admin')) || isAdminPath) {
    return null;
  }

  const navLinks = [
    { href: '#about', label: t('links.about') },
    { href: '#services', label: t('links.services') },
    { href: '#stats', label: t('links.stats') },
    { href: '#partners', label: t('links.partners') },
    { href: '#news', label: t('links.news') },
    { href: '#admission', label: t('links.admission') },
    { href: '#faq', label: t('links.faq') },
    { href: '#contact', label: t('links.contact') },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-200 w-full h-[72px] flex items-center bg-paper/95 border-b',
        isScrolled ? 'border-hairline' : 'border-hairline/60'
      )}
    >
      <Container className="w-full">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <a
            href={`/${locale}/`}
            className="flex items-center gap-3.5 group focus-visible:rounded"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Universitas Mataram"
                width={48}
                height={48}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-normal text-base sm:text-[17px] text-ink tracking-tight leading-tight group-hover:text-unram-600 transition-colors">
                {t('brandName')}
              </span>
              <span className="text-xs font-medium text-ink-soft uppercase tracking-[0.12em]">
                {t('brandSub')}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center space-x-1"
          >
            {navLinks.map((link) => {
              const key = link.href.replace('#', '');
              const isActive = activeSection === key;
              return (
                <a
                  key={link.href}
                  href={isHomePage ? link.href : `/${locale}/${link.href}`}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={cn(
                    'px-2.5 py-1 text-sm transition-colors rounded-[4px]',
                    isActive
                      ? 'text-unram-900 font-medium underline underline-offset-4 decoration-unram-900'
                      : 'font-normal text-ink-soft hover:text-ink hover:underline underline-offset-4 decoration-hairline'
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Controls (Language Switcher + Contact CTA) */}
          <div className="hidden lg:flex items-center gap-5">
            <LanguageSwitcher />
            <a
              href={isHomePage ? '#contact' : `/${locale}/#contact`}
              onClick={(e) => handleNavClick(e, '#contact')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-accent hover:bg-accent-hover rounded-[6px] transition-colors focus-visible:ring-2 focus-visible:ring-unram-600 focus-visible:ring-offset-2"
            >
              <span>{t('contactBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Mobile Right Controls: Switcher + Menu Hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-ink hover:text-unram-600 rounded-[4px] focus-visible:ring-2 focus-visible:ring-unram-600 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Full Sheet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[72px] bg-paper border-b border-hairline p-6 shadow-subtle animate-in fade-in duration-200">
            <nav className="flex flex-col space-y-3 pb-4">
              {navLinks.map((link) => {
                const key = link.href.replace('#', '');
                const isActive = activeSection === key;
                return (
                  <a
                    key={link.href}
                    href={isHomePage ? link.href : `/${locale}/${link.href}`}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      'font-serif text-xl py-1 transition-colors flex items-center justify-between',
                      isActive ? 'text-unram-600 font-medium' : 'text-ink font-normal hover:text-unram-600'
                    )}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="text-xs font-mono font-normal text-unram-600">●</span>}
                  </a>
                );
              })}
              <div className="pt-4 border-t border-hairline">
                <a
                  href={isHomePage ? '#contact' : `/${locale}/#contact`}
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold uppercase tracking-wider text-white bg-accent hover:bg-accent-hover rounded-[6px] transition-colors"
                >
                  <span>{t('contactBtn')}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
