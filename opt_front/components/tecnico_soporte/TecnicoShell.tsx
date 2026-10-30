'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomePath } from '@/lib/authSession';

const navigation = [
  { href: '/tecnico_soporte', label: 'Panel principal', icon: 'dashboard' },
  {
    href: '/tecnico_soporte/incidencias',
    label: 'Incidencias asignadas',
    icon: 'assignment',
  },
];

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="5" rx="1" />
        <rect x="13" y="10" width="8" height="11" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
      </>
    ),
    assignment: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M9 5V3h6v2m-7 6h8m-8 4h8" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1 .9-1.8 1.2-1.8 2.7M12 17h.01" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name] ?? paths.help}
    </svg>
  );
}

export default function TecnicoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    } else if (
      !cargando &&
      usuario &&
      usuario.rol !== 'tecnico_soporte'
    ) {
      router.replace(getRoleHomePath(usuario.rol));
    }
  }, [cargando, router, usuario]);

  if (
    cargando ||
    !usuario ||
    usuario.rol !== 'tecnico_soporte'
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
        <p className="text-sm text-[#43474c]" role="status">
          Verificando sesión técnica...
        </p>
      </main>
    );
  }

  const fullName = usuario.nombre || 'Personal técnico';

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] antialiased">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col justify-between bg-[#293b4e] shadow-[0_1px_8px_rgba(0,0,0,0.08)] lg:flex">
        <div>
          <div className="px-6 pb-4 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1b6870] text-white">
                <Icon className="h-[22px] w-[22px]" name="assignment" />
              </span>
              <div>
                <span className="block text-lg font-semibold tracking-tight text-white">UTM Soporte</span>
                <span className="block text-[11px] text-[#92a5bc]">Gestión de Infraestructura</span>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#132537]/60 px-3 py-1.5 text-[11px] font-medium text-[#a6ebf4]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#a9eef7]" />
              Rol: Personal Técnico
            </span>
          </div>
          <nav aria-label="Navegación principal" className="mt-2 flex flex-col gap-1 px-3">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/tecnico_soporte' && pathname.startsWith(item.href));
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                    active
                      ? 'bg-[#1b6870] font-medium text-white shadow-sm'
                      : 'text-[#b5c8e0] hover:bg-[#2b3b50] hover:text-white'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="rounded-lg bg-[#132537]/40 px-4 py-3">
            <p className="text-[11px] leading-tight text-[#92a5bc]">Centro de ayuda v2.4</p>
            <p className="mt-1 text-[11px] text-[#8dd2da]">Módulo Técnico</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-[#132537] px-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] sm:px-6 lg:left-64">
          <div className="flex min-w-0 flex-col">
            <span className="hidden truncate text-[11px] font-semibold uppercase tracking-widest text-[#92a5bc] sm:block">
              Campus Central — Módulo de incidencias
            </span>
            <span className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
              Portal de Soporte Técnico
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-white">{fullName}</span>
              <span className="block text-[11px] text-[#92a5bc]">Personal técnico</span>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b6870] text-white">
              <Icon className="h-[18px] w-[18px]" name="person" />
            </span>
            <AuthLogoutButton variant="icon" />
          </div>
        </header>

        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 top-16 z-30 flex gap-1 overflow-x-auto bg-[#293b4e] px-3 py-2 lg:hidden"
        >
          {navigation.map((item) => (
            <Link
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                pathname === item.href
                  ? 'bg-[#1b6870] text-white'
                  : 'text-[#d3e4fe] hover:bg-[#2b3b50]'
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-h-screen bg-[#f9f9ff] px-4 pb-8 pt-28 sm:px-6 lg:px-8 lg:pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
