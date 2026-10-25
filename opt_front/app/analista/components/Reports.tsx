"use client";

import { useEffect, useState } from "react";
import {
  getAnalystReports,
  readDistribution,
} from "@/services/analistaService";
import ReportFilters, { type ReportFiltersValue } from "./ReportFilters";
import ReportTabs, { type ReportDimension } from "./ReportTabs";

type AggregateRow = {
  label: string;
  count: number;
  percentage: number;
};

const dimensions: Record<ReportDimension, string> = {
  category: "Categoría",
  building: "Edificio",
  priority: "Prioridad",
  status: "Estado",
};

const initialFilters: ReportFiltersValue = {
  period: "this_month",
  category: "all",
  building: "all",
  priority: "all",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido al consultar la API.";
}

function Chart({
  rows,
  dimensionLabel,
}: {
  rows: AggregateRow[];
  dimensionLabel: string;
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No hay incidencias que coincidan con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div
      aria-label={`Gráfica de incidencias por ${dimensionLabel.toLowerCase()}`}
      className="space-y-5"
      role="img"
    >
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">{row.label}</span>
            <span className="text-slate-600">
              <strong className="font-semibold text-[#102b3a]">{row.count}</strong>
              <span> incidencias</span>
              <span className="ml-2 font-medium text-[#00685f]">
                {row.percentage}%
              </span>
            </span>
          </div>
          <div className="h-7 overflow-hidden rounded-md bg-slate-100">
            <div
              className="h-full rounded-md bg-[#00685f] transition-[width] duration-300"
              style={{ width: `${(row.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [draftFilters, setDraftFilters] =
    useState<ReportFiltersValue>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFiltersValue>(initialFilters);
  const [selectedTab, setSelectedTab] = useState<ReportDimension>("category");
  const [result, setResult] = useState<{
    key: string;
    rows: AggregateRow[];
    error: string | null;
  } | null>(null);
  const requestKey = JSON.stringify([selectedTab, appliedFilters]);
  const loading = result?.key !== requestKey;
  const rows = loading ? [] : result.rows;
  const error = loading ? null : result.error;

  useEffect(() => {
    const controller = new AbortController();

    void getAnalystReports(
      {
        dimension: selectedTab,
        period: appliedFilters.period,
        category: appliedFilters.category,
        building: appliedFilters.building,
        priority: appliedFilters.priority,
      },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        const distribution = readDistribution(response, selectedTab);
        if (distribution === null) {
          setResult({
            key: JSON.stringify([selectedTab, appliedFilters]),
            rows: [],
            error: "La API devolvió un formato de reporte no reconocido.",
          });
          return;
        }
        const total = distribution.reduce((sum, row) => sum + row.count, 0);
        setResult({
          key: JSON.stringify([selectedTab, appliedFilters]),
          rows: distribution
            .map((row) => ({
              ...row,
              percentage:
                total > 0 ? Math.round((row.count / total) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count),
          error: null,
        });
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            key: JSON.stringify([selectedTab, appliedFilters]),
            rows: [],
            error: errorMessage(requestError),
          });
        }
      });

    return () => controller.abort();
  }, [appliedFilters, selectedTab]);

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const dimensionLabel = dimensions[selectedTab];

  function clearFilters() {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  function exportCsv() {
    const csvRows = [
      [dimensionLabel, "Incidencias", "Porcentaje"],
      ...rows.map((row) => [row.label, String(row.count), `${row.percentage}%`]),
      ["Total", String(total), total > 0 ? "100%" : "0%"],
    ];
    const csv = csvRows
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${selectedTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#00685f]">Inteligencia operativa</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#102b3a]">
          Reportes de incidencias
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Consulta y comparación de incidencias según diferentes criterios.
        </p>
      </div>

      <ReportFilters
        onApply={() => setAppliedFilters(draftFilters)}
        onChange={setDraftFilters}
        onClear={clearFilters}
        value={draftFilters}
      />

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] sm:p-6">
        <ReportTabs onSelect={setSelectedTab} selected={selectedTab} />
        <div
          aria-labelledby={`report-tab-${selectedTab}`}
          className="pt-6"
          id={`report-panel-${selectedTab}`}
          role="tabpanel"
          tabIndex={0}
        >
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#102b3a]">
                  Incidencias por {dimensionLabel.toLowerCase()}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Distribución absoluta y porcentual durante el periodo seleccionado.
                </p>
              </div>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Métricas consolidadas (N = {total})
              </p>
            </div>
          </div>

          {error && (
            <p
              className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500" role="status">
              Cargando reporte...
            </p>
          ) : (
            <div className="mx-auto grid max-w-5xl gap-7 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-lg bg-slate-50/70 p-4 sm:p-6">
                <Chart dimensionLabel={dimensionLabel} rows={rows} />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[390px] text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                          {dimensionLabel}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                          Incidencias
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                          Porcentaje
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => (
                        <tr className="hover:bg-slate-50/70" key={row.label}>
                          <td className="px-4 py-3.5 text-sm font-medium text-[#102b3a]">
                            {row.label}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#102b3a]">
                            {row.count}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium text-[#00685f]">
                            {row.percentage}%
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={3}>
                            Sin resultados para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50">
                      <tr className="font-semibold">
                        <td className="px-4 py-3.5 text-sm text-[#102b3a]">Total</td>
                        <td className="px-4 py-3.5 text-right text-sm text-[#00685f]">
                          {total}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-[#00685f]">
                          {total > 0 ? "100%" : "0%"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Datos consultados al backend.</p>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#00685f] transition hover:bg-[#eef7f6] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30"
              disabled={loading || rows.length === 0}
              onClick={exportCsv}
              type="button"
            >
              Exportar desglose (CSV)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
