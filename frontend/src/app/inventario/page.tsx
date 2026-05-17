'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { inventarioApi, categoriasApi, imagenUrl } from '../../lib/api';
import InventarioForm from '../../components/catalogos/InventarioForm';
import SalidaForm from '../../components/catalogos/SalidaForm';
import PrestamoMultipleForm from '../../components/catalogos/PrestamoMultipleForm';
import type { InventarioPayload, ItemInventario, Categoria } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { usePermiso } from '../../lib/permissions';
import { notifyErrorPayload } from '../../lib/errors';
import { useAuth } from '../../components/auth/AuthProvider';

const ESTADOS = ['todos', 'DISPONIBLE', 'DANADO', 'SIN_STOCK'];

export default function InventarioPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('INVENTARIO');
  const { user } = useAuth();
  const puedeSalida = user?.permisos?.MOVIMIENTOS?.ingresar ?? false;
  const puedePrestamo = user?.permisos?.PRESTAMOS?.ingresar ?? false;

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<ItemInventario | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [showSalida, setShowSalida] = useState(false);
  const [salidaItem, setSalidaItem] = useState<ItemInventario | null>(null);
  const [showPrestamo, setShowPrestamo] = useState(false);
  const [prestamoItem, setPrestamoItem] = useState<ItemInventario | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        inventarioApi.getAll() as Promise<ItemInventario[]>,
        categoriasApi.getAll() as Promise<Categoria[]>
      ]);
      setItems(itemsData);
      setCategorias(catsData);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar inventario');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filtroEstado === 'DISPONIBLE' && item.cantidad_disponible <= 0) return false;
      if (filtroEstado === 'DANADO' && item.cantidad_danada <= 0) return false;
      if (filtroEstado === 'SIN_STOCK' && item.cantidad_disponible > 0) return false;
      if (filtroCategoria && item.categoria_id !== filtroCategoria) return false;
      if (!term) return true;
      return `${item.nombre} ${item.codigo}`.toLowerCase().includes(term);
    });
  }, [search, filtroEstado, filtroCategoria, items]);

  async function handleGuardar(form: InventarioPayload | FormData) {
    if (editando) await inventarioApi.update(editando.id, form);
    else await inventarioApi.create(form);
    setShowForm(false);
    setEditando(null);
    cargar();
  }

  async function handleEliminar() {
    try {
      if (eliminando) await inventarioApi.delete(eliminando);
      setEliminando(null);
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al eliminar');
      notify('error', message, details);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{items.length} registros</p>
        </div>
        {puedeIngresar && (
          <button onClick={() => { setEditando(null); setShowForm(true); }} className="soft-btn-primary">
            + Agregar existencia
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stats-card"><p>Total artículos</p><p>{items.length}</p></div>
        <div className="stats-card"><p>Stock disponible</p><p>{items.reduce((s, i) => s + i.cantidad_disponible, 0)}</p></div>
        <div className="stats-card"><p>En uso</p><p>{items.reduce((s, i) => s + i.en_uso, 0)}</p></div>
        <div className="stats-card"><p>Dañados</p><p>{items.reduce((s, i) => s + i.cantidad_danada, 0)}</p></div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <input type="search" placeholder="Buscar..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="soft-input max-w-md" />
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="soft-select max-w-xs">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap items-center">
            {ESTADOS.map((e) => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                className={`filter-pill ${filtroEstado === e ? 'active' : ''}`}>
                {e === 'todos' ? 'Todos' : e === 'DISPONIBLE' ? 'Disponible' : e === 'DANADO' ? 'Dañado' : 'Sin Stock'}
              </button>
            ))}
          </div>
        </div>

        <div className="table-shell">
          {loading ? (
            <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p className="py-12 text-center text-[var(--text-muted)]">No hay resultados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtrados.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow-soft)]">
                  <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-3)] text-sm text-[var(--text-muted)]">
                    {item.imagen_ruta ? (
                      <img src={imagenUrl(item.imagen_ruta)} alt={item.nombre} className="h-full w-full object-contain" />
                    ) : 'Sin imagen'}
                  </div>
                  <div className="space-y-2 p-3">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-main)] truncate">{item.nombre}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{item.codigo}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">Total: {item.cantidad_total}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">Bueno: {item.cantidad_disponible}</span>
                      {item.en_uso > 0 && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">En uso: {item.en_uso}</span>
                      )}
                      {item.cantidad_danada > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">Dañado: {item.cantidad_danada}</span>
                      )}
                    </div>
                    {item.categoria && (
                      <p className="text-[10px] text-[var(--text-muted)]">{item.categoria.nombre}</p>
                    )}
                    {item.cantidad_disponible <= item.stock_minimo && (
                      <p className="text-[10px] font-bold text-red-500">⚠ Stock bajo (mín: {item.stock_minimo})</p>
                    )}
                    <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2">
                      {puedeActualizar && (
                        <button onClick={() => { setEditando(item); setShowForm(true); }}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]">Editar</button>
                      )}
                      {puedePrestamo && (
                        <button onClick={() => { setPrestamoItem(item); setShowPrestamo(true); }}
                          className="text-xs font-medium text-[var(--warning)] hover:opacity-80">Préstamo</button>
                      )}
                      {puedeSalida && (
                        <button onClick={() => { setSalidaItem(item); setShowSalida(true); }}
                          className="text-xs font-medium text-[var(--danger)] hover:opacity-80">Salida</button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => setEliminando(item.id)}
                          className="ml-auto text-xs font-medium text-[var(--danger)] hover:opacity-80">Eliminar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">
              {editando ? 'Editar' : 'Agregar existencia'}
            </h2>
            <InventarioForm item={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }} />
          </div>
        </div>
      )}

      {eliminando && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="font-medium text-[var(--text-main)]">¿Eliminar este registro?</p>
            <p className="text-sm text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setEliminando(null)} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
              <button onClick={handleEliminar} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showSalida && salidaItem && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg p-0">
            <SalidaForm
              item={salidaItem}
              onSuccess={() => { setShowSalida(false); setSalidaItem(null); cargar(); }}
              onCancelar={() => { setShowSalida(false); setSalidaItem(null); }}
            />
          </div>
        </div>
      )}

      {showPrestamo && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-0">
            <PrestamoMultipleForm
              itemInicial={prestamoItem}
              onSuccess={() => { setShowPrestamo(false); setPrestamoItem(null); cargar(); }}
              onCancelar={() => { setShowPrestamo(false); setPrestamoItem(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
