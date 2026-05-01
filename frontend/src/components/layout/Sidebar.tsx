'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  label: string;
  icon: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: 'Inicio', icon: '◌', href: '/' },
  { label: 'Proveedores', icon: '▣', href: '/catalogos/proveedores' },
  { label: 'Categorías', icon: '◇', href: '/catalogos/categorias' },
  { label: 'Personas', icon: '◎', href: '/catalogos/personas' },
  { label: 'Ubicaciones', icon: '▤', href: '/ubicaciones' },
  { label: 'Inventario', icon: '◫', href: '/inventario' },
  { label: 'Préstamos', icon: '↗', href: '/prestamos' },
  { label: 'Movimientos', icon: '↺', href: '/movimientos' },
  { label: 'Seguridad', icon: '◈', href: '/seguridad' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 hidden min-h-screen shrink-0 border-r border-white/14 bg-[linear-gradient(180deg,#10367d_0%,#123c8d_45%,#174ba6_100%)] text-white shadow-[18px_0_45px_rgba(16,54,125,0.12)] lg:flex lg:flex-col ${
        collapsed ? 'w-24' : 'w-72'
      } transition-all duration-300`}
    >
      <div className="flex items-center justify-between px-5 py-6">
        {!collapsed && (
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
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/18 hover:text-white"
          title="Colapsar menú"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="px-4">
        <div className="rounded-[28px] border border-white/14 bg-white/8 p-3">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : ''}
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
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

    </aside>
  );
}
