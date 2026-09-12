# FASE 3A.1 — Informe técnico corregido y listo para aprobación

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Alcance: solo análisis read-only (código + PostgREST). Sin cambios, sin ejecución, sin deploy.

---

## 1. Correcciones realizadas al diseño

1. **`origen_tipo`: secuencia corregida.** La propuesta anterior creaba la columna y luego la renombraba (colisión). Corrección: **solo `RENAME`**, no hay columna nueva. Se verifica tipo textual y valores (`manual`).
2. **Trigger de saldos:** se corrige para recalcular `OLD.cuenta_id` y `NEW.cuenta_id` cuando cambia la cuenta, con bloqueo determinista ordenado.
3. **RLS endurecida:** se añaden `search_path` fijado, owner, `REVOKE/GRANT` de `EXECUTE`, política anti-recursión para tablas de autorización y comportamiento de `auth.uid()` NULL.
4. **JWT:** se detecta que hoy no hay SDK ni refresh real; la corrección es adoptar una sola fuente de verdad real (SDK o capa GoTrue), no un "segundo sistema" paralelo.
5. **Separación RLS ≠ reglas de negocio:** matriz por tabla SELECT/INSERT/UPDATE/DELETE (sección 6).
6. **CHECK de dominio de eventos diferido** hasta confirmar cobertura completa.

---

## 2. Modelo definitivo de idempotencia

Clave canónica: **(empresa_id, origen_tipo, origen_id, evento_tipo)**. Sin columna `idempotencia`.

- Índice **parcial**: `WHERE estado='activo' AND origen_id IS NOT NULL` (anulados/reversados y manuales no bloquean).
- `modulo_origen` → `origen_tipo`, una sola columna.

```sql
-- (NO EJECUTAR) Secuencia correcta
ALTER TABLE asientos_contables RENAME COLUMN modulo_origen TO origen_tipo;
-- luego: normalización + evento_tipo + índice (bloque 3.2A, ver sección 11)
ALTER TABLE asientos_contables
  ADD COLUMN evento_tipo text,
  ADD COLUMN estado text NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo','anulado','reversado'));

UPDATE asientos_contables
   SET origen_tipo = COALESCE(origen_tipo, 'manual'),
       evento_tipo = 'manual'
 WHERE origen_tipo IS NULL OR origen_id IS NULL;

ALTER TABLE asientos_contables
  ALTER COLUMN origen_tipo SET NOT NULL,
  ALTER COLUMN evento_tipo SET NOT NULL;

CREATE UNIQUE INDEX uq_asientos_identidad
  ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
  WHERE estado = 'activo' AND origen_id IS NOT NULL;
```

> **Criterio de no ejecución:** el SQL anterior de FASE 3A (`ADD COLUMN origen_tipo` + `RENAME`) queda **NO APROBADO** (duplicaría columnas). El corregido lo reemplaza.

---

## 3. Modelo definitivo de eventos

Revisión contra TODOS los módulos actuales (12 páginas + dashboard + gastos + banca + contabilidad):

| origen_tipo | Fuente que dispara el asiento | Uso actual | Uso futuro |
|---|---|---|---|
| `factura` | Facturas FEL | — (hoy solo `manual`/`gastos`) | Ingreso: IVA débito + ingreso/CxC |
| `cotizacion` | Cotizaciones | sin asiento (correcto: no es documento contable) | Reserva a pedido; por ahora **sin uso** |
| `reserva` | Reservas (anticipos) | — | Anticipo / depósito |
| `gasto` | Gastos | **SÍ — hoy escribe `'gastos'`** (Gastos.jsx:715) | (se normaliza a `gasto`) |
| `pago_cliente` | Pagos recibidos | — | Liquidación de CxC |
| `pago_proveedor` | Pagos a proveedores | — | (módulo futuro) |
| `movimiento_bancario` | Movimientos bancarios ERP | — | Conciliación/registro importado |
| `transferencia` | Transferencias internas | — | Origen y destino |
| `asiento` | Otro asiento (reversa) | — | Reversa de asiento |
| `manual` | Captura manual | **SÍ — Contabilidad.jsx:130** | Apertura/cierre |

