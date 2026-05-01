'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Panel general',
    subtitle: 'Resumen operativo del sistema',
  },
  '/inventario': {
    title: 'Inventario',
    subtitle: 'Catálogo, existencias y control visual de herramientas',
  },
  '/ubicaciones': {
    title: 'Ubicaciones',
    subtitle: 'Organización física de estantes y cajas',
  },
  '/prestamos': {
    title: 'Préstamos',
    subtitle: 'Seguimiento de entregas, devoluciones y pendientes',
  },
  '/movimientos': {
    title: 'Movimientos',
    subtitle: 'Historial y trazabilidad del inventario',
  },
  '/catalogos/personas': {
    title: 'Personas',
    subtitle: 'Usuarios y responsables relacionados con los préstamos',
  },
  '/catalogos/proveedores': {
    title: 'Proveedores',
    subtitle: 'Empresas y contactos asociados al abastecimiento',
  },
  '/catalogos/categorias': {
    title: 'Categorías',
    subtitle: 'Clasificación simple para ordenar el inventario',
  },
  '/seguridad': {
    title: 'Seguridad',
    subtitle: 'Gestión de roles, permisos y usuarios del sistema',
  },
  '/mi-cuenta': {
    title: 'Mi cuenta',
    subtitle: 'Administra tu perfil y credenciales de acceso',
  },
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const section = useMemo(() => {
    const key = Object.keys(TITLES).find((item) => pathname === item || pathname.startsWith(`${item}/`));
    return key ? TITLES[key] : TITLES['/'];
  }, [pathname]);

  const initials = user?.nombre
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  function handleLogout() {
    signOut();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/88 px-6 py-5 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            Sistema administrativo
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{section.title}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{section.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-muted)]">
            Sesión activa como <span className="font-semibold text-[var(--text-main)]">{user?.rol}</span>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
            <div className="app-logo-dot flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden pr-2 sm:block">
              <p className="text-sm font-semibold text-[var(--text-main)]">{user?.nombre}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
            <button onClick={() => router.push('/mi-cuenta')} className="soft-btn-ghost px-4 py-2 text-sm text-[var(--accent-strong)]">
              Mi cuenta
            </button>
            <button onClick={handleLogout} className="soft-btn-secondary px-4 py-2 text-sm">
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
