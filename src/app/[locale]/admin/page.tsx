'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import {
  BookOpen,
  FileDown,
  FileText,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Eye,
  Calendar,
  Tag,
  Upload,
  RefreshCw,
  ShieldCheck,
  FileJson,
  Sparkles,
  User,
  BarChart3,
  HelpCircle,
  Phone,
  LayoutGrid,
  Save,
  CheckCircle2,
  Languages,
  Loader2,
  Wand2,
  AlertTriangle,
  Archive,
  HardDrive,
  FolderDown,
  AlertCircle,
  X,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import {
  useSiteContent,
  defaultSiteContent,
  SiteContent,
  StatItem,
  ServiceItem,
  FaqItem,
  GuideItem,
  NewsArticle,
  defaultGuides,
  defaultNews,
} from '@/context/ContentContext';
import { ArticleListView } from '@/components/admin/news/ArticleListView';
import { ArticleEditor } from '@/components/admin/news/ArticleEditor';
import { ArticlePreviewModal } from '@/components/admin/news/ArticlePreviewModal';
import {
  getDraftFromDb,
  saveDraftToDb,
  saveBlobToDb,
  getMetadata,
  setMetadata,
  clearLocalDraft,
  getStorageEstimate,
} from '@/lib/db';
import { compressImage, computeContentHash } from '@/lib/imageCompression';
import {
  generatePublishBundle,
  inspectPublishBundle,
  ImportPreview,
} from '@/lib/bundleZip';
import { validateSiteContent, downloadRawBackup } from '@/lib/schemaValidator';
import { isValidHttpsUrl, isValidGoogleMapsEmbedUrl } from '@/lib/domPurify';

// SHA-256 hash of default passcode 'unram2026'
const DEFAULT_PASSCODE_HASH = '47d6a9d851060c7e5a5037a8dfad149fbe0698199058b22f140086eeced8193a';

