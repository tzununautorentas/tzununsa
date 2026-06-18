-- Migración: Sincronización Calculadora → Cotización → Reserva
-- Fecha: 2026-06-18

-- 1. Agregar campos faltantes a cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS fecha_fin DATE;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT '';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS destino TEXT DEFAULT '';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS ruta TEXT DEFAULT '';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS observaciones_ruta TEXT DEFAULT '';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. Agregar campos faltantes a reservas (para sincronización desde cotización)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS descripcion_servicio TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS servicios_incluidos TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS destino TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ruta TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS observaciones_ruta TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS saludo TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_tipo TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_contacto TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_email TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_telefono TEXT DEFAULT '';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS costo_vehiculo NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS costo_piloto NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS costo_hospedaje NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS costo_alimentacion NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS precio_galon NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS km_por_galon NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS km_total NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS extras NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS peajes NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS recargo_tarjeta NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_piloto BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_combustible BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_peajes BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_hospedaje BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_alimentacion BOOLEAN DEFAULT false;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS incl_seguro BOOLEAN DEFAULT true;

-- 3. Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'cotizaciones' AND column_name IN ('fecha_inicio','fecha_fin','origen','destino','ruta','observaciones_ruta','version')
ORDER BY column_name;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reservas' AND column_name IN ('descripcion_servicio','servicios_incluidos','origen','destino','ruta','observaciones_ruta','version','saludo','cliente_tipo','cliente_contacto','cliente_email','cliente_telefono','costo_vehiculo','costo_piloto','costo_hospedaje','costo_alimentacion','precio_galon','km_por_galon','km_total','extras','peajes','recargo_tarjeta','incl_piloto','incl_combustible','incl_peajes','incl_hospedaje','incl_alimentacion','incl_seguro')
ORDER BY column_name;
