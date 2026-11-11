import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/routing';
import { getSectionByKey } from '@/lib/routes';
import { SectionPageShell } from '@/components/layout/SectionPageShell';
import { Admission } from '@/components/sections/Admission';

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
  const section = getSectionByKey('admission')!;
  const title = section.title[isEn ? 'en' : 'id'];
  const description = section.description[isEn ? 'en' : 'id'];

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

export default async function AdmissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const section = getSectionByKey('admission')!;

  return (
    <SectionPageShell section={section} locale={locale}>
      <Admission locale={locale} />
    </SectionPageShell>
  );
}
