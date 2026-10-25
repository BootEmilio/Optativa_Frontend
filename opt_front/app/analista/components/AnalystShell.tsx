'use client';

import type { ReactNode } from 'react';
import AnalystHeader from './AnalystHeader';
import AnalystSidebar from './AnalystSidebar';

export default function AnalystShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7f8] lg:flex">
      <AnalystSidebar />
      <div className="min-w-0 flex-1">
        <AnalystHeader />
        <main className="px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
