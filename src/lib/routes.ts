/**
 * Centralized Route Configuration & Resolver
 * Replaces hash-based navigation with clean, static, localized URLs.
 */

export type SectionKey =
  | 'about'
  | 'services'
  | 'impact'
  | 'partners'
  | 'news'
  | 'admission'
  | 'faq'
  | 'contact';

export interface SectionConfig {
  key: SectionKey;
  slug: string;
  legacyHash: string;
  kickerNumber: string;
  navKey: string;
  title: { en: string; id: string };
  description: { en: string; id: string };
}

export const SECTIONS: SectionConfig[] = [
  {
    key: 'about',
    slug: 'about',
    legacyHash: '#about',
    kickerNumber: '02',
    navKey: 'about',
    title: {
      en: 'About OIA UNRAM',
      id: 'Tentang KUI UNRAM',
    },
    description: {
      en: 'Vision, mission, institutional mandate, and leadership of the Office of International Affairs at Universitas Mataram.',
      id: 'Visi, misi, mandat kelembagaan, dan pimpinan Kantor Urusan Internasional Universitas Mataram.',
    },
  },
  {
    key: 'services',
    slug: 'services',
    legacyHash: '#services',
    kickerNumber: '03',
    navKey: 'services',
    title: {
      en: 'International Services',
      id: 'Layanan Internasional',
    },
    description: {
      en: 'End-to-end concierge services for inbound students, outbound mobility, institutional MoUs, and visa assistance.',
      id: 'Layanan menyeluruh bagi mahasiswa asing, program mobilitas keluar, kerja sama MoU, dan izin tinggal.',
    },
  },
  {
    key: 'impact',
    slug: 'impact',
    legacyHash: '#stats',
    kickerNumber: '04',
    navKey: 'stats',
    title: {
      en: 'Global Footprint & Impact',
      id: 'Capaian & Statistik Dampak',
    },
    description: {
      en: 'Verifiable metrics driving UNRAM sustained globalization, bilateral institutional engagements, and student mobility.',
      id: 'Metrik capaian nyata internasionalisasi Universitas Mataram, kemitraan bilateral, dan mobilitas mahasiswa.',
    },
  },
  {
    key: 'partners',
    slug: 'partners',
    legacyHash: '#partners',
    kickerNumber: '05',
    navKey: 'partners',
    title: {
      en: 'Partner Universities & Consortia',
      id: 'Mitra Universitas & Konsorsium',
    },
    description: {
      en: 'Active institutional partnerships spanning Australia, Japan, Germany, Malaysia, and esteemed global consortia.',
      id: 'Kemitraan institusi aktif di Australia, Jepang, Jerman, Malaysia, serta konsorsium akademik terkemuka dunia.',
    },
  },
  {
    key: 'news',
    slug: 'news',
    legacyHash: '#news',
    kickerNumber: '06',
    navKey: 'news',
    title: {
      en: 'News & Announcements',
      id: 'Berita & Pengumuman',
    },
    description: {
      en: 'Official press releases, international activities, visiting delegations, and academic exchange opportunities.',
      id: 'Kabar terkini, kunjungan delegasi, program pertukaran, dan agenda global terbaru di Universitas Mataram.',
    },
  },
  {
    key: 'admission',
    slug: 'admission',
    legacyHash: '#admission',
    kickerNumber: '07',
    navKey: 'admission',
    title: {
      en: 'International Admission & Guides',
      id: 'Penerimaan Mahasiswa Asing & Panduan',
    },
    description: {
      en: 'Application workflows, eligibility criteria, downloadable handbooks, and visa clearance for prospective students.',
      id: 'Alur pendaftaran mahasiswa internasional, kriteria berkas, dokumen buku panduan, dan pengurusan izin belajar.',
    },
  },
  {
    key: 'faq',
    slug: 'faq',
    legacyHash: '#faq',
    kickerNumber: '08',
    navKey: 'faq',
    title: {
      en: 'Frequently Asked Questions',
      id: 'Tanya Jawab (FAQ)',
    },
    description: {
      en: 'Direct answers regarding admissions, scholarships, study permits, accommodation, and campus life in Lombok.',
      id: 'Jawaban lengkap seputar beasiswa, izin tinggal, akomodasi, perkuliahan, dan kehidupan kampus di Lombok.',
    },
  },
  {
    key: 'contact',
    slug: 'contact',
    legacyHash: '#contact',
    kickerNumber: '09',
    navKey: 'contact',
    title: {
      en: 'Contact & Location',
      id: 'Kontak & Lokasi Kantor',
    },
    description: {
      en: 'Office location at UNRAM Rectorate Building, office hours, direct inquiries, and verified social channels.',
      id: 'Lokasi kantor KUI di Gedung Rektorat UNRAM, jam kerja, saluran konsultasi resmi, dan peta lokasi.',
    },
  },
];

