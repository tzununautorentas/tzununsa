-- ============================================================================
-- MIGRACION FASE 3.2D — Estructura bancaria
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)  ·  DB: PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        FASE3.2D_PLAN_DETALLADO.md
-- Version:    3.2D-R2 (revision: T1 robusta — flag cuenta_ok, referencia limpia, triggers internos excluidos)
--
-- Alcance (BLOQUE 3.2D, FASE3.2_PLAN.md §6):
--   1) public.movimientos_bancarios.estado (text NOT NULL DEFAULT 'activo')
--      + CHECK chk_movbancario_estado (estado IN ('activo','anulado'))
--   2) public.fn_recalcular_saldo_cuenta() (esquema).
--      EL TRIGGER NO SE ACTIVA EN ESTA FASE (se activa en FASE 3.8).
-- PROHIBIDO: activar trigger, otras tablas, datos, tipos, RLS, frontend.
--
-- Estrategia (leccion 3.2C-R2): el SQL Editor ejecuta el archivo en una sola
-- transaccion implicita; un ROLLBACK de prueba revertiria la migracion. Por
-- eso la migracion se persiste con COMMIT top-level (fuera de DO) ANTES del
-- BEGIN..ROLLBACK de la prueba; el ROLLBACK solo revierte filas ZZTEST.
--
-- T1 (3.2D-R2): usa flags explicitos (insert_ok, visible, cuenta_ok, saldo_ok)
-- persistidos como GUC de sesion (set_config con is_local=false), que
-- SOBREVIVEN al ROLLBACK y son leidos por el GATE. Asi, si alguna condicion
-- obligatoria falla (INSERT, visibilidad, coincidencia de cuenta, saldo intacto),
-- T1 queda en FAIL y el GATE BLOQUEA la migracion: la prueba NO puede terminar
-- aparentando exito. Se exige referencia ZZTEST3.2D limpia (sin filas previas)
-- y se distinguen triggers internos de PostgreSQL (FK) de los de aplicacion.
-- ============================================================================

-- ================= SECCION 1: PRE-CHECK ======================================

-- PRE-CHECK 0 — PostgreSQL >= 15
DO $$
DECLARE v_num text;
BEGIN
  SELECT current_setting('server_version_num') INTO v_num;
  IF v_num::bigint < 150000 THEN
    RAISE EXCEPTION 'PRE-CHECK 0 BLOQUEO: PostgreSQL % (requerido >= 15)', v_num;
  END IF;
  RAISE NOTICE 'PRE-CHECK 0 OK: PostgreSQL %', v_num;
END $$;

-- PRE-CHECK 1 — Tablas
DO $$
BEGIN
  IF to_regclass('public.movimientos_bancarios') IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK 1 BLOQUEO: falta public.movimientos_bancarios';
  END IF;
  IF to_regclass('public.cuentas_bancarias') IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK 1 BLOQUEO: falta public.cuentas_bancarias';
  END IF;
  RAISE NOTICE 'PRE-CHECK 1 OK: movimientos_bancarios y cuentas_bancarias existen';
END $$;

-- PRE-CHECK 2 — Columnas y tipos requeridos
DO $$
DECLARE t text;
BEGIN
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='empresa_id';
  IF t IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: movimientos_bancarios.empresa_id es % (se espera uuid)', t;
  END IF;
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='cuenta_id';
  IF t IS DISTINCT FROM 'uuid' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: movimientos_bancarios.cuenta_id es % (se espera uuid)', t;
  END IF;
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='monto';
  IF t IS DISTINCT FROM 'numeric' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: movimientos_bancarios.monto es % (se espera numeric)', t;
  END IF;
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cuentas_bancarias' AND column_name='saldo_inicial';
  IF t IS DISTINCT FROM 'numeric' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: cuentas_bancarias.saldo_inicial es % (se espera numeric)', t;
  END IF;
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema='public' AND table_name='cuentas_bancarias' AND column_name='saldo_actual';
  IF t IS DISTINCT FROM 'numeric' THEN
    RAISE EXCEPTION 'PRE-CHECK 2 BLOQUEO: cuentas_bancarias.saldo_actual es % (se espera numeric)', t;
  END IF;
  RAISE NOTICE 'PRE-CHECK 2 OK: tipos requeridos correctos (uuid, numeric)';
