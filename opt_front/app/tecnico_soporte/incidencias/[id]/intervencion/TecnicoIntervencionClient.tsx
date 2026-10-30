'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCKS } from '@/config/endpoints';
import { ApiError } from '@/lib/httpClient';
import { tecnicoApiService } from '@/services/tecnicoApiService';
import type {
  EstadoIncidencia,
  Incidencia,
  PrioridadIncidencia,
} from '@/types/incidencia';

type ActivityType = 'diagnostico' | 'reemplazo' | 'mantenimiento' | 'logica';
type VisitResult = 'partial' | 'resolved';
type Draft = {
  activity: ActivityType;
  workDone: string;
  hours: string;
  attendedAt: string;
  materials: string[];
  observations: string;
  result: VisitResult;
};
type Feedback = { kind: 'success' | 'error'; message: string } | null;
type DraftStorage = Draft & { updatedAt: string };

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
]);
const maximumFileSize = 15 * 1024 * 1024;
const minimumWorkLength = 20;

const activities: {
  value: ActivityType;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'diagnostico',
    title: 'Diagnóstico en sitio',
    description: 'Pruebas físicas y mediciones',
    icon: 'search',
  },
  {
    value: 'reemplazo',
    title: 'Reemplazo hardware/cableado',
    description: 'Sustitución de componentes',
    icon: 'swap',
  },
  {
    value: 'mantenimiento',
    title: 'Mantenimiento correctivo',
    description: 'Limpieza y reacondicionamiento',
    icon: 'clean',
  },
  {
    value: 'logica',
    title: 'Configuración lógica',
    description: 'VLANs, puertos y firmware',
    icon: 'terminal',
  },
];

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

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function draftStorageKey(userId: string, incidentId: string) {
  return `utm-desk-intervention-draft:${userId}:${incidentId}`;
}

function isActivityType(value: unknown): value is ActivityType {
  return (
    value === 'diagnostico' ||
    value === 'reemplazo' ||
    value === 'mantenimiento' ||
    value === 'logica'
  );
}

function parseDraft(value: unknown): DraftStorage | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (
    !isActivityType(candidate.activity) ||
    typeof candidate.workDone !== 'string' ||
    typeof candidate.hours !== 'string' ||
    typeof candidate.attendedAt !== 'string' ||
    !Array.isArray(candidate.materials) ||
    !candidate.materials.every((item) => typeof item === 'string') ||
    typeof candidate.observations !== 'string' ||
    (candidate.result !== 'partial' && candidate.result !== 'resolved') ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null;
  }
  return candidate as DraftStorage;
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    swap: <><path d="M16 3 20 7l-4 4M4 7h16M8 21l-4-4 4-4m12 4H4" /></>,
    clean: <><path d="M4 20h16M6 17l3-9h6l3 9M9 8l1-4h4l1 4m-6 5h6" /></>,
    terminal: <><path d="m4 17 6-6-6-6m8 14h8" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    router: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 12h.01M11 12h.01M15 12h.01M7 16h10M12 8V4m-3 0h6" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    badge: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" /></>,
    engineering: <><path d="m14 7 3 3m-7 8-7 3 3-7L16 4a3 3 0 0 1 4 4L10 18Z" /><path d="m6 18 2 2" /></>,
    hours: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 1.5M8 3 6 5m10-2 2 2" /></>,
    date: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    inventory: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7m-8 4v10" /></>,
    remove: <path d="M5 12h14" />,
    add: <path d="M12 5v14m-7-7h14" />,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m12-7-5-5-5 5m5-5v12" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8m0-18v5h9" /></>,
    back: <><path d="M19 12H5m7 7-7-7 7-7" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    shield: <><path d="M12 3 5 6v6c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    flag: <><path d="M5 21V4m0 0c5-4 9 4 14 0v11c-5 4-9-4-14 0" /></>,
    assignment: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M9 5V3h6v2m-7 6h8m-8 4h8" /></>,
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
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

function categoryLabel(incident: Incidencia) {
  if (incident.categoria === 'computo_redes') return 'Cómputo y redes';
  if (incident.categoria === 'infraestructura') return 'Infraestructura';
  return 'Académico';
}

function locationLabel(incident: Incidencia) {
  return [
    incident.ubicacion.edificio,
    incident.ubicacion.aula,
    incident.ubicacion.piso,
  ]
    .filter(Boolean)
    .join(' — ');
}

