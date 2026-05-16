-- DropForeignKey
ALTER TABLE "public"."inventario" DROP CONSTRAINT "inventario_ubicacion_id_fkey";

-- DropIndex
DROP INDEX "public"."inventario_ubicacion_id_idx";

-- DropIndex
DROP INDEX "public"."personas_numero_documento_key";

-- AlterTable
ALTER TABLE "public"."categorias_herramientas" ADD COLUMN     "ubicacion_id" UUID;

-- AlterTable
ALTER TABLE "public"."inventario" DROP COLUMN "cantidad",
DROP COLUMN "estado",
DROP COLUMN "estado_anterior",
DROP COLUMN "ubicacion_id",
ADD COLUMN     "cantidad_danada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock_minimo" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."personas" DROP COLUMN "email",
DROP COLUMN "numero_documento",
DROP COLUMN "tipo_documento",
ADD COLUMN     "curso" VARCHAR(100),
ADD COLUMN     "matricula" VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."prestamos" ADD COLUMN     "instructor_id" UUID;

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "email" VARCHAR(100);

-- CreateTable
CREATE TABLE "public"."pedidos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "numero_orden" VARCHAR(50),
    "fecha_pedido" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(6),
    "estado" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" VARCHAR(20),
    "proveedor" VARCHAR(150),
    "observaciones" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detalles_pedidos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pedido_id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unit" DECIMAL(10,2),

    CONSTRAINT "detalles_pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_orden_key" ON "public"."pedidos"("numero_orden");

-- CreateIndex
CREATE UNIQUE INDEX "personas_matricula_key" ON "public"."personas"("matricula");

-- CreateIndex
CREATE INDEX "prestamos_instructor_id_idx" ON "public"."prestamos"("instructor_id");

-- AddForeignKey
ALTER TABLE "public"."categorias_herramientas" ADD CONSTRAINT "categorias_herramientas_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalles_pedidos" ADD CONSTRAINT "detalles_pedidos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalles_pedidos" ADD CONSTRAINT "detalles_pedidos_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prestamos" ADD CONSTRAINT "prestamos_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
