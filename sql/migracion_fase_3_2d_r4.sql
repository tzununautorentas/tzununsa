-- ============================================================================
-- MIGRACION FASE 3.2D-R4 — Base estructural bancaria (fix de GATE, no estructura)
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)  ·  DB: PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Version:    3.2D-R4
--
-- CONTEXTO:
--   R2 instalo correctamente la estructura; su GATE fallo por uso de set_config
--   dentro de BEGIN...ROLLBACK (los SET de sesion se deshacen al abortar la
--   transaccion). R3 corrigio la prueba T1 (subtransaccion PL/pgSQL + variables
--   locales + marcador final en autocommit) y el resto de los invariantes paso,
--   PERO su GATE bloqueo en la validacion textual de la funcion con:
--     "GATE 3.2D-R3 BLOQUEO: la definicion de la funcion no contiene los
--      marcadores esperados".
--   La consulta pg_get_functiondef() confirmo una funcion correcta (schema
--   public, RETURNS trigger, LANGUAGE plpgsql) cuyo cuerpo contiene los 12
--   marcadores esenciales. Por tanto el fallo de R3 fue del CHEQUEO TEXTUAL del
--   GATE (caso "funcion correcta pero GATE textual defectuoso"), no de la
--   funcion ni de la estructura.
--
-- OBJETIVO EXCLUSIVO DE R4:
--   * mantener intacta la estructura ya instalada (estado + CHECK +
--     fn_recalcular_saldo_cuenta()); NO se hace DROP de la funcion;
--   * NO recrear la funcion si ya existe y cumple requisitos (se conserva);
--     solo se crea si falta; si existe pero es invalida -> BLOQUEO (no se
--     modifica silenciosamente);
--   * NO crear trg_mov_saldo (FASE 3.8); no tocar otras tablas, ni RLS, ni
--     datos existentes;
--   * GATE robusto: validacion ESTRUCTURAL (existencia via to_regprocedure,
--     pg_get_function_result='trigger', lanname='plpgsql') + marcadores
--     funcionales minimos con lower(prosrc) y position(...) > 0, sin depender
--     del formato exacto de pg_get_functiondef() ni de LIKE con literales.
--   * se mantienen: T1 con rollback por subtransaccion, proteccion ZZTEST3.2D,
--     integridad count+checksum de movimientos y saldo de la cuenta de T1.
-- ============================================================================

-- ================= SECCION 1: PRE-CHECKS (solo lectura) ======================

-- PC0 — PostgreSQL >= 15
DO $$
DECLARE v_num text;
BEGIN
  SELECT current_setting('server_version_num') INTO v_num;
  IF v_num::bigint < 150000 THEN
    RAISE EXCEPTION 'PC0 BLOQUEO: PostgreSQL % (requerido >= 15)', v_num;
  END IF;
  RAISE NOTICE 'PC0 OK: PostgreSQL %', v_num;
END $$;

-- PC1 — Tablas
DO $$
BEGIN
  IF to_regclass('public.movimientos_bancarios') IS NULL THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: falta public.movimientos_bancarios';
  END IF;
  IF to_regclass('public.cuentas_bancarias') IS NULL THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: falta public.cuentas_bancarias';
  END IF;
  RAISE NOTICE 'PC1 OK: movimientos_bancarios y cuentas_bancarias existen';
END $$;

-- PC2 — estado: si existe debe estar bien definido (si no, se pondra en MIGRACION)
DO $$
DECLARE
  v_existe boolean;
  v_tipo text;
  v_nn text;
  v_default text;
  v_def text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado'
  ) INTO v_existe;

  IF NOT v_existe THEN
    RAISE NOTICE 'PC2 OK: columna estado NO existe; se creara en MIGRACION';
    RETURN;
  END IF;

  SELECT data_type, is_nullable, column_default INTO v_tipo, v_nn, v_default
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';

  IF v_tipo IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: estado existe con tipo % (se espera text)', v_tipo;
  END IF;
  IF v_nn IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: estado existe sin NOT NULL';
  END IF;
  IF v_default IS NULL OR v_default NOT ILIKE '%activo%' THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: estado existe sin default activo (detectado: %)', v_default;
  END IF;

  SELECT pg_get_constraintdef(oid) INTO v_def
    FROM pg_constraint
   WHERE conrelid='public.movimientos_bancarios'::regclass
     AND conname='chk_movbancario_estado';
  IF v_def IS NULL OR v_def NOT ILIKE '%activo%' OR v_def NOT ILIKE '%anulado%' THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: falta el CHECK chk_movbancario_estado valido para activo/anulado (revision manual)';
  END IF;

  RAISE NOTICE 'PC2 OK: estado existe bien definido (tipo=% not_null=% default=% check=%)', v_tipo, v_nn, v_default, v_def;
