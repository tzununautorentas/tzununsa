# FASE 3.6 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Multiempresa · **Activación de ROW LEVEL SECURITY + políticas** sobre las tablas del negocio · Riesgo global ALTO
> Revisión técnica **R3** incorporada (PUERTA 3.4, idempotencia de policies, separación pruebas OWNER/JWT, inventario dinámico, atomicidad, alcance)

---

## ⚠️ CAMBIOS DE LA REVISIÓN R3 (resumen)

1. **PUERTA 3.4** — Se elimina "1 usuario de prueba creado ad hoc". Se usan los usuarios reales autenticados existentes y sus vínculos reales en `usuario_empresas`. La "empresa ajena" se resuelve dinámicamente entre las **empresas existentes**; si el inventario no arroja una empresa real no autorizada para el usuario de prueba, las pruebas negativas quedan **pendientes** (se documentan) y **no se fabrican datos**.
2. **Idempotencia de policies** — Queda prohibido `CREATE POLICY IF NOT EXISTS`. Patrón obligatorio: `DROP POLICY IF EXISTS <tz36_nombre_conocido>` + `CREATE POLICY`. Un PC previo audita `pg_policies` por tabla: las políticas **desconocidas** (no nombradas `tz36_*`) bloquean la corrida (nunca se eliminan en silencio).
3. **Pruebas RLS** — Separación estricta en tres bloques: migración estructural (OWNER), pruebas funcionales con **JWT real del usuario `authenticated`** (vía REST/curl), y verificaciones estructurales finales (OWNER). Las pruebas simuladas `SET ROLE authenticated + request.jwt.claims` quedan solo como *smoke estructural* y **no** se presentan como evidencia de comportamiento de un usuario real.
4. **Inventario** — El SQL descubre dinámicamente las tablas reales de `public` y sus columnas (nada asumido del plan). Clasifica: negocio con `empresa_id`, autorización, catálogos híbridos (`empresa_id IS NULL` con filas maestras reales), globales/técnicas excluidas. Toda exclusión queda documentada en el informe.
5. **Atomicidad** — La migración estructural es una **única transacción implícita** (patrón 3.3/3.4): cualquier fallo revierte TODO (nada de activación parcial). `DISABLE ROW LEVEL SECURITY` es **solo rollback de emergencia** post-commit, nunca mecanismo normal de prueba.
6. **Alcance** — No se toca 3.7/3.8/3.9, ni Auth, ni frontend. Esta revisión **no detectó** incompatibilidad que exija cambios de app (los filtros de 3.5 + fetcher JWT de 3.1 son suficientes); queda como verificación (no cambio) confirmar que no hay consultas de datos pre-login en sesión anónima.

---

## 1. OBJETIVO

Activar **RLS** en las tablas sensibles y aplicar las políticas de autorización multiempresa usando `authz.empresas_autorizadas()` / `authz.es_super_admin()` (creadas en 3.2B, pobladas en 3.4):

- `SELECT` / `INSERT` / `UPDATE` / `DELETE` a nivel de fila: usuario solo ve/edita filas cuya `empresa_id` está en sus empresas autorizadas.
- `WITH CHECK` anti-escalamiento: filas que apunten a empresa no autorizada se rechazan incluso en INSERT/UPDATE.
- Tablas de autorización (`usuarios_sistema`, `usuario_empresas`, `roles`): lectura propia/super admin; escritura solo super admin (sin recursión).

**PUERTAS (obligatorias antes de activar):**
1. **FASE 3.1** cerrada ✅ — JWT + fetcher autenticado (las RPC y consultas usan JWT real).
2. **FASE 3.4** cerrada ✅ — `usuario_empresas` poblada con **vínculos reales** y super admin registrado.
3. **FASE 3.5** cerrada ✅ — la app filtra por empresa activa (no se "cae" si algo queda fuera).

**Requisito R3 de PUERTA 3.4:** NO se crean datos ficticios ni usuarios adicionales para probar multiempresa. La validación usa los usuarios autenticados reales existentes y sus vínculos reales; la "empresa ajena" es una empresa existente no autorizada para el usuario de prueba (si no existe en el entorno, se documenta como pendiente).

