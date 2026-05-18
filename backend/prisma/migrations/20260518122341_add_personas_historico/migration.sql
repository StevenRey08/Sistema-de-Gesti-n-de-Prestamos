-- CreateTable
CREATE TABLE "personas_historico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "persona_id" UUID,
    "matricula" VARCHAR(50),
    "nombres" VARCHAR(100),
    "apellidos" VARCHAR(100),
    "tipo" VARCHAR(50),
    "curso" VARCHAR(100),
    "telefono" VARCHAR(20),
    "fecha_baja" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id_baja" UUID,

    CONSTRAINT "personas_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personas_historico_persona_id_idx" ON "personas_historico"("persona_id");

-- CreateIndex
CREATE INDEX "personas_historico_fecha_baja_idx" ON "personas_historico"("fecha_baja");

-- AddForeignKey
ALTER TABLE "personas_historico" ADD CONSTRAINT "personas_historico_usuario_id_baja_fkey" FOREIGN KEY ("usuario_id_baja") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
