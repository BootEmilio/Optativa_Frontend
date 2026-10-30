'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import { USE_MOCKS } from '@/config/endpoints';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomePath } from '@/lib/authSession';
import { reportanteApiService } from '@/services/reportanteApiService';
import type { EstadoIncidencia, Incidencia } from '@/types/incidencia';

const navigation = [
  { href: '/reportante', label: 'Panel principal', icon: 'dashboard' },
  { href: '/reportante/registrar', label: 'Nueva incidencia', icon: 'add' },
  { href: '/reportante/incidencias', label: 'Mis incidencias', icon: 'receipt' },
];

const incidents = [
  {
    code: 'INC-2026-0113',
    date: 'Hoy, 10:42 AM',
    title: 'Switch sin conectividad en laboratorio',
    location: 'Edificio B, Laboratorio de Cómputo 3',
    icon: 'router',
    status: 'En atención',
    statusClass: 'bg-[#a9eef7]/50 text-[#004f56]',
    iconClass: 'bg-[#a6ebf4]/50 text-[#1b6870]',
  },
  {
    code: 'INC-2026-0114',
    date: 'Ayer, 03:15 PM',
    title: 'Contacto eléctrico con chispas',
    location: 'Aula Magna 2 - Planta Alta',
    icon: 'bolt',
    status: 'Abierta',
    statusClass: 'bg-[#d8e3fb] text-[#43474c]',
    iconClass: 'bg-[#dee8ff] text-[#43474c]',
  },
  {
    code: 'INC-2026-0115',
    date: '11 Feb 2026',
    title: 'Plataforma escolar no permite iniciar sesión',
    location: 'Servicios Digitales / Campus Virtual',
    icon: 'cloud',
    status: 'Resuelta',
    statusClass: 'bg-[#a9eef7]/40 text-[#004f56]',
    iconClass: 'bg-[#e7eeff] text-[#293b4e]',
  },
];

function statusLabel(status: EstadoIncidencia) {
  const labels: Record<EstadoIncidencia, string> = {
    abierta: 'Abierta',
    en_proceso: 'En atención',
    pendiente: 'Pendiente',
    resuelta: 'Resuelta',
    cerrada: 'Cerrada',
    reabierta: 'Reabierta',
  };
  return labels[status];
}

function formatIncidentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
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
    add: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
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
    router: (
      <>
        <rect x="3" y="11" width="18" height="9" rx="2" />
        <path d="M7 15h.01M11 15h.01M15 15h.01M8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0" />
      </>
    ),
    bolt: <path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z" />,
    cloud: (
      <path d="M7 18a5 5 0 0 1-.7-9.95A7 7 0 0 1 20 10a4 4 0 0 1-1 8H7Z" />
    ),
    wifi: <path d="M5 9a11 11 0 0 1 14 0M8 12a6.5 6.5 0 0 1 8 0m-5 4a2 2 0 0 1 2 0m-1 4h.01" />,
    computer: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    school: (
      <>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v5c3 2 7 2 10 0v-5m5-2v7" />
      </>
    ),
    support: (
      <>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4Zm16 0h-3v6h1a2 2 0 0 0 2-2v-4Zm-8 8h3" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    forward: <path d="M4 12h15m-6-6 6 6-6 6" />,
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
      {paths[name] ?? paths.help}
    </svg>
  );
}

