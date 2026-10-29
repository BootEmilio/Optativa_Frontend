'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { coordinadorService } from '../../../../services/coordinadorService';
import {
  Incidencia,
  PrioridadIncidencia,
  EstadoIncidencia,
  CategoriaIncidencia,
} from '../../../../types/incidencia';
import { Timeline } from '../../../../components/coordinador/Timeline';
import { TagManager } from '../../../../components/coordinador/TagManager';
import { AssignTecnicoModal } from '../../../../components/coordinador/AssignTecnicoModal';
import { CloseTicketModal } from '../../../../components/coordinador/CloseTicketModal';
import { LoadError } from '../../../../components/coordinador/LoadError';
import {
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
  RefreshIcon,
  BuildingIcon,
  PaperClipIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '../../../../components/coordinador/Icons';

function IncidenciaDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);

  // Cambio de prioridad
  const [cambiandoPrioridad, setCambiandoPrioridad] = useState<boolean>(false);
  const [errorPrioridad, setErrorPrioridad] = useState<string | null>(null);

  const cargarIncidencia = useCallback(async () => {
    if (!id) return;
    try {
      setCargando(true);
      setError(null);
      const data = await coordinadorService.getIncidenciaById(id);
      if (!data) {
        setError(`No se encontró la incidencia con identificador "${id}".`);
        setIncidencia(null);
      } else {
        setIncidencia(data);
      }
    } catch (err: unknown) {
      setIncidencia(null);
      setError(
        err instanceof Error ? err.message : 'Error al cargar la incidencia'
      );
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargarIncidencia();
  }, [cargarIncidencia]);

  const handlePrioridadChange = async (nueva: PrioridadIncidencia) => {
    if (!incidencia || incidencia.prioridad === nueva) return;
    try {
      setCambiandoPrioridad(true);
      setErrorPrioridad(null);
      const actualizada = await coordinadorService.establecerPrioridad(
        incidencia._id,
        nueva,
        `Coordinación actualizó la prioridad a ${nueva.toUpperCase()}.`
      );
      setIncidencia(actualizada);
    } catch (err) {
      setErrorPrioridad(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar la prioridad'
      );
    } finally {
      setCambiandoPrioridad(false);
    }
  };

  const formatCategoria = (cat: CategoriaIncidencia) => {
    switch (cat) {
      case 'computo_redes':
        return 'Cómputo y Redes';
      case 'infraestructura':
        return 'Infraestructura y Mantenimiento';
      case 'academico':
        return 'Sistemas y Servicios Académicos';
      default:
        return cat;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  const getEstadoBadge = (estado: EstadoIncidencia) => {
    switch (estado) {
      case 'abierta':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Abierta
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#A6C9B6]/25 text-[#3E828E] border border-[#A6C9B6]/60">
            En Proceso
          </span>
        );
      case 'resuelta':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resuelta (Por Auditar)
          </span>
        );
      case 'cerrada':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#F8F9FA] text-[#27153D] border border-[#A6C9B6]/40">
            Cerrada
          </span>
        );
      case 'reabierta':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
            Reabierta
          </span>
        );
    }
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-12 text-center text-gray-400">
        <RefreshIcon className="w-8 h-8 mx-auto mb-2 text-[#3E828E] animate-spin" />
        <p className="font-semibold text-sm text-[#27153D]">
          Cargando detalle de la incidencia...
        </p>
      </div>
    );
  }

  if (error || !incidencia) {
    return (
      <div className="space-y-4">
        <LoadError
          mensaje={error || 'Incidencia no encontrada'}
          onRetry={cargarIncidencia}
        />
        <div className="text-center">
          <Link
            href="/coordinador/incidencias"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#27153D] text-white text-xs font-bold"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/coordinador/incidencias"
            className="p-2 rounded-lg bg-white border border-[#A6C9B6]/40 text-[#27153D] hover:text-[#3E828E] hover:border-[#3E828E] hover:bg-[#F8F9FA]/30 transition-colors shadow-2xs"
            title="Volver a incidencias"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#3E828E] uppercase tracking-wider">
                {incidencia.codigo}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                Registrado el {formatDate(incidencia.fecha_creacion)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#27153D] line-clamp-1">
              {incidencia.titulo}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Asignar / Reasignar Técnico */}
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-white border border-[#3E828E] text-[#3E828E] hover:bg-[#A6C9B6]/20 text-xs font-bold transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <UserIcon className="w-4 h-4 text-[#3E828E]" />
            <span>
              {incidencia.tecnico_asignado ? 'Reasignar Técnico' : 'Asignar Técnico'}
            </span>
          </button>

          {incidencia.estado === 'resuelta' && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Auditar y Cerrar Ticket</span>
            </button>
          )}

          {/* Reabrir si está cerrada */}
          {incidencia.estado === 'cerrada' && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#F6B6B7] hover:bg-[#f39ea0] text-[#27153D] text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Reabrir Incidencia</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Detailed Info & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#A6C9B6]/20">
              <div className="flex items-center space-x-2">
                {getEstadoBadge(incidencia.estado)}
                <span className="text-xs text-gray-500 font-medium">
                  Categoría Oficial: <b className="text-[#27153D]">{formatCategoria(incidencia.categoria)}</b>
                </span>
              </div>

              {incidencia.horas_invertidas && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#F8F9FA]/50 border border-[#A6C9B6]/30 text-xs text-[#27153D] font-semibold">
                  <ClockIcon className="w-4 h-4 text-[#3E828E]" />
                  <span>{incidencia.horas_invertidas} horas invertidas</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-[#27153D] uppercase tracking-wider mb-2">
                Descripción de la Falla
              </h3>
              <p className="text-sm text-[#27153D] leading-relaxed whitespace-pre-line bg-[#F8F9FA]/40 p-4 rounded-lg border border-[#A6C9B6]/30">
                {incidencia.descripcion}
              </p>
            </div>

            {/* Specific Technical Details (NoSQL Flexible Field) */}
            {incidencia.detalle_especifico && (
              <div>
                <h3 className="text-xs font-bold text-[#27153D] uppercase tracking-wider mb-2">
                  Especificaciones Técnicas Registradas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(incidencia.detalle_especifico).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-[#F8F9FA]/40 rounded-lg border border-[#A6C9B6]/30 text-xs"
                    >
                      <span className="font-semibold text-gray-500 capitalize block mb-0.5">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-bold text-[#27153D] break-words">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Attachments */}
            {incidencia.evidencias_adjuntas && incidencia.evidencias_adjuntas.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#27153D] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <PaperClipIcon className="w-4 h-4 text-[#3E828E]" />
                  <span>Evidencias Adjuntas ({incidencia.evidencias_adjuntas.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {incidencia.evidencias_adjuntas.map((ev, idx) => (
                    <a
                      key={idx}
                      href={ev.url_storage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-[#F8F9FA]/40 hover:bg-[#A6C9B6]/20 border border-[#A6C9B6]/30 hover:border-[#3E828E] rounded-lg transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <PaperClipIcon className="w-4 h-4 text-gray-400 group-hover:text-[#3E828E]" />
                        <div className="truncate text-xs">
                          <p className="font-bold text-[#27153D] truncate">
                            {ev.nombre_archivo}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {ev.peso_kb} KB • {ev.tipo_mime}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#3E828E] shrink-0">
                        Ver
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Component (Supervisión de avances) */}
          <Timeline historial={incidencia.historial_seguimiento} />
        </div>

        {/* Right Column (4 cols): Meta Cards, Priority, Tags, Technician */}
        <div className="lg:col-span-4 space-y-6">
          {/* Priority Modifier Card (Permiso: incidencias:establecer_prioridad) */}
          <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#27153D] uppercase tracking-wider">
                Nivel de Prioridad
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {cambiandoPrioridad ? 'Actualizando...' : 'Editable'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['baja', 'media', 'alta', 'critica'] as PrioridadIncidencia[]).map(
                (prio) => {
                  const isCurrent = incidencia.prioridad === prio;
                  return (
                    <button
                      key={prio}
                      type="button"
                      disabled={cambiandoPrioridad}
                      onClick={() => handlePrioridadChange(prio)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                        isCurrent
                          ? prio === 'critica'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                            : prio === 'alta'
                            ? 'bg-orange-500 text-white shadow-xs ring-2 ring-orange-400'
                            : prio === 'media'
                            ? 'bg-[#3E828E] text-white shadow-xs ring-2 ring-[#3E828E]/40'
                            : 'bg-[#27153D] text-white shadow-xs ring-2 ring-[#27153D]/40'
                          : 'bg-[#F8F9FA]/40 hover:bg-[#F8F9FA] text-[#27153D] border border-[#A6C9B6]/30'
                      }`}
                    >
                      <span>{prio}</span>
                      {isCurrent && <ShieldCheckIcon className="w-3.5 h-3.5" />}
                    </button>
                  );
                }
              )}
            </div>
            {errorPrioridad && (
              <p className="text-[11px] text-red-600 mt-2">{errorPrioridad}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-2.5 leading-tight">
              Los cambios de prioridad quedan registrados con tu firma en el historial de seguimiento.
            </p>
          </div>

          {/* Technician Card */}
          <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#27153D] uppercase tracking-wider">
                Técnico Asignado
              </h4>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs font-bold text-[#3E828E] hover:text-[#27153D] transition-colors"
              >
                {incidencia.tecnico_asignado ? 'Cambiar' : 'Asignar'}
              </button>
            </div>

            {incidencia.tecnico_asignado ? (
              <div className="p-3 bg-[#F8F9FA]/40 rounded-lg border border-[#A6C9B6]/30 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#A6C9B6]/25 text-[#3E828E] font-bold flex items-center justify-center text-sm shadow-xs">
                  {incidencia.tecnico_asignado.nombre?.[0] ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#27153D] truncate">
                    {incidencia.tecnico_asignado.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {incidencia.tecnico_asignado.correo || 'Técnico de soporte UTM'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#F6B6B7] text-center">
                <p className="text-xs text-[#27153D] font-semibold mb-2">
                  No hay técnico asignado a esta incidencia.
                </p>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors"
                >
                  Asignar Ahora
                </button>
              </div>
            )}
          </div>

          {/* Reporter Card */}
          <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-[#27153D] uppercase tracking-wider mb-3">
              Información del Reportante
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-bold text-[#27153D]">
                  {incidencia.reportante.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tipo de Usuario:</span>
                <span className="capitalize font-semibold text-[#3E828E] px-2 py-0.5 rounded-full bg-[#A6C9B6]/25 border border-[#A6C9B6]/40">
                  {incidencia.reportante.tipo || 'Usuario UTM'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#A6C9B6]/25">
                <span className="text-gray-500">ID Usuario:</span>
                <span className="font-mono text-[11px] text-gray-400 truncate max-w-[150px]">
                  {incidencia.reportante.usuario_id}
                </span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <BuildingIcon className="w-4 h-4 text-[#3E828E]" />
              <h4 className="text-xs font-bold text-[#27153D] uppercase tracking-wider">
                Ubicación del Reporte
              </h4>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Edificio:</span>
                <span className="font-bold text-[#27153D]">
                  Edificio {incidencia.ubicacion.edificio}
                </span>
              </div>
              {incidencia.ubicacion.piso && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Piso / Nivel:</span>
                  <span className="font-semibold text-[#27153D]">
                    {incidencia.ubicacion.piso}
                  </span>
                </div>
              )}
              {incidencia.ubicacion.aula && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Aula / Espacio:</span>
                  <span className="font-semibold text-[#27153D]">
                    {incidencia.ubicacion.aula}
                  </span>
                </div>
              )}
              {incidencia.ubicacion.referencia && (
                <div className="pt-2 border-t border-[#A6C9B6]/25">
                  <span className="text-gray-500 block mb-0.5">Referencia:</span>
                  <span className="font-normal text-gray-700 italic">
                    {incidencia.ubicacion.referencia}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TagManager Component ($addToSet / $pull) */}
          <TagManager
            incidenciaId={incidencia._id}
            tags={incidencia.tags}
            onTagsUpdated={(newTags) => {
              setIncidencia((prev) => (prev ? { ...prev, tags: newTags } : null));
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <AssignTecnicoModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        incidencia={incidencia}
        onAssigned={(actualizada) => setIncidencia(actualizada)}
      />

      <CloseTicketModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        incidencia={incidencia}
        onTicketUpdated={(actualizada) => setIncidencia(actualizada)}
      />
    </div>
  );
}

export default function IncidenciaDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-xl border border-[#A6C9B6]/30 p-12 text-center text-gray-400">
          <RefreshIcon className="w-8 h-8 mx-auto mb-2 text-[#3E828E] animate-spin" />
          <p className="font-semibold text-sm text-[#27153D]">
            Cargando detalle de la incidencia...
          </p>
        </div>
      }
    >
      <IncidenciaDetailContent />
    </Suspense>
  );

        
}
