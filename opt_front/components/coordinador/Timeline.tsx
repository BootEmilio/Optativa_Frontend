'use client';

import React from 'react';
import { HistorialSeguimiento, AccionHistorial } from '../../types/incidencia';
import {
  TicketIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshIcon,
  ShieldCheckIcon,
  TagIcon,
  AlertCircleIcon,
} from './Icons';

interface TimelineProps {
  historial: HistorialSeguimiento[];
}

export const Timeline: React.FC<TimelineProps> = ({ historial }) => {
  if (!historial || historial.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E9ECEF] p-6 text-center text-gray-500 text-sm">
        No hay registros en el historial de seguimiento.
      </div>
    );
  }

  // Ordenar cronológicamente ascendente (de más antiguo a más reciente para ver el flujo)
  const ordenado = [...historial].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const getActionBadge = (accion: AccionHistorial) => {
    switch (accion) {
      case 'creacion':
        return {
          label: 'Apertura de Ticket',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <TicketIcon className="w-4 h-4 text-blue-600" />,
          dotColor: 'bg-blue-600',
        };
      case 'asignacion':
      case 'reasignacion':
        return {
          label: accion === 'asignacion' ? 'Asignación Técnica' : 'Reasignación',
          bg: 'bg-[#E0F7FA] text-[#0077B6] border-[#90E0EF]',
          icon: <UserIcon className="w-4 h-4 text-[#00B4D8]" />,
          dotColor: 'bg-[#00B4D8]',
        };
      case 'resolucion':
        return {
          label: 'Solución Reportada',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircleIcon className="w-4 h-4 text-emerald-600" />,
          dotColor: 'bg-emerald-600',
        };
      case 'cierre':
        return {
          label: 'Cierre Autorizado',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <ShieldCheckIcon className="w-4 h-4 text-slate-700" />,
          dotColor: 'bg-[#1D3557]',
        };
      case 'reapertura':
        return {
          label: 'Ticket Reabierto',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <RefreshIcon className="w-4 h-4 text-amber-600" />,
          dotColor: 'bg-amber-500',
        };
      case 'cambio_prioridad':
        return {
          label: 'Cambio de Prioridad',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <AlertCircleIcon className="w-4 h-4 text-purple-600" />,
          dotColor: 'bg-purple-600',
        };
      case 'cambio_tags':
        return {
          label: 'Etiquetas Actualizadas',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: <TagIcon className="w-4 h-4 text-cyan-600" />,
          dotColor: 'bg-cyan-500',
        };
      case 'comentario':
      default:
        return {
          label: 'Avance Documentado',
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <ClockIcon className="w-4 h-4 text-gray-600" />,
          dotColor: 'bg-gray-500',
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E9ECEF] p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E9ECEF]">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-[#00B4D8]" />
          <h3 className="font-bold text-base text-[#1D3557]">
            Línea de Tiempo y Supervisión de Avances
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F8F9FA] text-gray-600 border border-[#E9ECEF]">
          {ordenado.length} registros
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#00B4D8] before:to-gray-200">
        {ordenado.map((paso, index) => {
          const config = getActionBadge(paso.accion);
          return (
            <div key={index} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full ${config.dotColor} ring-4 ring-white shadow-xs flex items-center justify-center`}
              />

              {/* Card */}
              <div className="bg-[#F8F9FA] group-hover:bg-white rounded-xl p-4 border border-[#E9ECEF] transition-all group-hover:shadow-xs">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg}`}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </span>

                    {paso.estado_nuevo && (
                      <span className="text-[11px] font-semibold text-gray-500">
                        Estado: <b className="uppercase text-[#2B2D42]">{paso.estado_nuevo}</b>
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-500 font-medium">
                    {formatDate(paso.fecha)}
                  </span>
                </div>

                {/* Comment body */}
                <p className="text-sm text-[#2B2D42] leading-relaxed font-normal">
                  {paso.comentario}
                </p>

                {/* Footer details */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E9ECEF]/80 text-xs text-gray-500">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-[#1D3557]">{paso.autor}</span>
                  </div>

                  {typeof paso.horas === 'number' && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>{paso.horas} hrs registradas</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

