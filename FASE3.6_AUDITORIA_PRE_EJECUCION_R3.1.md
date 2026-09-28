# FASE 3.6 — AUDITORÍA PRE-EJECUCIÓN R3.1

> Proyecto: ERP Tz'unun · Repositorio: `tzununautorentas/tzununsa` · Base: `fmijbpatkddkbxlkfoza`
> Objeto auditado: `sql/migracion_fase_3_6.sql` vs diseño R3 (`FASE3.6_PLAN_DETALLADO.md`) y esquema/SQL del repositorio.
> Alcance: **solo lectura y análisis documental** — no se ejecutó SQL, no se modificó la BD, no se borraron policies, no se crearon datos/objetos.

---

## 1. Veredicto

**APTO PARA EJECUCIÓN — CONDICIONADO AL PROCEDIMIENTO OPERATIVO E** (ver §4 y §8).

La auditoría no encontró errores de sintaxis/PL/pgSQL ni de catálogo en el SQL. Se aplicaron las correcciones encargadas (#2 `v_c`, #7 `diagnostico_prueba`, #8 atomicidad) y el refuerzo de PC4 decidido (semántica 3.2B). Las reglas de RLS son las aprobadas en R3. Los hallazgos restantes son **operativos** (resolución de policies legacy y vía de ejecución atómica), no defectos del archivo.

---

## 2. Hallazgos críticos

### C1 — PC4 no verifica que galheroa realmente RESUELVA como super_admin (semántica FASE 3.2B)
- `authz.es_super_admin()` (definido en `sql/migracion_fase_3_2b.sql` L204-232) concede super_admin solo si:
  - **(a)** existe vínculo activo en `usuario_empresas` con `rol_id` cuyo rol es `super_admin` o `permisos->>'todo'='true'`, **o**
  - **(b)** fallback legacy por `usuarios_sistema.rol_id = super_admin` **Y** el usuario **NO tiene ningún vínculo** en `usuario_empresas` (`NOT EXISTS`).
- FASE 3.5 confirmó vínculos reales para ambos usuarios (`FASE3.5_INFORME.md` §3: 2 relaciones activas, rol_id 1/2). Por tanto **el camino (b) está inhabilitado** para cualquier usuario con vínculo, incluido galheroa.
- PC4 actual solo verifica `usuarios_sistema.auth_id` de galheroa `activo` (existe + activo). **No comprueba** que su super_admin se resuelva por (a). Si galheroa tuviera rol admin en su vínculo, PC4 pasaría pero **B-T4 fallaría** (galheroa no podría insertar en `usuarios_sistema`), atribuyéndolo erróneamente al RLS.
- No bloquea la aplicación de RLS (el esquema queda correcto igual), pero invalida una prueba funcional documentada y falsea el mensaje "galheroa (super_admin) presente".
- **Resuelto (§4-D, decisión del usuario):** PC4 ahora replica la semántica exacta de la función y bloquea si galheroa no resuelve super_admin.

### C2 — Policies legacy (10, confirmadas en vivo 2026-09-28) frente a PC3 (bloqueo operativo, no defecto del archivo)
- La comprobación en vivo (`pg_policies`) confirmó **10 policies legacy** en `public` (no 7 como estimaba el repo):
  - `usuarios_sistema` (4): "Lectura/Insercion/Actualizacion/Eliminacion para autenticados" (todas `USING/WITH CHECK true`) — `sql/configuracion_roles_series.sql` L22-26.
  - `ubicaciones_personalizadas` (6): "Lectura/Insercion/Eliminacion **para** usuarios autenticados" **y** sus duplicados "Lectura/Insercion/Eliminacion usuarios autenticados" (sin `para`) — `sql/crear_ubicaciones_personalizadas.sql` solo definía las 3 "para"; las 3 adicionales existen en la BD real.
- PC3 (auditoría íntegra de `public`), V3 y el GATE **bloquearán** por diseño (cond. 7 R3: una policy NO `tz36_*` → `RAISE EXCEPTION`, jamás borrado silencioso). Es el comportamiento correcto; la resolución es humana.
- Riesgo operativo de la resolución "manual previa": si el operador elimina las policies legacy en una corrida **separada** y luego una corrida de 3.6 falla, `usuarios_sistema` y `ubicaciones_personalizadas` quedan con RLS ON y **cero policies** → `authenticated` denegado de forma **permanente** hasta resolverse.
  - **Mitigación exacta (recomendada):** ejecutar los 10 `DROP POLICY` + el archivo `migracion_fase_3_6.sql` COMPLETO en **una única corrida** del SQL Editor → transacción implícita única: si 3.6 falla, los DROPs revierten junto con todo (no hay ventana ni daño permanente).

### C3 — Atomicidad: la garantía "todo o nada" no es del archivo, es del mecanismo de ejecución
- El archivo no contiene `BEGIN/COMMIT/ROLLBACK` (correcto por diseño R3) → **no controla** los límites de transacción.
- PostgreSQL hace transaccionales DDL y DML por naturaleza, pero la envoltura de **toda la corrida** depende del ejecutor:
  - **Supabase SQL Editor (Dashboard):** el texto completo se envía como UN query (protocolo simple de PostgreSQL) → los múltiples statements se ejecutan dentro de una **transacción implícita** → errores posteriores revierten los anteriores. La afirmación es legítima **solo en esta vía**, pero **no es un contrato documentado** por Supabase; es comportamiento del protocolo, verificable empíricamente.
  - **Supabase CLI (`supabase db push`):** cada archivo de migración corre en su propia transacción (confirmado en GitHub supabase/cli#2898) → atómico.
  - **psql** en autocommit por sentencia (`-f` **sin** `-1`/`ON_ERROR_STOP`): **NO** es atómico → cada statement confirma individualmente; un fallo deja policies aplicadas parcialmente.
- Se corrigió la **documentación** (cabecera del SQL, §3.3 del informe) para que la afirmación sea exacta; **no** se añadió `BEGIN/COMMIT` (contradiría R3). El diseño queda respaldado por el patrón fail-closed (`RAISE EXCEPTION` en todos los caminos de fallo) y por la re-ejecución idempotente (V1-V3 + GATE) que permite confirmar el estado final.

---

## 3. Hallazgos menores

| # | Ubicación | Hallazgo | Impacto |
|---|---|---|---|
| M1 | Sección 3 (ENABLE) | `FOR v_c IN` sin declarar | Válido: PL/pgSQL crea implícitamente la variable como RECORD. **Ya corregido** (se añadió `v_c RECORD;`). Documental. |
| M2 | Sección 2.1 y GATE | Variables `v_cmd` y `v_ok` declaradas y sin uso | Inocuas; limpieza opcional. |
| M3 | Nombres de policies (Sección 2.1) | `tz36_<tabla>_<op>`: longitud y colisión | Límite de identificador PG = 63 bytes. Máximo actual del proyecto: `tz36_ubicaciones_personalizadas_select` = 37 bytes. `%I` solo añade comillas si el nombre lo exige; nombres distintos → policies distintas; truncamiento por longitud solo a partir de ~45-50 chars de tabla (no existen hoy). **Sin riesgo actual**; guarda defensiva opcional. |
| M4 | Informe §3.3 (previo) | "PC2 acepta RLS OFF-total o ON-total" sin mencionar la excepción legacy | **Ya corregido**: texto alineado con el PC2 real (excepción `usuarios_sistema`/`ubicaciones_personalizadas`). |
| M5 | GATE | Comentario "≥4 policies" correcto, pero exige count por tabla (4) | Válido; ninguna tabla objetivo recibe <4 (negocio/híbrido 4 dinámicas; autorización 12 fijas). |
| M6 | Sección 6 (guía) | B-T1b/T2neg dicen "PENDIENTE si PC5 no halló empresa ajena" | Correcto y coherente (solo-BD). |
| M7 | V1-V3 | Resultados parciales visibles aunque un NOTICE posterior falle | El SQL Editor muestra grids de statements ya ejecutados antes del error; el ROLLBACK revierte igual. Aclaración documental para lectura de salidas. |

---

## 4. Correcciones exactas requeridas

### A — APLICADA — Sección 3 (ENABLE), variable del loop
- **Archivo:** `sql/migracion_fase_3_6.sql` · **Sección:** 3 (bloque `DO $$` de ENABLE).
- **Problema:** `FOR v_c IN SELECT ...` usaba loop variable sin declaración explícita.
- **Cambio exacto:** añadir en `DECLARE` la línea `v_c RECORD;`.
- **Motivo:** robustez y petición explícita de la auditoría (#2). Nota técnica: era válido sin declarar (declaración implícita como RECORD).

### B — APLICADA — Sección 6 (guía Bloque B), B-T2pos / B-T2neg
- **Archivo:** `sql/migracion_fase_3_6.sql` · **Sección:** 6.
- **Problema:** la guía apuntaba a `POST /rest/v1/diagnostico_prueba`, tabla **inexistente** en el repositorio (verificado por grep: único origen es esa misma guía).
- **Cambio exacto:** se sustituyó por `POST /rest/v1/<tabla_negocio_real>` con patrón de fila desechable `"T36-test-…"` borrada por el mismo usuario, y ejemplo concreto verificado en repo: `ubicaciones_personalizadas` (empresa_id NOT NULL; el frontend ya inserta/borra vía REST).
- **Motivo:** no hay objeto real de prueba; #7 solicita usar un objeto real apropiado sin inventar estructura.

### C — APLICADA — Cabecera (atomicidad) + Informe §3.3
- **Archivo:** `sql/migracion_fase_3_6.sql` cabecera; `FASE3.6_INFORME.md` §3.3.
- **Problema:** la afirmación "el SQL Editor ejecuta como UNA sola transacción implícita" era demasiado fuerte sin calificar la vía de ejecución.
- **Cambio exacto:** se precisa que la garantía aplica ejecutando el archivo **COMPLETO en una única corrida** del SQL Editor (o migración CLI), y que **psql autocommit por sentencia no la preserva**; el camino de fallo fail-closed y V1-V3/GATE permiten verificar el estado final.
- **Motivo:** #8 — distinguir atomicidad PG (siempre por transacción), mecanismo del ejecutor (variable) y lo que garantiza el archivo (no contiene BEGIN/COMMIT).

### D — APLICADA — PC4 (verificación de super_admin de galheroa) — decisión del usuario: reforzar
- **Archivo:** `sql/migracion_fase_3_6.sql` · **Sección:** 1, bloque PC4.
- **Problema:** PC4 asumía super_admin por presencia, pero la semántica real (3.2B) exige vínculo con rol super_admin (camino a) o rol legacy sin vínculos (camino b, inhabilitado si hay vínculos).
- **Cambio aplicado:** PC4 ahora replica la semántica **exacta** de `authz.es_super_admin()` (misma estructura de los dos `EXISTS` de la función, `auth.uid()` → `auth_id` fijo de galheroa):
  ```sql
  SELECT count(*) INTO v_gal_sa
    FROM public.usuarios_sistema us
   WHERE us.auth_id = '6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4' AND us.activo
     AND (
       EXISTS (SELECT 1
                 FROM public.usuario_empresas ue
                 JOIN public.roles r ON r.id = ue.rol_id
                WHERE ue.usuario_id = us.id AND ue.activo
                  AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true'))
       OR
       EXISTS (SELECT 1
                 FROM public.roles r
                WHERE r.id = us.rol_id
                  AND (r.nombre = 'super_admin' OR (r.permisos::jsonb ->> 'todo')::text = 'true')
                  AND NOT EXISTS (SELECT 1 FROM public.usuario_empresas ue2
                                   WHERE ue2.usuario_id = us.id))
     );
  IF v_gal_sa < 1 THEN RAISE EXCEPTION 'PC4 BLOQUEO: galheroa NO resuelve super_admin (semantica 3.2B): ...'; END IF;
  ```
  Nota: se usó la versión con dos `EXISTS` (no `COALESCE(ue.rol_id, us.rol_id)`). Es equivalente a la función y evita ambigüedad cuando hay varios vínculos.
- **Motivo:** garantizar que B-T4 (escritura de galheroa en `usuarios_sistema`) sea un test válido y el mensaje de PC4 no sea engañoso. Comprobación de solo lectura, válida como OWNER.

### E — OPERATIVO (requiere confirmación) — Resolución legacy y una única corrida
- **Archivo:** ninguno del SQL; **procedimiento** de quien ejecuta.
- **Cambio exacto:** confirmadas las 10 policies legacy en vivo; ejecutar sus `DROP POLICY` **seguidos del archivo completo** en **una única** corrida del SQL Editor (transacción única). Si 3.6 revierte, los DROPs también revierten.
- **Motivo:** C2 — evitar la ventana/permanencia de tablas RLS-ON sin policies.

### F — OPCIONAL — Guarda defensiva de longitud de policy name
- **Archivo:** `sql/migracion_fase_3_6.sql` · **Sección:** 2.1.
- **Cambio exacto (opcional):** dentro del loop, `IF length('tz36_' || r.tabla || '_select') > 63 THEN RAISE EXCEPTION ... END IF;`.
- **Motivo:** M3 — preventivo ante futuras tablas de nombre largo; no requerido para las tablas actuales.

---

## 5. Validaciones que SOLO pueden hacerse contra Supabase

1. **Existencia real de las 10 policies legacy** — CONFIRMADA en vivo 2026-09-28 (4 en `usuarios_sistema`, 6 en `ubicaciones_personalizadas`). De ello depende que la corrida se preceda de los 10 DROPs.
2. **Tipos en vivo:** confirmar `usuarios_sistema.id` = `uuid` y `empresa_id`/`usuario_id`/`rol_id` de `usuario_empresas` (`information_schema`). *Nota: FASE 3.2B ya exigió `usuarios_sistema.id=uuid` como pre-check (L46-48); si en vivo fuera bigint, la FK de `usuario_empresas.usuario_id` (uuid → REFERENCES) no habría podido crearse → la inconsistencia es técnicamente imposible si 3.2B corrió. Validación de confirmación, no de bloqueo.*
3. **Datos reales de PC4/PC5:** galheroa y vanessa activos con esos `auth_id`; vínculos activos hacia `adc5f324…`; **rol efectivo de galheroa** en su vínculo (super_admin o no) — decide si B-T4 es ejecutable y si D es obligatorio.
4. **Clasificación real por PC1:** `cuentas_contables` debe tener filas maestras (`empresa_id IS NULL`) para clasificar híbrida; si alguna tabla de negocio tiene hoy NULLs o si aparecen tablas sin `empresa_id`, la clasificación efectiva diferirá del supuesto (esto es lo esperado del inventario dinámico).
5. **Nº de empresas reales** (PC5): con 1 sola, T1b/T2neg quedan PENDIENTES — verificar que el NOTICE diga PENDIENTE.
6. **Comportamiento transaccional real del SQL Editor:** una corrida de control con PC3 disparado (antes de resolver legacy) debería dejar la BD sin cambios (DLDs de inventario y notices sí visibles, pero nada aplicado); es la forma empírica de confirmar C3 en esa vía.
7. **Factibilidad de B-T1a/T3/T4/T5** con los JWT reales (REST autenticado post-commit).

---

## 6. Riesgos funcionales pendientes

1. **`ubicaciones_personalizadas` (obligatorio)**
   - Definición repo (`crear_ubicaciones_personalizadas.sql`): `empresa_id uuid NOT NULL` REFERENCES `empresas`; columnas `id`, `nombre`, `direccion`, `lat`, `lng`, `created_at`.
   - Uso: mapa/ubicación personalizada del frontend (`src/services/ubicacionesService.js`): `listarUbicaciones(empId)` → `GET ...empresa_id=eq.<activa>`; `guardarUbicacion(data)` → INSERT; `eliminarUbicacion(id)` → DELETE por id. **No usa UPDATE.**
   - Legacy: RLS ON + **6 policies** `USING/WITH CHECK true` (sin UPDATE; 3 "para usuarios autenticados" y 3 duplicadas sin "para", confirmadas en vivo). Mientras existan, cualquier autenticado ve/borra TODAS (sin filtro de empresa).
   - Tras el DROP de las 6 (mismo-una corrida) y FASE 3.6: **PC1 la clasifica `negocio`** (empresa_id NOT NULL → 0 NULLs) → FASE 3.6 **SÍ** crea `tz36_ubicaciones_personalizadas_{select,insert,update,delete}` y habilita RLS. Sustituye las legacy y **añade UPDATE** (mejora). SELECT/INSERT/DELETE cubren el frontend real.
   - **Conclusión:** *"SEGURO eliminar las policies legacy porque FASE 3.6 las reemplaza"*, con una condición: los DROPs y el archivo 3.6 en **una única corrida** (evitar ventana/permanencia sin policies). No se requiere más corrección al SQL.
2. **`usuario_empresas.usuario_id` ↔ `usuarios_sistema.id`**
   - Definiciones repo: 3.2B crea `usuario_empresas.usuario_id uuid REFERENCES public.usuarios_sistema(id)` (L83); pre-check 3.2B exige `usuarios_sistema.id=uuid` (L46-48, L56). El único `bigint` es el archivo legacy `configuracion_roles_series.sql` L12 — **anterior a 3.2B y obsoleto**.
   - Policy: `EXISTS(SELECT 1 FROM public.usuarios_sistema us WHERE us.id = usuario_id AND ...)`: compara `usuarios_sistema.id` (=uuid) con `usuario_empresas.usuario_id` (=uuid) → **legal y compatible**, sin cast necesario. La FK del propio 3.2B solo es posible con tipos iguales.
   - **Conclusión:** compatible; verificación en vivo opcional (§5). Sin cambio requerido.
3. **Tablas híbridas**
   - La expresión `(empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))` para SELECT/INSERT/UPDATE/DELETE coincide exactamente con el diseño R3 aprobado (`FASE3.6_PLAN_DETALLADO.md` L59: "USING/WITH CHECK (empresa_id IS NULL OR ...)") y con FASE3.2B_PLAN L247/L329. **Sin contradicción: es la regla aprobada.**
   - Permiso efectivo sobre filas `empresa_id IS NULL` (maestras): **CRUD completo para cualquier authenticated** (SELECT verá todas las maestras; INSERT/WITH CHECK permite crear maestras; UPDATE/DELETE permite modificarlas/borrarlas). Es consecuencia directa de la regla aprobada; el informe del proyecto ya anticipaba endurecimientos futuros en catálogos (FASE3A_INFORME_TECNICO L249: "sin escritura de las empresas"). **Se decide no cambiar aquí** (alcance R3); queda registrado como riesgo de negocio a resolver en fase posterior.
4. **`diagnostico_prueba`** → inexistente; guía corregida (§4-B). Objeto real sugerido `ubicaciones_personalizadas`. Sin restos.
5. **Atomicidad** → cubierta en C3; documentación corregida; verificación empírica opcional (§5.6).

---

## 7. Estado del SQL

`sql/migracion_fase_3_6.sql` queda: **CORREGIDO — APTO PARA EJECUCIÓN (con procedimiento)**.

- **Aplicado:** `v_c RECORD;` (A); guía B-T2 con objeto real (B); matiz de atomicidad en cabecera (C); **refuerzo de PC4 con semántica exacta 3.2B (D)**; informe alineado (§3.3, §2 excepción legacy).
- **Decidido por el usuario:** excepción legacy de PC2 **confirmada**; procedimiento E (DROPs legacy + archivo completo, una sola corrida) **aprobado**; guarda de longitud (F) **no aplicada** (riesgo nulo).
- **Sin cambios (reglas aprobadas):** expresión híbrida (§6.3), patterns de políticas, prefijo `tz36_`, GATE/V1-V3, inventario dinámico, evidencia `tz36_inventario`, PC5 (read-only).

---

## 8. EJECUCIÓN (condicionada) — cerrar hallazgo C2

**El SQL es APTO**; la únicas condiciones para la corrida son operativas, no de sintaxis:

1. **Procedimiento E (aprobado):** las 10 policies legacy fueron confirmadas en vivo (§5.1); ejecutar sus `DROP POLICY` **seguidos del archivo 3.6 COMPLETO en UNA única corrida** del SQL Editor. Si 3.6 falla, los DROPs revierten junto con todo (sin ventana ni permanencia sin acceso).
2. **Vía de ejecución atómica:** SQL Editor completo o migración CLI; **NO** `psql` autocommit por sentencia.
3. **Interpretación posterior:** revisar salida, confirmar datos PC4/PC5 y clasificación real de PC1 (B-T1b/T2neg pueden quedar PENDIENTES por diseño), llenar `FASE3.6_INFORME.md` §5 y cerrar el GATE 3.6.