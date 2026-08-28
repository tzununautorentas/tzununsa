-- Migración: Cuentas bancarias seleccionadas por cotización para datos de pago
-- Ejecutar en Supabase SQL Editor
-- Permite elegir en cada cotización las cuentas bancarias (del módulo Banca)
-- a las que el cliente puede depositar el pago. Se guarda lista de IDs.

-- Cuentas seleccionadas en la cotización (lista de IDs de cuentas_bancarias)
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cuentas_pago JSONB DEFAULT '[]';

-- Reservas también lo llevan por consistencia (cuando la cotización se convierte en reserva)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cuentas_pago JSONB DEFAULT '[]';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas')
  AND column_name = 'cuentas_pago'
ORDER BY table_name;
