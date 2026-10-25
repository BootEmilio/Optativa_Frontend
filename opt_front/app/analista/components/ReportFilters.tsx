"use client";

import type { AnalystPeriod } from "@/services/analistaService";

export type ReportFiltersValue = {
  period: AnalystPeriod;
  category: string;
  building: string;
  priority: string;
};

type ReportFiltersProps = {
  value: ReportFiltersValue;
  onChange: (filters: ReportFiltersValue) => void;
  onApply: () => void;
  onClear: () => void;
};

const selectClassName =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#102b3a] outline-none transition focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15";

export default function ReportFilters({
  value,
  onChange,
  onApply,
  onClear,
}: ReportFiltersProps) {
  function updateFilter(key: keyof ReportFiltersValue, nextValue: string) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section
      aria-label="Filtros de reportes"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#102b3a]">
            Filtros de consulta
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajusta los criterios para consultar el backend.
          </p>
        </div>
        <span className="rounded-md bg-[#eef7f6] px-2.5 py-1 text-xs font-medium text-[#00685f]">
          Datos en tiempo real
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Periodo
          <select
            className={selectClassName}
            onChange={(event) => updateFilter("period", event.target.value)}
            value={value.period}
          >
            <option value="this_month">Este mes</option>
            <option value="last_month">Mes pasado</option>
            <option value="last_30_days">Últimos 30 días</option>
            <option value="last_7_days">Últimos 7 días</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Categoría
          <select
            className={selectClassName}
            onChange={(event) => updateFilter("category", event.target.value)}
            value={value.category}
          >
            <option value="all">Todas</option>
            <option value="computo_redes">Cómputo y redes</option>
            <option value="infraestructura">Infraestructura</option>
            <option value="academico">Académico</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Edificio
          <select
            className={selectClassName}
            onChange={(event) => updateFilter("building", event.target.value)}
            value={value.building}
          >
            <option value="all">Todos</option>
            <option value="Edificio A (Aulas)">Edificio A (Aulas)</option>
            <option value="Edificio B (Laboratorios)">
              Edificio B (Laboratorios)
            </option>
            <option value="Edificio C (Administrativo)">
              Edificio C (Administrativo)
            </option>
            <option value="Biblioteca Central">Biblioteca Central</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Prioridad
          <select
            className={selectClassName}
            onChange={(event) => updateFilter("priority", event.target.value)}
            value={value.priority}
          >
            <option value="all">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
            <option value="critica">Crítica</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          onClick={onClear}
          type="button"
        >
          Limpiar
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-medium text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2"
          onClick={onApply}
          type="button"
        >
          Aplicar filtros
        </button>
      </div>
    </section>
  );
}
