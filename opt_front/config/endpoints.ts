/**
 * Contrato HTTP del módulo Coordinador.
 * Las rutas son una propuesta del frontend hasta que backend las confirme
 * (ver docs/DIAGNOSTICO_COORDINADOR.md sección 6).
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
).replace(/\/$/, '');

/** Por defecto true: la UI sigue funcionando sin API. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

export const endpoints = {
  auth: {
    me: '/auth/me',
  },
  coordinador: {
    incidencias: '/coordinador/incidencias',
    incidencia: (id: string) => `/coordinador/incidencias/${encodeURIComponent(id)}`,
    asignar: (id: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/asignar`,
    prioridad: (id: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/prioridad`,
    cerrar: (id: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/cerrar`,
    reabrir: (id: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/reabrir`,
    tags: (id: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/tags`,
    tag: (id: string, tag: string) =>
      `/coordinador/incidencias/${encodeURIComponent(id)}/tags/${encodeURIComponent(tag)}`,
    tecnicos: '/coordinador/tecnicos',
    metricas: '/coordinador/metricas',
    actividad: '/coordinador/actividad',
  },
} as const;
