'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api, { prestamosApi, descargarPDFPrestamo } from '../../lib/api';
import PrestamoForm from '../../components/catalogos/PrestamoForm';
import type { Prestamo, PrestamoPayload } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

const ORDEN_ESTADO: Record<string, number> = {
  VENCIDO: 0,
  ACTIVO: 1,
  PENDIENTE: 2,
  DEVUELTO: 3,
};

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCorta(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PrestamosPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar } = usePermiso('PRESTAMOS');
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [filtro, setFiltro]       = useState('todos');
  const [cargando, setCargando]   = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Prestamo | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await prestamosApi.getAll() as Prestamo[];
      setPrestamos(data);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar préstamos');
      notify('error', message, details);
    } finally { setCargando(false); }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: PrestamoPayload) {
    if (editando) await prestamosApi.update(editando.id, form);
    else          await prestamosApi.create(form);
    setShowForm(false); setEditando(null); cargar();
    window.dispatchEvent(new CustomEvent('refresh-alertas'));
  }

  async function marcarDevuelto(id: string) {
    try {
      await api.patch(`/prestamos/${id}/devolucion`, {
        observaciones_dev: 'Devuelto voluntariamente'
      });
      cargar();
      window.dispatchEvent(new CustomEvent('refresh-alertas'));
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al actualizar préstamo');
      notify('error', message, details);
    }
  }

  const lista = (filtro === 'todos' ? prestamos
    : prestamos.filter((p: Prestamo) => p.estado === filtro))
    .sort((a, b) => (ORDEN_ESTADO[a.estado] ?? 99) - (ORDEN_ESTADO[b.estado] ?? 99) || new Date(b.fecha_prestamo ?? 0).getTime() - new Date(a.fecha_prestamo ?? 0).getTime());

  const activos = prestamos.filter((p: Prestamo) => p.estado === 'ACTIVO').length;
  const vencidos = prestamos.filter((p: Prestamo) => p.estado === 'VENCIDO').length;

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Préstamos</h1>
          <p className="page-subtitle">
            {prestamos.length} total —
            <span className="ml-1 font-semibold text-[var(--warning)]">{activos} activos</span>
            {vencidos > 0 && <span className="ml-2 font-semibold text-red-500">{vencidos} vencidos</span>}
          </p>
        </div>
        {puedeIngresar && (
          <button onClick={() => { setEditando(null); setShowForm(true); }} className="soft-btn-primary">
            + Nuevo Préstamo
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'ACTIVO', 'VENCIDO', 'PENDIENTE', 'DEVUELTO'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`filter-pill capitalize ${filtro === f ? 'active' : ''}`}>{f}</button>
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

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay préstamos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Herramienta</th>
                <th className="px-4 py-3 text-left">Estudiante</th>
                <th className="px-4 py-3 text-left">Instructor</th>
                <th className="px-4 py-3 text-left">Cant.</th>
                <th className="px-4 py-3 text-left">Registrado por</th>
                <th className="px-4 py-3 text-left">Préstamo</th>
                <th className="px-4 py-3 text-left">Devolución</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p: Prestamo) => (
                <tr key={p.id} className={p.estado === 'VENCIDO' ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{p.inventario?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-main)]">
                    {p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {p.instructor ? `${p.instructor.nombres} ${p.instructor.apellidos}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--accent-strong)]">{p.cantidad}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_prestamo)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[var(--text-main)]">{fmtCorta(p.fecha_devolucion)}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {puedeActualizar && (
                      <button onClick={() => { setEditando(p); setShowForm(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    )}
                    {puedeActualizar && p.estado !== 'DEVUELTO' && (
                      <button onClick={() => marcarDevuelto(p.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium">DEVUELTO</button>
                    )}
                    <button onClick={() => descargarPDFPrestamo(p.id)}
                      className="text-orange-400 hover:text-orange-300 text-xs font-medium">PDF</button>
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
