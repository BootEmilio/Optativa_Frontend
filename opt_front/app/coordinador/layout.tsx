import React, { Suspense } from 'react';
import { Sidebar } from '../../components/coordinador/Sidebar';
import { Header } from '../../components/coordinador/Header';
import { CoordinadorSessionProvider } from '../../context/SessionContext';

export const metadata = {
  title: 'Módulo Coordinador de Soporte | UTM',
  description: 'Gestión y supervisión de incidencias de Tecnologías de la Información',
};

export default function CoordinadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CoordinadorSessionProvider>
      <div className="flex min-h-screen bg-[#F8FAFC] text-[#27153D] antialiased">
        <Suspense fallback={<aside className="w-64 bg-[#27153D] min-h-screen shrink-0" />}>
          <Sidebar />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </CoordinadorSessionProvider>
  );
}
