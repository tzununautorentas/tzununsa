-- =====================================================================
-- PRE-FLIGHT FASE 3.4 — DIAGNÓSTICO SOLO LECTURA (OWNER, SQL Editor)
-- Proyecto: fmijbpatkddkbxlkfoza · PostgreSQL 17.6
-- SIN INSERT/UPDATE/DELETE/TRUNCATE/CREATE/ALTER/DROP/GRANT/REVOKE.
-- SOLO SELECT + consultas de catálogo. No modifica absolutamente nada.
-- Ejecutar ENTERO y pegar TODA la salida.
-- =====================================================================

-- === PC2 AUTH.USERS ===
-- Inventario de identidades reales (sin secretos/tokens/contraseñas).
SELECT id,
       email,
       created_at
  FROM auth.users
 ORDER BY created_at;

-- === PC1 AUTHZ ===
-- Existencia del esquema authz.
SELECT nspname AS esquema,
       oid     AS namespace_oid
  FROM pg_namespace
 WHERE nspname = 'authz';

-- === PC6 FUNCTION authz.empresas_autorizadas ===
-- Definición EN VIVO: buscar por nombre dentro del esquema authz (sin asumir firma).
SELECT p.proname,
       p.oid,
       p.proargtypes::text AS proargtypes,
       coalesce(p.proargnames::text, '(sin proargnames)') AS proargnames,
       pg_get_function_identity_arguments(p.oid) AS argumentos_identidad,
       pg_get_function_result(p.oid) AS tipo_retorno,
       pg_get_functiondef(p.oid) AS definicion
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'authz'
   AND p.proname = 'empresas_autorizadas';

-- === PC6 FUNCTION authz.es_super_admin ===
SELECT p.proname,
       p.oid,
       p.proargtypes::text AS proargtypes,
       coalesce(p.proargnames::text, '(sin proargnames)') AS proargnames,
       pg_get_function_identity_arguments(p.oid) AS argumentos_identidad,
       pg_get_function_result(p.oid) AS tipo_retorno,
       pg_get_functiondef(p.oid) AS definicion
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'authz'
   AND p.proname = 'es_super_admin';

-- === PC5 usuarios_sistema ===
-- PK, UNIQUE de auth_id, UNIQUE de email, índice funcional lower(email):
-- se reporta EXACTAMENTE lo que existe (no se crea nada).
SELECT c.conname                     AS constraint_o_indice,
       c.contype                     AS tipo,          -- p=PK, u=UNIQUE, x=FK, i=índice
       pg_get_constraintdef(c.oid)   AS definicion,
       array_agg(a.attname ORDER BY u.ord) AS columnas
  FROM pg_constraint c
  JOIN pg_class t       ON t.oid = c.conrelid
  JOIN pg_namespace n   ON n.oid = t.relnamespace
  JOIN LATERAL unnest(c.conkey) WITH ORDINALITY u(attnum, ord) ON true
  JOIN pg_attribute a   ON a.attrelid = c.conrelid AND a.attnum = u.attnum
 WHERE n.nspname = 'public'
   AND t.relname = 'usuarios_sistema'
 GROUP BY c.conname, c.contype, c.oid, c.conkey
 ORDER BY c.contype, c.conname;

-- Índices (incluye índices NO constraint, p. ej. funcionales sobre lower(email)).
SELECT i.relname              AS indice,
       pg_get_indexdef(ix.indexrelid) AS definicion,
       ix.indisunique         AS es_unico,
       ix.indisprimary        AS es_pk,
       am.amname              AS metodo
  FROM pg_index ix
  JOIN pg_class i     ON i.oid = ix.indexrelid
  JOIN pg_class t     ON t.oid = ix.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_am am       ON am.oid = i.relam
 WHERE n.nspname = 'public'
   AND t.relname = 'usuarios_sistema'
 ORDER BY i.relname;

-- === PC5 usuario_empresas ===
-- PK, las 3 FK, y CUALQUIER UNIQUE/índice sobre (usuario_id, empresa_id).
-- No se asume que exista UNIQUE: se reporta lo que haya.
SELECT c.conname                     AS constraint_o_indice,
       c.contype                     AS tipo,          -- p=PK, u=UNIQUE, x=FK, i=índice
       pg_get_constraintdef(c.oid)   AS definicion,
       array_agg(a.attname ORDER BY u.ord) AS columnas,
       c.confupdtype  AS on_update,                   -- a=NO ACTION, n=SET NULL, c=CASCADE, d=SET DEFAULT
       c.confdeltype AS on_delete
  FROM pg_constraint c
  JOIN pg_class t       ON t.oid = c.conrelid
  JOIN pg_namespace n   ON n.oid = t.relnamespace
  JOIN LATERAL unnest(c.conkey) WITH ORDINALITY u(attnum, ord) ON true
  JOIN pg_attribute a   ON a.attrelid = c.conrelid AND a.attnum = u.attnum
 WHERE n.nspname = 'public'
   AND t.relname = 'usuario_empresas'
 GROUP BY c.conname, c.contype, c.oid, c.confupdtype, c.confdeltype
 ORDER BY c.contype, c.conname;

-- Índices de usuario_empresas (aquí se vería un índice/UNIQUE sobre (usuario_id, empresa_id) si existe).
SELECT i.relname              AS indice,
       pg_get_indexdef(ix.indexrelid) AS definicion,
       ix.indisunique         AS es_unico,
       ix.indisprimary        AS es_pk,
       am.amname              AS metodo
  FROM pg_index ix
  JOIN pg_class i     ON i.oid = ix.indexrelid
  JOIN pg_class t     ON t.oid = ix.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_am am       ON am.oid = i.relam
 WHERE n.nspname = 'public'
   AND t.relname = 'usuario_empresas'
 ORDER BY i.relname;

-- === PC1 estructura ===
-- Columnas + tipos + nullable de ambas tablas (columna orderordinal para lectura).
SELECT c.table_name,
       c.ordinal_position,
       c.column_name,
       c.data_type,
       c.character_maximum_length,
       c.numeric_precision,
       c.numeric_scale,
       c.is_nullable,
       c.column_default
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name IN ('usuarios_sistema', 'usuario_empresas')
 ORDER BY c.table_name, c.ordinal_position;

-- === VEREDICTO ===
-- El veredicto (APROBADO PARA CONSTRUIR MAPEO / BLOQUEADO) se emite DESPUÉS
-- de pegar esta salida y revisarla. Este script no modifica nada.
SELECT 'PRE-FLIGHT FASE 3.4 COMPLETO — pegar salida para veredicto' AS estado;
