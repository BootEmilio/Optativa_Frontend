import { endpoints } from '@/config/endpoints';
import { mapIncidencia, mapIncidenciasList } from '@/lib/incidenciaMapper';
import { httpClient } from '@/lib/httpClient';
import type {
  CategoriaIncidencia,
  Incidencia,
  UbicacionIncidencia,
} from '@/types/incidencia';

export type NuevaIncidencia = {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  ubicacion: UbicacionIncidencia;
  detalle_especifico?: Record<string, unknown>;
};

export const reportanteService = {
  async getMisIncidencias(signal?: AbortSignal): Promise<Incidencia[]> {
    const raw = await httpClient<unknown>(endpoints.incidencias.list, {
      method: 'GET',
      signal,
    });
    return mapIncidenciasList(raw);
  },

  async crearIncidencia(
    incidencia: NuevaIncidencia,
    signal?: AbortSignal,
  ): Promise<Incidencia> {
    const raw = await httpClient<unknown>(endpoints.incidencias.list, {
      method: 'POST',
      body: incidencia,
      signal,
    });
    return mapIncidencia(raw);
  },
};
