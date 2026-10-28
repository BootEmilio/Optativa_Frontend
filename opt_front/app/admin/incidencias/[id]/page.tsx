'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import {
  Incidencia,
  PrioridadIncidencia,
  EstadoIncidencia,
  CategoriaIncidencia,
} from '@/types/incidencia';
import { Timeline } from '@/components/coordinador/Timeline';
import { TagManager } from '@/components/coordinador/TagManager';
import { AssignTecnicoModal } from '@/components/coordinador/AssignTecnicoModal';
import { CloseTicketModal } from '@/components/coordinador/CloseTicketModal';
import { LoadError } from '@/components/coordinador/LoadError';
import {
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
  RefreshIcon,
  BuildingIcon,
  PaperClipIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@/components/coordinador/Icons';

function AdminIncidenciaDetailContent() {
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
      const data = await adminService.getIncidenciaById(id);
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
      const actualizada = await adminService.establecerPrioridad(
        incidencia._id,
        nueva,
        `Administrador actualizó la prioridad institucional a ${nueva.toUpperCase()}.`
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
            href="/admin/incidencias"
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
            href="/admin/incidencias"
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

          {/* Auditar y Cerrar Ticket si está resuelta */}
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
              className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Reabrir Incidencia</span>
            </button>
          )}

          {/* Estado Badge */}
          {getEstadoBadge(incidencia.estado)}
        </div>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Ficha Técnica, Ubicación, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ficha Técnica Card */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-bold text-sm text-[#27153D] uppercase tracking-wider">
                Ficha Técnica de Incidencia
              </h2>
              <span className="text-xs font-semibold text-[#3E828E] bg-[#A6C9B6]/20 px-2.5 py-0.5 rounded-full">
                {formatCategoria(incidencia.categoria)}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Descripción Detallada
              </p>
              <p className="text-sm text-[#27153D] leading-relaxed whitespace-pre-line bg-[#F8F9FA]/60 p-4 rounded-xl border border-gray-100">
                {incidencia.descripcion}
              </p>
            </div>

            {/* Grid de Metadatos de Ubicación y Detalle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <BuildingIcon className="w-4 h-4 text-[#3E828E]" />
                  <span>Ubicación en Campus</span>
                </div>
                <p className="text-sm font-bold text-[#27153D]">
                  Edificio {incidencia.ubicacion.edificio}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {incidencia.ubicacion.aula || 'Área general'}
                  {incidencia.ubicacion.piso && ` • Piso ${incidencia.ubicacion.piso}`}
                </p>
                {incidencia.ubicacion.referencia && (
                  <p className="text-[11px] text-gray-400 mt-1 italic">
                    Ref: {incidencia.ubicacion.referencia}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-gray-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <ClockIcon className="w-4 h-4 text-[#3E828E]" />
                  <span>Tiempos de Atención</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creación:</span>
                    <span className="font-medium text-[#27153D]">
                      {formatDate(incidencia.fecha_creacion)}
                    </span>
                  </div>
                  {incidencia.fecha_resolucion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resolución:</span>
                      <span className="font-medium text-emerald-600">
                        {formatDate(incidencia.fecha_resolucion)}
                      </span>
                    </div>
                  )}
                  {incidencia.fecha_cierre && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cierre Oficial:</span>
                      <span className="font-medium text-[#27153D]">
                        {formatDate(incidencia.fecha_cierre)}
                      </span>
                    </div>
                  )}
                  {typeof incidencia.horas_invertidas === 'number' && (
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-500 font-semibold">Horas Invertidas:</span>
                      <span className="font-bold text-[#3E828E]">
                        {incidencia.horas_invertidas} hrs
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalle Específico (si existe en BD) */}
            {incidencia.detalle_especifico &&
              Object.keys(incidencia.detalle_especifico).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Parámetros Técnicos Específicos
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {Object.entries(incidencia.detalle_especifico).map(([k, v]) => (
                      <div
                        key={k}
                        className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-2xs"
                      >
                        <span className="text-[10px] text-gray-400 font-mono uppercase block">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-[#27153D] truncate block">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Evidencias Adjuntas */}
            {incidencia.evidencias_adjuntas && incidencia.evidencias_adjuntas.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <PaperClipIcon className="w-4 h-4 text-[#3E828E]" />
                  <span>Evidencias Adjuntas ({incidencia.evidencias_adjuntas.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {incidencia.evidencias_adjuntas.map((ev, idx) => (
                    <a
                      key={idx}
                      href={ev.url_storage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-[#3E828E] hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div className="truncate">
                        <p className="font-bold text-[#27153D] truncate">{ev.nombre_archivo}</p>
                        <p className="text-[10px] text-gray-400">{ev.peso_kb} KB • {ev.tipo_mime}</p>
                      </div>
                      <span className="text-[#3E828E] font-bold text-[11px] ml-2">Ver ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historial de Seguimiento (Timeline) */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-[#3E828E]" />
                <h2 className="font-bold text-sm text-[#27153D] uppercase tracking-wider">
                  Historial de Seguimiento y Trazabilidad
                </h2>
              </div>
              <span className="text-xs text-gray-400">
                {incidencia.historial_seguimiento.length} registros
              </span>
            </div>

            <Timeline historial={incidencia.historial_seguimiento} />
          </div>
        </div>

        {/* Right Column (4 cols): Control de Prioridad, Técnico, Tags, Reportante */}
        <div className="lg:col-span-4 space-y-6">
          {/* Modulador de Prioridad */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#27153D]">
                Modulación de Prioridad
              </h3>
              {cambiandoPrioridad && (
                <span className="text-[10px] text-[#3E828E] animate-pulse font-semibold">
                  Guardando...
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Ajusta el nivel de urgencia técnica para este incidente.
            </p>

            {errorPrioridad && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errorPrioridad}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              {(['baja', 'media', 'alta', 'critica'] as PrioridadIncidencia[]).map((p) => {
                const isSelected = incidencia.prioridad === p;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={cambiandoPrioridad}
                    onClick={() => handlePrioridadChange(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? p === 'critica'
                          ? 'bg-[#F6B6B7] text-[#991B1B] ring-2 ring-[#991B1B]/30'
                          : p === 'alta'
                          ? 'bg-orange-500 text-white ring-2 ring-orange-500/30'
                          : p === 'media'
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                          : 'bg-slate-600 text-white ring-2 ring-slate-600/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{p}</span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Técnico Asignado Card */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#27153D]">
                Técnico Responsable
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs font-bold text-[#3E828E] hover:underline"
              >
                {incidencia.tecnico_asignado ? 'Cambiar' : 'Asignar'}
              </button>
            </div>

            {incidencia.tecnico_asignado ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <p className="font-bold text-sm text-[#27153D]">
                    {incidencia.tecnico_asignado.nombre}
                  </p>
                </div>
                {incidencia.tecnico_asignado.correo && (
                  <p className="text-xs text-gray-500 pl-4.5">
                    {incidencia.tecnico_asignado.correo}
                  </p>
                )}
                <p className="text-[11px] text-[#3E828E] font-medium pl-4.5 pt-1">
                  Atención asignada formalmente
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-xs font-bold text-amber-800">
                  Sin Técnico Asignado
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Esta incidencia requiere que el administrador o coordinador asigne a un técnico.
                </p>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                >
                  Asignar Ahora
                </button>
              </div>
            )}
          </div>

          {/* Información del Reportante */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#27153D]">
              Datos del Reportante
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-bold text-[#27153D]">
                  {incidencia.reportante.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-semibold text-[#3E828E] capitalize bg-[#A6C9B6]/20 px-2 py-0.5 rounded-md">
                  {incidencia.reportante.tipo}
                </span>
              </div>
            </div>
          </div>

          {/* Gestor de Etiquetas (Tags) */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#27153D]">
              Etiquetas Técnicas
            </h3>
            <p className="text-xs text-gray-500">
              Palabras clave para indexación y búsqueda.
            </p>
            <TagManager
              incidenciaId={incidencia._id}
              tags={incidencia.tags}
              onTagsUpdated={(nuevosTags) => {
                setIncidencia((prev) => (prev ? { ...prev, tags: nuevosTags } : null));
              }}
            />
          </div>
        </div>
      </div>

      {/* Modales Compartidos */}
      <AssignTecnicoModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        incidencia={incidencia}
        onAssigned={(actualizada) => {
          setIncidencia(actualizada);
          setIsAssignModalOpen(false);
        }}
      />

      <CloseTicketModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        incidencia={incidencia}
        onTicketUpdated={(actualizada) => {
          setIncidencia(actualizada);
          setIsCloseModalOpen(false);
        }}
      />
    </div>
  );
}

export default function AdminIncidenciaDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando detalle de la incidencia...
        </div>
      }
    >
      <AdminIncidenciaDetailContent />
    </Suspense>
  );
}

