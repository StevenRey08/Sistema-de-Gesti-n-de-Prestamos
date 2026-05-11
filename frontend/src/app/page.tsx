"use client";
import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoansTable from '../components/ui/LoansTable';
import ActivityFeed from '../components/ui/ActivityFeed';
import type { DashboardCounts } from '../lib/types';

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({ 
    articulos: 0, 
    categorias: 0, 
    personas: 0, 
    prestamos_activos: 0, 
    alertas_stock: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get('/dashboard/stats') as { counts: DashboardCounts };
        if (data && data.counts) {
          setCounts(data.counts);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-heading">
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle">Cargando datos...</p>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stats-card animate-pulse">
              <p className="h-4 bg-gray-200 rounded w-24">&nbsp;</p>
              <p className="h-8 bg-gray-200 rounded w-12 mt-2">&nbsp;</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-heading">
          <h1 className="page-title">Panel de control</h1>
          <p className="page-subtitle text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Préstamos activos', value: counts.prestamos_activos, color: 'from-blue-600 to-blue-800', icon: '' },
    { label: 'En inventario', value: counts.articulos, color: 'from-emerald-600 to-emerald-800', icon: '' },
    { label: 'Personas', value: counts.personas, color: 'from-violet-600 to-violet-800', icon: '' },
    { label: 'Alertas de stock', value: counts.alertas_stock, color: 'from-amber-600 to-amber-800', icon: '' },
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
