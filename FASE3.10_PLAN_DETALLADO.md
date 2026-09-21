# FASE 3.10 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Cierre integral de FASE 3 · **Pruebas de aceptación globales + snapshot** de referencia para FASES 4/5

---

## 1. OBJETIVO

Ejecutar el **checklist completo de aceptación de FASE 3** (verificado end-to-end sobre el esquema y la app), estabilizar la base con un **snapshot consolidado** y dejar documentado el estado para **FASE 4 (conciliación)** y **FASE 5** (si aplica).

**Regla:** ninguna fase posterior (4/5) se inicia sin esta batería en PASS y el snapshot generado.

---

## 2. CHECKLIST DE ACEPTACIÓN (checklist integral `FASE3A1 §15` + acumulados por fase)

| # | Verificación | Origen | Estado esperado al cierre |
|---|---|---|---|
| 1 | `count(asiento_lineas WHERE empresa_id IS NULL)` = 0 | 3.2A | PASS |
| 2 | `count(facturas WHERE estado='anulada' AND saldo_pendiente<>0)` = 0 | 3.3 | PASS |
| 3 | Saldo bancario reconstruido = `saldo_actual` en **todas** las cuentas (diff 0) | 3.8 | PASS |
| 4 | Usuario test A: `count` filas empresa B = 0; INSERT/UPDATE ajeno → error | 3.6 | PASS (puerta 3.4/3.5) |
| 5 | Doble clic "Contabilizar gasto" → 1 asiento | 3.7 | PASS |
| 6 | Token expirado → refresh → retry ok, sin duplicar | 3.1 | PASS |
| 7 | Cambio de cuenta A→B en movimiento → ambas saldos correctos | 3.8 | PASS |
| 8 | Anular/reactivar movimiento → saldo se ajusta | 3.8 | PASS |
| 9 | Reversa: asiento `evento_tipo='reversa'`, original `reversado`, libro balanceado | 3.7 | PASS |
| 10 | Generador de movimientos: orígenes + `tipo_flujo` + transferencias (T1-P/G/M/T/DEL) | Generador | PASS |
| 11 | Empresa activa: con 2 empresas, solo se ve la activa (selectordem selector) | 3.5 | PASS |
| 12 | RLS: todas las tablas objetivo con `relrowsecurity=true` | 3.6 | PASS |
| 13 | Triggers/app: `trg_mov_saldo` presente y 0 triggers extra | 3.8 | PASS |
| 14 | GRUPO C: reporte 3.9 entregado y decisiones registradas | 3.9 | REPORTADO |
| 15 | Build frontend `npm run build` | 3.1/3.5/3.7 | PASS |

**Nota:** las #3/#7/#8 son la misma evidencia (baseline diff 0) — se consolidan en una sola prueba de saldos.

---

## 3. CONSOLIDACIÓN DE EVIDENCIAS

- Recopilar NOTICEs/GATE de cada fase (3.1/3.2A-E/3.3/3.4/3.5/3.6/3.7/3.8/3.9 + Generador) en `FASE3.10_INFORME.md`.
- Para las verificaciones SQL, re-ejecutar las consultas read-only de la batería y registrar los valores reales (no los esperados aprobados).
- Para las UI/frontend, resultados MANUALES del owner (login, selector, reversa, doble clic, inmutables, refresh).

---

## 4. SNAPSHOT CONSOLIDADO (owner, SQL Editor)

```sql
-- Esquema de respaldo (una sola corrida; anti-sobrescritura)
CREATE SCHEMA IF NOT EXISTS _bkp_fase3;

CREATE TABLE _bkp_fase3.facturas             AS SELECT * FROM public.facturas;
CREATE TABLE _bkp_fase3.movimientos_bancarios AS SELECT * FROM public.movimientos_bancarios;
CREATE TABLE _bkp_fase3.cuentas_bancarias    AS SELECT * FROM public.cuentas_bancarias;
CREATE TABLE _bkp_fase3.asientos_contables   AS SELECT * FROM public.asientos_contables;
CREATE TABLE _bkp_fase3.asiento_lineas       AS SELECT * FROM public.asiento_lineas;
CREATE TABLE _bkp_fase3.cuentas_contables    AS SELECT * FROM public.cuentas_contables;
CREATE TABLE _bkp_fase3.usuarios_sistema     AS SELECT * FROM public.usuarios_sistema;
CREATE TABLE _bkp_fase3.usuario_empresas     AS SELECT * FROM public.usuario_empresas;
-- + las que el inventario real confirme (PC1)
```

