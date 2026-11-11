/**
 * Client-side image compression and content-hashed path generation
 * - Maximum 1600px on long edge
 * - WebP/JPEG quality ~0.82
 * - PNG transparency check
 * - 10 MB maximum upload limit
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  path: string; // e.g. '/uploads/a1b2c3d4e5.webp'
  filename: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

/**
 * Computes a short 16-character hex hash from file bytes using Web Crypto SHA-256
 */
export async function computeContentHash(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 16);
  }
  // Fallback simple hash if Web Crypto unavailable
  let hash = 0;
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    hash = (hash << 5) - hash + view[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}

/**
 * Checks if a PNG image contains alpha (transparent) pixels
 */
function hasAlphaChannel(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] < 255) return true;
    }
  } catch {
    // If security error or cross-origin
  }
  return false;
}

/**
 * Compress an image file in browser
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Ukuran gambar terlalu besar (${sizeMb} MB). Maksimal ukuran file yang diizinkan adalah 10 MB.`);
  }

  // Read as Image
  const img = new Image();
  const rawUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Gagal memuat gambar. Format file mungkin rusak atau tidak didukung.'));
    img.src = rawUrl;
  });

  URL.revokeObjectURL(rawUrl);

  let { width, height } = img;

  // Scale down if exceeding max dimension
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia pada peramban ini.');
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Check if original is PNG with transparency
  const isPng = file.type === 'image/png';
  const transparent = isPng && hasAlphaChannel(ctx, width, height);

  let outputMime = 'image/webp';
  let ext = 'webp';

  if (transparent) {
    outputMime = 'image/png';
    ext = 'png';
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Gagal mengompresi gambar ke format WebP/PNG.'));
      },
      outputMime,
      outputMime === 'image/png' ? undefined : QUALITY
    );
  });

  const arrayBuffer = await blob.arrayBuffer();
  const hash = await computeContentHash(arrayBuffer);
  const filename = `${hash}.${ext}`;
  const path = `/uploads/${filename}`;

  // Generate dataUrl for instant synchronous preview in UI
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return {
    blob,
    dataUrl,
    path,
    filename,
    originalSize: file.size,
    compressedSize: blob.size,
    width,
    height,
  };
}
