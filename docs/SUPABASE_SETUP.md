# Panduan Konfigurasi Supabase - UNRAM OIA CMS

Panduan ini berisi langkah-demi-langkah persiapan database dan penyimpanan media Supabase untuk website resmi Office of International Affairs (OIA) Universitas Mataram.

---

## 1. Persiapan Akun & Project

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda:
   - **URL Project**: `https://dscmuuilmrkwtuxmmyap.supabase.co`
2. Pastikan Anda memiliki kunci publik:
   - **Publishable Key**: `sb_publishable_Wx8MHUI4VevODX-m43atrw_UUUA9KB4`
3. Nilai ini sudah dikonfigurasi di file `.env.local` pada repository web.

---

## 2. Menonaktifkan Pendaftaran Publik (*Sign-up Disabling*)

Karena web ini merupakan website institusi resmi kampus, orang luar tidak boleh mendaftar sendiri sebagai pengguna:

1. Di menu sidebar kiri Supabase, klik **Authentication** &rarr; **Configuration** (atau tab **Providers** / **Sign In / Sign Up**).
2. Temukan opsi **Allow new users to sign up** (Izinkan pendaftaran pengguna baru).
3. Matikan / matikan centang (toggle **OFF**) pada opsi tersebut.
4. Klik tombol **Save** di pojok kanan bawah.

---

## 3. Menjalankan Skrip Inisialisasi Database (SQL)

1. Di sidebar kiri Supabase, klik **SQL Editor**.
2. Klik tombol **New query**.
3. Buka file [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) di text editor Anda, lalu salin (*copy*) seluruh isinya.
4. Tempel (*paste*) ke dalam SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
6. Pastikan muncul pesan sukses: `Success. No rows returned`.

Skrip ini secara otomatis membuat:
- Tabel: `admin_users`, `site_content_draft`, `site_content_published`, dan `site_content_versions`.
- Fungsi keamanan: `is_admin()` dan `publish_site_content(note)`.
- Kebijakan Row Level Security (RLS) ketat untuk mencegah akses tanpa hak.
- Bucket Supabase Storage: `site-media` (maksimal 10 MB, publik baca, admin tulis).

---

## 4. Membuat Akun Admin Baru

1. Di sidebar kiri, klik **Authentication** &rarr; **Users**.
2. Klik tombol hijau **Add user** di pojok kanan atas, lalu pilih **Create user**.
3. Masukkan:
   - **User Email**: misal `admin.oia@unram.ac.id` (atau email kerja admin yang dikehendaki).
   - **User Password**: Masukkan kata sandi yang kuat dan aman.
   - **Auto Confirm User**: **Centang (Check)** opsi ini agar akun langsung aktif tanpa perlu konfirmasi email SMTP.
4. Klik **Create user**.

---

## 5. Mendaftarkan Hak Akses Admin

Setelah akun dibuat, daftarkan email tersebut ke tabel `admin_users` agar memiliki hak akses CMS:

1. Buka kembali **SQL Editor**.
2. Buka file [`supabase/migrations/0002_seed_admin.sql`](../supabase/migrations/0002_seed_admin.sql).
3. Ganti `'admin.oia@unram.ac.id'` dengan email yang Anda buat pada Langkah 4:
   ```sql
   INSERT INTO public.admin_users (user_id, email, role)
   SELECT id, email, 'admin'
   FROM auth.users
   WHERE email = 'admin.oia@unram.ac.id'
   ON CONFLICT (user_id) DO UPDATE SET
     email = EXCLUDED.email,
     role = 'admin';
   ```
4. Klik **Run**.

---

## 6. Kueri Verifikasi Keamanan & Status

Jalankan kueri berikut di SQL Editor untuk memverifikasi seluruh komponen telah siap:

```sql
-- 1. Cek daftar admin yang terdaftar
SELECT u.id, u.email, a.role, a.created_at
FROM auth.users u
JOIN public.admin_users a ON a.user_id = u.id;

-- 2. Cek status bucket storage
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'site-media';

-- 3. Cek status RLS pada tabel
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'site_content_draft', 'site_content_published', 'site_content_versions');
```
*Hasil yang diharapkan: Seluruh `rowsecurity` bernilai `true`.*

---

## 7. Mengaktifkan Multi-Factor Authentication (MFA) - *Opsional / Direkomendasikan*

Untuk keamanan ekstra pengelola website kampus:
1. Masuk ke **Authentication** &rarr; **Policies / MFA**.
2. Pastikan **Time-based One-time Password (TOTP)** aktif.
3. Admin dapat menautkan aplikasi Google Authenticator saat pertama kali login jika fitur TOTP diwajibkan oleh kebijakan TI universitas.

---

## 8. Selesai!

Sekarang Anda dapat membuka `http://localhost:3000/en/admin` (atau domain produksi di server kampus), lalu login menggunakan email dan password yang telah didaftarkan.
