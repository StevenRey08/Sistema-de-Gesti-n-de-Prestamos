

-- =========================================
-- EXTENSION PARA UUID
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =========================================
-- ROLES
-- =========================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);


-- =========================================
-- MODULOS
-- =========================================
CREATE TABLE modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);


-- =========================================
-- PERMISOS
-- =========================================
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
    leer BOOLEAN DEFAULT false,
    ingresar BOOLEAN DEFAULT false,
    actualizar BOOLEAN DEFAULT false,
    eliminar BOOLEAN DEFAULT false,

    UNIQUE(rol_id, modulo_id)
);


-- =========================================
-- USUARIOS
-- =========================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50) UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol_id UUID REFERENCES roles(id),
    activo BOOLEAN DEFAULT true
);

-- =========================================
-- PROVEEDORES
-- =========================================
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre_empresa VARCHAR(100),
    nombre_contacto VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- =========================================
-- PERSONAS
-- =========================================
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50) UNIQUE,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    tipo VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- =========================================
-- CATEGORIAS DE HERRAMIENTAS
-- =========================================
CREATE TABLE categorias_herramientas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);


-- =========================================
-- HERRAMIENTAS
-- (TIPO DE PRODUCTO)
-- =========================================
CREATE TABLE herramientas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID REFERENCES proveedores(id),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria_id UUID REFERENCES categorias_herramientas(id),
    valor_estimado NUMERIC
);


-- =========================================
-- ESTANTES
-- =========================================
CREATE TABLE estantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    ubicacion VARCHAR(100),
    descripcion TEXT
);

-- =========================================
-- CAJAS (Nueva Tabla)
-- =========================================
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    estante_id UUID REFERENCES estantes(id) ON DELETE SET NULL,
    descripcion TEXT
);

-- =========================================
-- INVENTARIO (Modificada)
-- =========================================
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    herramienta_id UUID REFERENCES herramientas(id) ON DELETE CASCADE,
   
    -- La herramienta puede estar en una CAJA...
    caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL,
   
    -- ...O puede estar suelta directamente en el ESTANTE.
    estante_id UUID REFERENCES estantes(id) ON DELETE SET NULL,
   
    estado VARCHAR(50),
    cantidad INTEGER NOT NULL DEFAULT 0,

    -- RESTRICCIÓN LÓGICA:
    -- Evita que una herramienta apunte a ambos al mismo tiempo o a ninguno.
    CONSTRAINT check_ubicacion_consistente CHECK (
        (caja_id IS NOT NULL AND estante_id IS NULL) OR
        (caja_id IS NULL AND estante_id IS NOT NULL)
    )
);


-- =========================================
-- PRESTAMOS
-- =========================================
CREATE TABLE prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id UUID REFERENCES inventario(id),
    persona_id UUID REFERENCES personas(id),
    usuario_id UUID REFERENCES usuarios(id),
    cantidad INTEGER NOT NULL,
    fecha_prestamo TIMESTAMP DEFAULT now(),
    fecha_devolucion TIMESTAMP,
    estado VARCHAR(50),
    observaciones TEXT
);

-- =========================================
-- MOVIMIENTOS (Modificada para incluir cajas)
-- =========================================
CREATE TABLE movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id UUID REFERENCES inventario(id),
    caja_origen_id UUID REFERENCES cajas(id),
    caja_destino_id UUID REFERENCES cajas(id),
    estante_origen UUID REFERENCES estantes(id),
    estante_destino UUID REFERENCES estantes(id),
    persona_id UUID REFERENCES personas(id),
    usuario_id UUID REFERENCES usuarios(id),
    prestamo_id UUID REFERENCES prestamos(id),
    cantidad INTEGER NOT NULL,
    tipo VARCHAR(50), -- 'ENTRADA', 'SALIDA', 'TRASLADO', 'PRESTAMO'
    fecha TIMESTAMP DEFAULT now(),
    observaciones TEXT
);