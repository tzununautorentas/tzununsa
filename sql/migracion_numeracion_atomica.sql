-- ============================================================================
-- MIGRACION — NUMERACION ATOMICA DE CORRELATIVOS POR EMPRESA
-- ============================================================================
-- PROYECTO: PRUEBAS (eyojdedlxfgtcnvyqinr). PRODUCCION EXCLUIDA.
--
-- OBJETIVO
--   Eliminar el riesgo de correlativos duplicados al asignar numero a
--   cotizaciones/reservas (y facturas, por compatibilidad) mediante una RPC
--   que reserva el correlativo de forma ATOMICA por empresa.
--
-- PROBLEMA QUE RESUELVE
--   El flujo anterior (src/config.js -> siguienteNumero) hacia:
--     1) GET /empresas?select=ultima_*&id=eq.<empresa>
--     2) calculo en el cliente
--     3) PATCH /empresas?id=eq.<empresa>
--   Dos solicitudes concurrentes leian el mismo valor y asignaban el MISMO
--   correlativo (condicion de carrera). Ademas, el PATCH a `empresas` falla en
--   silencio para admin/usuario porque la RLS tz36_empresas_update solo permite
--   UPDATE a super_admin (FASE 3.6), de modo que el contador NUNCA avanzaba y se
--   seguian repitiendo numeros. El fallback con MAX(numero) tampoco es atomico.
--
-- SOLUCION
--   Una unica sentencia `UPDATE ... RETURNING` sobre la fila de la empresa
--   (bloqueo de fila implicito) que incrementa el contador de forma atomica.
--   Dos llamadas concurrentes se serializan sobre la misma fila y obtienen
--   correlativos distintos. La funcion valida la identidad (auth.uid()) y la
--   autorizacion por empresa antes de tocar el contador.
--
-- ALCANCE / SEGURIDAD
--   * NO elimina, renumera ni modifica registros historicos.
--   * NO ejecuta COMMIT ni ROLLBACK internos (una funcion plpgsql = una
--     sentencia; el llamador controla la transaccion).
--   * El nucleo `authz.siguiente_numero` es SECURITY DEFINER: necesario para
--     poder UPDATE `empresas` (RLS). La autorizacion se re-valida DENTRO con
--     auth.uid(); DEFINER NO salta el aislamiento entre empresas.
--   * El wrapper `public.api_siguiente_numero` es SECURITY INVOKER (patron
--     FASE 3.7: public.api_* INVOKER -> authz.* DEFINER). Solo delega; no
--     eleva privilegios por si mismo.
--   * search_path fijo en ambas funciones (anti-hijacking); el nucleo
--     privilegiado referencia public.empresas y authz.* de forma cualificada.
--   * REVOKE de PUBLIC y anon en ambas funciones; GRANT EXECUTE SOLO a
--     authenticated; USAGE sobre authz SOLO a authenticated (minimo requerido
--     por el wrapper INVOKER). anon no obtiene EXECUTE ni USAGE.
--
-- NOTA DE DISENO (patron FASE 3.7): `public.api_siguiente_numero` es
--   SECURITY INVOKER y solo delega en `authz.siguiente_numero` (SECURITY
--   DEFINER), que es el unico punto donde se ejecuta el incremento atomico con
--   privilegios elevados. La autorizacion se valida DENTRO del nucleo con
--   auth.uid(), de modo que DEFINER NO salta el aislamiento entre empresas.
--   El esquema `authz` NO esta en los schemas expuestos por PostgREST
--   (expuestos: public/graphql_public), por lo que el nucleo NO es invocable
--   como RPC desde la API; solo se alcanza via el wrapper publico.
--
-- APLICACION: MANUAL en el SQL Editor de PRUEBAS. NO se ejecuta automaticamente.
-- ============================================================================

-- ============================================================================
-- SECCION 1 — authz.siguiente_numero (nucleo atomico, SECURITY DEFINER)
--   Nucleo privilegiado. Valida identidad/autorizacion/modulo y ejecuta el
--   incremento atomico. No expuesto por PostgREST (schema authz no expuesto).
-- ============================================================================
CREATE OR REPLACE FUNCTION authz.siguiente_numero(
  p_modulo  text,
  p_empresa uuid
)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
DECLARE
  v_columna text;
  v_prefijo text;
  v_numero  text;
