'use client';
import React, { useState } from 'react';
import type { Role, Usuario, UsuarioPayload } from '../../lib/types';

interface UsuarioFormProps {
  initialData?: Usuario | null;
  roles: Role[];
  onSuccess: (form: UsuarioPayload) => Promise<void>;
  onCancel: () => void;
}

export default function UsuarioForm({ initialData = null, roles, onSuccess, onCancel }: UsuarioFormProps) {
  const esEdicion = !!initialData;
  const [form, setForm] = useState<UsuarioPayload>({
    nombre:           initialData?.nombre           ?? '',
    apellido:         initialData?.apellido         ?? '',
    usuario:          initialData?.usuario          ?? '',
    contrasena:       '',
    rol_id:           initialData?.rol_id           ?? (roles[0]?.id ?? ''),
    tipo_documento:   initialData?.tipo_documento   ?? '',
    numero_documento: initialData?.numero_documento ?? '',
    activo:           initialData?.activo           ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('');
    if (!form.nombre.trim())   { setError('El nombre es obligatorio');   return; }
    if (!form.apellido.trim()) { setError('El apellido es obligatorio'); return; }
    if (!form.usuario.trim())  { setError('El usuario es obligatorio');  return; }
    if (form.usuario.trim().length < 4) { setError('El usuario debe tener mínimo 4 caracteres'); return; }
    if (!esEdicion && (!form.contrasena || form.contrasena.length < 6)) {
      setError('La contraseña es obligatoria y debe tener mínimo 6 caracteres'); return;
    }
    setGuardando(true);
    try {
      const payload: UsuarioPayload = {
        nombre: form.nombre.trim(), apellido: form.apellido.trim(), usuario: form.usuario.trim(),
        rol_id: form.rol_id || null, tipo_documento: form.tipo_documento || null,
        numero_documento: form.numero_documento || null, activo: form.activo,
      };
      if (form.contrasena && form.contrasena.trim().length > 0) payload.contrasena = form.contrasena;
      await onSuccess(payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const lbl = 'text-xs font-medium uppercase tracking-wider';
  const lblStyle = { color: 'var(--text-muted)' };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>
          {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        <p className="mt-1 text-sm" style={lblStyle}>
          {esEdicion ? 'Modifica los datos del usuario.' : 'Completa los datos para crear la cuenta.'}
        </p>
      </div>

      {error && (
        <p className="text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Juan" className="soft-input" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>Apellido *</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Ej. Pérez" className="soft-input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>Usuario *</label>
          <input name="usuario" value={form.usuario} onChange={handleChange} placeholder="Ej. jperez" className="soft-input" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>
            Contraseña {esEdicion ? '(vacío = sin cambio)' : '*'}
          </label>
          <input type="password" name="contrasena" value={form.contrasena} onChange={handleChange}
            placeholder={esEdicion ? '••••••' : 'Mínimo 6 caracteres'} className="soft-input" autoComplete="new-password" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={lbl} style={lblStyle}>Rol</label>
        <select name="rol_id" value={form.rol_id ?? ''} onChange={handleChange} className="soft-select">
          <option value="">Sin rol asignado</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.nombre_rol}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>Tipo de documento</label>
          <select name="tipo_documento" value={form.tipo_documento ?? ''} onChange={handleChange} className="soft-select">
            <option value="">— Seleccionar —</option>
            <option value="Cédula">Cédula</option>
            <option value="Matrícula">Matrícula</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} style={lblStyle}>Número de documento</label>
          <input name="numero_documento" value={form.numero_documento ?? ''} onChange={handleChange}
            placeholder="Ej. 001-0000000-0" className="soft-input" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div onClick={() => setForm(prev => ({ ...prev, activo: !prev.activo }))}
          className="relative cursor-pointer w-11 h-6 rounded-full transition-all"
          style={{ background: form.activo ? 'var(--success)' : 'var(--border)' }}>
          <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: form.activo ? '22px' : '2px' }} />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
          {form.activo ? 'Usuario activo' : 'Usuario inactivo'}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="soft-btn-secondary px-5 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={guardando} className="soft-btn-primary px-6 py-2 text-sm">
          {guardando ? 'Guardando...' : 'Guardar usuario'}
        </button>
      </div>
    </form>
  );
}