END $$;

-- PRE-CHECK 3 — Columna estado (existencia informada)
DO $$
DECLARE v_existe boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado'
  ) INTO v_existe;
  IF v_existe THEN
    RAISE NOTICE 'PRE-CHECK 3 AVISO: columna estado YA existe; la migracion validara su definicion (idempotente, sin reemplazo)';
  ELSE
    RAISE NOTICE 'PRE-CHECK 3 OK: columna estado NO existe; se creara (ADD COLUMN)';
  END IF;
END $$;

-- PRE-CHECK 4 — Estado de datos (linea base, solo lectura)
DO $$
DECLARE v_c bigint; v_m bigint;
BEGIN
  SELECT count(*) INTO v_c FROM public.cuentas_bancarias;
  SELECT count(*) INTO v_m FROM public.movimientos_bancarios;
  IF v_c <> 7 THEN RAISE NOTICE 'PRE-CHECK 4 AVISO: cuentas_bancarias = % (referencia 7)', v_c;
  ELSE RAISE NOTICE 'PRE-CHECK 4 OK: % cuentas (referencia 7)', v_c; END IF;
  IF v_m <> 33 THEN RAISE NOTICE 'PRE-CHECK 4 AVISO: movimientos_bancarios = % (referencia 33)', v_m;
  ELSE RAISE NOTICE 'PRE-CHECK 4 OK: % movimientos (referencia 33)', v_m; END IF;
END $$;

-- PRE-CHECK 5 — INFO: columnas NOT NULL sin default (deben completarse en el INSERT de prueba)
DO $$
DECLARE v_req text;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO v_req
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND is_nullable='NO' AND column_default IS NULL;
  RAISE NOTICE 'PRE-CHECK 5 INFO: columnas NOT NULL sin default en movimientos_bancarios: %', v_req;
END $$;

-- PRE-CHECK 6 — Sin triggers DE APLICACION sobre movimientos_bancarios.
-- Se excluyen los internos de PostgreSQL (NOT tgisinternal): las FK crean
-- triggers internos de RI (Referential Integrity) y un conteo total daria un
-- FALSO BLOQUEO. El trigger de saldo (trg_mov_saldo) corresponde a FASE 3.8.
DO $$
DECLARE v_trg int; v_trg_nm int;
BEGIN
  SELECT count(*) INTO v_trg FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg <> 0 THEN
    RAISE EXCEPTION 'PRE-CHECK 6 BLOQUEO: existen % trigger(s) DE APLICACION en movimientos_bancarios (trg_mov_saldo se activa en FASE 3.8; aqui no corresponde ninguno)', v_trg;
  END IF;
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'PRE-CHECK 6 BLOQUEO: trg_mov_saldo ya existe; ese trigger se activa unicamente en FASE 3.8';
  END IF;
  RAISE NOTICE 'PRE-CHECK 6 OK: sin triggers de aplicacion en movimientos_bancarios (trg_mov_saldo se activara en FASE 3.8)';
END $$;

-- ================= SECCION 2: MIGRACION (idempotente) + PERSISTENCIA =========

