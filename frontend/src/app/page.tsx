"use client";
// 1. Importamos los Hooks necesarios
import React, { useState, useEffect } from 'react';
import api from '../lib/api'; // El mensajero
import MetricCard from '../components/ui/MetricCard';
import LoansTable from '../components/ui/LoansTable';
import ActivityFeed from '../components/ui/ActivityFeed';

export default function DashboardPage() {
  // 2. Definimos los "almacenes" para los datos del backend
  const [counts, setCounts] = useState({
    prestamos: 0,
    herramientas: 0,
    personas: 0,
    pendientes: 0
  });

  // 3. Esta función va al backend por los datos
  const cargarEstadisticas = async () => {
    try {
      // Hacemos peticiones reales a las rutas que hicieron tus compas
      const resPrestamos   = await api.get('/prestamos')   as any;
      const resHerramientas = await api.get('/inventario')  as any;
      const resPersonas     = await api.get('/personas')    as any;

      // Guardamos los resultados contando cuántos registros llegaron
      const prestamosData     = Array.isArray(resPrestamos)     ? resPrestamos     : resPrestamos?.data     ?? [];
      const herramientasData  = Array.isArray(resHerramientas)  ? resHerramientas  : resHerramientas?.data  ?? [];
      const personasData      = Array.isArray(resPersonas)      ? resPersonas      : resPersonas?.data      ?? [];
      setCounts({
        prestamos:    prestamosData.length,
        herramientas: herramientasData.length,
        personas:     personasData.length,
        pendientes:   prestamosData.filter((p: any) => p.estado === 'Pendiente').length
      });
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  // 4. El disparador: se ejecuta una sola vez al cargar la página
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  return (
    <div className="flex flex-col gap-8 p-8 bg-gray-50 min-h-screen">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control Real</h1>
        <p className="text-gray-500">Datos conectados a la base de datos SQL.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 5. Ahora pasamos los valores que guardamos en el useState */}
        <MetricCard title="Préstamos Activos" value={counts.prestamos.toString()} trend="En tiempo real" type="primary" />
        <MetricCard title="Herramientas" value={counts.herramientas.toString()} trend="En inventario" type="success" />
        <MetricCard title="Personas" value={counts.personas.toString()} trend="Registradas" type="info" />
        <MetricCard title="Pendientes" value={counts.pendientes.toString()} trend="Urgentes" type="warning" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-6">Últimos Movimientos</h2>
          <LoansTable />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-6">Actividad Reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}