'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import api from '../../lib/api';

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
    subtitle: 'Organización física de estantes, cajas y estuches',
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
  '/catalogos/categorias': {
    title: 'Categorías',
    subtitle: 'Clasificación simple para ordenar el inventario',
  },
  '/seguridad': {
    title: 'Seguridad',
    subtitle: 'Gestión de roles, permisos y usuarios del sistema',
  },
  '/mi-cuenta': {
    title: 'Administrar perfil',
    subtitle: 'Actualiza tus datos de acceso y tu contraseña',
  },
  '/reportes': {
    title: 'Reportes',
    subtitle: 'Indicadores y estadísticas del sistema',
  },
};

interface AlertaItem {
  id: string;
  tipo: 'vencido' | 'stock';
  mensaje: string;
  ruta: string;
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [showAlertas, setShowAlertas] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const cargarAlertas = async () => {
      const items: AlertaItem[] = [];
      try {
        const vencidos = await api.get('/prestamos?estado=VENCIDO') as unknown[];
        if (Array.isArray(vencidos)) {
          vencidos.forEach((v) => {
            const item = v as Record<string, unknown>;
            items.push({
              id: `v-${item.id}`,
              tipo: 'vencido',
              mensaje: `Préstamo vencido: ${(item.inventario as Record<string, unknown>)?.nombre || '—'} - ${(item.persona as Record<string, unknown>)?.nombres || ''} ${(item.persona as Record<string, unknown>)?.apellidos || ''}`,
              ruta: '/prestamos',
            });
          });
        }
      } catch {}
      try {
        const inventario = await api.get('/inventario') as unknown[];
        if (Array.isArray(inventario)) {
          inventario.filter((i) => ((i as Record<string, unknown>).cantidad_disponible as number) <= ((i as Record<string, unknown>).stock_minimo as number || 1))
            .forEach((i) => {
              const inv = i as Record<string, unknown>;
              items.push({
                id: `s-${inv.id}`,
                tipo: 'stock',
                mensaje: `Stock bajo: ${inv.nombre} (${inv.cantidad_disponible} disp., mín. ${inv.stock_minimo})`,
                ruta: '/inventario',
              });
            });
        }
      } catch {}
      setAlertas(items);
    };
    cargarAlertas();
    const interval = setInterval(cargarAlertas, 15000);
    const onRefresh = () => cargarAlertas();
    window.addEventListener('refresh-alertas', onRefresh);
    return () => { clearInterval(interval); window.removeEventListener('refresh-alertas', onRefresh); };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAlertas(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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

  async function handleLogout() {
    await signOut();
    window.location.replace('/login');
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

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:flex-wrap">
          <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-muted)] shrink-0">
            <span className="hidden xs:inline">Sesión activa como </span>
            <span className="font-semibold text-[var(--text-main)]">{user?.rol}</span>
          </div>

          <div ref={dropdownRef} className="relative shrink-0">
            <button onClick={() => setShowAlertas(!showAlertas)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] transition">
              <span className="text-lg">🔔</span>
              {alertas.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {alertas.length}
                </span>
              )}
            </button>

            {showAlertas && (
              <div className="absolute right-0 z-50 mt-2 w-96 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-soft)] max-h-96 overflow-y-auto">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Alertas ({alertas.length})
                </p>
                {alertas.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-[var(--text-muted)]">No hay alertas</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {alertas.map((a) => (
                      <button key={a.id} onClick={() => { router.push(a.ruta); setShowAlertas(false); }}
                        className={`flex w-full gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[var(--surface-2)] ${
                          a.tipo === 'vencido' ? 'border-l-4 border-red-400' : 'border-l-4 border-amber-400'
                        }`}>
                        <span className="mt-0.5 shrink-0">{a.tipo === 'vencido' ? '🔴' : '🟡'}</span>
                        <div>
                          <p className="font-medium text-[var(--text-main)]">{a.mensaje}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {a.tipo === 'vencido' ? 'Préstamo vencido' : 'Stock por debajo del mínimo'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white pl-3 pr-2 py-2 shadow-[var(--shadow-soft)] shrink-0 max-w-full">
            <div className="app-logo-dot flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="text-sm font-semibold text-[var(--text-main)] truncate">{user?.nombre}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.usuario}</p>
            </div>
            <span className="mx-1 hidden h-6 w-px bg-[var(--border)] md:block" />
            <button onClick={() => router.push('/mi-cuenta')} className="soft-btn-ghost shrink-0 px-3 py-1.5 text-xs text-[var(--accent-strong)] whitespace-nowrap">
              Perfil
            </button>
            <button onClick={handleLogout} className="soft-btn-secondary shrink-0 px-3 py-1.5 text-xs whitespace-nowrap">
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
