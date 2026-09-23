# FASE 3.3 — INFORME DE IMPLEMENTACIÓN

> Caja/Banca · **Saneamiento del `saldo_pendiente` de facturas anuladas** (GRUPO B.1)
> Regla: `estado='anulada' → saldo_pendiente = 0`
> Estado: **EJECUTADA Y VALIDADA — GATE 3.3 CERRADO**

---

## 1. RESUMEN

Se ejecutó `sql/migracion_fase_3_3.sql` en Supabase SQL Editor como OWNER. El script saneó la única factura anulada con saldo pendiente (`FAC-054325`, 630 → 0), dejó intacta `FAC-221920` (GRUPO C), creó el snapshot `public.backup_facturas_saldos` con la foto previa y validó todos los invariantes (PC0–PC6, validación del backup, POST-CHECKS V1–V6 y GATE 3.3).

## 2. QUÉ SE MODIFICÓ

- `public.facturas.saldo_pendiente` de `FAC-054325` (id `288ecff1-d89f-4e1b-a97b-ca3abce508e1`): **630 → 0**.
- Creación de `public.backup_facturas_saldos` (17 filas, suma 2317.50) — foto previa, no se recrea (anti-sobrescritura).
- Sin cambios en `estado`, otras columnas, tablas, RLS, constraints ni frontend.

## 3. QUÉ QUEDÓ INTACTO

- `FAC-221920` (id `ccb9ddf0-d1d3-47ac-873e-f224f7a34add`): `estado='parcial'`, `saldo_pendiente=1687.50` — GRUPO C, excluida por la condición canónica y vigilada por PC4.
- Total de facturas: 17 (sin filas nuevas ni borradas).

## 4. EVIDENCIAS (consulta de SOLO LECTURA posterior a la corrida)

| Columna | Valor | Esperado GATE | Resultado |
|---|---|---|---|
| `anuladas_con_saldo` | 0 | 0 | ✅ |
| `total_facturas` | 17 | 17 | ✅ |
| `suma_global` | 1687.50 | 1687.50 | ✅ |
| `fac054325_saldo` | 0.00 | 0 | ✅ |
| `fac054325_estado` | anulada | anulada | ✅ |
| `fac221920_saldo` | 1687.50 | 1687.50 | ✅ |
| `fac221920_estado` | parcial | parcial | ✅ |
| `bkp_filas` | 17 | 17 | ✅ |
| `bkp_suma` | 2317.50 | 2317.50 | ✅ |

## 5. NOTA SOBRE LA SALIDA DEL SQL EDITOR

La corrida mostró como último grid el POST-CHECK **V6** (`bkp_filas=17, bkp_suma=2317.50`) y los NOTICE (`PC0..PC6 OK`, `BACKUP OK`, `MIGRACION OK`, `GATE 3.3 OK`) aparecen en la pestaña **Messages** del SQL Editor. No hubo detención ni error: la consulta de solo lectura posterior confirma que **la transacción quedó confirmada** y el backup persiste.

## 6. TRANSACCIONALIDAD / ROLLBACK

- **Atómica**: sin `BEGIN/COMMIT` internos — el SQL Editor ejecuta el archivo como una sola transacción implícita. Cualquier `RAISE EXCEPTION` (PC, validación del backup o GATE) habría revertido todo el lote; no ocurrió.
- **Idempotente**: una re-ejecución encuentra la base ya saneada (`UPDATE 0 filas`) y conserva el backup.
- **Rollback manual** disponible en la Sección 5 del archivo: restaura `saldo_pendiente` desde `backup_facturas_saldos` si se requiere revertir (no aplicado).

## 7. CIERRE

- **GATE 3.3: CERRADO.**
- `FASE3.3_PLAN_DETALLADO.md` actualizado con evidencias (§15).
- Pendiente futuro (no bloquea): `FAC-221920` se resolverá en 3.9 / FASE 4 (reconciliación bancaria, GRUPO C).