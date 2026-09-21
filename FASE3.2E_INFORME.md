# INFORME FASE 3.2E — Origen y flujo de movimientos bancarios (estructura)

**Proyecto:** tzununsa (ERP Tz'unun, Supabase) · **BD:** PostgreSQL 17.6
**Fecha de ejecución:** 2026-09-19 · **Revisión cerrada:** **3.2E-R3.3**
**Script aprobado y ejecutado:** `sql/migracion_fase_3_2e_r3_3.sql` (1.420 líneas; SHA256 `D7CD607E06D3CCA50B3B18818FA2AEB3461D146F05D847FB4F70A4C9B3C817B8`)

**Alcance:** fase exclusivamente **estructural** sobre `public.movimientos_bancarios`: 5 columnas de origen/flujo/transferencia + 2 índices (`uq_mov_origen` parcial + acceso Banca `(cuenta_id, fecha)`). Sin datos, sin backfill, sin triggers, sin RLS, sin frontend, sin CHECK de dominios.

---

## 1. Revisión ejecutada

| Revisión | Resultado |
|---|---|
| 3.2E-R1 | Bloqueó en PC7 (anti-sobrescritura); no migró |
| 3.2E-R2 | Añadió PC7-R3.2 modo REUSE; bloqueó en PC2 (`42725`), 2.2 y T1-O |
| 3.2E-R3.1 / R3.1-CORREGIDO / R3.2 (corr_pc7) | Iteraciones con los mismos bloqueos de runtime |
| **3.2E-R3.3** (este informe) | **Ejecutada sin abortar**; P7 alcanzado; GATE POST-EJECUCIÓN 8/8 PASS |

## 2. Fixes de ejecución incluidos en R3.3

1. **PC2 — `ERROR: 42725: operator is not unique: text || "char"`** (L149): cast explícito `con.contype::text` para resolver la ambigüedad del operador `||`.
2. **MIGRACIÓN 2.2 — `predicado_ok=f` (falso bloqueo)** (L639 y L1198): `pg_get_expr` imprime paréntesis por átomo, lo que rompía la comparación textual del predicado de `uq_mov_origen`. Se normaliza con `regexp_replace(..., '[()]', '', 'g')` + re-colapsado de espacios en el bloque 2.2 y en el GATE.
3. **T1-O — `ERROR: 42601: too few parameters specified for RAISE`** (L802): el mensaje `(%=%, %=%)` declaraba 4 placeholders con 2 argumentos; corregido a `(origen_tipo=%, tipo_flujo=%)`.

Los 3 fixes también constan en `sql/migracion_fase_3_2e_r3_2_corr_pc7.sql` (mismo contenido, marcador de versión 3.2E-R3.2, quedó superseded por R3.3). El diff `corr_pc7 → r3_3` es 14+/12−, únicamente literales de versión (cabecera, marcador, GATE paso 0, NOTICE final, sección 8).

## 3. Evidencia de ejecución (tabla P7, salida del owner)

La tabla P7 se imprime **antes** de P8 y del GATE final; alcanzarla sin abortar demuestra que la suite T1 completó sin `RAISE` de bloqueo.

| Marcador | Valor |
|---|---|
| `version_migracion` | `3.2E-R3.3` |
| `created_at_segun_pc3` | `yes` |
| `checksum_pre` | `a8bee7ed30a759ddac921f4bde11b226` |
| `checksum_cols_congeladas` | `id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, factura_id, cotizacion_id, conciliado, notas, created_at, estado` (15 columnas históricas) |
| `indice_equivalente_pc8` | `idx_mov_cuenta_fecha` |
| `uq_creado_por_esta_ejecucion` | `no` (ya existía de la corrida parcial previa R3.2) |
| `idx_cuenta_fecha_creado_por_esta_ejecucion` | `no` (conservado, no duplicado) |
| `modo_snapshot` | `reused` (snapshot `_bkp_32e` validado y reutilizado, sin recrear) |

## 4. GATE POST-EJECUCIÓN — auditoría de cierre

| Verificación | Resultado |
|---|---|
| Versión | `3.2E-R3.3` (marcador `set_config` L117, exigido por GATE L1129 y NOTICE final L1333) |
| Datos | 33 movimientos históricos inmutables — `checksum_pre` fijado (`a8bee7…`), snapshot REUSE validado |
| Snapshot | `_bkp_32e.movimientos_bancarios` reutilizado (`mode=reused`), no sobrescrito |
| Estructura | 5 columnas nuevas presentes; 15 columnas congeladas estables (`created_at_segun_pc3=yes`) |
| Índices | `uq_mov_origen` y `idx_mov_cuenta_fecha` presentes; equivalentes conservados, sin duplicación (`…_creado_por_esta_ejecucion=no`) |
| Multiempresa | sin regresión en `empresa_id` (no se tocó RLS ni authz) |
| Saldos / triggers | sin triggers (`0` de aplicación; `trg_mov_saldo` ausente = FASE 3.8); sin recálculo de saldos |
| Suite T1 | completada sin abort (`T1-O/U/T/null`); sin persistencia de `ZZTEST3.2E` |
| Alcance | exclusivamente estructura; sin backfill, sin CHECK de dominios, sin RLS, sin frontend |

**Veredicto: FASE 3.2E-R3.3 VALIDADA Y CERRADA.**

## 5. Salvedades documentadas

1. **Literal del NOTICE GATE final** (`GATE 3.2E OK (version 3.2E-R3.3)`, L1333): el owner no capturó el texto del NOTICE (solo la pestaña Results del editor). El veredicto se funda en: ejecución sin abortar (P7 alcanzado), salidas de post-checks y la auditoría POST 8/8. Queda disponible una verificación read-only para congelarlo: `SELECT current_setting('tz32e.version', true);` (esperado `3.2E-R3.3`).
2. **Valores numéricos POST** (`count/checksum` post, saldos): no impresos; corroborados indirectamente por `modo_snapshot=reused` (checksum PRE = snapshot = baseline) y por el cierre de 3.2D (saldo de cuenta T1 intacto).
3. La corrida parcial previa (R3.2) ya había aplicado y commiteado la migración estructural 2.1/2.2/2.3; R3.3 fue **idempotente** (todo `no`/`reused`).

## 6. Cierre acumulado de subfases (GATEs 3.2C / 3.2D)

Registrado el 2026-09-21 con ejecución del owner en Supabase SQL Editor:

| Subfase | Evidencia | Resultado |
|---|---|---|
| **3.2C-R2** | Archivo completo ejecutado; post-check V7 `n_duplicados=0`; verificación read-only confirma constraint `uq_cuenta_empresa_codigo` existente (UNIQUE NULLS NOT DISTINCT sobre `(empresa_id, codigo)`) en PG `170006` (17.6) | **GATE 3.2C-R2 CERRADO OK** — constraint persistido, índice plano `uq_cuentas_contables_empresa_codigo` intacto, catálogo sin duplicados, prueba transaccional revertida (0 `ZZTEST1`) |
| **3.2D-R4-R1** | Archivo completo ejecutado; post-check P7: `cuenta_t1=0e5733e4-c348-4d95-a364-9a5a23786240`, `saldo_actual_hoy=17127.40`, `saldo_antes_t1=17127.40` | **GATE 3.2D-R4-R1 CERRADO OK** — estructura bancaria conservada (estado + `chk_movbancario_estado` + `fn_recalcular_saldo_cuenta()`), T1 con rollback de subtransacción, 0 `ZZTEST3.2D`, saldo de la cuenta T1 intacto |

Salvedad compartida: los literales de NOTICE `GATE … OK` no se copiaron (pestaña Messages no visible en el editor); el cierre se funda en las tablas de post-checks y en que ningún script abortó con error.

## 7. Confirmación de no-alcance

- **NO** se escribieron datos reales (checksum PRE=PRE, snapshot reutilizado, 0 filas de prueba persistidas).
- **NO** se crearon triggers (`trg_mov_saldo` sigue ausente; FASE 3.8), **NO** RLS (3.6), **NO** backfill de orígenes (GRUPO C), **NO** CHECK de dominios, **NO** frontend.
- **NO** se eliminó ni reemplazó el snapshot `_bkp_32e` ni su alterno `_20260919043225`.
- **NO** se ejecutó el rollback de §12; **no** se avanazó al generador de movimientos/flujo ni a 3.3 (requiere aprobación).

## 8. Estado y siguiente paso

- **FASE 3.2E (R3.3): VALIDADA Y CERRADA.** Subfases 3.2C y 3.2D: GATEs cerrados. Con ello, **FASE 3.2 completa** (3.2A–3.2E documentadas y cerradas).
- Siguiente contenido propuesto (no iniciar sin aprobación): **generador de movimientos / Flujo** (`tipo_flujo` NOT NULL + CHECK de dominio) → luego 3.3 (saldos históricos) → 3.4 (`usuario_empresas`) → 3.5 (empresa activa) → 3.6 (RLS) → 3.7 (reglas) → 3.8 (`trg_mov_saldo`) → 3.9 (GRUPO C) → 3.10 (pruebas) → FASE 4 (conciliación).

---

**ESTADO: FASE 3.2E IMPLEMENTADA, EJECUTADA Y CERRADA (8/8 PASS) — pendiente solo de aprobación del informe. No se avanza sin autorización del usuario.**