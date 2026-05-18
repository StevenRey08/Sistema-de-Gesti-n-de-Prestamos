export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion_id?: string | null;
  ubicacion?: Ubicacion | null;
}

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string | null;
  ubicacion_id?: string | null;
}

export interface Persona {
  id: string;
  matricula: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  curso?: string | null;
  telefono?: string | null;
  prestamosActivos?: number;
  activo?: boolean;
}

export interface PersonaHistorico {
  id: string;
  persona_id: string | null;
  matricula: string | null;
  nombres: string | null;
  apellidos: string | null;
  tipo: string | null;
  curso: string | null;
  telefono: string | null;
  fecha_baja: string;
  usuario_id_baja: string | null;
  usuario_baja?: { id: string; nombre: string; apellido: string; usuario: string } | null;
}

export interface Ubicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  ubicacion_padre_id?: string | null;
  padre?: Ubicacion | null;
}

export interface Herramienta {
  id: string;
  codigo: string;
  nombre: string;
  categoria_id?: string | null;
  categoria?: Categoria | null;
  valor_estimado?: number | null;
}

export interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  cantidad_total: number;
  cantidad_disponible: number;
  cantidad_danada: number;
  cantidad_prestada?: number;
  imagen_ruta?: string | null;
  categoria_id?: string | null;
  categoria?: Categoria | null;
  detalles_pedidos?: DetallePedido[];
}

export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO' | 'PENDIENTE' | string;

export interface PrestamoDetalle {
  id: string;
  prestamo_id: string;
  inventario_id: string;
  cantidad: number;
  estado_devolucion?: string | null;
  cantidad_devuelta_buena?: number;
  cantidad_devuelta_danada?: number;
  cantidad_perdida?: number;
  observaciones_devolucion?: string | null;
  inventario?: ItemInventario | null;
}

export interface Prestamo {
  id: string;
  inventario_id: string;
  persona_id: string;
  instructor_id?: string | null;
  usuario_id: string;
  cantidad: number;
  fecha_prestamo: string | null;
  fecha_devolucion: string | null;
  estado: EstadoPrestamo;
  observaciones?: string | null;
  inventario?: ItemInventario | null;
  persona?: Persona | null;
  instructor?: Persona | null;
  usuario?: Usuario | null;
  detalles?: PrestamoDetalle[];
}

export interface Movimiento {
  id: string;
  tipo: string;
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

export interface Pedido {
  id: string;
  numero_orden: string;
  usuario_id: string;
  proveedor?: string | null;
  fecha_pedido: string;
  fecha_entrega?: string | null;
  estado: string;
  prioridad?: string | null;
  observaciones?: string | null;
  usuario?: Usuario | null;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id: string;
  pedido_id: string;
  inventario_id: string;
  cantidad: number;
  precio_unit?: number | null;
  inventario?: ItemInventario | null;
  pedido?: Pedido | null;
}

export interface PersonaPayload {
  matricula: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  curso?: string;
  telefono?: string;
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
  cantidad_total: number;
  cantidad_disponible: number;
  cantidad_danada: number;
  imagen_ruta?: string | null;
}

export interface PrestamoPayload {
  inventario_id: string;
  persona_id: string;
  instructor_id: string;
  usuario_id: string;
  cantidad: number;
  fecha_devolucion?: string;
  estado: EstadoPrestamo;
  observaciones?: string;
}

export interface PedidoPayload {
  proveedor?: string;
  prioridad?: string;
  observaciones?: string;
  detalles?: ({
    inventario_id: string;
    cantidad: number;
    precio_unit?: number;
  } | {
    nuevo_item: true;
    nuevo_nombre: string;
    nuevo_codigo?: string;
    cantidad: number;
    precio_unit?: number;
  })[];
}

export interface DashboardCounts {
  articulos: number;
  categorias: number;
  personas: number;
  prestamos_activos: number;
  prestamos_pendientes: number;
}

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
  email?: string | null;
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
  email?: string;
  rol_id?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
  activo: boolean;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;
