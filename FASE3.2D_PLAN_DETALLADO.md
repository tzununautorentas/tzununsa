# FASE 3.2D — PLAN DETALLADO DE IMPLEMENTACIÓN

> Estructura bancaria · columna `estado` en `movimientos_bancarios` + función `fn_recalcular_saldo_cuenta()` (esquema, trigger pendiente a FASE 3.8)

---

## 1. OBJETIVO

Dejar la **estructura bancaria base** sobre `public.movimientos_bancarios` y `public.cuentas_bancarias`:

1. **Columna `estado`** en `public.movimientos_bancarios`:
   - `text NOT NULL DEFAULT 'activo'`
   - `CHECK (estado IN ('activo','anulado'))`
   - Con constraint CHECK **nombrado** (`chk_movbancario_estado`) para idempotencia y rollback deterministas.
2. **Función** `public.fn_recalcular_saldo_cuenta()` (esquema del trigger de recálculo).
   - **EL TRIGGER NO SE ACTIVA EN ESTA FASE.** Se activa en FASE 3.8.

**No modifica datos ni otras tablas**, no toca `cuentas_bancarias` (solo se lee su esquema para verificación), no cambia tipos, no crea RLS, no toca frontend.

## 2. ESTADO PREVIO VERIFICADO (esquema real)

| Ítem | Resultado |
|---|---|
| PostgreSQL | **17.6** (requerido ≥ 15) |
| `public.movimientos_bancarios` | existe — **33** movimientos |
| Columnas `movimientos_bancarios` | `id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, factura_id, cotizacion_id, conciliado` |
| Columnas con `estado` | **NO existe** → el `ADD COLUMN` procede |
| `cuenta_id` | `uuid`, **2 huérfanos `NULL`** (`9aa1bee7` Ixcán, `ce00ea20` FAC-221920) — consistentes con GRUPO C de auditoría, no se tocan |
| `public.cuentas_bancarias` | existe — **7** cuentas |
| `saldo_inicial`, `saldo_actual` | `numeric` en todas |
| `empresa_id` | todas las cuentas = `adc5…` |
| Trigger `trg_mov_saldo` | **NO existe** (debe seguir inactivo hasta 3.8) |

## 3. PRE-CHECKS

El script **se detiene con error controlado** si falla cualquiera de los bloqueantes:

- **PRE-CHECK 0 — PostgreSQL**: versión mayor ≥ 15 (`server_version_num`).
- **PRE-CHECK 1 — Tablas**: existen `public.movimientos_bancarios` y `public.cuentas_bancarias`.
- **PRE-CHECK 2 — Columnas y tipos**: `movimientos_bancarios.empresa_id`/`cuenta_id` = `uuid`; `monto` = `numeric`; `cuentas_bancarias.saldo_inicial`/`saldo_actual` = `numeric`.
- **PRE-CHECK 3 — Columna `estado`**: AVISO si ya existe (la migración validará su definición, sin reemplazo); OK si no existe.
- **PRE-CHECK 4 — Estado de datos** (solo lectura): conteos de referencia `cuentas_bancarias` = 7 y `movimientos_bancarios` = 33. Si difieren → **AVISO** con el valor real (no se bloquea, no se corrige).
- **PRE-CHECK 5 — INFO**: listado de columnas `NOT NULL` sin default de `movimientos_bancarios` (para corroborar que el INSERT de prueba las completa).
- **PRE-CHECK 6 — Trigger**: si `trg_mov_saldo` ya existiera → **BLOQUEO** (el trigger se activa en FASE 3.8, no en esta fase).

## 4. DISEÑO

### 4.1. Columna `estado`

```sql
ALTER TABLE public.movimientos_bancarios
  ADD COLUMN estado text NOT NULL DEFAULT 'activo',
  ADD CONSTRAINT chk_movbancario_estado CHECK (estado IN ('activo','anulado'));
```

Semántica: todo movimiento nuevo nace `activo`; la anulación de un movimiento se modela como `UPDATE estado='anulado'` (el recálculo de saldo lo filtra con `estado='activo'` en 3.8). No se destruye el registro.

### 4.2. Función `fn_recalcular_saldo_cuenta()` (esquema)

