// Permite importar archivos .jsx y .js desde TypeScript sin errores de tipos
declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.js' {
  const value: any;
  export default value;
  export const categoriasApi: any;
  export const personasApi: any;
  export const proveedoresApi: any;
  export const estantesApi: any;
  export const cajasApi: any;
  export const herramientasApi: any;
  export const inventarioApi: any;
  export const prestamosApi: any;
  export const movimientosApi: any;
}
