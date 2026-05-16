'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { permisosApi, rolesApi, usuariosApi } from '../../lib/api';
import type { Permiso, PermisoPayload, Role, Usuario, UsuarioPayload } from '../../lib/types';
import RoleForm from '../../components/seguridad/RoleForm';
import UsuarioForm from '../../components/seguridad/UsuarioForm';
import FilterableSelect from '../../components/ui/FilterableSelect';
import { useAuth } from '../../components/auth/AuthProvider';
import { toSessionUser } from '../../lib/auth';
import { usePermiso } from '../../lib/permissions';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

type TabKey = 'roles' | 'permisos' | 'usuarios';

const EMPTY_PERMISSION: PermisoPayload = {
  rol_id: '',
  modulo_id: '',
  leer: false,
  ingresar: false,
  actualizar: false,
  eliminar: false,
};

export default function SeguridadPage() {
  const { user, updateCurrentUser } = useAuth();
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('USUARIOS');
  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permiso[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermisoPayload>(EMPTY_PERMISSION);
  const [savingPermissionId, setSavingPermissionId] = useState<string | null>(null);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<string | null>(null);
  const [confirmDeletePermiso, setConfirmDeletePermiso] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData, usersData] = await Promise.all([
        rolesApi.getAll() as Promise<Role[]>,
        permisosApi.getAll() as Promise<Permiso[]>,
        usuariosApi.getAll() as Promise<Usuario[]>,
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);
      setUsers(usersData);
      setPermissionForm((prev) => ({
        ...prev,
        rol_id: prev.rol_id || '',
      }));
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar el módulo de seguridad.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(
    () => [
      { label: 'Roles', value: roles.length },
      { label: 'Permisos', value: permissions.length },
      { label: 'Usuarios', value: users.length },
    ],
    [permissions.length, roles.length, users.length]
  );

  const moduleOptions = useMemo(() => {
    const uniqueModules = new Map<string, { value: string; label: string }>();
    permissions.forEach((permission) => {
      if (permission.modulo?.id && permission.modulo?.nombre) {
        uniqueModules.set(permission.modulo.id, {
          value: permission.modulo.id,
          label: permission.modulo.nombre,
        });
      }
    });
    return [...uniqueModules.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    const term = roleSearch.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) =>
      `${role.nombre_rol} ${role.descripcion ?? ''}`.toLowerCase().includes(term)
    );
  }, [roleSearch, roles]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((managedUser) =>
      `${managedUser.nombre} ${managedUser.apellido} ${managedUser.usuario} ${managedUser.rol?.nombre_rol ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [userSearch, users]);

  const filteredPermissions = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter((permission) =>
      `${permission.rol?.nombre_rol ?? ''} ${permission.modulo?.nombre ?? ''}`.toLowerCase().includes(term)
    );
  }, [permissionSearch, permissions]);

  async function handleSaveRole(form: { nombre_rol: string; descripcion?: string }) {
    if (editingRole) {
      await rolesApi.update(editingRole.id, form);
    } else {
      await rolesApi.create(form);
    }
    setShowRoleForm(false);
    setEditingRole(null);
    await loadData();
  }

  async function handleDeleteRole(id: string) {
    try {
      await rolesApi.delete(id);
      setConfirmDeleteRole(null);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo eliminar el rol.');
      notify('error', message, details);
    }
  }

  async function handleSaveUser(form: UsuarioPayload) {
    if (editingUser) {
      const payload = {
        ...form,
        contrasena: form.contrasena || undefined,
      };
      const updated = await usuariosApi.update(editingUser.id, payload) as Usuario;
      if (updated.id === user?.id) {
        updateCurrentUser(toSessionUser(updated));
      }
    } else {
      await usuariosApi.create(form);
    }
    setShowUserForm(false);
    setEditingUser(null);
    await loadData();
  }

  async function handleToggleUser(userToToggle: Usuario) {
    try {
      const updated = await usuariosApi.update(userToToggle.id, {
        nombre: userToToggle.nombre,
        apellido: userToToggle.apellido,
        usuario: userToToggle.usuario,
        rol_id: userToToggle.rol_id ?? null,
        tipo_documento: userToToggle.tipo_documento ?? null,
        numero_documento: userToToggle.numero_documento ?? null,
        activo: !userToToggle.activo,
      }) as Usuario;

      if (updated.id === user?.id) {
        updateCurrentUser(toSessionUser(updated));
      }
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo actualizar el estado del usuario.');
      notify('error', message, details);
    }
  }

  async function handleDeletePermission(id: string) {
    try {
      await permisosApi.delete(id);
      setConfirmDeletePermiso(null);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo eliminar el permiso.');
      notify('error', message, details);
    }
  }

  async function handleCreatePermission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!permissionForm.rol_id || !permissionForm.modulo_id) {
      notify('error', 'Revisa los datos del permiso', ['Selecciona un rol y un módulo.']);
      return;
    }

    try {
      await permisosApi.create(permissionForm);
      setPermissionForm({
        ...EMPTY_PERMISSION,
        rol_id: permissionForm.rol_id,
      });
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo crear el permiso.');
      notify('error', message, details);
    }
  }

  async function handleUpdatePermission(permission: Permiso) {
    setSavingPermissionId(permission.id);
    try {
      await permisosApi.update(permission.id, {
        rol_id: permission.rol_id,
        modulo_id: permission.modulo_id,
        leer: permission.leer,
        ingresar: permission.ingresar,
        actualizar: permission.actualizar,
        eliminar: permission.eliminar,
      });
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo actualizar el permiso.');
      notify('error', message, details);
    } finally {
      setSavingPermissionId(null);
    }
  }

  function updatePermissionState(id: string, key: keyof Pick<Permiso, 'leer' | 'ingresar' | 'actualizar' | 'eliminar'>) {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id ? { ...permission, [key]: !permission[key] } : permission
      )
    );
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Seguridad</h1>
          <p className="page-subtitle">Administra roles, permisos y usuarios desde el backend real del sistema.</p>
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
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="search"
              value={roleSearch}
              onChange={(event) => setRoleSearch(event.target.value)}
              placeholder="Buscar rol..."
              className="soft-input max-w-sm"
            />
            {puedeIngresar && (
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleForm(true);
                }}
                className="soft-btn-primary"
              >
                + Nuevo rol
              </button>
            )}
          </div>

          <div className="table-shell">
            {loading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando roles...</p>
            ) : filteredRoles.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">No hay roles para mostrar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id}>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{role.nombre_rol}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{role.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-3">
                        {puedeActualizar && (
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setShowRoleForm(true);
                            }}
                            className="text-sm font-medium text-[var(--accent)]"
                          >
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button onClick={() => setConfirmDeleteRole(role.id)} className="text-sm font-medium text-[var(--danger)]">
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {activeTab === 'permisos' && (
        <section className="space-y-6">
          {puedeIngresar && (
          <form onSubmit={handleCreatePermission} className="surface-card grid gap-4 p-6 lg:grid-cols-[1fr_1fr_auto]">
            <FilterableSelect
              label="Rol"
              options={roles.map((role) => ({ value: role.id, label: role.nombre_rol }))}
              value={permissionForm.rol_id}
              onChange={(value) => setPermissionForm((prev) => ({ ...prev, rol_id: value }))}
            />
            <FilterableSelect
              label="Módulo"
              options={moduleOptions}
              value={permissionForm.modulo_id}
              onChange={(value) => setPermissionForm((prev) => ({ ...prev, modulo_id: value }))}
            />
            <div className="flex items-end">
              <button type="submit" className="soft-btn-primary w-full">Agregar permiso</button>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text-main)]"><input type="checkbox" checked={permissionForm.leer} onChange={() => setPermissionForm((prev) => ({ ...prev, leer: !prev.leer }))} /> Leer</label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-main)]"><input type="checkbox" checked={permissionForm.ingresar} onChange={() => setPermissionForm((prev) => ({ ...prev, ingresar: !prev.ingresar }))} /> Ingresar</label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-main)]"><input type="checkbox" checked={permissionForm.actualizar} onChange={() => setPermissionForm((prev) => ({ ...prev, actualizar: !prev.actualizar }))} /> Actualizar</label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-main)]"><input type="checkbox" checked={permissionForm.eliminar} onChange={() => setPermissionForm((prev) => ({ ...prev, eliminar: !prev.eliminar }))} /> Eliminar</label>
          </form>
          )}

          <input
            type="search"
            value={permissionSearch}
            onChange={(event) => setPermissionSearch(event.target.value)}
            placeholder="Buscar por rol o módulo..."
            className="soft-input max-w-sm"
          />

          <div className="table-shell">
            {loading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando permisos...</p>
            ) : filteredPermissions.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">No hay permisos para mostrar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Módulo</th>
                    <th className="px-4 py-3 text-center">Leer</th>
                    <th className="px-4 py-3 text-center">Ingresar</th>
                    <th className="px-4 py-3 text-center">Actualizar</th>
                    <th className="px-4 py-3 text-center">Eliminar</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{permission.rol?.nombre_rol || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{permission.modulo?.nombre || '—'}</td>
                      {(['leer', 'ingresar', 'actualizar', 'eliminar'] as const).map((key) => (
                        <td key={key} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permission[key]}
                            onChange={() => updatePermissionState(permission.id, key)}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right space-x-3">
                        {puedeActualizar && (
                          <button onClick={() => void handleUpdatePermission(permission)} className="text-sm font-medium text-[var(--accent)]">
                            {savingPermissionId === permission.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        )}
                        {puedeEliminar && (
                          <button onClick={() => setConfirmDeletePermiso(permission.id)} className="text-sm font-medium text-[var(--danger)]">
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {activeTab === 'usuarios' && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Buscar por nombre, usuario o rol..."
              className="soft-input max-w-sm"
            />
            {puedeIngresar && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserForm(true);
                }}
                className="soft-btn-primary"
              >
                + Nuevo usuario
              </button>
            )}
          </div>

          <div className="table-shell">
            {loading ? (
              <p className="py-12 text-center text-[var(--text-muted)]">Cargando usuarios...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="py-12 text-center text-[var(--text-muted)]">No hay usuarios para mostrar.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((managedUser) => (
                    <tr key={managedUser.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-main)]">{managedUser.nombre} {managedUser.apellido}</p>
                        <p className="text-xs text-[var(--text-muted)]">{managedUser.usuario}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{managedUser.rol?.nombre_rol || 'Sin rol'}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${managedUser.activo ? 'status-success' : 'status-warning'}`}>
                          {managedUser.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        {puedeActualizar && (
                          <button
                            onClick={() => {
                              setEditingUser(managedUser);
                              setShowUserForm(true);
                            }}
                            className="text-sm font-medium text-[var(--accent)]"
                          >
                            Editar
                          </button>
                        )}
                        {puedeActualizar && (
                          <button onClick={() => void handleToggleUser(managedUser)} className="text-sm font-medium text-[var(--accent-strong)]">
                            {managedUser.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {showRoleForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl p-6">
            <RoleForm
              initialData={editingRole}
              onSuccess={handleSaveRole}
              onCancel={() => {
                setShowRoleForm(false);
                setEditingRole(null);
              }}
            />
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-3xl p-6">
            <UsuarioForm
              initialData={editingUser}
              roles={roles}
              onSuccess={handleSaveUser}
              onCancel={() => {
                setShowUserForm(false);
                setEditingUser(null);
              }}
            />
          </div>
        </div>
      )}

      {confirmDeleteRole && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="font-medium text-[var(--text-main)]">¿Eliminar este rol?</p>
            <p className="text-sm text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmDeleteRole(null)} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => void handleDeleteRole(confirmDeleteRole)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeletePermiso && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm space-y-4 p-6 text-center">
            <p className="font-medium text-[var(--text-main)]">¿Eliminar este permiso?</p>
            <p className="text-sm text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmDeletePermiso(null)} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => void handleDeletePermission(confirmDeletePermiso)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
