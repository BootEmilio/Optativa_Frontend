'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Usuario, RolClave, TecnicoDisponible } from '@/types/usuario';
import { adminService } from '@/services/adminService';
import { UserModal } from '@/components/admin/UserModal';
import {
  UserIcon,
  RefreshIcon,
  SearchIcon,
  PlusIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/coordinador/Icons';
import { LoadError } from '@/components/coordinador/LoadError';

function UsuariosContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoDisponible[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<RolClave | 'todos'>('todos');
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [users, tecs] = await Promise.all([
        adminService.getUsuarios(),
        adminService.getTecnicosDisponibles(),
      ]);
      setUsuarios(users);
      setTecnicos(tecs);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los usuarios'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleToggleActivo = async (id: string) => {
    try {
      const actualizado = await adminService.toggleUsuarioActivo(id);
      setUsuarios((prev) =>
        prev.map((u) => (u._id === actualizado._id ? actualizado : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (filtroActivo === 'activos' && !u.activo) return false;
    if (filtroActivo === 'inactivos' && u.activo) return false;
    if (busqueda.trim() !== '') {
      const q = busqueda.toLowerCase();
      const match =
        u.nombre.toLowerCase().includes(q) ||
        (u.apellidos && u.apellidos.toLowerCase().includes(q)) ||
        u.correo.toLowerCase().includes(q) ||
        (u.area && u.area.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getRolBadge = (rol: RolClave) => {
    switch (rol) {
      case 'administrador_sistema':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Administrador
          </span>
        );
      case 'coordinador_soporte':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3E828E]/10 text-[#3E828E] border border-[#3E828E]/30">
            Coordinador
          </span>
        );
      case 'tecnico_soporte':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Técnico
          </span>
        );
      case 'directivo_analista':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Analista
          </span>
        );
      case 'reportante':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Reportante
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#3E828E] uppercase tracking-wider mb-1">
            <UserIcon className="w-4 h-4 text-[#3E828E]" />
            <span>Directorio y Control de Acceso</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27153D]">
            Gestión Institucional de Usuarios
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Administra cuentas universitarias, asigna roles de servicio, modula permisos y supervisa la carga de técnicos.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 rounded-xl border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] hover:bg-[#F8F9FA]/40 hover:border-[#3E828E] transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={cargarDatos} />}

      {!error && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Usuarios
              </span>
              <p className="text-2xl font-extrabold text-[#27153D] mt-1">{usuarios.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">En el padrón del campus</p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Técnicos de Soporte
              </span>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">
                {usuarios.filter((u) => u.rol === 'tecnico_soporte').length}
              </p>
              <p className="text-[11px] text-blue-500 mt-0.5">Especialistas asignables</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#A6C9B6]/60 p-4 shadow-xs">
              <span className="text-xs font-bold text-[#3E828E] uppercase tracking-wider">
                Coordinadores / Analistas
              </span>
              <p className="text-2xl font-extrabold text-[#3E828E] mt-1">
                {usuarios.filter((u) => u.rol === 'coordinador_soporte' || u.rol === 'directivo_analista').length}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Supervisión operativa y datos</p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Cuentas Activas
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {usuarios.filter((u) => u.activo).length}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Acceso habilitado al sistema</p>
            </div>
          </div>

          {/* Dual Grid: Tabla de Usuarios (8 cols) & Carga de Técnicos (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tabla de Usuarios con Filtros */}
            <div className="lg:col-span-8 space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre, correo o área institucional..."
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-[#F8F9FA]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3E828E] text-[#27153D]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={filtroRol}
                      onChange={(e) => setFiltroRol(e.target.value as RolClave | 'todos')}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#27153D] focus:ring-1 focus:ring-[#3E828E]"
                    >
                      <option value="todos">Todos los Roles</option>
                      <option value="administrador_sistema">Administrador</option>
                      <option value="coordinador_soporte">Coordinador</option>
                      <option value="tecnico_soporte">Técnico</option>
                      <option value="directivo_analista">Analista</option>
                      <option value="reportante">Reportante</option>
                    </select>

                    <select
                      value={filtroActivo}
                      onChange={(e) => setFiltroActivo(e.target.value as 'todos' | 'activos' | 'inactivos')}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#27153D] focus:ring-1 focus:ring-[#3E828E]"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="activos">Solo Activos</option>
                      <option value="inactivos">Solo Suspendidos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table of Users */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#2d3b4f] text-white text-xs uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Rol Institucional</th>
                        <th className="py-3 px-4">Área / Adscripción</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-[#27153D]">
                      {usuariosFiltrados.map((u) => {
                        const iniciales = `${u.nombre[0] ?? ''}${u.apellidos ? u.apellidos[0] : ''}`;
                        return (
                          <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3E828E] to-[#A6C9B6] text-[#27153D] font-bold text-xs flex items-center justify-center shrink-0">
                                  {iniciales}
                                </div>
                                <div className="truncate">
                                  <p className="font-bold text-[#27153D] truncate">
                                    {u.nombre} {u.apellidos}
                                  </p>
                                  <p className="text-[11px] text-gray-400 truncate">{u.correo}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {getRolBadge(u.rol)}
                            </td>

                            <td className="py-3 px-4 text-gray-600 truncate max-w-[160px]">
                              {u.area || 'Campus Central'}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActivo(u._id)}
                                title={u.activo ? 'Clic para suspender' : 'Clic para activar'}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  u.activo
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                {u.activo ? '● Activo' : '○ Suspendido'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#3E828E] text-[#3E828E] font-semibold text-[11px] transition-colors"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Panel de Carga de Técnicos */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-[#3E828E]" />
                  <h3 className="font-bold text-sm text-[#27153D]">
                    Carga de Trabajo de Técnicos
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Incidencias activas asignadas a cada especialista para balanceo equitativo.
                </p>

                <div className="space-y-3 pt-2">
                  {tecnicos.map((tec) => (
                    <div
                      key={tec._id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#27153D]">
                          {tec.nombre} {tec.apellidos}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tec.incidencias_activas === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : tec.incidencias_activas >= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tec.incidencias_activas} activas
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{tec.especialidad}</p>
                      {tec.telefono && (
                        <p className="text-[10px] text-gray-400 font-mono">{tec.telefono}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Matriz de Permisos */}
              <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4 text-[#3E828E]" />
                  <h3 className="font-bold text-sm text-[#27153D]">
                    Niveles de Permiso UTM
                  </h3>
                </div>
                <ul className="space-y-2 text-gray-600 text-[11px]">
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-purple-700 shrink-0">Admin:</span>
                    <span>Acceso maestro irrestricto, configuración y cuentas.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-[#3E828E] shrink-0">Coordinador:</span>
                    <span>Asignación de técnicos, modulación de prioridad y cierre.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-700 shrink-0">Técnico:</span>
                    <span>Resolución física, diagnóstico y registro de horas.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-amber-700 shrink-0">Analista:</span>
                    <span>Reportes, métricas SLA y analítica de campus.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Crear / Editar Usuario */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usuario={selectedUser}
        onSaved={() => {
          cargarDatos();
        }}
      />
    </div>
  );
}

export default function AdminUsuariosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando gestión institucional de usuarios...
        </div>
      }
    >
      <UsuariosContent />
    </Suspense>
  );
}

