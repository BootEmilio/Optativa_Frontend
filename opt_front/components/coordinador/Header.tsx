'use client';

import React from 'react';
import { ShieldCheckIcon } from './Icons';
import { useSession } from '../../context/SessionContext';

export const Header: React.FC = () => {
  const { usuario, cargando } = useSession();
  const iniciales = usuario
    ? `${usuario.nombre[0] ?? ''}${usuario.apellidos[0] ?? ''}`
    : 'CS';

  return (
    <header className="bg-[#2d3b4f] text-white border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-white/10 text-xs font-semibold text-[#A6C9B6] border border-white/10">
          Campus Central UTM
        </span>
        <div className="text-xs text-gray-300">
          <span className="font-medium text-white">
            {usuario?.area || 'Coordinación de Soporte'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#A6C9B6]/15 border border-[#A6C9B6]/30 text-xs text-[#A6C9B6]">
          <ShieldCheckIcon className="w-4 h-4 text-[#A6C9B6]" />
          <span className="font-medium">Permisos de Coordinación</span>
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-white/15">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3E828E] to-[#A6C9B6] flex items-center justify-center text-[#27153D] font-bold text-sm shadow-sm ring-2 ring-white/20">
            {cargando ? '…' : iniciales}
          </div>

          <div className="text-left hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-white">
              {cargando
                ? 'Cargando…'
                : usuario
                  ? `${usuario.nombre} ${usuario.apellidos}`
                  : 'Coordinador de Soporte'}
            </p>
            <p className="text-[11px] text-[#A6C9B6] font-medium">
              Coordinador de Soporte
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
