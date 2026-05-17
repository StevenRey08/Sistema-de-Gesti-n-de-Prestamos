-- AlterTable
ALTER TABLE "prestamos" ALTER COLUMN "cantidad" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "prestamos_detalles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prestamo_id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "prestamos_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prestamos_detalles_prestamo_id_idx" ON "prestamos_detalles"("prestamo_id");

-- CreateIndex
CREATE INDEX "prestamos_detalles_inventario_id_idx" ON "prestamos_detalles"("inventario_id");

-- AddForeignKey
ALTER TABLE "prestamos_detalles" ADD CONSTRAINT "prestamos_detalles_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos_detalles" ADD CONSTRAINT "prestamos_detalles_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
