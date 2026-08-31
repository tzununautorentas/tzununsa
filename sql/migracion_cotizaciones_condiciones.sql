-- Migración: Apartado opcional de condiciones / cláusulas en cotizaciones
-- Fecha: 2026-08-31
-- Agrega la columna 'condiciones' a la tabla cotizaciones
-- (seguro del vehículo, cláusulas solicitadas, notas para el cliente; opcional).

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS condiciones TEXT DEFAULT '';

-- Recargar el schema cache de PostgREST para que reconozca la nueva columna
NOTIFY pgrst, 'reload schema';

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'cotizaciones' AND column_name = 'condiciones';
