'use client';
import { useState } from 'react';
import type { Persona, PersonaPayload, FormErrors } from '../../lib/types';

import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

const TIPOS_PERS = ['ESTUDIANTE', 'PROFESOR', 'TECNICO', 'ADMINISTRATIVO'];

interface PersonaFormProps {
  persona?: Persona | null;
  onGuardar: (form: PersonaPayload) => Promise<void>;
  onCancelar: () => void;
}

interface PersonaFormState {
  matricula: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  curso: string;
}

export default function PersonaForm({ persona = null, onGuardar, onCancelar }: PersonaFormProps) {
  const { notify } = useNotification();

  const [form, setForm] = useState<PersonaFormState>({
    matricula: persona?.matricula ?? '',
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    tipo: persona?.tipo ?? 'ESTUDIANTE',
    curso: persona?.curso ?? '',
  });
  const [errores, setErrores] = useState<FormErrors<PersonaFormState>>({});
  const [cargando, setCargando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof PersonaFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<PersonaFormState> = {};
    if (!form.matricula.trim()) e.matricula = 'Obligatorio';
    else if (!/^\d{4}-\d{4}$/.test(form.matricula)) e.matricula = 'Formato: 0000-0000';
    if (!form.nombres.trim()) e.nombres = 'Obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'Obligatorio';
    if (!form.tipo) e.tipo = 'Seleccione un tipo';
    setErrores(e);
    const detalles = Object.entries(e).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    if (detalles.length > 0) notify('error', 'Revisa los datos de la persona', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      await onGuardar({
        matricula: form.matricula.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipo: form.tipo,
        curso: form.curso.trim() || undefined,
      });
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al guardar');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
      <div className="border-b border-[var(--border)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">{persona ? 'Editar Persona' : 'Registrar Nueva Persona'}</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Completa la información para actualizar la lista de registros.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Matrícula *</label>
            <input name="matricula" value={form.matricula} onChange={handleChange} placeholder="0000-0000" className="soft-input" maxLength={9} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo de Persona</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="soft-select cursor-pointer">
              {TIPOS_PERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Nombres *</label>
            <input name="nombres" value={form.nombres} onChange={handleChange} placeholder="Ej: Juan Carlos" className="soft-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Apellidos *</label>
            <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej: Pérez García" className="soft-input" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Curso / Sección</label>
            <input name="curso" value={form.curso} onChange={handleChange} placeholder="Ej: 4to B - Técnico" className="soft-input" />
          </div>
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
