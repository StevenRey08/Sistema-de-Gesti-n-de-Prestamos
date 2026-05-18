/*
  Warnings:

  - You are about to drop the column `en_uso` on the `inventario` table. All the data in the column will be lost.
  - You are about to drop the column `stock_minimo` on the `inventario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventario" DROP COLUMN "en_uso",
DROP COLUMN "stock_minimo";
