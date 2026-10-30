import { API_BASE_URL, endpoints } from '@/config/endpoints';
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/authSession';
import { ApiError, httpClient } from '@/lib/httpClient';
import { mapIncidencia, mapIncidenciasList } from '@/lib/incidenciaMapper';
import type { EstadoIncidencia, Incidencia } from '@/types/incidencia';

export interface DocumentarIntervencionInput {
  actividad: string;
  comentario: string;
  observaciones?: string;
  materiales?: string[];
  fecha?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function uploadEvidence(incidentId: string, file: File): Promise<void> {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;
  const formData = new FormData();
  formData.append('archivo', file);
  const response = await fetch(
    `${API_BASE_URL}${endpoints.incidencias.evidencias(incidentId)}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );
  if (response.ok) return;

  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const message =
    isRecord(body) && typeof body.message === 'string' && body.message.trim()
      ? body.message
      : isRecord(body) && typeof body.error === 'string'
        ? body.error
        : `Error ${response.status} al subir ${file.name}.`;
  throw new ApiError(message, response.status, body);
}

export const tecnicoApiService = {
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
    const incidencia = mapIncidencia(raw);
    if (!incidencia._id) {
      throw new ApiError(
        'El servidor devolvió una incidencia sin identificador.',
        502,
        raw,
      );
    }
    return incidencia;
  },

  async agregarComentario(id: string, comentario: string): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.comentario(id), {
      method: 'POST',
      body: { comentario },
    });
  },

  subirEvidencia: uploadEvidence,

  async documentar(
    id: string,
    input: DocumentarIntervencionInput,
  ): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.documentar(id), {
      method: 'PATCH',
      body: input,
    });
  },

  async registrarHoras(id: string, horas: number): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.horas(id), {
      method: 'PATCH',
      body: { horas },
    });
  },

  async actualizarEstado(
    id: string,
    estado: EstadoIncidencia,
    comentario?: string,
  ): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.estado(id), {
      method: 'PATCH',
      body: { estado, ...(comentario ? { comentario } : {}) },
    });
  },

  async resolver(id: string, comentario: string): Promise<void> {
    await httpClient<unknown>(endpoints.incidencias.resolver(id), {
      method: 'PATCH',
      body: { comentario },
    });
  },
};
