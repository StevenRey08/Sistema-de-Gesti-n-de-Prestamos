'use client';
import { useState } from 'react';
import type { Persona, PersonaPayload, FormErrors } from '../../lib/types';

type TipoDocumento = 'Cédula' | 'Pasaporte' | 'RNC' | 'Otro';
type TipoPersona = 'Estudiante' | 'Profesor' | 'Técnico' | 'Administrativo';

const TIPOS_DOC: TipoDocumento[] = ['Cédula', 'Pasaporte', 'RNC', 'Otro'];
const TIPOS_PERS: TipoPersona[] = ['Estudiante', 'Profesor', 'Técnico', 'Administrativo'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PersonaFormProps {
  persona?: Persona | null;
  onGuardar: (form: PersonaPayload) => Promise<void>;
  onCancelar: () => void;
}

interface PersonaFormState {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  tipo: TipoPersona;
  telefono: string;
  email: string;
}

export default function PersonaForm({ persona = null, onGuardar, onCancelar }: PersonaFormProps) {
  const [form, setForm] = useState<PersonaFormState>({
    tipo_documento: (persona?.tipo_documento as TipoDocumento) ?? 'Cédula',
    numero_documento: persona?.numero_documento ?? '',
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    tipo: (persona?.tipo as TipoPersona) ?? 'Estudiante',
    telefono: persona?.telefono ?? '',
    email: persona?.email ?? '',
  });
  const [errores, setErrores] = useState<FormErrors<PersonaFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof PersonaFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<PersonaFormState> = {};
    if (!form.numero_documento.trim()) e.numero_documento = 'Obligatorio';
    if (!form.nombres.trim()) e.nombres = 'Obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'Obligatorio';
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
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipo: form.tipo,
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
    name: keyof PersonaFormState,
    label: string,
    placeholder: string,
    tipo: React.HTMLInputTypeAttribute = 'text',
    requerido = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {label}{requerido && ' *'}
      </label>
      <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} type={tipo} className={`soft-input ${errores[name] ? 'border-red-400 bg-red-50' : ''}`} />
      {errores[name] && <p className="ml-1 mt-1 text-[10px] text-red-500">{errores[name]}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">{persona ? 'Editar Persona' : 'Registrar Nueva Persona'}</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Completa la información para actualizar la lista de registros.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {apiError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{apiError}</div>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo de documento</label>
            <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="soft-select cursor-pointer">
              {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {campo('numero_documento', 'Número de documento', '000-0000000-0', 'text', true)}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {campo('nombres', 'Nombres', 'Ej: Juan Carlos', 'text', true)}
          {campo('apellidos', 'Apellidos', 'Ej: Pérez García', 'text', true)}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo de Persona</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="soft-select cursor-pointer">
              {TIPOS_PERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {campo('telefono', 'Teléfono', '809-000-0000')}
          {campo('email', 'Email', 'correo@ejemplo.com', 'email')}
        </div>

        <div className="mt-2 flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={cargando} className="soft-btn-primary px-8 py-2 text-xs uppercase tracking-widest disabled:opacity-50">
            {cargando ? 'Guardando...' : persona ? 'Actualizar' : 'Registrar persona'}
          </button>
        </div>
      </form>
    </div>
  );
}