END $$;

-- PC3 — Funcion: existencia, retorno, lenguaje y longitud de prosrc (informativo)
SELECT p.oid IS NOT NULL AS fn_existe,
       pg_get_function_result(p.oid) AS fn_returns,
       l.lanname AS fn_lang,
       length(p.prosrc) AS fn_src_len
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname='public' AND p.proname='fn_recalcular_saldo_cuenta';

-- PC4 — Triggers sobre movimientos_bancarios (solo aplicacion; internos FK excluidos)
DO $$
DECLARE v_trg int; v_trg_nm int;
BEGIN
  SELECT count(*) INTO v_trg FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg <> 0 THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: existen % trigger(s) de aplicacion en movimientos_bancarios (en 3.2D no corresponde ninguno)', v_trg;
  END IF;
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: trg_mov_saldo existe; se activa unicamente en FASE 3.8';
  END IF;
  RAISE NOTICE 'PC4 OK: 0 triggers de aplicacion y trg_mov_saldo ausente';
END $$;

-- PC5 — Conteos base (informativos) y referencia de prueba limpia (bloqueante)
DO $$
DECLARE v_m bigint; v_c bigint; v_z bigint;
BEGIN
  SELECT count(*) INTO v_m FROM public.movimientos_bancarios;
  SELECT count(*) INTO v_c FROM public.cuentas_bancarias;
  SELECT count(*) INTO v_z FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';

  IF v_c = 0 THEN
    RAISE EXCEPTION 'PC5 BLOQUEO: no hay cuentas bancarias reales; T1 no puede ejecutarse';
  END IF;
  IF v_z <> 0 THEN
    RAISE EXCEPTION 'PC5 BLOQUEO: ya existen % fila(s) con referencia ZZTEST3.2D (referencia sucia); no se borran ni reutilizan', v_z;
  END IF;

  RAISE NOTICE 'PC5 OK: % movimiento(s), % cuenta(s), ZZTEST3.2D=0', v_m, v_c;
END $$;

-- PC6 — INFO: columnas NOT NULL sin default (para revisar el INSERT de prueba)
DO $$
DECLARE v_req text;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO v_req
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND is_nullable='NO' AND column_default IS NULL;
  RAISE NOTICE 'PC6 INFO: columnas NOT NULL sin default en movimientos_bancarios: %', v_req;
END $$;

-- ================= SECCION 2: MIGRACION (idempotente; no recrea lo correcto) ==

-- 2.1 Columna estado + CHECK nombrado (idempotente; bloquea si la definicion es incorrecta)
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
      IF v_default IS NULL OR v_default NOT ILIKE '%activo%' THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe sin default ''activo'' (detectado: %); no se auto-reemplaza', v_default;
      END IF;

      SELECT pg_get_constraintdef(oid) INTO v_def
        FROM pg_constraint
       WHERE conrelid='public.movimientos_bancarios'::regclass
         AND conname='chk_movbancario_estado';
      IF v_def IS NULL THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: columna estado existe pero falta el CHECK chk_movbancario_estado; revision manual, no se auto-reemplaza';
      END IF;
      IF v_def NOT ILIKE '%activo%' OR v_def NOT ILIKE '%anulado%' THEN
        RAISE EXCEPTION 'MIGRACION BLOQUEO: chk_movbancario_estado no cubre activo/anulado (%); revision manual', v_def;
      END IF;
      RAISE NOTICE 'MIGRACION OK: columna estado + chk_movbancario_estado ya existen correctamente (conservados)';
    END;
  END IF;
END $$;

