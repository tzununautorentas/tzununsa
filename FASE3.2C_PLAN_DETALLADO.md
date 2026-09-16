# FASE 3.2C — PLAN DETALLADO DE IMPLEMENTACIÓN

> Constraint híbrido del catálogo contable · `UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)`

---

## 1. OBJETIVO

Dejar la **unicidad híbrida del catálogo contable** en `public.cuentas_contables`:

> Un código contable puede existir una sola vez como cuenta global (`empresa_id IS NULL`) y también puede existir una vez por cada empresa. Pero nunca puede repetirse dentro de la misma empresa ni existir dos veces como cuenta global.

Se implementa con un constraint `UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)`. **No modifica datos ni tablas existentes** y **no toca** el índice plano `uq_cuentas_contables_empresa_codigo` que ya forma parte del catálogo.

## 2. ESTADO PREVIO VERIFICADO (esquema real)

| Ítem | Resultado |
|---|---|
| PostgreSQL | **17.6** (soporta `NULLS NOT DISTINCT`, requiere ≥ 15) |
| `public.cuentas_contables` | existe |
| Registros actuales | **47** |
| `empresa_id` | `uuid` |
| `codigo` | `text` |
| `nombre`, `tipo`, `nivel`, `activa` | existen |
| Filas con `empresa_id IS NULL` | **0** |
| Duplicados por `(empresa_id, codigo)` | **0** |
| Cuenta `5.2.1 CarWash` | **ya NO existe** |
| Índice plano del catálogo | `uq_cuentas_contables_empresa_codigo` — **presente y NO se modifica** |

El índice plano y el nuevo constraint son **objetos distintos** que coexisten sin conflicto:

| Objeto | Tipo | Semántica NULL |
|---|---|---|
| `uq_cuentas_contables_empresa_codigo` (existente) | índice único plano | `NULL` ≠ `NULL` |
| `uq_cuenta_empresa_codigo` (nuevo) | constraint unique | `NULL = NULL` (`NULLS NOT DISTINCT`) |

## 3. PRE-CHECKS

El script **se detiene con error controlado** si falla cualquiera:

- **PRE-CHECK 0 — PostgreSQL**: versión mayor ≥ 15 (`server_version_num`).
- **PRE-CHECK 1 — Tabla**: existe `public.cuentas_contables`.
- **PRE-CHECK 2 — Columnas y tipos**: `empresa_id` = `uuid`, `codigo` = `text`.
- **PRE-CHECK 3 — Duplicados**: colisiones en `(empresa_id, codigo)` tratando `NULL = NULL` (anticipo de la semántica del constraint). **No** se corrigen automáticamente.
- **PRE-CHECK 4 — Índice existente**: `uq_cuentas_contables_empresa_codigo` presente. Si falta, **BLOQUEO** y se informa (no se crea uno nuevo fuera de alcance).
- **PRE-CHECK 5 — Estado de datos**: conteo de referencia (esperado 47). Si difiere, **AVISO** con el valor real (no se asume en silencio, no se bloquea automáticamente, no se modifica nada).

## 4. DISEÑO DEL CONSTRAINT

```sql
ALTER TABLE public.cuentas_contables
  ADD CONSTRAINT uq_cuenta_empresa_codigo
  UNIQUE NULLS NOT DISTINCT (empresa_id, codigo);
```

Semántica resultante:

| `(empresa_id, codigo)` | Permitido |
|---|---|
| `NULL` + `5.2.1` (maestro) | ✓ únicamente 1 vez |
| `EmpresaA` + `5.2.1` | ✓ |
| `EmpresaB` + `5.2.1` | ✓ |
| `EmpresaA` + `5.2.1` (2ª vez) | ✗ duplicado |
| `NULL` + `5.2.1` (2ª vez) | ✗ duplicado (diferenciador frente al índice plano) |

## 5. PRUEBA TRANSACCIONAL DE ACEPTACIÓN

Toda la prueba corre dentro de `BEGIN; … ROLLBACK;` — **los datos `ZZTEST1` jamás se persisten** al terminar obligatoriamente en `ROLLBACK`.

