import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing, locales } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ContentProvider } from '@/context/ContentContext';
import { newsreader, instrumentSans } from '@/app/fonts';
import { getSiteUrl } from '@/lib/siteUrl';
import { getServerSiteContent } from '@/lib/serverContent';

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
  const siteUrl = getSiteUrl();

  const { content } = await getServerSiteContent();

  const titlePrefix = content?.hero?.titlePrefix?.[isEn ? 'en' : 'id'];
  const titleHighlight = content?.hero?.titleHighlight?.[isEn ? 'en' : 'id'];
  const customHeroTitle =
    titlePrefix && titleHighlight ? `${titlePrefix} ${titleHighlight}` : undefined;

  const defaultTitle = isEn
    ? 'Office of International Affairs - Universitas Mataram (UNRAM)'
    : 'Kantor Urusan Internasional - Universitas Mataram (UNRAM)';
  const title = customHeroTitle ? `${customHeroTitle} - UNRAM` : defaultTitle;

  const description =
    content?.hero?.subtitle?.[isEn ? 'en' : 'id'] ||
    (isEn
      ? 'Official portal for international admissions, global academic partnerships, student mobility (IISMA), scholarships, and visitor services at Universitas Mataram, Lombok, Indonesia.'
      : 'Portal resmi penerimaan mahasiswa internasional, kemitraan akademik global, mobilitas mahasiswa (IISMA), beasiswa, dan layanan izin tinggal di Universitas Mataram, Lombok, Indonesia.');

  const heroImage = content?.hero?.bgImage || '/images/hero-campus.jpg';

  return {
    title: {
      default: title,
      template: `%s | ${isEn ? 'OIA UNRAM' : 'KUI UNRAM'}`,
    },
    description,
    keywords: [
      'Universitas Mataram',
      'UNRAM',
      'Office of International Affairs UNRAM',
      'OIA UNRAM',
      'KUI UNRAM',
      'Study in Lombok',
      'Study in Indonesia',
      'IISMA UNRAM',
      'Student Mobility Indonesia',
      'Lombok University',
    ],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}/`,
      languages: {
        en: '/en/',
        id: '/id/',
        'x-default': '/en/',
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/`,
      siteName: isEn ? 'OIA Universitas Mataram' : 'KUI Universitas Mataram',
      locale: isEn ? 'en_US' : 'id_ID',
      type: 'website',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/logo.png',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const { content: initialContent, publishedAt: initialPublishedAt } =
    await getServerSiteContent();

  return (
    <html lang={locale} className={`scroll-smooth ${newsreader.variable} ${instrumentSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://dscmuuilmrkwtuxmmyap.supabase.co" />
        <link rel="dns-prefetch" href="https://dscmuuilmrkwtuxmmyap.supabase.co" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-paper text-ink antialiased selection:bg-unram-600 selection:text-white">
        <NextIntlClientProvider messages={messages}>
          <ContentProvider initialContent={initialContent} initialPublishedAt={initialPublishedAt}>
            {/* Accessibility: Skip to Content */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[999] px-4 py-2 bg-unram-900 text-white font-medium text-xs uppercase tracking-wider rounded-[6px] shadow-sm ring-2 ring-accent"
            >
              {locale === 'en' ? 'Skip to main content' : 'Lompat ke konten utama'}
            </a>

            <Navbar locale={locale} />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer locale={locale} />
          </ContentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
