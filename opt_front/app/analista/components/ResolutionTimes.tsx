"use client";

import { useEffect, useState } from "react";
import {
  getResolutionTimes,
  nestedRecord,
  readNumber,
  readRows,
  readText,
  type ApiRecord,
} from "@/services/analistaService";
import { ApiError } from "@/lib/httpClient";
import { API_BASE_URL, endpoints } from "@/config/endpoints";
import StatCard from "./StatCard";

type ResolutionRow = {
  label: string;
  hours: number;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido al consultar la API.";
}

function exportReport(rows: ResolutionRow[]) {
  const csvRows = [
    ["Prioridad", "Tiempo promedio de resolución (h)"],
    ...rows.map((item) => [item.label, String(item.hours)]),
  ];
  const csv = csvRows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tiempos-de-resolucion.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function metricValue(value: number | null) {
  return value === null ? "—" : `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`;
}

export default function ResolutionTimes() {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const endpoint = `${API_BASE_URL}${endpoints.analista.resolutionTimes}`;
    console.info("[Analista][resolution-times] Consultando API:", endpoint);

    void getResolutionTimes(controller.signal)
      .then((response) => {
        console.info("[Analista][resolution-times] Respuesta recibida:", response);
        setPayload(response);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("[Analista][resolution-times] Error de API:", {
          message: errorMessage(requestError),
          status: requestError instanceof ApiError ? requestError.status : undefined,
          body: requestError instanceof ApiError ? requestError.body : undefined,
          error: requestError,
        });
        setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const metrics = nestedRecord(payload);
  const rows = (readRows(payload, [
    "byPriority",
    "by_priority",
    "priorityBreakdown",
    "resolutionByPriority",
    "data",
    "items",
    "results",
  ]) ?? []).flatMap((row: ApiRecord) => {
    const label = readText(row, ["priority", "label", "name"]);
    const hours = readNumber(row, [
      "averageHours",
      "averageTime",
      "avgCycleHours",
      "avg_cycle_hours",
      "average",
      "avg",
      "hours",
      "value",
    ]);
    return label && hours !== null ? [{ label, hours }] : [];
  });
  const average = readNumber(metrics, [
    "averageHours",
    "averageTime",
    "averageResolutionTime",
    "avgResolutionTime",
    "avgCycleHours",
    "avg_cycle_hours",
    "average",
  ]);
  const minimum = readNumber(metrics, [
    "minimumHours",
    "minimumTime",
    "minResolutionTime",
    "minCycleHours",
    "min_cycle_hours",
    "minimum",
  ]);
  const maximum = readNumber(metrics, [
    "maximumHours",
    "maximumTime",
    "maxResolutionTime",
    "maxCycleHours",
    "max_cycle_hours",
    "maximum",
  ]);
  const maxHours = Math.max(...rows.map((item) => item.hours), 1);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#00685f]">
            Métricas de desempeño operativo
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#102b3a]">
            Tiempos de resolución
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Análisis del tiempo empleado en la atención y resolución de incidencias.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-medium text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || rows.length === 0}
          onClick={() => exportReport(rows)}
          type="button"
        >
          Exportar reporte
        </button>
      </div>

      {error && (
        <p
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </p>
      )}

      <section
        aria-label="Indicadores de tiempo de resolución"
        className="grid gap-4 md:grid-cols-3"
      >
        <StatCard
          accent
          detail="Promedio del conjunto consultado"
          label="Tiempo promedio"
          value={loading ? "…" : metricValue(average)}
        />
        <StatCard
          detail="Menor tiempo registrado"
          label="Tiempo mínimo"
          value={loading ? "…" : metricValue(minimum)}
        />
        <StatCard
          detail="Mayor tiempo registrado"
          label="Tiempo máximo"
          value={loading ? "…" : metricValue(maximum)}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#102b3a]">
              Tiempo promedio por prioridad
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Valores de incidencias resueltas expresados en horas.
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            Escala: horas (h)
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500" role="status">
            Cargando tiempos de resolución...
          </p>
        ) : rows.length ? (
          <div className="space-y-5">
            {rows.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-semibold tabular-nums text-[#102b3a]">
                    {metricValue(item.hours)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#168f85]"
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {error
              ? "No se pudieron cargar los tiempos."
              : "La API no devolvió tiempos por prioridad en un formato reconocido."}
          </p>
        )}
      </section>
    </div>
  );
}