- **C1** — `NULL + ZZTEST1` → debe permitirse (**PASS**).
- **C2** — `empresa real + ZZTEST1` → debe permitirse (**PASS**).
- **C3** — segundo `NULL + ZZTEST1` → debe rechazarse por `unique_violation` (**PASS**).
- **C4** — segunda misma empresa `+ ZZTEST1` → debe rechazarse por `unique_violation` (**PASS**).

Cada caso se ejecuta en un bloque `DO` que **captura `unique_violation`** (sin `RAISE EXCEPTION` que aborte la transacción antes de reportar los 4 resultados). La **empresa de prueba se obtiene dinámicamente** de `public.empresas` (`SELECT id … ORDER BY id LIMIT 1`); si no existe ninguna empresa, se reporta `FAIL` controlado en C2/C4 — **nunca** se usa un UUID inventado ni se crea una empresa de prueba.

Resultado esperado:

```
PASS — NULL + ZZTEST1 permitido
PASS — empresa + ZZTEST1 permitido
PASS — segundo NULL + ZZTEST1 rechazado
PASS — segunda misma empresa + ZZTEST1 rechazado
```

## 6. VERIFICACIONES POSTERIORES (post-check)

| Verificación | Esperado |
|---|---|
| V1 Tabla `cuentas_contables` | existe |
| V2 Constraint `uq_cuenta_empresa_codigo` | existe |
| V3 Definición real | `…UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)` |
| V4 Índice `uq_cuentas_contables_empresa_codigo` | sigue existiendo |
| V5 Conteo de cuentas | = 47 (intacto) |
| V6 `COUNT(*) WHERE codigo='ZZTEST1'` | = 0 (nada persistido) |
| V7 Duplicados `(empresa_id, codigo)` | = 0 |

## 7. IDEMPOTENCIA

- **Constraint no existe** → se crea.
- **Constraint ya existe con definición correcta** → `NOTICE` y **no se duplica**; continúa con verificaciones.
- **Constraint existe con definición incorrecta** → **BLOQUEO** (no se auto-reemplaza); se informa la definición detectada para resolución manual.

## 8. ROLLBACK

```sql
ALTER TABLE public.cuentas_contables
  DROP CONSTRAINT IF EXISTS uq_cuenta_empresa_codigo;
```

El rollback **NO** elimina ni modifica `uq_cuentas_contables_empresa_codigo` (existía antes de esta fase) y **NO** toca datos.

## 9. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Colisiones existentes en `(empresa_id,codigo)` | Bajo | Pre-check 3 detiene; sin auto-corrección |
| `NULLS NOT DISTINCT` requiere PG 15+ | Bajo | Pre-check 0 (`server_version_num`) |
| Confusión entre índice plano y constraint | Bajo | Nombres distintos + V4 verifica coexistencia |
| Datos de prueba persistidos | Bajo | Prueba íntegra en `BEGIN;…ROLLBACK;` + V6 (`ZZTEST1 = 0`) |
| Empresa inexistente rompe prueba C2/C4 | Bajo | Empresa dinámica + `FAIL` controlado, sin crear empresa |

## 10. ORDEN DE EJECUCIÓN

1. Revisar este plan y el SQL (`sql/migracion_fase_3_2c.sql`) — aprobación del usuario.
2. Ejecutar **ENTERTO, en orden**, en Supabase SQL Editor como **OWNER** (manual).
3. Registrar resultados:
   - 5 `PRE-CHECK` OK (posible AVISO en 5 si conteo ≠ 47);
   - `MIGRACION OK`;
   - 4 `PASS` en la prueba transaccional;
   - V1–V7 correctos (`conteo_intacto=true`, `n_zztest_restante=0`, `n_duplicados=0`).
4. **Cerrar FASE 3.2C** y NO avanzar a FASE 3.2D sin nueva aprobación.

---

## Entregables

- `FASE3.2C_PLAN_DETALLADO.md` (este documento)
- `sql/migracion_fase_3_2c.sql`