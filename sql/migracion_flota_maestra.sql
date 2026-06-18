-- Migración: Flota como fuente maestra de datos de vehículos
-- Fecha: 2026-06-18

-- Características técnicas
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS capacidad INTEGER;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS transmision TEXT DEFAULT '';
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS aire_acondicionado BOOLEAN DEFAULT false;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS combustible TEXT DEFAULT '';
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS capacidad_equipaje TEXT DEFAULT '';
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS traccion TEXT DEFAULT '';

-- Información comercial
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS fotos_adicionales JSONB DEFAULT '[]';
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS tarifa_dia NUMERIC DEFAULT 0;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS tarifa_semana NUMERIC DEFAULT 0;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS tarifa_mes NUMERIC DEFAULT 0;

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'vehiculos'
  AND column_name IN ('capacidad','transmision','aire_acondicionado','combustible','capacidad_equipaje','traccion','fotos_adicionales','tarifa_dia','tarifa_semana','tarifa_mes')
ORDER BY column_name;
