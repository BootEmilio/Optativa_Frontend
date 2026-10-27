'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { reportanteActual, reportanteIncidencias } from '@/data/reportanteMock';
import { StatusBadge } from '@/components/reportante/StatusBadge';
import { Incidencia, EstadoIncidencia } from '@/types/incidencia';

const estadoResumen: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};

export default function ReportanteDashboardPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);

  useEffect(() => {
    setIncidencias(reportanteIncidencias);
  }, []);

  const resumen = useMemo(() => {
    const total = incidencias.length;
    return {
      total,
      abiertas: incidencias.filter((i) => i.estado === 'abierta').length,
      enProceso: incidencias.filter((i) => i.estado === 'en_proceso').length,
      resueltas: incidencias.filter((i) => i.estado === 'resuelta').length,
      cerradas: incidencias.filter((i) => i.estado === 'cerrada').length,
    };
  }, [incidencias]);

  const recientes = useMemo(() => [...incidencias].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()).slice(0, 3), [incidencias]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Hola, {reportanteActual.nombre}</p>
            <h2 className="mt-1 text-3xl font-semibold text-slate-900">Resumen de tus incidencias</h2>
          </div>
          <Link
            href="/reportante/registrar"
            className="inline-flex items-center justify-center rounded-xl bg-[#3F858D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#32757C]"
          >
            Registrar nueva incidencia
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total', value: resumen.total, color: 'bg-[#293B4E]' },
          { label: 'Abiertas', value: resumen.abiertas, color: 'bg-rose-100 text-rose-800' },
          { label: 'En proceso', value: resumen.enProceso, color: 'bg-amber-100 text-amber-800' },
          { label: 'Resueltas', value: resumen.resueltas, color: 'bg-emerald-100 text-emerald-800' },
          { label: 'Cerradas', value: resumen.cerradas, color: 'bg-slate-200 text-slate-700' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.color}`}>
              {item.label}
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Reportes recientes</h3>
            <Link href="/reportante/incidencias" className="text-sm font-medium text-[#3F858D] hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {recientes.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No tienes incidencias recientes.</p>
            ) : (
              recientes.map((incidencia) => (
                <Link
                  key={incidencia._id}
                  href={`/reportante/incidencias?id=${incidencia._id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#3F858D] hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{incidencia.codigo}</span>
                        <StatusBadge estado={incidencia.estado} />
                      </div>
                      <h4 className="mt-2 text-base font-medium text-slate-800">{incidencia.titulo}</h4>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(incidencia.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Estados</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(estadoResumen).map(([key, label]) => {
              const value = incidencias.filter((item) => item.estado === key).length;
              return (
                <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
