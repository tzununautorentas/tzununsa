# FASE 3.2E — PLAN DETALLADO DE IMPLEMENTACIÓN

> Caja/Banca · Arquitectura de **origen y flujo** de `public.movimientos_bancarios` (continuación directa de FASE 3.2D)

---

## 1. OBJETIVO

Preparar la **estructura** que permita a `public.movimientos_bancarios` expresar:

1. **Origen** del movimiento (qué documento/operación lo generó): `origen_tipo` + `origen_id`, con el mismo modelo semántico que 3.2A dejó en `asientos_contables`.
2. **Clasificación de flujo** (`tipo_flujo`): base para el futuro Flujo de Efectivo (operativa / inversión / financiamiento / transferencia interna).
3. **Transferencias internas entre cuentas propias** (dos piernas ligadas): `cuenta_contraparte_id` + `movimiento_contraparte_id`.

**No modifica datos existentes, no backfillea orígenes históricos (GRUPO C), no crea triggers, no toca saldos, no crea RLS, no toca frontend ni `pagos`, no implementa el reporte de Flujo de Efectivo.**

La fase solo agrega columnas + índices de estructura. Todo valor registrado en las columnas nuevas será nulo hasta que la fase que implemente el generador de movimientos (código, posterior) los poble correctamente.

## 2. DIAGNÓSTICO (inspección read-only de código y esquema)

### 2.1. Esquema real actual de `movimientos_bancarios` (post 3.2D)

| Ítem | Estado verificado |
|---|---|
| Filas | **33** movimientos (CR `0-32/33`) |
| Columnas base | `id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, factura_id, cotizacion_id, conciliado` |
| Columnas usadas por código (confirmar en PC3) | `notas` (escrita en Banca.jsx), probable `created_at` de creación de tabla |
| `estado` (3.2D) | **existe**: `text NOT NULL DEFAULT 'activo'` + `CHECK chk_movbancario_estado` `('activo','anulado')` |
| `fn_recalcular_saldo_cuenta()` (3.2D) | **existe** · `trg_mov_saldo` **NO existe** (0 triggers de aplicación) |
| `cuenta_id` | `uuid` con **2 huérfanos NULL** (`9aa1bee7`, `ce00ea20`) — GRUPO C, no se tocan |
| Origen en movimientos | Solo soft-refs descriptivas: `factura_id`, `cotizacion_id` (plain `uuid`, sin FK) |
| Índices existentes | inventario `pg_indexes` en PC8; si ya existe un índice equivalente sobre `(cuenta_id, fecha)` se conserva (no se duplica) y §6.3 no se ejecuta |
| `cuentas_bancarias` | **7** cuentas, todas `empresa_id=adc5…`, `saldo_inicial/saldo_actual` numéricos |
| PostgreSQL | **17.6** (≥15) |

### 2.2. Flujos de código actuales (que escriben/leen movimientos)

- **Banca.jsx**
  - `guardarMov(:421-443)`: INSERT manual con `empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, conciliado, notas`. **No** manda origen ni flujo.
  - `recalcularSaldo(:325-339)`: recálculo **en cliente** (`saldo_inicial + Σingresos − Σegresos`) y `UPDATE cuentas_bancarias.saldo_actual`.
  - `importar(:232)`: INSERT por fila XLS con `categoria:'otros'` + `notas` → tampoco origen/flujo.
  - `conciliar(:445)` / `delMov(:450)`: DELETE directo de movimientos (sin reversa ni par).
  - `usePaginacion(:351-357)`: ordena `fecha.asc`, filtra `cuenta_id`, busca columnas `['concepto','referencia','descripcion','categoria','notas','tipo']` — **`concepto` no existe** (hallazgo de auditoría, se corrige en 3.7/frontend, NO en 3.2E).
- **Pagos.jsx** (`guardar:85-132`): al registrar `pagos_recibidos` nuevo, inserta movimiento `tipo:'ingreso'`, `categoria:'ventas'` y **suma saldo incrementalmente**. No escribe origen (`pago_id` → no existe).
- **dashboardService.js** (`:18,45-50`): agrega `ingresos/egresos` por `movimientos_bancarios.tipo` **sin filtro de empresa** (se corrige en 3.5) y sin clasificación de flujo.
- **No existe** generador de movimientos de gastos, ni transferencias entre cuentas, ni doble partida banco→banco (auditoría §1.5.E).

