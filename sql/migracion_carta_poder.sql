-- Migración: Campo Carta Poder para viajes internacionales
-- Fecha: 2026-06-26

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS carta_poder BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS carta_poder BOOLEAN DEFAULT false;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas') AND column_name = 'carta_poder'
ORDER BY table_name, column_name;
