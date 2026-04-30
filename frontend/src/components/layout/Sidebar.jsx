'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { label: 'Dashboard',   icon: '📊', href: '/' },
  { divider: 'Catálogos' },
  { label: 'Personas',    icon: '👥', href: '/catalogos/personas' },
  { label: 'Proveedores', icon: '🏭', href: '/catalogos/proveedores' },
  { label: 'Categorías',  icon: '🏷️', href: '/catalogos/categorias' },
  { divider: 'Almacén' },
  { label: 'Estantes',    icon: '🗄️', href: '/ubicaciones/estantes' },
  { label: 'Cajas',       icon: '📦', href: '/ubicaciones/cajas' },
  { label: 'Herramientas',icon: '🔧', href: '/herramientas' },
  { label: 'Inventario',  icon: '🗃️', href: '/inventario' },
  { divider: 'Operaciones' },
  { label: 'Préstamos',   icon: '📋', href: '/prestamos' },
  { label: 'Movimientos', icon: '🔄', href: '/movimientos' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col bg-[#0f172a] text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen shrink-0 border-r border-slate-800`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
        {!collapsed && <span className="text-base font-bold text-white truncate">⚙️ GestAlmacén</span>}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-colors ml-auto text-lg"
          title="Colapsar menú">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {menuItems.map((item: any, idx) => {
          if (item.divider) {
            return !collapsed ? (
              <p key={idx} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-5 pt-5 pb-1">
                {item.divider}
              </p>
            ) : <div key={idx} className="my-2 mx-3 border-t border-slate-800" />;
          }
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-colors text-sm font-medium
                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              title={collapsed ? item.label : ''}>
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-slate-800 px-5 py-4">
          <p className="text-[10px] text-slate-600 text-center">Sistema de Gestión v1.0</p>
        </div>
      )}
    </aside>
  );
}