```sql
CREATE OR REPLACE FUNCTION public.fn_recalcular_saldo_cuenta()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  _ids uuid[];
BEGIN
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

  PERFORM pg_advisory_xact_lock(hashtext('tz_saldo:' || m.cuenta_id::text))
    FROM (SELECT DISTINCT c FROM unnest(_ids) AS t(c) ORDER BY 1) m;

  UPDATE public.cuentas_bancarias c
     SET saldo_actual = c.saldo_inicial
       + coalesce((SELECT sum(CASE WHEN mo.tipo='ingreso' THEN mo.monto ELSE -mo.monto END)
                   FROM public.movimientos_bancarios mo
                   WHERE mo.cuenta_id = c.id AND mo.estado='activo'), 0)
   WHERE c.id = ANY(_ids);

  RETURN COALESCE(NEW, OLD);
END $$;
```

Detalles de diseño (canónicos de `FASE3A1_INFORME_TECNICO.md` §7 y `FASE3.2_PLAN.md` §6.2):

- **Anulación/reactivación:** cambia `estado` → recalcula filtrando `estado='activo'`.
- **Cambio de cuenta A→B:** recalcula ambas (`OLD` + `NEW`).
- **Huérfanos (`cuenta_id NULL`):** lock no-op; el `UPDATE` no matchea → no rompe.
- **Deadlock:** mitigado con `pg_advisory_xact_lock` sobre IDs ordenados + prefijo `tz_saldo:`.
- **Regla dura:** esta fase crea SOLO la función. El trigger `trg_mov_saldo` se crea en FASE 3.8.

## 5. ESTRATEGIA TRANSACCIONAL (lección 3.2C-R2)

El SQL Editor de Supabase ejecuta **todo el archivo en una sola transacción implícita**. Dentro de ella, un `BEGIN;` top-level es un no-op y un `ROLLBACK;` revertiría **toda** la transacción, incluida la migración (fallo detectado en 3.2C-R1 y corregido en R2).

Por eso el script usa:

```text
MIGRACIÓN (columna + función) → COMMIT top-level (persistir) → PRUEBAS
   (BEGIN → T1 → ROLLBACK) → POST-CHECK → GATE
```

- El `COMMIT` es una **sentencia de sección, NUNCA dentro de un bloque `DO`/PLpgSQL**.
- El `BEGIN;…ROLLBACK;` de la prueba abre un bloque transaccional **nuevo y posterior** al COMMIT: el `ROLLBACK` **solo revierte la fila `ZZTEST3.2D`** y nunca la columna ni la función.
- Resultado: migración persistente + datos de prueba jamás persistidos.

## 6. PRUEBA TRANACCIONAL DE ACEPTACIÓN

Toda la prueba corre dentro de `BEGIN; … ROLLBACK;` — **los datos `ZZTEST3.2D` jamás se persisten**.

- **T1** — INSERT de un movimiento de prueba sobre **una cuenta real obtenida dinámicamente** (`SELECT id, empresa_id FROM public.cuentas_bancarias ORDER BY id LIMIT 1`; nunca UUID inventado, nunca se crea cuenta):
  1. Debe permitirse el INSERT (**PASS** si no falla).
  2. El movimiento temporal debe ser **visible dentro de la transacción**.
  3. La `cuenta_id` del movimiento debe coincidir con la cuenta seleccionada.
  4. `saldo_actual` de la cuenta debe **permanecer intacto** después del INSERT (**PASS**) → evidencia de que el trigger NO está activo (correcto en 3.2D; se activa en 3.8).
  - Si no existe ninguna cuenta real → `FAIL`/`NO EJECUTADA` controlado, sin inventar datos.

**Robustez de T1 (versión 3.2D-R1):** los resultados se registran con **flags explícitos** (`insert_ok`, `visible`, `saldo_intacto`) persistidos como **GUC de sesión** (`set_config(…, is_local=false)`), que **sobreviven al `ROLLBACK`** y son leídos por el **GATE** final. Así, si alguna condición obligatoria falla (INSERT que falla, movimiento no visible, cuenta distinta, saldo alterado), T1 queda en **FAIL** y el GATE **BLOQUEA** la migración — la prueba **no puede terminar aparentando éxito**. El GATE también exige **cero triggers** sobre `movimientos_bancarios` (no solo la ausencia de `trg_mov_saldo`).

Resultado esperado:

```
PASS — T1: INSERT del movimiento temporal ZZTEST3.2D ejecutado
PASS — T1: movimiento ZZTEST3.2D visible dentro de la transaccion
PASS — T1: la cuenta del movimiento (...) coincide con la seleccionada
PASS — T1: saldo_actual intacto (...) -> trg_mov_saldo NO activo (correcto en 3.2D)
```

## 7. VERIFICACIONES POSTERIORES (post-check)

