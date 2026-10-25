type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
};

export default function StatCard({
  label,
  value,
  detail,
  accent = false,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,43,58,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span
          aria-hidden="true"
          className={`mt-1 size-2 rounded-full ${accent ? "bg-[#20b6a7]" : "bg-slate-300"}`}
        />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#102b3a]">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