### 2.3. Conclusión del diagnóstico

La capa de movimiento **ya existe y es la correcta** (auditoría §1.6: "movimientos_bancarios = la capa de caja/banco"). Lo que falta para soportar origen + flujo es únicamente **arq. estructural sobre la misma tabla**: columnas de origen, clasificación de flujo y contraparte de transferencia. No hace falta tabla paraguas nueva (`FASE3A1 §2.3`: se reutiliza `movimientos_bancarios`). La hoja de ruta base es `FASE3A1 §2.7` paso 2 (Caja/Banca).

## 3. DECISIONES DE DISEÑO

### 3.1. Columnas a agregar (todas `NULL`, sin default, sin CHECK en esta fase)

| Columna | Tipo | Propósito |
|---|---|---|
| `origen_tipo` | `text` NULL | Tipo de documento origen (dominio previsto alineado a 3.2A: `pago_cliente`, `gasto`, `factura`, `cotizacion`, `reserva`, `movimiento_bancario`, `transferencia`, `manual`). **Sin CHECK** (dominio diferido, precedente 3.2A §3). |
| `origen_id` | `uuid` NULL | Identidad del documento origen (polimórfico) — **sin FK** (igual que `factura_id`/`cotizacion_id`). |
| `tipo_flujo` | `text` NULL | Clasificación de flujo: dominio previsto `OPERATIVA | INVERSION | FINANCIAMIENTO | TRANSFERENCIA_INTERNA` (+ dirección entrada/salida). **Sin CHECK y NOT NULL diferidos** a la fase del generador/flujo (ver 3.2). |
| `cuenta_contraparte_id` | `uuid` NULL | Cuenta destino (pierna salida) / origen (pierna entrada) de una transferencia. Soft-ref a `cuentas_bancarias`, **sin FK** (consistente con el estilo del resto de la tabla). |
| `movimiento_contraparte_id` | `uuid` NULL | Id de la pierna pareada de la transferencia (self soft-ref a `movimientos_bancarios`). |

**Decisión D1 — `tipo_flujo` NULABLE y SIN CHECK ahora:** el histórico (33 filas) no se puede clasificar de forma determinista sin interpretación (GRUPO C prohíbe inferir); imponer `NOT NULL DEFAULT 'operativa'` etiquetaría datos históricos falsamente. La obligatoriedad (`NOT NULL` + CHECK del dominio y de dirección) se impondrá en la fase que cree el **generador de movimientos/flujo**, donde cada INSERT conoce su clasificación real.

**Decisión D2 — Transferencias SI mantener `tipo='ingreso'/'egreso'` + `tipo_flujo='transferencia_interna'` + contrapartes.** NO se introduce `tipo='transferencia'`: la función de recálculo de 3.2D (`fn_recalcular_saldo_cuenta`) firma como `+monto` solo `tipo='ingreso'`; emparejando una pierna `egreso` (cuenta A) con una `ingreso` (cuenta B) el **neto es 0** y el saldo de ambas cuentas queda correcto sin tocar la función ni el dominio de `tipo`. (Alternativa `tipo='transferencia'` descartada: exigiría reescribir la función en 3.8.)

**Decisión D3 — Sin FK ni para `cuenta_contraparte_id` ni para `movimiento_contraparte_id`:** coherente con `factura_id`/`cotizacion_id` (soft-refs); evita bloqueos de DROP sobre las 7 cuentas/33 movimientos históricos. La política de integridad (CREATE de pierna pareja, prohibición de DELETE solitario de una pierna) se definirá en la fase de la transferencia funcional (regla de negocio, no RLS).

### 3.2. Índices (idempotencia + consultas de Banca)

