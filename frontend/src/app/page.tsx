"use client";
import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoansTable from '../components/ui/LoansTable';
import ActivityFeed from '../components/ui/ActivityFeed';

export default function DashboardPage() {
  const [counts, setCounts] = useState({ prestamos: 0, herramientas: 0, personas: 0, pendientes: 0 });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [p, h, per] = await Promise.all([
          api.get('/prestamos') as Promise<any[]>,
          api.get('/inventario') as Promise<any[]>,
          api.get('/personas') as Promise<any[]>,
        ]);
        const pArr = Array.isArray(p) ? p : [];
        const hArr = Array.isArray(h) ? h : [];
        const perArr = Array.isArray(per) ? per : [];
        setCounts({
          prestamos: pArr.length,
          herramientas: hArr.length,
          personas: perArr.length,
          pendientes: pArr.filter((x: any) => x.estado === 'Pendiente').length,
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
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
        <p className="text-sm text-slate-400 mt-1">Datos en tiempo real desde la base de datos</p>
      </div>

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 shadow-xl`}>
            <div className="text-3xl mb-3">{c.icon}</div>
            <p className="text-4xl font-black text-white">{c.value}</p>
            <p className="text-sm text-white/70 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-slate-800 shadow-xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Últimos Préstamos</h2>
          <LoansTable />
        </div>
        <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Actividad Reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
