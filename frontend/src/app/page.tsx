"use client";
import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoansTable from '../components/ui/LoansTable';
import ActivityFeed from '../components/ui/ActivityFeed';
import type { DashboardCounts, ItemInventario, Persona, Prestamo } from '../lib/types';

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({ prestamos: 0, herramientas: 0, personas: 0, pendientes: 0 });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [p, h, per] = await Promise.all([
          api.get('/prestamos') as Promise<Prestamo[]>,
          api.get('/inventario') as Promise<ItemInventario[]>,
          api.get('/personas') as Promise<Persona[]>,
        ]);
        const pArr = Array.isArray(p) ? p : [];
        const hArr = Array.isArray(h) ? h : [];
        const perArr = Array.isArray(per) ? per : [];
        setCounts({
          prestamos: pArr.length,
          herramientas: hArr.length,
          personas: perArr.length,
          pendientes: pArr.filter((prestamo) => prestamo.estado === 'Pendiente').length,
        });
      } catch (e) { console.error(e); }
    };
    cargar();
  }, []);

  const cards = [
    { label: 'Préstamos activos', value: counts.prestamos, color: 'from-blue-600 to-blue-800', icon: '' },
    { label: 'En inventario', value: counts.herramientas, color: 'from-emerald-600 to-emerald-800', icon: '' },
    { label: 'Personas', value: counts.personas, color: 'from-violet-600 to-violet-800', icon: '' },
    { label: 'Pendientes', value: counts.pendientes, color: 'from-amber-600 to-amber-800', icon: '' },
  ];

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle">Datos en tiempo real para visualizar el estado general del sistema.</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stats-card">
            <p>{c.label}</p>
            <p>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-card lg:col-span-2 p-6">
          <h2 className="mb-5 text-lg font-semibold text-[var(--text-main)]">Últimos préstamos</h2>
          <LoansTable />
        </div>
        <div className="surface-card p-6">
          <h2 className="mb-5 text-lg font-semibold text-[var(--text-main)]">Actividad reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
