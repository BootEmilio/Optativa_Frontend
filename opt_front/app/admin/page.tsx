'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { Incidencia, CategoriaIncidencia } from '@/types/incidencia';
import { AdminMetricas, LogAuditoria } from '@/types/admin';
import {
  ClockIcon,
  RefreshIcon,
  CheckCircleIcon,
  LockClosedIcon,
  TicketIcon,
  UserIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  PlusIcon,
} from '@/components/coordinador/Icons';
import { LoadError } from '@/components/coordinador/LoadError';
import { NewIncidentModal } from '@/components/admin/NewIncidentModal';


export default function AdminDashboardPage() {
  const [metricas, setMetricas] = useState<AdminMetricas>({
    totalIncidencias: 0,
    pendientesAsignar: 0,
    enProceso: 0,
    resueltasAuditar: 0,
    cerradas: 0,
    criticas: 0,
    totalUsuarios: 0,
    tecnicosActivos: 0,
    tiempoPromedioResolucionHoras: 0,
    tasaResolucionPorcentaje: 0,
  });

  const [prioritarias, setPrioritarias] = useState<Incidencia[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [analitica, setAnalitica] = useState<{
    distribucionCategoria: { label: string; count: number; color: string }[];
    distribucionEstado: { label: string; count: number; color: string }[];
  } | null>(null);

  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [met, incs, acts, ana] = await Promise.all([
        adminService.getMetricasDashboard(),
        adminService.getIncidencias(),
        adminService.getLogsAuditoria(6),
        adminService.getAnaliticaData('this_month'),
      ]);

      setMetricas(met);
      setLogs(acts);
      setAnalitica(ana);

      // Casos críticos o abiertos prioritarios
      const destacadas = incs
        .filter(
          (i) =>
            i.estado !== 'cerrada' &&
            (i.prioridad === 'critica' || i.estado === 'abierta' || i.estado === 'resuelta')
        )
        .slice(0, 4);
      setPrioritarias(destacadas);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el panel de administración'
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
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#3E828E] uppercase tracking-wider mb-1">
            <ShieldCheckIcon className="w-4 h-4 text-[#3E828E]" />
            <span>Control Total del Campus</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27153D]">
            Panel Maestro del Administrador
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Supervisión integral de operaciones de soporte, analítica institucional y gestión de cuentas.
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

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={cargarDatos} />}

      {!error && (
        <>
          {/* 4 Primary Operational Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Pendientes por Asignar */}
            <Link
              href="/admin/incidencias?estado=abierta"
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
                <span>Tickets sin técnico</span>
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Link>

            {/* Card 2: En Proceso */}
            <Link
              href="/admin/incidencias?estado=en_proceso"
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
                <span>Atención técnica activa</span>
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Link>

            {/* Card 3: Resueltas por Auditar */}
            <Link
              href="/admin/auditoria"
              className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#A6C9B6] transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Mesa de Auditoría
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
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

            {/* Card 4: Cerradas y Auditadas */}
            <Link
              href="/admin/incidencias?estado=cerrada"
              className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs hover:shadow-md hover:border-[#27153D]/40 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Cerradas Con Éxito
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
                <span>Concluidas formalmente</span>
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </Link>
          </div>

          {/* 4 Secondary Institutional Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Incidencias
              </p>
              <p className="text-2xl font-bold text-[#27153D] mt-1">{metricas.totalIncidencias}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">En el ciclo actual</p>
            </div>

            <Link
              href="/admin/usuarios"
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-[#3E828E] transition-colors"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Usuarios Registrados
              </p>
              <p className="text-2xl font-bold text-[#3E828E] mt-1">{metricas.totalUsuarios}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Personal y estudiantes</p>
            </Link>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Técnicos en Turno
              </p>
              <p className="text-2xl font-bold text-[#27153D] mt-1">{metricas.tecnicosActivos}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Disponibles en campus</p>
            </div>

            <Link
              href="/admin/analitica"
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-[#3E828E] transition-colors"
            >
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                MTTR / Tasa de Éxito
              </p>
              <p className="text-2xl font-bold text-[#27153D] mt-1">
                {metricas.tiempoPromedioResolucionHoras}h
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({metricas.tasaResolucionPorcentaje}%)
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tiempo promedio resolución</p>
            </Link>
          </div>

          {/* Main Content Dual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column (7 cols): Casos Prioritarios & Logs en Vivo */}
            <div className="lg:col-span-7 space-y-6">
              {/* Casos Prioritarios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircleIcon className="w-4 h-4 text-[#3E828E]" />
                    <h2 className="font-bold text-base text-[#27153D]">
                      Atención Prioritaria Inmediata
                    </h2>
                  </div>
                  <Link
                    href="/admin/incidencias"
                    className="text-xs font-semibold text-[#3E828E] hover:underline"
                  >
                    Ver catálogo completo →
                  </Link>
                </div>

                {prioritarias.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-8 text-center text-gray-500">
                    <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#27153D]">
                      No hay casos urgentes desatendidos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Todas las incidencias críticas están en proceso o resueltas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prioritarias.map((inc) => (
                      <div
                        key={inc._id}
                        className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-[#3E828E]">
                              {inc.codigo}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                inc.prioridad === 'critica'
                                  ? 'bg-[#F6B6B7]/30 text-[#991B1B] border border-[#F6B6B7]'
                                  : 'bg-orange-50 text-orange-700 border border-orange-200'
                              }`}
                            >
                              {inc.prioridad}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              Edif. {inc.ubicacion.edificio} • {inc.ubicacion.aula || 'Gral.'}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-[#27153D] line-clamp-1">
                            {inc.titulo}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            Reportante: {inc.reportante.nombre} ({inc.reportante.tipo})
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <Link
                            href={`/admin/incidencias/${inc._id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#3E828E] hover:text-white border border-slate-200 text-xs font-semibold text-[#27153D] transition-colors"
                          >
                            Atender
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registro de Auditoría y Trazabilidad en Vivo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-4 h-4 text-[#3E828E]" />
                    <h2 className="font-bold text-base text-[#27153D]">
                      Trazabilidad y Eventos en Vivo
                    </h2>
                  </div>
                  <Link
                    href="/admin/configuracion"
                    className="text-xs font-semibold text-[#3E828E] hover:underline"
                  >
                    Ver log de auditoría →
                  </Link>
                </div>

                <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log._id} className="py-3 first:pt-0 last:pb-0 flex items-start space-x-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#3E828E] mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#27153D]">{log.accion}</span>
                          <span className="text-[11px] text-gray-400">{formatDate(log.fecha)}</span>
                        </div>
                        <p className="text-gray-600 text-[11px] leading-relaxed">{log.detalles}</p>
                        <p className="text-[10px] text-gray-400">
                          Usuario: <span className="font-medium text-slate-700">{log.usuario_nombre}</span> • Módulo: {log.modulo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Gráficas y Accesos Rápidos */}
            <div className="lg:col-span-5 space-y-6">
              {/* Gráfica de Distribución por Categoría */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-[#27153D]">
                    Incidencias por Categoría
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Clasificación oficial del campus UTM
                  </p>
                </div>

                {analitica?.distribucionCategoria ? (
                  <div className="space-y-3 pt-1">
                    {analitica.distribucionCategoria.map((cat) => {
                      const total = metricas.totalIncidencias || 1;
                      const pct = Math.round((cat.count / total) * 100);
                      return (
                        <div key={cat.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#27153D]">{cat.label}</span>
                            <span className="font-bold text-gray-600">
                              {cat.count} <span className="text-[10px] text-gray-400 font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Cargando distribución...</p>
                )}
              </div>

              {/* Distribución por Estado */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-[#27153D]">
                    Estado de Atención Global
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Proporción de tickets en ciclo de vida
                  </p>
                </div>

                {analitica?.distribucionEstado ? (
                  <div className="space-y-2.5 pt-1">
                    {analitica.distribucionEstado.map((est) => {
                      const total = metricas.totalIncidencias || 1;
                      const pct = Math.round((est.count / total) * 100);
                      return (
                        <div key={est.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: est.color }}
                            />
                            <span className="text-[#27153D] font-medium">{est.label}</span>
                          </div>
                          <span className="font-bold text-gray-600">
                            {est.count} <span className="text-[10px] text-gray-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Cargando estados...</p>
                )}
              </div>

              {/* Accesos Rápidos Maestro */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-[#27153D]">
                  Acciones Rápidas de Administración
                </h3>
                <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
                  <Link
                    href="/admin/usuarios"
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#3E828E] hover:bg-[#F8F9FA] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#3E828E]/10 text-[#3E828E]">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#27153D]">Gestión de Usuarios y Roles</p>
                        <p className="text-[11px] text-gray-500">Crear y administrar cuentas institucionales</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/admin/auditoria"
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-[#F8F9FA] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#27153D]">Mesa de Auditoría y Cierre</p>
                        <p className="text-[11px] text-gray-500">Validar conformidad de tickets resueltos</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/admin/analitica"
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#3E828E] hover:bg-[#F8F9FA] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#A6C9B6]/20 text-[#3E828E]">
                        <TicketIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#27153D]">Reportes e Inteligencia</p>
                        <p className="text-[11px] text-gray-500">Tiempos de resolución, SLA y fallas</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Nueva Incidencia */}
      <NewIncidentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => {
          cargarDatos();
        }}
      />
    </div>
  );
}
