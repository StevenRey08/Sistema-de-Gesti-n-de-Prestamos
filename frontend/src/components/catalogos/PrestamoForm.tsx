'use client';
import React, { useState, useEffect } from 'react';
import { inventarioApi, personasApi, descargarPDFPrestamo } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import FilterableSelect from '../ui/FilterableSelect';
import type { Prestamo, PrestamoPayload, EstadoPrestamo, ItemInventario, Persona, FormErrors } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

const ESTADOS: EstadoPrestamo[] = ['ACTIVO', 'DEVUELTO', 'VENCIDO', 'PENDIENTE'];

interface PrestamoFormProps {
  prestamo?: Prestamo | null;
  onGuardar: (form: PrestamoPayload) => Promise<void>;
  onCancelar: () => void;
}

interface PrestamoFormState {
  inventario_id: string;
  persona_id: string;
  instructor_id: string;
  cantidad: number | string;
  fecha_devolucion: string;
  estado: EstadoPrestamo;
  observaciones: string;
}

export default function PrestamoForm({ prestamo = null, onGuardar, onCancelar }: PrestamoFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();

  const [form, setForm] = useState<PrestamoFormState>({
    inventario_id: prestamo?.inventario_id ? String(prestamo.inventario_id) : '',
    persona_id: prestamo?.persona_id ? String(prestamo.persona_id) : '',
    instructor_id: prestamo?.instructor_id ? String(prestamo.instructor_id) : '',
    cantidad: prestamo?.cantidad || 1,
    fecha_devolucion: prestamo?.fecha_devolucion ? prestamo.fecha_devolucion.slice(0, 10) : '',
    estado: prestamo?.estado || 'ACTIVO',
    observaciones: prestamo?.observaciones || '',
  });

  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [errores, setErrores] = useState<FormErrors<PrestamoFormState>>({});
  const [cargando, setCargando] = useState(false);

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
    if (!form.persona_id) e.persona_id = 'Selecciona el estudiante';
    if (!form.instructor_id) e.instructor_id = 'Selecciona el instructor';
    if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    if (!form.fecha_devolucion) e.fecha_devolucion = 'Selecciona la fecha de devolución';
    setErrores(e);
    const detalles = Object.entries(e).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    if (detalles.length > 0) notify('error', 'Revisa los datos del préstamo', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);

    const body: PrestamoPayload = {
      inventario_id: form.inventario_id,
      persona_id: form.persona_id,
      instructor_id: form.instructor_id,
      usuario_id: user?.id || '',
      cantidad: Number(form.cantidad),
      fecha_devolucion: form.fecha_devolucion ? new Date(form.fecha_devolucion).toISOString() : undefined,
      estado: form.estado,
      observaciones: form.observaciones.trim() || undefined,
    };

    try {
      await onGuardar(body);
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al guardar');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilterableSelect
          label="Artículo (inventario) *"
          value={form.inventario_id}
          onChange={(value) => setForm((prev) => ({ ...prev, inventario_id: value }))}
          options={inventario.map((item) => ({
            value: item.id,
            label: `${item.nombre} (${item.cantidad_disponible} disp.)`,
            searchText: item.codigo,
          }))}
          placeholder="Buscar artículo..."
          emptyLabel="Sin artículos coincidentes"
        />
        <FilterableSelect
          label="Estudiante *"
          value={form.persona_id}
          onChange={(value) => setForm((prev) => ({ ...prev, persona_id: value }))}
          options={personas.filter(p => p.tipo === 'ESTUDIANTE').map((persona) => ({
            value: persona.id,
            label: `${persona.nombres} ${persona.apellidos}`,
            searchText: `${persona.matricula} ${persona.curso ?? ''}`,
          }))}
          placeholder="Buscar estudiante..."
          emptyLabel="Sin estudiantes coincidentes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilterableSelect
          label="Instructor / Profesor *"
          value={form.instructor_id}
          onChange={(value) => setForm((prev) => ({ ...prev, instructor_id: value }))}
          options={personas.filter(p => p.tipo === 'PROFESOR').map((persona) => ({
            value: persona.id,
            label: `${persona.nombres} ${persona.apellidos}`,
            searchText: persona.matricula,
          }))}
          placeholder="Buscar instructor..."
          emptyLabel="Sin instructores"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Cantidad *</label>
          <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={1} className="soft-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Fecha devolución *</label>
          <input type="date" name="fecha_devolucion" value={form.fecha_devolucion ? form.fecha_devolucion.slice(0, 10) : ''} onChange={handleChange} className="soft-input" />
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
        {prestamo?.id && (
          <button type="button" onClick={() => descargarPDFPrestamo(prestamo.id)}
            className="soft-btn-secondary px-4 py-2 text-sm">
            📄 PDF
          </button>
        )}
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : prestamo ? 'Actualizar' : 'Registrar préstamo'}
        </button>
      </div>
    </form>
  );
}
