import { USE_MOCKS, endpoints } from '@/config/endpoints';
import { httpClient } from '@/lib/httpClient';
import {
  Incidencia,
  PrioridadIncidencia,
  FiltrosIncidencias,
} from '../types/incidencia';
import { TecnicoDisponible, Usuario } from '../types/usuario';
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
 * Fachada pública del módulo.
 * Con NEXT_PUBLIC_USE_MOCKS !== 'false' usa memoria local.
 * En modo API el cliente solo envía la intención; el servidor calcula
 * estado, historial, autor y fechas.
 */
export const coordinadorService = {
  async getUsuarioActual(): Promise<Usuario> {
    if (USE_MOCKS) return coordinadorMock.getUsuarioActual();
    return httpClient<Usuario>(endpoints.auth.me);
  },

  async getIncidencias(filtros?: FiltrosIncidencias): Promise<Incidencia[]> {
    if (USE_MOCKS) return coordinadorMock.getIncidencias(filtros);
    return httpClient<Incidencia[]>(endpoints.coordinador.incidencias, {
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
  },

  async getIncidenciaById(idOrCodigo: string): Promise<Incidencia | null> {
    if (USE_MOCKS) return coordinadorMock.getIncidenciaById(idOrCodigo);
    return httpClient<Incidencia>(endpoints.coordinador.incidencia(idOrCodigo));
  },

  async getTecnicosDisponibles(): Promise<TecnicoDisponible[]> {
    if (USE_MOCKS) return coordinadorMock.getTecnicosDisponibles();
    return httpClient<TecnicoDisponible[]>(endpoints.coordinador.tecnicos);
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
    return httpClient<Incidencia>(endpoints.coordinador.asignar(incidenciaId), {
      method: 'POST',
      body: {
        tecnicoId,
        comentario: comentarioPersonalizado,
      },
    });
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
    return httpClient<Incidencia>(
      endpoints.coordinador.prioridad(incidenciaId),
      {
        method: 'PATCH',
        body: { prioridad: nuevaPrioridad, motivo },
      }
    );
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
    return httpClient<Incidencia>(endpoints.coordinador.cerrar(incidenciaId), {
      method: 'POST',
      body: { comentario: comentarioAuditoria },
    });
  },

  async reabrirIncidencia(
    incidenciaId: string,
    motivoReapertura: string
  ): Promise<Incidencia> {
    if (USE_MOCKS) {
      return coordinadorMock.reabrirIncidencia(incidenciaId, motivoReapertura);
    }
    return httpClient<Incidencia>(endpoints.coordinador.reabrir(incidenciaId), {
      method: 'POST',
      body: { motivo: motivoReapertura },
    });
  },

  async agregarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    if (USE_MOCKS) return coordinadorMock.agregarTag(incidenciaId, tag);
    return httpClient<Incidencia>(endpoints.coordinador.tags(incidenciaId), {
      method: 'POST',
      body: { tag },
    });
  },

  async eliminarTag(incidenciaId: string, tag: string): Promise<Incidencia> {
    if (USE_MOCKS) return coordinadorMock.eliminarTag(incidenciaId, tag);
    return httpClient<Incidencia>(
      endpoints.coordinador.tag(incidenciaId, tag),
      { method: 'DELETE' }
    );
  },

  async getMetricasDashboard(): Promise<MetricasDashboard> {
    if (USE_MOCKS) return coordinadorMock.getMetricasDashboard();
    return httpClient<MetricasDashboard>(endpoints.coordinador.metricas);
  },

  async getActividadReciente(limite = 5): Promise<ActividadReciente[]> {
    if (USE_MOCKS) return coordinadorMock.getActividadReciente(limite);
    return httpClient<ActividadReciente[]>(endpoints.coordinador.actividad, {
      query: { limite },
    });
  },
};
