-- ============================================================================
-- MIGRACION FASE 3.2E — Caja/Banca: arquitectura de origen y flujo
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)  ·  DB: PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Version:    3.2E-R1
--
-- CONTEXTO:
--   Fase ESTRICTAMENTE ESTRUCTURAL aprobada segun FASE3.2E_PLAN_DETALLADO.md:
--   agrega 5 columnas NULL (origen_tipo, origen_id, tipo_flujo,
--   cuenta_contraparte_id, movimiento_contraparte_id) + 2 indices
--   (uq_mov_origen UNIQUE parcial con exclusion de transferencia; y
--   idx_mov_cuenta_fecha SOLO si PC8 no halla un indice equivalente).
--   NO toca datos historicos, NO backfill (GRUPO C), NO triggers, NO saldos,
--   NO RLS, NO frontend, NO pagos, NO transferencias funcionales, NO Flujo de
--   Efectivo, NO modifica indices preexistentes (los conserva), NO crea
--   funciones ni tablas fuera de lo aprobado.
--
-- ARNES (heredado y probado de 3.2D-R4):
--   * variables locales PL/pgSQL (no transaccionales) para verificar;
--   * subtransacciones abortadas (SQLSTATE 'TZ001') para deshacer los INSERT
--     de prueba; marcadores de sesion tz32e.* (set_config con is_local=false,
--     fuera de transacciones revertidas); t1_result='pass' SOLO como ultimo
--     paso en autocommit;
--   * COMMIT top-level tras la migracion (leccion 3.2C-R2): un fallo posterior
--     jamas deshace la estructura persistida;
--   * checksum canonico de lineas base PRE/POST con la MISMA formula exacta
--     (congelada en sesion): solo columnas que existian antes de 3.2E segun
--     PC3 (created_at entra SOLO si PC3 confirma que existe), centinela
--     '<NULL>', campos '|', filas ',', ORDER BY id::text, md5 hex;
--   * GATE 3.2E OK estructural + datos + marcador t1_result + ZZTEST3.2E=0.
--
-- PREVENCIONES DEL PLAN QUE ESTE SCRIPT CUMPLE:
--   * PC7: si _bkp_32e.movimientos_bancarios ya existe -> BLOQUEO (nunca se
--     sobrescribe; usar _bkp_32e_<ts> con autorizacion).
--   * PC8: si existe indice equivalente (cuenta_id, fecha) -> se conserva y
--     6.3 NO crea idx_mov_cuenta_fecha.
--   * uq_mov_origen NO cubre origen_tipo='transferencia' (1 origen = 2
--     piernas); T1-T demuestra la coexistencia de ambas piernas.
--   * ROLLBACK manual comentado al final, separado del flujo normal.
--
-- ============================================================================

-- ================= SECCION 1: PRE-CHECKS PC0-PC8 ============================
-- (solo lectura + snapshot PC7; el script se detiene ante cualquier BLOQUEO)

-- PC0 — PostgreSQL >= 15
DO $do$
DECLARE v_num text;
BEGIN
  SELECT current_setting('server_version_num') INTO v_num;
  IF v_num::bigint < 150000 THEN
    RAISE EXCEPTION 'PC0 BLOQUEO: PostgreSQL % (requerido >= 15)', v_num;
  END IF;
  RAISE NOTICE 'PC0 OK: PostgreSQL %', v_num;
END $do$;

-- PC1 — Tablas
DO $do$
BEGIN
  IF to_regclass('public.movimientos_bancarios') IS NULL THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: falta public.movimientos_bancarios';
  END IF;
  IF to_regclass('public.cuentas_bancarias') IS NULL THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: falta public.cuentas_bancarias';
  END IF;
  RAISE NOTICE 'PC1 OK: movimientos_bancarios y cuentas_bancarias existen';
END $do$;

-- PC2 — Inventario de constraints (informativo; NO se modifican)
DO $do$
DECLARE v_list text;
BEGIN
  SELECT string_agg(con.conname || ' (' || con.contype || ') ' || pg_get_constraintdef(con.oid),
                    E'\n  ' ORDER BY con.conname)
    INTO v_list
    FROM pg_constraint con
   WHERE con.conrelid = 'public.movimientos_bancarios'::regclass;

  IF v_list IS NULL THEN
    RAISE NOTICE 'PC2 OK (inventario): sin constraints reportadas en movimientos_bancarios';
  ELSE
    RAISE NOTICE 'PC2 OK (inventario):%', E'\n' || v_list;
  END IF;
END $do$;

-- PC3 — Columnas reales: lista, created_at, y que ninguna de las 5 nuevas exista mal
DO $do$
DECLARE
  v_cols text;
  v_has_created_at boolean;
  v_new record;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios';
  RAISE NOTICE 'PC3 OK: columnas actuales de movimientos_bancarios: %', v_cols;

  SELECT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='created_at')
    INTO v_has_created_at;
  PERFORM set_config('tz32e.created_at', CASE WHEN v_has_created_at THEN 'yes' ELSE 'no' END, false);
  RAISE NOTICE 'PC3 OK: created_at %  (marca tz32e.created_at=%)',
    CASE WHEN v_has_created_at THEN 'EXISTE -> SE INCLUYE en el checksum canonico' ELSE 'NO existe -> queda fuera del checksum canonico' END,
    CASE WHEN v_has_created_at THEN 'yes' ELSE 'no' END;

  FOR v_new IN
    SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios'
       AND column_name IN
           ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id')
     ORDER BY ordinal_position
  LOOP
    IF v_new.column_name IN ('origen_tipo','tipo_flujo') AND v_new.data_type IS DISTINCT FROM 'text' THEN
      RAISE EXCEPTION 'PC3 BLOQUEO: columna % existe con tipo % (se espera text); no se auto-reemplaza',
        v_new.column_name, v_new.data_type;
    END IF;
    IF v_new.column_name NOT IN ('origen_tipo','tipo_flujo') AND v_new.data_type IS DISTINCT FROM 'uuid' THEN
      RAISE EXCEPTION 'PC3 BLOQUEO: columna % existe con tipo % (se espera uuid); no se auto-reemplaza',
        v_new.column_name, v_new.data_type;
    END IF;
    RAISE NOTICE 'PC3 INFO: columna % ya existe con definicion correcta (se conservara; ALTER IF NOT EXISTS)', v_new.column_name;
  END LOOP;
