# FASE 3.2E-R3.2 — DISEÑO DE RESOLUCIÓN PC7

> Proyecto: ERP Tz'unun (Supabase `fmijbpatkddkbxlkfoza`) · Repositorio: `tzununautorentas/tzununsa`
> Base: `sql/migracion_fase_3_2e.sql` (3.2E-R3.1) · Fecha de diseño: 2026-09-18
> Script propuesto: `sql/migracion_fase_3_2e_r3_2.sql` (derivado de R3.1; **NO ejecutar**)

**ESTADO: LISTO PARA REVISIÓN — NO EJECUTAR HASTA AUTORIZACIÓN DEL OWNER.**

---

## 1. Causa exacta del bloqueo

PC7 (líneas 331-366 de R3.1) tiene una guarda incondicional:

```sql
IF to_regclass('_bkp_32e.movimientos_bancarios') IS NOT NULL THEN
  RAISE EXCEPTION 'PC7 BLOQUEO: _bkp_32e.movimientos_bancarios YA EXISTE; ...';
END IF;
```

Es la regla anti-sobrescritura del plan (§5 paso 1, §10, riesgo "Snapshot colisionado"). La última corrida se detuvo ahí, **antes de la Sección 2**; por tanto no escribió nada. El bloqueo es correcto como anti-colisión, pero es ciego: no distingue "baseline válido reutilizable" de "snapshot corrupto/caduco".

## 2. Qué protege PC7

1. **Anti-sobrescritura:** nunca recrear (`CREATE TABLE AS`) sobre un snapshot previo.
2. **Anti-borrado automático** en cascada.
3. **Trazabilidad del rollback:** persistir el estado pre-3.2E de `movimientos_bancarios`.
4. **Baseline del GATE 8bis:** objeto concreto contra el que se corrobora el checksum PRE.

Lo que PC7 no hace hoy: comprobar si el snapshot existente **puede demostrarse equivalente** al estado pre-migración. Ese es el espacio de R3.2.

## 3. Comparación de los dos snapshots

| Atributo | `_bkp_32e.movimientos_bancarios` (original) | `_bkp_32e.movimientos_bancarios_20260919043225` (alterno) |
|---|---|---|
| Tipo | tabla snapshot (CTAS previo) | tabla snapshot (CTAS manual) |
| Esquema | columnas históricas pre-3.2E | columnas históricas pre-3.2E |
| Filas (reportado) | 33 | 33 |
| `sum(monto)` (reportado) | Q64,708.15 | Q64,708.15 |
| Uso por el GATE 8bis | **Sí — única referencia (nombre fijo)** | No (redundancia independiente) |

La comparación real solo es posible con consultas READ-ONLY (ver §8). La validación definitiva la hace el propio PC7-R3.2 en el servidor. No se asumen resultados.

## 4. Qué necesita exactamente el GATE 8bis

El bloque 8bis del GATE (R3.1) hace 3 cosas, todas **contra el objeto fijo `_bkp_32e.movimientos_bancarios`**:

1. **Estabilidad del esquema:** lista congelada `tz32e.checksum_cols` (PC4) == columnas históricas actuales.
2. **Derivación del checksum del snapshot:** `replace(v_sql, 'FROM public.movimientos_bancarios', 'FROM _bkp_32e.movimientos_bancarios')` — misma fórmula congelada. Si el `replace` no cambia nada → BLOQUEO.
3. **Igualdad de baseline:** `checksum_snapshot == checksum_pre` (PRE congelado de la sesión).

**Garantía que R3.2 preserva:** referencia fija al snapshot, fórmula congelada (`checksum_sql` + `checksum_cols`) y exigencia snapshot == PRE. R3.2 **no toca** 8bis; hace que, previamente (PC7), el snapshot existente quede **demostrado** fiel, de modo que la corroboración de 8bis sea legítima.
**Qué NO necesita el GATE:** proveniencia conocida; solo requiere que con las columnas históricas su checksum = PRE y su contenido = baseline.

## 5. Riesgos de eliminar el snapshot original (opción drop, **descartada como primaria**)

