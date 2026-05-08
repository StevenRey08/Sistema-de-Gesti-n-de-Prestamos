'use client';
import React, { useState } from 'react';
import type { Role, Usuario, UsuarioPayload } from '../../lib/types';
import {
  CEDULA_RE,
  MATRICULA_RE,
  formatDocumento,
  normalizeTipoDocumento,
  type TipoDocumentoFormato,
} from '../../lib/formatters';
import { notifyErrorPayload } from '../../lib/errors';
import FilterableSelect from '../ui/FilterableSelect';
import { useNotification } from '../ui/NotificationContext';

interface UsuarioFormProps {
  initialData?: Usuario | null;
  roles: Role[];
  onSuccess: (form: UsuarioPayload) => Promise<void>;
  onCancel: () => void;
}

export default function UsuarioForm({ initialData = null, roles, onSuccess, onCancel }: UsuarioFormProps) {
  const { notify } = useNotification();
  const esEdicion = !!initialData;
  const tipoDocumentoInicial = initialData?.tipo_documento ? normalizeTipoDocumento(initialData.tipo_documento) : '';
  const [form, setForm] = useState<UsuarioPayload>({
    nombre:           initialData?.nombre           ?? '',
    apellido:         initialData?.apellido         ?? '',
    usuario:          initialData?.usuario          ?? '',
    contrasena:       '',
    rol_id:           initialData?.rol_id           ?? (roles[0]?.id ?? ''),
    tipo_documento:   tipoDocumentoInicial,
    numero_documento: tipoDocumentoInicial ? formatDocumento(initialData?.numero_documento ?? '', tipoDocumentoInicial) : '',
    activo:           initialData?.activo           ?? true,
  });
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => {
      if (name === 'tipo_documento') {
        const nextTipo = value as TipoDocumentoFormato | '';
        return {
          ...prev,
          tipo_documento: nextTipo,
          numero_documento: nextTipo ? formatDocumento(prev.numero_documento ?? '', nextTipo) : '',
        };
      }

      if (name === 'numero_documento') {
        const tipoDocumento = prev.tipo_documento as TipoDocumentoFormato | '';
        return {
          ...prev,
          numero_documento: tipoDocumento ? formatDocumento(value, tipoDocumento) : value,
        };
      }

      return { ...prev, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const detalles = [];
    if (!form.nombre.trim()) detalles.push('El nombre es obligatorio');
    if (!form.apellido.trim()) detalles.push('El apellido es obligatorio');
    if (!form.usuario.trim()) detalles.push('El usuario es obligatorio');
    if (form.usuario.trim() && form.usuario.trim().length < 4) detalles.push('El usuario debe tener mínimo 4 caracteres');
    if (form.tipo_documento && !form.numero_documento) detalles.push('El número de documento es obligatorio cuando seleccionas un tipo de documento');
    if (form.numero_documento && !form.tipo_documento) detalles.push('Selecciona el tipo de documento');
    if (form.tipo_documento === 'Cédula' && form.numero_documento && !CEDULA_RE.test(form.numero_documento)) detalles.push('La cédula debe tener el formato 000-0000000-0');
    if (form.tipo_documento === 'Matrícula' && form.numero_documento && !MATRICULA_RE.test(form.numero_documento)) detalles.push('La matrícula debe tener el formato 0000-0000');
    if (!esEdicion && (!form.contrasena || form.contrasena.length < 6)) detalles.push('La contraseña es obligatoria y debe tener mínimo 6 caracteres');
    if (detalles.length > 0) {
      notify('error', 'Revisa los datos del usuario', detalles);
      return;
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
      const { message, details } = notifyErrorPayload(e, 'Error al guardar');
      notify('error', message, details);
    } finally { setGuardando(false); }
  };

  const lbl = 'text-xs font-medium uppercase tracking-wider';
  const lblStyle = { color: 'var(--text-muted)' };
  const tipoDocumentoSeleccionado = form.tipo_documento as TipoDocumentoFormato | '';
  const documentoPlaceholder = tipoDocumentoSeleccionado === 'Matrícula' ? '0000-0000' : '000-0000000-0';
  const documentoMaxLength = tipoDocumentoSeleccionado === 'Matrícula' ? 9 : 13;

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

      <FilterableSelect
        label="Rol"
        value={form.rol_id ?? ''}
        onChange={(value) => setForm((prev) => ({ ...prev, rol_id: value }))}
        options={[
          { value: '', label: 'Sin rol asignado' },
          ...roles.map((role) => ({ value: role.id, label: role.nombre_rol, searchText: role.descripcion ?? '' })),
        ]}
        placeholder="Buscar rol..."
        emptyLabel="Sin roles coincidentes"
      />

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
            placeholder={documentoPlaceholder} maxLength={documentoMaxLength} inputMode="numeric" className="soft-input" />
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
