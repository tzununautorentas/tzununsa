-- Migración: Comisión Bancaria para transferencias SWIFT internacionales
-- Fecha: 2026-08-26

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas') AND column_name = 'comision_bancaria'
ORDER BY table_name, column_name;
