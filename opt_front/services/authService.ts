import { endpoints } from '@/config/endpoints';
import { ApiError, httpClient } from '@/lib/httpClient';
import type { AuthSession, AuthUser } from '@/lib/authSession';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function login(correo: string, password: string): Promise<AuthSession> {
  const response = await httpClient<unknown>(endpoints.auth.login, {
    method: 'POST',
    body: { correo, password },
  });

  const result = isRecord(response) ? response : null;
  const user = result && isRecord(result.usuario) ? result.usuario : null;
  if (
    !result ||
    typeof result.token !== 'string' ||
    !result.token.trim() ||
    !user ||
    typeof (user.id ?? user._id) !== 'string' ||
    typeof user.correo !== 'string' ||
    typeof user.rol !== 'string'
  ) {
    throw new ApiError('La respuesta de inicio de sesión no tiene el formato esperado.', 502, response);
  }

  const usuario: AuthUser = {
    id: String(user.id ?? user._id),
    nombre:
      typeof user.nombre === 'string' && user.nombre.trim()
        ? user.nombre
        : user.correo,
    correo: user.correo,
    rol: user.rol,
    permisos: Array.isArray(user.permisos)
      ? user.permisos.filter((permission): permission is string => typeof permission === 'string')
      : [],
  };

  return { token: result.token, usuario };
}
