import type { Metadata } from 'next';
import Link from 'next/link';
import { SECTIONS, sectionHref } from '@/lib/routes';

export const metadata: Metadata = {
  title: '404 - Page Not Found / Halaman Tidak Ditemukan',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-paper flex items-center justify-center min-h-screen font-sans text-ink selection:bg-unram-600 selection:text-white p-6">
        <main className="max-w-xl w-full text-center space-y-6">
          <p className="text-xs font-mono font-medium uppercase tracking-[0.2em] text-unram-600">
            Error 404
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink leading-tight">
            Page Not Found / Halaman Tidak Ditemukan
          </h1>

          <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
            The page you are looking for may have moved or no longer exists.
            Silakan pilih tautan halaman resmi di bawah ini:
          </p>

          <div className="pt-2">
            <Link
              href="/en/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[6px] bg-accent hover:bg-accent-hover text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Back to Home / Kembali ke Beranda
            </Link>
          </div>

          <div className="pt-6 border-t border-hairline text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-soft mb-3 text-center">
              Direct Section Links / Tautan Langsung:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {SECTIONS.map((sec) => (
                <Link
                  key={sec.key}
                  href={sectionHref('en', sec.key)}
                  className="p-2.5 rounded-[4px] border border-hairline bg-surface hover:border-unram-600 hover:text-unram-600 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{sec.title.en}</span>
                  <span className="text-[10px] text-ink-soft font-mono">→</span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
