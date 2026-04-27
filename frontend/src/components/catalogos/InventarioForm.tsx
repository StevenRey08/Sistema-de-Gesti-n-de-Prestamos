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
    estado:         item?.estado         || 'Nuevo',
    cantidad:       item?.cantidad       || 1,
    ubicacion_tipo: item?.caja_id ? 'caja' : 'estante',
    caja_id:        item?.caja_id        ? String(item.caja_id) : '',
    estante_id:     item?.estante_id     ? String(item.estante_id) : '',
  });
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [estantes, setEstantes]         = useState<Estante[]>([]);
  const [cajas, setCajas]               = useState<Caja[]>([]);
  const [errores, setErrores]           = useState<FormErrors<InventarioFormState>>({});
  const [cargando, setCargando]         = useState(false);
  const [apiError, setApiError]         = useState('');

  useEffect(() => {
    herramientasApi.getAll().then((d) => setHerramientas(d as Herramienta[]));
    estantesApi.getAll().then((d)     => setEstantes(d as Estante[]));
    cajasApi.getAll().then((d)        => setCajas(d as Caja[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name as keyof InventarioFormState]) setErrores(prev => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<InventarioFormState> = {};
    if (!form.herramienta_id) e.herramienta_id = 'Selecciona una herramienta';
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    if (form.ubicacion_tipo === 'caja'    && !form.caja_id)    e.caja_id    = 'Selecciona una caja';
    if (form.ubicacion_tipo === 'estante' && !form.estante_id) e.estante_id = 'Selecciona un estante';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true); setApiError('');
    const body: InventarioPayload = {
      herramienta_id: Number(form.herramienta_id),
      estado:         form.estado,
      cantidad:       Number(form.cantidad),
      caja_id:        form.ubicacion_tipo === 'caja'    ? Number(form.caja_id)    : null,
      estante_id:     form.ubicacion_tipo === 'estante' ? Number(form.estante_id) : null,
    };
    try { await onGuardar(body); }
    catch (err: unknown) { setApiError(err instanceof Error ? err.message : 'Error'); }
    finally { setCargando(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">{apiError}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Herramienta *</label>
          <select name="herramienta_id" value={form.herramienta_id} onChange={handleChange}
            className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errores.herramienta_id ? 'border-red-500' : 'border-gray-600'}`}>
            <option value="">— Seleccionar herramienta —</option>
            {herramientas.map((h) => <option key={h.id} value={h.id}>{h.codigo} — {h.nombre}</option>)}
          </select>
          {errores.herramienta_id && <p className="text-xs text-red-400 mt-1">{errores.herramienta_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange}
            className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ESTADOS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
        <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={1}
          className={`w-32 rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errores.cantidad ? 'border-red-500' : 'border-gray-600'}`} />
        {errores.cantidad && <p className="text-xs text-red-400 mt-1">{errores.cantidad}</p>}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Ubicación *</label>
        <div className="flex gap-4">
          {(['estante', 'caja'] as const).map(tipo => (
            <label key={tipo} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="ubicacion_tipo" value={tipo}
                checked={form.ubicacion_tipo === tipo} onChange={handleChange}
                className="accent-blue-500" />
              <span className="text-sm text-gray-300 capitalize">{tipo}</span>
            </label>
          ))}
        </div>
        {form.ubicacion_tipo === 'estante' ? (
          <div>
            <select name="estante_id" value={form.estante_id} onChange={handleChange}
              className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errores.estante_id ? 'border-red-500' : 'border-gray-600'}`}>
              <option value="">— Seleccionar estante —</option>
              {estantes.map((e) => <option key={e.id} value={e.id}>{e.codigo} — {e.ubicacion}</option>)}
            </select>
            {errores.estante_id && <p className="text-xs text-red-400 mt-1">{errores.estante_id}</p>}
          </div>
        ) : (
          <div>
            <select name="caja_id" value={form.caja_id} onChange={handleChange}
              className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errores.caja_id ? 'border-red-500' : 'border-gray-600'}`}>
              <option value="">— Seleccionar caja —</option>
              {cajas.map((c) => <option key={c.id} value={c.id}>{c.codigo}</option>)}
            </select>
            {errores.caja_id && <p className="text-xs text-red-400 mt-1">{errores.caja_id}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
          {cargando ? 'Guardando...' : item ? 'Actualizar' : 'Agregar al inventario'}
        </button>
      </div>
    </form>
  );
}
