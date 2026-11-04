-- CreateEnum
CREATE TYPE "clase_activo" AS ENUM ('renta_variable', 'renta_fija', 'monetario', 'materias_primas', 'inmobiliario');

-- CreateEnum
CREATE TYPE "estado_suscripcion" AS ENUM ('incompleta', 'activa', 'impagada', 'cancelada');

-- CreateEnum
CREATE TYPE "canal_aviso" AS ENUM ('web', 'email', 'whatsapp', 'telegram');

-- CreateEnum
CREATE TYPE "estado_notificacion" AS ENUM ('pendiente', 'enviada', 'fallida', 'omitida');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "es_admin" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aviso_web" BOOLEAN NOT NULL DEFAULT true,
    "aviso_email" BOOLEAN NOT NULL DEFAULT true,
    "aviso_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "aviso_telegram" BOOLEAN NOT NULL DEFAULT false,
    "telefono_whatsapp" TEXT,
    "telegram_chat_id" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carteras" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel_riesgo" INTEGER NOT NULL,
    "horizonte" TEXT NOT NULL,
    "metodologia" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "precio_centimos" INTEGER NOT NULL,
    "stripe_price_id" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "carteras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartera_versiones" (
    "id" TEXT NOT NULL,
    "cartera_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha_vigencia" TIMESTAMP(3) NOT NULL,
    "nota_metodologica" TEXT NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartera_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartera_posiciones" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "instrumento" TEXT NOT NULL,
    "isin" TEXT NOT NULL,
    "clase_activo" "clase_activo" NOT NULL,
    "peso_pct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "cartera_posiciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambios_cartera" (
    "id" TEXT NOT NULL,
    "cartera_id" TEXT NOT NULL,
    "version_anterior_id" TEXT,
    "version_nueva_id" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "publicado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambios_cartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cartera_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "estado" "estado_suscripcion" NOT NULL DEFAULT 'incompleta',
    "inicio_en" TIMESTAMP(3),
    "periodo_fin_en" TIMESTAMP(3),
    "cancelada_en" TIMESTAMP(3),
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aceptaciones_disclaimer" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cartera_id" TEXT NOT NULL,
    "version_texto" TEXT NOT NULL,
    "aceptado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceptaciones_disclaimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "cambio_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "canal" "canal_aviso" NOT NULL,
    "estado" "estado_notificacion" NOT NULL DEFAULT 'pendiente',
    "error" TEXT,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_en" TIMESTAMP(3),
    "leido_en" TIMESTAMP(3),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartera_rentabilidades" (
    "id" TEXT NOT NULL,
    "cartera_id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "rentabilidad_pct" DECIMAL(6,2) NOT NULL,
    "simulada" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cartera_rentabilidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_stripe_customer_id_key" ON "usuarios"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "carteras_slug_key" ON "carteras"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "carteras_orden_key" ON "carteras"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "carteras_stripe_price_id_key" ON "carteras"("stripe_price_id");

-- CreateIndex
CREATE INDEX "cartera_versiones_cartera_id_fecha_vigencia_idx" ON "cartera_versiones"("cartera_id", "fecha_vigencia");

-- CreateIndex
CREATE UNIQUE INDEX "cartera_versiones_cartera_id_numero_key" ON "cartera_versiones"("cartera_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "cartera_posiciones_version_id_isin_key" ON "cartera_posiciones"("version_id", "isin");

-- CreateIndex
CREATE UNIQUE INDEX "cambios_cartera_version_nueva_id_key" ON "cambios_cartera"("version_nueva_id");

-- CreateIndex
CREATE INDEX "cambios_cartera_cartera_id_publicado_en_idx" ON "cambios_cartera"("cartera_id", "publicado_en");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_stripe_subscription_id_key" ON "suscripciones"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_usuario_id_cartera_id_key" ON "suscripciones"("usuario_id", "cartera_id");

-- CreateIndex
CREATE INDEX "aceptaciones_disclaimer_usuario_id_cartera_id_idx" ON "aceptaciones_disclaimer"("usuario_id", "cartera_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_canal_leido_en_idx" ON "notificaciones"("usuario_id", "canal", "leido_en");

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_cambio_id_usuario_id_canal_key" ON "notificaciones"("cambio_id", "usuario_id", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "cartera_rentabilidades_cartera_id_anio_key" ON "cartera_rentabilidades"("cartera_id", "anio");

-- AddForeignKey
ALTER TABLE "cartera_versiones" ADD CONSTRAINT "cartera_versiones_cartera_id_fkey" FOREIGN KEY ("cartera_id") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera_posiciones" ADD CONSTRAINT "cartera_posiciones_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "cartera_versiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_cartera" ADD CONSTRAINT "cambios_cartera_cartera_id_fkey" FOREIGN KEY ("cartera_id") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_cartera" ADD CONSTRAINT "cambios_cartera_version_anterior_id_fkey" FOREIGN KEY ("version_anterior_id") REFERENCES "cartera_versiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_cartera" ADD CONSTRAINT "cambios_cartera_version_nueva_id_fkey" FOREIGN KEY ("version_nueva_id") REFERENCES "cartera_versiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_cartera_id_fkey" FOREIGN KEY ("cartera_id") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceptaciones_disclaimer" ADD CONSTRAINT "aceptaciones_disclaimer_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceptaciones_disclaimer" ADD CONSTRAINT "aceptaciones_disclaimer_cartera_id_fkey" FOREIGN KEY ("cartera_id") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_cambio_id_fkey" FOREIGN KEY ("cambio_id") REFERENCES "cambios_cartera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera_rentabilidades" ADD CONSTRAINT "cartera_rentabilidades_cartera_id_fkey" FOREIGN KEY ("cartera_id") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integridad añadida a mano
-- ---------------------------------------------------------------------------

-- Nivel de riesgo en la escala 1-7 y peso entre 0 y 100.
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_nivel_riesgo_check" CHECK ("nivel_riesgo" BETWEEN 1 AND 7);
ALTER TABLE "cartera_posiciones" ADD CONSTRAINT "cartera_posiciones_peso_check" CHECK ("peso_pct" > 0 AND "peso_pct" <= 100);

-- Las versiones de una cartera y sus posiciones son inmutables una vez creadas.
CREATE OR REPLACE FUNCTION fmf_bloquear_modificacion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es inmutable: crea una versión nueva en lugar de modificarla', TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cartera_versiones_inmutables
  BEFORE UPDATE OR DELETE ON "cartera_versiones"
  FOR EACH ROW EXECUTE FUNCTION fmf_bloquear_modificacion();

CREATE TRIGGER cartera_posiciones_inmutables
  BEFORE UPDATE OR DELETE ON "cartera_posiciones"
  FOR EACH ROW EXECUTE FUNCTION fmf_bloquear_modificacion();

-- Las aceptaciones del aviso son un registro probatorio: no se modifican ni se borran.
CREATE TRIGGER aceptaciones_disclaimer_inmutables
  BEFORE UPDATE OR DELETE ON "aceptaciones_disclaimer"
  FOR EACH ROW EXECUTE FUNCTION fmf_bloquear_modificacion();