-- 2.1 Columna estado + CHECK nombrado (idempotente)
DO $$
DECLARE
  v_existe boolean;
  v_def text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado'
  ) INTO v_existe;

  IF NOT v_existe THEN
    EXECUTE 'ALTER TABLE public.movimientos_bancarios
      ADD COLUMN estado text NOT NULL DEFAULT ''activo'',
      ADD CONSTRAINT chk_movbancario_estado CHECK (estado IN (''activo'',''anulado''))';
    RAISE NOTICE 'MIGRACION OK: columna estado + CHECK chk_movbancario_estado creados';
  ELSE
    DECLARE
      v_tipo    text;
      v_nn      text;
      v_default text;
    BEGIN
      SELECT data_type, is_nullable, column_default
        INTO v_tipo, v_nn, v_default
        FROM information_schema.columns
       WHERE table_schema='public' AND table_name='movimientos_bancarios'
         AND column_name='estado';

      IF v_tipo IS DISTINCT FROM 'text' THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe con tipo % (se espera text); no se auto-reemplaza', v_tipo;
      END IF;
      IF v_nn IS DISTINCT FROM 'NO' THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe sin NOT NULL; no se auto-reemplaza';
      END IF;
      IF v_default IS NULL OR v_default ILIKE '%activo%' IS NOT TRUE THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe sin default ''activo'' (detectado: %); no se auto-reemplaza', v_default;
      END IF;

      SELECT pg_get_constraintdef(oid) INTO v_def
        FROM pg_constraint
       WHERE conrelid='public.movimientos_bancarios'::regclass AND contype='c'
         AND pg_get_constraintdef(oid) ILIKE '%estado%'
         AND pg_get_constraintdef(oid) ILIKE '%activo%'
         AND pg_get_constraintdef(oid) ILIKE '%anulado%'
       LIMIT 1;
      IF v_def IS NULL THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe pero no hay CHECK valido (estado IN activo/anulado) -> revision manual, no se auto-reemplaza';
      END IF;
      RAISE NOTICE 'MIGRACION OK: columna estado ya existe con definicion correcta (idempotente): tipo=% not_null=% default=% check=%', v_tipo, v_nn, v_default, v_def;
    END;
  END IF;
END $$;

