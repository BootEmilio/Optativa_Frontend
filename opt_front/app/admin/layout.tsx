import React, { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export const metadata = {
  title: 'Módulo Administrador del Sistema | UTM Desk',
  description: 'Control integral de incidencias, usuarios, analítica y configuración del campus UTM.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-[#F8FAFC] text-[#27153D] antialiased">
        <Suspense
          fallback={
            <aside className="w-64 bg-[#2d3b4f] min-h-screen shrink-0" />
          }
        >
          <AdminSidebar />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminHeader />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

