'use client';
import React, { useState, useEffect } from 'react';
import { inventarioApi, personasApi, descargarPDFPrestamo, prestamosApi } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import FilterableSelect from '../ui/FilterableSelect';
import type { Prestamo, PrestamoPayload, EstadoPrestamo, ItemInventario, Persona } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

const ESTADOS: EstadoPrestamo[] = ['ACTIVO', 'DEVUELTO', 'VENCIDO', 'PENDIENTE'];

interface ItemPrestamo {
  inventario_id: string;
  nombre: string;
  codigo: string;
  cantidad_disponible: number;
  cantidad: number | string;
}

interface PrestamoFormProps {
  prestamo?: Prestamo | null;
  onGuardar: (form: PrestamoPayload) => Promise<void>;
  onCancelar: () => void;
  onSuccess?: () => void;
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

export default function PrestamoForm({ prestamo = null, onGuardar, onCancelar, onSuccess }: PrestamoFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const esEdicion = !!prestamo;

  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  const [items, setItems] = useState<ItemPrestamo[]>([]);
  const [agregando, setAgregando] = useState(false);
  const [nuevoItemId, setNuevoItemId] = useState('');

  function toDatetimeLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const [form, setForm] = useState<PrestamoFormState>({
    inventario_id: prestamo?.inventario_id ? String(prestamo.inventario_id) : '',
    persona_id: prestamo?.persona_id ? String(prestamo.persona_id) : '',
    instructor_id: prestamo?.instructor_id ? String(prestamo.instructor_id) : '',
    cantidad: prestamo?.cantidad || 1,
    fecha_devolucion: toDatetimeLocal(prestamo?.fecha_devolucion ?? null),
    estado: prestamo?.estado || 'ACTIVO',
    observaciones: prestamo?.observaciones || '',
  });

  useEffect(() => {
    inventarioApi.getAll().then((d) => setInventario(d as ItemInventario[]));
    personasApi.getAll().then((d) => setPersonas(d as Persona[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function agregarItem() {
    if (!nuevoItemId) return;
    const existe = items.find(i => i.inventario_id === nuevoItemId);
    if (existe) { notify('warning', 'Esa herramienta ya está en la lista'); return; }
    const art = inventario.find(i => i.id === nuevoItemId);
    if (!art) return;
    setItems(prev => [...prev, {
      inventario_id: art.id, nombre: art.nombre, codigo: art.codigo,
      cantidad_disponible: art.cantidad_disponible, cantidad: 1,
    }]);
    setNuevoItemId('');
    setAgregando(false);
  }

  function eliminarItem(id: string) {
    setItems(prev => prev.filter(i => i.inventario_id !== id));
  }

  function cambiarCantidad(id: string, cantidad: number | string) {
    setItems(prev => prev.map(i => i.inventario_id === id ? { ...i, cantidad } : i));
  }

  function validar() {
    const e: Record<string, string> = {};
    if (esEdicion) {
      if (!form.inventario_id) e.inventario_id = 'Selecciona el artículo';
      if (!form.cantidad || Number(form.cantidad) < 1) e.cantidad = 'Mínimo 1';
    } else if (items.length === 0) {
      e.items = 'Agrega al menos una herramienta';
    }
    if (!form.persona_id) e.persona_id = 'Selecciona el estudiante';
    if (!form.instructor_id) e.instructor_id = 'Selecciona el instructor';
    if (!form.fecha_devolucion) {
      e.fecha_devolucion = 'Selecciona la fecha de devolución';
    } else if (new Date(form.fecha_devolucion) <= new Date()) {
      e.fecha_devolucion = 'La fecha debe ser posterior a la actual';
    }
    for (const item of items) {
      const cant = Number(item.cantidad);
      if (!item.cantidad || cant < 1) e[`cant_${item.inventario_id}`] = `"${item.nombre}": mínimo 1`;
      else if (cant > item.cantidad_disponible) e[`cant_${item.inventario_id}`] = `"${item.nombre}": máximo ${item.cantidad_disponible}`;
    }
    setErrores(e);
    const detalles = Object.values(e);
    if (detalles.length > 0) notify('error', 'Revisa los datos del préstamo', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      if (esEdicion) {
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
        await onGuardar(body);
      } else {
        await prestamosApi.createLote({
          items: items.map(i => ({
            inventario_id: i.inventario_id,
            cantidad: Number(i.cantidad),
          })),
          persona_id: form.persona_id,
          instructor_id: form.instructor_id,
          usuario_id: user?.id,
          fecha_devolucion: form.fecha_devolucion ? new Date(form.fecha_devolucion).toISOString() : null,
          observaciones: form.observaciones.trim() || undefined,
        });
        notify('success', `${items.length} préstamo(s) registrado(s) correctamente`);
        onSuccess?.();
      }
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al guardar');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {esEdicion ? (
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
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Herramientas a prestar *
            </label>
            {!agregando && (
              <button type="button" onClick={() => setAgregando(true)}
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-strong)]">
                + Agregar herramienta
              </button>
            )}
          </div>

          {items.length === 0 && !agregando && (
            <p className="text-xs text-[var(--text-muted)] italic">Presiona &quot;+ Agregar herramienta&quot; para añadir artículos al préstamo.</p>
          )}

          {items.map((item) => (
            <div key={item.inventario_id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)] truncate">{item.nombre}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{item.codigo} · Disp: {item.cantidad_disponible}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={item.cantidad} min={1} max={item.cantidad_disponible}
                  onChange={(e) => cambiarCantidad(item.inventario_id, e.target.value)}
                  className="soft-input w-20 text-center" />
                <button type="button" onClick={() => eliminarItem(item.inventario_id)}
                  className="text-xs font-bold text-[var(--danger)] hover:opacity-80">✕</button>
              </div>
            </div>
          ))}
          {errores.items && <p className="text-xs text-red-500">{errores.items}</p>}

          {agregando && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FilterableSelect
                  label="Buscar herramienta"
                  value={nuevoItemId}
                  onChange={setNuevoItemId}
                  options={inventario.map((art) => ({
                    value: art.id,
                    label: `${art.nombre} (${art.cantidad_disponible} disp.)`,
                    searchText: art.codigo,
                  }))}
                  placeholder="Escribe para buscar..."
                  emptyLabel="Sin resultados"
                />
              </div>
              <button type="button" onClick={agregarItem}
                className="soft-btn-primary mb-0.5 px-4 py-2 text-xs uppercase tracking-widest">Agregar</button>
              <button type="button" onClick={() => { setAgregando(false); setNuevoItemId(''); }}
                className="soft-btn-secondary mb-0.5 px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FilterableSelect
              label="Estudiante *"
              value={form.persona_id}
              onChange={(value) => { setForm((prev) => ({ ...prev, persona_id: value })); if (errores.persona_id) setErrores((prev) => ({ ...prev, persona_id: '' })); }}
              options={personas.filter(p => p.tipo === 'ESTUDIANTE').map((persona) => ({
                value: persona.id,
                label: `${persona.nombres} ${persona.apellidos}`,
                searchText: `${persona.matricula} ${persona.curso ?? ''}`,
              }))}
              placeholder="Buscar estudiante..."
              emptyLabel="Sin estudiantes coincidentes"
            />
            <FilterableSelect
              label="Instructor / Profesor *"
              value={form.instructor_id}
              onChange={(value) => { setForm((prev) => ({ ...prev, instructor_id: value })); if (errores.instructor_id) setErrores((prev) => ({ ...prev, instructor_id: '' })); }}
              options={personas.filter(p => p.tipo === 'PROFESOR').map((persona) => ({
                value: persona.id,
                label: `${persona.nombres} ${persona.apellidos}`,
                searchText: persona.matricula,
              }))}
              placeholder="Buscar instructor..."
              emptyLabel="Sin instructores"
            />
          </div>
        </div>
      )}

      {esEdicion && (
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
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Fecha devolución *</label>
          <input type="datetime-local" name="fecha_devolucion" value={form.fecha_devolucion} onChange={handleChange} className="soft-input" />
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
        {esEdicion && (
          <button type="button" onClick={() => descargarPDFPrestamo(prestamo.id!)}
            className="soft-btn-secondary px-4 py-2 text-sm">
            📄 PDF
          </button>
        )}
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : esEdicion ? 'Actualizar' : `Registrar ${items.length} préstamo${items.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  );
}
