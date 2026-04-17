'use client';
import { useState, useEffect, useCallback } from 'react';
import { estantesApi } from '../../lib/api';

interface Estante { id: number; codigo: string; ubicacion?: string; descripcion?: string; }
interface FormState { codigo: string; ubicacion: string; descripcion: string; }
const EMPTY: FormState = { codigo: '', ubicacion: '', descripcion: '' };

export default function EstantesPage() {
  const [estantes, setEstantes]   = useState<Estante[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Estante | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [errForm, setErrForm]     = useState<Partial<FormState>>({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setElim]     = useState<number | null>(null);
  const [apiError, setApiError]   = useState('');

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setEstantes(await estantesApi.getAll() as Estante[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setErrForm({}); setApiError(''); setShowForm(true); }
  function abrirEditar(e: Estante) {
    setEditando(e);
    setForm({ codigo: e.codigo, ubicacion: e.ubicacion || '', descripcion: e.descripcion || '' });
    setErrForm({}); setApiError(''); setShowForm(true);
  }

  function validar() {
    const e: Partial<FormState> = {};
    if (!form.codigo.trim()) e.codigo = 'Obligatorio';
    setErrForm(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;
    setGuardando(true); setApiError('');
    const body = { codigo: form.codigo.trim(), ubicacion: form.ubicacion.trim() || undefined, descripcion: form.descripcion.trim() || undefined };
    try {
      if (editando) await estantesApi.update(editando.id, body);
      else          await estantesApi.create(body);
      setShowForm(false); cargar();
    } catch (err: unknown) { setApiError(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    try { await estantesApi.delete(eliminando); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al eliminar'); }
    setElim(null); cargar();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estantes</h1>
          <p className="text-sm text-gray-400 mt-1">{estantes.length} registros</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo Estante
        </button>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-5">{editando ? 'Editar Estante' : 'Nuevo Estante'}</h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              {apiError && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">{apiError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Código *</label>
                  <input value={form.codigo} onChange={e => setForm(p => ({...p, codigo: e.target.value}))}
                    placeholder="Ej: EST-A1"
                    className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errForm.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                  {errForm.codigo && <p className="text-xs text-red-400 mt-1">{errForm.codigo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ubicación</label>
                  <input value={form.ubicacion} onChange={e => setForm(p => ({...p, ubicacion: e.target.value}))}
                    placeholder="Ej: Depósito Planta Baja"
                    className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
                  rows={2} placeholder="Descripción opcional..."
                  className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancelar</button>
                <button type="submit" disabled={guardando}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear estante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-700">
            <p className="text-white font-medium">¿Eliminar este estante?</p>
            <p className="text-sm text-gray-400">Las cajas dentro quedarán sin estante asignado.</p>
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
        ) : estantes.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay estantes registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {estantes.map((e: Estante) => (
                <tr key={e.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-yellow-400">{e.codigo}</td>
                  <td className="px-4 py-3 text-white">{e.ubicacion || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{e.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => abrirEditar(e)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    <button onClick={() => setElim(e.id)}
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
