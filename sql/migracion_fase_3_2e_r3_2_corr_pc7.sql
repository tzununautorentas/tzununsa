-- ============================================================================
-- MIGRACION FASE 3.2E-R3.2-corr_pc7 — Caja/Banca: arquitectura de origen y flujo
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)  ·  DB: PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Version:    3.2E-R3.2 (revision corr_pc7: R3.2 original + correccion quirurgica
--            del PC7-REUSE; el marcador tz32e.version NO cambia)
--
-- R3 = R2 + correcciones localizadas (arquitectura aprobada inalterada) [C1..C7].
-- R3.1 = correccion tecnica QUIRURGICA de R3, 4 puntos (todo lo demas de R3 se
-- conserva textualmente):
--   P1. (PC4/P8/GATE) CONGELAMIENTO REAL del checksum historico: ademas de la
--         formula SQL (tz32e.checksum_sql), PC4 congela la lista ORDENADA de
--         columnas historicas (tz32e.checksum_cols); P8 y GATE verifican la
--         ESTABILIDAD del esquema (lista congelada vs esquema actual) antes de
--         ejecutar la formula, y el GATE corrobora el valor PRE contra el
--         snapshot _bkp_32e con la misma formula (baseline independiente y
--         persistido por PC7).
--   P2. (PC8/P2b) VALIDACION EXACTA del indice equivalente: solo se considera
--         equivalente un indice BTREE, NO parcial (ix.indpred IS NULL), con
--         (cuenta_id, fecha) como primeras columnas clave y en ese orden. R3
--         acceptaba cualquier indice (incluso parcial) que arrancara en esas
--         columnas; un parcial no cubre todas las filas.
--   P3. (2.2/GATE) VALIDACION ESTRICTA de uq_mov_origen: el predicado se
--         compara por CANONIZACION EXACTA (igualdad textual normalizada) en
--         lugar de coincidencias LIKE (R3 aceptaba predicados distintos o
--         reordenados); validacion explicita de indnkeyatts = 3; consultas de
--         extraccion acotadas a public.movimientos_bancarios.
--   P4. (PC6) PRECISION sobre triggers: se reportan por NOMBRE los triggers de
--         aplicacion encontrados (no solo el conteo) y se explicita que
--         unicamente se toleran los internos (integridad referencial), que
--         quedan excluidos por tgisinternal; trg_mov_saldo sigue exigido
--         ausente (solo FASE 3.8).
--   P5. (PC7) REUTILIZACION VALIDADA del snapshot (R3.2 + corr_pc7): si
--         _bkp_32e.movimientos_bancarios ya existe NO se bloquea a ciegas; se
--         valida en 4 capas READ-ONLY contra la linea base congelada en PC4:
--         (a) esquema HISTORICO: lista ORDENADA de columnas del snapshot ==
--         tz32e.checksum_cols y TIPOS REALES (format_type) == los de las
--         columnas historicas de public (NO se comparan is_nullable ni
--         column_default: el snapshot CTAS los trae YES/NULL por naturaleza y
--         no es copia estructural restaurable, es baseline de datos); (b) conteo
--         y sum(monto) del snapshot == public y == PRE; (c) igualdad campo a
--         campo (EXCEPT ALL en ambas direcciones, proyeccion de columnas
--         historicas); (d) checksum derivado con la MISMA formula congelada
--         dirigida al snapshot == checksum PRE. Si pasan -> 'PC7 OK — snapshot
--         existente REUTILIZADO' (sin sobrescribir, borrar ni renombrar;
--         tz32e.snapshot='reused'). Si el snapshot NO existe, CREATE usa la
--         PROYECCION historica congelada (nunca SELECT *) para que un snapshot
--         nuevo no incorpore las 5 columnas de 3.2E ya presentes NULL. Si
--         alguna capa falla -> BLOQUEO de incompatibilidad sin modificar nada.
--         Sin marcadores PC4 -> BLOQUEO por EVIDENCIA INSUFICIENTE (decision del
--         owner; nunca se asume valido). El snapshot alterno
--         _bkp_32e.movimientos_bancarios_20260919043225 solo se informa como
--         corroboracion independiente; no participa en el GATE.
--
-- CONTEXTO MULTIEMPRESA (real y verificado):
--   La BD tiene 7 cuentas bancarias de 3 empresas distintas:
--     * 5 cuentas  -> Transportes Tz'unun
--     * 1 cuenta   -> Transportes R&G
--     * 1 cuenta   -> Servicios Multiples Tz'unun
--   Esto es intencional y se conserva. Las cuentas de R&G y de Servicios
--   Multiples Tz'unun NO se eliminan, excluyen, reasignan ni modifican en 3.2E.
--   La arquitectura reconoce que UNA EMPRESA puede tener SUS PROPIAS cuentas.
--
--   DISTINCION ARQUITECTONICA (documentada; NO implementa el flujo interempresa):
--     * Transferencia interna: cuenta A -> cuenta B, ambas de LA MISMA empresa
--       (origen_tipo='transferencia'; es lo que prueba T1-T).
--     * Movimiento interempresa: dinero que sale de una empresa y entra a otra
--       (p. ej. R&G -> Tz'unun). NO se modela como transferencia interna.
--   Los movimientos interempresa quedan EXPLICITAMENTE FUERA DEL ALCANCE de
--   FASE 3.2E y se disenaran posteriormente como funcionalidad especifica de la
--   arquitectura multiempresa (tablas interempresa, CxC/CxP, asientos,
--   automatizaciones, consolidacion, nuevos tipos de flujo: NADA de esto se
--   agrega en esta fase).
--
-- OBJETIVO EXCLUSIVO DE 3.2E (inalterado): estructura ESCLUSIVAMENTE
--   estructural sobre public.movimientos_bancarios:
--     5 columnas NULL (origen_tipo text, origen_id uuid, tipo_flujo text,
--     cuenta_contraparte_id uuid, movimiento_contraparte_id uuid) + 2 indices
--     (uq_mov_origen UNIQUE parcial con exclusion de 'transferencia' y
--     idx_mov_cuenta_fecha SOLO si PC8 no halla indice equivalente).
--   NO toca datos historicos, NO backfill (GRUPO C), NO triggers, NO saldos,
--   NO RLS, NO frontend, NO pagos, NO transferencias funcionales, NO Flujo de
--   Efectivo, NO modifica indices preexistentes, NO crea funciones ni tablas
--   fuera de lo aprobado. fn_recalcular_saldo_cuenta() (3.2D) queda INTACTA y
--   el trigger de saldo continua diferido a FASE 3.8.
--
-- ARNES (heredado y probado de 3.2D-R4):
--   * variables locales PL/pgSQL (no transaccionales) para verificar;
--   * subtransacciones abortadas (SQLSTATE 'TZ001') para deshacer los INSERT
--     de prueba; marcadores de sesion tz32e.* (set_config con is_local=false,
--     FUERA de transacciones revertidas); t1_result='pass' SOLO como ultimo
--     paso en autocommit;
--   * COMMIT top-level tras la migracion (leccion 3.2C-R2): un fallo posterior
--     jamas deshace la estructura persistida; la secuencia es MIGRACION ->
--     COMMIT top-level -> T1 (subtransacciones/rollback) -> POST-CHECK -> GATE;
--   * checksum canonico PRE/POST con la MISMA formula (congelada en sesion):
--     columnas que existian antes de 3.2E segun PC3 (created_at SOLO si PC3 la
--     confirma), centinela '<NULL>', campos '|', filas ',', ORDER BY id::text,
--     md5 hex; las 5 columnas nuevas NO forman parte del checksum historico;
--   * backup _bkp_32e snapshot-only (R3.2-corr_pc7): si NO existe -> se crea con
--     la PROYECCION historica congelada (checksum_cols, nunca SELECT *) y se
--     verifica; si YA existe -> REUTILIZACION VALIDADA en 4 capas read-only
--     contra la linea base congelada (columnas congeladas + tipos reales
--     format_type; sin exigir igualdad de nullable/default del CTAS; nunca se
--     sobrescribe, borra ni renombra; ver P5 arriba); verificaciones de conteos
--     y comparacion campo a campo (EXCEPT ALL en ambas direcciones).
-- ============================================================================

-- ================= VERSION DE MIGRACION (seccion 10) =========================
-- Identifica inequivocamente la version que se esta validando. Se graba en la
-- sesion ANTES de cualquier pre-check (autocommit, is_local=false) y el GATE
-- final exige que coincida exactamente con '3.2E-R3.2'.

SELECT set_config('tz32e.version', '3.2E-R3.2', false) AS version_migracion;

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
  SELECT string_agg(con.conname || ' (' || con.contype::text || ') ' || pg_get_constraintdef(con.oid),
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

  -- CORRECCION R3 (C1): si una columna de 3.2E YA existe, se valida su
  -- DEFINICION completa (tipo text/uuid, is_nullable=YES, sin default).
  -- Esto detecta estados fantasmas (p.ej. NOT NULL con tabla vacia) ANTES del
  -- COMMIT top-level y evita que el GATE (post-COMMIT) los descubra tarde.
  FOR v_new IN
    SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
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
    IF v_new.is_nullable IS DISTINCT FROM 'YES' THEN
      RAISE EXCEPTION 'PC3 BLOQUEO: columna % existe con is_nullable=% (se espera YES, columna NULL); no se auto-corrige',
        v_new.column_name, v_new.is_nullable;
    END IF;
    IF v_new.column_default IS NOT NULL THEN
      RAISE EXCEPTION 'PC3 BLOQUEO: columna % existe con default (%); se espera sin default; no se auto-corrige',
        v_new.column_name, v_new.column_default;
    END IF;
    RAISE NOTICE 'PC3 INFO: columna % ya existe con definicion correcta (text/uuid, NULL, sin default); se conservara; no se recrea', v_new.column_name;
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
  v_saldos     text;
  v_cols_pre   text;
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

  -- (a) Ensamblar el checksum canonico EXCLUYENDO explicitamente las columnas
  --     de 3.2E (created_at entra aqui por defecto, segun la lista real).
  --     CORRECCION R3 (C2): la formula identica entre ejecuciones (no depende
  --     de que las 5 columnas aun no existan en la primera corrida).
  FOR v_col IN
    SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios'
       AND column_name NOT IN ('origen_tipo','origen_id','tipo_flujo',
           'cuenta_contraparte_id','movimiento_contraparte_id')
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

  -- R3.1 P1: congelar tambien la lista ORDENADA de columnas historicas
  -- (ademas de la formula). P8 y GATE la usan para verificar la ESTABILIDAD
  -- del esquema antes de ejecutar la formula congelada.
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
    INTO v_cols_pre
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND column_name NOT IN ('origen_tipo','origen_id','tipo_flujo',
         'cuenta_contraparte_id','movimiento_contraparte_id');
  PERFORM set_config('tz32e.checksum_cols', v_cols_pre, false);

  RAISE NOTICE 'PC4 OK: % movimiento(s), % cuenta(s), ZZTEST3.2D=0; checksum PRE=% ; saldos_pre congelado', v_cnt, v_c, v_checksum;
  RAISE NOTICE 'PC4 R3.1: columnas historicas CONGELADAS (tz32e.checksum_cols, % columna(s)): %', cardinality(string_to_array(v_cols_pre, ',')), v_cols_pre;
END $do$;

-- PC5 — Origen limpio con 3 estados (conservado de R2) + refuerzo R3:
--       A) 0 de 5 columnas -> PASS / NOT APPLICABLE (primera ejecucion);
--       B) 5 de 5 columnas -> las cinco deben estar totalmente NULL (si hay
--          datos -> BLOQUEO). La DEFINICION de cada columna (tipos, NULL, sin
--          default) ya fue validada por PC3 ANTES; PC5 solo comprueba CONTENIDO.
--       C) 1..4 de 5 columnas -> BLOQUEO (estado estructural parcial/incompleto).
--       Deteccion via information_schema (nunca se referencia una columna que
--       todavia no exista; PC5 no puede fallar solo porque las 5 columnas
--       aun no existen).
DO $do$
DECLARE
  v_existentes int;
  v_con_datos  bigint;
