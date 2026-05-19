export const BASE_URL: string =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:4000/api';

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function getLocalStorageToken(): string | null {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') {
      return null;
    }
    const session = window.localStorage.getItem('sgp-session');
    if (session && session !== 'undefined' && session !== 'null') {
      const parsed = JSON.parse(session);
      if (parsed?.token) return parsed.token;
    }
    const directToken = window.localStorage.getItem('token');
    if (directToken && directToken !== 'undefined' && directToken !== 'null') {
      return directToken;
    }
  } catch {
  }
  return null;
}

async function request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getLocalStorageToken();
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

export const categoriasApi  = buildCrud('categorias');
export const personasApi    = buildCrud('personas');
export const ubicacionesApi = buildCrud('ubicaciones');
export const herramientasApi = buildCrud('inventario');
export const inventarioApi   = { ...buildCrud('inventario'), registrarSalida: (body: unknown) => request('/inventario/salida', { method: 'POST', body: JSON.stringify(body) }) };
export const prestamosApi    = { ...buildCrud('prestamos'), createLote: (body: unknown) => request('/prestamos/lote', { method: 'POST', body: JSON.stringify(body) }) };
export const movimientosApi  = { ...buildCrud('movimientos') };
export const rolesApi    = buildCrud('roles');
export const usuariosApi = buildCrud('usuarios');
export const permisosApi = buildCrud('permisos');
export const pedidosApi  = buildCrud('pedidos');
export const modulosApi  = buildCrud('modulos');
export const auditoriaApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/auditoria${qs ? `?${qs}` : ''}`);
  },
  getStats: () => request('/auditoria/stats'),
  exportLogs: () => request('/auditoria/export'),
  cleanOldLogs: (body: unknown) => request('/auditoria/clean', { method: 'POST', body: JSON.stringify(body) }),
};
export const sesionesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/sesiones${qs ? `?${qs}` : ''}`);
  },
  getMisSesiones: () => request('/sesiones/mis-sesiones'),
  cleanExpired: () => request('/sesiones/clean', { method: 'POST' }),
  revoke: (id: string) => request(`/sesiones/${id}`, { method: 'DELETE' }),
  revokeAllByUser: (usuario_id: string) => request(`/sesiones/revoke-all/${usuario_id}`, { method: 'POST' }),
};
export const politicasApi = {
  getAll: () => request('/politicas'),
  getByKey: (clave: string) => request(`/politicas/${clave}`),
  update: (id: string, body: unknown) => request(`/politicas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  seed: () => request('/politicas/seed', { method: 'POST' }),
};
export const reportesSeguridadApi = {
  getDashboard: () => request('/reportes-seguridad/dashboard'),
  getActividad: (usuario_id: string, dias = 30) => request(`/reportes-seguridad/actividad/${usuario_id}?dias=${dias}`),
  getUsuariosRiesgo: () => request('/reportes-seguridad/usuarios-riesgo'),
  resetIntentos: (usuario_id: string) => request(`/reportes-seguridad/reset-intentos/${usuario_id}`, { method: 'POST' }),
};

export function descargarPDFPrestamo(id: string): void {
  const token = getLocalStorageToken();
  const url = `${BASE_URL}/prestamos/${id}/pdf`;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.responseType = 'blob';
  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `prestamo-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }
  };
  xhr.send();
}

const api = {
  get:    (endpoint: string)                 => request(endpoint),
  post:   (endpoint: string, body: unknown)  => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint: string, body: unknown)  => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (endpoint: string, body: unknown)  => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (endpoint: string)                 => request(endpoint, { method: 'DELETE' }),
};

export default api;

export const BACKEND_ORIGIN = BASE_URL.endsWith('/api')
  ? BASE_URL.slice(0, -4)
  : BASE_URL.endsWith('/api/')
    ? BASE_URL.slice(0, -5)
    : BASE_URL;

export function imagenUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (/^[a-zA-Z]:/.test(path) || path.includes('\\')) {
    console.warn('Ruta de imagen local detectada e ignorada:', path);
    return undefined;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (BACKEND_ORIGIN === '/api' || BACKEND_ORIGIN === '') {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `http://localhost:4000${cleanPath}`;
    }
  }
  return `${BACKEND_ORIGIN}${cleanPath}`;
}
