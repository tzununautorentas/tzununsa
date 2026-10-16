-- ============================================================================
-- MIGRACION — SINCRONIZACION (SOLO AVANCE) DE empresas.ultima_reserva
-- ============================================================================
-- PROYECTO: PRUEBAS (eyojdedlxfgtcnvyqinr). PRODUCCION EXCLUIDA.
--
-- OBJETIVO
--   Alinear el contador `public.empresas.ultima_reserva` con el mayor
--   correlativo de reserva YA EXISTENTE por empresa, para poder empezar a usar
--   `api_siguiente_numero('reservas', empresa)` sin reutilizar numeros.
--
-- MOTIVO
--   En PRUEBAS existen reservas RES-000001..RES-000004 pero `ultima_reserva`
--   esta vacio (las reservas se crearon antes de que existiera el contador).
--   Si se empieza a usar el contador sin sincronizarlo, la RPC devolveria
--   'RES-000001', ya usado.
--
-- GARANTIAS
--   * SOLO AVANZA: nunca retrocede ni sobrescribe un contador mayor
--     (el UPDATE exige max_existente > contador_actual numericamente).
--   * IDEMPOTENTE: una segunda ejecucion no cambia nada.
--   * NO borra, NO renumera y NO crea registros historicos.
--   * No depende de que exista el indice unico (Seccion 3 lo asegura si falta).
--
-- APLICACION: MANUAL en el SQL Editor de PRUEBAS. NO se ejecuta automaticamente.
--             (No hay COMMIT/ROLLBACK en este archivo; cada bloque es una sentencia.)
-- ============================================================================

-- ============================================================================
-- SECCION 0 — PREFLIGHT (SOLO LECTURA): contador actual vs. max existente
--   Verifica el estado antes de tocar nada. Esperado en PRUEBAS:
--   ultima_reserva = NULL/'', max_reserva_n = 4.
-- ============================================================================
SELECT
  e.id,
  e.nombre,
  e.ultima_reserva                                              AS contador_actual,
  MAX(NULLIF(regexp_replace(r.numero, '[^0-9]', '', 'g'), '')::bigint)
                                                                AS max_reserva_n,
  COUNT(r.id) FILTER (WHERE r.numero ~ '^RES-[0-9]+$')          AS reservas_correlativas,
  COUNT(r.id)                                                   AS reservas_total,
  COALESCE(NULLIF(regexp_replace(COALESCE(e.ultima_reserva, ''), '[^0-9]', '', 'g'), '')::bigint, 0)
                                                                AS contador_actual_n
FROM public.empresas e
LEFT JOIN public.reservas r ON r.empresa_id = e.id
GROUP BY e.id, e.nombre, e.ultima_reserva
ORDER BY e.nombre;

-- ============================================================================
-- SECCION 1 — SINCRONIZACION FORWARD-ONLY
--   Avanza `ultima_reserva` al mayor correlativo RES-<digitos> existente por
--   empresa, SOLO si ese maximo supera numericamente al contador actual.
--   - Filtra a numeros con formato 'RES-<digitos>' (no inventa desde otros).
--   - Guarda contra NULL/'': el contador vacio cuenta como 0.
-- ============================================================================
UPDATE public.empresas AS e
   SET ultima_reserva = 'RES-' || lpad(v.max_n::text, 6, '0')
  FROM (
    SELECT
      r.empresa_id,
      MAX(NULLIF(regexp_replace(r.numero, '[^0-9]', '', 'g'), '')::bigint) AS max_n
    FROM public.reservas AS r
    WHERE r.numero IS NOT NULL
      AND r.numero ~ '^RES-[0-9]+$'
    GROUP BY r.empresa_id
  ) AS v
 WHERE e.id = v.empresa_id
   AND v.max_n IS NOT NULL
   AND v.max_n > COALESCE(NULLIF(regexp_replace(COALESCE(e.ultima_reserva, ''), '[^0-9]', '', 'g'), '')::bigint, 0);

-- ============================================================================
-- SECCION 2 — VERIFICACION (SOLO LECTURA, BLOQUEANTE)
--   Falla si alguna empresa queda con ultima_reserva < max correlativo existente.
-- ============================================================================
DO $$
DECLARE
  r record;
  v_bad integer := 0;
BEGIN
  FOR r IN
    SELECT
      e.id,
      e.nombre,
      e.ultima_reserva,
      MAX(NULLIF(regexp_replace(x.numero, '[^0-9]', '', 'g'), '')::bigint) AS max_n
    FROM public.empresas e
    LEFT JOIN public.reservas x
      ON x.empresa_id = e.id AND x.numero ~ '^RES-[0-9]+$'
    GROUP BY e.id, e.nombre, e.ultima_reserva
  LOOP
    IF r.max_n IS NOT NULL
       AND COALESCE(NULLIF(regexp_replace(COALESCE(r.ultima_reserva, ''), '[^0-9]', '', 'g'), '')::bigint, 0) < r.max_n THEN
      v_bad := v_bad + 1;
      RAISE WARNING 'SYNC INCOMPLETA: empresa % (%) contador=% < max_existente=%',
        r.id, r.nombre, r.ultima_reserva, r.max_n;
    ELSE
      RAISE NOTICE 'empresa % (%) contador=% max_existente=%',
        r.id, r.nombre, r.ultima_reserva, r.max_n;
    END IF;
  END LOOP;

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'VERIFICACION FALLIDA: % empresa(s) con contador por debajo del maximo existente', v_bad;
  END IF;
  RAISE NOTICE 'VERIFICACION OK: ultima_reserva >= max correlativo existente por empresa';
END $$;

-- ============================================================================
-- SECCION 3 — INDICE UNICO (CONDICIONAL y NO destructivo)
--   Estado confirmado por migraciones: `sql/migracion_numeracion_atomica.sql`
--   (Seccion 4) crea `uq_reservas_empresa_numero` SOLO si no hay duplicados;
--   NO existe una migracion que lo garantice incondicionalmente. Por tanto el
--   indice PUEDE faltar. Esta seccion es la correccion minima: lo crea solo si
--   no hay duplicados; si los hay, NO borra nada y lo reporta para resolucion manual.
-- ============================================================================
DO $$
DECLARE
  v_dup integer;
BEGIN
  IF to_regclass('public.reservas') IS NULL THEN
    RAISE NOTICE 'Se OMITE uq_reservas_empresa_numero: la tabla public.reservas no existe';
    RETURN;
  END IF;

  SELECT count(*) INTO v_dup FROM (
    SELECT empresa_id, numero
      FROM public.reservas
     WHERE numero IS NOT NULL AND numero <> ''
     GROUP BY empresa_id, numero
    HAVING count(*) > 1
  ) d;

  IF v_dup = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reservas_empresa_numero
      ON public.reservas (empresa_id, numero)
      WHERE numero IS NOT NULL AND numero <> '';
    RAISE NOTICE 'uq_reservas_empresa_numero asegurado (0 duplicados)';
  ELSE
    RAISE NOTICE 'Se OMITE uq_reservas_empresa_numero: % combinacion(es) (empresa_id,numero) duplicadas; resolver antes de crearlo', v_dup;
  END IF;
END $$;

-- ============================================================================
-- FIN — Aplicar manualmente en PRUEBAS tras autorizacion.
-- ============================================================================
