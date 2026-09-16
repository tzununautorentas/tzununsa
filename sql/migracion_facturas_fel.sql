-- Migracion: Campos FEL que faltan en tabla facturas
-- (columnas como nombre_receptor, direccion_receptor, tipo_dte, moneda, lineas ya existen)
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS condicion_pago      text default 'contado';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS fecha_vencimiento   date;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS fecha_hora_emision  timestamptz;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS municipio_receptor  text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS departamento_receptor text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS pais_receptor       text default 'GT';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS codigo_postal_receptor text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS telefono_receptor   text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS numero_cuenta       text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_gravado       numeric default 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_exento        numeric default 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_exonerado     numeric default 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_no_sujeto     numeric default 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_descuentos    numeric default 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS textos_frases       text default '';
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS detalles            jsonb default '[]'::jsonb;

-- Poblar nombre_receptor/nit_receptor desde cliente_nombre/cliente_nit si estan vacios
UPDATE facturas
SET nombre_receptor = COALESCE(cliente_nombre, ''),
    nit_receptor = COALESCE(cliente_nit, 'CF')
WHERE (nombre_receptor IS NULL OR nombre_receptor = '') AND cliente_nombre IS NOT NULL;

-- Verificacion
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'facturas'
  AND column_name IN ('condicion_pago','fecha_vencimiento','municipio_receptor','departamento_receptor',
    'pais_receptor','telefono_receptor','numero_cuenta','total_gravado','total_exento',
    'total_exonerado','total_no_sujeto','total_descuentos','textos_frases','lineas','detalles',
    'nombre_receptor','nit_receptor','direccion_receptor','correo_receptor','tipo_dte','moneda')
ORDER BY column_name;