-- 2.2 Funcion: CREAR solo si NO existe; si existe y valida -> CONSERVAR (no recrear);
--     si existe pero es invalida -> BLOQUEO (sin DROP, sin reemplazo silencioso).
-- Validacion robusta: lower(prosrc) + position()>0 sobre los marcadores minimos.
DO $do$
DECLARE
  v_fn_oid  oid;
  v_ret     text;
  v_lang    text;
  v_src     text;
  v_markers text[] := ARRAY[
    'tg_op', 'insert', 'delete', 'update', 'pg_advisory_xact_lock',
    'cuenta_id', 'movimientos_bancarios', 'estado', 'activo',
    'saldo_actual', 'saldo_inicial', 'coalesce(new, old)'];
  v_missing text[] := '{}'::text[];
  v_m       text;
BEGIN
  SELECT p.oid, pg_get_function_result(p.oid), l.lanname, lower(p.prosrc)
    INTO v_fn_oid, v_ret, v_lang, v_src
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
   WHERE n.nspname='public' AND p.proname='fn_recalcular_saldo_cuenta';

  IF v_fn_oid IS NULL THEN
    RAISE NOTICE 'MIGRACION FUNCION: la funcion no existe; se creara (no hay nada que conservar)';
    EXECUTE $ddl$
      CREATE OR REPLACE FUNCTION public.fn_recalcular_saldo_cuenta()
      RETURNS trigger LANGUAGE plpgsql AS $f$
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
                 WHERE c IS NOT NULL
                 ORDER BY 1) m;

        UPDATE public.cuentas_bancarias c
           SET saldo_actual = c.saldo_inicial
             + coalesce((SELECT sum(CASE WHEN mo.tipo='ingreso' THEN mo.monto ELSE -mo.monto END)
                         FROM public.movimientos_bancarios mo
                         WHERE mo.cuenta_id = c.id AND mo.estado='activo'), 0)
         WHERE c.id = ANY(_ids);

        RETURN COALESCE(NEW, OLD);
      END
      $f$;
    $ddl$;
    RAISE NOTICE 'MIGRACION FUNCION OK: fn_recalcular_saldo_cuenta() creada (trigger NO creado)';
    RETURN;
  END IF;

  -- ya existe: validar estructura + marcadores minimos
  IF v_ret IS DISTINCT FROM 'trigger' THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: la funcion existe pero RETURNS % (esperado trigger); NO se recrea ni se hace DROP; revision manual', COALESCE(v_ret, 'NULL');
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: la funcion existe pero es lenguaje % (esperado plpgsql); NO se recrea ni se hace DROP; revision manual', COALESCE(v_lang, 'NULL');
  END IF;
  FOREACH v_m IN ARRAY v_markers LOOP
    IF position(v_m, v_src) = 0 THEN
      v_missing := v_missing || v_m;
    END IF;
  END LOOP;
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: la funcion existe pero le faltan marcadores funcionales (%); NO se recrea ni se hace DROP; revision manual', array_to_string(v_missing, ', ');
  END IF;

  RAISE NOTICE 'MIGRACION FUNCION OK: la funcion ya existe y cumple los requisitos; NO se recrea (conservada)';
END
$do$;

-- 2.3 Verificacion inmediata (esquema; trigger NO creado)
DO $$
BEGIN
  IF to_regprocedure('public.fn_recalcular_saldo_cuenta()') IS NULL THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: no se encontro public.fn_recalcular_saldo_cuenta()';
  END IF;
  RAISE NOTICE 'MIGRACION OK: funcion public.fn_recalcular_saldo_cuenta() presente (trigger trg_mov_saldo NO creado)';
END $$;

-- ================= SECCION 3: PERSISTIR LA MIGRACION =========================
-- (leccion 3.2C-R2): COMMIT top-level, fuera de DO. Aisla la estructura de la
-- prueba para que un fallo posterior jamas deshaga la migracion.
COMMIT;

-- ================= SECCION 4: LINEA BASE DE INTEGRIDAD (session, autocommit) ==
-- set_config corren ANTES de T1 y FUERA de cualquier transaccion revertida.
-- t1_result se reinicia a 'not_run' (evita falsos 'pass' de corridas previas).

SELECT set_config('tz32d.t1_result', 'not_run', false) AS t1_reset;