BEGIN
  SELECT count(*) INTO v_existentes FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND column_name IN
         ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id');

  -- Estado A: primera ejecucion (ninguna columna de 3.2E existe)
  IF v_existentes = 0 THEN
    RAISE NOTICE 'PC5 OK (NOT APPLICABLE): las 5 columnas de 3.2E no existen aun (estado normal previo a la primera ejecucion)';
    RETURN;
  END IF;

  -- Estado C: parcial/incompleto
  IF v_existentes <> 5 THEN
    RAISE EXCEPTION 'PC5 BLOQUEO: estado estructural PARCIAL/INCOMPLETO (% de 5 columnas de 3.2E existen); se espera 0 o las 5; revision manual', v_existentes;
  END IF;

  -- Estado B: existen las 5 y PC3 ya valido su definicion -> exigir CONTENIDO NULL
  SELECT count(*) INTO v_con_datos FROM public.movimientos_bancarios
   WHERE origen_tipo  IS NOT NULL OR origen_id IS NOT NULL
      OR tipo_flujo   IS NOT NULL OR cuenta_contraparte_id IS NOT NULL
      OR movimiento_contraparte_id IS NOT NULL;
  IF v_con_datos <> 0 THEN
    RAISE EXCEPTION 'PC5 BLOQUEO: % fila(s) ya tienen datos en columnas de 3.2E; informacion previa que no debe sobrescribirse; revision manual', v_con_datos;
  END IF;
  RAISE NOTICE 'PC5 OK: las 5 columnas existen y estan totalmente NULL (origen limpio)';
END $do$;

-- PC6 — 0 triggers de aplicacion y trg_mov_saldo ausente
-- R3.1 P4: se reportan POR NOMBRE los triggers de aplicacion (no solo el
-- conteo) y se explicita que unicamente se toleran los internos de integridad
-- referencial (excluidos por tgisinternal). Cualquier trigger de aplicacion
-- -> BLOQUEO con su nombre y su significado.
DO $do$
DECLARE v_trg_app int; v_trg_nm int; v_nombres text;
BEGIN
  SELECT count(*), COALESCE(string_agg(tgname, ', ' ORDER BY tgname), '')
    INTO v_trg_app, v_nombres
    FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND NOT tgisinternal;
  IF v_trg_app <> 0 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: % trigger(s) de aplicacion en movimientos_bancarios (en 3.2E no corresponde ninguno); nombre(s): %; solo se toleran triggers internos (integridad referencial, tgisinternal=true)',
      v_trg_app, v_nombres;
  END IF;
  SELECT count(*) INTO v_trg_nm FROM pg_trigger
   WHERE tgrelid='public.movimientos_bancarios'::regclass AND tgname='trg_mov_saldo';
  IF v_trg_nm <> 0 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: trg_mov_saldo existe; se activa unicamente en FASE 3.8';
  END IF;
  RAISE NOTICE 'PC6 OK: 0 triggers de aplicacion y trg_mov_saldo ausente (no-internos sobre movimientos_bancarios: %)', COALESCE(NULLIF(v_nombres,''),'(ninguno)');
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

