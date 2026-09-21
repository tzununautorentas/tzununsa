# GENERADOR DE MOVIMIENTOS / FLUJO — PLAN DETALLADO DE IMPLEMENTACIÓN

> Caja/Banca · Generador que **escribe** movimientos bancarios con origen + clasificación de flujo (`tipo_flujo` NOT NULL + CHECK de dominio), transferencias internas funcionales y reglas de integridad del par. Fase de dominio (posterior a 3.2E, previa a 3.3).

---

## 1. OBJETIVO

Convertir `public.movimientos_bancarios` (hasta hoy solo estructura, 3.2E) en la **capa operativa** de caja/banco:

1. **Escritura con origen:** todo movimiento nuevo se crea con `origen_tipo` + `origen_id` (idempotencia garantizada por `uq_mov_origen`, 3.2E) y `tipo_flujo` obligatorio.
2. **Clasificación de flujo validada:** `tipo_flujo` **NOT NULL** + **CHECK** de dominio `OPERATIVA | INVERSION | FINANCIAMIENTO | TRANSFERENCIA_INTERNA`.
3. **Dirección de flujo:** dominio de dirección entrada/salida ligado a `tipo` (`ingreso`/`egreso`); CHECK coherente.
4. **Transferencias internas funcionales:** creación por **pares ligados** (neto contable 0), invariantes del par y prohibición de DELETE solitario de una pierna.
5. **Integración de orígenes existentes:** Pagos (pago_cliente), Gastos (gasto), Banca manual/importado (manual), cobros de factura (factura), cotizaciones/reservas (si aplica).

**No forma parte de esta fase:** backfill histórico de orígenes (GRUPO C), RLS (3.6), `trg_mov_saldo` (3.8), reporte de Flujo de Efectivo, frontend (se adapta en 3.7), conciliación (FASE 4).

---

## 2. BASE PREVISTA (post 3.2E)

- Columnas 3.2E presentes: `origen_tipo`, `origen_id`, `tipo_flujo`, `cuenta_contraparte_id`, `movimiento_contraparte_id` (todas NULL).
- Índice `uq_mov_origen` (parcial, excluye `transferencia`) y `idx_mov_cuenta_fecha` (o equivalente conservado).
- `estado` (`activo`/`anulado`, 3.2D) y `fn_recalcular_saldo_cuenta()` (3.2D, esquema; trigger en 3.8).
- 33 movimientos históricos con las columnas nuevas en NULL (no se tocan).

---

## 3. DECISIONES DE DISEÑO

**D1 — `tipo_flujo` NOT NULL + CHECK:** se impone la obligatoriedad y el dominio (diferidos en 3.2E por D1). Antes de `SET NOT NULL` se requiere que los movimientos nuevos que escriba el generador lleven siempre un valor válido.

**D2 — Dominios y dirección:**
- `tipo_flujo IN ('OPERATIVA','INVERSION','FINANCIAMIENTO','TRANSFERENCIA_INTERNA')` (mayúsculas, normalizado por el generador).
- Dirección coherente: `CHECK ( (tipo='ingreso' AND monto>=0) OR (tipo='egreso' AND monto>=0) )` si se desea normalizar signo; se evalúa contra la firma actual de `fn_recalcular_saldo_cuenta` (`+monto` solo para `ingreso`). La dirección del flujo se **deriva** de `tipo`, no de un campo extra.

**D3 — Transferencias = par ligado, no `tipo` nuevo** (ratifica 3.2E D2): pierna A `egreso`, pierna B `ingreso`, mismo monto; `tipo_flujo='TRANSFERENCIA_INTERNA'` en ambas; referencias cruzadas recíprocas (`cuenta_contraparte_id` y `movimiento_contraparte_id` opuestas); misma `origen_tipo='transferencia'` y `origen_id` para ambas (permitido porque `uq_mov_origen` excluye `transferencia`).

