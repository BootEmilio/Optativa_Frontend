"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Panel de reportes",
    href: "/analista/dashboard",
    icon: (
      <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 14h7v7H3z" />
    ),
    enabled: true,
  },
  {
    label: "Reportes",
    href: "/analista/reportes",
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    enabled: true,
  },
  {
    label: "Tiempos de resolución",
    href: "/analista/tiempos-resolucion",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    enabled: true,
  },
  {
    label: "Fallas recurrentes",
    href: "/analista/fallas-recurrentes",
    icon: (
      <>
        <path d="M12 3v3" />
        <path d="M18.4 5.6 16.3 7.7" />
        <path d="M21 12h-3" />
        <path d="M18.4 18.4 16.3 16.3" />
        <path d="M12 21v-3" />
        <path d="M5.6 18.4 7.7 16.3" />
        <path d="M3 12h3" />
        <path d="M5.6 5.6 7.7 7.7" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
    enabled: true,
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export default function AnalystSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col bg-[#102b3a] text-white lg:min-h-screen lg:w-[252px] lg:shrink-0">
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#20b6a7] text-sm font-bold tracking-wide text-[#102b3a]">
          UTM
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">UTM Desk</p>
          <p className="mt-0.5 text-xs text-slate-400">Gestión universitaria</p>
        </div>
      </div>

      <div className="px-4 pt-7">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Analítica
        </p>
        <nav aria-label="Navegación del módulo" className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return item.enabled ? (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#8ce2d8] bg-white/10 text-white"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
                href={item.href}
                key={item.label}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-slate-400"
                key={item.label}
                title="Disponible cuando se habilite esta pantalla"
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 px-6 py-5">
        <p className="text-xs font-medium text-slate-300">UTM Desk NoSQL</p>
        <p className="mt-1 text-xs text-slate-500">Vista de consulta y análisis</p>
      </div>
    </aside>
  );
}