**Decisiones de nombre:**
- **`'gastos'` → `'gasto'`** (singular): el valor actual del código es plural y no coincide con ninguna identidad; `origen_id` apunta a `gastos.id`, así que conviene el singular.
- **`pago_recibido` vs `pago_cliente`:** dos opciones válidas. **Recomendación: `pago_cliente`** (semántica de flujo, consistente con `pago_proveedor`). La tabla se llama `pagos_recibidos` pero el valor del origen describe el *concepto*, no el nombre de tabla. Se fija uno y se documenta.
- **`apertura`/`cierre`** NO son `origen_tipo`; se modelan como `origen_tipo='manual'`+`evento_tipo='apertura'|'cierre'`.

| evento_tipo | Cuándo |
|---|---|
| `devengo` | Reconoce hecho económico (gasto/ingreso devengado, reserva de anticipo) |
| `tesoreria` | Movimiento de dinero (pago, cobro, ingreso/egreso bancario) |
| `reversa` | Anulación con dinero ya movido: `origen_tipo='asiento'`, `origen_id=<asiento original>` |
| `apertura` | Asiento de apertura de período |
| `cierre` | Asiento de cierre |
| `manual` | Captura manual pura |

> El `CHECK` de dominio **no se impone ahora**: se propone como bloqueo final en 3.2A con `CHECK (origen_tipo IN (...))`, pero su versión definitiva se confirma al cubrir los módulos futuros (factura, reserva, transferencia). Mientras tanto, los valores desconocidos serían rechazados por el índice único solo si tienen `origen_id`; para robustez se aplica el CHECK al final de la implementación de cada módulo, no de golpe.

---

## 4. Modelo JWT

**Hallazgo:** hoy NO hay `supabase-js`. `sbLogin` (config.js:101) hace `POST /auth/v1/token?grant_type=password`, toma `access_token` y **descarta `refresh_token` y `expires_in`**. No existe refresh automático, ni `onAuthStateChange`, ni reintento ante 401. Con `access_token` expirado (~1 h) **toda la app falla en silencio** y es imposible renovarla.

Corrección (una sola fuente de verdad, **sin sistema paralelo**):

```
Supabase Auth (SDK GoTrue)
   ↓
supabase.auth (session + refresh single-flight internos)
   ↓
services/session.js  →  getAccessToken(), onAuth(), logout()
   ↓
config.js  →  getHeaders() (async, Bearer <token>)
   ↓
api() central  →  dbGet/dbIns/dbUpd/dbDel/siguienteNumero + retry-401-una-vez
```

**Recomendación A (elegida):** agregar `@supabase/supabase-js` v2 con `persistSession:true, autoRefreshToken:true`. El SDK es quien administra sesión/refresh (su single-flight interno evita duplicar refrescos). `session.js` solo expone y orquesta:
- `initAuth()` → `createClient(SB, SK, { auth: { persistSession:true, autoRefreshToken:true, storage: localStorage } })`. (El SDK persiste en `localStorage` internamente; se borra la clave custom `tzunun_session`.)
- `getAccessToken()` → `getSession()`; si `expires_at < now+60s`, espera el refresh del SDK (`await supabase.auth.refreshSession()` con promesa compartida — single-flight manual para el retry).
- `logout()` → `supabase.auth.signOut()` + limpieza.
- `onAuth()` → `supabase.auth.onAuthStateChange` (App.jsx escucha TOKEN_REFRESHED / SIGNED_OUT / INITIAL_SESSION). **La autoridad es la sesión del SDK**, no el JSON de localStorage.
- En `api()`: si el server responde 401, se fuerza un único refresh (promesa compartida) y se reintenta **una vez**; si el refresh falla → `logout` + pantalla de login.
- El `H` estático se elimina; nada construye un "segundo esquema de tokens".

**Recomendación B (alternativa sin dependencia):** capa GoTrue manual en `session.js` (token, refresh_session, user) con single-flight propio y rotación de `refresh_token`. Viable pero reimplementa lógica de expiración/rotación/seguridad del SDK; se elige solo si se quiere cero dependencias.

**Decisión:** A, porque cumple exactamente `getSession() → session.js → db helpers`, gestiona refresh/rotación y evita el sistema paralelo prohibido.

---

## 5. Modelo multiempresa

Relación **N:M**:

```
usuarios_sistema (identidad + empresa_principal para back-compat)
   ↓ N:M
usuario_empresas (usuario_id, empresa_id, rol_id, activo)
   ↓
empresas
```

