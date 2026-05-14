-- DropForeignKey
ALTER TABLE "prestamos" DROP CONSTRAINT "prestamos_inventario_id_fkey";

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
