'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/tecnico_soporte', label: 'Panel principal', icon: 'dashboard' },
  { href: '/tecnico_soporte/incidencias', label: 'Incidencias asignadas', icon: 'assignment' },
];

function Icon({ name }: { name: string }) {
  const common = 'h-5 w-5';
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 13h7V4H4v9Zm9 7h7v-9h-7v9ZM4 20h7v-5H4v5Zm9-9h7V4h-7v7Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between bg-[#293B4E] shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col">
        <div className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B6870] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M12 4v16M4 12h16" />
                <circle cx="12" cy="12" r="7" />
              </svg>
            </div>
            <div>
              <span className="block text-[16px] font-semibold tracking-tight text-white">UTM Soporte</span>
              <span className="block text-[11px] text-[#9BB3C9]">Gestión de Infraestructura</span>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] text-[#DDEEFF]">
            <span className="h-2 w-2 rounded-full bg-[#A6EBF4] animate-pulse" />
            Rol: Personal Técnico
          </div>
        </div>

        <nav className="mt-2 space-y-1 px-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all ${
                  active
                    ? 'bg-[#1B6870] text-white shadow-sm'
                    : 'text-[#D7E9FF] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="rounded-lg bg-white/5 px-4 py-3 text-[11px] text-[#D7E9FF]">
          <p className="text-[#AFC5D7]">Centro de ayuda v2.4</p>
          <p className="mt-1 text-[#A6EBF4]">Módulo Técnico</p>
        </div>
      </div>
    </aside>
  );
}
