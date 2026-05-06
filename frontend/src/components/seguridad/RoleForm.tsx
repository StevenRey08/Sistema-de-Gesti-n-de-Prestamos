'use client';
import React, { useState } from 'react';
import type { Role, RolePayload } from '../../lib/types';

interface RoleFormProps {
  initialData?: Role | null;
  onSuccess: (form: RolePayload) => Promise<void>;
  onCancel: () => void;
}

export default function RoleForm({ initialData = null, onSuccess, onCancel }: RoleFormProps) {
  const [form, setForm] = useState({
    nombre_rol:  initialData?.nombre_rol  ?? '',
    descripcion: initialData?.descripcion ?? '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nombre_rol.trim())         { setError('El nombre del rol es obligatorio'); return; }
    if (form.nombre_rol.trim().length < 4)  { setError('Mínimo 4 caracteres'); return; }
    if (form.nombre_rol.trim().length > 30) { setError('Máximo 30 caracteres'); return; }
    setGuardando(true); setError('');
    try {
      await onSuccess({
        nombre_rol:  form.nombre_rol.trim(),
        descripcion: form.descripcion.trim() || undefined,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>
          {initialData ? 'Editar Rol' : 'Nuevo Rol'}
        </h2>
        <p className="mt-1 text-sm" style={labelStyle}>
          Define un rol para asignar permisos a los usuarios.
        </p>
      </div>

      {error && (
        <p className="text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>
            Nombre del rol *
          </label>
          <input type="text" name="nombre_rol" value={form.nombre_rol} onChange={handleChange}
            placeholder="Ej. Administrador, Operador..." className="soft-input" maxLength={30} />
          <span className="text-xs text-right" style={labelStyle}>{form.nombre_rol.length}/30</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={labelStyle}>
            Descripción
          </label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
            placeholder="Describe las responsabilidades de este rol..."
            rows={3} className="soft-textarea" maxLength={200} />
          <span className="text-xs text-right" style={labelStyle}>{form.descripcion.length}/200</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="soft-btn-secondary px-5 py-2 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="soft-btn-primary px-6 py-2 text-sm">
          {guardando ? 'Guardando...' : 'Guardar rol'}
        </button>
      </div>
    </form>
  );
}
