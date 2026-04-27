'use client';
import { useState, useEffect, useCallback } from 'react';
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Movimientos</h1>
          <p className="text-sm text-gray-400 mt-1">Historial completo — {movimientos.length} registros</p>
        </div>
        <button onClick={cargar}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          ↻ Actualizar
        </button>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 flex-wrap">
        {tipos.map(t => (
          <button key={t} onClick={() => setFiltro(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filtro === t ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {t === 'todos' ? 'Todos' : t}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {cargando ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay movimientos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
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
            <tbody className="divide-y divide-gray-700">
              {lista.map((m: Movimiento) => (
                <tr key={m.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[m.tipo] || 'bg-gray-700 text-gray-300'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {m.inventario?.herramienta?.nombre || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {m.persona ? `${m.persona.nombres} ${m.persona.apellidos}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold">{m.cantidad}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {m.caja_origen?.codigo || m.estante_origen?.codigo || '—'}
                    {' → '}
                    {m.caja_destino?.codigo || m.estante_destino?.codigo || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmt(m.fecha)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