**Verificación:**
- `count(*)` origen = copia por tabla.
- `sum(monto)`/`sum(saldo_*)/sum(debe/haber)` origen = copia por tabla.
- Muestreo 3 filas por tabla (primera, última, intermedia) campo a campo.
- **Anti-sobrescritura:** si `_bkp_fase3` ya existe → BLOQUEO y usar `_bkp_fase3_<YYYYMMDDHHMMSS>` (patrón 3.2E PC7).

**ALCANCE del snapshot:** el inventario real de tablas operativas+catalogo+authz (PC1 no asume). El schema es respaldo/consulta: NO se usará para restaurar por defecto (la recuperabilidad real se valida en FASE 4/5 o en práctica de restauración separada).

---

## 5. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| Checklist 1–15 | PASS (o REPORTADO para #14) |
| Snapshot `_bkp_fase3` (o `_bkp_fase3_<ts>`) completo | count/sum/muestra verificados |
| `sum(saldo_actual)` post = baseline pre | diff 0 |
| `count(*)` por tabla operativa | invariante vs reporte previo |
| Sin residuos `ZZTEST*`/`TEST` | 0 en todas las tablas |
| `npm run build` (último) | PASS |

**GATE final FASE 3 (DO sin escritura):** verifica: checksum/contadores de las tablas críticas congelados ≠ baseline → BLOQUEO; residuos de prueba → BLOQUEO; snapshot existe + verificado → PASS; checklist 1-15 → PASS; emite `RAISE NOTICE 'GATE 3.10 OK: FASE 3 completa y estable'`. Fallo → `RAISE EXCEPTION 'GATE 3.10 BLOQUEO: ...'`.

---

## 6. IDEMPOTENCIA / ROLLBACK

- **Idempotencia:** batería y snapshot re-ejecutables con esquema alterno de timestamp; los `CREATE TABLE AS` bloquean si `_bkp_fase3` ya existe (anti-sobrescritura).
- **Rollback:** no aplica (solo lecturas + snapshot de respaldo); no se introducen cambios funcionales en esta fase.

---

## 7. FRONTERAS EXPLÍCITAS (NO en 3.10)

1. **FASE 4 (conciliación bancaria)** — se inicia solo tras este cierre y nueva aprobación.
2. **Correcciones GRUPO C** — ya decididas en 3.9; si quedó alguna pendiente, NO se aplica aquí.
3. **Deploy de producción** — no forma parte (decisión separada del owner).
4. **Backfill/inferencias** — prohibidos.

---

## 8. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Checklist incompleto (p.ej. pruebas manuales pendientes de 3.1/3.5/3.7) | Medio | Se marcan explícitas y se registran; no se "asumen" PASS |
| Snapshot colisionado en segunda corrida | Bajo | PC7-style: `_bkp_fase3` o `_bkp_fase3_<ts>`; BLOQUEO si existe |
| Residuos de prueba en tablas | Bajo | GATE escanea `ZZTEST*`/`TEST` = 0 |
| Cambios de esquema entre 3.8 y 3.10 | Bajo | Batería se re-ejecuta en el estado final real |

---

## 9. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **PRE-FLIGHT owner:** inventario real de tablas (PC1) + confirmar fichas de las fases 3.1-3.9 cerradas.
3. **Re-ejecutar** batería read-only (checklist 1-15) y registrar valores reales.
4. **Crear snapshot** `_bkp_fase3` (+ verificación count/sum/muestra) y registrar.
5. **GATE 3.10** → `GATE 3.10 OK`.
6. **Generar** `FASE3.10_INFORME.md` + `FASE3_INFORME_GLOBAL.md` (consolidado FASE 3) y **cerrar FASE 3**.
7. **NO iniciar FASE 4** sin nueva aprobación.

---

## 10. ENTREGABLES

- `FASE3.10_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: script de batería + snapshot (`sql/migracion_fase_3_10.sql`) + `FASE3.10_INFORME.md` + `FASE3_INFORME_GLOBAL.md`.

---

**ESTADO: PREPARADO PARA REVISIÓN — sin SQL ejecutado ni snapshot creado. Pendiente aprobación del usuario.**