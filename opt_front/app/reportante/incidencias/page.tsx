'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCKS } from '@/config/endpoints';
import { getRoleHomePath } from '@/lib/authSession';
import { ApiError } from '@/lib/httpClient';
import { reportanteApiService } from '@/services/reportanteApiService';
import type { EstadoIncidencia, Incidencia } from '@/types/incidencia';

type StatusFilter = 'todos' | 'abierta' | 'en_proceso' | 'resuelta';

const navigation = [
  { href: '/reportante', label: 'Panel principal', icon: 'dashboard' },
  { href: '/reportante/registrar', label: 'Nueva incidencia', icon: 'add' },
  { href: '/reportante/incidencias', label: 'Mis incidencias', icon: 'receipt' },
];

const demoIncidents: Incidencia[] = [
  {
    _id: 'demo-0113',
    codigo: 'INC-2026-0113',
    titulo: 'Switch sin conectividad en laboratorio',
    descripcion: '',
    categoria: 'computo_redes',
    prioridad: 'media',
    estado: 'en_proceso',
    reportante: { usuario_id: 'demo', nombre: 'Reportante', tipo: 'docente' },
    ubicacion: { edificio: 'Edificio B', aula: 'Laboratorio de Cómputo 3' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: '2026-02-12T10:42:00',
  },
  {
    _id: 'demo-0114',
    codigo: 'INC-2026-0114',
    titulo: 'Contacto eléctrico con chispas',
    descripcion: '',
    categoria: 'infraestructura',
    prioridad: 'alta',
    estado: 'abierta',
    reportante: { usuario_id: 'demo', nombre: 'Reportante', tipo: 'docente' },
    ubicacion: { edificio: 'Aula Magna 2', piso: 'Planta Alta' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: '2026-02-11T15:15:00',
  },
  {
    _id: 'demo-0115',
    codigo: 'INC-2026-0115',
    titulo: 'Plataforma escolar no permite iniciar sesión',
    descripcion: '',
    categoria: 'academico',
    prioridad: 'media',
    estado: 'resuelta',
    reportante: { usuario_id: 'demo', nombre: 'Reportante', tipo: 'docente' },
    ubicacion: { edificio: 'Servicios Digitales', aula: 'Campus Virtual' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: '2026-02-11T09:00:00',
  },
  {
    _id: 'demo-0108',
    codigo: 'INC-2026-0108',
    titulo: 'Falla en cañón proyector de sala audiovisual',
    descripcion: '',
    categoria: 'computo_redes',
    prioridad: 'media',
    estado: 'cerrada',
    reportante: { usuario_id: 'demo', nombre: 'Reportante', tipo: 'docente' },
    ubicacion: { edificio: 'Edificio A', aula: 'Sala de Conferencias 1' },
    tags: [],
    historial_seguimiento: [],
    fecha_creacion: '2026-01-28T12:00:00',
  },
];

const statusLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En atención',
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
  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="5" rx="1" />
        <rect x="13" y="10" width="8" height="11" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
      </>
    ),
    add: <path d="M12 5v14m-7-7h14" />,
    receipt: (
      <>
        <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1 .9-1.8 1.2-1.8 2.7M12 17h.01" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    home: <path d="m3 10 9-7 9 7M5 9v11h14V9m-9 11v-6h4v6" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    schedule: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pending: (
      <>
        <path d="M7 3h10v4l-3 5 3 5v4H7v-4l3-5-3-5V3Z" />
        <path d="M8 7h8m-8 10h8" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    forward: <path d="M4 12h15m-6-6 6 6-6 6" />,
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
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
      {paths[name] ?? paths.info}
    </svg>
  );
}

function statusFilterMatches(status: EstadoIncidencia, filter: StatusFilter) {
  if (filter === 'todos') return true;
  if (filter === 'abierta') return status === 'abierta' || status === 'reabierta';
  if (filter === 'en_proceso') return status === 'en_proceso' || status === 'pendiente';
  return status === 'resuelta' || status === 'cerrada';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatLocation(incidencia: Incidencia) {
  const { edificio, piso, aula } = incidencia.ubicacion;
  return [edificio, piso, aula].filter(Boolean).join(', ') || 'Ubicación no especificada';
}

function getReporterId(incidencia: Incidencia) {
  return incidencia.reportante.usuario_id;
}

export default function ReportanteIncidenciasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    } else if (
      !cargando &&
      usuario &&
      usuario.rol !== 'reportante' &&
      usuario.rol !== 'administrador_sistema'
    ) {
      router.replace(getRoleHomePath(usuario.rol));
    }
  }, [cargando, router, usuario]);

  const loadIncidencias = useCallback(async (signal?: AbortSignal) => {
    if (!usuario) return;
    try {
      await Promise.resolve();
      const loaded = USE_MOCKS
        ? demoIncidents
        : await reportanteApiService.listarIncidencias(signal);
      if (signal?.aborted) return;
      setIncidencias(
        USE_MOCKS
          ? loaded
          : loaded.filter((incidencia) => getReporterId(incidencia) === usuario.id),
      );
      setLoadError(null);
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'No se pudieron cargar tus incidencias.',
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

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es-MX');
    return incidencias
      .filter((incidencia) => statusFilterMatches(incidencia.estado, filter))
      .filter((incidencia) => {
        if (!normalizedSearch) return true;
        return (
          incidencia.codigo.toLocaleLowerCase('es-MX').includes(normalizedSearch) ||
          incidencia.titulo.toLocaleLowerCase('es-MX').includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime(),
      );
  }, [filter, incidencias, search]);

  const activeCount = incidencias.filter(
    (item) => item.estado === 'abierta' || item.estado === 'reabierta' ||
      item.estado === 'en_proceso' || item.estado === 'pendiente',
  ).length;
  const resolvedCount = incidencias.filter(
    (item) => item.estado === 'resuelta' || item.estado === 'cerrada',
  ).length;
  const pageCount = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleIncidents = filteredIncidents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstItem =
    filteredIncidents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, filteredIncidents.length);

  if (
    cargando ||
    !usuario ||
    (usuario.rol !== 'reportante' && usuario.rol !== 'administrador_sistema')
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
        <p className="text-sm text-[#43474c]" role="status">Verificando sesión...</p>
      </main>
    );
  }

  const reportanteName = usuario.nombre || 'Reportante';
  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'abierta', label: 'Abiertas' },
    { id: 'en_proceso', label: 'En atención' },
    { id: 'resuelta', label: 'Resueltas' },
  ];

  function statusStyle(status: EstadoIncidencia) {
    if (status === 'en_proceso' || status === 'pendiente') {
      return 'bg-[#a6ebf4]/50 text-[#004f56]';
    }
    if (status === 'resuelta' || status === 'cerrada') {
      return 'bg-[#a9eef7]/40 text-[#1b6870]';
    }
    return 'bg-[#d8e3fb] text-[#293b4e]';
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] flex-col justify-between bg-[#293b4e] text-white shadow-sm lg:flex">
        <div>
          <div className="flex h-16 items-center gap-3 border-b border-[#2b3b50] px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1b6870] text-sm font-bold">U</div>
            <span className="text-lg font-semibold tracking-tight">UTM Soporte</span>
          </div>
          <div className="px-5 pb-2 pt-5">
            <span className="inline-flex items-center gap-2 rounded bg-[#2b3b50] px-2.5 py-1 text-[11px] font-medium text-[#a9eef7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a9eef7]" />
              Rol: Reportante
            </span>
          </div>
          <nav aria-label="Navegación principal" className="flex flex-col gap-1 px-3 pt-2">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                    active
                      ? 'bg-[#1b6870] font-medium text-white shadow-sm'
                      : 'text-[#92a5bc] hover:bg-[#2b3b50] hover:text-white'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-5 w-5" name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#2b3b50] p-5">
          <a className="flex items-center gap-2 text-xs text-[#92a5bc] hover:text-white" href="#help">
            <Icon className="h-[18px] w-[18px]" name="help" />
            Centro de ayuda
          </a>
          <span className="text-[11px] text-[#92a5bc]/70">v2.4 — Sistema Interno</span>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-[#132537] px-4 shadow-sm sm:px-6 lg:left-[260px]">
          <div className="flex min-w-0 flex-col">
            <span className="hidden truncate text-[11px] font-semibold uppercase tracking-wider text-[#92a5bc] sm:block">
              Campus Central — Módulo de Incidencias
            </span>
            <span className="truncate text-base font-semibold text-white sm:text-lg">
              Portal de Reportes de Usuario
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 border-l border-[#2b3b50] pl-3 sm:gap-4 sm:pl-5">
            <div className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-white">{reportanteName}</span>
              <span className="block text-[11px] text-[#92a5bc]">Reportante</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#293b4e] text-white">
              <Icon className="h-[18px] w-[18px]" name="person" />
            </div>
            <AuthLogoutButton variant="icon" />
          </div>
        </header>

        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 top-16 z-30 flex gap-1 overflow-x-auto bg-[#293b4e] px-3 py-2 lg:hidden"
        >
          {navigation.map((item) => (
            <Link
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                pathname === item.href
                  ? 'bg-[#1b6870] text-white'
                  : 'text-[#d3e4fe] hover:bg-[#2b3b50]'
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-h-screen bg-[#f9f9ff] pt-28 lg:pt-16">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:px-8">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="flex flex-col gap-1">
                <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-[#43474c]">
                  <Link className="flex items-center gap-1 hover:text-[#132537]" href="/reportante">
                    <Icon className="h-[15px] w-[15px]" name="home" />
                    Panel principal
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page" className="font-semibold text-[#132537]">Mis incidencias</span>
                </nav>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#132537] sm:text-[30px]">
                  Mis incidencias
                </h1>
                <p className="text-sm text-[#43474c]">
                  Consulta y da seguimiento a los reportes que has registrado en el campus.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#15575e]"
                href="/reportante/registrar"
              >
                <Icon className="h-5 w-5" name="add" />
                Nueva incidencia
              </Link>
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

            <section aria-label="Resumen de incidencias" className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Reportes activos',
                  value: activeCount,
                  icon: 'pending',
                  background: 'bg-[#a9eef7]',
                  foreground: 'text-[#004f56]',
                },
                {
                  label: 'Resueltas recientemente',
                  value: resolvedCount,
                  icon: 'check',
                  background: 'bg-[#e7eeff]',
                  foreground: 'text-[#1b6870]',
                },
                {
                  label: 'Total registradas',
                  value: incidencias.length,
                  icon: 'receipt',
                  background: 'bg-[#dee8ff]',
                  foreground: 'text-[#293b4e]',
                },
              ].map((metric) => (
                <article
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                  key={metric.label}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">
                      {metric.label}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold text-[#132537]">
                      {isLoading ? '—' : metric.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.background} ${metric.foreground}`}>
                    <Icon className="h-[22px] w-[22px]" name={metric.icon} />
                  </div>
                </article>
              ))}
            </section>

            <section className="flex flex-col items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center">
              <label className="relative w-full max-w-lg">
                <span className="sr-only">Buscar por código o título</span>
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74777d]" name="search" />
                <input
                  className="w-full rounded-lg bg-[#f0f3ff] py-2 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por código o título..."
                  type="search"
                  value={search}
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
                <div aria-label="Filtrar por estado" className="inline-flex flex-wrap gap-1 rounded-lg bg-[#f0f3ff] p-1" role="group">
                  {filters.map((item) => (
                    <button
                      aria-pressed={filter === item.id}
                      className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                        filter === item.id
                          ? 'bg-white text-[#132537] shadow-sm'
                          : 'text-[#43474c] hover:text-[#132537]'
                      }`}
                      key={item.id}
                      onClick={() => {
                        setFilter(item.id);
                        setPage(1);
                      }}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="rounded-full bg-[#f0f3ff] px-3 py-1 text-[11px] text-[#43474c]" aria-live="polite">
                  {filteredIncidents.length} {filteredIncidents.length === 1 ? 'reporte' : 'reportes'}
                </span>
              </div>
            </section>

            <section className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="bg-[#f0f3ff]/70">
                      <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#43474c]" scope="col">Código</th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#43474c]" scope="col">Incidencia</th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#43474c]" scope="col">Fecha de registro</th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[#43474c]" scope="col">Estado</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[#43474c]" scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {isLoading ? (
                      <tr>
                        <td className="px-4 py-12 text-center text-sm text-[#43474c]" colSpan={5} role="status">
                          Cargando tus incidencias...
                        </td>
                      </tr>
                    ) : visibleIncidents.map((incidencia) => (
                      <tr className="transition-colors hover:bg-[#f0f3ff]/40" key={incidencia._id}>
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          <span className="inline-flex rounded bg-[#e7eeff] px-2 py-0.5 text-[11px] font-medium tracking-wide text-[#132537]">
                            {incidencia.codigo || incidencia._id}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex min-w-0 max-w-md flex-col">
                            <span className="truncate text-sm font-medium text-[#132537]">{incidencia.titulo}</span>
                            <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#43474c]">
                              <Icon className="h-3.5 w-3.5 shrink-0" name="location" />
                              {formatLocation(incidencia)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#43474c]">
                          <span className="flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-[#74777d]" name="schedule" />
                            {formatDate(incidencia.fecha_creacion)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${statusStyle(incidencia.estado)}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabels[incidencia.estado]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <Link
                            className="group inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1b6870] transition-colors hover:bg-[#a9eef7]/40"
                            href={`/reportante/incidencias/${encodeURIComponent(incidencia._id)}`}
                          >
                            Ver detalle
                            <Icon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" name="forward" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && !loadError && visibleIncidents.length === 0 && (
                      <tr>
                        <td className="px-4 py-12 text-center" colSpan={5}>
                          <div className="mx-auto flex max-w-md flex-col items-center">
                            <Icon className="mb-2 h-11 w-11 text-[#74777d]" name="search" />
                            <p className="font-semibold text-[#132537]">No se encontraron reportes</p>
                            <p className="mt-1 text-xs text-[#43474c]">
                              Intenta ajustar la búsqueda o seleccionar otro filtro de estado.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-center justify-between gap-3 bg-[#f0f3ff]/40 px-4 py-3 sm:flex-row">
                <span className="text-[11px] text-[#43474c]" aria-live="polite">
                  {isLoading
                    ? 'Cargando reportes...'
                    : `Mostrando ${firstItem} - ${lastItem} de ${filteredIncidents.length} reportes`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded px-2.5 py-1 text-xs text-[#43474c] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    type="button"
                  >
                    Anterior
                  </button>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded bg-[#1b6870] px-2 text-xs font-semibold text-white">
                    {currentPage}
                  </span>
                  <button
                    className="rounded px-2.5 py-1 text-xs text-[#43474c] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={currentPage >= pageCount || isLoading}
                    onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                    type="button"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </section>

            <aside className="flex items-start gap-3 rounded-xl bg-[#f0f3ff] p-4 text-[#43474c]" id="help">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1b6870]" name="info" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-[#132537]">¿Necesitas actualización de tu reporte?</span>
                <span>
                  Las cuadrillas técnicas atienden incidencias de lunes a viernes de 07:00 a 20:00 hrs.
                  Puedes acceder al detalle de cada reporte para visualizar el registro de avance.
                </span>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
