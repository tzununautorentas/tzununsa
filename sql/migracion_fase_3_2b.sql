-- ============================================================================
-- MIGRACION FASE 3.2B — Infraestructura multiempresa y autorizacion
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         fmijbpatkddkbxlkfoza (PostgreSQL 17.6)
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        "FASE3.2B_PLAN_DETALLADO.md" (aprobado conceptualmente por el usuario
--              con 3 ajustes obligatorios, incorporados aqui).
-- Alcance:    SOLO infraestructura aprobada:
--             1) CREATE SCHEMA authz
--             2) CREATE TABLE usuario_empresas (+ indices)
--             3) indices unicos de usuarios_sistema
--             4) authz.empresas_autorizadas()
--             5) authz.es_super_admin()
--             6) REVOKE/GRANT correspondientes
--             7) verificaciones posteriores
--             8) rollback documentado (orden corregido)
-- Seguridad:  idempotente; cada paso inspecciona el estado actual antes de actuar
--             (regla 10) y usa pre-checks/guardas como en FASE 3.2A.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PARTE 0 — VALIDACION DE TIPOS REFERENCIADOS (solo lectura)
-- ---------------------------------------------------------------------------
-- Confirma ANTES de crear la tabla que roles.id es BIGINT, usuarios_sistema.id
-- es UUID y empresas.id es UUID. Si alguno difiere, DETIENE (regla 11).
-- roles.id real en PG 17.6 es BIGINT (identidad), no integer.
DO $$
DECLARE
  t_text text;
BEGIN
  IF to_regclass('public.roles')            IS NULL
  OR to_regclass('public.usuarios_sistema') IS NULL
  OR to_regclass('public.empresas')         IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: faltan tablas roles/usuarios_sistema/empresas';
  END IF;

  SELECT data_type INTO t_text FROM information_schema.columns
  WHERE table_schema='public' AND table_name='roles' AND column_name='id';
  IF t_text IS DISTINCT FROM 'bigint' THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: roles.id es % (se espera bigint)', t_text;
  END IF;

  SELECT data_type INTO t_text FROM information_schema.columns
  WHERE table_schema='public' AND table_name='usuarios_sistema' AND column_name='id';
  IF t_text IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: usuarios_sistema.id es % (se espera uuid)', t_text;
  END IF;

  SELECT data_type INTO t_text FROM information_schema.columns
  WHERE table_schema='public' AND table_name='empresas' AND column_name='id';
  IF t_text IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: empresas.id es % (se espera uuid)', t_text;
  END IF;

  RAISE NOTICE 'PRE-CHECK 0 OK: roles.id=bigint, usuarios_sistema.id=uuid, empresas.id=uuid';
END $$;

-- ---------------------------------------------------------------------------
-- PARTE 1 — CREATE SCHEMA authz
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='authz') THEN
    EXECUTE 'CREATE SCHEMA authz';
    RAISE NOTICE '1 OK: schema authz creado';
  ELSE
    RAISE NOTICE '1 OK: schema authz ya existia (idempotente)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PARTE 2 — CREATE TABLE usuario_empresas (autoridad nueva: rol por empresa)
-- ---------------------------------------------------------------------------
-- usuario_empresas.es la autoridad nueva N:M (usuario <-empresa-> rol).
-- usuarios_sistema.rol_id queda como FALLBACK LEGACY durante la transicion.
-- usuarios_sistema.empresa_id NO es frontera de seguridad.
DO $$
BEGIN
  IF to_regclass('public.usuario_empresas') IS NULL THEN
    EXECUTE '
      CREATE TABLE public.usuario_empresas (
        usuario_id uuid   NOT NULL REFERENCES public.usuarios_sistema(id) ON DELETE CASCADE,
        empresa_id uuid   NOT NULL REFERENCES public.empresas(id)        ON DELETE RESTRICT,
        rol_id     bigint  NOT NULL REFERENCES public.roles(id)          ON DELETE RESTRICT,
        activo     boolean NOT NULL DEFAULT true,
        PRIMARY KEY (usuario_id, empresa_id)
      )';
    RAISE NOTICE '2 OK: tabla usuario_empresas creada';
  ELSE
    RAISE NOTICE '2 OK: tabla usuario_empresas ya existia (idempotente)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PARTE 3 — INDICES de usuario_empresas
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public'
      AND tablename='usuario_empresas' AND indexname='idx_ue_empresa'
  ) THEN
    EXECUTE 'CREATE INDEX idx_ue_empresa ON public.usuario_empresas (empresa_id)';
    RAISE NOTICE '3.1 OK: idx_ue_empresa creado';
  ELSE
    RAISE NOTICE '3.1 OK: idx_ue_empresa ya existia (idempotente)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public'
      AND tablename='usuario_empresas' AND indexname='idx_ue_usuario'
  ) THEN
    EXECUTE 'CREATE INDEX idx_ue_usuario ON public.usuario_empresas (usuario_id)';
    RAISE NOTICE '3.2 OK: idx_ue_usuario creado';
  ELSE
    RAISE NOTICE '3.2 OK: idx_ue_usuario ya existia (idempotente)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PARTE 4 — INDICES UNICOS de usuarios_sistema (identidad estable)
