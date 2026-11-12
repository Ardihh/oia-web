import React, { useState, useEffect } from 'react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { MobileDrawer } from './MobileDrawer';
import { AdminLogin } from './AdminLogin';
import { Toast, ToastMessage } from '../ui/Toast';
import { getSupabase, checkIsAdmin } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutes

interface AdminShellProps {
  locale: string;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  toast: ToastMessage | null;
  onCloseToast: () => void;
  children: React.ReactNode;
}

export function AdminShell({
  locale,
  activeTab,
  onSelectTab,
  toast,
  onCloseToast,
  children,
}: AdminShellProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          if (isMounted) setIsAuthenticated(false);
          return;
        }

        const isAdmin = await checkIsAdmin();
        if (isMounted) {
          if (isAdmin) {
            setIsAuthenticated(true);
            setUserEmail(sessionData.session.user.email || null);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      }
    };

    verifySession();

    // 60-Minute Inactivity tracker
    const recordActivity = () => {
      try {
        localStorage.setItem('unram_admin_activity', String(Date.now()));
      } catch {}
    };

    const checkInactivity = async () => {
      try {
        const last = localStorage.getItem('unram_admin_activity');
        if (last && Date.now() - Number(last) > INACTIVITY_LIMIT_MS) {
          const supabase = getSupabase();
          if (supabase) {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        }
      } catch {}
    };

    recordActivity();
    window.addEventListener('pointerdown', recordActivity);
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('scroll', recordActivity, { passive: true });
    const timer = setInterval(checkInactivity, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('scroll', recordActivity);
      clearInterval(timer);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs text-slate-500 font-medium">Memverifikasi sesi admin...</p>
      </div>
    );
  }

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <AdminLogin
        locale={locale}
        onSuccess={(email) => {
          setIsAuthenticated(true);
          setUserEmail(email);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Desktop / Tablet Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userEmail={userEmail}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          activeTab={activeTab}
          locale={locale}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          userEmail={userEmail}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      {/* Global Toast */}
      <Toast toast={toast} onClose={onCloseToast} />
    </div>
  );
}
