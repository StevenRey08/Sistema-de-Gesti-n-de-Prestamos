// ============================================================
// auth.ts — Autenticación real con el backend
// Todas las sesiones se verifican contra la base de datos
// ============================================================

export interface SessionUser {
  id: string;
  nombre: string;
  usuario: string;
  email: string;  // En este sistema es el campo "usuario" del backend
  rol: string;
  token?: string;
}

export const AUTH_STORAGE_KEY = 'sgp-session';

declare const process: { env: { NEXT_PUBLIC_API_URL?: string } };

/**
 * Convierte la respuesta del backend al formato de sesión del frontend.
 * El backend devuelve: { id, nombre, apellido, usuario, rol: { nombre_rol } }
 */
export function toSessionUser(rawUser: unknown): SessionUser {
  const user = rawUser as {
    id?: unknown;
    nombre?: unknown;
    apellido?: unknown;
    usuario?: unknown;
    email?: unknown;
    rol?: { nombre_rol?: string } | string | null;
    token?: string;
  };
  const rol = user.rol;

  return {
    id:     String(user.id ?? ''),
    nombre: `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim(),
    usuario: String(user.usuario ?? user.email ?? ''),
    email:  String(user.usuario ?? user.email ?? ''),
    rol:    typeof rol === 'object' && rol !== null
              ? (rol.nombre_rol ?? 'Sin rol')
              : String(rol ?? 'Sin rol'),
    token:  user.token as string | undefined,
  };
}

/**
 * Autentica al usuario contra el backend real.
 * Lanza un Error con mensaje legible si falla.
 */
export async function authenticate(usuario: string, contrasena: string): Promise<SessionUser | null> {
  const baseUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:4000/api';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:    JSON.stringify({ usuario, contrasena }),
    });
  } catch {
    throw new Error(
      'No se pudo conectar al servidor. Verifica que el backend esté corriendo en el puerto 4000.'
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as Record<string, string>;
    throw new Error(data?.error || 'Credenciales inválidas.');
  }

  const data = await response.json() as { token: string; usuario: Record<string, unknown> };
  return toSessionUser({ ...data.usuario, token: data.token });
}

/**
 * Persiste la sesión del usuario en localStorage.
 */
export function updateStoredCurrentUser(user: SessionUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}