```sql
-- Un origen 1:1 = un movimiento bancario activo (transferencias excluidas; ver §3.3)
CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_origen
  ON public.movimientos_bancarios (empresa_id, origen_tipo, origen_id)
  WHERE origen_id IS NOT NULL AND estado = 'activo'
    AND origen_tipo IS DISTINCT FROM 'transferencia';

CREATE INDEX IF NOT EXISTS idx_mov_cuenta_fecha
  ON public.movimientos_bancarios (cuenta_id, fecha);
```

- `uq_mov_origen` replica el patrón de idempotencia de 3.2A (`uq_asientos_identidad`): el futuro generador **no puede duplicar** un movimiento derivado de un mismo origen **de tipo 1:1** (caso FASE3A1 §2.2-2). Los movimientos `manual`/históricos (origen NULL) quedan **fuera** por el predicado parcial.
- **El predicado excluye `origen_tipo='transferencia'`** porque una transferencia es 1 origen → 2 movimientos (piernas); ver §3.3.
- `estado='activo'`: un movimiento anulado no bloquea la recreación de su origen.
- `idx_mov_cuenta_fecha`: cubre el acceso real de `Banca.jsx` (`cuenta_id` + `order fecha`). **Solo se crea si PC8 no halla un índice equivalente ya existente sobre `(cuenta_id, fecha)`; si existe, se conserva y NO se duplica.**

**Sin CHECK de dominios** (`origen_tipo`, `tipo_flujo`, dirección de flujo) **en esta fase**, aplicando el precedente de 3.2A/`FASE3A1 §3` (CHECK diferido hasta cobertura completa de módulos) para no rechazar valores de fases futuras.

### 3.3. Modelo de identidad del evento — ¿qué significa "un origen = un movimiento"?

**Regla declarada:** `UNIQUE (empresa_id, origen_tipo, origen_id)` protege la **idempotencia del generador** para los orígenes con cardinalidad **1:1**: un documento origen produce a lo sumo **un** movimiento bancario activo. Se aplica a `pago_cliente`, `pago_proveedor`/`gasto`, `factura` (cobro directo), `movimiento_bancario` (importado/registrado) y `manual`.

**Excepción explícita — transferencia (1 origen → 2 piernas):** una transferencia interna genera **dos** movimientos (pierna salida en A, pierna entrada en B) que **comparten** `(origen_tipo='transferencia', origen_id=<operación>)`. Si entrara en la restricción, la segunda pierna sería rechazada → transferencia imposible. Por eso la **exclusión va dentro del predicado parcial** del índice (y no se resuelve con otro `UNIQUE`).

La integridad de una transferencia **no depende de la unicidad de origen** sino de las **invariantes del par** (definidas en la fase de la transferencia funcional, regla de negocio/trigger, no en esta fase): exactamente 2 piernas activas por `movimiento_contraparte_id`, referencias cruzadas **recíprocas** (`cuenta_contraparte_id` y `movimiento_contraparte_id` opuestas en ambas filas) y **neto contable 0**.

**Si un tipo futuro resultara 1:N (p. ej., reserva con anticipo + liquidación):** la solución es el mismo modelo de 3.2A en `asientos_contables` — añadir un **discriminante de evento** (`evento_tipo`, p. ej. `tesoreria`/`transferencia`/`reversa`) a la clave de identidad: `(empresa_id, origen_tipo, origen_id, evento_tipo)`. **3.2E NO añade `evento_tipo`** (sería adelantar decisión de dominio); queda documentado como la evolución natural del índice cuando el generador cierre el dominio definitivo. Con la exclusión de `transferencia`, **ninguna regla de 3.2E impide hoy una transferencia válida futura**.

## 4. COMPATIBILIDAD CON 3.2A – 3.2D

| Fase previa | Relación con 3.2E | Verificación mínima en PRE-CHECK |
|---|---|---|
| **3.2A** (estructura contable) | Reutiliza el **mismo nombre y semántica** de `origen_tipo` en otra tabla (independiente). Sin colisión. | — |
| **3.2B** (multiempresa) | No interfiere: `movimientos_bancarios.empresa_id` ya existe; no se crean tablas/funciones de authz. | — |
| **3.2C** (catálogo) | Independiente (`cuentas_contables`). | — |
| **3.2D** (estructura bancaria) | **Dependencia directa:** el predicado de `uq_mov_origen` usa `estado` (3.2D). No crea trigger (sigue para 3.8). El recálculo de la función (solo activo con trigger, 3.8) es agnóstico a las columnas nuevas: `tipo` permanece `ingreso/egreso` (Decisión D2). | PC1/PC2 (estado y CHECK correctos), PC6 (0 triggers) |

