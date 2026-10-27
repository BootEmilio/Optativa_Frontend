import { tecnicoIncidencias } from '@/data/tecnicoMock';
import type { EstadoIncidencia, HistorialSeguimiento, Incidencia } from '@/types/incidencia';

const STORAGE_KEY = 'utm-tecnico-incidencias';

type IncidenciaOverrides = Record<string, Partial<Incidencia>>;

function readOverrides(): IncidenciaOverrides {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as IncidenciaOverrides) : {};
  } catch (error) {
    console.error('No se pudieron leer los cambios locales de incidencias técnicas.', error);
    return {};
  }
}

export function getTecnicoIncidencia(id: string): Incidencia | null {
  const incidencia = tecnicoIncidencias.find((item) => item._id === id);
  if (!incidencia) return null;

  const override = readOverrides()[id];
  return override ? { ...incidencia, ...override } : incidencia;
}

export function getTecnicoIncidenciaSnapshot(id: string): string {
  const incidencia = tecnicoIncidencias.find((item) => item._id === id);
  if (!incidencia) return 'null';

  const override = readOverrides()[id];
  return JSON.stringify(override ? { ...incidencia, ...override } : incidencia);
}

export function getTecnicoIncidenciaServerSnapshot(id: string): string {
  return JSON.stringify(tecnicoIncidencias.find((item) => item._id === id) ?? null);
}

export function subscribeToTecnicoIncidencias(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', onChange);
  window.addEventListener('utm-tecnico-incidencias-updated', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('utm-tecnico-incidencias-updated', onChange);
  };
}

export function saveTecnicoIntervencion(
  id: string,
  registro: HistorialSeguimiento,
  horas: number,
  estado: EstadoIncidencia,
): void {
  if (typeof window === 'undefined') {
    throw new Error('El registro de intervenciones solo está disponible en el navegador.');
  }

  const incidencia = getTecnicoIncidencia(id);
  if (!incidencia) throw new Error('No se encontró la incidencia para guardar la intervención.');

  const overrides = readOverrides();
  overrides[id] = {
    ...incidencia,
    estado,
    horas_invertidas: (incidencia.horas_invertidas ?? 0) + horas,
    fecha_resolucion: estado === 'resuelta' ? registro.fecha : incidencia.fecha_resolucion,
    historial_seguimiento: [...incidencia.historial_seguimiento, registro],
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('utm-tecnico-incidencias-updated'));
}
