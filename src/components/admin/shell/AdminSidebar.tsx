import React from 'react';
import {
  LayoutGrid,
  BookOpen,
  Sparkles,
  BarChart3,
  FileText,
  HelpCircle,
  Phone,
  Newspaper,
  Handshake,
  History,
  Activity,
  HardDrive,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export type AdminTab =
  | 'hero'
  | 'about'
  | 'services'
  | 'stats'
  | 'guides'
  | 'faq'
  | 'contact'
  | 'news'
  | 'partners'
  | 'history'
  | 'diagnostics'
  | 'backup';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Konten Halaman',
    items: [
      { id: 'hero', label: 'Hero & Banner', icon: LayoutGrid },
      { id: 'about', label: 'Tentang Kami', icon: BookOpen },
      { id: 'services', label: 'Layanan KUI', icon: Sparkles },
      { id: 'stats', label: 'Capaian Dampak', icon: BarChart3 },
      { id: 'guides', label: 'Panduan & Berkas', icon: FileText },
      { id: 'faq', label: 'Tanya Jawab (FAQ)', icon: HelpCircle },
      { id: 'contact', label: 'Narahubung & Alamat', icon: Phone },
    ],
  },
  {
    title: 'Publikasi',
    items: [
      { id: 'news', label: 'Berita & Pengumuman', icon: Newspaper },
      { id: 'partners', label: 'Mitra Kerja Sama', icon: Handshake },
    ],
  },
  {
    title: 'Sistem & Data',
    items: [
      { id: 'history', label: 'Riwayat Perubahan', icon: History },
      { id: 'diagnostics', label: 'Diagnostik Sistem', icon: Activity },
      { id: 'backup', label: 'Cadangkan & Pulihkan', icon: HardDrive },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
  className?: string;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
  userEmail,
  onSignOut,
  className = '',
}: AdminSidebarProps) {
  return (
    <aside
      className={`h-full flex flex-col bg-[#0B192C] text-slate-300 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
              OIA
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-white tracking-wide truncate">
                CMS KUI UNRAM
              </h1>
              <p className="text-[10px] text-slate-400 truncate">Sistem Live Editing</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            OIA
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded transition-colors"
            title={isCollapsed ? 'Perluas Menu' : 'Perkecil Menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 flex-shrink-0 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-medium flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white font-medium truncate">
                  {userEmail || 'Admin KUI'}
                </p>
                <p className="text-[10px] text-slate-400">Editor Resmi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Keluar Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
