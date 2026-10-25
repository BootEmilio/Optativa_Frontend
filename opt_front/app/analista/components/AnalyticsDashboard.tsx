"use client";

import { useEffect, useState } from "react";
import {
  getAnalystDashboard,
  getAnalystSummary,
  getIncidentsByCategory,
  getIncidentsByStatus,
  nestedRecord,
  readDistribution,
  readNumber,
} from "@/services/analistaService";
import StatCard from "./StatCard";

type DashboardData = {
  dashboard: unknown;
  summary: unknown;
  categories: unknown;
  statuses: unknown;
  errors: string[];
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido al consultar la API.";
}

function BarList({
  data,
  loading,
}: {
  data: { label: string; count: number }[] | null;
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-slate-500">Cargando datos...</p>;
  }
  if (data === null) {
    return (
      <p className="text-sm text-amber-700">
        La API devolvió un formato de distribución no reconocido.
      </p>
    );
  }
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No hay incidencias en este periodo.</p>;
  }

  const maxValue = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div className="space-y-2" key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium tabular-nums text-[#102b3a]">{item.count}</span>
          </div>
          <div
            aria-label={`${item.count} incidencias`}
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            role="img"
          >
            <div
              className="h-full rounded-full bg-[#20b6a7]"
              style={{ width: `${(item.count / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] sm:p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#102b3a]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const requests = [
      getAnalystDashboard("this_month", controller.signal),
      getAnalystSummary("last_month", controller.signal),
      getIncidentsByCategory("this_month", controller.signal),
      getIncidentsByStatus("this_month", controller.signal),
    ] as const;

    void Promise.allSettled(requests).then((results) => {
      if (controller.signal.aborted) return;
      const errors = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [`${["Dashboard", "Resumen", "Categorías", "Estados"][index]}: ${errorMessage(result.reason)}`]
          : [],
      );
      setData({
        dashboard: results[0].status === "fulfilled" ? results[0].value : null,
        summary: results[1].status === "fulfilled" ? results[1].value : null,
        categories: results[2].status === "fulfilled" ? results[2].value : null,
        statuses: results[3].status === "fulfilled" ? results[3].value : null,
        errors,
      });
      setLoading(false);
    });

    return () => controller.abort();
  }, []);

  const dashboard = nestedRecord(data?.dashboard);
  const previousSummary = nestedRecord(data?.summary);
  const currentTotal = readNumber(dashboard, [
    "totalIncidents",
    "total_incidents",
    "total",
    "incidentsTotal",
  ]);
  const currentOpen = readNumber(dashboard, [
    "openIncidents",
    "open_incidents",
    "open",
    "pending",
  ]);
  const currentClosed = readNumber(dashboard, [
    "closedIncidents",
    "closed_incidents",
    "closed",
    "resolved",
  ]);
  const currentCritical = readNumber(dashboard, [
    "criticalIncidents",
    "critical_incidents",
    "critical",
  ]);
  const previousTotal = readNumber(previousSummary, [
    "totalIncidents",
    "total_incidents",
    "total",
    "incidentsTotal",
  ]);
  const categoryData =
    data?.categories === null || data?.categories === undefined
      ? null
      : readDistribution(data.categories, "category");
  const statusData =
    data?.statuses === null || data?.statuses === undefined
      ? null
      : readDistribution(data.statuses, "status");

  function formatMetric(value: number | null) {
    return value === null ? "—" : value.toLocaleString("es-MX");
  }

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Resumen general</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#102b3a]">
            Incidencias del campus
          </h2>
        </div>
        <p className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600">
          Periodo: <span className="font-medium text-[#102b3a]">Este mes</span>
        </p>
      </div>

      {data?.errors.map((error) => (
        <p
          className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          key={error}
          role="alert"
        >
          {error}
        </p>
      ))}

      <section
        aria-label="Indicadores de incidencias"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          accent
          detail={previousTotal === null ? "Registradas en el periodo" : `Mes anterior: ${formatMetric(previousTotal)}`}
          label="Total de incidencias"
          value={loading ? "…" : formatMetric(currentTotal)}
        />
        <StatCard
          detail="Requieren seguimiento"
          label="Abiertas"
          value={loading ? "…" : formatMetric(currentOpen)}
        />
        <StatCard
          detail="Atendidas y finalizadas"
          label="Cerradas"
          value={loading ? "…" : formatMetric(currentClosed)}
        />
        <StatCard
          detail="Prioridad de atención crítica"
          label="Críticas"
          value={loading ? "…" : formatMetric(currentCritical)}
        />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ChartCard
          description="Distribución de reportes por tipo de incidencia"
          title="Incidencias por categoría"
        >
          <BarList data={categoryData} loading={loading} />
        </ChartCard>
        <ChartCard
          description="Situación actual de las incidencias registradas"
          title="Incidencias por estado"
        >
          <BarList data={statusData} loading={loading} />
        </ChartCard>
      </div>
    </div>
  );
}
