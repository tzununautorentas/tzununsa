# FASE 3.8 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Caja/Banca · **Activación del trigger de saldos `trg_mov_saldo`** sobre `public.movimientos_bancarios` (recálculo atómico de `cuentas_bancarias.saldo_actual`) · Riesgo Bajo

---

## 1. OBJETIVO

Activar el **recálculo automático de saldos** al mutar movimientos bancarios, usando la función ya existente y conservada en 3.2D (`public.fn_recalcular_saldo_cuenta()`, `RETURNS trigger LANGUAGE plpgsql`, validada en `GATE 3.2D-R4-R1` con los 12 marcadores funcionales):

```sql
CREATE TRIGGER trg_mov_saldo
AFTER INSERT OR UPDATE OR DELETE ON public.movimientos_bancarios
FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_saldo_cuenta();
```

**Efectos esperados (semántica de la función):**
- INSERT: recalcula la cuenta del nuevo movimiento.
- DELETE: recalcula la cuenta del movimiento borrado.
- UPDATE: si cambió `cuenta_id` → recalcula **ambas** cuentas (OLD y NEW); si no → recalcula la cuenta única.
- `saldo_actual = saldo_inicial + Σ (ingreso:+monto | egreso:−monto) de movimientos estado='activo'`.

**No forma parte:** cambios en la función (ya validada), RLS, frontend, datos, ni `fn` para otras tablas.

---

## 2. DIAGNÓSTICO (estado base, post 3.2D/3.2E)

- `fn_recalcular_saldo_cuenta()` **existe** y fue conservada/validada (GATE 3.2D-R4-R1 OK: estructura + marcadores; `pg_advisory_xact_lock` incluida para evitar carreras).
- `trg_mov_saldo` **NO existe** y **0 triggers de aplicación** en `movimientos_bancarios` (verificado/PC4 en 3.2D; se re-confirma).
- Saldos actuales coherentes con el cálculo cliente (Banca.jsx recalcula en cliente hoy). El primer recálculo por trigger debe dar el **mismo** resultado (delta 0 diff) — prueb a clave.
- `tipo` dominio vigente: `'ingreso'`/`'egreso'` (la función firma +monto solo para `'ingreso'`).

---

## 3. DECISIONES DE DISEÑO

**D1 — Trigger AFTER por fila (único), función sin cambios.** No se toca `fn_recalcular_saldo_cuenta()`. La transacción del trigger define su propio lock (advisory), evitando carreras concurrentes sobre la misma cuenta.

**D2 — Semántica de diff saldos = fuente de la prueba:** antes de persistir el trigger, se ejecuta una suite que:
- con el trigger **desactivado**, recalcula los saldos desde `saldo_inicial + Σ` y compara con `saldo_actual` actual (baseline: **todas** las cuentas, diff 0 esperado; si no, se corrige ANTES de activar el trigger — nunca después);
- luego activa el trigger y verifica que una mutación de prueba produce el recálculo esperado y la base queda estable.

**D3 — Salvaguarda si el baseline de saldos no está cuadrado:** si alguna cuenta tuviera `saldo_actual ≠ saldo_inicial + Σactivos`, la activación del trigger la "fijaría" a su estado verdaderamente derivado, alterando el valor mostrado. Por eso **3.8 exige baseline con diff 0 en todas las cuentas antes de activar** (si el owner prefiere, se corrige en la fase 3.9/GRUPO C manualmente, nunca aquí de forma automática).

**D4 — Anulación/reactivación:** mover un movimiento a `estado='anulado'` (3.2D) o reactivarlo debe recalcular la cuenta (UPDATE dispara el trigger). Ajustes de UI de anular/reactivar ya resueltos en 3.7; aquí solo se verifican sus efectos en saldo.

**D5 — Idempotencia:** `CREATE TRIGGER IF NOT EXISTS` no existe en Postgres; se usa `DROP TRIGGER IF EXISTS trg_mov_saldo …; CREATE TRIGGER …` con guarda de validación previa (y post) — el script nunca deja el trigger a medias (COMMIT top-level, patrón 3.2D-R4).

---

## 4. PRE-CHECKS (owner, SOLO lectura)

- **PC1** — Función existe y válida (`to_regprocedure('public.fn_recalcular_saldo_cuenta()')` + `pg_get_function_result='trigger'` + `lanname='plpgsql'`).
- **PC2** — `trg_mov_saldo` ausente y `count(triggers application)=0` sobre `movimientos_bancarios` (3.2D PC4).
- **PC3** — **Baseline de saldos (diff 0):** en una sola consulta, por cuenta: `saldo_actual` vs `saldo_inicial + Σ(monto con signo de tipo='ingreso')` sobre movimientos `estado='activo'`. **Todas diff=0 obligatorio** (si no → BLOQUEO; se resuelve en pre-requisito, no se auto-corrige).
- **PC4** — `count(movimientos)`, `count(cuentas)`, checksum canónico de movimientos y `sum(saldo_actual)` (línea base de estabilidad).
- **PC5** — Confirmar dominio `tipo` (`ingreso`/`egreso`) sin valores sorpresa.

