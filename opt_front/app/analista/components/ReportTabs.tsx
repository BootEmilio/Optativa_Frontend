"use client";

export type ReportDimension = "category" | "building" | "priority" | "status";

const tabs: { id: ReportDimension; label: string }[] = [
  { id: "category", label: "Categoría" },
  { id: "building", label: "Edificio" },
  { id: "priority", label: "Prioridad" },
  { id: "status", label: "Estado" },
];

type ReportTabsProps = {
  selected: ReportDimension;
  onSelect: (dimension: ReportDimension) => void;
};

export default function ReportTabs({
  selected,
  onSelect,
}: ReportTabsProps) {
  return (
    <div
      aria-label="Tipo de desglose"
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          aria-controls={`report-panel-${tab.id}`}
          aria-selected={selected === tab.id}
          className={`-mb-px min-h-12 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors ${
            selected === tab.id
              ? "border-[#00685f] text-[#00685f]"
              : "border-transparent text-slate-500 hover:text-[#102b3a]"
          }`}
          id={`report-tab-${tab.id}`}
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
