'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthProvider';
import { getDemoCredentials } from '../../lib/auth';

const demo = getDemoCredentials();

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState(demo.email);
  const [password, setPassword] = useState(demo.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-soft)] px-6 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,54,125,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(165,206,224,0.35),_transparent_24%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#10367d_0%,#1548a4_72%,#1f61c5_100%)] p-10 text-white shadow-[0_40px_90px_rgba(16,54,125,0.24)] md:p-14">
          <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 text-3xl">
            ⌁
          </div>

          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-white/80">
              Sistema de Gestión
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Controla préstamos, inventario y ubicaciones desde un solo lugar.
            </h1>
            <p className="max-w-lg text-base leading-8 text-white/78 md:text-lg">
              Una experiencia limpia, rápida y enfocada para el equipo que administra herramientas,
              existencias y movimientos diarios.
            </p>
          </div>

          <div className="mt-12 grid gap-4 text-sm text-white/92">
            {[
              'Acceso seguro al panel administrativo',
              'Inventario, préstamos y movimientos en un flujo simple',
              'Diseño minimalista con foco en lo importante',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/14 bg-white/8 px-4 py-3">
                <span className="text-lg">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] md:p-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Bienvenido
              </span>
              <h2 className="text-4xl font-semibold text-[var(--text-main)]">Inicia sesión</h2>
              <p className="text-base leading-7 text-[var(--text-muted)]">
                Entra al panel con un estilo claro y profesional, pensado para trabajar sin distracciones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="soft-input"
                  placeholder="tu@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-main)]">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="soft-input"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={loading} className="soft-btn-primary w-full justify-center py-3.5 text-base">
                {loading ? 'Entrando...' : 'Entrar al sistema'}
              </button>
            </form>

            <div className="rounded-[28px] bg-[var(--bg-soft)] p-5">
              <p className="text-sm font-semibold text-[var(--accent-strong)]">Acceso de demostración</p>
              <div className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
                <p><span className="font-medium text-[var(--text-main)]">Correo:</span> {demo.email}</p>
                <p><span className="font-medium text-[var(--text-main)]">Contraseña:</span> {demo.password}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