-- ---------------------------------------------------------------------------
-- Pre-checks: si existen filas duplicadas, DETIENE antes de crear el indice
-- (regla 11: no saltarse verificaciones). Con 0 filas hoy no hay colision.
DO $$
DECLARE
  n_dups bigint;
BEGIN
  SELECT count(*) INTO n_dups FROM (
    SELECT auth_id FROM public.usuarios_sistema
    WHERE auth_id IS NOT NULL GROUP BY auth_id HAVING count(*) > 1
  ) d;
  IF n_dups > 0 THEN
    RAISE EXCEPTION 'PRE-CHECK 4 BLOQUEO: % duplicados de auth_id en usuarios_sistema', n_dups;
  END IF;

  SELECT count(*) INTO n_dups FROM (
    SELECT lower(email) FROM public.usuarios_sistema
    WHERE email IS NOT NULL GROUP BY lower(email) HAVING count(*) > 1
  ) d;
  IF n_dups > 0 THEN
    RAISE EXCEPTION 'PRE-CHECK 4 BLOQUEO: % duplicados de email en usuarios_sistema', n_dups;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public'
      AND tablename='usuarios_sistema' AND indexname='uq_us_auth'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_us_auth ON public.usuarios_sistema (auth_id) WHERE auth_id IS NOT NULL';
    RAISE NOTICE '4.1 OK: uq_us_auth creado';
  ELSE
    RAISE NOTICE '4.1 OK: uq_us_auth ya existia (idempotente)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public'
      AND tablename='usuarios_sistema' AND indexname='uq_us_email'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_us_email ON public.usuarios_sistema (lower(email)) WHERE email IS NOT NULL';
    RAISE NOTICE '4.2 OK: uq_us_email creado';
  ELSE
    RAISE NOTICE '4.2 OK: uq_us_email ya existia (idempotente)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PARTE 5 — authz.empresas_autorizadas()
-- ---------------------------------------------------------------------------
-- Autoridad para RLS (FASE 3.6). SECURITY DEFINER: lee usuarios_sistema/
-- usuario_empresas aunque el cliente no tenga permiso directo; el acceso externo
-- se gobierna por REVOKE/GRANT, nunca por owner. search_path fijo (anti-hijacking).
-- No depende de RLS ni lee datos de usuarios: solo resuelve auth.uid() -> empresas.
CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT DISTINCT ue.empresa_id
  FROM public.usuarios_sistema us
  JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
  WHERE us.auth_id = auth.uid()
    AND us.activo
    AND ue.activo;
$$;

REVOKE ALL ON FUNCTION authz.empresas_autorizadas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.empresas_autorizadas() TO authenticated;
-- anon NO recibe EXECUTE (REVOKE ALL FROM PUBLIC + GRANT SOLO a authenticated).

-- ---------------------------------------------------------------------------
-- PARTE 6 — authz.es_super_admin()
-- ---------------------------------------------------------------------------
-- Super admin SEMANTICA APROBADA:
--   (1) super_admin por VINCULO en usuario_empresas en CUALQUIER empresa; o
--   (2) fallback legacy vía usuarios_sistema.rol_id SOLO mientras ese usuario
--       NO tenga vinculos en usuario_empresas (NOT EXISTS por usuario_id).
-- No hay doble fuente para el mismo usuario: al poblar vinculos, prevalece (1).
CREATE OR REPLACE FUNCTION authz.es_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
    JOIN public.roles r ON r.id = ue.rol_id
    WHERE us.auth_id = auth.uid()
      AND us.activo AND ue.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
  )
  OR EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.roles r ON r.id = us.rol_id
    WHERE us.auth_id = auth.uid()
      AND us.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
      AND NOT EXISTS (
        SELECT 1 FROM public.usuario_empresas ue2
        WHERE ue2.usuario_id = us.id
      )
  );
