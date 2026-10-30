'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import {
  getTecnicoIncidenciaServerSnapshot,
  getTecnicoIncidenciaSnapshot,
  subscribeToTecnicoIncidencias,
} from '@/lib/tecnicoIncidencias';
import type { EstadoIncidencia, Incidencia, PrioridadIncidencia } from '@/types/incidencia';

const formatEstado = (estado: EstadoIncidencia) => {
  switch (estado) {
    case 'abierta':
      return 'Abierta';
    case 'en_proceso':
      return 'En proceso';
    case 'pendiente':
      return 'Pendiente';
    case 'resuelta':
      return 'Resuelta';
    case 'cerrada':
      return 'Cerrada';
    case 'reabierta':
      return 'Reabierta';
    default:
      return estado;
  }
};

const getEstadoTone = (estado: EstadoIncidencia) => {
  switch (estado) {
    case 'abierta':
      return 'bg-[#FDECEC] text-[#9C2D2D]';
    case 'en_proceso':
      return 'bg-[#EAF6F0] text-[#1D6A4E]';
    case 'pendiente':
      return 'bg-[#F5F6F8] text-[#4A4F5A]';
    case 'resuelta':
      return 'bg-[#EAF6F0] text-[#1D6A4E]';
    case 'cerrada':
      return 'bg-[#E7EEFF] text-[#43474C]';
    default:
      return 'bg-[#E8F5F6] text-[#1B6870]';
  }
};

const getPrioridadTone = (prioridad: PrioridadIncidencia) => {
  switch (prioridad) {
    case 'critica':
      return 'bg-[#FDECEC] text-[#9C2D2D]';
    case 'alta':
      return 'bg-[#E8F5F6] text-[#1B6870]';
    case 'media':
      return 'bg-[#F0F4FF] text-[#3B4D73]';
    default:
      return 'bg-[#EAF6F0] text-[#1D6A4E]';
  }
};