**D4 — Invariantes del par (reglas de negocio, aplicadas por el generador; se refuerzan con CHECK/trigger si el owner lo aprueba):**
- Exactamente 2 piernas activas por `movimiento_contraparte_id`.
- `A.cuenta_contraparte_id = B` y `B.cuenta_contraparte_id = A`.
- `A.movimiento_contraparte_id = B.id` y `B.movimiento_contraparte_id = A.id`.
- Neto contable **0** (`Σ monto` del par = 0), saldos de A y B correctos.
- **Prohibición de DELETE solitario de una pierna** (regla de negocio en la capa de escritura; trigger de protección si se aprueba).

**D5 — CHECK de dominios completo:** se agregan los CHECK de `origen_tipo` y de `tipo_flujo`+dirección ahora que el generador conoce el dominio cerrado (precedente 3.2A §3: diferido hasta cobertura real). Historias `NULL` de pre-fase quedan permitidas o se requiere backfill decidido — no se auto-infiere (GRUPO C).

**D6 — El generador es código (servicio) + funciones SQL puras donde aplique:** la escritura se centraliza en un servicio (`src/services/movimientoService.js` o similar) que valida orígenes, idempotencia y pares; funciones DB auxiliares para operaciones atómicas de transferencia si se aprueba (o transacción en el servicio con `supabase.rpc`).

---

## 4. MIGRACIÓN PROPUESTA (DB; NO ejecutar; con aprobación)

```sql
-- 4.1 CHECK de dominio de tipo_flujo (NOT NULL se impone SOLO tras cobertura total del generador)
ALTER TABLE public.movimientos_bancarios
  ADD CONSTRAINT chk_movbancario_tipo_flujo
  CHECK (tipo_flujo IS NULL OR tipo_flujo IN ('OPERATIVA','INVERSION','FINANCIAMIENTO','TRANSFERENCIA_INTERNA'));

-- 4.2 CHECK de origen_tipo (dominio cerrado por el generador)
ALTER TABLE public.movimientos_bancarios
  ADD CONSTRAINT chk_movbancario_origen_tipo
  CHECK (origen_tipo IS NULL OR origen_tipo IN
    ('pago_cliente','gasto','factura','cotizacion','reserva','movimiento_bancario','transferencia','manual'));

-- 4.3 SET NOT NULL tipo_flujo: SOLO si 0 movimientos con NULL en el path del generador
ALTER TABLE public.movimientos_bancarios ALTER COLUMN tipo_flujo SET NOT NULL;
```

**Puertas:** 4.3 solo se ejecuta si el generador cubre TODOS los INSERT del sistema (Pagos, Gastos, Banca, manual, transferencia). Mientras quede un INSERT sin clasificar → se mantiene NULL-able y el CHECK permite NULL (D5).

---

## 5. PRUEBA TRANSACCIONAL DE ACEPTACIÓN (armés 3.2D-R4/3.2E: subtransacciones `TZ001` + marcador `t1_result`)

- **T1-P (pago_cliente):** crear movimiento de pago con origen; verificar `uq_mov_origen` (2º intento → unique_violation).
- **T1-G (gasto):** idem con `origen_tipo='gasto'`.
- **T1-M (manual/importado):** `origen_tipo='movimiento_bancario'`/`manual` (importación XLS).
- **T1-T (transferencia):** crear par A/B, validar invariantes D4 (reciprocidad, neto 0, saldos intactos), re-intento del mismo origen (permitido, 2 piernas).
- **T1-N (NULL histórico):** INSERT estilo pre-fase (sin columnas nuevas) sigue funcionando mientras no se aplique NOT NULL; tras 4.3, el generador siempre las manda (test: INSERT sin `tipo_flujo` → error esperado).
- **T1-DEL (protección pierna):** DELETE solitario de una pierna del par → rechazado (regla/protector).
- Todo con rollback y `ZZTESTGEN`=0 al final.

---

## 6. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| CHECK `chk_movbancario_tipo_flujo`, `chk_movbancario_origen_tipo` presentes | ok |
| `tipo_flujo` NOT NULL (si se aplicó 4.3) | ok |
| `uq_mov_origen` sigue excluyendo transferencia | definición intacta |
| Triggers | 0 de aplicación (`trg_mov_saldo` ausente, 3.8) |
| Datos históricos | 33 movimientos intactos (checksum canónico §7) |
| `ZZTESTGEN`=0; saldos de cuentas intactos | ok |
| Invariantes del par (si hay pares) | reciprocos + neto 0 |

