'use client';

import React, { useState } from 'react';
import { coordinadorService } from '../../services/coordinadorService';
import { TagIcon, PlusIcon, XMarkIcon } from './Icons';

interface TagManagerProps {
  incidenciaId: string;
  tags: string[];
  onTagsUpdated?: (newTags: string[]) => void;
  readOnly?: boolean;
}

const ETIQUETAS_SUGERIDAS = [
  'red',
  'switch',
  'wifi',
  'fibra-optica',
  'hardware',
  'electricidad',
  'servidor',
  'software',
  'seguridad',
  'aula-computo',
  'urgente',
];

export const TagManager: React.FC<TagManagerProps> = ({
  incidenciaId,
  tags: initialTags,
  onTagsUpdated,
  readOnly = false,
}) => {
  const [currentTags, setCurrentTags] = useState<string[]>(initialTags);
  const [inputTag, setInputTag] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleAddTag = async (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase();
    if (!cleanTag) return;

    // Lógica NoSQL $addToSet: verificar si ya existe
    if (currentTags.includes(cleanTag)) {
      setMensaje(`La etiqueta "${cleanTag}" ya se encuentra asignada.`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    try {
      setCargando(true);
      setMensaje(null);
      const updated = await coordinadorService.agregarTag(incidenciaId, cleanTag);
      setCurrentTags(updated.tags);
      setInputTag('');
      if (onTagsUpdated) {
        onTagsUpdated(updated.tags);
      }
    } catch {
      setMensaje('No se pudo agregar la etiqueta.');
    } finally {
      setCargando(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (readOnly) return;
    try {
      setCargando(true);
      setMensaje(null);
      // Lógica NoSQL $pull
      const updated = await coordinadorService.eliminarTag(incidenciaId, tagToRemove);
      setCurrentTags(updated.tags);
      if (onTagsUpdated) {
        onTagsUpdated(updated.tags);
      }
    } catch {
      setMensaje('No se pudo eliminar la etiqueta.');
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputTag);
    }
  };

  const sugerenciasDisponibles = ETIQUETAS_SUGERIDAS.filter(
    (sug) => !currentTags.includes(sug)
  );

  return (
    <div className="bg-white rounded-xl border border-[#E9ECEF] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TagIcon className="w-5 h-5 text-[#00B4D8]" />
          <h4 className="font-bold text-sm text-[#1D3557]">
            Descriptores Técnicos (Tags)
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-gray-500">
          {currentTags.length} etiqueta(s)
        </span>
      </div>

      {mensaje && (
        <div className="mb-3 text-xs px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          {mensaje}
        </div>
      )}

      {/* Tag Badges List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {currentTags.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Sin etiquetas asignadas. Agrega descriptores para clasificar la falla.
          </p>
        ) : (
          currentTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F7FA] text-[#0077B6] border border-[#90E0EF]/60 shadow-xs group"
            >
              #{tag}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={cargando}
                  title={`Eliminar #${tag} ($pull)`}
                  className="ml-1.5 p-0.5 rounded-full hover:bg-[#0096C7] hover:text-white transition-colors text-[#0077B6]"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Input to Add Tag */}
      {!readOnly && (
        <div className="space-y-3 pt-2 border-t border-[#E9ECEF]">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                #
              </span>
              <input
                type="text"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe una etiqueta y presiona Enter..."
                disabled={cargando}
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-[#E9ECEF] focus:outline-hidden focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent text-[#2B2D42]"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddTag(inputTag)}
              disabled={cargando || !inputTag.trim()}
              className="px-3 py-1.5 rounded-lg bg-[#00B4D8] hover:bg-[#0096C7] text-white text-xs font-bold transition-colors flex items-center space-x-1 disabled:opacity-50"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Quick Suggestions */}
          {sugerenciasDisponibles.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                Sugerencias rápidas ($addToSet):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sugerenciasDisponibles.slice(0, 6).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddTag(sug)}
                    disabled={cargando}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#F8F9FA] hover:bg-[#E0F7FA] text-[#2B2D42] hover:text-[#0077B6] border border-[#E9ECEF] transition-all flex items-center space-x-1"
                  >
                    <span>+{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

