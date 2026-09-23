-- ============================================================================
-- FASE 3.4 — MIGRACIÓN DE USUARIOS REALES DEL ERP
-- Proyecto: ERP Tz'unun · Supabase project ref: fmijbpatkddkbxlkfoza
-- PostgreSQL: 17.6 · Owner (SQL Editor)
--
-- ALCANCE (SOLO estas tablas):
--   public.usuarios_sistema   (INSERT idempotente, 2 usuarios reales)
--   public.usuario_empresas   (INSERT idempotente, 2 relaciones)
--
-- EXPLÍCITAMENTE NO MODIFICA:
--   auth.users (solo lectura), empresas (solo lectura), roles (solo lectura),
--   authz.* (funciones), tablas de negocio. NO activa RLS. NO crea políticas.
--   NO crea usuarios Auth. NO almacena contraseñas.
--
-- IDEMPOTENCIA SEGURA: si el registro correcto ya existe no se duplica; si
--   existe una configuración DISTINTA se aborta (no se sobrescribe en silencio).
--   Bloques de error identificables: "FASE 3.4 BLOQUEO: ..." y "GATE 3.4 BLOQUEO: ...".
--
-- ATOMICIDAD REAL (crítica): PRE-CHECKS + INSERCIONES + GATE 3.4 están dentro
--   de UN SOLO bloque DO $$ ... $$ (sentencia atómica). Por tanto:
--     * si una precondición falla  -> RAISE EXCEPTION, NO se escribe nada;
--     * si una inserción falla     -> la sentencia atómica revierte TODO;
--     * si el GATE (que depende de los datos escritos) falla -> RAISE EXCEPTION
--       DENTRO de la misma unidad atómica que hizo las escrituras: se revierte
--       todo y NUNCA se declara éxito con aplicación parcial.
--   Los SELECT posteriores a este bloque son SOLO LECTURA (informativos);
--   NO constituyen la condición de éxito y no pueden modificar el resultado.
-- ============================================================================

-- ============================================================================
-- A) ATÓMICO: PRE-CHECKS -> INSERCIONES -> GATE 3.4 (todo en UNA sentencia)
-- ============================================================================
DO $$
DECLARE
  v_empresa_uuid  uuid := 'adc5f324-a108-49ad-875c-779afe3b9f7f';   -- Transportes Tz´unun
  v_auth_galero   uuid := '6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4';   -- galheroa@gmail.com
  v_auth_vanessa  uuid := 'b9e1dda6-05d2-4e31-bce4-1c73210c09f4';   -- vanessamgh@gmail.com
  v_email_galero  text  := 'galheroa@gmail.com';
  v_email_vanessa text  := 'vanessamgh@gmail.com';
  v_rol_super     public.roles.id%TYPE;
  v_rol_admin     public.roles.id%TYPE;
  v_us_galero     public.usuarios_sistema.id%TYPE;
  v_us_vanessa    public.usuarios_sistema.id%TYPE;
  v_cnt           integer;
  -- variables del GATE
  v_g_users       integer;      -- nº filas usuarios_sistema para los 2 auth_id
  v_g_galero_us   integer;      -- nº filas usuarios_sistema para galheroa
  v_g_vanessa_us  integer;      -- nº filas usuarios_sistema para vanessa
  v_g_rels        integer;      -- nº relaciones usuario_empresas de los 2
  v_g_galero_rels integer;      -- nº relaciones de galheroa
  v_g_vanessa_rels integer;     -- nº relaciones de vanessa
  v_g_dup_auth    integer;      -- duplicados de auth_id (aprobados)
  v_g_dup_email   integer;      -- duplicados de email (aprobados)
  v_g_dup_pair    integer;      -- duplicados (usuario_id, empresa_id) aprobados
  v_g_bad_galero  integer;      -- filas de galheroa que NO cumplen la config aprobada
  v_g_bad_vanessa integer;      -- filas de vanessa que NO cumplen la config aprobada
  v_g_otros       integer;      -- filas con email aprobado pero auth_id ajeno
  v_g_futuros     integer;      -- usuarios futuros (NO deben existir)
