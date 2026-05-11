-- DropForeignKey
ALTER TABLE "inventario" DROP CONSTRAINT "inventario_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "inventario" DROP CONSTRAINT "inventario_ubicacion_id_fkey";

-- DropForeignKey
ALTER TABLE "prestamos" DROP CONSTRAINT "prestamos_persona_id_fkey";

-- DropForeignKey
ALTER TABLE "prestamos" DROP CONSTRAINT "prestamos_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_rol_id_fkey";

-- CreateIndex
CREATE INDEX "inventario_categoria_id_idx" ON "inventario"("categoria_id");

-- CreateIndex
CREATE INDEX "inventario_ubicacion_id_idx" ON "inventario"("ubicacion_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_idx" ON "movimientos"("inventario_id");

-- CreateIndex
CREATE INDEX "movimientos_tipo_idx" ON "movimientos"("tipo");

-- CreateIndex
CREATE INDEX "prestamos_inventario_id_idx" ON "prestamos"("inventario_id");

-- CreateIndex
CREATE INDEX "prestamos_persona_id_idx" ON "prestamos"("persona_id");

-- CreateIndex
CREATE INDEX "prestamos_estado_idx" ON "prestamos"("estado");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