## 5. PRE-CHECKS (solo lectura, owner en SQL Editor; el script se detiene si uno es bloqueante)

- **PC0** — PostgreSQL ≥ 15 (`server_version_num`).
- **PC1** — `public.movimientos_bancarios` y `public.cuentas_bancarias` existen; `estado` existe correcto (tipo `text`, NOT NULL, default `activo`) y `chk_movbancario_estado` presente (legado 3.2D).
- **PC2** — Inventario de constraints de `movimientos_bancarios` (`pg_constraint`): detectar cualquier CHECK sobre `tipo`, FK ya existentes; se informan (para no chocar), no se modifican.
- **PC3** — Columnas actuales de la tabla (`information_schema.columns`): confirmar lista real (incluye `notas`, `created_at`) y que **ninguna** de las 5 columnas nuevas exista. Si alguna existe → se valida su definición (BLOQUEO si incorrecta, sin auto-reemplazo).
- **PC4** — Línea base de datos: `count(movimientos)` (esperado 33) o el real, `count(cuentas)` (esperado 7, **requiere ≥ 2** para la prueba T1-T de transferencia), checksum **canónico** de movimientos (§9: solo columnas pre-3.2E, misma fórmula en pre y post), snapshot de `saldo_inicial/saldo_actual` de las 7 cuentas, `ZZTEST3.2D=0`.
- **PC5** — **Origen limpio:** `count(movimientos WHERE origen_tipo IS NOT NULL OR origen_id IS NOT NULL)` debe ser **0** (columnas nuevas, todas NULL); si fuera > 0 → BLOQUEO (revisión manual; no se auto-clasifica).
- **PC6** — **0 triggers** de aplicación en la tabla (`NOT tgisinternal`) y `trg_mov_saldo` ausente (regla 3.2D/3.8).
- **PC7** — **Snapshot de seguridad `_bkp_32e` (owner, pre-ejecución).** Es un **snapshot de respaldo (`CREATE TABLE AS`), NO una prueba de restauración** (la recuperabilidad real se valida en fase de pruebas, bloque 3.10):
  1. **Existencia previa:** si `to_regclass('_bkp_32e.movimientos_bancarios')` ya existe → **BLOQUEO** (nunca se sobrescribe sin autorización); el operador debe autorizar explícitamente (dropear el snapshot anterior) o crear esquema alterno con timestamp `_bkp_32e_<YYYYMMDDHHMMSS>`.
  2. **Creación:** `CREATE TABLE _bkp_32e.movimientos_bancarios AS SELECT * FROM public.movimientos_bancarios;`.
  3. **Verificación:** `count(*)` origen vs copia igual (esperado 33/33) y `sum(monto)` igual; **3 filas muestreadas** (primera, última y una intermedia) comparadas **campo a campo** contra el origen.
- **PC8 — Índice equivalente de acceso Banca (informativo, no bloquea):** inventariar los índices actuales de `movimientos_bancarios` (`pg_indexes` + columnas por `pg_index`). Determinar si ya existe un índice que cubra `(cuenta_id, fecha)` (columnas líderes que incluyan `(cuenta_id, fecha)`). Decisiones: si existe → **conservarlo** y **NO** crear `idx_mov_cuenta_fecha` (registrar el nombre real del índice conservado); si no existe → se creará `idx_mov_cuenta_fecha` en 6.3. Un índice pre-existente conservado **nunca se modifica ni se elimina**.

## 6. MIGRACIÓN PROPUESTA (NO ejecutar; solo con aprobación)