| Riesgo | Detalle |
|---|---|
| Pérdida de evidencia del baseline | El objeto que 8bis y el rollback §8.3 usan como referencia desaparece; el alterno **no lo sustituye** (8bis apunta a un nombre fijo). |
| Recreación no atómica | `DROP` + fallo intermedio → sin snapshot; ventana sin respaldo. |
| Baseline contaminado | Si `public` cambió tras la creación original y se recrea desde el estado actual, el nuevo PRE incorpora el cambio y 8bis "confirmaría" un baseline alterado. |
| Violación del plan | La no-auto-destrucción del snapshot es deliberada (§10/§5); auto-drogear la contradice. |
| Operación no trazada | DROP fuera del script; sin log persistente del momento/estado. |

## 6. Diseño propuesto R3.2

1. **Versión nueva:** `3.2E-R3.2` (marcador `tz32e.version`, exigido por el GATE).
2. **PC7-R3.2 = 3 modos** sobre el objeto fijo:
   - **CREATE (no existe):** idéntico a R3.1 (crear → verificar → `tz32e.snapshot='created'`).
   - **REUSE (existe y valida):** verificación read-only en 4 capas contra la línea base de PC4:
     - **(a) Esquema:** lista ordenada de columnas del snapshot == `tz32e.checksum_cols` **y** definición completa (tipo/nullable/default) == columnas históricas reales de `public`.
     - **(b) Volumen:** `count` y `sum(monto)` del snapshot == `public` actual == `tz32e.count_pre`.
     - **(c) Contenido:** `EXCEPT ALL` en ambas direcciones, proyección explícita de las columnas históricas (robusto a que `public` ya tenga las 5 columnas NULL — estado B de PC5), 0 diferencias.
     - **(d) Checksum derivado:** `replace(v_sql, 'FROM public…', 'FROM _bkp_32e…')` (misma derivación exacta que 8bis) ejecutado sobre el snapshot == `tz32e.checksum_pre`.
     - Todas pasan → `PC7 OK — snapshot existente REUTILIZADO` + `tz32e.snapshot='reused'`. Alguna falla → **BLOQUEO de incompatibilidad** sin tocar nada. Faltan marcadores PC4 → **BLOQUEO por evidencia insuficiente** (decisión del owner).
   - **BLOQUEO-POR-EVIDENCIA:** si no se pueden leer catálogo/marcadores → **nunca asumir válido**, detener y pedir decisión del owner.
3. **Idempotencia segura de ejecución completa:** un segundo run entra en REUSE (no escribe). Cubre: (i) public sin las 5 columnas (primera corrida), o (ii) public ya migrado por una corrida anterior completa (2.1/2.2/2.3 reúsan por definición, PC5 estado B, checksum PRE=POST).
4. **El snapshot alterno no se toca y no participa en el GATE** (solo se informa).
5. **GATE 8bis, rollback §8, checksum §9, T1, P1-P8: textuales respecto a R3.1** (solo cambia el valor de versión y PC7).

## 7. Cambios exactos respecto a R3.1

Implementado en `sql/migracion_fase_3_2e_r3_2.sql`:

| # | Localización en R3.1 | Cambio aplicado |
|---|---|---|
| C1 | Cabecera (líneas 2, 6) + bloque P1-P4 (líneas 8-32) | Versión → `3.2E-R3.2`; añadido **P5** (reutilización validada de PC7). |
| C2 | Marcador de versión (línea 89) + comentario (línea 87) | `tz32e.version = '3.2E-R3.2'`. |
| C3 | **PC7 completo (líneas 331-366)** | Sustituido por DO de 3 modos (CREATE/REUSE/BLOQUEO por evidencia) + marcador `tz32e.snapshot`. |
| C4 | GATE paso 0 (línea 969) | Exige versión `'3.2E-R3.2'`. |
| C5 | NOTICE final del GATE | `GATE 3.2E OK (version 3.2E-R3.2)`. |
| C6 | Sección 8 rollback (8.0 y notas) | R3.2 + marcador `tz32e.snapshot`; snapshot reutilizado no requiere acción. |
| C7 | P7 (post-check de sesión) | Añadido `modo_snapshot` (tz32e.snapshot) a la salida. |

Verificación estructural del archivo generado: 17/17 `DO $do$`, 4 tokens `$ddl$` (2 bloques EXECUTE), 0 restos `3.2E-R3.1`, 1 marcador de versión, 1 comprobación de versión en GATE, 8 referencias a `tz32e.snapshot`.