**GATE:** `t1_result='pass'`, estructura (checks + NOT NULL si aplica), 0 triggers, checksum y saldos intactos → `RAISE NOTICE 'GATE GENERADOR OK: ...'` o `RAISE EXCEPTION` en caso contrario.

---

## 7. INTEGRIDAD DE HISTÓRICOS (checksum)

Misma regla que 3.2E §9: checksum canónico sobre las columnas preexistentes (incluidas las 5 de 3.2E que ya existan) con `NULL`→`<NULL>` centinela y `ORDER BY id::text`; `checksum_pre = checksum_post` (salvo filas nuevas del generador, todas con origen válido). No se modifican los 33 históricos.

---

## 8. IDEMPOTENCIA / ROLLBACK

- **Idempotencia:** CHECKs con guarda `IF NOT EXISTS`/validación de definición (patrón 3.2E); 4.3 `SET NOT NULL` idempotente (si ya es NOT NULL, NOTICE).
- **Rollback:**
```sql
ALTER TABLE public.movimientos_bancarios DROP CONSTRAINT IF EXISTS chk_movbancario_tipo_flujo;
ALTER TABLE public.movimientos_bancarios DROP CONSTRAINT IF EXISTS chk_movbancario_origen_tipo;
ALTER TABLE public.movimientos_bancarios ALTER COLUMN tipo_flujo DROP NOT NULL;
```
- Si el owner aprueba trigger protector de piernas: `DROP TRIGGER IF EXISTS trg_mov_tranferencia_protector ...` (se define en el plan de detalle del trigger).
- No se tocan datos históricos ni índices 3.2E.

---

## 9. FRONTERAS EXPLÍCITAS (NO en esta fase)

1. **Backfill de orígenes históricos** — GRUPO C, no se infiere.
2. **`trg_mov_saldo`** — FASE 3.8.
3. **RLS** — FASE 3.6.
4. **Reporte de Flujo de Efectivo** — propia fase; esta fase SOLO clasifica.
5. **Frontend/UX** — se adapta en 3.7; aquí solo el servicio/API del generador.
6. **FAC-221920 / huérfanos / `dff6b2e1`** — GRUPO C, no se tocan.

---

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| `SET NOT NULL` (4.3) rompe un INSERT que el generador no cubre | Alto | Puerta estricta: 4.3 solo cuando la cobertura del generador es 100%; CHECK permite NULL mientras tanto (D5) |
| CHECK de dominio rechaza valores de módulos futuros | Medio | Dominio alineado a 3.2A §3 y 3.2E §3.1; extensión documentada (`evento_tipo` discriminante si un origen resulta 1:N, 3.2E §3.3) |
| Transferencia con neto ≠ 0 por error | Medio | Invariantes D4 en el generador + prueba T1-T + GATE; trigger protector opcional |
| DELETE solitario de pierna | Medio | Regla de negocio D4 + protector (con aprobación) |
| Fila de prueba persistida | Bajo | Arnés subtransaccional + GATE `ZZTESTGEN=0` |
| Idempotencia rota por el generador (duplicado) | Bajo | `uq_mov_origen` 3.2E + T1-P/T1-G con reintento → unique_violation |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación explícita) — incluye decidir: trigger protector de piernas (sí/no), normalización del dominio y si 4.3 corre en esta misma fase o en 3.7.
2. **PRE-FLIGHT owner** (SQL Editor, SOLO lectura): confirmar estado post-3.2E (estructura, `uq_mov_origen`, triggers=0, checksum de históricos).
3. **Escribir** la migración + servicio del generador; aprobar.
4. **Ejecutar ENTERO** como OWNER + verificación con suite T1.
5. **Cerrar** y NO avanzar a 3.3+ sin aprobación.

---

## 12. ENTREGABLES

- `GENERADOR_FLUJO_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: script SQL del generador (checks + dominio) + `src/services/movimientoService.js` (o equivalente) + informe con evidencias.

---

**ESTADO: PREPARADO PARA REVISIÓN — sin SQL generado ni ejecutado. Pendiente aprobación del usuario.**