Confirmado:
- Un usuario puede estar en N empresas con **distinto `rol_id` por empresa**.
- `usuarios_sistema.empresa_id` permanece solo como compatibilidad ("empresa principal"), **no** como frontera de seguridad.
- RLS autoriza vía `usuario_empresas`, nunca por el `empresa_id` de `usuarios_sistema`.
- **Índices/FKs/unicidad (SQL propuesto, NO ejecutar):**

```sql
-- (NO EJECUTAR) — bloque 3.2B
CREATE TABLE IF NOT EXISTS usuario_empresas (
  usuario_id uuid NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id)     ON DELETE RESTRICT,
  rol_id     int  NOT NULL REFERENCES roles(id)        ON DELETE RESTRICT,
  activo     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (usuario_id, empresa_id)
);
CREATE INDEX IF NOT EXISTS idx_ue_empresa ON usuario_empresas (empresa_id);

-- unicidad de identidad Auth (1 auth_uid = 1 usuarios_sistema)
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_auth ON usuarios_sistema (auth_id) WHERE auth_id IS NOT NULL;
-- unicidad de email normalizado
CREATE UNIQUE INDEX IF NOT EXISTS uq_us_email ON usuarios_sistema (lower(email)) WHERE email IS NOT NULL;
```

- **Usuarios inactivos:** `usuarios_sistema.activo=false` o `usuario_empresas.activo=false` → excluidos por la función RLS (sección 6). Nunca se borran.
- **Empresa desactivada:** el alcance se neutraliza en `usuario_empresas.activo`/estado de empresa dentro de la función, y todas las políticas dependen de la función → la empresa queda invisible sin tocar filas.
- **Gate duro:** no se puebla `usuario_empresas/usuarios_sistema` hasta tener la lista real de usuarios (GRUPO B) y al menos **un usuario de prueba** para demostrar RLS antes de activarla.

---

## 6. Modelo RLS endurecido

```sql
-- (NO EJECUTAR) — bloque 3.2B/3.6
CREATE SCHEMA IF NOT EXISTS authz;

CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Función de super-admin (para tablas de autorización; evita recursión)
CREATE OR REPLACE FUNCTION authz.es_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.roles r ON r.id = us.rol_id
    WHERE us.auth_id = auth.uid() AND us.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
  );
$$;
REVOKE ALL ON FUNCTION authz.es_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.es_super_admin() TO authenticated;
```

Análisis exigido (1–10):

1. **Owner:** `postgres` (rol con BYPASSRLS en Supabase) → las consultas internas de la función no quedan recortadas por sus propias políticas; el acceso se restringe por `EXECUTE`, no por owner.
2. **`SECURITY DEFINER`:** necesario (lee `usuarios_sistema`/`usuario_empresas` aunque el cliente no tenga permiso). Se combina con `search_path` fijo.
3. **`search_path`:** `SET search_path = public, authz, pg_temp`. Evita hijacking por schemas escribibles. Referencias con calificación `public.`.
4. **`EXECUTE`:** `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE TO authenticated`. `anon` (no autenticado) **no** puede ejecutarla.
5. **Interacción con RLS:** dentro de `SECURITY DEFINER` con owner BYPASSRLS no se aplica RLS a la lectura interna; las políticas que la llaman corren en nombre del rol callante (`authenticated`), no del definer.
6. **Recursión:** `usuarios_sistema`/`usuario_empresas` **nunca** llaman a `empresas_autorizadas()`; usan `auth.uid() = auth_id` y `es_super_admin()`. Con eso no hay recursión de RLS.
7. **Usuario no autenticado:** `auth.uid() = NULL` → la función devuelve conjunto vacío → todas las políticas deniegan. Adicionalmente `anon` no tiene `EXECUTE`.
8. **`auth.uid()` NULL:** mismo comportamiento (vacío). Ningún `WHERE` de la función depende de otra cosa.
9. **Acceso a `usuarios_sistema`:** políticas orientadas a uno mismo + super admin:
   - `SELECT`: `auth.uid() = auth_id OR authz.es_super_admin()`.
   - `INSERT/UPDATE/DELETE`: solo `authz.es_super_admin()`.
10. **Acceso a `usuario_empresas`:** igual: `SELECT` propias (`usuario_id` en usuarios con mi `auth_id`) o super admin; escritura super admin.

### Separación RLS vs reglas de negocio (matriz)

