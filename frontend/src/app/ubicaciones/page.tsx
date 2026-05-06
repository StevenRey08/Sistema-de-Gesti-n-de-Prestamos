'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ubicacionesApi } from '../../lib/api';

interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'ESTANTE' | 'CAJA' | 'ESTUCHE' | string;
  descripcion?: string;
  ubicacion_padre_id?: string | null;
  padre?: Ubicacion;
}

const EMPTY_UBICACION = { 
  codigo: '', 
  nombre: '', 
  tipo: 'ESTANTE', 
  descripcion: '', 
  ubicacion_padre_id: '' 
};

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Ubicacion | null>(null);
  const [form, setForm] = useState(EMPTY_UBICACION);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [elimId, setElimId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ubicacionesApi.getAll() as Ubicacion[];
      setUbicaciones(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return ubicaciones;

    return ubicaciones.filter((u) =>
      `${u.codigo} ${u.nombre} ${u.tipo} ${u.descripcion ?? ''}`.toLowerCase().includes(term)
    );
  }, [busqueda, ubicaciones]);

  function abrirNuevo() {
    setEditando(null);
    setForm(EMPTY_UBICACION);
    setErrores({});
    setShowForm(true);
  }

  function abrirEditar(u: Ubicacion) {
    setEditando(u);
    setForm({
      codigo: u.codigo,
      nombre: u.nombre,
      tipo: u.tipo,
      descripcion: u.descripcion ?? '',
      ubicacion_padre_id: u.ubicacion_padre_id ?? '',
    });
    setErrores({});
    setShowForm(true);
  }

  function validar() {
    const err: Record<string, string> = {};
    if (!form.codigo.trim()) err.codigo = 'El código es obligatorio';
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio';
    setErrores(err);
    return Object.keys(err).length === 0;
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    const body = {
      ...form,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      ubicacion_padre_id: form.ubicacion_padre_id || null,
    };

    try {
      if (editando) await ubicacionesApi.update(editando.id, body);
      else await ubicacionesApi.create(body);

      setShowForm(false);
      void cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (elimId === null) return;
    try {
      await ubicacionesApi.delete(elimId);
      void cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setElimId(null);
    }
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Ubicaciones</h1>
          <p className="page-subtitle">
            Administra estantes, cajas y estuches en una estructura unificada.
          </p>
        </div>

        <button onClick={abrirNuevo} className="soft-btn-primary">
          + Nueva Ubicación
        </button>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <input
          type="text"
          placeholder="Buscar por código, nombre o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="soft-input flex-1"
        />
        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
          {filtrados.length} / {ubicaciones.length} registros
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="table-shell mt-6">
        {loading ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando ubicaciones...</p>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay ubicaciones registradas.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Padre</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--accent-strong)]">
                      {u.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{u.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      u.tipo === 'ESTANTE' ? 'bg-blue-100 text-blue-700' : 
                      u.tipo === 'CAJA' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {u.padre ? `${u.padre.codigo} - ${u.padre.nombre}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setElimId(u.id)}
                      className="text-xs font-medium text-[var(--danger)] hover:opacity-80"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <h2 className="text-xl font-bold text-white">
                {editando ? 'Editar ubicación' : 'Nueva ubicación'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={guardar} className="space-y-4 px-8 pb-8 pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">CÓDIGO *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="soft-input !bg-gray-950 border-gray-700"
                  />
                  {errores.codigo && <p className="text-xs text-red-400">{errores.codigo}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400">TIPO</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="soft-input !bg-gray-950 border-gray-700"
                  >
                    <option value="ESTANTE">ESTANTE</option>
                    <option value="CAJA">CAJA</option>
                    <option value="ESTUCHE">ESTUCHE</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400">NOMBRE *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="soft-input !bg-gray-950 border-gray-700"
                />
                {errores.nombre && <p className="text-xs text-red-400">{errores.nombre}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400">UBICACIÓN PADRE</label>
                <select
                  value={form.ubicacion_padre_id}
                  onChange={(e) => setForm({ ...form, ubicacion_padre_id: e.target.value })}
                  className="soft-input !bg-gray-950 border-gray-700"
                >
                  <option value="">— Sin padre (Ubicación raíz) —</option>
                  {ubicaciones
                    .filter(u => u.id !== editando?.id && u.tipo !== 'CAJA' && u.tipo !== 'ESTUCHE')
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400">DESCRIPCIÓN</label>
                <textarea
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="soft-input !bg-gray-950 border-gray-700 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">Cancelar</button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="soft-btn-primary"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {elimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 text-center border border-gray-700">
            <p className="text-lg font-bold text-white mb-4">¿Eliminar ubicación?</p>
            <div className="flex gap-3">
              <button onClick={() => setElimId(null)} className="flex-1 text-gray-400">Cancelar</button>
              <button onClick={confirmarEliminar} className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
