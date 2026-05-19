-- AlterTable
ALTER TABLE "modulos" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "icono" VARCHAR(50),
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ruta" VARCHAR(200);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bloqueado_hasta" TIMESTAMP(6),
ADD COLUMN     "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimo_acceso" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "detalles" JSONB,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "fecha_login" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_logout" TIMESTAMP(6),
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "politicas_seguridad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "ultima_modificacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificado_por_id" UUID,

    CONSTRAINT "politicas_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_logs_usuario_id_idx" ON "auditoria_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_logs_fecha_idx" ON "auditoria_logs"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_logs_accion_idx" ON "auditoria_logs"("accion");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_key" ON "sesiones"("token");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_activa_idx" ON "sesiones"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "politicas_seguridad_clave_key" ON "politicas_seguridad"("clave");

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "politicas_seguridad" ADD CONSTRAINT "politicas_seguridad_modificado_por_id_fkey" FOREIGN KEY ("modificado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
