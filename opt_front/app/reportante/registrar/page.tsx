'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const categorias = [
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'computo_redes', label: 'Cómputo y redes' },
  { value: 'academico', label: 'Académico' },
] as const;

const ubicacionInicial = { edificio: '', piso: '', aula: '', referencia: '' };

export default function RegistrarIncidenciaPage() {
  const router = useRouter();
  const [categoria, setCategoria] = useState<string>('infraestructura');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState(ubicacionInicial);
  const [detalleEspecifico, setDetalleEspecifico] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const requiereDetalle = useMemo(() => categoria === 'computo_redes' || categoria === 'infraestructura', [categoria]);

  function actualizarUbicacion(campo: keyof typeof ubicacionInicial, valor: string) {
    setUbicacion((prev) => ({ ...prev, [campo]: valor }));
  }

  function validar() {
    const next: Record<string, string> = {};
    if (!titulo.trim()) next.titulo = 'El título es obligatorio.';
    if (!descripcion.trim()) next.descripcion = 'La descripción es obligatoria.';
    if (!ubicacion.edificio.trim()) next.edificio = 'El edificio es obligatorio.';
    if (!ubicacion.aula.trim()) next.aula = 'El aula o espacio es obligatorio.';
    if (requiereDetalle && !detalleEspecifico.trim()) {
      next.detalle = 'Este campo es obligatorio para la categoría seleccionada.';
    }
    setErrores(next);
    return Object.keys(next).length === 0;
  }

  function manejarEnvio(event: React.FormEvent) {
    event.preventDefault();
    if (!validar()) return;
    router.push('/reportante');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#3F858D]">Nuevo reporte</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Registrar incidencia</h2>
      </div>

      <form onSubmit={manejarEnvio} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Título
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Ej. Fallo de red en laboratorio"
            />
            {errores.titulo && <span className="mt-1 block text-xs text-rose-600">{errores.titulo}</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
            >
              {categorias.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700">Categoría seleccionada</p>
            <div className="mt-2 rounded-xl bg-[#F3FAFB] px-3 py-2 text-[#235A60]">
              {categorias.find((item) => item.value === categoria)?.label}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Descripción
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Describe detalladamente el problema que observas."
            />
            {errores.descripcion && <span className="mt-1 block text-xs text-rose-600">{errores.descripcion}</span>}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Edificio
            <input
              value={ubicacion.edificio}
              onChange={(e) => actualizarUbicacion('edificio', e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Edificio C"
            />
            {errores.edificio && <span className="mt-1 block text-xs text-rose-600">{errores.edificio}</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Piso
            <input
              value={ubicacion.piso}
              onChange={(e) => actualizarUbicacion('piso', e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Piso 2"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Aula o espacio
            <input
              value={ubicacion.aula}
              onChange={(e) => actualizarUbicacion('aula', e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Laboratorio 204"
            />
            {errores.aula && <span className="mt-1 block text-xs text-rose-600">{errores.aula}</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Referencia
            <input
              value={ubicacion.referencia}
              onChange={(e) => actualizarUbicacion('referencia', e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
              placeholder="Frente al laboratorio"
            />
          </label>
        </div>

        {requiereDetalle && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-slate-700">
              Detalle específico
              <textarea
                value={detalleEspecifico}
                onChange={(e) => setDetalleEspecifico(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#3F858D] focus:ring-2 focus:ring-[#3F858D]/15"
                placeholder="Equipo, puerto, problema observado o datos relevantes."
              />
              {errores.detalle && <span className="mt-1 block text-xs text-rose-600">{errores.detalle}</span>}
            </label>
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700">
            Evidencias
            <input
              type="file"
              value={evidencia}
              onChange={(e) => setEvidencia(e.target.value)}
              className="mt-2 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#3F858D] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push('/reportante')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#3F858D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#32757C]"
          >
            Enviar reporte
          </button>
        </div>
      </form>
    </div>
  );
}
