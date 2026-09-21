-- ============================================================================
-- MIGRACION FASE 3.2C — Constraint unico hibrido del catalogo contable
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        "FASE3.2C_PLAN_DETALLADO.md"
-- Revision:   3.2C-R2 — Estrategia transaccional corregida.
--
-- PROBLEMA EN R1: el SQL Editor ejecuta todo el archivo como UNA sola
-- transaccion implicita (simple query). Dentro de ella, un BEGIN top-level es
-- un no-op (aviso "already a transaction in progress"), por lo que el ROLLBACK
-- de las pruebas revirtio TAMBIEN el ALTER TABLE ADD CONSTRAINT recien creado
-- (evidencia: GATE R1 -> "el constraint NO existe"; DB limpia, 47 filas).
--
-- SOLUCION R2: tras la migracion se ejecuta un COMMIT top-level (sentencia de
-- seccion, NUNCA dentro de un bloque DO/PLpgSQL). Esto persiste el constraint
-- ANTES del BEGIN de las pruebas. El ROLLBACK de C1-C4 queda confinado a su
-- propio bloque transaccional y solo revierte las inserciones ZZTEST1.
-- El mismo mecanismo de frontera que el servidor honro en el ROLLBACK de R1
-- (lo reverto todo) garantiza que el COMMIT top-level tambien se honrara.
--
-- FLUJO LOGICO (concordante con lo aprobado):
--   MIGRACION -> CREATE CONSTRAINT -> COMMIT (PERSISTIR) -> PRUEBAS
--   (BEGIN -> C1 C2 C3 C4 -> ROLLBACK) -> POST-CHECK (V1-V7 + GATE)
--
-- Alcance:    SOLO el create del constraint:
--               uq_cuenta_empresa_codigo
--               UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)
--             sobre public.cuentas_contables, con prueba ROLLBACK y post-checks.
-- PROHIBIDO:  modificar datos reales, otras tablas, tipos, RLS, frontend, banca,
--             facturas, o el indice del catalogo: uq_cuentas_contables_empresa_codigo.
-- Seguridad:  idempotente; pre-checks detienen con error controlado; la prueba
--             transaccional termina SIEMPRE en ROLLBACK y ZZTEST1 jamas se
--             persiste; el constraint queda persistido por el COMMIT top-level.
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
-- SECCION 2: MIGRACION (idempotente) + PERSISTENCIA
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

-- PERSISTIR CONSTRAINT (3.2C-R2)
-- COMMIT top-level: cierra la transaccion implicita del editor y persiste el
-- ALTER TABLE de la Seccion 2 ANTES de que comiencen las pruebas.
-- Es una sentencia de SECCION, no esta dentro de ningun bloque DO/PLpgSQL
-- (restriccion respetada). Sin esto, el ROLLBACK de C1-C4 (misma transaccion
-- implicita) revertiria tambien el constraint, como ocurrio en R1.
COMMIT;

-- ============================================================================
-- SECCION 3: PRUEBA DE ACEPTACION (transaccion propia que termina en ROLLBACK)
-- ============================================================================
-- El BEGIN de esta seccion abre un bloque transaccional NUEVO, posterior al
-- COMMIT de la Seccion 2: el constraint ya esta persistido y el ROLLBACK de
-- abajo SOLO revierte las inserciones ZZTEST1 (y nada del constraint).
--
-- Tabla temporal (solo sesion) para compartir el empresa_id real usado en C2
-- y reutilizarlo exactamente en C4 (mismo UUID real; nunca inventado).
DROP TABLE IF EXISTS pg_temp._t32c_emp;
CREATE TEMP TABLE _t32c_emp (empresa_id uuid PRIMARY KEY);

BEGIN;

-- C1 — NULL + ZZTEST1 (maestro): DEBE ser permitido.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
    VALUES (NULL, 'ZZTEST1', 'ZZ prueba maestro 3.2C', 'activo', 1, true);
    RAISE NOTICE 'PASS — C1: NULL + ZZTEST1 permitido';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'FAIL — C1: NULL + ZZTEST1 rechazado (no esperado)';
  WHEN OTHERS THEN
    RAISE NOTICE 'FAIL — C1: error inesperado: %', SQLERRM;
  END;
END $$;

-- C2 — empresa real + ZZTEST1: DEBE ser permitido (empresa obtenida dinamicamente
-- de public.empresas y guardada en _t32c_emp para reutilizarla en C4).
DO $$
DECLARE
  v_emp uuid;
BEGIN
  SELECT id INTO v_emp FROM public.empresas ORDER BY id LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE NOTICE 'FAIL — C2: NO EJECUTADA (no existe ninguna empresa real en public.empresas; no se inventan datos)';
  ELSE
    BEGIN
      INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
      VALUES (v_emp, 'ZZTEST1', 'ZZ prueba empresa 3.2C', 'activo', 1, true);
      INSERT INTO pg_temp._t32c_emp (empresa_id) VALUES (v_emp);
      RAISE NOTICE 'PASS — C2: empresa + ZZTEST1 permitido';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'FAIL — C2: empresa + ZZTEST1 rechazado (no esperado)';
    WHEN OTHERS THEN
      RAISE NOTICE 'FAIL — C2: error inesperado: %', SQLERRM;
    END;
  END IF;
