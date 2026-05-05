/*
  Warnings:

  - You are about to drop the column `proveedor_id` on the `inventario` table. All the data in the column will be lost.
  - You are about to drop the column `valor_estimado` on the `inventario` table. All the data in the column will be lost.
  - You are about to drop the `proveedores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventario" DROP CONSTRAINT "inventario_proveedor_id_fkey";

-- AlterTable
ALTER TABLE "inventario" DROP COLUMN "proveedor_id",
DROP COLUMN "valor_estimado",
ADD COLUMN     "cantidad_minima" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "imagen_ruta" TEXT,
ALTER COLUMN "cantidad" SET DEFAULT 1;

-- DropTable
DROP TABLE "proveedores";
