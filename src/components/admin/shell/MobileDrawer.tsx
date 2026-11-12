import React from 'react';
import { X } from 'lucide-react';
import { AdminSidebar, AdminTab } from './AdminSidebar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  userEmail?: string | null;
  onSignOut: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  userEmail,
  onSignOut,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Slide-over Content */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0B192C] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="absolute top-4 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            onSelectTab(tab);
            onClose();
          }}
          userEmail={userEmail}
          onSignOut={onSignOut}
          isCollapsed={false}
          className="w-full flex-1"
        />
      </div>
    </div>
  );
}
