# Panduan Deployment Server Mandiri (Self-Hosted Node.js VPS)
**Website Kantor Urusan Internasional (OIA) - Universitas Mataram**  
**Domain Produksi:** `https://oia.unram.ac.id`

---

## 1. Ikhtisar & Arsitektur

Dokumen ini adalah panduan lengkap migrasi atau deployment website OIA UNRAM ke server VPS mandiri (Virtual Private Server) berbasis Linux Ubuntu LTS tanpa ketergantungan pada hosting Vercel.

### Komponen Sistem:
- **OS Target:** Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS
- **Runtime:** Node.js v20 LTS
- **Process Manager:** PM2 (Cluster Mode / Zero Downtime Reload)
- **Web Server & Reverse Proxy:** Nginx dengan HTTP/2 & Gzip/Brotli
- **Sertifikat SSL:** Let's Encrypt (Certbot otomatis)
- **Basis Data & CMS:** Supabase (PostgreSQL, Storage, Auth)

---

## 2. Persiapan Server VPS Baru

Jalankan perintah berikut di terminal server Ubuntu Anda:

```bash
# 1. Update sistem operasi
sudo apt update && sudo apt upgrade -y

# 2. Pasang paket dasar yang dibutuhkan
sudo apt install -y curl git ufw build-essential nginx certbot python3-certbot-nginx

# 3. Pasang Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi node dan npm
node -v # Harap pastikan v20.x.x
npm -v

# 4. Pasang PM2 secara global
sudo npm install -g pm2
```

---

## 3. Konfigurasi Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 4. Kloning Repositori & Konfigurasi Direktori

```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/oia-web
sudo chown -y $USER:$USER /var/www/oia-web

# Klon repositori
git clone https://github.com/Ardihh/oia-web.git /var/www/oia-web
cd /var/www/oia-web

# Buat file konfigurasi lingkungan (.env.production)
nano .env.production
```

Isi file `.env.production` dengan nilai berikut:

```env
NODE_ENV=production
PORT=3000

# Domain Produksi
NEXT_PUBLIC_SITE_URL=https://oia.unram.ac.id

# Supabase (Kredensial Publik & Anonim - JANGAN gunakan Service Role Key)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 5. Build Aplikasi dengan Mode Standalone

Next.js dikonfigurasi agar membuat bundel standalone super ringan saat variabel lingkungan `BUILD_STANDALONE=1` diaktifkan:

```bash
# Pasang dependensi
npm ci

# Build aplikasi dalam mode standalone
BUILD_STANDALONE=1 npm run build

# Salin folder aset statis ke bundel standalone
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

---

## 6. Konfigurasi PM2 Process Manager

Jalankan server aplikasi menggunakan PM2:

```bash
cd /var/www/oia-web
pm2 start .next/standalone/server.js --name "oia-unram" -i max

# Simpan daftar proses agar otomatis berjalan saat server restart
pm2 save
pm2 startup
# (Jalankan perintah 'sudo env PATH=...' yang ditampilkan oleh PM2)
```

Untuk memantau log aplikasi:
```bash
pm2 logs oia-unram
pm2 status
```

---

## 7. Konfigurasi Nginx Reverse Proxy

Buat file konfigurasi server block Nginx:

```bash
sudo nano /etc/nginx/sites-available/oia.unram.ac.id
```

Tempelkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name oia.unram.ac.id;

    # Batas ukuran unggah berkas (disesuaikan dengan kebutuhan upload dokumen KUI)
    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /_next/static {
        alias /var/www/oia-web/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/oia.unram.ac.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Pemasangan Sertifikat SSL (HTTPS)

Jalankan Certbot untuk mendapatkan sertifikat SSL gratis dari Let's Encrypt:

```bash
sudo certbot --nginx -d oia.unram.ac.id
```

Pilih opsi untuk me-redirect seluruh trafik HTTP ke HTTPS secara otomatis.
Certbot akan otomatis memperbarui sertifikat setiap 90 hari via timer systemd.

---

## 9. Skrip Pembaruan Otomatis (`scripts/deploy.sh`)

Untuk memperbarui aplikasi ke versi terbaru di masa mendatang, cukup jalankan skrip berikut di server:

```bash
chmod +x /var/www/oia-web/scripts/deploy.sh
/var/www/oia-web/scripts/deploy.sh
```

Skrip ini akan secara otomatis:
1. Menarik commit terbaru dari GitHub branch `main`.
2. Memasang dependensi baru (`npm ci`).
3. Membangun bundel produksi Next.js standalone.
4. Menyalin aset statis.
5. Melakukan zero-downtime reload pada proses PM2.
