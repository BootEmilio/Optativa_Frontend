import type { ReactNode } from 'react';
import { Sidebar } from '@/components/reportante/Sidebar';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import ReportanteAuthGuard from './components/ReportanteAuthGuard';

export const metadata = {
  title: 'Reportante | UTM Desk',
  description: 'Gestión de incidencias del usuario reportante',
};

export default function ReportanteLayout({ children }: { children: ReactNode }) {
  return (
    <ReportanteAuthGuard>
      <div className="flex min-h-screen bg-[#F7F9FA] text-[#293B4E] antialiased">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3F858D]">UTM Desk</p>
                <h1 className="mt-1 text-xl font-semibold text-slate-800">Módulo reportante</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  Campus principal
                </div>
                <AuthLogoutButton />
              </div>
            </div>
          </header>

          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </div>
    </ReportanteAuthGuard>
  );
}
