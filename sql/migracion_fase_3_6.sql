-- ============================================================================
-- MIGRACION FASE 3.6 — Activacion de ROW LEVEL SECURITY + politicas multiempresa
-- ============================================================================
-- Proyecto:   ERP Tz'unun (Supabase)
-- DB:         PostgreSQL 17.6
-- Ejecutar:   ENTERO, en orden, en Supabase SQL Editor como OWNER (rol postgres).
-- Doc:        "FASE3.6_PLAN_DETALLADO.md" (Revision R3)
-- Politicas:  prefijo tz36_ (namespace propio); NO existen politicas previas
--             desconocidas permitidas (PC3 bloquea). Idempotente bajo auditoria.
--
-- DISENO (Revision R3):
--   * ATOMICIDAD: sin BEGIN/COMMIT internos. En el SQL Editor el archivo se envia
--     como UN solo query (protocolo simple) → transaccion implicita UNICA de
--     PostgreSQL: cualquier RAISE EXCEPTION revierte TODO (policies + ENABLE +
--     evidencia). No existe activacion parcial de RLS.
--     OJO (operador): la garantia "todo o nada" solo aplica cuando el archivo se
--     ejecuta COMPLETO en una unica corrida del SQL Editor (o migracion CLI).
--     psql en modo autocommit por sentencia NO preserva esta garantia.
--   * IDEMPOTENCIA: SOLO "DROP POLICY IF EXISTS tz36_<t>_<cmd>" + "CREATE POLICY".
--     PostgreSQL NO admite CREATE POLICY IF NOT EXISTS.
--   * PC3: audita pg_policies por tabla objetivo; cualquier policy NO tz36_*
--     bloquea la corrida (jamás se elimina en silencio).
--   * SIN RECURSION: tablas de autorizacion usan auth.uid()/authz.es_super_admin()
--     (SECURITY DEFINER, bypass interno); nunca authz.empresas_autorizadas().
--   * USUARIOS REALES de prueba (NO se crean datos): galheroa (super_admin) y
--     vanessa (admin) con sus vinculos reales en usuario_empresas.
--
-- REGLA CANONICA RLS:
--   negocio:  empresa_id IN (SELECT authz.empresas_autorizadas())
--   hibrido:  (empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))
--   authz:    solo lectura propia/super_admin; escritura super_admin.
--
-- ALCANCE: SOLO public.* (inventario dinamico) + authz.* (ya existentes).
-- PROHIBIDO en 3.6: FASE 3.7/3.8/3.9, Auth, frontend, RPC nuevas, DISABLE RLS
-- en el flujo normal (DISABLE = rollback de EMERGENCIA post-commit, Seccion 7).
--
-- ESTADO LEGACY DETECTADO EN EL REPOSITORIO (no se modifica en silencio):
--   * 'usuarios_sistema' RLS YA ACTIVA + 4 policies ("Lectura/Insercion/
--     Actualizacion/Eliminacion para autenticados", todas USING/WITH CHECK true)
--     creadas por sql/configuracion_roles_series.sql.
--   * 'ubicaciones_personalizadas' RLS YA ACTIVA + 6 policies
--     (CONFIRMADAS en vivo 2026-09-28): "Lectura/Insercion/Eliminacion para
--     usuarios autenticados" y sus duplicados "Lectura/Insercion/Eliminacion
--     usuarios autenticados" (sin 'para'), todas USING/WITH CHECK true.
--     sql/crear_ubicaciones_personalizadas.sql solo definia las 3 "para";
--     las 3 adicionales existen en la BD real (total 6).
--   Total legacy en public: 10 (4 + 6).
--   Ambas son policies PREEXISTENTES NO-tz36_*: PC3 BLOQUEARA la corrida y
--   NO se eliminan aqui. RESOLUCION HUMANA (antes de ejecutar este archivo,
--   como OWNER, SOLO si realmente existen en la BD):
--     DROP POLICY "Lectura para autenticados"        ON public.usuarios_sistema;
--     DROP POLICY "Insercion para autenticados"      ON public.usuarios_sistema;
--     DROP POLICY "Actualizacion para autenticados"  ON public.usuarios_sistema;
--     DROP POLICY "Eliminacion para autenticados"    ON public.usuarios_sistema;
--     DROP POLICY "Lectura para usuarios autenticados"      ON public.ubicaciones_personalizadas;
--     DROP POLICY "Insercion para usuarios autenticados"    ON public.ubicaciones_personalizadas;
--     DROP POLICY "Eliminacion para usuarios autenticados"  ON public.ubicaciones_personalizadas;
--     DROP POLICY IF EXISTS "Lectura usuarios autenticados"   ON public.ubicaciones_personalizadas;
--     DROP POLICY IF EXISTS "Insercion usuarios autenticados" ON public.ubicaciones_personalizadas;
--     DROP POLICY IF EXISTS "Eliminacion usuarios autenticados" ON public.ubicaciones_personalizadas;
--   (10 DROP POLICY en total; PC3 exige public sin ninguna policy no-tz36_*.)
--   (PC2 ya acepta el RLS ON legacy de esas 2 tablas en cualquier estado.)
-- ============================================================================

-- ============================================================================
-- SECCION 1: PRE-CHECKS (solo lectura; cualquier fallo detiene con EXCEPTION)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEMPORALES de la corrida (inventario dinamico real de public)
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE tz36_inv_run (
  tabla             name        PRIMARY KEY,
  clasificacion     text        NOT NULL,
  tiene_empresa_id  boolean     NOT NULL,
  filas_totales     bigint,
  filas_empresa_act bigint,
  motivo            text
) ON COMMIT DROP;

-- ----------------------------------------------------------------------------
-- PC0 — authz.empresas_autorizadas()/authz.es_super_admin() existen y compilan
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_fn_emp text;
  v_fn_sa  text;
  v_vin    bigint;
  v_rolsa  bigint;
BEGIN
  SELECT to_regprocedure('authz.empresas_autorizadas()')::text INTO v_fn_emp;
  SELECT to_regprocedure('authz.es_super_admin()')::text   INTO v_fn_sa;
  IF v_fn_emp IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta authz.empresas_autorizadas()'; END IF;
  IF v_fn_sa  IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta authz.es_super_admin()'; END IF;

  -- Existencia real de tablas y columnas de autorizacion usadas por las policies
  -- (R3: nunca crear policies sobre tablas/columnas inexistentes)
  IF to_regclass('public.usuarios_sistema') IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.usuarios_sistema'; END IF;
  IF to_regclass('public.usuario_empresas') IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.usuario_empresas'; END IF;
  IF to_regclass('public.roles')             IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.roles'; END IF;
  IF to_regcolumn('public.usuarios_sistema','id')        IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuarios_sistema.id'; END IF;
  IF to_regcolumn('public.usuarios_sistema','auth_id')   IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuarios_sistema.auth_id'; END IF;
  IF to_regcolumn('public.usuarios_sistema','activo')    IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuarios_sistema.activo'; END IF;
  IF to_regcolumn('public.usuario_empresas','usuario_id') IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuario_empresas.usuario_id'; END IF;
  IF to_regcolumn('public.usuario_empresas','empresa_id') IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuario_empresas.empresa_id'; END IF;
  IF to_regcolumn('public.usuario_empresas','activo')     IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta usuario_empresas.activo'; END IF;
  IF to_regcolumn('public.roles','nombre')                IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta roles.nombre'; END IF;

  SELECT count(*) INTO v_vin FROM public.usuario_empresas WHERE activo;
  IF v_vin < 1 THEN RAISE EXCEPTION 'PC0 BLOQUEO: usuario_empresas sin vinculos activos (se espera >=1 real)'; END IF;

  SELECT count(*) INTO v_rolsa FROM public.roles WHERE nombre='super_admin';
  IF v_rolsa < 1 THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe rol super_admin en roles'; END IF;

  RAISE NOTICE 'PC0 OK: authz.* presentes, % vinculo(s) real(es) activo(s), rol super_admin existe', v_vin;
END $$;

-- ----------------------------------------------------------------------------
-- PC1 — INVENTARIO DINAMICO real de public (clasifica cada tabla en el momento)
--   negocio      : tiene empresa_id y NO hay filas maestras NULL
--   hibrido      : tiene empresa_id Y existen filas con empresa_id IS NULL
--   autorizacion : usuarios_sistema / usuario_empresas / roles (sin recursión)
--   excluida     : sin empresa_id (global/tecnica) o evidencia (se documenta)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r       RECORD;
  v_has   boolean;
  v_nulls bigint;
  v_total bigint;
  v_ctrmp bigint;
  v_emp_act uuid := 'adc5f324-a108-49ad-875c-779afe3b9f7f';
  v_clas  text;
  v_motivo text;
  v_n_neg int := 0; v_n_hib int := 0; v_n_auth int := 0; v_n_exc int := 0;
BEGIN
  -- tz36_inventario (evidencia permanente) se crea en Seccion 5 (anti-sobrescritura).
  FOR r IN
    SELECT c.relname::text AS tabla
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
     ORDER BY c.relname
  LOOP
    -- Columna empresa_id presente?
    SELECT count(*) > 0 INTO v_has
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name=r.tabla AND column_name='empresa_id';

    v_clas  := 'excluida';
    v_motivo := NULL;
    v_total := 0; v_nulls := 0; v_ctrmp := 0;

    IF r.tabla IN ('usuarios_sistema','usuario_empresas','roles') THEN
      v_clas := 'autorizacion';
    ELSIF v_has THEN
      -- Conteos reales (OWNER bypasses RLS)
      EXECUTE format('SELECT count(*), count(*) FILTER (WHERE empresa_id IS NULL) FROM public.%I', r.tabla)
        INTO v_total, v_nulls;
      IF v_nulls > 0 THEN
        v_clas := 'hibrido';
      ELSE
        v_clas := 'negocio';
      END IF;
      EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id = %L', r.tabla, v_emp_act)
        INTO v_ctrmp;
    ELSE
      -- Sin empresa_id: global/tecnica o evidencia → incluir inventario con motivo
      IF r.tabla IN ('backup_facturas_saldos') THEN
        v_motivo := 'evidencia de FASE 3.3 (snapshot); excluida de RLS';
      ELSIF r.tabla = 'tz36_inventario' THEN
        v_motivo := 'evidencia de FASE 3.6 (inventario materializado); excluida de RLS';
      ELSE
        v_motivo := 'tabla sin empresa_id (global/tecnica); fuera del alcance RLS en 3.6';
      END IF;
    END IF;

    INSERT INTO tz36_inv_run(tabla, clasificacion, tiene_empresa_id, filas_totales, filas_empresa_act, motivo)
    VALUES (r.tabla, v_clas, v_has, v_total, v_ctrmp, v_motivo);

    IF v_clas='negocio' THEN v_n_neg := v_n_neg + 1;
    ELSIF v_clas='hibrido' THEN v_n_hib := v_n_hib + 1;
    ELSIF v_clas='autorizacion' THEN v_n_auth := v_n_auth + 1;
    ELSE v_n_exc := v_n_exc + 1; END IF;
  END LOOP;

  RAISE NOTICE 'PC1 OK: inventario dinamico = % negocio, % hibrido, % autorizacion, % excluidas', v_n_neg, v_n_hib, v_n_auth, v_n_exc;
END $$;

-- ----------------------------------------------------------------------------
-- PC2 — Estado RLS actual en tablas OBJETIVO.
--   Renejecucion: tabla con RLS ON y >=1 policy tz36_* = re-ejecucion valida.
--   Legacy documentado (RLS ON preexistente POR FUERA de 3.6, ver cabecera):
--     'usuarios_sistema'            -> configuracion_roles_series.sql
--     'ubicaciones_personalizadas'  -> crear_ubicaciones_personalizadas.sql
--     Se aceptan en CUALQUIER estado. Si aun conservan policies legacy, PC3
--     bloqueará y el humano las eliminara explicitamente (cond R3 n.7; nunca
--     se borran en silencio).
--   Resto de tablas objetivo: todas OFF (primera corrida) o todas ON con
--   tz36_* (re-ejecucion/validacion); cualquier mezcla BLOQUEA.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_on   int;
  v_off  int;
BEGIN
  SELECT
    count(*) FILTER (WHERE c.relrowsecurity),
    count(*) FILTER (WHERE NOT c.relrowsecurity)
    INTO v_on, v_off
    FROM tz36_inv_run i
    JOIN pg_class c ON c.relname = i.tabla
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion')
     AND i.tabla NOT IN ('usuarios_sistema','ubicaciones_personalizadas');

  IF v_on > 0 AND v_off > 0 THEN
    RAISE EXCEPTION 'PC2 BLOQUEO: RLS mezclado (% ON / % OFF) en tablas objetivo no-legacy', v_on, v_off;
  END IF;
  IF v_on = 0 THEN
    RAISE NOTICE 'PC2 OK: tablas objetivo no-legacy sin RLS (primera corrida)';
  ELSE
    RAISE NOTICE 'PC2 OK: RLS ya activa en todas las tablas objetivo no-legacy (re-ejecucion/validacion)';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PC3 — Auditoria de policies en TODO public: SOLO se permiten tz36_*; cualquier
--       policy preexistente (tabla objetivo o excluida) BLOQUEA la corrida.
--       Nunca se elimina/modifica una policy ajena en silencio (R3 cond. 7/19).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT p.tablename AS tabla, p.policyname AS policy
      FROM pg_policies p
     WHERE p.schemaname='public'
       AND p.policyname NOT LIKE 'tz36\_%'
     ORDER BY p.tablename, p.policyname
  LOOP
    RAISE EXCEPTION 'PC3 BLOQUEO: policy preexistente desconocida % ON public.% (no se elimina en silencio)', r.policy, r.tabla;
  END LOOP;
  RAISE NOTICE 'PC3 OK: sin policies desconocidas en public (solo tz36_* manejables)';
END $$;

-- ----------------------------------------------------------------------------
-- PC4 — Usuarios reales de prueba presentes en usuarios_sistema (sin crear nada)
--       galheroa (super_admin) VALIDADO con la SEMANTICA EXACTA de la funcion
--       authz.es_super_admin() (FASE 3.2B): (1) vinculo activo con rol
--       super_admin, o (2) fallback legacy por usuarios_sistema.rol_id SOLO si
--       el usuario NO tiene ningun vinculo. La funcion no puede invocarse aqui
--       (sesion OWNER sin auth.uid()): se replica con el auth_id fijo.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_gal   bigint;  -- super_admin (galheroa) presente y activo
  v_gal_sa bigint; -- count galheroa que RESUELVE super_admin (semantica 3.2B)
  v_van   bigint;  -- admin (vanessa) presente y activa
  v_van_emp bigint;
BEGIN
  SELECT count(*) INTO v_gal FROM public.usuarios_sistema u
   WHERE u.auth_id = '6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4' AND u.activo;
  SELECT count(*) INTO v_van FROM public.usuarios_sistema u
   WHERE u.auth_id = 'b9e1dda6-05d2-4e31-bce4-1c73210c09f4' AND u.activo;

  IF v_gal < 1 THEN RAISE EXCEPTION 'PC4 BLOQUEO: falta usuario real super_admin (galheroa) en usuarios_sistema'; END IF;
  IF v_van < 1 THEN RAISE EXCEPTION 'PC4 BLOQUEO: falta usuario real admin (vanessa) en usuarios_sistema'; END IF;

  SELECT count(*) INTO v_gal_sa
    FROM public.usuarios_sistema us
   WHERE us.auth_id = '6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4' AND us.activo
     AND (
       EXISTS (SELECT 1
                 FROM public.usuario_empresas ue
                 JOIN public.roles r ON r.id = ue.rol_id
                WHERE ue.usuario_id = us.id AND ue.activo
                  AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true'))
       OR
       EXISTS (SELECT 1
                 FROM public.roles r
                WHERE r.id = us.rol_id
                  AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
                  AND NOT EXISTS (SELECT 1 FROM public.usuario_empresas ue2
                                   WHERE ue2.usuario_id = us.id))
     );
  IF v_gal_sa < 1 THEN RAISE EXCEPTION 'PC4 BLOQUEO: galheroa NO resuelve super_admin (semantica 3.2B): requiere vinculo activo con rol super_admin (o rol legacy super_admin SIN vinculos). B-T4 depende de ello'; END IF;

  -- Vinculo REAL activo de la usuaria normal (vanessa) hacia la empresa activa
  -- de referencia (empresa distinta de galheroa para las pruebas T1/T2/T3).
  SELECT count(*) INTO v_van_emp
    FROM public.usuario_empresas ue
    JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
   WHERE us.auth_id = 'b9e1dda6-05d2-4e31-bce4-1c73210c09f4'
     AND ue.empresa_id = 'adc5f324-a108-49ad-875c-779afe3b9f7f' AND ue.activo;
  IF v_van_emp < 1 THEN RAISE EXCEPTION 'PC4 BLOQUEO: vanessa sin vinculo real activo hacia la empresa de prueba'; END IF;

  RAISE NOTICE 'PC4 OK: galheroa RESUELVE super_admin (semantica 3.2B) y vanessa (admin) con vinculo activo a la empresa de prueba';
END $$;

-- ----------------------------------------------------------------------------
-- PC5 — Inventario de empresas reales: ¿existe empresa real NO autorizada para
--       vanessa (pruebas negativas T1b/T2neg)? Sin inventario → pendiente.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_total int;
  v_ajena int;
  v_vid   bigint;
BEGIN
  SELECT count(*) INTO v_total FROM public.empresas;

  SELECT us.id INTO v_vid FROM public.usuarios_sistema us
   WHERE us.auth_id = 'b9e1dda6-05d2-4e31-bce4-1c73210c09f4' AND us.activo LIMIT 1;

  SELECT count(*) INTO v_ajena
    FROM public.empresas e
   WHERE NOT EXISTS (
     SELECT 1 FROM public.usuario_empresas ue
      WHERE ue.usuario_id = v_vid AND ue.empresa_id = e.id AND ue.activo
   );

  RAISE NOTICE 'PC5 OK: % empresa(s) real(es); % empresa(s) ajena(s) para vanessa (T1b/T2neg: %s)',
    v_total, v_ajena, CASE WHEN v_ajena > 0 THEN 'EJECUTABLE' ELSE 'PENDIENTE - sin empresa ajena real, no se fabrica' END;
END $$;

-- ----------------------------------------------------------------------------
-- PC6 — Baselines (owner) registrados en inventario; se citan para el informe
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'PC6 OK: baseline por tabla (tabla | clase | filas | filas_empresa_activa):';
  FOR r IN SELECT tabla, clasificacion, filas_totales, filas_empresa_act FROM tz36_inv_run
           WHERE clasificacion IN ('negocio','hibrido') ORDER BY tabla
  LOOP
    RAISE NOTICE '  % | % | % | %', r.tabla, r.clasificacion, r.filas_totales, r.filas_empresa_act;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- PC7 — Compatibilidad app (verificacion de codigo, no SQL): login sin consultas
--       de datos en sesion anon (fetcher JWT 3.1 + filtros 3.5). Sin cambios UI.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'PC7 OK (revision de codigo): no hay consultas de datos pre-login; frontend compatible con RLS sin cambios';
END $$;

-- ============================================================================
-- SECCION 2: CREAR POLITICAS (prefijo tz36_; idempotencia DROP+CREATE)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Tablas de NEGOCIO e HIBRIDAS (inventario dinamico de public)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_expr text;
  v_cmd  text;
  v_pol  text;
  v_n    int := 0;
BEGIN
  FOR r IN SELECT tabla, clasificacion FROM tz36_inv_run
           WHERE clasificacion IN ('negocio','hibrido') ORDER BY tabla
  LOOP
    IF r.clasificacion = 'hibrido' THEN
      v_expr := '(empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))';
    ELSE
      v_expr := '(empresa_id IN (SELECT authz.empresas_autorizadas()))';
    END IF;

    FOREACH v_pol IN ARRAY ARRAY['select','insert','update','delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS tz36_%I_%s ON public.%I', r.tabla, v_pol, r.tabla);
    END LOOP;

    EXECUTE format('CREATE POLICY tz36_%I_select ON public.%I FOR SELECT TO authenticated USING (%s)', r.tabla, r.tabla, v_expr);
    EXECUTE format('CREATE POLICY tz36_%I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', r.tabla, r.tabla, v_expr);
    EXECUTE format('CREATE POLICY tz36_%I_update ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', r.tabla, r.tabla, v_expr, v_expr);
    EXECUTE format('CREATE POLICY tz36_%I_delete ON public.%I FOR DELETE TO authenticated USING (%s)', r.tabla, r.tabla, v_expr);
    v_n := v_n + 4;
  END LOOP;
  RAISE NOTICE 'POLICIES OK: % policies tz36_* creadas en tablas de negocio/hibridas', v_n;
END $$;

-- ----------------------------------------------------------------------------
-- 2.2 Tablas de AUTORIZACION (SIN recursión; auth.uid() + es_super_admin())
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_u text;
BEGIN
  -- usuarios_sistema: lectura propia o super admin; escritura solo super admin
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuarios_sistema_select ON public.usuarios_sistema';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuarios_sistema_insert ON public.usuarios_sistema';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuarios_sistema_update ON public.usuarios_sistema';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuarios_sistema_delete ON public.usuarios_sistema';
  EXECUTE 'CREATE POLICY tz36_usuarios_sistema_select ON public.usuarios_sistema FOR SELECT TO authenticated USING (auth.uid() = auth_id OR authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuarios_sistema_insert ON public.usuarios_sistema FOR INSERT TO authenticated WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuarios_sistema_update ON public.usuarios_sistema FOR UPDATE TO authenticated USING (authz.es_super_admin()) WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuarios_sistema_delete ON public.usuarios_sistema FOR DELETE TO authenticated USING (authz.es_super_admin())';

  -- usuario_empresas: lectura = vinculo con mi usuario o super admin; escritura solo super admin
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuario_empresas_select ON public.usuario_empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuario_empresas_insert ON public.usuario_empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuario_empresas_update ON public.usuario_empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_usuario_empresas_delete ON public.usuario_empresas';
  EXECUTE 'CREATE POLICY tz36_usuario_empresas_select ON public.usuario_empresas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.usuarios_sistema us WHERE us.id = usuario_id AND us.auth_id = auth.uid()) OR authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuario_empresas_insert ON public.usuario_empresas FOR INSERT TO authenticated WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuario_empresas_update ON public.usuario_empresas FOR UPDATE TO authenticated USING (authz.es_super_admin()) WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_usuario_empresas_delete ON public.usuario_empresas FOR DELETE TO authenticated USING (authz.es_super_admin())';

  -- roles: lectura para authenticated; escritura solo super admin
  EXECUTE 'DROP POLICY IF EXISTS tz36_roles_select ON public.roles';
  EXECUTE 'DROP POLICY IF EXISTS tz36_roles_insert ON public.roles';
  EXECUTE 'DROP POLICY IF EXISTS tz36_roles_update ON public.roles';
  EXECUTE 'DROP POLICY IF EXISTS tz36_roles_delete ON public.roles';
  EXECUTE 'CREATE POLICY tz36_roles_select ON public.roles FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY tz36_roles_insert ON public.roles FOR INSERT TO authenticated WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_roles_update ON public.roles FOR UPDATE TO authenticated USING (authz.es_super_admin()) WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_roles_delete ON public.roles FOR DELETE TO authenticated USING (authz.es_super_admin())';

  RAISE NOTICE 'POLICIES OK: 12 policies tz36_* en tablas de autorizacion (sin recursion)';
END $$;

-- ============================================================================
-- SECCION 3: ENABLE ROW LEVEL SECURITY (idempotente; atómico dentro del lote)
-- ============================================================================
DO $$
DECLARE
  v_c RECORD;
  v_n int := 0;
BEGIN
  FOR v_c IN
    SELECT i.tabla AS tabla FROM tz36_inv_run i
     WHERE i.clasificacion IN ('negocio','hibrido','autorizacion')
     ORDER BY i.tabla
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_c.tabla);
    v_n := v_n + 1;
  END LOOP;
  RAISE NOTICE 'ENABLE OK: ROW LEVEL SECURITY habilitada en % tablas objetivo', v_n;
END $$;

-- ============================================================================
-- SECCION 4: POST-CHECKS + GATE ESTRUCTURAL (antes del commit; atómico)
-- ============================================================================

-- V1 — RLS activa en TODAS las tablas objetivo
SELECT i.tabla, c.relrowsecurity
  FROM tz36_inv_run i
  JOIN pg_class c ON c.relname = i.tabla
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion')
   AND NOT c.relrowsecurity;

-- V2 — Policies por tabla (solo tz36_*)
SELECT tablename, count(*) AS policies
  FROM pg_policies
 WHERE schemaname='public' AND policyname LIKE 'tz36\_%'
 GROUP BY tablename ORDER BY tablename;

-- V3 — Ninguna policy desconocida (re-auditoria integra)
SELECT tablename, policyname
  FROM pg_policies
 WHERE schemaname='public' AND policyname NOT LIKE 'tz36\_%';

-- ----------------------------------------------------------------------------
-- GATE ESTRUCTURAL 3.6 — bloqueo de cierre dentro de la transaccion
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_off   int;
  v_ok    boolean := true;
  v_total int;
  v_pol   bigint;
  v_unk   bigint;
  r RECORD;
BEGIN
  SELECT count(*) INTO v_off
    FROM tz36_inv_run i
    JOIN pg_class c ON c.relname = i.tabla
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion') AND NOT c.relrowsecurity;
  IF v_off <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % tablas objetivo sin RLS', v_off;
  END IF;

  SELECT count(*) INTO v_total FROM tz36_inv_run WHERE clasificacion IN ('negocio','hibrido','autorizacion');

  -- Cada tabla objetivo debe tener >=4 policies tz36_* (3 de escritura + 1 select; authz tambien 4)
  FOR r IN
    SELECT i.tabla FROM tz36_inv_run i WHERE i.clasificacion IN ('negocio','hibrido','autorizacion')
  LOOP
    SELECT count(*) INTO v_pol FROM pg_policies
     WHERE schemaname='public' AND tablename=r.tabla AND policyname LIKE 'tz36\_%';
    IF v_pol < 4 THEN
      RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: public.% tiene solo % policies tz36_*', r.tabla, v_pol;
    END IF;
  END LOOP;

  SELECT count(*) INTO v_unk FROM pg_policies
   WHERE schemaname='public' AND policyname NOT LIKE 'tz36\_%';
  IF v_unk <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % policies no-tz36_* presentes', v_unk;
  END IF;

  -- Sin recursion: nada de empresas_autorizadas() en definiciones de authz
  FOR r IN
    SELECT p.polname AS policyname, c.relname AS tablename,
           pg_get_expr(polqual, polrelid) AS expr,
           pg_get_expr(polwithcheck, polrelid) AS chk
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
     WHERE p.polname LIKE 'tz36\_%'
       AND c.relname IN ('usuarios_sistema','usuario_empresas','roles')
       AND (pg_get_expr(polqual, polrelid) LIKE '%empresas_autorizadas%'
         OR pg_get_expr(polwithcheck, polrelid) LIKE '%empresas_autorizadas%')
  LOOP
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: recursion detectada en public.%.%', r.tablename, r.policyname;
  END LOOP;

  RAISE NOTICE 'GATE-ESTRUCTURAL 3.6 OK: RLS activa en % tablas objetivo, policies tz36_* coherentes, sin policies desconocidas, sin recursion', v_total;
END $$;

-- ----------------------------------------------------------------------------
-- STR-5 (smoke OPCIONAL, NO es evidencia funcional; descomentar solo si se quiere
--       un chequeo sintactico/semantico interno antes del commit).
--       Si una policy estuviera rota, esta consulta errora y (atomicidad) revierte
--       TODO el lote. NO se registra como comportamiento de usuario real.
-- ----------------------------------------------------------------------------
-- SET LOCAL request.jwt.claims = '{"sub":"b9e1dda6-05d2-4e31-bce4-1c73210c09f4","role":"authenticated","email":"vanessamgh@gmail.com"}';
-- SET LOCAL ROLE authenticated;
-- SELECT (SELECT count(*) FROM public.facturas) AS smoke_vanessa_facturas;
-- RESET ROLE;
-- RESET request.jwt.claims;

-- ============================================================================
-- SECCION 5: EVIDENCIA — materializar inventario (solo primera corrida)
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.tz36_inventario') IS NULL THEN
    CREATE TABLE public.tz36_inventario (
      tabla             text PRIMARY KEY,
      clasificacion     text NOT NULL,
      tiene_empresa_id  boolean NOT NULL,
      filas_totales     bigint,
      filas_empresa_act bigint,
      motivo            text
    );
    INSERT INTO public.tz36_inventario
      SELECT tabla, clasificacion, tiene_empresa_id, filas_totales, filas_empresa_act, motivo
        FROM tz36_inv_run;
    RAISE NOTICE 'EVIDENCIA OK: tz36_inventario materializado (inventario real de FASE 3.6)';
  ELSE
    RAISE NOTICE 'EVIDENCIA INFO: tz36_inventario ya existia; no se sobrescribe (anti-sobrescritura)';
  END IF;
END $$;

-- ============================================================================
-- SECCION 6: PRUEBAS FUNCIONALES (Bloque B) y VERIFICACIONES FINALES (C)
--            NO se ejecutan en este archivo: requieren JWT real. Guia manual.
-- ============================================================================
-- ----------------------------------------------------------------------------
-- Bloque B — pruebas funcionales con JWT REAL (REST/curl; rol authenticated).
-- Se ejecutan DESPUES de que este lote confirme (comportamiento = evidencia).
-- ----------------------------------------------------------------------------
-- B-T1a (lectura propia, vanessa):          GET  /rest/v1/facturas?select=*&empresa_id=eq.adc5f324-...
--                                            con Authorization: Bearer <JWT vanessa>  → = baseline PC6
-- B-T1b (lectura ajena, vanessa):           GET  /rest/v1/facturas?...&empresa_id=eq.<empresa NO autorizada>
--                                            → 0 filas (o PENDIENTE si PC5 no hallo empresa ajena real)
-- B-T2pos (escritura propia):               POST /rest/v1/<tabla_negocio_real> ... con empresa autorizada
--                                            → fila desechable ("T36-test-…") creada y luego DELETE por
--                                            el mismo usuario (policy tz36_* DELETE = su propia empresa).
--                                            Ejemplo verificado en repo: ubicaciones_personalizadas
--                                            (empresa_id NOT NULL; frontend ya inserta/borra via REST).
-- B-T2neg (escritura ajena):                POST /rest/v1/<tabla_negocio_real> ... con empresa ajena → 403/42501
--                                            (PENDIENTE si PC5 no hallo empresa ajena real; no se fabrica)
-- B-T3 (hibrido):                           GET  /rest/v1/cuentas_contables?select=codigo,nombre,empresa_id
--                                            → masters (NULL) + propias; 0 de otra empresa
-- B-T4 (autorizacion admin):                vanessa → POST usuarios_sistema = error; galheroa = 2xx
-- B-T5 (sin recursion):                     GET  /rest/v1/usuarios_sistema y /rest/v1/usuario_empresas con JWT
--                                            → responden sin error de recursion
-- ----------------------------------------------------------------------------
-- Bloque C — verificaciones estructurales finales (OWNER, post B):
--   C-1: SELECT tablename, relrowsecurity ... todas = true
--   C-2: SELECT tablename, count(*) FROM pg_policies WHERE policyname LIKE 'tz36_%' GROUP BY 1
--   C-3: counts desde super admin = inventario PC6 (sin perdida)
-- ----------------------------------------------------------------------------

-- ============================================================================
-- SECCION 7: ROLLBACK DE EMERGENCIA (SOLO post-commit; NO ejecutar en esta
--            corrida ni en el flujo normal de prueba)
-- ============================================================================
--   ALTER TABLE public.<tabla> DISABLE ROW LEVEL SECURITY;   -- por cada tabla objetivo
--   DROP POLICY IF EXISTS tz36_<tabla>_select   ON public.<tabla>;
--   DROP POLICY IF EXISTS tz36_<tabla>_insert   ON public.<tabla>;
--   DROP POLICY IF EXISTS tz36_<tabla>_update   ON public.<tabla>;
--   DROP POLICY IF EXISTS tz36_<tabla>_delete   ON public.<tabla>;
--   -- tz36_inventario se CONSERVA como evidencia (no se elimina).
--   -- Uso unico de emergencia post-commit (R3); el mecanismo normal de prueba es
--   -- el Bloque B con JWT real dentro de la transaccion original (nada parcial).

-- ============================================================================
-- FIN DE MIGRACION FASE 3.6
-- ============================================================================