function Icon({ name }: { name: string }) {
  const common = 'h-4 w-4';
  switch (name) {
    case 'back':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M15 18 9 12l6-6" />
        </svg>
      );
    case 'assignment':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'fingerprint':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M8 10V9a4 4 0 0 1 8 0v1" />
          <path d="M7 10v2a5 5 0 0 0 10 0v-2" />
          <path d="M12 8v8" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'lan':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 7h10v10H7z" />
          <path d="M10 7V4M14 7V4M10 20v3M14 20v3" />
          <path d="M4 10h3M17 10h3M4 14h3M17 14h3" />
        </svg>
      );
    case 'location':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'person':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M20 21a8 8 0 1 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case 'build':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M14 3h7v7h-7zM3 14h7v7H3z" />
          <path d="M14 17l7-7M7 3l7 7" />
        </svg>
      );
    case 'history':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'attach':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M8 12.5 14.8 5.7a3.2 3.2 0 1 1 4.5 4.5L9.8 19.8a5 5 0 1 1-7.1-7.1l7.7-7.7" />
        </svg>
      );
    case 'support':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 18v-8a5 5 0 0 1 10 0v8" />
          <path d="M9 18v-5h6v5" />
          <path d="M12 4V2" />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 3 2.5 19.5h19L12 3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TecnicoIncidenciaDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const idSeguro = id ?? '';
  const incidenciaSnapshot = useSyncExternalStore(
    subscribeToTecnicoIncidencias,
    () => getTecnicoIncidenciaSnapshot(idSeguro),
    () => getTecnicoIncidenciaServerSnapshot(idSeguro),
  );
  const incidencia = useMemo(() => JSON.parse(incidenciaSnapshot) as Incidencia | null, [incidenciaSnapshot]);

  if (!incidencia) {
    return (
      <div className="mx-auto max-w-[960px] py-10">
        <div className="rounded-3xl border border-dashed border-[#D5DDE7] bg-white p-10 text-center text-[#43474C]">
          No se encontró la incidencia solicitada.
          <div className="mt-4">
            <Link href="/tecnico_soporte/incidencias" className="inline-flex items-center gap-2 rounded-lg bg-[#1B6870] px-4 py-2 text-sm font-semibold text-white">
              <Icon name="back" />
              Volver a incidencias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fecha = new Date(incidencia.fecha_creacion).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-[1280px] py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 text-[12px] text-[#43474C]">
          <Link href="/tecnico_soporte" className="hover:text-[#1B6870]">Panel principal</Link>
          <span className="text-[#A7B3C4]">›</span>
          <Link href="/tecnico_soporte/incidencias" className="hover:text-[#1B6870]">Incidencias asignadas</Link>
          <span className="text-[#A7B3C4]">›</span>
          <span className="font-semibold text-[#111C2D]">{incidencia.codigo}</span>
        </div>

        <Link
          href="/tecnico_soporte/incidencias"
          className="inline-flex items-center gap-2 rounded-lg border border-[#D5DDE7] bg-white px-3 py-2 text-[12px] font-medium text-[#273A4E] hover:bg-slate-50"
        >
          <Icon name="back" />
          Volver a la lista
        </Link>
      </div>

      <div className="mt-3 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B6870]">{incidencia.codigo}</p>
                <h1 className="mt-2 text-[30px] font-bold tracking-tight text-[#111C2D]">{incidencia.titulo}</h1>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${getPrioridadTone(incidencia.prioridad)}`}>
                Prioridad {incidencia.prioridad}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoTone(incidencia.estado)}`}>
                {formatEstado(incidencia.estado)}
              </span>
              <span className="rounded-full bg-[#E7EEFF] px-2.5 py-1 text-[11px] font-semibold text-[#111C2D]">
                {incidencia.tecnico_asignado?.nombre ?? 'Sin técnico'}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F7F9FF] p-4 text-[14px] leading-7 text-[#43474C]">
              {incidencia.descripcion}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F7F9FF] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#43474C]">
                  <Icon name="lan" />
                  Categoría técnica
                </div>
                <p className="mt-3 text-[16px] font-semibold text-[#111C2D]">
                  {incidencia.categoria === 'computo_redes' ? 'Cómputo y redes' : incidencia.categoria === 'infraestructura' ? 'Infraestructura' : 'Académico'}
                </p>
                <p className="mt-2 text-[13px] text-[#43474C]">Hardware de red / Switch rackeable administrable</p>
              </div>

              <div className="rounded-2xl bg-[#F7F9FF] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#43474C]">
                  <Icon name="location" />
                  Ubicación precisa
                </div>
                <p className="mt-3 text-[16px] font-semibold text-[#111C2D]">
                  {incidencia.ubicacion.edificio} — {incidencia.ubicacion.piso ?? 'Planta baja'}
                </p>
                <p className="mt-2 text-[13px] text-[#43474C]">{incidencia.ubicacion.aula} — {incidencia.ubicacion.referencia ?? 'Area operativa'}</p>
              </div>

              <div className="rounded-2xl bg-[#F7F9FF] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#43474C]">
                  <Icon name="clock" />
                  Fecha y hora de registro
                </div>
                <p className="mt-3 text-[16px] font-semibold text-[#111C2D]">{fecha}</p>
                <p className="mt-2 text-[13px] text-[#43474C]">SLA asignado: 4 horas máximas en sitio</p>
              </div>

              <div className="rounded-2xl bg-[#F7F9FF] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#43474C]">
                  <Icon name="person" />
                  Usuario reportante
                </div>
                <p className="mt-3 text-[16px] font-semibold text-[#111C2D]">{incidencia.reportante.nombre}</p>
                <p className="mt-2 text-[13px] text-[#43474C]">{incidencia.reportante.tipo === 'docente' ? 'Docente titular' : incidencia.reportante.tipo}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#EAF6F0] p-4 text-[#1D6A4E]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D1EFDF] text-[#1B6870]">
                    <Icon name="person" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#111C2D]">Contacto directo para validación:</p>
                    <p className="text-[13px] text-[#43474C]">Ext. 2480 • {incidencia.reportante.nombre.toLowerCase().replace(/\s+/g, '.')}@utm.edu.mx</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-[#1B6870] ring-1 ring-[#D5EAE8]">
                  <Icon name="clock" />
                  Presente en laboratorio hasta las 14:00 hrs
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B6870] text-white">
                  <Icon name="history" />
                </div>
                <h2 className="text-[20px] font-semibold text-[#111C2D]">Historial de seguimiento técnico</h2>
              </div>
              <span className="rounded-full bg-[#F7F9FF] px-2.5 py-1 text-[11px] font-semibold text-[#43474C]">
                {incidencia.historial_seguimiento.length} acciones registradas
              </span>
            </div>

            <div className="relative space-y-5 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E7EEFF]">
              {incidencia.historial_seguimiento.map((evento, index) => (
                <div key={`${evento.fecha}-${index}`} className="relative">
                  <div className="absolute -left-[30px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B6870] text-white ring-4 ring-white">
                    {index === 0 ? <Icon name="warning" /> : index === 1 ? <Icon name="build" /> : <Icon name="assignment" />}
                  </div>
                  <div className="rounded-2xl border border-[#E7EEFF] bg-[#F7F9FF] p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#111C2D]">
                          {index === 0 ? 'Registro inicial de reporte' : index === 1 ? 'Inspección física en sitio' : 'Evaluación técnica'}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${index === 1 ? 'bg-[#EAF6F0] text-[#1D6A4E]' : 'bg-[#F5F6F8] text-[#4A4F5A]'}`}>
                          {index === 1 ? 'En proceso' : 'Pendiente'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#43474C]">
                        {new Date(evento.fecha).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-[12px] text-[#1B6870]">
                      <Icon name="person" />
                      <span>{evento.autor}</span>
                    </div>

                    <p className="text-[14px] leading-6 text-[#43474C]">{evento.comentario}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF6F0] text-[#1D6A4E]">
                <Icon name="build" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#111C2D]">Acciones técnicas</h2>
                <p className="text-[12px] text-[#43474C]">Intervención operativa directa</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link href={`/tecnico_soporte/incidencias/${incidencia._id}/intervencion`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B6870] px-4 py-3 text-[14px] font-semibold text-white shadow-sm hover:opacity-95">
                <Icon name="assignment" />
                Registrar intervención
              </Link>
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F7F9FF] px-4 py-3 text-[14px] font-semibold text-[#1B6870] ring-1 ring-[#DDE7F4] hover:bg-[#EEF5FF]">
                <Icon name="warning" />
                Registrar resolución
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F7F9FF] p-3 text-[12px] leading-5 text-[#43474C]">
              Recuerda que como personal técnico registras intervenciones de campo y diagnóstico técnico. Las validaciones académicas y cierres definitivos son coordinados por el módulo central.
            </div>
          </section>

          <section className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7EEFF] text-[#111C2D]">
                  <Icon name="attach" />
                </div>
                <h2 className="text-[20px] font-semibold text-[#111C2D]">Evidencias del reporte</h2>
              </div>
              <span className="text-[11px] font-medium text-[#43474C]">{incidencia.evidencias_adjuntas?.length ?? 0} archivos</span>
            </div>

            <div className="space-y-3">
              {(incidencia.evidencias_adjuntas?.length ?? 0) > 0 ? (
                incidencia.evidencias_adjuntas!.map((archivo, index) => (
                  <div key={`${archivo.nombre_archivo}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7EEFF] bg-[#F7F9FF] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E7EEFF] text-[#1B6870]">
                        {archivo.tipo_mime.includes('image') ? <Icon name="assignment" /> : <Icon name="attach" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111C2D]">{archivo.nombre_archivo}</p>
                        <p className="truncate text-[11px] text-[#43474C]">{archivo.peso_kb} KB • {archivo.tipo_mime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#43474C]">
                      <button type="button" className="rounded-md p-2 hover:bg-white" aria-label="Ver archivo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button type="button" className="rounded-md p-2 hover:bg-white" aria-label="Descargar archivo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                          <path d="M12 3v11" />
                          <path d="m7 19 5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[#D5DDE7] bg-[#F7F9FF] p-4 text-[13px] text-[#43474C]">No hay evidencias adjuntas.</p>
              )}
            </div>

            <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F7F9FF] px-4 py-3 text-[13px] font-semibold text-[#1B6870] ring-1 ring-[#DDE7F4] hover:bg-[#EEF5FF]">
              <Icon name="attach" />
              + Adjuntar nueva evidencia técnica
            </button>
          </section>

          <section className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7EEFF] text-[#111C2D]">
                <Icon name="support" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#111C2D]">Soporte y cuadrilla central</h2>
                <p className="text-[12px] text-[#43474C]">Coordinación de campus</p>
              </div>
            </div>

            <div className="space-y-3 text-[13px] text-[#43474C]">
              <div className="flex items-start gap-3 rounded-2xl bg-[#F7F9FF] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B6870] text-white">MC</div>
                <div>
                  <p className="font-semibold text-[#111C2D]">Marco Valenzuela Cruz</p>
                  <p>Coordinación de infraestructura y redes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-[#F7F9FF] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D1EFDF] text-[#1B6870]">IT</div>
                <div>
                  <p className="font-semibold text-[#111C2D]">Taller de mantenimiento</p>
                  <p>Rutina de soporte físico • 08:00 - 18:00</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