-- PC7-R3.2-corr_pc7 — Snapshot de seguridad con REUTILIZACION VALIDADA.
--       Es un SNAPSHOT de respaldo (CREATE TABLE AS), NO una prueba de restauracion.
--       Modo CREATE: si no existe -> crear y verificar con la PROYECCION historica
--       CONGELADA en PC4 (nunca SELECT *), para no incorporar las 5 columnas de
--       3.2E si ya estan presentes NULL.
--       Modo REUSE: si ya existe -> validar en 4 capas READ-ONLY contra la linea
--       base congelada en PC4: (a) esquema historico: columnas ORDENADAS ==
--       checksum_cols + TIPOS REALES (format_type; sin exigir igualdad de
--       is_nullable/column_default: el CTAS los trae YES/NULL por naturaleza),
--       (b) conteo+suma vs public/PRE, (c) EXCEPT ALL campo a campo,
--       (d) checksum derivado = PRE. Solo si TODAS pasan -> REUTILIZADO.
--       Cualquier fallo -> BLOQUEO de incompatibilidad SIN tocar nada. Falta de
--       marcadores PC4 -> BLOQUEO por EVIDENCIA INSUFICIENTE (decision del owner;
--       nunca se asume valido). El snapshot alterno queda intacto y solo se
--       informa como corroboracion independiente.
DO $do$
DECLARE
  v_cnt      bigint;
  v_cnt_c    bigint;
  v_cnt_pre  bigint;
  v_sum      numeric;
  v_sum_c    numeric;
  v_diff_a   bigint;
  v_diff_b   bigint;
  v_sql      text;
  v_checksum_pre text;
  v_cols_frozen  text;
  v_snap_cols    text;
  v_types_snap   text;
  v_types_public text;
  v_proj         text;
  v_snp_sql      text;
  v_snp          text;
  v_alterno      boolean;
BEGIN
  v_cols_frozen := NULLIF(current_setting('tz32e.checksum_cols', true), '');
  IF v_cols_frozen IS NULL THEN
    RAISE EXCEPTION 'PC7 BLOQUEO — EVIDENCIA INSUFICIENTE: falta tz32e.checksum_cols (congelado en PC4); no se puede identificar el esquema historico; decision del OWNER requerida';
  END IF;

  -- Proyeccion historica ORDENADA y acotada a la lista congelada (checksum_cols).
  -- Se usa TANTO en REUSE (EXCEPT ALL campo a campo) como en CREATE. En CREATE
  -- jamas se usa SELECT *: un snapshot nuevo solo debe contener el baseline
  -- historico congelado, aun si las 5 columnas de 3.2E ya estan presentes NULL.
  SELECT string_agg(format('%I', c.column_name), ', ' ORDER BY c.ordinal_position)
    INTO v_proj
    FROM information_schema.columns c
   WHERE c.table_schema='public'
     AND c.table_name='movimientos_bancarios'
     AND c.column_name = ANY(string_to_array(v_cols_frozen, ','));
  IF v_proj IS NULL OR cardinality(string_to_array(v_cols_frozen, ',')) <>
     (SELECT count(*) FROM information_schema.columns c
       WHERE c.table_schema='public' AND c.table_name='movimientos_bancarios'
         AND c.column_name = ANY(string_to_array(v_cols_frozen, ','))) THEN
    RAISE EXCEPTION 'PC7 BLOQUEO — una o mas columnas historicas congeladas ya no existen en public.movimientos_bancarios';
  END IF;

  IF to_regclass('_bkp_32e.movimientos_bancarios') IS NOT NULL THEN
    -- ================= MODO REUSE: validacion read-only ======================
    v_checksum_pre := NULLIF(current_setting('tz32e.checksum_pre', true), '');
    v_sql          := NULLIF(current_setting('tz32e.checksum_sql', true), '');
    IF v_checksum_pre IS NULL OR v_sql IS NULL THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — EVIDENCIA INSUFICIENTE: faltan marcadores congelados de PC4 (checksum_pre/checksum_sql); no se puede verificar el snapshot existente; decision del OWNER requerida';
    END IF;

    -- (a) Esquema HISTORICO == linea base congelada: la lista ORDENADA de
    --     columnas del snapshot debe ser identica a tz32e.checksum_cols (PC4) y
    --     los TIPOS REALES (format_type: tipo + typmod, via pg_attribute) deben
    --     coincidir con los de la proyeccion historica de public. NO se comparan
    --     is_nullable ni column_default: el snapshot es CTAS (is_nullable=YES /
    --     default=NULL por naturaleza) y no pretende ser copia estructural
    --     restaurable; la integridad del baseline se demuestra con tipos reales
    --     + volumen + EXCEPT ALL + checksum (capas b/c/d).
    SELECT string_agg(c.column_name, ',' ORDER BY c.ordinal_position) INTO v_snap_cols
      FROM information_schema.columns c
     WHERE c.table_schema='_bkp_32e' AND c.table_name='movimientos_bancarios';
    IF v_snap_cols IS DISTINCT FROM v_cols_frozen THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: esquema del snapshot (%) <> columnas historicas congeladas en PC4 (%)', v_snap_cols, v_cols_frozen;
    END IF;

    -- Tipos reales del snapshot (todas sus columnas, en orden fisico attnum)...
    SELECT string_agg(format_type(a.atttypid, a.atttypmod), ',' ORDER BY a.attnum)
      INTO v_types_snap
      FROM pg_attribute a
      JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
     WHERE n.nspname='_bkp_32e' AND t.relname='movimientos_bancarios'
       AND a.attnum > 0 AND NOT a.attisdropped;
    -- ... vs. los de las columnas historicas de public restringidas a la lista
    -- congelada (el orden de attnum ambas partes coincide porque v_snap_cols ==
    -- v_cols_frozen ya se valido arriba).
    SELECT string_agg(format_type(a.atttypid, a.atttypmod), ',' ORDER BY a.attnum)
      INTO v_types_public
      FROM pg_attribute a
      JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
     WHERE n.nspname='public' AND t.relname='movimientos_bancarios'
       AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attname = ANY(string_to_array(v_cols_frozen, ','));
    IF v_types_snap IS DISTINCT FROM v_types_public THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: tipos reales (format_type) difieren (snapshot=%, historico public=%)', v_types_snap, v_types_public;
    END IF;

    -- (b) Volumen: snapshot == public actual == count_pre congelado
    SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt_c, v_sum_c FROM _bkp_32e.movimientos_bancarios;
    SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt,   v_sum   FROM public.movimientos_bancarios;
    v_cnt_pre := NULLIF(current_setting('tz32e.count_pre', true), '')::bigint;
    IF v_cnt_c IS DISTINCT FROM v_cnt OR v_cnt_c IS DISTINCT FROM v_cnt_pre
       OR v_sum_c IS DISTINCT FROM v_sum THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: conteo/suma (snapshot %/% , public %/% , pre %)', v_cnt_c, v_sum_c, v_cnt, v_sum, v_cnt_pre;
    END IF;

    -- (c) Igualdad campo a campo (proyeccion historica congelada v_proj, en ambas
    --     direcciones; v_proj se construyo al inicio y es identica para ambas tablas)
    EXECUTE format('SELECT count(*) FROM (SELECT %s FROM _bkp_32e.movimientos_bancarios EXCEPT ALL SELECT %s FROM public.movimientos_bancarios) d', v_proj, v_proj) INTO v_diff_a;
    EXECUTE format('SELECT count(*) FROM (SELECT %s FROM public.movimientos_bancarios EXCEPT ALL SELECT %s FROM _bkp_32e.movimientos_bancarios) d', v_proj, v_proj) INTO v_diff_b;
    IF v_diff_a <> 0 OR v_diff_b <> 0 THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: difiere del origen en % fila(s) campo a campo', v_diff_a + v_diff_b;
    END IF;

    -- (d) Checksum derivado identico a GATE-8bis: formula congelada dirigida al
    --     snapshot (replace de FROM public... -> FROM _bkp_32e...) == PRE
    v_snp_sql := replace(v_sql, 'FROM public.movimientos_bancarios', 'FROM _bkp_32e.movimientos_bancarios');
    IF v_snp_sql = v_sql THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — EVIDENCIA INSUFICIENTE: no se pudo derivar la consulta congelada para el snapshot _bkp_32e; decision del OWNER requerida';
    END IF;
    EXECUTE v_snp_sql INTO v_snp;
    IF v_snp IS DISTINCT FROM v_checksum_pre THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: checksum derivado del snapshot (%) <> checksum PRE congelado (%)', COALESCE(v_snp,'(nulo)'), v_checksum_pre;
    END IF;

    PERFORM set_config('tz32e.snapshot', 'reused', false);
    RAISE NOTICE 'PC7 OK — snapshot existente REUTILIZADO y verificado (conteo=%, suma=%, campo a campo 0 diferencias, checksum derivado = PRE; tz32e.snapshot=reused)', v_cnt_c, v_sum_c;
  ELSE
    -- ========== MODO CREATE: proyeccion historica CONGELADA (nunca SELECT *) =====
    -- Si las 5 columnas de 3.2E ya estan presentes en public (NULL), el snapshot
    -- nuevo debe contener SOLO el baseline historico congelado en PC4, por eso
    -- se proyecta v_proj (checksum_cols) en lugar de SELECT *.
    CREATE SCHEMA IF NOT EXISTS _bkp_32e;
    EXECUTE format('CREATE TABLE _bkp_32e.movimientos_bancarios AS SELECT %s FROM public.movimientos_bancarios', v_proj);

    SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt, v_sum      FROM public.movimientos_bancarios;
    SELECT count(*), COALESCE(sum(monto),0) INTO v_cnt_c, v_sum_c  FROM _bkp_32e.movimientos_bancarios;

    IF v_cnt IS DISTINCT FROM v_cnt_c OR v_sum IS DISTINCT FROM v_sum_c THEN
      RAISE EXCEPTION 'PC7 BLOQUEO: el snapshot no coincide con el origen (count %/% , sum %/%)', v_cnt, v_cnt_c, v_sum, v_sum_c;
    END IF;

    -- Igualdad fila a fila (proyeccion historica congelada en ambas direcciones)
    EXECUTE format('SELECT count(*) FROM (SELECT %s FROM _bkp_32e.movimientos_bancarios EXCEPT ALL SELECT %s FROM public.movimientos_bancarios) d', v_proj, v_proj) INTO v_diff_a;
    EXECUTE format('SELECT count(*) FROM (SELECT %s FROM public.movimientos_bancarios EXCEPT ALL SELECT %s FROM _bkp_32e.movimientos_bancarios) d', v_proj, v_proj) INTO v_diff_b;
    IF v_diff_a <> 0 OR v_diff_b <> 0 THEN
      RAISE EXCEPTION 'PC7 BLOQUEO: el snapshot difiere del origen en % fila(s) (campo a campo, proyeccion historica)', v_diff_a + v_diff_b;
    END IF;

    PERFORM set_config('tz32e.snapshot', 'created', false);
    RAISE NOTICE 'PC7 OK: snapshot _bkp_32e.movimientos_bancarios CREADO con la proyeccion historica congelada y verificado (% filas, sum=%); igualdad campo a campo completa', v_cnt, v_sum;
  END IF;

  -- Informacion secundaria (lectura): snapshot alterno presente y NO tocado
  SELECT to_regclass('_bkp_32e.movimientos_bancarios_20260919043225') IS NOT NULL INTO v_alterno;
  IF v_alterno THEN
    RAISE NOTICE 'PC7 INFO: existe snapshot alterno _bkp_32e.movimientos_bancarios_20260919043225 (corroboracion independiente; no se toca ni participa en el GATE)';
  END IF;
