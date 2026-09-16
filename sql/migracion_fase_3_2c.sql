-- ============================================================================
-- MIGRACION FASE 3.2C — Constraint unico hibrido del catalogo contable
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        "FASE3.2C_PLAN_DETALLADO.md"
-- Alcance:    SOLO el create del constraint:
--               uq_cuenta_empresa_codigo
--               UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)
--             sobre public.cuentas_contables, con prueba ROLLBACK y post-checks.
-- PROHIBIDO:  modificar datos reales, otras tablas, tipos, RLS, frontend, banca,
--             facturas, o el indice del catalogo: uq_cuentas_contables_empresa_codigo.
-- Seguridad:  idempotente; pre-checks detienen con error controlado; la prueba
--             transaccional termina SIEMPRE en ROLLBACK.
-- ============================================================================

-- ============================================================================
-- SECCION 1: PRE-CHECK
-- ============================================================================

-- PRE-CHECK 0 — PostgreSQL >= 15
DO $$
DECLARE
  v_num text;
BEGIN
  SELECT current_setting('server_version_num') INTO v_num;
  IF v_num::bigint < 150000 THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: PostgreSQL % (requerido >= 15)', v_num;
  END IF;
  RAISE NOTICE 'PRE-CHECK 0 OK: PostgreSQL %', v_num;
END $$;

-- PRE-CHECK 1 — Tabla
DO $$
BEGIN
  IF to_regclass('public.cuentas_contables') IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK 1 BLOQUEO: falta public.cuentas_contables';
  END IF;
  RAISE NOTICE 'PRE-CHECK 1 OK: cuentas_contables existe';
END $$;

-- PRE-CHECK 2 — Columnas y tipos
DO $$
DECLARE
  t text;
BEGIN
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cuentas_contables'
     AND column_name='empresa_id';
  IF t IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: empresa_id es % (se espera uuid)', t;
  END IF;

  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cuentas_contables'
     AND column_name='codigo';
  IF t IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: codigo es % (se espera text)', t;
  END IF;

  RAISE NOTICE 'PRE-CHECK 2 OK: empresa_id=uuid, codigo=text';
END $$;

-- PRE-CHECK 3 — Duplicados actuales (NULL tratado como igual, semantica NULLS NOT DISTINCT)
DO $$
DECLARE
  n_dups bigint;
BEGIN
  SELECT count(*) INTO n_dups FROM (
    SELECT empresa_id, codigo
    FROM public.cuentas_contables
    GROUP BY empresa_id, codigo
    HAVING count(*) > 1
  ) d;
  IF n_dups > 0 THEN
    RAISE EXCEPTION 'PRE-CHECK 3 BLOQUEO: % duplicados en (empresa_id,codigo) — revisar manualmente', n_dups;
  END IF;
  RAISE NOTICE 'PRE-CHECK 3 OK: 0 duplicados en (empresa_id,codigo)';
END $$;

-- PRE-CHECK 4 — Indice plano del catalogo presente (no se toca)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname='public' AND tablename='cuentas_contables'
       AND indexname='uq_cuentas_contables_empresa_codigo'
  ) THEN
    RAISE EXCEPTION 'PRE-CHECK 4 BLOQUEO: falta el indice uq_cuentas_contables_empresa_codigo (no se creara uno nuevo)';
  END IF;
  RAISE NOTICE 'PRE-CHECK 4 OK: uq_cuentas_contables_empresa_codigo presente';
END $$;

-- PRE-CHECK 5 — Estado de datos (linea base)
DO $$
DECLARE
  v_n bigint;
BEGIN
  SELECT count(*) INTO v_n FROM public.cuentas_contables;
  IF v_n <> 47 THEN
    RAISE NOTICE 'PRE-CHECK 5 AVISO: cuentas_contables tiene % filas (referencia = 47). No se bloquea; se usara % como linea base.', v_n, v_n;
  ELSE
    RAISE NOTICE 'PRE-CHECK 5 OK: % filas (coincide con referencia 47)', v_n;
  END IF;
END $$;

-- ============================================================================
-- SECCION 2: MIGRACION (idempotente)
-- ============================================================================
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
    FROM pg_constraint
   WHERE conname='uq_cuenta_empresa_codigo'
     AND conrelid='public.cuentas_contables'::regclass;

  IF v_def IS NULL THEN
    EXECUTE 'ALTER TABLE public.cuentas_contables
      ADD CONSTRAINT uq_cuenta_empresa_codigo
      UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)';
    RAISE NOTICE 'MIGRACION OK: constraint uq_cuenta_empresa_codigo creado (NULLS NOT DISTINCT)';
  ELSIF v_def ILIKE '%NULLS NOT DISTINCT (empresa_id, codigo)%' THEN
    RAISE NOTICE 'MIGRACION OK: constraint ya existe con definicion correcta (idempotente, sin cambios)';
  ELSE
    RAISE EXCEPTION 'MIGRACION BLOQUEO: uq_cuenta_empresa_codigo existe con definicion no esperada: % -> revisar y resolver manualmente', v_def;
  END IF;