function demoIncident(incidentId: string): Incidencia | null {
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
      'El switch principal del rack en Laboratorio de Cómputo 3 no responde. Se intentó reiniciar físicamente, pero los puertos 1 al 24 continúan apagados.',
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
      codigo_activo: 'SW-EDIFB-03',
      equipo: 'Cisco Catalyst 2960',
    },
    tags: ['redes', 'switch'],
    historial_seguimiento: [
      {
        fecha: '2026-02-12T10:55:00',
        autor: 'Mesa de Ayuda TI',
        accion: 'asignacion',
        comentario: 'Ticket canalizado a Cuadrilla de Redes e Infraestructura de Campus.',
      },
    ],
    evidencias_adjuntas: [],
    fecha_creacion: '2026-02-12T10:42:00',
    horas_invertidas: 0.5,
    },
    {
      _id: 'tec-inc-102',
      codigo: 'INC-2026-0114',
      titulo: 'Contacto eléctrico con chispas',
      descripcion: 'Se reportan chispas en un contacto eléctrico del Aula Magna 2.',
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
      evidencias_adjuntas: [],
      fecha_creacion: '2026-02-12T11:05:00',
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
        piso: 'Planta Baja',
        aula: 'Sala de Lectura',
      },
      tags: ['wifi', 'biblioteca'],
      historial_seguimiento: [],
      evidencias_adjuntas: [],
      fecha_creacion: '2026-02-12T09:10:00',
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
      evidencias_adjuntas: [],
      fecha_creacion: '2026-02-11T15:40:00',
    },
  ];

  return incidents.find(
    (incident) => incident._id === incidentId || incident.codigo === incidentId,
  ) ?? null;
}

