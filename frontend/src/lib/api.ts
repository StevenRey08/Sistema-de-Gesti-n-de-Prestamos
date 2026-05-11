// ============================================================
// api.ts — Cliente central para comunicarse con el backend
// Todas las llamadas al servidor pasan por aquí
// Backend corre en: http://localhost:4000
// ============================================================

declare const process: { env: { NEXT_PUBLIC_API_URL?: string } };
const BASE_URL: string =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000/api';

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Obtener token de localStorage como fallback (cuando la cookie no aplica, ej. desarrollo cross-origin)
  let token = null;
  if (typeof window !== 'undefined') {
    const session = window.localStorage.getItem('sgp-session');
    if (session && session !== 'undefined' && session !== 'null') {
      try {
        const parsed = JSON.parse(session);
        token = parsed?.token || null;
      } catch {
        // Silently handle
      }
    }
    if (!token) {
      const directToken = window.localStorage.getItem('token');
      if (directToken && directToken !== 'undefined' && directToken !== 'null') {
        token = directToken;
      }
    }
  }

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData(options.body)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data?.mensaje || data?.error || data?.message || 'Error en la solicitud');
    // Guardamos los detalles (ej. errores de validación) para mostrarlos en la UI
    (error as Error & { details?: unknown[] }).details = Array.isArray(data?.detalles) ? data.detalles : [];
    throw error;
  }
  return data as T;
}

function buildCrud(resource: string) {
  return {
    getAll:   (search = '')          => request(`/${resource}${search ? `?search=${search}` : ''}`),
    getById:  (id: number | string)  => request(`/${resource}/${id}`),
    create:   (body: unknown)        => request(`/${resource}`, { method: 'POST', body: isFormData(body) ? body : JSON.stringify(body) }),
    update:   (id: number | string, body: unknown) =>
                                        request(`/${resource}/${id}`, { method: 'PUT', body: isFormData(body) ? body : JSON.stringify(body) }),
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
  patch:  (endpoint: string, body: unknown)  => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (endpoint: string)                 => request(endpoint, { method: 'DELETE' }),
};

export default api;

