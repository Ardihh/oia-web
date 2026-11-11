'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  X,
  Upload,
  Globe,
  Trash2,
  Check,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { saveBlobToDb } from '@/lib/db';

interface TiptapEditorProps {
  content: string;
  placeholder?: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({
  content,
  placeholder = 'Mulai menulis isi berita atau liputan kegiatan di sini...',
  onChange,
}: TiptapEditorProps) {
  // Modal states for Link and Image (replaces unsupported window.prompt)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-unram-600 underline underline-offset-4 hover:text-unram-800 font-medium',
        },
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4 border border-hairline shadow-sm block',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap article-prose prose prose-slate max-w-none focus:outline-none min-h-[320px] text-[18px] leading-[1.75] font-normal text-slate-800 selection:bg-unram-100 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync when external content genuinely changes (e.g. language tab switch)
  useEffect(() => {
    if (!editor) return;
    // Only update if editor is not actively focused by user to prevent typing interruption
    if (!editor.isFocused) {
      const currentHtml = editor.getHTML();
      const nextContent = content || '<p></p>';
      if (currentHtml !== nextContent) {
        editor.commands.setContent(nextContent);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[300px] p-6 rounded-xl border border-hairline bg-slate-50/50 flex items-center justify-center text-slate-400 text-xs">
        Memuat editor teks...
      </div>
    );
  }

  // Handle Link actions
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkModal(true);
  };

  const handleApplyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const formatted = cleanUrl.match(/^https?:\/\//i) ? cleanUrl : `https://${cleanUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: formatted }).run();
    }
    setShowLinkModal(false);
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
  };

  // Handle Image actions
  const openImageModal = () => {
    setImageUrl('');
    setImageAlt('');
    setImagePreview(null);
    setShowImageModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressError(null);

    try {
      const result = await compressImage(file);
      await saveBlobToDb(result.path, result.blob, result.filename, result.blob.type);
      setImageUrl(result.path);
      setImagePreview(result.dataUrl);
    } catch (err: any) {
      setCompressError(err.message || 'Gagal memproses gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInsertImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalSrc = imageUrl.trim();
    if (finalSrc) {
      editor
        .chain()
        .focus()
        .setImage({ src: finalSrc, alt: imageAlt.trim() || undefined })
        .run();
    }
    setShowImageModal(false);
    setImagePreview(null);
  };

  return (
    <div className="w-full relative group">
      {/* Minimal Sticky Toolbar pinned cleanly at top */}
      <div className="sticky top-0 z-20 mb-4 py-2 px-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1 transition-all">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('bold')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Tebal (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('italic')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Miring (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Subjudul Besar (Heading 2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Subjudul Sedang (Heading 3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Daftar Poin (Bullet List)"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Daftar Angka (Numbered List)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Kutipan (Blockquote)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkModal}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive('link')
              ? 'bg-unram-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Sisipkan / Edit Tautan (Link)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openImageModal}
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Sisipkan Foto Inline"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Urungkan (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Ulangi (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>

      {/* MODAL 1: Sisipkan / Edit Tautan (Link) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-hairline w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-unram-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editor.isActive('link') ? 'Edit Tautan (Link)' : 'Sisipkan Tautan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  URL Tujuan:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://unram.ac.id/kegiatan-internasional"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-unram-600/30 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Contoh: https://example.com atau masukkan tautan artikel
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                {editor.isActive('link') ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Tautan</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-unram-900 text-white hover:bg-unram-800 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Terapkan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Sisipkan Foto Inline */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-hairline w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-unram-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Sisipkan Foto ke Dalam Berita
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  imageMode === 'upload'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah dari Komputer</span>
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  imageMode === 'url'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>URL Tautan Foto</span>
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-4">
              {imageMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-unram-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-unram-50/20"
                  >
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-unram-700 block">
                      Klik untuk memilih file gambar
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Mendukung format JPG, PNG, WebP
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Alamat URL Gambar:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/foto-kegiatan.jpg atau /images/news-1.jpg"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-unram-600/30 font-mono"
                  />
                </div>
              )}

              {/* Image Preview if available */}
              {imagePreview && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-hairline bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Pratinjau"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Keterangan Foto / Teks Alternatif (Opsional):
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Contoh: Sambutan Rektor Universitas Mataram dalam pembukaan acara"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-unram-600/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!imageUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-unram-900 text-white hover:bg-unram-800 disabled:opacity-40 transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sisipkan Foto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