END $do$;

-- PC8 — Indice equivalente (cuenta_id, fecha): si existe, conservarlo y NO crear 6.3
-- R3.1 P2: VALIDACION EXACTA. Solo se considera equivalente un indice BTREE y
-- NO parcial (ix.indpred IS NULL) con (cuenta_id, fecha) como PRIMERAS dos
-- columnas clave y en ese orden. Un indice parcial solo cubre un subconjunto
-- de filas y NO es equivalente para el proposito de 6.3. Mismos filtros en P2b.
DO $do$
DECLARE v_idx text;
BEGIN
  SELECT ci.relname INTO v_idx
    FROM pg_index ix
    JOIN pg_class ct  ON ct.oid  = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
    JOIN pg_class ci  ON ci.oid  = ix.indexrelid
    JOIN pg_am am     ON am.oid  = ci.relam
    JOIN pg_attribute a1 ON a1.attrelid = ct.oid AND a1.attnum = ix.indkey[0]::int2 AND a1.attname = 'cuenta_id'
    JOIN pg_attribute a2 ON a2.attrelid = ct.oid AND a2.attnum = ix.indkey[1]::int2 AND a2.attname = 'fecha'
   WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
     AND NOT ix.indisprimary
     AND ix.indpred IS NULL
     AND am.amname = 'btree'
   ORDER BY ci.relname
   LIMIT 1;

  PERFORM set_config('tz32e.idx_equiv', COALESCE(v_idx, ''), false);

  IF v_idx IS NULL THEN
    RAISE NOTICE 'PC8 OK: NO existe indice equivalente BTREE no parcial sobre (cuenta_id, fecha); se creara idx_mov_cuenta_fecha en 2.3';
  ELSE
    RAISE NOTICE 'PC8 OK: existe indice equivalente BTREE no parcial % -> se CONSERVA (no se duplica; idx_mov_cuenta_fecha NO se creara)', v_idx;
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

-- 2.2 uq_mov_origen — validacion POR DEFINICION (heredada de R2, se conserva).
--      R3.1 P3: VALIDACION ESTRICTA. Si NO existe: se crea. Si YA existe: se
--      valida con la consulta de extraccion ACOTADA a public.movimientos_bancarios,
--      UNIQUE, parcial, indnkeyatts=3, columnas exactas
--      (empresa_id, origen_tipo, origen_id) en ese orden, y predicado comparado
--      por CANONIZACION EXACTA (igualdad textual normalizada): el predicado
--      esperado de 3.2E es
--        origen_id IS NOT NULL AND estado = 'activo'
--          AND origen_tipo IS DISTINCT FROM 'transferencia'
--      Si no cumple -> BLOQUEO (nunca se borra ni se reemplaza). Si cumple ->
--      PASS / REUSE EXISTING INDEX.
DO $do$
DECLARE
  v_cnt   int;
  v_uniq  boolean;
  v_part  boolean;
  v_nkeys int;
  v_cols  text;
  v_pred  text;
  v_pred_ok boolean;
  v_pred_norm text;
  v_esp   text;
