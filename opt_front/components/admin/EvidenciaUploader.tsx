'use client';

import React, { useRef, useState } from 'react';
import { EvidenciaAdjunta } from '@/types/incidencia';
import { PaperClipIcon } from '../coordinador/Icons';

// Constantes alineadas con el backend
const MAX_EVIDENCIAS = 10;
const MAX_SIZE_MB = 10;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const ALLOWED_EXT = '.png,.jpg,.jpeg,.webp,.pdf';

interface EvidenciaUploaderProps {
  incidenciaId: string;
  evidencias: EvidenciaAdjunta[];
  onEvidenciaAgregada: (nuevasEvidencias: EvidenciaAdjunta[]) => void;
}

// Icono de archivo según MIME
function FileIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') {
    return (
      <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#3E828E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

export function EvidenciaUploader({
  incidenciaId,
  evidencias,
  onEvidenciaAgregada,
}: EvidenciaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorUpload, setErrorUpload] = useState<string | null>(null);
  const [preview, setPreview] = useState<File | null>(null);

  const puedeSubir = evidencias.length < MAX_EVIDENCIAS;

  const validarArchivo = (file: File): string | null => {
    if (!ALLOWED_MIME.includes(file.type)) {
      return `Tipo no permitido: ${file.type}. Usa PNG, JPG, WEBP o PDF.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `El archivo excede ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorUpload(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validarArchivo(file);
    if (err) {
      setErrorUpload(err);
      e.target.value = '';
      return;
    }
    setPreview(file);
  };

  const handleSubir = async () => {
    if (!preview) return;
    setErrorUpload(null);

    try {
      setSubiendo(true);

      // El endpoint usa multer (multipart/form-data), NO JSON.
      // Se llama directamente con fetch para no interferir con el Content-Type del boundary.
      const { AUTH_TOKEN_STORAGE_KEY } = await import('@/lib/authSession');
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
          : null;

      const { API_BASE_URL } = await import('@/config/endpoints');
      const formData = new FormData();
      formData.append('archivo', preview); // nombre del campo que multer espera

      const res = await fetch(
        `${API_BASE_URL}/api/incidencias/${encodeURIComponent(incidenciaId)}/evidencias`,
        {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData, // NO se pone Content-Type manual — el browser lo hace
        }
      );

      const json = (await res.json()) as { message?: string; evidencia?: EvidenciaAdjunta };

      if (!res.ok) {
        throw new Error(json.message ?? `Error ${res.status} al subir evidencia`);
      }

      if (json.evidencia) {
        onEvidenciaAgregada([...evidencias, json.evidencia]);
      }

      // Limpiar
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setErrorUpload(
        err instanceof Error ? err.message : 'Error al subir la evidencia'
      );
    } finally {
      setSubiendo(false);
    }
  };

  const handleCancelar = () => {
    setPreview(null);
    setErrorUpload(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <PaperClipIcon className="w-4 h-4 text-[#3E828E]" />
          <span>
            Evidencias Adjuntas ({evidencias.length}/{MAX_EVIDENCIAS})
          </span>
        </div>
        {puedeSubir && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="text-[11px] font-bold text-[#3E828E] hover:text-[#346F7A] hover:underline transition-colors disabled:opacity-40"
          >
            + Adjuntar archivo
          </button>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXT}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error de validación / upload */}
      {errorUpload && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorUpload}
        </div>
      )}

      {/* Preview del archivo seleccionado */}
      {preview && (
        <div className="p-3 rounded-xl bg-[#A6C9B6]/10 border border-[#A6C9B6]/40 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <FileIcon mime={preview.type} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#27153D] truncate">{preview.name}</p>
              <p className="text-[10px] text-gray-500">
                {(preview.size / 1024).toFixed(0)} KB • {preview.type}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelar}
              disabled={subiendo}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubir}
              disabled={subiendo}
              className="px-3 py-1.5 rounded-lg bg-[#3E828E] hover:bg-[#346F7A] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
            >
              {subiendo ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Subiendo...</span>
                </>
              ) : (
                <span>Subir evidencia</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Límite alcanzado */}
      {!puedeSubir && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Límite de {MAX_EVIDENCIAS} evidencias alcanzado.
        </p>
      )}

      {/* Lista de evidencias existentes */}
      {evidencias.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {evidencias.map((ev, idx) => (
            <a
              key={idx}
              href={ev.url_storage}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg border border-slate-200 hover:border-[#3E828E] hover:bg-slate-50 transition-colors flex items-center space-x-2.5 group"
            >
              <FileIcon mime={ev.tipo_mime} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#27153D] truncate group-hover:text-[#3E828E] transition-colors">
                  {ev.nombre_archivo}
                </p>
                <p className="text-[10px] text-gray-400">
                  {ev.peso_kb} KB
                  {ev.fecha_carga ? ` • ${formatDate(ev.fecha_carga)}` : ''}
                </p>
              </div>
              <span className="text-[#3E828E] font-bold text-[11px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver ↗
              </span>
            </a>
          ))}
        </div>
      ) : (
        !preview && (
          <div className="py-5 text-center border border-dashed border-[#A6C9B6]/50 rounded-xl bg-[#F8FAFC]">
            <PaperClipIcon className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs text-gray-400 font-medium">Sin evidencias adjuntas</p>
            <p className="text-[11px] text-gray-300 mt-0.5">
              PNG, JPG, WEBP o PDF · máx. {MAX_SIZE_MB} MB por archivo
            </p>
          </div>
        )
      )}
    </div>
  );
}

