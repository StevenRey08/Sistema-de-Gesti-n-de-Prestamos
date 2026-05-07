'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { movimientosApi } from '../../lib/api';
import type { Movimiento } from '../../lib/types';

const BADGE: Record<string, string> = {
  ENTRADA:  'bg-green-900 text-green-300',
  SALIDA:   'bg-red-900 text-red-300',
  TRASLADO: 'bg-blue-900 text-blue-300',
  PRESTAMO: 'bg-yellow-900 text-yellow-300',
};

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtro, setFiltro]           = useState('todos');
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setMovimientos(await movimientosApi.getAll() as Movimiento[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const tipos = ['todos', 'ENTRADA', 'SALIDA', 'TRASLADO', 'PRESTAMO'];

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

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

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
                <th className="px-4 py-3 text-left">Origen → Destino</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m: Movimiento) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[m.tipo] || 'bg-gray-700 text-gray-300'}`}>
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