BEGIN
  SELECT count(*) INTO v_cnt
    FROM pg_index ix
    JOIN pg_class ct ON ct.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
    JOIN pg_class ci ON ci.oid = ix.indexrelid
   WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
     AND ci.relname='uq_mov_origen';

  IF v_cnt = 0 THEN
    EXECUTE $ddl$
      CREATE UNIQUE INDEX uq_mov_origen
        ON public.movimientos_bancarios (empresa_id, origen_tipo, origen_id)
        WHERE origen_id IS NOT NULL AND estado = 'activo'
          AND origen_tipo IS DISTINCT FROM 'transferencia'
    $ddl$;
    PERFORM set_config('tz32e.idx_uq_created', 'yes', false);
    RAISE NOTICE 'MIGRACION 2.2 OK: uq_mov_origen creado (no existia)';
    RETURN;
  END IF;

  -- Ya existe: extraer definicion real (acotada a public.movimientos_bancarios)
  SELECT ix.indisunique,
         (ix.indpred IS NOT NULL),
         ix.indnkeyatts,
         (SELECT string_agg(a.attname, ',' ORDER BY k.ord)
            FROM generate_series(0, ix.indnkeyatts - 1) AS k(ord)
            JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ix.indkey[k.ord]::int),
         pg_get_expr(ix.indpred, ix.indrelid)
    INTO v_uniq, v_part, v_nkeys, v_cols, v_pred
    FROM pg_index ix
    JOIN pg_class ci ON ci.oid = ix.indexrelid
    JOIN pg_class ct ON ct.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
   WHERE ci.relname = 'uq_mov_origen'
     AND ns.nspname='public' AND ct.relname='movimientos_bancarios'
   LIMIT 1;

  -- R3.1 P3: CANONIZACION EXACTA del predicado en lugar de LIKE.
  -- 1) normalizar lo que devuelve pg_get_expr (minusculas, colapsar espacios,
  --    quitar cast explicito ::text y parentesis externos de la expresion);
  -- 2) comparar IGUALDAD textual contra el predicado esperado, normalizado igual.
  v_pred_norm := regexp_replace(lower(COALESCE(v_pred, '')), '\s+', ' ', 'g');
  v_pred_norm := regexp_replace(v_pred_norm, '::text', '', 'g');
  v_pred_norm := regexp_replace(v_pred_norm, '[()]', '', 'g');
  v_pred_norm := regexp_replace(v_pred_norm, '\s+', ' ', 'g');
  IF left(v_pred_norm, 1) = '(' AND right(v_pred_norm, 1) = ')' THEN
    v_pred_norm := substr(v_pred_norm, 2, length(v_pred_norm) - 2);
  END IF;
  v_esp := regexp_replace(
    lower('origen_id IS NOT NULL AND estado = ''activo'' AND origen_tipo IS DISTINCT FROM ''transferencia'''),
    '\s+', ' ', 'g');
  v_pred_ok := (v_pred IS NOT NULL) AND (v_pred_norm = v_esp);

  IF v_uniq IS NULL
     OR NOT v_uniq
     OR NOT v_part
     OR v_nkeys <> 3
     OR v_cols IS DISTINCT FROM 'empresa_id,origen_tipo,origen_id'
     OR NOT v_pred_ok THEN
    RAISE EXCEPTION 'MIGRACION 2.2 BLOQUEO: uq_mov_origen existe pero NO cumple la definicion esperada (unique=%, parcial=%, nkeys=%, columnas=%, predicado_ok=%); NO se borra ni reemplaza; revision manual',
      v_uniq, v_part, v_nkeys, COALESCE(v_cols,'(desconocido)'), v_pred_ok;
  END IF;

  PERFORM set_config('tz32e.idx_uq_created', 'no', false);
  RAISE NOTICE 'MIGRACION 2.2 OK: uq_mov_origen ya existe y cumple la definicion esperada (PASS / REUSE EXISTING INDEX)';
END $do$;