No se asume que "autorizado para la empresa" = "puede borrar todo de la empresa". RLS se limita a **propiedad/organización**; las reglas de negocio (no borrar contabilizados/conciliados/certificados) se implementan con **protección de aplicación (UI: anular en vez de borrar) + trigger defensivo** opcional en BD.

| Tabla | SELECT (RLS) | INSERT (RLS) | UPDATE (RLS) | DELETE (RLS) | Regla de negocio (no es RLS) |
|---|---|---|---|---|---|
| facturas | empresa autorizada | empresa autorizada | empresa autorizada | empresa autorizada | **emitida/certificada → no DELETE** (UI inhabilita; trigger defensivo opcional) |
| pagos_recibidos | idem | idem | idem | idem | **no DELETE silencioso**; anular con reversa |
| movimientos_bancarios | idem | idem | idem | idem | **conciliado → no UPDATE/DELETE** directo (salvo conciliación real) |
| gastos | idem | idem | idem | idem | **contabilizado → no DELETE** ni re-PATCH de monto |
| asientos_contables | idem | idem | idem | idem | **activo → no DELETE**; anular con `estado='anulado'`; con dinero ya movido → **reversa** |
| asiento_lineas | idem (parent-join) | **WITH CHECK: empresa_id = empresa del asiento padre** | idem | idem | no editar activos |
| transferencias | idem | idem | idem | idem | no DELETE post-consumo |

Patrón (ej. facturas):

```sql
-- (NO EJECUTAR) — patrón por tabla en 3.6
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

Catálogos: `empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas())` (sin escritura de las empresas). `asiento_lineas`: política con `WITH CHECK` que valida que el `empresa_id` de la línea coincida con el `empresa_id` del asiento padre (anti-escalamiento).

---

## 7. Modelo de saldos

`saldo_contable = saldo_inicial + Σ movimientos (empresa, cuenta_id, estado='activo')`; `saldo_banco` = importación; `saldo_actual` = caché.

**Trigger corregido** (INSERT/DELETE/UPDATE con cambio de cuenta, anulación y reactivación por estado):

```sql
-- (NO EJECUTAR) — bloque 3.2A (función) + 3.8 (trigger, tras columna estado en movimientos)
CREATE OR REPLACE FUNCTION fn_recalcular_saldo_cuenta()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _ids uuid[];
BEGIN
  -- 1) Cuentas afectadas según operación
  CASE TG_OP
    WHEN 'INSERT' THEN _ids := ARRAY[NEW.cuenta_id];
    WHEN 'DELETE' THEN _ids := ARRAY[OLD.cuenta_id];
    WHEN 'UPDATE' THEN
      IF coalesce(NEW.cuenta_id::text, '') IS DISTINCT FROM coalesce(OLD.cuenta_id::text, '') THEN
        _ids := ARRAY[OLD.cuenta_id, NEW.cuenta_id];
      ELSE
        _ids := ARRAY[COALESCE(NEW.cuenta_id, OLD.cuenta_id)];
      END IF;
  END CASE;

  -- 2) Lock de transacción en orden determinista (evita deadlock cruzado A→B / B→A)
  PERFORM pg_advisory_xact_lock(hashtext('tz_saldo:' || m.cuenta_id::text))
    FROM (SELECT DISTINCT c FROM unnest(_ids) AS t(c) ORDER BY 1) m;

  -- 3) Recalcular (solo activos; anulados/reactivados se reflejan al cambiar estado)
  UPDATE cuentas_bancarias c
     SET saldo_actual = c.saldo_inicial
       + coalesce((SELECT sum(CASE WHEN mo.tipo='ingreso' THEN mo.monto ELSE -mo.monto END)
                   FROM movimientos_bancarios mo
                   WHERE mo.cuenta_id = c.id AND mo.estado='activo'), 0)
   WHERE c.id = ANY(_ids);

  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_mov_saldo
  AFTER INSERT OR UPDATE OR DELETE ON movimientos_bancarios
  FOR EACH ROW EXECUTE FUNCTION fn_recalcular_saldo_cuenta();
