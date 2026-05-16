'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';
import { obtenerRutaDestino } from '../../lib/permissions';

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
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-soft)] px-6 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,54,125,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(165,206,224,0.35),_transparent_24%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Panel izquierdo */}
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#10367d_0%,#1548a4_72%,#1f61c5_100%)] p-10 text-white shadow-[0_40px_90px_rgba(16,54,125,0.24)] md:p-14">


          <div className="max-w-xl space-y-2">

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="h-110 w-auto" />

            <p className="max-w-lg text-base leading-8 text-white/78 md:text-lg">
              Una plataforma administrativa segura, rápida y enfocada para gestionar herramientas,
              existencias y movimientos diarios.
            </p>
          </div>

          <div className="mt-12 grid gap-4 text-sm text-white/92">
            {[
              'Mejor Organizacion de Objetos y herramientas dentro de un almacen',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/14 bg-white/8 px-4 py-3">
                <span className="text-lg">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel derecho — Formulario */}
        <section className="rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] md:p-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Bienvenido
              </span>
              <h2 className="text-4xl font-semibold text-[var(--text-main)]">Inicia sesión</h2>
              <p className="text-base leading-7 text-[var(--text-muted)]">
                Ingresa con tu nombre de usuario y contraseña asignados por el administrador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="soft-input"
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="soft-input"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="soft-btn-primary w-full justify-center py-3.5 text-base"
              >
                {loading ? 'Verificando...' : 'Entrar al sistema'}
              </button>
              <a href="/recuperar" className="block text-center text-sm text-blue-600 hover:underline mt-2">
                ¿Olvidaste tu contraseña?
              </a>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
