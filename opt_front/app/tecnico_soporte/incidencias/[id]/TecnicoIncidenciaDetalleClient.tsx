'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, USE_MOCKS } from '@/config/endpoints';
import { ApiError } from '@/lib/httpClient';
import { tecnicoApiService } from '@/services/tecnicoApiService';
import type {
  AccionHistorial,
  EstadoIncidencia,
  EvidenciaAdjunta,
  Incidencia,
  PrioridadIncidencia,
} from '@/types/incidencia';

type ModalName = 'intervencion' | 'resolucion' | null;
type Feedback = { kind: 'success' | 'error'; message: string } | null;

const allowedEvidenceTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];
const maxEvidenceSize = 15 * 1024 * 1024;

const statusLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};
const priorityLabels: Record<PrioridadIncidencia, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};
const categoryLabels: Record<Incidencia['categoria'], string> = {
  computo_redes: 'Cómputo y redes',
  infraestructura: 'Infraestructura',
  academico: 'Académico',
};
const actionLabels: Record<AccionHistorial, string> = {
  creacion: 'Registro inicial de reporte',
  asignacion: 'Asignación a cuadrilla técnica',
  reasignacion: 'Reasignación técnica',
  comentario: 'Intervención técnica',
  resolucion: 'Resolución técnica',
  cierre: 'Cierre de incidencia',
  reapertura: 'Reapertura de incidencia',
  cambio_prioridad: 'Cambio de prioridad',
  cambio_tags: 'Actualización de etiquetas',
};