```

- **Anulación/reactivación:** al cambiar `estado` (UPDATE de la misma cuenta) se recalcula con el filtro `estado='activo'` → el efecto sale/entra solo.
- **Cambio de cuenta (A→B):** se recalculan ambas.
- **Huérfanos (`cuenta_id NULL`):** `pg_advisory_xact_lock` con argumento NULL es no-op; el `UPDATE` con `c.id = ANY(_ids)` no matchea nada → no rompe.
- **`pg_advisory_xact_lock(hashtext(...))`:** suficiente si (a) se ordena el lock (lo hace el `ORDER BY 1`), (b) se prefija el namespace (`tz_saldo:`) para reducir colisiones. Riesgo restante: colisión de hash = serialización extra (inofensiva); deadlock **no** se elimina al 100% con locks de fila/updates en otra tabla, pero con IDs ordenados el caso cruzado queda cubierto. Para blindarlo: ejecutar los recalculos dentro de la misma transacción del `INSERT/UPDATE/DELETE` (es lo que hace `pg_advisory_xact_lock` al liberarse al COMMIT).
- **Regla dura:** la actualización manual del `saldo_actual` vía API queda fuera; cualquier corrección pasa por un movimiento (o trigger de conciliación en FASE 4).

---

## 8. Modelo de catálogo contable

Mantenido: `empresa_id NULL` = maestro; `NOT NULL` = extensión operativa.

```sql
-- (NO EJECUTAR) — bloque 3.2C
ALTER TABLE cuentas_contables
  ADD CONSTRAINT uq_cuenta_empresa_codigo UNIQUE NULLS NOT DISTINCT (empresa_id, codigo);
