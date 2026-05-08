'use client';
import { useState, useEffect } from 'react';
import { categoriasApi } from '../../lib/api';
import type { Herramienta, HerramientaPayload, Categoria, FormErrors } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

interface HerramientaFormProps {
  herramienta?: Herramienta | null;
  onGuardar: (form: HerramientaPayload) => Promise<void>;
  onCancelar: () => void;
}

interface HerramientaFormState {
  codigo: string;
  nombre: string;
  categoria_id: string;
  valor_estimado: string;
}

export default function HerramientaForm({ herramienta = null, onGuardar, onCancelar }: HerramientaFormProps) {
  const { notify } = useNotification();
  const [form, setForm] = useState<HerramientaFormState>({
    codigo: herramienta?.codigo || '',
    nombre: herramienta?.nombre || '',
    categoria_id: herramienta?.categoria_id ? String(herramienta.categoria_id) : '',
    valor_estimado: herramienta?.valor_estimado ? String(herramienta.valor_estimado) : '',
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errores, setErrores] = useState<FormErrors<HerramientaFormState>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    categoriasApi.getAll().then((d) => setCategorias(d as Categoria[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof HerramientaFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<HerramientaFormState> = {};
    if (!form.codigo.trim()) e.codigo = 'Obligatorio';
    if (!form.nombre.trim()) e.nombre = 'Obligatorio';
    setErrores(e);
    const detalles = Object.entries(e).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    if (detalles.length > 0) notify('error', 'Revisa los datos de la herramienta', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);

    const body: HerramientaPayload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id || null,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
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

  const campo = (name: keyof HerramientaFormState, label: string, placeholder: string, requerido = false) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">{label}{requerido && ' *'}</label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="soft-input"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {campo('codigo', 'Código', 'Ej: TOOL-001', true)}
        {campo('nombre', 'Nombre de la herramienta', 'Ej: Taladro percutor', true)}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Categoría</label>
          <select name="categoria_id" value={form.categoria_id} onChange={handleChange} className="soft-select">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        {campo('valor_estimado', 'Valor estimado (RD$)', '0.00')}
      </div>
      <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : herramienta ? 'Actualizar' : 'Registrar herramienta'}
        </button>
      </div>
    </form>
  );
}
