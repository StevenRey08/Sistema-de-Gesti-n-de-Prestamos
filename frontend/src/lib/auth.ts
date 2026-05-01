export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface ManagedUser extends SessionUser {
  password: string;
  estado: 'Activo' | 'Inactivo';
}

export interface SecurityRole {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface SecurityPermission {
  id: string;
  clave: string;
  descripcion: string;
}

export const AUTH_STORAGE_KEY = 'sgp-session';
export const USERS_STORAGE_KEY = 'sgp-users';
export const ROLES_STORAGE_KEY = 'sgp-roles';
export const PERMISSIONS_STORAGE_KEY = 'sgp-permissions';

const DEFAULT_ROLES: SecurityRole[] = [
  { id: 'rol-admin', nombre: 'Administrador', descripcion: 'Acceso completo al sistema.' },
  { id: 'rol-operador', nombre: 'Operador', descripcion: 'Gestiona inventario, préstamos y movimientos.' },
];

const DEFAULT_PERMISSIONS: SecurityPermission[] = [
  { id: 'perm-inv', clave: 'inventario.gestionar', descripcion: 'Crear y editar herramientas e inventario.' },
  { id: 'perm-pre', clave: 'prestamos.gestionar', descripcion: 'Registrar préstamos y devoluciones.' },
  { id: 'perm-sec', clave: 'seguridad.gestionar', descripcion: 'Administrar usuarios, roles y permisos.' },
];

const DEFAULT_USERS: ManagedUser[] = [
  {
    id: 'usr-admin',
    nombre: 'Administrador General',
    email: 'admin@sistema.local',
    password: 'Admin123*',
    rol: 'Administrador',
    estado: 'Activo',
  },
];

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  if (!canUseStorage()) return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(stored) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeCollection<T>(key: string, value: T[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers() {
  return readCollection<ManagedUser>(USERS_STORAGE_KEY, DEFAULT_USERS);
}

export function saveUsers(users: ManagedUser[]) {
  writeCollection(USERS_STORAGE_KEY, users);
}

export function getRoles() {
  return readCollection<SecurityRole>(ROLES_STORAGE_KEY, DEFAULT_ROLES);
}

export function saveRoles(roles: SecurityRole[]) {
  writeCollection(ROLES_STORAGE_KEY, roles);
}

export function getPermissions() {
  return readCollection<SecurityPermission>(PERMISSIONS_STORAGE_KEY, DEFAULT_PERMISSIONS);
}

export function savePermissions(permissions: SecurityPermission[]) {
  writeCollection(PERMISSIONS_STORAGE_KEY, permissions);
}

export function toSessionUser(user: ManagedUser): SessionUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
  };
}

export function authenticate(email: string, password: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail &&
      item.password === password &&
      item.estado === 'Activo'
  );

  return user ? toSessionUser(user) : null;
}

export function updateStoredCurrentUser(user: SessionUser) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getDemoCredentials() {
  const user = getUsers()[0];
  return {
    email: user.email,
    password: user.password,
  };
}
