'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { getUsers, saveUsers, toSessionUser } from '../../lib/auth';
import type { ManagedUser } from '../../lib/types';

export default function MiCuentaPage() {
  const { user, updateCurrentUser } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre);
    setEmail(user.email);
  }, [user]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const updatedUsers = getUsers().map((item) => {
      if (item.id !== user.id) return item;

      const updated: ManagedUser = {
        ...item,
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim() || item.password,
      };

      updateCurrentUser(toSessionUser(updated));
      return updated;
    });

    saveUsers(updatedUsers);
    setPassword('');
    setMessage('Tus datos fueron actualizados correctamente.');
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Mi cuenta</h1>
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
              <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
              <p className="mt-2 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                {user?.rol}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Editar perfil</h2>
          {message && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nombre</label>
            <input className="soft-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Correo</label>
            <input className="soft-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nueva contraseña</label>
            <input type="password" className="soft-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Déjala vacía si no quieres cambiarla" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="soft-btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
