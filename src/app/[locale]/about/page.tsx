import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/routing';
import { getSectionByKey } from '@/lib/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { SectionPageShell } from '@/components/layout/SectionPageShell';
import { About } from '@/components/sections/About';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const section = getSectionByKey('about')!;
  const title = section.title[isEn ? 'en' : 'id'];
  const description = section.description[isEn ? 'en' : 'id'];
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${section.slug}/`,
      languages: {
        en: `/en/${section.slug}/`,
        id: `/id/${section.slug}/`,
        'x-default': `/en/${section.slug}/`,
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/${section.slug}/`,
      type: 'website',
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const section = getSectionByKey('about')!;

  return (
    <SectionPageShell section={section} locale={locale}>
      <About locale={locale} />
    </SectionPageShell>
  );
}