function createDemoIncident(incidentId: string): Incidencia | null {
  const technician = {
    usuario_id: 'demo-technician',
    nombre: 'Ing. Marco Valenzuela Cruz',
    correo: 'marco.valenzuela@utm.mx',
  };
  const incidents: Incidencia[] = [
    {
      _id: 'tec-inc-101',
      codigo: 'INC-2026-0113',
      titulo: 'Switch sin conectividad en laboratorio',
      descripcion:
        'El switch principal del rack en Laboratorio de Cómputo 3 no responde. Se intentó reiniciar físicamente, pero los puertos 1 al 24 continúan apagados, dejando sin conexión cableada a las estaciones de trabajo durante la práctica de redes.',
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
        referencia: 'Rack perimetral norte',
      },
      detalle_especifico: {
        subsistema: 'Hardware de red / Switch rackeable administrable',
        codigo_activo: 'SW-EDIFB-03',
      },
      tags: ['redes', 'switch'],
      evidencias_adjuntas: [
        {
          nombre_archivo: 'evidencia_foto_switch.png',
          tipo_mime: 'image/png',
          peso_kb: 1229,
          url_storage: '',
          fecha_carga: '2026-02-12T10:45:00',
        },
        {
          nombre_archivo: 'diagnostico_ping_error.log',
          tipo_mime: 'text/plain',
          peso_kb: 14,
          url_storage: '',
          fecha_carga: '2026-02-12T10:46:00',
        },
      ],
      historial_seguimiento: [
        {
          fecha: '2026-02-12T11:30:00',
          autor: technician.nombre,
          accion: 'comentario',
          estado_nuevo: 'en_proceso',
          comentario:
            'Se acudió al Edificio B. Se comprobó falla en el módulo de alimentación interna del switch de 24 puertos (PoE sin señal). Se solicitó a almacén de TI una refacción o reemplazo temporal.',
          horas: 0.75,
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
      horas_invertidas: 0.75,
    },
    {
      _id: 'tec-inc-102',
      codigo: 'INC-2026-0114',
      titulo: 'Contacto eléctrico con chispas',
      descripcion:
        'Se reportan chispas en un contacto eléctrico del Aula Magna 2. Se requiere revisión preventiva antes de reanudar su uso.',
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
      historial_seguimiento: [
        {
          fecha: '2026-02-12T11:05:00',
          autor: 'Lic. Claudia Estrada',
          accion: 'creacion',
          estado_nuevo: 'abierta',
          comentario: 'Se observan chispas al conectar equipo audiovisual.',
        },
      ],
      fecha_creacion: '2026-02-12T11:05:00',
    },
    {
      _id: 'tec-inc-103',
      codigo: 'INC-2026-0118',
      titulo: 'Falla de enlace en Access Point de Biblioteca',
      descripcion:
        'El Access Point de la biblioteca presenta caída recurrente de señal y no responde a la configuración.',
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
        piso: 'Planta Baja',
        aula: 'Sala de Lectura',
      },
      tags: ['wifi', 'biblioteca'],
      historial_seguimiento: [
        {
          fecha: '2026-02-12T09:10:00',
          autor: 'Mtro. Fernando Ramos',
          accion: 'creacion',
          estado_nuevo: 'abierta',
          comentario: 'Hay caída recurrente del enlace WiFi en la sala de lectura.',
        },
      ],
      fecha_creacion: '2026-02-12T09:10:00',
    },
    {
      _id: 'tec-inc-105',
      codigo: 'INC-2026-0121',
      titulo: 'Impresora de red sin respuesta en Dirección',
      descripcion:
        'La impresora de red de Dirección dejó de responder a los trabajos de impresión.',
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
      historial_seguimiento: [
        {
          fecha: '2026-02-11T16:30:00',
          autor: technician.nombre,
          accion: 'comentario',
          estado_nuevo: 'en_proceso',
          comentario: 'Se inició el diagnóstico de conectividad de la impresora.',
        },
      ],
      fecha_creacion: '2026-02-11T15:40:00',
    },
  ];

  return incidents.find(
    (incident) => incident._id === incidentId || incident.codigo === incidentId,
  ) ?? null;
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    assignment: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M9 5V3h6v2m-7 6h8m-8 4h8" />
      </>
    ),
    back: <><path d="M19 12H5m7 7-7-7 7-7" /></>,
    priority: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    network: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="8.5" y="14" width="7" height="7" rx="1" /><path d="M6.5 10v2h11v-2m-5.5 2v2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.7-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    engineering: <><path d="m14 7 3 3m-7 8-7 3 3-7L16 4a3 3 0 0 1 4 4L10 18Z" /><path d="m6 18 2 2" /></>,
    assignmentDone: <><path d="M8 5H5v16h14V5h-3M9 3h6v4H9z" /><path d="m8 14 2 2 5-5" /></>,
    flag: <><path d="M5 21V4m0 0c5-4 9 4 14 0v11c-5 4-9-4-14 0" /></>,
    build: <><path d="m14 7 3 3m-7 8-7 3 3-7L16 4a3 3 0 0 1 4 4L10 18Z" /><path d="m6 18 2 2" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    attachment: <><path d="m21 11.5-8.5 8.5a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.5-8.5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6m-12 5h8m-8 4h8" /></>,
    view: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m12-7-5-5-5 5m5-5v12" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    support: <><path d="M3 11a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12h5v6H5a2 2 0 0 1-2-2z" /><path d="M15 21h-3" /></>,
    radio: <><path d="M5 8a10 10 0 0 1 14 0M8 11a6 6 0 0 1 8 0m-5 4h.01" /><circle cx="12" cy="17" r="1" /></>,
    warehouse: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-8h6v8m-9-8h12" /></>,
    badge: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" /></>,
    schedule: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7" /></>,
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
  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getEvidenceUrl(path: string) {
  if (!path || path === '#') return null;
  try {
    const url = new URL(path, API_BASE_URL);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function formatFileSize(kilobytes: number) {
  if (!Number.isFinite(kilobytes) || kilobytes <= 0) return 'Tamaño desconocido';
  if (kilobytes >= 1024) return `${(kilobytes / 1024).toFixed(1)} MB`;
  return `${Math.round(kilobytes)} KB`;
}

function getActionLabel(action: AccionHistorial) {
  return actionLabels[action] ?? 'Actualización de incidencia';
}

function getHistoryIcon(action: AccionHistorial) {
  if (action === 'creacion') return 'flag';
  if (action === 'asignacion' || action === 'reasignacion') return 'assignmentDone';
  if (action === 'resolucion' || action === 'cierre') return 'check';
  return 'engineering';
}

function getHistoryStatus(event: Incidencia['historial_seguimiento'][number]) {
  if (event.estado_nuevo && event.estado_nuevo in statusLabels) {
    return statusLabels[event.estado_nuevo as EstadoIncidencia];
  }
  if (event.accion === 'creacion') return 'Registrada';
  if (event.accion === 'asignacion' || event.accion === 'reasignacion') {
    return 'En atención';
  }
  return 'Actualización';
}

function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#263143]/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-modal="true"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-labelledby="technician-modal-title"
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1b6870] text-white">
              <Icon className="h-5 w-5" name={icon} />
            </span>
            <div>
              <h2
                className="text-lg font-semibold text-[#132537]"
                id="technician-modal-title"
              >
                {title}
              </h2>
              <p className="text-xs text-[#43474c]">{subtitle}</p>
            </div>
          </div>
          <button
            aria-label="Cerrar ventana"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#43474c] hover:bg-[#e7eeff]"
            onClick={onClose}
            type="button"
          >
            <Icon className="h-5 w-5" name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function TecnicoIncidenciaDetalleClient({
  incidentId,
}: {
  incidentId: string;
}) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalName>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [interventionType, setInterventionType] = useState(
    'Inspección y diagnóstico de hardware',
  );
  const [interventionNotes, setInterventionNotes] = useState('');
  const [materialReference, setMaterialReference] = useState('');
  const [solution, setSolution] = useState('');
  const [verification, setVerification] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [technicianComment, setTechnicianComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const loadIncident = useCallback(async (signal?: AbortSignal) => {
    if (!incidentId || !usuario) return;
    try {
      await Promise.resolve();
      const loaded = USE_MOCKS
        ? createDemoIncident(incidentId)
        : await tecnicoApiService.obtenerIncidencia(incidentId, signal);
      if (signal?.aborted) return;
      if (!loaded) {
        setIncidencia(null);
        setLoadError(`No se encontró la incidencia "${incidentId}".`);
        return;
      }
      if (
        !USE_MOCKS &&
        loaded.tecnico_asignado?.usuario_id !== usuario.id
      ) {
        setIncidencia(null);
        setLoadError('Esta incidencia no está asignada a tu cuenta técnica.');
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

  const history = useMemo(
    () =>
      [...(incidencia?.historial_seguimiento ?? [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      ),
    [incidencia?.historial_seguimiento],
  );

  async function startAttention() {
    if (!incidencia || isSaving) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      if (USE_MOCKS) {
        setIncidencia((current) =>
          current
            ? {
                ...current,
                estado: 'en_proceso',
                historial_seguimiento: [
                  {
                    fecha: new Date().toISOString(),
                    usuario_id: usuario?.id,
                    autor: usuario?.nombre ?? 'Personal técnico',
                    accion: 'comentario',
                    estado_nuevo: 'en_proceso',
                    comentario: 'Inicio de atención técnica.',
                  },
                  ...current.historial_seguimiento,
                ],
              }
            : current,
        );
      } else {
        await tecnicoApiService.actualizarEstado(
          incidencia._id,
          'en_proceso',
          'Inicio de atención técnica.',
        );
        await loadIncident();
      }
      setFeedback({ kind: 'success', message: 'La incidencia pasó a estado En proceso.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No se pudo iniciar la atención.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitTechnicianComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = technicianComment.trim();
    if (!incidencia || !comment || isSavingComment) return;
    setIsSavingComment(true);
    setFeedback(null);
    try {
      if (USE_MOCKS) {
        const now = new Date().toISOString();
        setIncidencia((current) =>
          current
            ? {
                ...current,
                historial_seguimiento: [
                  {
                    fecha: now,
                    usuario_id: usuario?.id,
                    autor: usuario?.nombre ?? 'Personal técnico',
                    accion: 'comentario',
                    estado_nuevo: current.estado,
                    comentario: comment,
                  },
                  ...current.historial_seguimiento,
                ],
              }
            : current,
        );
      } else {
        await tecnicoApiService.agregarComentario(incidencia._id, comment);
        await loadIncident();
      }
      setTechnicianComment('');
      setFeedback({ kind: 'success', message: 'Comentario agregado al seguimiento.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar el comentario.',
      });
    } finally {
      setIsSavingComment(false);
    }
  }

  async function submitIntervention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!incidencia || !usuario) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const comment = interventionNotes.trim();
      const materials = materialReference.trim();
      if (USE_MOCKS) {
        const now = new Date().toISOString();
        setIncidencia((current) =>
          current
            ? {
                ...current,
                estado:
                  current.estado === 'abierta' || current.estado === 'pendiente'
                    ? 'en_proceso'
                    : current.estado,
                horas_invertidas: current.horas_invertidas ?? 0,
                historial_seguimiento: [
                  {
                    fecha: now,
                    usuario_id: usuario.id,
                    autor: usuario.nombre,
                    accion: 'comentario',
                    estado_nuevo: 'en_proceso',
                    comentario: `${interventionType}: ${comment}`,
                  },
                  ...current.historial_seguimiento,
                ],
              }
            : current,
        );
      } else {
        if (incidencia.estado !== 'en_proceso') {
          await tecnicoApiService.actualizarEstado(
            incidencia._id,
            'en_proceso',
            'Inicio de atención técnica.',
          );
        }
        await tecnicoApiService.documentar(incidencia._id, {
            actividad: interventionType,
            comentario: comment,
            observaciones: comment,
            ...(materials ? { materiales: [materials] } : {}),
            fecha: new Date().toISOString(),
        });
        await loadIncident();
      }
      setModal(null);
      setInterventionNotes('');
      setMaterialReference('');
      setFeedback({
        kind: 'success',
        message: USE_MOCKS
          ? 'Intervención registrada en la bitácora de demostración.'
          : 'Intervención registrada en la bitácora técnica.',
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'No se pudo registrar la intervención.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!incidencia || !usuario) return;
    setIsSaving(true);
    setFeedback(null);
    const resolutionComment = `Solución aplicada: ${solution.trim()}\n\nPruebas de verificación: ${verification.trim()}`;
    try {
      if (USE_MOCKS) {
        const now = new Date().toISOString();
        setIncidencia((current) =>
          current
            ? {
                ...current,
                estado: 'resuelta',
                fecha_resolucion: now,
                historial_seguimiento: [
                  {
                    fecha: now,
                    usuario_id: usuario.id,
                    autor: usuario.nombre,
                    accion: 'resolucion',
                    estado_nuevo: 'resuelta',
                    comentario: resolutionComment,
                  },
                  ...current.historial_seguimiento,
                ],
              }
            : current,
        );
      } else {
        await tecnicoApiService.resolver(incidencia._id, resolutionComment);
        await loadIncident();
      }
      setModal(null);
      setSolution('');
      setVerification('');
      setFeedback({
        kind: 'success',
        message: USE_MOCKS
          ? 'Resolución registrada en la demostración.'
          : 'Resolución registrada y enviada a validación institucional.',
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'No se pudo registrar la resolución.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadEvidence() {
    if (!incidencia || !evidenceFile) return;
    setEvidenceError(null);
    if (!allowedEvidenceTypes.includes(evidenceFile.type)) {
      setEvidenceError('Formato no permitido. Usa JPG, PNG, WEBP, PDF o TXT.');
      return;
    }
    if (evidenceFile.size > maxEvidenceSize) {
      setEvidenceError('El archivo supera el límite de 15 MB.');
      return;
    }
    if (USE_MOCKS) {
      setEvidenceError(
        'La carga de evidencias no está habilitada en el modo de datos simulados.',
      );
      return;
    }

    setIsUploadingEvidence(true);
    try {
      await tecnicoApiService.subirEvidencia(incidencia._id, evidenceFile);
      setEvidenceFile(null);
      if (evidenceInputRef.current) evidenceInputRef.current.value = '';
      await loadIncident();
      setFeedback({
        kind: 'success',
        message: 'Evidencia técnica adjuntada correctamente.',
      });
    } catch (error) {
      setEvidenceError(
        error instanceof Error ? error.message : 'No se pudo subir la evidencia.',
      );
    } finally {
      setIsUploadingEvidence(false);
    }
  }

  if (cargando || !usuario || usuario.rol !== 'tecnico_soporte') return null;

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center">
        <p className="text-sm text-[#43474c]" role="status">
          Cargando detalle de la incidencia...
        </p>
      </div>
    );
  }

  if (!incidencia) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1b6870] hover:underline"
          href="/tecnico_soporte/incidencias"
        >
          <Icon className="h-4 w-4" name="back" />
          Volver a incidencias asignadas
        </Link>
        <div
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          role="alert"
        >
          {loadError ?? 'No se encontró esta incidencia.'}
        </div>
      </div>
    );
  }

  const isResolved =
    incidencia.estado === 'resuelta' || incidencia.estado === 'cerrada';
  const evidence = incidencia.evidencias_adjuntas ?? [];
  const details = incidencia.detalle_especifico ?? {};
  const detailValues = Object.entries(details)
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value)}`);
  const equipmentDetails = detailValues.join(' · ') || 'No especificado';
  const technician = incidencia.tecnico_asignado?.nombre || 'Técnico asignado';
  const reporterInitials = incidencia.reportante.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('es') ?? '')
    .join('');

  const renderModal = () => {
    if (modal === 'intervencion') {
      return (
        <Modal
          icon="edit"
          onClose={() => setModal(null)}
          subtitle={`Incidencia ${incidencia.codigo || incidencia._id}`}
          title="Registrar intervención técnica"
        >
          <form className="flex flex-col gap-4" onSubmit={submitIntervention}>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#132537]">
              Tipo de intervención realizada
              <select
                className="h-11 rounded-lg bg-[#f0f3ff] px-3 text-sm font-normal text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => setInterventionType(event.target.value)}
                value={interventionType}
              >
                <option>Inspección y diagnóstico de hardware</option>
                <option>Sustitución temporal de equipo</option>
                <option>Mantenimiento de cableado estructurado</option>
                <option>Configuración de parámetros y VLANs</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#132537]">
              Notas y hallazgos en campo
              <textarea
                className="resize-y rounded-lg bg-[#f0f3ff] p-3 text-sm font-normal text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => setInterventionNotes(event.target.value)}
                placeholder="Describe el trabajo realizado, mediciones tomadas o hallazgos técnicos..."
                required
                rows={4}
                value={interventionNotes}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#132537]">
              Referencia de material o vale de almacén (opcional)
              <input
                className="h-11 rounded-lg bg-[#f0f3ff] px-3 text-sm font-normal text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => setMaterialReference(event.target.value)}
                placeholder="Ej. Vale #REF-8842 o número de serie"
                value={materialReference}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-lg px-4 py-2.5 text-sm text-[#43474c] hover:bg-[#f0f3ff]"
                onClick={() => setModal(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-[#1b6870] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15575e] disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Guardando...' : 'Guardar en bitácora'}
              </button>
            </div>
          </form>
        </Modal>
      );
    }

    if (modal === 'resolucion') {
      return (
        <Modal
          icon="check"
          onClose={() => setModal(null)}
          subtitle="Conclusión de labor en campo"
          title="Registrar resolución técnica"
        >
          <form className="flex flex-col gap-4" onSubmit={submitResolution}>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#132537]">
              Dictamen de solución aplicado
              <input
                className="h-11 rounded-lg bg-[#f0f3ff] px-3 text-sm font-normal text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => setSolution(event.target.value)}
                placeholder="Ej. Reemplazo de módulo de poder y reconexión de puertos"
                required
                value={solution}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#132537]">
              Pruebas de verificación de servicio
              <textarea
                className="resize-y rounded-lg bg-[#f0f3ff] p-3 text-sm font-normal text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                onChange={(event) => setVerification(event.target.value)}
                placeholder="Detalla pruebas de conectividad, enlace y validación con el usuario..."
                required
                rows={3}
                value={verification}
              />
            </label>
            <p className="flex items-start gap-2 rounded-lg bg-[#a6ebf4]/40 p-3 text-xs leading-relaxed text-[#216c74]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" name="info" />
              El estado cambiará a “Resuelta” y quedará pendiente la validación institucional.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-lg px-4 py-2.5 text-sm text-[#43474c] hover:bg-[#f0f3ff]"
                onClick={() => setModal(null)}
                type="button"
              >
                Volver
              </button>
              <button
                className="rounded-lg bg-[#1b6870] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15575e] disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Registrando...' : 'Confirmar resolución'}
              </button>
            </div>
          </form>
        </Modal>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 py-5">
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#43474c]"
        >
          <Link className="hover:text-[#1b6870]" href="/tecnico_soporte">
            Panel principal
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="hover:text-[#1b6870]"
            href="/tecnico_soporte/incidencias"
          >
            Incidencias asignadas
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-[#132537]">
            {incidencia.codigo || incidencia._id}
          </span>
        </nav>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-[#e7eeff] px-4 py-2 text-xs font-semibold text-[#293b4e] transition hover:bg-[#d8e3fb]"
          href="/tecnico_soporte/incidencias"
        >
          <Icon className="h-4 w-4" name="back" />
          Volver a incidencias asignadas
        </Link>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          <span>{feedback.message}</span>
          <button
            aria-label="Cerrar aviso"
            className="shrink-0"
            onClick={() => setFeedback(null)}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <header className="mb-6 rounded-xl bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex max-w-4xl flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#a6ebf4]/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#216c74]">
                {categoryLabels[incidencia.categoria]}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                  incidencia.estado,
                )}`}
              >
                <span
                  className={`h-2 w-2 rounded-full bg-current ${
                    incidencia.estado === 'en_proceso' ? 'animate-pulse' : ''
                  }`}
                />
                {statusLabels[incidencia.estado]}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getPriorityClasses(
                  incidencia.prioridad,
                )}`}
              >
                <Icon className="h-3.5 w-3.5" name="priority" />
                Prioridad {priorityLabels[incidencia.prioridad]}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#43474c]">
                <Icon className="h-4 w-4 text-[#74777d]" name="clock" />
                Registrada: {formatDate(incidencia.fecha_creacion)}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#132537] sm:text-[30px]">
              {incidencia.codigo || incidencia._id} — {incidencia.titulo}
            </h1>
            <p className="text-sm text-[#43474c]">
              Intervención técnica en curso · {incidencia.ubicacion.edificio}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {incidencia.estado !== 'en_proceso' && !isResolved && (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#e7eeff] px-4 py-2 text-sm font-semibold text-[#1b6870] transition hover:bg-[#d8e3fb] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                onClick={() => void startAttention()}
                type="button"
              >
                {isSaving ? 'Actualizando...' : 'Iniciar atención'}
              </button>
            )}
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15575e] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isResolved}
              onClick={() => {
                setFeedback(null);
                router.push(
                  `/tecnico_soporte/incidencias/${encodeURIComponent(incidencia._id)}/intervencion`,
                );
              }}
              type="button"
            >
              <Icon className="h-4 w-4" name="edit" />
              Registrar intervención
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#e7eeff] px-4 py-2 text-sm font-semibold text-[#1b6870] transition hover:bg-[#a6ebf4]/60 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isResolved}
              onClick={() => {
                setFeedback(null);
                setModal('resolucion');
              }}
              type="button"
            >
              <Icon className="h-4 w-4" name="check" />
              Registrar resolución
            </button>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#293b4e] text-white">
                  <Icon className="h-5 w-5" name="assignment" />
                </span>
                <h2 className="text-lg font-semibold text-[#132537]">
                  Información del problema reportado
                </h2>
              </div>
              {typeof details.codigo_activo === 'string' && (
                <span className="text-[11px] uppercase tracking-wide text-[#74777d]">
                  Código de activo: {details.codigo_activo}
                </span>
              )}
            </div>

            <p className="mb-5 rounded-lg bg-[#f0f3ff] p-4 text-sm leading-relaxed text-[#111c2d]">
              {incidencia.descripcion || 'El reporte no incluye una descripción adicional.'}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailCard
                icon="network"
                label="Categoría técnica"
                value={categoryLabels[incidencia.categoria]}
                detail={equipmentDetails}
              />
              <DetailCard
                icon="location"
                label="Ubicación precisa"
                value={[
                  incidencia.ubicacion.edificio,
                  incidencia.ubicacion.piso,
                ]
                  .filter(Boolean)
                  .join(' — ') || 'No especificada'}
                detail={[
                  incidencia.ubicacion.aula,
                  incidencia.ubicacion.referencia,
                ]
                  .filter(Boolean)
                  .join(' — ')}
              />
              <DetailCard
                icon="calendar"
                label="Fecha y hora de registro"
                value={formatDate(incidencia.fecha_creacion)}
                detail={
                  incidencia.horas_invertidas !== undefined
                    ? `${incidencia.horas_invertidas} horas registradas`
                    : 'Tiempo de atención según prioridad asignada'
                }
              />
              <DetailCard
                icon="person"
                label="Usuario reportante"
                value={incidencia.reportante.nombre || 'No disponible'}
                detail={incidencia.reportante.tipo}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#e7eeff] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#293b4e] text-sm font-bold text-white">
                  {reporterInitials || 'U'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#132537]">
                    Contacto para validación
                  </p>
                  <p className="text-xs text-[#43474c]">
                    {incidencia.reportante.nombre || 'Usuario reportante'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-[#43474c]">
                <Icon className="h-4 w-4 text-[#1b6870]" name="schedule" />
                Coordina la validación con el reportante.
              </span>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1b6870] text-white">
                  <Icon className="h-5 w-5" name="history" />
                </span>
                <h2 className="text-lg font-semibold text-[#132537]">
                  Historial de seguimiento técnico
                </h2>
              </div>
              <span className="rounded-full bg-[#e7eeff] px-3 py-1 text-[11px] text-[#43474c]">
                {history.length} {history.length === 1 ? 'acción registrada' : 'acciones registradas'}
              </span>
            </div>
            {history.length > 0 ? (
              <ol className="relative ml-3 space-y-5 border-l-2 border-[#d8e3fb] pl-6">
                {history.map((event, index) => (
                  <li className="relative" key={`${event.fecha}-${index}`}>
                    <span
                      className={`absolute -left-[37px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                        index === 0
                          ? 'bg-[#1b6870] text-white'
                          : 'bg-[#293b4e] text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" name={getHistoryIcon(event.accion)} />
                    </span>
                    <article
                      className={`rounded-xl p-4 ${
                        index === 0 ? 'bg-[#f0f3ff]' : 'bg-[#f9f9ff]'
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#132537]">
                            {getActionLabel(event.accion)}
                          </h3>
                          <span className="rounded bg-[#e7eeff] px-2 py-0.5 text-[10px] font-medium text-[#43474c]">
                            {getHistoryStatus(event)}
                          </span>
                        </div>
                        <time className="text-[11px] text-[#43474c]" dateTime={event.fecha}>
                          {formatDate(event.fecha)}
                        </time>
                      </div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#1b6870]">
                        <Icon className="h-3.5 w-3.5" name="badge" />
                        {event.autor || 'Sistema'}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-[#43474c]">
                        {event.comentario}
                      </p>
                      {event.horas !== undefined && (
                        <p className="mt-3 text-xs text-[#43474c]">
                          Tiempo registrado: {event.horas} h
                        </p>
                      )}
                    </article>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-lg bg-[#f0f3ff] p-4 text-sm text-[#43474c]">
                Aún no hay acciones registradas en la bitácora técnica.
              </p>
            )}
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                <Icon className="h-5 w-5" name="comment" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[#132537]">
                  Agregar comentario de seguimiento
                </h2>
                <p className="text-xs text-[#43474c]">
                  El comentario quedará registrado en la bitácora de la incidencia.
                </p>
              </div>
            </div>
            <form className="flex flex-col gap-3" onSubmit={submitTechnicianComment}>
              <label className="sr-only" htmlFor="technician-comment">
                Comentario de seguimiento
              </label>
              <textarea
                className="min-h-24 resize-y rounded-lg bg-[#f0f3ff] p-3 text-sm text-[#111c2d] outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                id="technician-comment"
                onChange={(event) => setTechnicianComment(event.target.value)}
                placeholder="Escribe un avance o comentario para el seguimiento..."
                required
                rows={3}
                value={technicianComment}
              />
              <div className="flex justify-end">
                <button
                  className="rounded-lg bg-[#1b6870] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15575e] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!technicianComment.trim() || isSavingComment}
                  type="submit"
                >
                  {isSavingComment ? 'Guardando...' : 'Guardar comentario'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:col-span-4">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a6ebf4]/50 text-[#1b6870]">
                <Icon className="h-5 w-5" name="build" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#132537]">
                  Acciones técnicas
                </h2>
                <p className="text-[11px] text-[#43474c]">
                  Intervención operativa directa
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {incidencia.estado !== 'en_proceso' && !isResolved && (
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e7eeff] px-4 text-sm font-medium text-[#1b6870] transition hover:bg-[#d8e3fb] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => void startAttention()}
                  type="button"
                >
                  {isSaving ? 'Actualizando...' : 'Iniciar atención'}
                </button>
              )}
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-4 text-sm font-medium text-white transition hover:bg-[#15575e] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isResolved}
                onClick={() => {
                  setFeedback(null);
                  router.push(
                    `/tecnico_soporte/incidencias/${encodeURIComponent(incidencia._id)}/intervencion`,
                  );
                }}
                type="button"
              >
                <Icon className="h-5 w-5" name="edit" />
                Registrar intervención
              </button>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e7eeff] px-4 text-sm font-medium text-[#132537] transition hover:bg-[#d8e3fb] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isResolved}
                onClick={() => {
                  setFeedback(null);
                  setModal('resolucion');
                }}
                type="button"
              >
                <Icon className="h-5 w-5 text-[#1b6870]" name="check" />
                Registrar resolución
              </button>
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#f0f3ff] p-3 text-xs leading-relaxed text-[#43474c]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1b6870]" name="info" />
              Como personal técnico registras intervenciones de campo y diagnóstico. Las validaciones y cierres definitivos se coordinan desde el módulo central.
            </p>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#293b4e] text-white">
                  <Icon className="h-5 w-5" name="attachment" />
                </span>
                <h2 className="text-base font-semibold text-[#132537]">
                  Evidencias del reporte
                </h2>
              </div>
              <span className="text-[11px] text-[#43474c]">
                {evidence.length} {evidence.length === 1 ? 'archivo' : 'archivos'}
              </span>
            </div>

            {evidence.length > 0 ? (
              <div className="mb-4 flex flex-col gap-2">
                {evidence.map((file, index) => (
                  <EvidenceRow evidence={file} key={`${file.nombre_archivo}-${index}`} />
                ))}
              </div>
            ) : (
              <p className="mb-4 rounded-lg bg-[#f9f9ff] p-3 text-xs text-[#43474c]">
                Esta incidencia no tiene evidencias adjuntas.
              </p>
            )}

            <input
              accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
              className="sr-only"
              onChange={(event) => {
                setEvidenceError(null);
                setEvidenceFile(event.target.files?.[0] ?? null);
              }}
              ref={evidenceInputRef}
              type="file"
            />
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f0f3ff] px-3 py-2.5 text-xs font-semibold text-[#1b6870] transition hover:bg-[#e7eeff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUploadingEvidence}
              onClick={() => evidenceInputRef.current?.click()}
              type="button"
            >
              <Icon className="h-4 w-4" name="upload" />
              Adjuntar evidencia técnica
            </button>
            {evidenceFile && (
              <div className="mt-3 rounded-lg border border-[#d8e3fb] p-3">
                <p className="truncate text-xs font-medium text-[#132537]">
                  {evidenceFile.name}
                </p>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    className="px-3 py-1.5 text-xs text-[#43474c]"
                    onClick={() => {
                      setEvidenceFile(null);
                      if (evidenceInputRef.current) evidenceInputRef.current.value = '';
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded bg-[#1b6870] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isUploadingEvidence}
                    onClick={() => void uploadEvidence()}
                    type="button"
                  >
                    {isUploadingEvidence ? 'Subiendo...' : 'Subir archivo'}
                  </button>
                </div>
              </div>
            )}
            {evidenceError && (
              <p className="mt-2 text-xs text-red-700" role="alert">
                {evidenceError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-[#74777d]">
              JPG, PNG, WEBP, PDF o TXT · máximo 15 MB
            </p>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#293b4e] text-white">
                <Icon className="h-5 w-5" name="support" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#132537]">
                  Soporte y cuadrilla central
                </h2>
                <p className="text-[11px] text-[#43474c]">Coordinación de campus</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <ContactRow
                detail="Ing. Roberto Méndez · Ext. 2401"
                icon="person"
                label="Supervisor de guardia"
              />
              <ContactRow
                detail="Frecuencia Canal 3 — Cuadrilla Central"
                icon="radio"
                label="Canal de radio"
              />
              <ContactRow
                detail="Edificio Central A-102 · Ext. 2455"
                icon="warehouse"
                label="Almacén de refacciones TI"
              />
              <ContactRow
                detail={technician}
                icon="badge"
                label="Técnico responsable"
              />
            </div>
          </section>
        </aside>
      </div>
      {renderModal()}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="flex min-h-[118px] flex-col gap-1 rounded-lg bg-[#f9f9ff] p-4">
      <span className="flex items-center gap-1.5 text-[11px] text-[#43474c]">
        <Icon className="h-4 w-4 text-[#1b6870]" name={icon} />
        {label}
      </span>
      <p className="text-sm font-semibold text-[#132537]">{value}</p>
      {detail && <p className="text-xs leading-relaxed text-[#43474c]">{detail}</p>}
    </article>
  );
}

function EvidenceRow({ evidence }: { evidence: EvidenciaAdjunta }) {
  const url = getEvidenceUrl(evidence.url_storage);
  const isImage = evidence.tipo_mime.startsWith('image/');
  const canPreview = Boolean(url) && (isImage || evidence.tipo_mime === 'application/pdf');
  return (
    <article className="flex items-center justify-between gap-3 rounded-lg bg-[#f9f9ff] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d8e3fb] text-[#1b6870]">
          <Icon className="h-5 w-5" name={isImage ? 'image' : 'file'} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#132537]" title={evidence.nombre_archivo}>
            {evidence.nombre_archivo}
          </p>
          <p className="truncate text-[11px] text-[#43474c]">
            {formatFileSize(evidence.peso_kb)} · {evidence.tipo_mime || 'Archivo'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {url ? (
          <>
            <a
              aria-label={canPreview ? `Ver ${evidence.nombre_archivo}` : `Consultar ${evidence.nombre_archivo}`}
              className="flex h-8 w-8 items-center justify-center rounded text-[#43474c] transition hover:bg-[#e7eeff] hover:text-[#1b6870]"
              href={url}
              rel="noreferrer"
              target="_blank"
              title={canPreview ? 'Ver archivo' : 'Abrir archivo'}
            >
              <Icon className="h-[18px] w-[18px]" name="view" />
            </a>
            <a
              aria-label={`Descargar ${evidence.nombre_archivo}`}
              className="flex h-8 w-8 items-center justify-center rounded text-[#43474c] transition hover:bg-[#e7eeff] hover:text-[#1b6870]"
              download={evidence.nombre_archivo}
              href={url}
              title="Descargar"
            >
              <Icon className="h-[18px] w-[18px]" name="download" />
            </a>
          </>
        ) : (
          <span className="px-1 text-[10px] text-[#74777d]" title="Sin URL disponible en los datos de demostración">
            Sin enlace
          </span>
        )}
      </div>
    </article>
  );
}

function ContactRow({
  detail,
  icon,
  label,
}: {
  detail: string;
  icon: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[#e7eeff]">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1b6870]" name={icon} />
      <div>
        <p className="text-xs font-semibold text-[#132537]">{label}</p>
        <p className="text-xs text-[#43474c]">{detail}</p>
      </div>
    </div>
  );
}

function getStatusClasses(status: EstadoIncidencia) {
  if (status === 'en_proceso') return 'bg-[#a6ebf4] text-[#216c74]';
  if (status === 'resuelta' || status === 'cerrada') {
    return 'bg-emerald-100 text-emerald-800';
  }
  return 'bg-[#e7eeff] text-[#43474c]';
}

function getPriorityClasses(priority: PrioridadIncidencia) {
  if (priority === 'critica' || priority === 'alta') {
    return 'bg-[#ffdad6] text-[#93000a]';
  }
  if (priority === 'media') return 'bg-[#e7eeff] text-[#43474c]';
  return 'bg-[#f0f3ff] text-[#43474c]';
}
