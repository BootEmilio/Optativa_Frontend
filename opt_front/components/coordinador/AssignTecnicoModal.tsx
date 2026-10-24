'use client';

import React, { useState, useEffect } from 'react';
import { Incidencia } from '../../types/incidencia';
import { TecnicoDisponible } from '../../types/usuario';
import { coordinadorService } from '../../services/coordinadorService';
import { XMarkIcon, UserIcon, ShieldCheckIcon } from './Icons';

interface AssignTecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidencia: Incidencia | null;
  onAssigned: (incidenciaActualizada: Incidencia) => void;
}

export const AssignTecnicoModal: React.FC<AssignTecnicoModalProps> = ({
  isOpen,
  onClose,
  incidencia,
  onAssigned,
}) => {
  const [tecnicos, setTecnicos] = useState<TecnicoDisponible[]>([]);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string>('');
  const [comentario, setComentario] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    coordinadorService.getTecnicosDisponibles().then((data) => {
      if (!isMounted) return;
      setTecnicos(data);
      if (incidencia?.tecnico_asignado?.usuario_id) {
        setSelectedTecnicoId(incidencia.tecnico_asignado.usuario_id);
      } else if (data.length > 0) {
        setSelectedTecnicoId(data[0]._id);
      }
      setComentario('');
      setError(null);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, incidencia]);

  if (!isOpen || !incidencia) return null;

  const esReasignacion = !!incidencia.tecnico_asignado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTecnicoId) {
      setError('Por favor selecciona un técnico.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const actualizada = await coordinadorService.asignarTecnico(
        incidencia._id,
        selectedTecnicoId,
        comentario.trim() ? comentario.trim() : undefined
      );
      onAssigned(actualizada);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asignar técnico');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E9ECEF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1D3557] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-[#90E0EF]" />
            <h3 className="font-bold text-base">
              {esReasignacion ? 'Reasignar Técnico de Soporte' : 'Asignar Técnico de Soporte'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ticket context preview */}
          <div className="p-3.5 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#1D3557]">{incidencia.codigo}</span>
              <span className="text-[#2B2D42]/70 font-medium capitalize">
                Edificio {incidencia.ubicacion.edificio} - {incidencia.ubicacion.aula || 'Área común'}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#2B2D42] line-clamp-1">
              {incidencia.titulo}
            </p>
            {esReasignacion && (
              <p className="text-xs text-amber-700 mt-1 font-medium">
                Actualmente asignado a:{' '}
                <span className="font-bold">
                  {incidencia.tecnico_asignado?.nombre}
                </span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Technician Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1D3557] uppercase tracking-wider mb-2">
              Seleccionar Técnico Disponible
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tecnicos.map((tec) => {
                const isSelected = selectedTecnicoId === tec._id;
                return (
                  <label
                    key={tec._id}
                    onClick={() => setSelectedTecnicoId(tec._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00B4D8] bg-[#E0F7FA]/30 ring-1 ring-[#00B4D8]'
                        : 'border-[#E9ECEF] bg-white hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="tecnico"
                        value={tec._id}
                        checked={isSelected}
                        onChange={() => setSelectedTecnicoId(tec._id)}
                        className="text-[#00B4D8] focus:ring-[#00B4D8] h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#2B2D42]">
                          {tec.nombre} {tec.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">{tec.especialidad}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {tec.incidencias_activas} activa(s)
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction/Comment */}
          <div>
            <label className="block text-xs font-bold text-[#1D3557] uppercase tracking-wider mb-1">
              Instrucciones / Nota de Coordinación (Opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Indica prioridades o detalles adicionales para el técnico..."
              rows={3}
              className="w-full text-sm p-3 rounded-lg border border-[#E9ECEF] focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent text-[#2B2D42] placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#E9ECEF]">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 rounded-lg bg-[#00B4D8] hover:bg-[#0096C7] text-white text-sm font-bold shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {cargando ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>{esReasignacion ? 'Confirmar Reasignación' : 'Asignar Técnico'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

