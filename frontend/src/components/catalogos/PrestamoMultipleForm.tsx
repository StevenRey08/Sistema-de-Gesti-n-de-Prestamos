'use client';
import { useState, useEffect } from 'react';
import { inventarioApi, personasApi, prestamosApi } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import FilterableSelect from '../ui/FilterableSelect';
import type { ItemInventario, Persona } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

interface ItemPrestamo {
  inventario_id: string;
  nombre: string;
  codigo: string;
  cantidad_disponible: number;
  cantidad: number | string;
}

interface PrestamoMultipleFormProps {
  itemInicial?: ItemInventario | null;
  onSuccess: () => void;
  onCancelar: () => void;
}

export default function PrestamoMultipleForm({ itemInicial, onSuccess, onCancelar }: PrestamoMultipleFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);

  const [items, setItems] = useState<ItemPrestamo[]>(() =>
    itemInicial ? [{
      inventario_id: itemInicial.id,
      nombre: itemInicial.nombre,
      codigo: itemInicial.codigo,
      cantidad_disponible: itemInicial.cantidad_disponible,
      cantidad: 1,
    }] : []
  );

  const [persona_id, setPersonaId] = useState('');
  const [instructor_id, setInstructorId] = useState('');
  const [fecha_devolucion, setFechaDevolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [nuevoItemId, setNuevoItemId] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    personasApi.getAll().then((d) => setPersonas(d as Persona[]));
    inventarioApi.getAll().then((d) => setInventario(d as ItemInventario[]));
  }, []);

  function agregarItem() {
    if (!nuevoItemId) return;
    const existe = items.find(i => i.inventario_id === nuevoItemId);
    if (existe) {
      notify('warning', 'Esa herramienta ya está en la lista');
      return;
    }
    const art = inventario.find(i => i.id === nuevoItemId);
    if (!art) return;
    setItems(prev => [...prev, {
      inventario_id: art.id,
      nombre: art.nombre,
      codigo: art.codigo,
      cantidad_disponible: art.cantidad_disponible,
      cantidad: 1,
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
    if (items.length === 0) e.items = 'Agrega al menos una herramienta';
    if (!persona_id) e.persona_id = 'Selecciona el estudiante';
    if (!instructor_id) e.instructor_id = 'Selecciona el instructor';
    if (!fecha_devolucion) e.fecha_devolucion = 'Selecciona la fecha de devolución';
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
      await prestamosApi.createLote({
        items: items.map(i => ({
          inventario_id: i.inventario_id,
          cantidad: Number(i.cantidad),
        })),
        persona_id,
        instructor_id,
        usuario_id: user?.id,
        fecha_devolucion: fecha_devolucion ? new Date(fecha_devolucion).toISOString() : null,
        observaciones: observaciones.trim() || undefined,
      });
      notify('success', `${items.length} préstamo(s) registrado(s) correctamente`);
      onSuccess();
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al registrar préstamos');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">Nuevo préstamo</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {items.length} herramienta{items.length !== 1 ? 's' : ''} · Estudiante e instructor requeridos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
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
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FilterableSelect
            label="Estudiante *"
            value={persona_id}
            onChange={(value) => { setPersonaId(value); if (errores.persona_id) setErrores((prev) => ({ ...prev, persona_id: '' })); }}
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
            value={instructor_id}
            onChange={(value) => { setInstructorId(value); if (errores.instructor_id) setErrores((prev) => ({ ...prev, instructor_id: '' })); }}
            options={personas.filter(p => p.tipo === 'PROFESOR').map((persona) => ({
              value: persona.id,
              label: `${persona.nombres} ${persona.apellidos}`,
              searchText: persona.matricula,
            }))}
            placeholder="Buscar instructor..."
            emptyLabel="Sin instructores"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Fecha devolución *</label>
            <input type="date" value={fecha_devolucion}
              onChange={(e) => { setFechaDevolucion(e.target.value); if (errores.fecha_devolucion) setErrores((prev) => ({ ...prev, fecha_devolucion: '' })); }}
              className="soft-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Observaciones</label>
            <input type="text" value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..." className="soft-input" />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={cargando} className="soft-btn-primary px-8 py-2 text-xs uppercase tracking-widest disabled:opacity-50">
            {cargando ? 'Registrando...' : `Registrar ${items.length} préstamo${items.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}
