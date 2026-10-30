'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { AuthLogoutButton } from '@/components/AuthLogoutButton';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, USE_MOCKS, endpoints } from '@/config/endpoints';
import { getRoleHomePath, AUTH_TOKEN_STORAGE_KEY } from '@/lib/authSession';
import { ApiError, httpClient } from '@/lib/httpClient';
import type { CategoriaIncidencia, CrearIncidenciaInput } from '@/types/incidencia';

const navigation = [
  { href: '/reportante', label: 'Panel principal', icon: 'dashboard' },
  { href: '/reportante/registrar', label: 'Nueva incidencia', icon: 'add' },
  { href: '/reportante/incidencias', label: 'Mis incidencias', icon: 'receipt' },
];

const categories: {
  id: CategoriaIncidencia;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'infraestructura',
    title: 'Infraestructura',
    description: 'Mobiliario, luz, clima, puertas',
    icon: 'building',
  },
  {
    id: 'computo_redes',
    title: 'Cómputo y redes',
    description: 'Equipos, WiFi, cableado, switch',
    icon: 'devices',
  },
  {
    id: 'academico',
    title: 'Académico',
    description: 'Plataforma virtual, actas, licencias',
    icon: 'school',
  },
];

const buildings = [
  { id: 'edif-b', label: 'Edificio B - Laboratorios de Cómputo' },
  { id: 'edif-a', label: 'Edificio A - Aulas Generales' },
  { id: 'rectoria', label: 'Edificio de Rectoría y Administración' },
  { id: 'biblioteca', label: 'Biblioteca Central y Salas de Estudio' },
  { id: 'talleres', label: 'Edificio C - Talleres Especiales' },
];