END $do$;

-- PC4 — Linea base de integridad (session, autocommit):
--       conteos + checksum canonico PRE + saldos de todas las cuentas.
--       La formula del checksum se CONGELA en tz32e.checksum_sql (misma en POST/GATE).
DO $do$
DECLARE
  v_col        record;
  v_fields     text := '';
  v_sql        text;
  v_checksum   text;
  v_cnt        bigint;
  v_c          bigint;
  v_cb         bigint;
  v_cu         bigint;
  v_saldos     text;
  v_z          bigint;
BEGIN
  SELECT count(*) INTO v_cnt FROM public.movimientos_bancarios;
  SELECT count(*) INTO v_c FROM public.cuentas_bancarias;
  SELECT count(*) INTO v_z FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';

  IF v_c < 2 THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: % cuenta(s) real(es); se requieren >= 2 para T1-O/T1-U/T1-T/T1-null', v_c;
  END IF;
  IF v_z <> 0 THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: ya existen % fila(s) con referencia ZZTEST3.2D (linea sucia de corridas 3.2D); revision manual', v_z;
  END IF;

  -- (a) Ensamblar el checksum canonico con la lista REAL de columnas pre-3.2E
  --     (created_at entra aqui SOLO si PC3 la confirmo; automatico desde
  --      information_schema, que todavia NO incluye las columnas de 3.2E).
  FOR v_col IN
    SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios'
     ORDER BY ordinal_position
  LOOP
    IF v_fields <> '' THEN
      v_fields := v_fields || ' || ''|'' || ';
    END IF;
    v_fields := v_fields || 'coalesce(' || quote_ident(v_col.column_name) || '::text, ''<NULL>'')';
  END LOOP;
  v_sql := 'SELECT md5(string_agg(' || v_fields || ', '','' ORDER BY id::text)) FROM public.movimientos_bancarios';
  EXECUTE v_sql INTO v_checksum;

  -- (b) Snapshot de saldos (determinista): saldo_inicial|saldo_actual por cuenta, order by id::text
  SELECT string_agg(cb.saldo_inicial::text || '|' || cb.saldo_actual::text, ',' ORDER BY cb.id::text)
    INTO v_saldos FROM public.cuentas_bancarias cb;

  PERFORM set_config('tz32e.count_pre',            v_cnt::text,     false);
  PERFORM set_config('tz32e.count_cuentas_pre',    v_c::text,       false);
  PERFORM set_config('tz32e.checksum_sql',         v_sql,           false);
  PERFORM set_config('tz32e.checksum_pre',         v_checksum,      false);
  PERFORM set_config('tz32e.saldos_pre',           v_saldos,        false);

  RAISE NOTICE 'PC4 OK: % movimiento(s), % cuenta(s), ZZTEST3.2D=0; checksum PRE=% ; saldos_pre congelado', v_cnt, v_c, v_checksum;
END $do$;

-- PC5 — Origen limpio (las 5 columnas nuevas estan todas NULL antes de migrar)
DO $do$
DECLARE v_o bigint;
BEGIN
  SELECT count(*) INTO v_o FROM public.movimientos_bancarios
   WHERE origen_tipo IS NOT NULL OR origen_id IS NOT NULL
      OR tipo_flujo IS NOT NULL OR cuenta_contraparte_id IS NOT NULL
      OR movimiento_contraparte_id IS NOT NULL;
  IF v_o <> 0 THEN
    RAISE EXCEPTION 'PC5 BLOQUEO: % fila(s) ya tienen datos en columnas de 3.2E; no se auto-clasifica', v_o;
  END IF;
  RAISE NOTICE 'PC5 OK: columnas de 3.2E totalmente NULL (origen limpio)';
END $do$;

-- PC6 — 0 triggers de aplicacion y trg_mov_saldo ausente
DO $do$
DECLARE v_trg int; v_trg_nm int;
BEGIN
  SELECT count(*) INTO v_trg FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg <> 0 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: existen % trigger(s) de aplicacion en movimientos_bancarios (en 3.2E no corresponde ninguno)', v_trg;
  END IF;
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: trg_mov_saldo existe; se activa unicamente en FASE 3.8';
  END IF;
  RAISE NOTICE 'PC6 OK: 0 triggers de aplicacion y trg_mov_saldo ausente';
END $do$;

-- PC6bis — INFO: columnas NOT NULL sin default (para revisar los INSERT de prueba)
DO $do$
DECLARE v_req text;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO v_req
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND is_nullable='NO' AND column_default IS NULL;
  RAISE NOTICE 'PC6bis INFO: columnas NOT NULL sin default en movimientos_bancarios: %', COALESCE(v_req, '(ninguna)');
END $do$;

-- PC7 — Snapshot de seguridad (PC7 del plan): BLOQUEO si ya existe; crear; verificar.
--       Es un SNAPSHOT de respaldo (CREATE TABLE AS), NO una prueba de restauracion.
DO $do$
DECLARE
  v_cnt      bigint;
  v_cnt_c    bigint;
  v_sum      numeric;
  v_sum_c    numeric;
  v_diff_a   bigint;
  v_diff_b   bigint;