---

## 2. DIAGNÓSTICO (esquema y fuentes)

Referencias de `FASE3.2B` (políticas ya diseñadas §10.3-10.4):

- Páginas de política típicas:
```sql
CREATE POLICY tz36_<tabla>_select ON public.<tabla>
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY tz36_<tabla>_insert ON public.<tabla>
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY tz36_<tabla>_update ON public.<tabla>
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()))
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY tz36_<tabla>_delete ON public.<tabla>
  FOR DELETE TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));
```
- Catálogos híbridos con filas maestras (`cuentas_contables` con `empresa_id NULL`): `USING/WITH CHECK (empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))`.
- **Tablas de autorización SIN recursión** (`FASE3.2B §10.4`):
```sql
-- usuarios_sistema.SELECT: auth.uid() = auth_id OR authz.es_super_admin()
-- usuarios_sistema.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- usuario_empresas.SELECT: existe vínculo con mi usuario OR authz.es_super_admin()
-- usuario_empresas.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- roles.SELECT: authenticated; escritura solo super admin
```
Nota: las RPC `authz.*` no están expuestas a REST (fuera de alcance) pero **sí se ejecutan dentro de Postgres** en las policies, que es lo que 3.6 necesita.

---

## 3. DECISIONES DE DISEÑO

**D1 — Activación atómica (R3, sustituye dos fases con rollback):** la migración estructural (ENABLE + policies + GATE estructural) se ejecuta como **UNA transacción implícita**. Si cualquier policy/check falla → `RAISE EXCEPTION` revierte **todo el lote**; no existe estado intermedio de RLS parcialmente activo. Nada se persiste hasta que el lote completo termina sin error. El `DISABLE ROW LEVEL SECURITY` queda SOLO como rollback de emergencia post-commit (R3), no como mecanismo de iteración normal.

**D2 — Rollback maestro (emergencia):** `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY` por tabla (decisión `FASE3A1 §14/§16`). Único uso legítimo: revertir una corrida YA confirmada si las pruebas funcionales con JWT real revelaran un problema. No forma parte del flujo normal de prueba.

**D3 — Sin recursión garantizada:** `usuarios_sistema`/`usuario_empresas`/`roles` NUNCA llaman a `empresas_autorizadas()` (usan `auth.uid()` y `es_super_admin()`); sin TRIGGER RLS recursivo. Se verifica con `WHERE`/definición estática al crear.

**D4 — Super admin para administración:** solo super admin puede escribir en `usuarios_sistema`/`usuario_empresas`/`roles`; un usuario normal solo lee sus vínculos.

**D5 — Inventario dinámico (R3, ya no lista fija):** el SQL descubre las tablas reales de `public` (`information_schema.tables`/`columns`/`pg_class`) y clasifica en el momento:
- **Negocio con `empresa_id`** → RLS ON + 4 policies (`tz36_*`).
- **Autorización** → políticas sin recursión (D3/D4).
- **Catálogos híbridos** → detector: `empresa_id` nullable **y** `count(empresa_id IS NULL) > 0` → `USING/WITH CHECK (IS NULL OR autorizada)`.
- **Globales/técnicas excluidas** → se listan y se documenta el motivo de cada exclusión en el informe.
La lista del plan (asientos_contables, asiento_lineas, movimientos_bancarios, cuentas_bancarias, cuentas_contables, facturas, cotizaciones, reservas, clientes, proveedores, empleados, contratos, pagos, pagos_recibidos, gastos, mantenimientos, vehiculos, servicios, emisores, ubicaciones_personalizadas, usuarios_sistema, usuario_empresas, roles) es **referencia inicial, no definitiva**: manda el descubrimiento dinámico.

---

## 4. PRE-CHECKS (owner, SOLO lectura) — los que el SQL ejecutará

