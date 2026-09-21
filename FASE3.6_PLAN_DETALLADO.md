# FASE 3.6 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Multiempresa · **Activación de ROW LEVEL SECURITY + políticas** sobre las tablas del negocio · Riesgo global ALTO

---

## 1. OBJETIVO

Activar **RLS** en las tablas sensibles y aplicar las políticas de autorización multiempresa usando `authz.empresas_autorizadas()` / `authz.es_super_admin()` (creadas en 3.2B, pobladas en 3.4):

- `SELECT` / `INSERT` / `UPDATE` / `DELETE` a nivel de fila: usuario solo ve/edita filas cuya `empresa_id` está en sus empresas autorizadas.
- `WITH CHECK` anti-escalamiento: filas que apunten a empresa no autorizada se rechazan incluso en INSERT/UPDATE.
- Tablas de autorización (`usuarios_sistema`, `usuario_empresas`, `roles`): lectura propia/super admin; escritura solo super admin (sin recursión).

**PUERTAS (obligatorias antes de activar):**
1. **FASE 3.1** verificada (JWT + fetcher autenticado; las RPC y consultas usan JWT real).
2. **FASE 3.4** completada: `usuario_empresas` poblada + super admin registrado + al menos **1 usuario de prueba** que demuestre lectura restringida.
3. **FASE 3.5** completada: la app ya filtra por empresa activa (para no "caerse" si algo queda fuera).

---

## 2. DIAGNÓSTICO (esquema y fuentes)

Referencias de `FASE3.2B` (políticas ya diseñadas §10.3-10.4):

- Páginas de política típicas:
```sql
CREATE POLICY p_<tabla>_select ON public.<tabla>
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY p_<tabla>_insert ON public.<tabla>
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY p_<tabla>_update ON public.<tabla>
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()))
  WITH CHECK (empresa_id IN (SELECT authz.empresas_autorizadas()));

CREATE POLICY p_<tabla>_delete ON public.<tabla>
  FOR DELETE TO authenticated
  USING (empresa_id IN (SELECT authz.empresas_autorizadas()));
```
- Catálogos con filas maestras (`cuentas_contables` con `empresa_id NULL`): `USING (empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))`.
- **Tablas de autorización SIN recursión** (`FASE3.2B §10.4`):
```sql
-- usuarios_sistema.SELECT: auth.uid() = auth_id OR authz.es_super_admin()
-- usuarios_sistema.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- usuario_empresas.SELECT: tiene fila con mi usuario OR authz.es_super_admin()
-- usuario_empresas.INSERT/UPDATE/DELETE: solo authz.es_super_admin()
-- roles.SELECT: authenticated; escritura solo super admin
```

---

## 3. DECISIONES DE DISEÑO

**D1 — Activación por RO/CLI en dos fases:** (a) primero `ALTER TABLE … ENABLE ROW LEVEL SECURITY` en las tablas con políticas verificadas y probadas con el usuario de prueba mediante transacciones con rollback; (b) solo tras demo OK se persiste. Fase 3.6 completa = RLS activada en TODAS las tablas objetivo.

**D2 — Rollback maestro:** `ALTER TABLE <t> DISABLE ROW LEVEL SECURITY` por tabla (decisión `FASE3A1 §14/§16`). RLS desactivada = acceso abierto (comportamiento pre-3.6).

**D3 — No recursión garantizada:** `usuarios_sistema`/`usuario_empresas`/`roles` NUNCA llaman a `empresas_autorizadas()` (usan `auth.uid()` y `es_super_admin()`); sin TRIGGER RLS recursivo (postgres noble). Se verifica con `WHERE` estático al crear.

**D4 — Super admin para administración:** solo super admin puede escribir en `usuarios_sistema`/`usuario_empresas`/`roles`; un usuario normal solo lee sus vínculos.

**D5 — Inventario de tablas:** se parte de la lista establecida (FASE3A1): las tablas operativas con `empresa_id` + catálogos + tablas de autorización. Se confirma el inventario real en PRE-CHECK (nunca inventado). Incluye `asientos_contables`, `asiento_lineas`, `movimientos_bancarios`, `cuentas_bancarias`, `cuentas_contables`, `facturas`, `cotizaciones`, `reservas`, `clientes`, `proveedores`, `empleados`, `contratos`, `pagos`, `pagos_recibidos`, `usuarios_sistema`, `usuario_empresas`, `roles`, entre otras (las que el índice real confirme).

---

## 4. PRE-CHECKS (owner, SOLO lectura)

- **PC1** — `authz.empresas_autorizadas()` / `authz.es_super_admin()` ejecutan correctas; `usuario_empresas` poblada (≥1 vínculo); super admin registrado.
- **PC2** — Inventario real de tablas objetivo (`pg_class` + `information_schema.tables`) y columnas `empresa_id` por tabla (para no crear políticas sobre tablas sin esa columna).
- **PC3** — Estado actual de RLS: `SELECT relname, relrowsecurity FROM pg_class …` — confirmar que **ninguna** tenga RLS activa todavía.
- **PC4** — No existen políticas previas sobre las tablas objetivo (evitar conflictos de nombre).
- **PC5** — Usuario de prueba disponible (email/uid) para validar lectura restringida.
- **PC6** — Baseline de datos: para cada tabla operativa, `count(*)` y `count(distinct empresa_id)`; y `count(*)` filtrando por la empresa del usuario de prueba.

---

## 5. MIGRACIÓN PROPUESTA (NO ejecutar; con aprobación)