BEGIN
  IF to_regclass('_bkp_32e.movimientos_bancarios') IS NOT NULL THEN
    RAISE EXCEPTION 'PC7 BLOQUEO: _bkp_32e.movimientos_bancarios YA EXISTE; nunca se sobrescribe sin autorizacion. Dropear el snapshot anterior con autorizacion o usar esquema alterno _bkp_32e_<YYYYMMDDHHMMSS>';
  END IF;

  CREATE SCHEMA IF NOT EXISTS _bkp_32e;
  CREATE TABLE _bkp_32e.movimientos_bancarios AS SELECT * FROM public.movimientos_bancarios;

  SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt, v_sum      FROM public.movimientos_bancarios;
  SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt_c, v_sum_c  FROM _bkp_32e.movimientos_bancarios;

  IF v_cnt IS DISTINCT FROM v_cnt_c OR v_sum IS DISTINCT FROM v_sum_c THEN
    RAISE EXCEPTION 'PC7 BLOQUEO: el snapshot no coincide con el origen (count %/% , sum %/%)', v_cnt, v_cnt_c, v_sum, v_sum_c;
  END IF;

  -- Igualdad fila a fila (campo a campo, ambas direcciones)
  SELECT count(*) INTO v_diff_a
    FROM (SELECT * FROM _bkp_32e.movimientos_bancarios EXCEPT ALL SELECT * FROM public.movimientos_bancarios) d;
  SELECT count(*) INTO v_diff_b
    FROM (SELECT * FROM public.movimientos_bancarios EXCEPT ALL SELECT * FROM _bkp_32e.movimientos_bancarios) d;
  IF v_diff_a <> 0 OR v_diff_b <> 0 THEN
    RAISE EXCEPTION 'PC7 BLOQUEO: el snapshot difiere del origen en % fila(s) (campo a campo)', v_diff_a + v_diff_b;
  END IF;

  RAISE NOTICE 'PC7 OK: snapshot _bkp_32e.movimientos_bancarios creado y verificado (% filas, sum=%); igualdad campo a campo completa', v_cnt, v_sum;
END $do$;

-- PC8 — Indice equivalente (cuenta_id, fecha): si existe, conservarlo y NO crear 6.3
DO $do$
DECLARE v_idx text;
BEGIN
  SELECT ci.relname INTO v_idx
    FROM pg_index ix
    JOIN pg_class ct  ON ct.oid  = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
    JOIN pg_class ci  ON ci.oid  = ix.indexrelid
    JOIN pg_attribute a1 ON a1.attrelid = ct.oid AND a1.attnum = ix.indkey[0]::int2 AND a1.attname = 'cuenta_id'
    JOIN pg_attribute a2 ON a2.attrelid = ct.oid AND a2.attnum = ix.indkey[1]::int2 AND a2.attname = 'fecha'
   WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
     AND NOT ix.indisprimary
   ORDER BY ci.relname
   LIMIT 1;

  PERFORM set_config('tz32e.idx_equiv', COALESCE(v_idx, ''), false);

  IF v_idx IS NULL THEN
    RAISE NOTICE 'PC8 OK: NO existe indice equivalente sobre (cuenta_id, fecha); se creara idx_mov_cuenta_fecha en 6.3';
  ELSE
    RAISE NOTICE 'PC8 OK: existe indice equivalente % -> se CONSERVA (no se duplica; idx_mov_cuenta_fecha NO se creara)', v_idx;
  END IF;
END $do$;

-- ================= SECCION 2: MIGRACION ESTRUCTURAL (idempotente) ============

-- 2.1 Las 5 columnas (todas NULL, sin default, sin CHECK) — plan 6.1
DO $do$
BEGIN
  EXECUTE $ddl$
    ALTER TABLE public.movimientos_bancarios
      ADD COLUMN IF NOT EXISTS origen_tipo            text,
      ADD COLUMN IF NOT EXISTS origen_id              uuid,
      ADD COLUMN IF NOT EXISTS tipo_flujo             text,
      ADD COLUMN IF NOT EXISTS cuenta_contraparte_id  uuid,
      ADD COLUMN IF NOT EXISTS movimiento_contraparte_id uuid
  $ddl$;
  RAISE NOTICE 'MIGRACION 2.1 OK: 5 columnas estructurales presentes (NULL, sin default, sin CHECK)';
END $do$;

-- 2.2 uq_mov_origen: UNIQUE parcial para origenes 1:1; transferencia EXCLUIDA — plan 6.2
DO $do$
BEGIN
  EXECUTE $ddl$
    CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_origen
      ON public.movimientos_bancarios (empresa_id, origen_tipo, origen_id)
      WHERE origen_id IS NOT NULL AND estado = 'activo'
        AND origen_tipo IS DISTINCT FROM 'transferencia'
  $ddl$;
  RAISE NOTICE 'MIGRACION 2.2 OK: uq_mov_origen (UNIQUE parcial, transferencia excluida)';
END $do$;

-- 2.3 idx_mov_cuenta_fecha: SOLO si PC8 no hallo indice equivalente — plan 6.3
DO $do$
DECLARE v_idx text;
BEGIN
  v_idx := NULLIF(current_setting('tz32e.idx_equiv', true), '');
  IF v_idx IS NULL THEN
    EXECUTE $ddl$
      CREATE INDEX IF NOT EXISTS idx_mov_cuenta_fecha
        ON public.movimientos_bancarios (cuenta_id, fecha)
    $ddl$;
    PERFORM set_config('tz32e.idx_created', 'yes', false);
    RAISE NOTICE 'MIGRACION 2.3 OK: idx_mov_cuenta_fecha creado (no existia equivalente)';
  ELSE
    PERFORM set_config('tz32e.idx_created', 'no', false);
    RAISE NOTICE 'MIGRACION 2.3 OK: se CONSERVA el indice equivalente % ; idx_mov_cuenta_fecha NO creado (no se duplica)', v_idx;
  END IF;
END $do$;

