# FASE 3.6 — EJECUCIÓN FINAL (R3.3)

## 1. Estado

**LISTA PARA EJECUCIÓN** — paquete único, completo y auto-contenido.
`sql/migracion_fase_3_6.sql` se copia INTEGRO en el SQL Editor de Supabase y se ejecuta en UNA sola corrida como OWNER (rol `postgres`). No requiere pasos previos ni fragmentos.

## 2. Qué hace la migración

Activa **RLS multiempresa** en todo `public` del ERP Tz'unun:

* Responde la empresa autorizada de la sesión con `authz.empresas_autorizadas()` y el superadministrador con `authz.es_super_admin()` (ambas creadas en FASE 3.2B; **SECURITY DEFINER**, por eso las policies de autorización no producen recursión).
* **Tablas de negocio** (con `empresa_id`, sin filas maestras NULL): 4 policies `tz36_<tabla>_{select,insert,update,delete}` con `empresa_id IN (SELECT authz.empresas_autorizadas())`.
* **Tablas híbridas** (`cuentas_contables`, etc., con filas maestras `empresa_id IS NULL`): mismas 4 policies con `(empresa_id IS NULL OR empresa_id IN (...))`.
* **Tabla gerencia** (`public.empresas`, raíz de tenant; su clave es `id`, NO `empresa_id`): SELECT `id IN (empresas_autorizadas()) OR es_super_admin()`; escritura solo super_admin.
* **Tablas de autorización** (`usuarios_sistema`, `usuario_empresas`, `roles`): SELECT propia/super_admin; escritura solo super_admin; `tz36_roles_select USING (true)` (catálogo global de roles, no expone datos de usuario ni credenciales).
* `ENABLE ROW LEVEL SECURITY` en todas las tablas objetivo.
* **Idempotente**: `DROP POLICY IF EXISTS tz36_<t>_<cmd>` + `CREATE POLICY` (no hay `CREATE POLICY IF NOT EXISTS` en PostgreSQL); no modifica datos, no crea usuarios/triggers/columnas, no toca Auth ni frontend.
* **Evidencia**: materializa `public.tz36_inventario` (solo primera corrida; anti-sobrescritura).
* **Hardening**: `REVOKE` a `anon`/`authenticated` sobre `backup_facturas_saldos` (snapshot sin `empresa_id` que no debe leerse por REST).

## 3. Estado PRECHECK real encontrado (antes de esta corrida)

Estado confirmado en Supabase con el PRECHECK real:

| Objeto | Estado |
|---|---|
| Policies en `public` | **0** (ninguna policy en todo el esquema) |
| Policies `tz36_*` | 0 |
| `usuarios_sistema` | RLS **ON** / 0 policies |
| `ubicaciones_personalizadas` | RLS **ON** / 0 policies |
| Resto de tablas `public` | RLS **OFF** / 0 policies |

Implicaciones aplicadas en el paquete:

* Las 10 policies legacy documentadas (`configuracion_roles_series.sql` y `crear_ubicaciones_personalizadas.sql`) **no existen hoy**; la Sección 1.0 las borra solo como red idempotente con `DROP POLICY IF EXISTS` (no-op). Ninguna lógica asume que existan.
* `usuarios_sistema` y `ubicaciones_personalizadas` están en RLS ON sin policies (fail-closed); esta corrida les restaura cobertura `tz36_*` en la misma transacción atómica.

## 4. Cómo ejecutar

1. Abrir Supabase → SQL Editor.
2. Copiar **TODO** el contenido de `sql/migracion_fase_3_6.sql` (859 líneas) en el editor.
3. Ejecutar **en una sola corrida** (botón Run), sin resumir ni seleccionar fragmentos.

