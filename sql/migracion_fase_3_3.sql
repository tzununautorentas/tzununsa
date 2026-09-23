-- ============================================================================
-- MIGRACION FASE 3.3 — Saneamiento del saldo_pendiente de facturas anuladas
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        "FASE3.3_PLAN_DETALLADO.md"
-- Revision:   3.3-R1
--
-- REGLA: estado='anulada' -> saldo_pendiente = 0
--   FAC-054325 (id 288ecff1-d89f-4e1b-a97b-ca3abce508e1): 630 -> 0
--   FAC-221920 (id ccb9ddf0-d1d3-47ac-873e-f224f7a34add): estado=parcial; fuera
--               del alcance de 3.3 (GRUPO C). NO se modifica ni por predicado
--               ni por exclusión: la condicion canonica (estado='anulada') ya
--               la excluye, y PC4 bloquea la corrida si su estado cambiara.
--
-- EVIDENCIA DEL PRE-FLIGHT (read-only ya ejecutado):
--   PC0  PG 17.6 (170006)  -- confirmacion literal en PC0 de este archivo
--   PC1  facturas{estado, saldo_pendiente} presentes (tipos re-chequeados)
--   PC2  unicamente FAC-054325 cumple anulada+saldo<>0
--   PC3  id 288ecff1..., numero_factura FAC-054325, estado anulada, saldo 630
--   PC4  id ccb9ddf0..., numero_factura FAC-221920, estado parcial, saldo 1687.50
--   PC5  backup_facturas_saldos NO existe (se crea en la Seccion 2)
--   PC6  total=17, suma global=2317.50; post-migracion esperado 1687.50
--
-- ESTRATEGIA TRANSACCIONAL (aprendida de 3.2C-R2): el SQL Editor ejecuta el
-- archivo como UNA sola transaccion implicita. Por eso este archivo NO usa
-- BEGIN/COMMIT internos: si cualquier PRE-CHECK o el GATE lanza RAISE EXCEPTION,
-- el editor aborta/revierte TODO el lote (incluido el backup y el UPDATE) y la
-- BD queda exactamente como antes. Solo si la corrida completa termina sin
-- error el editor confirma (persistencia). No hay pruebas ZZTEST que aislar,
-- de modo que no aplica el patron COMMIT top-level de 3.2C-R2/3.2D-R4.
--
-- IDEMPOTENCIA: la segunda corrida encuentra la base YA saneada (0 anuladas con
-- saldo, suma global 1687.50) y el backup ya existente; los PRE-CHECKS aceptan
-- ambos estados validos (pre y post), el UPDATE afecta 0 filas y el GATE valida
-- el estado final. El backup NUNCA se recrea ni se sobrescribe (anti-sobrescritura).
--
-- Alcance:   SOLO public.facturas.saldo_pendiente + snapshot backup_facturas_saldos.
-- PROHIBIDO: modificar FAC-221920, estado/otras columnas, otras tablas, RLS,
--            constraints, tipos, frontend o el modulo de facturacion.
-- ============================================================================

-- ============================================================================
-- SECCION 1: PRE-CHECKS (solo lectura; cualquier fallo detiene con EXCEPTION)
-- ============================================================================

-- PRE-CHECK 0 — PostgreSQL >= 15
DO $$
DECLARE
  v_num text;
BEGIN
  SELECT current_setting('server_version_num') INTO v_num;
  IF v_num::bigint < 150000 THEN
    RAISE EXCEPTION 'PC0 BLOQUEO: PostgreSQL % (requerido >= 15)', v_num;
  END IF;
  RAISE NOTICE 'PC0 OK: PostgreSQL %', v_num;
END $$;

-- PRE-CHECK 1 — public.facturas y tipos reales de estado y saldo_pendiente
DO $$
DECLARE
  t_estado text;
  t_saldo  text;
BEGIN
  IF to_regclass('public.facturas') IS NULL THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: falta public.facturas';
  END IF;

  SELECT data_type INTO t_estado FROM information_schema.columns
   WHERE table_schema='public' AND table_name='facturas'
     AND column_name='estado';
  IF t_estado IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: facturas.estado es % (se espera text)', t_estado;
  END IF;

  SELECT data_type INTO t_saldo FROM information_schema.columns
   WHERE table_schema='public' AND table_name='facturas'
     AND column_name='saldo_pendiente';
  IF t_saldo IS DISTINCT FROM 'numeric' THEN
    RAISE EXCEPTION 'PC1 BLOQUEO: facturas.saldo_pendiente es % (se espera numeric)', t_saldo;
  END IF;

  RAISE NOTICE 'PC1 OK: facturas.estado=text, facturas.saldo_pendiente=numeric';
