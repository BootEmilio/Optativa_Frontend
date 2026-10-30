import { Suspense } from 'react';
import ReportanteIncidenciaDetalleClient from './ReportanteIncidenciaDetalleClient';

export default function ReportanteIncidenciaDetallePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
          <p className="text-sm text-[#43474c]" role="status">
            Cargando incidencia...
          </p>
        </main>
      }
    >
      <ReportanteIncidenciaDetalleClient />
    </Suspense>
  );
}
