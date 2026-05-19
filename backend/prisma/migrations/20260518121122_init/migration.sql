-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "prestamos_detalles" ADD COLUMN     "cantidad_devuelta_buena" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_devuelta_danada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidad_perdida" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estado_devolucion" VARCHAR(50),
ADD COLUMN     "observaciones_devolucion" TEXT;
