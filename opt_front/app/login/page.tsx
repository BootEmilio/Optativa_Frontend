"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/httpClient';
import { getRoleHomePath } from '@/lib/authSession';
import { useAuth } from '@/context/AuthContext';

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
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError('Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  if (cargando || usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8]">
        <p className="text-sm text-slate-600" role="status">Verificando sesión...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#00685f]">UTM Desk</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102b3a]">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Inicia sesión para consultar el panel de incidencias.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input
              autoComplete="username"
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#102b3a] outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15"
              onChange={(event) => setCorreo(event.target.value)}
              required
              type="email"
              value={correo}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              autoComplete="current-password"
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-[#102b3a] outline-none focus:border-[#00685f] focus:ring-2 focus:ring-[#00685f]/15"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error && (
            <p
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#00685f] px-4 text-sm font-semibold text-white transition hover:bg-[#00564f] focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={enviando}
            type="submit"
          >
            {enviando ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}