-- 2.3 idx_mov_cuenta_fecha: SOLO si PC8 no hallo indice equivalente — plan 6.3
-- CORRECCION R3 (C5): guarda por definicion, NO solo por nombre. Si existe un
-- indice llamado idx_mov_cuenta_fecha que PC8 NO considero equivalente
-- (cuenta_id, fecha), es una definicion incorrecta -> BLOQUEO. Nunca se borra
-- ni se reemplaza; tampoco se crea un duplicado con IF NOT EXISTS que lo omita
-- silenciosamente.
DO $do$
DECLARE v_idx text; v_wrong int;
BEGIN
  v_idx := NULLIF(current_setting('tz32e.idx_equiv', true), '');
  IF v_idx IS NULL THEN
    SELECT count(*) INTO v_wrong
      FROM pg_class ci
      JOIN pg_namespace ns ON ns.oid = ci.relnamespace
      JOIN pg_index ix ON ix.indexrelid = ci.oid
      JOIN pg_class ct ON ct.oid = ix.indrelid
     WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
       AND ci.relname='idx_mov_cuenta_fecha';
    IF v_wrong <> 0 THEN
      RAISE EXCEPTION 'MIGRACION 2.3 BLOQUEO: idx_mov_cuenta_fecha existe pero NO es el indice equivalente (cuenta_id, fecha) que PC8 busca; definicion incorrecta; no se borra ni reemplaza; revision manual';
    END IF;
    CREATE INDEX idx_mov_cuenta_fecha
      ON public.movimientos_bancarios (cuenta_id, fecha);
    PERFORM set_config('tz32e.idx_created', 'yes', false);
    RAISE NOTICE 'MIGRACION 2.3 OK: idx_mov_cuenta_fecha creado (no existia, ni como equivalente ni con ese nombre mal definido)';
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
-- t1_result='pass' SOLO como ultimo paso en autocommit (fuera de cualquier
-- rollback). Cualquier fallo obligatorio = RAISE EXCEPTION que detiene el
-- script. Referencia ZZTEST3.2E. Cuentas SIEMPRE reales, nunca inventadas.
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

  -- T1-T (dos cuentas de LA MISMA EMPRESA; R2 conservado + refuerzo R3 C4)
  v_emp_tt uuid;
  v_a   uuid;
  v_b   uuid;
  v_emp_a uuid;
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
  v_emp_mov_a uuid;
  v_emp_mov_b uuid;

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
  IF NOT v_origen_ok  THEN RAISE EXCEPTION 'T1-O FAIL: origen_tipo/tipo_flujo no se persistieron (origen_tipo=%, tipo_flujo=%)', v_origen_tipo, v_tipo_flujo; END IF;
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
  -- transferencia INTERNA (misma empresa), heredada de R2 y reforzada en R3 (C4).
  -- (1) Buscar una empresa con al menos 2 cuentas (diseno general multiempresa;
  --     no depende de IDs concretos ni asume que Tz'unun ocupa las primeras filas).
  SELECT e.empresa_id INTO v_emp_tt
    FROM (SELECT cb.empresa_id, count(*) AS n
            FROM public.cuentas_bancarias cb
           GROUP BY cb.empresa_id
           HAVING count(*) >= 2
           ORDER BY cb.empresa_id
           LIMIT 1) e;

  IF v_emp_tt IS NULL THEN
    RAISE EXCEPTION 'T1-T BLOQUEO (NOT TESTABLE): ninguna empresa tiene al menos 2 cuentas bancarias; no se inventan ni crean cuentas';
  END IF;

  -- (2) Dos cuentas de ESA misma empresa (las 7 cuentas reales se conservan;
  --     la cuenta de R&G y la de Servicios Multiples Tz'unun no se tocan: solo
  --     se eligen cuentas dentro de la empresa hallada con >= 2).
  SELECT cb.id, cb.empresa_id INTO v_a, v_emp_a
    FROM public.cuentas_bancarias cb WHERE cb.empresa_id = v_emp_tt ORDER BY cb.id LIMIT 1 OFFSET 0;
  SELECT cb.id, cb.empresa_id INTO v_b, v_emp_b
    FROM public.cuentas_bancarias cb WHERE cb.empresa_id = v_emp_tt ORDER BY cb.id LIMIT 1 OFFSET 1;

  -- (3)-(4) Verificacion explicita: misma empresa en ambas cuentas
  IF v_a IS NULL OR v_b IS NULL OR v_a = v_b THEN
    RAISE EXCEPTION 'T1-T BLOQUEO: la empresa % no permitio seleccionar 2 cuentas distintas (A=% B=%)', v_emp_tt, v_a, v_b;
  END IF;
  IF v_emp_a IS DISTINCT FROM v_emp_b THEN
    RAISE EXCEPTION 'T1-T FAIL: empresa_id_cuenta_A (%) <> empresa_id_cuenta_B (%); no es transferencia interna', v_emp_a, v_emp_b;
  END IF;
  IF v_emp_tt IS DISTINCT FROM v_emp_a THEN
    RAISE EXCEPTION 'T1-T FAIL: inconsistencia interna de la empresa seleccionada (%) vs cuentas (%)', v_emp_tt, v_emp_a;
  END IF;

  SELECT cb.saldo_actual INTO v_sa_antes FROM public.cuentas_bancarias cb WHERE cb.id = v_a;
  SELECT cb.saldo_actual INTO v_sb_antes FROM public.cuentas_bancarias cb WHERE cb.id = v_b;
  RAISE NOTICE 'T1-T: empresa=% A=% (saldo_antes=%) B=% (saldo_antes=%) op=%', v_emp_a, v_a, v_sa_antes, v_b, v_sb_antes, v_op;

  BEGIN
    -- Pierna A: egreso en cuenta A (misma empresa)
    INSERT INTO public.movimientos_bancarios
      (empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado,
       origen_tipo, origen_id, tipo_flujo, cuenta_contraparte_id)
    VALUES
      (v_emp_a, v_a, CURRENT_DATE, 'egreso', 'ZZ prueba transferencia A 3.2E', 123.45, 'ZZTEST3.2E', 'prueba', false,
       'transferencia', v_op, 'TRANSFERENCIA_INTERNA', v_b)
    RETURNING id INTO v_m_a;

    -- Pierna B: ingreso en cuenta B (misma empresa)
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

    -- CORRECCION R3 (C4): el empresa_id grabado en CADA pierna debe coincidir
    -- con el empresa_id de SU cuenta (multiempresa real). No basta que las dos
    -- cuentas sean de la misma empresa: el movimiento tambien debe reflejarlo.
    SELECT mo.empresa_id INTO v_emp_mov_a FROM public.movimientos_bancarios mo WHERE mo.id = v_m_a;
    SELECT mo.empresa_id INTO v_emp_mov_b FROM public.movimientos_bancarios mo WHERE mo.id = v_m_b;

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
  IF v_emp_mov_a IS DISTINCT FROM v_emp_a THEN RAISE EXCEPTION 'T1-T FAIL: empresa_id del movimiento A (%) no coincide con el de su cuenta A (%)', v_emp_mov_a, v_emp_a; END IF;
  IF v_emp_mov_b IS DISTINCT FROM v_emp_b THEN RAISE EXCEPTION 'T1-T FAIL: empresa_id del movimiento B (%) no coincide con el de su cuenta B (%)', v_emp_mov_b, v_emp_b; END IF;
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
  RAISE NOTICE 'T1-T PASS: transferencia INTERNA (misma empresa %); empresa_id de cada movimiento igual al de su cuenta; neto (-M)+(+M)=0; vinculo bidireccional completo (cuenta y movimiento en ambas direcciones); saldos A/B intactos; revertido', v_emp_a;
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

-- ============ T1-NEG (validacion conceptual/documental; NO genera movimientos) ===
-- (agregada en R3, seccion 12) CASO FUERA DE ALCANCE:
--   Cuenta A (empresa X) -> Cuenta B (empresa Y) es una TRANSFERENCIA ENTRE
--   EMPRESAS y NO constituye el caso valido de T1-T en 3.2E. Se documenta
--   explicitamente y NO se implementa aqui.
DO $do$
DECLARE v_empresas bigint;
BEGIN
  SELECT count(DISTINCT cb.empresa_id) INTO v_empresas FROM public.cuentas_bancarias cb;

  IF v_empresas > 1 THEN
    RAISE NOTICE 'T1-NEG INFO: existen % empresa(s) con cuentas bancarias; por eso T1-T exige seleccionar dos cuentas de la MISMA empresa y verifica que ambos movimientos la registren', v_empresas;
  END IF;

  RAISE NOTICE 'T1-NEG PASS (conceptual): A(X)->B(Y) NO es caso valido de T1-T en 3.2E; transferencia entre empresas queda FUERA DEL ALCANCE y se disenara con arquitectura interempresa especifica (tablas, CxC/CxP, asientos, consolidacion y nuevos tipos de flujo: nada de esto se agrega en esta fase)';
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
-- Los mismos filtros exactos de PC8 (R3.1 P2): BTREE, no parcial, primeras dos
-- columnas clave (cuenta_id, fecha).
SELECT c.relname AS indice_conservado, i.indexdef
FROM pg_index ix
JOIN pg_class ct ON ct.oid = ix.indrelid
JOIN pg_namespace ns ON ns.oid = ct.relnamespace
JOIN pg_class c ON c.oid = ix.indexrelid
JOIN pg_am am ON am.oid = c.relam
JOIN pg_indexes i ON i.indexname = c.relname
WHERE ns.nspname='public' AND ct.relname='movimientos_bancarios'
  AND NOT ix.indisprimary
  AND ix.indpred IS NULL
  AND am.amname = 'btree'
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
SELECT current_setting('tz32e.version', true)          AS version_migracion,
       current_setting('tz32e.created_at', true)       AS created_at_segun_pc3,
       current_setting('tz32e.checksum_pre', true)     AS checksum_pre,
       current_setting('tz32e.checksum_cols', true)    AS checksum_cols_congeladas,
       NULLIF(current_setting('tz32e.idx_equiv', true), '') AS indice_equivalente_pc8,
       current_setting('tz32e.idx_uq_created', true)   AS uq_creado_por_esta_ejecucion,
       current_setting('tz32e.idx_created', true)      AS idx_cuenta_fecha_creado_por_esta_ejecucion,
       current_setting('tz32e.snapshot', true)         AS modo_snapshot;

-- P8 — Checksum POST con la MISMA formula congelada en PC4 (no incluye las 5 columnas nuevas)
-- R3.1 P1: ANTES de usar la formula congelada, verificar la ESTABILIDAD del
-- esquema: la lista congelada (tz32e.checksum_cols) debe coincidir exactamente
-- con las columnas historicas actuales. Si alguien altero el esquema entre PC4
-- y P8, la formula ya no describe la tabla -> BLOQUEO.
DO $do$
DECLARE v_sql text; v_sum text; v_cols text; v_cols_frozen text;
BEGIN
  v_sql := NULLIF(current_setting('tz32e.checksum_sql', true), '');
  IF v_sql IS NULL THEN
    RAISE EXCEPTION 'P8 BLOQUEO: no existe tz32e.checksum_sql (linea base ausente)';
  END IF;

  v_cols_frozen := NULLIF(current_setting('tz32e.checksum_cols', true), '');
  IF v_cols_frozen IS NULL THEN
    RAISE EXCEPTION 'P8 BLOQUEO: no existe tz32e.checksum_cols (congelamiento ausente)';
  END IF;
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND column_name NOT IN ('origen_tipo','origen_id','tipo_flujo',
         'cuenta_contraparte_id','movimiento_contraparte_id');
  IF v_cols IS DISTINCT FROM v_cols_frozen THEN
    RAISE EXCEPTION 'P8 BLOQUEO: el esquema historico cambio respecto a la lista congelada en PC4 (actual=%, congelada=%); la formula congelada no es valida', COALESCE(v_cols,''), v_cols_frozen;
  END IF;

  EXECUTE v_sql INTO v_sum;
  RAISE NOTICE 'P8 (R3.1): esquema estable (lista congelada confirmada); checksum POST (misma formula PC4) = %', v_sum;
END $do$;

-- ================= SECCION 7: GATE FINAL ====================================
-- Solo lee estado confirmado + marcadores de sesion. Si algo falla -> RAISE
-- EXCEPTION 'GATE 3.2E BLOQUEO: ...' y la fase no termina aparentando exito.
DO $do$
DECLARE
  v_res        text;
  v_ver        text;
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
  v_uq_nkeys   int;
  v_uq_cols    text;
  v_uq_pred    text;
  v_uq_pred_ok boolean;
  v_uq_pred_norm text;
  v_uq_esp     text;
  v_idx_equiv  text;
  v_has_idx    boolean;
  v_estado_t   text;
  v_estado_nn  text;
  v_estado_def text;
  v_chk        text;
  v_cols_check text;
  v_cols_frozen text;
  v_snp_sql    text;
  v_snp        text;
  v_errs       text := '';
BEGIN
  -- (0) Version de migracion (R3.1): exige '3.2E-R3.2'
  v_ver := current_setting('tz32e.version', true);
  IF v_ver IS DISTINCT FROM '3.2E-R3.2' THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: version de migracion incorrecta (tz32e.version=%)', COALESCE(v_ver, 'ausente');
  END IF;

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

  -- (3) uq_mov_origen: UNIQUE + parcial + indnkeyatts=3 + columnas exactas +
  --     predicado canonico (definicion ESTRICTA — R3.1 P3).
  --     R3: acotado a public.movimientos_bancarios (no basta el nombre) y
  --     predicado por CANONIZACION EXACTA (no LIKE): se normaliza lo que
  --     devuelve pg_get_expr (minusculas, espacios colapsados, sin ::text, sin
  --     parentesis externos) y se exige igualdad textual con el predicado
  --     esperado normalizado igual.
  SELECT ix.indisunique,
         (ix.indpred IS NOT NULL),
         ix.indnkeyatts,
         (SELECT string_agg(a.attname, ',' ORDER BY k.ord)
            FROM generate_series(0, ix.indnkeyatts - 1) AS k(ord)
            JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ix.indkey[k.ord]::int),
         pg_get_expr(ix.indpred, ix.indrelid)
    INTO v_un, v_part, v_uq_nkeys, v_uq_cols, v_uq_pred
    FROM pg_index ix
    JOIN pg_class ci ON ci.oid = ix.indexrelid
    JOIN pg_class ct ON ct.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ct.relnamespace
   WHERE ci.relname = 'uq_mov_origen'
     AND ns.nspname='public' AND ct.relname='movimientos_bancarios'
   LIMIT 1;
  IF v_un IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: falta el indice unico uq_mov_origen';
  END IF;
  v_uq_pred_norm := regexp_replace(lower(COALESCE(v_uq_pred, '')), '\s+', ' ', 'g');
  v_uq_pred_norm := regexp_replace(v_uq_pred_norm, '::text', '', 'g');
  v_uq_pred_norm := regexp_replace(v_uq_pred_norm, '[()]', '', 'g');
  v_uq_pred_norm := regexp_replace(v_uq_pred_norm, '\s+', ' ', 'g');
  IF left(v_uq_pred_norm, 1) = '(' AND right(v_uq_pred_norm, 1) = ')' THEN
    v_uq_pred_norm := substr(v_uq_pred_norm, 2, length(v_uq_pred_norm) - 2);
  END IF;
  v_uq_esp := regexp_replace(
    lower('origen_id IS NOT NULL AND estado = ''activo'' AND origen_tipo IS DISTINCT FROM ''transferencia'''),
    '\s+', ' ', 'g');
  v_uq_pred_ok := (v_uq_pred IS NOT NULL) AND (v_uq_pred_norm = v_uq_esp);
  IF NOT v_un OR NOT v_part OR v_uq_nkeys <> 3
     OR v_uq_cols IS DISTINCT FROM 'empresa_id,origen_tipo,origen_id'
     OR NOT v_uq_pred_ok THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: uq_mov_origen no cumple la definicion esperada (unique=%, parcial=%, nkeys=%, columnas=%, predicado ok=%)',
      v_un, v_part, v_uq_nkeys, COALESCE(v_uq_cols,'(desconocido)'), v_uq_pred_ok;
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
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: cantidad_pre=% cantidad_post=% (deben ser iguales; el conteo se compara de forma dinamica pre/post)', v_cnt_pre, v_cnt;
  END IF;
  IF v_c IS DISTINCT FROM v_c_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: la cantidad de cuentas cambio (% -> %)', v_c_pre, v_c;
  END IF;

  EXECUTE v_sql INTO v_sum;
  IF v_sum IS DISTINCT FROM v_sum_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: checksum_pre=% checksum_post=% (los movimientos historicos fueron modificados)', v_sum_pre, v_sum;
  END IF;

  -- (8bis) R3.1 P1: ESTABILIDAD del esquema y corroboracion independiente del
  --         baseline contra el snapshot _bkp_32e con la MISMA formula congelada.
  v_cols_frozen := NULLIF(current_setting('tz32e.checksum_cols', true), '');
  IF v_cols_frozen IS NULL THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: no existe tz32e.checksum_cols (congelamiento ausente)';
  END IF;
  SELECT string_agg(column_name, ',' ORDER BY ordinal_position) INTO v_cols_check
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='movimientos_bancarios'
     AND column_name NOT IN ('origen_tipo','origen_id','tipo_flujo',
         'cuenta_contraparte_id','movimiento_contraparte_id');
  IF v_cols_check IS DISTINCT FROM v_cols_frozen THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: el esquema historico cambio respecto a la lista congelada en PC4 (actual=%, congelada=%)', COALESCE(v_cols_check,''), v_cols_frozen;
  END IF;

  -- La formula congelada apunta a public.movimientos_bancarios; derivar la
  -- version para _bkp_32e (mismo conteo de columnas historicas) y exigir que
  -- el checksum del snapshot coincida con el valor PRE de la sesion. Si no hay
  -- snapshot o cambio, es una inconsistencia de baseline -> BLOQUEO.
  v_snp_sql := replace(v_sql, 'FROM public.movimientos_bancarios', 'FROM _bkp_32e.movimientos_bancarios');
  IF v_snp_sql = v_sql THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: la formula congelada no es compatible con el snapshot _bkp_32e (no se pudo derivar la consulta)';
  END IF;
  EXECUTE v_snp_sql INTO v_snp;
  IF v_snp IS DISTINCT FROM v_sum_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: checksum del snapshot _bkp_32e (%) difiere del PRE congelado (%)', COALESCE(v_snp,'(nulo)'), v_sum_pre;
  END IF;
  RAISE NOTICE 'GATE 3.2E INFO: baseline corroborado contra _bkp_32e (misma formula congelada; checksum snapshot = PRE = %)', v_snp;

  -- (9) Saldos de todas las cuentas identicos PRE/POST (determinista, order by id::text)
  SELECT string_agg(cb.saldo_inicial::text || '|' || cb.saldo_actual::text, ',' ORDER BY cb.id::text)
    INTO v_saldos FROM public.cuentas_bancarias cb;
  IF v_saldos IS DISTINCT FROM v_saldos_pre THEN
    RAISE EXCEPTION 'GATE 3.2E BLOQUEO: saldos de cuentas cambiaron entre PRE y POST';
  END IF;

  RAISE NOTICE 'GATE 3.2E OK (version 3.2E-R3.2): 5 columnas correctas (validadas antes del COMMIT por PC3 y al final por el GATE), uq_mov_origen validado de forma ESTRICTA (public.movimientos_bancarios, unico+parcial+nkeys=3+columnas+predicado canonico), indice segun PC8 (equivalente BTREE no parcial o idx_mov_cuenta_fecha), 0 triggers (por nombre), trg_mov_saldo ausente, estado+CHECK intactos, ZZTEST3.2E=0 y ZZTEST3.2D=0, T1 PASS (O/U/T/null + T1-NEG conceptual), checksum historico CONGELADO corroborado contra _bkp_32e, % movimiento(s) intactos (PRE=POST)', v_cnt;
END $do$;

-- ============================================================================
-- SECCION 8: ROLLBACK MANUAL (NO ejecutar salvo necesidad)
-- ============================================================================
-- CORRECCION R3 (C7), mantenida en R3.2: inventario documentado de objetos.
--   * Identificar VERSION: este script es FASE 3.2E-R3.2
--     (marcador de sesion tz32e.version = '3.2E-R3.2', exigido por el GATE).
--   * Usar nombres totalmente calificados (public.*).
--   * NUNCA eliminar un indice preexistente (incluidos los que esta fase
--     CONSERVA por decision de PC8 como equivalentes BTREE no parciales de
--     (cuenta_id, fecha)).
--   * El R3.2 NO agrega objetos estructurales nuevos: los mismos objetos de
--     R3/R3.1 + 1 marcador de sesion nuevo (tz32e.snapshot) y validaciones
--     igualmente estrictas en PC7 (reutilizacion con 4 capas de verificacion
--     read-only). El marcador tz32e.version debe ser '3.2E-R3.2'. El snapshot
--     _bkp_32e se conserva intacto.

-- 8.0 OBJETOS CREADOS POR R3.2 (si y solo si esta ejecucion los creo):
--   1) 5 columnas estructurales (2.1);
--   2) uq_mov_origen (2.2) SOLO si tz32e.idx_uq_created = 'yes';
--   3) idx_mov_cuenta_fecha (2.3) SOLO si tz32e.idx_created = 'yes';
--   4) snapshot _bkp_32e.movimientos_bancarios (PC7-R3.2): SOLO con autorizacion
--      si fue CREADO (tz32e.snapshot='created'); si fue REUTILIZADO
--      (tz32e.snapshot='reused') el objeto no se toco en absoluto y NO requiere
--      accion de rollback. Nunca se elimina automaticamente.

