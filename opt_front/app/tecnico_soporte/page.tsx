const stats = [
  { label: 'Asignadas hoy', value: 12, tone: 'bg-[#293B4E] text-white' },
  { label: 'En proceso', value: 5, tone: 'bg-[#E8F5F6] text-[#1B6870]' },
  { label: 'Pendientes', value: 3, tone: 'bg-[#FDECEC] text-[#9C2D2D]' },
  { label: 'Resueltas', value: 8, tone: 'bg-[#EAF6F0] text-[#1D6A4E]' },
];

const alertas = [
  {
    codigo: 'INC-2026-0113',
    titulo: 'Switch sin conectividad en laboratorio',
    ubicacion: 'Edificio B — Lab. Cómputo 3 (Planta Alta)',
    reportante: 'Prof. Alejandro Morales',
    tiempo: 'Último reporte hace 25 min',
    prioridad: 'Alta',
    prioridadTone: 'bg-[#E8F5F6] text-[#1B6870]',
    estado: 'En proceso',
    estadoTone: 'bg-[#EAF6F0] text-[#1D6A4E]',
  },
  {
    codigo: 'INC-2026-0114',
    titulo: 'Contacto eléctrico con chispas',
    ubicacion: 'Aula Magna 2 — Planta Alta',
    reportante: 'Lic. Claudia Estrada',
    tiempo: 'Reportado hace 40 min',
    prioridad: 'Crítica',
    prioridadTone: 'bg-[#FDECEC] text-[#9C2D2D]',
    estado: 'Pendiente',
    estadoTone: 'bg-[#F5F6F8] text-[#4A4F5A]',
  },
  {
    codigo: 'INC-2026-0118',
    titulo: 'Falla de enlace en Access Point de Biblioteca',
    ubicacion: 'Edificio Central — Sala de Lectura',
    reportante: 'Mtro. Fernando Ramos',
    tiempo: 'Reportado hace 1 hora',
    prioridad: 'Media',
    prioridadTone: 'bg-[#F0F4FF] text-[#3B4D73]',
    estado: 'Pendiente',
    estadoTone: 'bg-[#F5F6F8] text-[#4A4F5A]',
  },
];

const guiaRapida = [
  'Revisa el perímetro y señal de energía antes de intervenir.',
  'Valida conexión de red y registros del equipo afectado.',
  'Actualiza el historial con evidencia y tiempo de atención.',
];

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconCard({ kind }: { kind: 'shield' | 'checklist' | 'badge' | 'refresh' }) {
  const base = 'h-5 w-5';
  switch (kind) {
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={base}>
          <path d="M12 3 5 6v6c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'checklist':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={base}>
          <path d="M9 7h11M9 12h11M9 17h11" />
          <path d="M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      );
    case 'badge':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={base}>
          <path d="M7 7h10v6a5 5 0 0 1-10 0V7Z" />
          <path d="M9 17v3l3-2 3 2v-3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={base}>
          <path d="M20 12a8 8 0 1 1-8-8" />
          <path d="M20 4v8h-8" />
        </svg>
      );
  }
}

export default function TecnicoDashboardPage() {
  return (
    <div className="mx-auto max-w-[1280px] py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold tracking-tight text-[#111C2D]">Panel principal</h1>
            <span className="inline-flex items-center rounded-full bg-[#E7EEFF] px-2.5 py-1 text-[11px] font-semibold text-[#43474C]">
              Técnico
            </span>
          </div>
          <p className="mt-1 text-[14px] text-[#43474C]">
            Resumen de tus incidencias asignadas y prioridades del turno
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF6F0] px-3 py-1.5 text-[12px] font-semibold text-[#1D6A4E]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1D6A4E]" />
            Estado operativo
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D5DDE7] bg-white px-3 py-2 text-[12px] font-medium text-[#273A4E] transition hover:bg-slate-50"
          >
            <IconCard kind="refresh" />
            Actualizar
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#E7EEFF] bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>
              {item.label}
            </div>
            <div className="mt-4 text-[32px] font-bold tracking-tight text-[#111C2D]">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#111C2D]">Incidencias que requieren atención</span>
            </div>
            <button type="button" className="text-[13px] font-medium text-[#1B6870] hover:underline">
              Ver asignadas
            </button>
          </div>

          <div className="space-y-4">
            {alertas.map((incidencia) => (
              <div key={incidencia.codigo} className="rounded-2xl border border-[#EEF3FF] bg-[#F9FAFF] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#E7EEFF] px-2 py-1 text-[11px] font-semibold tracking-wide text-[#111C2D]">
                      {incidencia.codigo}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${incidencia.prioridadTone}`}>
                      Prioridad {incidencia.prioridad}
                    </span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${incidencia.estadoTone}`}>
                    {incidencia.estado}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-[18px] font-semibold text-[#111C2D]">{incidencia.titulo}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[#43474C]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#1B6870]"><IconLocation /></span>
                      {incidencia.ubicacion}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#5A6470]"><IconUser /></span>
                      {incidencia.reportante}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EEF3FF] pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#43474C]">
                    <span className="text-[#1B6870]"><IconClock /></span>
                    {incidencia.tiempo}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1B6870] px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-[#155F66]"
                  >
                    Ver incidencia
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M5 12h14" />
                      <path d="m13 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#1B6870]"><IconCard kind="badge" /></span>
              <h3 className="text-[18px] font-semibold text-[#111C2D]">Turno y Guardia de Hoy</h3>
            </div>

            <div className="mt-4 space-y-3 text-[13px] text-[#43474C]">
              <div className="flex items-start justify-between gap-3 border-b border-[#EEF3FF] pb-2">
                <span>Sede:</span>
                <span className="font-medium text-[#111C2D]">Campus Central</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-[#EEF3FF] pb-2">
                <span>Horario:</span>
                <span className="font-medium text-[#111C2D]">07:00 a 15:00 hrs</span>
              </div>
              <div className="flex items-start justify-between gap-3 border-b border-[#EEF3FF] pb-2">
                <span>Supervisor:</span>
                <span className="font-medium text-[#111C2D]">Ing. Roberto Méndez</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span>Mesa de Ayuda:</span>
                <span className="font-semibold text-[#1B6870]">Ext. 2401</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F0F3FF] p-3 text-[12px] text-[#43474C]">
              <span className="text-[#1B6870]"><IconCard kind="shield" /></span>
              Radio frecuencia local operativa en Canal 3.
            </div>
          </div>

          <div className="rounded-3xl border border-[#E7EEFF] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#1B6870]"><IconCard kind="checklist" /></span>
              <h3 className="text-[18px] font-semibold text-[#111C2D]">Guía rápida de atención</h3>
            </div>

            <ol className="mt-4 space-y-3">
              {guiaRapida.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-[13px] text-[#43474C]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DFF6F6] text-[11px] font-bold text-[#1B6870]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
