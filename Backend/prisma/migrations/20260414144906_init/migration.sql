-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_rol" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rol_id" UUID,
    "modulo_id" UUID,
    "leer" BOOLEAN NOT NULL DEFAULT false,
    "ingresar" BOOLEAN NOT NULL DEFAULT false,
    "actualizar" BOOLEAN NOT NULL DEFAULT false,
    "eliminar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_documento" VARCHAR(20),
    "numero_documento" VARCHAR(50),
    "nombre" VARCHAR(50) NOT NULL,
    "apellido" VARCHAR(50) NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "rol_id" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "nombre_empresa" VARCHAR(100),
    "nombre_contacto" VARCHAR(50),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_documento" VARCHAR(20),
    "numero_documento" VARCHAR(50),
    "nombres" VARCHAR(100),
    "apellidos" VARCHAR(100),
    "tipo" VARCHAR(50),
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_herramientas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_herramientas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estantes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "ubicacion" VARCHAR(100),
    "descripcion" TEXT,

    CONSTRAINT "estantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "estante_id" UUID,
    "descripcion" TEXT,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "proveedor_id" UUID,
    "categoria_id" UUID,
    "valor_estimado" DECIMAL,
    "caja_id" UUID,
    "estante_id" UUID,
    "estado" VARCHAR(50),
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventario_id" UUID,
    "persona_id" UUID,
    "usuario_id" UUID,
    "cantidad" INTEGER NOT NULL,
    "fecha_prestamo" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "fecha_devolucion" TIMESTAMP(6),
    "estado" VARCHAR(50),
    "observaciones" TEXT,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventario_id" UUID,
    "caja_origen_id" UUID,
    "caja_destino_id" UUID,
    "estante_origen" UUID,
    "estante_destino" UUID,
    "persona_id" UUID,
    "usuario_id" UUID,
    "prestamo_id" UUID,
    "cantidad" INTEGER NOT NULL,
    "tipo" VARCHAR(50),
    "fecha" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "roles"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "modulos_nombre_key" ON "modulos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_rol_id_modulo_id_key" ON "permisos"("rol_id", "modulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_documento_key" ON "usuarios"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "personas_numero_documento_key" ON "personas"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_herramientas_nombre_key" ON "categorias_herramientas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estantes_codigo_key" ON "estantes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_codigo_key" ON "cajas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_codigo_key" ON "inventario"("codigo");

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_estante_id_fkey" FOREIGN KEY ("estante_id") REFERENCES "estantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_herramientas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_estante_id_fkey" FOREIGN KEY ("estante_id") REFERENCES "estantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_caja_origen_id_fkey" FOREIGN KEY ("caja_origen_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_caja_destino_id_fkey" FOREIGN KEY ("caja_destino_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_estante_origen_fkey" FOREIGN KEY ("estante_origen") REFERENCES "estantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_estante_destino_fkey" FOREIGN KEY ("estante_destino") REFERENCES "estantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