BEGIN
  -- Autorizacion explicita: super_admin O empresa en el conjunto autorizado
  -- (auth.uid() se resuelve desde el JWT aunque la funcion sea DEFINER).
  IF NOT (authz.es_super_admin() OR p_empresa IN (SELECT * FROM authz.empresas_autorizadas())) THEN
    RAISE EXCEPTION 'Sin autorizacion para asignar correlativos de esta empresa'
      USING ERRCODE = '42501', HINT = 'F3NUM_NO_AUTORIZADO';
  END IF;

  IF p_empresa IS NULL THEN
    RAISE EXCEPTION 'Empresa requerida para asignar el correlativo'
      USING ERRCODE = '22023', HINT = 'F3NUM_EMPRESA_REQUERIDA';
  END IF;

  -- Mapeo modulo -> columna contadora / prefijo. Los valores son constantes
  -- controladas por este CASE (nunca provienen de texto libre del cliente).
  CASE p_modulo
    WHEN 'cotizaciones' THEN v_columna := 'ultima_cotizacion'; v_prefijo := 'COT-';
    WHEN 'reservas'     THEN v_columna := 'ultima_reserva';    v_prefijo := 'RES-';
    WHEN 'facturas'     THEN v_columna := 'ultima_factura';    v_prefijo := 'FEL-';
    ELSE
      RAISE EXCEPTION 'Modulo no soportado para correlativos: %', p_modulo
        USING ERRCODE = '22023', HINT = 'F3NUM_MODULO_INVALIDO';
  END CASE;

  -- Incremento atomico: una sola sentencia; el UPDATE toma el bloqueo de fila
  -- y RETURNING devuelve el nuevo valor. Bajo READ COMMITTED los UPDATE
  -- concurrentes a la misma fila se serializan y el segundo recalcula sobre el
  -- valor ya confirmado por el primero (sin duplicados).
  --   formato: prefijo + 6 digitos con ceros a la izquierda (COT-000001),
  --   identico al formato previo del cliente.
  EXECUTE format(
    'UPDATE public.empresas
        SET %1$I = $1 || lpad(
              (COALESCE(NULLIF(regexp_replace(%1$I, ''[^0-9]'', '''', ''g''), ''''), ''0'')::bigint + 1)::text,
              6, ''0'')
      WHERE id = $2
      RETURNING %1$I',
    v_columna
  )
  INTO v_numero
  USING v_prefijo, p_empresa;

  IF v_numero IS NULL THEN
    RAISE EXCEPTION 'Empresa inexistente'
      USING ERRCODE = '22023', HINT = 'F3NUM_EMPRESA_INEXISTENTE';
  END IF;

  RETURN v_numero;
END;
$$;

-- ============================================================================
-- SECCION 2 — public.api_siguiente_numero (RPC expuesta por PostgREST)
--   SECURITY INVOKER + search_path fijo. No eleva privilegios: solo delega en
--   authz.siguiente_numero (la funcion privilegiada y autoritativa).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.api_siguiente_numero(
  p_modulo  text,
  p_empresa uuid
)
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT authz.siguiente_numero(p_modulo, p_empresa);
$$;

-- ============================================================================
-- SECCION 3 — Grants: modelo de privilegios minimo
--   * El wrapper INVOKER requiere, en el rol `authenticated`:
--       - USAGE sobre el esquema authz (para resolver authz.siguiente_numero);
--       - EXECUTE sobre authz.siguiente_numero (nucleo);
--       - EXECUTE sobre public.api_siguiente_numero (RPC).
--     (GRANT USAGE idempotente: FASE 3.7 ya lo concede para sus wrappers.)
--   * `anon`: SIN EXECUTE en ambas funciones y SIN USAGE en authz.
--   * `PUBLIC`: sin EXECUTE (REVOKE explicito en ambas).
-- ============================================================================
REVOKE ALL ON SCHEMA authz FROM PUBLIC;
REVOKE ALL ON SCHEMA authz FROM anon;
GRANT USAGE ON SCHEMA authz TO authenticated;

REVOKE ALL ON FUNCTION authz.siguiente_numero(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION authz.siguiente_numero(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION authz.siguiente_numero(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.api_siguiente_numero(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.api_siguiente_numero(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.api_siguiente_numero(text, uuid) TO authenticated;

-- ============================================================================
-- SECCION 4 — Unicidad por (empresa_id, numero) — OPCIONAL y NO destructiva
--   Solo crea el indice si NO existen duplicados. Si existen, se omite y se
--   reporta con NOTICE (no borra, no renumera, no aborta la migracion).
--   Los indices excluyen numero NULL/vacio.
-- ============================================================================
DO $$
DECLARE
  v_dup integer;
BEGIN
  IF to_regclass('public.cotizaciones') IS NOT NULL THEN
    SELECT count(*) INTO v_dup FROM (
      SELECT empresa_id, numero
        FROM public.cotizaciones
       WHERE numero IS NOT NULL AND numero <> ''
       GROUP BY empresa_id, numero
      HAVING count(*) > 1
    ) d;
    IF v_dup = 0 THEN
      CREATE UNIQUE INDEX IF NOT EXISTS uq_cotizaciones_empresa_numero
        ON public.cotizaciones (empresa_id, numero)
        WHERE numero IS NOT NULL AND numero <> '';
      RAISE NOTICE 'uq_cotizaciones_empresa_numero disponible (0 duplicados)';
    ELSE
      RAISE NOTICE 'Se OMITE uq_cotizaciones_empresa_numero: % combinacion(es) (empresa_id,numero) duplicadas', v_dup;
    END IF;
  ELSE
    RAISE NOTICE 'Se OMITE uq_cotizaciones_empresa_numero: la tabla public.cotizaciones no existe';
  END IF;

  IF to_regclass('public.reservas') IS NOT NULL THEN
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
      RAISE NOTICE 'uq_reservas_empresa_numero disponible (0 duplicados)';
    ELSE
      RAISE NOTICE 'Se OMITE uq_reservas_empresa_numero: % combinacion(es) (empresa_id,numero) duplicadas', v_dup;
    END IF;
  ELSE
    RAISE NOTICE 'Se OMITE uq_reservas_empresa_numero: la tabla public.reservas no existe';
  END IF;
END $$;

-- ============================================================================
-- SECCION 5 — Verificacion (bloqueante). Se ejecuta tras crear/grantar.
-- ============================================================================
DO $$
DECLARE
  v_def boolean;
BEGIN
  IF to_regprocedure('public.api_siguiente_numero(text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'VERIFICACION: falta public.api_siguiente_numero(text,uuid)';
  END IF;
  IF to_regprocedure('authz.siguiente_numero(text,uuid)') IS NULL THEN
    RAISE EXCEPTION 'VERIFICACION: falta authz.siguiente_numero(text,uuid)';
  END IF;

  -- El wrapper NO debe elevar privilegios por si mismo: se exige INVOKER.
  SELECT prosecdef INTO v_def
    FROM pg_proc
   WHERE oid = 'public.api_siguiente_numero(text,uuid)'::regprocedure;
  IF v_def IS TRUE THEN
    RAISE EXCEPTION 'VERIFICACION: public.api_siguiente_numero debe ser SECURITY INVOKER';
  END IF;

  -- El nucleo es el unico punto privilegiado: se exige DEFINER.
  SELECT prosecdef INTO v_def
    FROM pg_proc
   WHERE oid = 'authz.siguiente_numero(text,uuid)'::regprocedure;
  IF v_def IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VERIFICACION: authz.siguiente_numero debe ser SECURITY DEFINER';
  END IF;

  -- anon: sin EXECUTE en ninguna funcion ni USAGE en authz.
  IF has_function_privilege('anon', 'public.api_siguiente_numero(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'VERIFICACION: anon NO debe tener EXECUTE en public.api_siguiente_numero';
  END IF;
  IF has_function_privilege('anon', 'authz.siguiente_numero(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'VERIFICACION: anon NO debe tener EXECUTE en authz.siguiente_numero';
  END IF;
  IF has_schema_privilege('anon', 'authz', 'USAGE') THEN
    RAISE EXCEPTION 'VERIFICACION: anon NO debe tener USAGE en el esquema authz';
  END IF;

  -- authenticated: minimo para que el wrapper INVOKER pueda delegar.
  IF NOT has_schema_privilege('authenticated', 'authz', 'USAGE') THEN
    RAISE EXCEPTION 'VERIFICACION: authenticated requiere USAGE en authz (wrapper INVOKER)';
  END IF;
  IF NOT has_function_privilege('authenticated', 'authz.siguiente_numero(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'VERIFICACION: authenticated requiere EXECUTE en authz.siguiente_numero (wrapper INVOKER)';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.api_siguiente_numero(text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'VERIFICACION: authenticated requiere EXECUTE en public.api_siguiente_numero';
  END IF;

  RAISE NOTICE 'VERIFICACION OK: wrapper INVOKER + nucleo DEFINER; authenticated con USAGE/EXECUTE minimo; anon sin acceso';
END $$;

-- ============================================================================
-- FIN — Aplicar manualmente en PRUEBAS. No hay COMMIT/ROLLBACK en este archivo.
-- ============================================================================
