import type { Incidencia } from '@/types/incidencia';

/**
 * Convierte respuestas directas o envueltas del API al tipo Incidencia.
 */
export function mapIncidencia(raw: unknown): Incidencia {
  if (!raw || typeof raw !== 'object') {
    return raw as Incidencia;
  }

  const obj = raw as Record<string, unknown>;
  const item = (
    obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? obj.data
      : obj.incidencia &&
        typeof obj.incidencia === 'object' &&
        !Array.isArray(obj.incidencia)
      ? obj.incidencia
      : obj
  ) as Record<string, unknown>;

  const incidenciaBase = item as unknown as Incidencia;

  return {
    ...incidenciaBase,
    _id: String(item._id ?? item.id ?? ''),
    codigo: String(item.codigo ?? ''),
    titulo: String(item.titulo ?? ''),
    descripcion: String(item.descripcion ?? ''),
    categoria: (item.categoria as Incidencia['categoria']) ?? 'computo_redes',
    prioridad: (item.prioridad as Incidencia['prioridad']) ?? 'media',
    estado: (item.estado as Incidencia['estado']) ?? 'abierta',
    reportante: (item.reportante ?? {
      usuario_id: '',
      nombre: '',
      tipo: 'estudiante',
    }) as Incidencia['reportante'],
    tecnico_asignado:
      (item.tecnico_asignado as Incidencia['tecnico_asignado']) ?? null,
    ubicacion: (item.ubicacion ?? { edificio: '' }) as Incidencia['ubicacion'],
    detalle_especifico: item.detalle_especifico as
      | Record<string, unknown>
      | undefined,
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    historial_seguimiento: Array.isArray(item.historial_seguimiento)
      ? (item.historial_seguimiento as Incidencia['historial_seguimiento'])
      : [],
    evidencias_adjuntas: Array.isArray(item.evidencias_adjuntas)
      ? (item.evidencias_adjuntas as Incidencia['evidencias_adjuntas'])
      : undefined,
    horas_invertidas:
      typeof item.horas_invertidas === 'number'
        ? item.horas_invertidas
        : undefined,
    fecha_creacion: String(
      item.fecha_creacion ?? item.createdAt ?? new Date().toISOString(),
    ),
    fecha_resolucion: item.fecha_resolucion
      ? String(item.fecha_resolucion)
      : undefined,
    fecha_cierre: item.fecha_cierre ? String(item.fecha_cierre) : undefined,
  };
}

export function mapIncidenciasList(raw: unknown): Incidencia[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(mapIncidencia);
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data.map(mapIncidencia);
    }
    if (Array.isArray(obj.incidencias)) {
      return obj.incidencias.map(mapIncidencia);
    }
  }
  return [];
}
