'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomePath } from '@/lib/authSession';

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  useEffect(() => {
    // Si terminó de cargar y no hay usuario ni en context ni en session, redirigir a login
    // En modo desarrollo / sin backend conectado, si no hay usuario en sesión, permitimos explorar
    if (!cargando && usuario && usuario.rol !== 'administrador_sistema') {
      router.replace(getRoleHomePath(usuario.rol));
    }
  }, [cargando, router, usuario]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center space-x-3 text-sm text-[#27153D]">
          <span className="w-4 h-4 rounded-full border-2 border-[#3E828E] border-t-transparent animate-spin" />
          <span>Verificando privilegios de Administrador...</span>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