const equipmentOptions = [
  { id: 'red', label: 'Red institucional / Acceso WiFi' },
  { id: 'pc', label: 'PC de escritorio / Torre UTM' },
  { id: 'audio_video', label: 'Proyector / Audio multimedia' },
  { id: 'impresora', label: 'Impresora o escáner compartido' },
  { id: 'otro', label: 'Software o aplicativo interno' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

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
    chevron: <path d="m9 18 6-6-6-6" />,
    description: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18M5 21V5l7-3 7 3v16M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-5h4v5" />
      </>
    ),
    devices: (
      <>
        <rect x="3" y="4" width="13" height="12" rx="2" />
        <path d="M7 20h5m-2-4v4m7-11h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      </>
    ),
    school: (
      <>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v5c3 2 7 2 10 0v-5m5-2v7" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    verified: (
      <>
        <path d="m12 3 2.4 1.3 2.7-.1 1.2 2.4 2.2 1.6-.6 2.6.6 2.6-2.2 1.6-1.2 2.4-2.7-.1L12 19l-2.4-1.3-2.7.1-1.2-2.4-2.2-1.6.6-2.6-.6-2.6 2.2-1.6 1.2-2.4 2.7.1L12 3Z" />
        <path d="m9 11 2 2 4-4" />
      </>
    ),
    attach: (
      <>
        <path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
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
    check: <path d="m5 12 4 4L19 6" />,
    assignment: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M9 5V3h6v2m-7 6h8m-8 4h8" />
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

function getCreatedIncidentId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record._id === 'string') return record._id;
  if (typeof record.id === 'string') return record.id;
  if (record.incidencia && typeof record.incidencia === 'object') {
    const incidence = record.incidencia as Record<string, unknown>;
    if (typeof incidence._id === 'string') return incidence._id;
    if (typeof incidence.id === 'string') return incidence.id;
  }
  if (record.data && typeof record.data === 'object') {
    return getCreatedIncidentId(record.data);
  }
  return null;
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function RegistrarIncidenciaPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<CategoriaIncidencia>('computo_redes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState('audio_video');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    setFileError(null);
    if (selected.length === 0) return;

    const invalid = selected.find(
      (file) =>
        !ACCEPTED_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE,
    );
    if (invalid) {
      setFileError(
        !ACCEPTED_TYPES.includes(invalid.type)
          ? `${invalid.name}: formato no permitido. Usa JPG, PNG, WEBP o PDF.`
          : `${invalid.name}: el tamaño supera el límite de 10 MB.`,
      );
      return;
    }

    const uniqueFiles = selected.filter(
      (file) =>
        !files.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        ),
    );
    if (files.length + uniqueFiles.length > MAX_FILES) {
      setFileError(`Puedes adjuntar hasta ${MAX_FILES} archivos.`);
      return;
    }
    setFiles((current) => [...current, ...uniqueFiles]);
  }

  function resetForm() {
    setCategory('computo_redes');
    setTitle('');
    setDescription('');
    setEquipment('audio_video');
    setBuilding('');
    setFloor('');
    setRoom('');
    setFiles([]);
    setFileError(null);
  }

  function cancelForm() {
    if (
      (title.trim() || description.trim() || building || floor || room || files.length > 0) &&
      !window.confirm('¿Deseas descartar los cambios ingresados en este reporte?')
    ) {
      return;
    }
    router.push('/reportante');
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (USE_MOCKS) {
      setSubmitError('El registro de incidencias no está disponible en modo de datos simulados.');
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedBuilding = buildings.find((item) => item.id === building);
      if (!selectedBuilding) {
        throw new Error('Selecciona el edificio o complejo donde ocurre el problema.');
      }

      const input: CrearIncidenciaInput = {
        titulo: title.trim(),
        categoria: category,
        descripcion: description.trim(),
        ubicacion: {
          edificio: selectedBuilding.label,
          piso: floor,
          aula: room.trim(),
        },
        ...(category === 'computo_redes'
          ? { detalle_especifico: { subsistema: equipment } }
          : {}),
      };

      const created = await httpClient<unknown>(endpoints.incidencias.list, {
        method: 'POST',
        body: input,
      });
      const incidentId = getCreatedIncidentId(created);
      if (!incidentId) {
        throw new Error('El servidor creó una respuesta sin identificador de incidencia.');
      }

      const uploadErrors: string[] = [];
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('archivo', file);
          const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
          const response = await fetch(
            `${API_BASE_URL}${endpoints.incidencias.evidencias(incidentId)}`,
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
              body && typeof body === 'object' && 'message' in body &&
              typeof body.message === 'string'
                ? body.message
                : `Error ${response.status}`;
            throw new Error(message);
          }
        } catch (error) {
          uploadErrors.push(
            `${file.name}: ${error instanceof Error ? error.message : 'no se pudo subir'}`,
          );
        }
      }

      const code =
        created &&
        typeof created === 'object' &&
        'codigo' in created &&
        typeof created.codigo === 'string'
          ? created.codigo
          : incidentId;
      setSuccess(
        uploadErrors.length > 0
          ? `Incidencia ${code} registrada, pero algunos archivos no se pudieron subir: ${uploadErrors.join('; ')}`
          : `¡Incidencia registrada con éxito! Folio asignado: ${code}.`,
      );
      resetForm();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'No se pudo registrar la incidencia. Inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const reportanteName = usuario.nombre || 'Reportante';

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
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-7 sm:px-6 lg:px-8">
            <section className="flex flex-col gap-4">
              <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-xs text-[#43474c]">
                <Link className="hover:text-[#1b6870]" href="/reportante">Panel principal</Link>
                <Icon className="h-3.5 w-3.5 text-[#74777d]" name="chevron" />
                <span aria-current="page" className="font-semibold text-[#111c2d]">Nueva incidencia</span>
              </nav>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#111c2d] sm:text-[30px]">
                    Registrar nueva incidencia
                  </h1>
                  <p className="pt-1 text-sm text-[#43474c]">
                    Describe el problema para que pueda ser atendido con agilidad por el personal técnico.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start rounded-lg bg-[#e7eeff] px-4 py-2 md:self-auto">
                  <Icon className="h-5 w-5 text-[#1b6870]" name="assignment" />
                  <span className="text-xs font-medium text-[#111c2d]">Campus Central — Reporte Directo</span>
                </div>
              </div>
            </section>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {submitError}
              </div>
            )}
            {success && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between" role="status">
                <span>{success}</span>
                <Link className="shrink-0 font-semibold underline" href="/reportante">
                  Volver al panel
                </Link>
              </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={submitForm}>
              <div className="grid items-start gap-6 lg:grid-cols-12">
                <section className="flex flex-col gap-6 rounded-xl bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                        <Icon className="h-5 w-5" name="description" />
                      </span>
                      <div>
                        <h2 className="text-base font-semibold text-[#111c2d]">Información del problema</h2>
                        <p className="text-[11px] text-[#43474c]">Detalles esenciales de la falla o requerimiento</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-[#f0f3ff] px-2 py-1 text-[11px] text-[#43474c]">Paso 1 de 2</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[#111c2d]" htmlFor="incident-title">
                        Título del incidente <span className="text-red-600">*</span>
                      </label>
                      <span className="text-[11px] text-[#74777d]">Sé conciso y claro</span>
                    </div>
                    <input
                      className="h-11 w-full rounded-lg bg-[#f0f3ff] px-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                      id="incident-title"
                      maxLength={120}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ej. Proyector no enciende o sin señal de video"
                      required
                      value={title}
                    />
                  </div>

                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-sm font-medium text-[#111c2d]">
                      Categoría <span className="text-red-600">*</span>
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {categories.map((item) => {
                        const selected = category === item.id;
                        return (
                          <button
                            aria-pressed={selected}
                            className={`flex min-h-32 flex-col items-start rounded-lg p-4 text-left transition ${
                              selected
                                ? 'bg-[#1b6870] text-white shadow-sm'
                                : 'bg-[#f0f3ff] text-[#111c2d] hover:bg-[#e7eeff]'
                            }`}
                            key={item.id}
                            onClick={() => setCategory(item.id)}
                            type="button"
                          >
                            <span className="mb-3 flex w-full items-center justify-between">
                              <Icon
                                className={`h-[22px] w-[22px] ${selected ? 'text-white' : 'text-[#1b6870]'}`}
                                name={item.icon}
                              />
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                selected ? 'bg-white text-[#1b6870]' : 'bg-[#d8e3fb]'
                              }`}>
                                {selected && <Icon className="h-3 w-3" name="check" />}
                              </span>
                            </span>
                            <span className="text-sm font-semibold">{item.title}</span>
                            <span className={`mt-1 text-[11px] ${selected ? 'text-[#a9eef7]' : 'text-[#43474c]'}`}>
                              {item.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {category === 'computo_redes' && (
                    <div className="flex flex-col gap-4 rounded-lg bg-[#f0f3ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-[22px] w-[22px] shrink-0 text-[#1b6870]" name="devices" />
                        <div>
                          <p className="text-sm font-semibold text-[#111c2d]">Especificación de equipo o servicio</p>
                          <p className="text-[11px] text-[#43474c]">Selecciona el subsistema principal implicado</p>
                        </div>
                      </div>
                      <select
                        className="h-10 w-full rounded-lg bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#1b6870] sm:w-auto sm:min-w-[220px]"
                        onChange={(event) => setEquipment(event.target.value)}
                        value={equipment}
                      >
                        {equipmentOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-[#111c2d]" htmlFor="incident-description">
                        Descripción detallada <span className="text-red-600">*</span>
                      </label>
                      <span className="text-[11px] text-[#74777d]">{description.length} / 600 caracteres</span>
                    </div>
                    <textarea
                      className="min-h-[140px] w-full resize-y rounded-lg bg-[#f0f3ff] p-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                      id="incident-description"
                      maxLength={600}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Detalla lo ocurrido, mensajes de error observados, software en uso o comportamiento anormal para acelerar el diagnóstico..."
                      required
                      rows={5}
                      value={description}
                    />
                    <p className="flex items-center gap-2 pt-1 text-[11px] text-[#43474c]">
                      <Icon className="h-4 w-4 shrink-0 text-[#1b6870]" name="info" />
                      Evita incluir contraseñas o datos personales sensibles en este campo.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-5 lg:col-span-5">
                  <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                        <Icon className="h-5 w-5" name="location" />
                      </span>
                      <div>
                        <h2 className="text-base font-semibold text-[#111c2d]">Ubicación física</h2>
                        <p className="text-[11px] text-[#43474c]">Lugar exacto del campus donde se requiere revisión</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#111c2d]" htmlFor="building">
                        Edificio o complejo <span className="text-red-600">*</span>
                      </label>
                      <select
                        className="h-11 w-full rounded-lg bg-[#f0f3ff] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                        id="building"
                        onChange={(event) => setBuilding(event.target.value)}
                        required
                        value={building}
                      >
                        <option disabled value="">Selecciona un edificio...</option>
                        {buildings.map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#111c2d]" htmlFor="floor">
                          Nivel / Piso <span className="text-red-600">*</span>
                        </label>
                        <select
                          className="h-11 w-full rounded-lg bg-[#f0f3ff] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                          id="floor"
                          onChange={(event) => setFloor(event.target.value)}
                          required
                          value={floor}
                        >
                          <option disabled value="">Selecciona...</option>
                          <option value="Planta Baja">Planta Baja</option>
                          <option value="Planta Alta (Nivel 1)">Planta Alta (Nivel 1)</option>
                          <option value="Piso 2">Piso 2</option>
                          <option value="Sótano técnico">Sótano técnico</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#111c2d]" htmlFor="room">
                          Espacio / Aula <span className="text-red-600">*</span>
                        </label>
                        <input
                          className="h-11 w-full rounded-lg bg-[#f0f3ff] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#1b6870]"
                          id="room"
                          onChange={(event) => setRoom(event.target.value)}
                          placeholder="Ej. Aula Magna 2"
                          required
                          value={room}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[#e7eeff] p-3 text-[11px] text-[#43474c]">
                      <Icon className="h-[18px] w-[18px] shrink-0 text-[#1b6870]" name="verified" />
                      Ubicación del Campus Central
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7eeff] text-[#1b6870]">
                          <Icon className="h-5 w-5" name="attach" />
                        </span>
                        <div>
                          <h2 className="text-base font-semibold text-[#111c2d]">Evidencias fotográficas</h2>
                          <p className="text-[11px] text-[#43474c]">Adjunta capturas o fotografías (opcional)</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-[#f0f3ff] px-2 py-1 text-[11px] text-[#43474c]">
                        {files.length} / {MAX_FILES}
                      </span>
                    </div>

                    <input
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="hidden"
                      multiple
                      onChange={addFiles}
                      ref={fileInputRef}
                      type="file"
                    />
                    <button
                      className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#c4c6cd] bg-[#f0f3ff]/70 p-5 text-center transition hover:bg-[#e7eeff] focus:outline-none focus:ring-2 focus:ring-[#1b6870]"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1b6870] shadow-sm">
                        <Icon className="h-6 w-6" name="upload" />
                      </span>
                      <span className="text-sm font-semibold text-[#111c2d]">
                        Arrastra tus archivos o <span className="text-[#1b6870] underline">selecciónalos</span>
                      </span>
                      <span className="mt-1 text-[11px] text-[#43474c]">
                        JPG, PNG, WEBP o PDF (máx. 10 MB por archivo)
                      </span>
                    </button>
                    {fileError && <p className="text-xs text-red-700" role="alert">{fileError}</p>}
                    {files.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {files.map((file, index) => (
                          <li
                            className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-[#f0f3ff] px-3 py-2"
                            key={`${file.name}-${file.lastModified}-${index}`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Icon className="h-5 w-5 shrink-0 text-[#1b6870]" name="attach" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-[#111c2d]">{file.name}</p>
                                <p className="text-[11px] text-[#43474c]">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              aria-label={`Eliminar ${file.name}`}
                              className="rounded p-1 text-[#43474c] hover:bg-red-100 hover:text-red-700"
                              onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                              type="button"
                            >
                              <Icon className="h-[18px] w-[18px]" name="close" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-[#43474c]">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1b6870]" name="info" />
                  Tu reporte será asignado automáticamente al departamento técnico correspondiente del Campus Central.
                </p>
                <div className="flex w-full justify-end gap-3 sm:w-auto">
                  <button
                    className="h-10 rounded-lg bg-[#f0f3ff] px-5 text-sm font-medium text-[#111c2d] transition hover:bg-[#e7eeff]"
                    onClick={cancelForm}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1b6870] px-6 text-sm font-medium text-white shadow-sm transition hover:bg-[#15575e] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    <Icon className={`h-5 w-5 ${isSubmitting ? 'animate-pulse' : ''}`} name={isSubmitting ? 'assignment' : 'send'} />
                    {isSubmitting ? 'Procesando...' : 'Enviar reporte'}
                  </button>
                </div>
              </div>
            </form>

            <footer className="pb-2 text-center text-[11px] tracking-wide text-[#43474c]/60" id="help">
              Universidad Tecnológica de la Mixteca — Datos de demostración para entorno académico UTM
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