-- 8.1 Indices creados por la migracion de 3.2E
--   * uq_mov_origen: eliminarlo SOLO si fue creado por esta migracion
--     (marcador de sesion tz32e.idx_uq_created = 'yes'). Si ya existia y fue
--     REUTILIZADO (tz32e.idx_uq_created = 'no'), NO debe eliminarse.
--     DROP INDEX IF EXISTS public.uq_mov_origen;   -- solo si tz32e.idx_uq_created='yes'
--
--   * idx_mov_cuenta_fecha: eliminarlo SOLO si fue creado por ESTA ejecucion
--     (marcador de sesion tz32e.idx_created = 'yes'). Si no se creo
--     (tz32e.idx_created = 'no'  => PC8 conservo un indice equivalente y este
--     indice NO existe, o bien este nombre es el equivalente conservado), NO
--     debe eliminarse durante el rollback de 3.2E.
--     DROP INDEX IF EXISTS public.idx_mov_cuenta_fecha;   -- solo si tz32e.idx_created='yes'
--
--   La guarda de 2.3 (R3, C5) garantiza que nunca se "reutiliza por nombre" un
--   indice mal definido: si public.idx_mov_cuenta_fecha existia pero no era
--   (cuenta_id, fecha), la migracion se detuvo con BLOQUEO y no hay rollback
--   que aplicar sobre el.

