/*
  Warnings:

  - You are about to drop the column `caja_id` on the `inventario` table. All the data in the column will be lost.
  - You are about to drop the column `estante_id` on the `inventario` table. All the data in the column will be lost.
  - You are about to drop the column `caja_destino_id` on the `movimientos` table. All the data in the column will be lost.
  - You are about to drop the column `caja_origen_id` on the `movimientos` table. All the data in the column will be lost.
  - You are about to drop the column `estante_destino` on the `movimientos` table. All the data in the column will be lost.
  - You are about to drop the column `estante_origen` on the `movimientos` table. All the data in the column will be lost.
  - You are about to drop the `cajas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estantes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cajas" DROP CONSTRAINT "cajas_estante_id_fkey";

-- DropForeignKey
ALTER TABLE "inventario" DROP CONSTRAINT "inventario_caja_id_fkey";

-- DropForeignKey
ALTER TABLE "inventario" DROP CONSTRAINT "inventario_estante_id_fkey";

-- DropForeignKey
ALTER TABLE "movimientos" DROP CONSTRAINT "movimientos_caja_destino_id_fkey";

-- DropForeignKey
ALTER TABLE "movimientos" DROP CONSTRAINT "movimientos_caja_origen_id_fkey";

-- DropForeignKey
ALTER TABLE "movimientos" DROP CONSTRAINT "movimientos_estante_destino_fkey";

-- DropForeignKey
ALTER TABLE "movimientos" DROP CONSTRAINT "movimientos_estante_origen_fkey";

-- AlterTable
ALTER TABLE "inventario" DROP COLUMN "caja_id",
DROP COLUMN "estante_id",
ADD COLUMN     "ubicacion_id" UUID;

-- AlterTable
ALTER TABLE "movimientos" DROP COLUMN "caja_destino_id",
DROP COLUMN "caja_origen_id",
DROP COLUMN "estante_destino",
DROP COLUMN "estante_origen",
ADD COLUMN     "ubicacion_destino_id" UUID,
ADD COLUMN     "ubicacion_origen_id" UUID;

-- DropTable
DROP TABLE "cajas";

-- DropTable
DROP TABLE "estantes";

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "ubicacion_padre_id" UUID,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_codigo_key" ON "ubicaciones"("codigo");

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_ubicacion_padre_id_fkey" FOREIGN KEY ("ubicacion_padre_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_ubicacion_origen_id_fkey" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