```sql
-- 6.1 Columnas (idempotente; valida antes si ya existen por definición correcta)
ALTER TABLE public.movimientos_bancarios
  ADD COLUMN IF NOT EXISTS origen_tipo            text,
  ADD COLUMN IF NOT EXISTS origen_id              uuid,
  ADD COLUMN IF NOT EXISTS tipo_flujo             text,
  ADD COLUMN IF NOT EXISTS cuenta_contraparte_id  uuid,
  ADD COLUMN IF NOT EXISTS movimiento_contraparte_id uuid;

-- 6.2 Idempotencia del generador futuro (patrón 3.2A; transferencias excluidas, ver §3.2/3.3)
CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_origen
  ON public.movimientos_bancarios (empresa_id, origen_tipo, origen_id)
  WHERE origen_id IS NOT NULL AND estado = 'activo'
    AND origen_tipo IS DISTINCT FROM 'transferencia';

-- 6.3 Acceso Banca (cuenta + fecha) — omitir si PC8 confirmó índice equivalente
CREATE INDEX IF NOT EXISTS idx_mov_cuenta_fecha
  ON public.movimientos_bancarios (cuenta_id, fecha);
```

- **Sin `NOT NULL`, sin defaults, sin CHECK**: decisión deliberada (D1/D2 y precedente de dominios diferidos). Las columnas quedan listas para el generador.
- **Meta-only**: agregar columnas NULL sin default es operación de catálogo (sin reescritura de tabla, instantánea en 33 filas). El UNIQUE parcial no toca filas (todas NULL de origen).
- **6.3 condicional:** depende de PC8. Si ya existe un índice equivalente sobre `(cuenta_id, fecha)`, se conserva y 6.3 **no se ejecuta** (no se duplica índice).
- **Sin COMMIT/rollback especial**: la migración es corta y atómica por sí misma; se mantiene el patrón exec-read (segun se acuerde con la versión definitiva, puede seguir el arnés de 3.2D-R4: COMMIT top-level + prueba + GATE).

## 7. PRUEBA TRANSACCIONAL DE ACEPTACIÓN

Todo corre con el arnés probado en 3.2D-R4: **variables locales + subtransacciones abortadas (`SQLSTATE 'TZ001'`)**, marcador de sesión `tz32d_e.t1_result='pass'` solo como último paso en autocommit, y **nunca** se persisten filas de prueba (referencia `ZZTEST3.2E`). Cuenta real obtenida dinámicamente, nunca inventada.

- **T1-O (origen):** INSERT temporal con `origen_tipo='pago_cliente'`, `origen_id=<uuid nuevo gen_random_uuid()>` (sin FK → no falla), `tipo_flujo='OPERATIVA'`. Debe: permitirse, ser visible, `cuenta_id` correcto, `saldo_actual` **intacto** (evidencia de que el trigger sigue inactivo).
- **T1-U (idempotencia, `uq_mov_origen`):** segundo INSERT con el **mismo** `(origen_tipo, origen_id)` dentro de la subtransacción → debe lanzar `unique_violation` (capturado con `EXCEPTION WHEN unique_violation` → PASS). Luego, el abort del subtest.
- **T1-T (transferencia neta cero — vínculo bidireccional y saldos intactos):** entre 2 cuentas reales A y B con monto `M`:
  - Pierna A: `cuenta_id = A`, `tipo='egreso'`, `monto = M`.
  - Pierna B: `cuenta_id = B`, `tipo='ingreso'`, `monto = M`.
  - **Neto de la transferencia: `(-M) + (+M) = 0`**.
  - Ligado (tras insertar ambas piernas): `A.movimiento_contraparte_id = ID de B` y `B.movimiento_contraparte_id = ID de A`.
  - Verificaciones **en ambas direcciones**:
    - `A.cuenta_contraparte_id = B` (id cuenta de la pierna B).
    - `B.cuenta_contraparte_id = A` (id cuenta de la pierna A).
    - `A.movimiento_contraparte_id = B.id` y `B.movimiento_contraparte_id = A.id` (referencia cruzada completa del par, ambas direcciones).
  - Coexistencia: ambas piernas comparten `(origen_tipo='transferencia', origen_id=<misma operación>)` y **ambas se persisten sin `unique_violation`**, demostrando que `uq_mov_origen` no bloquea transferencias (§3.2/3.3).
  - **Saldos reales:** `saldo_actual` de A y de B quedan **exactamente iguales** a sus valores previos a la prueba (sin trigger no hay recálculo).
  - Todo corre dentro de la subtransacción y se **revierte con rollback** (marcador `ZZTEST3.2E` = 0 al final).
