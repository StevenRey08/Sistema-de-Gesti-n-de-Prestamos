'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import {
  getPermissions,
  getRoles,
  getUsers,
  savePermissions,
  saveRoles,
  saveUsers,
  toSessionUser,
} from '../../lib/auth';
import type { ManagedUser, SecurityPermission, SecurityRole } from '../../lib/types';

type TabKey = 'roles' | 'permisos' | 'usuarios';

const EMPTY_ROLE = { nombre: '', descripcion: '' };
const EMPTY_PERMISSION = { clave: '', descripcion: '' };
type UserFormState = {
  nombre: string;
  email: string;
  rol: string;
  password: string;
  estado: ManagedUser['estado'];
};

const EMPTY_USER: UserFormState = { nombre: '', email: '', rol: 'Administrador', password: '', estado: 'Activo' };

export default function SeguridadPage() {
  const { user, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);

  const [roleForm, setRoleForm] = useState(EMPTY_ROLE);
  const [permissionForm, setPermissionForm] = useState(EMPTY_PERMISSION);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER);

  useEffect(() => {
    const loadedRoles = getRoles();
    const loadedPermissions = getPermissions();
    const loadedUsers = getUsers();

    setRoles(loadedRoles);
    setPermissions(loadedPermissions);
    setUsers(loadedUsers);
    if (loadedRoles.length > 0) {
      setUserForm((prev) => ({ ...prev, rol: loadedRoles[0].nombre }));
    }
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Roles', value: roles.length },
      { label: 'Permisos', value: permissions.length },
      { label: 'Usuarios', value: users.length },
    ],
    [permissions.length, roles.length, users.length]
  );

  function addRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!roleForm.nombre.trim()) return;

    const next = [
      ...roles,
      {
        id: `rol-${crypto.randomUUID()}`,
        nombre: roleForm.nombre.trim(),
        descripcion: roleForm.descripcion.trim(),
      },
    ];
    setRoles(next);
    saveRoles(next);
    setRoleForm(EMPTY_ROLE);
  }

  function addPermission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!permissionForm.clave.trim()) return;

    const next = [
      ...permissions,
      {
        id: `perm-${crypto.randomUUID()}`,
        clave: permissionForm.clave.trim(),
        descripcion: permissionForm.descripcion.trim(),
      },
    ];
    setPermissions(next);
    savePermissions(next);
    setPermissionForm(EMPTY_PERMISSION);
  }

  function addUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userForm.nombre.trim() || !userForm.email.trim() || !userForm.password.trim()) return;

    const nextUser: ManagedUser = {
      id: `usr-${crypto.randomUUID()}`,
      nombre: userForm.nombre.trim(),
      email: userForm.email.trim(),
      rol: userForm.rol,
      password: userForm.password,
      estado: userForm.estado,
    };
    const next = [...users, nextUser];
    setUsers(next);
    saveUsers(next);
    setUserForm({ ...EMPTY_USER, rol: roles[0]?.nombre || 'Administrador' });
  }

  function removeRole(id: string) {
    const next = roles.filter((role) => role.id !== id);
    setRoles(next);
    saveRoles(next);
  }

  function removePermission(id: string) {
    const next = permissions.filter((permission) => permission.id !== id);
    setPermissions(next);
    savePermissions(next);
  }

  function toggleUserStatus(id: string) {
    const next: ManagedUser[] = users.map((item) =>
      item.id === id ? { ...item, estado: item.estado === 'Activo' ? 'Inactivo' : 'Activo' } : item
    );
    setUsers(next);
    saveUsers(next);

    const current = next.find((item) => item.id === user?.id);
    if (current) {
      updateCurrentUser(toSessionUser(current));
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Seguridad</h1>
          <p className="page-subtitle">Administra roles, permisos y usuarios desde un solo módulo.</p>
        </div>
        <div className="flex gap-2">
          {(['roles', 'permisos', 'usuarios'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((item) => (
          <div key={item.label} className="stats-card">
            <p>{item.label}</p>
            <p>{item.value}</p>
          </div>
        ))}
      </div>

      {activeTab === 'roles' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={addRole} className="surface-card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Nuevo rol</h2>
            <input className="soft-input" placeholder="Nombre del rol" value={roleForm.nombre} onChange={(e) => setRoleForm((prev) => ({ ...prev, nombre: e.target.value }))} />
            <textarea className="soft-textarea" placeholder="Descripción del rol" value={roleForm.descripcion} onChange={(e) => setRoleForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
            <button type="submit" className="soft-btn-primary">Guardar rol</button>
          </form>

          <div className="table-shell">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">{role.nombre}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{role.descripcion || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeRole(role.id)} className="text-sm font-medium text-[var(--danger)]">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'permisos' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={addPermission} className="surface-card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Nuevo permiso</h2>
            <input className="soft-input" placeholder="Clave del permiso" value={permissionForm.clave} onChange={(e) => setPermissionForm((prev) => ({ ...prev, clave: e.target.value }))} />
            <textarea className="soft-textarea" placeholder="Descripción del permiso" value={permissionForm.descripcion} onChange={(e) => setPermissionForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
            <button type="submit" className="soft-btn-primary">Guardar permiso</button>
          </form>

          <div className="table-shell">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Clave</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--accent-strong)]">{permission.clave}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{permission.descripcion || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removePermission(permission.id)} className="text-sm font-medium text-[var(--danger)]">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={addUser} className="surface-card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Nuevo usuario</h2>
            <input className="soft-input" placeholder="Nombre completo" value={userForm.nombre} onChange={(e) => setUserForm((prev) => ({ ...prev, nombre: e.target.value }))} />
            <input className="soft-input" placeholder="Correo electrónico" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} />
            <select className="soft-select" value={userForm.rol} onChange={(e) => setUserForm((prev) => ({ ...prev, rol: e.target.value }))}>
              {roles.map((role) => <option key={role.id} value={role.nombre}>{role.nombre}</option>)}
            </select>
            <input type="password" className="soft-input" placeholder="Contraseña temporal" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} />
            <select className="soft-select" value={userForm.estado} onChange={(e) => setUserForm((prev) => ({ ...prev, estado: e.target.value as ManagedUser['estado'] }))}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            <button type="submit" className="soft-btn-primary">Guardar usuario</button>
          </form>

          <div className="table-shell">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((managedUser) => (
                  <tr key={managedUser.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-main)]">{managedUser.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">{managedUser.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{managedUser.rol}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${managedUser.estado === 'Activo' ? 'status-success' : 'status-warning'}`}>
                        {managedUser.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleUserStatus(managedUser.id)} className="text-sm font-medium text-[var(--accent-strong)]">
                        {managedUser.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
