'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { herramientasApi, inventarioApi } from '../../lib/api';
import HerramientaForm from '../../components/catalogos/HerramientaForm';
import InventarioForm from '../../components/catalogos/InventarioForm';
import type { Herramienta, HerramientaPayload, InventarioPayload, ItemInventario } from '../../lib/types';

type TabKey = 'herramientas' | 'existencias';

const BADGE: Record<string, string> = {
  Nuevo: 'bg-green-900 text-green-300',
  Usado: 'bg-yellow-900 text-yellow-300',
  Dañado: 'bg-red-900 text-red-300',
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="mt-1 text-sm text-gray-400">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Herramientas registradas</p>
          <p className="mt-2 text-3xl font-bold text-white">{herramientas.length}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-sm text-gray-400">Registros en inventario</p>
          <p className="mt-2 text-3xl font-bold text-white">{items.length}</p>
        </div>
      </div>

      {activeTab === 'herramientas' ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Catálogo de herramientas</h2>
              <p className="mt-1 text-sm text-gray-400">
                Define las herramientas base que luego se convierten en existencias.
              </p>
            </div>

            <button
              onClick={() => {
                setEditandoHerramienta(null);
                setShowHerramientaForm(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Nueva herramienta
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar herramienta..."
            value={herramientasSearch}
            onChange={(e) => setHerramientasSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {herramientasError && (
            <div className="rounded-lg border border-red-700 bg-red-900 px-4 py-3 text-sm text-red-300">
              {herramientasError}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            {herramientasLoading ? (
              <p className="py-12 text-center text-gray-400">Cargando...</p>
            ) : herramientas.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No hay herramientas registradas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Valor estimado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {herramientas.map((herramienta) => (
                    <tr key={herramienta.id} className="text-gray-300 transition-colors hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-mono text-xs text-yellow-400">{herramienta.codigo}</td>
                      <td className="px-4 py-3 font-medium text-white">{herramienta.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">{herramienta.categoria?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{herramienta.proveedor?.nombre_empresa || '—'}</td>
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
                          className="text-xs font-medium text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminandoHerramienta(herramienta.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-300"
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
              <h2 className="text-xl font-bold text-white">Existencias en inventario</h2>
              <p className="mt-1 text-sm text-gray-400">
                Controla cantidades, estado y ubicación física de cada herramienta.
              </p>
            </div>

            <button
              onClick={() => {
                setEditandoInventario(null);
                setShowInventarioForm(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              + Agregar existencia
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar por herramienta, estado o ubicación..."
            value={inventarioSearch}
            onChange={(e) => setInventarioSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {inventarioError && (
            <div className="rounded-lg border border-red-700 bg-red-900 px-4 py-3 text-sm text-red-300">
              {inventarioError}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            {inventarioLoading ? (
              <p className="py-12 text-center text-gray-400">Cargando...</p>
            ) : inventarioFiltrado.length === 0 ? (
              <p className="py-12 text-center text-gray-500">
                {inventarioSearch ? 'No hay resultados para esa búsqueda.' : 'No hay registros en el inventario.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Herramienta</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Cantidad</th>
                    <th className="px-4 py-3 text-left">Ubicación</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {inventarioFiltrado.map((item) => (
                    <tr key={item.id} className="text-gray-300 transition-colors hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{item.herramienta?.nombre || '—'}</p>
                        <p className="text-xs text-gray-500">{item.herramienta?.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${BADGE[item.estado] || 'bg-gray-700 text-gray-300'}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{item.cantidad}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {item.caja ? `Caja: ${item.caja.codigo}` : item.estante ? `Estante: ${item.estante.codigo}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditandoInventario(item);
                            setShowInventarioForm(true);
                          }}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminandoInventario(item.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-300"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
            <p className="font-medium text-white">¿Eliminar esta herramienta?</p>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setEliminandoHerramienta(null)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarHerramienta}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {eliminandoInventario !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl">
            <p className="font-medium text-white">¿Eliminar este registro?</p>
            <p className="text-sm text-gray-400">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setEliminandoInventario(null)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarInventario}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
