'use client';
import { useState, useEffect } from 'react';
import { herramientasApi, estantesApi, cajasApi } from '../../lib/api';
import type { ItemInventario, InventarioPayload, EstadoInventario, Herramienta, Estante, Caja, FormErrors } from '../../lib/types';

const ESTADOS: EstadoInventario[] = ['Nuevo', 'Usado', 'Dañado'];

interface InventarioFormProps {
  item?: ItemInventario | null;
  onGuardar: (form: InventarioPayload) => Promise<void>;
  onCancelar: () => void;
}

interface InventarioFormState {
  herramienta_id: string;
  estado: EstadoInventario;
  cantidad: number | string;
  ubicacion_tipo: 'caja' | 'estante';
  caja_id: string;
  estante_id: string;
}

export default function InventarioForm({ item = null, onGuardar, onCancelar }: InventarioFormProps) {
  const [form, setForm] = useState<InventarioFormState>({
    herramienta_id: item?.herramienta_id ? String(item.herramienta_id) : '',
    estado: item?.estado || 'Nuevo',
    cantidad: item?.cantidad || 1,
    ubicacion_tipo: item?.caja_id ? 'caja' : 'estante',
    caja_id: item?.caja_id ? String(item.caja_id) : '',
    estante_id: item?.estante_id ? String(item.estante_id) : '',
  });
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [errores, setErrores] = useState<FormErrors<InventarioFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    herramientasApi.getAll().then((d) => setHerramientas(d as Herramienta[]));
    estantesApi.getAll().then((d) => setEstantes(d as Estante[]));
    cajasApi.getAll().then((d) => setCajas(d as Caja[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof InventarioFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<InventarioFormState> = {};
    if (!form.herramienta_id) e.herramienta_id = 'Selecciona una herramienta';
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    if (form.ubicacion_tipo === 'caja' && !form.caja_id) e.caja_id = 'Selecciona una caja';
    if (form.ubicacion_tipo === 'estante' && !form.estante_id) e.estante_id = 'Selecciona un estante';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setApiError('');
    const body: InventarioPayload = {
      herramienta_id: Number(form.herramienta_id),
      estado: form.estado,
      cantidad: Number(form.cantidad),
      caja_id: form.ubicacion_tipo === 'caja' ? Number(form.caja_id) : null,
      estante_id: form.ubicacion_tipo === 'estante' ? Number(form.estante_id) : null,
    };
    try {
      await onGuardar(body);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{apiError}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Herramienta *</label>
          <select name="herramienta_id" value={form.herramienta_id} onChange={handleChange} className={`soft-select ${errores.herramienta_id ? 'border-red-400' : ''}`}>
            <option value="">— Seleccionar herramienta —</option>
            {herramientas.map((h) => <option key={h.id} value={h.id}>{h.codigo} — {h.nombre}</option>)}
          </select>
          {errores.herramienta_id && <p className="mt-1 text-xs text-red-500">{errores.herramienta_id}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="soft-select">
            {ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Cantidad *</label>
        <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={1} className={`soft-input w-32 ${errores.cantidad ? 'border-red-400' : ''}`} />
        {errores.cantidad && <p className="mt-1 text-xs text-red-500">{errores.cantidad}</p>}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--text-main)]">Ubicación *</label>
        <div className="flex gap-4">
          {(['estante', 'caja'] as const).map((tipo) => (
            <label key={tipo} className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2">
              <input type="radio" name="ubicacion_tipo" value={tipo} checked={form.ubicacion_tipo === tipo} onChange={handleChange} className="accent-[var(--accent-strong)]" />
              <span className="text-sm capitalize text-[var(--text-muted)]">{tipo}</span>
            </label>
          ))}
        </div>

        {form.ubicacion_tipo === 'estante' ? (
          <div>
            <select name="estante_id" value={form.estante_id} onChange={handleChange} className={`soft-select ${errores.estante_id ? 'border-red-400' : ''}`}>
              <option value="">— Seleccionar estante —</option>
              {estantes.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.ubicacion}</option>)}
            </select>
            {errores.estante_id && <p className="mt-1 text-xs text-red-500">{errores.estante_id}</p>}
          </div>
        ) : (
          <div>
            <select name="caja_id" value={form.caja_id} onChange={handleChange} className={`soft-select ${errores.caja_id ? 'border-red-400' : ''}`}>
              <option value="">— Seleccionar caja —</option>
              {cajas.map((c) => <option key={c.id} value={c.id}>{c.codigo}</option>)}
            </select>
            {errores.caja_id && <p className="mt-1 text-xs text-red-500">{errores.caja_id}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : item ? 'Actualizar' : 'Agregar al inventario'}
        </button>
      </div>
    </form>
  );
}
