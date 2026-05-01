'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { herramientasApi, inventarioApi } from '../../lib/api';
import HerramientaForm from '../../components/catalogos/HerramientaForm';
import InventarioForm from '../../components/catalogos/InventarioForm';
import type { Herramienta, HerramientaPayload, InventarioPayload, ItemInventario } from '../../lib/types';

type TabKey = 'herramientas' | 'existencias';

const BADGE: Record<string, string> = {
  Nuevo: 'status-badge status-success',
  Usado: 'status-badge status-warning',
  Dañado: 'status-badge status-danger',
};

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('existencias');

  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [herramientasSearch, setHerramientasSearch] = useState('');
  const [herramientasLoading, setHerramientasLoading] = useState(true);
  const [herramientasError, setHerramientasError] = useState('');
  const [showHerramientaForm, setShowHerramientaForm] = useState(false);
  const [editandoHerramienta, setEditandoHerramienta] = useState<Herramienta | null>(null);
  const [eliminandoHerramienta, setEliminandoHerramienta] = useState<number | null>(null);

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [inventarioSearch, setInventarioSearch] = useState('');
  const [inventarioLoading, setInventarioLoading] = useState(true);
  const [inventarioError, setInventarioError] = useState('');
  const [showInventarioForm, setShowInventarioForm] = useState(false);
  const [editandoInventario, setEditandoInventario] = useState<ItemInventario | null>(null);
  const [eliminandoInventario, setEliminandoInventario] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentTab = new URLSearchParams(window.location.search).get('tab');
    setActiveTab(currentTab === 'herramientas' ? 'herramientas' : 'existencias');
  }, []);

  const cambiarTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/inventario?tab=${tab}`);
    }
  };

  const cargarHerramientas = useCallback(async () => {
    setHerramientasLoading(true);
    setHerramientasError('');
    try {
      setHerramientas(await herramientasApi.getAll(herramientasSearch) as Herramienta[]);
    } catch (e: unknown) {
      setHerramientasError(e instanceof Error ? e.message : 'Error al cargar herramientas');
    } finally {
      setHerramientasLoading(false);
    }
  }, [herramientasSearch]);

  const cargarInventario = useCallback(async () => {
    setInventarioLoading(true);
    setInventarioError('');
    try {
      setItems(await inventarioApi.getAll() as ItemInventario[]);
    } catch (e: unknown) {
      setInventarioError(e instanceof Error ? e.message : 'Error al cargar inventario');
    } finally {
      setInventarioLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarHerramientas();
  }, [cargarHerramientas]);

  useEffect(() => {
    void cargarInventario();
  }, [cargarInventario]);

  const inventarioFiltrado = useMemo(() => {
    const term = inventarioSearch.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const texto = [
        item.herramienta?.nombre,
        item.herramienta?.codigo,
        item.estado,
        item.caja?.codigo,
        item.estante?.codigo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return texto.includes(term);
    });
  }, [inventarioSearch, items]);

  async function handleGuardarHerramienta(form: HerramientaPayload) {
    if (editandoHerramienta) await herramientasApi.update(editandoHerramienta.id, form);
    else await herramientasApi.create(form);

    setShowHerramientaForm(false);
    setEditandoHerramienta(null);
    void cargarHerramientas();
  }

  async function handleEliminarHerramienta() {
    if (eliminandoHerramienta !== null) await herramientasApi.delete(eliminandoHerramienta);
    setEliminandoHerramienta(null);
    void cargarHerramientas();
  }

  async function handleGuardarInventario(form: InventarioPayload) {
    if (editandoInventario) await inventarioApi.update(editandoInventario.id, form);
    else await inventarioApi.create(form);

    setShowInventarioForm(false);
    setEditandoInventario(null);
    void cargarInventario();
  }

  async function handleEliminarInventario() {
    if (eliminandoInventario !== null) await inventarioApi.delete(eliminandoInventario);
    setEliminandoInventario(null);
    void cargarInventario();
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">
            Administra el catálogo de herramientas y sus existencias desde un mismo módulo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton
            label="Herramientas"
            active={activeTab === 'herramientas'}
            onClick={() => cambiarTab('herramientas')}
          />
          <TabButton
            label="Existencias"
            active={activeTab === 'existencias'}
            onClick={() => cambiarTab('existencias')}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <p>Herramientas registradas</p>
          <p>{herramientas.length}</p>
        </div>
        <div className="stats-card">
          <p>Registros en inventario</p>
          <p>{items.length}</p>
        </div>
      </div>

      {activeTab === 'herramientas' ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Catálogo de herramientas</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Define las herramientas base que luego se convierten en existencias.
              </p>
            </div>

            <button
              onClick={() => {
                setEditandoHerramienta(null);
                setShowHerramientaForm(true);
              }}
              className="soft-btn-primary"
            >
              + Nueva herramienta
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar herramienta..."
            value={herramientasSearch}
            onChange={(e) => setHerramientasSearch(e.target.value)}
            className="soft-input max-w-sm"
          />

          {herramientasError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {herramientasError}
            </div>
          )}

          <div className="table-shell">
            {herramientasLoading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
            ) : herramientas.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">No hay herramientas registradas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Valor estimado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {herramientas.map((herramienta) => (
                    <tr key={herramienta.id}>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--accent-strong)]">{herramienta.codigo}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{herramienta.nombre}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{herramienta.categoria?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{herramienta.proveedor?.nombre_empresa || '—'}</td>
                      <td className="px-4 py-3">
                        {herramienta.valor_estimado
                          ? `RD$ ${Number(herramienta.valor_estimado).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditandoHerramienta(herramienta);
                            setShowHerramientaForm(true);
                          }}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminandoHerramienta(herramienta.id)}
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
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Existencias en inventario</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Controla cantidades, estado y ubicación física de cada herramienta.
              </p>
            </div>

            <button
              onClick={() => {
                setEditandoInventario(null);
                setShowInventarioForm(true);
              }}
              className="soft-btn-primary"
            >
              + Agregar existencia
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar por herramienta, estado o ubicación..."
            value={inventarioSearch}
            onChange={(e) => setInventarioSearch(e.target.value)}
            className="soft-input max-w-md"
          />

          {inventarioError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {inventarioError}
            </div>
          )}

          <div className="table-shell">
            {inventarioLoading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
            ) : inventarioFiltrado.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">
                {inventarioSearch ? 'No hay resultados para esa búsqueda.' : 'No hay registros en el inventario.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Herramienta</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Cantidad</th>
                    <th className="px-4 py-3 text-left">Ubicación</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-main)]">{item.herramienta?.nombre || '—'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.herramienta?.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={BADGE[item.estado] || 'status-badge status-info'}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--accent-strong)]">{item.cantidad}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {item.caja ? `Caja: ${item.caja.codigo}` : item.estante ? `Estante: ${item.estante.codigo}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditandoInventario(item);
                            setShowInventarioForm(true);
                          }}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminandoInventario(item.id)}
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
        </section>
      )}

      {showHerramientaForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">
              {editandoHerramienta ? 'Editar herramienta' : 'Nueva herramienta'}
            </h2>
            <HerramientaForm
              herramienta={editandoHerramienta}
              onGuardar={handleGuardarHerramienta}
              onCancelar={() => {
                setShowHerramientaForm(false);
                setEditandoHerramienta(null);
              }}
            />
          </div>
        </div>
      )}

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

      {eliminandoHerramienta !== null && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="font-medium text-[var(--text-main)]">¿Eliminar esta herramienta?</p>
            <p className="text-sm text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setEliminandoHerramienta(null)} className="soft-btn-secondary px-4 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={handleEliminarHerramienta} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Sí, eliminar
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