## 8. SQL READ-ONLY para validar previamente (owner, SQL Editor)

```sql
-- Q1 — Existencia, conteos y sumas (public + ambos snapshots)
SELECT to_regclass('_bkp_32e.movimientos_bancarios')                     AS snap_original,
       to_regclass('_bkp_32e.movimientos_bancarios_20260919043225')      AS snap_alterno,
       (SELECT count(*)   FROM public.movimientos_bancarios)             AS mov_public_cnt,
       (SELECT sum(monto) FROM public.movimientos_bancarios)             AS mov_public_sum,
       (SELECT count(*)   FROM _bkp_32e.movimientos_bancarios)           AS snap_cnt,
       (SELECT sum(monto) FROM _bkp_32e.movimientos_bancarios)           AS snap_sum,
       (SELECT count(*)   FROM _bkp_32e.movimientos_bancarios_20260919043225) AS alt_cnt,
       (SELECT sum(monto) FROM _bkp_32e.movimientos_bancarios_20260919043225) AS alt_sum;

-- Q2 — Esquema de los 3 objetos (orden de columnas, tipo, nullability, default)
SELECT 'public' AS obj, string_agg(column_name||':'||data_type||':'||is_nullable||':'||coalesce(column_default,'∅'), '|' ORDER BY ordinal_position) AS def
  FROM information_schema.columns WHERE table_schema='public' AND table_name='movimientos_bancarios'
UNION ALL
SELECT '_bkp_32e.movimientos_bancarios',
       string_agg(column_name||':'||data_type||':'||is_nullable||':'||coalesce(column_default,'∅'), '|' ORDER BY ordinal_position)
  FROM information_schema.columns WHERE table_schema='_bkp_32e' AND table_name='movimientos_bancarios'
UNION ALL
SELECT '_bkp_32e.movimientos_bancarios_20260919043225',
       string_agg(column_name||':'||data_type||':'||is_nullable||':'||coalesce(column_default,'∅'), '|' ORDER BY ordinal_position)
  FROM information_schema.columns WHERE table_schema='_bkp_32e' AND table_name='movimientos_bancarios_20260919043225';

-- Q3 — Igualdad campo a campo snapshot vs public (0 esperado en cada dirección)
--       Lista explícita = columnas históricas (ajustar created_at a la salida real de PC3).
SELECT (SELECT count(*) FROM (
          SELECT id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia,
                 categoria, factura_id, cotizacion_id, conciliado, notas, estado
          FROM _bkp_32e.movimientos_bancarios
          EXCEPT ALL
          SELECT id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia,
                 categoria, factura_id, cotizacion_id, conciliado, notas, estado
          FROM public.movimientos_bancarios) d) AS snap_minus_public,
       (SELECT count(*) FROM (
          SELECT id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia,
                 categoria, factura_id, cotizacion_id, conciliado, notas, estado
          FROM public.movimientos_bancarios
          EXCEPT ALL
          SELECT id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia,
                 categoria, factura_id, cotizacion_id, conciliado, notas, estado
          FROM _bkp_32e.movimientos_bancarios) d) AS public_minus_snap;

-- Q4 — Checksum canónico (fórmula plan §9) de public y del snapshot original
--      (incluir created_at SOLO si PC3 lo confirma; R3.2 congelará la lista real en PC4)
SELECT md5(string_agg(
  coalesce(id::text,'<NULL>')||'|'||coalesce(empresa_id::text,'<NULL>')||'|'||
  coalesce(cuenta_id::text,'<NULL>')||'|'||coalesce(fecha::text,'<NULL>')||'|'||
  coalesce(tipo::text,'<NULL>')||'|'||coalesce(descripcion::text,'<NULL>')||'|'||
  coalesce(monto::text,'<NULL>')||'|'||coalesce(referencia::text,'<NULL>')||'|'||
  coalesce(categoria::text,'<NULL>')||'|'||coalesce(factura_id::text,'<NULL>')||'|'||
  coalesce(cotizacion_id::text,'<NULL>')||'|'||coalesce(conciliado::text,'<NULL>')||'|'||
  coalesce(notas::text,'<NULL>')||'|'||coalesce(estado::text,'<NULL>'), ',' ORDER BY id::text))
FROM public.movimientos_bancarios
UNION ALL
SELECT md5(string_agg(
  coalesce(id::text,'<NULL>')||'|'||coalesce(empresa_id::text,'<NULL>')||'|'||
  coalesce(cuenta_id::text,'<NULL>')||'|'||coalesce(fecha::text,'<NULL>')||'|'||
  coalesce(tipo::text,'<NULL>')||'|'||coalesce(descripcion::text,'<NULL>')||'|'||
  coalesce(monto::text,'<NULL>')||'|'||coalesce(referencia::text,'<NULL>')||'|'||
  coalesce(categoria::text,'<NULL>')||'|'||coalesce(factura_id::text,'<NULL>')||'|'||
  coalesce(cotizacion_id::text,'<NULL>')||'|'||coalesce(conciliado::text,'<NULL>')||'|'||
  coalesce(notas::text,'<NULL>')||'|'||coalesce(estado::text,'<NULL>'), ',' ORDER BY id::text))
FROM _bkp_32e.movimientos_bancarios;
```

