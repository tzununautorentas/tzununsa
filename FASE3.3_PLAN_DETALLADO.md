# FASE 3.3 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Caja/Banca · **Saldos históricos de facturas** (GRUPO B.1) — saneamiento del `saldo_pendiente` de facturas **anuladas** (Regla: `estado='anulada' → saldo_pendiente=0`)

---

## 1. OBJETIVO

Dejar el `saldo_pendiente` de `public.facturas` consistente con su ciclo de vida: toda factura **anulada** debe tener saldo `0`.

**Impacto previsto (único caso):** `FAC-054325: 630 → 0`. El resto de facturas **invariante**.

**Exclusión explícita (GRUPO C):** `FAC-221920` (saldo pendiente 1,687.50) **NO se toca**: requiere reconciliación con el estado de cuenta bancario/cliente y se resuelve en 3.9 / FASE 4. Si el pre-check detectara que también está anulada, **se excluye por `id`** y se documenta; jamás se auto-aplica.

**No forma parte de 3.3:** código, otras tablas, métodos de pago, movimientos, asientos, RLS, frontend, ni el módulo de facturación (certificadas/parciales no cambian).

---

## 2. DIAGNÓSTICO (inspección read-only de esquema y datos)

Hechos establecidos por el preflight (`FASE3.2_PREFLIGHT_INFORME.md`):

- `facturas` **NO** tiene columna booleana `anulada` (probe `400`). La anulación se representa con **`facturas.estado`** (dominio real: `anulada` / `parcial` / `certificada`). → **Todo predicado usa `estado='anulada'`**, nunca `anulada` booleano.
- `saldo_pendiente` existe y es numérico.
- Caso objetivo: `FAC-054325` (anulada, saldo pendiente `630`).
- `FAC-221920`: saldo pendiente `1,687.50`, excluida; además tiene movimiento bancario B `6,750` y relación bancaria — se resuelve con estado de cuenta.

El estado real de estas variables se re-confirma en PRE-CHECK (owner, SQL Editor) antes de cualquier escritura.

---

## 3. DECISIONES DE DISEÑO

**D1 — Predicado canónico:** `WHERE estado = 'anulada' AND saldo_pendiente <> 0`. No existe columna `anulada` (preflight C2); se evita cualquier uso de la misma para impedir regresiones.

**D2 — Exclusión dura de FAC-221920:** la migración identifica los `id` a sanear de forma **explícita y transaccional** (POST-CHECK verificación por estado), y añade `id <> '<FAC-221920>'` como red de seguridad adicional SI los pre-checks confirmaran que FAC-221920 está anulada. Si no está anulada, la condición de estado la excluye naturalmente.

**D3 — Restricción de cierre estricta:** el GATE exige que **exactamente una** factura cambie (`FAC-054325`) y que el `sum(saldo_pendiente)` baje exactamente en `630`. Cualquier delta distinto → BLOQUEO (investigar, no auto-corregir). Se evita correr el UPDATE "a ciegas" si el pre-check detecta un conjunto distinto al esperado.

**D4 — Backup de datos real (rollback garantizado):** snapshot `backup_facturas_saldos` con la foto de `saldo_pendiente` previa. El rollback solo restaura esa columna desde el snapshot; nada más.

---

## 4. COMPATIBILIDAD CON FASES PREVIAS

| Fase previa | Relación con 3.3 | Verificación mínima en PRE-CHECK |
|---|---|---|
| 3.1 | Fetcher autenticado: relevante para 3.4/3.6, no para datos | — |
| 3.2A | `origen_tipo/evento_tipo/estado` en asientos; no interfiere con facturas | PC1 |
| 3.2B | Multiempresa: `facturas.empresa_id` existe, no se toca | PC2 (solo lectura) |
| 3.2C / 3.2D / 3.2E | Catálogo y estructura bancaria; independientes | — |
| GRUPO C | **FAC-221920 excluida** (GRUPO C) | PC4 (verificación explícita) |

---

## 5. PRE-CHECKS (owner, SOLO lectura; el script se detiene si uno es bloqueante)

