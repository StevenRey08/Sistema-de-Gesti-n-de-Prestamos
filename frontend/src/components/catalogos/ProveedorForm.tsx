'use client';
import { useState } from 'react';
import type { Proveedor, ProveedorPayload, FormErrors } from '../../lib/types';

interface ProveedorFormProps {
  proveedor?: Proveedor | null;
  onGuardar: (form: ProveedorPayload) => Promise<void>;
  onCancelar: () => void;
}

type ProveedorFormState = {
  codigo: string;
  nombre_empresa: string;
  nombre_contacto: string;
  telefono: string;
  email: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProveedorForm({ proveedor = null, onGuardar, onCancelar }: ProveedorFormProps) {
  const [form, setForm] = useState<ProveedorFormState>({
    codigo: proveedor?.codigo ?? '',
    nombre_empresa: proveedor?.nombre_empresa ?? '',
    nombre_contacto: proveedor?.nombre_contacto ?? '',
    telefono: proveedor?.telefono ?? '',
    email: proveedor?.email ?? '',
  });
  const [errores, setErrores] = useState<FormErrors<ProveedorFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof ProveedorFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<ProveedorFormState> = {};
    if (!form.codigo.trim()) e.codigo = 'Obligatorio';
    if (!form.nombre_empresa.trim()) e.nombre_empresa = 'Obligatorio';
    if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Email no válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setApiError('');
    try {
      await onGuardar({
        codigo: form.codigo.trim(),
        nombre_empresa: form.nombre_empresa.trim(),
        nombre_contacto: form.nombre_contacto.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
      });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setCargando(false);
    }
  }

  const campo = (
    name: keyof ProveedorFormState,
    label: string,
    placeholder: string,
    tipo: React.HTMLInputTypeAttribute = 'text',
    requerido = false,
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">{label}{requerido && ' *'}</label>
      <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} type={tipo} className={`soft-input ${errores[name] ? 'border-red-400' : ''}`} />
      {errores[name] && <p className="mt-1 text-xs text-red-500">{errores[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{apiError}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {campo('codigo', 'Código', 'Ej: PROV-001', 'text', true)}
        {campo('nombre_empresa', 'Empresa', 'Nombre de la empresa', 'text', true)}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {campo('nombre_contacto', 'Persona de contacto', 'Ej: Juan Pérez')}
        {campo('telefono', 'Teléfono', '809-000-0000')}
        {campo('email', 'Email', 'correo@empresa.com', 'email')}
      </div>
      <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : proveedor ? 'Actualizar' : 'Registrar proveedor'}
        </button>
      </div>
    </form>
  );
}
