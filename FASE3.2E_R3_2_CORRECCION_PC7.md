# FASE 3.2E-R3.2 — CORRECCIÓN QUIRÚRGICA DE PC7-REUSE

> Proyecto: ERP Tz'unun (Supabase `fmjibpatkddkbxlkfoza`) · Repositorio: `tzununautorentas/tzununsa`
> Base: `sql/migracion_fase_3_2e_r3_2.sql` (3.2E-R3.2) · Fecha: 2026-09-18
> Revisión corregida: `sql/migracion_fase_3_2e_r3_2_corr_pc7.sql` — **NO ejecutar**

---

## 1. Diagnóstico

### 1.1. Problema encontrado

El modo **REUSE** de PC7-R3.2 (capa `(a)`) compara contra la tabla viva:

```sql
column_name || ':' || data_type || ':' || is_nullable || ':' || COALESCE(column_default,'\007')
```

entre `_bkp_32e.movimientos_bancarios` y las columnas históricas de `public.movimientos_bancarios`. Con la evidencia real confirmada, **esa comparación siempre fallará** aunque el snapshot sea un baseline perfecto y sus datos idénticos, porque:

- El snapshot (CTAS) trae **todo `is_nullable = YES`** y **todo `column_default = NULL`**.
- `public` conserva sus propiedades originales: `id NOT NULL + gen_random_uuid()`, `fecha NOT NULL`, `tipo NOT NULL`, `monto default 0`, `conciliado default false`, `created_at default now()`, `estado NOT NULL + default 'activo'`.

Por tanto el snapshot **nunca** superaría PC7-REUSE en su forma actual → falso `PC7 BLOQUEO — INCOMPATIBLE`, y la fase quedaría bloqueada indebidamente.

### 1.2. Evidencia real proporcionada por el OWNER (READ-ONLY)

| Objeto | Estado confirmado |
|---|---|
| `_bkp_32e.movimientos_bancarios` | 15 columnas históricas: `id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, factura_id, cotizacion_id, conciliado, notas, created_at, estado` |
| snapshot (CTAS) | `is_nullable = YES` y `column_default = NULL` en todas las columnas (naturaleza CTAS) |
| `public.movimientos_bancarios` | conserva propiedades originales (NOT NULL, defaults `gen_random_uuid()/0/false/now()/'activo'`) |
| `public.movimientos_bancarios` | **ya contiene las 5 columnas nuevas de 3.2E** (`origen_tipo`, `origen_id`, `tipo_flujo`, `cuenta_contraparte_id`, `movimiento_contraparte_id`) |

### 1.3. Por qué la comparación actual es incompatible con un snapshot CTAS

- El CTAS (`CREATE TABLE AS SELECT *`) crea una tabla cuyo catálogo **no hereda** `NOT NULL` ni `default` de la tabla fuente: copia tipos y valores, pierde la semántica de constraint por construcción de PostgreSQL.
- El propósito del snapshot según el plan (§5 PC7, §9 checksum, GATE 8bis) es **baseline de DATOS** del estado pre-migración: una foto inmutable para trazar igualdad de contenido, no una "copia restaurable" del esquema.
- Exigir identidad de `is_nullable`/`column_default` con la tabla viva exige algo que **ningún snapshot CTAS de `public` puede cumplir** → es una condición estructural inválida para este propósito.

## 2. Corrección propuesta

**Decisión (opción B): no eliminar la capa estructural, sino reemplazar la comparación `nullable/default` por una comparación de identidad estructural apropiada para un snapshot de datos.**

La capa `(a)` queda redefinida así:

1. **Columnas (identidad):** la lista ORDENADA de columnas del snapshot debe ser **idéntica** a `tz32e.checksum_cols` (congelada en PC4). Esto rechaza snapshots con columnas de más, de menos o reordenadas.
2. **Tipos (compatibilidad):** los **tipos reales** del snapshot (**`format_type`**: tipo + typmod, vía `pg_attribute`) deben coincidir **posición a posición** con los de las columnas históricas de `public` restringidas a la lista congelada (mismas columnas en el mismo orden, garantizado por 1).
3. **NO se comparan `is_nullable` ni `column_default`** snapshot ↔ `public` (justificación: el snapshot es CTAS y no pretende ser réplica estructural; la integridad del baseline se demuestra con tipos + volumen + contenido + checksum).
4. **CREATE con proyección congelada:** si el snapshot NO existe, se crea proyectando **exclusivamente** `tz32e.checksum_cols` (vía `v_proj`), **nunca `SELECT *`**: un snapshot nuevo no debe incorporar las 5 columnas de 3.2E si ya están presentes NULL.

**Punto clave:** la identidad + tipos NO son el único criterio de validez. La validez total exige las 4 capas completas: `(a)` esquema histórico (columnas+tipos), `(b)` count/sum, `(c)` EXCEPT ALL 0/0, `(d)` checksum = PRE. (Ver §9 del encargo.)

## 3. SQL exacto que cambiaría

### Antes (R3.2 original, bloque `(a)` de PC7-REUSE)

```sql
    -- (a) Esquema: lista ordenada == checksum_cols; definicion completa (tipo,
    --     nullable, default) == columnas historicas reales de public
    SELECT string_agg(column_name, ',' ORDER BY ordinal_position) INTO v_snap_cols
      FROM information_schema.columns
     WHERE table_schema='_bkp_32e' AND table_name='movimientos_bancarios';
    IF v_snap_cols IS DISTINCT FROM v_cols_frozen THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: esquema del snapshot (%) <> columnas historicas congeladas en PC4 (%)', v_snap_cols, v_cols_frozen;
    END IF;

    SELECT string_agg(column_name||':'||data_type||':'||is_nullable||':'||COALESCE(column_default,'\007'), '|' ORDER BY ordinal_position)
      INTO v_snap_def
      FROM information_schema.columns
     WHERE table_schema='_bkp_32e' AND table_name='movimientos_bancarios';
    SELECT string_agg(column_name||':'||data_type||':'||is_nullable||':'||COALESCE(column_default,'\007'), '|' ORDER BY ordinal_position)
      INTO v_pub_def
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name='movimientos_bancarios'
       AND column_name NOT IN ('origen_tipo','origen_id','tipo_flujo','cuenta_contraparte_id','movimiento_contraparte_id');
    IF v_snap_def IS DISTINCT FROM v_pub_def THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: definicion (tipos/nullable/default) difiere entre snapshot y columnas historicas de public';
    END IF;
```

### Después (corr_pc7)

```sql
    -- (a) Esquema HISTORICO == linea base congelada: la lista ORDENADA de
    --     columnas del snapshot debe ser identica a tz32e.checksum_cols (PC4) y
    --     los TIPOS deben coincidir con los de las columnas historicas de
    --     public. NO se comparan is_nullable ni column_default: el snapshot es
    --     CTAS (is_nullable=YES / default=NULL por naturaleza) y no pretende ser
    --     copia estructural restaurable; la integridad del baseline se demuestra
    --     con tipos + volumen + EXCEPT ALL + checksum (capas b/c/d).
    SELECT string_agg(column_name, ',' ORDER BY ordinal_position) INTO v_snap_cols
      FROM information_schema.columns
     WHERE table_schema='_bkp_32e' AND table_name='movimientos_bancarios';
    IF v_snap_cols IS DISTINCT FROM v_cols_frozen THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: esquema del snapshot (%) <> columnas historicas congeladas en PC4 (%)', v_snap_cols, v_cols_frozen;
    END IF;

    -- Tipos reales del snapshot (todas sus columnas, en orden fisico attnum)...
    SELECT string_agg(format_type(a.atttypid, a.atttypmod), ',' ORDER BY a.attnum)
      INTO v_types_snap
      FROM pg_attribute a
      JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
     WHERE n.nspname='_bkp_32e' AND t.relname='movimientos_bancarios'
       AND a.attnum > 0 AND NOT a.attisdropped;
    -- ... vs. los de las columnas historicas de public restringidas a la lista congelada.
    SELECT string_agg(format_type(a.atttypid, a.atttypmod), ',' ORDER BY a.attnum)
      INTO v_types_public
      FROM pg_attribute a
      JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
     WHERE n.nspname='public' AND t.relname='movimientos_bancarios'
       AND a.attnum > 0 AND NOT a.attisdropped
       AND a.attname = ANY(string_to_array(v_cols_frozen, ','));
    IF v_types_snap IS DISTINCT FROM v_types_public THEN
      RAISE EXCEPTION 'PC7 BLOQUEO — snapshot existente INCOMPATIBLE: tipos reales (format_type) difieren (snapshot=%, historico public=%)', v_types_snap, v_types_public;
    END IF;
```

