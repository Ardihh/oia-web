# Kantor Urusan Internasional - Universitas Mataram (UNRAM)
### *Office of International Affairs Bilingual Portal*

A modern, accessible, bilingual (`/id` and `/en`) one-page website designed for the **Office of International Affairs (Kantor Urusan Internasional / KUI)** of Universitas Mataram, Lombok, Indonesia.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **next-intl**, **Framer Motion (`motion`)**, and **Lucide React**. Configured for high-speed **static export (`output: 'export'`)** ready to deploy on campus web servers (Apache, Nginx, or any standard static host).

---

## 📑 Table of Contents
1. [Tech Stack & Architecture](#-tech-stack--architecture)
2. [Project Structure](#-project-structure)
3. [Admin Portal (/admin)](#-admin-portal-admin)
4. [Getting Started (Local Development)](#-getting-started-local-development)
5. [Environment Variables](#-environment-variables)
6. [Content Management (JSON Translation Files)](#-content-management-json-translation-files)
7. [Replacing Images & Branding](#-replacing-images--branding)
8. [Building and Static Export](#-building-and-static-export)
9. [Deploying to Campus Servers (Apache / Nginx)](#-deploying-to-campus-servers-apache--nginx)
10. [Lighthouse & Accessibility Standards](#-lighthouse--accessibility-standards)

---

## 🔐 Admin Portal (/admin)

Website ini dilengkapi dengan **Portal Admin visual khusus** di rute `/admin` (atau `/id/admin/` dan `/en/admin/`):

- **URL Akses**: `http://localhost:3000/admin` (atau tautan *"Portal Admin"* di footer website).
- **Kunci Akses (Passcode)**: `unram2026` (dapat diubah di `src/app/[locale]/admin/page.tsx`).

### Fitur Portal Admin:
1. **Formulir Berita Bilingual (ID & EN)**:
   - Input judul, tanggal publikasi, kategori, dan ringkasan berita secara berdampingan untuk Bahasa Indonesia & Bahasa Inggris.
2. **Pilih & Unggah Foto**:
   - Memasukkan nama file (contoh: `/images/news-1.jpg`) atau memilih langsung foto dari komputer (otomatis dipratinjau secara instan).
3. **Pratinjau Kartu Real-Time (Live Card Preview)**:
   - Menampilkan kartu berita dengan styling yang identik dengan tampilan di halaman utama sebelum diterbitkan.
4. **Langsung Tampil di Website (Live Sync)**:
   - Berita yang diterbitkan atau diedit akan langsung aktif dan muncul di halaman utama browser.
5. **Tombol "Salin JSON" (One-Click Sync)**:
   - Menyediakan tombol cepat untuk menyalin format JSON terstandar jika ingin memperbarui file `messages/id.json` dan `messages/en.json` untuk *permanent build* di server kampus.

---

## 🛠 Tech Stack & Architecture

- **Framework**: Next.js 15+ (App Router, Static Export `output: 'export'`)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom UNRAM Blue (`#0C1D9D`) 50–950 scale and warm Amber/Gold accent (`#F59E0B`)
- **Internationalization (i18n)**: `next-intl` (Pre-rendered bilingual routes `/id` and `/en`, zero-latency root redirect)
- **Animations**: Framer Motion (`motion`) for scroll-reveals, number counters, and FAQ accordion (respects `prefers-reduced-motion`)
- **Icons**: Lucide React
- **Contact Form**: Web3Forms (Static-compatible, spam protection via honeypot field)
- **Typography**: Plus Jakarta Sans (Headings) + Inter (Body)

---

## 📁 Project Structure

```
unram-international-office/
├── messages/
│   ├── id.json                      # Indonesian translations (Default)
│   └── en.json                      # English translations
├── public/
│   ├── favicon.ico                  # Browser tab icon
│   ├── logo.png                     # UNRAM logo
│   ├── logo.svg                     # Vector UNRAM logo
│   ├── robots.txt                   # Search crawler directives
│   ├── sitemap.xml                  # Multilingual XML sitemap
│   ├── images/
│   │   ├── hero-campus.jpg          # Campus hero backdrop
│   │   ├── about-office.jpg         # Office building photo
│   │   ├── head-of-office.jpg       # Head of Office portrait
│   │   ├── news-1.jpg               # Activity 1 thumbnail
│   │   ├── news-2.jpg               # Activity 2 thumbnail
│   │   └── news-3.jpg               # Activity 3 thumbnail
│   └── partners/
│       ├── partner-1.svg            # Partner University 1 logo
│       └── ...
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx           # Locale HTML wrapper, metadata, providers
│   │   │   └── page.tsx             # Single page connecting all 10 sections
│   │   ├── globals.css              # Tailwind base, utilities, font imports
│   │   ├── layout.tsx               # Root passthrough layout
│   │   └── page.tsx                 # Zero-latency redirect from / to /id/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx           # Sticky nav, anchor links, ID/EN toggle, mobile sheet
│   │   │   └── Footer.tsx           # Official links, hotline, copyright
│   │   ├── sections/
│   │   │   ├── Hero.tsx             # Blue gradient overlay, dual CTAs
│   │   │   ├── About.tsx            # Profile, Vision & Mission, Head of Office message
│   │   │   ├── Services.tsx         # 6 core internationalization service cards
│   │   │   ├── ImpactStats.tsx      # Animated number counters
│   │   │   ├── Partners.tsx         # Partner universities logo showcase
│   │   │   ├── News.tsx             # 3 feature news & activity cards
│   │   │   ├── Admission.tsx        # 4-stage international admission flow
│   │   │   ├── Faq.tsx              # Accessible accordion FAQ
│   │   │   └── Contact.tsx          # Web3Forms contact form, map & office details
│   │   └── ui/
│   │       ├── AnimatedCounter.tsx  # Smooth numerical counter
│   │       ├── Container.tsx        # Responsive width container
│   │       ├── LanguageSwitcher.tsx # ID/EN toggle pill
│   │       └── SectionHeading.tsx   # Consistent section titles
│   ├── i18n/
│   │   ├── request.ts               # next-intl configuration
│   │   └── routing.ts               # Supported locales ('id', 'en')
│   └── lib/
│       └── utils.ts                 # Classname utility helper
├── .env.example                     # Environment template
├── .env.local                       # Local environment variables
├── next.config.mjs                  # Static export configuration
├── tailwind.config.ts               # Theme tokens (UNRAM blue & gold)
├── tsconfig.json                    # TypeScript compiler options
└── package.json
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.18.0 or later (v20+ or v24+ recommended)
- **npm** or **pnpm**

### 2. Installation
Clone or navigate to the project directory:
```bash
cd unram-international-office
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`. You will be automatically redirected to `http://localhost:3000/id/`.

---

## 🔑 Environment Variables

The project uses Web3Forms to receive contact form submissions without requiring any backend server or database.

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Get your free access key at [web3forms.com](https://web3forms.com) (sent directly to your inbox).
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_WEB3FORMS_KEY=your_actual_web3forms_key_here
   ```

---

## 📝 Content Management (JSON Translation Files)

**No code edits are required to update website text.** All strings for both Indonesian and English are organized under the `messages/` folder:

- Indonesian: `messages/id.json`
- English: `messages/en.json`

### Finding Placeholders to Replace
Every placeholder value that requires official data from Universitas Mataram is explicitly marked with `"TODO: replace"` or placeholder numbers like `"00"`.

You can search for `"TODO: replace"` across the project to find:
- **Statistics**: Partner counts, countries, and student numbers in `stats.items.*`
- **Official Vision & Mission**: Official senate-approved text in `about.visionDesc` and `about.missionItems`
- **Head of Office Quote**: Name and welcome quote in `about.messageQuote` and `about.messageAuthor`
- **News Stories**: Titles, summaries, and dates in `news.items.*`
- **FAQ Answers**: Verified policies in `faq.items.*`

---

## 🖼 Replacing Images & Branding

All media files live in the `public/` directory:

| Asset | Path | Suggested Dimensions | Description |
| :--- | :--- | :--- | :--- |
| **UNRAM Logo** | `public/logo.png` & `logo.svg` | 200 x 200 px (square) | Official UNRAM seal / IO logo |
| **Hero Campus Photo** | `public/images/hero-campus.jpg` | 1920 x 1080 px | High-res campus photo or Mount Rinjani view |
| **Head of Office** | `public/images/head-of-office.jpg` | 600 x 600 px (1:1) | Professional portrait photo |
| **News Photos** | `public/images/news-1.jpg`, `news-2.jpg`, `news-3.jpg` | 800 x 500 px (16:10) | Recent international activity photos |
| **Partner Logos** | `public/partners/partner-1.svg` to `partner-6.svg` | Vector SVG or 240 x 80 px PNG | Official partner university logos |

> [!TIP]
> Replacing the files in `public/images/` with real `.jpg` or `.png` files of the same name will immediately update the website without modifying components.

---

## 📦 Building and Static Export

To generate the static bundle for campus server deployment:

```bash
npm run build
```

Next.js will compile the TypeScript code, generate static HTML for all locales, and output the standalone distribution in the `out/` folder:

```
out/
├── index.html        # Root redirect to /id/
├── id/
│   └── index.html    # Static Indonesian page
├── en/
│   └── index.html    # Static English page
├── images/           # Compressed images
├── partners/         # Partner logos
├── _next/            # Minified JavaScript & CSS bundles
├── sitemap.xml       # Bilingual XML sitemap
└── robots.txt        # Search engine directives
```

To test the exported static site locally using a lightweight HTTP server:
```bash
npx --yes serve out -p 8080
```
Then visit `http://localhost:8080`.

---

## 🌐 Deploying to Campus Servers (Apache / Nginx)

Because the project is built with `output: 'export'`, the `out/` folder is 100% self-contained static HTML, CSS, and JS. No Node.js runtime, PM2, or server daemon is required.

### Deploying to Nginx
Upload the contents of `out/` to `/var/www/unram-io` and add this server block to your Nginx configuration:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name io.unram.ac.id;

    root /var/www/unram-io;
    index index.html;

    # Gzip Compression for maximum Lighthouse performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /id/index.html;
    }

    # Cache static assets for 1 year
    location /_next/static {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### Deploying to Apache (.htaccess)
Create an `.htaccess` file inside `out/`:

```apache
RewriteEngine On
RewriteBase /

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

---

## ⚡ Lighthouse & Accessibility Standards

- **Semantic Landmark Structure**: `<header>`, `<main id="main-content">`, `<nav>`, `<section>`, `<article>`, `<footer>`
- **Accessibility**:
  - Hidden "Skip to main content" link for keyboard and screen reader navigation
  - Full keyboard navigation on mobile menu drawer, language switcher, and FAQ accordion
  - High-contrast color choices adhering to WCAG 2.1 AA standards
  - `prefers-reduced-motion` media queries disable auto-scrolling and rapid transforms for users with motion sensitivity
- **SEO & Multilingual Standards**:
  - Valid `alternate hreflang` links between `/id/` and `/en/`
  - Canonical URLs generated per locale
  - Open Graph and Twitter Card tags configured with full dimensions and titles
  - Dynamic `sitemap.xml` and `robots.txt`

---

## 👥 Support & Maintenance
- **Office**: Kantor Urusan Internasional (KUI) Universitas Mataram
- **Address**: Gedung Rektorat UNRAM Lt. 1, Jl. Majapahit No. 62, Mataram, NTB 83125
- **Official Email**: `io@unram.ac.id`
- **Campus Portal**: [https://unram.ac.id](https://unram.ac.id)
