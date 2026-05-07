'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { toSessionUser } from '../../lib/auth';
import { usuariosApi } from '../../lib/api';
import type { Usuario } from '../../lib/types';

export default function MiCuentaPage() {
  const { user, updateCurrentUser } = useAuth();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadCurrentUser = async () => {
      try {
        const data = await usuariosApi.getById(user.id) as Usuario;
        setCurrentUser(data);
        setNombre(data.nombre);
        setApellido(data.apellido);
        setUsuario(data.usuario);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil actual.');
      }
    };

    void loadCurrentUser();
  }, [user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !currentUser) return;
    setError('');
    setMessage('');

    if (!nombre.trim() || !apellido.trim() || !usuario.trim()) {
      setError('Completa el nombre, el apellido y el usuario.');
      return;
    }

    if (password && password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        usuario: usuario.trim(),
        rol_id: currentUser.rol_id ?? null,
        tipo_documento: currentUser.tipo_documento ?? null,
        numero_documento: currentUser.numero_documento ?? null,
        activo: currentUser.activo,
        ...(password ? { contrasena: password } : {}),
      };

      const updated = await usuariosApi.update(user.id, payload) as Usuario;
      setCurrentUser(updated);
      updateCurrentUser(toSessionUser(updated));
      setPassword('');
      setConfirmPassword('');
      setMessage('Tus datos fueron actualizados correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Administrar perfil</h1>
        <p className="page-subtitle">Gestiona tus datos personales y tus credenciales de acceso.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">Sesión actual</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="app-logo-dot flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white">
              {user?.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--text-main)]">{user?.nombre}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.usuario ?? user?.email}</p>
              <p className="mt-2 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                {user?.rol}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Editar perfil</h2>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nombre</label>
            <input className="soft-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Apellido</label>
            <input className="soft-input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Usuario</label>
            <input className="soft-input" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nueva contraseña</label>
            <input type="password" className="soft-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Déjala vacía si no quieres cambiarla" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Confirmar nueva contraseña</label>
            <input type="password" className="soft-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="soft-btn-primary">{loading ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
