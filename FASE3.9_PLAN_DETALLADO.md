# FASE 3.9 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Revisión y resolución con criterio humano del **GRUPO C** · Panel de revisión (SOLO lectura) de anomalías históricas · Riesgo Bajo (no automatiza datos)

---

## 1. OBJETIVO

Producir un **panel/reporte de revisión SOLO LECTURA** que liste las anomalías históricas del **GRUPO C** (datos que nunca se auto-corrigieron y exigen decisión del negocio), para resolverlas una a una y dejar la base lista para FASE 4 (conciliación) y 3.10 (pruebas integrales).

**Inventario GRUPO C (`FASE3A1 §9` / `FASE3A_INFORME_APROBACION §10`):**
1. **FAC-221920** — saldo pendiente 1,687.50 + movimiento B 6,750 + relación bancaria; reconciliar con estado de cuenta.
2. **Movimientos huérfanos** — `9aa1bee7` y `ce00ea20` (`cuenta_id` NULL); no asignar sin criterio.
3. **Backfill de orígenes** de los 8 pagos antiguos (`origen_tipo/origen_id`) — requiere emparejamiento manual.
4. **Asiento duplicado `dff6b2e1`** (CarWash doble) — anulación manual aprobada por negocio.
5. **Registro/rol real de usuarios** (si algún usuario quedó fuera en 3.4).
6. **Política de cuenta `5.2.1`** (maestra vs operativa) y desactivación de cuentas bancarias inactivas.

**Regla absoluta:** esta fase **NO ejecuta** ninguna corrección; solo detecta, cuantifica, documenta y prepara la decisión del usuario. Cualquier aplicación posterior se hará con consentimiento explícito por ítem.

---

## 2. DIAGNÓSTICO (fuentes)

| Ítem | Fuente conocida |
|---|---|
| FAC-221920 | saldo 1,687.50; 630 vs rest reconocidos; movimiento B 6,750; excluida de 3.3 |
| Huérfanos | `movimientos_bancarios.cuenta_id` IS NULL (`9aa1bee7`, `ce00ea20`) |
| Orígenes antiguos | 8 pagos/ventas sin `origen_tipo/origen_id` (columna nueva, NULL legítimo) |
| Asiento duplicado | `dff6b2e1` (CarWash doble) |
| Usuarios | posible lista residual tras 3.4 (si faltó algún email en `auth.users`/mapeo) |
| `5.2.1` / cuentas inactivas | `cuentas_contables` no 5.2.1 maestra/operativa; `cuentas_bancarias.activa` false |

Se convierten en consultas read-only deterministas (ver §4) que sustenten el panel.

---

## 3. DECISIONES DE DISEÑO

**D1 — SOLO LECTURA:** el panel consulta y agrega; no inserta, actualiza ni elimina. Cumplimiento: REVOKE previo de escritura en la sesión de generación del reporte si es posible, o ejecución con rol de solo lectura documentado.

**D2 — Deliverable = reporte versionado:** salida en tabla temporal + export a `FASE3.9_REPORTE_GRUPOC.md` (o CSV) con: cada ítem, filas implicadas, montos, estado actual, propuesta y **bloque de decisión** (pendiente → aprobado/rechazado/informado).

**D3 — Métricas por ítem:** para cada anomalía se reportan `count(*)`, montos/sumas, y el "impacto de resolverla" (neto). Nunca se asumen resoluciones.

**D4 — Rastreo:** cada ítem recibe un id de seguimiento (`GRUPO_C-01..06`) que se arrastra al informe y a FASE 4/3.10 para cerrarlo por completo.

**D5 — Cuentas inactivas:** se listan con su `activa=false` y su impacto en la vista de Banca; la desactivación física (si procede) es decisión del owner/proceso posterior, nunca automatizada.

---

## 4. CONSULTAS READ-ONLY (owner, SQL Editor; NO escriben)

