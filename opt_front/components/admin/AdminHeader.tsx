'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon } from '../coordinador/Icons';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/adminService';
import { Usuario } from '@/types/usuario';

export const AdminHeader: React.FC = () => {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [adminUser, setAdminUser] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    adminService.getUsuarioActual().then((u) => {
      if (isMounted) {
        setAdminUser(u);
        setCargando(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const iniciales = adminUser
    ? `${adminUser.nombre[0] ?? 'A'}${adminUser.apellidos[0] ?? 'D'}`
    : 'AD';

  return (
    <header className="bg-[#2d3b4f] text-white border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-white/10 text-xs font-semibold text-[#A6C9B6] border border-white/10">
          Campus Central UTM
        </span>
        <div className="text-xs text-gray-300">
          <span className="font-medium text-white">
            {adminUser?.area || 'Dirección General de TI'}
          </span>
        </div>
        <button
          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          onClick={() => {
            cerrarSesion();
            router.replace('/login');
          }}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-300">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Control Total / Administrador</span>
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-white/15">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3E828E] to-[#A6C9B6] flex items-center justify-center text-[#27153D] font-bold text-sm shadow-sm ring-2 ring-white/20">
            {cargando ? '…' : iniciales}
          </div>

          <div className="text-left hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-white">
              {cargando
                ? 'Cargando…'
                : adminUser
                  ? `${adminUser.nombre} ${adminUser.apellidos}`
                  : 'Administrador del Sistema'}
            </p>
            <p className="text-[11px] text-[#A6C9B6] font-medium">
              Administrador del Sistema
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