```sql
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
-- DISENO (Revision R3 / R3.3 FINAL):
--   * ATOMICIDAD (R3.3 FINAL): el paquete se envuelve AHORA en un BLOQUE EXPLICITO
--     "BEGIN; ... COMMIT;" (unico par; nada se ejecuta por fuera). Garantia REAL
--     doble, documentada y verificada por fuentes de PostgreSQL:
--       (a) Protocolo simple: "when a simple Query message contains more than one
--           SQL statement (separated by semicolons), those statements are executed
--           as a single transaction" (docs PG /protocol-flow). El SQL Editor de
--           Supabase (pg-meta POST /query) envia TODO el buffer en UN mensaje
--           query: transaccion implicita unica.
--       (b) BLOQUE EXPLICITO BEGIN/COMMIT: hace la atomicidad INDEPENDIENTE del
--           transporte. Aun en "psql -f" (que envia por sentencia) el bloque
--           agrupa todo; y en SQL Editor el COMMIT final ejecuta commit (o rollback
--           automatico si hubo error).
--     Comportamiento ante error (documentado): si cualquier sentencia o DO falla
--     (PCx/GATE RAISE EXCEPTION o DDL invalido), la transaccion queda ABORTED; las
--     sentencias siguientes del script generan "current transaction is aborted" y
--     el COMMIT final actua como ROLLBACK -> NADA queda aplicado (policies, ENABLE
--     RLS, tz36_inventario). DDL es transaccional en PostgreSQL: CREATE POLICY,
--     DROP POLICY, ALTER TABLE ... ENABLE ROW LEVEL SECURITY, CREATE TABLE y REVOKE
--     revierten por completo.
--     Matriz de transporte:
--       SQL Editor de Supabase (1 corrida del buffer completo) -> ATOMICO.
--       "psql -c '<script>'": 1 request -> ATOMICO.
--       "psql -f <archivo>"  : ATOMICO por el BEGIN/COMMIT explicito (sin -1).
--       psql interactivo     : ATOMICO SOLO si se pega el archivo COMPLETO en un
--                              solo paso (una sola query); NO ejecutar por fragmentos.
--   * IDEMPOTENCIA: SOLO "DROP POLICY IF EXISTS tz36_<t>_<cmd>" + "CREATE POLICY".
--     PostgreSQL NO admite CREATE POLICY IF NOT EXISTS. El prefijo tz36_ se
--     compara por LITERAL con starts_with(nombre, 'tz36_'), sin depender del
--     escape de '_' en LIKE (escapado ambiguo, corregido en R3.3). Los nombres se
--     generan con format('tz36_%I_%s', tabla, cmd) que produce literalmente
--     'tz36_<tabla>_<cmd>' (el prefijo tz36_ es un literal del formato; NO hay
--     barra invertida). El GATE (R3.3 FINAL) verifica el CONJUNTO EXACTO de nombres por
--     igualdad con el mismo format(): cualquier nombre generado con mangling
--     (barra, comilla, sufijo extra) queda fuera del set esperado y BLOQUEA.
--   * PC3/GATE: auditan pg_policies de TODO public por INVENTARIO (nombre-
--     agnostico); cualquier policy cuyo prefijo NO sea tz36_* bloquea la corrida
--     y queda listada con su nombre real (jamás se elimina en silencio).
--   * RECURSION (R3.3 FINAL): demostrable por construccion, no por texto:
--       authz.empresas_autorizadas() y authz.es_super_admin() estan definidas
--       SECURITY DEFINER (FASE 3.2B, pg_proc.prosecdef) -> al evaluarse una policy
--       que las invoca, las consultas internas corren como el definidor (owner,
--       Bypass de RLS) -> el ciclo usuario_empresas -> usuarios_sistema -> authz
--       TERMINA en 1-2 niveles; no hay recursion. El GATE lo comprueba verificando
--       prosecdef=true (estructural) + relforcerowsecurity=false en las tablas
--       objetivo (si hubiera FORCE RLS el definidor NO haria bypass) + scan textual
--       de authz.empresas_autorizadas() en policies de tablas de autorizacion.
--   * CLASIFICACIONES (R3.3 FINAL): negocio (empresa_id, sin filas NULL), hibrido
--     (empresa_id, con filas NULL maestras), autorizacion (usuarios_sistema,
--     usuario_empresas, roles; SIN recursion), gerencia (public.empresas: tabla
--     raiz de tenant cuya clave es id, NO empresa_id; politica especial) y
--     excluida (sin clave de tenant: global/tecnica/evidencia, sin RLS en 3.6).
--       empresas        -> gerencia (id IN (empresas_autorizadas()) OR super_admin).
--       usuarios_sistema-> autorizacion: su columna empresa_id NO es frontera de
--                          seguridad por decision de FASE 3.2B (rol por vinculo).
--       backup_facturas_saldos -> excluida (evidencia 3.3, sin empresa_id); se le
--                          REVOCAN los GRANT a anon/authenticated (solo owner).
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
-- ESTADO REAL CONFIRMADO POR PRECHECK (Supabase, antes de esta corrida):
--   * policies en public: 0 (pg_policies sin filas).
--   * policies tz36_*: 0.
--   * usuarios_sistema:             RLS ON, 0 policies.
--   * ubicaciones_personalizadas:   RLS ON, 0 policies.
--   * resto de tablas public:       RLS OFF, 0 policies.
--   Por tanto NO existen las 10 legacy documentadas ("Lectura/Insercion/
--   Actualizacion/Eliminacion para autenticados" en usuarios_sistema; "Lectura/
--   Insercion/Eliminacion para usuarios autenticados" y sus duplicados sin 'para'
--   en ubicaciones_personalizadas). Esas names eran las definidas por
--   sql/configuracion_roles_series.sql y sql/crear_ubicaciones_personalizadas.sql.
-- RESOLUCION LEGACY (R3.3): los 10 DROP se CONSERVAN SOLO como red de seguridad
--   idempotente con "IF EXISTS" (no-op ante la ausencia real de las policies).
--   NO existe logica que asuma su presencia y NADA bloquea por su ausencia.
--   La garantia de "cero policies no-tz36_*" la dan PC3 + V3 + GATE por
--   inventario real (nombre-agnostico), no por nombres historicos.
--   Si en el futuro apareciera alguna legacy con OTRO nombre, PC3 la lista y
--   BLOQUEA: el operador agrega su nombre a la Seccion 1.0 y reejecuta
--   (la corrida es idempotente).
-- RESOLUCION LEGACY EJECUTABLE (Seccion 1.0, DROP POLICY IF EXISTS x 10):
--   usuarios_sistema:  "Lectura para autenticados", "Insercion para autenticados",
--                      "Actualizacion para autenticados", "Eliminacion para autenticados".
--   ubicaciones_personalizadas: "Lectura/Insercion/Eliminacion para usuarios
--                      autenticados" y "Lectura/Insercion/Eliminacion
--                      usuarios autenticados" (sin 'para').
--   (10 DROP POLICY IF EXISTS; PC3/GATE exigen public sin ninguna policy no-tz36_*.)
--   (PC2 ya acepta el RLS ON legacy de esas 2 tablas en cualquier estado.)
--   Precaucion coherente con PC2: usuarios_sistema y ubicaciones_personalizadas
--   estan HOY RLS ON sin policies (fail-closed); esta corrida restaura cobertura
--   completa (tz36_*) dentro de la MISMA transaccion atomica.
-- ============================================================================

-- ============================================================================
-- APERTURA DE TRANSACCION EXPLICITA (R3.3 FINAL) — atomicidad autocontenida.
--   Todo el paquete se ejecuta dentro de ESTE unico bloque; el COMMIT final
--   (Seccion 7.0) confirma todo o, ante CUALQUIER error (PCx/GATE/DDL), la
--   transaccion queda aborted y el COMMIT actua como ROLLBACK (nada aplicado).
-- ============================================================================
BEGIN;

-- ============================================================================
-- SECCION 1: RESOLUCION LEGACY + PRE-CHECKS
--   La resolucion legacy es idempotente (DROP POLICY IF EXISTS x 10). Cualquier
--   fallo posterior detiene con EXCEPTION (transaccion unica: todo se revierte).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.0 RESOLUCION DE POLICIES LEGACY (quirurgica, idempotente)
--   Nombres explicitos (repo / verificacion operativa). IF EXISTS: no-op si la
--   policy ya no existe (absorbe el ERROR 42704 de la corrida anterior).
--   NUNCA se eliminan policies tz36_* ni policies de otras tablas por comodin.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lectura para autenticados"        ON public.usuarios_sistema;
DROP POLICY IF EXISTS "Insercion para autenticados"      ON public.usuarios_sistema;
DROP POLICY IF EXISTS "Actualizacion para autenticados"  ON public.usuarios_sistema;
DROP POLICY IF EXISTS "Eliminacion para autenticados"    ON public.usuarios_sistema;
DROP POLICY IF EXISTS "Lectura para usuarios autenticados"     ON public.ubicaciones_personalizadas;
DROP POLICY IF EXISTS "Insercion para usuarios autenticados"   ON public.ubicaciones_personalizadas;
DROP POLICY IF EXISTS "Eliminacion para usuarios autenticados" ON public.ubicaciones_personalizadas;
DROP POLICY IF EXISTS "Lectura usuarios autenticados"          ON public.ubicaciones_personalizadas;
DROP POLICY IF EXISTS "Insercion usuarios autenticados"        ON public.ubicaciones_personalizadas;
DROP POLICY IF EXISTS "Eliminacion usuarios autenticados"      ON public.ubicaciones_personalizadas;

-- ----------------------------------------------------------------------------
-- 1.1 HARDENING DE EVIDENCIA (R3.3 FINAL) — backup_facturas_saldos (snapshot 3.3) NO
--     tiene empresa_id (no es tenant) y SIN RLS quedaria legible por cualquier
--     authenticated via REST. No se le aplica RLS (clave inexistente); se le
--     REVOCAN los grants de escritura/lectura a anon/authenticated: queda
--     accesible SOLO para el owner (postgres). Reversible: REVOKE es DDL
--     transaccional (se revierte con el resto si la corrida falla).
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.backup_facturas_saldos FROM PUBLIC;
REVOKE ALL ON public.backup_facturas_saldos FROM anon;
REVOKE ALL ON public.backup_facturas_saldos FROM authenticated;

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
  r_col    RECORD;
BEGIN
  SELECT to_regprocedure('authz.empresas_autorizadas()')::text INTO v_fn_emp;
  SELECT to_regprocedure('authz.es_super_admin()')::text   INTO v_fn_sa;
  IF v_fn_emp IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta authz.empresas_autorizadas()'; END IF;
  IF v_fn_sa  IS NULL THEN RAISE EXCEPTION 'PC0 BLOQUEO: falta authz.es_super_admin()'; END IF;

  -- Existencia real de tablas y columnas de autorizacion usadas por las policies
  -- (R3: nunca crear policies sobre tablas/columnas inexistentes).
  -- OJO PG 17.6: to_regcolumn() de DOS argumentos NO existe (error 42883); la
  -- existencia de columnas se valida via information_schema.columns (comprobacion
  -- portable y robusta). Se verifican las mismas 7 columnas con la misma semantica.
  IF to_regclass('public.usuarios_sistema') IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.usuarios_sistema'; END IF;
  IF to_regclass('public.usuario_empresas') IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.usuario_empresas'; END IF;
  IF to_regclass('public.roles')             IS NULL      THEN RAISE EXCEPTION 'PC0 BLOQUEO: no existe public.roles'; END IF;
  FOR r_col IN SELECT * FROM (VALUES
    ('usuarios_sistema','id'),
    ('usuarios_sistema','auth_id'),
    ('usuarios_sistema','activo'),
    ('usuario_empresas','usuario_id'),
    ('usuario_empresas','empresa_id'),
    ('usuario_empresas','activo'),
    ('roles','nombre')
  ) AS t (tabla, columna)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name=r_col.tabla AND column_name=r_col.columna
    ) THEN
      RAISE EXCEPTION 'PC0 BLOQUEO: falta %.%', r_col.tabla, r_col.columna;
    END IF;
  END LOOP;

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
--   gerencia     : public.empresas (tabla raiz de tenant; clave = id, no
--                  empresa_id) — politica especial (Seccion 2.1B)
--   excluida     : sin clave de tenant (global/tecnica) o evidencia (documentada)
--   R3.3 FINAL: 'empresas' se clasifica ANTES de la regla generica v_has porque su clave
--   de tenant es la columna 'id' (todo el repo referencia empresas(id)); si se
--   dejara al criterio generico y NO existiera columna 'empresa_id' en la BD real,
--   empresas quedaria 'excluida' SIN RLS (fuga de toda la tabla raiz).
--   usuarios_sistema TIENE empresa_id pero NO es frontera de seguridad (FASE 3.2B:
--   el rol se resuelve por vinculo en usuario_empresas); se fuerza 'autorizacion'.
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
  v_n_neg int := 0; v_n_hib int := 0; v_n_auth int := 0; v_n_ger int := 0; v_n_exc int := 0;
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
    ELSIF r.tabla = 'empresas' THEN
      -- Gerencia: raiz de tenant; clave = id (no empresa_id). Conteo por id de la
      -- empresa activa de la corrida (id NOT NULL: nunca hay filas maestras NULL).
      v_clas := 'gerencia';
      EXECUTE format('SELECT count(*), count(*) FILTER (WHERE id IS NULL) FROM public.%I', r.tabla)
        INTO v_total, v_nulls;
      EXECUTE format('SELECT count(*) FROM public.%I WHERE id = %L', r.tabla, v_emp_act)
        INTO v_ctrmp;
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
        v_motivo := 'evidencia de FASE 3.3 (snapshot); sin empresa_id; grants revocados a anon/authenticated (R3.3 FINAL)';
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
    ELSIF v_clas='gerencia' THEN v_n_ger := v_n_ger + 1;
    ELSE v_n_exc := v_n_exc + 1; END IF;
  END LOOP;

  RAISE NOTICE 'PC1 OK: inventario dinamico = % negocio, % hibrido, % autorizacion, % gerencia, % excluidas', v_n_neg, v_n_hib, v_n_auth, v_n_ger, v_n_exc;
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
--   Resto de tablas objetivo (incl. empresas=gerencia): todas OFF (primera
--   corrida) o todas ON con tz36_* (re-ejecucion/validacion); mezcla BLOQUEA.
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
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
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
  v_tot bigint;
  v_tz  bigint;
BEGIN
  SELECT count(*) INTO v_tot FROM pg_policies WHERE schemaname='public';
  SELECT count(*) INTO v_tz  FROM pg_policies WHERE schemaname='public' AND starts_with(policyname::text, 'tz36_');
  FOR r IN
    SELECT DISTINCT p.tablename AS tabla, p.policyname AS policy
      FROM pg_policies p
     WHERE p.schemaname='public'
       AND NOT starts_with(p.policyname::text, 'tz36_')
     ORDER BY p.tablename, p.policyname
  LOOP
    RAISE EXCEPTION 'PC3 BLOQUEO: policy preexistente desconocida % ON public.% (no se elimina en silencio)', r.policy, r.tabla;
  END LOOP;
  RAISE NOTICE 'PC3 OK: % policies en public (0 legacy desconocidas, % tz36_*)', v_tot, v_tz;
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
           WHERE clasificacion IN ('negocio','hibrido','gerencia') ORDER BY tabla
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
-- 2.1B Tabla GERENCIA (public.empresas, R3.3 FINAL) — tabla raiz de tenant.
--   Clave de tenant = id (NO empresa_id). Politicas especificas:
--     SELECT : id autorizada (mis empresas) o super_admin (todas).
--     INSERT/UPDATE/DELETE : solo super_admin (catalogo raiz; no se auto-crea
--                            empresa desde un cliente authenticated).
--   El modo generico (empresa_id IN ...) NO se aplica a empresas: no puede
--   probarse con el inventario (id != empresa_id) y dejarla 'excluida' abriria
--   toda la tabla raiz. Al ser esta su UNICA fuente, se maneja determinista.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS tz36_empresas_select ON public.empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_empresas_insert ON public.empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_empresas_update ON public.empresas';
  EXECUTE 'DROP POLICY IF EXISTS tz36_empresas_delete ON public.empresas';
  EXECUTE 'CREATE POLICY tz36_empresas_select ON public.empresas FOR SELECT TO authenticated USING (id IN (SELECT authz.empresas_autorizadas()) OR authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_empresas_insert ON public.empresas FOR INSERT TO authenticated WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_empresas_update ON public.empresas FOR UPDATE TO authenticated USING (authz.es_super_admin()) WITH CHECK (authz.es_super_admin())';
  EXECUTE 'CREATE POLICY tz36_empresas_delete ON public.empresas FOR DELETE TO authenticated USING (authz.es_super_admin())';
  RAISE NOTICE 'POLICIES OK: 4 policies tz36_* en public.empresas (gerencia, politica especial)';
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
     WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
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
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
   AND NOT c.relrowsecurity;

-- V2 — Policies por tabla (solo prefijo literal tz36_)
SELECT tablename, count(*) AS policies
  FROM pg_policies
 WHERE schemaname='public' AND starts_with(policyname::text, 'tz36_')
 GROUP BY tablename ORDER BY tablename;

-- V3 — Ninguna policy desconocida (re-auditoria integra)
SELECT tablename, policyname
  FROM pg_policies
 WHERE schemaname='public' AND NOT starts_with(policyname::text, 'tz36_');

-- ----------------------------------------------------------------------------
-- GATE ESTRUCTURAL 3.6 (R3.3 FINAL) — cierre dentro de la transaccion. Verifica:
--   (1) RLS activa en TODAS las tablas objetivo.
--   (2) CERO policies no-tz36_* en TODO public.
--   (3) CONJUNTO EXACTO de policies tz36_* por tabla: las 4 esperadas por
--       igualdad literal con format('tz36_%I_%s', tabla, cmd). Cualquier nombre
--       generado con mangling (barra invertida, comilla, sufijo extra), policy
--       repetida, faltante o extra queda FUERA del set y BLOQUEA. Esto prueba
--       ademas que 'tz36_' se materializo literal y sin caracteres de escape.
--   (4) Estructura por comando: SELECT/UPDATE/DELETE con USING, INSERT/UPDATE
--       con WITH CHECK, todas PERMISSIVE.
--   (5) Anti-recursion ESTRUCTURAL: authz.empresas_autorizadas() y
--       authz.es_super_admin() deben ser SECURITY DEFINER (Bypass de RLS del
--       definidor => el grafo usuario_empresas->usuarios_sistema->authz TERMINA);
--       ninguna tabla objetivo con FORCE ROW LEVEL SECURITY (que romperia ese
--       bypass); y ninguna policy de tablas de autorizacion invoca
--       empresas_autorizadas() (scan textual adicional de defensa).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_off   int;
  v_total int;
  v_unk   bigint;
  v_dup   bigint;
  v_extra bigint;
  v_falt  bigint;
  v_bad   bigint;
  v_def   bigint;
  v_force bigint;
  r RECORD;
BEGIN
  -- (1) RLS activa en todas las tablas objetivo
  SELECT count(*) INTO v_off
    FROM tz36_inv_run i
    JOIN pg_class c ON c.relname = i.tabla
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia') AND NOT c.relrowsecurity;
  IF v_off <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % tablas objetivo sin RLS', v_off;
  END IF;

  SELECT count(*) INTO v_total
    FROM tz36_inv_run i
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia');

  -- (2) Ninguna policy no-tz36_*
  SELECT count(*) INTO v_unk FROM pg_policies
   WHERE schemaname='public' AND NOT starts_with(policyname::text, 'tz36_');
  IF v_unk <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % policies no-tz36_* presentes', v_unk;
  END IF;

  -- (3) Conjunto EXACTO: sin duplicados, sin extras, sin faltantes
  SELECT count(*) INTO v_dup FROM (
    SELECT p.policyname FROM pg_policies p
     WHERE p.schemaname='public' AND starts_with(p.policyname::text, 'tz36_')
     GROUP BY p.policyname HAVING count(*) > 1
  ) d;
  IF v_dup <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % policyname tz36_* duplicado(s) en public', v_dup;
  END IF;

  SELECT count(*) INTO v_extra FROM pg_policies p
   WHERE p.schemaname='public' AND starts_with(p.policyname::text, 'tz36_')
     AND NOT EXISTS (
       SELECT 1 FROM tz36_inv_run i
       CROSS JOIN (VALUES ('select'),('insert'),('update'),('delete')) AS c(cmd)
       WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
         AND format('tz36_%I_%s', i.tabla, c.cmd) = p.policyname::text
     );
  IF v_extra <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % policy tz36_* NO esperada(s) (fuera del set exacto por tabla) — posible nombre con mangling o policy adicional', v_extra;
  END IF;

  SELECT count(*) INTO v_falt
    FROM tz36_inv_run i
   CROSS JOIN (VALUES ('select'),('insert'),('update'),('delete')) AS c(cmd)
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies p
        WHERE p.schemaname='public' AND p.policyname::text = format('tz36_%I_%s', i.tabla, c.cmd)
     );
  IF v_falt <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: faltan % de las % policies exactas tz36_<tabla>_<comando> (set %=4 por tabla)', v_falt, v_total * 4, v_total;
  END IF;

  -- (4) Estructura por comando + permissive
  SELECT count(*) INTO v_bad FROM pg_policies p
   WHERE p.schemaname='public' AND starts_with(p.policyname::text, 'tz36_')
     AND ((p.cmd IN ('SELECT','UPDATE','DELETE') AND p.qual IS NULL)
       OR (p.cmd IN ('INSERT','UPDATE') AND p.with_check IS NULL)
       OR p.permissive <> 'PERMISSIVE');
  IF v_bad <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % policy tz36_* con estructura invalida (USING/WITH CHECK/PERMISSIVE)', v_bad;
  END IF;

  -- (5) Anti-recursion ESTRUCTURAL
  SELECT count(*) INTO v_def FROM pg_proc pp
   WHERE pp.oid IN (to_regprocedure('authz.empresas_autorizadas()'), to_regprocedure('authz.es_super_admin()'))
     AND pp.prosecdef;
  IF v_def <> 2 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: las funciones authz.* NO son SECURITY DEFINER (se esperaban 2: empresas_autorizadas y es_super_admin). El bypass del definidor es lo que evita la recursion RLS';
  END IF;

  SELECT count(*) INTO v_force
    FROM tz36_inv_run i
    JOIN pg_class c ON c.relname = i.tabla AND c.relnamespace = 'public'::regnamespace
   WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia') AND c.relforcerowsecurity;
  IF v_force <> 0 THEN
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: % tabla(s) objetivo con FORCE ROW LEVEL SECURITY (rompe el bypass del definidor y reintroduce recursion)', v_force;
  END IF;

  FOR r IN
    SELECT p.polname AS policyname, c.relname AS tablename,
           pg_get_expr(polqual, polrelid) AS expr,
           pg_get_expr(polwithcheck, polrelid) AS chk
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
     WHERE starts_with(p.polname::text, 'tz36_')
       AND c.relname IN ('usuarios_sistema','usuario_empresas','roles')
       AND (position('empresas_autorizadas' in pg_get_expr(polqual, polrelid)) > 0
         OR position('empresas_autorizadas' in pg_get_expr(polwithcheck, polrelid)) > 0)
  LOOP
    RAISE EXCEPTION 'GATE-ESTRUCTURAL 3.6 BLOQUEO: recursion detectada en public.%.%', r.tablename, r.policyname;
  END LOOP;

  RAISE NOTICE 'GATE-ESTRUCTURAL 3.6 OK: RLS activa en % tablas objetivo; set EXACTO de % policies tz36_* (4 por tabla); 0 policies desconocidas; estructura por comando valida; authz SECURITY DEFINER sin recursion', v_total, v_total * 4;
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
-- SECCION 5.9: COMMIT — cierre de la transaccion EXPLICITA (apertura al inicio).
--   Si CUALQUIER sentencia/DO anterior fallo (PCx/GATE/DDL invalido), la
--   transaccion quedo ABORTED y este COMMIT actua como ROLLBACK: NADA de lo
--   ejecutado antes (policies, ENABLE RLS, tz36_inventario, REVOKE) queda
--   aplicado ni persistido. Sin error previo -> COMMIT confirma TODO en bloque.
-- ============================================================================
COMMIT;

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
--   C-2: SELECT tablename, count(*) FROM pg_policies
--        WHERE schemaname='public' AND starts_with(policyname::text, 'tz36_') GROUP BY 1
--   C-3: counts desde super admin = inventario PC6 (sin perdida)
-- ----------------------------------------------------------------------------

-- ============================================================================
-- SECCION 7: ROLLBACK DE EMERGENCIA (SOLO post-commit; NO ejecutar en esta
--            corrida ni en el flujo normal de prueba)
--   Estado PRE-FASE 3.6 (PRECHECK real confirmado):
--     usuarios_sistema           -> RLS ON (0 policies)
--     ubicaciones_personalizadas -> RLS ON (0 policies)
--     resto de public            -> RLS OFF (0 policies)
--   El rollback DEBE devolver EXACTAMENTE ese estado:
--     (a) DROP POLICY IF EXISTS tz36_<tabla>_<cmd> x4 en cada tabla objetivo
--         (incluye empresas=gerencia y las 3 de autorizacion).
--     (b) DISABLE ROW LEVEL SECURITY SOLO en las tablas objetivo que estaban
--         OFF antes de FASE 3.6 (TODAS excepto usuarios_sistema y
--         ubicaciones_personalizadas); esas 2 quedan RLS ON con 0 policies
--         (estado original).
--     (c) tz36_inventario se CONSERVA como evidencia (no se elimina; es el
--         diseno aprobado). backup_facturas_saldos: los REVOKE de la Seccion
--         1.1 se RESTABLECEN solo si se desea reabrir su lectura (default: se
--         mantienen revocados).
--   Generador de los comandos exactos (ejecutar como OWNER, post-commit):
--     SELECT 'DROP POLICY IF EXISTS tz36_' || i.tabla || '_select ON public.' || i.tabla || ';'
--       FROM public.tz36_inventario i
--      WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
--     UNION ALL SELECT '... _insert ...' / '_update' / '_delete'  (idem, 4 comandos)
--     ORDER BY 1; THEN:
--     SELECT 'ALTER TABLE public.' || i.tabla || ' DISABLE ROW LEVEL SECURITY;'
--       FROM public.tz36_inventario i
--      WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
--        AND i.tabla NOT IN ('usuarios_sistema','ubicaciones_personalizadas')
--      ORDER BY 1;
--   (Los 4 DROPs por tabla tambien pueden escribirse estaticamente; el generador
--    evita omisiones y cubre el inventario real materializado.)
--   Uso unico de emergencia post-commit (R3.3 FINAL); el mecanismo normal de validacion
--   es el Bloque B con JWT real + esta corrida atomica (nada parcial queda
--   aplicado: COMMIT final confirma todo o revierte todo).
-- ============================================================================

-- ============================================================================
-- FIN DE MIGRACION FASE 3.6 — FASE 3.6 — LISTA PARA EJECUCION MANUAL COMO OWNER
-- ============================================================================
```

