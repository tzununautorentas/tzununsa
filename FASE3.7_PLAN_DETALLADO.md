# FASE 3.7 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Reglas de negocio y correcciones de UI · reversa contable, protección de conciliados/anulados, `siguienteNumero` con empresa, columnas faltantes (`numero`, `concepto`) · Riesgo Medio

---

## 1. OBJETIVO

Cerrar las **reglas de negocio y correcciones de UI** pendientes de fases anteriores y de la auditoría:

1. **Reversa contable:** nueva funcionalidad para anular/reversar un asiento con `evento_tipo='reversa'`, marcando el original (`estado='reversado'`), sin romper el balance (Σdebe = Σhaber).
2. **Protección de movimientos conciliados/anulados:** impedir editar/eliminar en UI y en escrituras un movimiento `estado='conciliado'`/`anulado`, un asiento `reversado`, un gasto ya vinculado a factura/conciliación.
3. **`siguienteNumero` con empresa + concurrencia:** numeración por empresa (por módulo) sin duplicados bajo concurrencia (uso de un índice único + reintentos).
4. **Columnas faltantes en UI:** `numero` en `Pagos.jsx` (search columns apuntan a columna inexistente) y `concepto` en `Banca` (busca `concepto` que no existe; usa `descripcion`/`referencia`).
5. **Doble clic en "Contabilizar gasto" → 1 solo asiento** (idempotencia UI del push, apoyado en índices de 3.2A).

**Base DDL ya presente:** `origen_tipo/evento_tipo/estado` en `asientos_contables` (3.2A); `estado/activo/anulado` y función de saldo en movimientos (3.2D); columnas de origen/flujo (3.2E). Esta fase NO crea estructura nueva salvo la mínima necesaria (p.ej. índice para numeración).

---

## 2. DIAGNÓSTICO (hallazgos de auditoría y código)

| Ítem | Hallazgo |
|---|---|
| `src/pages/Contabilidad.jsx` | Al crear asiento usa `origen_tipo/evento_tipo/estado` (3.2A) pero **no** reversa ni protección de reversado (`:130,:368,:413`) |
| `src/pages/Banca.jsx` | `usePaginacion` busca columnas `['concepto','referencia','descripcion','categoria','notas','tipo']` — **`concepto` NO existe** (auditoría `FASE3.2E_PLAN §2.2`); `guardarMov/importar/conciliar/delMov` sin protección de conciliados/anulados (`:421-450`) |
| `src/pages/Pagos.jsx` | `siguienteNumero` sin empresa (posible colisión multiempresa); al pagar inserta movimiento `tipo:'ingreso'` sin origen (quedará resuelto por el Generador de movimientos, fase previa; aquí se alinea el campo `numero`) |
| `src/config.js` / `siguienteNumero` | Numeración global, sin partición por `empresa_id` |
| Auditoría `FASE3.2_PREFLIGHT_INFORME.md` | Confirma `concepto` inexistente y `facturas.estado` (anulada/parcial/certificada) |
| `FASE3A1 §16` | "Doble clic Contabilizar → 1 solo asiento" (prueba 5) |

---

## 3. DECISIONES DE DISEÑO

**D1 — Reversa automática y balanceada:** botón/acción de reversa que crea un asiento nuevo `evento_tipo='reversa'` con importes invertidos (haber↔debe) vinculado al original; el original pasa a `evento_tipo` -> `estado='reversado'` (conservando `origen_id`). Integridad: Σdebe = Σhaber en ambos asientos.

**D2 — Protección por estado (UI + backend):** reglas centralizadas de "inmutable" para:
- movimientos `conciliado=true` o `estado='anulado'` → **no** editar/eliminar (solo anulación de posturas permitidas: revertir `anulado` si procede).
- asientos `estado='reversado'` → **no** editar/eliminar; solo lectura.
- gastos vinculados a `pagos`/facturas/conciliación → no editar montos que los empalmen.
- `pagos_recibidos` pagados → no borrar sin reversa.

**D3 — Numeración por empresa + concurrencia:** `siguienteNumero(modulo, empresaId)` dentro de transacción con lock (patrón: tablas/seq por empresa o `SELECT … FOR UPDATE` sobre contador) y opcional índice único `(empresa_id, modulo, numero)` para doble-fuerza de la unicidad. Reintento en colisión.

**D4 — Corrección de búsquedas UI sin tocar columnas:** `Banca` busca sobre columnas reales (`referencia, descripcion, categoria, notas, tipo`); se elimina `concepto`. `Pagos` añade/alinea `numero` en el query (si la columna existe en el esquema real; se verifica en pre-check, no se asume).

**D5 — Idempotencia del push (doble clic):** deshabilitar el botón mientras la operación está en vuelo + apoyarse en `uq_asientos_identidad` (3.2A) para que el segundo push falle con unique_violation manejada (toast, sin error duro).

---

## 4. PRE-CHECKS (owner, SOLO lectura)