-- 2.2 Funcion esquema (idempotente por CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.fn_recalcular_saldo_cuenta()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _ids uuid[];
BEGIN
  CASE TG_OP
    WHEN 'INSERT' THEN _ids := ARRAY[NEW.cuenta_id];
    WHEN 'DELETE' THEN _ids := ARRAY[OLD.cuenta_id];
    WHEN 'UPDATE' THEN
      IF coalesce(NEW.cuenta_id::text, '') IS DISTINCT FROM coalesce(OLD.cuenta_id::text, '') THEN
        _ids := ARRAY[OLD.cuenta_id, NEW.cuenta_id];
      ELSE
        _ids := ARRAY[COALESCE(NEW.cuenta_id, OLD.cuenta_id)];
      END IF;
  END CASE;

  PERFORM pg_advisory_xact_lock(hashtext('tz_saldo:' || m.cuenta_id::text))
    FROM (SELECT DISTINCT c FROM unnest(_ids) AS t(c)
           WHERE c IS NOT NULL      -- huerfanos (cuenta_id NULL): lock no-op, el UPDATE no matchea
           ORDER BY 1) m;

  UPDATE public.cuentas_bancarias c
     SET saldo_actual = c.saldo_inicial
       + coalesce((SELECT sum(CASE WHEN mo.tipo='ingreso' THEN mo.monto ELSE -mo.monto END)
                   FROM public.movimientos_bancarios mo
                   WHERE mo.cuenta_id = c.id AND mo.estado='activo'), 0)
   WHERE c.id = ANY(_ids);

  RETURN COALESCE(NEW, OLD);
END $$;

-- RAISE NOTICE no es SQL valido fuera de PL/pgSQL; la verificacion va en un DO.
DO $$
BEGIN
  IF to_regprocedure('public.fn_recalcular_saldo_cuenta()') IS NULL THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: no se encontro public.fn_recalcular_saldo_cuenta()';
  END IF;
  RAISE NOTICE 'MIGRACION OK: funcion public.fn_recalcular_saldo_cuenta() creada (esquema; trigger inactivo)';
END $$;

-- PERSISTIR migracion (leccion 3.2C-R2): COMMIT top-level, fuera de DO.
-- Sin esto, el ROLLBACK de la prueba (misma transaccion implicita del editor)
-- revertiria tambien la columna y la funcion.
COMMIT;

-- ================= SECCION 3: PRUEBA TRANACCIONAL (BEGIN..ROLLBACK) ==========

-- Inicializar flags de T1 como GUC de sesion (is_local=false): sobreviven al
-- ROLLBACK y los lee el GATE. Valor base = false (FAIL hasta demostrar lo contrario).
SELECT set_config('tz32d.t1_insert_ok', 'false', false);
SELECT set_config('tz32d.t1_visible',    'false', false);
SELECT set_config('tz32d.t1_cuenta_ok',  'false', false);
SELECT set_config('tz32d.t1_saldo_ok',   'false', false);
SELECT set_config('tz32d.t1_no_cuenta',  'false', false);

-- P0 — Referencia de prueba limpia: si ya existiera ZZTEST3.2D la prueba seria un
-- FALSO POSITIVO. BLOQUEAR: NO borrar, NO modificar, NO reutilizar la referencia.
DO $$
DECLARE v_p bigint;
BEGIN
  SELECT count(*) INTO v_p FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';
  IF v_p <> 0 THEN
    RAISE EXCEPTION 'T1 BLOQUEO: ya existen % fila(s) con referencia ZZTEST3.2D; la prueba solo se ejecuta con referencia limpia (no se borran ni modifican)', v_p;
  END IF;
  RAISE NOTICE 'T1 OK: referencia ZZTEST3.2D limpia (0 filas preexistentes)';
END $$;

BEGIN;

DO $$
DECLARE
  v_cuenta    uuid;
  v_emp       uuid;
  v_antes     numeric;
  v_despu     numeric;
  v_vis       boolean;
  v_cuenta_mov uuid;
BEGIN
  -- A/B: debe existir >= 1 cuenta real y se selecciona dinamicamente (sin inventar UUID).
  SELECT id, empresa_id INTO v_cuenta, v_emp
    FROM public.cuentas_bancarias
   ORDER BY id
   LIMIT 1;

  IF v_cuenta IS NULL THEN
    PERFORM set_config('tz32d.t1_no_cuenta', 'true', false);
    RAISE NOTICE 'FAIL — T1: NO EJECUTADA: no existe ninguna cuenta real en cuentas_bancarias; no se inventan datos';
  ELSE
    -- C: saldo_actual antes del INSERT.
    SELECT saldo_actual INTO v_antes FROM public.cuentas_bancarias WHERE id = v_cuenta;

    -- D/E: INSERT temporal con referencia ZZTEST3.2D; solo marca insert_ok si no falla.
    BEGIN
      INSERT INTO public.movimientos_bancarios
        (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado)
      VALUES
        (v_emp, v_cuenta, now()::date, 'ingreso', 'ZZ prueba 3.2D', 1.00, 'ZZTEST3.2D', 'prueba', false);
      PERFORM set_config('tz32d.t1_insert_ok', 'true', false);
      RAISE NOTICE 'PASS — T1: INSERT del movimiento temporal ZZTEST3.2D ejecutado';
    EXCEPTION WHEN OTHERS THEN
      PERFORM set_config('tz32d.t1_error', SQLERRM, false);
      RAISE NOTICE 'FAIL — T1: INSERT del movimiento temporal fallo: %', SQLERRM;
    END;

    -- F1: el movimiento temporal debe ser VISIBLE dentro de esta transaccion.
    SELECT EXISTS (
      SELECT 1 FROM public.movimientos_bancarios WHERE referencia = 'ZZTEST3.2D'
    ) INTO v_vis;
    IF v_vis THEN
      PERFORM set_config('tz32d.t1_visible', 'true', false);
      RAISE NOTICE 'PASS — T1: movimiento ZZTEST3.2D visible dentro de la transaccion';
    ELSE
      RAISE NOTICE 'FAIL — T1: movimiento ZZTEST3.2D NO visible dentro de la transaccion';
    END IF;

    -- F2: la cuenta del movimiento debe coincidir con la seleccionada.
    SELECT cuenta_id INTO v_cuenta_mov
      FROM public.movimientos_bancarios WHERE referencia = 'ZZTEST3.2D';
    IF v_cuenta_mov IS NOT DISTINCT FROM v_cuenta THEN
      PERFORM set_config('tz32d.t1_cuenta_ok', 'true', false);
      RAISE NOTICE 'PASS — T1: la cuenta del movimiento (%) coincide con la seleccionada', v_cuenta_mov;
    ELSE
      RAISE NOTICE 'FAIL — T1: la cuenta del movimiento (%) NO coincide con la seleccionada (%)', v_cuenta_mov, v_cuenta;
    END IF;

    -- G: saldo_actual debe permanecer intacto -> evidencia de que el trigger NO esta activo.
    SELECT saldo_actual INTO v_despu FROM public.cuentas_bancarias WHERE id = v_cuenta;
    IF v_despu IS NOT DISTINCT FROM v_antes THEN
      PERFORM set_config('tz32d.t1_saldo_ok', 'true', false);
      RAISE NOTICE 'PASS — T1: saldo_actual intacto (%) -> trg_mov_saldo NO activo (correcto en 3.2D)', v_despu;
    ELSE
      RAISE NOTICE 'FAIL — T1: saldo_actual cambio de % a % (el trigger no deberia estar activo)', v_antes, v_despu;
    END IF;
  END IF;
END $$;

-- H: ROLLBACK. Solo revierte el bloque transaccional de la prueba (inserciones
-- ZZTEST3.2D). La columna y la funcion ya fueron persistidas por el COMMIT.
ROLLBACK;

-- ================= SECCION 4: POST-CHECK ======================================

-- V1 — Tabla
SELECT to_regclass('public.movimientos_bancarios') AS v1_tabla;

-- V2 — Columna estado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';

-- V3 — CHECK estado (activo/anulado)
SELECT conname, pg_get_constraintdef(oid) AS v3_def
FROM pg_constraint
WHERE conrelid='public.movimientos_bancarios'::regclass AND contype='c'
  AND pg_get_constraintdef(oid) ILIKE '%estado%'
  AND pg_get_constraintdef(oid) ILIKE '%activo%'
  AND pg_get_constraintdef(oid) ILIKE '%anulado%';

-- V4 — Funcion
SELECT to_regprocedure('public.fn_recalcular_saldo_cuenta()') AS v4_fn;

-- V5 — Triggers DE APLICACION sobre la tabla (excluye internos de PostgreSQL por FK)
SELECT count(*) AS v5_triggers_plataforma
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;

-- V5b — trg_mov_saldo no debe existir (se activa unicamente en FASE 3.8)
SELECT count(*) AS v5b_trg_mov_saldo
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';

-- V6 — No quedaron datos de prueba (despues del ROLLBACK, resultado obligatorio = 0)
SELECT count(*) AS v6_zztest FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';

-- GATE 3.2D — bloqueo de cierre; corre DESPUES del ROLLBACK, sin escribir datos.
-- Lee los flags de T1 (GUC de sesion): si T1 no demuestra insert_ok, visible,
-- cuenta_ok y saldo_ok, la migracion NO termina aparentando exito. El conteo de
-- triggers excluye los internos de PostgreSQL (FK) y exige ausencia de trg_mov_saldo.
DO $$
DECLARE
  v_tipo    text;
  v_nn      text;
  v_default text;
  v_def     text;
  v_fn      regprocedure;
  v_trg     int;
  v_trg_nm  int;
  v_zz      bigint;
  v_c       bigint;
BEGIN
  -- Invariantes de esquema
  SELECT data_type, is_nullable, column_default INTO v_tipo, v_nn, v_default
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: falta la columna estado';
  END IF;
  IF v_tipo IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: estado es % (se espera text)', v_tipo;
  END IF;
  IF v_nn IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: estado no es NOT NULL';
  END IF;
  IF v_default IS NULL OR v_default ILIKE '%activo%' IS NOT TRUE THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: estado sin default ''activo'' (detectado: %)', v_default;
  END IF;

  SELECT pg_get_constraintdef(oid) INTO v_def
    FROM pg_constraint
   WHERE conrelid='public.movimientos_bancarios'::regclass AND contype='c'
     AND pg_get_constraintdef(oid) ILIKE '%estado%'
     AND pg_get_constraintdef(oid) ILIKE '%activo%'
     AND pg_get_constraintdef(oid) ILIKE '%anulado%' LIMIT 1;
  IF v_def IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: CHECK de estado (activo/anulado) no existe';
  END IF;

  SELECT to_regprocedure('public.fn_recalcular_saldo_cuenta()') INTO v_fn;
  IF v_fn IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: falta la funcion fn_recalcular_saldo_cuenta()';
  END IF;

  SELECT count(*) INTO v_trg FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  IF v_trg <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: existen % trigger(s) DE APLICACION en movimientos_bancarios (trg_mov_saldo se activa en FASE 3.8)', v_trg;
  END IF;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: trg_mov_saldo existe; se activa unicamente en FASE 3.8';
  END IF;

  -- Invariantes de datos (post-ROLLBACK)
  SELECT count(*) INTO v_zz FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: quedaron % filas de prueba ZZTEST3.2D persistidas', v_zz;
  END IF;

  SELECT count(*) INTO v_c FROM public.cuentas_bancarias;
  IF v_c < 1 THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: no hay cuentas reales (la prueba T1 no pudo ejecutarse)';
  END IF;

  -- Invariantes de T1 (flags de sesion; sobrevivieron al ROLLBACK)
  IF current_setting('tz32d.t1_insert_ok', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: T1 no inserto el movimiento temporal (insert_ok=false; error: %)',
      COALESCE(current_setting('tz32d.t1_error', true), 'sin detalle');
  END IF;
  IF current_setting('tz32d.t1_visible', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: T1 no confirmo el movimiento visible dentro de la transaccion';
  END IF;
  IF current_setting('tz32d.t1_saldo_ok', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: T1 no confirmo saldo_actual intacto (trigger sospechoso o saldo alterado)';
  END IF;
  IF current_setting('tz32d.t1_cuenta_ok', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: T1 no confirmo que la cuenta del movimiento coincide con la cuenta real seleccionada';
  END IF;
  IF current_setting('tz32d.t1_no_cuenta', true) = 'true' THEN
    RAISE EXCEPTION 'GATE 3.2D BLOQUEO: T1 NO EJECUTADA: no existe ninguna cuenta real (no se inventan datos)';
  END IF;

  RAISE NOTICE 'GATE 3.2D OK: columna estado + CHECK, funcion presente, 0 triggers de aplicacion (internos FK excluidos), trg_mov_saldo ausente, 0 ZZTEST, T1 PASS (insert/visible/cuenta/saldo), % cuenta(s) real(es)', v_c;
END $$;

-- ================= SECCION 5: ROLLBACK (solo para revertir; NO ejecutar) ======
--   DROP FUNCTION IF EXISTS public.fn_recalcular_saldo_cuenta();
--   ALTER TABLE public.movimientos_bancarios DROP COLUMN IF EXISTS estado;
-- NOTA: DROP COLUMN elimina automaticamente el CHECK chk_movbancario_estado.
-- No toca datos ni otras tablas (ni trigger: no existe en esta fase).

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2D
-- ============================================================================