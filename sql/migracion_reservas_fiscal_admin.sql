-- Migración: Ampliación fiscal/administrativa de reservas
-- Fecha: 2026-10-25
-- Compatible con PostgreSQL 17.6. Idempotente con IF NOT EXISTS.
-- NO borra, renombra ni modifica columnas existentes. NO crea FKs ficticias.

BEGIN;

-- Campos fiscales/administrativos del cliente (snapshot en reserva)
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cliente_nit TEXT DEFAULT '';
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cliente_dir TEXT DEFAULT '';
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cliente_codigo TEXT DEFAULT '';

-- Ubicación fiscal del cliente (separada de departamento/municipio de viaje)
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cliente_departamento TEXT DEFAULT '';
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS cliente_municipio TEXT DEFAULT '';

-- cliente_id ya existe en reservas (verificado en pruebas); solo se asegura tipo si falta (sin FK)
-- No se agrega FK: sin entidad/relación confirmada para crearla aquí.

COMMIT;

-- Verificación
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reservas'
  AND column_name IN ('cliente_nit','cliente_dir','cliente_codigo','cliente_id','cliente_departamento','cliente_municipio','departamento','municipio')
ORDER BY column_name;
