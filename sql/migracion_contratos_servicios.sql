-- Migración: Contratos por tipo de servicio (renta / traslado / corporativo / logistica)
-- Fecha: 2026-08-14
-- Agrega campos para traslados, servicios corporativos y logistica/carga.

ALTER TABLE contratos ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS destino TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS ruta TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS itinerario TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS descripcion_servicio TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS num_pasajeros INTEGER DEFAULT 0;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS servicios_incluidos TEXT DEFAULT '{}';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS servicios_no_incluidos TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS anticipo NUMERIC DEFAULT 0;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS condiciones_cancelacion TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS frecuencia TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tarifacion TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tipo_carga TEXT DEFAULT '';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS responsable_entrega TEXT DEFAULT '';

-- Recargar el schema cache de PostgREST para que reconozca las nuevas columnas
NOTIFY pgrst, 'reload schema';

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'contratos'
  AND column_name IN ('origen','destino','ruta','itinerario','descripcion_servicio',
    'num_pasajeros','servicios_incluidos','servicios_no_incluidos','anticipo',
    'condiciones_cancelacion','frecuencia','tarifacion','tipo_carga','responsable_entrega')
ORDER BY column_name;
