'use client';
import React, { useState, useEffect } from 'react';
import { inventarioApi, personasApi } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import FilterableSelect from '../ui/FilterableSelect';
import type { Prestamo, PrestamoPayload, EstadoPrestamo, ItemInventario, Persona, FormErrors } from '../../lib/types';

const ESTADOS: EstadoPrestamo[] = ['PENDIENTE', 'DEVUELTO'];

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
  const { user } = useAuth();
  
  const [form, setForm] = useState<PrestamoFormState>({
    inventario_id: prestamo?.inventario_id ? String(prestamo.inventario_id) : '',
    persona_id: prestamo?.persona_id ? String(prestamo.persona_id) : '',
    cantidad: prestamo?.cantidad || 1,
    fecha_devolucion: prestamo?.fecha_devolucion ? prestamo.fecha_devolucion.split('T')[0] : '',
    estado: prestamo?.estado || 'PENDIENTE',
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof PrestamoFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<PrestamoFormState> = {};
    if (!form.inventario_id) e.inventario_id = 'Selecciona el artículo';
    if (!form.persona_id) e.persona_id = 'Selecciona el responsable';
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setApiError('');
    
    const body: PrestamoPayload = {
      inventario_id: form.inventario_id,
      persona_id: form.persona_id,
      usuario_id: user?.id || '', // Asignar el usuario actual
      cantidad: Number(form.cantidad),
      fecha_devolucion: form.fecha_devolucion || null,
      estado: form.estado,
      observaciones: form.observaciones.trim() || undefined,
    };

    try {
      await onGuardar(body);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{apiError}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilterableSelect
          label="Artículo (inventario) *"
          value={form.inventario_id}
          onChange={(value) => setForm((prev) => ({ ...prev, inventario_id: value }))}
          options={inventario.map((item) => ({
            value: item.id,
            label: `${item.nombre} (${item.cantidad} disp.)`,
            searchText: `${item.codigo} ${item.estado ?? ''}`,
          }))}
          placeholder="Buscar artículo..."
          emptyLabel="Sin artículos coincidentes"
          error={errores.inventario_id}
        />
        <FilterableSelect
          label="Responsable *"
          value={form.persona_id}
          onChange={(value) => setForm((prev) => ({ ...prev, persona_id: value }))}
          options={personas.map((persona) => ({
            value: persona.id,
            label: `${persona.nombres} ${persona.apellidos}`,
            searchText: `${persona.numero_documento} ${persona.email ?? ''}`,
          }))}
          placeholder="Buscar responsable..."
          emptyLabel="Sin personas coincidentes"
          error={errores.persona_id}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Cantidad *</label>
          <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={1} className={`soft-input ${errores.cantidad ? 'border-red-400' : ''}`} />
          {errores.cantidad && <p className="mt-1 text-xs text-red-500">{errores.cantidad}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Fecha devolución</label>
          <input type="date" name="fecha_devolucion" value={form.fecha_devolucion} onChange={handleChange} className="soft-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="soft-select">
            {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Observaciones</label>
        <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} placeholder="Notas adicionales sobre el préstamo..." className="soft-textarea" />
      </div>

      <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : prestamo ? 'Actualizar' : 'Registrar préstamo'}
        </button>
      </div>
    </form>
  );
}
