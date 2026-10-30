'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, USE_MOCKS, endpoints } from '@/config/endpoints';
import { getRoleHomePath, AUTH_TOKEN_STORAGE_KEY } from '@/lib/authSession';
import { ApiError } from '@/lib/httpClient';
import { reportanteApiService } from '@/services/reportanteApiService';
import type { EstadoIncidencia, Incidencia } from '@/types/incidencia';

const navigation = [
  { href: '/reportante', label: 'Panel principal', icon: 'dashboard' },
  { href: '/reportante/registrar', label: 'Nueva incidencia', icon: 'add' },
  { href: '/reportante/incidencias', label: 'Mis incidencias', icon: 'receipt' },
];

const demoIncident: Incidencia = {
  _id: 'demo-0113',
  codigo: 'INC-2026-0113',
  titulo: 'Switch sin conectividad en laboratorio',
  descripcion:
    'El switch principal del rack en Laboratorio de Cómputo 3 no responde. Se intentó reiniciar físicamente pero los puertos 1 al 24 continúan apagados, dejando sin conexión cableada a las estaciones de trabajo de la práctica de redes.',
  categoria: 'computo_redes',
  prioridad: 'alta',
  estado: 'en_proceso',
  reportante: {
    usuario_id: 'demo',
    nombre: 'Reportante',
    tipo: 'docente',
  },
  tecnico_asignado: {
    usuario_id: 'tecnico-demo',
    nombre: 'Ing. Marco Valenzuela Cruz',
    correo: 'marco.valenzuela@utm.mx',
  },
  ubicacion: {
    edificio: 'Edificio B',
    piso: 'Planta Alta',
    aula: 'Laboratorio de Cómputo 3',
    referencia: 'Rack de telecomunicaciones',
  },
  detalle_especifico: { subsistema: 'switch' },
  tags: ['redes', 'switch'],
  evidencias_adjuntas: [
    {
      nombre_archivo: 'evidencia_foto_switch.png',
      tipo_mime: 'image/png',
      peso_kb: 1229,
      url_storage: '#',
      fecha_carga: '2026-02-12T10:45:00',
    },
    {
      nombre_archivo: 'diagnostico_ping_error.log',
      tipo_mime: 'text/plain',
      peso_kb: 14,
      url_storage: '#',
      fecha_carga: '2026-02-12T10:46:00',
    },
  ],
  historial_seguimiento: [
    {
      fecha: '2026-02-12T11:30:00',
      autor: 'Ing. Marco Valenzuela (Técnico Redes)',
      accion: 'comentario',
      estado_nuevo: 'en_proceso',
      comentario:
        'Se acudió al Edificio B. Se comprobó fallo en módulo de alimentación del switch de 24 puertos. Se solicitó reemplazo a almacén de TI.',
    },
    {
      fecha: '2026-02-12T10:55:00',
      autor: 'Coordinación de Soporte Campus Central',
      accion: 'asignacion',
      comentario:
        'Asignado a Ing. Marco Valenzuela tras validar disponibilidad técnica.',
    },
    {
      fecha: '2026-02-12T10:42:00',
      autor: 'Portal Web',
      accion: 'creacion',
      estado_nuevo: 'abierta',
      comentario:
        'Reporte generado a través del Portal Web. Notificación enviada a la cuadrilla de guardia de Infraestructura.',
    },
  ],
  fecha_creacion: '2026-02-12T10:42:00',
};

const stateLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En atención',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};

const categoryLabels = {
  computo_redes: 'Cómputo y redes',
  infraestructura: 'Infraestructura',
  academico: 'Académico',
} as const;

const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
} as const;

const MAX_COMMENT_FILE_SIZE = 15 * 1024 * 1024;
const COMMENT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];

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
    back: <path d="m15 18-6-6 6-6M9 12h12" />,
    schedule: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    language: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18" />
      </>
    ),
    addComment: (
      <>
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4H12" />
        <path d="M19 3v6m-3-3h6" />
      </>
    ),
    assignment: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M9 5V3h6v2m-7 6h8m-8 4h8" />
      </>
    ),
    category: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    priority: <path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5m4-1v5l3 2" />
      </>
    ),
    build: (
      <path d="M14.7 6.3a5 5 0 0 0-6.6 6.6L3 18l3 3 5.1-5.1a5 5 0 0 0 6.6-6.6L15 12l-3-3 2.7-2.7Z" />
    ),
    comment: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        <path d="M8 12h8m-8-3h5m-5 6h6" />
      </>
    ),
    clip: (
      <path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8m-8 4h8" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    support: (
      <>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 13h3v6H6a2 2 0 0 1-2-2v-4Zm16 0h-3v6h1a2 2 0 0 0 2-2v-4Z" />
      </>
    ),
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />
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
      {paths[name] ?? paths.info}
    </svg>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}

