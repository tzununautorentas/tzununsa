# FASE 3.2B — PLAN DETALLADO DE IMPLEMENTACIÓN

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Alcance: **multiempresa + autorización por empresa y usuario** (infraestructura de esquema y funciones)
Estado del documento: **PARA REVISIÓN — NO EJECUTAR NADA (ni SQL, ni deploy, ni código). Esperar aprobación.**
Fecha: 2026-09-16

---

## 0. REGISTRO DE FASE 3.2A — COMPLETADA

La FASE 3.2A fue ejecutada manualmente por el usuario en Supabase SQL Editor como OWNER y quedó **VALIDADA** (evidencias confirmadas el 2026-09-16):

| Verificación | Resultado |
|---|---|
| `asientos_contables.origen_tipo` | OK |
| `asientos_contables.evento_tipo` | OK, `NOT NULL` |
| `asientos_contables.estado` | OK |
| CHECK `ck_asiento_estado` | OK |
| UNIQUE INDEX `uq_asientos_identidad` | OK |
| `asiento_lineas.empresa_id` | OK, `NOT NULL` |
| `asiento_lineas` sin `empresa_id` | 0 |
| `facturas` sin canónicos (`numero_factura`/`nombre_receptor`/`nit_receptor`) | 0 / 0 / 0 |
| `facturas` anuladas (vía `estado='anulada'`) | 2, correctas |
| `asientos_contables` / `asiento_lineas` / `usuarios_sistema` | 0 / 0 / 0 filas |
| PostgreSQL | 17.6 |
| Backup `_bkp_32` | creado y verificado |

Restricciones cumplidas: **no** se creó `facturas.anulada`, **no** se modificó `facturas.estado`, **no** se tocaron los 2 movimientos bancarios con `cuenta_id NULL`, **no** se creó/modificó la cuenta `5.2.1`, **no** se implementaron 3.2B/3.2C/3.2D, **no** se activó RLS.
Estado de FASE 3.2A: **COMPLETADA Y VALIDADA.**

Este documento prepara **únicamente** la implementación de FASE 3.2B.

---

## 1. OBJETIVO

Crear la **infraestructura multiempresa** de autorización: un esquema `authz`, la tabla puente **`usuario_empresas`** (usuario ↔ empresa ↔ rol, con rol por empresa), índices de unicidad en `usuarios_sistema`, y las funciones `authz.es_super_admin()` y `authz.empresas_autorizadas()` — **sin activar RLS** (la RLS es FASE 3.6) y **sin poblar datos** (la población es FASE 3.4, requiere la lista real de usuarios).

El objetivo de 3.2B es dejar **el andamiaje de autorización listo y verificable**, manteniendo el comportamiento actual de la app (un único usuario y una única empresa funcionan igual que hoy mediante el fallback legacy).

---

## 2. ESTADO ACTUAL VERIFICADO (esquema real, fuente: pre-flight FASE 3.2 + validación 3.2A)

> Regla del proyecto: **no asumir el esquema del plan original — usar los resultados reales.** Lo siguiente está confirmado por OWNER.

### 2.1. Tabla `roles` (3 filas — VERIFICADO)

| columna | tipo | valor real |
|---|---|---|
| `id` | **`integer`** (NO uuid) | 1, 2, 3 |
| `nombre` | text | `super_admin`, `admin`, `usuario` |
| `descripcion` | text | sí |
| `permisos` | jsonb | `super_admin → {"todo": true}`; `admin → {flota,clientes,reservas,facturacion,cotizaciones:true, configuracion:false}`; `usuario → {reservas,cotizaciones:true, configuracion:false}` |
| `created_at` | timestamptz | sí |

### 2.2. Tabla `usuarios_sistema` (0 filas — VERIFICADO)

| columna | tipo | observación |
|---|---|---|
| `id` | **`uuid`** | PK |
| `auth_id` | uuid (permite NULL) | vínculo con `auth.users` (NULL posible) |
| `email` | text | |
| `rol_id` | integer | **rol legacy global** (una sola empresa) |
| `empresa_id` | uuid | **legacy:** "empresa principal" (back-compat). **No es frontera de seguridad.** |
| `activo` | boolean | |
| `created_at` | timestamptz | |

