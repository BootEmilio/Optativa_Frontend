import { EstadoIncidencia } from '@/types/incidencia';

const estadoClasses: Record<EstadoIncidencia, string> = {
  abierta: 'bg-rose-100 text-rose-800 border border-rose-200',
  en_proceso: 'bg-amber-100 text-amber-800 border border-amber-200',
  pendiente: 'bg-slate-200 text-slate-700 border border-slate-300',
  resuelta: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  cerrada: 'bg-slate-200 text-slate-700 border border-slate-300',
  reabierta: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
};

const estadoLabels: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  reabierta: 'Reabierta',
};

export function StatusBadge({ estado }: { estado: EstadoIncidencia }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${estadoClasses[estado]}`}
    >
      {estadoLabels[estado]}
    </span>
  );
}
