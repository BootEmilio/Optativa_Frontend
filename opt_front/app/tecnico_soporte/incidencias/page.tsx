'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tecnicoIncidencias } from '@/data/tecnicoMock';
import { EstadoIncidencia, PrioridadIncidencia } from '@/types/incidencia';

const estados: Array<'todos' | EstadoIncidencia | 'pendiente'> = [
  'todos',
  'abierta',
  'en_proceso',
  'pendiente',
  'resuelta',
  'cerrada',
  'reabierta',
];

const prioridades: Array<'todas' | PrioridadIncidencia> = ['todas', 'baja', 'media', 'alta', 'critica'];

function formatEstadoLabel(estado: EstadoIncidencia | 'pendiente') {
  if (estado === 'pendiente') return 'Pendiente';
  if (estado === 'en_proceso') return 'En proceso';
  if (estado === 'reabierta') return 'Reabierta';
  return estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ');
}

function getEstadoTone(estado: EstadoIncidencia | 'pendiente') {
  if (estado === 'abierta') return 'bg-[#FDECEC] text-[#9C2D2D]';
  if (estado === 'en_proceso') return 'bg-[#EAF6F0] text-[#1D6A4E]';
  if (estado === 'pendiente') return 'bg-[#F5F6F8] text-[#4A4F5A]';
  if (estado === 'resuelta') return 'bg-[#EAF6F0] text-[#1D6A4E]';
  if (estado === 'cerrada') return 'bg-[#E7EEFF] text-[#43474C]';
  return 'bg-[#E8F5F6] text-[#1B6870]';
}

function getPrioridadTone(prioridad: PrioridadIncidencia) {
  if (prioridad === 'critica') return 'bg-[#FDECEC] text-[#9C2D2D]';
  if (prioridad === 'alta') return 'bg-[#F5F6F8] text-[#37475D]';
  if (prioridad === 'media') return 'bg-[#F0F4FF] text-[#3B4D73]';
  return 'bg-[#EAF6F0] text-[#1D6A4E]';
}