- **PC0** — `authz.empresas_autorizadas()` y `authz.es_super_admin()` existen y compilan; `usuario_empresas` con ≥1 vínculo real; existe super admin real registrado.
- **PC1** — Inventario dinámico (R3/C): todas las tablas de `public`, sus columnas, presencia/nullability de `empresa_id`, y clasificación (negocio / autorización / híbrido / excluida) con `count(*)` y `count(empresa_id IS NULL)` por tabla cuando aplique.
- **PC2** — Estado actual RLS: `pg_class.relrowsecurity` — **ninguna** tabla objetivo con RLS activa aún (si ya lo está por corrida previa, se valida como re-ejecución, no se duplica).
- **PC3** — **Auditoría de policies (R3):** `pg_policies` por tabla objetivo. Políticas `tz36_*` conocidas → manejables (DROP+CREATE idempotente). Cualquier política **desconocida** → `RAISE EXCEPTION` mencionando tabla y policy (bloquea; jamás se borra en silencio).
- **PC4** — Usuarios de prueba **reales** (R3): emails/UIDs existentes con rol en `roles` del vínculo real: `galheroa@gmail.com` (uid `6800b0a2-ada9-40f5-a4a9-6e531a8c6cd4`, rol super_admin) y `vanessamgh@gmail.com` (uid `b9e1dda6-05d2-4e31-bce4-1c73210c09f4`, rol admin). No se crean usuarios.
- **PC5** — Inventario de empresas reales: `empresas` (id, nombre). Determina si existe **empresa real no autorizada** para el usuario de prueba (para T1neg/T2neg). Si no existe → pruebas negativas **pendientes** (se documentan; no se fabrican).
- **PC6** — Baseline de datos: por tabla operativa `count(*)` y `count(distinct empresa_id)`; y `count(*)` filtrado por la empresa autorizada del usuario de prueba (expectativa de lo que el usuario DEBE ver).
- **PC7** — Compatibilidad app (solo verificación, sin cambio): confirmar por revisión de código que **no hay consultas de datos en sesión anónima** antes del login (no las hay: el login es UI + Auth). Sin esto no se rompe el login con RLS.

---

## 5. MIGRACIÓN ESTRUCTURAL PROPUESTA (NO ejecutar; con aprobación)

```sql
-- 5.0 Audit PC0–PC7 (bloqueo con RAISE EXCEPTION ante cualquier fallo)
-- 5.1 Para cada tabla de negocio/híbrido/autorización (inventario dinámico PC1):
--       DROP POLICY IF EXISTS tz36_<tabla>_{select,insert,update,delete};  -- solo si tz36_* ya existe (PC3 validó que lo demás bloquea)
--       CREATE POLICY tz36_<tabla>_<cmd> ... (patrón §2, rol authenticated);
-- 5.2 ENABLE ROW LEVEL SECURITY per tabla (idempotente);
-- 5.3 GATE ESTRUCTURAL (STR) dentro de la misma transacción (validación pg_class/pg_policies + smoke estructural).
--     Fallo → RAISE EXCEPTION → rollback íntegro (sin activación parcial).
```

- **Idempotencia R3:** solo `DROP POLICY IF EXISTS tz36_*` + `CREATE POLICY` (PostgreSQL **no** soporta `CREATE POLICY IF NOT EXISTS`). Re-ejecución: la auditoría PC3 acepta nuestras `tz36_*` y bloquea cualquier política desconocida.
- **Atomicidad R3:** un solo lote-transacción. Nada de subtransacciones de prueba dentro de la migración para "aislar" activación: la funcionalidad se prueba DESPUÉS con JWT real (§6).

---

## 6. ESTRATEGIA DE PRUEBAS — OWNER vs JWT REAL authenticated (R3)

Separación estricta en tres bloques. Regla R3: **ninguna prueba ejecutada como OWNER se presenta como evidencia de comportamiento de un usuario `authenticated`.**

