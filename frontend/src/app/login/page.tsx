'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';
import { obtenerRutaDestino } from '../../lib/permissions';
import DotWaveBackground from '../../components/ui/DotWaveBackground';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { notify } = useNotification();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(obtenerRutaDestino(user.permisos));
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      notify('error', 'Revisa los datos de acceso', ['Por favor completa todos los campos.']);
      return;
    }
    setLoading(true);

    try {
      await signIn(usuario.trim(), password);
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Credenciales inválidas.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1b3e] px-6 py-8">
      <DotWaveBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,54,125,0.3),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(165,206,224,0.15),_transparent_40%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Panel izquierdo */}
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/10 p-10 text-white shadow-[0_40px_90px_rgba(0,0,0,0.3)] backdrop-blur-[8px] md:p-14">
          <div className="relative z-10 max-w-xl space-y-2">

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-110 w-auto" />

            <p className="max-w-lg text-base leading-8 text-white/70 md:text-lg">
              Una plataforma administrativa segura, rápida y enfocada para gestionar herramientas,
              existencias y movimientos diarios.
            </p>
          </div>

          <div className="mt-12 grid gap-4 text-sm text-white/85">
            {[
              'Mejor Organizacion de Objetos y herramientas dentro de un almacen',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-[4px]">
                <span className="text-lg">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel derecho — Formulario */}
        <section className="rounded-[32px] border border-white/15 bg-white/15 p-8 shadow-[0_40px_90px_rgba(0,0,0,0.25)] backdrop-blur-[12px] md:p-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-[4px]">
                Bienvenido
              </span>
              <h2 className="text-4xl font-semibold text-white">Inicia sesión</h2>
              <p className="text-base leading-7 text-white/60">
                Ingresa con tu nombre de usuario y contraseña asignados por el administrador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full rounded-[14px] border border-white/15 bg-white/10 px-4 py-3.5 text-white caret-white/80 placeholder-white/40 backdrop-blur-[4px] transition-all duration-200 focus:border-white/30 focus:bg-white/15 focus:outline-none focus:ring-[3px] focus:ring-white/10"
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[14px] border border-white/15 bg-white/10 px-4 py-3.5 text-white caret-white/80 placeholder-white/40 backdrop-blur-[4px] transition-all duration-200 focus:border-white/30 focus:bg-white/15 focus:outline-none focus:ring-[3px] focus:ring-white/10"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/15 px-6 py-3.5 text-base font-semibold text-white shadow-lg backdrop-blur-[4px] transition-all duration-200 hover:bg-white/25 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verificando...' : 'Entrar al sistema'}
              </button>
              <a href="/recuperar" className="mt-2 block text-center text-sm text-white/50 transition-colors hover:text-white/80">
                ¿Olvidaste tu contraseña?
              </a>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
