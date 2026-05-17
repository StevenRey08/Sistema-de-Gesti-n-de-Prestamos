'use client';
import { useState, useEffect } from 'react';
import { movimientosApi, personasApi } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import FilterableSelect from '../ui/FilterableSelect';
import type { ItemInventario, Persona, FormErrors } from '../../lib/types';
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
  persona_id: string;
}

export default function SalidaForm({ item, onSuccess, onCancelar }: SalidaFormProps) {
  const { notify } = useNotification();
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);

  const maxOrigen = (
    origen: 'disponible' | 'danado'
  ) => origen === 'disponible' ? item.cantidad_disponible : item.cantidad_danada;

  const [form, setForm] = useState<SalidaFormState>({
    origen: 'disponible',
    cantidad: 1,
    motivo: '',
    persona_id: '',
  });
  const [errores, setErrores] = useState<FormErrors<SalidaFormState>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    personasApi.getAll().then((d) => setPersonas(d as Persona[]));
  }, []);

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
      await movimientosApi.create({
        inventario_id: item.id,
        tipo: 'SALIDA',
        cantidad: Number(form.cantidad),
        desde_danado: desdeDanado,
        persona_id: form.persona_id || undefined,
        usuario_id: user?.id,
        observaciones: form.motivo.trim(),
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

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">Salida de inventario</h2>
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
            <p className="text-[10px] text-[var(--text-muted)]">Disponible: {item.cantidad_disponible} · Dañado: {item.cantidad_danada}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Motivo *</label>
          <textarea name="motivo" value={form.motivo} onChange={handleChange} rows={2}
            placeholder="Ej: Mantenimiento, descarte, reparación..." className="soft-textarea" />
        </div>

        <FilterableSelect
          label="Responsable (opcional)"
          value={form.persona_id}
          onChange={(value) => {
            setForm((prev) => ({ ...prev, persona_id: value }));
            if (errores.persona_id) setErrores((prev) => ({ ...prev, persona_id: '' }));
          }}
          options={personas.map((p) => ({
            value: p.id,
            label: `${p.nombres} ${p.apellidos}`,
            searchText: `${p.matricula} ${p.tipo}`,
          }))}
          placeholder="Buscar persona..."
          emptyLabel="Sin personas coincidentes"
        />

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={cargando} className="soft-btn-primary px-8 py-2 text-xs uppercase tracking-widest disabled:opacity-50">
            {cargando ? 'Registrando...' : 'Registrar salida'}
          </button>
        </div>
      </form>
    </div>
  );
}