END $$;

-- PRE-CHECK 2 — Exactamente 0 (ya saneado) o 1 (FAC-054325/630) anuladas con saldo
DO $$
DECLARE
  v_rows bigint;
  v_bad   bigint;
BEGIN
  SELECT count(*) INTO v_rows
    FROM public.facturas
   WHERE estado='anulada' AND saldo_pendiente <> 0;

  IF v_rows NOT IN (0, 1) THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: % facturas anuladas con saldo<>0 (solo se acepta 0 [ya saneado] o 1 [por sanear])', v_rows;
  END IF;

  IF v_rows = 1 THEN
    -- la unica debe ser exactamente FAC-054325 con 630
    SELECT count(*) INTO v_bad
      FROM public.facturas
     WHERE estado='anulada' AND saldo_pendiente <> 0
       AND (id <> '288ecff1-d89f-4e1b-a97b-ca3abce508e1'
            OR (numero_factura IS DISTINCT FROM 'FAC-054325' AND numero IS DISTINCT FROM 'FAC-054325')
            OR saldo_pendiente <> 630);
    IF v_bad <> 0 THEN
      RAISE EXCEPTION 'PC2 BLOQUEO: la unica anulada con saldo<>0 no es exactamente FAC-054325 con 630';
    END IF;
    RAISE NOTICE 'PC2 OK: 1 anulada con saldo<>0 (FAC-054325 = 630)';
  ELSE
    RAISE NOTICE 'PC2 OK: 0 anuladas con saldo<>0 (estado ya saneado; re-ejecucion)';
  END IF;
END $$;

-- PRE-CHECK 3 — FAC-054325 (id interno, numero_factura, estado, saldo)
DO $$
DECLARE
  v_nf    text;
  v_num   text;
  v_est   text;
  v_saldo numeric;
BEGIN
  SELECT numero_factura, numero, estado, saldo_pendiente
    INTO v_nf, v_num, v_est, v_saldo
    FROM public.facturas
   WHERE id='288ecff1-d89f-4e1b-a97b-ca3abce508e1';

  IF v_nf IS NULL AND v_num IS NULL THEN
    RAISE EXCEPTION 'PC3 BLOQUEO: no existe factura con id 288ecff1-d89f-4e1b-a97b-ca3abce508e1 (FAC-054325)';
  END IF;
  IF v_nf IS DISTINCT FROM 'FAC-054325' AND v_num IS DISTINCT FROM 'FAC-054325' THEN
    RAISE EXCEPTION 'PC3 BLOQUEO: id 288ecff1... corresponde a numero_factura=%, numero=% (se espera FAC-054325)', v_nf, v_num;
  END IF;
  IF v_est IS DISTINCT FROM 'anulada' THEN
    RAISE EXCEPTION 'PC3 BLOQUEO: FAC-054325 estado=% (se espera anulada)', v_est;
  END IF;
  IF v_saldo <> 630 AND v_saldo <> 0 THEN
    RAISE EXCEPTION 'PC3 BLOQUEO: FAC-054325 saldo_pendiente=% (se espera 630 [por sanear] o 0 [ya saneado])', v_saldo;
  END IF;

  RAISE NOTICE 'PC3 OK: FAC-054325 (288ecff1...) estado=anulada saldo=%', v_saldo;
END $$;

-- PRE-CHECK 4 — FAC-221920 debe mantenerse parcial/1687.50 (GRUPO C: NO se toca)
DO $$
DECLARE
  v_nf    text;
  v_num   text;
  v_est   text;
  v_saldo numeric;
BEGIN
  SELECT numero_factura, numero, estado, saldo_pendiente
    INTO v_nf, v_num, v_est, v_saldo
    FROM public.facturas
   WHERE id='ccb9ddf0-d1d3-47ac-873e-f224f7a34add';

  IF v_nf IS NULL AND v_num IS NULL THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: no existe factura con id ccb9ddf0-d1d3-47ac-873e-f224f7a34add (FAC-221920)';
  END IF;
  IF v_nf IS DISTINCT FROM 'FAC-221920' AND v_num IS DISTINCT FROM 'FAC-221920' THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: id ccb9ddf0... corresponde a numero_factura=%, numero=% (se espera FAC-221920)', v_nf, v_num;
  END IF;
  IF v_est IS DISTINCT FROM 'parcial' THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: FAC-221920 estado=% (se espera parcial; si cambio a anulada exige torre de decision GRUPO C antes de sanear)', v_est;
  END IF;
  IF v_saldo <> 1687.50 THEN
    RAISE EXCEPTION 'PC4 BLOQUEO: FAC-221920 saldo_pendiente=% (se espera 1687.50)', v_saldo;
  END IF;

  RAISE NOTICE 'PC4 OK: FAC-221920 (ccb9ddf0...) estado=parcial saldo=1687.50 — queda fuera del alcance de 3.3, no se modificara';
