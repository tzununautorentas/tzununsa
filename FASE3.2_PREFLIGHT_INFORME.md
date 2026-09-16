# FASE 3.2 — INFORME DE PRE-FLIGHT (solo lectura)

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Fecha ejecución: 2026-09-16 · Tipo: **SOLO SELECCT/inspección (no se ejecutó ningún ALTER/UPDATE/CREATE)**
Estado: **PENDIENTE de cierre — 3 datos dependen de verificación owner (SQL Editor).**

---

## 0. Método y alcance

- Acceso usado: **clave `anon` vía PostgREST** (`GET /rest/v1/<tabla>`) — únicamente lectura.
- No se ejecutó ningún `ALTER`, `UPDATE`, `CREATE INDEX`, `CREATE FUNCTION`, `CREATE TABLE`, ni se activó RLS.
- Backups de solo lectura exportados a `C:\Users\USUARIO\Documents\GitHub\tzununsa\.backups\3.2-preflight\2026-09-16T16-23-33-740Z\` (JSONL + `MANIFEST.txt` con sha256), **fuera del control de versión** por contener datos de clientes (NIT).

---

## 1. VERIFICACIONES OBLIGATORIAS — RESULTADOS

### 1. BACKUP previo

**Estado actual de la verificación:**
| Tabla | Export anon (filas) | Observación |
|---|---|---|
| `asientos_contables` | **0** | ⚠️ ver 1.1 |
| `asiento_lineas` | **0** | ⚠️ ver 1.1 |
| `facturas` | 17 | OK (CR `0-16/17`) |
| `cuentas_contables` | 47 | OK (CR `0-46/47`) |
| `movimientos_bancarios` | 33 | OK (CR `0-32/33`) |
| `usuarios_sistema` | **0** | ⚠️ ver 1.1 |
| `roles` | 3 | OK (CR `0-2/3`) |
| `empresas` | 1 | OK (CR `0-0/1`) |

**1.1 HALLAZGO CRÍTICO — 3 tablas invisibles para `anon`:** `asientos_contables`, `asiento_lineas` y `usuarios_sistema` responden `200` pero con **0 filas** y `Content-Range */0`. Las columnas **sí existen** (los probes `select=<columna>` devuelven 200). Las causas posibles: (a) tablas realmente vacías, o (b) **RLS/grants ya activos en esas tablas** que ocultan las filas al rol `anon`. No es posible distinguir ambas por REST con la clave `anon`.
**Consecuencia:** el backup por REST de esas 3 tablas NO es fiable hoy; sus JSONL quedaron vacíos.

**1.2 Backup obligatorio antes de ejecutar (la única opción fiable es owner):**
1. **Dashboard → Database → Backups**: confirmar/activar el backup diario y ejecutar un manual (PITR si el plan lo permite) — fecha/hora a registrar.
2. **Snapshot en SQL Editor (owner)**, dentro de un esquema dedicado, con verificación de conteos antes/después:
   ```sql
   CREATE SCHEMA IF NOT EXISTS _bkp_32;
   CREATE TABLE _bkp_32.asientos_contables      AS SELECT * FROM asientos_contables;
   CREATE TABLE _bkp_32.asiento_lineas          AS SELECT * FROM asiento_lineas;
   CREATE TABLE _bkp_32.facturas                AS SELECT * FROM facturas;
   CREATE TABLE _bkp_32.cuentas_contables       AS SELECT * FROM cuentas_contables;
   CREATE TABLE _bkp_32.movimientos_bancarios   AS SELECT * FROM movimientos_bancarios;
   CREATE TABLE _bkp_32.usuarios_sistema        AS SELECT * FROM usuarios_sistema;
   CREATE TABLE _bkp_32.roles                   AS SELECT * FROM roles;
   CREATE TABLE _bkp_32.empresas                AS SELECT * FROM empresas;
   SELECT 'asientos', count(*) FROM _bkp_32.asientos_contables
   UNION ALL SELECT 'lineas',  count(*) FROM _bkp_32.asiento_lineas
   UNION ALL SELECT 'facturas',count(*) FROM _bkp_32.facturas       ;
   -- registrar también la fecha/hora UTC y el ref del proyecto
   ```
3. **Comprobación de recuperabilidad:** al restaurar (CREATE TABLE de backup → TRUNCATE → INSERT SELECT) verificar que `count(*)` coincide y que una fila muestreada es idéntica campo a campo. Se documenta en `FASE3.2_INFORME.md`.

> Necesito tu confirmación de SQL Editor con `SELECT count(*)` de las 3 tablas ocultas ANTES de ejecutar, para saber si el backfill de 3.2A-3 tiene o no filas que tratar.

---

### 2. ASIENTOS — ORIGEN

**Consultas ejecutadas (anon):**
- `SELECT` de distribución de `modulo_origen`: devuelve **0 filas** (tabla invisible/vacía para anon).
- Registros `modulo_origen NOT NULL AND origen_id IS NULL`: **0** (misma limitación).

**HALLAZGOS de columnas (probes):**
| Columna en `asientos_contables` | ¿Existe? |
|---|---|
| `modulo_origen` | ✅ SÍ |
| `origen_tipo` | ❌ NO (hará falta el RENAME) |
| `origen_id` | ✅ SÍ |
| `empresa_id` | ✅ SÍ |
| `estado` | ✅ **YA EXISTE** |
| `evento_tipo` | ❌ NO (se deberá agregar) |
| `numero` | ❌ NO (no forma parte del plan) |

**✅ REQUIERO (SQL Editor owner), para decidir sin re-clasificar:**
```sql
-- a) distribución de valores guardados
SELECT modulo_origen, count(*) FROM asientos_contables GROUP BY 1 ORDER BY 2 DESC;
-- b) origenes con valor pero sin id (NO los re-clasifico)
SELECT id, empresa_id, modulo_origen, origen_id, fecha, descripcion
FROM asientos_contables WHERE modulo_origen IS NOT NULL AND origen_id IS NULL;
```
**Regla respetada:** el RENAME preserva el valor histórico (`modulo_origen` → `origen_tipo`); ningún `UPDATE` lo sobrescribe con `'manual'` si ya tenía valor (ver SQL corregido §3).

---

### 3. ASIENTOS — ESTADO HISTÓRICO

**HALLAZGO:** `asientos_contables.estado` **YA existe** → el `ADD COLUMN estado` del plan **fallaría**. `facturas` **NO** tiene columna `anulada` (probe `400`); la anulación de facturas se representa con `facturas.estado` (`anulada`/`parcial`/`certificada`). La referencia en 3.3 a `estado='anulada'` es correcta; la de `anulada` (booleano) no existe.

Datos visibles de `facturas.estado`: `{anulada:2, parcial:1, certificada:14}`, `motivo_anulacion` set de 2 (`"Error"`), `saldo_pendiente`: 15×0, `630`, `1687.5`.

**✅ REQUIERO (SQL Editor owner) para no silenciar anulaciones históricas:**
```sql
SELECT contype, conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'asientos_contables'::regclass;
SELECT estado, count(*) FROM asientos_contables GROUP BY 1;
```
Si `estado` no tiene CHECK, se AÑADE el CHECK sin tocar valores; si ya existe columna con valores `activo/anulado`, **no se redefine**.

---

### 4. ÍNDICE DE IDEMPOTENCIA (`uq_asientos_identidad`)

**Estado:** no creamos el índice. `evento_tipo` no existe → la preclave efectiva hoy es `(empresa_id, modulo_origen, origen_id)`.
- Con datos visibles: **0 combinaciones duplicadas** en las tablas legibles (asientos vacío/oculto).
- **Duplicado CarWash `dff6b2e1` reportado por la auditoría previa NO aparece** en el catálogo ni en facturas actuales (ver §7: la cuenta `5.2.1` ya no existe; el catálogo fue re-importado al 2026-09-15). El asiento duplicado que la auditoría refería pertenece a `asientos_contables` (tabla oculta) → **requiere verificación owner**.

**✅ REQUIERO (SQL Editor owner):**
```sql
SELECT empresa_id, modulo_origen, origen_id, count(*) c
FROM asientos_contables
WHERE estado='activo' AND origen_id IS NOT NULL
GROUP BY 1,2,3 HAVING count(*) > 1;
```
No anulamos ni corregimos nada.

---

### 5. FACTURAS (preflight de campos canónicos)

Datos **sí verificables** (17 facturas):

| Campo | Vacíos | Con candidato | Ejemplos |
|---|---|---|---|
| `numero_factura` | **3** | **3** (de `numero`) | FAC-054325, FAC-000129, FAC-221920 (`numero_factura=NULL`) |
| `nombre_receptor` | **0** | 0 | — |
| `nit_receptor` | **0** | 0 | — |

- El backfill independiente es seguro: `numero_factura = numero` cubre los 3; `nombre_receptor`/`nit_receptor` no requieren cambio (completos).
- **Riesgo de sobrescritura con NULL: NO existe en el estado actual** (los campos con valor tienen valor; los candidatos `numero`/`cliente_nombre`/`cliente_nit` están completos). El SQL propuesto usa `WHERE x IS NULL` (no sobreescribe).

---

### 6. SUPER ADMIN — DISEÑO CORREGIDO

**Contexto verificable:** `roles.id` es `integer` (1=super_admin/`permisos.todo=true`, 2=admin, 3=usuario). `usuarios_sistema` (0 filas anon) tiene `id`, `auth_id`, `email`, `rol_id`, `empresa_id`, `activo`. `usuario_empresas` **no existe aún** (se creará en 3.2B).

**Corrección solicitada:** la autorización por rol debe basarse en **`usuario_empresas.rol_id`** (rol por empresa), con `usuarios_sistema.rol_id` **solo como compatibilidad histórica** mientras `usuario_empresas` no esté poblada (3.4).

**SQL propuesto (NO EJECUTAR aún) — bloque 3.2B:**
```sql
CREATE OR REPLACE FUNCTION authz.es_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, authz, pg_temp
AS $$
  -- Fuente primaria: rol por empresa (multiempresa).
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_sistema us
    JOIN public.usuario_empresas ue ON ue.usuario_id = us.id
    JOIN public.roles r ON r.id = ue.rol_id
    WHERE us.auth_id = auth.uid()
      AND us.activo AND ue.activo
      AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
  )
  OR -- Compatibilidad histórica SOLO mientras usuario_empresas esté vacía.
     EXISTS (
       SELECT 1
       FROM public.usuarios_sistema us
       JOIN public.roles r ON r.id = us.rol_id
       WHERE us.auth_id = auth.uid() AND us.activo
         AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
         AND NOT EXISTS (SELECT 1 FROM public.usuario_empresas)
     );
