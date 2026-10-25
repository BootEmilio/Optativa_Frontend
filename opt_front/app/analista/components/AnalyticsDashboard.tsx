import StatCard from "./StatCard";

const categoryData = [
  { label: "Infraestructura", value: 34 },
  { label: "Red y conectividad", value: 26 },
  { label: "Equipo de cómputo", value: 21 },
  { label: "Servicios generales", value: 19 },
];

const statusData = [
  { label: "Abiertas", value: 38, color: "bg-[#20b6a7]" },
  { label: "En proceso", value: 24, color: "bg-[#79cfc4]" },
  { label: "Cerradas", value: 62, color: "bg-[#102b3a]" },
];

function BarList({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div className="space-y-2" key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium tabular-nums text-[#102b3a]">
              {item.value}
            </span>
          </div>
          <div
            aria-label={`${item.value} incidencias`}
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            role="img"
          >
            <div
              className={`h-full rounded-full ${item.color ?? "bg-[#20b6a7]"}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
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

      <section
        aria-label="Indicadores de incidencias"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          accent
          detail="Registradas en el periodo"
          label="Total de incidencias"
          value="148"
        />
        <StatCard detail="Requieren seguimiento" label="Abiertas" value="38" />
        <StatCard detail="Atendidas y finalizadas" label="Cerradas" value="62" />
        <StatCard detail="Prioridad de atención alta" label="Críticas" value="9" />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ChartCard
          description="Distribución de reportes por tipo de incidencia"
          title="Incidencias por categoría"
        >
          <BarList data={categoryData} />
        </ChartCard>
        <ChartCard
          description="Situación actual de las incidencias registradas"
          title="Incidencias por estado"
        >
          <BarList data={statusData} />
        </ChartCard>
      </div>
      <p className="mt-5 text-xs text-slate-400">
        Datos de demostración para la construcción de la interfaz.
      </p>
    </div>
  );
}
