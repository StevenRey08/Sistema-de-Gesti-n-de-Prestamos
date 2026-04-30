'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const BADGE: Record<string, string> = {
  Pendiente: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50',
  Devuelto:  'bg-green-900/40 text-green-400 border border-green-700/50',
};

export default function LoansTable() {
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    api.get('/prestamos')
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : [];
        // Mostramos solo los últimos 8
        setPrestamos(arr.slice(0, 8));
      })
      .catch(() => setPrestamos([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-slate-500 text-sm text-center py-6">Cargando...</p>;
  if (prestamos.length === 0) return <p className="text-slate-600 text-sm text-center py-6 italic">No hay préstamos registrados.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
            <th className="pb-3 text-left font-medium">Persona</th>
            <th className="pb-3 text-left font-medium">Herramienta</th>
            <th className="pb-3 text-left font-medium">Cant.</th>
            <th className="pb-3 text-left font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {prestamos.map((p: any) => (
            <tr key={p.id} className="hover:bg-white/5 transition-colors">
              <td className="py-3 text-slate-300 font-medium">
                {p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : '—'}
              </td>
              <td className="py-3 text-slate-400 text-xs">
                {p.inventario?.herramienta?.nombre || '—'}
              </td>
              <td className="py-3 text-white font-bold">{p.cantidad}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${BADGE[p.estado] || 'bg-slate-800 text-slate-400'}`}>
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