- **PC0** — PostgreSQL ≥ 15 (`server_version_num`).
- **PC1** — `public.facturas` existe; columnas `estado` (text) y `saldo_pendiente` (numeric) existentes y con tipos correctos.
- **PC2** — Distribución por `estado`: `count(*)`, `count(saldo_pendiente<>0)` y `sum(saldo_pendiente)` agrupado por `estado`. Confirmar que el único caso `estado='anulada' AND saldo_pendiente<>0` es `FAC-054325` (630). Si hay más casos o `sum` distinto al esperado → **BLOQUEO** (revisión manual; no se auto-sanea).
- **PC3** — **FAC-054325:** verificar `estado='anulada'`, `saldo_pendiente=630`, `numero_factura/numero` para trazabilidad.
- **PC4** — **FAC-221920:** verificar estado y saldo; si `estado='anulada'` → activar exclusión explícita por `id` (D2); se documenta en el informe. Si no lo está, no requiere exclusión.
- **PC5** — Backup `backup_facturas_saldos`: si no existe → **crearlo** (`CREATE TABLE AS SELECT id, saldo_pendiente ... FROM facturas`) y verificar `count`/`sum` de la copia == tabla origen; si existe → verificar que cubra el estado actual (BLOQUEO si no).
- **PC6** — Línea base de saldo: `sum(saldo_pendiente)` global pre (para validar el delta de −630 en POST-CHECK) y `count(facturas)`.

---

## 6. MIGRACIÓN PROPUESTA (NO ejecutar; solo con aprobación)

```sql
-- 6.1 Aplicar saneamiento (idempotente): solo anuladas con saldo<>0, excluyendo FAC-221920 si aplica (D2)
UPDATE public.facturas
   SET saldo_pendiente = 0
 WHERE estado = 'anulada'
   AND saldo_pendiente <> 0
   AND id <> '<FAC-221920-id>';   -- excluye GRUPO C (ver PC4/D2)
```

- **Idempotente por definición:** segunda ejecución → 0 filas afectadas (ya saneado).
- Sin COMMIT especial: el UPDATE es una sola sentencia atómica. Se sigue el patrón general: migración → verificación inmediata → post-checks → GATE (sin correr tras un rollback que revierta el UPDATE real, como en 3.2C-R2/3.2D-R4 no aplica aquí por ser una sola sentencia de datos).
- NOTICE con el número de filas afectadas (`GET DIAGNOSTICS`) — esperado `1` (o `0` si ya estaba saneado).

---

## 7. VERIFICACIÓN POST-MIGRACIÓN (inmediata, misma sesión)

1. `count(facturas WHERE estado='anulada' AND saldo_pendiente<>0)` = **0**.
2. `saldo_pendiente` de `FAC-054325` = **0**.
3. `saldo_pendiente` de `FAC-221920` = **1,687.50** (intacta).
4. `sum(saldo_pendiente)` global = base_pre − **630**; `count(facturas)` = base_pre (sin filas nuevas/borradas).

---

## 8. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| Anuladas con saldo | `0` |
| `FAC-054325` | `saldo_pendiente = 0` |
| `FAC-221920` | intacta (`1,687.50`) salvo que PC4/la conciliación de 3.9 ordene lo contrario (nunca en esta fase) |
| `sum(saldo_pendiente)` global | `pre_pre − 630` |
| `count(facturas)` | idéntico a PC6 |
| Backup existente y reutilizable | `backup_facturas_saldos` intacto |

**GATE** (DO posterior, transacción propia, sin escribir datos): verifica cada invariante anterior; cualquier desvío → `RAISE EXCEPTION 'GATE 3.3 BLOQUEO: ...'` y la fase no termina aparentando éxito. Éxito → `RAISE NOTICE 'GATE 3.3 OK: ...'`.

---

## 9. IDEMPOTENCIA

- La migración (UPDATE condicional) es **idempotente**: re-ejecutarla no cambia nada nuevo (0 filas en segunda corrida) y el GATE la acepta.
- El backup se respeta como anti-sobrescritura: si ya existe, se valida; no se recrea sin autorización.

---

## 10. ROLLBACK

```sql
-- Restaurar SOLO saldo_pendiente desde el snapshot pre-3.3
UPDATE public.facturas f
   SET saldo_pendiente = b.saldo_pendiente
  FROM backup_facturas_saldos b
 WHERE b.id = f.id;
```

