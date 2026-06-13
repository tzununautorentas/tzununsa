-- Migración: Email, teléfono en cotizaciones y saludo+contacto en reservas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS saludo TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_tipo TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_contacto TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;

-- Verificación
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('cotizaciones','reservas')
--   AND column_name IN ('cliente_email','cliente_telefono','saludo','cliente_tipo','cliente_contacto')
-- ORDER BY table_name, column_name;
