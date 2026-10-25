import type { ReactNode } from "react";
import type { Metadata } from "next";
import AnalystHeader from "./components/AnalystHeader";
import AnalystSidebar from "./components/AnalystSidebar";

export const metadata: Metadata = {
  title: "UTM Desk | Panel de reportes",
  description: "Resumen de incidencias del campus para Directivo / Analista.",
};

export default function AnalystLayout({ children }: { children: ReactNode }) {
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
