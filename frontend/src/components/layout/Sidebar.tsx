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
      className="fixed left-0 top-0 hidden h-screen w-72 shrink-0 border-r border-white/8 bg-[#0d1b3e] text-white shadow-[18px_0_45px_rgba(8,15,35,0.4)] lg:flex lg:flex-col"
    >
      <div className="flex h-full flex-col px-5 py-6 min-h-0">
        <div className="shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/12 bg-white/10 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
              S
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">Panel</p>
              <p className="text-lg font-semibold text-white">Gestión de Préstamos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="rounded-[28px] border border-white/8 bg-white/6 p-3">
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
                      ? 'bg-white/15 text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)]'
                      : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/8 text-white/70'
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
