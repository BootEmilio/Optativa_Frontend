'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { adminService } from '@/services/adminService';
import { RefreshIcon } from '@/components/coordinador/Icons';
import { LoadError } from '@/components/coordinador/LoadError';

type Periodo = 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days';

function AnaliticaContent() {
  const [periodo, setPeriodo] = useState<Periodo>('this_month');
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<{
    totalIncidencias: number;
    distribucionCategoria: { label: string; count: number; color: string }[];
    distribucionEstado: { label: string; count: number; color: string }[];
    distribucionPrioridad: { label: string; count: number; color: string }[];
    distribucionEdificio: { label: string; count: number }[];
    fallasRecurrentes: {
      problema: string;
      ubicacion: string;
      totalOcurrencias: number;
      categoria: string;
      slaCumplido: string;
    }[];
    tiemposResolucion: {
      promedioHoras: number;
      criticaHoras: number;
      altaHoras: number;
      mediaHoras: number;
      bajaHoras: number;
      tasaSla: number;
    };
  } | null>(null);

  const cargarDatos = async (p: Periodo) => {
    try {
      setCargando(true);
      setError(null);
      const res = await adminService.getAnaliticaData(p);
      setDatos(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar analítica del campus'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos(periodo);
  }, [periodo]);

  const handleExportar = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#3E828E] uppercase tracking-wider mb-1">
            <svg className="w-4 h-4 text-[#3E828E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analítica Universitaria y Reportes</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27153D]">
            Inteligencia Operativa del Campus
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Métricas estratégicas, tiempos de resolución (MTTR), fallas recurrentes y cumplimiento de SLA.
          </p>
        </div>

        {/* Period Selector & Export */}
        <div className="flex items-center space-x-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as Periodo)}
            className="px-3.5 py-2 rounded-xl border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] focus:ring-2 focus:ring-[#3E828E]"
          >
            <option value="this_month">Este Mes</option>
            <option value="last_month">Mes Anterior</option>
            <option value="last_7_days">Últimos 7 Días</option>
            <option value="last_30_days">Últimos 30 Días</option>
          </select>

          <button
            onClick={handleExportar}
            className="px-4 py-2 rounded-xl bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <span>Exportar Informe</span>
          </button>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={() => cargarDatos(periodo)} />}

      {!error && datos && (
        <>
          {/* 4 Strategic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Volumen Analizado
              </span>
              <p className="text-3xl font-extrabold text-[#27153D] mt-2">
                {datos.totalIncidencias}
              </p>
              <p className="text-xs text-gray-400 mt-1">Tickets en el periodo seleccionado</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Cumplimiento SLA
              </span>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">
                {datos.tiemposResolucion.tasaSla}%
              </p>
              <p className="text-xs text-emerald-600 mt-1">Meta institucional: &gt; 90%</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Tiempo Medio (MTTR)
              </span>
              <p className="text-3xl font-extrabold text-blue-700 mt-2">
                {datos.tiemposResolucion.promedioHoras} hrs
              </p>
              <p className="text-xs text-blue-500 mt-1">Promedio de resolución física</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                MTTR Críticas
              </span>
              <p className="text-3xl font-extrabold text-rose-700 mt-2">
                {datos.tiemposResolucion.criticaHoras} hrs
              </p>
              <p className="text-xs text-rose-500 mt-1">Respuesta inmediata a sites/lab</p>
            </div>
          </div>

          {/* Gráficas: Categoría & Estado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1: Distribución por Categoría Oficial */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#27153D]">
                  Distribución por Categoría Oficial
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Proporción de solicitudes según el ámbito de infraestructura del campus
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {datos.distribucionCategoria.map((cat) => {
                  const max = Math.max(...datos.distribucionCategoria.map((c) => c.count), 1);
                  const pct = Math.round((cat.count / max) * 100);
                  return (
                    <div key={cat.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#27153D]">{cat.label}</span>
                        <span className="font-bold text-slate-700">{cat.count} casos</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica 2: Distribución por Estado del Ciclo */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#27153D]">
                  Ciclo de Vida de Incidencias
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estado actual de los tickets en el periodo seleccionado
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {datos.distribucionEstado.map((est) => {
                  const max = Math.max(...datos.distribucionEstado.map((e) => e.count), 1);
                  const pct = Math.round((est.count / max) * 100);
                  return (
                    <div key={est.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#27153D]">{est.label}</span>
                        <span className="font-bold text-slate-700">{est.count} casos</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: est.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráficas: Distribución por Prioridad & Edificios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 3: Prioridad */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#27153D]">
                Distribución por Prioridad
              </h3>
              <div className="space-y-3 pt-1">
                {datos.distribucionPrioridad.map((prio) => {
                  const total = datos.totalIncidencias || 1;
                  const pct = Math.round((prio.count / total) * 100);
                  return (
                    <div key={prio.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#27153D]">{prio.label}</span>
                        <span className="font-bold text-slate-700">{prio.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: prio.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica 4: Edificios del Campus */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#27153D]">
                Incidencias por Edificio del Campus
              </h3>
              <div className="space-y-3 pt-1">
                {datos.distribucionEdificio.map((ed) => {
                  const max = Math.max(...datos.distribucionEdificio.map((e) => e.count), 1);
                  const pct = Math.round((ed.count / max) * 100);
                  return (
                    <div key={ed.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#27153D]">{ed.label}</span>
                        <span className="font-bold text-slate-700">{ed.count} reportes</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#3E828E] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fallas Recurrentes e Identificación de Patrones */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#27153D]">
                  Fallas Recurrentes y Análisis Preventivo
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Detección de patrones repetitivos en equipos y espacios universitarios para mantenimiento proactivo
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2d3b4f] text-white uppercase text-[11px] font-semibold">
                    <th className="py-3 px-4">Problema Recurrente</th>
                    <th className="py-3 px-4">Ubicación Frecuente</th>
                    <th className="py-3 px-4">Ocurrencias</th>
                    <th className="py-3 px-4">Ámbito</th>
                    <th className="py-3 px-4 text-right">Cumplimiento SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#27153D]">
                  {datos.fallasRecurrentes.map((falla, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#27153D]">{falla.problema}</td>
                      <td className="py-3 px-4 text-gray-600">{falla.ubicacion}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {falla.totalOcurrencias} veces
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-500">
                        {falla.categoria.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {falla.slaCumplido}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminAnaliticaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando analítica institucional...
        </div>
      }
    >
      <AnaliticaContent />
    </Suspense>
  );
}

