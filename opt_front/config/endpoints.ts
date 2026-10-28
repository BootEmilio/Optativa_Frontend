/**
 * Contrato HTTP del módulo Coordinador y Administrador.
 * Base URL oficial del backend alojado en Render.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-incidencias-4paf.onrender.com'
).replace(/\/$/, '');

/**
 * Controla si se utilizan los datos simulados en memoria o el backend real.
 * Con NEXT_PUBLIC_USE_MOCKS === 'true', se fuerzan los mocks locales.
 * Por defecto (false o no definido), se conecta al backend real.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const endpoints = {
  auth: {
    login: '/api/auth/login',
    // TODO: Endpoint de usuario actual/sesión cuando backend lo implemente
    me: '/api/auth/me',
  },
  coordinador: {
    tecnicos: '/api/coordinador/tecnicos',
    metricas: '/api/coordinador/metricas',
    actividad: '/api/coordinador/actividad',
    // Rutas de incidencias operadas por el coordinador
    incidencias: '/api/incidencias',
    incidencia: (id: string) => `/api/incidencias/${encodeURIComponent(id)}`,
    asignar: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/asignar`,
    prioridad: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/prioridad`,
    cerrar: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/cerrar`,
    reabrir: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/reabrir`,
    tags: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/tags`,
    tag: (id: string, tag: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/tags/${encodeURIComponent(tag)}`,
  },
  analista: {
    dashboard: '/api/analista/dashboard',
    summary: '/api/analista/summary',
    incidentsByCategory: '/api/analista/incidents-by-category',
    incidentsByStatus: '/api/analista/incidents-by-status',
    reports: '/api/analista/reports',
    resolutionTimes: '/api/analista/resolution-times',
    recurringFailures: '/api/analista/recurring-failures',
  },
  incidencias: {
    list: '/api/incidencias',
    detail: (id: string) => `/api/incidencias/${encodeURIComponent(id)}`,
    asignar: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/asignar`,
    prioridad: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/prioridad`,
    cerrar: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/cerrar`,
    reabrir: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/reabrir`,
    tags: (id: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/tags`,
    tag: (id: string, tag: string) =>
      `/api/incidencias/${encodeURIComponent(id)}/tags/${encodeURIComponent(tag)}`,
  },
  admin: {
    usuarios: '/api/admin/usuarios',
    usuario: (id: string) => `/api/admin/usuarios/${encodeURIComponent(id)}`,
    roles: '/api/admin/roles',
    logs: '/api/admin/logs',
    configuracion: '/api/admin/configuracion',
  },
} as const;
