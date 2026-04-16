'use client';
import { useState, useEffect, useCallback } from 'react';
import { proveedoresApi } from '../../../lib/api';

const EMPTY = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' };

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [eliminando, setElim] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setProveedores(await proveedoresApi.getAll() as any[]); }
    catch (e: any) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo() { setEditando(null); setForm(EMPTY); setShowForm(true); }
  function abrirEditar(p: any) { setEditando(p); setForm({ ...p }); setShowForm(true); }

  async function handleGuardar(e: any) {
    e.preventDefault(); setGuardando(true);
    try {
      if (editando) await proveedoresApi.update(editando.id, form);
      else await proveedoresApi.create(form);
      setShowForm(false); cargar();
    } catch (err: any) { setError(err.message); }
    finally { setGuardando(false); }
  }

  async function handleEliminar() {
    await proveedoresApi.delete(eliminando);
    setElim(null); cargar();
  }

  // Helper para renderizar los campos con estilo oscuro
  const campo = (name: string, label: string, tipo = 'text') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      <input
        type={tipo}
        name={name}
        value={(form as any)[name]}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        placeholder={label}
        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm"
      />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">{proveedores.length} registros</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20">
          Nuevo Proveedor
        </button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}

      {/* MODAL FORMULARIO (Editado para Dark Mode) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">
                {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <p className="text-slate-500 text-sm mb-8 italic">Completa la información del proveedor.</p>

              <form onSubmit={handleGuardar} className="space-y-5">
                {campo('nombre', 'Nombre ')}
                {campo('contacto', 'Persona de Contacto')}
                <div className="grid grid-cols-2 gap-4">
                  {campo('telefono', 'Teléfono')}
                  {campo('email', 'Email', 'email')}
                </div>
                {campo('direccion', 'Dirección')}

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-800/50">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                    {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR (Editado para Dark Mode) */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <span className="text-2xl">!</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">¿Eliminar proveedor?</p>
              <p className="text-slate-400 text-sm mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 transition-all active:scale-95">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de registros */}
      <div className="bg-[#111827]/50 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        {cargando ? (
          <p className="text-slate-500 text-center py-12">Cargando...</p>
        ) : proveedores.length === 0 ? (
          <p className="text-slate-600 text-center py-12 italic">No hay proveedores registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Nombre</th>
                <th className="px-6 py-4 text-left font-semibold">Contacto</th>
                <th className="px-6 py-4 text-left font-semibold">Teléfono</th>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {proveedores.map((p: any) => (
                <tr key={p.id} className="text-slate-300 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-bold text-white group-hover:text-blue-400 transition-colors">{p.nombre}</td>
                  <td className="px-6 py-4 text-slate-400">{p.contacto || '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.telefono || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 italic">{p.email || '—'}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => abrirEditar(p)}
                      className="text-blue-500 hover:text-blue-300 text-xs font-bold uppercase tracking-tighter transition-colors">Editar</button>
                    <button onClick={() => setElim(p.id)}
                      className="text-red-500 hover:text-red-300 text-xs font-bold uppercase tracking-tighter transition-colors">Eliminar</button>
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