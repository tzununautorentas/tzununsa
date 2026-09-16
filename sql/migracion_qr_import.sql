-- Migración: agregar columna qr_imagen (dataURL del QR de la factura SAT)
-- Correr en Supabase SQL Editor (Run without RLS)
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS qr_imagen text;