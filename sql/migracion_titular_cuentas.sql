-- Migración: Titular de la cuenta bancaria
-- Ejecutar en Supabase SQL Editor
-- Permite indicar el nombre del titular (propietario) de cada cuenta bancaria
-- del módulo Banca, para usarlo en cotizaciones, contratos y demás documentos.

-- Titular en la tabla de cuentas bancarias (módulo Banca)
ALTER TABLE cuentas_bancarias ADD COLUMN IF NOT EXISTS titular TEXT DEFAULT '';

-- Titular en contratos (información bancaria para transferencia)
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS titular TEXT DEFAULT '';

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'titular'
  AND table_name IN ('cuentas_bancarias','contratos')
ORDER BY table_name;
