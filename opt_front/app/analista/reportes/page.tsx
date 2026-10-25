import type { Metadata } from "next";
import Reports from "../components/Reports";

export const metadata: Metadata = {
  title: "UTM Desk | Reportes",
  description: "Consulta de reportes de incidencias por distintos criterios.",
};

export default function ReportsPage() {
  return <Reports />;
}
