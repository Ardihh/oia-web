# Panduan Deployment Server Statis KUI Universitas Mataram

Dokumen ini menjelaskan arsitektur produksi, konfigurasi web server (Apache & Nginx), dan alur publikasi konten menggunakan **Publish Bundle** tanpa memerlukan Node.js runtime, basis data server, maupun proses build ulang.

---

## 1. Arsitektur Produksi: Static Export + Publish Bundle

Website Kantor Urusan Internasional UNRAM di-build dengan konfigurasi statis murni (`output: 'export'`).

```
Web Root (Server Statis Universitas)
├── index.html, en/, id/       # HTML & assets hasil build (Next.js export)
├── _next/                     # JS, CSS, fonts terkompilasi
├── content/
│   └── site-content.json      # File konten dinamis yang dibaca publik
└── uploads/
    ├── img-a1b2c3d4.webp      # Gambar terkompresi berpenamaan content-hash
    └── doc-e5f6g7h8.pdf       # Dokumen / PDF terkompresi
```

### Bagaimana Konten Diperbarui Tanpa Build Ulang?
1. Admin menyunting berita, foto, dan profil kantor di `/[locale]/admin`.
2. Draf & gambar disimpan secara lokal di browser administrator menggunakan **IndexedDB**.
3. Saat siap terbit, Administrator mengklik tombol **"Buat & Unduh Paket Publikasi (.zip)"** di tab *Paket Publikasi & Cadangan*.
4. Sistem mengekstrak seluruh gambar berukuran optimal ke folder `uploads/` dan menghasilkan file `content/site-content.json`.
5. Administrator mengunggah folder `content/` dan `uploads/` ke server web UNRAM melalui cPanel File Manager, FTP, atau SFTP.
6. **Selesai!** Seluruh pengunjung langsung melihat konten terbaru karena browser memuat `site-content.json` saat halaman dibuka.

---

## 2. Keamanan Direktori Admin (`/admin`) di Server Statis

Halaman admin memiliki gerbang sandi peramban (SHA-256). Namun, untuk keamanan optimal tingkat universitas pada web server publik, disarankan melindungi folder admin dengan autentikasi tingkat server web (HTTP Basic Auth) atau batasan IP kampus.

### Opsi A: Apache HTTP Server (`.htaccess`)

Letakkan file `.htaccess` pada root website atau buat konfigurasi pada VirtualHost:

```apache
# Aktifkan rewrite engine untuk routing statis Next.js
RewriteEngine On
RewriteBase /

# Pastikan file content/site-content.json tidak dicache oleh proxy/browser
<Files "site-content.json">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</Files>

# Lindungi direktori admin dengan HTTP Basic Authentication
<LocationMatch "^/(en|id)?/admin">
    AuthType Basic
    AuthName "Akses Khusus Pengelola KUI UNRAM"
    AuthUserFile /etc/apache2/.htpasswd_unram_admin
    Require valid-user
</LocationMatch>

# Alternatif: Hanya izinkan subnet IP kampus Universitas Mataram
# <LocationMatch "^/(en|id)?/admin">
#     Require ip 103.111.xxx.0/24
#     Require ip 127.0.0.1
# </LocationMatch>
```

Untuk membuat file `.htpasswd`:
```bash
htpasswd -c /etc/apache2/.htpasswd_unram_admin admin_kui
```

---

### Opsi B: Nginx Web Server

Tambahkan blok berikut pada konfigurasi `server { ... }` Nginx:

```nginx
# Non-cache untuk file konten JSON
location = /content/site-content.json {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}

# Lindungi halaman admin dengan Basic Auth & IP Allowlist
location ~ ^/(en|id)?/admin {
    # Batasi IP jaringan kampus (opsional)
    # allow 103.111.xxx.0/24;
    # deny all;

    auth_basic "Akses Pengelola KUI UNRAM";
    auth_basic_user_file /etc/nginx/.htpasswd_unram_admin;
    
    try_files $uri $uri/ $uri.html /index.html;
}

# Routing umum untuk Next.js Static Export
location / {
    try_files $uri $uri/ $uri.html /index.html;
}
```

---

## 3. Proses Build Awal (Bila Melakukan Pembaruan Kode)

Jika terdapat pembaruan kode frontend (komponen UI, layout, atau styling):

1. Salin `.env.example` ke `.env.production`:
   ```bash
   cp .env.example .env.production
   ```
2. Isi `NEXT_PUBLIC_ADMIN_PASSCODE_HASH` dan `NEXT_PUBLIC_WEB3FORMS_KEY` (jika menggunakan formulir online).
3. Jalankan pengujian tipe dan proses build ekspor:
   ```bash
   npm run build
   ```
4. Folder output static terletak di folder `./out/`. Unggah seluruh isi folder `./out/` ke server web Anda.

---

## 4. Kehilangan Akses atau Pemulihan Data (Disaster Recovery)

Jika administrator berganti laptop atau browser dibersihkan:
1. Unduh file `content/site-content.json` dan folder `uploads/` yang sedang aktif di server web.
2. Buat file `.zip` berisi folder `content` dan `uploads`.
3. Buka halaman admin di browser baru, masuk ke tab **Paket Publikasi & Cadangan**, lalu gunakan **"Pulihkan Draf dari Paket (Impor Paket)"**.
4. Seluruh artikel berita, draf, dan berkas media akan langsung dipulihkan ke IndexedDB secara lossless.