export default function TecnicoIntervencionClient({
  incidentId,
}: {
  incidentId: string;
}) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [incident, setIncident] = useState<Incidencia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    activity: 'diagnostico',
    workDone: '',
    hours: '0.5',
    attendedAt: '',
    materials: [],
    observations: '',
    result: 'partial',
  });
  const [draftReady, setDraftReady] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [materialInput, setMaterialInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = usuario ? draftStorageKey(usuario.id, incidentId) : null;
  const finalizeRef = useRef(false);
  const workLength = draft.workDone.length;

  const loadIncident = useCallback(async (signal?: AbortSignal) => {
    if (!incidentId || !usuario) return;
    try {
      await Promise.resolve();
      const loaded = USE_MOCKS
        ? demoIncident(incidentId)
        : await tecnicoApiService.obtenerIncidencia(incidentId, signal);
      if (signal?.aborted) return;
      if (!loaded) {
        setIncident(null);
        setLoadError(`No se encontró la incidencia "${incidentId}".`);
        return;
      }
      if (
        !USE_MOCKS &&
        loaded.tecnico_asignado?.usuario_id !== usuario.id
      ) {
        setIncident(null);
        setLoadError('Esta incidencia no está asignada a tu cuenta técnica.');
        return;
      }
      setIncident(loaded);
      setLoadError(null);
    } catch (error) {
      if (signal?.aborted) return;
      setIncident(null);
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

  useEffect(() => {
    if (!draftKey || !incident) return;
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const serialized = window.localStorage.getItem(draftKey);
        if (serialized) {
          const parsed = parseDraft(JSON.parse(serialized));
          if (parsed && active) {
            setDraft({
              activity: parsed.activity,
              workDone: parsed.workDone,
              hours: parsed.hours,
              attendedAt: parsed.attendedAt,
              materials: parsed.materials,
              observations: parsed.observations,
              result: parsed.result,
            });
            setDraftSavedAt(new Date(parsed.updatedAt));
            setDraftDirty(true);
          } else if (active) {
            setDraftNotice('El borrador guardado no es válido y no se pudo recuperar.');
          }
        } else {
          setDraft((current) => ({
            ...current,
            hours:
              incident.horas_invertidas && incident.horas_invertidas >= 0.5
                ? String(incident.horas_invertidas)
                : '0.5',
            attendedAt: localDateTimeValue(),
          }));
        }
      } catch {
        if (active) setDraftNotice('No se pudo leer el borrador local de esta incidencia.');
      } finally {
        if (active) setDraftReady(true);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draftKey, incident]);

  useEffect(() => {
    if (!draftReady || !draftKey || !draftDirty) return;
    const timer = window.setTimeout(() => {
      try {
        const updatedAt = new Date().toISOString();
        const value: DraftStorage = { ...draft, updatedAt };
        window.localStorage.setItem(draftKey, JSON.stringify(value));
        setDraftSavedAt(new Date(updatedAt));
        setDraftNotice(null);
      } catch {
        setDraftNotice('No se pudo respaldar el borrador en este dispositivo.');
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, draftDirty, draftKey, draftReady]);

  const timeline = useMemo(
    () =>
      [...(incident?.historial_seguimiento ?? [])].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      ),
    [incident?.historial_seguimiento],
  );

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDraftDirty(true);
    setDraftNotice(null);
  }

  function adjustHours(delta: number) {
    const currentHours = Number(draft.hours);
    const nextHours = Math.max(0.5, (Number.isFinite(currentHours) ? currentHours : 0.5) + delta);
    updateDraft('hours', nextHours.toFixed(1));
  }

  function addMaterial() {
    const material = materialInput.trim();
    if (!material) return;
    if (draft.materials.some((item) => item.toLocaleLowerCase() === material.toLocaleLowerCase())) {
      setDraftNotice('Ese material ya está agregado.');
      return;
    }
    updateDraft('materials', [...draft.materials, material]);
    setMaterialInput('');
  }

  function acceptFiles(selectedFiles: FileList | File[]) {
    setFileError(null);
    const accepted: File[] = [];
    const errors: string[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (!allowedTypes.has(file.type)) {
        errors.push(`${file.name}: formato no permitido.`);
      } else if (file.size > maximumFileSize) {
        errors.push(`${file.name}: supera el límite de 15 MB.`);
      } else {
        accepted.push(file);
      }
    }
    setFiles((current) => {
      const uniqueFiles = accepted.filter(
        (candidate) =>
          !current.some(
            (existing) =>
              existing.name === candidate.name &&
              existing.size === candidate.size &&
              existing.lastModified === candidate.lastModified,
          ),
      );
      return [...current, ...uniqueFiles];
    });
    if (errors.length) setFileError(errors.join(' '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) acceptFiles(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFiles(event.dataTransfer.files);
  }

  async function uploadEvidence(incidentRecord: Incidencia, file: File) {
    await tecnicoApiService.subirEvidencia(incidentRecord._id, file);
  }

  async function submitIntervention(
    event: FormEvent<HTMLFormElement>,
    finalize: boolean,
  ) {
    event.preventDefault();
    if (!incident || !usuario) return;
    setFeedback(null);
    setFileError(null);
    if (incident.estado === 'resuelta' || incident.estado === 'cerrada') {
      setFeedback({
        kind: 'error',
        message: 'Esta incidencia ya está resuelta o cerrada y no admite nuevas intervenciones.',
      });
      return;
    }

    const hours = Number(draft.hours);
    if (
      !Number.isFinite(hours) ||
      hours < 0.5 ||
      Math.round(hours * 2) !== hours * 2
    ) {
      setFeedback({
        kind: 'error',
        message: 'Registra al menos 0.5 horas, en incrementos de 30 minutos.',
      });
      return;
    }
    if (workLength < minimumWorkLength) {
      setFeedback({
        kind: 'error',
        message: `Describe el trabajo realizado con al menos ${minimumWorkLength} caracteres.`,
      });
      return;
    }
    const attendedDate = new Date(draft.attendedAt);
    if (!draft.attendedAt || Number.isNaN(attendedDate.getTime())) {
      setFeedback({
        kind: 'error',
        message: 'Indica una fecha y hora válida para la atención.',
      });
      return;
    }
    setIsSubmitting(true);

    let documentationSaved = false;
    let hoursSaved = false;
    let resolutionSaved = false;
    let statusSaved = false;
    const failedUploadFiles: File[] = [];
    const failedUploads: string[] = [];
    const activityLabel =
      activities.find((activity) => activity.value === draft.activity)?.title ??
      'Intervención técnica';
    const comment = `${activityLabel}: ${draft.workDone.trim()}`;
    const attendedAt = attendedDate.toISOString();

    try {
      if (USE_MOCKS) {
        setFeedback({
          kind: 'error',
          message:
            'El modo de datos simulados no permite registrar intervenciones. El borrador local se conserva.',
        });
        return;
      }

      if (incident.estado !== 'en_proceso') {
        await tecnicoApiService.actualizarEstado(
          incident._id,
          'en_proceso',
          'Inicio de atención técnica.',
        );
        statusSaved = true;
      }

      await tecnicoApiService.documentar(incident._id, {
          actividad: activityLabel,
          comentario: comment,
          observaciones: draft.observations.trim(),
          materiales: draft.materials,
          fecha: attendedAt,
      });
      documentationSaved = true;

      await tecnicoApiService.registrarHoras(incident._id, hours);
      hoursSaved = true;

      for (const file of files) {
        try {
          await uploadEvidence(incident, file);
        } catch (error) {
          failedUploadFiles.push(file);
          failedUploads.push(
            `${file.name}: ${error instanceof Error ? error.message : 'no se pudo subir'}`,
          );
        }
      }

      if (failedUploads.length > 0) {
        setFiles(failedUploadFiles);
        throw new Error(
          `La bitácora y las horas se guardaron, pero algunas evidencias fallaron: ${failedUploads.join('; ')}`,
        );
      }
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (finalize) {
        const resolutionComment = [
          'Resultado de atención: falla corregida en sitio.',
          `Trabajo realizado: ${draft.workDone.trim()}`,
          `Observaciones y recomendaciones: ${draft.observations.trim() || 'Sin observaciones adicionales.'}`,
          `Horas registradas: ${hours}`,
          `Fecha de atención: ${attendedAt}`,
        ].join('\n');
        await tecnicoApiService.resolver(incident._id, resolutionComment);
        resolutionSaved = true;
      }

      setDraftDirty(false);
      if (draftKey) window.localStorage.removeItem(draftKey);
      setFeedback({
        kind: 'success',
        message: finalize
          ? 'Intervención registrada y resolución enviada a validación institucional.'
          : 'Intervención registrada en la bitácora técnica.',
      });
      if (finalize) {
        window.setTimeout(() => {
          router.push(`/tecnico_soporte/incidencias/${encodeURIComponent(incident._id)}`);
        }, 1200);
      }
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'No se pudo guardar la intervención.';
      const partialMessage = failedUploads.length > 0
        ? message
        : resolutionSaved
        ? 'La resolución fue guardada, pero ocurrió un error al finalizar la actualización.'
        : documentationSaved && hoursSaved
          ? `${message} La bitácora y las horas sí quedaron guardadas.`
          : documentationSaved
            ? `${message} La bitácora sí quedó guardada, pero las horas pueden requerir registro manual.`
          : statusSaved
            ? `${message} El estado sí cambió a En proceso, pero la intervención no se completó.`
          : message;
      setFeedback({ kind: 'error', message: partialMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cargando || !usuario || usuario.rol !== 'tecnico_soporte') return null;

  if (isLoading || !draftReady) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center">
        <p className="text-sm text-[#43474c]" role="status">
          Cargando formulario de intervención...
        </p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1b6870] hover:underline"
          href="/tecnico_soporte/incidencias"
        >
          <Icon className="h-4 w-4" name="back" />
          Volver a incidencias asignadas
        </Link>
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
          {loadError ?? 'No se encontró esta incidencia.'}
        </div>
      </div>
    );
  }

  const detail = incident.detalle_especifico ?? {};
  const equipmentName =
    (typeof detail.equipo === 'string' && detail.equipo) ||
    (typeof detail.subsistema === 'string' && detail.subsistema) ||
    'Equipo institucional';
  const assetCode =
    typeof detail.codigo_activo === 'string' ? detail.codigo_activo : '';
  const initials = usuario.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('es') ?? '')
    .join('');
  const resolutionDisabled =
    draft.result !== 'resolved' || incident.estado === 'resuelta' || incident.estado === 'cerrada';

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col pb-8">
      {feedback && (
        <div
          className={`fixed bottom-5 right-4 z-[60] flex max-w-lg items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-xl sm:right-6 ${
            feedback.kind === 'success'
              ? 'bg-[#132537] text-white'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              feedback.kind === 'success' ? 'text-[#a9eef7]' : 'text-red-700'
            }`}
            name={feedback.kind === 'success' ? 'check' : 'info'}
          />
          <span>{feedback.message}</span>
          <button
            aria-label="Cerrar aviso"
            className="ml-auto"
            onClick={() => setFeedback(null)}
            type="button"
          >
            <Icon className="h-4 w-4" name="close" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#43474c]"
          >
            <Link className="hover:text-[#132537]" href="/tecnico_soporte">
              Panel principal
            </Link>
            <span className="text-[#c4c6cd]">/</span>
            <Link
              className="hover:text-[#132537]"
              href="/tecnico_soporte/incidencias"
            >
              Incidencias asignadas
            </Link>
            <span className="text-[#c4c6cd]">/</span>
            <Link
              className="hover:text-[#132537]"
              href={`/tecnico_soporte/incidencias/${encodeURIComponent(incident._id)}`}
            >
              {incident.codigo || incident._id}
            </Link>
            <span className="text-[#c4c6cd]">/</span>
            <span aria-current="page" className="font-semibold text-[#1b6870]">
              Registrar intervención
            </span>
          </nav>
          <Link
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1b6870] transition hover:bg-[#e7eeff]"
            href={`/tecnico_soporte/incidencias/${encodeURIComponent(incident._id)}`}
          >
            <Icon className="h-[18px] w-[18px]" name="back" />
            Volver al detalle del ticket
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111c2d] sm:text-[30px]">
            Registrar intervención técnica
          </h1>
          <p className="mt-1 text-sm text-[#43474c]">
            Documenta las acciones operativas, diagnóstico y refacciones utilizadas en la atención en sitio.
          </p>
        </div>
      </div>

      <section className="my-4 rounded-xl bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7eeff] text-[#1b6870]">
              <Icon className="h-7 w-7" name="router" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#d8e3fb] px-2 py-1 text-xs font-semibold text-[#43474c]">
                  {incident.codigo || incident._id}
                </span>
                <span className="rounded-full bg-[#a6ebf4] px-2.5 py-1 text-xs font-semibold text-[#216c74]">
                  {statusLabels[incident.estado]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    incident.prioridad === 'alta' || incident.prioridad === 'critica'
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#e7eeff] text-[#43474c]'
                  }`}
                >
                  Prioridad {priorityLabels[incident.prioridad]}
                </span>
              </div>
              <h2 className="mt-1 truncate text-base font-semibold text-[#111c2d] sm:text-lg">
                {incident.titulo}
              </h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#43474c]">
                <span className="inline-flex items-center gap-1">
                  <Icon className="h-4 w-4 text-[#74777d]" name="location" />
                  {locationLabel(incident)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon className="h-4 w-4 text-[#74777d]" name="clock" />
                  Reportada {formatDate(incident.fecha_creacion)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg bg-[#f0f3ff] px-4 py-3">
            <Icon className="h-6 w-6 text-[#1b6870]" name="badge" />
            <div>
              <p className="text-[11px] text-[#43474c]">Técnico responsable</p>
              <p className="text-xs font-semibold text-[#111c2d]">
                {incident.tecnico_asignado?.nombre || usuario.nombre}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="my-4 grid items-start gap-6 lg:grid-cols-12">
        <form
          className="flex flex-col gap-5 lg:col-span-8"
            onSubmit={(event) => {
              const finalize = finalizeRef.current;
              finalizeRef.current = false;
              void submitIntervention(event, finalize);
            }}
        >
          <section className="flex flex-col gap-6 rounded-xl bg-white p-5 shadow-sm sm:p-7">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                  <Icon className="h-5 w-5" name="engineering" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#111c2d]">
                    Detalle de la intervención operativa
                  </h2>
                  <p className="text-xs text-[#43474c]">
                    Información requerida para la auditoría técnica y bitácora de TI
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#e7eeff] px-3 py-1 text-[11px] font-medium text-[#1b6870]">
                Paso 1 de 2
              </span>
            </header>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-[#111c2d]">
                Tipo de actividad técnica <span className="text-red-700">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {activities.map((activity) => {
                  const selected = draft.activity === activity.value;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`flex items-center gap-3 rounded-lg p-3 text-left transition ${
                        selected
                          ? 'bg-[#1b6870] text-white shadow-sm'
                          : 'bg-[#e7eeff] text-[#111c2d] hover:bg-[#d8e3fb]'
                      }`}
                      key={activity.value}
                      onClick={() => updateDraft('activity', activity.value)}
                      type="button"
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${
                          selected ? 'text-white' : 'text-[#1b6870]'
                        }`}
                        name={activity.icon}
                      />
                      <span>
                        <span className="block text-xs font-semibold">
                          {activity.title}
                        </span>
                        <span
                          className={`mt-0.5 block text-[11px] ${
                            selected ? 'text-[#a9eef7]' : 'text-[#43474c]'
                          }`}
                        >
                          {activity.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  className="text-sm font-medium text-[#111c2d]"
                  htmlFor="workDone"
                >
                  Trabajo realizado <span className="text-red-700">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    workLength < minimumWorkLength
                      ? 'text-[#43474c]'
                      : 'text-[#1b6870]'
                  }`}
                  aria-live="polite"
                >
                  {workLength} caracteres
                </span>
              </div>
              <textarea
                className="w-full resize-y rounded-lg bg-[#f0f3ff] p-4 text-sm text-[#111c2d] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                id="workDone"
                minLength={minimumWorkLength}
                onChange={(event) => updateDraft('workDone', event.target.value)}
                placeholder="Describe las acciones ejecutadas, pruebas físicas o lógicas, herramientas utilizadas y solución aplicada..."
                required
                rows={4}
                value={draft.workDone}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 ${
                    workLength >= minimumWorkLength
                      ? 'text-[#1b6870]'
                      : 'text-[#43474c]'
                  }`}
                >
                  <Icon className="h-4 w-4" name="check" />
                  {workLength >= minimumWorkLength
                    ? 'Cumple con el criterio de detalle'
                    : `Mínimo ${minimumWorkLength} caracteres`}
                </span>
                <span className="text-[#74777d]">
                  Registrado bajo tu cuenta institucional
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#111c2d]" htmlFor="hours">
                  Horas invertidas en atención <span className="text-red-700">*</span>
                </label>
                <div className="flex items-center rounded-lg bg-[#f0f3ff] p-1">
                  <button
                    aria-label="Disminuir media hora"
                    className="flex h-10 w-10 items-center justify-center rounded hover:bg-[#d8e3fb]"
                    onClick={() => adjustHours(-0.5)}
                    type="button"
                  >
                    <Icon className="h-5 w-5" name="remove" />
                  </button>
                  <input
                    className="w-full bg-transparent text-center text-lg font-semibold text-[#111c2d] focus:outline-none"
                    id="hours"
                    min="0.5"
                    onChange={(event) => updateDraft('hours', event.target.value)}
                    required
                    step="0.5"
                    type="number"
                    value={draft.hours}
                  />
                  <button
                    aria-label="Aumentar media hora"
                    className="flex h-10 w-10 items-center justify-center rounded hover:bg-[#d8e3fb]"
                    onClick={() => adjustHours(0.5)}
                    type="button"
                  >
                    <Icon className="h-5 w-5" name="add" />
                  </button>
                  <span className="pr-3 text-xs text-[#43474c]">hrs</span>
                </div>
                <p className="text-[11px] text-[#43474c]">
                  Mínimo 0.5 horas · incrementos de 30 minutos.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#111c2d]" htmlFor="attendedAt">
                  Fecha y hora de atención <span className="text-red-700">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-[#f0f3ff] px-3 py-2">
                  <Icon className="h-5 w-5 shrink-0 text-[#74777d]" name="date" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#111c2d] focus:outline-none"
                    id="attendedAt"
                    onChange={(event) => updateDraft('attendedAt', event.target.value)}
                    required
                    type="datetime-local"
                    value={draft.attendedAt}
                  />
                  <button
                    className="text-xs font-medium text-[#1b6870] underline"
                    onClick={() => updateDraft('attendedAt', localDateTimeValue())}
                    type="button"
                  >
                    Ahora
                  </button>
                </div>
                <p className="text-[11px] text-[#43474c]">
                  Se guarda con la fecha y hora indicada.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#111c2d]">
                  Materiales o refacciones utilizadas{' '}
                  <span className="font-normal text-[#43474c]">(Opcional)</span>
                </label>
                <span className="text-[11px] text-[#43474c]">
                  {draft.materials.length} insumos
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg bg-[#f0f3ff] px-3 py-2.5 text-sm text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                  onChange={(event) => setMaterialInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addMaterial();
                    }
                  }}
                  placeholder="Ej. Patch Cord Cat6 2m (x2)"
                  value={materialInput}
                />
                <button
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#1b6870] hover:bg-[#e7eeff]"
                  onClick={addMaterial}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="add" />
                  Agregar
                </button>
              </div>
              {draft.materials.length > 0 ? (
                <ul className="flex flex-wrap gap-2 rounded-lg bg-[#f0f3ff] p-3">
                  {draft.materials.map((material, index) => (
                    <li
                      className="inline-flex max-w-full items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-xs text-[#111c2d] shadow-sm"
                      key={`${material}-${index}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#1b6870]" name="inventory" />
                      <span className="break-all">{material}</span>
                      <button
                        aria-label={`Quitar ${material}`}
                        className="shrink-0 text-[#74777d] hover:text-red-700"
                        onClick={() =>
                          updateDraft(
                            'materials',
                            draft.materials.filter((_, materialIndex) => materialIndex !== index),
                          )
                        }
                        type="button"
                      >
                        <Icon className="h-4 w-4" name="close" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[#43474c]">
                  Agrega refacciones o vales utilizados durante la atención.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#111c2d]" htmlFor="observations">
                Observaciones y recomendaciones preventivas{' '}
                <span className="font-normal text-[#43474c]">(Opcional)</span>
              </label>
              <textarea
                className="w-full resize-y rounded-lg bg-[#f0f3ff] p-4 text-sm text-[#111c2d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1b6870]/30"
                id="observations"
                onChange={(event) => updateDraft('observations', event.target.value)}
                placeholder="Ej. Se recomienda verificar el regulador de voltaje del rack..."
                rows={3}
                value={draft.observations}
              />
              <p className="text-[11px] text-[#43474c]">
                Estas observaciones se agregan a la bitácora técnica.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#111c2d]">
                Evidencias técnicas de la atención
              </span>
              <input
                accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
                className="sr-only"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
              <div
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                  isDragging
                    ? 'border-[#1b6870] bg-[#a6ebf4]/30'
                    : 'border-[#c4c6cd] bg-[#f0f3ff] hover:bg-[#e7eeff]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8e3fb] text-[#1b6870]">
                  <Icon className="h-6 w-6" name="upload" />
                </span>
                <p className="mt-3 text-sm font-medium text-[#111c2d]">
                  <span className="font-semibold text-[#1b6870]">Examina tus archivos</span>
                  {' '}o arrastra y suelta aquí
                </p>
                <p className="mt-1 text-xs text-[#43474c]">
                  JPG, PNG, WEBP, PDF o TXT · máximo 15 MB por archivo
                </p>
                <p className="mt-1 text-[11px] text-[#74777d]">
                  Los archivos seleccionados no se incluyen en el borrador local; se cargarán al guardar la intervención.
                </p>
              </div>
              {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {files.map((file, index) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#f0f3ff] p-3"
                      key={`${file.name}-${file.lastModified}-${index}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#132537]">{file.name}</p>
                        <p className="text-[11px] text-[#43474c]">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        aria-label={`Quitar archivo ${file.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#43474c] hover:bg-white hover:text-red-700"
                        onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        type="button"
                      >
                        <Icon className="h-4 w-4" name="close" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fileError && <p className="text-xs text-red-700" role="alert">{fileError}</p>}
            </div>

            <fieldset className="flex flex-col gap-2 pt-1">
              <legend className="mb-2 text-sm font-medium text-[#111c2d]">
                Resultado de la atención en sitio <span className="text-red-700">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  {
                    value: 'partial',
                    title: 'Intervención parcial',
                    description:
                      'La incidencia continúa en progreso; requiere refacciones adicionales o pruebas de estabilidad.',
                    icon: 'clock',
                  },
                  {
                    value: 'resolved',
                    title: 'Falla corregida en sitio',
                    description:
                      'El servicio quedó restablecido operativamente. Se solicitará validación institucional.',
                    icon: 'check',
                  },
                ] as const).map((result) => (
                  <label
                    className={`flex cursor-pointer flex-col rounded-xl p-4 transition ${
                      draft.result === result.value
                        ? 'bg-[#d8e3fb] ring-2 ring-[#1b6870]'
                        : 'bg-[#f0f3ff] hover:bg-[#e7eeff]'
                    }`}
                    key={result.value}
                  >
                    <span className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-[#1b6870]" name={result.icon} />
                      <input
                        checked={draft.result === result.value}
                        className="h-4 w-4 accent-[#1b6870]"
                        name="result"
                        onChange={() => updateDraft('result', result.value)}
                        type="radio"
                        value={result.value}
                      />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-[#111c2d]">
                      {result.title}
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-[#43474c]">
                      {result.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <footer className="flex flex-col justify-between gap-3 border-t border-[#e7eeff] pt-5 sm:flex-row sm:items-center">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e7eeff] px-5 py-2.5 text-sm font-medium text-[#43474c] transition hover:bg-[#d8e3fb]"
                href={`/tecnico_soporte/incidencias/${encodeURIComponent(incident._id)}`}
              >
                <Icon className="h-[18px] w-[18px]" name="close" />
                Cancelar
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b6870] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15575e] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Icon className="h-[18px] w-[18px]" name="save" />
                  {isSubmitting ? 'Guardando...' : 'Guardar intervención'}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#132537] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#293b4e] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting || resolutionDisabled}
                  onClick={(event) => {
                    const form = event.currentTarget.form;
                    if (form?.reportValidity()) {
                      finalizeRef.current = true;
                      form.requestSubmit();
                    }
                  }}
                  title={
                    draft.result !== 'resolved'
                      ? 'Selecciona “Falla corregida en sitio” para registrar la resolución.'
                      : 'Marca el ticket como resuelto y envía el caso a validación institucional.'
                  }
                  type="button"
                >
                  <Icon className="h-[18px] w-[18px]" name="assignment" />
                  {isSubmitting ? 'Procesando...' : 'Registrar resolución definitiva'}
                </button>
              </div>
            </footer>
          </section>
        </form>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                <Icon className="h-5 w-5" name="info" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#111c2d]">Resumen del caso</h2>
                <span className="text-[11px] text-[#43474c]">
                  {incident.codigo || incident._id}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <SummaryItem
                label="Docente / Reportante"
                value={incident.reportante.nombre || 'No disponible'}
                detail={incident.reportante.tipo}
              />
              <SummaryItem
                label="Ubicación"
                value={locationLabel(incident)}
                detail={incident.ubicacion.referencia || 'Ubicación registrada en el reporte'}
              />
              <SummaryItem
                label="Equipo institucional"
                value={equipmentName}
                detail={assetCode || categoryLabel(incident)}
              />
              <SummaryItem
                label="Prioridad y estado"
                value={`${priorityLabels[incident.prioridad]} · ${statusLabels[incident.estado]}`}
                detail={`Asignado a ${incident.tecnico_asignado?.nombre || usuario.nombre}`}
              />
            </div>
            <div className="flex h-28 items-end rounded-lg bg-gradient-to-br from-[#d8e3fb] via-[#e7eeff] to-[#a6ebf4]/70 p-3">
              <div className="flex w-full items-center justify-between rounded bg-[#132537]/85 px-3 py-2 text-white">
                <span className="truncate text-xs font-medium">
                  {locationLabel(incident)}
                </span>
                <Icon className="h-4 w-4 shrink-0" name="location" />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                <Icon className="h-5 w-5" name="clock" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#111c2d]">Historial previo de atención</h2>
                <span className="text-[11px] text-[#43474c]">
                  {timeline.length} {timeline.length === 1 ? 'evento registrado' : 'eventos registrados'}
                </span>
              </div>
            </div>
            {timeline.length > 0 ? (
              <ol className="relative ml-2 flex flex-col gap-4 border-l-2 border-[#d8e3fb] pl-5">
                {timeline.slice(0, 4).map((item, index) => (
                  <li className="relative" key={`${item.fecha}-${index}`}>
                    <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1b6870] text-white ring-4 ring-white">
                      <Icon className="h-2.5 w-2.5" name={item.accion === 'creacion' ? 'flag' : 'check'} />
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#111c2d]">
                        {item.accion === 'asignacion'
                          ? 'Asignación a cuadrilla'
                          : item.accion === 'creacion'
                            ? 'Registro inicial'
                            : 'Intervención técnica'}
                      </p>
                      <time className="shrink-0 text-[10px] text-[#43474c]">
                        {new Date(item.fecha).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#43474c]">
                      {item.comentario}
                    </p>
                    <span className="mt-1 block text-[10px] text-[#1b6870]">
                      Por: {item.autor || 'Sistema'}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-lg bg-[#f0f3ff] p-3 text-xs text-[#43474c]">
                No hay eventos previos en la bitácora.
              </p>
            )}
            <p className="flex items-start gap-2 rounded-lg bg-[#f0f3ff] p-3 text-[11px] leading-relaxed text-[#43474c]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1b6870]" name="shield" />
              Esta intervención se agrega a la bitácora institucional de la incidencia.
            </p>
          </section>

          <section className="flex flex-col gap-2 rounded-xl bg-[#e7eeff] p-5 text-[#111c2d]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-[#1b6870]">
                Cumplimiento de SLA
              </span>
              <span className="rounded bg-[#d8e3fb] px-2 py-1 text-[11px] font-mono">
                {incident.prioridad === 'critica' || incident.prioridad === 'alta'
                  ? '4 horas'
                  : '8 horas'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#43474c]">
            Atiende y documenta el caso conforme al plazo asignado. El tiempo SLA restante no está disponible en los datos de esta incidencia.
            </p>
            <p className="text-[10px] text-[#43474c]">
            Prioridad: {priorityLabels[incident.prioridad]} · SLA restante: no disponible
            </p>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#293b4e] text-xs font-bold text-white">
                {initials || 'T'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111c2d]">
                  {usuario.nombre}
                </p>
                <p className="text-[11px] text-[#43474c]">Personal técnico responsable</p>
              </div>
            </div>
            <div aria-live="polite" className="mt-3 border-t border-[#e7eeff] pt-3 text-[11px] text-[#43474c]">
              {draftNotice
                ? draftNotice
                : draftSavedAt && draftDirty
                  ? `Borrador respaldado localmente a las ${draftSavedAt.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Los cambios se respaldan localmente mientras editas.'}
            </div>
          </section>

          <Link
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1b6870] hover:bg-[#e7eeff]"
            href={`/tecnico_soporte/incidencias/${encodeURIComponent(incident._id)}`}
          >
            <Icon className="h-4 w-4" name="back" />
            Volver al detalle
          </Link>
        </aside>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg bg-[#f0f3ff] p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#43474c]">
        {label}
      </span>
      <p className="mt-1 text-xs font-medium text-[#111c2d]">{value}</p>
      {detail && <p className="mt-0.5 text-[11px] text-[#43474c]">{detail}</p>}
    </div>
  );
}