END $$;

-- ============================================================================
-- SECCION 3: PRUEBA DE ACEPTACION (transaccion que termina en ROLLBACK)
-- ============================================================================
BEGIN;

-- C1 — NULL + ZZTEST1 (maestro): permitido
DO $$
BEGIN
  INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
  VALUES (NULL, 'ZZTEST1', 'ZZ prueba maestro 3.2C', 'activo', 1, true);
  RAISE NOTICE 'PASS — NULL + ZZTEST1 permitido';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'FAIL — NULL + ZZTEST1 rechazado (no esperado)';
END $$;

-- C2 — empresa real + ZZTEST1: permitido (empresa obtenida dinamicamente)
DO $$
DECLARE
  v_emp uuid;
BEGIN
  SELECT id INTO v_emp FROM public.empresas ORDER BY id LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE NOTICE 'FAIL — no existe ninguna empresa real en public.empresas (no se pudo probar C2/C4)';
  ELSE
    INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
    VALUES (v_emp, 'ZZTEST1', 'ZZ prueba empresa 3.2C', 'activo', 1, true);
    RAISE NOTICE 'PASS — empresa + ZZTEST1 permitido';
  END IF;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'FAIL — empresa + ZZTEST1 rechazado (no esperado)';
END $$;

-- C3 — segundo NULL + ZZTEST1: rechazado (unique_violation)
DO $$
BEGIN
  INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
  VALUES (NULL, 'ZZTEST1', 'ZZ prueba maestro duplicado 3.2C', 'activo', 1, true);
  RAISE NOTICE 'FAIL — segundo NULL + ZZTEST1 permitido (constraint no actua)';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'PASS — segundo NULL + ZZTEST1 rechazado';
END $$;

-- C4 — segunda misma empresa + ZZTEST1: rechazado (unique_violation)
DO $$
DECLARE
  v_emp uuid;
BEGIN
  SELECT id INTO v_emp FROM public.empresas ORDER BY id LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE NOTICE 'FAIL — no existe empresa real (no se pudo probar C4)';
  ELSE
    INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
    VALUES (v_emp, 'ZZTEST1', 'ZZ prueba empresa duplicada 3.2C', 'activo', 1, true);
    RAISE NOTICE 'FAIL — segunda misma empresa + ZZTEST1 permitido (constraint no actua)';
  END IF;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'PASS — segunda misma empresa + ZZTEST1 rechazado';
END $$;

-- ROLLBACK obligatorio: los datos ZZTEST1 jamás se persisten.
ROLLBACK;

-- ============================================================================
-- SECCION 4: POST-CHECK (verificaciones posteriores)
-- ============================================================================

-- V1 — Tabla existe.
SELECT to_regclass('public.cuentas_contables') AS tabla_cuentas;

-- V2 — Constraint existe (por nombre) y
-- V3 — su definicion es realmente UNIQUE NULLS NOT DISTINCT.
SELECT
  count(*) AS n_constraint_nombre,
  bool_and(pg_get_constraintdef(oid) ILIKE '%NULLS NOT DISTINCT (empresa_id, codigo)%') AS def_correcta
FROM pg_constraint
WHERE conname='uq_cuenta_empresa_codigo'
  AND conrelid='public.cuentas_contables'::regclass;

-- V4 — Indice plano del catalogo sigue existiendo.
SELECT indexname
FROM pg_indexes
WHERE schemaname='public' AND tablename='cuentas_contables'
  AND indexname='uq_cuentas_contables_empresa_codigo';

-- V5 — Conteo intacto (referencia 47).
SELECT
  (SELECT count(*) FROM public.cuentas_contables) AS n_cuentas_actual,
  47 AS n_referencia,
  ((SELECT count(*) FROM public.cuentas_contables) = 47) AS conteo_intacto;

-- V6 — No quedaron datos de prueba.
SELECT (SELECT count(*) FROM public.cuentas_contables WHERE codigo='ZZTEST1') AS n_zztest_restante;

-- V7 — Siguen sin existir duplicados en (empresa_id, codigo).
SELECT count(*) AS n_duplicados FROM (
  SELECT empresa_id, codigo
  FROM public.cuentas_contables
  GROUP BY empresa_id, codigo
  HAVING count(*) > 1
) d;

-- ============================================================================
-- SECCION 5: ROLLBACK (solo para revertir; NO ejecutar en esta fase)
-- ============================================================================
--   ALTER TABLE public.cuentas_contables
--     DROP CONSTRAINT IF EXISTS uq_cuenta_empresa_codigo;
--
-- NOTA: el rollback NO elimina ni modifica el indice uq_cuentas_contables_empresa_codigo
-- (pertenece al catalogo existente y es anterior a esta fase), ni toca datos.

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2C
-- ============================================================================