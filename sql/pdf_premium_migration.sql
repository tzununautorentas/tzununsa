-- Migración: Campos para PDF Premium y Firma de Documentos
-- Ejecutar en Supabase SQL Editor

-- 1. Logo corporativo (base64 o URL pública)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Cargo del firmante (ej: "Coordinador de Servicios Corporativos")
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_firmante TEXT DEFAULT 'Coordinador de Servicios Corporativos';

-- 3. Catálogo de cargos disponibles (JSONB array)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_catalogo JSONB DEFAULT '["Asesor de Movilidad y Logística","Coordinador de Servicios","Representante de Atención Institucional","Coordinador de Transporte","Director Comercial","Gerente General"]';

-- 4. Tarifa de limpieza (Q)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tarifa_limpieza DECIMAL(10,2) DEFAULT 75.00;

-- 5. Email de contacto (separado del email principal)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email_contacto TEXT;

-- 6. Frase institucional del footer
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titulo_footer TEXT DEFAULT 'Conduciendo confianza, llegando más lejos.';

-- 7. Firma digital del firmante (base64)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS firma_digital TEXT;

-- 8. Mensaje de cierre corporativo para documentos PDF
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cierre_corporativo TEXT DEFAULT 'En Tz''unun AutoRentas nos comprometemos a brindarle un servicio seguro, puntual y a la altura de sus requerimientos. Quedamos a su disposición para cualquier consulta o ajuste adicional.';