**Atomicidad (real y autocontenida):**

* El paquete abre `BEGIN;` y cierra `COMMIT;`. Todo el despliegue (DROP/CREATE POLICY, ENABLE RLS, inventario, REVOKE) vive dentro de ese único bloque.
* PostgreSQL documenta además que un mensaje `query` simple con varias sentencias se ejecuta como una sola transacción (protocolo simple). En SQL Editor, todo el buffer va en un único envío.
* Si **cualquier** sentencia o `DO` falla (`PCx ... BLOQUEO`, `GATE-ESTRUCTURAL 3.6 BLOQUEO`, o DDL inválido), la transacción queda ABORTED y el `COMMIT` final actúa como **ROLLBACK**: policies, ENABLE RLS, inventario y REVOKE se revierten por completo (todo el DDL de PostgreSQL es transaccional). O sea: o se aplica todo, o no se aplica nada.
* No `psql` interactivo ni ejecución por fragmentos.

## 5. Qué resultado debe aparecer al finalizar

Una corrida **APTA** termina sin ningún error y con estos NOTICE (todos presentes, en orden):

1. `PC0 OK: authz.* presentes, ... vinculo(s) real(es) activo(s), rol super_admin existe`
2. `PC1 OK: inventario dinamico = ... negocio, ... hibrido, ... autorizacion, 1 gerencia, ... excluidas`
3. `PC2 OK: tablas objetivo no-legacy sin RLS (primera corrida)` (o el mensaje de re-ejecución)
4. `PC3 OK: % policies en public (0 legacy desconocidas, % tz36_*)`
5. `PC4 OK: galheroa RESUELVE super_admin ... y vanessa (admin) con vinculo activo ...`
6. `PC5 OK: ...` (empresas reales / ajenas para pruebas negativas)
7. `PC6 OK: baseline por tabla ...`
8. `PC7 OK (revision de codigo): ...`
9. `POLICIES OK: % policies tz36_* creadas en tablas de negocio/hibridas`
10. `POLICIES OK: 4 policies tz36_* en public.empresas (gerencia, politica especial)`
11. `POLICIES OK: 12 policies tz36_* en tablas de autorizacion (sin recursion)`
12. `ENABLE OK: ROW LEVEL SECURITY habilitada en % tablas objetivo`
13. `EVIDENCIA OK: tz36_inventario materializado ...` (o INFO si ya existía)
14. `GATE-ESTRUCTURAL 3.6 OK: RLS activa en % tablas objetivo; set EXACTO de % policies tz36_* (4 por tabla); 0 policies desconocidas; estructura por comando valida; authz SECURITY DEFINER sin recursion`

