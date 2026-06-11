-- Migración: Agregar campo foto_url a la tabla vehiculos
-- Ejecutar en el Editor SQL de Supabase

ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS foto_url TEXT;
