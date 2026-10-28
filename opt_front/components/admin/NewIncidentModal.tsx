'use client';

import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { Incidencia, CategoriaIncidencia } from '@/types/incidencia';
import { XMarkIcon, TicketIcon } from '../coordinador/Icons';

const tiposIncidenciaPorCategoria: Record<
  CategoriaIncidencia,
  { value: string; label: string }[]
> = {
  computo_redes: [
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'falla_equipo', label: 'Falla de equipo' },
    { value: 'falla_red', label: 'Falla de red' },
    { value: 'internet', label: 'Internet' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'otro', label: 'Otro' },
  ],
  infraestructura: [
    { value: 'filtracion', label: 'Filtración' },
    { value: 'electricidad', label: 'Electricidad' },
    { value: 'mobiliario', label: 'Mobiliario' },
    { value: 'aire_acondicionado', label: 'Aire acondicionado' },
    { value: 'iluminacion', label: 'Iluminación' },
    { value: 'danio_estructural', label: 'Daño estructural' },
    { value: 'otro', label: 'Otro' },
  ],
  academico: [
    { value: 'plataforma_digital', label: 'Plataforma digital' },
    { value: 'inscripcion', label: 'Inscripción' },
    { value: 'calificaciones', label: 'Calificaciones' },
    { value: 'horarios', label: 'Horarios' },
    { value: 'servicios_escolares', label: 'Servicios escolares' },
    { value: 'otro', label: 'Otro' },
  ],
};

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (incidencia: Incidencia) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaIncidencia>('computo_redes');
  const [tipoIncidencia, setTipoIncidencia] = useState('conectividad');
  const [edificio, setEdificio] = useState('C');
  const [aula, setAula] = useState('');
  const [piso, setPiso] = useState('1');
  const [referencia, setReferencia] = useState('');
  const [detalleEspecifico, setDetalleEspecifico] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    if (tituloLimpio.length < 5 || tituloLimpio.length > 150) {
      setError('El título debe tener entre 5 y 150 caracteres.');
      return;
    }
    if (descripcionLimpia.length < 10 || descripcionLimpia.length > 2000) {
      setError('La descripción debe tener entre 10 y 2000 caracteres.');
      return;
    }

    let detalle: Record<string, unknown> | undefined;
    if (detalleEspecifico.trim()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(detalleEspecifico);
      } catch {
        setError('El detalle específico debe ser un objeto JSON válido.');
        return;
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('El detalle específico debe ser un objeto JSON.');
        return;
      }
      detalle = parsed as Record<string, unknown>;
    }

    try {
      setGuardando(true);
      setError(null);
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const nueva = await adminService.crearIncidencia({
        titulo: tituloLimpio,
        descripcion: descripcionLimpia,
        categoria,
        ubicacion: {
          edificio: edificio.trim(),
          piso: piso.trim() || undefined,
          aula: aula.trim() || undefined,
          referencia: referencia.trim() || undefined,
        },
        detalle_especifico: {
          ...detalle,
          tipo_incidencia: tipoIncidencia,
        },
        tags,
      });

      onCreated(nueva);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la incidencia');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-[#A6C9B6]/40 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#2d3b4f] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3E828E] flex items-center justify-center">
              <TicketIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Registrar Nueva Incidencia</h3>
              <p className="text-xs text-[#A6C9B6]">
                Tu cuenta quedará como reportante; el sistema asigna prioridad y estado.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Título de la Incidencia *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={150}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Falla de conexión a internet en Sala de Cómputo"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descripción del Problema *
            </label>
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente los síntomas, equipos afectados y observaciones relevantes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Categoría Oficial *
            </label>
            <select
              required
              value={categoria}
              onChange={(e) => {
                const nuevaCategoria = e.target.value as CategoriaIncidencia;
                setCategoria(nuevaCategoria);
                setTipoIncidencia(tiposIncidenciaPorCategoria[nuevaCategoria][0].value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 bg-white"
            >
              <option value="computo_redes">Cómputo y Redes</option>
              <option value="infraestructura">Infraestructura y Mtto.</option>
              <option value="academico">Sistemas y Serv. Académicos</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tipo de incidencia *
            </label>
            <select
              required
              value={tipoIncidencia}
              onChange={(e) => setTipoIncidencia(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 bg-white"
            >
              {tiposIncidenciaPorCategoria[categoria].map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="font-bold text-slate-800">Ubicación en el Campus</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Edificio</label>
                <select
                  required
                  value={edificio}
                  onChange={(e) => setEdificio(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                >
                  <option value="C">Edificio C</option>
                  <option value="G">Edificio G</option>
                  <option value="M">Edificio M</option>
                  <option value="T">Edificio T</option>
                  <option value="F">Edificio F</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Piso</label>
                <input
                  type="text"
                  value={piso}
                  onChange={(e) => setPiso(e.target.value)}
                  placeholder="Ej. 1"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Aula / Espacio</label>
                <input
                  type="text"
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                  placeholder="Ej. Lab 6 / Cubículo 2"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-slate-600 mb-1">Referencia adicional</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej. junto al acceso principal"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">
              Información adicional <span className="font-normal text-slate-500">(JSON opcional)</span>
            </label>
            <textarea
              rows={3}
              value={detalleEspecifico}
              onChange={(e) => setDetalleEspecifico(e.target.value)}
              placeholder={'Ej. {"descripcion_problema": "No hay conexión en el aula"}'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800 resize-y font-mono"
            />
            <p className="text-[11px] text-slate-500">
              El tipo de incidencia seleccionado se incluirá automáticamente.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Etiquetas / Tags (separados por coma)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="red, switch, cisco"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3E828E] text-slate-800"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
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
              {guardando ? 'Guardando Incidencia...' : 'Crear Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