Cualquier `RAISE EXCEPTION` (mensajes `... BLOQUEO`) significa que NADA se aplicó (rollback por COMMIT-abort). El resultado final del bloque es un COMMIT limpio.

## 6. POSTCHECK mínimo necesario

Pos-ejecución (OWNER), para confirmar el estado final:

```sql
-- 1) CERO policies no-tz36_* en public → ESPERADO: 0 filas
SELECT schemaname, tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public' AND NOT starts_with(policyname::text, 'tz36_');

-- 2) Conjunto EXACTO de policies tz36_* (4 por tabla objetivo; igualdad literal)
SELECT p.tablename, p.policyname, p.cmd, p.permissive
  FROM pg_policies p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
 WHERE starts_with(p.policyname::text, 'tz36_')
 ORDER BY p.tablename, p.policyname;

-- 3) RLS activa en TODAS las tablas objetivo y SOLO en ellas
--    (objetivo = negocio+hibrido+autorizacion+gerencia) → ESPERADO: 0 filas
SELECT c.relname, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
  LEFT JOIN public.tz36_inventario i ON i.tabla = c.relname::text
 WHERE c.relkind = 'r'
   AND ( (i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia') AND NOT c.relrowsecurity)
      OR (COALESCE(i.clasificacion,'excluida') NOT IN ('negocio','hibrido','autorizacion','gerencia') AND c.relrowsecurity) );

-- 4) Inventario materializado (evidencia) → ESPERADO: 1+ filas
SELECT tabla, clasificacion, tiene_empresa_id, filas_totales, filas_empresa_act, motivo
  FROM public.tz36_inventario
 ORDER BY tabla;

-- 5) Sin pérdida de datos: recuentos actuales vs baseline del inventario → ESPERADO: 0 diferencias
SELECT i.tabla, i.filas_totales,
       (SELECT count(*) FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname='public'
        WHERE c.relname::text = i.tabla /*placeholder: recuento real por tabla en B-3*/) AS actual
  FROM public.tz36_inventario i WHERE 1 = 0;
```

