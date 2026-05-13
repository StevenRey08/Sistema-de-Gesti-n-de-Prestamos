// ============================================================
// types.ts — Interfaces de dominio para todo el frontend
// Sincronizado con el esquema del backend (PostgreSQL + Prisma)
// ============================================================

// ── Catálogos ─────────────────────────────────────────────

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Persona {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  telefono?: string | null;
  email?: string | null;
}

// ── Almacenamiento (Unificado) ─────────────────────────────

export interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string; // 'ESTANTE', 'CAJA', 'ESTUCHE'
  descripcion?: string | null;
  ubicacion_padre_id?: string | null;
  padre?: Ubicacion | null;
}

// ── Inventario y herramientas ─────────────────────────────

export interface Herramienta {
  id: string;
  codigo: string;
  nombre: string;
  categoria_id?: string | null;
  valor_estimado?: number | string | null;
  categoria?: Categoria | null;
}

export type EstadoInventario = 'Nuevo' | 'Usado' | 'Dañado' | string;

export interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  estado?: string | null;
  cantidad: number;
  imagen_ruta?: string | null;
  categoria_id?: string | null;
  ubicacion_id?: string | null;
  categoria?: Categoria | null;
  ubicacion?: Ubicacion | null;
}

// ── Préstamos ─────────────────────────────────────────────

export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO' | string;

export interface Prestamo {
  id: string;
  inventario_id: string;
  persona_id: string;
  usuario_id: string;
  cantidad: number;
  fecha_prestamo: string | null;
  fecha_devolucion: string | null;
  estado: EstadoPrestamo;
  observaciones?: string | null;
  inventario?: ItemInventario | null;
  persona?: Persona | null;
  usuario?: Usuario | null;
}

// ── Movimientos ───────────────────────────────────────────

export interface Movimiento {
  id: string;
  tipo: string; // 'ENTRADA', 'SALIDA', 'TRASLADO', 'PRESTAMO'
  inventario_id: string;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  persona_id?: string | null;
  usuario_id?: string | null;
  prestamo_id?: string | null;
  cantidad: number;
  fecha: string | null;
  observaciones?: string | null;
  inventario?: ItemInventario | null;
  ubicacion_origen?: Ubicacion | null;
  ubicacion_destino?: Ubicacion | null;
  persona?: Persona | null;
  usuario?: Usuario | null;
}

// ── Formularios (payloads enviados al backend) ────────────

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string;
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
  categoria_id?: string | null;
  valor_estimado?: number | null;
}

export interface InventarioPayload {
  codigo?: string;
  nombre: string;
  categoria_id?: string | null;
  ubicacion_id?: string | null;
  estado?: string;
  cantidad: number;
  imagen_ruta?: string | null;
}

export interface PrestamoPayload {
  inventario_id: string;
  persona_id: string;
  usuario_id: string;
  cantidad: number;
  fecha_devolucion?: string | null;
  estado: EstadoPrestamo;
  observaciones?: string;
}

// ── Dashboard ─────────────────────────────────────────────

export interface DashboardCounts {
  articulos: number;
  categorias: number;
  personas: number;
  prestamos_activos: number;
  alertas_stock: number;
}

// ── Seguridad ─────────────────────────────────────────────

export interface Role {
  id: string;
  nombre_rol: string;
  descripcion?: string | null;
}

export interface RolePayload {
  nombre_rol: string;
  descripcion?: string;
}

export interface Modulo {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Permiso {
  id: string;
  rol_id: string;
  modulo_id: string;
  leer: boolean;
  ingresar: boolean;
  actualizar: boolean;
  eliminar: boolean;
  rol?: Role | null;
  modulo?: Modulo | null;
}

export interface PermisoPayload {
  rol_id: string;
  modulo_id: string;
  leer: boolean;
  ingresar: boolean;
  actualizar: boolean;
  eliminar: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  rol_id?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  activo: boolean;
  rol?: Role | null;
}

export interface UsuarioPayload {
  nombre: string;
  apellido: string;
  usuario: string;
  contrasena?: string;
  rol_id?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  activo: boolean;
}

// ── Errores de validación de formulario ───────────────────

export type FormErrors<T> = Partial<Record<keyof T, string>>;
