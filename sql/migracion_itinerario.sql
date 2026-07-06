-- Migración: Itinerario del Servicio (multi-vehículo + multi-trayecto)
-- Almacena la estructura completa del servicio como JSON

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS itinerario TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS itinerario TEXT DEFAULT '';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas') AND column_name = 'itinerario'
ORDER BY table_name, column_name;
