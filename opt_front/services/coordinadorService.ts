import { USE_MOCKS, endpoints } from '@/config/endpoints';
import { ApiError, httpClient } from '@/lib/httpClient';
import {
  Incidencia,
  PrioridadIncidencia,
  FiltrosIncidencias,
} from '../types/incidencia';
import { TecnicoDisponible, Usuario } from '../types/usuario';
import { mockCoordinadorActual } from '../data/mockCoordinadorData';
import { coordinadorMock } from './coordinadorMock';

export type ActividadReciente = {
  incidenciaId: string;
  codigo: string;
  titulo: string;
  autor: string;
  accion: string;
  fecha: string;
  comentario: string;
  estadoNuevo?: string;
};

export type MetricasDashboard = {
  pendientesAsignar: number;
  enProceso: number;
  resueltasAuditar: number;
  cerradas: number;
  total: number;
};

/**
 * Propuesta centralizada de campos del body para las peticiones de mutación HTTP.
 * Centralizados aquí para facilitar su modificación cuando el equipo de backend
 * confirme los nombres definitivos.
 */
export const requestBodyBuilders = {
  asignar: (tecnicoId: string, comentario?: string) => ({
    tecnicoId,
    comentario,
  }),
  prioridad: (prioridad: PrioridadIncidencia, motivo?: string) => ({
    prioridad,
    motivo,
  }),
  cerrar: (comentario: string) => ({
    comentario,
  }),
  reabrir: (motivo: string) => ({
    motivo,
  }),
  tags: (tag: string) => ({
    tag,
  }),
};

/**
 * Función única de mapeo para convertir la respuesta del backend al tipo Incidencia.
 * - Soporta respuestas envueltas (ej. { data: ... } o { incidencia: ... }).
 * - Asume que por ahora la estructura viene directa, asegurando fallbacks y mapeos
 *   básicos (ej. id -> _id, createdAt -> fecha_creacion).
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
      item.fecha_creacion ?? item.createdAt ?? new Date().toISOString()
    ),
    fecha_resolucion: item.fecha_resolucion
      ? String(item.fecha_resolucion)
      : undefined,
    fecha_cierre: item.fecha_cierre ? String(item.fecha_cierre) : undefined,
  };
}

/**
 * Función auxiliar para mapear listas de incidencias directas o envueltas.
 */
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

/**
 * Fachada pública del módulo Coordinador.
 * Conecta al backend real en Render o a coordinadorMock según USE_MOCKS.
 */
