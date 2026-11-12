'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { AdminTab } from '@/components/admin/shell/AdminSidebar';
import { ToastMessage } from '@/components/admin/ui/Toast';
import {
  HeroSection,
  AboutSection,
  ServicesSection,
  StatsSection,
  GuidesSection,
  FaqSection,
  ContactSection,
  PartnersSection,
  NewsSection,
  HistorySection,
  DiagnosticsSection,
  BackupSection,
} from '@/components/admin/sections';
import { useSiteContent, defaultSiteContent, SiteContent } from '@/context/ContentContext';
import { getLiveContent } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const locale = useLocale();
  const { content: contextContent } = useSiteContent();

  const [activeTab, setActiveTab] = useState<AdminTab>('news');
  const [content, setContent] = useState<SiteContent>(contextContent || defaultSiteContent);
  const [version, setVersion] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, onUndo?: () => void, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({
        id: String(Date.now()),
        type,
        message,
        onUndo,
      });
    },
    []
  );

  const loadLatestContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLiveContent();
      if (res?.content) {
        setContent(res.content);
        setVersion(res.version || 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestContent();
  }, [loadLatestContent]);

  const handleSavedVersion = (newVersion: number) => {
    setVersion(newVersion);
  };

  return (
    <AdminShell
      locale={locale}
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab)}
      toast={toast}
      onCloseToast={() => setToast(null)}
    >
      {loading && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Memuat data konten terbaru dari server...</span>
        </div>
      )}

      {activeTab === 'hero' && (
        <HeroSection
          initialData={content.hero}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'about' && (
        <AboutSection
          initialData={content.about}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'services' && (
        <ServicesSection
          initialData={content.services}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'stats' && (
        <StatsSection
          initialData={content.stats}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'guides' && (
        <GuidesSection
          initialData={content.guides}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'faq' && (
        <FaqSection
          initialData={content.faq}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'contact' && (
        <ContactSection
          initialData={content.contact}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'partners' && (
        <PartnersSection
          initialData={content.partners}
          version={version}
          onSaved={handleSavedVersion}
          showToast={showToast}
        />
      )}

      {activeTab === 'news' && (
        <NewsSection
          initialNews={content.news}
          showToast={showToast}
        />
      )}

      {activeTab === 'history' && (
        <HistorySection
          showToast={showToast}
          onRestored={loadLatestContent}
        />
      )}

      {activeTab === 'diagnostics' && <DiagnosticsSection />}

      {activeTab === 'backup' && (
        <BackupSection
          currentContent={content}
          showToast={showToast}
          onRefreshContent={loadLatestContent}
        />
      )}
    </AdminShell>
  );
}