### Bloque A — Migración estructural (OWNER, dentro de la transacción, §5)
- Produce las políticas y activa RLS de forma atómica.
- **STR-1** RLS `relrowsecurity=true` en todas las tablas objetivo.
- **STR-2** `pg_policies`: solo `tz36_*`, sin duplicados ni colisiones de nombres.
- **STR-3** Funciones `authz.*` válidas; sin recursión en las definiciones emitidas (revisión estática).
- **STR-4** Baselines OWNER (bypass RLS): counts por tabla y por empresa del usuario de prueba (expectativas).
- **STR-5 (smoke estructural, NO es evidencia)** `SET LOCAL ROLE authenticated` + `request.jwt.claims` con un claim de prueba: solo comprueba que la política **no revienta sintácticamente**. **No** se registra como comportamiento real de usuario en el informe.

### Bloque B — Pruebas funcionales con JWT REAL del usuario (REST/curl o cliente autenticado, post-commit)
Ejecutadas por el owner o el usuario con el **access_token real** de cada cuenta; nunca vía SQL Editor como OWNER.

| Test | Cómo | Esperado |
|---|---|---|
| **T1a (lectura propia)** | vanessa JWT: `GET /rest/v1/<tabla>?select=*` (empresa autorizada) | = baseline de SU empresa (STR-4) |
| **T1b (lectura ajena)** | vanessa JWT con empresa ajena existente (PC5) | **0 filas** (o **pendiente** si no existe empresa ajena real) |
| **T2pos (escritura propia)** | vanessa JWT: INSERT/UPDATE con empresa autorizada (fila temporal, luego DELETE) | **201/2xx** |
| **T2neg (escritura ajena)** | vanessa JWT: INSERT/UPDATE con empresa ajena | **403/42501** (WITH CHECK); pendiente si no hay empresa ajena real |
| **T3 (catálogo híbrido)** | vanessa JWT: `cuentas_contables` (u híbrido detectado) | masters (`NULL`) + propias; **0** de otra empresa |
| **T4 (autorización)** | vanessa JWT vs galheroa JWT sobre `usuarios_sistema`/`usuario_empresas` | vanessa: solo su lectura; escritura **error**. galheroa (super_admin): escritura permitida |
| **T5 (sin recursión)** | galheroa JWT: consultas authz + lectura tablas autorización | responden sin error de recursión |

Convención: las pruebas **B** se ejecutan con datos reales del entorno; cualquier escritura temporal se elimina por el propio usuario (su policy DELETE lo permite). Nada ficticio.

### Blo que C — Verificaciones estructurales finales (OWNER, después de B)
- **POST-1** `relrowsecurity=true` en todas las tablas objetivo + policy count + sin duplicados.
- **POST-2** Counts desde super admin = inventario real (sin pérdida de datos).
- **POST-3** Estado del backup/evidencias y consolidado para `FASE3.6_INFORME.md`.

**GATE doble:** `GATE-ESTRUCTURAL` (Bloque A, antes del commit) + cierre formal solo con las evidencias B (JWT real) y C. Si B (negativos) no se puede ejecutar (sin empresa ajena real), se registra como **pendiente multiempresa** (no fabricar datos), igual que en 3.5.

---

## 7. POST-CHECKS y GATE DE CIERRE

| Verificación | Rol | Esperado |
|---|---|---|
| `relrowsecurity=true` en TODAS las tablas objetivo | OWNER | sí |
| `pg_policies` solo `tz36_*`, sin duplicados/collisiones | OWNER | sí |
| T1a/T2pos/T3/T4/T5 con JWT real | authenticated | PASS |
| T1b/T2neg con empresa ajena real | authenticated | 0 filas / error, **o pendiente** si no hay empresa ajena |
| Escritura admin solo super admin | authenticated | vanessa error, galheroa OK |
| Sin recursión | authenticated/USER | sin errores |
| Datos existentes | OWNER (super admin) | `count(*)` = inventario real (sin pérdida) |

**GATE:** `GATE-ESTRUCTURAL` (DO en la transacción; fallo → `RAISE EXCEPTION`) + evidencias funcionales B (JWT real) + `POST` C. Éxito → `RAISE NOTICE 'GATE 3.6 OK: RLS activa en N tablas, pruebas JWT reales PASS'`.

---

## 8. IDEMPOTENCIA / ROLLBACK (R3)