END $$;

-- PRE-CHECK 5 — Existencia del backup (SOLO diagnostico; se crea/valida en Seccion 2)
DO $$
BEGIN
  IF to_regclass('public.backup_facturas_saldos') IS NOT NULL THEN
    RAISE NOTICE 'PC5 OK: backup_facturas_saldos YA existe — se validara en la Seccion 2 (no se recrea)';
  ELSE
    RAISE NOTICE 'PC5 OK: backup_facturas_saldos NO existe — se creara en la Seccion 2';
  END IF;
END $$;

-- PRE-CHECK 6 — Linea base global esperada (pre 2317.50 / post 1687.50)
DO $$
DECLARE
  v_total     bigint;
  v_sum       numeric;
  v_anu       bigint;
  v_anunz     bigint;
  v_sum_anu   numeric;
BEGIN
  SELECT count(*), COALESCE(sum(saldo_pendiente), 0) INTO v_total, v_sum FROM public.facturas;
  SELECT count(*), COALESCE(sum(saldo_pendiente), 0) INTO v_anu, v_sum_anu FROM public.facturas WHERE estado='anulada';
  SELECT count(*) INTO v_anunz FROM public.facturas WHERE estado='anulada' AND saldo_pendiente <> 0;

  IF v_total <> 17 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: total facturas=% (se espera 17)', v_total;
  END IF;
  IF v_anu <> 2 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: facturas anuladas=% (se espera 2)', v_anu;
  END IF;
  IF v_anunz NOT IN (0, 1) THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: anuladas con saldo<>0=% (se espera 0 o 1)', v_anunz;
  END IF;
  IF v_anunz = 1 AND v_sum_anu <> 630 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: suma saldo de anuladas=% (se espera 630 pre-saneamiento)', v_sum_anu;
  END IF;
  IF v_anunz = 0 AND v_sum_anu <> 0 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: suma saldo de anuladas=% (inconsistente con 0 anuladas con saldo)', v_sum_anu;
  END IF;
  IF v_sum <> 2317.50 AND v_sum <> 1687.50 THEN
    RAISE EXCEPTION 'PC6 BLOQUEO: suma global=% (se espera 2317.50 pre-saneamiento o 1687.50 post)', v_sum;
  END IF;

  RAISE NOTICE 'PC6 OK: total=%, suma_global=%, anuladas=%, anuladas_saldo<>0=%, suma_anuladas=%',
    v_total, v_sum, v_anu, v_anunz, v_sum_anu;
END $$;

-- ============================================================================
-- SECCION 2: BACKUP (snapshot de saldo_pendiente previo) + VALIDACION
-- ============================================================================

-- 2.1 Crear el backup con la foto PREVIA SOLO si no existe (anti-sobrescritura).
--     En re-ejecucion (ya migrada) el backup pre-existente se conserva como evidencia.
DO $$
BEGIN
  IF to_regclass('public.backup_facturas_saldos') IS NULL THEN
    CREATE TABLE public.backup_facturas_saldos AS
    SELECT id, numero_factura, numero, estado, saldo_pendiente
      FROM public.facturas;
    RAISE NOTICE 'BACKUP OK: backup_facturas_saldos creado con la foto previa de saldo_pendiente';
  ELSE
    RAISE NOTICE 'BACKUP INFO: backup_facturas_saldos ya existia; no se recrea (anti-sobrescritura)';
  END IF;
END $$;

-- 2.2 VALIDACION DEL BACKUP: estructura, cobertura total, suma previa y puntos criticos
DO $$
DECLARE
  v_n_bkp     bigint;
  v_n_fac     bigint;
  v_sum_bkp   numeric;
  v_cov       bigint;
  v_col_id    text;
  v_col_saldo text;
  v_fac1_bkp  numeric;
  v_fac2_bkp  numeric;
