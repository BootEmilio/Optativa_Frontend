import { endpoints } from '@/config/endpoints';
import { mapIncidencia, mapIncidenciasList } from '@/lib/incidenciaMapper';
import { httpClient } from '@/lib/httpClient';
import type {
  FiltrosIncidencias,
  Incidencia,
} from '@/types/incidencia';

export type DocumentacionIncidencia = {
  comentario: string;
  actividad?: string;
  fecha?: string;
  materiales?: string[];
  observaciones?: string;
};

function filtrosQuery(filtros?: FiltrosIncidencias) {
  return {
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
  };
}

export const tecnicoSoporteService = {
  async getIncidenciasAsignadas(
    filtros?: FiltrosIncidencias,
    signal?: AbortSignal,
  ): Promise<Incidencia[]> {
    const raw = await httpClient<unknown>(endpoints.incidencias.list, {
      method: 'GET',
      query: filtrosQuery(filtros),
      signal,
    });
    return mapIncidenciasList(raw);
  },

  async asignarTecnico(
    incidenciaId: string,
    tecnicoId: string,
    comentario?: string,
    signal?: AbortSignal,
  ): Promise<Incidencia> {
    const raw = await httpClient<unknown>(
      endpoints.incidencias.asignar(incidenciaId),
      {
        method: 'PATCH',
        body: { tecnicoId, comentario },
        signal,
      },
    );
    return mapIncidencia(raw);
  },

  async documentarIncidencia(
    incidenciaId: string,
    documentacion: DocumentacionIncidencia,
    signal?: AbortSignal,
  ): Promise<Incidencia> {
    const raw = await httpClient<unknown>(
      endpoints.incidencias.documentar(incidenciaId),
      {
        method: 'PATCH',
        body: documentacion,
        signal,
      },
    );
    return mapIncidencia(raw);
  },

  async registrarHoras(
    incidenciaId: string,
    horas: number,
    signal?: AbortSignal,
  ): Promise<Incidencia> {
    const raw = await httpClient<unknown>(
      endpoints.incidencias.horas(incidenciaId),
      {
        method: 'PATCH',
        body: { horas },
        signal,
      },
    );
    return mapIncidencia(raw);
  },

  async resolverIncidencia(
    incidenciaId: string,
    comentario: string,
    signal?: AbortSignal,
  ): Promise<Incidencia> {
    const raw = await httpClient<unknown>(
      endpoints.incidencias.resolver(incidenciaId),
      {
        method: 'PATCH',
        body: { comentario },
        signal,
      },
    );
    return mapIncidencia(raw);
  },
};
