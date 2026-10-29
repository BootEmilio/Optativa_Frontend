'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  DashboardIcon,
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
} from '../coordinador/Icons';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  exact?: boolean;
}

function AnalyticsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get('estado');

  const navOperativo: NavItem[] = [
    {
      label: 'Panel Maestro',
      href: '/admin',
      icon: <DashboardIcon className="w-5 h-5" />,
      exact: true,
    },
    {
      label: 'Todas las Incidencias',
      href: '/admin/incidencias',
      icon: <TicketIcon className="w-5 h-5" />,
      exact: true,
    },
    {
      label: 'Pendientes por Asignar',
      href: '/admin/incidencias?estado=abierta',
      icon: <ClockIcon className="w-5 h-5" />,
      badge: 'Nuevas',
    },
    {
      label: 'Mesa de Auditoría',
      href: '/admin/auditoria',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      badge: 'Validar',
    },
  ];

  const navGestion: NavItem[] = [
    {
      label: 'Gestión de Usuarios',
      href: '/admin/usuarios',
      icon: <UserIcon className="w-5 h-5" />,
      badge: 'Roles',
    },
    {
      label: 'Analítica y Reportes',
      href: '/admin/analitica',
      icon: <AnalyticsIcon className="w-5 h-5" />,
      badge: 'KPIs',
    },
    {
      label: 'Configuración y Logs',
      href: '/admin/configuracion',
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const isLinkActive = (item: NavItem) => {
    if (item.href === '/admin') {
      return pathname === '/admin';
    }
    if (item.href.includes('estado=abierta')) {
      return pathname === '/admin/incidencias' && estadoParam === 'abierta';
    }
    if (item.exact && item.href === '/admin/incidencias') {
      return pathname === '/admin/incidencias' && !estadoParam;
    }
    return pathname.startsWith(item.href) && !item.href.includes('?');
  };

  return (
    <aside className="w-64 bg-[#2d3b4f] text-white min-h-screen flex flex-col shadow-xl z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3E828E] to-[#A6C9B6] flex items-center justify-center shadow-md">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide text-white">UTM Soporte</h1>
          <p className="text-xs text-[#A6C9B6] uppercase font-semibold tracking-wider">
            Administrador
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {/* Grupo 1: Operación y Supervisión */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-[#A6C9B6]/80 uppercase tracking-wider mb-2">
            Gestión Operativa
          </p>
          <div className="space-y-1.5">
            {navOperativo.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#3E828E] text-white shadow-sm font-semibold'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={active ? 'text-white' : 'text-[#A6C9B6]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-[#F8F9FA] text-[#27153D]'
                          : 'bg-[#F6B6B7]/25 text-[#F6B6B7]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Grupo 2: Control Institucional */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-[#A6C9B6]/80 uppercase tracking-wider mb-2">
            Control Institucional
          </p>
          <div className="space-y-1.5">
            {navGestion.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#3E828E] text-white shadow-sm font-semibold'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={active ? 'text-white' : 'text-[#A6C9B6]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-[#F8F9FA] text-[#27153D]'
                          : 'bg-[#A6C9B6]/20 text-[#A6C9B6]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Role Footer Card */}
      <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#A6C9B6] mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Nivel de Acceso</span>
        </div>
        <p className="text-sm font-bold text-white">Super Administrador</p>
        <p className="text-[11px] text-gray-300 mt-1 leading-snug">
          Control maestro: permisos completos sobre incidencias, analítica, auditoría y usuarios.
        </p>
      </div>
    </aside>
  );
};

