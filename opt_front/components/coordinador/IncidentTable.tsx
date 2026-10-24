'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Incidencia,
  EstadoIncidencia,
  PrioridadIncidencia,
  CategoriaIncidencia,
} from '../../types/incidencia';
import { AssignTecnicoModal } from './AssignTecnicoModal';
import { CloseTicketModal } from './CloseTicketModal';
import { TicketCard } from './TicketCard';
import {
  SearchIcon,
  FilterIcon,
  UserIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  RefreshIcon,
  TableIcon,
  BoardIcon,
} from './Icons';

interface IncidentTableProps {
  incidencias: Incidencia[];
  onIncidenciasUpdated?: () => void;
  filtroEstadoInicial?: EstadoIncidencia | 'todos';
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
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

  // Modals state
  const [selectedForAssign, setSelectedForAssign] = useState<Incidencia | null>(
    null
  );
  const [selectedForAudit, setSelectedForAudit] = useState<Incidencia | null>(
    null
  );

  // Sincronizar con props según la recomendación oficial de React (ajuste de estado durante el render)
  const [prevInitialIncidencias, setPrevInitialIncidencias] = useState(initialIncidencias);
  if (initialIncidencias !== prevInitialIncidencias) {
    setPrevInitialIncidencias(initialIncidencias);
    setItems(initialIncidencias);
  }

  const [prevFiltroInicial, setPrevFiltroInicial] = useState(filtroEstadoInicial);
  if (filtroEstadoInicial !== prevFiltroInicial) {
    setPrevFiltroInicial(filtroEstadoInicial);
    setFiltroEstado(filtroEstadoInicial);
  }