```

**Confirmación de semántica:** `NULLS NOT DISTINCT` trata `NULL = NULL`, por lo que permite exactamente:

| (empresa_id, codigo) | Permitido |
|---|---|
| `NULL` + `5.2.1` | ✅ (maestro, un solo slot para el maestro) |
| `EmpresaA` + `5.2.1` | ✅ |
| `EmpresaB` + `5.2.1` | ✅ |
| `EmpresaA` + `5.2.1` (segunda vez) | ❌ duplicado |

Por eso cumple el modelo híbrido. Requiere PostgreSQL 15+ (Supabase OK).

**Clasificación de `5.2.1 Car Wash` (empresa `adc5…`):**
- Es la única cuenta con `empresa_id` real.
- En el híbrido es una **cuenta operativa de Tz'unun** (extensión del maestro; subcuenta de `5.2 Mantenimiento`).
- **No** se promueve a maestro global (afectaría a otras empresas) ni se borra. Se conserva como **excepción histórica legítima** y demuestra la necesidad del modelo híbrido.
- Implicación en UI: en catálogo se muestra con etiqueta de empresa; en RLS su política se aplica igual (`empresa_id = adc5…` ∈ autorizadas).

---

## 9. Migración histórica A/B/C

### GRUPO A — determinista y seguro (sin interpretación)
1. Backfill `asiento_lineas.empresa_id ← asientos_contables.empresa_id` + `SET NOT NULL`.
2. `facturas.numero_factura ← numero` donde NULL.
3. `facturas.nombre_receptor/nit_receptor ← cliente_nombre/cliente_nit` donde NULL.
4. `asientos_contables`: rename `modulo_origen`→`origen_tipo` (sección 2), `evento_tipo='manual'`, `estado`.
5. Índices únicos parciales (idempotencia, `siguienteNumero` con unicidad por `empresa`), `CHECK` de dominios.
6. `movimientos_bancarios.estado` + constraints.
7. Función `fn_recalcular_saldo_cuenta` (esquema) — **el trigger se activa en 3.8**.
8. Tabla `usuario_empresas` y funciones `authz.*` (esquema, sin RLS aún).
9. `cuentas_contables` constraint `ucc NULLS NOT DISTINCT`.

### GRUPO B — automático con aprobación
1. `facturas` con `estado='anulada' AND saldo_pendiente<>0 → 0` (**FAC-054325: 630 → 0; FAC-221920 EXCLUIDA**).
2. Poblar `usuarios_sistema` + `usuario_empresas` desde la lista real de usuarios (mapeo email→empresa se muestra antes de aplicar).
3. Habilitar RLS + políticas, **solo tras** tener usuario de prueba demostrando lectura restringida.

### GRUPO C — NO automatizar (no inferir datos)
1. **FAC-221920** (saldo y movimientos A/B) — se resuelve con estado de cuenta.
2. Movimientos huérfanos (`9aa1bee7`, `ce00ea20`) — **no** asignar `cuenta_id`.
3. Backfill de `origen_tipo/origen_id` de los 8 pagos antiguos — requiere emparejamiento manual.
4. Asiento duplicado CarWash (`dff6b2e1`) — anulación manual aprobada por negocio.
5. Registro/rol de usuarios (entrada de negocio) — input en 3.4.
6. Política de `5.2.1` y desactivación de cuentas bancarias inactivas.

---

## 10. Orden definitivo de implementación + matriz de riesgo

| Paso | Contenido | Riesgo | Dependencias | Rollback | Prueba |
|---|---|---|---|---|---|
| **3.1** | JWT/sesión (sección 4) — `@supabase/supabase-js` + `session.js` + fetcher central | **Medio** (afecta todos los módulos) | ninguna | revert git | login→dashboard; refresh→retry; logout |
| **3.2A** | Estructura contable: rename `origen_tipo`, `evento_tipo`, `estado`, backfills, índices, `asiento_lineas.empresa_id` | **Bajo** | 3.1 (write helpers autenticados) | `DROP INDEX` + `RENAME` inverso + `DROP COLUMN` | `count(asiento_lineas WHERE empresa_id IS NULL)=0` |
| **3.2B** | Multiempresa: `usuario_empresas` vacía + FKs + índices + `authz.*` (esquema) | **Bajo** | 3.1 | `DROP TABLE usuario_empresas` + `DROP FUNCTION` | tablas/funciones existen |
| **3.2C** | Catálogo: constraint `ucc NULLS NOT DISTINCT` | **Bajo** | ninguna | `DROP CONSTRAINT` | `NULL+5.2.1 / A+5.2.1 / B+5.2.1` válidos; A+A duplicado rechazado |
| **3.2D** | Estructura bancaria: `movimientos.estado`, constraints; función de saldo (esquema) | **Bajo** | 3.2A | `DROP COLUMN estado` + `DROP FUNCTION` | columna/CHECK creados |
| **3.3** | Saldos históricos facturas (GRUPO B.1; FAC-221920 excluida) | **Medio** | 3.2A | `UPDATE` desde `backup_facturas_saldos` | `count(anulada AND saldo<>0)=0` |
| **3.4** | Usuarios reales → `usuarios_sistema` + `usuario_empresas` + **1 usuario de prueba** | **Medio** | **lista real de usuarios** | `TRUNCATE usuario_empresas` + `users` | login de prueba; ve solo su empresa |
| **3.5** | Empresa activa + selector + filtros `empresa_id` | **Medio** | 3.4 (hay datos) | revert git | 2 empresas → solo se ve la activa |
| **3.6** | Activar RLS + políticas | **Alto** | **3.1+3.4+3.5 verificados** | `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY` | usuario A no lee empresa B; INSERT ajeno → error |
| **3.7** | Reglas de negocio/UI (reversa, protección conciliados/anulados, `siguienteNumero` con empresa, columna `numero` en Pagos) | **Medio** | 3.2A | revert git | doble clic → 1 asiento; reversa balanceada |
| **3.8** | Activar trigger de saldos | **Bajo** | 3.2A+3.2D, saldos correctos | `DROP TRIGGER trg_mov_saldo` | cambiar cuenta A→B recalcula ambas; anular/reactivar ajusta |
| **3.9** | Panel de revisión GRUPO C | **Bajo** | **estado de cuenta/banco** | solo lectura | reporte generado |
| **3.10** | Pruebas de aceptación integrales + snapshot | — | todo lo anterior | — | checklist sección 15 |

**Orden validado:** 3.1 es independiente y desbloquea 3.6; 3.2A→D son esquema/backfill deterministas y pequeños; 3.3 es un dato corregible con backup; 3.4 es **puerta dura** para 3.6 (RLS no se activa sin al menos un usuario autenticado que demuestre lectura restringida); 3.5 prepara la UI de selector con datos reales; 3.6 es el cambio de mayor riesgo y va al final del paquete de datos, con rollback por `DISABLE ROW LEVEL SECURITY`; 3.7/3.8 cierran reglas y recálculo; 3.9 y 3.10 cierran revisión y verificación. **Ningún paso automático depende de datos que no existan** (el único faltante — lista de usuarios — es GRUPO B y gatilla parada en 3.4).

---

## 11. SQL corregido pero NO ejecutado (resumen por bloque)

> Los bloques completos están en las secciones 2, 4bis (no), 5, 6, 7 y 8. Además:

```sql
-- (NO EJECUTAR) — 3.2A: asiento_lineas.empresa_id
ALTER TABLE asiento_lineas ADD COLUMN empresa_id uuid;
UPDATE asiento_lineas l SET empresa_id = a.empresa_id
  FROM asientos_contables a WHERE a.id = l.asiento_id;
