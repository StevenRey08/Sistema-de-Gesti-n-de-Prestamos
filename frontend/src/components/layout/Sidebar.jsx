'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { label: 'Inicio', icon: '', href: '/' },
  { label: 'Proveedores', icon: '', href: '/catalogos/proveedores' },
  { label: 'Categorías', icon: '', href: '/catalogos/categorias' },
  { label: 'Personas', icon: '', href: '/catalogos/personas' },
  { label: 'Herramientas', icon: '', href: '/herramientas' },
  { label: 'Inventario', icon: '', href: '/inventario' },
  { label: 'Préstamos', icon: '', href: '/prestamos' },
  { label: 'Movimientos', icon: '', href: '/movimientos' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`
      flex flex-col bg-gray-900 text-white transition-all duration-300
      ${collapsed ? 'w-16' : 'w-64'}
      min-h-screen shrink-0
    `}>
      {/* Header del sidebar */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
        {!collapsed && (
          <span className="text-lg font-bold text-white truncate">⚙️ Inventario</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
          title="Colapsar menú"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1
                transition-colors duration-150 text-sm font-medium
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
              title={collapsed ? item.label : ''}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-gray-700 px-4 py-4">
        {!collapsed && (
          <p className="text-xs text-gray-500 text-center">v1.0 — Sistema Inventario</p>
        )}
      </div>
    </aside>
  );
}