```sql
-- 5.1 Habilitar RLS (por tabla; se ejecuta tras validar políticas en la tabla en cuestión)
ALTER TABLE public.asientos_contables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento_lineas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_bancarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_bancarias        ENABLE ROW LEVEL SECURITY;
-- ... (inventario real de PC2)

-- 5.2 Políticas (SELECT/INSERT/UPDATE/DELETE por tabla y rol authenticated) — patrón §2
-- 5.3 Políticas catálogos híbridos (NULL maestro o empresa autorizada): cuentas_contables
-- 5.4 Políticas tablas de autorización sin recursión (usuarios_sistema, usuario_empresas, roles)
```

- Idempotente: `CREATE POLICY IF NOT EXISTS`/`DROP POLICY IF EXISTS` previos + `ENABLE ROW LEVEL SECURITY` idempotente.
- Con aislación transaccional de la prueba: validar por tabla en subtransacciones `TZ001` antes del COMMIT de la fase (patrón 3.2D-R4/3.2E).

---

## 6. PRUEBAS TRANSACCIONALES DE ACEPTACIÓN (por tabla)

Con sesión del **usuario de prueba** (rol `authenticated`) vía RPC/consultas:

- **T1 (lectura restringida):** `count(*)` sobre tabla operativa con su `empresa_id` autorizada = baseline de esa empresa; con empresa ajena = **0**.
- **T2 (escritura):** INSERT/UPDATE con `empresa_id` ajeno → **error** (WITH CHECK); con empresa propia → permitido (denro de subtransacción revertida).
- **T3 (catálogo híbrido):** `cuentas_contables` muestra maestras (`NULL`) + propias; no las de otra empresa.
- **T4 (super admin):** el super admin puede escribir en tablas de autorización; un usuario normal NO.
- **T5 (sin recursión):** leer escritura tabla de autorización no dispara recursión; las consultas RPC responden sin error.
- Todo con rollback (nada se persiste) y GATE `t1_result` (patrón tz32d).

---

## 7. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| `relrowsecurity=true` en TODAS las tablas objetivo (PC2) | sí |
| Nº de políticas por tabla | ≥ esperado (SELECT/INSERT/UPDATE/DELETE donde aplique) |
| `pg_policies` sin duplicados / sin nombres colisionados | sí |
| Usuario de prueba: filas de empresa ajena | 0 en todas las tablas |
| INSERT/UPDATE ajeno | error para usuario normal, permitido para super admin |
| Sin recursión (`track_functions` / logs) | sin errores |
| Datos existentes | `count(*)` desde el rol super admin = inventario real (sin pérdida) |

**GATE:** DO que valida RLS en todas las tablas, nº de políticas y una muestra de lecturas/escrituras (usuario restringido + super admin). Fallo → `RAISE EXCEPTION 'GATE 3.6 BLOQUEO: …'`; éxito → `RAISE NOTICE 'GATE 3.6 OK: RLS activa en N tablas'`.

---

## 8. IDEMPOTENCIA / ROLLBACK

- **Idempotencia:** `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY IF NOT EXISTS` / pre-DROP de políticas existentes con validación previa.
- **Rollback:** `ALTER TABLE public.<tabla> DISABLE ROW LEVEL SECURITY;` por tabla (+ `DROP POLICY IF EXISTS` si se desea revertir por completo).

---

## 9. FRONTERAS EXPLÍCITAS (NO en 3.6)

1. **Filtros de app** — ya implementados en 3.5 (la app no se vuelve a tocar aquí salvo ajustes menores de rol).
2. **Reglas de negocio UI** (reversa, conciliados, `numero`, `concepto`) — FASE 3.7.
3. **Trigger de saldos** — FASE 3.8.
4. **Panel GRUPO C** — FASE 3.9.
5. **Autorización en Auth (provider)** — RLS cubre la capa Postgres; no se modifica Auth.

---

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Bloquear acceso legítimo (política mal escrita) | ALTO | Validación por tabla en subtransacciones + usuario de prueba + rollback `DISABLE RLS` |
| Recursión RLS | Alto | D3: tablas de autorización con `auth.uid()`/`es_super_admin()`, nunca `empresas_autorizadas()` |
| Tabla olvidada sin política (fuga) | Medio | PC2 inventario real + GATE `relrowsecurity=true` en todas |
| Prueba con usuario real tocando datos | Bajo | Todo en subtransacciones revertidas (`TZ001`) + patrón t1_result |
| Costo de las RPC por fila | Bajo | `empresas_autorizadas()` estable(es) y STABLE; pocas filas |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **PRE-FLIGHT owner:** PC1–PC6 (lecturas) + confirmación de las PUERTAS (3.1/3.4/3.5 cerradas).
3. **Escribir** `sql/migracion_fase_3_6.sql` (enable + políticas + pruebas subtransaccionales + GATE) y aprobar.
4. **Ejecutar ENTERO** como OWNER; pegando las salidas (para una segunda corrida, las pruebas corren de nuevo; RLS ya activa se valida de nuevo).
5. **Rollback disponible:** `DISABLE ROW LEVEL SECURITY` por tabla si fallara la demo.
6. **Cerrar FASE 3.6** y NO avanzar (3.7+) sin nueva aprobación.

---

## 12. ENTREGABLES

- `FASE3.6_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: `sql/migracion_fase_3_6.sql` + `FASE3.6_INFORME.md` (inventario de tablas/políticas y salidas de pruebas).

---

**ESTADO: PREPARADO PARA REVISIÓN — BLOQUEADO por las PUERTAS 3.1/3.4/3.5 (pendientes) y aprobación del usuario. Sin SQL ejecutado.**