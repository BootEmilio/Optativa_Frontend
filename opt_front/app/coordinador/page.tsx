'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { coordinadorService } from '../../services/coordinadorService';
import { Incidencia, CategoriaIncidencia } from '../../types/incidencia';
import {
  ClockIcon,
  RefreshIcon,
  CheckCircleIcon,
  LockClosedIcon,
  TicketIcon,
  UserIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from '../../components/coordinador/Icons';
import { LoadError } from '../../components/coordinador/LoadError';

export default function CoordinadorDashboardPage() {
  const [metricas, setMetricas] = useState({
    pendientesAsignar: 0,
    enProceso: 0,
    resueltasAuditar: 0,
    cerradas: 0,
    total: 0,
  });
  const [actividades, setActividades] = useState<
    Array<{
      incidenciaId: string;
      codigo: string;
      titulo: string;
      autor: string;
      accion: string;
      fecha: string;
      comentario: string;
      estadoNuevo?: string;
    }>
  >([]);
  const [prioritarias, setPrioritarias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [met, acts, incs] = await Promise.all([
        coordinadorService.getMetricasDashboard(),
        coordinadorService.getActividadReciente(5),
        coordinadorService.getIncidencias(),
      ]);
      setMetricas(met);
      setActividades(acts);

      const destacadas = incs
        .filter(
          (i) =>
            i.estado !== 'cerrada' &&
            (i.estado === 'abierta' ||
              i.prioridad === 'critica' ||
              i.estado === 'resuelta')
        )
        .slice(0, 4);
      setPrioritarias(destacadas);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el panel de supervisión'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateString;
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
    <div className="space-y-8">
      {/* Header Bar: Minimalist and Breathable */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
          <h1 className="text-2xl font-bold text-[#27153D]">
            Panel de Supervisión
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Métricas esenciales de soporte y atención a incidencias del campus.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 rounded-xl border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] hover:bg-[#F8F9FA]/40 hover:border-[#3E828E] transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <Link
            href="/coordinador/incidencias"
            className="px-4 py-2 rounded-xl bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <TicketIcon className="w-4 h-4" />
            <span>Gestionar Incidencias</span>
          </Link>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={cargarDatos} />}

      {!error && (
      <>
      {/* 4 Fast Metric Cards (Clean Saeko Aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Pendientes por Asignar */}
        <Link
          href="/coordinador/incidencias?estado=abierta"
          className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#F6B6B7] transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pendientes Asignar
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F6B6B7]/25 text-[#27153D] flex items-center justify-center font-bold">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#27153D]">
              {metricas.pendientesAsignar}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-between pt-2 border-t border-[#A6C9B6]/30">
            <span>Sin técnico asignado</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 2: En Proceso */}
        <Link
          href="/coordinador/incidencias?estado=en_proceso"
          className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#3E828E] transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              En Proceso
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#A6C9B6]/25 text-[#3E828E] flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#27153D]">
              {metricas.enProceso}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-between pt-2 border-t border-[#A6C9B6]/30">
            <span>En atención técnica activa</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 3: Resueltas por Auditar */}
        <Link
          href="/coordinador/incidencias?estado=resuelta"
          className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#A6C9B6] transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Resueltas por Auditar
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#A6C9B6]/30 text-[#3E828E] flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#27153D]">
              {metricas.resueltasAuditar}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-between pt-2 border-t border-[#A6C9B6]/30">
            <span>Listas para validación</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Card 4: Cerradas */}
        <Link
          href="/coordinador/incidencias?estado=cerrada"
          className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#27153D]/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Cerradas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] text-[#27153D] flex items-center justify-center">
              <LockClosedIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#27153D]">
              {metricas.cerradas}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-between pt-2 border-t border-[#A6C9B6]/30">
            <span>Concluidas y verificadas</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Main Dual Grid: Only Essential Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Casos Prioritarios (Essential Fields Only) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircleIcon className="w-4 h-4 text-[#3E828E]" />
              <h2 className="font-bold text-base text-[#27153D]">
                Casos que Requieren Atención Prioritaria
              </h2>
            </div>
            <Link
              href="/coordinador/incidencias"
              className="text-xs font-bold text-[#3E828E] hover:text-[#27153D] transition-colors"
            >
              Ver todas &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {prioritarias.map((inc) => (
              <div
                key={inc._id}
                className="bg-white rounded-2xl border border-[#A6C9B6]/30 p-4 shadow-xs hover:border-[#3E828E]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#27153D]">
                      {inc.codigo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#A6C9B6]/25 text-[#3E828E] border border-[#A6C9B6]/40">
                      {formatCategoria(inc.categoria)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inc.prioridad === 'critica'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : inc.prioridad === 'alta'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {inc.prioridad}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#27153D] truncate">
                    {inc.titulo}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>Edificio {inc.ubicacion.edificio}</span>
                    <span>•</span>
                    <span>
                      Técnico:{' '}
                      <b className="text-[#27153D]">
                        {inc.tecnico_asignado?.nombre || 'Sin asignar'}
                      </b>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col justify-end items-end gap-1.5">
                  <Link
                    href={`/coordinador/incidencias/${inc._id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#A6C9B6]/40 hover:border-[#3E828E] text-xs font-bold text-[#27153D] hover:text-[#3E828E] hover:bg-[#F8F9FA]/30 transition-colors shadow-2xs"
                  >
                    Gestionar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Actividad Reciente del Área */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-[#3E828E]" />
              <h2 className="font-bold text-base text-[#27153D]">
                Supervisión de Actividad Reciente
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#A6C9B6]/30 p-5 shadow-xs space-y-3.5">
            {actividades.map((act, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 pb-3 border-b border-[#A6C9B6]/25 last:border-b-0 last:pb-0"
              >
                <div className="w-7 h-7 rounded-full bg-[#A6C9B6]/25 text-[#3E828E] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {act.autor ? act.autor[0] : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-bold text-[#27153D] truncate">
                      {act.autor}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatDate(act.fecha)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Ticket <Link href={`/coordinador/incidencias/${act.incidenciaId}`} className="text-[#3E828E] hover:underline font-mono font-bold">{act.codigo}</Link>
                  </p>
                  <p className="text-xs text-[#27153D]/80 mt-0.5 line-clamp-1 italic">
                    &ldquo;{act.comentario}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