---

## 5. MIGRACIÓN PROPUESTA (NO ejecutar; con aprobación)

```sql
-- 5.1 Aislar (patrón 3.2D-R4): DROP pre + CREATE con COMMIT top-level separado
DROP TRIGGER IF EXISTS trg_mov_saldo ON public.movimientos_bancarios;

CREATE TRIGGER trg_mov_saldo
AFTER INSERT OR UPDATE OR DELETE ON public.movimientos_bancarios
FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_saldo_cuenta();

COMMIT; -- persistir el trigger ANTES de la prueba transaccional
```

**Pruebas (subtransacción revertida `TZ001`, patrón 3.2D/3.2E):**
- **T1 (INSERT):** insertar movimiento temporal en cuenta A → `saldo_actual(A)` sube/baja según tipo; revertir.
- **T2 (DELETE):** borrar ese movimiento → vuelve a `saldo_actual(A)` original; revertir.
- **T3 (UPDATE cuenta):** mover el movimiento de A→B → ambas cuentas recalcular; revertir.
- **T4 (anular/reactivar):** `estado='anulado'`→`'activo'` → recálculo; revertir (con el estado de 3.2D).
- **T5 (baseline estable):** tras la suite, `sum(saldo_actual)` recalculado = baseline PC3; checksum de movimientos intacto; `ZZTEST3.8`=0.

---

## 6. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| `trg_mov_saldo` existe con `tgname='trg_mov_saldo'` | sí (PG trigger) |
| `count(triggers application)` | 1 (solo este) |
| Baseline saldos tras suite | `sum(saldo_actual)` = baseline PC3 (diff 0) |
| `count(movimientos)` / `count(cuentas)` | invariantes |
| Checksum canónico de movimientos | `pre = post` |
| `ZZTEST3.8` | 0 |
| Recalculo de cuenta manipulada | igual a `saldo_inicial + Σ` (diff 0) |

**GATE:** (transacción propia, sin escritura) valida trigger presente + único, suma de saldos estable, checksum intacto, y que T1-T5 estuvieron `pass` con rollback (`t1_result`, patrón tz32d). Fallo → `RAISE EXCEPTION 'GATE 3.8 BLOQUEO: …'`; éxito → `RAISE NOTICE 'GATE 3.8 OK: trg_mov_saldo activo y saldos cuadrados'`.

---

## 7. IDEMPOTENCIA / ROLLBACK

- **Idempotencia:** DROP previo + CREATE (segunda corrida idempotente); baseline y suite se re-ejecutan.
- **Rollback:**
```sql
DROP TRIGGER IF EXISTS trg_mov_saldo ON public.movimientos_bancarios;
```
- Sin cambios de datos ni de la función; las mutaciones posteriores al drop quedan sin recálculo (volver al cálculo cliente en Banca si se revierte).

---

## 8. FRONTERAS EXPLÍCITAS (NO en 3.8)

1. **RLS** — 3.6. **Reglas UI/reversa** — 3.7 (los efectos de reversa sobre saldo se verifican aquí, el botón ya se construyó allá).
2. **Saldos des cuadrados existentes** — NO se auto-corrige; se resuelve en 3.9/GRUPO C con el negocio (D3).
3. **Conciliación bancaria / importación** — FASE 4.
4. **Flujo de Efectivo** — fases posteriores.
5. **`fn_recalcular_saldo_cuenta()`** — NO se modifica (ya validada).

---

## 9. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Activar trigger con saldos previos mal calculados | Medio | PC3 exige diff 0 en todas las cuentas ANTES; D3 no se auto-corrige |
| Carrera de concurrencia al recalcular | Bajo | `pg_advisory_xact_lock` ya en la función |
| Reescribir la función por error | Bajo | D1: la función no se toca; GATE verifica marcadores/estructura |
| Trigger duplicado | Bajo | DROP previo + validación tgname + GATE count=1 |
| Fila de prueba persistida | Bajo | Arnés subtransaccional + GATE `ZZTEST3.8=0` |

---

## 10. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **PRE-FLIGHT owner:** PC1–PC5 (lecturas) — en especial **PC3 baseline diff 0**.
3. **Escribir** `sql/migracion_fase_3_8.sql` (pre-checks → DROP/CREATE + COMMIT → T1-T5 → post-checks → GATE → rollback comentado) y aprobar.
4. **Ejecutar ENTERO** como OWNER; pegar salidas (T1-T5 PASS + `GATE 3.8 OK`).
5. **Verificación funcional del owner:** editar/borrar un movimiento real en la app y comprobar recálculo en vivo.
6. **Cerrar FASE 3.8** y NO avanzar (3.9/3.10/FASE 4) sin nueva aprobación.

---

## 11. ENTREGABLES

- `FASE3.8_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: `sql/migracion_fase_3_8.sql` + `FASE3.8_INFORME.md` con evidencias.

---

**ESTADO: PREPARADO PARA REVISIÓN — sin SQL generado ni ejecutado. Pendiente aprobación del usuario.**