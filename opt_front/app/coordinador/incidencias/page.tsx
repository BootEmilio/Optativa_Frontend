'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { coordinadorService } from '../../../services/coordinadorService';
import { Incidencia, EstadoIncidencia } from '../../../types/incidencia';
import { IncidentTable } from '../../../components/coordinador/IncidentTable';
import { TicketIcon, RefreshIcon } from '../../../components/coordinador/Icons';
import { LoadError } from '../../../components/coordinador/LoadError';

function IncidenciasContent() {
  const searchParams = useSearchParams();
  const estadoQuery = searchParams.get('estado') as EstadoIncidencia | null;

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await coordinadorService.getIncidencias();
      setIncidencias(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las incidencias'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#3E828E] uppercase tracking-wider mb-1">
            <TicketIcon className="w-4 h-4 text-[#3E828E]" />
            <span>Gestión Operativa de Tickets</span>
          </div>
          <h2 className="text-2xl font-bold text-[#27153D]">
            Incidencias del campus
          </h2>
          <p className="text-sm text-[#27153D]/80 mt-0.5">
            Supervisa, asigna técnicos, modula prioridades y audita las resoluciones del campus.
          </p>
        </div>

        <div>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 rounded-lg border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] hover:bg-[#F8F9FA]/40 hover:border-[#3E828E] transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Recargar Registros</span>
          </button>
        </div>
      </div>

      {error ? (
        <LoadError mensaje={error} onRetry={cargarDatos} />
      ) : cargando ? (
        <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-12 text-center text-gray-400">
          <RefreshIcon className="w-8 h-8 mx-auto mb-2 text-[#3E828E] animate-spin" />
          <p className="font-semibold text-sm text-[#27153D]">
            Cargando incidencias del área...
          </p>
        </div>
      ) : (
        <IncidentTable
          incidencias={incidencias}
          onIncidenciasUpdated={cargarDatos}
          filtroEstadoInicial={estadoQuery || 'todos'}
        />
      )}
    </div>
  );
}

export default function CoordinadorIncidenciasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando gestión de incidencias...
        </div>
      }
    >
      <IncidenciasContent />
    </Suspense>
  );
}
