'use client';
import { useState, useEffect, useCallback } from 'react';
import { inventarioApi, herramientasApi, estantesApi, cajasApi } from '../../lib/api';

const ESTADOS = ['Nuevo', 'Usado', 'Dañado'];
const BADGE: Record<string, string> = { Nuevo: 'bg-green-900/40 text-green-400 border-green-700/50', Usado: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50', Dañado: 'bg-red-900/40 text-red-400 border-red-700/50' };
const EMPTY = { herramienta_id: '', estado: 'Nuevo', cantidad: 1, ubicacion_tipo: 'estante', estante_id: '', caja_id: '' };

export default function InventarioPage() {
  const [items, setItems]               = useState<any[]>([]);
  const [herramientas, setHerramientas] = useState<any[]>([]);
  const [estantes, setEstantes]         = useState<any[]>([]);
  const [cajas, setCajas]               = useState<any[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editando, setEditando]         = useState<any>(null);
  const [form, setForm]                 = useState<any>(EMPTY);
  const [eliminando, setElim]           = useState<any>(null);
  const [guardando, setGuardando]       = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [inv, h, e, c] = await Promise.all([inventarioApi.getAll(), herramientasApi.getAll(), estantesApi.getAll(), cajasApi.getAll()]);
      setItems(inv as any[]); setHerramientas(h as any[]); setEstantes(e as any[]); setCajas(c as any[]);
    } catch (e: any) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setShowForm(true); }
  function abrirEditar(i: any) {
    setEditando(i);
    setForm({ herramienta_id: i.herramienta_id || '', estado: i.estado || 'Nuevo', cantidad: i.cantidad || 1,
      ubicacion_tipo: i.caja_id ? 'caja' : 'estante', estante_id: i.estante_id || '', caja_id: i.caja_id || '' });
    setShowForm(true);
  }

  async function handleGuardar(e: any) {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      const body = { herramienta_id: form.herramienta_id, estado: form.estado, cantidad: parseInt(form.cantidad),
        estante_id: form.ubicacion_tipo === 'estante' ? form.estante_id || null : null,
        caja_id:    form.ubicacion_tipo === 'caja'    ? form.caja_id    || null : null };
      if (editando) await inventarioApi.update(editando.id, body);
      else          await inventarioApi.create(body);
      setShowForm(false); cargar();
    } catch (err: any) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    try { await inventarioApi.delete(eliminando); setElim(null); cargar(); }
    catch (e: any) { setError(e.message); setElim(null); }
  }

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} registros</p>
        </div>
        <button onClick={abrirNuevo} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95">+ Agregar al inventario</button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">{editando ? 'Editar registro' : 'Agregar al inventario'}</h2>
              <p className="text-slate-500 text-sm mb-6">Asigna herramienta, cantidad, estado y ubicación.</p>
              <form onSubmit={handleGuardar} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Herramienta <span className="text-red-400">*</span></label>
                  <select required value={form.herramienta_id} onChange={e => set('herramienta_id', e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm">
                    <option value="">— Seleccionar herramienta —</option>
                    {herramientas.map((h: any) => <option key={h.id} value={h.id}>{h.codigo} — {h.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Estado</label>
                    <select value={form.estado} onChange={e => set('estado', e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm">
                      {ESTADOS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Cantidad <span className="text-red-400">*</span></label>
                    <input type="number" min={1} required value={form.cantidad} onChange={e => set('cantidad', e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Ubicación</label>
                  <div className="flex gap-4 mb-1">
                    {['estante','caja'].map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input type="radio" value={t} checked={form.ubicacion_tipo===t} onChange={()=>set('ubicacion_tipo',t)} className="accent-blue-500"/>
                        <span className="capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                  {form.ubicacion_tipo === 'estante' ? (
                    <select value={form.estante_id} onChange={e => set('estante_id', e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm">
                      <option value="">— Sin estante —</option>
                      {estantes.map((e: any) => <option key={e.id} value={e.id}>{e.codigo} — {e.ubicacion || ''}</option>)}
                    </select>
                  ) : (
                    <select value={form.caja_id} onChange={e => set('caja_id', e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm">
                      <option value="">— Sin caja —</option>
                      {cajas.map((c: any) => <option key={c.id} value={c.id}>{c.codigo}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
                  <button type="submit" disabled={guardando} className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all">
                    {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar'}
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
            <div><p className="text-white font-bold text-lg">¿Eliminar registro?</p><p className="text-slate-400 text-sm mt-2">Esta acción no se puede deshacer.</p></div>
            <div className="flex gap-3">
              <button onClick={() => setElim(null)} className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827]/50 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? <p className="text-slate-500 text-center py-12">Cargando...</p>
        : items.length === 0 ? <p className="text-slate-600 text-center py-12 italic">No hay registros en el inventario.</p>
        : (
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Herramienta</th>
                <th className="px-6 py-4 text-left">Estado</th>
                <th className="px-6 py-4 text-left">Cantidad</th>
                <th className="px-6 py-4 text-left">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map((i: any) => {
                const h = herramientas.find((x: any) => x.id === i.herramienta_id);
                const ub = i.caja_id ? `Caja: ${cajas.find((c:any)=>c.id===i.caja_id)?.codigo||i.caja_id}`
                         : i.estante_id ? `Estante: ${estantes.find((e:any)=>e.id===i.estante_id)?.codigo||i.estante_id}` : '—';
                return (
                  <tr key={i.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4"><p className="text-white font-medium">{i.herramienta?.nombre || h?.nombre || '—'}</p><p className="text-xs text-slate-500">{i.herramienta?.codigo || h?.codigo}</p></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${BADGE[i.estado]||'bg-slate-800 text-slate-400 border-slate-700'}`}>{i.estado}</span></td>
                    <td className="px-6 py-4 font-bold text-white text-lg">{i.cantidad}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{ub}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => abrirEditar(i)} className="text-blue-500 hover:text-blue-300 text-xs font-bold uppercase">Editar</button>
                      <button onClick={() => setElim(i.id)}  className="text-red-500 hover:text-red-300 text-xs font-bold uppercase">Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