Hoy **0 filas** → ningún usuario aparece vinculado a empresa/rol vía esta tabla (el login pasa solo por Supabase Auth).

### 2.3. Tabla `empresas` (1 fila — VERIFICADO)

- `id: uuid` — única empresa real: `adc5f324-a108-49ad-875c-779afe3b9f7f` · "Transportes Tz´unun" · NIT `66907853`.
- Columnas de serie editables usadas por `siguienteNumero`: `ultima_cotizacion`, `ultima_reserva`, `ultima_factura`.

### 2.4. Tabla `usuario_empresas`

- **NO EXISTE** (probe `400`, no hay tabla equivalente). Se creará en 3.2B.

### 2.5. Estado tras FASE 3.2A (estructura contable ya lista)

`asientos_contables` cuenta con `origen_tipo`, `origen_id`, `evento_tipo`, `estado` (+CHECK), `empresa_id` y `uq_asientos_identidad`; `asiento_lineas` tiene `empresa_id NOT NULL`. Esto habilita multiempresa contable sin dependencias extra.

### 2.6. Comportamiento actual del frontend (verificado en código)

- `App.jsx:641-646` — al autenticarse, `empId = dbGet("empresas","&select=id&limit=1")` → **siempre la primera empresa**, sin selector.
- `config.js:150-153` (`getEmpId`) — mismo comportamiento (`limit=1`).
- Todas las lecturas/escrituras operativas llevan `empresa_id` en la mayoría de creates (Clientes, Cotizaciones, Reservas, Facturas, Pagos, Gastos, Banca…) pero **muchas lecturas son globales sin filtro** (`dashboardService`, `Notificaciones`, `usePaginacion`, partes de Contabilidad/Gastos/Banca/Pagos/Facturacion según auditoría §7). Con 1 empresa no hay fuga visible; con 2+ se mezcla todo (lo resuelve RLS en 3.6 + ajuste de lecturas).
- `Configuracion.jsx:274` — `PanelUsuarios` lee `usuarios_sistema?select=*,rol:rol_id(*)&empresa_id=eq.${empId}` (modelo legacy).
- `Configuracion.jsx:313-343` — `PanelRoles` muestra `roles` y sus `permisos` jsonb.

---

## 3. ARQUITECTURA PROPUESTA

```
auth.users (Supabase Auth)              auth.uid() == usuarios_sistema.auth_id
   │
   ▼
usuarios_sistema  (identidad; empresa_id SOLO back-compat)
   │  id (uuid) · auth_id · email · rol_id (legacy) · empresa_id (legacy) · activo
   │
   ▼  N:M
usuario_empresas  (AUTORIDAD NUEVA: rol por empresa)
   │  usuario_id (uuid FK) · empresa_id (uuid FK) · rol_id (integer FK) · activo
   │
   ▼
empresas  (id uuid)
```

**Principios de diseño (ya aprobados en FASE3A_INFORME_APROBACION / FASE3A1_INFORME_TECNICO):**

