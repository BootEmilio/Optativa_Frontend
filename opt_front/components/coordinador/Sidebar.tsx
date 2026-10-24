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
} from './Icons';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  exact?: boolean;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const estadoParam = searchParams.get('estado');

  const navItems: NavItem[] = [
    {
      label: 'Panel Principal',
      href: '/coordinador',
      icon: <DashboardIcon className="w-5 h-5" />,
      exact: true,
    },
    {
      label: 'Todas las Incidencias',
      href: '/coordinador/incidencias',
      icon: <TicketIcon className="w-5 h-5" />,
      exact: true,
    },
    {
      label: 'Pendientes por Asignar',
      href: '/coordinador/incidencias?estado=abierta',
      icon: <ClockIcon className="w-5 h-5" />,
      badge: 'Nuevas',
    },
    {
      label: 'Auditar Resueltas',
      href: '/coordinador/incidencias?estado=resuelta',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      badge: 'Validar',
    },
  ];

  const isLinkActive = (item: NavItem) => {
    if (item.href === '/coordinador') {
      return pathname === '/coordinador';
    }
    if (item.href.includes('estado=abierta')) {
      return pathname === '/coordinador/incidencias' && estadoParam === 'abierta';
    }
    if (item.href.includes('estado=resuelta')) {
      return pathname === '/coordinador/incidencias' && estadoParam === 'resuelta';
    }
    if (item.exact && item.href === '/coordinador/incidencias') {
      return pathname === '/coordinador/incidencias' && !estadoParam;
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
            Coordinación
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-[#A6C9B6]/80 uppercase tracking-wider mb-2">
          Gestión Operativa
        </p>

        {navItems.map((item) => {
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
      </nav>

      {/* Role Footer Card */}
      <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#A6C9B6] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#A6C9B6] animate-pulse"></span>
          <span>Nivel de Acceso</span>
        </div>
        <p className="text-sm font-bold text-white">Coordinador de Soporte</p>
        <p className="text-[11px] text-gray-300 mt-1 leading-snug">
          Supervisión global de área, asignación y auditoría autorizada.
        </p>
      </div>
    </aside>
  );
};
