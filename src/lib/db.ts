/**
 * Zero-dependency IndexedDB wrapper for UNRAM International Office CMS
 * Database: unram_cms_db
 * Stores:
 *   - 'draft': stores working site draft content
 *   - 'blobs': stores local uploaded image and file blobs before publishing
 *   - 'metadata': stores export timestamps and dirty state flags
 */

import { SiteContent } from '@/context/ContentContext';

const DB_NAME = 'unram_cms_db';
const DB_VERSION = 1;

const STORE_DRAFT = 'draft';
const STORE_BLOBS = 'blobs';
const STORE_METADATA = 'metadata';

const DRAFT_KEY = 'active_draft';

export interface StoredBlob {
  path: string; // e.g. '/uploads/abc12345.webp'
  blob: Blob;
  mimeType: string;
  filename: string;
  size: number;
  updatedAt: string;
}

let dbInstance: IDBDatabase | null = null;

export async function openCmsDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only accessible in browser environment');
  }

  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DRAFT)) {
        db.createObjectStore(STORE_DRAFT, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'path' });
      }

      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`));
    };
  });
}

/**
 * Load current active draft from IndexedDB
 */
export async function getDraftFromDb(): Promise<SiteContent | null> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_DRAFT, 'readonly');
    const store = transaction.objectStore(STORE_DRAFT);
    const request = store.get(DRAFT_KEY);

    request.onsuccess = () => {
      if (request.result?.content) {
        resolve(request.result.content as SiteContent);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to load draft from IndexedDB: ${request.error?.message}`));
    };
  });
}

/**
 * Save draft into IndexedDB with timestamp and set unexported changes flag
 */
export async function saveDraftToDb(content: SiteContent): Promise<void> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DRAFT, STORE_METADATA], 'readwrite');

    transaction.onerror = () => {
      const err = transaction.error;
      if (err?.name === 'QuotaExceededError') {
        reject(new Error('Kapasitas penyimpanan lokal peramban (IndexedDB) penuh. Harap hapus atau unduh draf lama.'));
      } else {
        reject(new Error(`Gagal menyimpan ke IndexedDB: ${err?.message || 'Unknown error'}`));
      }
    };

    const draftStore = transaction.objectStore(STORE_DRAFT);
    draftStore.put({
      key: DRAFT_KEY,
      content,
      updatedAt: new Date().toISOString(),
    });

    const metaStore = transaction.objectStore(STORE_METADATA);
    metaStore.put({
      key: 'has_unexported_changes',
      value: true,
      updatedAt: new Date().toISOString(),
    });

    transaction.oncomplete = () => {
      resolve();
    };
  });
}

/**
 * Store an uploaded image/document blob into IndexedDB
 */
export async function saveBlobToDb(
  path: string,
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<string> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_BLOBS, 'readwrite');
    const store = transaction.objectStore(STORE_BLOBS);

    const record: StoredBlob = {
      path,
      blob,
      mimeType,
      filename,
      size: blob.size,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(record);

    request.onsuccess = () => resolve(path);
    request.onerror = () => {
      const err = request.error;
      if (err?.name === 'QuotaExceededError') {
        reject(new Error('Kapasitas penyimpanan gambar IndexedDB penuh.'));
      } else {
        reject(new Error(`Gagal menyimpan file ke database lokal: ${err?.message}`));
      }
    };
  });
}

/**
 * Get a single blob by its /uploads/ path
 */
export async function getBlobFromDb(path: string): Promise<Blob | null> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_BLOBS, 'readonly');
    const store = transaction.objectStore(STORE_BLOBS);
    const request = store.get(path);

    request.onsuccess = () => {
      if (request.result?.blob) {
        resolve(request.result.blob as Blob);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error(`Gagal mengambil blob ${path}: ${request.error?.message}`));
    };
  });
}

/**
 * Convert any IndexedDB /uploads/ blob references into data URLs for live browser preview
 */
export async function resolveDraftBlobs(content: SiteContent): Promise<SiteContent> {
  if (!content || typeof window === 'undefined') return content;
  const resolved = JSON.parse(JSON.stringify(content)) as SiteContent;

  const resolveOne = async (url: string | undefined): Promise<string> => {
    if (!url || typeof url !== 'string') return url || '';
    if (url.startsWith('/uploads/')) {
      try {
        const blob = await getBlobFromDb(url);
        if (blob) {
          return await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = () => res(url);
            reader.readAsDataURL(blob);
          });
        }
      } catch {}
    }
    return url;
  };

  if (resolved.about?.headPhoto) {
    resolved.about.headPhoto = await resolveOne(resolved.about.headPhoto);
  }
  if (resolved.hero?.bgImage) {
    resolved.hero.bgImage = await resolveOne(resolved.hero.bgImage);
  }
  if (Array.isArray(resolved.news)) {
    for (const item of resolved.news) {
      if (item.image) {
        item.image = await resolveOne(item.image);
      }
    }
  }

  return resolved;
}

/**
 * Get all stored blobs (used for building the ZIP publish bundle)
 */
export async function getAllBlobsFromDb(): Promise<StoredBlob[]> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_BLOBS, 'readonly');
    const store = transaction.objectStore(STORE_BLOBS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve((request.result || []) as StoredBlob[]);
    };

    request.onerror = () => {
      reject(new Error(`Gagal membaca daftar blob: ${request.error?.message}`));
    };
  });
}

/**
 * Metadata helpers
 */
export async function getMetadata(key: string): Promise<any> {
  const db = await openCmsDb();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_METADATA, 'readonly');
    const store = transaction.objectStore(STORE_METADATA);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => resolve(null);
  });
}

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_METADATA, 'readwrite');
    const store = transaction.objectStore(STORE_METADATA);
    const request = store.put({ key, value, updatedAt: new Date().toISOString() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Gagal menyimpan metadata: ${request.error?.message}`));
  });
}

/**
 * Clear local draft & blobs (used when user types 'HAPUS')
 */
export async function clearLocalDraft(): Promise<void> {
  const db = await openCmsDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_DRAFT, STORE_BLOBS, STORE_METADATA], 'readwrite');
    transaction.objectStore(STORE_DRAFT).clear();
    transaction.objectStore(STORE_BLOBS).clear();
    transaction.objectStore(STORE_METADATA).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Gagal membersihkan database draf lokal.'));
  });
}

/**
 * Storage quota estimation
 */
export async function getStorageEstimate(): Promise<{
  usedMb: number;
  quotaMb: number;
  percentUsed: number;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const usedMb = Math.round((usage / (1024 * 1024)) * 10) / 10;
      const quotaMb = Math.round((quota / (1024 * 1024)) * 10) / 10;
      const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return { usedMb, quotaMb, percentUsed };
    } catch {
      // Fallback
    }
  }
  return { usedMb: 0, quotaMb: 0, percentUsed: 0 };
}