**Criterio de reutilización:** `snap_cnt=33 ∧ snap_sum=Q64708.15 ∧ Q2(public)==Q2(snapshot) ∧ Q3=0/0 ∧ Q4(public)==Q4(snapshot)` → snapshot reutilizable.

## 9. SQL / migración R3.2 propuesta

El bloque completo de PC7-R3.2 está implementado en `sql/migracion_fase_3_2e_r3_2.sql` (líneas ~347-470). Lógica resumida:

```
SI _bkp_32e.movimientos_bancarios NO existe  ->  MODO CREATE (crear + verificar; tz32e.snapshot='created')
SI YA existe                                   ->  MODO REUSE:
     (a) esquema/definicion == columnas historicas (checksum_cols + tipos/nullable/default)
     (b) count & sum(snapshot) == public == count_pre
     (c) EXCEPT ALL (ambas direcciones, proyeccion historica) == 0
     (d) checksum derivado (replace formula congelada -> _bkp_32e) == checksum_pre
     -> todas OK:  REUTILIZADO (tz32e.snapshot='reused')
     -> alguna falla:  BLOQUEO INCOMPATIBLE (no toca nada)
     -> sin marcadores PC4:  BLOQUEO EVIDENCIA INSUFICIENTE (decision del owner)
Informa (lectura) si el snapshot alterno _20260919043225 existe.
```

**SOLO PROPUESTA — NO EJECUTAR.**

## 10. Secuencia prevista de ejecución

1. **Validaciones previas (owner, READ-ONLY):** pegar salidas de Q1-Q4 → confirmar snapshot reutilizable.
2. **Pre-checks PC0-PC6, PC6bis:** iguales a R3.1.
3. **PC7-R3.2:** modo REUSE (validado) o CREATE — snapshot listo y verificado; `tz32e.snapshot`.
4. **Migración estructural 2.1/2.2/2.3** (idempotente) + **COMMIT top-level**.
5. **Suite T1** (O/U/T/null + T1-NEG) → `tz32e.t1_result='pass'`.
6. **Post-checks P1-P8** (incluye estabilidad de `checksum_cols`).
7. **GATE final → `GATE 3.2E OK (version 3.2E-R3.2)`** (8bis corrobora de nuevo contra el snapshot; refuerzo, no coincidencia).
8. Cierre: `FASE3.2E_INFORME.md` con evidencias; **no avanzar** a generador/flujo ni 3.3 sin aprobación.

## 11. Condiciones de ABORT