export default function ReportantePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [apiIncidencias, setApiIncidencias] = useState<Incidencia[] | null>(
    USE_MOCKS ? null : [],
  );
  const [isLoadingIncidencias, setIsLoadingIncidencias] = useState(!USE_MOCKS);
  const [incidenciasError, setIncidenciasError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!usuario || USE_MOCKS) return;
    const controller = new AbortController();
    void reportanteApiService
      .listarIncidencias(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setApiIncidencias(
          usuario.rol === 'administrador_sistema'
            ? loaded
            : loaded.filter(
                (incidencia) => incidencia.reportante.usuario_id === usuario.id,
              ),
        );
        setIncidenciasError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setIncidenciasError(
          error instanceof Error ? error.message : 'No se pudieron cargar tus reportes.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingIncidencias(false);
      });
    return () => controller.abort();
  }, [usuario]);

  if (
    cargando ||
    !usuario ||
    (usuario.rol !== 'reportante' && usuario.rol !== 'administrador_sistema')
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
        <p className="text-sm text-[#43474c]" role="status">
          Verificando sesión...
        </p>
      </main>
    );
  }

  const reportanteName = usuario.nombre || 'Reportante';
  const dashboardIncidents =
    apiIncidencias === null
      ? incidents.map((incident) => ({ ...incident, id: incident.code }))
      : [...apiIncidencias]
          .sort(
            (left, right) =>
              new Date(right.fecha_creacion).getTime() -
              new Date(left.fecha_creacion).getTime(),
          )
          .slice(0, 3)
          .map((incident) => {
            const active =
              incident.estado === 'en_proceso' || incident.estado === 'pendiente';
            const resolved =
              incident.estado === 'resuelta' || incident.estado === 'cerrada';
            const location = [
              incident.ubicacion.edificio,
              incident.ubicacion.aula,
            ]
              .filter(Boolean)
              .join(', ');
            return {
              id: incident._id,
              code: incident.codigo || incident._id,
              date: formatIncidentDate(incident.fecha_creacion),
              title: incident.titulo,
              location: location || 'Ubicación no especificada',
              icon:
                incident.categoria === 'infraestructura'
                  ? 'bolt'
                  : incident.categoria === 'academico'
                    ? 'school'
                    : 'router',
              status: statusLabel(incident.estado),
              statusClass: resolved
                ? 'bg-[#a9eef7]/40 text-[#004f56]'
                : active
                  ? 'bg-[#a9eef7]/50 text-[#004f56]'
                  : 'bg-[#d8e3fb] text-[#43474c]',
              iconClass:
                incident.categoria === 'infraestructura'
                  ? 'bg-[#dee8ff] text-[#43474c]'
                  : 'bg-[#a6ebf4]/50 text-[#1b6870]',
            };
          });
  const totalReports = apiIncidencias?.length ?? 3;
  const activeReports =
    apiIncidencias?.filter(
      (incident) =>
        incident.estado === 'en_proceso' || incident.estado === 'pendiente',
    ).length ?? 1;
  const resolvedReports =
    apiIncidencias?.filter(
      (incident) =>
        incident.estado === 'resuelta' || incident.estado === 'cerrada',
    ).length ?? 1;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] flex-col justify-between bg-[#293b4e] text-white shadow-sm lg:flex">
        <div>
          <div className="flex h-16 items-center gap-3 border-b border-[#2b3b50] px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1b6870] text-sm font-bold text-white">
              U
            </div>
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
              const active =
                pathname === item.href ||
                (item.href !== '/reportante' && pathname.startsWith(item.href));
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#2b3b50] p-5">
          <a
            className="flex items-center gap-2 text-xs text-[#92a5bc] transition-colors hover:text-white"
            href="#centro-de-ayuda"
          >
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
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-7 sm:px-6 lg:px-8">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111c2d] sm:text-[30px]">
                  Panel principal
                </h1>
                <p className="mt-1 text-sm text-[#43474c]">
                  Consulta el estado de tus reportes y registra nuevas incidencias
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#15575e]"
                href="/reportante/registrar"
              >
                <Icon className="h-5 w-5" name="add" />
                Nueva incidencia
              </Link>
            </section>

            <section aria-label="Resumen de incidencias" className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: 'Total de reportes',
                  value: isLoadingIncidencias ? '—' : String(totalReports),
                  detail: 'Incidencias registradas',
                  icon: 'receipt',
                  color: 'text-[#293b4e]',
                  iconBackground: 'bg-[#e7eeff]',
                },
                {
                  label: 'En atención',
                  value: isLoadingIncidencias ? '—' : String(activeReports),
                  detail: 'En revisión técnica',
                  icon: 'support',
                  color: 'text-[#1b6870]',
                  iconBackground: 'bg-[#a6ebf4]/40',
                },
                {
                  label: 'Resueltos',
                  value: isLoadingIncidencias ? '—' : String(resolvedReports),
                  detail: 'Concluidos este mes',
                  icon: 'school',
                  color: 'text-[#111c2d]',
                  iconBackground: 'bg-[#f0f3ff]',
                },
              ].map((metric) => (
                <article
                  className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm"
                  key={metric.label}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">
                      {metric.label}
                    </p>
                    <p className={`mt-1 text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                    <p className="mt-0.5 text-xs text-[#43474c]/80">{metric.detail}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.iconBackground} text-[#1b6870]`}
                  >
                    <Icon className="h-6 w-6" name={metric.icon} />
                  </div>
                </article>
              ))}
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-12">
              <section className="flex flex-col gap-4 lg:col-span-8" id="mis-reportes">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-semibold text-[#111c2d]">Mis reportes recientes</h2>
                  <Link
                    className="group inline-flex items-center gap-1 text-sm font-medium text-[#1b6870] hover:underline"
                    href="/reportante/incidencias"
                  >
                    <span>Ver todas mis incidencias</span>
                    <Icon
                      className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1"
                      name="forward"
                    />
                  </Link>
                </div>
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                  {incidenciasError && (
                    <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800" role="alert">
                      {incidenciasError}
                    </p>
                  )}
                  {isLoadingIncidencias ? (
                    <p className="px-5 py-10 text-center text-sm text-[#43474c]" role="status">
                      Cargando tus reportes...
                    </p>
                  ) : incidenciasError ? null : dashboardIncidents.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-[#43474c]">
                      Aún no tienes incidencias registradas.
                    </p>
                  ) : dashboardIncidents.map((incident, index) => (
                    <article key={incident.code}>
                      <div className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-[#f0f3ff]/40 sm:flex-row sm:items-center sm:p-6">
                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${incident.iconClass}`}
                          >
                            <Icon className="h-5 w-5" name={incident.icon} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-[#e7eeff] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#43474c]">
                                {incident.code}
                              </span>
                              <span className="text-xs text-[#43474c]/60">•</span>
                              <span className="text-xs text-[#43474c]">{incident.date}</span>
                            </div>
                            <h3 className="mt-1 truncate text-sm font-semibold text-[#111c2d]">
                              {incident.title}
                            </h3>
                            <p className="mt-0.5 truncate text-xs text-[#43474c]">
                              {incident.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${incident.statusClass}`}
                          >
                            {incident.status}
                          </span>
                          <Link
                            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#1b6870] transition-colors hover:bg-[#e7eeff]"
                            href={`/reportante/incidencias/${encodeURIComponent(incident.id)}`}
                          >
                            Ver detalle
                            <Icon className="h-4 w-4" name="chevron" />
                          </Link>
                        </div>
                      </div>
                      {index < dashboardIncidents.length - 1 && (
                        <div aria-hidden="true" className="mx-6 h-px bg-[#e7eeff]" />
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <aside className="flex flex-col gap-4 lg:col-span-4" id="centro-de-ayuda">
                <h2 className="px-1 text-lg font-semibold text-[#111c2d]">Contexto del Campus</h2>
                <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#111c2d]">Servicios del Campus</h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1b6870]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#1b6870]" />
                      Operando
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Red WiFi UTM Alumnos', status: 'Normal', icon: 'wifi' },
                      { label: 'Laboratorios Centrales', status: 'Disponibles', icon: 'computer' },
                      { label: 'Plataforma Académica', status: 'En línea', icon: 'school' },
                    ].map((service) => (
                      <div
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#f0f3ff] p-3"
                        key={service.label}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon className="h-[18px] w-[18px] shrink-0 text-[#43474c]" name={service.icon} />
                          <span className="truncate text-xs text-[#111c2d]">{service.label}</span>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-[#1b6870]">
                          {service.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    aria-label="Ilustración del campus universitario"
                    className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-br from-[#d3e4fe] via-[#e7eeff] to-[#a6ebf4]/60"
                  >
                    <div className="absolute bottom-0 left-0 h-10 w-full bg-[#1b6870]/15" />
                    <div className="absolute bottom-8 left-[12%] h-14 w-[22%] rounded-t bg-white/80 shadow-sm">
                      <div className="grid h-full grid-cols-3 gap-1 p-2">
                        {Array.from({ length: 6 }, (_, index) => (
                          <span className="rounded-sm bg-[#92a5bc]/50" key={index} />
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-8 left-[40%] h-20 w-[36%] rounded-t bg-white shadow-sm">
                      <div className="grid h-full grid-cols-4 gap-1 p-2">
                        {Array.from({ length: 12 }, (_, index) => (
                          <span className="rounded-sm bg-[#a6ebf4]/80" key={index} />
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-8 right-[8%] h-12 w-[14%] rounded-t bg-[#293b4e]/80" />
                    <div className="absolute right-4 top-4 h-6 w-6 rounded-full bg-white/70" />
                  </div>
                </section>

                <section className="flex flex-col gap-3 rounded-xl bg-[#132537] p-5 text-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2b3b50] text-[#a9eef7]">
                      <Icon className="h-5 w-5" name="support" />
                    </span>
                    <h3 className="text-sm font-semibold">¿Necesitas asistencia urgente?</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-[#92a5bc]">
                    Para emergencias de infraestructura o seguridad en campus, contacta a la{' '}
                    <strong className="font-semibold text-white">extensión directa 2401</strong> o acude
                    al Centro de Soporte Tecnológico (Edificio de Rectoría, Planta Baja).
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-medium text-[#a9eef7]">
                      Horario: Lun - Vie 07:00 a 20:00
                    </span>
                    <Icon className="h-[18px] w-[18px] text-[#92a5bc]" name="arrow" />
                  </div>
                </section>
              </aside>
            </div>

            <footer className="pb-2 pt-1 text-center text-[11px] tracking-wide text-[#43474c]/60">
              Universidad Tecnológica de la Mixteca — Datos de demostración para entorno académico UTM
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
