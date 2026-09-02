-- Migración: Asegurar columna created_at en cotizaciones y reservas
-- para ordenar por fecha (más recientes primero).
-- Ejecutar en Supabase SQL Editor.

-- 1) Asegurar la columna en cotizaciones (si no existe, la crea)
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2) Asegurar la columna en reservas (si no existe, la crea)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3) Si ya existía pero quedó en NULL (o sin valor útil), poblar desde la fecha de emisión / inicio
UPDATE cotizaciones
SET created_at = COALESCE(fecha_emision::timestamptz, created_at)
WHERE created_at IS NULL;

UPDATE reservas
SET created_at = COALESCE(fecha_inicio::timestamptz, created_at)
WHERE created_at IS NULL;

-- Verificación
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas')
  AND column_name = 'created_at';
