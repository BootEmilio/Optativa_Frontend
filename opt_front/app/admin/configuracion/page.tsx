'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { adminService } from '@/services/adminService';
import { CatalogoConfiguracion, LogAuditoria } from '@/types/admin';
import {
  ShieldCheckIcon,
  RefreshIcon,
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/coordinador/Icons';
import { LoadError } from '@/components/coordinador/LoadError';

function ConfiguracionContent() {
  const [config, setConfig] = useState<CatalogoConfiguracion | null>(null);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [cfg, lg] = await Promise.all([
        adminService.getConfiguracion(),
        adminService.getLogsAuditoria(20),
      ]);
      setConfig(cfg);
      setLogs(lg);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar la configuración de la plataforma'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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
            <ShieldCheckIcon className="w-4 h-4 text-[#3E828E]" />
            <span>Administración de Plataforma</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27153D]">
            Configuración y Auditoría Global
          </h1>
          <p className="text-sm text-[#27153D]/70 mt-0.5">
            Diagnóstico de conectividad del sistema, catálogo de campus y registro de auditoría inmutable.
          </p>
        </div>

        <div>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 rounded-xl border border-[#A6C9B6]/40 bg-white text-xs font-semibold text-[#27153D] hover:bg-[#F8F9FA]/40 hover:border-[#3E828E] transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Recargar Estado</span>
          </button>
        </div>
      </div>

      {error && <LoadError mensaje={error} onRetry={cargarDatos} />}

      {!error && config && (
        <>
          {/* Card: Diagnóstico de Conectividad y Parámetros */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-bold text-sm text-[#27153D] uppercase tracking-wider">
                  Diagnóstico y Estado de la Infraestructura
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Servicios Operativos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-gray-400 font-medium">Backend API Host:</span>
                <p className="font-mono font-bold text-[#27153D] truncate" title={config.apiUrl}>
                  {config.apiUrl}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">Render Cloud Service</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-gray-400 font-medium">Modo de Datos:</span>
                <p className="font-bold text-[#27153D]">
                  {config.modoMocks ? 'Mocks Locales' : 'Backend Real en Línea'}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">NEXT_PUBLIC_USE_MOCKS: {String(config.modoMocks)}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-gray-400 font-medium">Base de Datos:</span>
                <p className="font-bold text-[#27153D]">MongoDB Atlas</p>
                <p className="text-[10px] text-gray-400">Cluster UTM Soporte</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-gray-400 font-medium">Versión del Sistema:</span>
                <p className="font-mono font-bold text-[#3E828E]">{config.version}</p>
                <p className="text-[10px] text-gray-400">Next.js 16 + React 19</p>
              </div>
            </div>
          </div>

          {/* Catálogos del Campus UTM: Categorías y Edificios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categorías Oficiales */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#27153D]">
                  Categorías Oficiales de Soporte
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ámbitos reconocidos para tipificación y SLAs en el campus
                </p>
              </div>

              <div className="space-y-3">
                {config.categoriasOficiales.map((cat) => (
                  <div
                    key={cat.clave}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-sm text-[#27153D]">{cat.nombre}</span>
                      <span className="font-mono text-[10px] text-gray-400">({cat.clave})</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed pl-5">
                      {cat.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Edificios del Campus */}
            <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#27153D]">
                  Edificios y Espacios Universitarios
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inventario físico de dependencias para geo-localización de incidencias
                </p>
              </div>

              <div className="space-y-3">
                {config.edificiosCampus.map((ed) => (
                  <div
                    key={ed.clave}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <BuildingIcon className="w-4 h-4 text-[#3E828E]" />
                        <span className="font-bold text-sm text-[#27153D]">{ed.nombre}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#A6C9B6]/20 text-[#3E828E]">
                        {ed.pisos} {ed.pisos === 1 ? 'Piso' : 'Pisos'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 pl-6">
                      Aulas y Espacios: {ed.aulas.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registro Global de Auditoría (Audit Logs) */}
          <div className="bg-white rounded-2xl border border-[#A6C9B6]/40 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-[#3E828E]" />
                <h3 className="font-bold text-base text-[#27153D]">
                  Registro de Auditoría y Trazabilidad Global
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Últimas {logs.length} acciones registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2d3b4f] text-white uppercase text-[11px] font-semibold">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario Responsable</th>
                    <th className="py-3 px-4">Módulo</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4 min-w-[280px]">Detalles</th>
                    <th className="py-3 px-4 text-right">Dirección IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#27153D]">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {formatDate(log.fecha)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#27153D]">
                        {log.usuario_nombre}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-[#3E828E]">
                        {log.modulo}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {log.accion}
                      </td>
                      <td className="py-3 px-4 text-gray-600 leading-relaxed">
                        {log.detalles}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400 text-right whitespace-nowrap">
                        {log.ip || '192.168.10.x'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminConfiguracionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-400">
          Cargando configuración del sistema...
        </div>
      }
    >
      <ConfiguracionContent />
    </Suspense>
  );
}

