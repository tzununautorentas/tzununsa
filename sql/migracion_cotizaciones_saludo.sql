-- ============================================================================
-- MIGRACIÓN: Columnas para saludo dinámico y contacto en cotizaciones
-- Ejecutar DESPUÉS de migracion_empresas_completa.sql
-- ============================================================================

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_tipo     TEXT;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_contacto TEXT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
--
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'cotizaciones'
--     AND column_name IN ('cliente_tipo', 'cliente_contacto')
--   ORDER BY column_name;
--
-- Debe devolver 2 filas.
