-- Migración: Comisión Bancaria + Cotización en Dólares
-- Fecha: 2026-08-26

-- Comisión bancaria
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS comision_bancaria_usd NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS moneda_comision VARCHAR(5) DEFAULT 'USD';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS exch_eur NUMERIC DEFAULT 8.50;

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_bancaria_usd NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS moneda_comision VARCHAR(5) DEFAULT 'USD';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS exch_eur NUMERIC DEFAULT 8.50;

-- Moneda de cotización (USD o GTQ)
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS moneda_cotizacion VARCHAR(5) DEFAULT 'GTQ';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS moneda_cotizacion VARCHAR(5) DEFAULT 'GTQ';

-- Cuenta bancaria en dólares
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS banco_usd TEXT DEFAULT '';

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas','empresas')
AND column_name IN ('comision_bancaria','comision_bancaria_usd','moneda_comision','exch_eur','moneda_cotizacion','banco_usd')
ORDER BY table_name, column_name;
