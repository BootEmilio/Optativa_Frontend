"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  clearAuthSession,
  getAuthSnapshot,
  getServerAuthSnapshot,
  saveAuthSession,
  subscribeToAuthSession,
  type AuthUser,
} from '@/lib/authSession';
import { login as requestLogin } from '@/services/authService';

type AuthContextValue = {
  usuario: AuthUser | null;
  cargando: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<AuthUser>;
  cerrarSesion: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const iniciarSesion = useCallback(async (correo: string, password: string) => {
    const session = await requestLogin(correo, password);
    saveAuthSession(session);
    return session.usuario;
  }, []);

  const cerrarSesion = useCallback(() => clearAuthSession(), []);

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
