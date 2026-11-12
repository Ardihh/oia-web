# Panduan Konfigurasi Supabase - UNRAM OIA CMS

Panduan ini berisi langkah-demi-langkah persiapan database dan penyimpanan media Supabase untuk website resmi Office of International Affairs (OIA) Universitas Mataram.

---

## 1. Persiapan Akun & Project

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda:
   - **URL Project**: `https://dscmuuilmrkwtuxmmyap.supabase.co`
2. Pastikan Anda memiliki kunci publik:
   - **Publishable Key**: Tersedia di `.env.local`
3. Catatan Keamanan: **Jangan pernah meminta, membuat, atau menggunakan `service_role` secret key**. Seluruh otorisasi sistem diatur oleh Row Level Security (RLS) dan fungsi `public.is_admin()`.

---

## 2. Menonaktifkan Pendaftaran Publik (*Sign-up Disabling*)

Karena web ini merupakan website institusi resmi kampus, pihak luar tidak diizinkan mendaftar sendiri:

1. Di sidebar kiri Supabase, klik **Authentication** &rarr; **Configuration** (atau **Providers** / **Sign In / Sign Up**).
2. Temukan opsi **Allow new users to sign up** (Izinkan pendaftaran pengguna baru).
3. Matikan / nonaktifkan centang (toggle **OFF**) pada opsi tersebut.
4. Simpan perubahan.

---

## 3. Langkah Migrasi Database (Wajib Dilakukan Bertahap)

### ⚠️ PERINGATAN: Lakukan Backup Terlebih Dahulu
Sebelum mengeksekusi migrasi SQL apa pun di SQL Editor:
1. Buka dashboard CMS `/admin` pada sistem yang sedang berjalan.
2. Buka tab **Cadangan & Ekspor (Backup)** lalu unduh file cadangan JSON (`site-content-backup.json`).
3. Simpan file cadangan tersebut di tempat yang aman.

---

### Migrasi 1: Inisialisasi Sistem Awal (`0001_init.sql` & `0002_seed_admin.sql`)
*(Hanya jika membangun database dari awal pada project Supabase baru)*
1. Jalankan `supabase/migrations/0001_init.sql` di SQL Editor.
2. Daftarkan email admin di `supabase/migrations/0002_seed_admin.sql` lalu jalankan.

---

### Migrasi 2: Sistem Live Content (`0003_live_content.sql`)
1. Buka file [`supabase/migrations/0003_live_content.sql`](../supabase/migrations/0003_live_content.sql).
2. Salin seluruh isi skrip dan jalankan di SQL Editor Supabase.
3. Skrip ini bersifat **ADDITIVE** (tidak menghapus data lama):
   - Membuat tabel `site_content` dan menyalin baris dari `site_content_published` secara otomatis.
   - Mengaktifkan trigger audit riwayat `site_content_history` (100 riwayat terakhir).
   - Mendaftarkan RPC aman `save_site_section` dan `restore_site_content`.
   - Mengunci penulisan langsung dari publik menggunakan RLS.

---

### Migrasi 3: Pemisahan Berita ke Tabel Relasional (`0004_news_articles.sql`)
1. Buka file [`supabase/migrations/0004_news_articles.sql`](../supabase/migrations/0004_news_articles.sql).
2. Salin seluruh isi skrip dan jalankan di SQL Editor Supabase.
3. Skrip ini:
   - Membuat tabel relasional `news_articles` dan tabel revisi `news_article_revisions`.
   - Menerapkan RLS ketat: Publik anonim HANYA bisa membaca berita dengan `status = 'published'` dan `published_at <= now()`. Draf berita **100% tertutup dan tidak dapat dibaca** via public API key.
   - Memigrasikan berita lama dari `site_content_published->'news'` secara otomatis ke tabel baru.

---

## 4. Kueri Verifikasi Keamanan & Integritas Data

Jalankan kueri berikut di SQL Editor Supabase untuk memastikan seluruh migrasi berhasil 100%:

```sql
-- 1. Cek tabel dan RLS aktif
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('site_content', 'site_content_history', 'news_articles', 'news_article_revisions', 'admin_users');
-- Expected: Seluruh tabel mengembalikan rowsecurity = true

-- 2. Cek baris konten utama telah terisi
SELECT id, version, updated_at
FROM public.site_content
WHERE id = 'main';

-- 3. Cek migrasi artikel berita
SELECT id, slug, status, published_at, title->>'id' AS judul_id
FROM public.news_articles
ORDER BY published_at DESC;

-- 4. Verifikasi bahwa Anon TIDAK BISA membaca draf berita:
-- Jalankan simulasi hak akses anonim:
SET ROLE anon;

-- Kueri ini HANYA boleh mengembalikan artikel yang terbit (published):
SELECT id, slug, status FROM public.news_articles;

-- Kueri ini HARUS mengembalikan 0 baris (draf tidak bocor ke publik):
SELECT id, slug, status FROM public.news_articles WHERE status = 'draft';

-- Kembalikan role ke postgres:
RESET ROLE;
```

---

## 5. Rencana Rollback (Jika Diperlukan)

Karena migrasi bersifat strictly additive:
- Tabel lama `site_content_published` dan `site_content_draft` tetap utuh.
- Jika merge dibatalkan atau terjadi masalah tak terduga, website di branch `main` tetap membaca `site_content_published` secara normal tanpa downtime.