END $$;

-- C3 — segundo NULL + ZZTEST1: DEBE producir unique_violation.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
    VALUES (NULL, 'ZZTEST1', 'ZZ prueba maestro duplicado 3.2C', 'activo', 1, true);
    RAISE NOTICE 'FAIL — C3: segundo NULL + ZZTEST1 permitido (constraint no actua)';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS — C3: segundo NULL + ZZTEST1 rechazado (unique_violation)';
  WHEN OTHERS THEN
    RAISE NOTICE 'FAIL — C3: error inesperado: %', SQLERRM;
  END;
END $$;

-- C4 — segunda misma empresa + ZZTEST1: DEBE producir unique_violation.
-- Usa exactamente el empresa_id registrado por C2 en _t32c_emp.
DO $$
DECLARE
  v_emp uuid;
BEGIN
  SELECT empresa_id INTO v_emp FROM pg_temp._t32c_emp LIMIT 1;
  IF v_emp IS NULL THEN
    RAISE NOTICE 'FAIL — C4: NO EJECUTADA (C2 no registro ninguna empresa real; se esperaba unique_violation)';
  ELSE
    BEGIN
      INSERT INTO public.cuentas_contables (empresa_id, codigo, nombre, tipo, nivel, activa)
      VALUES (v_emp, 'ZZTEST1', 'ZZ prueba empresa duplicada 3.2C', 'activo', 1, true);
      RAISE NOTICE 'FAIL — C4: segunda misma empresa + ZZTEST1 permitido (constraint no actua)';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'PASS — C4: segunda misma empresa + ZZTEST1 rechazado (unique_violation)';
    WHEN OTHERS THEN
      RAISE NOTICE 'FAIL — C4: error inesperado: %', SQLERRM;
    END;
  END IF;
END $$;

-- ROLLBACK obligatorio: revertira SOLO este bloque transaccional (inserciones
-- ZZTEST1). El constraint ya fue persistido por el COMMIT de la Seccion 2 y no
-- se ve afectado.
ROLLBACK;

-- Limpieza de la tabla temporal de sesion (opcional: cae al cerrar sesion).
DROP TABLE IF EXISTS pg_temp._t32c_emp;

-- ============================================================================
-- SECCION 4: POST-CHECK (verificaciones posteriores)
-- ============================================================================

-- V1 — Tabla existe.
SELECT to_regclass('public.cuentas_contables') AS tabla_cuentas;

-- V2 — Constraint existe (por nombre).
SELECT count(*) AS n_constraint_nombre
FROM pg_constraint
WHERE conname='uq_cuenta_empresa_codigo'
  AND conrelid='public.cuentas_contables'::regclass;

-- V3 — Su definicion es realmente UNIQUE NULLS NOT DISTINCT.
SELECT pg_get_constraintdef(oid) AS def_constraint
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

-- GATE 3.2C-R2 — BLOQUEO de cierre: fuerza que la migracion no pueda
-- terminar aparentando exito si algun invariante falla. Corre DESPUES del
-- ROLLBACK (transaccion propia), sin escribir datos, y sobre un constraint
-- ya persistido por el COMMIT de la Seccion 2.
DO $$
DECLARE
  v_def        text;
  v_idx        boolean;
  v_n          bigint;
  v_zz         bigint;
  v_dups       bigint;
  v_empresas   bigint;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
    FROM pg_constraint
   WHERE conname='uq_cuenta_empresa_codigo'
     AND conrelid='public.cuentas_contables'::regclass;

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: el constraint uq_cuenta_empresa_codigo NO existe';
  END IF;
  IF v_def ILIKE '%NULLS NOT DISTINCT (empresa_id, codigo)%' IS NOT TRUE THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: definicion del constraint incorrecta: %', v_def;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname='public' AND tablename='cuentas_contables'
       AND indexname='uq_cuentas_contables_empresa_codigo'
  ) INTO v_idx;
  IF v_idx IS NOT TRUE THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: falta el indice uq_cuentas_contables_empresa_codigo';
  END IF;

  SELECT count(*) INTO v_n    FROM public.cuentas_contables;
  IF v_n <> 47 THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: conteo de cuentas alterado: % (referencia 47)', v_n;
  END IF;

  SELECT count(*) INTO v_zz   FROM public.cuentas_contables WHERE codigo='ZZTEST1';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: quedaron datos ZZTEST1 persistidos (% registros)', v_zz;
  END IF;

  SELECT count(*) INTO v_dups FROM (
    SELECT empresa_id, codigo
    FROM public.cuentas_contables
    GROUP BY empresa_id, codigo
    HAVING count(*) > 1
  ) d;
  IF v_dups <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: se detectaron % duplicados (empresa_id,codigo)', v_dups;
  END IF;

  SELECT count(*) INTO v_empresas FROM public.empresas;
  IF v_empresas < 1 THEN
    RAISE EXCEPTION 'GATE 3.2C-R2 BLOQUEO: public.empresas sin registros (C2/C4 no pudieron probarse)';
  END IF;

  RAISE NOTICE 'GATE 3.2C-R2 OK: constraint persistido, indice plano intacto, 47 cuentas, 0 ZZTEST1, 0 duplicados, % empresa(s) disponible(s) para C2/C4', v_empresas;
END $$;

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