Además, en `DECLARE`:
- `v_snap_def text` / `v_pub_def text` → `v_types_snap text` / `v_types_public text`.
- `v_proj` se construye UNA vez al inicio del bloque (proyección de `public` restringida a `checksum_cols`, con guarda de todas-las-congeladas-existentes) y se comparte entre REUSE (EXCEPT ALL) y CREATE.

Y en el **modo CREATE** (antes `CREATE TABLE … AS SELECT *`):
```sql
    EXECUTE format('CREATE TABLE _bkp_32e.movimientos_bancarios AS SELECT %s FROM public.movimientos_bancarios', v_proj);
```

El resto de PC7 y de todo el script **no cambia**. El marcador `tz32e.version` sigue siendo `'3.2E-R3.2'` (luego el GATE paso 0 no cambia).

## 4. Diff conceptual R3.2 → corr_pc7

| Bloque | R3.2 original | corr_pc7 |
|---|---|---|
| Cabecera (comentarios) | `MIGRACION FASE 3.2E-R3.2` | `MIGRACION FASE 3.2E-R3.2-corr_pc7` (nota: marcador de versión NO cambia) |
| P5 header (comentario) | "(a) esquema/definicion == columnas historicas" | "(a) esquema HISTORICO: columnas congeladas + TIPOS; sin nullable/default del CTAS" |
| Arnés (comentario) | "contra la linea base congelada" | "columnas congeladas + tipos reales (format_type); sin nullable/default del CTAS; CREATE con proyección congelada" |
| PC7 header (comentario) | "(esquema/definicion, …)" | "(a) esquema historico … + TIPOS REALES (format_type); sin exigir igualdad de is_nullable/column_default; CREATE nunca SELECT *" |
| `DECLARE` | `v_snap_def`, `v_pub_def` | `v_types_snap`, `v_types_public` (más `v_proj` compartido entre REUSE y CREATE) |
| Capa (a) comparación 1 | lista ordenada snapshot == `checksum_cols` | **igual (se conserva)** |
| Capa (a) comparación 2 | `name:type:nullable:default` snapshot vs `public` (→ falso bloqueo) | `format_type` (tipos reales + typmod) snapshot vs proyección histórica `public` (solo tipos) |
| Modo CREATE | `CREATE TABLE … AS SELECT *` | `CREATE TABLE … AS SELECT v_proj` (solo `checksum_cols`; nunca `SELECT *`) |
| Mensajes BLOQUEO | "definicion (tipos/nullable/default) difiere…" | "tipos reales (format_type) difieren (snapshot=…, historico public=…)" |
| Capas (b) count/sum, (c) EXCEPT ALL, (d) checksum | intactas | **iguales** |
| GATE 8bis / GATE paso 0 / T1 / P1-P8 / 2.1-2.3 / COMMIT / rollback | intactos | **iguales** |

**Resumen del diff (`git diff --no-index` R3.2 ↔ corr_pc7):** +108 / −57 líneas, concentradas en comentarios, `DECLARE`, capa (a) (tips con `format_type`), compartición de `v_proj` y modo CREATE (proyección congelada). Cero cambios de lógica fuera de PC7-REUSE/CREATE.

## 5. Riesgos de la corrección

