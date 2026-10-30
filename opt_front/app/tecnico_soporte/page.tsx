'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCKS } from '@/config/endpoints';
import { ApiError } from '@/lib/httpClient';
import { tecnicoApiService } from '@/services/tecnicoApiService';
import type { EstadoIncidencia, Incidencia } from '@/types/incidencia';

const demoIncidents: Incidencia[] = [
  {
    _id: 'tec-inc-101',
    codigo: 'INC-2026-0113',
    titulo: 'Switch sin conectividad en laboratorio',
    descripcion: 'Falla de conectividad en el switch principal del laboratorio.',
    categoria: 'computo_redes',
    prioridad: 'alta',
    estado: 'en_proceso',
    reportante: { usuario_id: 'u-r-01', nombre: 'Prof. Alejandro Morales', tipo: 'docente' },
    tecnico_asignado: { usuario_id: 'demo-technician', nombre: 'Personal técnico' },
    ubicacion: { edificio: 'Edificio B', piso: 'Planta Alta', aula: 'Lab. Cómputo 3' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: new Date(Date.now() - 25 * 60_000).toISOString(),
  },
  {
    _id: 'tec-inc-102',
    codigo: 'INC-2026-0114',
    titulo: 'Contacto eléctrico con chispas',
    descripcion: 'Se observan chispas en el contacto eléctrico del aula magna.',
    categoria: 'infraestructura',
    prioridad: 'critica',
    estado: 'pendiente',
    reportante: { usuario_id: 'u-r-02', nombre: 'Lic. Claudia Estrada', tipo: 'administrativo' },
    tecnico_asignado: { usuario_id: 'demo-technician', nombre: 'Personal técnico' },
    ubicacion: { edificio: 'Aula Magna 2', piso: 'Planta Alta', aula: 'Aula Magna 2' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
  {
    _id: 'tec-inc-103',
    codigo: 'INC-2026-0118',
    titulo: 'Falla de enlace en Access Point de Biblioteca',
    descripcion: 'El AP de la biblioteca presenta caída recurrente de señal.',
    categoria: 'computo_redes',
    prioridad: 'media',
    estado: 'pendiente',
    reportante: { usuario_id: 'u-r-03', nombre: 'Mtro. Fernando Ramos', tipo: 'docente' },
    tecnico_asignado: { usuario_id: 'demo-technician', nombre: 'Personal técnico' },
    ubicacion: { edificio: 'Edificio Central', aula: 'Sala de Lectura' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
];

const activeStatuses: EstadoIncidencia[] = ['abierta', 'reabierta', 'pendiente', 'en_proceso'];
const priorityWeight = { critica: 0, alta: 1, media: 2, baja: 3 } as const;
const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
} as const;
const statusLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const icons: Record<string, ReactNode> = {
    schedule: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    build: <><path d="m14 7 3 3m-7 8-7 3 3-7L16 4a3 3 0 0 1 4 4L10 18Z" /><path d="m6 18 2 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    update: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" /></>,
    forward: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    badge: <><path d="M7 7h10v6a5 5 0 0 1-10 0V7Z" /><path d="M9 17v3l3-2 3 2v-3" /></>,
    shield: <><path d="M12 3 5 6v6c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    checklist: <><path d="m4 7 2 2 3-3m3 1h8M4 14l2 2 3-3m3 1h8m-8 5h8" /></>,
    refresh: <><path d="M20 12a8 8 0 1 1-8-8" /><path d="M20 4v8h-8" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icons[name] ?? icons.update}
    </svg>
  );
}

function formatLocation(incidencia: Incidencia) {
  return [
    incidencia.ubicacion.edificio,
    incidencia.ubicacion.aula,
    incidencia.ubicacion.piso,
  ]
    .filter(Boolean)
    .join(' — ');
}

function formatElapsed(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Fecha de reporte no disponible';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `Reportado hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Reportado hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

function isAssignedTo(incidencia: Incidencia, technicianId: string) {
  return incidencia.tecnico_asignado?.usuario_id === technicianId;
}

export default function TecnicoDashboardPage() {
  const { usuario, cargando } = useAuth();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadIncidencias = useCallback(async (signal?: AbortSignal) => {
    if (!usuario) return;
    try {
      await Promise.resolve();
      const loaded = USE_MOCKS
        ? demoIncidents
        : await tecnicoApiService.listarIncidencias(signal);
      if (signal?.aborted) return;
      setIncidencias(
        USE_MOCKS
          ? loaded
          : loaded.filter((incidencia) => isAssignedTo(incidencia, usuario.id)),
      );
      setLoadError(null);
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'No se pudieron cargar las incidencias asignadas.',
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (cargando || !usuario) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadIncidencias(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cargando, loadIncidencias, usuario]);

  const pendingCount = incidencias.filter(
    (item) => item.estado === 'abierta' || item.estado === 'pendiente' || item.estado === 'reabierta',
  ).length;
  const inProgressCount = incidencias.filter((item) => item.estado === 'en_proceso').length;
  const resolvedThisWeek = incidencias.filter((item) => {
    if (item.estado !== 'resuelta' && item.estado !== 'cerrada') return false;
    const resolvedDate = new Date(item.fecha_resolucion ?? item.fecha_cierre ?? item.fecha_creacion);
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return resolvedDate >= weekStart;
  }).length;
  const resolvedCount = USE_MOCKS ? 5 : resolvedThisWeek;
  const requiringAttention = useMemo(
    () =>
      incidencias
        .filter((item) => activeStatuses.includes(item.estado))
        .sort(
          (a, b) =>
            priorityWeight[a.prioridad] - priorityWeight[b.prioridad] ||
            new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime(),
        )
        .slice(0, 3),
    [incidencias],
  );

  if (
    cargando ||
    !usuario ||
    usuario.rol !== 'tecnico_soporte'
  ) {
    return null;
  }

  const metrics = [
    {
      label: 'Pendientes de atención',
      value: pendingCount,
      detail: 'Por iniciar diagnóstico',
      icon: 'schedule',
      color: 'bg-[#d8e3fb] text-[#43474c]',
    },
    {
      label: 'En proceso',
      value: inProgressCount,
      detail: 'Con intervención en curso',
      icon: 'build',
      color: 'bg-[#a6ebf4] text-[#216c74]',
    },
    {
      label: 'Resueltas',
      value: resolvedCount,
      detail: 'Concluidas esta semana',
      icon: 'check',
      color: 'bg-[#f0f3ff] text-[#1b6870]',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 py-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#111c2d] sm:text-[30px]">
              Panel principal
            </h1>
            <span className="rounded-full bg-[#d8e3fb] px-2.5 py-1 text-[11px] font-semibold text-[#43474c]">
              Técnico
            </span>
          </div>
          <p className="mt-1 text-sm text-[#43474c]">
            Resumen de tus incidencias asignadas y prioridades del turno
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-medium text-[#111c2d] shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#1b6870]" />
            En servicio — Cuadrilla Campus Central
          </span>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-[#1b6870] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#15575e]"
            href="/tecnico_soporte/incidencias"
          >
            Ir a incidencias asignadas
            <Icon className="h-[18px] w-[18px]" name="forward" />
          </Link>
          <button
            aria-label="Actualizar incidencias asignadas"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5dde7] bg-white text-[#273a4e] transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              void loadIncidencias().finally(() => setIsLoading(false));
            }}
            type="button"
          >
            <Icon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} name="refresh" />
          </button>
        </div>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{loadError}</span>
          <button
            className="shrink-0 font-semibold underline"
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              void loadIncidencias().finally(() => setIsLoading(false));
            }}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )}

      <section aria-label="Resumen del turno" className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <article className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm" key={metric.label}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold text-[#111c2d]">{isLoading ? '—' : metric.value}</p>
              <p className="mt-1 text-xs text-[#43474c]">{metric.detail}</p>
            </div>
            <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${metric.color}`}>
              <Icon className="h-6 w-6" name={metric.icon} />
            </span>
          </article>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#111c2d]">Incidencias que requieren atención</h2>
              <span className="text-xs text-[#43474c]">({incidencias.length} casos asignados)</span>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-xs font-medium text-[#1b6870] hover:underline"
              href="/tecnico_soporte/incidencias"
            >
              Ver todas mis incidencias
              <Icon className="h-4 w-4" name="forward" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-[#43474c]" role="status">
                Cargando incidencias asignadas...
              </div>
            ) : requiringAttention.map((incidencia) => (
              <article className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6" key={incidencia._id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#d8e3fb] px-2 py-1 text-[11px] font-semibold tracking-wide text-[#111c2d]">
                      {incidencia.codigo || incidencia._id}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      incidencia.prioridad === 'critica'
                        ? 'bg-red-100 text-red-800'
                        : incidencia.prioridad === 'alta'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : 'bg-[#e7eeff] text-[#38485d]'
                    }`}>
                      Prioridad {priorityLabels[incidencia.prioridad]}
                    </span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                    incidencia.estado === 'en_proceso'
                      ? 'bg-[#a6ebf4] text-[#216c74]'
                      : 'bg-[#e7eeff] text-[#43474c]'
                  }`}>
                    {statusLabels[incidencia.estado]}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111c2d]">{incidencia.titulo}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#43474c]">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-[#1b6870]" name="location" />
                      {formatLocation(incidencia)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-[#5a6470]" name="person" />
                      {incidencia.reportante.nombre}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef3ff] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#43474c]">
                    <Icon className="h-4 w-4 text-[#1b6870]" name="update" />
                    {formatElapsed(incidencia.fecha_creacion)}
                  </span>
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1b6870] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#155f66]"
                    href={`/tecnico_soporte/incidencias/${encodeURIComponent(incidencia._id)}`}
                  >
                    Ver incidencia
                    <Icon className="h-4 w-4" name="forward" />
                  </Link>
                </div>
              </article>
            ))}
            {!isLoading && !loadError && requiringAttention.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-[#43474c]">
                No tienes incidencias pendientes de atención.
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-5 lg:col-span-4">
          <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon className="h-[22px] w-[22px] text-[#1b6870]" name="badge" />
              <h2 className="text-base font-semibold text-[#111c2d]">Turno y Guardia de Hoy</h2>
            </div>
            <dl className="flex flex-col gap-3 text-xs">
              {[
                ['Sede:', 'Campus Central'],
                ['Horario:', '07:00 a 15:00 hrs'],
                ['Supervisor:', 'Ing. Roberto Méndez'],
                ['Mesa de Ayuda:', 'Ext. 2401'],
              ].map(([label, value]) => (
                <div className="flex items-start justify-between gap-3" key={label}>
                  <dt className="text-[#43474c]">{label}</dt>
                  <dd className={`text-right font-medium ${label === 'Mesa de Ayuda:' ? 'text-[#1b6870]' : 'text-[#111c2d]'}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="flex items-center gap-2 rounded-lg bg-[#f0f3ff] p-3 text-xs text-[#43474c]">
              <Icon className="h-[18px] w-[18px] shrink-0 text-[#1b6870]" name="shield" />
              Radio frecuencia local operativa en Canal 3.
            </p>
          </section>

          <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon className="h-[22px] w-[22px] text-[#1b6870]" name="checklist" />
              <h2 className="text-base font-semibold text-[#111c2d]">Guía rápida de atención</h2>
            </div>
            <ol className="flex flex-col gap-4">
              {[
                ['Diagnóstico en sitio', 'Verifica la falla física o de enlace directamente en el aula o laboratorio.'],
                ['Bitácora y avance', "Cambia el estado a 'En proceso' y registra los hallazgos técnicos."],
                ['Validación de cierre', 'Solicita la conformidad del solicitante antes de marcar como resuelta.'],
              ].map(([title, detail], index) => (
                <li className="flex items-start gap-3" key={title}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#a6ebf4] text-[11px] font-bold text-[#216c74]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-medium text-[#111c2d]">{title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#43474c]">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