$$;
REVOKE ALL ON FUNCTION authz.es_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authz.es_super_admin() TO authenticated;
```
Justificación:
- `usuario_empresas(usuario_id, empresa_id, rol_id)` = rol por empresa → es la fuente correcta en el modelo nuevo.
- Fallback legacy idéntico en semántica al antiguo, activo **solo si** `usuario_empresas` está vacía (no duplica privilegios; deja de aplicarse al poblarla en 3.4).
- `empresas_autorizadas()` (3.2B) permanece igual (filtra por `auth.uid()` + `activo`).

---

### 7. CUENTAS CONTABLES (preflight de duplicados)

**Estado real (17→47 cuentas, todas `empresa_id = adc5f324-…`, única empresa):**
- Duplicados por `(empresa_id, codigo)`: **0**.
- Duplicados globales (`empresa_id NULL`): **0** (no hay filas con `empresa_id NULL`).
- **`5.2.1` NO existe actualmente** (0 filas). La cuenta `5.2.1 CarWash` referida en auditoría ya no está en el catálogo (el catálogo más reciente se creó 2026-09-15). Verificado con búsqueda en `nombre`/`codigo`.

Conclusión: el constraint `UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)` **no tendría colisiones en el estado actual**. No se borra ni fusiona nada.

---

### 8. PRUEBA DEL CONSTRAINT — en transacción con ROLLBACK (no deja datos)

SQL propuesto (bloque 3.2C, al momento de ejecutar; no corre ahora):
```sql
BEGIN;
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, activa)
SELECT NULL, 'ZZTEST1', 'preflight global', 'activo', true;  -- global único: OK
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, activa)
SELECT 'adc5f324-a108-49ad-875c-779afe3b9f7f', 'ZZTEST1', 'preflight A', 'activo', true; -- empresa A: OK
-- esperado: DUPLICADO GLOBAL → violación unique_violation
-- esperado: DUPLICADO en empresa A → violación unique_violation
ROLLBACK;
-- + verificación manual de los rechazos (dos bloques DO con EXCEPTION WHEN unique_violation RAISE NOTICE)
```
También se adjunta el bloque DO autoverificado que imprime PASS/FAIL por caso.

---

### 9. MULTIEMPRESA

**Verificación:**
| Ítem | Resultado |
|---|---|
| `roles.id` tipo real | **`integer`** (1,2,3) ✅ → FK `rol_id int` del plan correcta |
| `usuarios_sistema.id` | `uuid` (formato UUID en probes) |
| `empresas.id` | `uuid` ✅ |
| Constraints/FKs existentes relevantes | `roles` y `empresas` expuestos; `usuario_empresas` **NO existe** (no hay tabla equivalente) |
| `usuarios_sistema` columnas | `id, auth_id(permite NULL), email, rol_id, empresa_id, activo` ✅ (0 filas visibles anon) |

Las FK se crean en 3.2B apuntando a `usuarios_sistema(id)`, `empresas(id)`, `roles(id)` — todos verificados.

---

### 10. SALDOS BANCARIOS

**Verificación (datos reales):**
- `cuentas_bancarias`: 7 cuentas, todas `empresa_id=adc5…`, `saldo_inicial` y `saldo_actual` **numéricos**. Sin columna `estado`.
- `movimientos_bancarios`: 33 movimientos; **NO tiene columna `estado`** (probe 400) → el `ADD COLUMN estado` de 3.2D **sí procede**; `cuenta_id` `uuid` con **2 huérfanos** (`NULL`): `9aa1bee7` (ingreso Ixcán) y `ce00ea20` (pago FAC-221920) — consistentes con GRUPO C de auditoría (no se tocan).
- **Versión de PostgreSQL:** NO comprobable por REST (OpenAPI exige `service_role`; 401 con `anon`). Requiere `SELECT version();` en SQL Editor owner. (Supabase actual usa PG ≥15, compatible con `NULLS NOT DISTINCT`, pero se confirma antes de ejecutar.)

---

## 2. CONFLICTOS ENCONTRADOS (plan-vs-realidad)

| # | Conflicto | Impacto | Corrección |
|---|---|---|---|
| C1 | `asientos_contables.estado` **ya existe** | `ADD COLUMN estado` del plan 3.2A fallaría (duplicada) | No agregar `estado`; solo agregar `evento_tipo` (+ opcional CHECK si no existe) |
| C2 | `facturas` **no** tiene `anulada` (usar `estado='anulada'`) | Consultas de 3.3 con `anulada` fallarían | Usar `facturas.estado` |
| C3 | `anon` no ve `asientos/asiento_lineas/usuarios_sistema` | Backup REST vacío; preflight 2/3/4/9 sin datos | Verificación owner (SQL Editor) antes de ejecutar |
| C4 | `5.2.1 CarWash` ya NO existe en catálogo | Premisa de auditoría desactualizada | Sin acción; registrar en informe |
| C5 | Versión PG no confirmada | `NULLS NOT DISTINCT` + helpers PL/pgSQL | Confirmar con `SELECT version()` |
| C6 | `es_super_admin` original usaba `usuarios_sistema.rol_id` | Modelo multiempresa requiere rol por empresa | SQL corregido §6 |

---

## 3. SQL CORREGIDO PROPUESTO (para el commit de ejecución — NO corrido todavía)

### 3.2A (corregido por C1 y por regla "no sobrescribir origen histórico")
```sql
-- 1) RENAME (preserva valores históricos de modulo_origen)
ALTER TABLE asientos_contables RENAME COLUMN modulo_origen TO origen_tipo;