-- ================= SECCION 3: PERSISTIR LA MIGRACION =========================
-- (leccion 3.2C-R2): COMMIT top-level, fuera de DO. Aisla la estructura de la
-- prueba para que un fallo posterior jamas deshaga la migracion.
COMMIT;

-- ================= SECCION 4: LINEA BASE DE PRUEBA (session, autocommit) =====
-- t1_result se reinicia (evita falsos 'pass' de corridas previas). El resto de
-- la linea base (checksum/saldos/conteos) ya quedo grabado en PC4.

SELECT set_config('tz32e.t1_result', 'not_run', false) AS t1_reset;

-- ================= SECCION 5: PRUEBA TRANSACCIONAL T1 (suite) ================
-- Mecanismo probado en 3.2D-R4: variables locales PL/pgSQL + subtransacciones
-- abortadas (SQLSTATE 'TZ001') para deshacer cada INSERT de prueba; marcador
-- t1_result='pass' SOLO como ultimo paso en autocommit. Cualquier fallo
-- obligatorio = RAISE EXCEPTION que detiene el script. Referencia ZZTEST3.2E.
DO $do$
DECLARE
  -- comunes
  v_cuenta uuid;
  v_emp    uuid;
  v_zz     bigint;
  v_rollok boolean := false;

  -- T1-O
  v_saldo_antes numeric;
  v_saldo_despu  numeric;
  v_vis       boolean;
  v_mov_cuenta uuid;
  v_origen_tipo text;
  v_tipo_flujo  text;
  v_insert_ok  boolean := false;
  v_visible_ok boolean := false;
  v_cuenta_ok  boolean := false;
  v_origen_ok  boolean := false;
  v_saldo_ok   boolean := false;

  -- T1-U
  v_op2      uuid;
  v_u_pass   boolean := false;

  -- T1-T
  v_a   uuid;
  v_b   uuid;
  v_emp_b uuid;
  v_m_a uuid;
  v_m_b uuid;
  v_op  uuid := gen_random_uuid();
  v_sa_antes numeric;
  v_sb_antes numeric;
  v_sa_desp  numeric;
  v_sb_desp  numeric;
  v_cont_a uuid;
  v_cont_b uuid;
  v_pa  uuid;
  v_pb  uuid;
  v_ma  numeric;
  v_mb  numeric;
  v_ta  text;
  v_tb  text;
  v_neto numeric;

  -- T1-null
  v_nul_ok boolean := false;

