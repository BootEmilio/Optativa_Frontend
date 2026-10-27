'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomePath } from '@/lib/authSession';

export default function ReportanteAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    } else if (!cargando && usuario && usuario.rol !== 'reportante') {
      router.replace(getRoleHomePath(usuario.rol));
    }
  }, [cargando, router, usuario]);

  if (cargando || !usuario || usuario.rol !== 'reportante') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FA]">
        <p className="text-sm text-slate-600" role="status">
          Verificando sesión...
        </p>
      </main>
    );
  }

  return children;
}