BEGIN
  ----------------------------------------------------------------------------
  -- PRE-CHECK PC-A: auth.users — ambos corrreos existen, email<->auth_id exacto,
  -- cada email aparece una sola vez.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO v_cnt
    FROM auth.users
   WHERE lower(email) IN (lower(v_email_galero), lower(v_email_vanessa));
  IF v_cnt <> 2 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: count(auth.users) de los 2 correos aprobados = % (esperado 2)', v_cnt;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_auth_galero AND lower(email) = lower(v_email_galero)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: auth_id % y email % no coinciden en auth.users', v_auth_galero, v_email_galero;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_auth_vanessa AND lower(email) = lower(v_email_vanessa)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: auth_id % y email % no coinciden en auth.users', v_auth_vanessa, v_email_vanessa;
  END IF;

  IF (SELECT count(*) FROM auth.users WHERE lower(email) = lower(v_email_galero)) <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: email % duplicado o ausente en auth.users', v_email_galero;
  END IF;
  IF (SELECT count(*) FROM auth.users WHERE lower(email) = lower(v_email_vanessa)) <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: email % duplicado o ausente en auth.users', v_email_vanessa;
  END IF;

  ----------------------------------------------------------------------------
  -- PRE-CHECK PC-B: empresa aprobada — exactamente UNA con el UUID indicado
  ----------------------------------------------------------------------------
  SELECT count(*) INTO v_cnt FROM public.empresas WHERE id = v_empresa_uuid;
  IF v_cnt <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: count(empresas.id = %) = % (esperado 1)', v_empresa_uuid, v_cnt;
  END IF;

  ----------------------------------------------------------------------------
  -- PRE-CHECK PC-C: roles aprobados — existen por nombre Y su id es el esperado
  --                  (pre-flight: super_admin=1, admin=2). Nunca ids inventados.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO v_cnt FROM public.roles WHERE nombre = 'super_admin';
  IF v_cnt <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: count(roles super_admin) = % (esperado 1)', v_cnt;
  END IF;
  SELECT id INTO v_rol_super FROM public.roles WHERE nombre = 'super_admin';
  IF v_rol_super <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: id del rol super_admin = % (esperado 1)', v_rol_super;
  END IF;

  SELECT count(*) INTO v_cnt FROM public.roles WHERE nombre = 'admin';
  IF v_cnt <> 1 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: count(roles admin) = % (esperado 1)', v_cnt;
  END IF;
  SELECT id INTO v_rol_admin FROM public.roles WHERE nombre = 'admin';
  IF v_rol_admin <> 2 THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: id del rol admin = % (esperado 2)', v_rol_admin;
  END IF;

  ----------------------------------------------------------------------------
  -- PRE-CHECK PC-D: sin configuraciones CONFLICTIVAS previas en usuarios_sistema
  ----------------------------------------------------------------------------
  -- (d1) los auth_id de los 2 usuarios no pueden existir con otro email
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE auth_id = v_auth_galero AND lower(email) IS DISTINCT FROM lower(v_email_galero)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: auth_id % ya registrado en usuarios_sistema con email distinto', v_auth_galero;
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE auth_id = v_auth_vanessa AND lower(email) IS DISTINCT FROM lower(v_email_vanessa)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: auth_id % ya registrado en usuarios_sistema con email distinto', v_auth_vanessa;
  END IF;

  -- (d2) los emails de los 2 usuarios no pueden existir con otro auth_id
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE lower(email) = lower(v_email_galero) AND auth_id IS DISTINCT FROM v_auth_galero) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: email % ya registrado en usuarios_sistema con auth_id distinto', v_email_galero;
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE lower(email) = lower(v_email_vanessa) AND auth_id IS DISTINCT FROM v_auth_vanessa) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: email % ya registrado en usuarios_sistema con auth_id distinto', v_email_vanessa;
  END IF;

  -- (d3) si el espejo ya existe correcto, no debe tener rol/empresa distinta
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE auth_id = v_auth_galero
                AND (rol_id IS DISTINCT FROM v_rol_super
                  OR empresa_id IS DISTINCT FROM v_empresa_uuid
                  OR activo IS DISTINCT FROM true)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: % ya existe en usuarios_sistema con configuracion distinta a la aprobada', v_email_galero;
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios_sistema
              WHERE auth_id = v_auth_vanessa
                AND (rol_id IS DISTINCT FROM v_rol_admin
                  OR empresa_id IS DISTINCT FROM v_empresa_uuid
                  OR activo IS DISTINCT FROM true)) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: % ya existe en usuarios_sistema con configuracion distinta a la aprobada', v_email_vanessa;
  END IF;

  ----------------------------------------------------------------------------
  -- PRE-CHECK PC-E: sin relación CONFLICTIVA previa en usuario_empresas
  --   (SOLO para los 2 usuarios aprobados; la tabla puede contener otros)
  ----------------------------------------------------------------------------
  IF EXISTS (SELECT 1
               FROM public.usuario_empresas ue
               JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
              WHERE us.auth_id IN (v_auth_galero, v_auth_vanessa)
                AND NOT (ue.empresa_id = v_empresa_uuid
                         AND ((us.auth_id = v_auth_galero  AND ue.rol_id = v_rol_super  AND ue.activo)
                           OR (us.auth_id = v_auth_vanessa AND ue.rol_id = v_rol_admin AND ue.activo)))) THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: existe relacion usuario-empresa con configuracion distinta a la aprobada para los usuarios aprobados';
  END IF;

  RAISE NOTICE 'FASE 3.4 PRE-VALIDACION OK: correos verificados en auth.users; empresa %; roles super_admin=%, admin=%',
      v_empresa_uuid, v_rol_super, v_rol_admin;

  ----------------------------------------------------------------------------
  -- B) INSERT idempotente en usuarios_sistema (email real desde auth.users;
  --    nombre = email como representación técnica segura, sin inventar personas)
  ----------------------------------------------------------------------------
  INSERT INTO public.usuarios_sistema (auth_id, email, nombre, activo, rol_id, empresa_id, created_at)
  SELECT au.id, au.email, au.email, true, v_rol_super, v_empresa_uuid, now()
    FROM auth.users au
   WHERE au.id = v_auth_galero
     AND NOT EXISTS (SELECT 1 FROM public.usuarios_sistema us WHERE us.auth_id = au.id);
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  RAISE NOTICE 'FASE 3.4 usuarios_sistema: % insertado (% filas) — 0 si ya existia correcto', v_email_galero, v_cnt;

  INSERT INTO public.usuarios_sistema (auth_id, email, nombre, activo, rol_id, empresa_id, created_at)
  SELECT au.id, au.email, au.email, true, v_rol_admin, v_empresa_uuid, now()
    FROM auth.users au
   WHERE au.id = v_auth_vanessa
     AND NOT EXISTS (SELECT 1 FROM public.usuarios_sistema us WHERE us.auth_id = au.id);
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  RAISE NOTICE 'FASE 3.4 usuarios_sistema: % insertado (% filas) — 0 si ya existia correcto', v_email_vanessa, v_cnt;

  ----------------------------------------------------------------------------
  -- C) Resolver ids y poblar usuario_empresas (idempotente, respeta PK)
  ----------------------------------------------------------------------------
  SELECT id INTO v_us_galero FROM public.usuarios_sistema WHERE auth_id = v_auth_galero;
  IF v_us_galero IS NULL THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: no se pudo resolver usuarios_sistema.id para %', v_email_galero;
  END IF;
  SELECT id INTO v_us_vanessa FROM public.usuarios_sistema WHERE auth_id = v_auth_vanessa;
  IF v_us_vanessa IS NULL THEN
    RAISE EXCEPTION 'FASE 3.4 BLOQUEO: no se pudo resolver usuarios_sistema.id para %', v_email_vanessa;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.usuario_empresas
                  WHERE usuario_id = v_us_galero AND empresa_id = v_empresa_uuid) THEN
    INSERT INTO public.usuario_empresas (usuario_id, empresa_id, rol_id, activo)
    VALUES (v_us_galero, v_empresa_uuid, v_rol_super, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.usuario_empresas
                  WHERE usuario_id = v_us_vanessa AND empresa_id = v_empresa_uuid) THEN
    INSERT INTO public.usuario_empresas (usuario_id, empresa_id, rol_id, activo)
    VALUES (v_us_vanessa, v_empresa_uuid, v_rol_admin, true);
  END IF;

  RAISE NOTICE 'FASE 3.4 relaciones aseguradas: % <> Transportes Tz''unun(super_admin), % <> Transportes Tz''unun(admin)',
      v_email_galero, v_email_vanessa;

  ----------------------------------------------------------------------------
  -- D) GATE 3.4 (DENTRO de la misma sentencia atómica de las escrituras).
  --    Verifica SOLO la configuración de los 2 usuarios aprobados. Si cualquier
  --    condición crítica falla -> RAISE EXCEPTION revierte TODO el bloque.
  ----------------------------------------------------------------------------
  -- (1) exactamente 2 filas en usuarios_sistema para los 2 auth_id aprobados
  SELECT count(*) INTO v_g_users
    FROM public.usuarios_sistema
   WHERE auth_id IN (v_auth_galero, v_auth_vanessa);
  IF v_g_users <> 2 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: filas usuarios_sistema de los 2 auth_id = % (esperado 2)', v_g_users;
  END IF;

  -- (2) exactamente 1 fila para cada auth_id
  SELECT count(*) INTO v_g_galero_us FROM public.usuarios_sistema WHERE auth_id = v_auth_galero;
  SELECT count(*) INTO v_g_vanessa_us FROM public.usuarios_sistema WHERE auth_id = v_auth_vanessa;
  IF v_g_galero_us <> 1 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: filas usuarios_sistema de % = % (esperado 1)', v_email_galero, v_g_galero_us;
  END IF;
  IF v_g_vanessa_us <> 1 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: filas usuarios_sistema de % = % (esperado 1)', v_email_vanessa, v_g_vanessa_us;
  END IF;

  -- (8) sin duplicados de auth_id entre los aprobados
  SELECT count(*) - count(DISTINCT auth_id) INTO v_g_dup_auth
    FROM public.usuarios_sistema
   WHERE auth_id IN (v_auth_galero, v_auth_vanessa);
  IF v_g_dup_auth <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: auth_id duplicados = % (esperado 0)', v_g_dup_auth;
  END IF;

  -- (9) sin duplicados de email entre los aprobados
  SELECT count(*) - count(DISTINCT lower(email)) INTO v_g_dup_email
    FROM public.usuarios_sistema
   WHERE lower(email) IN (lower(v_email_galero), lower(v_email_vanessa));
  IF v_g_dup_email <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: emails duplicados = % (esperado 0)', v_g_dup_email;
  END IF;

  -- (extra) ninguna fila con email aprobado pero auth_id ajeno
  SELECT count(*) INTO v_g_otros
    FROM public.usuarios_sistema
   WHERE lower(email) IN (lower(v_email_galero), lower(v_email_vanessa))
     AND auth_id NOT IN (v_auth_galero, v_auth_vanessa);
  IF v_g_otros <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: emails aprobados registrados con auth_id ajeno = % (esperado 0)', v_g_otros;
  END IF;

  -- (3) exactamente 2 relaciones para los 2 usuarios aprobados
  SELECT count(*) INTO v_g_rels
    FROM public.usuario_empresas ue
    JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
   WHERE us.auth_id IN (v_auth_galero, v_auth_vanessa);
  IF v_g_rels <> 2 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: relaciones de los 2 aprobados = % (esperado 2)', v_g_rels;
  END IF;

  -- (4) y (5) exactamente 1 relación por usuario y ninguna adicional
  SELECT count(*) INTO v_g_galero_rels
    FROM public.usuario_empresas ue
    JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
   WHERE us.auth_id = v_auth_galero;
  SELECT count(*) INTO v_g_vanessa_rels
    FROM public.usuario_empresas ue
    JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
   WHERE us.auth_id = v_auth_vanessa;
  IF v_g_galero_rels <> 1 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: relaciones de % = % (esperado exactamente 1)', v_email_galero, v_g_galero_rels;
  END IF;
  IF v_g_vanessa_rels <> 1 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: relaciones de % = % (esperado exactamente 1)', v_email_vanessa, v_g_vanessa_rels;
  END IF;

  -- (10) sin duplicados (usuario_id, empresa_id) entre los aprobados
  SELECT count(*) - count(DISTINCT (ue.usuario_id, ue.empresa_id)) INTO v_g_dup_pair
    FROM public.usuario_empresas ue
    JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
   WHERE us.auth_id IN (v_auth_galero, v_auth_vanessa);
  IF v_g_dup_pair <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: pares (usuario_id, empresa_id) duplicados = % (esperado 0)', v_g_dup_pair;
  END IF;

  -- (6) galheroa: auth_id, email, empresa, rol_id=1 (super_admin), activo=true
  SELECT count(*) INTO v_g_bad_galero
    FROM public.usuarios_sistema us
    JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
   WHERE us.auth_id = v_auth_galero
     AND NOT (lower(us.email) = lower(v_email_galero)
              AND us.empresa_id = v_empresa_uuid
              AND us.rol_id = v_rol_super
              AND us.activo
              AND ue.empresa_id = v_empresa_uuid
              AND ue.rol_id = v_rol_super
              AND ue.activo);
  IF v_g_bad_galero <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: % no cumple la configuracion aprobada (auth_id/email/empresa/rol/activo)', v_email_galero;
  END IF;

  -- (7) vanessa: auth_id, email, empresa, rol_id=2 (admin), activo=true
  SELECT count(*) INTO v_g_bad_vanessa
    FROM public.usuarios_sistema us
    JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
   WHERE us.auth_id = v_auth_vanessa
     AND NOT (lower(us.email) = lower(v_email_vanessa)
              AND us.empresa_id = v_empresa_uuid
              AND us.rol_id = v_rol_admin
              AND us.activo
              AND ue.empresa_id = v_empresa_uuid
              AND ue.rol_id = v_rol_admin
              AND ue.activo);
  IF v_g_bad_vanessa <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: % no cumple la configuracion aprobada (auth_id/email/empresa/rol/activo)', v_email_vanessa;
  END IF;

  -- (11) usuarios futuros NO creados en usuarios_sistema
  SELECT count(*) INTO v_g_futuros
    FROM public.usuarios_sistema
   WHERE lower(email) IN ('maria.reyes.g@gmail.com', 'tzununautorentas@gmail.com');
  IF v_g_futuros <> 0 THEN
    RAISE EXCEPTION 'GATE 3.4 BLOQUEO: usuarios futuros presentes en usuarios_sistema = % (esperado 0)', v_g_futuros;
  END IF;

  RAISE NOTICE 'GATE 3.4 OK: galheroa=super_admin(1) y vanessa=admin(2) en Transportes Tz''unun, activos, sin duplicados, futuros no creados';