BEGIN
  -- ===================== T1-O (origen 1:1, operativo) =====================
  SELECT cb.id, cb.empresa_id INTO v_cuenta, v_emp
    FROM public.cuentas_bancarias cb ORDER BY cb.empresa_id, cb.id LIMIT 1;
  IF v_cuenta IS NULL THEN
    RAISE EXCEPTION 'T1-O BLOQUEO: no existe ninguna cuenta real; no se inventan datos';
  END IF;
  SELECT cb.saldo_actual INTO v_saldo_antes FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta;
  RAISE NOTICE 'T1-O: cuenta=% empresa=% saldo_antes=%', v_cuenta, v_emp, v_saldo_antes;

  BEGIN
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
       origen_tipo, origen_id, tipo_flujo)
    VALUES
      (v_emp, v_cuenta, CURRENT_DATE, 'ingreso', 'ZZ prueba origen 3.2E', 1.00, 'ZZTEST3.2E', 'prueba', false,
       'pago_cliente', gen_random_uuid(), 'OPERATIVA');
    v_insert_ok := true;

    SELECT EXISTS (SELECT 1 FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2E') INTO v_vis;
    v_visible_ok := v_vis;

    SELECT mo.cuenta_id, mo.origen_tipo, mo.tipo_flujo INTO v_mov_cuenta, v_origen_tipo, v_tipo_flujo
      FROM public.movimientos_bancarios mo WHERE mo.referencia='ZZTEST3.2E' LIMIT 1;
    v_cuenta_ok := (v_mov_cuenta IS NOT DISTINCT FROM v_cuenta);
    v_origen_ok := (v_origen_tipo = 'pago_cliente' AND v_tipo_flujo = 'OPERATIVA');

    SELECT cb.saldo_actual INTO v_saldo_despu FROM public.cuentas_bancarias cb WHERE cb.id = v_cuenta;
    v_saldo_ok := (v_saldo_despu IS NOT DISTINCT FROM v_saldo_antes);

    RAISE EXCEPTION 'ROLLBACK_DEL_SUBTEST' USING ERRCODE = 'TZ001';
  EXCEPTION
    WHEN SQLSTATE 'TZ001' THEN v_rollok := true;
  END;

  IF NOT v_insert_ok  THEN RAISE EXCEPTION 'T1-O FAIL: el INSERT temporal de origen no se ejecuto'; END IF;
  IF NOT v_visible_ok THEN RAISE EXCEPTION 'T1-O FAIL: el movimiento de origen no fue visible en la transaccion'; END IF;
  IF NOT v_cuenta_ok  THEN RAISE EXCEPTION 'T1-O FAIL: cuenta_id del movimiento no coincide con la cuenta seleccionada'; END IF;
  IF NOT v_origen_ok  THEN RAISE EXCEPTION 'T1-O FAIL: origen_tipo/tipo_flujo no se persistieron (%=%, %=%)', v_origen_tipo, v_tipo_flujo; END IF;
  IF NOT v_saldo_ok   THEN RAISE EXCEPTION 'T1-O FAIL: saldo_actual cambio con el INSERT (trg_mov_saldo activo?)'; END IF;
  IF NOT v_rollok     THEN RAISE EXCEPTION 'T1-O FAIL: no se pudo revertir la subtransaccion'; END IF;
  RAISE NOTICE 'T1-O PASS: origen operativo insertado, visible, cuenta correcta, saldo intacto, revertido';
  v_rollok := false;

  -- ===================== T1-U (idempotencia uq_mov_origen) =====================
  v_op2 := gen_random_uuid();
  BEGIN
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
       origen_tipo, origen_id, tipo_flujo)
    VALUES
      (v_emp, v_cuenta, CURRENT_DATE, 'ingreso', 'ZZ prueba unico 3.2E', 1.00, 'ZZTEST3.2E', 'prueba', false,
       'pago_cliente', v_op2, 'OPERATIVA');

    BEGIN
      INSERT INTO public.movimientos_bancarios
        (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
         origen_tipo, origen_id, tipo_flujo)
      VALUES
        (v_emp, v_cuenta, CURRENT_DATE, 'ingreso', 'ZZ prueba unico 3.2E', 1.00, 'ZZTEST3.2E', 'prueba', false,
         'pago_cliente', v_op2, 'OPERATIVA');
      RAISE EXCEPTION 'T1-U FAIL: el segundo INSERT debia lanzar unique_violation';
    EXCEPTION
      WHEN unique_violation THEN v_u_pass := true;
    END;

    RAISE EXCEPTION 'ROLLBACK_DEL_SUBTEST' USING ERRCODE = 'TZ001';
  EXCEPTION
    WHEN SQLSTATE 'TZ001' THEN v_rollok := true;
  END;

  IF NOT v_u_pass  THEN RAISE EXCEPTION 'T1-U FAIL: no se verifico la unique_violation de uq_mov_origen'; END IF;
  IF NOT v_rollok  THEN RAISE EXCEPTION 'T1-U FAIL: no se pudo revertir la subtransaccion'; END IF;
  RAISE NOTICE 'T1-U PASS: uq_mov_origen rechaza un segundo movimiento del mismo origen 1:1; revertido';
  v_rollok := false;

  -- ===================== T1-T (transferencia neta cero, link bidireccional) =====
  SELECT cb.id, cb.empresa_id INTO v_a, v_emp    FROM public.cuentas_bancarias cb ORDER BY cb.empresa_id, cb.id LIMIT 1 OFFSET 0;
  SELECT cb.id, cb.empresa_id INTO v_b, v_emp_b  FROM public.cuentas_bancarias cb ORDER BY cb.empresa_id, cb.id LIMIT 1 OFFSET 1;
  IF v_a IS NULL OR v_b IS NULL OR v_a = v_b THEN
    RAISE EXCEPTION 'T1-T BLOQUEO: se requieren 2 cuentas reales distintas (A=% B=%)', v_a, v_b;
  END IF;
  SELECT cb.saldo_actual INTO v_sa_antes FROM public.cuentas_bancarias cb WHERE cb.id = v_a;
  SELECT cb.saldo_actual INTO v_sb_antes FROM public.cuentas_bancarias cb WHERE cb.id = v_b;
  RAISE NOTICE 'T1-T: A=% (saldo_antes=%) B=% (saldo_antes=%) op=%', v_a, v_sa_antes, v_b, v_sb_antes, v_op;

  BEGIN
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
       origen_tipo, origen_id, tipo_flujo, cuenta_contraparte_id)
    VALUES
      (v_emp, v_a, CURRENT_DATE, 'egreso', 'ZZ prueba transferencia A 3.2E', 123.45, 'ZZTEST3.2E', 'prueba', false,
       'transferencia', v_op, 'TRANSFERENCIA_INTERNA', v_b)
    RETURNING id INTO v_m_a;

    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
       origen_tipo, origen_id, tipo_flujo, cuenta_contraparte_id)
    VALUES
      (v_emp_b, v_b, CURRENT_DATE, 'ingreso', 'ZZ prueba transferencia B 3.2E', 123.45, 'ZZTEST3.2E', 'prueba', false,
       'transferencia', v_op, 'TRANSFERENCIA_INTERNA', v_a)
    RETURNING id INTO v_m_b;

    -- Coexistencia demostrada: ambas piernas comparten el MISMO (origen_tipo, origen_id)
    -- y ambas se insertaron sin unique_violation (uq_mov_origen excluye 'transferencia').
    RAISE NOTICE 'T1-T INFO: ambas piernas coexistieron con el mismo origen (transferencia/%) sin unique_violation', v_op;

    UPDATE public.movimientos_bancarios SET movimiento_contraparte_id = v_m_b WHERE id = v_m_a;
    UPDATE public.movimientos_bancarios SET movimiento_contraparte_id = v_m_a WHERE id = v_m_b;

    SELECT mo.cuenta_contraparte_id, mo.movimiento_contraparte_id, mo.monto, mo.tipo
      INTO v_cont_a, v_pa, v_ma, v_ta FROM public.movimientos_bancarios mo WHERE mo.id = v_m_a;
    SELECT mo.cuenta_contraparte_id, mo.movimiento_contraparte_id, mo.monto, mo.tipo
      INTO v_cont_b, v_pb, v_mb, v_tb FROM public.movimientos_bancarios mo WHERE mo.id = v_m_b;

    SELECT cb.saldo_actual INTO v_sa_desp FROM public.cuentas_bancarias cb WHERE cb.id = v_a;
    SELECT cb.saldo_actual INTO v_sb_desp FROM public.cuentas_bancarias cb WHERE cb.id = v_b;

    RAISE EXCEPTION 'ROLLBACK_DEL_SUBTEST' USING ERRCODE = 'TZ001';
  EXCEPTION
    WHEN SQLSTATE 'TZ001' THEN v_rollok := true;
  END;

  IF NOT v_rollok THEN RAISE EXCEPTION 'T1-T FAIL: no se pudo revertir la subtransaccion'; END IF;
  IF v_cont_a IS DISTINCT FROM v_b THEN RAISE EXCEPTION 'T1-T FAIL: A.cuenta_contraparte_id debe ser B (id %)', v_b; END IF;
  IF v_cont_b IS DISTINCT FROM v_a THEN RAISE EXCEPTION 'T1-T FAIL: B.cuenta_contraparte_id debe ser A (id %)', v_a; END IF;
  IF v_pa IS DISTINCT FROM v_m_b THEN RAISE EXCEPTION 'T1-T FAIL: A.movimiento_contraparte_id debe ser el ID de B (%)', v_m_b; END IF;
  IF v_pb IS DISTINCT FROM v_m_a THEN RAISE EXCEPTION 'T1-T FAIL: B.movimiento_contraparte_id debe ser el ID de A (%)', v_m_a; END IF;
  IF v_ta IS DISTINCT FROM 'egreso' OR v_tb IS DISTINCT FROM 'ingreso' OR v_ma IS DISTINCT FROM v_mb THEN
    RAISE EXCEPTION 'T1-T FAIL: piernas inconsistentes (A=% %, B=% %)', v_ta, v_ma, v_tb, v_mb;
  END IF;
  v_neto := (-v_ma) + v_mb;   -- neto de la transferencia = (-M) + (+M) = 0
  IF v_neto <> 0 THEN
    RAISE EXCEPTION 'T1-T FAIL: neto de la transferencia != 0 (calculo % + % = %)',
      (-v_ma), v_mb, v_neto;
  END IF;
  IF v_sa_desp IS DISTINCT FROM v_sa_antes THEN RAISE EXCEPTION 'T1-T FAIL: saldo_actual de A cambio (% -> %)', v_sa_antes, v_sa_desp; END IF;
  IF v_sb_desp IS DISTINCT FROM v_sb_antes THEN RAISE EXCEPTION 'T1-T FAIL: saldo_actual de B cambio (% -> %)', v_sb_antes, v_sb_desp; END IF;
  RAISE NOTICE 'T1-T PASS: neto (-M)+(+M)=0; vinculo bidireccional completo (cuenta y movimiento en ambas direcciones); saldos A/B intactos; revertido';
  v_rollok := false;

  -- ===================== T1-null (retrocompatibilidad sin columnas nuevas) =====
  BEGIN
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado)
    VALUES
      (v_emp, v_cuenta, CURRENT_DATE, 'egreso', 'ZZ prueba null 3.2E', 2.00, 'ZZTEST3.2E', 'prueba', false);
    v_nul_ok := true;

    RAISE EXCEPTION 'ROLLBACK_DEL_SUBTEST' USING ERRCODE = 'TZ001';
  EXCEPTION
    WHEN SQLSTATE 'TZ001' THEN v_rollok := true;
  END;

  IF NOT v_nul_ok THEN RAISE EXCEPTION 'T1-null FAIL: el INSERT sin columnas nuevas no se ejecuto'; END IF;
  IF NOT v_rollok  THEN RAISE EXCEPTION 'T1-null FAIL: no se pudo revertir la subtransaccion'; END IF;
  RAISE NOTICE 'T1-null PASS: INSERT sin columnas nuevas sigue funcionando (columnas NULL); revertido';
  v_rollok := false;

  -- ===================== Cierre de la suite =====================
  SELECT count(*) INTO v_zz FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2E';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'T1 FAIL: quedaron % fila(s) ZZTEST3.2E tras los rollback', v_zz;
  END IF;

  PERFORM set_config('tz32e.t1_result', 'pass', false);
  RAISE NOTICE 'T1 PASS (suite): T1-O, T1-U, T1-T y T1-null OK; ZZTEST3.2E=0';
