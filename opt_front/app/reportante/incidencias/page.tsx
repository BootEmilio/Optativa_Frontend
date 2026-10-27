'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { reportanteIncidencias } from '@/data/reportanteMock';
import { StatusBadge } from '@/components/reportante/StatusBadge';
import { EstadoIncidencia } from '@/types/incidencia';

const estados: Array<'todos' | EstadoIncidencia> = ['todos', 'abierta', 'en_proceso', 'resuelta', 'cerrada', 'reabierta'];

export default function MisIncidenciasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<'todos' | EstadoIncidencia>('todos');

  const incidenciasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return reportanteIncidencias.filter((incidencia) => {
      const coincideEstado = estado === 'todos' || incidencia.estado === estado;
      const coincideBusqueda =
        !texto ||
        incidencia.codigo.toLowerCase().includes(texto) ||
        incidencia.titulo.toLowerCase().includes(texto);
      return coincideEstado && coincideBusqueda;
    });
  }, [busqueda, estado]);

  const selectedIncidencia =
    reportanteIncidencias.find((incidencia) => incidencia._id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#3F858D]">Mis reportes</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Mis incidencias</h2>
        </div>
        <Link
          href="/reportante/registrar"
          className="inline-flex items-center justify-center rounded-xl bg-[#3F858D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#32757C]"
        >
          Nueva incidencia
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o título"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
            />
          </div>
          <div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'todos' | EstadoIncidencia)}
              className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
            >
              {estados.map((value) => (
                <option key={value} value={value}>
                  {value === 'todos' ? 'Todos los estados' : value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedIncidencia ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#3F858D]">Detalle</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedIncidencia.codigo}</h3>
            </div>
            <button
              type="button"
              onClick={() => router.push('/reportante/incidencias')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-500">Título</p>
                <h4 className="mt-1 text-xl font-semibold text-slate-900">{selectedIncidencia.titulo}</h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Descripción</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedIncidencia.descripcion}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Ubicación</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {[
                      selectedIncidencia.ubicacion.edificio,
                      selectedIncidencia.ubicacion.piso,
                      selectedIncidencia.ubicacion.aula,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Categoría</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedIncidencia.categoria === 'computo_redes'
                      ? 'Cómputo y redes'
                      : selectedIncidencia.categoria === 'infraestructura'
                        ? 'Infraestructura'
                        : 'Académico'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Prioridad</p>
                  <p className="mt-2 text-sm font-medium capitalize text-slate-800">{selectedIncidencia.prioridad}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Estado</p>
                  <div className="mt-2"><StatusBadge estado={selectedIncidencia.estado} /></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Historial de seguimiento</p>
                <div className="mt-4 space-y-3">
                  {selectedIncidencia.historial_seguimiento.map((item, index) => (
                    <div key={`${item.fecha}-${index}`} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{item.autor}</p>
                        <span className="text-xs text-slate-500">
                          {new Date(item.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#3F858D]">{item.accion}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.comentario}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Información</p>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-3 border-b border-slate-200 pb-2">
                    <dt className="font-medium">Técnico asignado</dt>
                    <dd>{selectedIncidencia.tecnico_asignado?.nombre ?? 'Sin asignar'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-slate-200 pb-2">
                    <dt className="font-medium">Fecha</dt>
                    <dd>{new Date(selectedIncidencia.fecha_creacion).toLocaleDateString('es-MX')}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Evidencias</p>
                <div className="mt-3 space-y-2">
                  {selectedIncidencia.evidencias_adjuntas?.length ? (
                    selectedIncidencia.evidencias_adjuntas.map((evidencia, index) => (
                      <a
                        key={`${evidencia.nombre_archivo}-${index}`}
                        href={evidencia.url_storage}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:border-[#3F858D]"
                      >
                        {evidencia.nombre_archivo}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay evidencia adjunta.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {incidenciasFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No se encontraron incidencias.
            </div>
          ) : (
            incidenciasFiltradas.map((incidencia) => (
              <button
                key={incidencia._id}
                type="button"
                onClick={() => router.push(`/reportante/incidencias?id=${incidencia._id}`)}
                className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#3F858D] hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{incidencia.codigo}</span>
                      <StatusBadge estado={incidencia.estado} />
                    </div>
                    <h3 className="mt-2 text-base font-medium text-slate-900">{incidencia.titulo}</h3>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(incidencia.fecha_creacion).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