-- 8.2 Columnas nuevas (DROP COLUMN no toca datos; aplica solo mientras las
--     columnas esten sin uso real, es decir, fase de estructura pura)
--   ALTER TABLE public.movimientos_bancarios
--     DROP COLUMN IF EXISTS origen_tipo,
--     DROP COLUMN IF EXISTS origen_id,
--     DROP COLUMN IF EXISTS tipo_flujo,
--     DROP COLUMN IF EXISTS cuenta_contraparte_id,
--     DROP COLUMN IF EXISTS movimiento_contraparte_id;

-- 8.3 Snapshot de respaldo: eliminarlo SOLO con autorizacion explicita del
--     operador (es el respaldo pre-ejecucion de PC7; conservarlo por defecto)
--   -- DROP SCHEMA IF EXISTS _bkp_32e CASCADE;

-- 8.4 OBJETOS QUE NO DEBEN ELIMINARSE EN EL ROLLBACK DE 3.2E:
--   * cualquier indice preexistente (incluidos los conservados por PC8);
--   * objetos de migraciones anteriores: estado, chk_movbancario_estado,
--     fn_recalcular_saldo_cuenta() (3.2D), triggers, PK/FK/indices UNIQUE que
--     no sean creacion de 3.2E;
--   * datos historicos / movimientos reales (el checksum PRE=POST del GATE
--     garantiza que la fase no los modifica).

-- 8.5 OPERACIONES QUE NO PUEDEN REVERTIRSE AUTOMATICAMENTE:
--   * la migracion estructural ya fue PERSISTIDA por el COMMIT top-level:
--     revertir = ejecutar manualmente 8.1 + 8.2 (solo si las columnas siguen
--     sin uso real). No existe rollback automatico;
--   * el snapshot _bkp_32e se RETIENE (ningun rollback lo descarta);
--   * la terminacion con exito queda evidenciada en sesion (marcadores
--     tz32e.*, incluyendo tz32e.version) pero no se escribe en tablas (no hay
--     log persistente).

-- NOTAS:
--   * Los drop de 3.2E NO afectan estado/chk_movbancario_estado (3.2D) ni
--     fn_recalcular_saldo_cuenta() (3.2D, queda intacta) ni datos ni triggers
--     (no existen en esta fase).
--   * Los movimientos INTEREMPRESA quedan explicitamente FUERA DEL ALCANCE de
--     FASE 3.2E: no se modelan aqui como transferencia interna; se disenaran
--     posteriormente como funcionalidad especifica de la arquitectura
--     multiempresa. Nada de esto se incluye en este script.

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2E-R3.2
-- ============================================================================