- **T1-null (retrocompatibilidad):** INSERT **sin** las columnas nuevas (como hoy) debe seguir funcionando (columnas NULL).

## 8. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| Columnas nuevas | existen: `origen_tipo text NULL`, `origen_id uuid NULL`, `tipo_flujo text NULL`, `cuenta_contraparte_id uuid NULL`, `movimiento_contraparte_id uuid NULL` |
| Índices | `uq_mov_origen` (único, parcial) presente y, según PC8: `idx_mov_cuenta_fecha` presente **o** índice equivalente pre-existente conservado (`pg_indexes`) |
| `estado` + `chk_movbancario_estado` (3.2D) | intactos |
| Triggers | **0** de aplicación; `trg_mov_saldo` ausente |
| Datos | `count(movimientos)` idéntico a PC4 (**33 → 33**), checksum canónico idéntico (§9), `ZZTEST3.2E`=0, `count(cuentas)` idéntico, `saldo_inicial/saldo_actual` de las 7 cuentas **idénticos** |
| Origen de prueba | ninguna fila con `origen_tipo/origen_id` persistida fuera del subtest |

**GATE** (DO posterior, transacción propia, sin escribir datos): `t1_result='pass'`, estructura correcta (5 columnas + 2 índices), 0 triggers, `ZZTEST3.2E`=0, integridad `cantidad_pre = cantidad_post` (**33 y 33**) y `checksum_pre = checksum_post` (fórmula canónica §9), saldos de cuentas idénticos. Si algo falla → `RAISE EXCEPTION` y la fase **no termina aparentando éxito**.

## 9. CHECKSUM CANÓNICO — inmutabilidad de los históricos

**Propósito único:** demostrar que los movimientos históricos existentes **no fueron modificados** por FASE 3.2E. No tiene otro uso.

**Reglas:**
- Se calcula **solo** sobre las columnas que **ya existían antes de 3.2E** (todas las actuales según la lista real de PC3, incluidas `estado` de 3.2D y `created_at` **si PC3 la confirma**). **Las 5 columnas nuevas de esta fase quedan EXCLUIDAS y no se añade ninguna columna que no exista ya antes de 3.2E.**
- Representación **determinista** por registro: cada columna → `COALESCE(col::text,'<NULL>')`, campos concatenados con `'|'`, filas separadas por `','`, y **`ORDER BY id::text` siempre** (orden estable por identificación textual, nunca por cómo la BD ordene físicamente).
- **Valores NULL preservados** con el centinela `<NULL>`, distinguible de cualquier valor real (supuesto documentado: ningún dato actual es igual a `<NULL>`; de cumplirse, sería un dato real idéntico al marcador).
- Resultado: `md5(…)` en hexadecimal minúscula (determinista; misma entrada → mismo hash).

**Validación:** `cantidad_pre = cantidad_post` (esperado **33 y 33**) y `checksum_pre = checksum_post`, con la **misma** fórmula exacta en PC4 (pre) y en POST-CHECKS/GATE (post).

```sql
-- Definición canónica (ESPEC de la fase; no es el script ejecutable).
-- Lista = columnas pre-3.2E reales, fijada por PC3 (la misma en pre y post).
-- `created_at` se incluye solo si PC3 la confirma (ver nota posterior).
SELECT md5(string_agg(
  coalesce(id::text,'<NULL>') || '|' ||
  coalesce(empresa_id::text,'<NULL>') || '|' ||
  coalesce(cuenta_id::text,'<NULL>') || '|' ||
  coalesce(fecha::text,'<NULL>') || '|' ||
  coalesce(tipo::text,'<NULL>') || '|' ||
  coalesce(descripcion::text,'<NULL>') || '|' ||
  coalesce(monto::text,'<NULL>') || '|' ||
  coalesce(referencia::text,'<NULL>') || '|' ||
  coalesce(categoria::text,'<NULL>') || '|' ||
  coalesce(factura_id::text,'<NULL>') || '|' ||
  coalesce(cotizacion_id::text,'<NULL>') || '|' ||
  coalesce(conciliado::text,'<NULL>') || '|' ||
  coalesce(notas::text,'<NULL>') || '|' ||
  coalesce(estado::text,'<NULL>') || '|' ||
  coalesce(created_at::text,'<NULL>'),
  ',' ORDER BY id::text))
FROM public.movimientos_bancarios;
```

