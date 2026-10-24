'use client';

import React, { useEffect, useState } from 'react';
import { EstadoIncidencia, Incidencia } from '../../types/incidencia';
import { coordinadorService } from '../../services/coordinadorService';
import { XMarkIcon, CheckCircleIcon, RefreshIcon, AlertCircleIcon } from './Icons';

interface CloseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidencia: Incidencia | null;
  onTicketUpdated: (incidenciaActualizada: Incidencia) => void;
}

type ModoAuditoria = 'cerrar' | 'reabrir';

function puedeCerrar(estado: EstadoIncidencia) {
  return estado === 'resuelta';
}

function puedeReabrir(estado: EstadoIncidencia) {
  return estado === 'cerrada' || estado === 'resuelta';
}

function modoInicial(estado: EstadoIncidencia): ModoAuditoria {
  if (estado === 'cerrada') return 'reabrir';
  return 'cerrar';
}

export const CloseTicketModal: React.FC<CloseTicketModalProps> = ({
  isOpen,
  onClose,
  incidencia,
  onTicketUpdated,
}) => {
  const [modo, setModo] = useState<ModoAuditoria>('cerrar');
  const [comentario, setComentario] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !incidencia) return;
    setModo(modoInicial(incidencia.estado));
    setComentario('');
    setError(null);
    setCargando(false);
  }, [isOpen, incidencia]);

  if (!isOpen || !incidencia) return null;

  const mostrarCerrar = puedeCerrar(incidencia.estado);
  const mostrarReabrir = puedeReabrir(incidencia.estado);

  const ultimoPasoResolucion = [...incidencia.historial_seguimiento]
    .reverse()
    .find((h) => h.accion === 'resolucion' || h.estado_nuevo === 'resuelta');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modo === 'cerrar' && !mostrarCerrar) {
      setError('Esta incidencia no se puede cerrar en su estado actual.');
      return;
    }
    if (modo === 'reabrir' && !mostrarReabrir) {
      setError('Esta incidencia no se puede reabrir en su estado actual.');
      return;
    }
    if (modo === 'reabrir' && !comentario.trim()) {
      setError('Debes especificar el motivo o justificación técnica para reabrir la incidencia.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      let actualizada: Incidencia;

      if (modo === 'cerrar') {
        actualizada = await coordinadorService.cerrarIncidencia(
          incidencia._id,
          comentario.trim() || 'Auditoría aprobada por Coordinación. Solución verificada satisfactoriamente.'
        );
      } else {
        actualizada = await coordinadorService.reabrirIncidencia(
          incidencia._id,
          comentario.trim()
        );
      }

      onTicketUpdated(actualizada);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la auditoría');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E9ECEF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#1D3557] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-[#90E0EF]" />
            <h3 className="font-bold text-base">Auditoría y Validación de Ticket</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1D3557]">{incidencia.codigo}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Estado Actual: {incidencia.estado}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#2B2D42]">{incidencia.titulo}</p>

            {ultimoPasoResolucion && (
              <div className="mt-2 pt-2 border-t border-[#E9ECEF] text-xs text-gray-600">
                <p className="font-bold text-[#1D3557]">Nota de solución del técnico:</p>
                <p className="italic text-gray-700 mt-0.5">
                  &ldquo;{ultimoPasoResolucion.comentario}&rdquo;
                </p>
                <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-gray-500">
                  <span>Por: <b>{ultimoPasoResolucion.autor}</b></span>
                  {incidencia.horas_invertidas && (
                    <span>Horas registradas: <b>{incidencia.horas_invertidas} hrs</b></span>
                  )}
                </div>
              </div>
            )}
          </div>

          {(mostrarCerrar || mostrarReabrir) && (
            <div>
              <label className="block text-xs font-bold text-[#1D3557] uppercase tracking-wider mb-2">
                Acción a Ejecutar
              </label>
              <div className={`grid gap-3 ${mostrarCerrar && mostrarReabrir ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {mostrarCerrar && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo('cerrar');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      modo === 'cerrar'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30'
                        : 'border-[#E9ECEF] bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Autorizar Cierre Final</span>
                  </button>
                )}

                {mostrarReabrir && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo('reabrir');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      modo === 'reabrir'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30'
                        : 'border-[#E9ECEF] bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <RefreshIcon className="w-4 h-4 text-amber-600" />
                    <span>Reabrir Incidencia</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1D3557] uppercase tracking-wider mb-1">
              {modo === 'cerrar'
                ? 'Comentario de Auditoría y Cierre (Opcional)'
                : 'Motivo y Observaciones de Reapertura (Obligatorio)'}
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={
                modo === 'cerrar'
                  ? 'Ej: Se constató con el usuario reportante que el servicio está 100% operativo...'
                  : 'Ej: El equipo sigue presentando intermitencia en el encendido...'
              }
              rows={3}
              className="w-full text-sm p-3 rounded-lg border border-[#E9ECEF] focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent text-[#2B2D42] placeholder:text-gray-400"
            />
          </div>

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
              disabled={cargando || (modo === 'cerrar' ? !mostrarCerrar : !mostrarReabrir)}
              className={`px-5 py-2 rounded-lg text-white text-sm font-bold shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50 ${
                modo === 'cerrar'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {cargando ? (
                <span>Procesando...</span>
              ) : modo === 'cerrar' ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Confirmar Cierre de Ticket</span>
                </>
              ) : (
                <>
                  <RefreshIcon className="w-4 h-4" />
                  <span>Confirmar Reapertura</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