```sql
-- Q1 FAC-221920: estado, saldo y movimientos vinculados
SELECT id, numero_factura, estado, saldo_pendiente FROM public.facturas WHERE numero_factura = 'FAC-221920';
SELECT * FROM public.movimientos_bancarios WHERE referencia ILIKE '%221920%' OR origen_id::text = '<id FAC>' OR descripcion ILIKE '%221920%';

-- Q2 Huérfanos
SELECT id, empresa_id, cuenta_id, fecha, tipo, monto, descripcion FROM public.movimientos_bancarios WHERE cuenta_id IS NULL;

-- Q3 Orígenes sin poblado (GRUPO C histórico; 3.2E deja NULL)
SELECT count(*) AS sin_origen FROM public.movimientos_bancarios WHERE origen_tipo IS NULL AND origen_id IS NULL;

-- Q4 Asiento duplicado dff6b2e1
SELECT id, fecha, origen_tipo, evento_tipo, estado, debe, haber FROM public.asientos_contables WHERE id::text LIKE '%dff6b2e1%';
SELECT * FROM public.asiento_lineas WHERE asiento_id::text LIKE '%dff6b2e1%';

-- Q5 Usuarios residuales (auth.users sin espejo / espejo sin perfil completo)
SELECT au.email, au.id AS auth_id
  FROM auth.users au
  LEFT JOIN public.usuarios_sistema us ON us.auth_id = au.id
 WHERE us.id IS NULL;

-- Q6 Cuentas 5.2.1 e inactivas
SELECT id, codigo, nombre, empresa_id FROM public.cuentas_contables WHERE codigo LIKE '5.2.1%';
SELECT id, cuenta_bancaria, activa, saldo_actual FROM public.cuentas_bancarias WHERE NOT activa;
```

---

## 5. PANEL (generación)

- Script `sql/migracion_fase_3_9.sql` de **SOLO LECTURA**: ejecuta Q1–Q6 y materializa en una tabla temporal `pg_temp._t32g9` (máx. auditable), imprime NOTICEs por ítem con `count`, montos y estado esperado.
- No `INSERT` en tablas reales; sin DDL sobre tablas operativas.
- `FASE3.9_REPORTE_GRUPOC.md`: tabla resumen + detalle por ítem + bloque de decisión en blanco para el owner.

---

## 6. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| El script corrió sin escrituras (0 DML en tablas reales) | sí (verificación con `pg_stat_dml` o log) |
| Los 6 ítems GRUPO C reportados con count/montos | todos presentes |
| Tabla temporal materializada | existe solo en sesión (pg_temp) |
| Datos sin cambios | `count(facturas)`, `count(movimientos)`, `count(asientos)` invariantes |

**GATE (DO sin escritura):** verifica que no se ejecutó ningún UPDATE/INSERT/DDL de escritura y que los contadores invariantes coinciden con la línea base previa → `RAISE NOTICE 'GATE 3.9 OK: panel generado sin escrituras'`. Fallo → `RAISE EXCEPTION 'GATE 3.9 BLOQUEO: ...'`.

---

## 7. IDEMPOTENCIA / ROLLBACK

- **Idempotente por diseño** (solo lectura; segundas corridas re-generan el reporte).
- **Rollback:** no aplica (nada se escribe). Si un futuro proceso de resolución se implementa, tendrá su propio GATE.

---

## 8. FRONTERAS EXPLÍCITAS (NO en 3.9)

1. **Ninguna corrección de datos** (ni FAC-221920, ni huérfanos, ni orígenes, ni `dff6b2e1`, ni `5.2.1`, ni cuentas inactivas) — cada una exige aprobación puntual del owner.
2. **RLS / trigger / código** — intactos.
3. **FASE 4 (conciliación)** se sirve de este reporte como insumo (no se inicia sin aprobación).

---

## 9. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Borrado accidental durante "revisión" | Bajo | D1 solo lectura + GATE de no-escrituras |
| Decisión ausente en el reporte | Bajo | Bloque de decisión explícito por ítem + D4 seguimiento |
| Confundir el reporte con corrección | Bajo | Mensajes claros: SOLO LECTURA; cada corrección = nueva fase aprobada |

---

## 10. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **Ejecutar** las consultas Q1–Q6 / `sql/migracion_fase_3_9.sql` (SOLO lectura, owner).
3. **Generar** `FASE3.9_REPORTE_GRUPOC.md` con resultados y decisiones en blanco.
4. **Owner decide por ítem** (se registra en el informe; ningún ítem se aplica sin aprobación).
5. **Cerrar FASE 3.9** (reporte entregado) y NO iniciar FASE 4/3.10 sin nueva aprobación.

---

## 11. ENTREGABLES

- `FASE3.9_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: `sql/migracion_fase_3_9.sql` (lectura) + `FASE3.9_REPORTE_GRUPOC.md` + `FASE3.9_INFORME.md`.

---

**ESTADO: PREPARADO PARA REVISIÓN — sin SQL ejecutado. Pendiente aprobación del usuario.**