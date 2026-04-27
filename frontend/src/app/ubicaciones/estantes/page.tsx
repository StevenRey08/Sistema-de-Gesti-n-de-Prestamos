'use client';
import { useState, useEffect, useCallback } from 'react';
import { estantesApi } from '../../../lib/api';

const EMPTY = { codigo: '', ubicacion: '', descripcion: '' };

export default function EstantesPage() {
  const [estantes, setEstantes]     = useState<any[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editando, setEditando]     = useState<any>(null);
  const [form, setForm]             = useState(EMPTY);
  const [eliminando, setElim]       = useState<any>(null);
  const [guardando, setGuardando]   = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setEstantes(await estantesApi.getAll() as any[]); }
    catch (e: any) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setShowForm(true); }
  function abrirEditar(e: any) {
    setEditando(e);
    setForm({ codigo: e.codigo || '', ubicacion: e.ubicacion || '', descripcion: e.descripcion || '' });
    setShowForm(true);
  }

  async function handleGuardar(e: any) {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      if (editando) await estantesApi.update(editando.id, form);
      else          await estantesApi.create(form);
      setShowForm(false); cargar();
    } catch (err: any) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    try { await estantesApi.delete(eliminando); setElim(null); cargar(); }
    catch (e: any) { setError(e.message); setElim(null); }
  }

  const campo = (name: string, label: string, requerido = false, multilinea = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
        {label}{requerido && <span className="text-red-400 ml-1">*</span>}
      </label>
      {multilinea ? (
        <textarea name={name} value={(form as any)[name]} required={requerido} rows={3}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))} placeholder={label}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm resize-none" />
      ) : (
        <input type="text" name={name} value={(form as any)[name]} required={requerido}
          onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))} placeholder={label}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm" />
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estantes</h1>
          <p className="text-sm text-slate-500 mt-1">{estantes.length} registros</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20">
          + Nuevo Estante
        </button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">{editando ? 'Editar Estante' : 'Nuevo Estante'}</h2>
              <p className="text-slate-500 text-sm mb-8">Ubicación física donde se almacenan las herramientas.</p>
              <form onSubmit={handleGuardar} className="space-y-4">
                {campo('codigo', 'Código', true)}
                {campo('ubicacion', 'Ubicación física')}
                {campo('descripcion', 'Descripción', false, true)}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/50">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={guardando}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95">
                    {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 text-2xl">!</div>
            <div>
              <p className="text-white font-bold text-lg">¿Eliminar estante?</p>
              <p className="text-slate-400 text-sm mt-2">Las cajas asociadas quedarán sin estante.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setElim(null)} className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 transition-all">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827]/50 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? (
          <p className="text-slate-500 text-center py-12">Cargando...</p>
        ) : estantes.length === 0 ? (
          <p className="text-slate-600 text-center py-12 italic">No hay estantes registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Código</th>
                <th className="px-6 py-4 text-left">Ubicación</th>
                <th className="px-6 py-4 text-left">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {estantes.map((e: any) => (
                <tr key={e.id} className="text-slate-300 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400">{e.codigo}</td>
                  <td className="px-6 py-4 text-white font-medium">{e.ubicacion || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{e.descripcion || '—'}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => abrirEditar(e)} className="text-blue-500 hover:text-blue-300 text-xs font-bold uppercase">Editar</button>
                    <button onClick={() => setElim(e.id)}  className="text-red-500 hover:text-red-300 text-xs font-bold uppercase">Eliminar</button>
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