END $$;

-- ============================================================================
-- POST-CHECKS INFORMATIVOS (SOLO LECTURA; no definen el éxito de la migración)
-- ============================================================================

-- ============================================================================
-- PC-POST-1 — USUARIOS (SOLO los 2 aprobados)
-- ============================================================================
SELECT us.id,
       us.auth_id,
       us.email,
       us.nombre,
       us.activo,
       us.rol_id,
       us.empresa_id
  FROM public.usuarios_sistema us
 WHERE lower(us.email) IN ('galheroa@gmail.com', 'vanessamgh@gmail.com')
 ORDER BY us.email;

-- ============================================================================
-- PC-POST-2 — RELACIONES (SOLO los 2 aprobados)
-- ============================================================================
SELECT ue.usuario_id,
       ue.empresa_id,
       ue.rol_id,
       ue.activo,
       us.email,
       r.nombre AS rol,
       e.nombre  AS empresa
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
  JOIN public.roles             r  ON r.id  = ue.rol_id
  JOIN public.empresas          e  ON e.id  = ue.empresa_id
 WHERE lower(us.email) IN ('galheroa@gmail.com', 'vanessamgh@gmail.com')
 ORDER BY us.email;

-- ============================================================================
-- PC-POST-3 — ASIGNACIONES APROBADAS
-- ============================================================================
SELECT concat(us.email, ' -> ', e.nombre, ' -> ', r.nombre, ' -> ',
              CASE WHEN ue.activo THEN 'activo' ELSE 'inactivo' END) AS asignacion
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
  JOIN public.roles             r  ON r.id  = ue.rol_id
  JOIN public.empresas          e  ON e.id  = ue.empresa_id
 WHERE lower(us.email) IN ('galheroa@gmail.com', 'vanessamgh@gmail.com')
 ORDER BY us.email;