export const coordinadorService = {
  async getUsuarioActual(): Promise<Usuario> {
    // TODO: No hay endpoint de usuario actual/sesión en el backend todavía (ej. /auth/me o /api/usuarios/me).
    // Se devuelve mockCoordinadorActual tanto en modo Mock como en modo API para que Header y SessionContext no fallen.
    if (USE_MOCKS) return coordinadorMock.getUsuarioActual();
    return { ...mockCoordinadorActual };
  },

  async getIncidencias(filtros?: FiltrosIncidencias): Promise<Incidencia[]> {
    if (USE_MOCKS) return coordinadorMock.getIncidencias(filtros);
    const raw = await httpClient<unknown>(endpoints.coordinador.incidencias, {
      method: 'GET',
      query: {
        estado:
          filtros?.estado && filtros.estado !== 'todos'
            ? filtros.estado
            : undefined,
        prioridad:
          filtros?.prioridad && filtros.prioridad !== 'todas'
            ? filtros.prioridad
            : undefined,
        categoria:
          filtros?.categoria && filtros.categoria !== 'todas'
            ? filtros.categoria
            : undefined,
        busqueda: filtros?.busqueda?.trim() || undefined,
      },
    });
    return mapIncidenciasList(raw);
  },

  async getIncidenciaById(idOrCodigo: string): Promise<Incidencia | null> {
    if (USE_MOCKS) return coordinadorMock.getIncidenciaById(idOrCodigo);
    try {
      const raw = await httpClient<unknown>(
        endpoints.coordinador.incidencia(idOrCodigo),
        { method: 'GET' }
      );
      if (!raw) return null;
      return mapIncidencia(raw);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getTecnicosDisponibles(): Promise<TecnicoDisponible[]> {
    if (USE_MOCKS) return coordinadorMock.getTecnicosDisponibles();
    const raw = await httpClient<
      TecnicoDisponible[] | { data: TecnicoDisponible[] }
    >(endpoints.coordinador.tecnicos, { method: 'GET' });

    if (Array.isArray(raw)) return raw;
    if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as { data?: TecnicoDisponible[] }).data)
    ) {
      return (raw as { data: TecnicoDisponible[] }).data;
    }
    return [];
  },

  async asignarTecnico(
    incidenciaId: string,
    tecnicoId: string,
    comentarioPersonalizado?: string
  ): Promise<Incidencia> {
    if (USE_MOCKS) {
      return coordinadorMock.asignarTecnico(
        incidenciaId,
        tecnicoId,
        comentarioPersonalizado
      );
    }
    const raw = await httpClient<unknown>(
      endpoints.coordinador.asignar(incidenciaId),
      {
        method: 'PATCH',
        body: requestBodyBuilders.asignar(
          tecnicoId,
          comentarioPersonalizado
        ),
      }
    );
    return mapIncidencia(raw);
  },

  async establecerPrioridad(
    incidenciaId: string,
    nuevaPrioridad: PrioridadIncidencia,
    motivo?: string
  ): Promise<Incidencia> {
    if (USE_MOCKS) {
      return coordinadorMock.establecerPrioridad(
        incidenciaId,
        nuevaPrioridad,
        motivo
      );
    }
    const raw = await httpClient<unknown>(
      endpoints.coordinador.prioridad(incidenciaId),
      {
        method: 'PATCH',
        body: requestBodyBuilders.prioridad(nuevaPrioridad, motivo),
      }
    );
    return mapIncidencia(raw);
  },

  async cerrarIncidencia(
    incidenciaId: string,
    comentarioAuditoria: string
  ): Promise<Incidencia> {
    if (USE_MOCKS) {
      return coordinadorMock.cerrarIncidencia(
        incidenciaId,
        comentarioAuditoria
      );
    }
    const raw = await httpClient<unknown>(
      endpoints.coordinador.cerrar(incidenciaId),
      {
        method: 'PATCH',
        body: requestBodyBuilders.cerrar(comentarioAuditoria),
      }
    );
    return mapIncidencia(raw);
  },

  async reabrirIncidencia(
    incidenciaId: string,
    motivoReapertura: string
  ): Promise<Incidencia> {
    if (USE_MOCKS) {
      return coordinadorMock.reabrirIncidencia(incidenciaId, motivoReapertura);
    }
    const raw = await httpClient<unknown>(
      endpoints.coordinador.reabrir(incidenciaId),
      {
        method: 'PATCH',
        body: requestBodyBuilders.reabrir(motivoReapertura),
      }
    );
    return mapIncidencia(raw);
  },

  async agregarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    if (USE_MOCKS) return coordinadorMock.agregarTag(incidenciaId, tag);
    const raw = await httpClient<unknown>(
      endpoints.coordinador.tags(incidenciaId),
      {
        method: 'POST',
        body: requestBodyBuilders.tags(tag),
      }
    );
    return mapIncidencia(raw);
  },

  async eliminarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    if (USE_MOCKS) return coordinadorMock.eliminarTag(incidenciaId, tag);
    const raw = await httpClient<unknown>(
      endpoints.coordinador.tag(incidenciaId, tag),
      { method: 'DELETE' }
    );
    return mapIncidencia(raw);
  },

  async getMetricasDashboard(): Promise<MetricasDashboard> {
    if (USE_MOCKS) return coordinadorMock.getMetricasDashboard();
    const raw = await httpClient<
      MetricasDashboard | { data: MetricasDashboard }
    >(endpoints.coordinador.metricas, { method: 'GET' });

    if (
      raw &&
      typeof raw === 'object' &&
      'data' in raw &&
      (raw as { data: unknown }).data
    ) {
      return (raw as { data: MetricasDashboard }).data;
    }
    return raw as MetricasDashboard;
  },

  async getActividadReciente(limite = 5): Promise<ActividadReciente[]> {
    if (USE_MOCKS) return coordinadorMock.getActividadReciente(limite);
    const raw = await httpClient<
      ActividadReciente[] | { data: ActividadReciente[] }
    >(endpoints.coordinador.actividad, {
      method: 'GET',
      query: { limite },
    });

    const lista = Array.isArray(raw)
      ? raw
      : raw &&
        typeof raw === 'object' &&
        Array.isArray((raw as { data?: ActividadReciente[] }).data)
      ? (raw as { data: ActividadReciente[] }).data
      : [];

    // Si el backend no aplica el límite o devuelve más resultados, se recorta en cliente
    return typeof limite === 'number' && limite > 0
      ? lista.slice(0, limite)
      : lista;
  },
};
