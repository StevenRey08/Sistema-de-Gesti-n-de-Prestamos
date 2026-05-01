'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Prestamo } from '../../lib/types';

const BADGE: Record<string, string> = {
  Pendiente: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
  Devuelto:  'bg-green-900/40 text-green-400 border border-green-700/50',
};

export default function LoansTable() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    api.get('/prestamos')
      .then((data: Prestamo[] | unknown) => {
        const arr = Array.isArray(data) ? data : [];
        // Mostramos solo los últimos 8
        setPrestamos(arr.slice(0, 8));
      })
      .catch(() => setPrestamos([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="py-6 text-center text-sm text-[var(--text-muted)]">Cargando...</p>;
  if (prestamos.length === 0) return <p className="py-6 text-center text-sm italic text-[var(--text-muted)]">No hay préstamos registrados.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-muted)]">
            <th className="pb-3 text-left font-medium">Persona</th>
            <th className="pb-3 text-left font-medium">Herramienta</th>
            <th className="pb-3 text-left font-medium">Cant.</th>
            <th className="pb-3 text-left font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {prestamos.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-[var(--surface-2)]">
              <td className="py-3 font-medium text-[var(--text-main)]">
                {p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : '—'}
              </td>
              <td className="py-3 text-xs text-[var(--text-muted)]">
                {p.inventario?.herramienta?.nombre || '—'}
              </td>
              <td className="py-3 font-bold text-[var(--accent-strong)]">{p.cantidad}</td>
              <td className="py-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${BADGE[p.estado] || 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>
                  {p.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
