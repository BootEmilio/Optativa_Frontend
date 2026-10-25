import type { ReactNode } from "react";
import type { Metadata } from "next";
import AnalystAuthGuard from "./components/AnalystAuthGuard";
import AnalystShell from "./components/AnalystShell";

export const metadata: Metadata = {
  title: "UTM Desk | Panel de reportes",
  description: "Resumen de incidencias del campus para Directivo / Analista.",
};

export default function AnalystLayout({ children }: { children: ReactNode }) {
  return (
    <AnalystAuthGuard>
      <AnalystShell>{children}</AnalystShell>
    </AnalystAuthGuard>
  );
}
