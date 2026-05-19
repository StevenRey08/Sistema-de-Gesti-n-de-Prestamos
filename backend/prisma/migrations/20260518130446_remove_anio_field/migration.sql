/*
  Warnings:

  - You are about to drop the column `anio` on the `personas` table. All the data in the column will be lost.
  - You are about to drop the column `anio` on the `personas_historico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "personas" DROP COLUMN "anio";

-- AlterTable
ALTER TABLE "personas_historico" DROP COLUMN "anio";
