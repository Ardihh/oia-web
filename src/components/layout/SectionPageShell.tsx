import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionConfig } from '@/lib/routes';
import { getSiteUrl } from '@/lib/siteUrl';

interface SectionPageShellProps {
  section: SectionConfig;
  locale: string;
  children: React.ReactNode;
}

export function SectionPageShell({
  section,
  locale,
  children,
}: SectionPageShellProps) {
  const isEn = locale === 'en';
  const siteUrl = getSiteUrl();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEn ? 'Home' : 'Beranda',
        item: `${siteUrl}/${locale}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: section.title[isEn ? 'en' : 'id'],
        item: `${siteUrl}/${locale}/${section.slug}/`,
      },
    ],
  };

  // Safe JSON-LD serialization avoiding script injection
  const jsonLdString = JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      {/* Editorial Breadcrumb Navigation (DESIGN.md hairline style) */}
      <div className="bg-paper border-b border-hairline py-3.5">
        <Container>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft">
            <Link
              href={`/${locale}/`}
              className="hover:text-ink hover:underline underline-offset-4 transition-colors"
            >
              {isEn ? 'Home' : 'Beranda'}
            </Link>
            <span className="text-hairline font-light" aria-hidden="true">/</span>
            <span className="font-mono text-[11px] text-unram-600">
              {section.kickerNumber}
            </span>
            <span className="text-ink font-medium" aria-current="page">
              {section.title[isEn ? 'en' : 'id']}
            </span>
          </nav>
        </Container>
      </div>

      {/* Render existing section content */}
      {children}
    </>
  );
}
