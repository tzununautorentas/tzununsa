-- Migración: Campos para segundo vehículo y extras en renta
-- Ejecutar en Supabase SQL Editor

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS vehiculo_nombre2 TEXT DEFAULT '';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS incluye_piloto BOOLEAN DEFAULT false;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS incluye_hospedaje BOOLEAN DEFAULT false;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS incluye_alimentacion BOOLEAN DEFAULT false;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_piloto_dia NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_hospedaje_dia NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_alimentacion_dia NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS extras_renta NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS costo_segundo_vehiculo NUMERIC DEFAULT 0;

-- Verificación
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'cotizaciones'
--   AND column_name IN ('vehiculo_nombre2','incluye_piloto','incluye_hospedaje','incluye_alimentacion',
--     'costo_piloto_dia','costo_hospedaje_dia','costo_alimentacion_dia','extras_renta','costo_segundo_vehiculo')
-- ORDER BY column_name;
