'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { inventarioApi, movimientosApi, ubicacionesApi, imagenUrl } from '../../lib/api';
import api from '../../lib/api';
import InventarioForm from '../../components/catalogos/InventarioForm';
import type { InventarioPayload, ItemInventario, Prestamo, Ubicacion } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';

const BADGE: Record<string, string> = {
  Nuevo: 'status-badge status-success',
  Usado: 'status-badge status-warning',
  Dañado: 'status-badge status-danger',
  Prestado: 'status-badge status-info',
};

const ESTADOS = ['todos', 'Nuevo', 'Usado', 'Dañado', 'Prestado', 'Bajo Stock'];

export default function InventarioPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('INVENTARIO');

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [inventarioSearch, setInventarioSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [inventarioLoading, setInventarioLoading] = useState(true);
  const [showInventarioForm, setShowInventarioForm] = useState(false);
  const [editandoInventario, setEditandoInventario] = useState<ItemInventario | null>(null);
  const [eliminandoInventario, setEliminandoInventario] = useState<string | null>(null);

  const [prestamosActivos, setPrestamosActivos] = useState<Prestamo[]>([]);
  const [trasladando, setTrasladando] = useState<ItemInventario | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [destinoId, setDestinoId] = useState('');
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);
  const [enviandoTraslado, setEnviandoTraslado] = useState(false);

  const cargarInventario = useCallback(async () => {
    setInventarioLoading(true);
    try {
      const [itemsData, prestamosData] = await Promise.all([
        inventarioApi.getAll() as Promise<ItemInventario[]>,
        api.get('/prestamos?estado=ACTIVO') as Promise<Prestamo[]>
      ]);
      setItems(itemsData);
      setPrestamosActivos(prestamosData);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar inventario');
      notify('error', message, details);
    } finally {
      setInventarioLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void cargarInventario();
  }, [cargarInventario]);

  const prestadoPorId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of prestamosActivos) {
      map[p.inventario_id] = (map[p.inventario_id] || 0) + p.cantidad;
    }
    return map;
  }, [prestamosActivos]);

  const inventarioFiltrado = useMemo(() => {
    const term = inventarioSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (filtroEstado === 'Bajo Stock') {
        const total = item.cantidad + (prestadoPorId[item.id] || 0);
        if (total > 2) return false;
      } else if (filtroEstado !== 'todos' && item.estado !== filtroEstado) {
        return false;
      }
      if (!term) return true;
      const texto = [
        item.nombre,
        item.codigo,
        item.ubicacion?.codigo,
        item.ubicacion?.nombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return texto.includes(term);
    });
  }, [inventarioSearch, filtroEstado, items, prestadoPorId]);

  async function handleGuardarInventario(form: InventarioPayload | FormData) {
    if (editandoInventario) await inventarioApi.update(editandoInventario.id, form);
    else await inventarioApi.create(form);

    setShowInventarioForm(false);
    setEditandoInventario(null);
    void cargarInventario();
  }

  async function handleEliminarInventario() {
    try {
      if (eliminandoInventario !== null) await inventarioApi.delete(eliminandoInventario);
      setEliminandoInventario(null);
      void cargarInventario();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al eliminar inventario');
      notify('error', message, details);
    }
  }

  async function abrirTraslado(item: ItemInventario) {
    setTrasladando(item);
    setDestinoId('');
    setCargandoUbicaciones(true);
    try {
      const data = await ubicacionesApi.getAll() as Ubicacion[];
      setUbicaciones(data);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar ubicaciones');
      notify('error', message, details);
    } finally {
      setCargandoUbicaciones(false);
    }
  }

  async function confirmarTraslado() {
    if (!trasladando || !destinoId) return;
    if (destinoId === trasladando.ubicacion_id) {
      notify('error', 'La herramienta ya está en esa ubicación.');
      return;
    }
    setEnviandoTraslado(true);
    try {
      await movimientosApi.create({
        inventario_id: trasladando.id,
        tipo: 'TRASLADO',
        cantidad: trasladando.cantidad,
        ubicacion_origen_id: trasladando.ubicacion_id,
        ubicacion_destino_id: destinoId,
        observaciones: `Traslado desde ${trasladando.ubicacion?.codigo || 'ubicación anterior'}`
      });
      notify('success', 'Traslado registrado correctamente.');
      setTrasladando(null);
      void cargarInventario();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al realizar traslado');
      notify('error', message, details);
    } finally {
      setEnviandoTraslado(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">
            Controla cantidades, estado y ubicación física de cada herramienta.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <p>Registros en inventario</p>
          <p>{items.length}</p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-main)]">Existencias en inventario</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Controla cantidades, estado y ubicación física de cada herramienta.
            </p>
          </div>

          {puedeIngresar && (
            <button
              onClick={() => {
                setEditandoInventario(null);
                setShowInventarioForm(true);
              }}
              className="soft-btn-primary"
            >
              + Agregar existencia
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Buscar por herramienta o ubicación..."
            value={inventarioSearch}
            onChange={(e) => setInventarioSearch(e.target.value)}
            className="soft-input max-w-md"
          />
          <div className="flex gap-2 flex-wrap items-center">
            {ESTADOS.map((e) => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                className={`filter-pill ${filtroEstado === e ? 'active' : ''}`}>
                {e === 'todos' ? 'Todos' : e}
              </button>
            ))}
          </div>
        </div>

        <div className="table-shell">
          {inventarioLoading ? (
            <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
          ) : inventarioFiltrado.length === 0 ? (
            <p className="py-12 text-center text-[var(--text-muted)]">
              {inventarioSearch ? 'No hay resultados para esa búsqueda.' : 'No hay registros en el inventario.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inventarioFiltrado.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow-soft)]">
                  {item.imagen_ruta ? (
                    <div className="aspect-video w-full bg-[var(--surface-3)]">
                      <img
                        src={imagenUrl(item.imagen_ruta)}
                        alt={item.nombre}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-3)] text-sm text-[var(--text-muted)]">
                      No disponible
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-main)] truncate">{item.nombre || '—'}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{item.codigo}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`${BADGE[item.estado ?? ''] || 'status-badge status-info'} text-[10px] px-2 py-0`}>
                        {item.estado}
                      </span>
                      <span className="font-bold text-sm text-[var(--accent-strong)]">×{item.cantidad}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      {item.ubicacion ? `${item.ubicacion.tipo}: ${item.ubicacion.codigo}` : '—'}
                    </p>
                    <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2">
                      {puedeActualizar && (
                        <button
                          onClick={() => {
                            setEditandoInventario(item);
                            setShowInventarioForm(true);
                          }}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Editar
                        </button>
                      )}
                      {puedeActualizar && (
                        <button
                          onClick={() => abrirTraslado(item)}
                          className="text-xs font-medium text-orange-400 hover:text-orange-300"
                        >
                          Mover
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          onClick={() => setEliminandoInventario(item.id)}
                          className="ml-auto text-xs font-medium text-[var(--danger)] hover:opacity-80"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showInventarioForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">
              {editandoInventario ? 'Editar registro de inventario' : 'Agregar existencia'}
            </h2>
            <InventarioForm
              item={editandoInventario}
              onGuardar={handleGuardarInventario}
              onCancelar={() => {
                setShowInventarioForm(false);
                setEditandoInventario(null);
              }}
            />
          </div>
        </div>
      )}

      {trasladando && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Trasladar herramienta</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {trasladando.nombre} ({trasladando.codigo})
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ubicación actual: {trasladando.ubicacion ? `${trasladando.ubicacion.tipo}: ${trasladando.ubicacion.codigo}` : '—'}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-main)]">Ubicación destino</label>
              {cargandoUbicaciones ? (
                <p className="text-sm text-[var(--text-muted)]">Cargando ubicaciones...</p>
              ) : (
                <select
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="soft-input w-full"
                >
                  <option value="">Seleccionar ubicación...</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id} disabled={u.id === trasladando.ubicacion_id}>
                      {u.tipo}: {u.codigo} — {u.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setTrasladando(null)} className="soft-btn-secondary px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={confirmarTraslado}
                disabled={!destinoId || enviandoTraslado}
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {enviandoTraslado ? 'Trasladando...' : 'Confirmar traslado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {eliminandoInventario !== null && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="font-medium text-[var(--text-main)]">¿Eliminar este registro?</p>
            <p className="text-sm text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setEliminandoInventario(null)} className="soft-btn-secondary px-4 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={handleEliminarInventario} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
