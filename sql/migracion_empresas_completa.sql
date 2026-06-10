-- ============================================================================
-- MIGRACIÓN COMPLETA: Columnas faltantes en la tabla `empresas`
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase
-- Compatible con tabla existente — solo ADD COLUMN, sin eliminar datos
-- ============================================================================

-- NOTA: Supabase SQL Editor ejecuta cada sentencia individualmente.
-- Puedes copiar todo el bloque y ejecutarlo completo.

-- ── Configuración general de la empresa ──
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS eslogan        TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS contacto       TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tel_contacto   TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email_contacto TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS web            TEXT;

-- ── Datos bancarios ──
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banco1 TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banco2 TEXT;

-- ── Series numéricas (contadores editables) ──
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ultima_cotizacion TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ultima_reserva    TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ultima_factura    TEXT;

-- ── Términos de pago ──
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS termino_pago_def TEXT;

-- ─═ PDF PREMIUM — Datos dinámicos del documento ═─

-- Logo corporativo (base64 data URL)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url           TEXT;

-- Firmante y cargo
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS firmante           TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tel_firmante       TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_firmante     TEXT;

-- Catálogo de cargos (JSONB — ej: ["Asesor de Movilidad","Coordinador de Servicios"])
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_catalogo     JSONB DEFAULT '[]'::jsonb;

-- Tarifa de limpieza en GTQ
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tarifa_limpieza    DECIMAL(10,2) DEFAULT 75.00;

-- Imagen de firma digital (base64)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS firma_digital      TEXT;

-- Frase institucional del footer
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_footer      TEXT;

-- Cierre corporativo del PDF
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cierre_corporativo TEXT;

-- Nota al pie
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nota_pie           TEXT;

-- ============================================================================
-- VERIFICACIÓN: ¿Qué columnas existentes y nuevas tiene la tabla?
-- ============================================================================
-- Ejecutar después de la migración:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'empresas'
--   ORDER BY ordinal_position;
--
-- Debe devolver 29 columnas en total:
--  id, created_at, nombre, nit, direccion, telefono, email,
--  eslogan, contacto, tel_contacto, email_contacto, web,
--  banco1, banco2,
--  ultima_cotizacion, ultima_reserva, ultima_factura,
--  termino_pago_def,
--  logo_url, firmante, tel_firmante, cargo_firmante,
--  cargo_catalogo, tarifa_limpieza, firma_digital,
--  titulo_footer, cierre_corporativo, nota_pie

-- ============================================================================
-- VERIFICACIÓN: ¿guardarEmp() puede escribir en las columnas nuevas?
-- ============================================================================
-- Ejecutar REEMPLAZANDO <ID_EMPRESA> con el id real de tu empresa:
--
--   UPDATE empresas
--   SET
--     eslogan            = 'Verificación de prueba',
--     logo_url           = 'data:image/png;base64,VERIFICACION',
--     cargo_catalogo     = '["Cargo de prueba A","Cargo de prueba B"]'::jsonb,
--     tarifa_limpieza    = 99.99,
--     firma_digital      = 'data:image/png;base64,FIRMA_PRUEBA',
--     titulo_footer      = 'Frase de prueba',
--     cierre_corporativo = 'Cierre de prueba',
--     nota_pie           = 'Nota de prueba',
--     banco1             = 'Banco de Prueba — Cta. 000-000000-0',
--     banco2             = 'Otro Banco — Cta. 111-111111-1',
--     firmante           = 'Firmante de Prueba',
--     tel_firmante       = '+502 5555 5555',
--     cargo_firmante     = 'Cargo de Prueba',
--     email_contacto     = 'prueba@example.com',
--     web                = '@Prueba',
--     contacto           = 'Contacto prueba',
--     tel_contacto       = '5555-5555',
--     termino_pago_def   = '50% anticipo',
--     ultima_cotizacion  = 'COT-000001',
--     ultima_reserva     = 'RES-000001',
--     ultima_factura     = 'FEL-000001'
--   WHERE id = <ID_EMPRESA>;
--
-- Si la consulta se ejecuta sin error (1 fila afectada),
-- significa que guardarEmp() funcionará correctamente.
-- Después, puedes leer los datos con:
--
--   SELECT * FROM empresas WHERE id = <ID_EMPRESA>;

-- ============================================================================
-- LIMPIEZA: Revertir datos de prueba (ejecutar solo si hiciste la prueba)
-- ============================================================================
--
--   UPDATE empresas
--   SET
--     eslogan            = NULL,
--     logo_url           = NULL,
--     cargo_catalogo     = '[]'::jsonb,
--     tarifa_limpieza    = 75.00,
--     firma_digital      = NULL,
--     titulo_footer      = NULL,
--     cierre_corporativo = NULL,
--     nota_pie           = NULL,
--     banco1             = NULL,
--     banco2             = NULL,
--     firmante           = NULL,
--     tel_firmante       = NULL,
--     cargo_firmante     = NULL,
--     email_contacto     = NULL,
--     web                = NULL,
--     contacto           = NULL,
--     tel_contacto       = NULL,
--     termino_pago_def   = NULL,
--     ultima_cotizacion  = 'COT-000000',
--     ultima_reserva     = 'RES-000000',
--     ultima_factura     = 'FEL-000000'
--   WHERE id = <ID_EMPRESA>;
