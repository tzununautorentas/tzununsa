-- Migración: Comisión Bancaria para transferencias SWIFT internacionales
-- Fecha: 2026-08-26

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS comision_bancaria_usd NUMERIC DEFAULT 0;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS moneda_comision VARCHAR(5) DEFAULT 'USD';
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS exch_eur NUMERIC DEFAULT 8.50;

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_bancaria NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comision_bancaria_usd NUMERIC DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS moneda_comision VARCHAR(5) DEFAULT 'USD';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS exch_eur NUMERIC DEFAULT 8.50;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('cotizaciones','reservas') AND column_name IN ('comision_bancaria','comision_bancaria_usd','moneda_comision','exch_eur')
ORDER BY table_name, column_name;
