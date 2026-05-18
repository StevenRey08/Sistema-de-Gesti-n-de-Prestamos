'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api, { pedidosApi, inventarioApi, BASE_URL } from '../../lib/api';
import type { Pedido, PedidoPayload, ItemInventario } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

interface DetalleForm {
  inventario_id: string;
  cantidad: number;
  nuevo_item: boolean;
  nuevo_nombre: string;
  nuevo_codigo: string;
}

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function BuscadorSelect({ items, value, onChange, placeholder, filterOut }: {
  items: ItemInventario[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  filterOut: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const seleccionado = items.find(i => i.id === value);

  const filtrados = items.filter(i =>
    !filterOut.includes(i.id) &&
    (i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
     i.codigo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  useEffect(() => {
    function cerrar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-[140px]">
      <input
        placeholder={placeholder || 'Buscar...'}
        value={abierto ? busqueda : (seleccionado ? `${seleccionado.codigo} - ${seleccionado.nombre}` : '')}
        onFocus={() => { setAbierto(true); setBusqueda(''); }}
        onChange={e => { setBusqueda(e.target.value); setAbierto(true); }}
        className="soft-input w-full text-sm cursor-pointer" />
      {abierto && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtrados.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">Sin resultados</div>
          ) : (
            filtrados.map(item => (
              <div key={item.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${item.id === value ? 'bg-blue-50 font-medium' : ''}`}
                onClick={() => { onChange(item.id); setAbierto(false); }}>
                {item.codigo} - {item.nombre}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PedidosPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar } = usePermiso('INVENTARIO');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [recibiendo, setRecibiendo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<{ id: string; numero_orden: string } | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [viendo, setViendo] = useState<Pedido | null>(null);

  const [form, setForm] = useState<{
    prioridad: string; observaciones: string;
    detalles: DetalleForm[];
  }>({ prioridad: 'NORMAL', observaciones: '', detalles: [{ inventario_id: '', cantidad: 0, nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] });

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

  function abrirEditar(pedido: Pedido) {
    setEditando(pedido);
    setForm({
      prioridad: pedido.prioridad || 'NORMAL',
      observaciones: pedido.observaciones || '',
      detalles: (pedido.detalles || []).map(d => ({
        inventario_id: d.inventario_id,
        cantidad: d.cantidad,
        nuevo_item: false,
        nuevo_nombre: '',
        nuevo_codigo: ''
      }))
    });
    setShowForm(true);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) {
      // Crear nuevo
      const detallesValidos = form.detalles.filter(d => (d.inventario_id || d.nuevo_item) && d.cantidad > 0);
      if (detallesValidos.length === 0) {
        notify('error', 'Agrega al menos un detalle válido al pedido.');
        return;
      }
      const nuevoItemSinNombre = detallesValidos.find(d => d.nuevo_item && !d.nuevo_nombre.trim());
      if (nuevoItemSinNombre) {
        notify('error', 'Completa el nombre del objeto nuevo.');
        return;
      }
    }
    try {
      const payload: PedidoPayload = {
        prioridad: form.prioridad,
        observaciones: form.observaciones || undefined,
        detalles: form.detalles.filter(d => d.inventario_id || d.nuevo_item).map(d => d.nuevo_item ? {
          nuevo_item: true,
          nuevo_nombre: d.nuevo_nombre,
          nuevo_codigo: d.nuevo_codigo || undefined,
          cantidad: d.cantidad
        } : {
          inventario_id: d.inventario_id,
          cantidad: d.cantidad
        })
      };
      if (editando) {
        await pedidosApi.update(editando.id, payload);
        notify('success', 'Pedido actualizado.');
      } else {
        await pedidosApi.create(payload);
        notify('success', 'Pedido creado.');
      }
      setShowForm(false);
      setEditando(null);
      setForm({ prioridad: 'NORMAL', observaciones: '', detalles: [{ inventario_id: '', cantidad: 0, nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] });
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, editando ? 'Error al actualizar pedido' : 'Error al crear pedido');
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

  async function handleEnviarConfirmar() {
    if (!enviando) return;
    try {
      window.open(`${BASE_URL}/pedidos/${enviando.id}/pdf`, '_blank');
      await pedidosApi.update(enviando.id, { estado: 'PENDIENTE' });
      notify('success', 'Pedido Confirmado');
      setEnviando(null);
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    }
  }

  async function handleEliminar(id: string) {
    try {
      await pedidosApi.delete(id);
      notify('success', 'Pedido eliminado.');
      setEliminando(null);
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
            <h2 className="text-lg font-semibold mb-4">{editando ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
            <form onSubmit={handleGuardar} className="space-y-4">

              <div>
                <label className="block text-sm font-medium mb-2">Pedir Objeto</label>
                {form.detalles.map((d, i) => (
                  <div key={i} className="flex flex-wrap gap-2 mb-2 items-end">
                    {d.nuevo_item ? (
                      <>
                        <input placeholder="Nombre *" value={d.nuevo_nombre}
                          onChange={e => {
                            const nd = [...form.detalles]; nd[i].nuevo_nombre = e.target.value;
                            setForm(p => ({ ...p, detalles: nd }));
                          }} className="soft-input flex-1 min-w-[140px]" />
                      </>
                    ) : (
                      <BuscadorSelect
                        items={inventario}
                        value={d.inventario_id}
                        onChange={id => {
                          const nd = [...form.detalles]; nd[i].inventario_id = id;
                          setForm(p => ({ ...p, detalles: nd }));
                        }}
                        filterOut={form.detalles.filter((_, j) => j !== i).map(d2 => d2.inventario_id).filter(Boolean)}
                      />
                    )}
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-0.5">Cantidad a pedir</label>
                      <input type="number" placeholder="Cant." value={d.cantidad} min={1}
                        onChange={e => {
                          const nd = [...form.detalles]; nd[i].cantidad = parseInt(e.target.value) || 0;
                          setForm(p => ({ ...p, detalles: nd }));
                        }} className="soft-input w-20" />
                    </div>
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={d.nuevo_item}
                        onChange={e => {
                          const nd = [...form.detalles]; nd[i].nuevo_item = e.target.checked;
                          if (e.target.checked) { nd[i].inventario_id = ''; } else { nd[i].nuevo_nombre = ''; nd[i].nuevo_codigo = ''; }
                          setForm(p => ({ ...p, detalles: nd }));
                        }} />
                      Agregar Objeto
                    </label>
                    {form.detalles.length > 1 && (
                      <button type="button" onClick={() => setForm(p => ({ ...p, detalles: p.detalles.filter((_, j) => j !== i) }))}
                        className="text-red-400 text-sm">X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm(p => ({ ...p, detalles: [...p.detalles, { inventario_id: '', cantidad: 0, nuevo_item: false, nuevo_nombre: '', nuevo_codigo: '' }] }))}
                  className="text-blue-400 text-sm">+ Otro Objeto</button>
              </div>

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

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="soft-btn-secondary px-4 py-2">Cancelar</button>
                <button type="submit" className="soft-btn-primary px-5 py-2">{editando ? 'Guardar Cambios' : 'Crear Pedido'}</button>
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

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="font-medium">¿Cancelar este pedido?</p>
            <p className="text-sm text-gray-500">Se eliminará permanentemente.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setEliminando(null)} className="px-4 py-2 border rounded-lg text-sm">Volver</button>
              <button onClick={() => handleEliminar(eliminando)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {enviando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="font-medium">Confirmar pedido {enviando.numero_orden}</p>
            <p className="text-sm text-gray-500">Se generará un PDF con los datos del pedido y cambiará el estado a Pendiente.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setEnviando(null)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={handleEnviarConfirmar} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Generar PDF y Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {viendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Pedido {viendo.numero_orden}</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">{fmt(viendo.fecha_pedido)}</p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="font-medium w-24">Estado:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  viendo.estado === 'RECIBIDO' ? 'bg-green-100 text-green-700' :
                  viendo.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                  viendo.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{viendo.estado === 'EN_REVISION' ? 'En Revisión' : viendo.estado}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-24">Prioridad:</span>
                <span>{viendo.prioridad || '—'}</span>
              </div>
              {viendo.observaciones && (
                <div className="flex gap-2">
                  <span className="font-medium w-24">Obs.:</span>
                  <span>{viendo.observaciones}</span>
                </div>
              )}
              {viendo.fecha_entrega && (
                <div className="flex gap-2">
                  <span className="font-medium w-24">Recibido:</span>
                  <span>{fmt(viendo.fecha_entrega)}</span>
                </div>
              )}
              <div>
                <span className="font-medium block mb-1">Objetos:</span>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {viendo.detalles?.map((d, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{d.inventario?.nombre || '—'}</span>
                      <span className="font-medium">x{d.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setViendo(null)} className="soft-btn-secondary px-4 py-2">Cerrar</button>
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
                  <td className="px-4 py-3">
                    {p.detalles?.map((d, idx) => (
                      <div key={idx}>{d.inventario?.nombre || '—'} x{d.cantidad}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(p.fecha_pedido)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      p.estado === 'RECIBIDO' ? 'bg-green-100 text-green-700' :
                      p.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                      p.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{p.estado === 'EN_REVISION' ? 'En Revisión' : p.estado}</span>
                  </td>
                  <td className="px-4 py-3">{p.prioridad || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {p.estado === 'EN_REVISION' && puedeActualizar && (
                      <button onClick={() => abrirEditar(p)}
                        className="text-amber-500 hover:text-amber-400 text-xs font-medium">Editar</button>
                    )}
                    {p.estado === 'EN_REVISION' && puedeActualizar && (
                      <button onClick={() => setEnviando({ id: p.id, numero_orden: p.numero_orden })}
                        className="text-blue-500 hover:text-blue-400 text-xs font-medium">Confirmar</button>
                    )}
                    {p.estado === 'PENDIENTE' && (
                      <button onClick={() => setViendo(p)}
                        className="text-gray-500 hover:text-gray-400 text-xs font-medium">Ver</button>
                    )}
                    {p.estado === 'PENDIENTE' && puedeActualizar && (
                      <button onClick={() => setRecibiendo(p.id)}
                        className="text-green-500 hover:text-green-400 text-xs font-medium">Recibir</button>
                    )}
                    {p.estado !== 'RECIBIDO' && puedeActualizar && (
                      <button onClick={() => setEliminando(p.id)}
                        className="text-red-400 hover:text-red-500 text-xs font-medium">Eliminar</button>
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