BEGIN
  IF to_regclass('public.backup_facturas_saldos') IS NULL THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: backup_facturas_saldos no existe';
  END IF;

  SELECT data_type INTO v_col_id FROM information_schema.columns
   WHERE table_schema='public' AND table_name='backup_facturas_saldos' AND column_name='id';
  SELECT data_type INTO v_col_saldo FROM information_schema.columns
   WHERE table_schema='public' AND table_name='backup_facturas_saldos' AND column_name='saldo_pendiente';
  IF v_col_id IS NULL OR v_col_saldo IS NULL THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: faltan columnas id y/o saldo_pendiente en el backup';
  END IF;

  SELECT count(*), COALESCE(sum(saldo_pendiente), 0) INTO v_n_bkp, v_sum_bkp FROM public.backup_facturas_saldos;
  SELECT count(*) INTO v_n_fac FROM public.facturas;

  IF v_n_bkp <> v_n_fac THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: backup tiene % filas y facturas % (deben ser iguales)', v_n_bkp, v_n_fac;
  END IF;

  SELECT count(*) INTO v_cov
    FROM public.facturas f
    LEFT JOIN public.backup_facturas_saldos b ON b.id = f.id
   WHERE b.id IS NULL;
  IF v_cov <> 0 THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: % facturas sin cobertura en el backup', v_cov;
  END IF;

  IF v_sum_bkp <> 2317.50 THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: suma del backup=% (se espera 2317.50 = estado previo real)', v_sum_bkp;
  END IF;

  SELECT saldo_pendiente INTO v_fac1_bkp FROM public.backup_facturas_saldos WHERE id='288ecff1-d89f-4e1b-a97b-ca3abce508e1';
  SELECT saldo_pendiente INTO v_fac2_bkp FROM public.backup_facturas_saldos WHERE id='ccb9ddf0-d1d3-47ac-873e-f224f7a34add';
  IF v_fac1_bkp IS DISTINCT FROM 630 THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: FAC-054325 en backup tiene % (se espera 630 previo)', v_fac1_bkp;
  END IF;
  IF v_fac2_bkp IS DISTINCT FROM 1687.50 THEN
    RAISE EXCEPTION 'VALIDACION BACKUP BLOQUEO: FAC-221920 en backup tiene % (se espera 1687.50 previo)', v_fac2_bkp;
  END IF;

  RAISE NOTICE 'VALIDACION BACKUP OK: % filas, suma=%, cobertura=100%%, FAC-054325=630, FAC-221920=1687.50',
    v_n_bkp, v_sum_bkp;
END $$;

-- ============================================================================
-- SECCION 3: UPDATE CONTROLADO (idempotente)
-- ============================================================================
-- Condicion canonica D1: estado='anulada' AND saldo_pendiente <> 0.
-- FAC-221920 queda excluida por la propia condicion (estado='parcial'); PC4 ha
-- bloqueado la corrida si ese estado cambiara, por lo que NO se agrega clausula
-- AND id<>. Resultado esperado: 1 fila en primera corrida, 0 en re-ejecucion.
DO $$
DECLARE
  v_rows bigint;
BEGIN
  UPDATE public.facturas
     SET saldo_pendiente = 0
   WHERE estado = 'anulada'
     AND saldo_pendiente <> 0;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows NOT IN (0, 1) THEN
    RAISE EXCEPTION 'MIGRACION BLOQUEO: se afectaron % filas (se esperaba 0 o 1)', v_rows;
  END IF;

  RAISE NOTICE 'MIGRACION OK: % factura(s) anulada(s) saneada(s) a saldo 0 (esperado 1 en primera corrida, 0 en re-ejecucion)', v_rows;
END $$;

-- ============================================================================
-- SECCION 4: POST-CHECKS + GATE 3.3
-- ============================================================================

-- V1 — Ninguna anulada con saldo distinto de cero
SELECT count(*) AS anuladas_con_saldo
FROM public.facturas
WHERE estado='anulada' AND saldo_pendiente <> 0;

-- V2 — FAC-054325 saneada (saldo 0, estado intacto)
SELECT id, numero_factura, estado, saldo_pendiente
FROM public.facturas
WHERE id='288ecff1-d89f-4e1b-a97b-ca3abce508e1';

-- V3 — FAC-221920 INTACTA (parcial, 1687.50)
SELECT id, numero_factura, estado, saldo_pendiente
FROM public.facturas
WHERE id='ccb9ddf0-d1d3-47ac-873e-f224f7a34add';

-- V4 — Suma global de saldo_pendiente (esperado 1687.50)
SELECT COALESCE(sum(saldo_pendiente), 0) AS suma_global
FROM public.facturas;

-- V5 — Total de facturas invariante (17)
SELECT count(*) AS total_facturas
FROM public.facturas;

-- V6 — Estado del backup (17 filas; suma 2317.50)
SELECT count(*) AS bkp_filas, COALESCE(sum(saldo_pendiente), 0) AS bkp_suma
FROM public.backup_facturas_saldos;

