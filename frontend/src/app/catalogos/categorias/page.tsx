'use client';
import { useState, useEffect, useCallback } from 'react';
import { categoriasApi } from '../../../lib/api';
import CategoriaForm from '../../../components/catalogos/CategoriaForm';
import type { Categoria, CategoriaPayload } from '../../../lib/types';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [eliminando, setElim] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setCategorias(await categoriasApi.getAll() as Categoria[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: CategoriaPayload) {
    if (editando) await categoriasApi.update(editando.id, form);
    else await categoriasApi.create(form);
    setShowForm(false); setEditando(null);
    cargar();
  }

  async function handleEliminar() {
    if (eliminando) await categoriasApi.delete(eliminando);
    setElim(null); cargar();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorías</h1>
          <p className="text-sm text-gray-400 mt-1">{categorias.length} registros</p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Nueva Categoría
        </button>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg p-6">

            <h2 className="text-lg font-bold text-gray-300 mb-4">
              {editando ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <CategoriaForm
              initialData={editando}
              onSuccess={handleGuardar}
              onCancel={() => { setShowForm(false); setEditando(null); }}
            />
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-gray-800 font-medium">¿Eliminar esta categoría?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleEliminar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {cargando ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay categorías registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {categorias.map((c: Categoria) => (
                <tr key={c.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-white">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-400">{c.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditando(c); setShowForm(true); }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    <button onClick={() => setElim(c.id)}
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
