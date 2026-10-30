export const AUTH_TOKEN_STORAGE_KEY = 'utm_desk_token';
export const AUTH_USER_STORAGE_KEY = 'utm_desk_user';
export const AUTH_CHANGED_EVENT = 'utm-desk-auth-changed';

export type AuthUser = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  permisos: string[];
};

export type AuthSession = {
  token: string;
  usuario: AuthUser;
};

export function getRoleHomePath(role: string) {
  if (!role) return '/login';
  const r = role.toLowerCase().trim();
  if (r.includes('administrativ')) return '/reportante';
  if (r.includes('admin')) return '/admin';
  if (r.includes('coord')) return '/coordinador';
  if (r.includes('analist') || r.includes('directiv')) return '/analista/dashboard';
  if (r.includes('tec') || r.includes('tecnic')) return '/tecnico_soporte';
  if (r.includes('report') || r.includes('docent') || r.includes('estudiant')) return '/reportante';
  return '/login';
}

export type AuthSnapshot = {
  usuario: AuthUser | null;
  cargando: boolean;
};

const serverSnapshot: AuthSnapshot = { usuario: null, cargando: true };
let cachedStorageValue: string | null = null;
let cachedSnapshot: AuthSnapshot = serverSnapshot;

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
  window.localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(session.usuario),
  );
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const serializedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!token || !serializedUser) return null;

  try {
    const usuario: unknown = JSON.parse(serializedUser);
    if (
      !usuario ||
      typeof usuario !== 'object' ||
      !('id' in usuario) ||
      typeof usuario.id !== 'string' ||
      !('correo' in usuario) ||
      typeof usuario.correo !== 'string'
    ) {
      return null;
    }
    return { token, usuario: usuario as AuthUser };
  } catch {
    return null;
  }
}

export function getAuthSnapshot(): AuthSnapshot {
  if (typeof window === 'undefined') return serverSnapshot;

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const serializedUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  const storageValue = `${token ?? ''}\u0000${serializedUser ?? ''}`;
  if (storageValue === cachedStorageValue) return cachedSnapshot;

  cachedStorageValue = storageValue;
  let usuario: AuthUser | null = null;
  if (token && serializedUser) {
    try {
      const parsed: unknown = JSON.parse(serializedUser);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'id' in parsed &&
        typeof parsed.id === 'string' &&
        'correo' in parsed &&
        typeof parsed.correo === 'string'
      ) {
        usuario = parsed as AuthUser;
      }
    } catch {
      usuario = null;
    }
  }
  cachedSnapshot = { usuario, cargando: false };
  return cachedSnapshot;
}

export function subscribeToAuthSession(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function getServerAuthSnapshot() {
  return serverSnapshot;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