END $do$;

-- ================= SECCION 6: POST-CHECKS (solo lectura, informativos) =======

-- P1 — Las 5 columnas nuevas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='movimientos_bancarios'
  AND column_name IN ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id')
ORDER BY ordinal_position;

-- P2 — Indices de 3.2E
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='movimientos_bancarios'
  AND indexname IN ('uq_mov_origen','idx_mov_cuenta_fecha')
ORDER BY indexname;

-- P2b — Indices equivalentes detectados por PC8 (conservados)
SELECT c.relname AS indice_conservado, i.indexdef
FROM pg_index ix
JOIN pg_class ct ON ct.oid = ix.indrelid
JOIN pg_namespace ns ON ns.oid = ct.relnamespace
JOIN pg_class c ON c.oid = ix.indexrelid
JOIN pg_indexes i ON i.indexname = c.relname
WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
  AND NOT ix.indisprimary
  AND EXISTS (SELECT 1 FROM pg_attribute a
               WHERE a.attrelid=ct.oid AND a.attnum=ix.indkey[0]::int2 AND a.attname='cuenta_id')
  AND EXISTS (SELECT 1 FROM pg_attribute a
               WHERE a.attrelid=ct.oid AND a.attnum=ix.indkey[1]::int2 AND a.attname='fecha')
ORDER BY c.relname;

-- P3 — estado + chk_movbancario_estado (legado 3.2D intacto)
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid='public.movimientos_bancarios'::regclass AND conname='chk_movbancario_estado';

-- P4 — Triggers de aplicacion (0 esperado)
SELECT count(*) AS triggers_aplicacion
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;

-- P5 — trg_mov_saldo (0 esperado)
SELECT count(*) AS trg_mov_saldo
FROM pg_trigger
WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';

-- P6 — Datos de prueba (0 esperado)
SELECT count(*) AS zztest_32e FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2E';
SELECT count(*) AS zztest_32d FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';

-- P7 — Conteos e indicadores de sesion
SELECT count(*) AS movimientos_total FROM public.movimientos_bancarios;
SELECT count(*) AS cuentas_total FROM public.cuentas_bancarias;
SELECT current_setting('tz32e.created_at', true)  AS created_at_segun_pc3,
       current_setting('tz32e.checksum_pre', true) AS checksum_pre,
       NULLIF(current_setting('tz32e.idx_equiv', true), '') AS indice_equivalente_pc8;