-- 2) SOLO evento_tipo (estado YA existe)
ALTER TABLE asientos_contables ADD COLUMN evento_tipo text;

-- 3) Relleno seguro: NUNCA sobrescribe un origen que ya tiene valor.
--    Sólo llena el vacío. Documentado por si existen filas ocultas.
UPDATE asientos_contables
   SET evento_tipo = 'manual'
 WHERE evento_tipo IS NULL;

ALTER TABLE asientos_contables ALTER COLUMN evento_tipo SET NOT NULL;

-- 4) CHECK en estado SOLO si no existe ya (verificar §3 antes).
ALTER TABLE asientos_contables ADD CONSTRAINT ck_asiento_estado
  CHECK (estado IN ('activo','anulado','reversado'));

-- 5) Índice de idempotencia (parcial; estado ya existe como filtro)
CREATE UNIQUE INDEX uq_asientos_identidad
  ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
  WHERE estado = 'activo' AND origen_id IS NOT NULL;
```
> Decisión de diseño registrada: la regla de auditoría "ausencia de `origen_id` no debe borrar `modulo_origen` histórico" se respeta porque el `RENAME` conserva el dato; el `UPDATE` solo toca `evento_tipo`, y el `UPDATE` de normalización de `origen_tipo` que proponía el diseño FASE 3A.1 **se elimina** (ya no es necesario: no se sobrescriben origenes; si existieran filas con `origen_tipo NULL`, se les asigna `manual` solo en el paso de NOT NULL si procede tras verificación §2).

```sql
-- 6) asiento_lineas.empresa_id (+ backfill desde la cabecera)
ALTER TABLE asiento_lineas ADD COLUMN empresa_id uuid;
UPDATE asiento_lineas l SET empresa_id = a.empresa_id
  FROM asientos_contables a WHERE a.id = l.asiento_id AND l.empresa_id IS NULL;