function statusStyle(status: EstadoIncidencia) {
  if (status === 'en_proceso' || status === 'pendiente') {
    return 'bg-[#a6ebf4]/40 text-[#216c74]';
  }
  if (status === 'resuelta' || status === 'cerrada') {
    return 'bg-[#a9eef7]/40 text-[#1b6870]';
  }
  return 'bg-[#d8e3fb] text-[#293b4e]';
}

function timelineTitle(action: string) {
  const titles: Record<string, string> = {
    creacion: 'Registro de incidencia confirmado',
    asignacion: 'Asignación de técnico especializado',
    reasignacion: 'Reasignación de técnico',
    comentario: 'Actualización de seguimiento',
    resolucion: 'Incidencia resuelta',
    cierre: 'Incidencia cerrada',
    reapertura: 'Incidencia reabierta',
    cambio_prioridad: 'Prioridad actualizada',
    cambio_tags: 'Etiquetas actualizadas',
  };
  return titles[action] ?? 'Actualización de incidencia';
}

function getFileKind(mime: string) {
  if (mime.startsWith('image/')) return 'Imagen';
  if (mime === 'application/pdf') return 'Documento PDF';
  if (mime.includes('text') || mime.includes('log')) return 'Archivo de texto';
  return 'Archivo adjunto';
}