-- P8 — Checksum POST con la MISMA formula congelada en PC4 (no incluye las 5 columnas nuevas)
DO $do$
DECLARE v_sql text; v_sum text;
BEGIN
  v_sql := NULLIF(current_setting('tz32e.checksum_sql', true), '');
  IF v_sql IS NULL THEN
    RAISE EXCEPTION 'P8 BLOQUEO: no existe tz32e.checksum_sql (linea base ausente)';
  END IF;
  EXECUTE v_sql INTO v_sum;
  RAISE NOTICE 'P8: checksum POST (misma formula PC4) = %', v_sum;
END $do$;

-- ================= SECCION 7: GATE FINAL ====================================
-- Solo lee estado confirmado + marcadores de sesion. Si algo falla -> RAISE
-- EXCEPTION 'GATE 3.2E BLOQUEO: ...' y la fase no termina aparentando exito.
DO $do$
DECLARE
  v_res        text;
  v_cnt        bigint;
  v_cnt_pre    bigint;
  v_c          bigint;
  v_c_pre      bigint;
  v_sql        text;
  v_sum        text;
  v_sum_pre    text;
  v_saldos     text;
  v_saldos_pre text;
  v_z          bigint;
  v_zz         bigint;
  v_trg_app    int;
  v_trg_nm     int;
  v_col        record;
  v_un         boolean;
  v_part       boolean;
  v_idx_equiv  text;
  v_idx_rel    text;
  v_has_idx    boolean;
  v_estado_t   text;
  v_estado_nn  text;
  v_estado_def text;
  v_chk        text;
  v_errs       text := '';
BEGIN
  -- (1) La suite de prueba debio terminar y confirmar su marcador
  v_res := current_setting('tz32e.t1_result', true);
  IF v_res IS DISTINCT FROM 'pass' THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: la suite T1 no finalizo correctamente (t1_result=%)',
      COALESCE(v_res, 'ausente');
  END IF;

  -- (2) Las 5 columnas exactas: tipos text/uuid, NULL, sin default
  FOR v_col IN
    SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios'
       AND column_name IN ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id')
     ORDER BY ordinal_position
  LOOP
    IF v_col.column_name IN ('origen_tipo','tipo_flujo') AND v_col.data_type IS DISTINCT FROM 'text' THEN
      v_errs := v_errs || format('columna %s con tipo %s (esperado text); ', v_col.column_name, v_col.data_type);
    END IF;
    IF v_col.column_name NOT IN ('origen_tipo','tipo_flujo') AND v_col.data_type IS DISTINCT FROM 'uuid' THEN
      v_errs := v_errs || format('columna %s con tipo %s (esperado uuid); ', v_col.column_name, v_col.data_type);
    END IF;
    IF v_col.is_nullable IS DISTINCT FROM 'YES' THEN
      v_errs := v_errs || format('columna %s no es NULL; ', v_col.column_name);
    END IF;
    IF v_col.column_default IS NOT NULL THEN
      v_errs := v_errs || format('columna %s tiene default (%s); ', v_col.column_name, v_col.column_default);
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='movimientos_bancarios'
         AND column_name IN ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id')) <> 5 THEN
    v_errs := v_errs || 'faltan columnas de 3.2E; ';
  END IF;
  IF v_errs <> '' THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: definicion incorrecta de columnas: %', v_errs;
  END IF;

  -- (3) uq_mov_origen UNIQUE + parcial, con exclusion de transferencia
  SELECT ix.indisunique, (ix.indpred IS NOT NULL) INTO v_un, v_part
    FROM pg_index ix
    JOIN pg_class ct ON ct.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
   WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
     AND EXISTS (SELECT 1 FROM pg_class ci WHERE ci.oid = ix.indexrelid AND ci.relname='uq_mov_origen');
  IF v_un IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: falta el indice unico uq_mov_origen';
  END IF;
  IF NOT v_un OR NOT v_part THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: uq_mov_origen debe ser UNIQUE y parcial (predicado con exclusion de transferencia)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname='public' AND tablename='movimientos_bancarios'
                    AND indexname='uq_mov_origen'
                    AND indexdef ILIKE '%transferencia%') THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: el predicado de uq_mov_origen no excluye transferencia';
  END IF;

  -- (4) idx por PC8: idx_mov_cuenta_fecha creado o indice equivalente conservado
  v_idx_equiv := NULLIF(current_setting('tz32e.idx_equiv', true), '');
  IF v_idx_equiv IS NULL THEN
    SELECT EXISTS (SELECT 1 FROM pg_indexes
                    WHERE schemaname='public' AND tablename='movimientos_bancarios'
                      AND indexname='idx_mov_cuenta_fecha') INTO v_has_idx;
    IF NOT v_has_idx THEN
      RAISE EXCEPTION 'GATE 3.2E BLOQUEO: falta idx_mov_cuenta_fecha (PC8 no hallo indice equivalente)';
    END IF;
  ELSE
    SELECT EXISTS (SELECT 1 FROM pg_indexes
                    WHERE schemaname='public' AND tablename='movimientos_bancarios'
                      AND indexname = v_idx_equiv) INTO v_has_idx;
    IF NOT v_has_idx THEN
      RAISE EXCEPTION 'GATE 3.2E BLOQUEO: el indice equivalente conservado % no esta presente', v_idx_equiv;
    END IF;
    RAISE NOTICE 'GATE 3.2E INFO: se conserva el indice equivalente % (idx_mov_cuenta_fecha no requerido)', v_idx_equiv;
  END IF;

  -- (5) 0 triggers de aplicacion y trg_mov_saldo ausente
  SELECT count(*) INTO v_trg_app FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg_app <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: existen % trigger(s) de aplicacion en movimientos_bancarios', v_trg_app;
  END IF;
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: trg_mov_saldo existe (solo FASE 3.8)';
  END IF;

  -- (6) estado + chk_movbancario_estado intactos (legado 3.2D)
  SELECT data_type, is_nullable, column_default INTO v_estado_t, v_estado_nn, v_estado_def
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios' AND column_name='estado';
  IF v_estado_t IS DISTINCT FROM 'text' OR v_estado_nn IS DISTINCT FROM 'NO'
     OR v_estado_def IS NULL OR v_estado_def NOT ILIKE '%activo%' THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: la columna estado de 3.2D ya no esta intacta';
  END IF;
  SELECT pg_get_constraintdef(oid) INTO v_chk
    FROM pg_constraint
   WHERE conrelid='public.movimientos_bancarios'::regclass AND conname='chk_movbancario_estado';
  IF v_chk IS NULL OR v_chk NOT ILIKE '%activo%' OR v_chk NOT ILIKE '%anulado%' THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: chk_movbancario_estado inexistente o incompleto';
  END IF;

  -- (7) Sin datos de prueba persistidos: ZZTEST3.2E = 0 (regla obligatoria) y ZZTEST3.2D = 0
  SELECT count(*) INTO v_zz FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2E';
  IF v_zz <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: quedaron % filas ZZTEST3.2E (deben ser 0)', v_zz;
  END IF;
  SELECT count(*) INTO v_z FROM public.movimientos_bancarios WHERE referencia='ZZTEST3.2D';
  IF v_z <> 0 THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: quedaron % filas ZZTEST3.2D heredadas (deben ser 0)', v_z;
  END IF;

  -- (8) Integridad de movimientos historicos: cantidad_pre=cantidad_post y
  --     checksum_pre=checksum_post (misma formula congelada; solo columnas pre-3.2E)
  SELECT count(*) INTO v_cnt FROM public.movimientos_bancarios;
  SELECT count(*) INTO v_c   FROM public.cuentas_bancarias;

  v_cnt_pre := NULLIF(current_setting('tz32e.count_pre', true), '')::bigint;
  v_c_pre   := NULLIF(current_setting('tz32e.count_cuentas_pre', true), '')::bigint;
  v_sum_pre := NULLIF(current_setting('tz32e.checksum_pre', true), '');
  v_sql     := NULLIF(current_setting('tz32e.checksum_sql', true), '');
  v_saldos_pre := NULLIF(current_setting('tz32e.saldos_pre', true), '');

  IF v_cnt_pre IS NULL OR v_c_pre IS NULL OR v_sum_pre IS NULL OR v_sql IS NULL OR v_saldos_pre IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: linea base de integridad incompleta en sesion';
  END IF;

  IF v_cnt IS DISTINCT FROM v_cnt_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: cantidad_pre=% cantidad_post=% (deben ser iguales; esperado 33 y 33)', v_cnt_pre, v_cnt;
  END IF;
  IF v_c IS DISTINCT FROM v_c_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: la cantidad de cuentas cambio (% -> %)', v_c_pre, v_c;
  END IF;

  EXECUTE v_sql INTO v_sum;
  IF v_sum IS DISTINCT FROM v_sum_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: checksum_pre=% checksum_post=% (los movimientos historicos fueron modificados)', v_sum_pre, v_sum;
  END IF;

  -- (9) Saldos de todas las cuentas identicos PRE/POST (determinista, order by id::text)
  SELECT string_agg(cb.saldo_inicial::text || '|' || cb.saldo_actual::text, ',' ORDER BY cb.id::text)
    INTO v_saldos FROM public.cuentas_bancarias cb;
  IF v_saldos IS DISTINCT FROM v_saldos_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: saldos de cuentas cambiaron entre PRE y POST';
  END IF;

  RAISE NOTICE 'GATE 3.2E OK: 5 columnas correctas, uq_mov_origen (unico+parcial+excl.transferencia), indice segun PC8, 0 triggers, trg_mov_saldo ausente, estado+CHECK intactos, ZZTEST3.2E=0 y ZZTEST3.2D=0, T1 PASS (O/U/T/null), % movimiento(s) intactos (checksum PRE=POST)', v_cnt;
