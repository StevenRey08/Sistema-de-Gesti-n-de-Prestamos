'use client';
import React, { useState } from 'react';
import type { Role, RolePayload } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

interface RoleFormProps {
  initialData?: Role | null;
  onSuccess: (form: RolePayload) => Promise<void>;
  onCancel: () => void;
}

export default function RoleForm({ initialData = null, onSuccess, onCancel }: RoleFormProps) {
  const { notify } = useNotification();
  const [form, setForm] = useState({
    nombre_rol:  initialData?.nombre_rol  ?? '',
    descripcion: initialData?.descripcion ?? '',
  });
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const detalles = [];
    if (!form.nombre_rol.trim()) detalles.push('El nombre del rol es obligatorio');
    if (form.nombre_rol.trim() && form.nombre_rol.trim().length < 4) detalles.push('El nombre del rol debe tener mínimo 4 caracteres');
    if (form.nombre_rol.trim().length > 30) detalles.push('El nombre del rol debe tener máximo 30 caracteres');
    if (detalles.length > 0) {
      notify('error', 'Revisa los datos del rol', detalles);
      return;
    }
    setGuardando(true);
    try {
      await onSuccess({
        nombre_rol:  form.nombre_rol.trim(),
        descripcion: form.descripcion.trim() || undefined,
      });
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al guardar');
      notify('error', message, details);
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