| # | Condición | Mensaje |
|---|---|---|
| A1 | PG < 15 (PC0) | PC0 BLOQUEO |
| A2 | Falta alguna tabla (PC1) | PC1 BLOQUEO |
| A3 | Columna 3.2E existe mal definida (PC3) | PC3 BLOQUEO |
| A4 | <2 cuentas o restos ZZTEST3.2D (PC4) | PC4 BLOQUEO |
| A5 | 1-4 columnas o datos en columnas nuevas (PC5) | PC5 BLOQUEO |
| A6 | Triggers de aplicación o trg_mov_saldo (PC6) | PC6 BLOQUEO |
| A7 | **PC7-REUSE sin marcadores PC4** | `EVIDENCIA INSUFICIENTE — decision del owner` |
| A8 | **PC7-REUSE esquema/definición ≠ congelados** | `snapshot INCOMPATIBLE` |
| A9 | **PC7-REUSE count/sum ≠ public/PRE** | `snapshot INCOMPATIBLE` |
| A10 | **PC7-REUSE EXCEPT ALL ≠ 0** | `snapshot INCOMPATIBLE` |
| A11 | **PC7-REUSE checksum derivado ≠ PRE** | `snapshot INCOMPATIBLE` |
| A12 | PC7-CREATE verificación falla tras crear | bloqueo (snapshot queda marcado inconsistente) |
| A13 | 2.2: uq_mov_origen mal definido | bloqueo MIGRACIÓN 2.2 |
| A14 | 2.3: idx_mov_cuenta_fecha wrong-name | bloqueo MIGRACIÓN 2.3 |
| A15 | T1: FAIL o ZZTEST3.2E>0 | suite nunca marca `pass` |
| A16 | P8: esquema cambió vs checksum_cols | bloqueo P8 |
| A17 | GATE: versión/t1/columnas/uq/índice/triggers/estado/ZZ/count/checksum/8bis/saldos | `GATE 3.2E BLOQUEO` |

Todo abort de A1-A16 detiene antes del COMMIT top-level (excepto A12: el snapshot creado queda evidencia).

## 12. Rollback

- **Objetos de 3.2E:** igual a R3.1 §8.1-8.2 — `uq_mov_origen` solo si `tz32e.idx_uq_created='yes'`; `idx_mov_cuenta_fecha` solo si `tz32e.idx_created='yes'`; DROP de las 5 columnas mientras estén sin uso real.
- **Snapshot:** el script **jamás** lo elimina. CREATE → baseline verificado; REUSE → intacto (nada lo escribió). Rollback posterior requeriría autorización explícita (§8.3), conservando siempre al menos un respaldo.
- **Con R3.2 el rollback queda reforzado:** si una corrida se interrumpiera, el snapshot reutilizado sigue siendo la referencia inalterable de 8bis y la garantía de que los históricos no se modificaron (checksum PRE=POST).
- **Nunca eliminar en rollback de 3.2E:** índices preexistentes (incluidos conservados por PC8), objetos de 3.2A/3.2C/3.2D, `fn_recalcular_saldo_cuenta()`, datos reales.

## 13. Compatibilidad con el plan original

- **Objetivo preservado al 100%:** estructura exclusivamente estructural (5 columnas + 2 índices); sin datos, triggers, backfill, dominios, RLS/frontend.
- **Decisiones D1-D3, checksum §9, GATE §8, rollback §11, T1 §7:** verbatim.
- **Única evolución:** PC7 (plan §5 paso 1 / §10 / riesgo "colisionado") pasa de "bloquear siempre si existe" a "validar y reutilizar; bloquear si no". Es una **extensión de la misma regla anti-sobrescritura** (nada se sobrescribe/borra/renombra y se exigen las mismas garantías de 8bis). La no-repetibilidad de §10 se convierte en re-ejecución segura.
- **Compatibilidad 3.2A-3.2D:** confirmada (dependencia solo de `estado` 3.2D).

## 14. Autorización requerida

- Aprobar **revisión R3.2** como versión vigente de FASE 3.2E.
- Aprobar el **modo REUSE**: reutilizar `_bkp_32e.movimientos_bancarios` si supera las 4 validaciones read-only (sin DROP; el alterno queda como redundancia).
- Aprobar la **revisión** de `sql/migracion_fase_3_2e_r3_2.sql` para su posterior ejecución.
- **No** se requiere autorización de DROP salvo que un PC7-R3.2 detecte incompatibilidad y el owner decida recrear el snapshot manualmente.
- No ejecutar nada en Supabase; no commit.

---

## Entregables

- `FASE3.2E_R3_2_DISENO.md` (este documento) — diseño, sin ejecutar.
- `sql/migracion_fase_3_2e_r3_2.sql` — script propuesto derivado de R3.1 (~1.363 líneas), **NO ejecutado**.

**R3.2 LISTA PARA REVISIÓN — NO EJECUTAR HASTA AUTORIZACIÓN DEL OWNER.**