'use client';
import { useState, useEffect, useCallback } from 'react';
import { cajasApi, estantesApi } from '../../lib/api';

interface Estante { id: number; codigo: string; ubicacion?: string; }
interface Caja { id: number; codigo: string; descripcion?: string; estante_id?: number; estante?: Estante; }
interface FormState { codigo: string; estante_id: string; descripcion: string; }
const EMPTY: FormState = { codigo: '', estante_id: '', descripcion: '' };

export default function CajasPage() {
  const [cajas, setCajas]         = useState<Caja[]>([]);
  const [estantes, setEstantes]   = useState<Estante[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Caja | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [errForm, setErrForm]     = useState<Partial<FormState>>({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setElim]     = useState<number | null>(null);
  const [apiError, setApiError]   = useState('');

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [c, e] = await Promise.all([cajasApi.getAll() as Promise<Caja[]>, estantesApi.getAll() as Promise<Estante[]>]);
      setCajas(c); setEstantes(e);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setErrForm({}); setApiError(''); setShowForm(true); }
  function abrirEditar(c: Caja) {
    setEditando(c);
    setForm({ codigo: c.codigo, estante_id: c.estante_id ? String(c.estante_id) : '', descripcion: c.descripcion || '' });
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
    const body = {
      codigo: form.codigo.trim(),
      estante_id: form.estante_id ? Number(form.estante_id) : null,
      descripcion: form.descripcion.trim() || undefined,
    };
    try {
      if (editando) await cajasApi.update(editando.id, body);
      else          await cajasApi.create(body);
      setShowForm(false); cargar();
    } catch (err: unknown) { setApiError(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    try { await cajasApi.delete(eliminando); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al eliminar'); }
    setElim(null); cargar();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cajas</h1>
          <p className="text-sm text-gray-400 mt-1">{cajas.length} registros</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nueva Caja
        </button>
      </div>

      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-5">{editando ? 'Editar Caja' : 'Nueva Caja'}</h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              {apiError && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">{apiError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Código *</label>
                  <input value={form.codigo} onChange={e => setForm(p => ({...p, codigo: e.target.value}))}
                    placeholder="Ej: CAJA-A1-01"
                    className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500 ${errForm.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                  {errForm.codigo && <p className="text-xs text-red-400 mt-1">{errForm.codigo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estante</label>
                  <select value={form.estante_id} onChange={e => setForm(p => ({...p, estante_id: e.target.value}))}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Sin estante —</option>
                    {estantes.map(e => <option key={e.id} value={e.id}>{e.codigo}{e.ubicacion ? ` — ${e.ubicacion}` : ''}</option>)}
                  </select>
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
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-700">
            <p className="text-white font-medium">¿Eliminar esta caja?</p>
            <p className="text-sm text-gray-400">El inventario dentro quedará sin ubicación asignada.</p>
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
        ) : cajas.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay cajas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Estante</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {cajas.map((c: Caja) => (
                <tr key={c.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">{c.codigo}</td>
                  <td className="px-4 py-3 text-white">{c.estante?.codigo || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => abrirEditar(c)}
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
