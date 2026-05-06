// ============================================================
// api.ts — Cliente central para comunicarse con el backend
// Todas las llamadas al servidor pasan por aquí
// Backend corre en: http://localhost:4000
// ============================================================

declare const process: { env: { NEXT_PUBLIC_API_URL?: string } };
const BASE_URL: string =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000/api';

async function request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Intentar obtener el token del localStorage (solo en el cliente)
  let token = null;
  if (typeof window !== 'undefined') {
    // Primero buscamos si está guardado directamente como 'token'
    token = window.localStorage.getItem('token');
    
    // Si no, buscamos dentro del objeto de sesión 'sgp-session'
    if (!token) {
      const session = window.localStorage.getItem('sgp-session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          token = parsed.token || null;
        } catch (e) {
          console.error('Error al parsear la sesión para obtener el token', e);
        }
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data?.error || data?.mensaje || data?.message || 'Error en la solicitud');
    // Guardamos los detalles (ej. errores de validación) para mostrarlos en la UI
    (error as any).details = data?.detalles || [];
    throw error;
  }
  return data as T;
}

function buildCrud(resource: string) {
  return {
    getAll:   (search = '')          => request(`/${resource}${search ? `?search=${search}` : ''}`),
    getById:  (id: number | string)  => request(`/${resource}/${id}`),
    create:   (body: unknown)        => request(`/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
    update:   (id: number | string, body: unknown) =>
                                        request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete:   (id: number | string)  => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

// ── Catálogos ─────────────────────────────────────────────
export const categoriasApi  = buildCrud('categorias');
export const personasApi    = buildCrud('personas');

// ── Almacenamiento ────────────────────────────────────────
export const ubicacionesApi = buildCrud('ubicaciones');

// ── Módulos principales ───────────────────────────────────
export const herramientasApi = buildCrud('inventario');
export const inventarioApi   = buildCrud('inventario');
export const prestamosApi    = buildCrud('prestamos');
export const movimientosApi  = { ...buildCrud('movimientos') };

// ── Seguridad ─────────────────────────────────────────────
export const rolesApi    = buildCrud('roles');
export const usuariosApi = buildCrud('usuarios');
export const permisosApi = buildCrud('permisos');

// ── Cliente genérico (para casos especiales) ──────────────
const api = {
  get:    (endpoint: string)                 => request(endpoint),
  post:   (endpoint: string, body: unknown)  => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint: string, body: unknown)  => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint: string)                 => request(endpoint, { method: 'DELETE' }),
};

export default api;

