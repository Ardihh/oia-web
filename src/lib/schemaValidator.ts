/**
 * Strict schema validator and version migrator for UNRAM Site Content
 */

import { SiteContent, defaultSiteContent } from '@/context/ContentContext';

export interface ValidationResult {
  valid: boolean;
  schemaVersion: number;
  errors: string[];
  sanitizedContent?: SiteContent;
}

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Validate a candidate SiteContent object
 */
export function validateSiteContent(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      schemaVersion: 0,
      errors: ['Data konten situs harus berupa objek JSON valid.'],
    };
  }

  // Version check
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 1;

  // 1. Hero
  if (!data.hero || typeof data.hero !== 'object') {
    errors.push('Bagian "hero" tidak ditemukan atau bukan objek.');
  } else {
    if (!data.hero.titlePrefix || !data.hero.titleHighlight) {
      errors.push('Bagian "hero" kehilangan kolom judul wajib.');
    }
  }

  // 2. About
  if (!data.about || typeof data.about !== 'object') {
    errors.push('Bagian "about" tidak ditemukan.');
  } else {
    if (!Array.isArray(data.about?.missionItems?.id) || !Array.isArray(data.about?.missionItems?.en)) {
      errors.push('Poin misi ("about.missionItems") harus berupa array dwibahasa.');
    }
  }

  // 3. Stats items
  if (!data.stats || !Array.isArray(data.stats.items)) {
    errors.push('Bagian "stats.items" harus berupa daftar array.');
  }

  // 4. Services items
  if (!data.services || !Array.isArray(data.services.items)) {
    errors.push('Bagian "services.items" harus berupa daftar array.');
  }

  // 5. FAQ items
  if (!data.faq || !Array.isArray(data.faq.items)) {
    errors.push('Bagian "faq.items" harus berupa daftar array.');
  }

  // 6. Contact
  if (!data.contact || typeof data.contact !== 'object') {
    errors.push('Bagian "contact" tidak ditemukan.');
  }

  // 7. Guides
  if (data.guides !== undefined && !Array.isArray(data.guides)) {
    errors.push('Bagian "guides" harus berupa array dokumen.');
  }

  // 8. News
  if (data.news !== undefined && !Array.isArray(data.news)) {
    errors.push('Bagian "news" harus berupa array artikel.');
  }

  // 9. Admission Steps
  if (data.admissionSteps !== undefined && !Array.isArray(data.admissionSteps)) {
    errors.push('Bagian "admissionSteps" harus berupa array langkah.');
  }

  // 10. Partners
  if (data.partners !== undefined && typeof data.partners !== 'object') {
    errors.push('Bagian "partners" harus berupa objek.');
  } else if (data.partners && data.partners.items !== undefined && !Array.isArray(data.partners.items)) {
    errors.push('Bagian "partners.items" harus berupa daftar array mitra.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      schemaVersion: version,
      errors,
    };
  }

  // Build clean sanitized object
  const sanitizedContent: SiteContent = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: data.updatedAt || new Date().toISOString(),
    hero: {
      ...defaultSiteContent.hero,
      ...data.hero,
    },
    about: {
      ...defaultSiteContent.about,
      ...data.about,
      missionItems: {
        id: Array.isArray(data.about?.missionItems?.id) ? data.about.missionItems.id : defaultSiteContent.about.missionItems.id,
        en: Array.isArray(data.about?.missionItems?.en) ? data.about.missionItems.en : defaultSiteContent.about.missionItems.en,
      },
    },
    admissionSteps: Array.isArray(data.admissionSteps) && data.admissionSteps.length > 0
      ? data.admissionSteps
      : defaultSiteContent.admissionSteps,
    stats: {
      ...defaultSiteContent.stats,
      items: Array.isArray(data.stats?.items) ? data.stats.items : defaultSiteContent.stats.items,
    },
    services: {
      ...defaultSiteContent.services,
      items: Array.isArray(data.services?.items) ? data.services.items : defaultSiteContent.services.items,
    },
    faq: {
      ...defaultSiteContent.faq,
      items: Array.isArray(data.faq?.items) ? data.faq.items : defaultSiteContent.faq.items,
    },
    contact: {
      ...defaultSiteContent.contact,
      ...(data.contact || {}),
    },
    guides: Array.isArray(data.guides) ? data.guides : defaultSiteContent.guides,
    news: Array.isArray(data.news) ? data.news : defaultSiteContent.news,
    partners: data.partners && typeof data.partners === 'object'
      ? {
          ...defaultSiteContent.partners,
          ...data.partners,
          items: Array.isArray(data.partners?.items)
            ? data.partners.items
            : (defaultSiteContent.partners?.items || []),
        }
      : defaultSiteContent.partners,
  };

  return {
    valid: true,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    errors: [],
    sanitizedContent,
  };
}

/**
 * Trigger browser download of raw data string as emergency recovery backup
 */
export function downloadRawBackup(rawJsonString: string, filename = 'unram-raw-backup.json') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([rawJsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