- La lista canónica es **exactamente** la lista real de columnas pre-3.2E que confirme PC3, **ni más ni menos**: si `created_at` existe se incluye (tal como se muestra en la fórmula, tras `estado`); si PC3 prueba que `created_at` **no** existe, ese campo `coalesce(created_at…)` se elimina de la fórmula. En ambos casos la **misma** definición exacta (misma lista, mismo orden de campos, mismo separador y mismo centinela) se aplica en PRE (PC4) y POST (POST-CHECKS/GATE), sin cambiarla a mitad del ciclo.
- Alcance estricto: no incluye las 5 columnas nuevas (**`origen_tipo`, `origen_id`, `tipo_flujo`, `cuenta_contraparte_id`, `movimiento_contraparte_id`**) porque estas no alteran los movimientos existentes (quedan NULL); cualquier modificación a columnas históricas haría diferir `checksum_pre != checksum_post`.

## 10. IDEMPOTENCIA

La **migración estructural** (columnas + índices) es idempotente por sí misma; el **script completo no es repetible sin intervención** porque el mecanismo de backup bloquea deliberadamente si `_bkp_32e` ya existe (protección anti-sobrescritura que se mantiene).

- **Migración estructural (idempotente):** columnas con `ADD COLUMN IF NOT EXISTS` + validación previa (PC3). Si ya existen con definición correcta → NOTICE y continuar; si existe alguna con tipo incorrecto → **BLOQUEO** (no se auto-reemplaza). Índices con `CREATE … IF NOT EXISTS` (y `idx_mov_cuenta_fecha` solo si PC8 no halló equivalente, §6.3).
- **Script completo (no repetible sin intervención):** PC7 **bloquea** si `_bkp_32e.movimientos_bancarios` ya existe (**no se elimina este bloqueo**). Para una segunda corrida completa el operador debe autorizar el snapshot (dropear el anterior) o usar esquema alterno con timestamp `_bkp_32e_<YYYYMMDDHHMMSS>`. La prueba y el GATE corren siempre tras una migración estructural válida.

## 11. ROLLBACK

```sql
DROP INDEX IF EXISTS uq_mov_origen;
DROP INDEX IF EXISTS idx_mov_cuenta_fecha;
ALTER TABLE public.movimientos_bancarios
  DROP COLUMN IF EXISTS origen_tipo,
  DROP COLUMN IF EXISTS origen_id,
  DROP COLUMN IF EXISTS tipo_flujo,
  DROP COLUMN IF EXISTS cuenta_contraparte_id,
  DROP COLUMN IF EXISTS movimiento_contraparte_id;
```

- No hay trigger que quitar; no se tocan datos; `DROP COLUMN IF EXISTS` es reversible y barato (33 filas).
- Solo se eliminan índices creados en esta fase: `uq_mov_origen` siempre, y `idx_mov_cuenta_fecha` **solo si fue creado aquí** (si PC8 conservó un índice equivalente pre-existente, ese nunca se toca ni se elimina).
- Consideración futura documentada: cuando existan movimientos reales con `movimiento_contraparte_id`, el drop de la columna perdería el vínculo → el rollback de 3.2E solo aplica mientras las columnas estén sin uso (fase de estructura pura).

## 12. FRONTERAS EXPLÍCITAS (NO forma parte de 3.2E)

