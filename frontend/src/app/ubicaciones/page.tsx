'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ubicacionesApi } from '../../lib/api';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

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
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('UBICACIONES');
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Ubicacion | null>(null);
  const [form, setForm] = useState(EMPTY_UBICACION);
  const [guardando, setGuardando] = useState(false);
  const [elimId, setElimId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ubicacionesApi.getAll() as Ubicacion[];
      setUbicaciones(data);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar ubicaciones');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

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
    setShowForm(true);
  }

  function validar() {
    const err: Record<string, string> = {};
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio';
    const detalles = Object.values(err);
    if (detalles.length > 0) notify('error', 'Revisa los datos de la ubicación', detalles);
    return detalles.length === 0;
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
      const { message, details } = notifyErrorPayload(e, 'Error al guardar');
      notify('error', message, details);
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
      const { message, details } = notifyErrorPayload(e, 'Error al eliminar');
      notify('error', message, details);
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

        {puedeIngresar && (
          <button onClick={abrirNuevo} className="soft-btn-primary">
            + Nueva Ubicación
          </button>
        )}
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
                    {puedeActualizar && (
                      <button
                        onClick={() => abrirEditar(u)}
                        className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                      >
                        Editar
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        onClick={() => setElimId(u.id)}
                        className="text-xs font-medium text-[var(--danger)] hover:opacity-80"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {editando ? 'Editar ubicación' : 'Nueva ubicación'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
            </div>

            <form onSubmit={guardar} className="space-y-4 px-8 pb-8 pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-muted)]">CÓDIGO (OPCIONAL)</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="soft-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-muted)]">TIPO</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="soft-input"
                  >
                    <option value="ESTANTE">ESTANTE</option>
                    <option value="CAJA">CAJA</option>
                    <option value="ESTUCHE">ESTUCHE</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">NOMBRE *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="soft-input"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">UBICACIÓN PADRE</label>
                <select
                  value={form.ubicacion_padre_id}
                  onChange={(e) => setForm({ ...form, ubicacion_padre_id: e.target.value })}
                  className="soft-select"
                >
                  <option value="">— Sin padre (Ubicación raíz) —</option>
                  {ubicaciones
                    .filter(u => u.id !== editando?.id && (u.tipo === 'CAJA' || u.tipo === 'ESTANTE'))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.codigo} - {u.nombre}</option>
                    ))
                  }
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">DESCRIPCIÓN</label>
                <textarea
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="soft-textarea resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
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
          <div className="modal-panel w-full max-w-sm p-8 text-center">
            <p className="mb-4 text-lg font-bold text-[var(--text-main)]">¿Eliminar ubicación?</p>
            <div className="flex gap-3">
              <button onClick={() => setElimId(null)} className="soft-btn-secondary flex-1">Cancelar</button>
              <button onClick={confirmarEliminar} className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
