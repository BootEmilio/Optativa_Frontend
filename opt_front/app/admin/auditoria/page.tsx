'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { Incidencia, CategoriaIncidencia } from '@/types/incidencia';
import { CloseTicketModal } from '@/components/coordinador/CloseTicketModal';
import {
  CheckCircleIcon,
  RefreshIcon,
  ClockIcon,
  UserIcon,
  BuildingIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from '@/components/coordinador/Icons';
import { LoadError } from '@/components/coordinador/LoadError';

function AuditoriaContent() {
  const [resueltas, setResueltas] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForAudit, setSelectedForAudit] = useState<Incidencia | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await adminService.getIncidencias({ estado: 'resuelta' });
      setResueltas(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las incidencias para auditoría'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>Control de Calidad y Cierre</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27153D]">
            Mesa de Auditoría de Incidencias
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Supervisa los trabajos concluidos por los técnicos de soporte, valida la satisfacción del servicio y autoriza el cierre formal.
          </p>
        </div>

        <div>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 rounded-xl border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] hover:bg-[#F8F9FA]/40 hover:border-[#3E828E] transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar Mesa</span>
          </button>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={cargarDatos} />}

      {!error && (
        <>
          {/* Banner Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Por Auditar
                </p>
                <p className="text-3xl font-extrabold text-[#27153D] mt-1">{resueltas.length}</p>
                <p className="text-xs text-emerald-600 mt-1">Pendientes de dictamen</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Horas Declaradas
                </p>
                <p className="text-3xl font-extrabold text-[#27153D] mt-1">
                  {resueltas.reduce((acc, curr) => acc + (curr.horas_invertidas || 0), 0)} hrs
                </p>
                <p className="text-xs text-gray-400 mt-1">Tiempo técnico acumulado</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
                <ClockIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Protocolo Oficial
                </p>
                <p className="text-sm font-bold text-[#27153D] mt-1">Normativa UTM 2026</p>
                <p className="text-xs text-gray-400 mt-1">Requiere visto bueno administrativo</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircleIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Listado de Casos por Auditar */}
          {resueltas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-12 text-center text-gray-400">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-bold text-base text-[#27153D]">
                Mesa de Auditoría al Día
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                No hay tickets en estado "Resuelta" esperando validación en este momento.
              </p>
              <Link
                href="/admin/incidencias"
                className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#3E828E] text-white text-xs font-bold hover:bg-[#346F7A] transition-colors"
              >
                Explorar Todas las Incidencias
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resueltas.map((inc) => {
                const ultimaResolucion = [...inc.historial_seguimiento]
                  .reverse()
                  .find((h) => h.accion === 'resolucion' || h.estado_nuevo === 'resuelta');

                return (
                  <div
                    key={inc._id}
                    className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-bold text-[#3E828E]">
                          {inc.codigo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Resuelta por Técnico
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatCategoria(inc.categoria)}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#27153D]">
                        {inc.titulo}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <BuildingIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span>Edificio {inc.ubicacion.edificio} • {inc.ubicacion.aula || 'Gral.'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Técnico: <strong className="text-[#27153D]">{inc.tecnico_asignado?.nombre || 'Técnico UTM'}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span>Horas: <strong className="text-[#27153D]">{inc.horas_invertidas || 'N/D'} hrs</strong></span>
                        </div>
                      </div>

                      {ultimaResolucion && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 mt-2">
                          <p className="font-semibold text-slate-800 text-[11px] mb-0.5">
                            Nota de Resolución ({ultimaResolucion.autor}):
                          </p>
                          <p className="italic text-slate-600 leading-relaxed">
                            "{ultimaResolucion.comentario}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <Link
                        href={`/admin/incidencias/${inc._id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#27153D] border border-slate-200 transition-colors flex items-center space-x-1"
                      >
                        <span>Detalle</span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                      </Link>

                      <button
                        onClick={() => setSelectedForAudit(inc)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Dictaminar Cierre</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de Cierre y Auditoría */}
      <CloseTicketModal
        isOpen={!!selectedForAudit}
        onClose={() => setSelectedForAudit(null)}
        incidencia={selectedForAudit}
        onTicketUpdated={() => {
          cargarDatos();
          setSelectedForAudit(null);
        }}
      />
    </div>
  );
}

export default function AdminAuditoriaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando mesa de auditoría...
        </div>
      }
    >
      <AuditoriaContent />
    </Suspense>
  );
}