-- ============================================================================
-- PC-POST-4 — INTEGRIDAD (SIEMPRE filtrada a los 2 usuarios aprobados)
-- ============================================================================
SELECT
  (SELECT count(*) - count(DISTINCT auth_id)
     FROM public.usuarios_sistema
    WHERE auth_id IN ('6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4',
                      'b9e1dda6-05d2-4e31-bce4-1c73210c09f4')) AS duplicados_auth_id_aprobados,

  (SELECT count(*) - count(DISTINCT lower(email))
     FROM public.usuarios_sistema
    WHERE lower(email) IN ('galheroa@gmail.com', 'vanessamgh@gmail.com')) AS duplicados_email_aprobados,

  (SELECT count(*) - count(DISTINCT (ue.usuario_id, ue.empresa_id))
     FROM public.usuario_empresas ue
     JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
    WHERE us.auth_id IN ('6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4',
                         'b9e1dda6-05d2-4e31-bce4-1c73210c09f4')) AS duplicados_par_aprobados;

SELECT (count(*) = 2) AS exactamente_2_relaciones_activas_de_aprobados,
       count(*)       AS relaciones_activas_de_aprobados
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
 WHERE us.auth_id IN ('6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4',
                      'b9e1dda6-05d2-4e31-bce4-1c73210c09f4')
   AND ue.activo;

