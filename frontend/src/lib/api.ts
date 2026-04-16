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
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.detail || data?.message || 'Error en la solicitud');
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
export const proveedoresApi = buildCrud('proveedores');

// ── Almacenamiento ────────────────────────────────────────
export const estantesApi = buildCrud('estantes');
export const cajasApi    = buildCrud('cajas');

// ── Módulos principales ───────────────────────────────────
export const herramientasApi = buildCrud('herramientas');
export const inventarioApi   = buildCrud('inventario');
export const prestamosApi    = buildCrud('prestamos');
export const movimientosApi  = {
  ...buildCrud('movimientos'),
};

// ── Cliente genérico (para casos especiales) ──────────────
const api = {
  get:    (endpoint: string)                 => request(endpoint),
  post:   (endpoint: string, body: unknown)  => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint: string, body: unknown)  => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint: string)                 => request(endpoint, { method: 'DELETE' }),
};

export default api;