async function computeSha256(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const PRESET_CATEGORIES = [
  { id: 'Program Mobilitas', en: 'Mobility Program' },
  { id: 'Kemitraan Global', en: 'Global Partnership' },
  { id: 'Mahasiswa Asing', en: 'International Students' },
  { id: 'Beasiswa Internasional', en: 'International Scholarships' },
  { id: 'Riset & Konferensi', en: 'Research & Conference' },
  { id: 'Kunjungan Delegasi', en: 'Delegation Visit' },
  { id: 'Adaptasi Budaya', en: 'Cultural Immersion' },
  { id: 'Pengumuman Resmi', en: 'Official Announcement' },
];

const PRESET_GUIDE_CATEGORIES = [
  { id: 'Mahasiswa Internasional', en: 'International Students' },
  { id: 'Program Outbound & IISMA', en: 'Outbound & IISMA' },
  { id: 'Dosen & Riset Global', en: 'Faculty & Global Research' },
  { id: 'Visa & Izin Tinggal', en: 'Visa & Stay Permits' },
  { id: 'Formulir Pendaftaran', en: 'Application Forms' },
  { id: 'Peraturan Akademik', en: 'Academic Regulations' },
];

function getTodayFormattedDate() {
  const now = new Date();
  const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return {
    id: `${day} ${monthsId[now.getMonth()]} ${year}`,
    en: `${day} ${monthsEn[now.getMonth()]} ${year}`,
  };
}

// Free public translation helper
async function translateText(text: string, from: 'id' | 'en', to: 'id' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${from}|${to}`
    );
    const data = await res.json();
    if (data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (e) {
    console.error('Translation error:', e);
  }
  return text;
}

type TabType = 'news' | 'guides' | 'hero' | 'about' | 'stats' | 'services' | 'faq' | 'contact' | 'export';

export default function AdminPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const { content, updateContent, resetContent } = useSiteContent();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Section Content State (Draft)
  const [siteDraft, setSiteDraft] = useState<SiteContent>(content || defaultSiteContent);

  // News State
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [newsView, setNewsView] = useState<'list' | 'editor'>('list');
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Guides & Handbooks State
  const [guideForm, setGuideForm] = useState<GuideItem>({
    id: '',
    title: { id: '', en: '' },
    category: { id: PRESET_GUIDE_CATEGORIES[0].id, en: PRESET_GUIDE_CATEGORIES[0].en },
    desc: { id: '', en: '' },
    fileUrl: '',
    fileSize: 'PDF • 2.5 MB',
    updatedAt: getTodayFormattedDate().id,
  });
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [editGuideId, setEditGuideId] = useState<string | null>(null);

  // Storage & Export State
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(false);
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ usedMb: number; quotaMb: number; percentUsed: number } | null>(null);
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [bundleDownloadSuccess, setBundleDownloadSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importFilename, setImportFilename] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmInput, setClearConfirmInput] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);

  const refreshStorage = () => {
    getStorageEstimate().then(setStorageUsage).catch(() => {});
  };

  // Check auth & load data on mount (with one-time localStorage to IndexedDB migration)
  useEffect(() => {
    setMounted(true);
    const savedAuth = sessionStorage.getItem('unram_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    const initData = async () => {
      try {
        const existingDraft = await getDraftFromDb();
        if (!existingDraft) {
          // Check for legacy localStorage content
          const legacyContentRaw = localStorage.getItem('unram_site_content_v4');
          const legacyNewsRaw = localStorage.getItem('unram_custom_news');

          let initial: SiteContent = defaultSiteContent;
          let hadLegacy = false;

          if (legacyContentRaw) {
            try {
              const parsed = JSON.parse(legacyContentRaw);
              const val = validateSiteContent(parsed);
              if (val.valid && val.sanitizedContent) {
                initial = val.sanitizedContent;
                hadLegacy = true;
              }
            } catch {}
          }

          if (legacyNewsRaw) {
            try {
              const parsedNews = JSON.parse(legacyNewsRaw);
              if (Array.isArray(parsedNews)) {
                initial.news = parsedNews;
                hadLegacy = true;
              }
            } catch {}
          }

          await saveDraftToDb(initial);
          setSiteDraft(initial);
          if (Array.isArray(initial.news)) setNewsList(initial.news);

          if (hadLegacy) {
            showToast('Draf lama dari penyimpanan lokal berhasil dimigrasikan ke IndexedDB.');
          }
        } else {
          setSiteDraft(existingDraft);
          if (Array.isArray(existingDraft.news)) setNewsList(existingDraft.news);
        }

        // Load export metadata
        const lastExport = await getMetadata('last_exported_at');
        setLastExportedAt(lastExport);
        const unexported = await getMetadata('has_unexported_changes');
        setHasUnexportedChanges(Boolean(unexported));
      } catch (err: any) {
        setStorageError(`Gagal memuat database draf: ${err?.message || 'Unknown error'}`);
      }

      refreshStorage();
    };

    initData();
  }, []);

  // Inactivity Auto-Logout (60 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    let lastActivity = Date.now();

    const onActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 60 * 60 * 1000) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('unram_admin_auth');
        alert(
          isEn
            ? 'Admin session expired automatically after 60 minutes of inactivity.'
            : 'Sesi admin berakhir otomatis setelah 60 menit inaktivitas.'
        );
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, isEn]);

  // Warn on leaving with unexported changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnexportedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnexportedChanges]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const computed = await computeSha256(passcode.trim());
      const targetHash = (process.env.NEXT_PUBLIC_ADMIN_PASSCODE_HASH || DEFAULT_PASSCODE_HASH)
        .toLowerCase()
        .trim();

      if (computed === targetHash) {
        setIsAuthenticated(true);
        sessionStorage.setItem('unram_admin_auth', 'true');
        setPasscodeError(false);
      } else {
        setPasscodeError(true);
      }
    } catch {
      setPasscodeError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('unram_admin_auth');
  };

  // Save full site sections into IndexedDB
  const handleSaveSections = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate URLs
    const contact = siteDraft.contact;
    if (contact.mapUrl && !isValidGoogleMapsEmbedUrl(contact.mapUrl)) {
      alert('URL Google Maps Embed tidak valid. Pastikan menggunakan tautan embed resmi Google Maps.');
      return;
    }

    const socials = [
      (contact as any).socialInstagram,
      (contact as any).socialLinkedin,
      (contact as any).socialYoutube,
      (contact as any).socialWhatsapp,
    ];
    for (const url of socials) {
      if (url && url.trim() && !isValidHttpsUrl(url)) {
        alert(`URL "${url}" tidak valid. Semua tautan sosial media wajib menggunakan protokol https://`);
        return;
      }
    }

    const finalDraft = {
      ...siteDraft,
      contact: {
        ...siteDraft.contact,
        addressContent: {
          id: siteDraft.contact.addressContent.id,
          en: siteDraft.contact.addressContent.en || siteDraft.contact.addressContent.id,
        },
        hoursValue: {
          id: siteDraft.contact.hoursValue.id,
          en: siteDraft.contact.hoursValue.en || siteDraft.contact.hoursValue.id,
        },
      },
    };

    try {
      await saveDraftToDb(finalDraft);
      updateContent(finalDraft);
      setHasUnexportedChanges(true);
      setSaveSuccess(true);
      setStorageError(null);
      refreshStorage();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setStorageError(err.message || 'Gagal menyimpan draf ke IndexedDB.');
      alert(`Gagal menyimpan: ${err.message || 'Penyimpanan lokal bermasalah.'}`);
    }
  };

  // Image File helper (compressed and stored as blob in IndexedDB)
  const handleImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoad: (pathOrUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await compressImage(file);
        await saveBlobToDb(result.path, result.blob, result.filename, result.blob.type);
        onLoad(result.path);
        setHasUnexportedChanges(true);
        refreshStorage();
        showToast(
          `Gambar berhasil dikompresi (${Math.round(result.originalSize / 1024)} KB → ${Math.round(
            result.compressedSize / 1024
          )} KB)`
        );
      } catch (err: any) {
        alert(err.message || 'Gagal memproses gambar.');
      }
    }
  };

  // Document/PDF File helper
  const handleDocumentFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoad: (path: string, fileName: string, fileSizeStr: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeBytes = file.size;
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeStr = `${ext} • ${sizeMb} MB`;

      if (sizeBytes > 10 * 1024 * 1024) {
        alert(
          `Peringatan: Ukuran dokumen (${sizeMb} MB) melebihi 10 MB. File berukuran besar membutuhkan waktu unduh lebih lama bagi pengunjung.`
        );
      }

      try {
        const arrayBuf = await file.arrayBuffer();
        const hash = await computeContentHash(arrayBuf);
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const filename = `doc-${hash}.${fileExt}`;
        const path = `/uploads/${filename}`;
        await saveBlobToDb(path, file, filename, file.type || 'application/pdf');
        onLoad(path, file.name, sizeStr);
        setHasUnexportedChanges(true);
        refreshStorage();
        showToast('Dokumen berhasil diunggah ke draf lokal.');
      } catch (err: any) {
        alert(err.message || 'Gagal mengunggah dokumen.');
      }
    }
  };

  // ==================== AUTO TRANSLATION HANDLERS ====================
  // Auto translate Guidebook
  const handleAutoTranslateGuide = async (sourceLang: 'id' | 'en') => {
    const targetLang = sourceLang === 'id' ? 'en' : 'id';
    setIsTranslating(true);
    try {
      const titleSource = guideForm.title[sourceLang];
      const descSource = guideForm.desc[sourceLang];
      const catSource = guideForm.category[sourceLang];

      const [translatedTitle, translatedDesc, translatedCat] = await Promise.all([
        translateText(titleSource, sourceLang, targetLang),
        translateText(descSource, sourceLang, targetLang),
        translateText(catSource, sourceLang, targetLang),
      ]);

      setGuideForm({
        ...guideForm,
        title: { ...guideForm.title, [targetLang]: translatedTitle },
        desc: { ...guideForm.desc, [targetLang]: translatedDesc },
        category: { ...guideForm.category, [targetLang]: translatedCat },
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto translate Hero
  const handleAutoTranslateHero = async (sourceLang: 'id' | 'en') => {
    const targetLang = sourceLang === 'id' ? 'en' : 'id';
    setIsTranslating(true);
    try {
      const [p, h, s] = await Promise.all([
        translateText(siteDraft.hero.titlePrefix[sourceLang], sourceLang, targetLang),
        translateText(siteDraft.hero.titleHighlight[sourceLang], sourceLang, targetLang),
        translateText(siteDraft.hero.subtitle[sourceLang], sourceLang, targetLang),
      ]);
      setSiteDraft({
        ...siteDraft,
        hero: {
          ...siteDraft.hero,
          titlePrefix: { ...siteDraft.hero.titlePrefix, [targetLang]: p },
          titleHighlight: { ...siteDraft.hero.titleHighlight, [targetLang]: h },
          subtitle: { ...siteDraft.hero.subtitle, [targetLang]: s },
        },
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // ==================== NEWS CRUD (REDESIGNED) ====================
  const handleSaveNewsArticle = async (article: NewsArticle, isPublish: boolean) => {
    let updated: NewsArticle[];
    const existingIndex = newsList.findIndex((item) => item.id === article.id);
    if (existingIndex >= 0) {
      updated = newsList.map((item) => (item.id === article.id ? article : item));
    } else {
      updated = [article, ...newsList];
    }

    setNewsList(updated);

    const updatedDraft = {
      ...siteDraft,
      news: updated as any,
    };
    setSiteDraft(updatedDraft);
    updateContent(updatedDraft);

    try {
      await saveDraftToDb(updatedDraft);
      setHasUnexportedChanges(true);
      await setMetadata('has_unexported_changes', true);
      refreshStorage();
    } catch (err) {
      console.error('Failed to save draft to IndexedDB:', err);
    }

    if (isPublish) {
      showToast(
        isEn ? 'Article published successfully!' : 'Berita berhasil diterbitkan!'
      );
      setNewsView('list');
      setEditingArticle(null);
    } else {
      // Draft / autosave: keep editor open and active
      setEditingArticle(article);
    }
  };

  const handleDeleteNewsArticle = async (id: string) => {
    const updated = newsList.filter((item) => item.id !== id);
    setNewsList(updated);

    const updatedDraft = {
      ...siteDraft,
      news: updated as any,
    };
    setSiteDraft(updatedDraft);
    updateContent(updatedDraft);

    try {
      await saveDraftToDb(updatedDraft);
      setHasUnexportedChanges(true);
      await setMetadata('has_unexported_changes', true);
      refreshStorage();
    } catch (err) {
      console.error('Failed to delete news from draft db:', err);
    }

    showToast(isEn ? 'Article deleted' : 'Berita berhasil dihapus');
  };

  const handleStartEditNews = (article: NewsArticle) => {
    setEditingArticle(article);
    setNewsView('editor');
  };

  const handleCreateNewArticle = () => {
    setEditingArticle(null);
    setNewsView('editor');
  };

  const handlePreviewNewsArticle = (article: NewsArticle) => {
    setPreviewArticle(article);
  };

  // ==================== GUIDES & HANDBOOKS CRUD ====================
  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    const currGuides = Array.isArray(siteDraft.guides) && siteDraft.guides.length > 0
      ? siteDraft.guides
      : defaultGuides;

    let updated: GuideItem[];
    if (editGuideId) {
      updated = currGuides.map((item) =>
        item.id === editGuideId ? { ...guideForm, id: editGuideId } : item
      );
    } else {
      const newGuide: GuideItem = {
        ...guideForm,
        id: `guide-${Date.now()}`,
        updatedAt: guideForm.updatedAt || getTodayFormattedDate().id,
      };
      updated = [newGuide, ...currGuides];
    }

    const updatedDraft = {
      ...siteDraft,
      guides: updated,
    };
    setSiteDraft(updatedDraft);
    updateContent(updatedDraft);

    try {
      await saveDraftToDb(updatedDraft);
      setHasUnexportedChanges(true);
      await setMetadata('has_unexported_changes', true);
      refreshStorage();
    } catch (err) {
      console.error('Failed to save guide to draft db:', err);
    }

    resetGuideForm();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleEditGuide = (item: GuideItem) => {
    setGuideForm(item);
    setEditGuideId(item.id);
    setIsEditingGuide(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteGuide = async (id: string) => {
    if (confirm(isEn ? 'Delete this guidebook/document?' : 'Hapus buku panduan/dokumen ini?')) {
      const currGuides = Array.isArray(siteDraft.guides) ? siteDraft.guides : defaultGuides;
      const updated = currGuides.filter((item) => item.id !== id);
      const updatedDraft = {
        ...siteDraft,
        guides: updated,
      };
      setSiteDraft(updatedDraft);
      updateContent(updatedDraft);

      try {
        await saveDraftToDb(updatedDraft);
        setHasUnexportedChanges(true);
        await setMetadata('has_unexported_changes', true);
        refreshStorage();
      } catch (err) {
        console.error('Failed to save guide deletion to draft db:', err);
      }

      if (editGuideId === id) resetGuideForm();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // ==================== BUNDLE EXPORT & IMPORT ====================
  const handleExportBundle = async () => {
    setIsExportingBundle(true);
    try {
      const { zipBlob, filename, stats } = await generatePublishBundle(siteDraft);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const nowIso = new Date().toISOString();
      await setMetadata('last_exported_at', nowIso);
      await setMetadata('has_unexported_changes', false);
      setLastExportedAt(nowIso);
      setHasUnexportedChanges(false);
      setBundleDownloadSuccess(
        `Paket "${filename}" berhasil dibuat (${stats.articlesCount} berita, ${stats.guidesCount} panduan, ${stats.uploadsCount} file aset).`
      );
      showToast('Paket publikasi berhasil diunduh!');
    } catch (err: any) {
      alert(`Gagal membuat paket publikasi: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExportingBundle(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportFilename(file.name);
    try {
      const preview = await inspectPublishBundle(file);
      setImportPreview(preview);
    } catch (err: any) {
      alert(`Gagal membaca berkas bundle: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleApplyImport = async () => {
    if (!importPreview) return;
    try {
      await importPreview.apply();
      const importedDraft = importPreview.content;
      setSiteDraft(importedDraft);
      if (Array.isArray(importedDraft.news)) {
        setNewsList(importedDraft.news);
      }
      updateContent(importedDraft);
      setHasUnexportedChanges(false);
      await setMetadata('has_unexported_changes', false);
      setImportPreview(null);
      refreshStorage();
      showToast('Paket publikasi berhasil diterapkan ke draf lokal!');
    } catch (err: any) {
      alert(`Gagal menerapkan paket: ${err?.message || 'Error'}`);
    }
  };

  const handleDownloadRawJson = () => {
    downloadRawBackup(
      JSON.stringify(siteDraft, null, 2),
      `unram-site-content-draft-${new Date().toISOString().slice(0, 10)}.json`
    );
    showToast('Cadangan mentah JSON berhasil diunduh.');
  };

  const handleClearLocalDraft = async () => {
    if (clearConfirmInput.trim() !== 'HAPUS') {
      alert('Ketik "HAPUS" secara tepat untuk mengonfirmasi penghapusan draf.');
      return;
    }
    try {
      await clearLocalDraft();
      localStorage.removeItem('unram_site_content_v4');
      localStorage.removeItem('unram_custom_news');
      setShowClearModal(false);
      setClearConfirmInput('');
      setSiteDraft(defaultSiteContent);
      setNewsList(defaultSiteContent.news || []);
      updateContent(defaultSiteContent);
      setHasUnexportedChanges(false);
      await setMetadata('has_unexported_changes', false);
      refreshStorage();
      showToast('Draf lokal berhasil dibersihkan.');
    } catch (err: any) {
      alert(`Gagal menghapus draf: ${err?.message}`);
    }
  };

  const resetGuideForm = () => {
    setEditGuideId(null);
    setIsEditingGuide(false);
    setGuideForm({
      id: '',
      title: { id: '', en: '' },
      category: { id: PRESET_GUIDE_CATEGORIES[0].id, en: PRESET_GUIDE_CATEGORIES[0].en },
      desc: { id: '', en: '' },
      fileUrl: '',
      fileSize: 'PDF • 2.5 MB',
      updatedAt: getTodayFormattedDate().id,
    });
  };

  // ==================== DYNAMIC SECTION BLOCKS ====================
  // 1. Mission Items (Add/Remove)
  const addMissionItem = () => {
    const currId = Array.isArray(siteDraft.about?.missionItems?.id)
      ? siteDraft.about.missionItems.id
      : defaultSiteContent.about.missionItems.id;
    const currEn = Array.isArray(siteDraft.about?.missionItems?.en)
      ? siteDraft.about.missionItems.en
      : defaultSiteContent.about.missionItems.en;
    setSiteDraft({
      ...siteDraft,
      about: {
        ...siteDraft.about,
        missionItems: {
          id: [...currId, 'Poin misi baru...'],
          en: [...currEn, 'New mission point...'],
        },
      },
    });
  };

  const removeMissionItem = (index: number) => {
    const currId = Array.isArray(siteDraft.about?.missionItems?.id)
      ? siteDraft.about.missionItems.id
      : defaultSiteContent.about.missionItems.id;
    const currEn = Array.isArray(siteDraft.about?.missionItems?.en)
      ? siteDraft.about.missionItems.en
      : defaultSiteContent.about.missionItems.en;
    setSiteDraft({
      ...siteDraft,
      about: {
        ...siteDraft.about,
        missionItems: {
          id: currId.filter((_, i) => i !== index),
          en: currEn.filter((_, i) => i !== index),
        },
      },
    });
  };

  // 2. Services (Add/Remove)
  const addServiceItem = () => {
    const currServices = Array.isArray(siteDraft.services?.items)
      ? siteDraft.services.items
      : defaultSiteContent.services.items;
    const newService: ServiceItem = {
      id: `service-${Date.now()}`,
      title: { id: 'Layanan Baru KUI', en: 'New International Service' },
      desc: {
        id: 'Deskripsi penjelasan layanan internasional baru di Universitas Mataram...',
        en: 'Description of the new international service at Universitas Mataram...',
      },
      href: '#contact',
    };
    setSiteDraft({
      ...siteDraft,
      services: {
        ...siteDraft.services,
        items: [...currServices, newService],
      },
    });
  };

  const removeServiceItem = (id: string) => {
    const currServices = Array.isArray(siteDraft.services?.items)
      ? siteDraft.services.items
      : defaultSiteContent.services.items;
    if (currServices.length <= 1) {
      alert(isEn ? 'You must keep at least 1 service item.' : 'Minimal harus ada 1 layanan.');
      return;
    }
    setSiteDraft({
      ...siteDraft,
      services: {
        ...siteDraft.services,
        items: currServices.filter((item) => item.id !== id),
      },
    });
  };

  // 3. Stats (Add/Remove)
  const addStatItem = () => {
    const currStats = Array.isArray(siteDraft.stats?.items)
      ? siteDraft.stats.items
      : defaultSiteContent.stats.items;
    const newStat: StatItem = {
      id: `stat-${Date.now()}`,
      value: '10',
      suffix: '+',
      label: { id: 'Metrik Baru', en: 'New Metric' },
      desc: { id: 'Keterangan statistik baru', en: 'New statistical description' },
    };
    setSiteDraft({
      ...siteDraft,
      stats: {
        ...siteDraft.stats,
        items: [...currStats, newStat],
      },
    });
  };

  const removeStatItem = (id: string) => {
    const currStats = Array.isArray(siteDraft.stats?.items)
      ? siteDraft.stats.items
      : defaultSiteContent.stats.items;
    if (currStats.length <= 1) {
      alert(isEn ? 'You must keep at least 1 stat card.' : 'Minimal harus ada 1 kartu statistik.');
      return;
    }
    setSiteDraft({
      ...siteDraft,
      stats: {
        ...siteDraft.stats,
        items: currStats.filter((item) => item.id !== id),
      },
    });
  };

  // 4. FAQ (Add/Remove)
  const addFaqItem = () => {
    const currFaq = Array.isArray(siteDraft.faq?.items)
      ? siteDraft.faq.items
      : defaultSiteContent.faq.items;
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      q: { id: 'Pertanyaan baru seputar studi / visa?', en: 'New query regarding studies or visa?' },
      a: { id: 'Jawaban penjelasan resmi dari Kantor Urusan Internasional UNRAM.', en: 'Official explanation from the International Affairs Office of UNRAM.' },
    };
    setSiteDraft({
      ...siteDraft,
      faq: {
        ...siteDraft.faq,
        items: [...currFaq, newFaq],
      },
    });
  };

  const removeFaqItem = (id: string) => {
    const currFaq = Array.isArray(siteDraft.faq?.items)
      ? siteDraft.faq.items
      : defaultSiteContent.faq.items;
    if (currFaq.length <= 1) {
      alert(isEn ? 'You must keep at least 1 FAQ item.' : 'Minimal harus ada 1 FAQ.');
      return;
    }
    setSiteDraft({
      ...siteDraft,
      faq: {
        ...siteDraft.faq,
        items: currFaq.filter((item) => item.id !== id),
      },
    });
  };

  // SSR guard
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-unram-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ==================== AUTH GATE SCREEN ====================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-200/80 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-unram-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-md">
              <Lock className="w-7 h-7" aria-hidden="true" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900">
              {isEn ? 'KUI UNRAM Admin Portal' : 'Portal Admin KUI UNRAM'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isEn
                ? 'Dynamic Content Management with Auto-Translate'
                : 'CMS Visual Dinamis dengan Terjemahan Otomatis'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                {isEn ? 'Passcode' : 'Kunci Akses / Passcode'}
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                placeholder={isEn ? 'Enter passcode (default: unram2026)' : 'Masukkan kunci akses (default: unram2026)'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus-visible:border-unram-900 focus-visible:ring-2 focus-visible:ring-unram-900 transition-all"
              />
              {passcodeError && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5">
                  {isEn ? 'Incorrect passcode. Try again.' : 'Kunci akses salah. Silakan coba lagi.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98]"
            >
              {isEn ? 'Enter Admin Dashboard' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              {isEn
                ? 'Convenience gate for static hosting. For university production servers, protect /admin via server Basic Auth or IP allowlist.'
                : 'Gerbang kenyamanan untuk hosting statis. Pada server produksi universitas, lindungi direktori /admin dengan HTTP Basic Auth atau allowlist IP.'}
            </p>
            <a
              href={`/${locale}/`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-unram-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isEn ? 'Back to Website' : 'Kembali ke Website'}</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD SCREEN ====================
  const navTabs = [
    { key: 'news', label: isEn ? 'News Articles' : 'Berita & Kegiatan', icon: Tag },
    { key: 'guides', label: isEn ? 'Guidebooks & Files' : 'Buku & File Panduan', icon: BookOpen },
    { key: 'hero', label: isEn ? 'Hero & Banner' : 'Hero & Banner', icon: Sparkles },
    { key: 'about', label: isEn ? 'About & Mission' : 'Profil & Misi', icon: User },
    { key: 'stats', label: isEn ? 'Impact Stats' : 'Statistik Dampak', icon: BarChart3 },
    { key: 'services', label: isEn ? 'Services' : 'Layanan KUI', icon: LayoutGrid },
    { key: 'faq', label: isEn ? 'FAQ' : 'Tanya Jawab (FAQ)', icon: HelpCircle },
    { key: 'contact', label: isEn ? 'Contact Info' : 'Kontak & Alamat', icon: Phone },
    { key: 'export', label: isEn ? 'Publish Bundle & Backup' : 'Paket Publikasi & Cadangan', icon: Archive },
  ];

  const isEditingArticleView = activeTab === 'news' && newsView === 'editor';

  return (
    <div className={`bg-slate-50 text-slate-800 ${isEditingArticleView ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen pb-24'}`}>
      {/* Top Header */}
      <header className="h-[60px] flex-shrink-0 bg-unram-950 text-white border-b border-unram-800 sticky top-0 z-50 shadow-md flex items-center">
        <Container className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.png" alt="UNRAM" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-sm sm:text-base leading-tight text-white">
                {isEn ? 'UNRAM International Office CMS' : 'Dashboard Konten KUI UNRAM'}
              </h2>
              <p className="text-xs text-amber-300 font-semibold">
                Universitas Mataram (Lombok, Indonesia)
              </p>
            </div>
          </div>

          {/* Status & Storage indicators */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {hasUnexportedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ada perubahan belum diekspor</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersinkronisasi</span>
              </span>
            )}

            <span className="text-white/20">|</span>

            <span className="text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {storageUsage ? `${storageUsage.usedMb} MB` : '...'}
              </span>
            </span>

            {lastExportedAt && (
              <>
                <span className="text-white/20">|</span>
                <span className="text-slate-400 text-xs hidden lg:inline">
                  Ekspor terakhir: {new Date(lastExportedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href={`/${locale}/`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isEn ? 'View Live Site' : 'Lihat Website'}</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-bold text-white transition-colors"
            >
              {isEn ? 'Logout' : 'Keluar'}
            </button>
          </div>
        </Container>
      </header>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold shadow-sm flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isEn
              ? 'Changes saved! The live website is now updated with your latest content.'
              : 'Perubahan berhasil disimpan! Website Anda kini menampilkan konten dan foto terbaru.'}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      {!isEditingArticleView && (
        <div className="bg-white border-b border-slate-200/90 sticky top-[60px] z-40 shadow-subtle overflow-x-auto">
          <Container>
            <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key as TabType);
                      if (tab.key === 'news') {
                        setNewsView('list');
                        setEditingArticle(null);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-unram-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Container>
        </div>
      )}

      {/* Editor View takes full width when editing news */}
      {isEditingArticleView && (
        <ArticleEditor
          initialArticle={editingArticle}
          categories={PRESET_CATEGORIES}
          onBack={() => {
            setNewsView('list');
            setEditingArticle(null);
          }}
          onSave={handleSaveNewsArticle}
          onPreview={handlePreviewNewsArticle}
        />
      )}

      {/* Standard Tab Containers (List View for news, or other tabs) */}
      {!isEditingArticleView && (
        <Container className="pt-8">
          {/* ==================== TAB 1: NEWS (REDESIGNED LIST VIEW) ==================== */}
          {activeTab === 'news' && (
            <ArticleListView
              articles={newsList}
              categories={PRESET_CATEGORIES}
              activeLang={isEn ? 'en' : 'id'}
              onNewArticle={handleCreateNewArticle}
              onEditArticle={handleStartEditNews}
              onDeleteArticle={handleDeleteNewsArticle}
              onPreviewArticle={handlePreviewNewsArticle}
            />
          )}

          {/* ==================== TAB: GUIDES & HANDBOOKS ==================== */}
        {activeTab === 'guides' && (
          <div className="space-y-8">
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-unram-900" />
                    <span>
                      {isEditingGuide
                        ? (isEn ? 'Edit Guidebook / File' : 'Edit Buku & File Panduan')
                        : (isEn ? 'Add New Guidebook / File' : 'Tambah Buku & File Panduan Baru')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEn
                      ? 'Upload handbooks, application forms, or guidelines shown in the Admission section.'
                      : 'Kelola buku panduan mahasiswa asing, formulir pendaftaran, atau pedoman beasiswa yang tampil di section Penerimaan.'}
                  </p>
                </div>

                {/* Auto Translate Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => handleAutoTranslateGuide('id')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors disabled:opacity-50"
                  >
                    {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-amber-600" />}
                    <span>⚡ Terjemahkan (ID &rarr; EN)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => handleAutoTranslateGuide('en')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-200 transition-colors disabled:opacity-50"
                  >
                    {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>⚡ Translate (EN &rarr; ID)</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveGuide} className="space-y-5">
                {/* Category & File Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kategori Dokumen / Panduan
                    </label>
                    <select
                      value={guideForm.category.id}
                      onChange={(e) => {
                        const matched = PRESET_GUIDE_CATEGORIES.find((c) => c.id === e.target.value);
                        if (matched) {
                          setGuideForm({ ...guideForm, category: matched });
                        } else {
                          setGuideForm({
                            ...guideForm,
                            category: { id: e.target.value, en: e.target.value },
                          });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                    >
                      {PRESET_GUIDE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.id} ({cat.en})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Format & Ukuran File (contoh: PDF • 3.2 MB)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="PDF • 2.5 MB"
                      value={guideForm.fileSize}
                      onChange={(e) => setGuideForm({ ...guideForm, fileSize: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Title ID & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Judul Panduan / Dokumen (Bahasa Indonesia)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Buku Panduan Mahasiswa Internasional 2026/2027"
                      value={guideForm.title.id}
                      onChange={(e) =>
                        setGuideForm({
                          ...guideForm,
                          title: { ...guideForm.title, id: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Judul Panduan (Bahasa Inggris)</span>
                      <span className="text-[11px] text-amber-600 font-semibold">Bisa Terjemah Otomatis</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. International Student Handbook 2026/2027"
                      value={guideForm.title.en}
                      onChange={(e) =>
                        setGuideForm({
                          ...guideForm,
                          title: { ...guideForm.title, en: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Description ID & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Deskripsi Singkat (Bahasa Indonesia)
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Jelaskan isi pedoman, sasaran pembaca, atau syarat yang tercakup..."
                      value={guideForm.desc.id}
                      onChange={(e) =>
                        setGuideForm({
                          ...guideForm,
                          desc: { ...guideForm.desc, id: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Deskripsi Singkat (Bahasa Inggris)</span>
                      <span className="text-[11px] text-amber-600 font-semibold">Bisa Terjemah Otomatis</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Brief description in English..."
                      value={guideForm.desc.en}
                      onChange={(e) =>
                        setGuideForm({
                          ...guideForm,
                          desc: { ...guideForm.desc, en: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* File URL or File Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    File Dokumen / Tautan Unduhan
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      required
                      value={guideForm.fileUrl.startsWith('data:') ? '(File Dokumen Terunggah)' : guideForm.fileUrl}
                      onChange={(e) => setGuideForm({ ...guideForm, fileUrl: e.target.value })}
                      placeholder="https://io.unram.ac.id/documents/guidebook.pdf"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                    <label className="w-full sm:w-auto flex-shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{isEn ? 'Upload File' : 'Unggah File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          handleDocumentFile(e, (dataUrl, fileName, sizeStr) => {
                            setGuideForm({
                              ...guideForm,
                              fileUrl: dataUrl,
                              fileSize: sizeStr,
                            });
                          })
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bisa berupa tautan dokumen langsung (Google Drive / Cloud / URL PDF) atau unggah berkas PDF langsung.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isEditingGuide
                        ? (isEn ? 'Save Guidebook' : 'Simpan Perubahan')
                        : (isEn ? 'Publish Guidebook' : 'Terbitkan Panduan')}
                    </span>
                  </button>
                  {isEditingGuide && (
                    <button
                      type="button"
                      onClick={resetGuideForm}
                      className="px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Guidebooks List */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card">
              <h3 className="font-heading font-bold text-xl text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <span>{isEn ? 'Published Handbooks & Guidebooks' : 'Daftar Buku Panduan & Dokumen Aktif'}</span>
                <span className="text-xs font-semibold text-slate-500">
                  Total: {((siteDraft.guides && siteDraft.guides.length) || defaultGuides.length)} file
                </span>
              </h3>
              <div className="space-y-4">
                {((Array.isArray(siteDraft.guides) && siteDraft.guides.length > 0)
                  ? siteDraft.guides
                  : defaultGuides
                ).map((guide) => (
                  <div
                    key={guide.id}
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-unram-900 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-unram-100 text-unram-900">
                            {guide.category?.id || 'Dokumen'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-medium">
                            {guide.fileSize}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            &bull; {guide.updatedAt || '2026'}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 mt-1">
                          {guide.title?.id || guide.title?.en}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {guide.desc?.id || guide.desc?.en}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      {guide.fileUrl && (
                        <a
                          href={guide.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-unram-900 hover:bg-slate-100 inline-flex items-center gap-1"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditGuide(guide)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGuide(guide.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: HERO & BANNER ==================== */}
        {activeTab === 'hero' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  {isEn ? 'Hero Section & Banner Photo' : 'Hero Section & Foto Banner Utama'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ganti teks judul, subjudul, dan foto latar kampus.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={() => handleAutoTranslateHero('id')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200"
                  title="Terjemahkan teks Hero dari Indonesia ke Inggris"
                >
                  {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-amber-600" />}
                  <span>⚡ Terjemahkan (ID &rarr; EN)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSections}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEn ? 'Save Changes' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </div>

            {/* Banner Photo Upload */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Foto Latar Belakang Hero (Campus Backdrop)
              </label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:w-56 h-32 rounded-xl overflow-hidden bg-unram-950 border border-slate-300 flex-shrink-0">
                  <Image
                    src={siteDraft.hero.bgImage}
                    alt="Hero Background"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    value={siteDraft.hero.bgImage.startsWith('data:') ? '(Foto Baru Diunggah)' : siteDraft.hero.bgImage}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        hero: { ...siteDraft.hero, bgImage: e.target.value },
                      })
                    }
                    placeholder="/images/hero-campus.jpg"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold uppercase tracking-wider transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto Baru dari Komputer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFile(e, (url) =>
                          setSiteDraft({
                            ...siteDraft,
                            hero: { ...siteDraft.hero, bgImage: url },
                          })
                        )
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Headline and Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Awalan Judul (ID)
                </label>
                <input
                  type="text"
                  value={siteDraft.hero.titlePrefix.id}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        titlePrefix: { ...siteDraft.hero.titlePrefix, id: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Title Prefix (EN)
                </label>
                <input
                  type="text"
                  value={siteDraft.hero.titlePrefix.en}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        titlePrefix: { ...siteDraft.hero.titlePrefix, en: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Teks Warna Emas / Highlight (ID)
                </label>
                <input
                  type="text"
                  value={siteDraft.hero.titleHighlight.id}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        titleHighlight: { ...siteDraft.hero.titleHighlight, id: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Gold Highlight Text (EN)
                </label>
                <input
                  type="text"
                  value={siteDraft.hero.titleHighlight.en}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        titleHighlight: { ...siteDraft.hero.titleHighlight, en: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subjudul Paragraf Hero (ID)
                </label>
                <textarea
                  rows={3}
                  value={siteDraft.hero.subtitle.id}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        subtitle: { ...siteDraft.hero.subtitle, id: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hero Subtitle Paragraph (EN)
                </label>
                <textarea
                  rows={3}
                  value={siteDraft.hero.subtitle.en}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      hero: {
                        ...siteDraft.hero,
                        subtitle: { ...siteDraft.hero.subtitle, en: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ABOUT & DYNAMIC MISSION ITEMS ==================== */}
        {activeTab === 'about' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Profil, Visi, Misi & Sambutan Kepala Kantor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola deskripsi, foto Kepala Kantor, dan tambah/kurang poin misi secara dinamis.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSections}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>

            {/* ── Deskripsi Kantor ── */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">
                Deskripsi Tentang Kantor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Paragraf 1 (ID)
                  </label>
                  <textarea
                    rows={3}
                    value={siteDraft.about.description1?.id || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, description1: { ...siteDraft.about.description1, id: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Deskripsi singkat tentang KUI/IAO UNRAM..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Paragraph 1 (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={siteDraft.about.description1?.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, description1: { ...siteDraft.about.description1, en: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Short description about IAO UNRAM..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Paragraf 2 (ID)
                  </label>
                  <textarea
                    rows={3}
                    value={siteDraft.about.description2?.id || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, description2: { ...siteDraft.about.description2, id: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Paragraf deskripsi tambahan..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Paragraph 2 (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={siteDraft.about.description2?.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, description2: { ...siteDraft.about.description2, en: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Additional description paragraph..."
                  />
                </div>
              </div>
            </div>

            {/* ── Visi ── */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">Visi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Judul Visi (ID)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.about.visionTitle?.id || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, visionTitle: { ...siteDraft.about.visionTitle, id: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Visi Internasional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Vision Title (EN)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.about.visionTitle?.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, visionTitle: { ...siteDraft.about.visionTitle, en: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Our Vision"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Deskripsi Visi (ID)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.about.visionDesc?.id || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, visionDesc: { ...siteDraft.about.visionDesc, id: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Pernyataan visi..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Vision Description (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.about.visionDesc?.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, visionDesc: { ...siteDraft.about.visionDesc, en: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Vision statement..."
                  />
                </div>
              </div>
            </div>

            {/* ── Misi Header ── */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">Judul Misi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Judul Misi (ID)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.about.missionTitle?.id || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, missionTitle: { ...siteDraft.about.missionTitle, id: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Misi Strategis"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mission Title (EN)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.about.missionTitle?.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: { ...siteDraft.about, missionTitle: { ...siteDraft.about.missionTitle, en: e.target.value } },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="Our Mission"
                  />
                </div>
              </div>
            </div>

            {/* Head of Office Photo & Author */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">
                Foto & Identitas Kepala Kantor
              </h4>
              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-unram-900 border-2 border-amber-400 shadow-md flex-shrink-0">
                  <Image
                    src={siteDraft.about.headPhoto}
                    alt="Head of Office"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 w-full space-y-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold uppercase tracking-wider transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto Kepala Kantor</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFile(e, (url) =>
                          setSiteDraft({
                            ...siteDraft,
                            about: { ...siteDraft.about, headPhoto: url },
                          })
                        )
                      }
                      className="hidden"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Nama Kepala Kantor"
                      value={siteDraft.about.messageAuthor.id}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          about: {
                            ...siteDraft.about,
                            messageAuthor: { ...siteDraft.about.messageAuthor, id: e.target.value, en: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Jabatan"
                      value={siteDraft.about.messageRole.id}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          about: {
                            ...siteDraft.about,
                            messageRole: { ...siteDraft.about.messageRole, id: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kutipan Sambutan (ID)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.about.messageQuote.id}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: {
                          ...siteDraft.about,
                          messageQuote: { ...siteDraft.about.messageQuote, id: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Welcome Quote (EN)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.about.messageQuote.en}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        about: {
                          ...siteDraft.about,
                          messageQuote: { ...siteDraft.about.messageQuote, en: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Mission Points (Add / Remove) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">
                    Poin-Poin Misi Strategis (Dinamis)
                  </h4>
                  <p className="text-xs text-slate-500">Anda dapat menambah atau mengurangi jumlah poin misi.</p>
                </div>
                <button
                  type="button"
                  onClick={addMissionItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-unram-900 text-white text-xs font-bold hover:bg-unram-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Poin Misi</span>
                </button>
              </div>

              <div className="space-y-3">
                {(Array.isArray(siteDraft.about?.missionItems?.id) ? siteDraft.about.missionItems.id : defaultSiteContent.about.missionItems.id).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-unram-100 text-unram-900 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Poin Misi (ID)"
                        value={item}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.about?.missionItems?.id) ? siteDraft.about.missionItems.id : defaultSiteContent.about.missionItems.id;
                          const updated = [...base];
                          updated[idx] = e.target.value;
                          setSiteDraft({
                            ...siteDraft,
                            about: {
                              ...siteDraft.about,
                              missionItems: { ...siteDraft.about.missionItems, id: updated },
                            },
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Mission Point (EN)"
                        value={siteDraft.about?.missionItems?.en?.[idx] || ''}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.about?.missionItems?.en) ? siteDraft.about.missionItems.en : defaultSiteContent.about.missionItems.en;
                          const updated = [...base];
                          updated[idx] = e.target.value;
                          setSiteDraft({
                            ...siteDraft,
                            about: {
                              ...siteDraft.about,
                              missionItems: { ...siteDraft.about.missionItems, en: updated },
                            },
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMissionItem(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus poin misi ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3B: ADMISSION STEPS ==================== */}
        {activeTab === 'about' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Langkah Penerimaan Mahasiswa Internasional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola langkah-langkah alur pendaftaran yang tampil di halaman publik bagian &ldquo;Penerimaan&rdquo;.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                      ? siteDraft.admissionSteps
                      : (defaultSiteContent.admissionSteps || []);
                    const newStep = {
                      id: `step-${Date.now()}`,
                      title: { id: 'Langkah Baru', en: 'New Step' },
                      desc: { id: 'Deskripsi langkah baru...', en: 'New step description...' },
                    };
                    setSiteDraft({ ...siteDraft, admissionSteps: [...base, newStep] });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-unram-900 text-white text-xs font-bold hover:bg-unram-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Langkah</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSections}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                ? siteDraft.admissionSteps
                : (defaultSiteContent.admissionSteps || [])
              ).map((step, idx) => (
                <div key={step.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-full bg-unram-100 text-unram-900 text-sm font-bold flex items-center justify-center">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                          ? siteDraft.admissionSteps
                          : (defaultSiteContent.admissionSteps || []);
                        setSiteDraft({ ...siteDraft, admissionSteps: base.filter((_, i) => i !== idx) });
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Judul Langkah (ID)
                      </label>
                      <input
                        type="text"
                        value={step.title?.id || ''}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                            ? siteDraft.admissionSteps
                            : (defaultSiteContent.admissionSteps || []);
                          const updated = [...base];
                          updated[idx] = { ...updated[idx], title: { ...updated[idx].title, id: e.target.value } };
                          setSiteDraft({ ...siteDraft, admissionSteps: updated });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                        placeholder="Judul langkah dalam Bahasa Indonesia"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Step Title (EN)
                      </label>
                      <input
                        type="text"
                        value={step.title?.en || ''}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                            ? siteDraft.admissionSteps
                            : (defaultSiteContent.admissionSteps || []);
                          const updated = [...base];
                          updated[idx] = { ...updated[idx], title: { ...updated[idx].title, en: e.target.value } };
                          setSiteDraft({ ...siteDraft, admissionSteps: updated });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                        placeholder="Step title in English"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Deskripsi (ID)
                      </label>
                      <textarea
                        rows={2}
                        value={step.desc?.id || ''}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                            ? siteDraft.admissionSteps
                            : (defaultSiteContent.admissionSteps || []);
                          const updated = [...base];
                          updated[idx] = { ...updated[idx], desc: { ...updated[idx].desc, id: e.target.value } };
                          setSiteDraft({ ...siteDraft, admissionSteps: updated });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                        placeholder="Penjelasan langkah ini..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Description (EN)
                      </label>
                      <textarea
                        rows={2}
                        value={step.desc?.en || ''}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.admissionSteps) && siteDraft.admissionSteps.length > 0
                            ? siteDraft.admissionSteps
                            : (defaultSiteContent.admissionSteps || []);
                          const updated = [...base];
                          updated[idx] = { ...updated[idx], desc: { ...updated[idx].desc, en: e.target.value } };
                          setSiteDraft({ ...siteDraft, admissionSteps: updated });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                        placeholder="Description of this step..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: IMPACT STATS (DYNAMIC ADD/REMOVE) ==================== */}
        {activeTab === 'stats' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Kartu Statistik Dampak Internasional (Dinamis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah atau kurangi jumlah kartu counter statistik sesuai kebutuhan kantor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addStatItem}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kartu Statistik</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSections}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items).map((stat, index) => (
                <div key={stat.id || index} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-unram-900">
                      Kartu #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStatItem(stat.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Hapus kartu ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kartu</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Angka (45)"
                      value={stat.value}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], value: e.target.value };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-24 px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Suffix (+)"
                      value={stat.suffix}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], suffix: e.target.value };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-16 px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 text-center"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label (ID)"
                      value={stat.label.id}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], label: { ...updated[index].label, id: e.target.value } };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Label (EN)"
                      value={stat.label.en}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], label: { ...updated[index].label, en: e.target.value } };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan singkat (ID)"
                      value={stat.desc.id}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], desc: { ...updated[index].desc, id: e.target.value } };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Description (EN)"
                      value={stat.desc.en}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.stats?.items) ? siteDraft.stats.items : defaultSiteContent.stats.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], desc: { ...updated[index].desc, en: e.target.value } };
                        setSiteDraft({ ...siteDraft, stats: { ...siteDraft.stats, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: SERVICES (DYNAMIC ADD/REMOVE & AUTO-TRANSLATE) ==================== */}
        {activeTab === 'services' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Layanan KUI UNRAM (Dinamis: Tambah / Hapus Blok)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anda bisa menambah kartu layanan baru atau menghapus layanan lama sesuai kebutuhan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addServiceItem}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Layanan Baru</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSections}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {(Array.isArray(siteDraft.services?.items) ? siteDraft.services.items : defaultSiteContent.services.items).map((service, index) => (
                <div key={service.id || index} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-unram-900">
                      Blok Layanan #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(service.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Layanan</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Judul Layanan (ID)
                      </label>
                      <input
                        type="text"
                        value={service.title.id}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.services?.items) ? siteDraft.services.items : defaultSiteContent.services.items;
                          const updated = [...base];
                          updated[index] = { ...updated[index], title: { ...updated[index].title, id: e.target.value } };
                          setSiteDraft({ ...siteDraft, services: { ...siteDraft.services, items: updated } });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Service Title (EN)
                      </label>
                      <input
                        type="text"
                        value={service.title.en}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.services?.items) ? siteDraft.services.items : defaultSiteContent.services.items;
                          const updated = [...base];
                          updated[index] = { ...updated[index], title: { ...updated[index].title, en: e.target.value } };
                          setSiteDraft({ ...siteDraft, services: { ...siteDraft.services, items: updated } });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Penjelasan Layanan (ID)
                      </label>
                      <textarea
                        rows={2}
                        value={service.desc.id}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.services?.items) ? siteDraft.services.items : defaultSiteContent.services.items;
                          const updated = [...base];
                          updated[index] = { ...updated[index], desc: { ...updated[index].desc, id: e.target.value } };
                          setSiteDraft({ ...siteDraft, services: { ...siteDraft.services, items: updated } });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Service Description (EN)
                      </label>
                      <textarea
                        rows={2}
                        value={service.desc.en}
                        onChange={(e) => {
                          const base = Array.isArray(siteDraft.services?.items) ? siteDraft.services.items : defaultSiteContent.services.items;
                          const updated = [...base];
                          updated[index] = { ...updated[index], desc: { ...updated[index].desc, en: e.target.value } };
                          setSiteDraft({ ...siteDraft, services: { ...siteDraft.services, items: updated } });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: FAQ (DYNAMIC ADD/REMOVE & AUTO-TRANSLATE) ==================== */}
        {activeTab === 'faq' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Tanya Jawab / FAQ (Dinamis: Tambah / Hapus Pertanyaan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola daftar accordion FAQ yang muncul di website utama.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pertanyaan Baru</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSections}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {(Array.isArray(siteDraft.faq?.items) ? siteDraft.faq.items : defaultSiteContent.faq.items).map((item, index) => (
                <div key={item.id || index} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-unram-900">
                      Pertanyaan #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaqItem(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus FAQ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Pertanyaan (ID)"
                      value={item.q.id}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.faq?.items) ? siteDraft.faq.items : defaultSiteContent.faq.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], q: { ...updated[index].q, id: e.target.value } };
                        setSiteDraft({ ...siteDraft, faq: { ...siteDraft.faq, items: updated } });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Question (EN)"
                      value={item.q.en}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.faq?.items) ? siteDraft.faq.items : defaultSiteContent.faq.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], q: { ...updated[index].q, en: e.target.value } };
                        setSiteDraft({ ...siteDraft, faq: { ...siteDraft.faq, items: updated } });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                      rows={2}
                      placeholder="Jawaban (ID)"
                      value={item.a.id}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.faq?.items) ? siteDraft.faq.items : defaultSiteContent.faq.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], a: { ...updated[index].a, id: e.target.value } };
                        setSiteDraft({ ...siteDraft, faq: { ...siteDraft.faq, items: updated } });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer (EN)"
                      value={item.a.en}
                      onChange={(e) => {
                        const base = Array.isArray(siteDraft.faq?.items) ? siteDraft.faq.items : defaultSiteContent.faq.items;
                        const updated = [...base];
                        updated[index] = { ...updated[index], a: { ...updated[index].a, en: e.target.value } };
                        setSiteDraft({ ...siteDraft, faq: { ...siteDraft.faq, items: updated } });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 7: CONTACT INFO ==================== */}
        {activeTab === 'contact' && (
          <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900">
                  Kontak Kantor, Alamat & Jam Operasional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah alamat, nomor WhatsApp, email resmi, dan tautan Google Maps.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSections}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Alamat Kantor Rektorat (Bahasa Indonesia)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.contact.addressContent.id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSiteDraft({
                        ...siteDraft,
                        contact: {
                          ...siteDraft.contact,
                          addressContent: {
                            id: val,
                            en: siteDraft.contact.addressContent.en || val,
                          },
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Office Address (English)
                  </label>
                  <textarea
                    rows={2}
                    value={siteDraft.contact.addressContent.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        contact: {
                          ...siteDraft.contact,
                          addressContent: { ...siteDraft.contact.addressContent, en: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={siteDraft.contact.emailValue}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        contact: { ...siteDraft.contact, emailValue: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={siteDraft.contact.phoneValue}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        contact: { ...siteDraft.contact, phoneValue: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Jam Layanan Kantor (Bahasa Indonesia)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.contact.hoursValue.id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSiteDraft({
                        ...siteDraft,
                        contact: {
                          ...siteDraft.contact,
                          hoursValue: {
                            id: val,
                            en: siteDraft.contact.hoursValue.en || val,
                          },
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Office Hours (English)
                  </label>
                  <input
                    type="text"
                    value={siteDraft.contact.hoursValue.en || ''}
                    onChange={(e) =>
                      setSiteDraft({
                        ...siteDraft,
                        contact: {
                          ...siteDraft.contact,
                          hoursValue: { ...siteDraft.contact.hoursValue, en: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Google Maps Embed URL
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={siteDraft.contact.mapUrl || ''}
                  onChange={(e) =>
                    setSiteDraft({
                      ...siteDraft,
                      contact: { ...siteDraft.contact, mapUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                />
              </div>

              {/* Social Media Links */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-unram-900">
                  Link Media Sosial / Social Media Links
                </h4>
                <p className="text-xs text-slate-500">Kosongkan field jika tidak ingin ditampilkan di halaman utama.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={(siteDraft.contact as any).socialInstagram || ''}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          contact: { ...siteDraft.contact, socialInstagram: e.target.value } as any,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/..."
                      value={(siteDraft.contact as any).socialLinkedin || ''}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          contact: { ...siteDraft.contact, socialLinkedin: e.target.value } as any,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={(siteDraft.contact as any).socialYoutube || ''}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          contact: { ...siteDraft.contact, socialYoutube: e.target.value } as any,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      WhatsApp URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://wa.me/628..."
                      value={(siteDraft.contact as any).socialWhatsapp || ''}
                      onChange={(e) =>
                        setSiteDraft({
                          ...siteDraft,
                          contact: { ...siteDraft.contact, socialWhatsapp: e.target.value } as any,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 8: PUBLISH BUNDLE & BACKUP ==================== */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Card 1: Buat Paket Publikasi */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                    <FolderDown className="w-5 h-5 text-unram-900" />
                    <span>Buat Paket Publikasi (Export ZIP)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Hasilkan paket ZIP siap rilis untuk web server statis universitas. Berisi berkas{' '}
                    <code className="text-unram-700 font-mono bg-unram-50 px-1 py-0.5 rounded">content/site-content.json</code>,
                    seluruh aset gambar & dokumen di{' '}
                    <code className="text-unram-700 font-mono bg-unram-50 px-1 py-0.5 rounded">uploads/</code>{' '}
                    dengan hash konten, serta panduan unggah <code className="text-unram-700 font-mono bg-unram-50 px-1 py-0.5 rounded">README.txt</code>.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isExportingBundle}
                  onClick={handleExportBundle}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-unram-900 hover:bg-unram-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {isExportingBundle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Paket...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Buat & Unduh Paket (.zip)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Status Draf Lokal:</span>
                  {hasUnexportedChanges ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Ada perubahan belum diekspor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Semua perubahan tersimpan rapi
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Terakhir Diekspor:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {lastExportedAt
                      ? new Date(lastExportedAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Belum pernah diekspor'}
                  </span>
                </div>
              </div>

              {/* Download Instructions Box */}
              {bundleDownloadSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>{bundleDownloadSuccess}</span>
                  </div>
                  <div className="text-xs text-emerald-950 space-y-2 pt-2 border-t border-emerald-200/60 leading-relaxed">
                    <p className="font-bold uppercase tracking-wider text-emerald-900">
                      Langkah Publikasi ke Server Universitas:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                      <li>Ekstrak arsip ZIP yang baru saja Anda unduh.</li>
                      <li>
                        Akses web server hosting UNRAM melalui FTP / SFTP / cPanel File Manager.
                      </li>
                      <li>
                        Unggah dan timpa folder <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold">content/</code> dan <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold">uploads/</code> ke direktori web root.
                      </li>
                      <li>
                        <strong>Selesai!</strong> Pengunjung website langsung melihat konten, berita, dan foto terbaru tanpa perlu proses build ulang sistem.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Pulihkan / Impor Paket */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-unram-900" />
                    <span>Pulihkan Draf dari Paket (Impor Paket)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Unggah kembali paket publikasi (<code className="text-slate-700 font-mono">.zip</code>) atau berkas cadangan (<code className="text-slate-700 font-mono">.json</code>) untuk dipulihkan ke draf lokal browser ini. Anda dapat meninjau rincian jumlah artikel dan berkas sebelum menerapkan pemulihan secara lossless.
                  </p>
                </div>

                <div>
                  <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex-shrink-0">
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membaca Berkas...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Pilih Berkas Paket (.zip / .json)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".zip,.json"
                      disabled={isImporting}
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Cadangan Mentah & Pembersihan Draf */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card space-y-6">
              <div className="pb-5 border-b border-slate-100">
                <h3 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-unram-900" />
                  <span>Cadangan Mentah & Pembersihan Draf</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola cadangan darurat format JSON dan pantau kuota penyimpanan IndexedDB lokal di peramban ini.
                </p>
              </div>

              {/* Storage Stats Bar */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Penyimpanan IndexedDB Lokal:</span>
                  <span className="font-bold text-slate-900">
                    {storageUsage
                      ? `${storageUsage.usedMb} MB terpakai dari ~${storageUsage.quotaMb} MB (${storageUsage.percentUsed}% kuota)`
                      : 'Menghitung...'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-unram-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(storageUsage?.percentUsed || 1, 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Unduh Cadangan Mentah (JSON)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Salinan lengkap struktur JSON konten saat ini tanpa menyertakan binary zip.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadRawJson}
                    className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
                  >
                    <FileDown className="w-4 h-4 text-slate-500" />
                    <span>Unduh Cadangan JSON</span>
                  </button>
                </div>

                <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Bersihkan Draf Lokal
                    </h4>
                    <p className="text-xs text-rose-700 mt-1">
                      Hapus seluruh draf lokal dan media di browser ini serta kembalikan ke konten bawaan sistem.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Draf Lokal...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </Container>
      )}

      {/* Import Confirmation Modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-unram-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-300" />
                <h3 className="font-heading font-bold text-base">Konfirmasi Impor Paket</h3>
              </div>
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Berkas paket <span className="font-bold text-slate-900 font-mono">{importFilename || 'Paket Publikasi'}</span> berhasil dibaca dan diverifikasi. Berikut adalah ringkasan konten yang akan dipulihkan ke draf lokal Anda:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-unram-900">
                    {importPreview.summary.articles}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
                    Artikel Berita
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-unram-900">
                    {importPreview.summary.guides}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
                    Buku Panduan
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-unram-900">
                    {importPreview.summary.files}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
                    Berkas Media
                  </div>
                </div>
              </div>

              {importPreview.summary.updatedAt && (
                <p className="text-xs text-slate-500">
                  Tanggal Pembuatan Paket:{' '}
                  <span className="font-semibold text-slate-700">
                    {new Date(importPreview.summary.updatedAt).toLocaleString('id-ID')}
                  </span>
                </p>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Penerapan paket ini akan menggantikan isi draf di peramban saat ini dengan konten dari paket. Proses ini berlangsung lossless.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-unram-900 hover:bg-unram-800 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan & Pulihkan ke Draf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Draft Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-heading font-bold text-base">Konfirmasi Hapus Draf</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmInput('');
                }}
                className="p-1 rounded text-rose-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Tindakan ini akan <strong>menghapus seluruh draf lokal dan file media</strong> dari penyimpanan IndexedDB peramban ini dan mengembalikan situs ke konten bawaan sistem.
              </p>
              <p className="text-xs text-rose-700 font-semibold">
                Ketik <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">HAPUS</span> di bawah ini untuk mengonfirmasi:
              </p>
              <input
                type="text"
                value={clearConfirmInput}
                onChange={(e) => setClearConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 font-mono focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              />
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={clearConfirmInput.trim() !== 'HAPUS'}
                onClick={handleClearLocalDraft}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Draf</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Live Preview Modal */}
      {previewArticle && (
        <ArticlePreviewModal
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
