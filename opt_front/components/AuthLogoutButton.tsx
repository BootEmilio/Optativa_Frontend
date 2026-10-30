'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function AuthLogoutButton({ variant = 'text' }: { variant?: 'icon' | 'text' }) {
  const router = useRouter();
  const { cerrarSesion } = useAuth();

  function handleLogout() {
    cerrarSesion();
    router.replace('/login');
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D7E9FF] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17 21 12 16 7" />
          <path d="M21 12H9" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3F858D]/40"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17 21 12 16 7" />
        <path d="M21 12H9" />
      </svg>
      Cerrar sesión
    </button>
  );
}
