'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCKS } from '@/config/endpoints';
import { ApiError } from '@/lib/httpClient';
import { tecnicoApiService } from '@/services/tecnicoApiService';
import type {
  EstadoIncidencia,
  Incidencia,
  PrioridadIncidencia,
} from '@/types/incidencia';

type EstadoFiltro = 'todos' | 'pendiente' | 'en_proceso' | 'resuelta';
type PrioridadFiltro = 'todas' | PrioridadIncidencia;

const pageSize = 8;
const priorityWeight: Record<PrioridadIncidencia, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3,
};
const priorityLabels: Record<PrioridadIncidencia, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
const statusLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};
const statusFilters: { value: EstadoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelta', label: 'Resueltas' },
];

function createDemoIncidents(): Incidencia[] {
  const now = Date.now();
  const technician = {
    usuario_id: 'demo-technician',
    nombre: 'Ing. Marco Valenzuela Cruz',
  };

  return [
    {
      _id: 'tec-inc-102',
      codigo: 'INC-2026-0114',
      titulo: 'Contacto eléctrico con chispas',
      descripcion: 'Se reportan chispas en el contacto eléctrico del aula magna.',
      categoria: 'infraestructura',
      prioridad: 'critica',
      estado: 'pendiente',
      reportante: {
        usuario_id: 'u-r-02',
        nombre: 'Lic. Claudia Estrada',
        tipo: 'administrativo',
      },
      tecnico_asignado: technician,
      ubicacion: {
        edificio: 'Aula Magna 2',
        piso: 'Planta Alta',
        aula: 'Aula Magna 2',
      },
      tags: ['electricidad', 'seguridad'],
      historial_seguimiento: [],
      fecha_creacion: new Date(now - 25 * 60_000).toISOString(),
    },
    {
      _id: 'tec-inc-101',
      codigo: 'INC-2026-0113',
      titulo: 'Switch sin conectividad en laboratorio',
      descripcion: 'Falla de conectividad en el switch principal del laboratorio.',
      categoria: 'computo_redes',
      prioridad: 'alta',
      estado: 'en_proceso',
      reportante: {
        usuario_id: 'u-r-01',
        nombre: 'Prof. Alejandro Morales',
        tipo: 'docente',
      },
      tecnico_asignado: technician,
      ubicacion: {
        edificio: 'Edificio B',
        piso: 'Planta Alta',
        aula: 'Lab. Cómputo 3',
      },
      tags: ['redes', 'laboratorio'],
      historial_seguimiento: [],
      fecha_creacion: new Date(now - 70 * 60_000).toISOString(),
    },
    {
      _id: 'tec-inc-103',
      codigo: 'INC-2026-0118',
      titulo: 'Falla de enlace en Access Point de Biblioteca',
      descripcion: 'El AP de la biblioteca presenta caída recurrente de señal.',
      categoria: 'computo_redes',
      prioridad: 'media',
      estado: 'pendiente',
      reportante: {
        usuario_id: 'u-r-03',
        nombre: 'Mtro. Fernando Ramos',
        tipo: 'docente',
      },
      tecnico_asignado: technician,
      ubicacion: {
        edificio: 'Edificio Central',
        aula: 'Sala de Lectura',
      },
      tags: ['wifi', 'biblioteca'],
      historial_seguimiento: [],
      fecha_creacion: new Date(now - 160 * 60_000).toISOString(),
    },
    {
      _id: 'tec-inc-105',
      codigo: 'INC-2026-0121',
      titulo: 'Impresora de red sin respuesta en Dirección',
      descripcion: 'La impresora de red de Dirección dejó de responder.',
      categoria: 'computo_redes',
      prioridad: 'baja',
      estado: 'en_proceso',
      reportante: {
        usuario_id: 'u-r-05',
        nombre: 'Lic. Roberto Méndez',
        tipo: 'administrativo',
      },
      tecnico_asignado: technician,
      ubicacion: {
        edificio: 'Edificio Administrativo',
        piso: 'Piso 1',
        aula: 'Ofic. 104',
      },
      tags: ['impresora', 'redes'],
      historial_seguimiento: [],
      fecha_creacion: new Date(now - 9 * 60 * 60_000).toISOString(),
    },
  ];
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="5" rx="1" />
        <rect x="13" y="10" width="8" height="11" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
      </>
    ),
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    building: (
      <>
        <path d="M3 21h18M5 21V5l7-3v19m7 0V9l-7-4" />
        <path d="M8 7h1m-1 4h1m-1 4h1m7-3h1m-1 4h1" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    update: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    build: (
      <>
        <path d="m14 7 3 3m-7 8-7 3 3-7L16 4a3 3 0 0 1 4 4L10 18Z" />
        <path d="m6 18 2 2" />
      </>
    ),
    assignment: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M9 5V3h6v2m-7 6h8m-8 4h8" />
      </>
    ),
    forward: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    left: <><path d="M20 12H5m6 6-6-6 6-6" /></>,
    right: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    shield: (
      <>
        <path d="M12 3 5 6v6c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7" /></>,
    sync: (
      <>
        <path d="M20 12a8 8 0 1 1-8-8" />
        <path d="M20 4v8h-8" />
      </>
    ),
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
      {paths[name] ?? paths.forward}
    </svg>
  );
}

