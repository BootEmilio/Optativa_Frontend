'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Incidencia,
  EstadoIncidencia,
  PrioridadIncidencia,
  CategoriaIncidencia,
} from '../../types/incidencia';
import { AssignTecnicoModal } from '../coordinador/AssignTecnicoModal';
import { CloseTicketModal } from '../coordinador/CloseTicketModal';
import { AdminTicketCard } from './AdminTicketCard';
import { NewIncidentModal } from './NewIncidentModal';
import {
  SearchIcon,
  FilterIcon,
  UserIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  RefreshIcon,
  TableIcon,
  BoardIcon,
  PlusIcon,
} from '../coordinador/Icons';

interface AdminIncidentTableProps {
  incidencias: Incidencia[];
  onIncidenciasUpdated?: () => void;
  filtroEstadoInicial?: EstadoIncidencia | 'todos';
}

export const AdminIncidentTable: React.FC<AdminIncidentTableProps> = ({
  incidencias: initialIncidencias,
  onIncidenciasUpdated,
  filtroEstadoInicial = 'todos',
}) => {
  const [items, setItems] = useState<Incidencia[]>(initialIncidencias);
  const [vista, setVista] = useState<'tabla' | 'tablero'>('tabla');

  const [filtroEstado, setFiltroEstado] = useState<EstadoIncidencia | 'todos'>(
    filtroEstadoInicial
  );
  const [filtroPrioridad, setFiltroPrioridad] = useState<
    PrioridadIncidencia | 'todas'
  >('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<
    CategoriaIncidencia | 'todas'
  >('todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modales
  const [selectedForAssign, setSelectedForAssign] = useState<Incidencia | null>(null);
  const [selectedForAudit, setSelectedForAudit] = useState<Incidencia | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Sincronizar items con initialIncidencias
  const [prevInitial, setPrevInitial] = useState(initialIncidencias);
  if (initialIncidencias !== prevInitial) {
    setPrevInitial(initialIncidencias);
    setItems(initialIncidencias);
  }

  const [prevFiltro, setPrevFiltro] = useState(filtroEstadoInicial);
  if (filtroEstadoInicial !== prevFiltro) {
    setPrevFiltro(filtroEstadoInicial);
    setFiltroEstado(filtroEstadoInicial);
  }

  const filtradas = useMemo(() => {
    return items.filter((inc) => {
      if (filtroEstado !== 'todos' && inc.estado !== filtroEstado) return false;
      if (filtroPrioridad !== 'todas' && inc.prioridad !== filtroPrioridad) return false;
      if (filtroCategoria !== 'todas' && inc.categoria !== filtroCategoria) return false;
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const coincide =
          inc.codigo.toLowerCase().includes(query) ||
          inc.titulo.toLowerCase().includes(query) ||
          inc.descripcion.toLowerCase().includes(query) ||
          (inc.tecnico_asignado?.nombre || '').toLowerCase().includes(query) ||
          inc.reportante.nombre.toLowerCase().includes(query) ||
          inc.ubicacion.edificio.toLowerCase().includes(query) ||
          (inc.ubicacion.aula || '').toLowerCase().includes(query) ||
          inc.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!coincide) return false;
      }
      return true;
    });
  }, [items, filtroEstado, filtroPrioridad, filtroCategoria, busqueda]);

  const resetFilters = () => {
    setFiltroEstado('todos');
    setFiltroPrioridad('todas');
    setFiltroCategoria('todas');
    setBusqueda('');
  };

  const getEstadoBadge = (estado: EstadoIncidencia) => {
    switch (estado) {
      case 'abierta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Abierta
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0F7FA] text-[#0077B6] border border-[#90E0EF]">
            En Proceso
          </span>
        );
      case 'resuelta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resuelta
          </span>
        );
      case 'cerrada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            Cerrada
          </span>
        );
      case 'reabierta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Reabierta
          </span>
        );
    }
  };

  const getPrioridadBadge = (prioridad: PrioridadIncidencia) => {
    switch (prioridad) {
      case 'critica':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F6B6B7]/30 text-[#991B1B] border border-[#F6B6B7]">
            Crítica
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Media
          </span>
        );
      case 'baja':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
            Baja
          </span>
        );
    }
  };

  const formatCategoria = (cat: CategoriaIncidencia) => {
    switch (cat) {
      case 'computo_redes':
        return 'Cómputo y Redes';
      case 'infraestructura':
        return 'Infraestructura';
      case 'academico':
        return 'Académico';
      default:
        return cat;
    }
  };

  const tieneFiltrosActivos =
    filtroEstado !== 'todos' ||
    filtroPrioridad !== 'todas' ||
    filtroCategoria !== 'todas' ||
    busqueda.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Container */}
      <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, título, reportante, técnico o edificio..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3E828E] focus:border-transparent text-[#27153D] placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Action buttons: Nueva Incidencia + Vista Switcher */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#3E828E] hover:bg-[#346F7A] rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Nueva Incidencia</span>
            </button>

            {tieneFiltrosActivos && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-[#3E828E] hover:text-[#27153D] bg-[#A6C9B6]/20 hover:bg-[#A6C9B6]/30 rounded-xl transition-colors flex items-center space-x-1"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Limpiar</span>
              </button>
            )}

            <div className="p-1 rounded-xl bg-[#F8F9FA] border border-[#A6C9B6]/40 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setVista('tabla')}
                title="Vista de Tabla"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  vista === 'tabla'
                    ? 'bg-white text-[#27153D] shadow-2xs font-bold'
                    : 'text-gray-400 hover:text-[#27153D]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setVista('tablero')}
                title="Vista de Tablero"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  vista === 'tablero'
                    ? 'bg-white text-[#27153D] shadow-2xs font-bold'
                    : 'text-gray-400 hover:text-[#27153D]'
                }`}
              >
                <BoardIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Tablero</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Selectors Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter 1: Estado */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoIncidencia | 'todos')}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-[#27153D] focus:ring-1 focus:ring-[#3E828E]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierta">Abiertas (Sin asignar)</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelta">Resueltas (Por auditar)</option>
              <option value="cerrada">Cerradas</option>
              <option value="reabierta">Reabiertas</option>
            </select>
          </div>

          {/* Filter 2: Prioridad */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value as PrioridadIncidencia | 'todas')}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-[#27153D] focus:ring-1 focus:ring-[#3E828E]"
            >
              <option value="todas">Todas las Prioridades</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Filter 3: Categoría */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as CategoriaIncidencia | 'todas')}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-[#27153D] focus:ring-1 focus:ring-[#3E828E]"
            >
              <option value="todas">Todas las Categorías</option>
              <option value="computo_redes">Cómputo y Redes</option>
              <option value="infraestructura">Infraestructura</option>
              <option value="academico">Académico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-500">
        <span>
          Mostrando <strong className="text-[#27153D]">{filtradas.length}</strong> de {items.length} incidencias registradas
        </span>
        <span className="font-medium text-[#3E828E]">
          Vista activa: {vista === 'tabla' ? 'Tabla de datos' : 'Tablero Kanban'}
        </span>
      </div>

      {/* Table or Board Render */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 py-16 px-6 text-center text-gray-400">
          <FilterIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-sm text-[#27153D]">
            No se encontraron incidencias con los filtros aplicados.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Prueba cambiando los parámetros o limpiando los filtros activos.
          </p>
        </div>
      ) : vista === 'tablero' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtradas.map((inc) => (
            <AdminTicketCard
              key={inc._id}
              incidencia={inc}
              onAssignClick={(item) => setSelectedForAssign(item)}
              onAuditClick={(item) => setSelectedForAudit(item)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2d3b4f] text-white text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Código</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Título y Ubicación</th>
                  <th className="py-3.5 px-4">Reportante</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Prioridad</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Técnico Asignado</th>
                  <th className="py-3.5 px-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-[#27153D]">
                {filtradas.map((inc) => (
                  <tr key={inc._id} className="hover:bg-[#F8F9FA]/80 transition-colors group">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#3E828E] whitespace-nowrap">
                      <Link
                        href={`/admin/incidencias/${inc._id}`}
                        className="hover:underline transition-colors"
                      >
                        {inc.codigo}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/incidencias/${inc._id}`}
                        className="font-bold text-[#27153D] group-hover:text-[#3E828E] transition-colors line-clamp-1"
                      >
                        {inc.titulo}
                      </Link>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Edificio {inc.ubicacion.edificio} • {inc.ubicacion.aula || 'Área general'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                      <span className="font-semibold text-[#27153D] block">{inc.reportante.nombre}</span>
                      <span className="text-[10px] text-gray-400 capitalize">{inc.reportante.tipo}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                      {formatCategoria(inc.categoria)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPrioridadBadge(inc.prioridad)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEstadoBadge(inc.estado)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {inc.tecnico_asignado ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-[#27153D]">
                            {inc.tecnico_asignado.nombre}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedForAssign(inc)}
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Asignar</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {inc.estado === 'resuelta' && (
                          <button
                            onClick={() => setSelectedForAudit(inc)}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Auditar y Cerrar Ticket"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/admin/incidencias/${inc._id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#3E828E] hover:text-[#3E828E] text-[11px] font-semibold text-[#27153D] transition-all"
                        >
                          <span>Detalle</span>
                          <ChevronRightIcon className="w-3 h-3 text-[#3E828E]" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales Compartidos */}
      <AssignTecnicoModal
        isOpen={!!selectedForAssign}
        onClose={() => setSelectedForAssign(null)}
        incidencia={selectedForAssign}
        onAssigned={(actualizada) => {
          setItems((prev) => prev.map((item) => (item._id === actualizada._id ? actualizada : item)));
          setSelectedForAssign(null);
          onIncidenciasUpdated?.();
        }}
      />

      <CloseTicketModal
        isOpen={!!selectedForAudit}
        onClose={() => setSelectedForAudit(null)}
        incidencia={selectedForAudit}
        onTicketUpdated={(actualizada) => {
          setItems((prev) => prev.map((item) => (item._id === actualizada._id ? actualizada : item)));
          setSelectedForAudit(null);
          onIncidenciasUpdated?.();
        }}
      />

      <NewIncidentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={(nueva) => {
          setItems((prev) => [nueva, ...prev]);
          onIncidenciasUpdated?.();
        }}
      />
    </div>
  );
};

