-- ============================================================================
-- MIGRACION FASE 3.2A — Preparacion arquitectura contable
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         fmijbpatkddkbxlkfoza (PostgreSQL 17.6)
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER.
-- Doc:        "FASE 3.2A — EJECUCION DEFINITIVA" (MD del proyecto)
-- Seguridad:  0 filas en asientos_contables / asiento_lineas / usuarios_sistema.
--             Cada paso inspecciona el estado actual antes de actuar (regla 10)
--             y es idempotente: re-ejecutable sin duplicar cambios.
--             Backup _bkp_32 ya existe y fue verificado por OWNER.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PARTE A — ESTRUCTURA asientos_contables
-- ---------------------------------------------------------------------------

-- A1. Renombrar modulo_origen -> origen_tipo (preserva valores historicos).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='asientos_contables'
      AND column_name='modulo_origen'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='asientos_contables'
      AND column_name='origen_tipo'
  ) THEN
    EXECUTE 'ALTER TABLE asientos_contables RENAME COLUMN modulo_origen TO origen_tipo';
    RAISE NOTICE 'A1 OK: modulo_origen renombrada a origen_tipo';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='asientos_contables'
      AND column_name='origen_tipo'
  ) THEN
    RAISE NOTICE 'A1 OK: origen_tipo ya existia (nada que hacer)';
  ELSE
    RAISE EXCEPTION 'A1 BLOQUEO: no existe modulo_origen ni origen_tipo en asientos_contables';
  END IF;
END $$;

-- A2. Crear evento_tipo + backfill + NOT NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='asientos_contables'
      AND column_name='evento_tipo'
  ) THEN
    EXECUTE 'ALTER TABLE asientos_contables ADD COLUMN evento_tipo text';
    RAISE NOTICE 'A2.1 OK: columna evento_tipo creada';
  ELSE
    RAISE NOTICE 'A2.1 OK: evento_tipo ya existia';
  END IF;
END $$;

UPDATE asientos_contables
SET evento_tipo = 'manual'
WHERE evento_tipo IS NULL;

DO $$
DECLARE
  n_null bigint;
BEGIN
  SELECT count(*) INTO n_null FROM asientos_contables WHERE evento_tipo IS NULL;
  IF n_null > 0 THEN
    RAISE EXCEPTION 'A2.2 BLOQUEO: % filas con evento_tipo NULL — deteniendo antes de NOT NULL', n_null;
  END IF;
  EXECUTE 'ALTER TABLE asientos_contables ALTER COLUMN evento_tipo SET NOT NULL';
  RAISE NOTICE 'A2.2 OK: evento_tipo SET NOT NULL (UPDATE asigno % filas, restante manual)', n_null;
END $$;

-- A3. CHECK de estado (la columna estado YA EXISTE; solo agregar constraint si falta).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='ck_asiento_estado' AND conrelid='asientos_contables'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE asientos_contables
             ADD CONSTRAINT ck_asiento_estado
             CHECK (estado IN (''activo'',''anulado'',''reversado''))';
    RAISE NOTICE 'A3 OK: ck_asiento_estado creado';
  ELSE
    RAISE NOTICE 'A3 OK: ck_asiento_estado ya existia';
  END IF;
END $$;

-- A4. Indice unico de idempotencia (parcial: solo activos con origen_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='asientos_contables'
      AND indexname='uq_asientos_identidad'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_asientos_identidad
             ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
             WHERE estado = ''activo'' AND origen_id IS NOT NULL';
    RAISE NOTICE 'A4 OK: uq_asientos_identidad creado';
  ELSE
    RAISE NOTICE 'A4 OK: uq_asientos_identidad ya existia';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PARTE B — asiento_lineas.empresa_id
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='asiento_lineas'
      AND column_name='empresa_id'
  ) THEN
    EXECUTE 'ALTER TABLE asiento_lineas ADD COLUMN empresa_id uuid';
    RAISE NOTICE 'B1 OK: asiento_lineas.empresa_id creada';
  ELSE
    RAISE NOTICE 'B1 OK: asiento_lineas.empresa_id ya existia';
  END IF;
END $$;

-- B2. Backfill desde asientos_contables (0 filas esperadas hoy).
UPDATE asiento_lineas l
SET empresa_id = a.empresa_id
FROM asientos_contables a
WHERE a.id = l.asiento_id
  AND l.empresa_id IS NULL;

-- B3. Verificar antes de NOT NULL (debe ser 0).
DO $$
DECLARE
  n_null bigint := (SELECT count(*) FROM asiento_lineas WHERE empresa_id IS NULL);
BEGIN
  RAISE NOTICE 'B2/B3: filas asiento_lineas sin empresa_id = %', n_null;
  IF n_null > 0 THEN
    RAISE EXCEPTION 'B3 BLOQUEO: % filas de asiento_lineas sin empresa_id — NOT NULL omitido', n_null;
  END IF;
  EXECUTE 'ALTER TABLE asiento_lineas ALTER COLUMN empresa_id SET NOT NULL';
  RAISE NOTICE 'B3 OK: asiento_lineas.empresa_id SET NOT NULL';
END $$;

-- ---------------------------------------------------------------------------
-- PARTE C — facturas: campos canonicos solo cuando NULL
-- ---------------------------------------------------------------------------
-- NO crea facturas.anulada. NO toca facturas.estado.

UPDATE facturas
SET numero_factura = numero
WHERE numero_factura IS NULL
  AND numero IS NOT NULL;

UPDATE facturas
SET nombre_receptor = cliente_nombre
WHERE nombre_receptor IS NULL
  AND cliente_nombre IS NOT NULL;

UPDATE facturas
SET nit_receptor = cliente_nit
WHERE nit_receptor IS NULL
  AND cliente_nit IS NOT NULL;

-- ============================================================================
-- PARTE E — VERIFICACIONES POSTERIORES (estructura + integridad)
-- ============================================================================

-- E0. Reporte de filas afectadas por los 3 UPDATE de facturas.
SELECT 'facturas con numero_factura = numero' AS paso,
       count(*) AS filas_afectadas
FROM facturas f
WHERE EXISTS (
  SELECT 1 FROM facturas g
  WHERE g.id = f.id AND g.numero_factura IS NOT NULL AND g.numero IS NOT NULL
);
-- (si da dudosa, ejecutar el reporte E5 abajo, que lista la situacion real)

-- E1. Columnas de asientos_contables.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='asientos_contables'
  AND column_name IN ('origen_tipo','origen_id','empresa_id','estado','evento_tipo')
ORDER BY column_name;

-- E2. Indice de idempotencia.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='asientos_contables'
  AND indexname='uq_asientos_identidad';

-- E3. CHECK de estado.
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid='asientos_contables'::regclass
  AND conname='ck_asiento_estado';

-- E4. asiento_lineas.empresa_id y ausencia de NULL.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='asiento_lineas'
  AND column_name='empresa_id';

SELECT count(*) AS lineas_sin_empresa
FROM asiento_lineas
WHERE empresa_id IS NULL;

-- E5. Facturas: campos canonicos + conteo total.
SELECT count(*) AS total_facturas,
       count(*) FILTER (WHERE numero_factura IS NULL)     AS sin_numero_factura,
       count(*) FILTER (WHERE nombre_receptor IS NULL)    AS sin_nombre_receptor,
       count(*) FILTER (WHERE nit_receptor IS NULL)       AS sin_nit_receptor,
       count(*) FILTER (WHERE estado='anulada')           AS anuladas
FROM facturas;

-- ============================================================================
-- FIN DE MIGRACION FASE 3.2A
-- ============================================================================