- No elimina ni modifica otra columna, ni índices/FKs, ni otras tablas.
- `backup_facturas_saldos` se conserva como evidencia (nunca se elimina en el rollback).

---

## 11. FRONTERAS EXPLÍCITAS (NO forma parte de 3.3)

1. **FAC-221920 y otros GRUPO C** — nada, solo lectura/pre-checks; su resolución es 3.9/FASE 4.
2. **Código / frontend** — cero cambios (ni facturación ni pagos).
3. **Saldos de asientos / bancarios / movimientos** — no se tocan (solo `facturas.saldo_pendiente`).
4. **Backfill de orígenes** (GRUPO C) y **RLS** (3.6) — fuera.

---

## 12. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Sanear más facturas de las esperadas | Bajo | PC2 bloquea si el conjunto difiere de `FAC-054325`; GATE valida el delta exacto (−630) |
| Tocar FAC-221920 por error de predicado | Bajo | Exclusión explícita por `id` (D2) + verificación GATE por `id` |
| Pérdida del valor previo para rollback | Bajo | Snapshot `backup_facturas_saldos` con count/sum verificados (PC5) |
| Predicado errado usando `anulada` booleano | Bajo | D1: solo `estado='anulada'` (preflight C2) |

---

## 13. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación explícita del usuario).
2. **PRE-FLIGHT owner** (SQL Editor, SOLO lectura): PC0–PC6; pegar salidas.
3. **Escribir** `sql/migracion_fase_3_3.sql` (PRE-CHECKS → MIGRACIÓN → VERIFICACIÓN → POST-CHECKS → GATE → ROLLBACK comentado) y aprobar.
4. **Ejecutar ENTERO** en Supabase SQL Editor como OWNER.
5. Registrar: PC0–PC6, NOTICE del UPDATE, verificaciones, post-checks y `GATE 3.3 OK`.
6. **Cerrar FASE 3.3** y NO avanzar (3.4, 3.5, 3.6, 3.9, FASE 4) sin nueva aprobación.

---

## 14. ENTREGABLES

- `FASE3.3_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: `sql/migracion_fase_3_3.sql` + informe `FASE3.3_INFORME.md` con evidencias.

---

**ESTADO: FASE 3.3 EJECUTADA Y VALIDADA (GATE 3.3 OK) — ver `FASE3.3_INFORME.md` para las evidencias.**

---

## 15. EVIDENCIAS DE EJECUCIÓN

Ejecutada por el owner en Supabase SQL Editor como OWNER (archivo `sql/migracion_fase_3_3.sql`, corrida completa). Resultado confirmado por consulta de SOLO LECTURA posterior:

| Columna | Valor | Esperado GATE |
|---|---|---|
| `anuladas_con_saldo` | **0** | 0 ✅ |
| `total_facturas` | **17** | 17 ✅ |
| `suma_global` | **1687.50** | 1687.50 (2317.50 − 630) ✅ |
| `fac054325_saldo` | **0.00** | 0 ✅ |
| `fac054325_estado` | **anulada** | anulada (intacto) ✅ |
| `fac221920_saldo` | **1687.50** | 1687.50 (intacta, GRUPO C) ✅ |
| `fac221920_estado` | **parcial** | parcial (intacto) ✅ |
| `bkp_filas` | **17** | 17 ✅ |
| `bkp_suma` | **2317.50** | 2317.50 (evidencia pre-3.3) ✅ |

**Nota sobre la UI del SQL Editor:** la corrida produjo el grid de V6 (`bkp_filas/bkp_suma`) como último resultado y los NOTICE (`PC0..PC6 OK`, `BACKUP OK`, `MIGRACION OK`, `GATE 3.3 OK`) en la pestaña **Messages**; no es una detención de la ejecución. La consulta de solo lectura posterior confirma que la transacción quedó **confirmada** (el backup `backup_facturas_saldos` persiste con la foto previa 17/2317.50).

**GATE 3.3: CERRADO.** La migración es idempotente: una re-ejecución arroja `UPDATE 0 filas` y conserva el backup (anti-sobrescritura). Rollback disponible en Sección 5 del archivo si se requiere revertir.