1. **RLS / políticas** (FASE 3.6).
2. **Frontend** — ninguna página cambia; no se corrige `concepto` en Banca (3.7).
3. **Conciliación bancaria** (módulo futuro; solo existe `conciliado`).
4. **Trigger de saldos `trg_mov_saldo`** (FASE 3.8) — 3.2E solo prepara estructura.
5. **Transferencias funcionales** (crear pareja, neto 0, integridad del par) — solo se dejan las columnas; la lógica es posterior.
6. **Pagos** (dobles vías a `pagada`), `pagos_recibidos` con `origen` — fuera.
7. **Reporte Flujo de Efectivo** — usaría `tipo_flujo`, pero se construye en su propia fase.
8. **Backfill histórico de orígenes** (GRUPO C, requiere emparejamiento manual) — columnas quedan NULL.
9. **Saldos históricos de facturas** (bloque 3.3) — otro bloque, no aquí.
10. **CHECK de dominios** (`origen_tipo`, `tipo_flujo`, dirección) — diferidos.

**Dependencia externa identificada (única):** el predicado de `uq_mov_origen` depende de `estado` de 3.2D → FASE 3.2E **requiere 3.2D ya aplicada**.

## 13. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Ver adiciones mal definidas en segunda corrida | Bajo | `IF NOT EXISTS` + validación (PC3), BLOQUEO sin auto-reemplazo |
| `uq_mov_origen` colisione con un origen 1:1 que resulte 1:N en el futuro (p. ej. reserva: anticipo + liquidación) | Medio | Discriminante `evento_tipo` (modelo 3.2A) documentado en §3.3; se revisa al cerrar el dominio en la fase del generador (rollback puntual del índice) |
| Transferencia válida bloqueada por `uq_mov_origen` (2 piernas, mismo origen) | Resuelto en diseño | Predicado excluye `origen_tipo='transferencia'` (§3.2/3.3); T1-T demuestra la coexistencia de ambas piernas |
| Fila de prueba ZZTEST persistida | Bajo | Arnés subtransaccional (3.2D-R4) + GATE `ZZTEST3.2E=0` |
| Trigger accidental en esta fase | Bajo | PC6 + GATE exigen 0 triggers |
| Transferencia fingida alterando saldos | Bajo | T1-T verifica saldos intactos; sin trigger no hay recálculo |
| Backfill erróneo de orígenes históricos (intento) | Bajo | PC5 prohíbe filas con origen previo; GRUPO C excluido por diseño |
| Decisión `tipo` vs `tipo_flujo` para transferencias cambie luego | Medio | Decisión D2 documentada y compatible con `fn_recalcular_saldo_cuenta` (3.8) |
| Snapshot `_bkp_32e` sobrescrito / colisionado en segunda ejecución | Bajo | PC7: BLOQUEO si ya existe el snapshot; esquema alterno con timestamp `_bkp_32e_<ts>`; verificación de conteo y muestreo campo a campo |
| Índice duplicado `(cuenta_id, fecha)` si ya existe uno equivalente | Bajo | PC8 decide antes de 6.3: conserva el existente (no duplica); se registra el nombre y se verifica en POST-CHECK |

## 14. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación explícita).
2. **PRE-FLIGHT owner** (SQL Editor, SOLO lectura): responder PC0–PC8; pegar salidas.
3. **Escribir el script** `sql/migracion_fase_3_2e.sql` con el arnés completo (PRE-CHECKS → MIGRACIÓN → PC-Prueba → POST-CHECKS → GATE → ROLLBACK comentado) y aprobar.
4. **Backup** con snapshot `_bkp_32e` (PC7: si ya existe → BLOQUEO y usar `_bkp_32e_<YYYYMMDDHHMMSS>` con autorización) + verificación de conteos y muestreo campo a campo.
5. **Ejecutar en Supabase SQL Editor como OWNER**, en orden, entero.
6. Registrar: PC0–PC8, NOTICEs de MIGRACIÓN, T1-O/T1-U/T1-T/T1-null PASS, post-checks y `GATE 3.2E OK`.
7. **Cerrar FASE 3.2E** y NO avanzar (a la fase de generador/flujo ni a 3.3) sin nueva aprobación.

## 15. ENTREGABLES

- `FASE3.2E_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: `sql/migracion_fase_3_2e.sql` + informe `FASE3.2E_INFORME.md` con evidencias.

---

**ESTADO: PREPARADO PARA REVISIÓN — sin SQL generado ni ejecutado. Pendiente aprobación del usuario.**