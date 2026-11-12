import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSupabase, checkIsAdmin } from '@/lib/supabase';

interface AdminLoginProps {
  locale: string;
  onSuccess: (email: string) => void;
}

export function AdminLogin({ locale, onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Koneksi Supabase tidak terkonfigurasi pada lingkungan ini.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg('Email atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.');
        setIsLoading(false);
        return;
      }

      // Check admin role via RPC is_admin()
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        await supabase.auth.signOut();
        setErrorMsg(
          'Akun Anda berhasil masuk namun belum memiliki hak akses administrator di sistem CMS OIA UNRAM.'
        );
        setIsLoading(false);
        return;
      }

      onSuccess(data.user?.email || email);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
          OIA
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          CMS Kantor Urusan Internasional
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Universitas Mataram • Portal Pengelolaan Konten Resmi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200/80 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Alamat Email Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@unram.ac.id"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <Link
              href={`/${locale}/`}
              className="hover:text-slate-700 transition-colors underline"
            >
              ← Kembali ke Website Utama
            </Link>
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 256-bit Encrypted</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
