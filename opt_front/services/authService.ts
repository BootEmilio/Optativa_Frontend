import { USE_MOCKS, endpoints } from '@/config/endpoints';
import { ApiError, httpClient } from '@/lib/httpClient';
import type { AuthSession, AuthUser } from '@/lib/authSession';
import { RolClave } from '@/types/usuario';
import { mockUsuariosIniciales } from '@/data/mockAdminData';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Normaliza cualquier formato de rol proveniente del backend al tipo oficial RolClave.
 */
export function normalizeRole(rawRole: unknown): RolClave {
  if (typeof rawRole !== 'string') return 'reportante';
  const r = rawRole.trim().toLowerCase();
  if (r.includes('admin')) return 'administrador_sistema';
  if (r.includes('coord')) return 'coordinador_soporte';
  if (r.includes('tec') || r.includes('soporte')) return 'tecnico_soporte';
  if (r.includes('analist') || r.includes('directiv')) return 'directivo_analista';
  return 'reportante';
}

/**
 * Decodifica de forma segura el payload de un token JWT en caso de que el backend
 * incluya la información del usuario en las claims del token.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Extrae el token JWT de la respuesta independientemente de si viene como:
 * - { token: "..." }
 * - { accessToken: "..." }
 * - { data: { token: "..." } }
 */
function extractToken(result: Record<string, unknown>): string {
  if (typeof result.token === 'string' && result.token.trim()) return result.token.trim();
  if (typeof result.accessToken === 'string' && result.accessToken.trim()) return result.accessToken.trim();
  if (typeof result.access_token === 'string' && result.access_token.trim()) return result.access_token.trim();

  if (isRecord(result.data)) {
    return extractToken(result.data);
  }
  return '';
}

/**
 * Extrae el objeto de usuario de la respuesta del backend:
 * - Soporta { usuario: { ... } }
 * - Soporta { user: { ... } }
 * - Soporta { data: { usuario / user: { ... } } }
 * - Fallback: decodificación del JWT si no viene objeto de usuario explícito
 */
function extractUserRecord(
  result: Record<string, unknown>,
  token: string
): Record<string, unknown> | null {
  if (isRecord(result.usuario)) return result.usuario;
  if (isRecord(result.user)) return result.user;

  if (isRecord(result.data)) {
    const nested = result.data;
    if (isRecord(nested.usuario)) return nested.usuario;
    if (isRecord(nested.user)) return nested.user;
    if ('email' in nested || 'correo' in nested) return nested;
  }

  if (token) {
    const jwtPayload = decodeJwtPayload(token);
    if (jwtPayload) return jwtPayload;
  }

  return null;
}

/**
 * Autenticación simulada para modo local / offline
 */
function loginMock(correo: string): AuthSession {
  const match = mockUsuariosIniciales.find(
    (u) => u.correo.toLowerCase() === correo.toLowerCase()
  );

  if (match) {
    return {
      token: `mock-jwt-token-${match._id}`,
      usuario: {
        id: match._id,
        nombre: `${match.nombre} ${match.apellidos}`,
        correo: match.correo,
        rol: match.rol,
        permisos: ['*'],
      },
    };
  }

  const rol = normalizeRole(correo);
  const fakeId = `mock-${Date.now()}`;
  return {
    token: `mock-jwt-token-${fakeId}`,
    usuario: {
      id: fakeId,
      nombre: correo.split('@')[0],
      correo,
      rol,
      permisos: ['*'],
    },
  };
}

/**
 * Realiza la autenticación contra el endpoint oficial del backend: POST /api/auth/login
 */
export async function login(correoInput: string, passwordInput: string): Promise<AuthSession> {
  const correo = correoInput.trim();
  const password = passwordInput;

  // Si se fuerza modo mocks en .env, responder con mock local
  if (USE_MOCKS) {
    return loginMock(correo);
  }

  // Petición HTTP al endpoint del backend: POST /api/auth/login
  // Se envían tanto 'correo' como 'email' para máxima compatibilidad con el backend
  const response = await httpClient<unknown>(endpoints.auth.login, {
    method: 'POST',
    body: {
      correo,
      email: correo,
      password,
      contrasena: password,
    },
  });

  const result = isRecord(response) ? response : null;
  if (!result) {
    throw new ApiError('La respuesta del servidor no tiene un formato válido.', 502, response);
  }

  const token = extractToken(result);
  if (!token) {
    throw new ApiError('El servidor no retornó un token de autenticación.', 502, response);
  }

  const rawUser = extractUserRecord(result, token);

  const userEmail =
    (rawUser && typeof rawUser.correo === 'string' && rawUser.correo) ||
    (rawUser && typeof rawUser.email === 'string' && rawUser.email) ||
    correo;

  const rawRole =
    (rawUser && (rawUser.rol || rawUser.role || rawUser.tipo_usuario || rawUser.tipo)) ??
    'reportante';

  const rol = normalizeRole(rawRole);

  const rawId =
    (rawUser && (rawUser.id ?? rawUser._id ?? rawUser.usuario_id ?? rawUser.userId ?? rawUser.sub)) ??
    `usr-${Date.now()}`;

  const rawNombre =
    (rawUser && typeof rawUser.nombre === 'string' && rawUser.nombre.trim() && rawUser.nombre) ||
    (rawUser && typeof rawUser.name === 'string' && rawUser.name.trim() && rawUser.name) ||
    (rawUser && typeof rawUser.nombre_completo === 'string' && rawUser.nombre_completo) ||
    userEmail.split('@')[0];

  const rawPermisos =
    rawUser && Array.isArray(rawUser.permisos)
      ? rawUser.permisos.filter((p): p is string => typeof p === 'string')
      : rawUser && Array.isArray(rawUser.permissions)
      ? rawUser.permissions.filter((p): p is string => typeof p === 'string')
      : [];

  const usuario: AuthUser = {
    id: String(rawId),
    nombre: String(rawNombre),
    correo: String(userEmail),
    rol,
    permisos: rawPermisos,
  };

  return { token, usuario };
}
