'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api, { prestamosApi } from '../../lib/api';
import PrestamoForm from '../../components/catalogos/PrestamoForm';
import type { Prestamo, PrestamoPayload } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

const BADGE: Record<string, string> = {
  ACTIVO:   'bg-yellow-900 text-yellow-300',
  DEVUELTO: 'bg-green-900 text-green-300',
  VENCIDO:  'bg-red-900 text-red-300',
};

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PrestamosPage() {
  const { notify } = useNotification();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [filtro, setFiltro]       = useState('todos');
  const [cargando, setCargando]   = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Prestamo | null>(null);
  const [eliminando, setElim]     = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { 
      const data = await prestamosApi.getAll() as Prestamo[];
      setPrestamos(data);
    }
    catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar préstamos');
      notify('error', message, details);
    }
    finally { setCargando(false); }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: PrestamoPayload) {
    if (editando) await prestamosApi.update(editando.id, form);
    else          await prestamosApi.create(form);
    setShowForm(false); setEditando(null); cargar();
  }

  async function handleEliminar() {
    try {
      if (eliminando) await prestamosApi.delete(eliminando);
      setElim(null); cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al eliminar');
      notify('error', message, details);
    }
  }

  async function marcarDevuelto(id: string) {
    try {
      await api.patch(`/prestamos/${id}/devolucion`, {
        observaciones_dev: 'Devuelto voluntariamente'
      });
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al actualizar préstamo');
      notify('error', message, details);
    }
  }

  const lista = filtro === 'todos' ? prestamos
    : prestamos.filter((p: Prestamo) => p.estado === filtro);

  const activos = prestamos.filter((p: Prestamo) => p.estado === 'ACTIVO').length;

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Préstamos</h1>
          <p className="page-subtitle">
            {prestamos.length} total —
            <span className="ml-1 font-semibold text-[var(--warning)]">{activos} activos</span>
          </p>
        </div>
        <button onClick={() => { setEditando(null); setShowForm(true); }}
          className="soft-btn-primary">
          + Nuevo Préstamo
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2">
        {['todos', 'ACTIVO', 'DEVUELTO'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`filter-pill capitalize ${filtro === f ? 'active' : ''}`}>
            {f}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6">
            <PrestamoForm prestamo={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }} />
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-700">
            <p className="text-white font-medium">¿Eliminar este préstamo?</p>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancelar</button>
              <button onClick={handleEliminar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay préstamos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Herramienta</th>
                <th className="px-4 py-3 text-left">Persona</th>
                <th className="px-4 py-3 text-left">Cant.</th>
                <th className="px-4 py-3 text-left">Préstamo</th>
                <th className="px-4 py-3 text-left">Devolución</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p: Prestamo) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                    {p.inventario?.nombre || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-main)]">
                    {p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--accent-strong)]">{p.cantidad}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_prestamo)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_devolucion)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${BADGE[p.estado] || 'bg-gray-700 text-gray-300'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {p.estado === 'ACTIVO' && (
                      <button onClick={() => marcarDevuelto(p.id)}
                        className="text-green-400 hover:text-green-300 text-xs font-medium">✓ Devuelto</button>
                    )}
                    <button onClick={() => { setEditando(p); setShowForm(true); }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    <button onClick={() => setElim(p.id)}
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
