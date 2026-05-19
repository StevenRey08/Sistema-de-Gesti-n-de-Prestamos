'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api, { prestamosApi, descargarPDFPrestamo, getLocalStorageToken, BASE_URL } from '../../lib/api';
import PrestamoForm from '../../components/catalogos/PrestamoForm';
import type { Prestamo, PrestamoPayload, PrestamoDetalle } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

const ORDEN_ESTADO: Record<string, number> = {
  VENCIDO: 0,
  ACTIVO: 1,
  PERDIDO: 2,
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

interface ItemDevolucion {
  inventario_id: string;
  cantidad: number;
  nombre: string;
  cantidad_buena: number;
  cantidad_danada: number;
  cantidad_perdida: number;
  observaciones_buena: string;
  observaciones_danada: string;
  observaciones_perdida: string;
}

export default function PrestamosPage() {
  const searchParams = useSearchParams();
  const vencidoId = searchParams.get('vencido');
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar } = usePermiso('PRESTAMOS');
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [filtro, setFiltro]       = useState(vencidoId ? 'VENCIDO' : 'todos');
  const [cargando, setCargando]   = useState(true);
  const [destacarId, setDestacarId] = useState<string | null>(vencidoId);
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Prestamo | null>(null);

  const [showDevolucion, setShowDevolucion] = useState(false);
  const [prestamoDevolucion, setPrestamoDevolucion] = useState<Prestamo | null>(null);
  const [itemsDevolucion, setItemsDevolucion] = useState<ItemDevolucion[]>([]);
  const [obsDevolucion, setObsDevolucion] = useState('');

  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [searchText, setSearchText] = useState('');

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

  function abrirDevolucion(p: Prestamo) {
    setPrestamoDevolucion(p);
    setObsDevolucion('');

    const esMulti = p.detalles && p.detalles.length > 0;
    if (esMulti) {
      const items: ItemDevolucion[] = p.detalles!.map(d => ({
        inventario_id: d.inventario_id,
        cantidad: d.cantidad,
        nombre: d.inventario?.nombre || 'Artículo',
        cantidad_buena: d.cantidad,
        cantidad_danada: 0,
        cantidad_perdida: 0,
        observaciones_buena: '',
        observaciones_danada: '',
        observaciones_perdida: '',
      }));
      setItemsDevolucion(items);
    } else {
      setItemsDevolucion([{
        inventario_id: p.inventario_id,
        cantidad: p.cantidad,
        nombre: p.inventario?.nombre || 'Artículo',
        cantidad_buena: p.cantidad,
        cantidad_danada: 0,
        cantidad_perdida: 0,
        observaciones_buena: '',
        observaciones_danada: '',
        observaciones_perdida: '',
      }]);
    }
    setShowDevolucion(true);
  }

  function actualizarCantidadItem(idx: number, campo: 'cantidad_buena' | 'cantidad_danada' | 'cantidad_perdida', valor: number) {
    setItemsDevolucion(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [campo]: Math.max(0, Math.min(valor, item.cantidad)) };
      const resto = item.cantidad - updated.cantidad_danada - updated.cantidad_perdida;
      if (campo !== 'cantidad_buena') {
        updated.cantidad_buena = Math.max(0, resto);
      }
      return updated;
    }));
  }

  function actualizarObsItem(idx: number, campo: 'observaciones_buena' | 'observaciones_danada' | 'observaciones_perdida', obs: string) {
    setItemsDevolucion(prev => prev.map((item, i) => i === idx ? { ...item, [campo]: obs } : item));
  }

  function totalAsignado(item: ItemDevolucion) {
    return item.cantidad_buena + item.cantidad_danada + item.cantidad_perdida;
  }

  async function confirmarDevolucion() {
    if (!prestamoDevolucion) return;

    for (const item of itemsDevolucion) {
      if (item.cantidad_buena + item.cantidad_danada + item.cantidad_perdida !== item.cantidad) {
        notify('error', `La suma de ${item.nombre} no coincide. Total: ${item.cantidad}, Asignado: ${item.cantidad_buena + item.cantidad_danada + item.cantidad_perdida}`);
        return;
      }
    }

    try {
      const items_devolucion: { inventario_id: string; estado: string; cantidad: number; observaciones: string }[] = [];
      for (const item of itemsDevolucion) {
        if (item.cantidad_buena > 0) {
          items_devolucion.push({ inventario_id: item.inventario_id, estado: 'BUEN_ESTADO', cantidad: item.cantidad_buena, observaciones: item.observaciones_buena });
        }
        if (item.cantidad_danada > 0) {
          items_devolucion.push({ inventario_id: item.inventario_id, estado: 'MAL_ESTADO', cantidad: item.cantidad_danada, observaciones: item.observaciones_danada });
        }
        if (item.cantidad_perdida > 0) {
          items_devolucion.push({ inventario_id: item.inventario_id, estado: 'PERDIDO', cantidad: item.cantidad_perdida, observaciones: item.observaciones_perdida });
        }
      }

      await api.patch(`/prestamos/${prestamoDevolucion.id}/devolucion`, {
        observaciones_dev: obsDevolucion,
        items_devolucion,
      });
      notify('success', 'Devolución registrada correctamente');
      setShowDevolucion(false);
      setPrestamoDevolucion(null);
      cargar();
      window.dispatchEvent(new CustomEvent('refresh-alertas'));
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al registrar devolución');
      notify('error', message, details);
    }
  }

  function abrirPdf(id: string) {
    const token = getLocalStorageToken() || '';
    const url = `${BASE_URL}/prestamos/${id}/pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const u = URL.createObjectURL(blob);
        setPdfUrl(u);
        setShowPdf(true);
      })
      .catch(() => notify('error', 'Error al cargar el PDF'));
  }

  function cerrarPdf() {
    setShowPdf(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
  }

  const lista = prestamos
    .filter((p: Prestamo) => filtro === 'todos' || p.estado === filtro)
    .filter(p => {
      if (!searchText) return true;
      const s = searchText.toLowerCase();
      const estudiante = p.persona ? `${p.persona.nombres} ${p.persona.apellidos}`.toLowerCase() : '';
      const instructor = p.instructor ? `${p.instructor.nombres} ${p.instructor.apellidos}`.toLowerCase() : '';
      const articulos = p.detalles?.map(d => d.inventario?.nombre?.toLowerCase() || '') || [];
      if (p.inventario?.nombre?.toLowerCase().includes(s)) return true;
      return estudiante.includes(s) || instructor.includes(s) || articulos.some(n => n.includes(s));
    })
    .sort((a, b) => (ORDEN_ESTADO[a.estado] ?? 99) - (ORDEN_ESTADO[b.estado] ?? 99) || new Date(b.fecha_prestamo ?? 0).getTime() - new Date(a.fecha_prestamo ?? 0).getTime());

  const activos = prestamos.filter((p: Prestamo) => p.estado === 'PENDIENTE').length;
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

      <div className="flex gap-2 flex-wrap items-center">
        {['todos', 'PENDIENTE', 'VENCIDO', 'PERDIDO', 'DEVUELTO'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`filter-pill capitalize ${filtro === f ? 'active' : ''}`}>{f}</button>
        ))}
        <input type="text" placeholder="Buscar por estudiante, instructor o artículo..."
          value={searchText} onChange={e => setSearchText(e.target.value)}
          className="soft-input ml-auto max-w-xs text-sm" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6">
            <PrestamoForm prestamo={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }}
              onSuccess={() => { setShowForm(false); setEditando(null); cargar(); window.dispatchEvent(new CustomEvent('refresh-alertas')); }} />
          </div>
        </div>
      )}

      {showDevolucion && prestamoDevolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-white p-6 shadow-2xl max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--text-main)]">Registrar Devolución</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {prestamoDevolucion.persona
                ? `${prestamoDevolucion.persona.nombres} ${prestamoDevolucion.persona.apellidos}`
                : prestamoDevolucion.instructor
                ? `${prestamoDevolucion.instructor.nombres} ${prestamoDevolucion.instructor.apellidos} (Prof.)`
                : '—'}
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Estado de cada herramienta:</h3>
              {itemsDevolucion.map((item, idx) => {
                const asignado = item.cantidad_buena + item.cantidad_danada + item.cantidad_perdida;
                const coincide = asignado === item.cantidad;
                return (
                  <div key={idx} className="rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--surface-2)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-main)]">{item.nombre}</span>
                      <span className={`text-xs font-bold ${coincide ? 'text-green-600' : 'text-red-600'}`}>
                        {asignado}/{item.cantidad} asignados
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-green-700">✓ Buen estado</label>
                        <input
                          type="number"
                          min={0}
                          max={item.cantidad}
                          value={item.cantidad_buena}
                          onChange={e => actualizarCantidadItem(idx, 'cantidad_buena', parseInt(e.target.value) || 0)}
                          className="soft-input w-full text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={item.observaciones_buena}
                          onChange={e => actualizarObsItem(idx, 'observaciones_buena', e.target.value)}
                          className="soft-input w-full text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-amber-700">⚠ Dañado</label>
                        <input
                          type="number"
                          min={0}
                          max={item.cantidad}
                          value={item.cantidad_danada}
                          onChange={e => actualizarCantidadItem(idx, 'cantidad_danada', parseInt(e.target.value) || 0)}
                          className="soft-input w-full text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={item.observaciones_danada}
                          onChange={e => actualizarObsItem(idx, 'observaciones_danada', e.target.value)}
                          className="soft-input w-full text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-red-700">✕ Perdido</label>
                        <input
                          type="number"
                          min={0}
                          max={item.cantidad}
                          value={item.cantidad_perdida}
                          onChange={e => actualizarCantidadItem(idx, 'cantidad_perdida', parseInt(e.target.value) || 0)}
                          className="soft-input w-full text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={item.observaciones_perdida}
                          onChange={e => actualizarObsItem(idx, 'observaciones_perdida', e.target.value)}
                          className="soft-input w-full text-[10px]"
                        />
                      </div>
                    </div>

                    {!coincide && (
                      <p className="text-xs text-red-600">
                        {asignado < item.cantidad
                          ? `Faltan asignar ${item.cantidad - asignado} unidad(es)`
                          : `Excedido por ${asignado - item.cantidad} unidad(es)`
                        }
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Observaciones generales:</label>
              <textarea
                value={obsDevolucion}
                onChange={e => setObsDevolucion(e.target.value)}
                placeholder="Notas adicionales sobre la devolución..."
                rows={2}
                className="soft-input w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button onClick={() => { setShowDevolucion(false); setPrestamoDevolucion(null); }}
                className="soft-btn-secondary px-4 py-2 text-xs">Cancelar</button>
              <button onClick={confirmarDevolucion}
                className="soft-btn-primary px-6 py-2 text-xs">Confirmar Devolución</button>
            </div>
          </div>
        </div>
      )}

      {showPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-white shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
              <h3 className="text-sm font-semibold text-[var(--text-main)]">Comprobante de Préstamo</h3>
              <button onClick={cerrarPdf}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200">✕ Cerrar</button>
            </div>
            <div className="flex-1 overflow-auto">
              {pdfUrl && <iframe src={pdfUrl} className="w-full" style={{ height: 'calc(90vh - 60px)', border: 'none' }} />}
            </div>
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
                <th className="px-4 py-3 text-left">Artículo</th>
                <th className="px-4 py-3 text-left">Destinatario</th>
                <th className="px-4 py-3 text-left">Instructor</th>
                <th className="px-4 py-3 text-left">Cant.</th>
                <th className="px-4 py-3 text-left">Registrado por</th>
                <th className="px-4 py-3 text-left">Préstamo</th>
                <th className="px-4 py-3 text-left">Devolución</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p: Prestamo) => {
                const articulos = p.detalles && p.detalles.length > 0
                  ? p.detalles.map(d => ({ nombre: d.inventario?.nombre || '—', cantidad: d.cantidad }))
                  : p.inventario ? [{ nombre: p.inventario.nombre, cantidad: p.cantidad }] : [{ nombre: '—', cantidad: 0 }];
                return (
                  <tr key={p.id} className={
                    p.id === destacarId ? 'ring-2 ring-red-500 bg-red-50' :
                    p.estado === 'VENCIDO' ? 'bg-red-50' :
                    p.estado === 'PERDIDO' ? 'bg-gray-100' : ''
                  }>
                    <td className="px-4 py-3">
                      {articulos.map((a, i) => (
                        <span key={i} className="block text-sm font-medium text-[var(--text-main)]">
                          {a.nombre} <span className="font-bold text-[var(--accent-strong)]">x{a.cantidad}</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-main)]">
                      {p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : p.instructor ? `${p.instructor.nombres} ${p.instructor.apellidos} (Prof.)` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {p.instructor && p.persona ? `${p.instructor.nombres} ${p.instructor.apellidos}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--accent-strong)]">
                      {articulos.reduce((s, a) => s + a.cantidad, 0)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_prestamo)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[var(--text-main)]">{fmt(p.fecha_devolucion)}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {puedeActualizar && (
                        <button onClick={() => { setEditando(p); setShowForm(true); }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                      )}
                      {puedeActualizar && p.estado !== 'DEVUELTO' && p.estado !== 'PERDIDO' && (
                        <button onClick={() => abrirDevolucion(p)}
                          className="text-green-500 hover:text-green-400 text-xs font-medium">DEVOLVER</button>
                      )}
<button onClick={() => abrirPdf(p.id)}
                         className="text-orange-400 hover:text-orange-300 text-xs font-medium">Factura</button>
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
