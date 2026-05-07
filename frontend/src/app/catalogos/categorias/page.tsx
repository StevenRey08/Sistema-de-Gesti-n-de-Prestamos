'use client';
import { useState, useEffect, useCallback } from 'react';
import { categoriasApi } from '../../../lib/api';
import CategoriaForm from '../../../components/catalogos/CategoriaForm';
import type { Categoria, CategoriaPayload } from '../../../lib/types';

import { useNotification } from '../../../components/ui/NotificationContext';

export default function CategoriasPage() {
  const { notify } = useNotification();
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
    try {
      if (editando) {
        await categoriasApi.update(editando.id, form);
        notify('success', 'Categoría actualizada con éxito');
      } else {
        await categoriasApi.create(form);
        notify('success', 'Categoría creada con éxito');
      }
      setShowForm(false); setEditando(null);
      cargar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      const details = (e as any).details || [];
      notify('error', msg, details);
    }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    try {
      await categoriasApi.delete(eliminando);
      notify('success', 'Categoría eliminada');
      setElim(null); cargar();
    } catch (e: unknown) {
      notify('error', 'Error al eliminar');
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">{categorias.length} registros</p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowForm(true); }}
          className="soft-btn-primary"
        >
          Nueva Categoría
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-lg p-6">

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

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay categorías registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((c: Categoria) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{c.nombre}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{c.descripcion || '—'}</td>
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
