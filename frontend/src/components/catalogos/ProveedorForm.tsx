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
    codigo:          proveedor?.codigo          ?? '',
    nombre_empresa:  proveedor?.nombre_empresa  ?? '',
    nombre_contacto: proveedor?.nombre_contacto ?? '',
    telefono:        proveedor?.telefono        ?? '',
    email:           proveedor?.email           ?? '',
  });
  const [errores, setErrores]   = useState<FormErrors<ProveedorFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name as keyof ProveedorFormState]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validar(): boolean {
    const e: FormErrors<ProveedorFormState> = {};
    if (!form.codigo.trim())         e.codigo         = 'Obligatorio';
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
        codigo:          form.codigo.trim(),
        nombre_empresa:  form.nombre_empresa.trim(),
        nombre_contacto: form.nombre_contacto.trim() || undefined,
        telefono:        form.telefono.trim()        || undefined,
        email:           form.email.trim()           || undefined,
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
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}{requerido && ' *'}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        type={tipo}
        className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${errores[name] ? 'border-red-500' : 'border-gray-600'}`}
      />
      {errores[name] && <p className="text-xs text-red-400 mt-1">{errores[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
          {apiError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {campo('codigo',         'Código',  'Ej: PROV-001',        'text', true)}
        {campo('nombre_empresa', 'Empresa', 'Nombre de la empresa', 'text', true)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {campo('nombre_contacto', 'Persona de contacto', 'Ej: Juan Pérez')}
        {campo('telefono',        'Teléfono',            '809-000-0000')}
        {campo('email',           'Email',               'correo@empresa.com', 'email')}
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
          {cargando ? 'Guardando...' : proveedor ? 'Actualizar' : 'Registrar proveedor'}
        </button>
      </div>
    </form>
  );
}