| Riesgo | Nivel | Análisis / Mitigación |
|---|---|---|
| ¿Un snapshot con el mismo orden/columnas/tipos pero datos reescritos pasaría con más facilidad? | Muy bajo | No: las capas (b)/(c)/(d) siguen exigiendo `count`, `sum`, `EXCEPT ALL = 0/0` y `checksum(PRE)` contra la tabla viva. Lo que se afloja es solo la semántica estructural de constraint, no la igualdad de datos. |
| ¿Aceptar un snapshot de una tabla distinta que por casualidad tenga las mismas 15 columnas/tipos? | Muy bajo | (c) EXCEPT ALL y (d) checksum (que incluye `orden id::text` y todos los valores) fallarían si el contenido no fuera idéntico al baseline. |
| ¿Un snapshot creado de un `public` con las 5 columnas de 3.2E ya presentes? | Nulo | La lista de columnas del snapshot debería ser EXACTAMENTE `checksum_cols` = 15 históricas (sin las 5 nuevas): un snapshot de 20 columnas → BLOQUEO por lista ≠ congelada. La capa (D) del encargo sigue garantizada. |
| Pérdida de garantía de `NOT NULL`/default para futuras restauraciones | Bajo | Fuera de alcance: el snapshot no se usa para restaurar estructura (el rollback usa los DROP de 8.1/8.2 y el plan §11), solo para baseline de datos y trazabilidad (8bis). |
| Regresión de la capa estructural | Nulo | Se mantiene identidad de columnas (orden) + tipos; se elimina únicamente el falso positivo de nullable/default inherente al CTAS. |

## 6. Garantías preservadas

- **CREATE:** modo CREATE con la **proyección histórica congelada** (`v_proj` = `checksum_cols`), nunca `SELECT *` (crear → verificar cuenta/suma → EXCEPT ALL → `tz32e.snapshot='created'`). ✓
- **REUSE:** se mantiene con validación en 4 capas (una redefinida, tres intactas). ✓
- **BLOQUEO por evidencia insuficiente:** sin `checksum_cols`/`checksum_pre`/`checksum_sql` → BLOQUEO y decisión del owner. ✓
- **BLOQUEO por incompatibilidad:** lista de columnas ≠ congelada, tipos ≠, count/sum ≠, EXCEPT ALL ≠ 0, checksum ≠ PRE → BLOQUEO en su capa correspondiente. ✓
- **`tz32e.snapshot='reused'`:** solo tras pasar las 4 capas. ✓
- **GATE 8bis:** intacto vérbatim (checksum snapshot == PRE, lista congelada vs esquema). ✓
- **Checksum:** fórmula congelada en PC4, `replace` de `FROM public… → FROM _bkp_32e…`, sentinela `'<NULL>'`, separadores `|`/`,`, `ORDER BY id::text`, md5 — **sin cambios**. ✓
- **EXCEPT ALL en ambas direcciones:** intacto, proyección dinámica de columnas históricas, resultado obligatorio 0/0. ✓
- **Rollback (§8):** intacto; snapshot nunca se elimina automáticamente. ✓
- **Snapshot alterno:** `_bkp_32e.movimientos_bancarios_20260919043225` no se toca ni participa en el GATE. ✓
- **2.1/2.2/2.3, COMMIT, T1 (O/U/T/null), T1-NEG, P1-P8, PC0-PC6, PC6bis:** sin cambios. ✓
- **GATE final:** solo se mantiene el valor de versión (`3.2E-R3.2`); 8bis y el resto del GATE sin cambios. ✓

## 7. Garantías que cambian (y por qué no se debilita el baseline)

| Criterio | Antes (R3.2) | Después (corr_pc7) |
|---|---|---|
| `is_nullable` snapshot vs `public` | se exigía igualdad | **ya no se exige** (CTAS no puede cumplirlo) |
| `column_default` snapshot vs `public` | se exigía igualdad | **ya no se exige** (CTAS no puede cumplirlo) |
| Lista ordenada de columnas == `checksum_cols` | se exigía | **se exige (idéntico)** |
| Tipos posición a posición (`format_type`, tipo + typmod) | se exigían implícitamente dentro de `def` | **se exigen explícitamente** |
| count / sum / EXCEPT ALL 0/0 / checksum = PRE | se exigían | **se exigen (idéntico)** |

