-- Migración: Campo Carta Poder para viajes internacionales
-- Fecha: 2026-06-26

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS carta_poder BOOLEAN DEFAULT false;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS carta_poder_costo NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS carta_poder BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS carta_poder_costo NUMERIC DEFAULT 0;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas') AND column_name IN ('carta_poder','carta_poder_costo')
ORDER BY table_name, column_name;
