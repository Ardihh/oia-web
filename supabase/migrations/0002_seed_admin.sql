-- ==============================================================================
-- UNRAM Office of International Affairs (OIA) CMS
-- Admin User Seeding Template
-- Migration: 0002_seed_admin.sql
-- ==============================================================================
--
-- PANDUAN PENGGUNAAN:
-- 1. Buat akun pengguna baru terlebih dahulu melalui dashboard Supabase:
--    Dashboard -> Authentication -> Users -> Klik 'Add user' -> 'Create user'
--    Masukkan email & password yang kuat, lalu centang 'Auto Confirm User'.
-- 2. Ganti nilai '<ADMIN_EMAIL>' di bawah ini dengan email yang sama.
-- 3. Salin dan jalankan perintah di bawah ini pada Supabase SQL Editor.
--

-- Ganti 'admin.oia@unram.ac.id' dengan email yang Anda buat di Authentication:
INSERT INTO public.admin_users (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin.oia@unram.ac.id'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin';

-- Verifikasi pendaftaran admin:
SELECT u.id, u.email, a.role, a.created_at
FROM auth.users u
JOIN public.admin_users a ON a.user_id = u.id;
