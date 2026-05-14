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
    // Ignorar errores (SSR, incógnito, etc.)
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
export const inventarioApi   = buildCrud('inventario');
export const prestamosApi    = buildCrud('prestamos');
export const movimientosApi  = { ...buildCrud('movimientos') };

export const rolesApi    = buildCrud('roles');
export const usuariosApi = buildCrud('usuarios');
export const permisosApi = buildCrud('permisos');

const api = {
  get:    (endpoint: string)                 => request(endpoint),
  post:   (endpoint: string, body: unknown)  => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint: string, body: unknown)  => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (endpoint: string, body: unknown)  => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (endpoint: string)                 => request(endpoint, { method: 'DELETE' }),
};

export default api;

// Determinamos el origen del backend para las imágenes
// Si BASE_URL es 'http://localhost:4000/api', BACKEND_ORIGIN será 'http://localhost:4000'
export const BACKEND_ORIGIN = BASE_URL.endsWith('/api') 
  ? BASE_URL.slice(0, -4) 
  : BASE_URL.endsWith('/api/') 
    ? BASE_URL.slice(0, -5)
    : BASE_URL;

export function imagenUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  
  // Si ya es una URL absoluta, la devolvemos tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Si detectamos que es una ruta local de Windows (empieza por C:, D:, etc. o tiene barras invertidas)
  // no podemos servirla directamente, así que retornamos undefined para que se use el placeholder
  if (/^[a-zA-Z]:/.test(path) || path.includes('\\')) {
    console.warn('Ruta de imagen local detectada e ignorada:', path);
    return undefined;
  }
  
  // Aseguramos que el path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Si BACKEND_ORIGIN es relativo (ej: /api), intentamos usar el puerto 4000 por defecto si estamos en localhost
  if (BACKEND_ORIGIN === '/api' || BACKEND_ORIGIN === '') {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `http://localhost:4000${cleanPath}`;
    }
  }

  return `${BACKEND_ORIGIN}${cleanPath}`;
}

