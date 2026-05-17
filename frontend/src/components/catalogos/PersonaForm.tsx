'use client';
import { useState } from 'react';
import type { Persona, PersonaPayload, FormErrors } from '../../lib/types';

import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

const TIPOS_PERS = ['ESTUDIANTE', 'PROFESOR', 'TECNICO', 'ADMINISTRATIVO'];
const NIVELES = ['4to', '5to', '6to'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function formatMatricula(value: string, tipo: string): string {
  const digits = value.replace(/\D/g, '');
  if (tipo !== 'ESTUDIANTE') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
  }
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
}

function parseCurso(curso: string | null | undefined) {
  if (!curso) return { nivel: '', seccion: '' };
  const parts = curso.trim().split(' ');
  if (parts.length >= 1 && NIVELES.includes(parts[0])) {
    return {
      nivel: parts[0],
      seccion: parts.length >= 2 && SECCIONES.includes(parts[1]) ? parts[1] : '',
    };
  }
  return { nivel: '', seccion: '' };
}

interface PersonaFormProps {
  persona?: Persona | null;
  onGuardar: (form: PersonaPayload) => Promise<void>;
  onCancelar: () => void;
  defaultTipo?: string;
}

interface PersonaFormState {
  matricula: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  nivel: string;
  seccion: string;
}

export default function PersonaForm({ persona = null, onGuardar, onCancelar, defaultTipo }: PersonaFormProps) {
  const { notify } = useNotification();
  const parsed = parseCurso(persona?.curso);

  const [form, setForm] = useState<PersonaFormState>({
    matricula: persona?.matricula ?? '',
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    tipo: persona?.tipo ?? defaultTipo ?? 'ESTUDIANTE',
    nivel: parsed.nivel,
    seccion: parsed.seccion,
  });
  const [errores, setErrores] = useState<FormErrors<PersonaFormState>>({});
  const [cargando, setCargando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'matricula') {
      setForm((prev) => {
        const formatted = formatMatricula(value, prev.tipo);
        return { ...prev, matricula: formatted };
      });
    } else if (name === 'tipo') {
      setForm((prev) => {
        const matricula = formatMatricula(prev.matricula, value);
        if (value !== 'ESTUDIANTE') return { ...prev, tipo: value, matricula, nivel: '', seccion: '' };
        return { ...prev, tipo: value, matricula };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (errores[name as keyof PersonaFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<PersonaFormState> = {};
    if (!form.matricula.trim()) e.matricula = 'Obligatorio';
    else if (form.tipo !== 'ESTUDIANTE') {
      if (!/^\d{3}-\d{7}-\d$/.test(form.matricula)) e.matricula = 'Formato: 000-0000000-0';
    } else {
      if (!/^\d{4}-\d{4}$/.test(form.matricula)) e.matricula = 'Formato: 0000-0000';
    }
    if (!form.nombres.trim()) e.nombres = 'Obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'Obligatorio';
    if (!form.tipo) e.tipo = 'Seleccione un tipo';
    if (form.tipo === 'ESTUDIANTE') {
      if (!form.nivel) e.nivel = 'Seleccione un curso';
      if (!form.seccion) e.seccion = 'Seleccione una sección';
    }
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
        curso: form.tipo === 'ESTUDIANTE' ? `${form.nivel} ${form.seccion}` : undefined,
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
            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{form.tipo !== 'ESTUDIANTE' ? 'Cédula *' : 'Matrícula *'}</label>
            <input name="matricula" value={form.matricula} onChange={handleChange}
              placeholder={form.tipo !== 'ESTUDIANTE' ? '000-0000000-0' : '0000-0000'}
              className="soft-input" maxLength={form.tipo !== 'ESTUDIANTE' ? 13 : 9} />
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

        {form.tipo === 'ESTUDIANTE' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Curso *</label>
              <select name="nivel" value={form.nivel} onChange={handleChange} className="soft-select cursor-pointer">
                <option value="">Seleccionar curso</option>
                {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Sección *</label>
              <select name="seccion" value={form.seccion} onChange={handleChange} className="soft-select cursor-pointer">
                <option value="">Seleccionar sección</option>
                {SECCIONES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

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
