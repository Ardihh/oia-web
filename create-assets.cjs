const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Utility to create a valid uncompressed PNG file without external dependencies
function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData.writeUInt8(0, rowOffset); // filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // create a subtle gradient or pattern
      const gradR = Math.min(255, Math.max(0, Math.floor(r + (x / width) * 20 - (y / height) * 20)));
      const gradG = Math.min(255, Math.max(0, Math.floor(g + (y / height) * 20)));
      const gradB = Math.min(255, Math.max(0, Math.floor(b + (x / width) * 30)));

      rawData.writeUInt8(gradR, pixelOffset);
      rawData.writeUInt8(gradG, pixelOffset + 1);
      rawData.writeUInt8(gradB, pixelOffset + 2);
      rawData.writeUInt8(a, pixelOffset + 3);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const baseDir = path.join(__dirname, 'public');
const imgDir = path.join(baseDir, 'images');
const partnersDir = path.join(baseDir, 'partners');

[baseDir, imgDir, partnersDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 1. UNRAM Logo (UNRAM Blue #0C1D9D = rgb(12, 29, 157))
fs.writeFileSync(path.join(baseDir, 'logo.png'), createPNG(120, 120, 12, 29, 157));

// Also generate high-quality SVG logo
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="36" fill="#0C1D9D"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="#F59E0B" stroke-width="6"/>
  <polygon points="100,45 115,75 145,80 120,105 125,135 100,120 75,135 80,105 55,80 85,75" fill="#F59E0B" opacity="0.9"/>
  <circle cx="100" cy="100" r="28" fill="#FFFFFF"/>
  <text x="100" y="106" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#0C1D9D" text-anchor="middle">UNRAM</text>
  <text x="100" y="180" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#E0E7FF" text-anchor="middle">INTL OFFICE</text>
</svg>`;
fs.writeFileSync(path.join(baseDir, 'logo.svg'), logoSvg);

// 2. Campus & Editorial Images
fs.writeFileSync(path.join(imgDir, 'hero-campus.jpg'), createPNG(1920, 1080, 12, 35, 120));
fs.writeFileSync(path.join(imgDir, 'about-office.jpg'), createPNG(800, 600, 26, 45, 140));
fs.writeFileSync(path.join(imgDir, 'head-of-office.jpg'), createPNG(600, 700, 20, 30, 90));
fs.writeFileSync(path.join(imgDir, 'news-1.jpg'), createPNG(800, 500, 18, 50, 130));
fs.writeFileSync(path.join(imgDir, 'news-2.jpg'), createPNG(800, 500, 22, 60, 150));
fs.writeFileSync(path.join(imgDir, 'news-3.jpg'), createPNG(800, 500, 30, 40, 120));

// 3. Partner Logos (SVG)
for (let i = 1; i <= 6; i++) {
  const partnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
    <rect width="240" height="80" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="45" cy="40" r="22" fill="#0C1D9D" opacity="0.1"/>
    <text x="45" y="46" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0C1D9D" text-anchor="middle">P${i}</text>
    <text x="80" y="38" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#1E293B">TODO: replace</text>
    <text x="80" y="54" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B">Partner University ${i}</text>
  </svg>`;
  fs.writeFileSync(path.join(partnersDir, `partner-${i}.svg`), partnerSvg);
}

console.log('All image and logo placeholders generated successfully!');
