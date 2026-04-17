'use client';
import { useState, useEffect } from 'react';
import { inventarioApi, personasApi } from '../../lib/api';
import type { Prestamo, PrestamoPayload, EstadoPrestamo, ItemInventario, Persona, FormErrors } from '../../lib/types';

const ESTADOS: EstadoPrestamo[] = ['Pendiente', 'Devuelto'];

interface PrestamoFormProps {
  prestamo?: Prestamo | null;
  onGuardar: (form: PrestamoPayload) => Promise<void>;
  onCancelar: () => void;
}

interface PrestamoFormState {
  inventario_id: string;
  persona_id: string;
  cantidad: number | string;
  fecha_devolucion: string;
  estado: EstadoPrestamo;
  observaciones: string;
}

export default function PrestamoForm({ prestamo = null, onGuardar, onCancelar }: PrestamoFormProps) {
  const [form, setForm] = useState<PrestamoFormState>({
    inventario_id: prestamo?.inventario_id ? String(prestamo.inventario_id) : '',
    persona_id: prestamo?.persona_id ? String(prestamo.persona_id) : '',
    cantidad: prestamo?.cantidad || 1,
    fecha_devolucion: prestamo?.fecha_devolucion ? prestamo.fecha_devolucion.split('T')[0] : '',
    estado: prestamo?.estado || 'Pendiente',
    observaciones: prestamo?.observaciones || '',
  });
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [errores, setErrores] = useState<FormErrors<PrestamoFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    inventarioApi.getAll().then((d) => setInventario(d as ItemInventario[]));
    personasApi.getAll().then((d) => setPersonas(d as Persona[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name as keyof PrestamoFormState]) setErrores(prev => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<PrestamoFormState> = {};
    if (!form.inventario_id) e.inventario_id = 'Selecciona la herramienta';
    if (!form.persona_id) e.persona_id = 'Selecciona la persona';
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true); setApiError('');
    const body: PrestamoPayload = {
      ...form,
      inventario_id: Number(form.inventario_id),
      persona_id: Number(form.persona_id),
      cantidad: Number(form.cantidad),
      fecha_devolucion: form.fecha_devolucion || null,
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Herramienta (inventario) *</label>
          <select name="inventario_id" value={form.inventario_id} onChange={handleChange}
            className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errores.inventario_id ? 'border-red-500' : 'border-gray-600'}`}>
            <option value="">— Seleccionar —</option>
            {inventario.map((i) => (
              <option key={i.id} value={i.id}>
                {i.herramienta?.nombre || i.id} ({i.cantidad} disp.)
              </option>
            ))}
          </select>
          {errores.inventario_id && <p className="text-xs text-red-400 mt-1">{errores.inventario_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Persona *</label>
          <select name="persona_id" value={form.persona_id} onChange={handleChange}
            className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errores.persona_id ? 'border-red-500' : 'border-gray-600'}`}>
            <option value="">— Seleccionar —</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
            ))}
          </select>
          {errores.persona_id && <p className="text-xs text-red-400 mt-1">{errores.persona_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cantidad *</label>
          <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={1}
            className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errores.cantidad ? 'border-red-500' : 'border-gray-600'}`} />
          {errores.cantidad && <p className="text-xs text-red-400 mt-1">{errores.cantidad}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Fecha devolución</label>
          <input type="date" name="fecha_devolucion" value={form.fecha_devolucion} onChange={handleChange}
            className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        <label className="block text-sm font-medium text-gray-300 mb-1">Observaciones</label>
        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2}
          placeholder="Notas adicionales sobre el préstamo..."
          className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
          {cargando ? 'Guardando...' : prestamo ? 'Actualizar' : 'Registrar préstamo'}
        </button>
      </div>
    </form>
  );
}
