'use client';

import React from 'react';
import Link from 'next/link';
import { Incidencia, EstadoIncidencia, PrioridadIncidencia, CategoriaIncidencia } from '../../types/incidencia';
import { UserIcon, CheckCircleIcon, ChevronRightIcon, BuildingIcon } from '../coordinador/Icons';

interface AdminTicketCardProps {
  incidencia: Incidencia;
  onAssignClick: (incidencia: Incidencia) => void;
  onAuditClick: (incidencia: Incidencia) => void;
}

export const AdminTicketCard: React.FC<AdminTicketCardProps> = ({
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
      default:
        return null;
    }
  };

  const getPrioridadBadge = (prioridad: PrioridadIncidencia) => {
    switch (prioridad) {
      case 'critica':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F6B6B7]/30 text-[#991B1B] border border-[#F6B6B7]">
            Crítica
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Media
          </span>
        );
      case 'baja':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
            Baja
          </span>
        );
      default:
        return null;
    }
  };

  const formatCategoria = (cat: CategoriaIncidencia) => {
    switch (cat) {
      case 'computo_redes':
        return 'Cómputo y Redes';
      case 'infraestructura':
        return 'Infraestructura';
      case 'academico':
        return 'Académico';
      default:
        return cat;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5 space-y-4">
        {/* Header row: Codigo + Badges */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/admin/incidencias/${incidencia._id}`}
            className="font-mono text-xs font-bold text-[#3E828E] hover:underline"
          >
            {incidencia.codigo}
          </Link>
          <div className="flex items-center space-x-1.5">
            {getPrioridadBadge(incidencia.prioridad)}
            {getEstadoBadge(incidencia.estado)}
          </div>
        </div>

        {/* Titulo + Descripcion */}
        <div>
          <Link
            href={`/admin/incidencias/${incidencia._id}`}
            className="font-bold text-sm text-[#27153D] group-hover:text-[#3E828E] transition-colors line-clamp-1"
          >
            {incidencia.titulo}
          </Link>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {incidencia.descripcion}
          </p>
        </div>

        {/* Ubicación y Categoría */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center space-x-1">
            <BuildingIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>
              Edificio {incidencia.ubicacion.edificio} • {incidencia.ubicacion.aula || 'Área gral.'}
            </span>
          </div>
          <span className="font-medium text-[#3E828E]">
            {formatCategoria(incidencia.categoria)}
          </span>
        </div>

        {/* Técnico Asignado */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">Técnico:</span>
          {incidencia.tecnico_asignado ? (
            <div className="flex items-center space-x-1 text-xs font-semibold text-[#27153D]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{incidencia.tecnico_asignado.nombre}</span>
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

      {/* Footer bar */}
      <div className="px-5 py-3 bg-[#F8F9FA]/60 border-t border-[#A6C9B6]/30 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onAssignClick(incidencia)}
            title={incidencia.tecnico_asignado ? 'Reasignar Técnico' : 'Asignar Técnico'}
            className="p-1.5 rounded-md text-gray-400 hover:text-[#3E828E] hover:bg-[#A6C9B6]/20 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
          </button>
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

        <Link
          href={`/admin/incidencias/${incidencia._id}`}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-[#A6C9B6]/40 hover:border-[#3E828E] text-xs font-bold text-[#27153D] hover:text-[#3E828E] transition-all shadow-2xs"
        >
          <span>Ver detalle</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-[#3E828E]" />
        </Link>
      </div>
    </div>
  );
};

