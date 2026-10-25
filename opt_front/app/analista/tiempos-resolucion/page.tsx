import type { Metadata } from "next";
import ResolutionTimes from "../components/ResolutionTimes";

export const metadata: Metadata = {
  title: "UTM Desk | Tiempos de resolución",
  description: "Análisis de los tiempos de resolución de incidencias.",
};

export default function ResolutionTimesPage() {
  return <ResolutionTimes />;
}
