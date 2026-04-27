'use client';
import { useState, useEffect, useCallback } from 'react';
import { herramientasApi, categoriasApi, proveedoresApi } from '../../lib/api';

const EMPTY = { codigo: '', nombre: '', categoria_id: '', proveedor_id: '', valor_estimado: '' };

export default function HerramientasPage() {
  const [herramientas, setHerramientas] = useState<any[]>([]);
  const [categorias, setCategorias]     = useState<any[]>([]);
  const [proveedores, setProveedores]   = useState<any[]>([]);
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
      const [h, c, p] = await Promise.all([herramientasApi.getAll(), categoriasApi.getAll(), proveedoresApi.getAll()]);
      setHerramientas(h as any[]); setCategorias(c as any[]); setProveedores(p as any[]);
    } catch (e: any) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setShowForm(true); }
  function abrirEditar(h: any) {
    setEditando(h);
    setForm({ codigo: h.codigo || '', nombre: h.nombre || '', categoria_id: h.categoria_id || '', proveedor_id: h.proveedor_id || '', valor_estimado: h.valor_estimado || '' });
    setShowForm(true);
  }

  async function handleGuardar(e: any) {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      const body = { ...form, categoria_id: form.categoria_id || null, proveedor_id: form.proveedor_id || null, valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null };
      if (editando) await herramientasApi.update(editando.id, body);
      else          await herramientasApi.create(body);
      setShowForm(false); cargar();
    } catch (err: any) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    try { await herramientasApi.delete(eliminando); setElim(null); cargar(); }
    catch (e: any) { setError(e.message); setElim(null); }
  }

  const inp = (key: string, label: string, placeholder: string, required = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type="text" value={form[key]} required={required} placeholder={placeholder}
        onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-slate-600" />
    </div>
  );

  const sel = (key: string, label: string, options: any[], labelKey: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      <select value={form[key]} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm">
        <option value="">— Sin asignar —</option>
        {options.map((o: any) => <option key={o.id} value={o.id}>{o[labelKey]}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Herramientas</h1>
          <p className="text-sm text-slate-500 mt-1">{herramientas.length} registros</p>
        </div>
        <button onClick={abrirNuevo} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95">+ Nueva Herramienta</button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">{editando ? 'Editar Herramienta' : 'Nueva Herramienta'}</h2>
              <p className="text-slate-500 text-sm mb-6">Ficha técnica de la herramienta.</p>
              <form onSubmit={handleGuardar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {inp('codigo', 'Código', 'Ej: TOOL-001', true)}
                  {inp('nombre', 'Nombre', 'Ej: Taladro percutor', true)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {sel('categoria_id', 'Categoría', categorias, 'nombre')}
                  {sel('proveedor_id', 'Proveedor', proveedores, 'nombre_empresa')}
                </div>
                {inp('valor_estimado', 'Valor estimado (RD$)', '0.00')}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={guardando} className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all">
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
            <div><p className="text-white font-bold text-lg">¿Eliminar herramienta?</p><p className="text-slate-400 text-sm mt-2">Esta acción no se puede deshacer.</p></div>
            <div className="flex gap-3">
              <button onClick={() => setElim(null)} className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827]/50 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? <p className="text-slate-500 text-center py-12">Cargando...</p>
        : herramientas.length === 0 ? <p className="text-slate-600 text-center py-12 italic">No hay herramientas registradas.</p>
        : (
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Código</th>
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-left">Categoría</th>
                <th className="px-6 py-4 text-left">Proveedor</th>
                <th className="px-6 py-4 text-left">Valor</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {herramientas.map((h: any) => (
                <tr key={h.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-400">{h.codigo}</td>
                  <td className="px-6 py-4 text-white font-medium">{h.nombre}</td>
                  <td className="px-6 py-4 text-slate-400">{h.categoria?.nombre || categorias.find((c:any)=>c.id===h.categoria_id)?.nombre || '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{h.proveedor?.nombre_empresa || proveedores.find((p:any)=>p.id===h.proveedor_id)?.nombre_empresa || '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{h.valor_estimado ? `RD$ ${parseFloat(h.valor_estimado).toLocaleString('es-DO')}` : '—'}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => abrirEditar(h)} className="text-blue-500 hover:text-blue-300 text-xs font-bold uppercase">Editar</button>
                    <button onClick={() => setElim(h.id)}  className="text-red-500 hover:text-red-300 text-xs font-bold uppercase">Eliminar</button>
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
