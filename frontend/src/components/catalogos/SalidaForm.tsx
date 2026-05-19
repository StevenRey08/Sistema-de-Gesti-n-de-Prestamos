'use client';
import { useState } from 'react';
import { inventarioApi } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import type { ItemInventario, FormErrors } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

interface SalidaFormProps {
  item: ItemInventario;
  onSuccess: () => void;
  onCancelar: () => void;
}

interface SalidaFormState {
  origen: 'disponible' | 'danado';
  cantidad: number | string;
  motivo: string;
}

export default function SalidaForm({ item, onSuccess, onCancelar }: SalidaFormProps) {
  const { notify } = useNotification();
  const { user } = useAuth();

  const maxOrigen = (
    origen: 'disponible' | 'danado'
  ) => origen === 'disponible' ? item.cantidad_disponible : item.cantidad_danada;

  const [form, setForm] = useState<SalidaFormState>({
    origen: 'disponible',
    cantidad: 1,
    motivo: '',
  });
  const [errores, setErrores] = useState<FormErrors<SalidaFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [confirmarEliminarTodo, setConfirmarEliminarTodo] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof SalidaFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<SalidaFormState> = {};
    const max = maxOrigen(form.origen);
    const cant = Number(form.cantidad);
    if (!form.cantidad || cant < 1) e.cantidad = 'Mínimo 1';
    else if (cant > max) e.cantidad = `Máximo ${max} (${form.origen === 'disponible' ? 'disponible' : 'dañado'})`;
    if (!form.motivo.trim()) e.motivo = 'Indica el motivo de la salida';
    setErrores(e);
    const detalles = Object.entries(e).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    if (detalles.length > 0) notify('error', 'Revisa los datos de la salida', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      const desdeDanado = form.origen === 'danado';
      await inventarioApi.registrarSalida({
        inventario_id: item.id,
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim(),
        desde_danado: desdeDanado,
      });
      notify('success', 'Salida registrada correctamente');
      onSuccess();
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al registrar salida');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  const max = maxOrigen(form.origen);

  async function handleEliminarTodo() {
    setConfirmarEliminarTodo(true);
  }

  async function ejecutarEliminarTodo() {
    setConfirmarEliminarTodo(false);
    setCargando(true);
    try {
      await inventarioApi.delete(item.id);
      notify('success', `${item.nombre} eliminado del inventario`);
      onSuccess();
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al eliminar');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">Eliminar del inventario</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{item.nombre} ({item.codigo})</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Origen *</label>
            <select name="origen" value={form.origen} onChange={handleChange} className="soft-select cursor-pointer">
              <option value="disponible">Disponible ({item.cantidad_disponible})</option>
              <option value="danado">Dañado ({item.cantidad_danada})</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cantidad *</label>
            <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange}
              min={1} max={max} className="soft-input" />
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-[var(--text-muted)]">Disponible: {item.cantidad_disponible} · Dañado: {item.cantidad_danada}</p>
              <button type="button" onClick={() => setForm(prev => ({ ...prev, cantidad: max }))}
                className="text-[10px] font-medium text-[var(--accent)] hover:underline">Máx</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Motivo *</label>
          <textarea name="motivo" value={form.motivo} onChange={handleChange} rows={2}
            placeholder="Ej: Mantenimiento, descarte, reparación..." className="soft-textarea" />
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={cargando} className="soft-btn-primary px-8 py-2 text-xs uppercase tracking-widest disabled:opacity-50">
            {cargando ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button type="button" onClick={handleEliminarTodo} disabled={cargando}
            className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50">
            Eliminar todo
          </button>
        </div>
      </form>

      {confirmarEliminarTodo && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="text-lg font-semibold text-[var(--text-main)]">¿Eliminar permanentemente?</p>
            <p className="text-sm text-[var(--text-muted)]">
              Se eliminará <strong className="text-[var(--text-main)]">"{item.nombre}"</strong> del inventario. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setConfirmarEliminarTodo(false)} className="soft-btn-secondary px-5 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={ejecutarEliminarTodo}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700">
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