SELECT set_config('tz32d.t1_cuenta',
       (SELECT cb.id::text FROM public.cuentas_bancarias cb ORDER BY cb.id LIMIT 1),
       false) AS cuenta_pre;

SELECT set_config('tz32d.t1_saldo_antes',
       (SELECT cb.saldo_actual::text FROM public.cuentas_bancarias cb ORDER BY cb.id LIMIT 1),
       false) AS saldo_antes_pre;

SELECT set_config('tz32d.mov_count_antes',
       (SELECT count(*)::text FROM public.movimientos_bancarios),
       false) AS mov_count_pre;

SELECT set_config('tz32d.mov_checksum_antes',
       (SELECT md5(string_agg(coalesce(id::text,'?') || '|' ||
                              coalesce(cuenta_id::text,'?') || '|' ||
                              coalesce(estado,'?') || '|' ||
                              coalesce(referencia,'?') || '|' ||
                              coalesce(tipo,'?') || '|' ||
                              coalesce(monto::text,'?'),
                              ',' ORDER BY id::text))
          FROM public.movimientos_bancarios),
       false) AS mov_sum_pre;

-- ================= SECCION 5: PRUEBA T1 (subtransaccion, sin BEGIN/ROLLBACK) ==
-- Mecanismo probado en R3 (correcto): variables locales PL/pgSQL (no
-- transaccionales) + subtransaccion abortada (SQLSTATE 'TZ001') para deshacer
-- el INSERT; marcador t1_result='pass' solo como ultimo paso en autocommit.
-- Cualquier fallo obligatorio = RAISE EXCEPTION que detiene el script.
DO $$
DECLARE
  v_cuenta      uuid;
  v_emp         uuid;
  v_antes       numeric;
  v_despu       numeric;
  v_vis         boolean;
  v_mov_cuenta  uuid;
  v_zz          bigint;
  v_insert_ok   boolean := false;
  v_visible_ok  boolean := false;
  v_cuenta_ok   boolean := false;
  v_saldo_ok    boolean := false;
  v_rollback_ok boolean := false;
