'use client';
import { useState, useEffect, useCallback } from 'react';
import { pedidosApi, inventarioApi } from '../../lib/api';
import api from '../../lib/api';
import type { Pedido, PedidoPayload, ItemInventario } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

interface DetalleForm {
  inventario_id: string;
  cantidad: number;
  precio_unit: string;
  nuevo_item: boolean;
  nuevo_nombre: string;
  nuevo_codigo: string;
}

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PedidosPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar } = usePermiso('INVENTARIO');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recibiendo, setRecibiendo] = useState<string | null>(null);

  const [form, setForm] = useState<{
    prioridad: string; observaciones: string;
    detalles: DetalleForm[];
  }>({ prioridad: 'NORMAL', observaciones: '', detalles: [{ inventario_id: '', cantidad: 1, precio_unit: '', nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [p, i] = await Promise.all([
        pedidosApi.getAll() as Promise<Pedido[]>,
        inventarioApi.getAll() as Promise<ItemInventario[]>
      ]);
      setPedidos(p);
      setInventario(i);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    } finally { setCargando(false); }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    const detallesValidos = form.detalles.filter(d => (d.inventario_id || d.nuevo_item) && d.cantidad > 0);
    if (detallesValidos.length === 0) {
      notify('error', 'Agrega al menos un detalle válido al pedido.');
      return;
    }
    const nuevoItemSinNombre = detallesValidos.find(d => d.nuevo_item && !d.nuevo_nombre.trim());
    if (nuevoItemSinNombre) {
      notify('error', 'Completa el nombre de la herramienta nueva.');
      return;
    }
    try {
      const payload: PedidoPayload = {
        prioridad: form.prioridad,
        observaciones: form.observaciones || undefined,
        detalles: form.detalles.filter(d => d.inventario_id || d.nuevo_item).map(d => d.nuevo_item ? {
          nuevo_item: true,
          nuevo_nombre: d.nuevo_nombre,
          nuevo_codigo: d.nuevo_codigo || undefined,
          cantidad: d.cantidad,
          precio_unit: d.precio_unit ? parseFloat(d.precio_unit) : undefined
        } : {
          inventario_id: d.inventario_id,
          cantidad: d.cantidad,
          precio_unit: d.precio_unit ? parseFloat(d.precio_unit) : undefined
        })
      };
      await pedidosApi.create(payload);
      setShowForm(false);
      setForm({ prioridad: 'NORMAL', observaciones: '', detalles: [{ inventario_id: '', cantidad: 1, precio_unit: '', nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] });
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al crear pedido');
      notify('error', message, details);
    }
  }

  async function handleRecibir(id: string) {
    try {
      await api.patch(`/pedidos/${id}/recibir`, {});
      notify('success', 'Pedido recibido. Stock actualizado.');
      setRecibiendo(null);
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">{pedidos.length} pedidos</p>
        </div>
        {puedeIngresar && (
          <button onClick={() => setShowForm(true)} className="soft-btn-primary">+ Nuevo Pedido</button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Nuevo Pedido</h2>
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm(p => ({ ...p, prioridad: e.target.value }))} className="soft-select">
                  <option value="BAJA">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} className="soft-textarea" rows={2} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detalles del pedido</label>
                {form.detalles.map((d, i) => (
                  <div key={i} className="flex flex-wrap gap-2 mb-2 items-end">
                    {d.nuevo_item ? (
                      <>
                        <input placeholder="Código (auto)" value={d.nuevo_codigo}
                          onChange={e => {
                            const nd = [...form.detalles]; nd[i].nuevo_codigo = e.target.value;
                            setForm(p => ({ ...p, detalles: nd }));
                          }} className="soft-input w-28" />
                        <input placeholder="Nombre *" value={d.nuevo_nombre}
                          onChange={e => {
                            const nd = [...form.detalles]; nd[i].nuevo_nombre = e.target.value;
                            setForm(p => ({ ...p, detalles: nd }));
                          }} className="soft-input flex-1 min-w-[140px]" />
                      </>
                    ) : (
                      <select value={d.inventario_id} onChange={e => {
                        const nd = [...form.detalles]; nd[i].inventario_id = e.target.value;
                        setForm(p => ({ ...p, detalles: nd }));
                      }} className="soft-input flex-1 min-w-[140px]">
                        <option value="">Seleccionar...</option>
                        {inventario.map(item => (
                          <option key={item.id} value={item.id}>{item.codigo} - {item.nombre}</option>
                        ))}
                      </select>
                    )}
                    <input type="number" placeholder="Cant." value={d.cantidad} min={1}
                      onChange={e => {
                        const nd = [...form.detalles]; nd[i].cantidad = parseInt(e.target.value) || 0;
                        setForm(p => ({ ...p, detalles: nd }));
                      }} className="soft-input w-20" />
                    <input type="number" placeholder="$" value={d.precio_unit}
                      onChange={e => {
                        const nd = [...form.detalles]; nd[i].precio_unit = e.target.value;
                        setForm(p => ({ ...p, detalles: nd }));
                      }} className="soft-input w-20" />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={d.nuevo_item}
                        onChange={e => {
                          const nd = [...form.detalles]; nd[i].nuevo_item = e.target.checked;
                          if (e.target.checked) { nd[i].inventario_id = ''; } else { nd[i].nuevo_nombre = ''; nd[i].nuevo_codigo = ''; }
                          setForm(p => ({ ...p, detalles: nd }));
                        }} />
                      Nuevo
                    </label>
                    {form.detalles.length > 1 && (
                      <button type="button" onClick={() => setForm(p => ({ ...p, detalles: p.detalles.filter((_, j) => j !== i) }))}
                        className="text-red-400 text-sm">X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm(p => ({ ...p, detalles: [...p.detalles, { inventario_id: '', cantidad: 1, precio_unit: '', nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] }))}
                  className="text-blue-400 text-sm">+ Agregar detalle</button>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="soft-btn-secondary px-4 py-2">Cancelar</button>
                <button type="submit" className="soft-btn-primary px-5 py-2">Crear Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recibiendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="font-medium">¿Recibir este pedido?</p>
            <p className="text-sm text-gray-500">Se actualizará el stock del inventario.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setRecibiendo(null)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={() => handleRecibir(recibiendo)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : pedidos.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay pedidos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Artículos</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Prioridad</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p: Pedido) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.numero_orden}</td>
                  <td className="px-4 py-3">{p.detalles?.length || 0} items</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_pedido)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      p.estado === 'RECIBIDO' ? 'bg-green-100 text-green-700' :
                      p.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{p.estado}</span>
                  </td>
                  <td className="px-4 py-3">{p.prioridad || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {puedeActualizar && p.estado !== 'RECIBIDO' && (
                      <button onClick={() => setRecibiendo(p.id)}
                        className="text-green-500 hover:text-green-400 text-xs font-medium">Recibir</button>
                    )}
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