ALTER TABLE asiento_lineas ALTER COLUMN empresa_id SET NOT NULL;

-- (NO EJECUTAR) — 3.2A: facturas canónicas
UPDATE facturas SET numero_factura = numero WHERE numero_factura IS NULL;
UPDATE facturas SET nombre_receptor = cliente_nombre, nit_receptor = cliente_nit
 WHERE nombre_receptor IS NULL OR nombre_receptor = '';

-- (NO EJECUTAR) — 3.2D: estado movimientos (anulado/reactivado)
ALTER TABLE movimientos_bancarios ADD COLUMN estado text NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo','anulado'));
```

---

## 12. Archivos de código que deberán modificarse cuando se implemente

| Fase | Archivo | Cambio |
|---|---|---|
| 3.1 | `package.json` | `+ @supabase/supabase-js` |
| 3.1 | `src/services/session.js` (nuevo) | initAuth/getAccessToken/refresh/onAuth/logout |
| 3.1 | `src/config.js` | sustituir `H` por `getHeaders()` + `api()`; `sbLogin/sbLogout` → SDK; `dbGet/dbIns/dbUpd/dbDel/siguienteNumero` sobre `api()` |
| 3.1 | `src/App.jsx` | `handleLogin`/`handleLogout` via SDK; suscripción `onAuthStateChange`; borrar `tzunun_session` como autoridad (:593, :656, :661-663) |
| 3.1 | `src/hooks/usePaginacion.js` | usar nuevo header/fetcher |
| 3.1 | `src/services/dashboardService.js` | usar nuevo fetcher |
| 3.1 | `src/pages/Banca.jsx`, `Contratos.jsx`, `Facturacion.jsx`, `ImportadorSAT.jsx` | `H` → fetcher central |
| 3.1 | `src/pages/Contabilidad.jsx` y `Gastos.jsx` (helpers `api` locales) | usar fetcher central |
| 3.2A | `src/pages/Contabilidad.jsx` | :130 `modulo_origen:"manual"` → `origen_tipo:"manual", evento_tipo:"manual", estado:"activo"`; :368/:413 `modulo_origen` → `origen_tipo` (+ `evento_tipo`) |
| 3.2A | `src/pages/Gastos.jsx` | :715 `modulo_origen:'gastos'` → `origen_tipo:'gasto', evento_tipo:'tesoreria'` |
| 3.5 | `src/App.jsx`, `dashboardService.js`, `usePaginacion.js`, `Notificaciones.jsx`, páginas | `empresa_activa` (UX) + filtros `empresa_id` |
| 3.7 | `src/pages/Contabilidad.jsx` | reversa (`evento_tipo='reversa'`, original →`reversado`) |
| 3.7 | `src/pages/Banca.jsx`, `Pagos.jsx`, `Gastos.jsx`, `Facturacion.jsx` | protección conciliados/anulados; columna `numero`; `siguienteNumero` con empresa |
| 3.1 | `src/pages/Gastos.jsx` | :667 lectura de `tzunun_session` para `userName` → `session.js` |

---

## 13. Riesgos

- **3.6 RLS = ALTO:** riesgo global de acceso; mitigación: demo con usuario de prueba y rollback por `DISABLE ROW LEVEL SECURITY`.
- **3.1 JWT:** 8 archivos usan `H`; error de reemplazo rompe todos los módulos. Mitigación: fetcher central + prueba de humo.
- **3.3 saldos:** recálculo mal aplicado (FAC-221920) → **excluida** del bloque; backup pre-ejecución.
- **3.2A rename:** si el deploy de SQL y código no es simultáneo, Contabilidad/Gastos escriben en columna inexistente → migración atómica (SQL+repo en el mismo commit/deploy).
- **Trigger:** deadlock cruzado → mitigado con locks ordenados; colisión de hash → inofensiva.
- **CHECK de dominio prematuro:** rechazaría valores de módulos futuros → se aplaza (sección 3).

---

## 14. Rollback por bloque

| Bloque | Rollback |
|---|---|
| 3.1 | revert git; sin `@supabase/supabase-js`; restaurar `H` |
| 3.2A | `DROP INDEX uq_asientos_identidad`; `DROP COLUMN evento_tipo, estado`; `RENAME origen_tipo → modulo_origen`; `DROP COLUMN empresa_id` en líneas; restore `numero_factura` |
| 3.2B | `DROP TABLE usuario_empresas`; `DROP FUNCTION authz.empresas_autorizadas/es_super_admin`; `DROP INDEX uq_us_auth/uq_us_email` |
| 3.2C | `DROP CONSTRAINT uq_cuenta_empresa_codigo` |
| 3.2D/3.8 | `DROP TRIGGER trg_mov_saldo`; `DROP FUNCTION fn_recalcular_...`; `DROP COLUMN estado` |
| 3.3 | `UPDATE` desde `backup_facturas_saldos` |
| 3.4 | `TRUNCATE usuario_empresas`; `TRUNCATE usuarios_sistema` |
| 3.6 | `ALTER TABLE <tabla> DISABLE ROW LEVEL SECURITY` (por tabla) |
| 3.7/3.8 | revert git |

---

## 15. Pruebas de aceptación

1. `count(asiento_lineas WHERE empresa_id IS NULL)` = 0.
2. `count(facturas WHERE anulada AND saldo_pendiente<>0)` = 0 (FAC-221920 fuera).
3. Saldo reconstruido = `saldo_actual` en todas las cuentas.
4. Usuario test A: `count` de filas empresa B = 0; INSERT/UPDATE con empresa ajena → error.
5. Doble clic "Contabilizar gasto" → 1 solo asiento.
6. Token expirado → refresh → retry ok, sin duplicar requests.
7. Cambio de cuenta A→B en un movimiento → ambas saldo correcto.
8. Anular/reactivar movimiento → saldo se ajusta.
9. Reversa: nuevo asiento `evento_tipo='reversa'`, original `reversado`, libro balanceado.

---

## 16. Criterios de NO EJECUCIÓN confirmados

| Ítem | Estado |
|---|---|
| SQL duplicado de `origen_tipo` (ADD+ADD+RENAME previo) | ❌ **NO APROBADO** — sustituido por `RENAME` único |
| FAC-221920 y saldo | ❌ **NO APROBADO PARA RECÁLCULO AUTOMÁTICO** |
| Asignación de `cuenta_id` a huérfanos | ❌ **NO APROBADO** |
| Backfill de origen de movimientos/pagos antiguos | ❌ **NO APROBADO** |
| Anulación de asiento duplicado `dff6b2e1` | ❌ requiere aprobación de negocio |
| Activación RLS sin usuario de prueba | ❌ **NO APROBADO** (puerta 3.4) |
| Poblar usuarios sin lista real | ❌ **NO APROBADO** |
| CHECK de eventos con dominios incompletos | ❌ **NO APROBADO** ahora |
| Trigger sin recalcular OLD en UPDATE | ❌ **NO APROBADO** — corregido en sección 7 |
| `UNIQUE` normal para catálogo híbrido | ❌ **NO APROBADO** — requiere `NULLS NOT DISTINCT` |
| Tratamiento de `5.2.1` / cuentas inactivas | ❌ no modificar |

---

## 17. Cosas que siguen SIN tocar (inventario explícito)

1. Código `src/` — cero cambios.
2. Supabase BD — cero DDL/DML.
3. Tablas, columnas, índices, funciones, triggers — no creados.
4. RLS — no activada.
5. Datos históricos — ninguno corregido ni inferido (ni FAC-221920, ni huérfanos, ni duplicado CarWash, ni `5.2.1`, ni cuentas inactivas).
6. Deploy — no realizado.
7. No se creó ni modificó ningún archivo del repositorio para este análisis.

---

**ESTADO: APROBADO PARA IMPLEMENTACIÓN** (decisión técnica corregida; las puertas de negocio — lista de usuarios reales, resolución bancaria de FAC-221920/huérfanos, aprobación de B.1 anuladas→0 y confirmación del orden — se cierran antes de 3.3/3.4/3.6/3.9; no se ejecutará nada sin aprobación explícita).