BEGIN
  -- (1) Cuenta real dinamica (nunca UUID inventado; nunca se crea cuenta)
  SELECT cb.id, cb.empresa_id INTO v_cuenta, v_emp
    FROM public.cuentas_bancarias cb
   ORDER BY cb.id
   LIMIT 1;

  IF v_cuenta IS NULL THEN
    RAISE EXCEPTION 'T1 BLOQUEO: no existe ninguna cuenta bancaria real; no se inventan datos';
  END IF;

  SELECT cb.saldo_actual INTO v_antes
    FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta;

  RAISE NOTICE 'T1: cuenta=% empresa=% saldo_antes=%', v_cuenta, v_emp, v_antes;

  -- (2) Subtransaccion: INSERT + comprobaciones; se aborta a proposito al final.
  BEGIN
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado)
    VALUES
      (v_emp, v_cuenta, CURRENT_DATE, 'ingreso', 'ZZ prueba 3.2D', 1.00, 'ZZTEST3.2D', 'prueba', false);
    v_insert_ok := true;

    SELECT EXISTS (SELECT 1 FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D')
      INTO v_vis;
    v_visible_ok := v_vis;

    SELECT mo.cuenta_id INTO v_mov_cuenta
      FROM public.movimientos_bancarios mo WHERE mo.referencia='ZZTEST3.2D';
    v_cuenta_ok := (v_mov_cuenta IS NOT DISTINCT FROM v_cuenta);

    SELECT cb.saldo_actual INTO v_despu
      FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta;
    v_saldo_ok := (v_despu IS NOT DISTINCT FROM v_antes);

    -- Abortar ESTA subtransaccion: deshace el INSERT temporal.
    RAISE EXCEPTION 'ROLLBACK_DEL_SUBTEST' USING ERRCODE = 'TZ001';
  EXCEPTION
    WHEN SQLSTATE 'TZ001' THEN
      v_rollback_ok := true;   -- subtransaccion abortada: la fila ZZTEST quedo deshecha
  END;

  -- (3) Afirmaciones obligatorias (fallo ruidoso; el script se detiene)
  IF NOT v_insert_ok   THEN RAISE EXCEPTION 'T1 FAIL: el INSERT temporal no se ejecuto'; END IF;
  IF NOT v_visible_ok  THEN RAISE EXCEPTION 'T1 FAIL: el movimiento temporal no fue visible en la transaccion'; END IF;
  IF NOT v_cuenta_ok   THEN RAISE EXCEPTION 'T1 FAIL: cuenta_id del movimiento no coincide con la cuenta seleccionada'; END IF;
  IF NOT v_saldo_ok    THEN RAISE EXCEPTION 'T1 FAIL: saldo_actual cambio con el INSERT (trg_mov_saldo activo?)'; END IF;
  IF NOT v_rollback_ok THEN RAISE EXCEPTION 'T1 FAIL: no se pudo revertir la subtransaccion del INSERT'; END IF;

  -- (4) Post-rollback inmediato (mismo DO): ZZTEST=0 y saldo identico.
  SELECT count(*) INTO v_zz FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'T1 FAIL: la fila ZZTEST3.2D persistio tras el rollback (count=%)', v_zz;
  END IF;

  SELECT cb.saldo_actual INTO v_despu
    FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta;
  IF v_despu IS DISTINCT FROM v_antes THEN
    RAISE EXCEPTION 'T1 FAIL: saldo_actual cambio tras el rollback (% -> %)', v_antes, v_despu;
  END IF;

  -- (5) Marcar exito como ULTIMO paso: el DO termina en autocommit sin error, el
  --     set_config (sesion) queda confirmado y el GATE lo lee de forma fiable.
  PERFORM set_config('tz32d.t1_result', 'pass', false);

  RAISE NOTICE 'T1 PASS: INSERT+visible+cuenta+saldo OK; subtransaccion revertida; ZZTEST3.2D=0; saldo intacto (%)', v_antes;
END $$;

-- ================= SECCION 6: POST-CHECKS (solo lectura, informativos) =======

-- P1 — estado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';

-- P2 — CHECK
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid='public.movimientos_bancarios'::regclass
  AND conname='chk_movbancario_estado';

-- P3 — Funcion (estructura)
SELECT p.oid AS fn_oid,
       pg_get_function_result(p.oid) AS fn_returns,
       l.lanname AS fn_lang,
       length(p.prosrc) AS fn_src_len
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname='public' AND p.proname='fn_recalcular_saldo_cuenta';

-- P3b — Autodiagnostico de marcadores funcionales (sin bloquear; informativo)
DO $$
DECLARE
  v_src      text;
  v_markers  text[] := ARRAY[
    'tg_op', 'insert', 'delete', 'update', 'pg_advisory_xact_lock',
    'cuenta_id', 'movimientos_bancarios', 'estado', 'activo',
    'saldo_actual', 'saldo_inicial', 'coalesce(new, old)'];
  v_missing  text[] := '{}'::text[];
  v_m        text;
BEGIN
  SELECT lower(p.prosrc) INTO v_src
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public' AND p.proname='fn_recalcular_saldo_cuenta';

  IF v_src IS NULL THEN
    RAISE NOTICE 'P3b INFO: la funcion no existe';
    RETURN;
  END IF;

  FOREACH v_m IN ARRAY v_markers LOOP
    IF position(v_m, v_src) = 0 THEN
      v_missing := v_missing || v_m;
    END IF;
  END LOOP;

  IF cardinality(v_missing) = 0 THEN
    RAISE NOTICE 'P3b INFO: todos los marcadores funcionales estan presentes (% marcadores)', cardinality(v_markers);
  ELSE
    RAISE NOTICE 'P3b INFO: faltan marcadores: %', array_to_string(v_missing, ', ');
  END IF;
END $$;

-- P4 — Triggers de aplicacion sobre movimientos_bancarios (0 esperado)
SELECT count(*) AS triggers_aplicacion
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;

-- P5 — trg_mov_saldo (0 esperado)
SELECT count(*) AS trg_mov_saldo
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';

-- P6 — Datos de prueba (0 esperado)
SELECT count(*) AS zztest_32d
FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';

-- P7 — Conteos y saldo de la cuenta usada por T1 (comparar saldo con saldo_antes)
SELECT count(*) AS movimientos_total FROM public.movimientos_bancarios;
SELECT count(*) AS cuentas_total FROM public.cuentas_bancarias;
SELECT cb.id AS cuenta_t1,
       cb.saldo_actual AS saldo_actual_hoy,
       NULLIF(current_setting('tz32d.t1_saldo_antes', true), '')::numeric AS saldo_antes_t1
FROM public.cuentas_bancarias cb
WHERE cb.id = NULLIF(current_setting('tz32d.t1_cuenta', true), '')::uuid;

-- ================= SECCION 7: GATE FINAL ======================================
-- Fiabilidad: solo lee estado confirmado (estructura + datos) + marcador
-- t1_result (confirmado solo si T1 termino sin error). La validacion de la
-- funcion es ESTRUCTURAL + marcadores con lower(prosrc)/position(), sin
-- dependencia del formato exacto de pg_get_functiondef() ni de LIKE con
-- literales. Distingue claramente los casos de fallo.
DO $$
DECLARE
  v_res        text;
  v_tipo       text;
  v_nn         text;
  v_default    text;
  v_def        text;
  v_fn_oid     oid;
  v_ret        text;
  v_lang       text;
  v_src        text;
  v_markers    text[] := ARRAY[
    'tg_op', 'insert', 'delete', 'update', 'pg_advisory_xact_lock',
    'cuenta_id', 'movimientos_bancarios', 'estado', 'activo',
    'saldo_actual', 'saldo_inicial', 'coalesce(new, old)'];
  v_missing    text[] := '{}'::text[];
  v_m          text;
  v_trg_app    int;
  v_trg_nm     int;
  v_zz         bigint;
  v_cnt        bigint;
  v_cnt_antes  bigint;
  v_sum        text;
  v_sum_antes  text;
  v_cuenta_t1  uuid;
  v_saldo_antes numeric;
  v_saldo_hoy  numeric;
BEGIN
  -- (1) T1 debio terminar y confirmar su marcador
  v_res := current_setting('tz32d.t1_result', true);
  IF v_res IS DISTINCT FROM 'pass' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: T1 no finalizo correctamente (t1_result=%)',
      COALESCE(v_res, 'ausente');
  END IF;

  -- (2) estado: text, NOT NULL, default activo
  SELECT data_type, is_nullable, column_default INTO v_tipo, v_nn, v_default
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: falta la columna estado';
  END IF;
  IF v_tipo IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: estado es % (se espera text)', v_tipo;
  END IF;
  IF v_nn IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: estado no es NOT NULL';
  END IF;
  IF v_default IS NULL OR v_default NOT ILIKE '%activo%' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: estado sin default activo (detectado: %)', v_default;
  END IF;

  -- (3) CHECK chk_movbancario_estado
  SELECT pg_get_constraintdef(oid) INTO v_def
    FROM pg_constraint
   WHERE conrelid='public.movimientos_bancarios'::regclass
     AND conname='chk_movbancario_estado';
  IF v_def IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: falta chk_movbancario_estado';
  END IF;
  IF v_def NOT ILIKE '%activo%' OR v_def NOT ILIKE '%anulado%' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: chk_movbancario_estado no cubre activo/anulado (%)', v_def;
  END IF;

  -- (4) Funcion — casos diferenciados:
  --     4a inexistente; 4b retorno incorrecto; 4c no plpgsql;
  --     4d marcadores minimos ausentes. No hay caso "correcta pero GATE
  --     textual defectuoso": se elimino la dependencia de formato.
  IF to_regprocedure('public.fn_recalcular_saldo_cuenta()') IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: FUNCION INEXISTENTE: falta fn_recalcular_saldo_cuenta()';
  END IF;

  SELECT p.oid, pg_get_function_result(p.oid), l.lanname, lower(p.prosrc)
    INTO v_fn_oid, v_ret, v_lang, v_src
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
   WHERE n.nspname='public' AND p.proname='fn_recalcular_saldo_cuenta';

  IF v_fn_oid IS NULL OR v_src IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: FUNCION INEXISTENTE (prosrc vacio o no encontrado)';
  END IF;

  IF v_ret IS DISTINCT FROM 'trigger' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: FUNCION CON TIPO DE RETORNO INCORRECTO: % (esperado trigger)',
      COALESCE(v_ret, 'NULL');
  END IF;

  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: FUNCION NO PLPGSQL: % (esperado plpgsql)',
      COALESCE(v_lang, 'NULL');
  END IF;

  FOREACH v_m IN ARRAY v_markers LOOP
    IF position(v_m, v_src) = 0 THEN
      v_missing := v_missing || v_m;
    END IF;
  END LOOP;
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: FUNCION SIN MARCADORES FUNCIONALES MINIMOS (faltan: %)',
      array_to_string(v_missing, ', ');
  END IF;

  -- (5) Sin triggers de aplicacion y sin trg_mov_saldo
  SELECT count(*) INTO v_trg_app FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  IF v_trg_app <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: existen % trigger(s) de aplicacion en movimientos_bancarios', v_trg_app;
  END IF;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: trg_mov_saldo existe (solo FASE 3.8)';
  END IF;

  -- (6) Sin datos de prueba
  SELECT count(*) INTO v_zz FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: quedaron % filas ZZTEST3.2D', v_zz;
  END IF;

  -- (7) Integridad de movimientos existentes (count + checksum vs. linea base)
  SELECT count(*),
         md5(string_agg(coalesce(id::text,'?') || '|' ||
                        coalesce(cuenta_id::text,'?') || '|' ||
                        coalesce(estado,'?') || '|' ||
                        coalesce(referencia,'?') || '|' ||
                        coalesce(tipo,'?') || '|' ||
                        coalesce(monto::text,'?'),
                        ',' ORDER BY id::text))
    INTO v_cnt, v_sum
    FROM public.movimientos_bancarios;

  v_cnt_antes := NULLIF(current_setting('tz32d.mov_count_antes', true), '')::bigint;
  v_sum_antes := NULLIF(current_setting('tz32d.mov_checksum_antes', true), '');
  IF v_cnt_antes IS NULL OR v_sum_antes IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: no se pudo verificar integridad (linea base ausente)';
  END IF;
  IF v_cnt IS DISTINCT FROM v_cnt_antes THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: cantidad de movimientos cambio (% -> %)', v_cnt_antes, v_cnt;
  END IF;
  IF v_sum IS DISTINCT FROM v_sum_antes THEN
    RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: checksum de movimientos cambio (posible modificacion de datos existentes)';
  END IF;

  -- (8) Saldo de la cuenta usada por T1 (debe seguir intacto)
  v_cuenta_t1 := NULLIF(current_setting('tz32d.t1_cuenta', true), '')::uuid;
  v_saldo_antes := NULLIF(current_setting('tz32d.t1_saldo_antes', true), '')::numeric;
  IF v_cuenta_t1 IS NOT NULL AND v_saldo_antes IS NOT NULL THEN
    SELECT cb.saldo_actual INTO v_saldo_hoy FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta_t1;
    IF v_saldo_hoy IS DISTINCT FROM v_saldo_antes THEN
      RAISE EXCEPTION 'GATE 3.2D-R4 BLOQUEO: saldo de la cuenta % cambio (% -> %)',
        v_cuenta_t1, v_saldo_antes, v_saldo_hoy;
    END IF;
  END IF;

  RAISE NOTICE 'GATE 3.2D-R4 OK: estado+CHECK, funcion correcta (estructura+marcadores), 0 triggers app, trg_mov_saldo ausente, ZZTEST=0, T1 PASS, % movimiento(s) intactos', v_cnt;
END $$;

-- ================= SECCION 8: ROLLBACK MANUAL (NO ejecutar salvo necesidad) ===
-- Deshace SOLO los cambios estructurales que R4 pudiera haber introducido.
-- En el caso actual (estructura ya instalada y correcta) R4 no modifica nada y
-- no hay nada que revertir tras un fallo de T1/GATE.
--   DROP FUNCTION IF EXISTS public.fn_recalcular_saldo_cuenta();
--   ALTER TABLE public.movimientos_bancarios DROP COLUMN IF EXISTS estado;
-- NOTA: DROP COLUMN elimina automaticamente el CHECK chk_movbancario_estado.
-- No toca datos ni trigger (no existe en esta fase).

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2D-R4
-- ============================================================================