export default function TecnicoIncidenciasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<'todos' | EstadoIncidencia | 'pendiente'>('todos');
  const [prioridad, setPrioridad] = useState<'todas' | PrioridadIncidencia>('todas');

  const incidenciasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return tecnicoIncidencias.filter((incidencia) => {
      const estadoMatch = estado === 'todos' || incidencia.estado === estado;
      const prioridadMatch = prioridad === 'todas' || incidencia.prioridad === prioridad;
      const busquedaMatch =
        !query ||
        incidencia.codigo.toLowerCase().includes(query) ||
        incidencia.titulo.toLowerCase().includes(query);
      return estadoMatch && prioridadMatch && busquedaMatch;
    });
  }, [busqueda, estado, prioridad]);

  const selectedIncidencia = tecnicoIncidencias.find((incidencia) => incidencia._id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-[1280px] py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B6870]">Incidencias asignadas</p>
          <h1 className="mt-2 text-[30px] font-bold tracking-tight text-[#111C2D]">Atención técnica</h1>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[#E7EEFF] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por código o título"
              className="min-h-11 w-full rounded-xl border border-[#E1E7F0] bg-[#F7F9FF] px-3 text-sm text-[#111C2D] outline-none focus:border-[#1B6870] focus:ring-2 focus:ring-[#1B6870]/15"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={estado}
              onChange={(event) => setEstado(event.target.value as 'todos' | EstadoIncidencia | 'pendiente')}
              className="min-h-11 rounded-xl border border-[#E1E7F0] bg-[#F7F9FF] px-3 text-sm text-[#111C2D] outline-none focus:border-[#1B6870] focus:ring-2 focus:ring-[#1B6870]/15"
            >
              {estados.map((item) => (
                <option key={item} value={item}>
                  {item === 'todos' ? 'Todos los estados' : formatEstadoLabel(item)}
                </option>
              ))}
            </select>
            <select
              value={prioridad}
              onChange={(event) => setPrioridad(event.target.value as 'todas' | PrioridadIncidencia)}
              className="min-h-11 rounded-xl border border-[#E1E7F0] bg-[#F7F9FF] px-3 text-sm text-[#111C2D] outline-none focus:border-[#1B6870] focus:ring-2 focus:ring-[#1B6870]/15"
            >
              {prioridades.map((item) => (
                <option key={item} value={item}>
                  {item === 'todas' ? 'Todas las prioridades' : item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedIncidencia ? (
        <div className="mt-6 rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B6870]">Detalle</p>
              <h2 className="mt-2 text-[28px] font-bold text-[#111C2D]">{selectedIncidencia.codigo}</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push('/tecnico_soporte/incidencias')}
              className="rounded-xl border border-[#E1E7F0] bg-white px-3 py-2 text-sm font-medium text-[#273A4E] hover:bg-slate-50"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <div>
                <p className="text-[12px] uppercase tracking-[0.12em] text-[#43474C]">Título</p>
                <h3 className="mt-2 text-[22px] font-semibold text-[#111C2D]">{selectedIncidencia.titulo}</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#F7F9FF] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Descripción</p>
                  <p className="mt-2 text-sm leading-6 text-[#43474C]">{selectedIncidencia.descripcion}</p>
                </div>
                <div className="rounded-2xl bg-[#F7F9FF] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Ubicación</p>
                  <p className="mt-2 text-sm text-[#111C2D]">
                    {[
                      selectedIncidencia.ubicacion.edificio,
                      selectedIncidencia.ubicacion.piso,
                      selectedIncidencia.ubicacion.aula,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {selectedIncidencia.ubicacion.referencia && (
                    <p className="mt-2 text-sm text-[#43474C]">Referencia: {selectedIncidencia.ubicacion.referencia}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#F7F9FF] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Categoría</p>
                  <p className="mt-2 text-sm font-medium text-[#111C2D]">
                    {selectedIncidencia.categoria === 'computo_redes'
                      ? 'Cómputo y redes'
                      : selectedIncidencia.categoria === 'infraestructura'
                        ? 'Infraestructura'
                        : 'Académico'}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F7F9FF] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Prioridad</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPrioridadTone(selectedIncidencia.prioridad)}`}>
                    {selectedIncidencia.prioridad.charAt(0).toUpperCase() + selectedIncidencia.prioridad.slice(1)}
                  </span>
                </div>
                <div className="rounded-2xl bg-[#F7F9FF] p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Estado</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoTone(selectedIncidencia.estado)}`}>
                    {formatEstadoLabel(selectedIncidencia.estado)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E7EEFF] bg-[#F7F9FF] p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Historial de seguimiento</p>
                <div className="mt-4 space-y-3">
                  {selectedIncidencia.historial_seguimiento.map((item, index) => (
                    <div key={`${item.fecha}-${index}`} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#E7EEFF]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#111C2D]">{item.autor}</p>
                        <span className="text-[11px] text-[#43474C]">
                          {new Date(item.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#1B6870]">{item.accion}</p>
                      <p className="mt-2 text-sm text-[#43474C]">{item.comentario}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-[#E7EEFF] bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Información</p>
                <dl className="mt-4 space-y-3 text-sm text-[#43474C]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#EEF3FF] pb-2">
                    <dt className="font-medium">Reportante</dt>
                    <dd className="text-right text-[#111C2D]">{selectedIncidencia.reportante.nombre}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#EEF3FF] pb-2">
                    <dt className="font-medium">Técnico</dt>
                    <dd className="text-right text-[#111C2D]">{selectedIncidencia.tecnico_asignado?.nombre ?? 'Sin asignar'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-medium">Fecha</dt>
                    <dd className="text-right text-[#111C2D]">{new Date(selectedIncidencia.fecha_creacion).toLocaleDateString('es-MX')}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-[#E7EEFF] bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#43474C]">Evidencias</p>
                <div className="mt-3 space-y-2">
                  {selectedIncidencia.evidencias_adjuntas?.length ? (
                    selectedIncidencia.evidencias_adjuntas.map((item, index) => (
                      <a
                        key={`${item.nombre_archivo}-${index}`}
                        href={item.url_storage}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-[#E7EEFF] bg-[#F7F9FF] p-3 text-sm text-[#111C2D] hover:border-[#1B6870]"
                      >
                        {item.nombre_archivo}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-[#43474C]">No hay evidencias adjuntas.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {incidenciasFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D5DDE7] bg-white p-10 text-center text-[#43474C]">
              No hay incidencias asignadas con esos filtros.
            </div>
          ) : (
            incidenciasFiltradas.map((incidencia) => (
              <button
                key={incidencia._id}
                type="button"
                onClick={() => router.push(`/tecnico_soporte/incidencias/${incidencia._id}`)}
                className="block w-full rounded-2xl border border-[#E7EEFF] bg-white p-4 text-left shadow-sm transition hover:border-[#1B6870] hover:bg-[#F9FAFF]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#E7EEFF] px-2 py-1 text-[11px] font-semibold tracking-wide text-[#111C2D]">
                        {incidencia.codigo}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getPrioridadTone(incidencia.prioridad)}`}>
                        {incidencia.prioridad.charAt(0).toUpperCase() + incidencia.prioridad.slice(1)}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getEstadoTone(incidencia.estado)}`}>
                        {formatEstadoLabel(incidencia.estado)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[18px] font-semibold text-[#111C2D]">{incidencia.titulo}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[#43474C]">
                      <span>{incidencia.ubicacion.edificio}</span>
                      <span>{incidencia.ubicacion.aula}</span>
                      <span>{incidencia.reportante.nombre}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#43474C]">
                      {new Date(incidencia.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="rounded-lg bg-[#1B6870] px-3 py-2 text-[12px] font-semibold text-white">Atender</span>
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
