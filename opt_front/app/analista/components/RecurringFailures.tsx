"use client";

import { useEffect, useState } from "react";
import {
  getRecurringFailures,
  nestedRecord,
  readNumber,
  readRows,
  readText,
  type ApiRecord,
} from "@/services/analistaService";

type Failure = {
  name: string;
  description: string;
  count: number;
  building: string;
  priority: string;
  share: number;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido al consultar la API.";
}

function exportReport(failures: Failure[]) {
  const csvRows = [
    ["Problema", "Reportes", "Edificio afectado", "Prioridad"],
    ...failures.map((failure) => [
      failure.name,
      String(failure.count),
      failure.building,
      failure.priority,
    ]),
  ];
  const csv = csvRows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fallas-recurrentes.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function FailureCard({ failure, featured = false }: { failure: Failure; featured?: boolean }) {
  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] ${
        featured ? "border-[#9ddbd4]" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {featured ? "Mayor incidencia" : failure.priority}
          </p>
          <h3 className="mt-2 text-base font-semibold text-[#102b3a]">
            {failure.name}
          </h3>
        </div>
        <span
          aria-hidden="true"
          className={`mt-1 size-2.5 shrink-0 rounded-full ${
            failure.priority.toLowerCase().includes("crít")
              ? "bg-rose-500"
              : failure.priority.toLowerCase().includes("alta")
                ? "bg-amber-500"
                : "bg-[#20b6a7]"
          }`}
        />
      </div>
      <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
        {failure.description || "Sin descripción adicional."}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-[#102b3a]">
            {failure.count.toLocaleString("es-MX")}
          </p>
          <p className="text-xs text-slate-500">reportes</p>
        </div>
        <p className="text-sm font-semibold text-[#00685f]">
          {failure.share.toLocaleString("es-MX", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          % del total
        </p>
      </div>
    </article>
  );
}

export default function RecurringFailures() {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getRecurringFailures(controller.signal)
      .then((response) => setPayload(response))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const response = nestedRecord(payload);
  const rawRows = readRows(payload, [
    "failures",
    "recurringFailures",
    "recurring_failures",
    "items",
    "results",
    "data",
  ]);
  const parsedFailures = (rawRows ?? []).flatMap((row: ApiRecord) => {
    const name = readText(row, ["name", "title", "problem", "failure", "category"]);
    const count = readNumber(row, ["count", "total", "incidents", "tickets", "frequency"]);
    if (!name || count === null) return [];
    return [{
      name,
      description: readText(row, ["description", "details", "summary"]) ?? "",
      count,
      building: readText(row, ["building", "location", "buildingName"]) ?? "—",
      priority: readText(row, ["priority", "severity"]) ?? "—",
      share: readNumber(row, ["share", "percentage", "percent"]) ?? 0,
    }];
  });
  const totalReports =
    readNumber(response, ["totalReports", "total_reports", "total", "count"]) ??
    parsedFailures.reduce((total, failure) => total + failure.count, 0);
  const failures = parsedFailures.map((failure) => ({
    ...failure,
    share:
      failure.share ||
      (totalReports > 0 ? (failure.count / totalReports) * 100 : 0),
  }));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#00685f]">
            Patrones críticos · datos del backend
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#102b3a]">
            Fallas recurrentes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Identificación de problemas que se presentan con mayor frecuencia.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-medium text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || failures.length === 0}
          onClick={() => exportReport(failures)}
          type="button"
        >
          Exportar resumen
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

      {loading ? (
        <p className="rounded-lg bg-white px-4 py-10 text-center text-sm text-slate-500" role="status">
          Cargando fallas recurrentes...
        </p>
      ) : failures.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          {error
            ? "No se pudieron cargar las fallas recurrentes."
            : "La API no devolvió fallas en un formato reconocido."}
        </p>
      ) : (
        <>
          <section
            aria-label="Principales fallas recurrentes"
            className="grid gap-4 md:grid-cols-3"
          >
            {failures.map((failure, index) => (
              <FailureCard
                failure={failure}
                featured={index === 0}
                key={failure.name}
              />
            ))}
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] sm:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#102b3a]">
                  Principales fallas
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Problemas recurrentes por edificio y prioridad.
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Total: {totalReports.toLocaleString("es-MX")} reportes
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                        Problema
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                        Reportes
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                        Edificio
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500" scope="col">
                        Prioridad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {failures.map((failure) => (
                      <tr className="hover:bg-slate-50/70" key={failure.name}>
                        <td className="px-4 py-3.5 text-sm font-medium text-[#102b3a]">
                          {failure.name}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#102b3a]">
                          {failure.count}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                          {failure.building}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">
                          {failure.priority}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 p-4 sm:p-5">
              <h4 className="text-sm font-semibold text-[#102b3a]">
                Frecuencia por tipo de falla
              </h4>
              <p className="mb-5 mt-1 text-xs text-slate-500">
                Volumen reportado y porcentaje del total.
              </p>
              <div className="space-y-5">
                {failures.map((failure) => (
                  <div key={failure.name}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-700">
                        {failure.name}
                      </span>
                      <span className="text-slate-600">
                        <strong className="font-semibold text-[#102b3a]">
                          {failure.count}
                        </strong>{" "}
                        reportes
                        <span className="ml-2 font-medium text-[#00685f]">
                          {failure.share.toLocaleString("es-MX", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </span>
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#168f85]"
                        style={{
                          width: `${Math.min(failure.share, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
