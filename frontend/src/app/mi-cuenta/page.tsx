'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { toSessionUser } from '../../lib/auth';
import api from '../../lib/api';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

export default function MiCuentaPage() {
  const { user, updateCurrentUser } = useAuth();
  const { notify } = useNotification();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadCurrentUser = async () => {
      try {
        const res = await api.get('/auth/me') as { status: string; usuario: { nombre: string; apellido: string; usuario: string; email?: string } };
        if (res.status === 'ok' && res.usuario) {
          setNombre(res.usuario.nombre);
          setApellido(res.usuario.apellido);
          setUsuario(res.usuario.usuario);
          setEmail(res.usuario.email ?? '');
        }
      } catch (err) {
        const { message, details } = notifyErrorPayload(err, 'No se pudo cargar el perfil actual.');
        notify('error', message, details);
      }
    };

    void loadCurrentUser();
  }, [notify, user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const detalles = [];
    if (!nombre.trim() || !apellido.trim() || !usuario.trim()) {
      detalles.push('Completa el nombre, el apellido y el usuario.');
    }

    if (password) {
      if (!passwordActual) {
        detalles.push('Debes ingresar tu contraseña actual para cambiarla.');
      } else if (password.length < 6) {
        detalles.push('La nueva contraseña debe tener al menos 6 caracteres.');
      } else if (passwordActual === password && password === confirmPassword) {
        detalles.push('La nueva contraseña no puede ser igual a la actual. Por seguridad, elige una contraseña diferente.');
      }
    }

    if (password !== confirmPassword) {
      detalles.push('La confirmación de contraseña no coincide.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      detalles.push('El formato del email no es válido.');
    }

    if (detalles.length > 0) {
      notify('error', 'Revisa los datos del perfil', detalles);
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        usuario: usuario.trim(),
        email: email.trim(),
      };
      if (password) {
        payload.contrasena = password;
        payload.contrasena_actual = passwordActual;
        payload.confirmar_contrasena = confirmPassword;
      }

      const res = await api.put('/auth/me', payload) as { status: string; usuario: Record<string, unknown> };
      if (res.status === 'ok' && res.usuario) {
        updateCurrentUser(toSessionUser(res.usuario));
      }
      setPasswordActual('');
      setPassword('');
      setConfirmPassword('');
      notify('success', 'Tus datos fueron actualizados correctamente.');
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo actualizar el perfil.');
      notify('error', message, details);
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
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Email</label>
            <input className="soft-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Contraseña actual</label>
            <input type="password" className="soft-input" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Necesaria para cambiar la contraseña" />
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