function isPending(status: EstadoIncidencia) {
  return status === 'abierta' || status === 'pendiente' || status === 'reabierta';
}

function matchesStatus(incidencia: Incidencia, filter: EstadoFiltro) {
  if (filter === 'todos') return true;
  if (filter === 'pendiente') return isPending(incidencia.estado);
  if (filter === 'en_proceso') return incidencia.estado === 'en_proceso';
  return incidencia.estado === 'resuelta' || incidencia.estado === 'cerrada';
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function formatReportedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `Hace ${minutes} min`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `Hace ${hours}h ${remainder}m`;
  }
  return `Ayer ${date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} hrs`;
}

function formatSyncedAt(value: Date | null) {
  if (!value) return 'Sin sincronizar';
  return `Sincronizado ${value.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} hrs`;
}

function getActionLabel(status: EstadoIncidencia) {
  return status === 'en_proceso' ? 'Continuar' : 'Atender';
}

function getPriorityClasses(priority: PrioridadIncidencia) {
  if (priority === 'critica') return 'bg-[#ffdad6] text-[#93000a]';
  if (priority === 'alta') return 'bg-[#a6ebf4]/50 text-[#216c74]';
  if (priority === 'media') return 'bg-[#e7eeff] text-[#43474c]';
  return 'bg-[#f0f3ff] text-[#43474c]';
}

function getStatusClasses(status: EstadoIncidencia) {
  if (status === 'en_proceso') return 'bg-[#a6ebf4] text-[#216c74]';
  if (status === 'resuelta' || status === 'cerrada') {
    return 'bg-emerald-100 text-emerald-800';
  }
  return 'bg-[#e7eeff] text-[#43474c]';
}

