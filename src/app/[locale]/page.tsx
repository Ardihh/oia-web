import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/sections/Hero';
import { HomeOverview } from '@/components/sections/HomeOverview';
import { LegacyHashRedirect } from '@/components/common/LegacyHashRedirect';
import { getSiteUrl } from '@/lib/siteUrl';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEn = locale === 'en';
  const siteUrl = getSiteUrl();

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${siteUrl}/#organization`,
        name: isEn
          ? 'Office of International Affairs Universitas Mataram'
          : 'Kantor Urusan Internasional Universitas Mataram',
        url: `${siteUrl}/${locale}/`,
        logo: `${siteUrl}/logo.png`,
        sameAs: ['https://www.instagram.com/oia.unram/', 'https://unram.ac.id'],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/${locale}/`,
        name: isEn ? 'UNRAM International Office' : 'KUI Universitas Mataram',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        inLanguage: locale,
      },
    ],
  };

  const jsonLdString = JSON.stringify(homeJsonLd).replace(/</g, '\\u003c');

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      {/* Immediate Client Hash Redirect for #services, #stats, etc. */}
      <LegacyHashRedirect locale={locale} />

      {/* Hero Section */}
      <Hero locale={locale} />

      {/* Explore Sections Overview + Latest News */}
      <HomeOverview locale={locale} />
    </div>
  );
}
