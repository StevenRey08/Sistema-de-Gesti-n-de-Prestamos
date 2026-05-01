'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cajasApi, estantesApi } from '../../lib/api';

type TabKey = 'estantes' | 'cajas';

interface Estante {
  id: string | number;
  codigo: string;
  ubicacion?: string;
  descripcion?: string;
}

interface Caja {
  id: string | number;
  codigo: string;
  descripcion?: string;
  estante_id?: string | number | null;
  estante?: Estante;
}

const EMPTY_ESTANTE = { codigo: '', ubicacion: '', descripcion: '' };
const EMPTY_CAJA = { codigo: '', estante_id: '', descripcion: '' };

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

export default function UbicacionesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('estantes');

  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [estantesLoading, setEstantesLoading] = useState(true);
  const [estantesError, setEstantesError] = useState('');
  const [showEstanteForm, setShowEstanteForm] = useState(false);
  const [editandoEstante, setEditandoEstante] = useState<Estante | null>(null);
  const [estanteForm, setEstanteForm] = useState(EMPTY_ESTANTE);
  const [estanteErrores, setEstanteErrores] = useState<Record<string, string>>({});
  const [guardandoEstante, setGuardandoEstante] = useState(false);
  const [apiErrEstante, setApiErrEstante] = useState('');
  const [elimEstanteId, setElimEstanteId] = useState<string | number | null>(null);
  const [busquedaEstante, setBusquedaEstante] = useState('');

  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajasLoading, setCajasLoading] = useState(true);
  const [cajasError, setCajasError] = useState('');
  const [showCajaForm, setShowCajaForm] = useState(false);
  const [editandoCaja, setEditandoCaja] = useState<Caja | null>(null);
  const [cajaForm, setCajaForm] = useState(EMPTY_CAJA);
  const [cajaErrores, setCajaErrores] = useState<Record<string, string>>({});
  const [guardandoCaja, setGuardandoCaja] = useState(false);
  const [apiErrCaja, setApiErrCaja] = useState('');
  const [elimCajaId, setElimCajaId] = useState<string | number | null>(null);
  const [busquedaCaja, setBusquedaCaja] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentTab = new URLSearchParams(window.location.search).get('tab');
    setActiveTab(currentTab === 'cajas' ? 'cajas' : 'estantes');
  }, []);

  const cambiarTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/ubicaciones?tab=${tab}`);
    }
  };

  const cargarEstantes = useCallback(async () => {
    setEstantesLoading(true);
    setEstantesError('');
    try {
      setEstantes(await estantesApi.getAll() as Estante[]);
    } catch (e: unknown) {
      setEstantesError(e instanceof Error ? e.message : 'Error al cargar estantes');
    } finally {
      setEstantesLoading(false);
    }
  }, []);

  const cargarCajas = useCallback(async () => {
    setCajasLoading(true);
    setCajasError('');
    try {
      setCajas(await cajasApi.getAll() as Caja[]);
    } catch (e: unknown) {
      setCajasError(e instanceof Error ? e.message : 'Error al cargar cajas');
    } finally {
      setCajasLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarEstantes();
  }, [cargarEstantes]);

  useEffect(() => {
    void cargarCajas();
  }, [cargarCajas]);

  const estantesFiltrados = useMemo(() => {
    const term = busquedaEstante.trim().toLowerCase();
    if (!term) return estantes;

    return estantes.filter((estante) =>
      `${estante.codigo} ${estante.ubicacion ?? ''} ${estante.descripcion ?? ''}`.toLowerCase().includes(term)
    );
  }, [busquedaEstante, estantes]);

  const cajasFiltradas = useMemo(() => {
    const term = busquedaCaja.trim().toLowerCase();
    if (!term) return cajas;

    return cajas.filter((caja) =>
      `${caja.codigo} ${caja.descripcion ?? ''} ${caja.estante?.codigo ?? ''}`.toLowerCase().includes(term)
    );
  }, [busquedaCaja, cajas]);

  const nombreEstante = (id?: string | number | null) => {
    if (!id) return null;
    const estante = estantes.find((item) => String(item.id) === String(id));
    return estante ? `${estante.codigo}${estante.ubicacion ? ` — ${estante.ubicacion}` : ''}` : String(id);
  };

  function abrirNuevoEstante() {
    setEditandoEstante(null);
    setEstanteForm(EMPTY_ESTANTE);
    setEstanteErrores({});
    setApiErrEstante('');
    setShowEstanteForm(true);
  }

  function abrirEditarEstante(estante: Estante) {
    setEditandoEstante(estante);
    setEstanteForm({
      codigo: estante.codigo,
      ubicacion: estante.ubicacion ?? '',
      descripcion: estante.descripcion ?? '',
    });
    setEstanteErrores({});
    setApiErrEstante('');
    setShowEstanteForm(true);
  }

  function abrirNuevaCaja() {
    setEditandoCaja(null);
    setCajaForm(EMPTY_CAJA);
    setCajaErrores({});
    setApiErrCaja('');
    setShowCajaForm(true);
  }

  function abrirEditarCaja(caja: Caja) {
    setEditandoCaja(caja);
    setCajaForm({
      codigo: caja.codigo,
      estante_id: caja.estante_id ? String(caja.estante_id) : '',
      descripcion: caja.descripcion ?? '',
    });
    setCajaErrores({});
    setApiErrCaja('');
    setShowCajaForm(true);
  }

  function validarEstante() {
    const err: Record<string, string> = {};
    if (!estanteForm.codigo.trim()) err.codigo = 'El código es obligatorio';
    setEstanteErrores(err);
    return Object.keys(err).length === 0;
  }

  function validarCaja() {
    const err: Record<string, string> = {};
    if (!cajaForm.codigo.trim()) err.codigo = 'El código es obligatorio';
    setCajaErrores(err);
    return Object.keys(err).length === 0;
  }

  async function guardarEstante(e: React.FormEvent) {
    e.preventDefault();
    if (!validarEstante()) return;

    setGuardandoEstante(true);
    setApiErrEstante('');
    const body = {
      codigo: estanteForm.codigo.trim().toUpperCase(),
      ubicacion: estanteForm.ubicacion.trim() || null,
      descripcion: estanteForm.descripcion.trim() || null,
    };

    try {
      if (editandoEstante) await estantesApi.update(editandoEstante.id, body);
      else await estantesApi.create(body);

      setShowEstanteForm(false);
      void cargarEstantes();
      void cargarCajas();
    } catch (e: unknown) {
      setApiErrEstante(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardandoEstante(false);
    }
  }

  async function guardarCaja(e: React.FormEvent) {
    e.preventDefault();
    if (!validarCaja()) return;

    setGuardandoCaja(true);
    setApiErrCaja('');
    const body = {
      codigo: cajaForm.codigo.trim().toUpperCase(),
      estante_id: cajaForm.estante_id ? cajaForm.estante_id : null,
      descripcion: cajaForm.descripcion.trim() || null,
    };

    try {
      if (editandoCaja) await cajasApi.update(editandoCaja.id, body);
      else await cajasApi.create(body);

      setShowCajaForm(false);
      void cargarCajas();
    } catch (e: unknown) {
      setApiErrCaja(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardandoCaja(false);
    }
  }

  async function confirmarEliminarEstante() {
    if (elimEstanteId === null) return;
    try {
      await estantesApi.delete(elimEstanteId);
      void cargarEstantes();
      void cargarCajas();
    } catch (e: unknown) {
      setEstantesError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setElimEstanteId(null);
    }
  }

  async function confirmarEliminarCaja() {
    if (elimCajaId === null) return;
    try {
      await cajasApi.delete(elimCajaId);
      void cargarCajas();
    } catch (e: unknown) {
      setCajasError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setElimCajaId(null);
    }
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Ubicaciones</h1>
          <p className="page-subtitle">
            Organiza la estructura física de almacenamiento entre estantes y cajas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton
            label="Estantes"
            active={activeTab === 'estantes'}
            onClick={() => cambiarTab('estantes')}
          />
          <TabButton
            label="Cajas"
            active={activeTab === 'cajas'}
            onClick={() => cambiarTab('cajas')}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <p>Estantes registrados</p>
          <p>{estantes.length}</p>
        </div>
        <div className="stats-card">
          <p>Cajas registradas</p>
          <p>{cajas.length}</p>
        </div>
      </div>

      {activeTab === 'estantes' ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Estantes</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Define las ubicaciones principales donde se agrupan las cajas y herramientas.
              </p>
            </div>

            <button
              onClick={abrirNuevoEstante}
              className="soft-btn-primary"
            >
              + Nuevo estante
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por código o ubicación..."
              value={busquedaEstante}
              onChange={(e) => setBusquedaEstante(e.target.value)}
              className="soft-input flex-1"
            />
            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
              {estantesFiltrados.length} / {estantes.length}
            </span>
          </div>

          {estantesError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {estantesError}
            </div>
          )}

          <div className="table-shell">
            {estantesLoading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando estantes...</p>
            ) : estantesFiltrados.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">
                {busquedaEstante ? 'Sin resultados para esa búsqueda.' : 'No hay estantes registrados.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Ubicación</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estantesFiltrados.map((estante) => (
                    <tr key={estante.id}>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--accent-strong)]">
                          {estante.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{estante.ubicacion || '—'}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{estante.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => abrirEditarEstante(estante)}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setElimEstanteId(estante.id)}
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
              <h2 className="text-xl font-semibold text-[var(--text-main)]">Cajas</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Administra los contenedores que se alojan dentro de cada estante.
              </p>
            </div>

            <button
              onClick={abrirNuevaCaja}
              className="soft-btn-primary"
            >
              + Nueva caja
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por código, descripción o estante..."
              value={busquedaCaja}
              onChange={(e) => setBusquedaCaja(e.target.value)}
              className="soft-input flex-1"
            />
            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
              {cajasFiltradas.length} / {cajas.length}
            </span>
          </div>

          {cajasError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {cajasError}
            </div>
          )}

          <div className="table-shell">
            {cajasLoading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando cajas...</p>
            ) : cajasFiltradas.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">
                {busquedaCaja ? 'Sin resultados para esa búsqueda.' : 'No hay cajas registradas.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Estante asignado</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cajasFiltradas.map((caja) => (
                    <tr key={caja.id}>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--accent-strong)]">
                          {caja.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-main)]">
                        {caja.estante_id ? `🗄️ ${caja.estante?.codigo ?? nombreEstante(caja.estante_id)}` : 'Sin estante'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{caja.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => abrirEditarCaja(caja)}
                          className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setElimCajaId(caja.id)}
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

      {showEstanteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editandoEstante ? 'Editar estante' : 'Nuevo estante'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {editandoEstante ? `Modificando: ${editandoEstante.codigo}` : 'Completa los datos del estante'}
                </p>
              </div>
              <button
                onClick={() => setShowEstanteForm(false)}
                className="p-1 text-xl text-gray-500 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarEstante} className="space-y-4 px-8 pb-8 pt-5">
              {apiErrEstante && (
                <div className="rounded-xl border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                  {apiErrEstante}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Código <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={estanteForm.codigo}
                  placeholder="Ej: EST-A1"
                  onChange={(e) => setEstanteForm((prev) => ({ ...prev, codigo: e.target.value }))}
                  className={`w-full rounded-xl border bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    estanteErrores.codigo ? 'border-red-500 bg-red-950/20' : 'border-gray-700'
                  }`}
                />
                {estanteErrores.codigo && <p className="ml-1 text-xs text-red-400">{estanteErrores.codigo}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">Ubicación</label>
                <input
                  type="text"
                  value={estanteForm.ubicacion}
                  placeholder="Ej: Depósito planta baja"
                  onChange={(e) => setEstanteForm((prev) => ({ ...prev, ubicacion: e.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                <textarea
                  rows={3}
                  value={estanteForm.descripcion}
                  placeholder="Detalles adicionales..."
                  onChange={(e) => setEstanteForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEstanteForm(false)}
                  className="px-5 py-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEstante}
                  className="rounded-xl bg-blue-600 px-8 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {guardandoEstante ? 'Guardando...' : editandoEstante ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCajaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-8 pt-7 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editandoCaja ? 'Editar caja' : 'Nueva caja'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {editandoCaja ? `Modificando: ${editandoCaja.codigo}` : 'Completa los datos de la caja'}
                </p>
              </div>
              <button
                onClick={() => setShowCajaForm(false)}
                className="p-1 text-xl text-gray-500 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCaja} className="space-y-4 px-8 pb-8 pt-5">
              {apiErrCaja && (
                <div className="rounded-xl border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                  {apiErrCaja}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Código <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cajaForm.codigo}
                  placeholder="Ej: CAJA-A1-01"
                  onChange={(e) => setCajaForm((prev) => ({ ...prev, codigo: e.target.value }))}
                  className={`w-full rounded-xl border bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    cajaErrores.codigo ? 'border-red-500 bg-red-950/20' : 'border-gray-700'
                  }`}
                />
                {cajaErrores.codigo && <p className="ml-1 text-xs text-red-400">{cajaErrores.codigo}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">Estante</label>
                {estantes.length === 0 ? (
                  <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 px-4 py-3 text-xs text-yellow-400">
                    No hay estantes creados. Registra un estante primero.
                  </div>
                ) : (
                  <select
                    value={cajaForm.estante_id}
                    onChange={(e) => setCajaForm((prev) => ({ ...prev, estante_id: e.target.value }))}
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Sin estante asignado —</option>
                    {estantes.map((estante) => (
                      <option key={estante.id} value={estante.id}>
                        {estante.codigo}{estante.ubicacion ? ` — ${estante.ubicacion}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                <textarea
                  rows={3}
                  value={cajaForm.descripcion}
                  placeholder="Detalles adicionales de la caja..."
                  onChange={(e) => setCajaForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCajaForm(false)}
                  className="px-5 py-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCaja}
                  className="rounded-xl bg-blue-600 px-8 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {guardandoCaja ? 'Guardando...' : editandoCaja ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {elimEstanteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-700/30 bg-red-900/20 text-3xl">
              🗑️
            </div>
            <div>
              <p className="text-lg font-bold text-white">¿Eliminar este estante?</p>
              <p className="mt-2 text-sm text-gray-400">
                Las cajas asociadas quedarán sin estante asignado. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setElimEstanteId(null)}
                className="flex-1 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarEstante}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-500"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {elimCajaId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-700/30 bg-red-900/20 text-3xl">
              🗑️
            </div>
            <div>
              <p className="text-lg font-bold text-white">¿Eliminar esta caja?</p>
              <p className="mt-2 text-sm text-gray-400">
                El inventario dentro quedará sin ubicación asignada. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setElimCajaId(null)}
                className="flex-1 rounded-xl border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarCaja}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-500"
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