export default function TecnicoIncidenciasPage() {
  const { usuario, cargando } = useAuth();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [prioridadFiltro, setPrioridadFiltro] = useState<PrioridadFiltro>('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadIncidencias = useCallback(async (signal?: AbortSignal) => {
    if (!usuario) return;
    try {
      await Promise.resolve();
      const loaded = USE_MOCKS
        ? createDemoIncidents()
        : await tecnicoApiService.listarIncidencias(signal);
      if (signal?.aborted) return;
      const assigned = USE_MOCKS
        ? loaded
        : loaded.filter(
            (incidencia) =>
              incidencia.tecnico_asignado?.usuario_id === usuario.id,
          );
      setIncidencias(assigned);
      setLastSyncedAt(new Date());
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

  const activeIncidencias = useMemo(
    () => incidencias.filter((incidencia) => !['resuelta', 'cerrada'].includes(incidencia.estado)),
    [incidencias],
  );
  const pendingCount = activeIncidencias.filter((item) => isPending(item.estado)).length;
  const inProgressCount = activeIncidencias.filter(
    (item) => item.estado === 'en_proceso',
  ).length;

  const filteredIncidencias = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    return incidencias
      .filter((incidencia) => matchesStatus(incidencia, estadoFiltro))
      .filter(
        (incidencia) =>
          prioridadFiltro === 'todas' || incidencia.prioridad === prioridadFiltro,
      )
      .filter((incidencia) => {
        if (!normalizedQuery) return true;
        const searchableText = normalizeText(
          [
            incidencia.codigo,
            incidencia.titulo,
            incidencia.reportante.nombre,
            formatLocation(incidencia),
          ].join(' '),
        );
        return searchableText.includes(normalizedQuery);
      })
      .sort(
        (a, b) =>
          priorityWeight[a.prioridad] - priorityWeight[b.prioridad] ||
          new Date(a.fecha_creacion).getTime() -
            new Date(b.fecha_creacion).getTime(),
      );
  }, [estadoFiltro, incidencias, prioridadFiltro, query]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidencias.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const visibleIncidencias = filteredIncidencias.slice(
    startIndex,
    startIndex + pageSize,
  );
  const shownFrom = filteredIncidencias.length === 0 ? 0 : startIndex + 1;
  const shownTo = Math.min(startIndex + pageSize, filteredIncidencias.length);

  if (cargando || !usuario || usuario.rol !== 'tecnico_soporte') return null;

  const metrics = [
    {
      label: 'Pendientes',
      value: pendingCount,
      detail: 'Requieren visita',
      icon: 'pending',
      color: 'bg-[#ffdad6]/60 text-[#ba1a1a]',
      percentage: activeIncidencias.length
        ? Math.round((pendingCount / activeIncidencias.length) * 100)
        : 0,
      barColor: 'bg-[#ba1a1a]',
    },
    {
      label: 'En proceso',
      value: inProgressCount,
      detail: 'En diagnóstico',
      icon: 'build',
      color: 'bg-[#a6ebf4]/50 text-[#1b6870]',
      percentage: activeIncidencias.length
        ? Math.round((inProgressCount / activeIncidencias.length) * 100)
        : 0,
      barColor: 'bg-[#1b6870]',
    },
    {
      label: 'Total asignadas',
      value: activeIncidencias.length,
      detail: 'Carga activa',
      icon: 'assignment',
      color: 'bg-[#d8e3fb] text-[#293b4e]',
      percentage: activeIncidencias.length ? 100 : 0,
      barColor: 'bg-[#293b4e]',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 pt-6">
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-2 text-xs font-medium text-[#43474c]"
        >
          <Link
            className="inline-flex items-center gap-1 transition-colors hover:text-[#1b6870]"
            href="/tecnico_soporte"
          >
            <Icon className="h-4 w-4" name="dashboard" />
            Panel principal
          </Link>
          <span aria-hidden="true" className="text-[#43474c]/40">/</span>
          <span aria-current="page" className="font-semibold text-[#111c2d]">
            Incidencias asignadas
          </span>
        </nav>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#e7eeff] px-4 py-1.5 text-xs text-[#43474c] shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#1b6870]" />
          Turno matutino activo · Campus Central
        </div>
      </div>

      <section className="flex flex-col justify-between gap-5 pb-6 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1b6870]">
            <span aria-hidden="true" className="text-base">⚙</span>
            Asignación operativa directa
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111c2d] sm:text-[30px]">
            Incidencias asignadas
          </h1>
          <p className="text-sm text-[#43474c]">
            Consulta y administra la atención de tus casos asignados con registro técnico continuo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="group inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#111c2d] shadow-sm transition hover:bg-[#e7eeff] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              setQuery('');
              setEstadoFiltro('todos');
              setPrioridadFiltro('todas');
              setCurrentPage(1);
              void loadIncidencias().finally(() => setIsLoading(false));
            }}
            type="button"
          >
            <Icon
              className={`h-5 w-5 text-[#43474c] transition-transform duration-500 group-hover:rotate-180 ${
                isLoading ? 'animate-spin' : ''
              }`}
              name="sync"
            />
            Actualizar lista
          </button>
          <div className="hidden items-center gap-2 rounded-lg bg-[#f0f3ff] px-4 py-2.5 text-xs text-[#43474c] sm:flex">
            <span className="text-[#1b6870]">⌁</span>
            {formatSyncedAt(lastSyncedAt)}
          </div>
        </div>
      </section>

      {loadError && (
        <div
          className="mb-5 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
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

      <section
        aria-label="Resumen de incidencias"
        className="grid gap-4 pb-8 sm:grid-cols-3"
      >
        {metrics.map((metric) => (
          <article
            className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            key={metric.label}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">
                  {metric.label}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#111c2d]">
                    {isLoading ? '—' : metric.value}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      metric.label === 'Pendientes'
                        ? 'text-[#ba1a1a]'
                        : 'text-[#1b6870]'
                    }`}
                  >
                    {metric.detail}
                  </span>
                </div>
              </div>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.color}`}
              >
                <Icon className="h-6 w-6" name={metric.icon} />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#d8e3fb]">
                <div
                  className={`h-full rounded-full transition-[width] ${metric.barColor}`}
                  style={{ width: `${isLoading ? 0 : metric.percentage}%` }}
                />
              </div>
              <span className="min-w-8 text-right text-[11px] text-[#43474c]">
                {isLoading ? '—' : `${metric.percentage}%`}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1 lg:min-w-[280px]">
            <span className="sr-only">Buscar por código, título o reportante</span>
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#43474c]"
              name="search"
            />
            <input
              className="w-full rounded-lg bg-[#f0f3ff] py-2.5 pl-10 pr-4 text-sm text-[#111c2d] placeholder:text-[#43474c]/60 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código o título..."
              type="search"
              value={query}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div
              aria-label="Filtrar por estado"
              className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#f0f3ff] p-1"
              role="group"
            >
              {statusFilters.map((filter) => (
                <button
                  aria-pressed={estadoFiltro === filter.value}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    estadoFiltro === filter.value
                      ? 'bg-white text-[#111c2d] shadow-sm'
                      : 'text-[#43474c] hover:text-[#111c2d]'
                  }`}
                  key={filter.value}
                  onClick={() => {
                    setEstadoFiltro(filter.value);
                    setCurrentPage(1);
                  }}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label>
              <span className="sr-only">Filtrar por prioridad</span>
              <select
                className="w-full min-w-[170px] cursor-pointer appearance-none rounded-lg bg-[#f0f3ff] py-2 pl-3 pr-8 text-xs font-medium text-[#111c2d] transition focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => {
                  setPrioridadFiltro(event.target.value as PrioridadFiltro);
                  setCurrentPage(1);
                }}
                value={prioridadFiltro}
              >
                <option value="todas">Todas las prioridades</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e7eeff] pt-3 text-[11px] text-[#43474c]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1b6870]" />
            <span className="font-semibold text-[#111c2d]" aria-live="polite">
              {filteredIncidencias.length}{' '}
              {filteredIncidencias.length === 1
                ? 'incidencia asignada'
                : 'incidencias asignadas'}
            </span>
            <span className="hidden text-[#43474c]/50 sm:inline">·</span>
            <span className="hidden sm:inline">
              Registradas bajo {usuario.nombre}
            </span>
          </div>
          <span className="text-[#43474c]/80">Ordenadas por prioridad operativa</span>
        </div>
      </section>

      <section
        aria-label="Lista de incidencias asignadas"
        className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm"
      >
        <div className="hidden grid-cols-12 gap-4 bg-[#f0f3ff] px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#43474c] md:grid">
          <div className="col-span-2">Código</div>
          <div className="col-span-4">Incidencia / Reportante</div>
          <div className="col-span-3">Ubicación</div>
          <div className="col-span-1">Prioridad</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 text-right">Acción</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-14 text-center text-sm text-[#43474c]" role="status">
            Cargando incidencias asignadas...
          </div>
        ) : visibleIncidencias.length > 0 ? (
          <div className="divide-y divide-[#e7eeff]">
            {visibleIncidencias.map((incidencia) => (
              <article
                className="grid grid-cols-1 items-center gap-3 px-4 py-5 transition-colors hover:bg-[#f0f3ff]/50 sm:px-6 md:grid-cols-12 md:gap-4"
                key={incidencia._id}
              >
                <div className="flex items-center justify-between gap-2 md:col-span-2 md:justify-start">
                  <span className="rounded-md bg-[#e7eeff] px-2 py-1 text-[11px] font-bold tracking-wide text-[#293b4e]">
                    {incidencia.codigo || incidencia._id}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold md:hidden ${getPriorityClasses(
                      incidencia.prioridad,
                    )}`}
                  >
                    {priorityLabels[incidencia.prioridad]}
                  </span>
                </div>

                <div className="min-w-0 md:col-span-4">
                  <h2
                    className="truncate text-sm font-semibold text-[#111c2d]"
                    title={incidencia.titulo}
                  >
                    {incidencia.titulo}
                  </h2>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-[#43474c]">
                    <Icon className="h-3.5 w-3.5 shrink-0" name="person" />
                    <span className="truncate">
                      Reporta: {incidencia.reportante.nombre || 'No disponible'}
                    </span>
                    <span className="text-[#43474c]/40">·</span>
                    <span className="shrink-0">
                      {formatReportedAt(incidencia.fecha_creacion)}
                    </span>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-sm text-[#111c2d] md:col-span-3">
                  <Icon
                    className="h-[18px] w-[18px] shrink-0 text-[#1b6870]"
                    name="building"
                  />
                  <span className="truncate" title={formatLocation(incidencia)}>
                    {formatLocation(incidencia) || 'Ubicación no disponible'}
                  </span>
                </div>

                <div className="hidden items-center md:col-span-1 md:flex">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${getPriorityClasses(
                      incidencia.prioridad,
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {priorityLabels[incidencia.prioridad]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 md:col-span-1 md:justify-start">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClasses(
                      incidencia.estado,
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-current ${
                        incidencia.estado === 'en_proceso' ? 'animate-pulse' : ''
                      }`}
                    />
                    {statusLabels[incidencia.estado]}
                  </span>
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b6870] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#15575e] active:scale-[0.98] md:hidden"
                    href={`/tecnico_soporte/incidencias/${encodeURIComponent(incidencia._id)}`}
                  >
                    {getActionLabel(incidencia.estado)}
                    <Icon className="h-4 w-4" name="forward" />
                  </Link>
                </div>

                <div className="hidden justify-end md:col-span-1 md:flex">
                  <Link
                    className="group inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#1b6870] px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#15575e] hover:shadow active:scale-[0.98]"
                    href={`/tecnico_soporte/incidencias/${encodeURIComponent(incidencia._id)}`}
                  >
                    {getActionLabel(incidencia.estado)}
                    <Icon
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      name="forward"
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e7eeff] text-[#43474c]">
              <Icon className="h-7 w-7" name="search" />
            </span>
            <h2 className="text-lg font-semibold text-[#111c2d]">
              {loadError
                ? 'No fue posible consultar las incidencias'
                : 'Sin incidencias encontradas'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[#43474c]">
              {loadError
                ? 'Verifica tu conexión e intenta actualizar la lista.'
                : 'No hay incidencias que coincidan con los filtros aplicados para tu rol técnico.'}
            </p>
          </div>
        )}

        {!isLoading && filteredIncidencias.length > 0 && (
          <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#e7eeff] bg-white px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-xs text-[#43474c]">
              Mostrando{' '}
              <span className="font-semibold text-[#111c2d]">
                {shownFrom} - {shownTo}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-[#111c2d]">
                {filteredIncidencias.length}
              </span>{' '}
              asignadas
            </p>
            <nav aria-label="Paginación de incidencias" className="flex items-center gap-1">
              <button
                className="inline-flex items-center gap-1 rounded-lg bg-[#f0f3ff] px-3 py-1.5 text-xs font-medium text-[#43474c] transition hover:bg-[#e7eeff] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                type="button"
              >
                <Icon className="h-4 w-4" name="left" />
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    aria-current={pageNumber === page ? 'page' : undefined}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      pageNumber === page
                        ? 'bg-[#1b6870] text-white'
                        : 'text-[#43474c] hover:bg-[#f0f3ff]'
                    }`}
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                className="inline-flex items-center gap-1 rounded-lg bg-[#f0f3ff] px-3 py-1.5 text-xs font-medium text-[#43474c] transition hover:bg-[#e7eeff] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() =>
                  setCurrentPage((previous) => Math.min(totalPages, previous + 1))
                }
                type="button"
              >
                Siguiente
                <Icon className="h-4 w-4" name="right" />
              </button>
            </nav>
          </footer>
        )}
      </section>

      <aside className="mb-8 flex flex-col items-start gap-4 rounded-xl bg-[#f0f3ff] p-5 shadow-sm md:flex-row md:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b6870]/10 text-[#1b6870]">
          <Icon className="h-6 w-6" name="shield" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-[#111c2d]">
            Protocolo institucional de atención técnica
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-[#43474c]">
            Recuerda registrar en bitácora el avance de cada visita y solicitar la firma o confirmación digital del reportante antes de concluir formalmente el servicio en el módulo de resolución.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#1b6870] shadow-sm">
          <Icon className="h-[18px] w-[18px]" name="book" />
          Guía Técnica v2.4
        </span>
      </aside>
    </div>
  );
}
