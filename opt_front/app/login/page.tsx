"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/httpClient';
import { getRoleHomePath } from '@/lib/authSession';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, endpoints } from '@/config/endpoints';

export default function LoginPage() {
  const router = useRouter();
  const { usuario, cargando, iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && usuario) router.replace(getRoleHomePath(usuario.rol));
  }, [cargando, router, usuario]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const loggedInUser = await iniciarSesion(correo.trim(), password);
      router.replace(getRoleHomePath(loggedInUser.rol));
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 401) {
          setError('Correo o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.');
        } else if (requestError.status === 404) {
          setError(`El endpoint de autenticación no fue encontrado (404) en ${API_BASE_URL}${endpoints.auth.login}. Verifica que el backend esté ejecutando esta ruta.`);
        } else if (requestError.status === 408) {
          setError('Tiempo de espera agotado. El backend en Render está despertando (puede demorar ~50s por inactividad). Por favor, intenta de nuevo.');
        } else {
          setError(requestError.message || `Error del servidor (${requestError.status}).`);
        }
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo iniciar sesión. Verifica tu conexión con el backend.',
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  const fillQuickAccount = (emailValue: string, roleName: string) => {
    setCorreo(emailValue);
    setPassword('admin123');
    setError(null);
  };

  if (cargando || usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span className="w-4 h-4 rounded-full border-2 border-[#00685f] border-t-transparent animate-spin" />
          <span>Verificando sesión...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#00685f]">UTM Desk</p>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              POST .../api/auth/login
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102b3a]">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa con tus credenciales universitarias para acceder a tu panel.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico institucional
            <input
              autoComplete="username"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#102b3a] outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15"
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="usuario@utm.test"
              required
              type="email"
              value={correo}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              autoComplete="current-password"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#102b3a] outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              type="password"
              value={password}
            />
          </label>

          {error && (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 leading-relaxed"
              role="alert"
            >
              <p className="font-semibold mb-0.5">Error de autenticación</p>
              <p>{error}</p>
            </div>
          )}

          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-semibold text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={enviando}
            type="submit"
          >
            {enviando ? 'Conectando con el servidor...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Acceso Rápido / Pruebas de Roles */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Cuentas de prueba del campus
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@utm.test', 'Administrador')}
              className="p-2 rounded-lg border border-slate-200 hover:border-[#00685f] hover:bg-slate-50 text-left transition-colors"
            >
              <span className="font-bold text-[#102b3a] block">Administrador</span>
              <span className="text-slate-400 text-[10px] truncate block">admin@utm.test</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('laura.coordinadora@utm.test', 'Coordinador')}
              className="p-2 rounded-lg border border-slate-200 hover:border-[#00685f] hover:bg-slate-50 text-left transition-colors"
            >
              <span className="font-bold text-[#102b3a] block">Coordinador</span>
              <span className="text-slate-400 text-[10px] truncate block">laura.coordinadora@...</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('elena.ramos@utm.test', 'Analista')}
              className="p-2 rounded-lg border border-slate-200 hover:border-[#00685f] hover:bg-slate-50 text-left transition-colors"
            >
              <span className="font-bold text-[#102b3a] block">Directivo / Analista</span>
              <span className="text-slate-400 text-[10px] truncate block">elena.ramos@...</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('carlos.tecnico@utm.test', 'Técnico')}
              className="p-2 rounded-lg border border-slate-200 hover:border-[#00685f] hover:bg-slate-50 text-left transition-colors"
            >
              <span className="font-bold text-[#102b3a] block">Técnico Soporte</span>
              <span className="text-slate-400 text-[10px] truncate block">carlos.tecnico@...</span>
            </button>
          </div>
        </div>

        {/* Backend Info Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Servidor: {API_BASE_URL.replace('https://', '')}</span>
          <span className="font-mono">Ruta: /api/auth/login</span>
        </div>
      </section>
    </main>
  );
}

