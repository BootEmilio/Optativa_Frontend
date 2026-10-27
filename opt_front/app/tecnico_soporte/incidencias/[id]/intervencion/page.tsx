'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getTecnicoIncidenciaServerSnapshot,
  getTecnicoIncidenciaSnapshot,
  saveTecnicoIntervencion,
  subscribeToTecnicoIncidencias,
} from '@/lib/tecnicoIncidencias';
import type { Incidencia } from '@/types/incidencia';

const actividades = [
  { value: 'diagnostico', label: 'Diagnóstico en sitio', detail: 'Pruebas físicas y mediciones' },
  { value: 'reemplazo', label: 'Reemplazo hardware/cableado', detail: 'Sustitución de componentes' },
  { value: 'mantenimiento', label: 'Mantenimiento correctivo', detail: 'Limpieza y reacondicionamiento' },
  { value: 'configuracion', label: 'Configuración lógica', detail: 'VLANs, puertos y firmware' },
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_FILES = new Set(['image/jpeg', 'image/png', 'application/pdf', 'text/plain']);

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-[#111C2D]">
      {children}
    </label>
  );
}

export default function TecnicoIntervencionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const incidenciaSnapshot = useSyncExternalStore(
    subscribeToTecnicoIncidencias,
    () => getTecnicoIncidenciaSnapshot(params.id),
    () => getTecnicoIncidenciaServerSnapshot(params.id),
  );
  const incidencia = useMemo(() => JSON.parse(incidenciaSnapshot) as Incidencia | null, [incidenciaSnapshot]);
  const [actividad, setActividad] = useState('reemplazo');
  const [trabajo, setTrabajo] = useState('');
  const [horas, setHoras] = useState(1);
  const [fechaAtencion, setFechaAtencion] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [materiales, setMateriales] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [resultado, setResultado] = useState<'parcial' | 'resuelta'>('parcial');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFechaAtencion(localDateTimeValue());
      try {
        const savedDraft = window.localStorage.getItem(`utm-tecnico-intervencion-borrador:${params.id}`);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft) as {
            actividad?: string;
            trabajo?: string;
            horas?: number;
            fechaAtencion?: string;
            materiales?: string[];
            observaciones?: string;
            resultado?: 'parcial' | 'resuelta';
          };
          if (draft.actividad) setActividad(draft.actividad);
          if (draft.trabajo) setTrabajo(draft.trabajo);
          if (draft.horas) setHoras(draft.horas);
          if (draft.fechaAtencion) setFechaAtencion(draft.fechaAtencion);
          if (draft.materiales) setMateriales(draft.materiales);
          if (draft.observaciones) setObservaciones(draft.observaciones);
          if (draft.resultado) setResultado(draft.resultado);
        }
      } catch (draftError) {
        console.error('No se pudo recuperar el borrador de intervención.', draftError);
        setError('No se pudo recuperar el borrador guardado en este dispositivo.');
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params.id]);

  const ubicacion = useMemo(() => {
    if (!incidencia) return '';
    return [incidencia.ubicacion.edificio, incidencia.ubicacion.aula, incidencia.ubicacion.piso]
      .filter(Boolean)
      .join(' — ');
  }, [incidencia]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setError('');
    const selected = Array.from(event.target.files ?? []);
    const invalid = selected.find((file) => !ACCEPTED_FILES.has(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setError(`${invalid.name}: selecciona JPG, PNG, PDF o TXT de hasta 15 MB.`);
      event.target.value = '';
      return;
    }
    setArchivos((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function addMaterial() {
    const value = materialInput.trim();
    if (!value) return;
    setMateriales((current) => [...current, value]);
    setMaterialInput('');
  }

  function save(draftOnly: boolean) {
    if (!incidencia) return;
    setError('');

    if (draftOnly) {
      try {
        window.localStorage.setItem(
          `utm-tecnico-intervencion-borrador:${incidencia._id}`,
          JSON.stringify({ actividad, trabajo, horas, fechaAtencion, materiales, observaciones, resultado }),
        );
        setMensaje('Borrador guardado localmente.');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el borrador local.');
      }
      return;
    }

    if (trabajo.trim().length < 20) {
      setError('Describe el trabajo realizado con al menos 20 caracteres.');
      return;
    }
    if (!Number.isFinite(horas) || horas < 0.5 || Math.round(horas * 2) !== horas * 2) {
      setError('Las horas deben ser 0.5 o más, en incrementos de 30 minutos.');
      return;
    }
    if (!fechaAtencion) {
      setError('Indica la fecha y hora de atención.');
      return;
    }

    setGuardando(true);
    try {
      const actividadLabel = actividades.find((item) => item.value === actividad)?.label ?? 'Intervención técnica';
      const comentario = [
        `${actividadLabel}: ${trabajo.trim()}`,
        materiales.length ? `Materiales utilizados: ${materiales.join(', ')}.` : '',
        observaciones.trim() ? `Observaciones: ${observaciones.trim()}` : '',
        archivos.length ? `Evidencias adjuntas: ${archivos.map((file) => file.name).join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' ');

      saveTecnicoIntervencion(
        incidencia._id,
        {
          fecha: new Date(fechaAtencion).toISOString(),
          autor: incidencia.tecnico_asignado?.nombre ?? 'Personal técnico',
          accion: resultado === 'resuelta' ? 'resolucion' : 'comentario',
          estado_nuevo: resultado === 'resuelta' ? 'resuelta' : 'en_proceso',
          comentario,
          horas,
        },
        horas,
        resultado === 'resuelta' ? 'resuelta' : 'en_proceso',
      );
      window.localStorage.removeItem(`utm-tecnico-intervencion-borrador:${incidencia._id}`);
      router.push(`/tecnico_soporte/incidencias/${incidencia._id}?intervencion=guardada`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar la intervención.');
    } finally {
      setGuardando(false);
    }
  }

  if (!incidencia) {
    return (
      <div className="mx-auto max-w-[900px] py-10">
        <div className="rounded-3xl border border-dashed border-[#D5DDE7] bg-white p-10 text-center text-[#43474C]">
          No se encontró la incidencia solicitada.
          <div className="mt-4">
            <Link href="/tecnico_soporte/incidencias" className="font-semibold text-[#1B6870] hover:underline">
              Volver a incidencias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reportado = formatDate(incidencia.fecha_creacion);

  return (
    <div className="mx-auto max-w-[1280px] pb-10 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-xs text-[#43474C]">
          <Link href="/tecnico_soporte" className="hover:text-[#1B6870]">Panel principal</Link>
          <span>/</span>
          <Link href="/tecnico_soporte/incidencias" className="hover:text-[#1B6870]">Incidencias asignadas</Link>
          <span>/</span>
          <Link href={`/tecnico_soporte/incidencias/${incidencia._id}`} className="hover:text-[#1B6870]">{incidencia.codigo}</Link>
          <span>/</span>
          <span className="font-semibold text-[#1B6870]">Registrar intervención</span>
        </nav>
        <Link href={`/tecnico_soporte/incidencias/${incidencia._id}`} className="text-sm font-semibold text-[#1B6870] hover:underline">
          ← Volver al detalle del ticket
        </Link>
      </div>

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#111C2D]">Registrar intervención técnica</h1>
        <p className="mt-1 text-sm text-[#43474C]">Documenta las acciones operativas, diagnóstico y refacciones utilizadas en la atención en sitio.</p>
      </header>

      {mensaje && <p role="status" className="mt-4 rounded-xl bg-[#EAF6F0] px-4 py-3 text-sm text-[#1D6A4E]">{mensaje}</p>}

      <section className="mt-5 rounded-2xl border border-[#E7EEFF] bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7EEFF] text-[#1B6870]">⌘</div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="rounded bg-[#E7EEFF] px-2 py-1 text-[#111C2D]">{incidencia.codigo}</span>
                <span className="rounded-full bg-[#EAF6F0] px-2.5 py-1 text-[#1D6A4E]">{incidencia.estado.replace('_', ' ')}</span>
                <span className="rounded-full bg-[#FDECEC] px-2.5 py-1 text-[#9C2D2D]">Prioridad {incidencia.prioridad}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-[#111C2D]">{incidencia.titulo}</h2>
              <p className="mt-1 text-xs text-[#43474C]">{ubicacion} · Reportado {reportado}</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#F7F9FF] px-4 py-3 text-sm">
            <p className="text-xs text-[#43474C]">Técnico responsable</p>
            <p className="mt-1 font-semibold text-[#111C2D]">{incidencia.tecnico_asignado?.nombre ?? 'Sin asignar'}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <form
          className="space-y-5 lg:col-span-8"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            save(false);
          }}
        >
          <section className="space-y-5 rounded-2xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#111C2D]">Detalle de la intervención operativa</h2>
                <p className="text-xs text-[#43474C]">Información requerida para la bitácora técnica</p>
              </div>
              <span className="rounded-full bg-[#E7EEFF] px-3 py-1 text-xs font-semibold text-[#1B6870]">Paso 1 de 2</span>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[#111C2D]">Tipo de actividad técnica <span className="text-red-600">*</span></legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {actividades.map((item) => (
                  <label key={item.value} className={`flex cursor-pointer gap-3 rounded-xl p-3 transition ${actividad === item.value ? 'bg-[#1B6870] text-white' : 'bg-[#F7F9FF] text-[#111C2D] hover:bg-[#EEF3FF]'}`}>
                    <input type="radio" name="actividad" value={item.value} checked={actividad === item.value} onChange={() => setActividad(item.value)} className="accent-[#1B6870]" />
                    <span><span className="block text-sm font-semibold">{item.label}</span><span className={`mt-1 block text-xs ${actividad === item.value ? 'text-white/80' : 'text-[#43474C]'}`}>{item.detail}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel htmlFor="trabajo">Trabajo realizado <span className="text-red-600">*</span></FieldLabel>
                <span className="text-xs text-[#43474C]">{trabajo.length} caracteres</span>
              </div>
              <textarea id="trabajo" required minLength={20} rows={4} value={trabajo} onChange={(event) => setTrabajo(event.target.value)} placeholder="Describe las acciones, pruebas, herramientas utilizadas y solución preliminar aplicada..." className="w-full resize-y rounded-xl border border-transparent bg-[#F7F9FF] p-4 text-sm text-[#111C2D] outline-none focus:border-[#1B6870] focus:ring-2 focus:ring-[#1B6870]/15" />
              <p className="mt-1 text-xs text-[#43474C]">Describe el trabajo con al menos 20 caracteres.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="horas">Horas invertidas <span className="text-red-600">*</span></FieldLabel>
                <div className="mt-2 flex items-center rounded-xl bg-[#F7F9FF] p-1">
                  <button type="button" onClick={() => setHoras((value) => Math.max(0.5, value - 0.5))} aria-label="Disminuir horas" className="h-10 w-10 rounded-lg hover:bg-[#E7EEFF]">−</button>
                  <input id="horas" type="number" min="0.5" step="0.5" required value={horas} onChange={(event) => setHoras(Number(event.target.value))} className="w-full bg-transparent text-center text-lg font-semibold outline-none" />
                  <button type="button" onClick={() => setHoras((value) => value + 0.5)} aria-label="Aumentar horas" className="h-10 w-10 rounded-lg hover:bg-[#E7EEFF]">+</button>
                  <span className="pr-3 text-xs text-[#43474C]">hrs</span>
                </div>
                <p className="mt-1 text-xs text-[#43474C]">Mínimo 0.5 horas, incrementos de 30 minutos.</p>
              </div>
              <div>
                <FieldLabel htmlFor="fecha">Fecha y hora de atención <span className="text-red-600">*</span></FieldLabel>
                <input id="fecha" type="datetime-local" required value={fechaAtencion} onChange={(event) => setFechaAtencion(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl bg-[#F7F9FF] px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B6870]/15" />
                <p className="mt-1 text-xs text-[#43474C]">Hora local del dispositivo.</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <FieldLabel htmlFor="material">Materiales o refacciones <span className="font-normal text-[#43474C]">(Opcional)</span></FieldLabel>
              </div>
              <div className="flex gap-2">
                <input id="material" value={materialInput} onChange={(event) => setMaterialInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addMaterial(); } }} placeholder="Código o descripción del material" className="min-h-11 flex-1 rounded-xl bg-[#F7F9FF] px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B6870]/15" />
                <button type="button" onClick={addMaterial} className="rounded-xl bg-[#E7EEFF] px-4 text-sm font-semibold text-[#1B6870]">Agregar</button>
              </div>
              {materiales.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{materiales.map((material, index) => <li key={`${material}-${index}`} className="inline-flex items-center gap-2 rounded-lg bg-[#F7F9FF] px-3 py-2 text-xs text-[#111C2D]">{material}<button type="button" onClick={() => setMateriales((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Eliminar ${material}`} className="font-bold text-[#9C2D2D]">×</button></li>)}</ul>}
            </div>

            <div>
              <FieldLabel htmlFor="observaciones">Observaciones y recomendaciones <span className="font-normal text-[#43474C]">(Opcional)</span></FieldLabel>
              <textarea id="observaciones" rows={2} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Recomendaciones preventivas o notas adicionales..." className="mt-2 w-full rounded-xl bg-[#F7F9FF] p-4 text-sm outline-none focus:ring-2 focus:ring-[#1B6870]/15" />
            </div>

            <div>
              <FieldLabel htmlFor="evidencias">Evidencias técnicas <span className="font-normal text-[#43474C]">(Opcional)</span></FieldLabel>
              <label htmlFor="evidencias" className="mt-2 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#D5DDE7] bg-[#F7F9FF] px-4 py-7 text-center hover:border-[#1B6870]">
                <span className="text-sm font-semibold text-[#1B6870]">Selecciona archivos o arrastra y suelta aquí</span>
                <span className="mt-1 text-xs text-[#43474C]">JPG, PNG, PDF o TXT · máximo 15 MB por archivo</span>
                <input id="evidencias" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.txt" onChange={handleFiles} className="sr-only" />
              </label>
              {archivos.length > 0 && <ul className="mt-2 space-y-2">{archivos.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-[#F7F9FF] px-3 py-2 text-xs"><span className="truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span><button type="button" onClick={() => setArchivos((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="ml-3 text-red-700">Quitar</button></li>)}</ul>}
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[#111C2D]">Resultado de la atención en sitio <span className="text-red-600">*</span></legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-xl p-4 ${resultado === 'parcial' ? 'bg-[#E7EEFF] ring-2 ring-[#1B6870]' : 'bg-[#F7F9FF]'}`}>
                  <input type="radio" name="resultado" checked={resultado === 'parcial'} onChange={() => setResultado('parcial')} className="accent-[#1B6870]" />
                  <span className="ml-2 font-semibold text-[#111C2D]">Intervención parcial</span>
                  <p className="mt-2 text-xs leading-5 text-[#43474C]">La incidencia continúa en progreso y requiere refacciones o pruebas adicionales.</p>
                </label>
                <label className={`cursor-pointer rounded-xl p-4 ${resultado === 'resuelta' ? 'bg-[#E7EEFF] ring-2 ring-[#1B6870]' : 'bg-[#F7F9FF]'}`}>
                  <input type="radio" name="resultado" checked={resultado === 'resuelta'} onChange={() => setResultado('resuelta')} className="accent-[#1B6870]" />
                  <span className="ml-2 font-semibold text-[#111C2D]">Falla corregida en sitio</span>
                  <p className="mt-2 text-xs leading-5 text-[#43474C]">El servicio quedó restablecido operativamente y se solicitará visto bueno.</p>
                </label>
              </div>
            </fieldset>

            {error && <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#9C2D2D]">{error}</p>}
            <div className="flex flex-col justify-between gap-3 border-t border-[#EEF3FF] pt-4 sm:flex-row">
              <Link href={`/tecnico_soporte/incidencias/${incidencia._id}`} className="rounded-xl bg-[#E7EEFF] px-5 py-3 text-center text-sm font-semibold text-[#273A4E]">Cancelar</Link>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => save(true)} className="rounded-xl bg-[#1B6870] px-5 py-3 text-sm font-semibold text-white hover:opacity-95">Guardar borrador</button>
                <button type="submit" disabled={guardando} className="rounded-xl bg-[#293B4E] px-5 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">{guardando ? 'Guardando…' : resultado === 'resuelta' ? 'Registrar resolución definitiva' : 'Guardar intervención'}</button>
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-5 lg:col-span-4">
          <section className="space-y-4 rounded-2xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111C2D]">Resumen del caso</h2>
            <p className="text-xs font-semibold text-[#1B6870]">{incidencia.codigo}</p>
            <div className="rounded-xl bg-[#F7F9FF] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#43474C]">Reportante</p>
              <p className="mt-1 text-sm font-semibold text-[#111C2D]">{incidencia.reportante.nombre}</p>
              <p className="mt-1 text-xs text-[#43474C]">{incidencia.reportante.tipo}</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FF] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#43474C]">Ubicación</p>
              <p className="mt-1 text-sm font-semibold text-[#111C2D]">{ubicacion}</p>
              {incidencia.ubicacion.referencia && <p className="mt-1 text-xs text-[#43474C]">{incidencia.ubicacion.referencia}</p>}
            </div>
            <div className="rounded-xl bg-[#F7F9FF] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#43474C]">Equipo o problema reportado</p>
              <p className="mt-1 text-sm font-semibold text-[#111C2D]">{String(incidencia.detalle_especifico?.equipo ?? incidencia.titulo)}</p>
              <p className="mt-1 text-xs text-[#43474C]">{String(incidencia.detalle_especifico?.problema ?? incidencia.descripcion)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#111C2D]">Historial previo de atención</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-[#E7EEFF] pl-4">
              {[...incidencia.historial_seguimiento].reverse().map((evento, index) => (
                <li key={`${evento.fecha}-${index}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111C2D]">{evento.accion === 'creacion' ? 'Registro inicial' : evento.accion === 'asignacion' ? 'Asignación' : 'Intervención registrada'}</span>
                    <time className="text-[10px] text-[#43474C]">{new Date(evento.fecha).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}</time>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#43474C]">{evento.comentario}</p>
                  <p className="mt-1 text-[10px] text-[#1B6870]">Por: {evento.autor}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-[#F7F9FF] p-3 text-xs leading-5 text-[#43474C]">La intervención quedará registrada en la bitácora de atención de esta incidencia.</p>
          </section>

          <section className="rounded-2xl bg-[#E7EEFF] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#1B6870]">Cumplimiento de SLA</span>
              <span className="rounded bg-white px-2 py-1 text-xs font-mono text-[#111C2D]">4 horas</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#43474C]">La atención dentro del plazo establecido para esta prioridad contribuye al indicador de calidad del departamento.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
