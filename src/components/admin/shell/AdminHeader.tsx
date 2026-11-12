import React from 'react';
import Link from 'next/link';
import { Menu, ExternalLink, ShieldCheck, LogOut } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  locale: string;
  onOpenMobileMenu: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  hero: 'Hero & Banner Utama',
  about: 'Tentang Kami & Profil',
  services: 'Layanan Kantor Urusan Internasional',
  stats: 'Capaian & Statistik Dampak',
  guides: 'Buku Panduan & Unduhan Berkas',
  faq: 'Tanya Jawab (FAQ)',
  contact: 'Narahubung & Alamat Kantor',
  news: 'Manajemen Berita & Siaran Pers',
  partners: 'Kemitraan & Kerja Sama Internasional',
  history: 'Riwayat Versi Konten',
  diagnostics: 'Status & Diagnostik Sistem',
  backup: 'Cadangkan & Migrasi Konten',
};

export function AdminHeader({
  activeTab,
  locale,
  onOpenMobileMenu,
  userEmail,
  onSignOut,
}: AdminHeaderProps) {
  const currentTitle = TAB_TITLES[activeTab] || 'Dashboard CMS';

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
      {/* Left: Hamburger & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {currentTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Editing</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Semua perubahan tersimpan langsung diperbarui ke pengunjung situs.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          href={`/${locale}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-md transition-colors"
          title="Buka Website Publik di Tab Baru"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lihat Website</span>
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/80 rounded-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