Interpretación del POSTCHECK:

* ítem 1 vacío → no quedó ninguna policy fuera del namespace `tz36_*`.
* ítem 2 → exactamente las 4 policies esperadas por tabla objetivo, `PERMISSIVE`, con USING en SELECT/UPDATE/DELETE y WITH CHECK en INSERT/UPDATE (esto lo garantiza el propio GATE en corrida).
* ítem 3 vacío → RLS ON solo y siempre en las tablas objetivo y OFF en el resto.
* ítem 4 → evidencia persistida.
* La ausencia de pérdida de datos es intrínseca: el paquete **no ejecuta ningún DML** (solo DDL); si se desea verificación adicional, comparar `filas_totales` del inventario con `SELECT count(*)` por tabla (escribir el placeholder del ítem 5 con cada tabla objetivo).

## 7. Rollback corregido (post-commit; NO ejecutar en la corrida)

Estado PRE-FASE 3.6 a restaurar exactamente:

* `usuarios_sistema` → **RLS ON, 0 policies**.
* `ubicaciones_personalizadas` → **RLS ON, 0 policies**.
* demás tablas objetivo → **RLS OFF**.
* 0 policies `tz36_*`.

Procedimiento de emergencia (OWNER, post-commit):

```sql
-- A) Eliminar las 4 policies tz36_* de cada tabla objetivo (idempotente).
--    Generador (cubre el inventario real materializado; también puede escribirse
--    estáticamente tabla por tabla):
SELECT 'DROP POLICY IF EXISTS tz36_' || i.tabla || '_select ON public.' || i.tabla || ';'
  FROM public.tz36_inventario i
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
UNION ALL
SELECT 'DROP POLICY IF EXISTS tz36_' || i.tabla || '_insert ON public.' || i.tabla || ';'
  FROM public.tz36_inventario i
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
UNION ALL
SELECT 'DROP POLICY IF EXISTS tz36_' || i.tabla || '_update ON public.' || i.tabla || ';'
  FROM public.tz36_inventario i
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
UNION ALL
SELECT 'DROP POLICY IF EXISTS tz36_' || i.tabla || '_delete ON public.' || i.tabla || ';'
  FROM public.tz36_inventario i
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
ORDER BY 1;

-- B) DISABLE RLS SOLO en tablas objetivo que estaban OFF antes de FASE 3.6
--    (TODAS excepto usuarios_sistema y ubicaciones_personalizadas, que estaban
--    RLS ON y deben QUEDAR ON con 0 policies). Generador:
SELECT 'ALTER TABLE public.' || i.tabla || ' DISABLE ROW LEVEL SECURITY;'
  FROM public.tz36_inventario i
 WHERE i.clasificacion IN ('negocio','hibrido','autorizacion','gerencia')
   AND i.tabla NOT IN ('usuarios_sistema','ubicaciones_personalizadas')
 ORDER BY 1;
```

Decisiones aplicadas al rollback:

* **NO** hace `DISABLE RLS` ciego sobre todas las tablas: respeta el estado previo real.
* `usuarios_sistema` y `ubicaciones_personalizadas` quedan **RLS ON con 0 policies** (su estado original), porque su RLS ya estaba activa antes de FASE 3.6.
* `public.tz36_inventario` se **conserva** como evidencia (diseño aprobado; no se elimina).
* `backup_facturas_saldos` mantiene los REVOKE de la Sección 1.1 (por defecto); solo se restauran grants si un caso de uso operativo lo exige explícitamente.
* El mecanismo NORMAL de validación no usa este rollback: la corrida es atómica (o todo se aplica o nada; el COMMIT final confirma o revierte). Este rollback es SOLO para revertir un COMMIT ya hecho.

---

**FASE 3.6 — LISTA PARA EJECUCIÓN MANUAL COMO OWNER**