const LEGACY_HASH_MAP: Record<string, SectionKey> = {
  about: 'about',
  services: 'services',
  stats: 'impact', // #stats -> impact
  impact: 'impact',
  partners: 'partners',
  news: 'news',
  admission: 'admission',
  faq: 'faq',
  contact: 'contact',
};

/**
 * Return clean localized path for a section, e.g. /en/services/
 */
export function sectionHref(locale: string, key: SectionKey | string): string {
  const normLocale = locale === 'id' ? 'id' : 'en';
  const section = SECTIONS.find((s) => s.key === key || s.slug === key);
  if (!section) {
    return `/${normLocale}/`;
  }
  return `/${normLocale}/${section.slug}/`;
}

/**
 * Get section config by key
 */
export function getSectionByKey(key: string): SectionConfig | undefined {
  return SECTIONS.find((s) => s.key === key);
}

/**
 * Get section config by slug
 */
export function getSectionBySlug(slug: string): SectionConfig | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

/**
 * Get section by legacy hash (#services, #stats, etc.)
 */
export function getSectionByLegacyHash(rawHash: string): SectionConfig | undefined {
  const clean = rawHash.replace(/^[#\/]+/, '').toLowerCase().trim();
  const key = LEGACY_HASH_MAP[clean];
  if (!key) return undefined;
  return SECTIONS.find((s) => s.key === key);
}

/**
 * Check if a string is a legacy section hash
 */
export function isLegacyHash(rawHash: string): boolean {
  const clean = rawHash.replace(/^[#\/]+/, '').toLowerCase().trim();
  return Boolean(LEGACY_HASH_MAP[clean]);
}

/**
 * Resolve any internal href (legacy hash, relative path, or external URL)
 * into a valid localized URL. Does NOT rewrite the database, but resolves
 * dynamically at render time.
 */
export function resolveInternalHref(
  href: string | undefined | null,
  locale: string
): string {
  if (!href) {
    return `/${locale === 'id' ? 'id' : 'en'}/`;
  }

  const trimmed = href.trim();
  const normLocale = locale === 'id' ? 'id' : 'en';

  // 1. External links or protocols: preserve as-is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }

  // 2. Legacy hash values (e.g. "#contact", "#services", "#stats", etc.)
  if (trimmed.startsWith('#')) {
    const cleanKey = trimmed.replace('#', '').toLowerCase();
    const mappedKey = LEGACY_HASH_MAP[cleanKey];
    if (mappedKey) {
      return sectionHref(normLocale, mappedKey);
    }
    // Fallback: if it's just '#' or unknown hash, return home
    return `/${normLocale}/`;
  }

  // 3. Already a localized clean path (e.g. "/en/services/", "/id/admission/")
  if (trimmed.startsWith('/en/') || trimmed.startsWith('/id/')) {
    // Replace old /stats/ with /impact/ if encountered
    const clean = trimmed.replace(/\/(en|id)\/stats\/?$/, '/$1/impact/');
    return clean.endsWith('/') ? clean : `${clean}/`;
  }

  // 4. Relative section slug without locale (e.g. "/services/", "services", "/impact/")
  const cleanSlug = trimmed.replace(/^\/+|\/+$/g, '').toLowerCase();
  const section = SECTIONS.find((s) => s.slug === cleanSlug || s.key === cleanSlug);
  if (section) {
    return sectionHref(normLocale, section.key);
  }

  // 5. General root-relative path (e.g. "/news/?id=1")
  if (trimmed.startsWith('/')) {
    return `/${normLocale}${trimmed}`;
  }

  return `/${normLocale}/${trimmed}/`;
}