END $do$;

-- ============================================================================
-- SECCION 8: ROLLBACK MANUAL (NO ejecutar salvo necesidad)
-- ============================================================================
-- Deshace SOLO los cambios estructurales que 3.2E hubiera introducido.
-- Reglas: nunca se elimina un indice preexistente; idx_mov_cuenta_fecha solo se
-- elimina si fue creado por esta fase (PC8 NO hallo equivalente).

--   -- 1) Indices creados por 3.2E
--   DROP INDEX IF EXISTS uq_mov_origen;
--   DROP INDEX IF EXISTS idx_mov_cuenta_fecha;   -- solo si fue creado aqui (PC8 vacio)

--   -- 2) Columnas nuevas (DROP COLUMN no toca datos; reversible solo mientras
--   --    las columnas esten sin uso real, es decir, fase de estructura pura)
--   ALTER TABLE public.movimientos_bancarios
--     DROP COLUMN IF EXISTS origen_tipo,
--     DROP COLUMN IF EXISTS origen_id,
--     DROP COLUMN IF EXISTS tipo_flujo,
--     DROP COLUMN IF EXISTS cuenta_contraparte_id,
--     DROP COLUMN IF EXISTS movimiento_contraparte_id;

--   -- 3) Snapshot de respaldo: eliminarlo SOLO con autorizacion explicita del
--   --    operador (es el respaldo pre-ejecucion de PC7; conservarlo por defecto)
--   -- DROP SCHEMA IF EXISTS _bkp_32e CASCADE;

-- NOTA: los drop de 3.2E no afectan estado/chk_movbancario_estado (3.2D) ni
-- datos ni triggers (no existen); no hay trigger que desinstalar.

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2E
-- ============================================================================