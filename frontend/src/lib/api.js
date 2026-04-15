// ============================================================
// api.js — Cliente central para comunicarse con el backend
// Todas las llamadas al servidor pasan por aquí
// Backend corre en: http://localhost:4000
// ============================================================

const BASE_URL = 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// ── PERSONAS ──────────────────────────────────────────────
export const personasApi = {
  getAll: (search = '') => request(`/personas${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/personas/${id}`),
  create: (body) => request('/personas', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/personas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/personas/${id}`, { method: 'DELETE' }),
};

// ── PROVEEDORES ───────────────────────────────────────────
export const proveedoresApi = {
  getAll: (search = '') => request(`/proveedores${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/proveedores/${id}`),
  create: (body) => request('/proveedores', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/proveedores/${id}`, { method: 'DELETE' }),
};

// ── CATEGORÍAS ────────────────────────────────────────────
export const categoriasApi = {
  getAll: (search = '') => request(`/categorias${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/categorias/${id}`),
  create: (body) => request('/categorias', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/categorias/${id}`, { method: 'DELETE' }),
};

// ── ESTANTES ──────────────────────────────────────────────
export const estantesApi = {
  getAll: (search = '') => request(`/estantes${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/estantes/${id}`),
  create: (body) => request('/estantes', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/estantes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/estantes/${id}`, { method: 'DELETE' }),
};

// ── CAJAS ─────────────────────────────────────────────────
export const cajasApi = {
  getAll: (search = '') => request(`/cajas${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/cajas/${id}`),
  create: (body) => request('/cajas', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/cajas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/cajas/${id}`, { method: 'DELETE' }),
};

// ── INVENTARIO ────────────────────────────────────────────
export const inventarioApi = {
  getAll: (search = '') => request(`/inventario${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/inventario/${id}`),
  create: (body) => request('/inventario', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/inventario/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/inventario/${id}`, { method: 'DELETE' }),
};

// ── PRÉSTAMOS ─────────────────────────────────────────────
export const prestamosApi = {
  getAll: (search = '') => request(`/prestamos${search ? `?search=${search}` : ''}`),
  getById: (id) => request(`/prestamos/${id}`),
  create: (body) => request('/prestamos', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/prestamos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/prestamos/${id}`, { method: 'DELETE' }),
};

// ── MOVIMIENTOS ───────────────────────────────────────────
export const movimientosApi = {
  getAll: (search = '') => request(`/movimientos${search ? `?search=${search}` : ''}`),
};

// Exportación default: objeto que agrupa todos los endpoints
const api = {
  get:    (endpoint) => request(endpoint),
  post:   (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;