- **Idempotencia policies:** `DROP POLICY IF EXISTS tz36_<tabla>_<cmd>` + `CREATE POLICY` (nunca `IF NOT EXISTS`). La auditoría PC3 previa bloquea ante políticas desconocidas (no se borran en silencio).
- **ENABLE/DISABLE ROW LEVEL SECURITY:** idempotentes (re-ejecución válida).
- **Rollback de emergencia (post-commit):** `ALTER TABLE public.<tabla> DISABLE ROW LEVEL SECURITY;` (+ `DROP POLICY IF EXISTS tz36_*` si se quiere revertir por completo). **Uso único de emergencia** (R3), no como mecanismo normal de prueba.

---

## 9. FRONTERAS EXPLÍCITAS (NO en 3.6) — confirmado en R3

1. **Filtros de app** — ya implementados en 3.5; R3 confirmó que **no se requieren cambios de frontend** para soportar RLS (fetcher JWT 3.1 + filtros 3.5 + login sin consultas anónimas). Cero cambios de app en 3.6.
2. **Reglas de negocio UI** (reversa, conciliados, `numero`, `concepto`) — FASE 3.7 (NO tocar aquí).
3. **Trigger de saldos** — FASE 3.8 (NO tocar aquí).
4. **Panel GRUPO C** — FASE 3.9 (NO tocar aquí).
5. **Auth** — no se modifica; RLS cubre la capa Postgres.
6. RLS en estos momentos filtra a nivel app (3.5); 3.6 añade la capa servidor sin cambiar UI.

---

## 10. RIESGOS (revisión R3)

| Riesgo | Nivel | Mitigación (R3) |
|---|---|---|
| Bloquear acceso legítimo (política mal escrita) | ALTO | Migración ÚNICA transacción (nada parcial) + pruebas funcionales con JWT real pre-cierre + `DISABLE RLS` SOLO emergencia |
| Recursión RLS | Alto | D3: tablas de autorización con `auth.uid()`/`es_super_admin()`, nunca `empresas_autorizadas()`; verificación estática STR-3 |
| Tabla olvidada sin policy (fuga) | Medio | Inventario dinámico PC1 + GATE `relrowsecurity=true` en todas |
| Policy desconocida borrada en silencio | Medio | PC3 bloquea cualquier policy no `tz36_*` (R3) |
| Prueba como OWNER tratada como evidencia de `authenticated` | Medio | Bloques A/B/C separados; evidencia funcional SOLO con JWT real (R3) |
| No existe empresa ajena real | Bajo | T1b/T2neg pasan a **pendiente** documentado; no se fabrican datos (R3) |
| Costo de RPC por fila | Bajo | `empresas_autorizadas()` STABLE; pocas filas |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión R3 de este plan** (aprobación del usuario).
2. **PRE-FLIGHT owner:** PC0–PC7 (lecturas; inventario dinámico) + confirmación PUERTAS 3.1/3.4/3.5.
3. **Escribir** `sql/migracion_fase_3_6.sql` (auditoría + inventario + policies `tz36_*` + ENABLE + GATE-ESTRUCTURAL) y aprobar.
4. **Ejecutar ENTERO** como OWNER (una transacción; pegar salidas).
5. **Pruebas funcionales B** con JWT real de vanessa/galheroa (REST/curl) + **POST-checks C**.
6. Consolidar en `FASE3.6_INFORME.md` y **cerrar FASE 3.6** (NO avanzar a 3.7+ sin aprobación).

---

## 12. ENTREGABLES

- `FASE3.6_PLAN_DETALLADO.md` (este documento, revisión R3) — plan.
- Tras aprobación: `sql/migracion_fase_3_6.sql` + `FASE3.6_INFORME.md` (inventario real clasificado y exclusiones documentadas, policies emitidas, salidas A/B/C, pendientes).

---

**ESTADO: REVISIÓN R3 COMPLETADA — LISTO PARA GENERAR `sql/migracion_fase_3_6.sql`. Sin SQL ejecutado. Pendiente aprobación del usuario.**