- **PC1** — Esquema real de `asientos_contables`: columnas `origen_tipo, evento_tipo, estado, empresa_id, debe/haber`; verificar que `evento_tipo` admite `'reversa'` y `estado` admite `'reversado'` (3.2A). No asumir.
- **PC2** — `movimientos_bancarios`: `estado` + `conciliado` presentes; `fn_recalcular_saldo_cuenta()` intacta.
- **PC3** — Esquema de `pagos`/`pagos_recibidos`: ¿existe columna `numero`? ¿`siguienteNumero` actual de `config.js`? (para alinear la corrección sin romper).
- **PC4** — Esquema de `facturas` (estado, saldo) y de `gastos` (FKs a pagos/facturas) para las protecciones.
- **PC5** — Baseline: `npm run build` pasa antes de tocar código.

---

## 5. IMPLEMENTACIÓN (código en su mayoría; SQL solo lo mínimo confirmado)

**Reversa (`src/pages/Contabilidad.jsx`):**
- Acción reversa: crear asiento `evento_tipo='reversa'` con importes en espejo; marcar original `estado='reversado'`.
- Validación: original no reversado, balanceado (Σdebe=Σhaber) antes y después.

**Protecciones (Banca, Pagos, Gastos, Facturación):**
- Estado de lectura de cada entidad antes de mutar; deshabilitar acciones de edición/borrado sobre inmutables; mensajes claros.
- En escritura: guardar el `estado`/`conciliado` y abortar si cambió entre lectura y escritura.

**Numeración (`src/config.js` o servicio):**
- `siguienteNumero(modulo, empresaId)` con contador por empresa + lock transaccional.
- Reintento simple ante colisión de concurrencia.

**Correcciones de query UI (Banca, Pagos):**
- Eliminar `concepto` de search; usar columnas reales.
- Alinear `numero` donde el esquema lo tenga (PC3).

---

## 6. PRUEBAS DE ACEPTACIÓN (checklist FASE3A1 §15)

1. Doble clic "Contabilizar gasto" → **1 solo asiento**.
2. Reversa: nuevo asiento `evento_tipo='reversa'`, original `estado='reversado'`, **libro balanceado** (Σdebe=Σhaber).
3. Movimiento conciliado/anulado → no editable/borrable (UI) y rechazado en escritura directa.
4. `siguienteNumero` genera números únicos y por empresa bajo concurrencia (2 pestañas).
5. Búsqueda en Banca funciona sin `concepto` (usa columnas reales).
6. Vínculos: no borrar un gasto pagado/conciliado sin reversa previa.
7. **Build PASS** (`npm run build`).

Se ejecutan como headless/smoke cuando sean automatizables y el resto manual (navegador, usuario real) — similar a 3.1.

---

## 7. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| `npm run build` | PASS |
| Reversa ejecutada (prueba rollback) | asiento reversado + balanceado |
| Protecciones activas | inmutables rechazados en UI y escritura |
| Numeración | única por empresa |
| Búsquedas Banca | sin `concepto`, funciona |
| Smoke de módulos | los 6 módulos afectados cargan |

**GATE:** checklist completo + build + smoke = PASS → cierre formal (frontera de código; no es un GATE SQL como fases de datos).

---

## 8. ROLLBACK

- **revert git** del cambio de 3.7. El SQL mínimo (si hubo, p.ej. índice de numeración): `DROP INDEX IF EXISTS …` documentado en el comentario del rollback.

---

## 9. FRONTERAS EXPLÍCITAS (NO en 3.7)

1. **RLS** — 3.6 (fase previa; aquí se asumen cotas de app).
2. **Trigger de saldos `trg_mov_saldo`** — 3.8 (la reversa de movimientos recalcita saldos allí).
3. **Panel GRUPO C** — 3.9.
4. **Flujo de Efectivo / reportes** — fases posteriores.
5. **Backfill histórico** — GRUPO C, prohibido.

---

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Reversa desbalanceada | Medio | Validación Σdebe=Σhaber antes/después + prueba manual |
| Borrar un inmutable por una vía no protegida | Medio | Reglas centralizadas + guardado de estado + revisión en smoke |
| Numeración con colisión multiempresa | Medio | Partición por empresa + índice único + reintento |
| Search roto si `concepto` existe en realidad | Bajo | PC3 verifica esquema real; la búsqueda ignora columnas inexistentes |
| Doble push simultáneo | Bajo | Deshabilitar botón + `uq_asientos_identidad` + manejo de unique_violation |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **PRE-FLIGHT owner:** PC1–PC5 (lecturas).
3. **Implementar** (reversa, protecciones, numeración, correcciones UI).
4. **`npm run build`** + smoke + pruebas del checklist.
5. **Pruebas manuales del owner** (reversa, inmutables, doble clic, numeración concurrente).
6. **Cerrar FASE 3.7** y NO avanzar (3.8) sin nueva aprobación.

---

## 12. ENTREGABLES

- `FASE3.7_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: cambios en `src/` (+ SQL mínimo si aplica) + `FASE3.7_INFORME.md` (build + pruebas).

---

**ESTADO: PREPARADO PARA REVISIÓN — sin código modificado ni SQL ejecutado. Pendiente aprobación del usuario.**