-- GATE 3.3 — BLOQUEO de cierre: la migracion no puede terminar aparentando
-- exito si algun invariante falla. Sobre el mismo estado ya comiteado por el
-- editor (corrida exitosa), no escribe datos.
DO $$
DECLARE
  v_anunz    bigint;
  v_sum      numeric;
  v_total    bigint;
  v_fac1_s   numeric;
  v_fac1_est text;
  v_fac2_s   numeric;
  v_fac2_est text;
  v_bkp_rows bigint;
  v_bkp_sum  numeric;
  v_bkp_1    numeric;
  v_bkp_2    numeric;
  v_cov      bigint;
BEGIN
  SELECT count(*) INTO v_anunz FROM public.facturas WHERE estado='anulada' AND saldo_pendiente <> 0;
  IF v_anunz <> 0 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: % anuladas con saldo<>0 tras la migracion', v_anunz;
  END IF;

  SELECT COALESCE(sum(saldo_pendiente), 0), count(*) INTO v_sum, v_total FROM public.facturas;
  IF v_sum <> 1687.50 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: suma global=% (se espera 1687.50 tras -630)', v_sum;
  END IF;
  IF v_total <> 17 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: total facturas=% (se espera 17, sin filas nuevas/borradas)', v_total;
  END IF;

  SELECT saldo_pendiente, estado INTO v_fac1_s, v_fac1_est FROM public.facturas WHERE id='288ecff1-d89f-4e1b-a97b-ca3abce508e1';
  IF v_fac1_s <> 0 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: FAC-054325 saldo=% (se espera 0)', v_fac1_s;
  END IF;
  IF v_fac1_est IS DISTINCT FROM 'anulada' THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: FAC-054325 estado=% (no debe alterarse)', v_fac1_est;
  END IF;

  SELECT saldo_pendiente, estado INTO v_fac2_s, v_fac2_est FROM public.facturas WHERE id='ccb9ddf0-d1d3-47ac-873e-f224f7a34add';
  IF v_fac2_s <> 1687.50 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: FAC-221920 saldo=% (debe quedar INTACTA en 1687.50)', v_fac2_s;
  END IF;
  IF v_fac2_est IS DISTINCT FROM 'parcial' THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: FAC-221920 estado=% (debe quedar parcial)', v_fac2_est;
  END IF;

  SELECT count(*), COALESCE(sum(saldo_pendiente), 0) INTO v_bkp_rows, v_bkp_sum FROM public.backup_facturas_saldos;
  IF v_bkp_rows <> 17 OR v_bkp_sum <> 2317.50 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: backup reutilizable esperado (17 filas, suma 2317.50); real: % filas, suma %', v_bkp_rows, v_bkp_sum;
  END IF;
  SELECT saldo_pendiente INTO v_bkp_1 FROM public.backup_facturas_saldos WHERE id='288ecff1-d89f-4e1b-a97b-ca3abce508e1';
  SELECT saldo_pendiente INTO v_bkp_2 FROM public.backup_facturas_saldos WHERE id='ccb9ddf0-d1d3-47ac-873e-f224f7a34add';
  IF v_bkp_1 IS DISTINCT FROM 630 OR v_bkp_2 IS DISTINCT FROM 1687.50 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: backup no conserva los valores previos reales de FAC-054325/FAC-221920';
  END IF;

  SELECT count(*) INTO v_cov
    FROM public.facturas f
    LEFT JOIN public.backup_facturas_saldos b ON b.id = f.id
   WHERE b.id IS NULL;
  IF v_cov <> 0 THEN
    RAISE EXCEPTION 'GATE 3.3 BLOQUEO: % facturas sin cobertura en el backup', v_cov;
  END IF;

  RAISE NOTICE 'GATE 3.3 OK: 0 anuladas con saldo, suma global 1687.50 (=2317.50-630), 17 facturas, FAC-054325=0, FAC-221920 intacta 1687.50, backup reutilizable 17 filas';
END $$;

-- ============================================================================
-- SECCION 5: ROLLBACK (SOLO para revertir; NO ejecutar en esta corrida)
-- ============================================================================
--   UPDATE public.facturas f
--      SET saldo_pendiente = b.saldo_pendiente
--     FROM backup_facturas_saldos b
--    WHERE b.id = f.id;
--
-- NOTA:
--   * Restaura SOLO saldo_pendiente desde el snapshot pre-3.3; no toca estado,
--     ni otras columnas, ni indices/FKs, ni otras tablas.
--   * backup_facturas_saldos se CONSERVA como evidencia (no se elimina).
--   * Si el editor ejecuto la corrida completa con exito (committed), este
--     rollback restaura el estado previo y deja la base re-ejecutable.

-- ============================================================================
-- FIN DE MIGRACION FASE 3.3
-- ============================================================================