SELECT (count(*) = 2) AS ambos_con_empresa_correcta,
       (count(*) = 2
        AND bool_and(
              CASE WHEN us.email = 'galheroa@gmail.com'
                   THEN ue.rol_id = (SELECT id FROM public.roles WHERE nombre = 'super_admin')
                   WHEN us.email = 'vanessamgh@gmail.com'
                   THEN ue.rol_id = (SELECT id FROM public.roles WHERE nombre = 'admin')
                   ELSE false END
            ))       AS ambos_con_rol_correcto,
       bool_and(e.id = 'adc5f324-a108-49ad-875c-779afe3b9f7f') AS ambos_en_transportes_tzunun
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
  JOIN public.empresas          e  ON e.id  = ue.empresa_id
 WHERE us.auth_id IN ('6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4',
                      'b9e1dda6-05d2-4e31-bce4-1c73210c09f4');

-- ============================================================================
-- PC-POST-5 — SIN REGISTROS ADICIONALES PARA LOS APROBADOS + FUTUROS NO CREADOS
-- ============================================================================
SELECT count(*) AS usuarios_aprobados_en_usuarios_sistema
  FROM public.usuarios_sistema us
  JOIN auth.users au ON au.id = us.auth_id
 WHERE au.email IN ('galheroa@gmail.com', 'vanessamgh@gmail.com');