export default function ReportanteIncidenciaDetalleClient() {
  const params = useParams<{ id: string }>();
  const incidentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadIncident = useCallback(async (signal?: AbortSignal) => {
    if (!incidentId || !usuario) return;
    try {
      const loaded = USE_MOCKS
        ? incidentId === demoIncident._id ||
          incidentId === demoIncident.codigo
          ? demoIncident
          : null
        : await reportanteApiService.obtenerIncidencia(incidentId, signal);
      if (signal?.aborted) return;
      if (!loaded || (loaded.reportante.usuario_id !== usuario.id && usuario.rol !== 'administrador_sistema')) {
        setIncidencia(null);
        setLoadError(
          loaded
            ? 'No tienes permiso para consultar esta incidencia.'
            : `No se encontró la incidencia "${incidentId}".`,
        );
        return;
      }
      setIncidencia(loaded);
      setLoadError(null);
    } catch (error) {
      if (signal?.aborted) return;
      setIncidencia(null);
      setLoadError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'No se pudo cargar el detalle de la incidencia.',
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [incidentId, usuario]);

  useEffect(() => {
    if (cargando || !usuario) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadIncident(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cargando, loadIncident, usuario]);

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

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = comment.trim();
    if (!incidencia || !text || isSubmittingComment) return;
    setCommentError(null);
    setCommentSuccess(null);
    if (USE_MOCKS) {
      setCommentError('El envío de comentarios no está disponible en modo de datos simulados.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await reportanteApiService.agregarComentario(incidencia._id, text);
      setComment('');
      setCommentSuccess('Tu comentario se guardó correctamente.');
      await loadIncident();
    } catch (error) {
      setCommentError(
        error instanceof Error ? error.message : 'No se pudo guardar el comentario.',
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function uploadCommentEvidence() {
    if (!incidencia || !commentFile || isUploadingEvidence) return;
    setCommentError(null);
    setCommentSuccess(null);
    if (!COMMENT_FILE_TYPES.includes(commentFile.type)) {
      setCommentError('Formato no permitido. Usa JPG, PNG, WEBP, PDF o TXT.');
      return;
    }
    if (commentFile.size > MAX_COMMENT_FILE_SIZE) {
      setCommentError('El archivo supera el límite de 15 MB.');
      return;
    }
    if (USE_MOCKS) {
      setCommentError('La carga de archivos no está disponible en modo de datos simulados.');
      return;
    }
    setIsUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append('archivo', commentFile);
      const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const response = await fetch(
        `${API_BASE_URL}${endpoints.incidencias.evidencias(incidencia._id)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body &&
          typeof body === 'object' &&
          'message' in body &&
          typeof body.message === 'string'
            ? body.message
            : `Error ${response.status} al subir el archivo.`;
        throw new Error(message);
      }
      setCommentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setCommentSuccess('El archivo se subió correctamente.');
      await loadIncident();
    } catch (error) {
      setCommentError(
        error instanceof Error ? error.message : 'No se pudo subir el archivo.',
      );
    } finally {
      setIsUploadingEvidence(false);
    }
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
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#2b3b50] p-5">
          <a className="flex items-center gap-2 text-xs text-[#92a5bc] hover:text-white" href="#support">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b6870] text-white">
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
                pathname === item.href ? 'bg-[#1b6870] text-white' : 'text-[#d3e4fe] hover:bg-[#2b3b50]'
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
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-[#43474c]">
                <Link className="flex items-center gap-1 hover:text-[#1b6870]" href="/reportante">
                  <Icon className="h-4 w-4" name="home" />
                  Panel principal
                </Link>
                <span aria-hidden="true">/</span>
                <Link className="hover:text-[#1b6870]" href="/reportante/incidencias">Mis incidencias</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="font-semibold text-[#132537]">
                  {incidencia?.codigo ?? 'Detalle'}
                </span>
              </nav>
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-medium text-[#43474c] shadow-sm transition hover:bg-[#e7eeff] hover:text-[#132537]"
                href="/reportante/incidencias"
              >
                <Icon className="h-[18px] w-[18px]" name="back" />
                Volver a mis incidencias
              </Link>
            </div>

            {isLoading ? (
              <div className="rounded-xl bg-white p-10 text-center text-sm text-[#43474c]" role="status">
                Cargando detalle de la incidencia...
              </div>
            ) : loadError || !incidencia ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800" role="alert">
                {loadError ?? 'No se encontró esta incidencia.'}
                <div className="mt-4">
                  <Link className="font-semibold underline" href="/reportante/incidencias">
                    Volver a mis incidencias
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <section className="flex flex-col justify-between gap-5 rounded-xl bg-white p-5 shadow-sm sm:p-6 md:flex-row md:items-center">
                  <div className="flex max-w-3xl flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#d8e3fb] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#132537]">
                        {incidencia.codigo || incidencia._id}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(incidencia.estado)}`}>
                        <span className={`h-2 w-2 rounded-full bg-current ${incidencia.estado === 'en_proceso' ? 'animate-pulse' : ''}`} />
                        {stateLabels[incidencia.estado]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#43474c]/80">
                        <Icon className="h-3.5 w-3.5" name="schedule" />
                        Registrado {formatDate(incidencia.fecha_creacion)} ({formatRelativeDate(incidencia.fecha_creacion)})
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#43474c]/80">
                        <Icon className="h-3.5 w-3.5" name="language" />
                        Canal: Portal Web
                      </span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-[#132537] sm:text-2xl">
                      {incidencia.titulo}
                    </h1>
                    <p className="text-sm text-[#43474c]">
                      Consulta el seguimiento y las actualizaciones de tu reporte.
                    </p>
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#15575e]"
                    onClick={() => document.getElementById('additional-info-form')?.scrollIntoView({ behavior: 'smooth' })}
                    type="button"
                  >
                    <Icon className="h-[18px] w-[18px]" name="addComment" />
                    Agregar información
                  </button>
                </section>

                <div className="grid items-start gap-5 lg:grid-cols-12">
                  <div className="flex flex-col gap-5 lg:col-span-8">
                    <section className="flex flex-col gap-5 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between gap-3 border-b border-[#d8e3fb]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#1b6870]">
                            <Icon className="h-5 w-5" name="assignment" />
                          </span>
                          <h2 className="text-base font-semibold text-[#132537]">Detalles del reporte</h2>
                        </div>
                        <span className="rounded bg-[#f0f3ff] px-2 py-1 text-[11px] text-[#43474c]">
                          {incidencia.reportante.tipo}
                        </span>
                      </div>
                      <div>
                        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">
                          Descripción del problema
                        </h3>
                        <p className="whitespace-pre-wrap rounded-lg bg-[#f0f3ff] p-4 text-sm leading-relaxed text-[#111c2d]">
                          {incidencia.descripcion || 'No se proporcionó una descripción.'}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <article className="flex items-start gap-3 rounded-lg bg-[#f0f3ff]/70 p-4">
                          <Icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-[#1b6870]" name="category" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">Categoría</p>
                            <p className="mt-1 text-sm font-medium text-[#132537]">{categoryLabels[incidencia.categoria]}</p>
                            <p className="mt-0.5 text-xs text-[#43474c]">
                              {typeof incidencia.detalle_especifico?.subsistema === 'string'
                                ? incidencia.detalle_especifico.subsistema
                                : 'Área de atención correspondiente'}
                            </p>
                          </div>
                        </article>
                        <article className="flex items-start gap-3 rounded-lg bg-[#f0f3ff]/70 p-4">
                          <Icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-[#1b6870]" name="location" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">Ubicación exacta</p>
                            <p className="mt-1 text-sm font-medium text-[#132537]">{incidencia.ubicacion.edificio}</p>
                            <p className="mt-0.5 text-xs text-[#43474c]">
                              {[incidencia.ubicacion.piso, incidencia.ubicacion.aula, incidencia.ubicacion.referencia]
                                .filter(Boolean)
                                .join(' / ') || 'Sin más referencias'}
                            </p>
                          </div>
                        </article>
                        <article className="flex items-start gap-3 rounded-lg bg-[#f0f3ff]/70 p-4">
                          <Icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-[#1b6870]" name="priority" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">Prioridad asignada</p>
                            <span className="mt-1 inline-flex rounded bg-[#a9eef7]/50 px-2 py-0.5 text-xs font-semibold text-[#004f56]">
                              {priorityLabels[incidencia.prioridad]}
                            </span>
                            <p className="mt-1 text-[11px] text-[#43474c]/80">Evaluada por Coordinación de Soporte</p>
                          </div>
                        </article>
                        <article className="flex items-start gap-3 rounded-lg bg-[#f0f3ff]/70 p-4">
                          <Icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-[#1b6870]" name="person" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#43474c]">Solicitante registrado</p>
                            <p className="mt-1 text-sm font-medium text-[#132537]">{incidencia.reportante.nombre}</p>
                            <p className="mt-0.5 text-xs text-[#43474c]">ID institucional: {incidencia.reportante.usuario_id}</p>
                          </div>
                        </article>
                      </div>
                    </section>

                    <section className="flex flex-col gap-5 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between gap-3 border-b border-[#d8e3fb]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#1b6870]">
                            <Icon className="h-5 w-5" name="history" />
                          </span>
                          <h2 className="text-base font-semibold text-[#132537]">Seguimiento de atención</h2>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] text-[#43474c]">
                          <span className="h-2 w-2 rounded-full bg-[#1b6870]" />
                          {incidencia.historial_seguimiento.length} eventos registrados
                        </span>
                      </div>
                      {incidencia.historial_seguimiento.length > 0 ? (
                        <ol className="relative flex flex-col gap-5 pl-7 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-0.5 before:bg-[#d8e3fb]">
                          {incidencia.historial_seguimiento.map((event, index) => (
                            <li className="relative" key={`${event.fecha}-${event.accion}-${index}`}>
                              <span className={`absolute -left-7 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                                index === 0 ? 'bg-[#1b6870] text-white' : 'bg-[#d8e3fb] text-[#293b4e]'
                              }`}>
                                <Icon className="h-3 w-3" name={event.accion === 'creacion' ? 'assignment' : event.accion === 'asignacion' ? 'person' : 'build'} />
                              </span>
                              <article className={`flex flex-col gap-2 rounded-xl p-4 ${
                                index === 0 ? 'bg-[#f0f3ff]/70' : 'bg-[#f0f3ff]/40'
                              }`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[#132537]">{timelineTitle(event.accion)}</h3>
                                    {event.estado_nuevo && (
                                      <span className="rounded-full bg-[#d8e3fb] px-2 py-0.5 text-[10px] text-[#43474c]">
                                        {stateLabels[event.estado_nuevo as EstadoIncidencia] ?? event.estado_nuevo}
                                      </span>
                                    )}
                                  </div>
                                  <time className="text-[11px] text-[#43474c]">{formatDate(event.fecha)}</time>
                                </div>
                                <p className="flex items-center gap-2 text-xs font-medium text-[#1b6870]">
                                  <Icon className="h-4 w-4" name="person" />
                                  {event.autor}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111c2d]">{event.comentario}</p>
                              </article>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="rounded-lg bg-[#f0f3ff] p-4 text-sm text-[#43474c]">
                          Aún no hay actualizaciones de seguimiento para esta incidencia.
                        </p>
                      )}
                    </section>

                    <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6" id="additional-info-form">
                      <div className="flex items-center gap-3 border-b border-[#d8e3fb]/60 pb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#1b6870]">
                          <Icon className="h-5 w-5" name="comment" />
                        </span>
                        <div>
                          <h2 className="text-base font-semibold text-[#132537]">Aportar información o aclaración adicional</h2>
                          <p className="text-xs text-[#43474c]">Envía un comentario directo al técnico a cargo.</p>
                        </div>
                      </div>
                      <form className="flex flex-col gap-4" onSubmit={submitComment}>
                        <label className="flex flex-col gap-2 text-sm font-medium text-[#132537]" htmlFor="report-comment">
                          Comentarios y observaciones del reportante
                          <textarea
                            className="min-h-24 resize-y rounded-lg border border-[#c4c6cd]/60 bg-white p-3 text-sm font-normal text-[#111c2d] outline-none transition focus:border-[#1b6870] focus:ring-1 focus:ring-[#1b6870]"
                            id="report-comment"
                            onChange={(event) => {
                              setComment(event.target.value);
                              setCommentSuccess(null);
                            }}
                            placeholder="Escribe aquí detalles adicionales u observaciones..."
                            rows={3}
                            value={comment}
                          />
                        </label>
                        <div>
                          <label className="mb-2 block text-xs font-medium text-[#43474c]" htmlFor="comment-file">
                            Adjuntar archivo complementario
                          </label>
                          <input
                            accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
                            className="block w-full cursor-pointer rounded-lg border border-dashed border-[#c4c6cd] bg-[#f0f3ff]/50 p-3 text-xs text-[#43474c] file:mr-3 file:rounded-md file:border-0 file:bg-[#1b6870] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
                            id="comment-file"
                            onChange={(event) => setCommentFile(event.target.files?.[0] ?? null)}
                            ref={fileInputRef}
                            type="file"
                          />
                          <p className="mt-1 text-[11px] text-[#43474c]">JPG, PNG, PDF o TXT (máx. 15 MB)</p>
                          {commentFile && (
                            <button
                              className="mt-2 text-xs font-semibold text-[#1b6870] underline"
                              onClick={() => void uploadCommentEvidence()}
                              disabled={isUploadingEvidence}
                              type="button"
                            >
                              {isUploadingEvidence ? 'Subiendo archivo...' : `Subir ${commentFile.name}`}
                            </button>
                          )}
                        </div>
                        {commentError && (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="alert">
                            {commentError}
                          </p>
                        )}
                        {commentSuccess && (
                          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900" role="status">
                            {commentSuccess}
                          </p>
                        )}
                        <div className="flex flex-col justify-between gap-3 border-t border-[#d8e3fb]/60 pt-3 sm:flex-row sm:items-center">
                          <p className="flex items-start gap-2 text-[11px] text-[#43474c]">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1b6870]" name="info" />
                            No puedes modificar la prioridad ni el estado administrativo del ticket.
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-lg bg-[#f0f3ff] px-4 py-2 text-xs font-medium text-[#43474c] hover:text-[#132537]"
                              onClick={() => {
                                setComment('');
                                setCommentError(null);
                                setCommentSuccess(null);
                              }}
                              type="reset"
                            >
                              Cancelar
                            </button>
                            <button
                              className="inline-flex items-center gap-2 rounded-lg bg-[#1b6870] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#15575e]"
                              disabled={!comment.trim() || isSubmittingComment}
                              type="submit"
                            >
                              <Icon className="h-4 w-4" name="send" />
                              {isSubmittingComment ? 'Guardando...' : 'Guardar información'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </section>
                  </div>

                  <aside className="flex flex-col gap-5 lg:col-span-4" id="support">
                    <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3 border-b border-[#d8e3fb]/60 pb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#1b6870]">
                          <Icon className="h-5 w-5" name="build" />
                        </span>
                        <h2 className="text-base font-semibold text-[#132537]">Personal técnico a cargo</h2>
                      </div>
                      {incidencia.tecnico_asignado?.nombre ? (
                        <>
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#293b4e] text-base font-bold text-white">
                              {incidencia.tecnico_asignado.nombre
                                .split(' ')
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#132537]">{incidencia.tecnico_asignado.nombre}</h3>
                              <p className="mt-0.5 text-xs text-[#43474c]">Técnico de soporte</p>
                              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#1b6870]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1b6870]" />
                                Campus Central - UTM
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-[#c4c6cd]/40 bg-[#f0f3ff]/50 p-3 text-xs text-[#43474c]">
                            <Icon className="h-[18px] w-[18px] shrink-0 text-[#1b6870]" name="support" />
                            Para consultas directas en horario hábil universitario.
                          </div>
                        </>
                      ) : (
                        <p className="rounded-lg bg-[#f0f3ff] p-3 text-xs text-[#43474c]">
                          Aún no se ha asignado personal técnico a esta incidencia.
                        </p>
                      )}
                    </section>

                    <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between gap-2 border-b border-[#d8e3fb]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#1b6870]">
                            <Icon className="h-5 w-5" name="clip" />
                          </span>
                          <h2 className="text-base font-semibold text-[#132537]">Evidencias y adjuntos</h2>
                        </div>
                        <span className="rounded bg-[#f0f3ff] px-2 py-1 text-[11px] font-semibold text-[#43474c]">
                          {incidencia.evidencias_adjuntas?.length ?? 0} archivos
                        </span>
                      </div>
                      {incidencia.evidencias_adjuntas && incidencia.evidencias_adjuntas.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {incidencia.evidencias_adjuntas.map((evidence, index) => (
                            <li className="flex items-center justify-between gap-2 rounded-lg bg-[#f0f3ff]/70 p-3" key={`${evidence.nombre_archivo}-${index}`}>
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#d8e3fb] text-[#1b6870]">
                                  <Icon className="h-[22px] w-[22px]" name={evidence.tipo_mime.startsWith('image/') ? 'image' : 'file'} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-[#132537]" title={evidence.nombre_archivo}>
                                    {evidence.nombre_archivo}
                                  </p>
                                  <p className="text-[11px] text-[#43474c]">
                                    {evidence.peso_kb >= 1024
                                      ? `${(evidence.peso_kb / 1024).toFixed(1)} MB`
                                      : `${evidence.peso_kb} KB`} · {getFileKind(evidence.tipo_mime)}
                                  </p>
                                </div>
                              </div>
                              {evidence.url_storage !== '#' && (
                                <div className="flex shrink-0 items-center gap-1">
                                  <a
                                    aria-label={`Descargar ${evidence.nombre_archivo}`}
                                    className="rounded p-1.5 text-[#43474c] hover:bg-[#e7eeff] hover:text-[#1b6870]"
                                    download={evidence.nombre_archivo}
                                    href={evidence.url_storage}
                                    rel="noreferrer"
                                    target="_blank"
                                    title="Descargar archivo"
                                  >
                                    <Icon className="h-[18px] w-[18px]" name="download" />
                                  </a>
                                  {evidence.tipo_mime.startsWith('image/') && (
                                    <a
                                      aria-label={`Ver ${evidence.nombre_archivo}`}
                                      className="rounded p-1.5 text-[#43474c] hover:bg-[#e7eeff] hover:text-[#1b6870]"
                                      href={evidence.url_storage}
                                      rel="noreferrer"
                                      target="_blank"
                                      title="Ver archivo"
                                    >
                                      <Icon className="h-[18px] w-[18px]" name="eye" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded-lg bg-[#f0f3ff] p-3 text-xs text-[#43474c]">
                          Esta incidencia no tiene evidencias adjuntas.
                        </p>
                      )}
                      <p className="flex items-center gap-1.5 text-[11px] text-[#43474c]">
                        <Icon className="h-[15px] w-[15px] text-[#1b6870]" name="info" />
                        Las evidencias son visibles para el equipo técnico.
                      </p>
                    </section>

                    <section className="flex flex-col gap-3 rounded-xl border border-[#d8e3fb]/50 bg-gradient-to-br from-white to-[#f0f3ff] p-5 shadow-sm">
                      <h2 className="flex items-center gap-2 text-sm font-bold text-[#132537]">
                        <Icon className="h-5 w-5 text-[#1b6870]" name="help" />
                        Centro de Soporte Tecnológico
                      </h2>
                      <p className="text-xs leading-relaxed text-[#43474c]">
                        Si la incidencia interrumpe una sesión académica activa o requiere escalamiento prioritario:
                      </p>
                      <div className="flex flex-col gap-2 text-xs">
                        <p className="flex items-center gap-2 font-medium text-[#132537]">
                          <Icon className="h-4 w-4 text-[#1b6870]" name="phone" />
                          Ext. 2401 / 2402 (Mesa de Ayuda)
                        </p>
                        <p className="flex items-center gap-2 text-[#43474c]">
                          <Icon className="h-4 w-4 text-[#1b6870]" name="schedule" />
                          Lunes a Viernes: 07:00 a 21:00 hrs
                        </p>
                        <p className="flex items-center gap-2 text-[#43474c]">
                          <Icon className="h-4 w-4 text-[#1b6870]" name="location" />
                          Edificio Central, Módulo A-102
                        </p>
                      </div>
                    </section>
                  </aside>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
