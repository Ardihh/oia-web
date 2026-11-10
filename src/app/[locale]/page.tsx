import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/sections/Hero';
import { SectionViewHub } from '@/components/sections/SectionViewHub';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full">
      {/* 2. Hero Section */}
      <Hero locale={locale} />

      {/* 3-10. Interactive Section View Hub (One Section At a Time / Full Scroll Mode) */}
      <SectionViewHub locale={locale} />
    </div>
  );
}
