'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  modulo?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Inicio', icon: '◌', href: '/', modulo: 'DASHBOARD' },
  { label: 'Categorías', icon: '◇', href: '/catalogos/categorias', modulo: 'CATEGORIAS' },
  { label: 'Personas', icon: '◎', href: '/catalogos/personas', modulo: 'PERSONAS' },
  { label: 'Ubicaciones', icon: '▤', href: '/ubicaciones', modulo: 'UBICACIONES' },
  { label: 'Inventario', icon: '◫', href: '/inventario', modulo: 'INVENTARIO' },
  { label: 'Préstamos', icon: '↗', href: '/prestamos', modulo: 'PRESTAMOS' },
  { label: 'Movimientos', icon: '↺', href: '/movimientos', modulo: 'MOVIMIENTOS' },
  { label: 'Pedidos', icon: '☰', href: '/pedidos', modulo: 'INVENTARIO' },
  { label: 'Reportes', icon: '▣', href: '/reportes' },
  { label: 'Seguridad', icon: '◈', href: '/seguridad', modulo: 'USUARIOS' },
  { label: 'Admin', icon: '⚙', href: '/admin' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const itemsVisibles = user?.permisos
    ? menuItems.filter((item) => !item.modulo || user.permisos[item.modulo]?.leer)
    : [];

  return (
    <aside
      className="fixed left-0 top-0 hidden h-screen w-72 shrink-0 border-r border-white/14 bg-[linear-gradient(180deg,#10367d_0%,#123c8d_45%,#174ba6_100%)] text-white shadow-[18px_0_45px_rgba(16,54,125,0.12)] lg:flex lg:flex-col"
    >
      <div className="flex h-full flex-col px-5 py-6">
        <div className="shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="app-logo-dot flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/16 bg-white/12 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(255,255,255,0.08)]">
              S
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">Panel</p>
              <p className="text-lg font-semibold text-white">Gestión de Préstamos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="rounded-[28px] border border-white/14 bg-white/8 p-3">
          <nav className="space-y-1">
            {itemsVisibles.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-[var(--accent-strong)] shadow-[0_12px_30px_rgba(8,25,61,0.18)]'
                      : 'text-white/76 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm ${
                    isActive ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-white/10 text-white/88'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      </div>
    </aside>
  );
}
