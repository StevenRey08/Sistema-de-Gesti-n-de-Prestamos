'use client';
import { useState, useEffect, useCallback } from 'react';
import { estantesApi } from '../../../lib/api';

/* ─── Tipos ───────────────────────────────────────── */
interface Estante {
  id: string | number;
  codigo: string;
  ubicacion?: string;
  descripcion?: string;
}
const EMPTY = { codigo: '', ubicacion: '', descripcion: '' };

/* ─── Componente ──────────────────────────────────── */
export default function EstantesPage() {
  const [estantes,  setEstantes]  = useState<Estante[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editando,  setEditando]  = useState<Estante | null>(null);
  const [form,      setForm]      = useState(EMPTY);
  const [errores,   setErrores]   = useState<Record<string,string>>({});
  const [guardando, setGuardando] = useState(false);
  const [apiErr,    setApiErr]    = useState('');
  const [elimId,    setElimId]    = useState<string | number | null>(null);
  const [busqueda,  setBusqueda]  = useState('');

  /* ── Carga ── */
  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setEstantes(await estantesApi.getAll() as Estante[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al cargar estantes'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  /* ── Filtro ── */
  const filtrados = estantes.filter(e =>
    `${e.codigo} ${e.ubicacion ?? ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  /* ── Abrir formulario ── */
  function abrirNuevo() {
    setEditando(null); setForm(EMPTY);
    setErrores({}); setApiErr(''); setShowForm(true);
  }
  function abrirEditar(e: Estante) {
    setEditando(e);
    setForm({ codigo: e.codigo, ubicacion: e.ubicacion ?? '', descripcion: e.descripcion ?? '' });
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
      ubicacion:   form.ubicacion.trim()   || null,
      descripcion: form.descripcion.trim() || null,
    };
    try {
      if (editando) await estantesApi.update(editando.id, body);
      else          await estantesApi.create(body);
      setShowForm(false);
      cargar();
    } catch (err: unknown) {
      setApiErr(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setGuardando(false); }
  }

  /* ── Eliminar ── */
  async function confirmarEliminar() {
    if (elimId === null) return;
    try { await estantesApi.delete(elimId); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar'); }
    finally { setElimId(null); }
  }

  /* ── Campo helper ── */
  const inp = (key: keyof typeof EMPTY, label: string, placeholder: string, required = false, textarea = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={form[key]} rows={3} placeholder={placeholder}
          onChange={ev => setForm(p => ({ ...p, [key]: ev.target.value }))}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-slate-200
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            text-sm placeholder:text-slate-600 resize-none transition-all"
        />
      ) : (
        <input
          type="text" value={form[key]} required={required} placeholder={placeholder}
          onChange={ev => setForm(p => ({ ...p, [key]: ev.target.value }))}
          className={`w-full bg-[#0f172a] border rounded-xl px-4 py-3 text-slate-200
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            text-sm placeholder:text-slate-600 transition-all
            ${errores[key] ? 'border-red-500 bg-red-950/20' : 'border-slate-700'}`}
        />
      )}
      {errores[key] && <p className="text-xs text-red-400 ml-1">{errores[key]}</p>}
    </div>
  );

  /* ══ RENDER ══════════════════════════════════════ */
  return (
    <div className="p-6 space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🗄️ Estantes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ubicaciones físicas donde se almacenan las herramientas
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5
            rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/30">
          + Nuevo Estante
        </button>
      </div>

      {/* ── Error global ── */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* ── Buscador + contador ── */}
      <div className="flex items-center gap-3">
        <input
          type="text" placeholder="Buscar por código o ubicación..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="flex-1 bg-[#111827] border border-slate-700 rounded-xl px-4 py-2.5 text-sm
            text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500
            focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <span className="text-slate-500 text-sm whitespace-nowrap">
          {filtrados.length} / {estantes.length} registros
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[#111827] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Cargando estantes...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🗄️</p>
            <p className="text-slate-400 font-medium">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay estantes registrados'}
            </p>
            {!busqueda && (
              <p className="text-slate-600 text-sm mt-1">Crea el primero con el botón de arriba</p>
            )}
          </div>
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
            <tbody className="divide-y divide-slate-800/60">
              {filtrados.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-400 bg-blue-900/20
                      border border-blue-800/40 px-2.5 py-1 rounded-lg text-xs">
                      {e.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{e.ubicacion || <span className="text-slate-600 italic">—</span>}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">{e.descripcion || <span className="text-slate-600 italic">—</span>}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(e)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors
                          px-3 py-1.5 rounded-lg hover:bg-blue-900/20 border border-transparent
                          hover:border-blue-800/40">
                        Editar
                      </button>
                      <button onClick={() => setElimId(e.id)}
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

            {/* Cabecera modal */}
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editando ? '✏️ Editar Estante' : '🗄️ Nuevo Estante'}
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  {editando ? `Modificando: ${editando.codigo}` : 'Completa los datos del nuevo estante'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)}
                className="text-slate-500 hover:text-white transition-colors text-xl p-1">✕</button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="px-8 pb-8 pt-5 space-y-4">
              {apiErr && (
                <div className="bg-red-900/20 border border-red-700/50 text-red-400
                  text-sm px-4 py-3 rounded-xl">
                  ⚠️ {apiErr}
                </div>
              )}

              {inp('codigo',      'Código',      'Ej: EST-A1',              true)}
              {inp('ubicacion',   'Ubicación',   'Ej: Depósito planta baja'      )}
              {inp('descripcion', 'Descripción', 'Detalles adicionales...', false, true)}

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
              <p className="text-white font-bold text-lg">¿Eliminar este estante?</p>
              <p className="text-slate-400 text-sm mt-2">
                Las cajas asociadas quedarán sin estante asignado. Esta acción no se puede deshacer.
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
