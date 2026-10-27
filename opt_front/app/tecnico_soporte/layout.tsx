import type { ReactNode } from 'react';
import { Sidebar } from '@/components/tecnico_soporte/Sidebar';
import TecnicoAuthGuard from './components/TecnicoAuthGuard';

export const metadata = {
  title: 'Técnico de soporte | UTM Desk',
  description: 'Panel de incidencias asignadas al técnico de soporte',
};

export default function TecnicoSoporteLayout({ children }: { children: ReactNode }) {
  return (
    <TecnicoAuthGuard>
      <div className="min-h-screen bg-[#F9F9FF] text-[#111C2D] antialiased">
        <Sidebar />
        <div className="pl-64">
          <header className="fixed left-64 right-0 top-0 z-40 flex h-16 items-center justify-between bg-[#293B4E] px-6 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#AFC5D7]">
                Campus Central — Módulo de incidencias
              </span>
              <span className="text-[19px] font-semibold text-white">Portal de Soporte Técnico</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden text-right sm:block">
                <span className="block text-sm font-medium text-white">Ing. Marco Valenzuela Cruz</span>
                <span className="block text-[11px] text-[#AFC5D7]">Técnico de Infraestructura y Redes</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B6870] text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </div>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D7E9FF] transition hover:bg-white/5 hover:text-white" aria-label="Cerrar sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17 21 12 16 7" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          </header>

          <main className="relative min-h-screen bg-[#F9F9FF] px-5 pt-20 lg:px-8">{children}</main>
        </div>
      </div>
    </TecnicoAuthGuard>
  );
}
