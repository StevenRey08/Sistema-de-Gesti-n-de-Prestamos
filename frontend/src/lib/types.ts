// ============================================================
// types.ts — Interfaces de dominio para todo el frontend
// Cada entidad del backend tiene su tipo aquí definido.
// ============================================================

// ── Catálogos ─────────────────────────────────────────────

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Proveedor {
  id: number;
  codigo: string;
  nombre_empresa: string;
  nombre_contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface Persona {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  telefono?: string | null;
  email?: string | null;
}

// ── Almacenamiento ────────────────────────────────────────

export interface Estante {
  id: number;
  codigo: string;
  ubicacion: string;
}

export interface Caja {
  id: number;
  codigo: string;
}

// ── Inventario y herramientas ─────────────────────────────

export interface Herramienta {
  id: number;
  codigo: string;
  nombre: string;
  categoria_id?: number | null;
  proveedor_id?: number | null;
  valor_estimado?: number | string | null;
  categoria?: Categoria | null;
  proveedor?: Proveedor | null;
}

export type EstadoInventario = 'Nuevo' | 'Usado' | 'Dañado';

export interface ItemInventario {
  id: number;
  herramienta_id: number;
  estado: EstadoInventario;
  cantidad: number;
  caja_id?: number | null;
  estante_id?: number | null;
  herramienta?: Herramienta | null;
  caja?: Caja | null;
  estante?: Estante | null;
}

// ── Préstamos ─────────────────────────────────────────────

export type EstadoPrestamo = 'Pendiente' | 'Devuelto';

export interface Prestamo {
  id: number;
  inventario_id: number;
  persona_id: number;
  cantidad: number;
  fecha_prestamo: string | null;
  fecha_devolucion: string | null;
  estado: EstadoPrestamo;
  observaciones?: string | null;
  inventario?: ItemInventario | null;
  persona?: Persona | null;
}

// ── Formularios (payloads enviados al backend) ────────────

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string;
}

export interface ProveedorPayload {
  codigo: string;
  nombre_empresa: string;
  nombre_contacto?: string;
  telefono?: string;
  email?: string;
}

export interface PersonaPayload {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  telefono?: string;
  email?: string;
}

export interface HerramientaPayload {
  codigo: string;
  nombre: string;
  categoria_id?: number | null;
  proveedor_id?: number | null;
  valor_estimado?: number | null;
}

export interface InventarioPayload {
  herramienta_id: number | string;
  estado: EstadoInventario;
  cantidad: number;
  caja_id?: number | string | null;
  estante_id?: number | string | null;
}

export interface PrestamoPayload {
  inventario_id: number | string;
  persona_id: number | string;
  cantidad: number;
  fecha_devolucion?: string | null;
  estado: EstadoPrestamo;
  observaciones?: string;
}

export interface Movimiento {
  id: number;
  tipo: string;
  inventario_id: number;
  persona_id?: number | null;
  cantidad: number;
  caja_origen_id?: number | null;
  estante_origen_id?: number | null;
  caja_destino_id?: number | null;
  estante_destino_id?: number | null;
  fecha: string | null;
  observaciones?: string | null;
  inventario?: ItemInventario | null;
  persona?: Persona | null;
  caja_origen?: Caja | null;
  estante_origen?: Estante | null;
  caja_destino?: Caja | null;
  estante_destino?: Estante | null;
}

// ── Dashboard ─────────────────────────────────────────────

export interface DashboardCounts {
  prestamos: number;
  herramientas: number;
  personas: number;
  pendientes: number;
}

// ── Seguridad ─────────────────────────────────────────────

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

export interface ManagedUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  password: string;
  estado: 'Activo' | 'Inactivo';
}

// ── Errores de validación de formulario ───────────────────

export type FormErrors<T> = Partial<Record<keyof T, string>>;
