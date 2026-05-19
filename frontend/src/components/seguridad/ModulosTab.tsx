'use client';

import { useCallback, useEffect, useState } from 'react';
import { modulosApi } from '../../lib/api';
import type { Modulo, ModuloPayload } from '../../lib/types';
import { useNotification } from '../ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

export default function ModulosTab() {
  const { notify } = useNotification();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Modulo | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ModuloPayload>({ nombre: '', descripcion: '', ruta: '', icono: '', orden: 0 });
  const [guardando, setGuardando] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await modulosApi.getAll() as Modulo[];
      setModulos(data);
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar los módulos.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = modulos.filter(m =>
    `${m.nombre} ${m.descripcion ?? ''} ${m.ruta ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      notify('error', 'Error', ['El nombre del módulo es obligatorio']);
      return;
    }
    setGuardando(true);
    try {
      if (editing) {
        await modulosApi.update(editing.id, form);
      } else {
        await modulosApi.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ nombre: '', descripcion: '', ruta: '', icono: '', orden: 0 });
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al guardar módulo');
      notify('error', message, details);
    } finally {
      setGuardando(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await modulosApi.delete(id);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al eliminar módulo');
      notify('error', message, details);
    }
  }

  async function handleSeed() {
    try {
      const res = await modulosApi.create({ nombre: 'SEED', ruta: '/seed' }) as { message: string };
      await loadData();
      notify('success', res.message || 'Módulos por defecto creados');
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al crear módulos por defecto');
      notify('error', message, details);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar módulo..." className="soft-input max-w-sm" />
        <div className="flex gap-2">
          <button onClick={handleSeed} className="soft-btn-secondary text-sm">Crear módulos por defecto</button>
          <button onClick={() => { setEditing(null); setForm({ nombre: '', descripcion: '', ruta: '', icono: '', orden: 0 }); setShowForm(true); }}
            className="soft-btn-primary">+ Nuevo módulo</button>
        </div>
      </div>

      <div className="table-shell">
        {loading ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando módulos...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay módulos para mostrar.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Ruta</th>
                <th className="px-4 py-3 text-center">Permisos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((modulo) => (
                <tr key={modulo.id}>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{modulo.nombre}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{modulo.descripcion || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{modulo.ruta || '—'}</td>
                  <td className="px-4 py-3 text-center">{modulo._count?.permisos || 0}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => { setEditing(modulo); setForm({ nombre: modulo.nombre, descripcion: modulo.descripcion ?? '', ruta: modulo.ruta ?? '', icono: modulo.icono ?? '', orden: modulo.orden }); setShowForm(true); }}
                      className="text-sm font-medium text-[var(--accent)]">Editar</button>
                    <button onClick={() => handleDelete(modulo.id)}
                      className="text-sm font-medium text-[var(--danger)]">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-xl font-semibold">{editing ? 'Editar Módulo' : 'Nuevo Módulo'}</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                  className="soft-input" placeholder="Ej. INVENTARIO" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={form.descripcion ?? ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="soft-textarea" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ruta</label>
                  <input value={form.ruta ?? ''} onChange={(e) => setForm({ ...form, ruta: e.target.value })}
                    className="soft-input" placeholder="/modulo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Icono</label>
                  <input value={form.icono ?? ''} onChange={(e) => setForm({ ...form, icono: e.target.value })}
                    className="soft-input" placeholder="icon-name" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="soft-btn-secondary px-5 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={guardando} className="soft-btn-primary px-6 py-2 text-sm">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