| Verificación | Esperado |
|---|---|
| V1 Tabla `movimientos_bancarios` | existe |
| V2 Columna `estado` | existe, `text`, `NOT NULL`, default `activo` |
| V3 CHECK `estado` | `estado IN ('activo','anulado')` presente |
| V4 Función `fn_recalcular_saldo_cuenta()` | existe |
| V5 Triggers en `movimientos_bancarios` | **ninguno** (0) — `trg_mov_saldo` ni otro |
| V6 `COUNT(*) WHERE referencia='ZZTEST3.2D'` | = 0 (nada persistido) |

Además, **GATE de cierre** (DO posterior al ROLLBACK, transacción propia, sin escribir datos): si algún invariante falla → `RAISE EXCEPTION` y la migración **no puede terminar aparentando éxito**. Invariantes: columna `estado` correcta (tipo `text`, `NOT NULL`, **default `activo`**), CHECK válido presente, función presente, **cero triggers** sobre la tabla, `ZZTEST3.2D` = 0, ≥ 1 cuenta real, y **flags de T1 en `true`** (`tz32d.t1_insert_ok`, `tz32d.t1_visible`, `tz32d.t1_saldo_ok` — GUC de sesión que sobrevivieron al ROLLBACK).

## 8. IDEMPOTENCIA

- **Columna `estado` no existe** → se crea con `ADD COLUMN` + CHECK nombrado.
- **Columna `estado` ya existe** → **se valida la definición completa**: tipo `text`, `NOT NULL`, default `activo` y CHECK que permita únicamente `activo`/`anulado` (nombrado `chk_movbancario_estado` o anónimo, se detecta por su definición). Si todo es correcto → `NOTICE` y **no se duplica**; continúa con verificaciones.
- **Columna `estado` existe pero con definición incorrecta** (tipo, NOT NULL, default o CHECK) → **BLOQUEO** (no se auto-reemplaza); se informa el detalle detectado para resolución manual.
- La función usa `CREATE OR REPLACE` → idempotente por construcción.

## 9. ROLLBACK

```sql
DROP FUNCTION IF EXISTS public.fn_recalcular_saldo_cuenta();
ALTER TABLE public.movimientos_bancarios DROP COLUMN IF EXISTS estado;
```

- `DROP COLUMN estado` elimina automáticamente el CHECK `chk_movbancario_estado` (dependiente de la columna).
- **NO** afecta `cuentas_bancarias` (ni datos, ni `saldo_actual`).
- **NO** es necesario quitar trigger (no existe en esta fase).

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| ROLLBACK de la prueba revierte la migración (transacción única del editor) | Medio | COMMIT top-level tras la migración (lección 3.2C-R2) |
| Trigger activado por error en esta fase | Bajo | PRE-CHECK 6 y GATE exigen **cero triggers** sobre `movimientos_bancarios`; nunca se crea en 3.2D |
| `ADD COLUMN` en segunda corrida (duplicada) | Bajo | Idempotencia: verifica si la columna existe antes de crear; BLOQUEO si está mal definida |
| CHECK anónimo del plan dificulta verificación | Bajo | CHECK nombrado explícitamente (`chk_movbancario_estado`), con detección también por definición |
| INSERT de prueba incompleto (columnas NOT NULL desconocidas) | Bajo | PRE-CHECK 5 lista las columnas NOT NULL sin default |
| Datos ZZTEST persistidos | Bajo | Prueba íntegra en `BEGIN;…ROLLBACK;` + V6 (`ZZTEST3.2D = 0`) |
| Saldo alterado por el INSERT de prueba | Bajo | T1 verifica `saldo_actual` intacto (flags + ROLLBACK) |
| T1 falla pero el GATE aparenta éxito | Medio | Flags explícitos (`insert_ok`, `visible`, `saldo_intacto`) en GUC de sesión leídos por el GATE → BLOQUEO |

## 11. ORDEN DE EJECUCIÓN

1. Revisar este plan y el SQL (`sql/migracion_fase_3_2d.sql`) — aprobación del usuario.
2. Ejecutar **ENTERTO, en orden**, en Supabase SQL Editor como **OWNER** (manual).
3. Registrar resultados:
   - 7 PRE-CHECK (posibles AVISO/INFO en 3, 4 y 5);
   - 2 `MIGRACION OK` (columna+CHECK y función);
   - `PASS — T1` en la prueba transaccional;
   - V1–V6 correctos (V5=0, V6=0) y `GATE 3.2D OK`.
4. **Cerrar FASE 3.2D** y NO avanzar a FASE 3.3 sin nueva aprobación.

---

## Entregables

- `FASE3.2D_PLAN_DETALLADO.md` (este documento)
- `sql/migracion_fase_3_2d.sql`