  const filtradas = useMemo(() => {
    return items.filter((inc) => {
      // Estado
      if (filtroEstado !== 'todos' && inc.estado !== filtroEstado) {
        return false;
      }
      // Prioridad
      if (filtroPrioridad !== 'todas' && inc.prioridad !== filtroPrioridad) {
        return false;
      }
      // Categoría
      if (filtroCategoria !== 'todas' && inc.categoria !== filtroCategoria) {
        return false;
      }
      // Búsqueda
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const coincideCodigo = inc.codigo.toLowerCase().includes(query);
        const coincideTitulo = inc.titulo.toLowerCase().includes(query);
        const coincideTecnico = (inc.tecnico_asignado?.nombre || '')
          .toLowerCase()
          .includes(query);
        const coincideUbicacion = `${inc.ubicacion.edificio} ${inc.ubicacion.aula || ''}`
          .toLowerCase()
          .includes(query);

        return (
          coincideCodigo ||
          coincideTitulo ||
          coincideTecnico ||
          coincideUbicacion
        );
      }
      return true;
    });
  }, [items, filtroEstado, filtroPrioridad, filtroCategoria, busqueda]);

  const handleUpdateItem = (updated: Incidencia) => {
    setItems((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item))
    );
    if (onIncidenciasUpdated) {
      onIncidenciasUpdated();
    }
  };

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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Abierta
          </span>
        );
      case 'en_proceso':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#E0F7FA] text-[#0077B6] border border-[#90E0EF]">
            En Proceso
          </span>
        );
      case 'resuelta':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resuelta
          </span>
        );
      case 'cerrada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
            Cerrada
          </span>
        );
      case 'reabierta':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
            Reabierta
          </span>
        );
    }
  };

  const getPrioridadBadge = (prioridad: PrioridadIncidencia) => {
    switch (prioridad) {
      case 'baja':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
            Baja
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
            Media
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'critica':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            Crítica
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
      {/* View Switcher and Search Bar Container */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Control Bar: Search + View Switcher */}
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
              placeholder="Buscar por código, título, técnico o edificio..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent text-[#2B2D42] placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Segmented View Switcher: Tabla vs Tablero */}
          <div className="flex items-center space-x-2 shrink-0">
            {tieneFiltrosActivos && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-[#0077B6] hover:text-[#0096C7] bg-[#E0F7FA]/60 hover:bg-[#E0F7FA] rounded-xl transition-colors flex items-center space-x-1"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Limpiar</span>
              </button>
            )}

            <div className="p-1 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setVista('tabla')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vista === 'tabla'
                    ? 'bg-white text-[#1D3557] shadow-xs'
                    : 'text-gray-500 hover:text-[#1D3557]'
                }`}
              >
                <TableIcon className="w-4 h-4 text-[#00B4D8]" />
                <span>Tabla</span>
              </button>

              <button
                type="button"
                onClick={() => setVista('tablero')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vista === 'tablero'
                    ? 'bg-white text-[#1D3557] shadow-xs'
                    : 'text-gray-500 hover:text-[#1D3557]'
                }`}
              >
                <BoardIcon className="w-4 h-4 text-[#00B4D8]" />
                <span>Tablero</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categorized Filter Selectors (Strictly 3 Campus Categories) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E9ECEF]">
          {/* Estado */}
          <div>
            <label className="block text-[11px] font-bold text-[#1D3557] uppercase tracking-wider mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value as EstadoIncidencia | 'todos')
              }
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] text-[#2B2D42]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierta">Abierta (Por Asignar)</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelta">Resuelta (Por Auditar)</option>
              <option value="cerrada">Cerrada</option>
              <option value="reabierta">Reabierta</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[11px] font-bold text-[#1D3557] uppercase tracking-wider mb-1">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) =>
                setFiltroPrioridad(e.target.value as PrioridadIncidencia | 'todas')
              }
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] text-[#2B2D42]"
            >
              <option value="todas">Todas las Prioridades</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Categoría Oficial (Exactamente 3) */}
          <div>
            <label className="block text-[11px] font-bold text-[#1D3557] uppercase tracking-wider mb-1">
              Categoría Oficial
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) =>
                setFiltroCategoria(
                  e.target.value as CategoriaIncidencia | 'todas'
                )
              }
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] text-[#2B2D42]"
            >
              <option value="todas">Todas las Categorías (3)</option>
              <option value="computo_redes">Cómputo y Redes</option>
              <option value="infraestructura">Infraestructura y Mantenimiento</option>
              <option value="academico">Sistemas y Servicios Académicos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Mostrando <b>{filtradas.length}</b> de <b>{items.length}</b> incidencias del área
        </span>
        <span className="font-medium text-[#1D3557]">
          Vista activa: {vista === 'tabla' ? 'Tabla estructurada' : 'Tablero de tickets'}
        </span>
      </div>

      {/* RENDER VIEW: TABLE OR BOARD */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E9ECEF] py-16 px-6 text-center text-gray-400">
          <FilterIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-sm text-[#1D3557]">
            No se encontraron incidencias con los filtros aplicados.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Intenta cambiar los parámetros o limpiar los filtros activos.
          </p>
        </div>
      ) : vista === 'tablero' ? (
        /* Vista de Tablero: Tarjetas en Forma de Ticket */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtradas.map((inc) => (
            <TicketCard
              key={inc._id}
              incidencia={inc}
              onAssignClick={(item) => setSelectedForAssign(item)}
              onAuditClick={(item) => setSelectedForAudit(item)}
            />
          ))}
        </div>
      ) : (
        /* Vista de Tabla Limpia y Minimalista */
        <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1D3557] text-white text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Código</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Título y Ubicación</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Prioridad</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Técnico Asignado</th>
                  <th className="py-3.5 px-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] text-xs text-[#2B2D42]">
                {filtradas.map((inc) => (
                  <tr
                    key={inc._id}
                    className="hover:bg-[#F8F9FA]/80 transition-colors group"
                  >
                    {/* Código */}
                    <td className="py-3.5 px-5 font-mono font-bold text-[#1D3557] whitespace-nowrap">
                      <Link
                        href={`/coordinador/incidencias/${inc._id}`}
                        className="hover:text-[#00B4D8] transition-colors"
                      >
                        {inc.codigo}
                      </Link>
                    </td>

                    {/* Título & Ubicación */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/coordinador/incidencias/${inc._id}`}
                        className="font-bold text-[#1D3557] group-hover:text-[#0077B6] transition-colors line-clamp-1"
                      >
                        {inc.titulo}
                      </Link>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Edificio {inc.ubicacion.edificio} • {inc.ubicacion.aula || incidenciaUbicacionCorta(inc)}
                      </p>
                    </td>

                    {/* Categoría Oficial */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 font-medium">
                      {formatCategoria(inc.categoria)}
                    </td>

                    {/* Prioridad */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPrioridadBadge(inc.prioridad)}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getEstadoBadge(inc.estado)}
                    </td>

                    {/* Técnico Asignado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {inc.tecnico_asignado ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-[#1D3557]">
                            {inc.tecnico_asignado.nombre}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedForAssign(inc)}
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Sin asignar</span>
                        </button>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Asignar rápido */}
                        <button
                          onClick={() => setSelectedForAssign(inc)}
                          title={inc.tecnico_asignado ? 'Reasignar Técnico' : 'Asignar Técnico'}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0077B6] hover:bg-[#E0F7FA] transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                        </button>

                        {/* Auditar si está resuelta */}
                        {inc.estado === 'resuelta' && (
                          <button
                            onClick={() => setSelectedForAudit(inc)}
                            title="Auditar y Autorizar Cierre"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}

                        {/* Link al Detalle */}
                        <Link
                          href={`/coordinador/incidencias/${inc._id}`}
                          title="Ver Detalle Técnico"
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-[#E9ECEF] hover:border-[#00B4D8] text-[11px] font-bold text-[#1D3557] hover:text-[#0077B6] transition-all shadow-2xs"
                        >
                          <span>Detalle</span>
                          <ChevronRightIcon className="w-3 h-3 ml-0.5 text-[#00B4D8]" />
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

      {/* Modals */}
      <AssignTecnicoModal
        isOpen={!!selectedForAssign}
        onClose={() => setSelectedForAssign(null)}
        incidencia={selectedForAssign}
        onAssigned={handleUpdateItem}
      />

      <CloseTicketModal
        isOpen={!!selectedForAudit}
        onClose={() => setSelectedForAudit(null)}
        incidencia={selectedForAudit}
        onTicketUpdated={handleUpdateItem}
      />
    </div>
  );
};

function incidenciaUbicacionCorta(inc: Incidencia): string {
  if (inc.ubicacion.aula) return inc.ubicacion.aula;
  if (inc.ubicacion.referencia) return inc.ubicacion.referencia.slice(0, 24);
  return 'Área gral.';
}
