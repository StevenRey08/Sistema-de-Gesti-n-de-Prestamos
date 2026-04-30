'use client';
import { useState, useEffect, useCallback } from 'react';
import { cajasApi, estantesApi } from '../../../lib/api';

/* ─── Tipos ───────────────────────────────────────── */
interface Estante { id: string | number; codigo: string; ubicacion?: string; }
interface Caja    { id: string | number; codigo: string; descripcion?: string; estante_id?: string | number; estante?: Estante; }
const EMPTY = { codigo: '', estante_id: '', descripcion: '' };

/* ─── Componente ──────────────────────────────────── */
export default function CajasPage() {
  const [cajas,     setCajas]     = useState<Caja[]>([]);
  const [estantes,  setEstantes]  = useState<Estante[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editando,  setEditando]  = useState<Caja | null>(null);
  const [form,      setForm]      = useState(EMPTY);
  const [errores,   setErrores]   = useState<Record<string,string>>({});
  const [guardando, setGuardando] = useState(false);
  const [apiErr,    setApiErr]    = useState('');
  const [elimId,    setElimId]    = useState<string | number | null>(null);
  const [busqueda,  setBusqueda]  = useState('');

  /* ── Carga ── */
  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const [c, e] = await Promise.all([cajasApi.getAll(), estantesApi.getAll()]);
      setCajas(c as Caja[]); setEstantes(e as Estante[]);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar datos'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  /* ── Filtro ── */
  const filtradas = cajas.filter(c =>
    `${c.codigo} ${c.descripcion ?? ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  /* ── Helpers ── */
  const nombreEstante = (id?: string | number) => {
    if (!id) return null;
    const e = estantes.find(e => String(e.id) === String(id));
    return e ? `${e.codigo}${e.ubicacion ? ` — ${e.ubicacion}` : ''}` : String(id);
  };

  /* ── Abrir formulario ── */
  function abrirNuevo() {
    setEditando(null); setForm(EMPTY);
    setErrores({}); setApiErr(''); setShowForm(true);
  }
  function abrirEditar(c: Caja) {
    setEditando(c);
    setForm({ codigo: c.codigo, estante_id: c.estante_id ? String(c.estante_id) : '', descripcion: c.descripcion ?? '' });
    setErrores({}); setApiErr(''); setShowForm(true);
  }

  /* ── Validación ── */
  function validar() {
    const err: Record<string,string> = {};
    if (!form.codigo.trim()) err.codigo = 'El código es obligatorio';
    setErrores(err);
    return Object.keys(err).length === 0;
  }

  /* ── Guardar ── */
  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true); setApiErr('');
    const body = {
      codigo:      form.codigo.trim().toUpperCase(),
      estante_id:  form.estante_id ? form.estante_id : null,
      descripcion: form.descripcion.trim() || null,
    };
    try {
      if (editando) await cajasApi.update(editando.id, body);
      else          await cajasApi.create(body);
      setShowForm(false); cargar();
    } catch (err: unknown) {
      setApiErr(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setGuardando(false); }
  }

  /* ── Eliminar ── */
  async function confirmarEliminar() {
    if (elimId === null) return;
    try { await cajasApi.delete(elimId); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
    finally { setElimId(null); }
  }

  /* ══ RENDER ══════════════════════════════════════ */
  return (
    <div className="p-6 space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📦 Cajas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Contenedores físicos dentro de los estantes
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5
            rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/30">
          + Nueva Caja
        </button>
      </div>

      {/* ── Error global ── */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── Buscador + contador ── */}
      <div className="flex items-center gap-3">
        <input
          type="text" placeholder="Buscar por código o descripción..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="flex-1 bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm
            text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500
            focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <span className="text-slate-500 text-sm whitespace-nowrap">
          {filtradas.length} / {cajas.length} registros
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[#111827] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Cargando cajas...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-slate-400 font-medium">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay cajas registradas'}
            </p>
            {!busqueda && <p className="text-slate-600 text-sm mt-1">Crea la primera con el botón de arriba</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Código</th>
                <th className="px-6 py-4 text-left">Estante asignado</th>
                <th className="px-6 py-4 text-left">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtradas.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-900/20
                      border border-cyan-800/40 px-2.5 py-1 rounded-lg text-xs">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.estante_id ? (
                      <span className="text-white text-sm">
                        🗄️ {c.estante?.codigo ?? nombreEstante(c.estante_id)}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">Sin estante</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">
                    {c.descripcion || <span className="text-slate-600 italic">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(c)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors
                          px-3 py-1.5 rounded-lg hover:bg-blue-900/20 border border-transparent
                          hover:border-blue-800/40">
                        Editar
                      </button>
                      <button onClick={() => setElimId(c.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors
                          px-3 py-1.5 rounded-lg hover:bg-red-900/20 border border-transparent
                          hover:border-red-800/40">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ MODAL FORMULARIO ══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editando ? '✏️ Editar Caja' : '📦 Nueva Caja'}
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  {editando ? `Modificando: ${editando.codigo}` : 'Completa los datos de la nueva caja'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-white transition-colors text-xl p-1">✕</button>
            </div>

            <form onSubmit={handleGuardar} className="px-8 pb-8 pt-5 space-y-4">
              {apiErr && (
                <div className="bg-red-900/20 border border-red-700/50 text-red-400 text-sm px-4 py-3 rounded-xl">
                  ⚠️ {apiErr}
                </div>
              )}

              {/* Código */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Código <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={form.codigo} required placeholder="Ej: CAJA-A1-01"
                  onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                  className={`w-full bg-[#0f172a] border rounded-xl px-4 py-3 text-slate-200 text-sm
                    placeholder:text-slate-600 focus:outline-none focus:border-blue-500
                    focus:ring-1 focus:ring-blue-500 transition-all
                    ${errores.codigo ? 'border-red-500 bg-red-950/20' : 'border-slate-700'}`}
                />
                {errores.codigo && <p className="text-xs text-red-400 ml-1">{errores.codigo}</p>}
              </div>

              {/* Estante */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Estante
                </label>
                {estantes.length === 0 ? (
                  <div className="bg-yellow-900/20 border border-yellow-700/40 text-yellow-400
                    text-xs px-4 py-3 rounded-xl">
                    ⚠️ No hay estantes creados. <a href="/ubicaciones/estantes" className="underline font-bold">Crear un estante primero</a>
                  </div>
                ) : (
                  <select
                    value={form.estante_id} onChange={e => setForm(p => ({ ...p, estante_id: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3
                      text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1
                      focus:ring-blue-500 text-sm transition-all">
                    <option value="">— Sin estante asignado —</option>
                    {estantes.map(e => (
                      <option key={e.id} value={e.id}>
                        🗄️ {e.codigo}{e.ubicacion ? ` — ${e.ubicacion}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion} rows={3} placeholder="Detalles adicionales de la caja..."
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3
                    text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold
                    hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95
                    shadow-lg shadow-blue-900/30">
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR ELIMINAR ══ */}
      {elimId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700/60 rounded-2xl shadow-2xl
            p-8 max-w-sm w-full text-center space-y-5">
            <div className="w-16 h-16 bg-red-900/20 border border-red-700/30 rounded-full
              flex items-center justify-center mx-auto text-3xl">
              🗑️
            </div>
            <div>
              <p className="text-white font-bold text-lg">¿Eliminar esta caja?</p>
              <p className="text-slate-400 text-sm mt-2">
                El inventario dentro quedará sin ubicación asignada. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setElimId(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white
                  border border-slate-700 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarEliminar}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white
                  rounded-xl text-sm font-bold transition-all active:scale-95">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
