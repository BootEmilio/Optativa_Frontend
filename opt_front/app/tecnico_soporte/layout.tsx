import { Suspense, type ReactNode } from 'react';
import TecnicoShell from '@/components/tecnico_soporte/TecnicoShell';

export const metadata = {
  title: 'Técnico de soporte | UTM Desk',
  description: 'Panel de incidencias asignadas al personal técnico',
};

export default function TecnicoSoporteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
          <p className="text-sm text-[#43474c]" role="status">
            Cargando módulo técnico...
          </p>
        </main>
      }
    >
      <TecnicoShell>{children}</TecnicoShell>
    </Suspense>
  );
}
