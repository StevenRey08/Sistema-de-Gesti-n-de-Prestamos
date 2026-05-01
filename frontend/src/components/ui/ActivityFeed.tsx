'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Movimiento } from '../../lib/types';

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

const TIPO_COLOR: Record<string, string> = {
  ENTRADA:  'bg-emerald-500',
  SALIDA:   'bg-red-500',
  PRESTAMO: 'bg-blue-500',
  TRASLADO: 'bg-violet-500',
};

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:  'Entrada',
  SALIDA:   'Salida',
  PRESTAMO: 'Préstamo',
  TRASLADO: 'Traslado',
};

export default function ActivityFeed() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando]       = useState(true);

  useEffect(() => {
    api.get('/movimientos')
      .then((data: Movimiento[] | unknown) => {
        const arr = Array.isArray(data) ? data : [];
        // Últimos 6, más recientes primero
        setMovimientos(arr.slice(0, 6));
      })
      .catch(() => setMovimientos([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="py-6 text-center text-sm text-[var(--text-muted)]">Cargando...</p>;
  if (movimientos.length === 0) return <p className="py-6 text-center text-sm italic text-[var(--text-muted)]">Sin actividad reciente.</p>;

  return (
    <div className="space-y-4">
      {movimientos.map((m) => (
        <div key={m.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${TIPO_COLOR[m.tipo] || 'bg-slate-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-main)]">{TIPO_LABEL[m.tipo] || m.tipo}</span>
              {' — '}
              {m.inventario?.herramienta?.nombre || 'Herramienta'}
              {m.persona ? ` · ${m.persona.nombres}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{tiempoRelativo(m.fecha)}</p>
          </div>
          <span className="shrink-0 text-xs font-bold text-[var(--accent-strong)]">×{m.cantidad}</span>
        </div>
      ))}
    </div>
  );
}
