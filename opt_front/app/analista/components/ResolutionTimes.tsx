"use client";

import StatCard from "./StatCard";

const resolutionByPriority = [
  { priority: "Crítica", hours: 3 },
  { priority: "Alta", hours: 2 },
  { priority: "Media", hours: 1.8 },
  { priority: "Baja", hours: 1.2 },
];

const representativeCases = [
  { id: "INC-2026-0114", priority: "Crítica", hours: 3 },
  { id: "INC-2026-0113", priority: "Alta", hours: 2 },
  { id: "INC-2026-0116", priority: "Alta", hours: 1.5 },
];

function exportReport() {
  const rows = [
    ["Incidencia", "Prioridad", "Tiempo de resolución (h)"],
    ...representativeCases.map((item) => [
      item.id,
      item.priority,
      String(item.hours),
    ]),
  ];
  const csv = rows
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

function PriorityChart() {
  const maxHours = Math.max(...resolutionByPriority.map((item) => item.hours));

  return (
    <div
      aria-label="Tiempo promedio de resolución por prioridad, en horas"
      className="space-y-5"
      role="img"
    >
      {resolutionByPriority.map((item) => (
        <div key={item.priority}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.priority}</span>
            <span className="font-semibold tabular-nums text-[#102b3a]">
              {item.hours.toLocaleString("es-MX", {
                maximumFractionDigits: 1,
              })}{" "}
              h
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
  );
}

export default function ResolutionTimes() {
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
            Análisis del tiempo empleado en la atención y resolución de
            incidencias en campus central.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600">
            Periodo:{" "}
            <span className="font-medium text-[#102b3a]">Últimos 30 días</span>
          </p>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-medium text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2"
            onClick={exportReport}
            type="button"
          >
            Exportar reporte
          </button>
        </div>
      </div>

      <section
        aria-label="Indicadores de tiempo de resolución"
        className="grid gap-4 md:grid-cols-3"
      >
        <StatCard
          accent
          detail="14% menos que el mes anterior"
          label="Tiempo promedio"
          value="2.1 h"
        />
        <StatCard
          detail="30 minutos"
          label="Tiempo mínimo"
          value="0.5 h"
        />
        <StatCard
          detail="Casos con escalación técnica"
          label="Tiempo máximo"
          value="6.2 h"
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

        <div className="grid gap-7 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg bg-slate-50/70 p-4 sm:p-6">
            <PriorityChart />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-4">
              <h4 className="text-sm font-semibold text-[#102b3a]">
                Muestreo de casos representativos
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {representativeCases.length} registros auditados
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[390px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      scope="col"
                    >
                      Incidencia
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      scope="col"
                    >
                      Prioridad
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                      scope="col"
                    >
                      Tiempo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {representativeCases.map((item) => (
                    <tr className="hover:bg-slate-50/70" key={item.id}>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-[#102b3a]">
                        {item.id}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {item.priority}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-[#102b3a]">
                        {item.hours} h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>
            Fuente de demostración: colección{" "}
            <span className="font-medium text-slate-700">
              resolutions_analytics
            </span>
            .
          </p>
          <p>Datos mock; sin conexión con la API.</p>
        </div>
      </section>
    </div>
  );
}
