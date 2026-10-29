'use client';

import React, { useState, useEffect } from 'react';
import { Usuario, RolClave } from '@/types/usuario';
import { adminService } from '@/services/adminService';
import { XMarkIcon, UserIcon } from '../coordinador/Icons';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null; // null para crear, objeto para editar
  onSaved: (usuario: Usuario) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  usuario,
  onSaved,
}) => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState<RolClave>('tecnico_soporte');
  const [area, setArea] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoReportante, setTipoReportante] = useState<'docente' | 'estudiante' | 'administrativo'>('docente');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setApellidos(usuario.apellidos || '');
      setCorreo(usuario.correo);
      setRol(usuario.rol);
      setArea(usuario.area || '');
      setTelefono(usuario.telefono || '');
      setTipoReportante(usuario.tipo_reportante || 'docente');
      setActivo(usuario.activo);
    } else {
      setNombre('');
      setApellidos('');
      setCorreo('');
      setRol('tecnico_soporte');
      setArea('Soporte Técnico');
      setTelefono('+52 (953) 532-0214 Ext. ');
      setTipoReportante('docente');
      setActivo(true);
    }
    setError(null);
  }, [usuario, isOpen]);

  if (!isOpen) return null;

  const esEdicion = !!usuario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !area.trim()) {
      setError('Por favor completa los campos obligatorios (*).');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      if (esEdicion && usuario) {
        const actualizado = await adminService.actualizarUsuario(usuario._id, {
          nombre,
          apellidos,
          correo,
          rol,
          area,
          telefono,
          activo,
          tipo_reportante: rol === 'reportante' ? tipoReportante : undefined,
        });
        onSaved(actualizado);
      } else {
        const nuevo = await adminService.crearUsuario({
          nombre,
          apellidos,
          correo,
          rol,
          area,
          telefono,
          tipo_reportante: rol === 'reportante' ? tipoReportante : undefined,
        });
        onSaved(nuevo);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#A6C9B6]/40 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#2d3b4f] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3E828E] flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {esEdicion ? 'Editar Usuario Institucional' : 'Alta de Nuevo Usuario'}
              </h3>
              <p className="text-xs text-[#A6C9B6]">
                {esEdicion ? 'Modifica rol, área o estado de cuenta' : 'Registro de credencial institucional UTM'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre(s) *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellidos</label>
              <input
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Apellidos"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Correo Institucional UTM *
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@utm.test"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rol en el Sistema *</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as RolClave)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 bg-white"
              >
                <option value="administrador_sistema">Administrador del Sistema</option>
                <option value="coordinador_soporte">Coordinador de Soporte</option>
                <option value="tecnico_soporte">Técnico de Soporte</option>
                <option value="directivo_analista">Directivo / Analista</option>
                <option value="reportante">Reportante (Docente/Alumno)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Área / Departamento *</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. Redes y Telecomunicaciones"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
              />
            </div>
          </div>

          {rol === 'reportante' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo de Reportante
              </label>
              <select
                value={tipoReportante}
                onChange={(e) => setTipoReportante(e.target.value as 'docente' | 'estudiante' | 'administrativo')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 bg-white"
              >
                <option value="docente">Docente / Investigador</option>
                <option value="estudiante">Estudiante</option>
                <option value="administrativo">Personal Administrativo</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Teléfono / Extensión
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+52 (953) 532-0214 Ext. 411"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
            />
          </div>

          {esEdicion && (
            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded border-slate-300 text-[#3E828E] focus:ring-[#3E828E]"
                />
                <span className="font-semibold text-slate-700">
                  Usuario Activo con Acceso al Sistema
                </span>
              </label>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 rounded-xl bg-[#3E828E] hover:bg-[#346F7A] text-white font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

