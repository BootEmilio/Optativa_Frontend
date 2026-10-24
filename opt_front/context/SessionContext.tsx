'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Usuario } from '../types/usuario';
import { coordinadorService } from '../services/coordinadorService';

interface SessionContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function CoordinadorSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const actual = await coordinadorService.getUsuarioActual();
      setUsuario(actual);
    } catch (err) {
      setUsuario(null);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la sesión del coordinador'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const value = useMemo(
    () => ({ usuario, cargando, error, recargar }),
    [usuario, cargando, error, recargar]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error(
      'useSession debe usarse dentro de CoordinadorSessionProvider'
    );
  }
  return ctx;
}
