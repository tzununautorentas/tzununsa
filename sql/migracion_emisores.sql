-- Migración: Entidades Emisoras (multi-empresa)
-- Ejecutar en Supabase SQL Editor

-- 1) Tabla emisores
CREATE TABLE IF NOT EXISTS emisores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid,
  responsable text default '',
  nombre_entidad text default '',
  nit text default '',
  direccion text default '',
  telefono text default '',
  email_contacto text default '',
  logo_url text default '',
  firmante text default '',
  cargo_firmante text default '',
  tel_firmante text default '',
  serie_default text default '',
  banco_preferido text default '',
  user_email text default '',
  notas text default '',
  created_at timestamptz default now()
);

-- 2) Relación con empresa
ALTER TABLE emisores
  ADD CONSTRAINT fk_emisores_empresas
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  ON DELETE SET NULL;

-- 3) emisor_id en facturas
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS emisor_id uuid;

-- 4) emisor_id en pagos_recibidos
ALTER TABLE pagos_recibidos ADD COLUMN IF NOT EXISTS emisor_id uuid;

-- 5) Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_emisores_empresa ON emisores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emisores_user_email ON emisores(user_email);
CREATE INDEX IF NOT EXISTS idx_facturas_emisor ON facturas(emisor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_emisor ON pagos_recibidos(emisor_id);

-- Verificación
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'emisores'
  AND column_name IN ('responsable','nombre_entidad','nit','banco_preferido','user_email','empresa_id')
ORDER BY column_name;
