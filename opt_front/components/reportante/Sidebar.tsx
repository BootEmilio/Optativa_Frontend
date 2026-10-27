'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/reportante', label: 'Panel principal', icon: 'home' },
  { href: '/reportante/registrar', label: 'Registrar incidencia', icon: 'plus' },
  { href: '/reportante/incidencias', label: 'Mis incidencias', icon: 'list' },
];

function Icon({ type }: { type: string }) {
  const common = 'h-4 w-4';
  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
        </svg>
      );
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
          <path d="M8 9h8M8 13h8" />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 bg-[#293B4E] text-white shadow-xl">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">UTM Desk</p>
        <h2 className="mt-3 text-xl font-semibold">Reportante</h2>
      </div>

      <nav className="space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/reportante' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive ? 'bg-[#3F858D] text-white shadow-sm' : 'text-slate-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon type={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
