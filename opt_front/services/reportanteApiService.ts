import { endpoints } from '@/config/endpoints';
import { ApiError, httpClient } from '@/lib/httpClient';
import { mapIncidencia, mapIncidenciasList } from '@/lib/incidenciaMapper';
import type { Incidencia } from '@/types/incidencia';

export const reportanteApiService = {
  async listarIncidencias(signal?: AbortSignal): Promise<Incidencia[]> {
    const raw = await httpClient<unknown>(endpoints.incidencias.list, {
      method: 'GET',
      signal,
    });
    return mapIncidenciasList(raw);
  },

  async obtenerIncidencia(id: string, signal?: AbortSignal): Promise<Incidencia> {
    const raw = await httpClient<unknown>(endpoints.incidencias.detail(id), {
      method: 'GET',
      signal,
    });
    const mapped = mapIncidencia(raw);
    if (!mapped._id) {
      throw new ApiError(
        'El servidor devolvió una incidencia sin identificador.',
        502,
        raw,
      );
    }
    return mapped;
  },

  async agregarComentario(id: string, comentario: string): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.comentario(id), {
      method: 'POST',
      body: { comentario },
    });
  },
};