ALTER TABLE asiento_lineas ALTER COLUMN empresa_id SET NOT NULL;
```
> Si la verificación §2 revelara filas con `asiento_id` huérfano (sin asiento), se reportaría y NO se aplicaría NOT NULL hasta resolver — se deja condicionado al resultado de la consulta owner.

```sql
-- 7) Facturas: completar por campo de forma independiente (sin sobrescritura)
UPDATE facturas SET numero_factura  = numero          WHERE numero_factura  IS NULL AND numero          IS NOT NULL;
UPDATE facturas SET nombre_receptor = cliente_nombre  WHERE nombre_receptor IS NULL AND cliente_nombre  IS NOT NULL;
UPDATE facturas SET nit_receptor    = cliente_nit     WHERE nit_receptor    IS NULL AND cliente_nit     IS NOT NULL;
```

### 3.2B — igual al plan + `es_super_admin()` corregido (§6)
### 3.2C — igual al plan + prueba en transacción ROLLBACK (§8)
### 3.2D — igual al plan (columna `estado` en movimientos + función `fn_recalcular_saldo_cuenta`, trigger en 3.8)

---

## 4. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Filas ocultas en `asientos/asiento_lineas/usuarios_sistema` (RLS parcial) desconocidas en backfill | **Alto** | Verificación owner (§2/§3) antes del primer `UPDATE`; backup de datos (§1.2) |
| `ADD COLUMN estado` duplicado | Medio | Corregido (C1): solo `evento_tipo` |
| `facturas.anulada` inexistente | Medio | Corregido (C2): usar `estado` |
| `NULLS NOT DISTINCT` requiere PG15+ | Bajo | Confirmar `SELECT version()` |
| Huérfanos `cuenta_id` (2) al probar checks de movimientos | Bajo | No se tocan (GRUPO C) |
| Deadlock en recálculo (3.8 futuro) | Bajo | Locks ordenados + prefijo |
| Lanzamiento SQL+código no simultáneo | Medio | Commit atómico; verificación UI post-ejecución |

---

## 5. ORDEN DEFINITIVO 3.2A → 3.2D

1. **Pre-ejecución (owner, SQL Editor)**: respuestas de §1.2 (conteos), §2 (orígenes reales), §3 (estado/CHECK), §4 (duplicados), §10 (`SELECT version()`). Resultado pegado en el informe.
2. **Backup** con snapshots `_bkp_32` (§1.2) + verificación de conteos y recuperabilidad.
3. **3.2A** (SQL corregido + código Contabilidad/Gastos en el mismo commit) → prueba: `count(asiento_lineas.empresa_id IS NULL)=0`; guardar asiento manual y de gasto sin error.
4. **3.2B** (tabla `usuario_empresas` vacía + índices + `authz.*` corregidos) → prueba: existen tablas/funciones; `GRANT EXECUTE` a `authenticated`.
5. **3.2C** (constraint híbrido) → prueba en transacción ROLLBACK de los 4+2 casos (§8).
6. **3.2D** (columna `estado` movimientos + función saldo, sin trigger) → prueba: columna/CHECK/function creados; INSERT de movimiento OK; saldos intactos (trigger en 3.8).
7. **Cierre**: `FASE3.2_INFORME.md` con evidencias y ESTADO.

---

## 6. ACCIÓN REQUERIDA DE TU PARTE (solo lectura, SQL Editor)

Para levantar la ⚠️ de visibilidad/anulación y poder ejecutar con certeza:
```sql
SELECT count(*) FROM asientos_contables;
SELECT count(*) FROM asiento_lineas;
SELECT count(*) FROM usuarios_sistema;
SELECT version();
SELECT contype, conname, pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conrelid = 'asientos_contables'::regclass;
SELECT modulo_origen, count(*) FROM asientos_contables GROUP BY 1;
SELECT id, empresa_id, modulo_origen, origen_id, fecha, descripcion
FROM asientos_contables WHERE modulo_origen IS NOT NULL AND origen_id IS NULL;
SELECT empresa_id, modulo_origen, origen_id, count(*) c
FROM asientos_contables WHERE estado='activo' AND origen_id IS NOT NULL
GROUP BY 1,2,3 HAVING count(*) > 1;
SELECT estado, count(*) FROM asientos_contables GROUP BY 1;
```
Con esas 9 respuestas cierro el preflight y ajusto el plan definitivo.

---

**ESTADO: PRE-FLIGHT REALIZADO — 3 verificaciones (asientos/usuarios/versión PG) pendientes de confirmación owner. NO SE EJECUTÓ NADA.**