$$;

REVOKE ALL ON FUNCTION authz.es_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.es_super_admin() TO authenticated;
-- anon NO recibe EXECUTE.

-- ============================================================================
-- PARTE 7 — VERIFICACIONES POSTERIORES (solo lectura)
-- ============================================================================

-- V1. Schema authz.
SELECT nspname AS schema_authz
FROM pg_namespace WHERE nspname='authz';

-- V2. Tabla usuario_empresas + tipos de columnas.
SELECT
  to_regclass('public.usuario_empresas')              AS tabla_creada,
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='usuario_empresas' AND column_name='usuario_id') AS tipo_usuario_id,
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='usuario_empresas' AND column_name='empresa_id') AS tipo_empresa_id,
  (SELECT data_type FROM information_schema.columns
   WHERE table_schema='public' AND table_name='usuario_empresas' AND column_name='rol_id')     AS tipo_rol_id;

-- V3. Indices de usuario_empresas.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='usuario_empresas'
ORDER BY indexname;

-- V4. Constraints / FKs de usuario_empresas.
SELECT conname, contype, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid='public.usuario_empresas'::regclass
ORDER BY conname;

-- V5. Indices unicos de usuarios_sistema.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='usuarios_sistema'
  AND indexname IN ('uq_us_auth','uq_us_email')
ORDER BY indexname;

-- V6. Funciones authz.* existen.
SELECT to_regprocedure('authz.empresas_autorizadas()') AS fn_empresas_autorizadas,
       to_regprocedure('authz.es_super_admin()')       AS fn_es_super_admin;

-- V7. Privilegios de ejecucion sobre las funciones (solo authenticate, no anon).
SELECT
  p.proname,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_authenticated,
  has_function_privilege('anon',         p.oid, 'EXECUTE') AS auth_anon
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='authz' AND p.proname IN ('empresas_autorizadas','es_super_admin')
ORDER BY p.proname;

-- V8. Sin efectos colaterales: tablas de autoridad intactas y sin filas nuevas.
SELECT
  (SELECT count(*) FROM public.roles)             AS n_roles,
  (SELECT count(*) FROM public.empresas)          AS n_empresas,
  (SELECT count(*) FROM public.usuarios_sistema)  AS n_usuarios_sistema,
  (SELECT count(*) FROM public.usuario_empresas)  AS n_usuario_empresas;

-- V9. Sin politicas RLS sobre la tabla nueva (RLS NO se activa en 3.2B).
SELECT count(*) AS politicas_en_usuario_empresas
FROM pg_policies
WHERE schemaname='public' AND tablename='usuario_empresas';

-- NOTA de diseno registrada:
--   El fallback frontend "empresas limit=1" es COMPATIBILIDAD FUNCIONAL TEMPORAL:
--   mantiene la app funcionando durante la transicion y NO es un mecanismo de
--   autorizacion ni de seguridad. No debe convertirse en frontera de seguridad y
--   debe desaparecer cuando el modelo multiempresa este poblado y RLS entre en
--   operacion. Hasta entonces, el frontend NO debe depender de una lectura directa
--   de usuario_empresas como autoridad: la autoridad se resuelve via funciones
--   authz.empresas_autorizadas()/es_super_admin() (RPC autenticado) cuando
--   corresponda, y el fallback legacy solo mantiene operativa la transicion.

-- ============================================================================
-- PARTE 8 — ROLLBACK DOCUMENTADO (NO ejecutar salvo para revertir)
-- ============================================================================
-- Orden corregido (requerimiento del usuario): funciones ANTES que objetos referenciados.
--
--   DROP FUNCTION IF EXISTS authz.empresas_autorizadas();
--   DROP FUNCTION IF EXISTS authz.es_super_admin();
--   DROP INDEX IF EXISTS uq_us_auth;
--   DROP INDEX IF EXISTS uq_us_email;
--   DROP INDEX IF EXISTS idx_ue_empresa;
--   DROP INDEX IF EXISTS idx_ue_usuario;
--   DROP TABLE IF EXISTS usuario_empresas;
--   DROP SCHEMA IF EXISTS authz;
--
-- Nota: los indices idx_ue_empresa/idx_ue_usuario se incluyen por completitud
-- (la tabla los elimina en cascada al dropearla). Esta reversa es inocua:
-- las tablas y funciones quedan vacias y sin dependencias de datos.

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2B
-- ============================================================================