**Por qué no se debilita el baseline:** la integridad del baseline de datos nunca dependió de `nullable`/`default` (el checksum §9 ni siquiera los usa: proyecta valores con `::text` y sentinela `<NULL>`). La protección real contra "snapshot corrupto o de otro estado" reside en las 4 capas: un snapshot distinto al estado pre-migración falla en (b) o (c) o (d) sin importar sus constraints. Lo que se elimina es un **falso bloqueo** derivado de una propiedad de catálogo que PostgreSQL no preserva en CTAS. La combinación completa de las cuatro capas permanece (criterio §9 del encargo), y **ninguna capa por sí sola** es criterio de validez.

## 8. Criterio de aceptación (owner)

El snapshot existente deberá considerarse **reutilizable** si y solo si:

1. Columnas históricas coinciden exactamente con `tz32e.checksum_cols` (mismo orden). ✔
2. Tipos reales idénticos posición a posición (`format_type`). ✔
3. `count(snapshot) = count(public) = count_pre`. ✔
4. `sum(snapshot.monto) = sum(public.monto)`. ✔
5. `EXCEPT ALL snapshot → public = 0`. ✔
6. `EXCEPT ALL public → snapshot = 0`. ✔
7. `checksum_snapshot = checksum_pre`. ✔

**Bloqueo** si cualquiera de las siete falla (en su capa, con su mensaje específico; el proceso se detiene sin modificar nada). El marcador `tz32e.snapshot='reused'` solo se emite cuando las siete pasan.

## 9. Archivos generados

| Archivo | Contenido |
|---|---|
| `FASE3.2E_R3_2_CORRECCION_PC7.md` | Este documento (diagnóstico + corrección + diff + riesgos + garantías). |
| `sql/migracion_fase_3_2e_r3_2_corr_pc7.sql` | R3.2 corregido (derivado de `sql/migracion_fase_3_2e_r3_2.sql`, **el original NO se modificó**). |

**Verificación estática de `sql/migracion_fase_3_2e_r3_2_corr_pc7.sql`:**
- 1414 líneas; 17/17 `DO $do$`/`END $do$`; 4 tokens `$ddl$`; 1 `COMMIT` top-level.
- 0 referencias a `v_snap_def`/`v_pub_def`/`v_snap_types`/`v_pub_types`; 7 referencias a `format_type`; `v_types_snap`/`v_types_public` activas.
- `v_proj` se construye una sola vez al inicio de PC7 (guarda de todas-las-congeladas-existentes en `public`) y se comparte entre REUSE (EXCEPT ALL) y CREATE. **0 apariciones de `SELECT *`**; el CREATE usa `SELECT %s FROM public…` con `v_proj`.
- En PC7-REUSE, `is_nullable`/`column_default` no aparecen en código activo (solo comentarios); las demás apariciones son validaciones legítimas de `public` (PC3, PC6bis, P1, GATE).
- 1 marcador `tz32e.version='3.2E-R3.2'`; 1 comprobación `DISTINCT FROM '3.2E-R3.2'` en GATE; 8 referencias `tz32e.snapshot`; mensajes `REUTILIZADO` presentes; 9 apariciones de `EXCEPT ALL` (4 en código de PC7 REUSE+CREATE, resto en comentarios).
- `git diff --no-index` R3.2 ↔ corr_pc7: +108/−57 líneas, todo en comentarios, `DECLARE`, capa (a) y modo CREATE.

## 10. Confirmación

- **NO se ejecutó nada** (ni SQL, ni Supabase).
- **NO se modificó `public` ni ningún snapshot**.
- **NO se modificó `sql/migracion_fase_3_2e_r3_2.sql`** (original intacto; la corrección vive en `sql/migracion_fase_3_2e_r3_2_corr_pc7.sql`).
- **NO se hizo commit ni push.**
- El documento de diseño `FASE3.2E_R3_2_DISENO.md` y el informe de auditoría siguen vigentes; este documento es la corrección puntual solicitada.

---

**CORRECCIÓN PC7 DISEÑADA — NO EJECUTAR HASTA REVISIÓN Y AUTORIZACIÓN DEL OWNER.**