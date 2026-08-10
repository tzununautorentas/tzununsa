-- Fix: PostgREST schema cache — error "Could not find the hora_entrega column of reservas"
-- Ejecutar esto en el SQL Editor de Supabase (Supabase Dashboard > SQL Editor > New Query)

-- 1) Revisar si la columna hora_entrega existe realmente en la tabla reservas
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'reservas'
order by ordinal_position;

-- 2a) Si la columna NO existe y sobra un error de cache, solo recarga el esquema:
NOTIFY pgrst, 'reload schema';

-- 2b) Si la columna hora_entrega existe pero no la usas en la app, puedes eliminarla:
-- ALTER TABLE reservas DROP COLUMN IF EXISTS hora_entrega;
-- Luego recargar el cache:
-- NOTIFY pgrst, 'reload schema';
