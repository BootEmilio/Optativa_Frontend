"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AnalystHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useAuth();
  const headings: Record<string, string> = {
    "/analista/dashboard": "Panel de reportes",
    "/analista/reportes": "Reportes",
    "/analista/tiempos-resolucion": "Tiempos de resolución",
    "/analista/fallas-recurrentes": "Fallas recurrentes",
  };
  const heading = headings[pathname] ?? "Panel de reportes";

  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-white/10 bg-[#102b3a] px-5 text-white sm:px-8">
      <div>
        <p className="text-xs text-slate-400">UTM Desk / Analítica</p>
        <h1 className="mt-1 text-sm font-semibold sm:text-base">{heading}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{usuario?.nombre ?? "Usuario"}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {usuario?.correo ?? "Sesión activa"}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-[#8ce2d8]"
        >
          {usuario?.nombre.slice(0, 2).toUpperCase() ?? "UT"}
        </div>
        <button
          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          onClick={() => {
            cerrarSesion();
            router.replace("/login");
          }}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
