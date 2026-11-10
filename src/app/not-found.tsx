export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-paper flex items-center justify-center min-h-screen font-sans text-ink">
        <div className="text-center p-6">
          <h1 className="text-4xl font-bold text-unram-900 mb-2">404</h1>
          <p className="text-slate-600 mb-4">Page Not Found / Halaman Tidak Ditemukan</p>
          <a
            href="/en/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-unram-900 text-white text-sm font-semibold hover:bg-unram-800 transition-colors"
          >
            Back to Home / Kembali ke Beranda
          </a>
        </div>
      </body>
    </html>
  );
}
