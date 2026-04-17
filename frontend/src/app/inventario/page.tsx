'use client';
import { useState, useEffect, useCallback } from 'react';
import { inventarioApi } from '../../lib/api';
import InventarioForm from '../../components/catalogos/InventarioForm';
import type { ItemInventario, InventarioPayload } from '../../lib/types';

const BADGE: Record<string, string> = {
  Nuevo:  'bg-green-900 text-green-300',
  Usado:  'bg-yellow-900 text-yellow-300',
  Dañado: 'bg-red-900 text-red-300',
};

export default function InventarioPage() {
  const [items, setItems]         = useState<ItemInventario[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<ItemInventario | null>(null);
  const [eliminando, setElim]     = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setItems(await inventarioApi.getAll() as ItemInventario[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: InventarioPayload) {
    if (editando) await inventarioApi.update(editando.id, form);
    else          await inventarioApi.create(form);
    setShowForm(false); setEditando(null); cargar();
  }

  async function handleEliminar() {
    if (eliminando) await inventarioApi.delete(eliminando);
    setElim(null); cargar();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-sm text-gray-400 mt-1">{items.length} registros</p>
        </div>
        <button onClick={() => { setEditando(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Agregar al inventario
        </button>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4">
              {editando ? 'Editar registro de inventario' : 'Agregar al inventario'}
            </h2>
            <InventarioForm item={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }} />
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-700">
            <p className="text-white font-medium">¿Eliminar este registro?</p>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancelar</button>
              <button onClick={handleEliminar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {cargando ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay registros en el inventario.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Herramienta</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Cantidad</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {items.map((i: ItemInventario) => (
                <tr key={i.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{i.herramienta?.nombre || '—'}</p>
                    <p className="text-xs text-gray-500">{i.herramienta?.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${BADGE[i.estado] || 'bg-gray-700 text-gray-300'}`}>
                      {i.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{i.cantidad}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {i.caja    ? `Caja: ${i.caja?.codigo}`       : ''}
                    {i.estante ? `Estante: ${i.estante?.codigo}` : ''}
                    {!i.caja && !i.estante ? '—' : ''}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditando(i); setShowForm(true); }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    <button onClick={() => setElim(i.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
