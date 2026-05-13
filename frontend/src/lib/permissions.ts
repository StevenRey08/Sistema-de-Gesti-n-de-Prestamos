import { useAuth } from '../components/auth/AuthProvider';
import type { ModuloPermiso } from './auth';

export function usePermiso(modulo: string) {
  const { user } = useAuth();
  const permiso = user?.permisos?.[modulo];

  return {
    puedeLeer: permiso?.leer ?? false,
    puedeIngresar: permiso?.ingresar ?? false,
    puedeActualizar: permiso?.actualizar ?? false,
    puedeEliminar: permiso?.eliminar ?? false,
  };
}

const MODULO_RUTAS: Record<string, string> = {
  DASHBOARD: '/',
  INVENTARIO: '/inventario',
  PRESTAMOS: '/prestamos',
  MOVIMIENTOS: '/movimientos',
  PERSONAS: '/catalogos/personas',
  CATEGORIAS: '/catalogos/categorias',
  UBICACIONES: '/ubicaciones',
  USUARIOS: '/seguridad',
};

export function obtenerRutaDestino(permisos: Record<string, ModuloPermiso> | undefined): string {
  if (!permisos) return '/mi-cuenta';
  const orden = ['DASHBOARD', 'INVENTARIO', 'PRESTAMOS', 'MOVIMIENTOS', 'PERSONAS', 'CATEGORIAS', 'UBICACIONES', 'USUARIOS'];
  for (const mod of orden) {
    if (permisos[mod]?.leer) {
      return MODULO_RUTAS[mod] || '/';
    }
  }
  return '/mi-cuenta';
}