1. La **autorización** se resuelve SIEMPRE desde `usuario_empresas`, **nunca** desde `usuarios_sistema.empresa_id` ni desde su `rol_id` (que quedan como compatibilidad histórica).
2. Un usuario puede pertenecer a **N empresas con N roles distintos** (ej.: `admin` en Tz'unun, `usuario` en otra empresa).
3. Mientras `usuario_empresas` no tenga registros para ese usuario/empresa, **el fallback permite usar `usuarios_sistema.rol_id` legacy** para que la app siga funcionando (una sola empresa). Cuando se pueble la relación del usuario, el fallback deja de aplicarse para ese vínculo (ver §5).
4. RLS se activa SOLO en FASE 3.6, con "puerta dura": no se activa hasta haber poblado usuarios reales y demostrado con un usuario de prueba. 3.2B solo crea el andamiaje.

---

## 4. TABLAS / COLUMNAS NECESARIAS (a crear)

> Todos los tipos verificados contra el esquema real (§2): `roles.id` = **integer**, `usuarios_sistema.id` = **uuid**, `empresas.id` = **uuid**.

### 4.1. Schema `authz`

```sql
-- (NO EJECUTAR — bloque 3.2B)
CREATE SCHEMA IF NOT EXISTS authz;
```

### 4.2. Tabla puente `usuario_empresas` (vacía)

```sql
-- (NO EJECUTAR — bloque 3.2B)
CREATE TABLE IF NOT EXISTS usuario_empresas (
  usuario_id uuid   NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  empresa_id uuid   NOT NULL REFERENCES empresas(id)        ON DELETE RESTRICT,
  rol_id     integer NOT NULL REFERENCES roles(id)          ON DELETE RESTRICT,
  activo     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (usuario_id, empresa_id)
);
CREATE INDEX IF NOT EXISTS idx_ue_empresa ON usuario_empresas (empresa_id);
CREATE INDEX IF NOT EXISTS idx_ue_usuario ON usuario_empresas (usuario_id);
```

- `rol_id integer` = rol POR EMPRESA (consigna del usuario; verificado: `roles.id` es integer).
- `PRIMARY KEY (usuario_id, empresa_id)` impide duplicar el mismo usuario en la misma empresa.
- `activo=false` desvincula la empresa para ese usuario sin borrar fila (auditoría).
- `ON DELETE CASCADE` en usuario · `ON DELETE RESTRICT` en empresa y rol (no se borran referenciados).

### 4.3. Índices de unicidad en `usuarios_sistema` (identidad estable)

```sql
-- (NO EJECUTAR — bloque 3.2B)
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_auth  ON usuarios_sistema (auth_id)  WHERE auth_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_email ON usuarios_sistema (lower(email)) WHERE email IS NOT NULL;
```

- 1 `auth_id` = 1 `usuarios_sistema` (no duplicar identidades).
- email único normalizado (case-insensitive).

---

## 5. FUNCIONES `authz` (esquema — sin RLS aún)

### 5.1. `authz.empresas_autorizadas()` — lista de empresas del usuario autenticado

```sql
-- (NO EJECUTAR — bloque 3.2B)
CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT DISTINCT ue.empresa_id
  FROM public.usuarios_sistema us
  JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
  WHERE us.auth_id = auth.uid()
    AND us.activo
    AND ue.activo;
$$;
REVOKE ALL ON FUNCTION authz.empresas_autorizadas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.empresas_autorizadas() TO authenticated;
```

Semántica:
- Devuelve **solo las empresas** donde el usuario tiene fila `activa` en `usuario_empresas`.
- Si `usuario_empresas` está vacía → devuelve conjunto vacío → la app usa el fallback frontend (primera empresa, comportamiento actual) hasta que se pueble.
- `SECURITY DEFINER` + `search_path` fijo + `REVOKE`/`GRANT` → segura: `anon` no puede ejecutarla, `authenticated` sí.

### 5.2. `authz.es_super_admin()` — super admin GLOBAL (multiempresa + fallback legacy)

> Fuente primaria: rol por empresa en `usuario_empresas`. **Fallback al rol legacy `usuarios_sistema.rol_id` SOLO mientras no exista un registro en `usuario_empresas` PARA ESE USUARIO** (consigna del usuario, punto 8 — refinamiento del SQL del pre-flight §6 que usaba un `NOT EXISTS` global).

```sql
-- (NO EJECUTAR — bloque 3.2B)
CREATE OR REPLACE FUNCTION authz.es_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  -- (1) Autoridad nueva: super_admin en ALGUNA empresa vía usuario_empresas
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
    JOIN public.roles r ON r.id = ue.rol_id
    WHERE us.auth_id = auth.uid()
      AND us.activo AND ue.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
  )
  OR
  -- (2) Fallback legacy SOLO si este usuario aún no tiene vínculos en usuario_empresas
  EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.roles r ON r.id = us.rol_id
    WHERE us.auth_id = auth.uid()
      AND us.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
      AND NOT EXISTS (
        SELECT 1 FROM public.usuario_empresas ue2
        WHERE ue2.usuario_id = us.id
      )
  );
$$;
REVOKE ALL ON FUNCTION authz.es_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.es_super_admin() TO authenticated;
```

Razones de diseño:
- **(1)** reconoce super_admin por empresa (nueva autoridad N:M).
- **(2)** conserva la semántica legacy SOLO mientras `usuario_empresas` no tenga filas para ese usuario; al poblar sus vínculos, el fallback deja de aplicarse a él (no se duplican privilegios ni se "casa" con una empresa arbitraria).
- Con `usuarios_sistema` vacía (estado actual) devuelve `false`; **esto es correcto y esperado**: el super admin de facto deberá quedar registrado en 3.4 (población con la lista real) antes de confiar en RLS (3.6).
- `SECURITY DEFINER` con owner que evade RLS interno; acceso externo gobernado por `REVOKE`/`GRANT`.

---

## 6. REGLAS DE AUTORIZACIÓN POR EMPRESA

Resumen de reglas que esta infraestructura habilita (las políticas se activan en 3.6; aquí se documentan):

| Regla | Descripción |
|---|---|
| A1 | Un usuario autenticado solo ve/edita filas cuyo `empresa_id` esté en `authz.empresas_autorizadas()`. |
| A2 | Catálogos coherentes multiempresa (ej. `cuentas_contables`): se permite `empresa_id IS NULL` (maestro global) **o** `empresa_id∈autorizadas`. |
| A3 | `asiento_lineas.empresa_id` DEBE coincidir con `empresa_id` del asiento padre (anti-escalamiento; `WITH CHECK`). |
| A4 | Super admin (global) puede administrar usuarios/empresas; `usuarios_sistema` y `usuario_empresas` se leen "propias" (`auth.uid()=auth_id`) o super admin. |
| A5 | Las **reglas de negocio** (no borrar contabilizados/conciliados/certificados; anular con `estado`) son separadas del RLS (protección de app + triggers defensivos opcionales). |
| A6 | Usuario inactivo (`usuarios_sistema.activo=false`) o vínculo inactivo (`usuario_empresas.activo=false`) → no autorizado, sin borrado físico. |
| A7 | Empresa "desactivada" se neutraliza marcando `usuario_empresas.activo=false` (todas las políticas dependen de la función → invisible sin tocar filas de la empresa). |

**Escrituras:** en cada tabla operativa, `WITH CHECK (empresa_id IN (authz.empresas_autorizadas()))` → una fila apuntando a empresa no autorizada es rechazada incluso en INSERT/UPDATE.

---

## 7. RELACIÓN USUARIO ↔ EMPRESA ↔ ROL

- **Usuario (identity):** fila en `auth.users` (Supabase Auth) + su espejo `usuarios_sistema` (`auth_id` único). El `email` en `usuarios_sistema` es la clave humana para mapear.
- **Empresa:** fila en `empresas` (`uuid`).
- **Vínculo:** fila en `usuario_empresas(usuario_id, empresa_id, rol_id, activo)` → N:M.
- **Rol por empresa:** `rol_id` apunta a `roles.id` (integer). Un usuario `admin` en Empresa A puede ser `usuario` en Empresa B.
- **Navegación:** `auth.uid() → usuarios_sistema.auth_id → usuario_empresas → empresas + rol_id → roles(permisos jsonb)`.
- **Frontend:** se resuelve la empresa activa del vínculo y su rol para gobernar la UI por módulo (botones/menús según `roles.permisos`).

---

## 8. COMPATIBILIDAD TEMPORAL CON `usuarios_sistema.rol_id` (fallback)

- **Mientras** `usuario_empresas` no tenga registros **para ese usuario**, se usa el `rol_id` global legacy de `usuarios_sistema` (es exactamente lo que hace hoy la app con una sola empresa).
- **Al poblarse** el vínculo del usuario en `usuario_empresas`, el rol deja de leerse de `usuarios_sistema.rol_id` y pasa a leerse del vínculo (**no hay doble fuente para el mismo usuario**).
- `usuarios_sistema.empresa_id` se mantiene como "empresa principal" informativa/de compatibilidad; **nunca** como frontera de seguridad.
- El código de frontend (`Configuracion.jsx`, `getEmpId`, `App.jsx`) se ajusta para: (1) intentar resolver empresas por `usuario_empresas`; (2) si el resultado es vacío, caer al comportamiento legacy actual (ver §10).

---

## 9. ESTRATEGIA DE MIGRACIÓN

1. **Momento:** FASE 3.2B se ejecuta DESPUÉS de 3.2A (ya validada) y ANTES de 3.2C/3.2D. No depende de datos.
2. **Orden en BD (bloque único, idempotente, con `IF NOT EXISTS` pre-checks por regla 10):**
   - `CREATE SCHEMA IF NOT EXISTS authz`
   - `CREATE TABLE IF NOT EXISTS usuario_empresas` (+ 2 índices)
   - `CREATE UNIQUE INDEX IF NOT EXISTS uq_us_auth / uq_us_email`
   - `CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()` (+ REVOKE/GRANT)
   - `CREATE OR REPLACE FUNCTION authz.es_super_admin()` (+ REVOKE/GRANT)
3. **No puebla nada** (ni `usuarios_sistema` ni `usuario_empresas` ni `empresas`). La población es FASE 3.4 con la lista real de usuarios.
4. **No toca RLS** (políticas existentes o ausentes quedan intactas).
5. **Código:** cambios de frontend en el mismo commit de la fase (evita que la app quede en estado intermedio).
6. **Rollback (documentado, por bloque):**
   ```sql
   -- (NO EJECUTAR — solo en reversión)
   DROP TABLE IF EXISTS usuario_empresas;
   DROP FUNCTION IF EXISTS authz.empresas_autorizadas();
   DROP FUNCTION IF EXISTS authz.es_super_admin();
   DROP INDEX IF EXISTS uq_us_auth;
   DROP INDEX IF EXISTS uq_us_email;
   -- (conservar el schema authz si se prefiere; si no:)
   DROP SCHEMA IF EXISTS authz;
   ```
   La reversión es inocua porque las tablas/funciones están vacías y sin RLS.

---

## 10. RLS Y POLÍTICAS PROPUESTAS — **NO EJECUTAR EN 3.2B**

Se documentan aquí para alinear 3.2B con el diseño aprobado (FASE3A1 §6) y para que 3.6 las aplique. **En 3.2B estas políticas NO se crean.**

### 10.1. Patrón por tabla operativa (ej. `facturas`)

```sql
-- (NO EJECUTAR — bloque 3.6)
ALTER POLICY "facturas_select" ON public.facturas
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));
ALTER POLICY "facturas_insert" ON public.facturas
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));
ALTER POLICY "facturas_update" ON public.facturas
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()))
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));
ALTER POLICY "facturas_delete" ON public.facturas
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));
```

### 10.2. Catálogos multiempresa (ej. `cuentas_contables`)

```sql
-- (NO EJECUTAR — bloque 3.6)
-- maestro global permitido SÓLO en SELECT:
... USING (empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()));
```

### 10.3. `asiento_lineas` (anti-escalamiento)

```sql
-- (NO EJECUTAR — bloque 3.6)
-- SELECT/UPDATE/DELETE: empresa_id de la línea ∈ autorizadas
-- INSERT/UPDATE con WITH CHECK adicional:
--   empresa_id = (SELECT a.empresa_id FROM asientos_contables a WHERE a.id = asiento_id)
```

### 10.4. Tablas de autorización (`usuarios_sistema`, `usuario_empresas`, `roles`)

```sql
-- (NO EJECUTAR — bloque 3.6)
-- usuarios_sistema.SELECT: auth.uid() = auth_id OR authz.es_super_admin()
-- usuarios_sistema.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- usuario_empresas.SELECT: tiene una fila con mi usuario OR authz.es_super_admin()
-- usuario_empresas.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- roles.SELECT: todos los authenticated
```

### 10.5. Garantías del modelo (de diseño aprobado)

- `SECURITY DEFINER` + owner con BYPASSRLS: las funciones internas no se recortan; el acceso se gobierna por `REVOKE/GRANT`.
- `search_path = public, authz, pg_temp` fijo (anti-hijacking); referencias calificadas `public.`.
- Sin recursión: `usuarios_sistema`/`usuario_empresas` NUNCA llaman a `empresas_autorizadas()` (usan `auth.uid()` y `es_super_admin()`).
- `auth.uid()` NULL (no autenticado) → todo denegado + `anon` sin `EXECUTE`.
- **Puerta dura (3.6):** no se activa RLS hasta tener usuarios poblados y al menos un usuario de prueba que demuestre aislamiento.

---

## 11. CAMBIOS DE FRONTEND / BACKEND NECESARIOS

> En 3.2B: el backend es el bloque SQL del §4-5. El frontend se adapta para resolver empresas/rol por autoridad nueva con **fallback legacy**, SIN romper el flujo actual.

### 11.1. Backend (Supabase) — implementado en 3.2B

| Archivo | Cambio |
|---|---|
| `sql/migracion_fase_3_2b.sql` (nuevo) | §4.1 schema, §4.2 `usuario_empresas`, §4.3 índices, §5 funciones + REVOKE/GRANT |

### 11.2. Frontend — mismo commit, mínimo y sin regresión

| Archivo | Cambio propuesto | Riesgo |
|---|---|---|
| `src/config.js` (`getEmpId` :150) | Resolver empresas: consultar `usuario_empresas` para `auth.uid()`; si vacío → fallback `empresas limit=1` (comportamiento actual). No depende de RLS. | Bajo (mantiene fallback) |
| `src/App.jsx` (:641-646, +props) | `empId` desde la resolución multiempresa; preparar estado `empresasUsuario[]` para futuro selector. | Bajo |
| `src/pages/Configuracion.jsx` (`PanelUsuarios` :274) | Leer usuarios desde `usuario_empresas` (join usuarios_sistema y roles) con refuerzo por empresa; si `usuario_empresas` vacía → leer legacy `usuarios_sistema?empresa_id=…` (no rompe UI actual). | Medio |
| `src/pages/Configuracion.jsx` (`PanelRoles` :314) | Sin cambios de esquema; opcional agrupar permisos por rol (ya los muestra). | Bajo |
| `src/components/Notificaciones.jsx`, `src/services/dashboardService.js`, `src/hooks/usePaginacion.js` | **NO cambiar aún.** El filtrado por empresa correcto llega con RLS (3.6). Forzarlo ahora en frontend con filtros parciales puede ocultar datos huérfanos legítimos. Se documenta pendiente para 3.6. | — |
| Selector de empresa en UI | Preparar componente (nuevo) pero **no activarlo** hasta 3.4/3.6 (solo habrá 1 empresa real; evita superficie de error). | Bajo |

### 11.3. Llamada a las funciones desde el frontend (para cuando haga falta — 3.4+)

- `authz.empresas_autorizadas()` / `authz.es_super_admin()` se invocan vía RPC (`/rpc/empresas_autorizadas`, `/rpc/es_super_admin`) con el JWT de `authenticated`. La app ya usa `apiFetch` con Bearer JWT y maneja autenticación/refresh (FASE 3.1), por lo que podrá invocarlas sin cambios de seguridad.

---

## 12. RIESGOS

| # | Riesgo | Nivel | Mitigación |
|---|---|---|---|
| R1 | **`usuarios_sistema` está vacía** → `es_super_admin()` y `empresas_autorizadas()` devolverán vacío/false hoy. | **Alto** | No dependemos de ellas en 3.2B (no RLS, no gating). El super admin real se registra en 3.4 (lista real de usuarios). Documentado y esperado. |
| R2 | Confusión entre `usuarios_sistema.rol_id` y `usuario_empresas.rol_id` (doble fuente) | Medio | Regla §5.2: fallback SOLO mientras no haya vínculo del usuario; al poblar, prevalece el vínculo. Expresado en SQL con `NOT EXISTS` por usuario. |
| R3 | Romper la UI actual de PanelUsuarios si se cambia antes de poblar | Medio | Fallback legacy en frontend: si no hay `usuario_empresas`, seguir leyendo `usuarios_sistema` (hoy lista vacía; misma vista actual). |
| R4 | Fuga de datos entre empresas si se activa RLS antes de poblar | **Alto** | Puerta dura: RLS es 3.6, NO 3.2B. |
| R5 | `roles.id` asumido uuid (error de tipos) | — (Ya descartado) | Verificado: `roles.id` es `integer`. El DDL de 3.2B ya usa `integer`. |
| R6 | `usuario_empresas` creada con `rol_id` de tipo equivocado | Bajo | Verificación pre-ejecución del tipo de `roles.id` en SQL Editor (owner) antes del DDL. |
| R7 | Índices `uq_us_auth`/`uq_us_email` fallan si ya existen filas duplicadas | Bajo | `usuarios_sistema` tiene 0 filas (verificado) → sin colisiones. Verificar count antes por si acaso. |
| R8 | Commit SQL+código no simultáneo | Medio | Commit atómico: SQL + frontend en el mismo commit (igual que 3.2A). |
| R9 | `SECURITY DEFINER` mal configurado (search_path, grants) | Medio | Plantilla aprobada (FASE3A1 §6): `search_path` fijo, referencias `public.`, `REVOKE ALL … FROM PUBLIC` + `GRANT TO authenticated`, verificación con `to_regprocedure` y vía RPC. |

---

## 13. PRUEBAS (FASE 3.2B)

> Preferible ejecutar como OWNER en SQL Editor (como en 3.2A); la verificación final también puede validarse por REST con sesión real (lo que la clave `anon` permita leer).

### 13.1 Estructura

```sql
-- (verificación, ejecutar SOLO tras aprobar e implementar)
SELECT to_regclass('usuario_empresas')            AS tabla_creada;      -- esperado: usuario_empresas
SELECT to_regprocedure('authz.empresas_autorizadas()') AS fn_emp;      -- esperado: no NULL
SELECT to_regprocedure('authz.es_super_admin()')       AS fn_sadmin;   -- esperado: no NULL
SELECT indexname FROM pg_indexes WHERE indexname IN ('uq_us_auth','uq_us_email','idx_ue_empresa','idx_ue_usuario');
SELECT conname FROM pg_constraint WHERE conrelid='usuario_empresas'::regclass;
```

### 13.2 Semántica de roles (owner)

```sql
-- (verificación) confirma que rol por empresa funciona en el modelo
SELECT r.id, r.nombre, r.permisos FROM roles r ORDER BY r.id;   -- 1 super_admin / 2 admin / 3 usuario
SELECT count(*) FROM usuario_empresas;                           -- 0 (aún sin poblar)
SELECT count(*) FROM usuarios_sistema;                           -- 0 (aún sin poblar)
```

### 13.3 Funciones (con usuario real autenticado, vía app/REST — no con anon)

- `es_super_admin()` → ejecuta sin error y devuelve `true` o `false` consistente con el estado (0 vínculos → `false`; esperado).
- `empresas_autorizadas()` → ejecuta sin error; hoy devuelve conjunto vacío; al poblar (3.4) devuelve la(s) empresa(s) correctas.
- Mientras `usuario_empresas` esté vacía, verificar el fallback legacy: dar de alta temporalmente (en un entorno de prueba o con rollback) una fila `usuarios_sistema(auth_id=mi uid, rol_id=1, activo=true)` y validar que `es_super_admin()=true` sin vínculos; luego `ROLLBACK`.

### 13.4 Frontend (regresión tras commit)

- Smoke: login, navegación, dasboard, Contabilidad (asiento manual), Gastos, Facturacion, Banca, Configuración → sin errores.
- `getEmpId` resuelve la única empresa (fallback legacy).
- `PanelUsuarios` muestra lista vacía (igual que hoy) sin romper.

---

## 14. CRITERIOS DE ACEPTACIÓN

1. [`usuario_empresas` existe y vacía] `to_regclass` = `usuario_empresas`; `count(*)=0`.
2. [Índices/constraints] `uq_us_auth`, `uq_us_email`, `idx_ue_empresa`, `idx_ue_usuario`, PK `(usuario_id, empresa_id)` existen.
3. [Tipos correctos] `usuario_empresas.rol_id` es `integer` con FK a `roles.id`; `usuario_id` uuid FK a `usuarios_sistema.id`; `empresa_id` uuid FK a `empresas.id`.
4. [Funciones] `authz.empresas_autorizadas()` y `authz.es_super_admin()` existen; `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated`; ejecutan sin error (vía owner y vía RPC con sesión).
5. [Fallback] con `usuario_empresas` vacía, el rol legacy sigue funcional (validado §13.3 con transacción rollback).
6. [Sin efectos colaterales] `usuarios_sistema`, `empresas`, `roles` intactos; `count(*)` igual que antes; sin nuevas filas.
7. [Sin RLS] ninguna política RLS creada ni habilitada (igual que antes de 3.2B).
8. [Código] build exitoso (`npm run build`), app sin errores de consola en smoke test; `getEmpId`/`PanelUsuarios` con fallback legacy.
9. [Rollback verificado] ejecución de los DROP en §9.6 (en un entorno de prueba) restaura el estado previo sin errores ni pérdidas.

---

## 15. ORDEN EXACTO DE IMPLEMENTACIÓN

> **PROHIBIDO ejecutar hoy.** Este es el orden para cuando el usuario apruebe.

1. **Aprobación del usuario** de este documento.
2. **Backup previo (owner, SQL Editor):** confirmar/verificar `_bkp_32` existente (3.2A) o crear snapshot adicional `_bkp_32b` de `roles`, `usuarios_sistema`, `empresas` antes de cualquier DDL.
3. **Verificaciones pre-DDL (owner, SOLO LECTURA):**
   - `SELECT count(*) FROM usuarios_sistema;` (esperado 0; si >0 revisar índices únicos antes de crearlos)
   - `SELECT data_type FROM information_schema.columns WHERE table_name='roles' AND column_name='id';` (confirmar `integer`)
   - `SELECT to_regclass('usuario_empresas'), to_regprocedure('authz.empresas_autorizadas()'), to_regprocedure('authz.es_super_admin()');` (confirmar que NO existan)
   - `SELECT proname FROM pg_proc WHERE pronamespace='authz'::regnamespace;` (confirmar schema nuevo)
4. **Crear `sql/migracion_fase_3_2b.sql`** en el repo (bloque §4-§5, idempotente, con pre-cheques por regla 10 y NOTICE/EXCEPTION como en 3.2A).
5. **Aplicar el SQL** por el usuario como OWNER en Supabase SQL Editor (una sola ejecución), con guardas: si uno de los pre-checks falla → DETENER y reportar (regla 11).
6. **Aplicar cambios de frontend** (§11.2) en el mismo commit → `npm run build` → prueba de humo.
7. **Verificaciones 3.2B** (§13) y registro de resultados.
8. **Commit atómico** (SQL + código) y push (siguiendo el patrón de 3.2A: commit + push tras aprobación de aplicar).
9. **Entregar informe** con: archivos modificados, SQL ejecutado, estructura antes/después, pruebas y resultado, advertencias, operaciones NO ejecutadas, estado final (PASS / PASS CON OBSERVACIONES / BLOCKED).
10. **Detener.** Esperar aprobación antes de pasar a FASE 3.2C y posteriores.

---

## 16. LO QUE ESTA FASE EXPLÍCITAMENTE NO HACE

- NO activa RLS (FASE 3.6). NO crea políticas.
- NO puebla `usuarios_sistema` ni `usuario_empresas` (FASE 3.4, requiere lista real de usuarios).
- NO implementa 3.2C (constraint híbrido `NULLS NOT DISTINCT` en `cuentas_contables`) ni 3.2D (estructura bancaria).
- NO modifica `empresas`, `roles`, `usuarios_sistema`, ni datos operativos existentes.
- NO toca los 2 movimientos bancarios huérfanos ni `5.2.1`.
- NO introduce selector de empresa activo en UI aún (solo prepara la resolución con fallback).
- NO inventa columnas ni relaciones no verificadas (todo tipo/rango fue confirmado en el pre-flight).

---

**ESTADO: PLAN PARA REVISIÓN — pendiente aprobación del usuario. NO EJECUTAR. Detenido a la espera de revisión.**