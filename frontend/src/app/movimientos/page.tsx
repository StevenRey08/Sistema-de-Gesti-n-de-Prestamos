'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { movimientosApi } from '../../lib/api';
import type { Movimiento } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

const BADGE: Record<string, string> = {
  ENTRADA:  'bg-[var(--surface-2)] text-emerald-500',
  SALIDA:   'bg-[var(--surface-2)] text-red-500',
  TRASLADO: 'bg-[var(--surface-2)] text-orange-500',
  PRESTAMO: 'bg-[var(--surface-2)] text-amber-500',
  DEVUELTO: 'bg-[var(--surface-2)] text-sky-500',
  AJUSTE:   'bg-[var(--surface-2)] text-purple-500',
};

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function MovimientosPage() {
  const { notify } = useNotification();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtro, setFiltro]           = useState('todos');
  const [cargando, setCargando]       = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setMovimientos(await movimientosApi.getAll() as Movimiento[]); }
    catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar movimientos');
      notify('error', message, details);
    }
    finally { setCargando(false); }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  const tipos = ['todos', 'ENTRADA', 'SALIDA', 'TRASLADO', 'PRESTAMO', 'DEVUELTO', 'AJUSTE'];

  const lista = filtro === 'todos' ? movimientos
    : movimientos.filter((m: Movimiento) => m.tipo === filtro);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle">Historial completo — {movimientos.length} registros</p>
        </div>
        <button onClick={cargar}
          className="soft-btn-secondary">
          ↻ Actualizar
        </button>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 flex-wrap">
        {tipos.map(t => (
          <button key={t} onClick={() => setFiltro(t)}
            className={`filter-pill ${filtro === t ? 'active' : ''}`}>
            {t === 'todos' ? 'Todos' : t}
          </button>
        ))}
      </div>

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay movimientos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Herramienta</th>
                <th className="px-4 py-3 text-left">Persona</th>
                <th className="px-4 py-3 text-left">Cant.</th>
                <th className="px-4 py-3 text-left">Origen â†’ Destino</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m: Movimiento) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${BADGE[m.tipo] || 'bg-gray-700 text-gray-300'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                    {m.inventario?.nombre || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-main)]">
                    {m.persona ? `${m.persona.nombres} ${m.persona.apellidos}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--accent-strong)]">{m.cantidad}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {m.ubicacion_origen?.codigo || '—'}
                    {' → '}
                    {m.ubicacion_destino?.codigo || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{fmt(m.fecha)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{m.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
