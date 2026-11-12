# Panduan Cutover Produksi (Old Publish Model ke Live Editing)

Dokumen ini menjelaskan urutan langkah pemindahan (*cutover*) website UNRAM OIA dari model lama (static export dengan tombol Publikasikan manual) ke model modern (Next.js Node/ISR dengan live editing instan per-seksi).

---

## 1. Prinsip Keamanan Cutover

1. **Strictly Additive**: Database tidak pernah menghapus (*DROP*) tabel atau data lama. Tabel `site_content_published`, `site_content_draft`, dan fungsi `publish_site_content` tetap ada dan utuh.
2. **Zero Downtime**: Produksi di branch `main` tetap membaca `site_content_published` sampai branch `live-editing` di-merge.
3. **Rollback Instan**: Jika ada kendala setelah merge, cukup revert commit merge di GitHub. Vercel akan otomatis men-deploy ulang versi stabil tanpa perlu memperbaiki database.

---

## 2. Urutan Langkah Cutover (Checklist)

### Fase A: Persiapan & Backup Database (Sebelum Merge)
- [ ] 1. Buka CMS lama di `https://oia.unram.ac.id/admin`.
- [ ] 2. Unduh file cadangan (*Backup JSON*) melalui menu Cadangan & Ekspor untuk arsip keselamatan.
- [ ] 3. Buka [Supabase Dashboard](https://supabase.com/dashboard) &rarr; **SQL Editor**.
- [ ] 4. Jalankan migrasi [`supabase/migrations/0003_live_content.sql`](../supabase/migrations/0003_live_content.sql).
- [ ] 5. Jalankan migrasi [`supabase/migrations/0004_news_articles.sql`](../supabase/migrations/0004_news_articles.sql).
- [ ] 6. Jalankan kueri verifikasi (lihat bagian 4 di [`docs/SUPABASE_SETUP.md`](SUPABASE_SETUP.md)):
  - Pastikan tabel `site_content` terisi dari `site_content_published`.
  - Pastikan artikel lama telah tersalin ke `news_articles`.
  - Pastikan role `anon` tidak bisa melihat berita berstatus `draft`.

### Fase B: Verifikasi Vercel Preview (Branch `live-editing`)
- [ ] 1. Buat Pull Request dari branch `live-editing` ke `main` di GitHub (jangan di-merge dulu).
- [ ] 2. Vercel akan secara otomatis men-deploy versi **Preview Deployment**.
- [ ] 3. Buka URL Preview tersebut di browser:
  - Buka `/en/admin` dan login.
  - Buka salah satu seksi (misal *Hero & Banner* atau *Layanan*), ubah satu kata, lalu klik tombol **Simpan**.
  - Buka tab baru dalam mode Incognito pada URL Preview yang sama &rarr; pastikan perubahan tersebut langsung terlihat oleh pengunjung tanpa tombol "Publikasikan".
  - Buat satu artikel draf baru di menu Berita &rarr; pastikan artikel draf tersebut **TIDAK MUNCUL** di halaman utama, arsip berita, maupun `/sitemap.xml`.
  - Ubah status artikel menjadi *Terbit* &rarr; pastikan langsung muncul dan bisa dibuka di `/en/news/[slug]/`.

### Fase C: Sinkronisasi Terakhir (Cutover Tool)
- [ ] 1. Jika ada perubahan konten di website lama selama proses pengembangan, buka panel **Alat Cutover** di Admin Preview: *"Salin konten saat ini ke sistem baru"*.
- [ ] 2. Alat ini akan menyalin kembali snapshot `site_content_published` terakhir ke tabel `site_content` dan memperbarui `news_articles` secara idempoten tanpa duplikasi.

### Fase D: Merge ke Branch `main` (Go-Live)
- [ ] 1. Lakukan Merge Pull Request `live-editing` ke `main` di GitHub.
- [ ] 2. Vercel akan men-deploy branch `main` ke domain produksi `https://oia.unram.ac.id`.
- [ ] 3. Buka `https://oia.unram.ac.id` dan verifikasi bahwa website berjalan normal.
- [ ] 4. Buka `https://oia.unram.ac.id/admin` dan nikmati antarmuka live editing yang baru.

---

## 3. Prosedur Rollback Darurat

Jika setelah merge ke `main` terjadi kendala tak terduga:
1. Buka repositori di GitHub &rarr; Pull Requests &rarr; pilih PR merge terakhir &rarr; klik tombol **Revert**.
2. Vercel akan langsung men-deploy ulang kode lama dalam waktu ~1 menit.
3. Karena tabel `site_content_published` tidak pernah disentuh atau dihapus oleh migrasi, website lama akan langsung berjalan normal seperti sediakala tanpa kehilangan data.