SELECT count(*) AS relaciones_aprobadas_en_usuario_empresas
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
  JOIN auth.users au ON au.id = us.auth_id
 WHERE au.email IN ('galheroa@gmail.com', 'vanessamgh@gmail.com');

SELECT count(*) AS usuarios_futuros_no_creados
  FROM public.usuarios_sistema
 WHERE lower(email) IN ('maria.reyes.g@gmail.com', 'tzununautorentas@gmail.com');

-- ============================================================================
-- PC-POST-6 — AUTHZ (coherencia; requiere sesión Auth real)
-- ============================================================================
SELECT 'POSTCHECK AUTHZ: requiere sesion Auth real'::text AS nota;

-- ============================================================================
-- FASE 3.4 — RESULTADO
-- ============================================================================
SELECT item, detalle
  FROM (VALUES
    ('usuarios incorporados',
     '2: galheroa@gmail.com, vanessamgh@gmail.com'),
    ('relaciones empresa/usuario',
     '2 (Transportes Tz´unun)'),
    ('roles asignados',
     'super_admin (galheroa@gmail.com), admin (vanessamgh@gmail.com)'),
    ('usuarios futuros excluidos',
     'maria.reyes.g@gmail.com, tzununautorentas@gmail.com — NO creados'),
    ('tablas modificadas',
     'public.usuarios_sistema, public.usuario_empresas'),
    ('auth.users modificada',
     'NO'),
    ('RLS activado',
     'NO'),
    ('atomicidad',
     'pre-checks + inserciones + GATE 3.4 en un UNICO bloque DO (atómico); cualquier error lo revierte todo'),
    ('postchecks',
     'PC-POST-1..6 informativos SOLO LECTURA — el éxito lo decide el GATE dentro del DO')
  ) AS r(item, detalle);