'use client';

import React from 'react';
import Link from 'next/link';
import { Incidencia, EstadoIncidencia, PrioridadIncidencia, CategoriaIncidencia } from '../../types/incidencia';
import { UserIcon, CheckCircleIcon, ChevronRightIcon, BuildingIcon } from './Icons';

interface TicketCardProps {
  incidencia: Incidencia;
  onAssignClick: (incidencia: Incidencia) => void;
  onAuditClick: (incidencia: Incidencia) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  incidencia,
  onAssignClick,
  onAuditClick,
}) => {
  const getEstadoBadge = (estado: EstadoIncidencia) => {
    switch (estado) {
      case 'abierta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Abierta
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0F7FA] text-[#0077B6] border border-[#90E0EF]">
            En Proceso
          </span>
        );
      case 'resuelta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resuelta
          </span>
        );
      case 'cerrada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            Cerrada
          </span>
        );
      case 'reabierta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Reabierta
          </span>
        );
    }
  };

  const getPrioridadBadge = (prioridad: PrioridadIncidencia) => {
    switch (prioridad) {
      case 'baja':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
            Baja
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
            Media
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'critica':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            Crítica
          </span>
        );
    }
  };

  const getCategoriaLabel = (categoria: CategoriaIncidencia) => {
    switch (categoria) {
      case 'computo_redes':
        return 'Cómputo y Redes';
      case 'infraestructura':
        return 'Infraestructura';
      case 'academico':
        return 'Académico';
      default:
        return categoria;
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-[#E9ECEF] hover:border-[#00B4D8]/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Ticket Header Stub */}
      <div className="p-4 pb-3 bg-gradient-to-b from-[#F8F9FA]/80 to-white border-b border-[#E9ECEF]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#1D3557] text-white font-mono text-xs font-bold tracking-wide">
              {incidencia.codigo}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 capitalize">
              {getCategoriaLabel(incidencia.categoria)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {getPrioridadBadge(incidencia.prioridad)}
            {getEstadoBadge(incidencia.estado)}
          </div>
        </div>
      </div>

      {/* Ticket Body: Essential Information Only */}
      <div className="p-5 flex-1 space-y-3.5">
        <Link
          href={`/coordinador/incidencias/${incidencia._id}`}
          className="block"
        >
          <h3 className="text-sm font-bold text-[#1D3557] group-hover:text-[#0077B6] transition-colors line-clamp-2 leading-snug">
            {incidencia.titulo}
          </h3>
        </Link>

        {/* Location Row */}
        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
          <BuildingIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium text-[#2B2D42]/80 truncate">
            Edificio {incidencia.ubicacion.edificio} • {incidencia.ubicacion.aula || incidencia.ubicacion.referencia || 'Área general'}
          </span>
        </div>

        {/* Technician Section */}
        <div className="pt-2 border-t border-[#E9ECEF] flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">Técnico:</span>
          {incidencia.tecnico_asignado ? (
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-[#1D3557] text-xs">
                {incidencia.tecnico_asignado.nombre}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAssignClick(incidencia)}
              className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
            >
              + Asignar
            </button>
          )}
        </div>
      </div>

      {/* Clean Minimalist Bottom Bar */}
      <div className="px-5 py-3 bg-[#F8F9FA]/60 border-t border-[#E9ECEF] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {/* Quick Assign / Reassign Button */}
          <button
            type="button"
            onClick={() => onAssignClick(incidencia)}
            title={incidencia.tecnico_asignado ? 'Reasignar Técnico' : 'Asignar Técnico'}
            className="p-1.5 rounded-md text-gray-400 hover:text-[#0077B6] hover:bg-[#E0F7FA] transition-colors"
          >
            <UserIcon className="w-4 h-4" />
          </button>

          {/* Quick Audit / Close if resuelta */}
          {incidencia.estado === 'resuelta' && (
            <button
              type="button"
              onClick={() => onAuditClick(incidencia)}
              title="Auditar y Autorizar Cierre"
              className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimalist CTA: Ver Detalle */}
        <Link
          href={`/coordinador/incidencias/${incidencia._id}`}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-[#E9ECEF] hover:border-[#00B4D8] text-xs font-bold text-[#1D3557] hover:text-[#0077B6] transition-all shadow-2xs group-hover:bg-[#E0F7FA]/30"
        >
          <span>Ver detalle</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-[#00B4D8]" />
        </Link>
      </div>
    </div>
  );
};

