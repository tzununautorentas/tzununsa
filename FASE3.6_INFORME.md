# FASE 3.6 — INFORME (BORRADOR PRE-EJECUCIÓN)

> RLS multiempresa · **POLICIES `tz36_*` + ENABLE ROW LEVEL SECURITY en `public`** (servidor)
> Estado: **GENERADO SQL — PENDIENTE EJECUCIÓN COMO OWNER** · GATE 3.6 NO CERRADO

---

## 1. RESUMEN

FASE 3.6 endurece la tenencia de datos multiempresa a nivel de **base de datos** con Row Level Security, cerrando la brecha dejada por FASE 3.5 (que filtra a nivel de app):

- Inventario **dinámico** de tablas `public` (sin lista asumida) clasificando negocio / híbrido / autorización / excluida.
- Políticas `DROP+CREATE` idempotentes con prefijo `tz36_` sobre tablas de negocio e híbridas (`authz.empresas_autorizadas()`) y tablas de autorización sin recursión (`auth.uid()` / `authz.es_super_admin()`).
- `ENABLE ROW LEVEL SECURITY` y **GATE ESTRUCTURAL** dentro de una única transacción implícita atómica del SQL Editor: cualquier invariante rota revierte todo el lote.
- Decisiones R3 (revisión del usuario sobre el plan) aplicadas íntegramente; **sin datos fabricados**, sin FASE 3.7/3.8/3.9, sin cambios de Auth ni de frontend.
- **No ejecutado todavía**: la ejecución es manual del owner en Supabase (sección 5 vacía hasta entonces).

---

## 2. DECISIONES R3 APLICADAS (plan aprobado)

| # | Corrección R3 | Implementación en `sql/migracion_fase_3_6.sql` |
|---|---|---|
| 1 | Usuarios reales de prueba; sin datos ficticios | `PC4`: galheroa (super_admin) presente por rol; vanessa (admin) con vínculo activo real a la empresa de prueba. |
| 2 | Idempotencia: `DROP POLICY IF EXISTS` + `CREATE POLICY` | Secciones 2.1/2.2. PG no admite `CREATE POLICY IF NOT EXISTS`. |
| 3 | **PC3 bloquea** policies desconocidas (jamás borrado silencioso) | PC3 audita TODO `public`; GATE/V3 re-auditan. |
| 4 | Bloques A (estructura OWNER) / B (funcional JWT real) / C (verificación final) | Sección 1+4 = A; **Sección 6** = guía B/C comentada (post-commit, JWT real). |
| 5 | Inventario dinámico, no la lista del plan | PC1 recorre `pg_class` + `information_schema` en el momento. |
| 6 | Transacción única atómica; `DISABLE RLS` solo emergencia | Sin `BEGIN/COMMIT/ROLLBACK`; Sección 7 solo comentada. |
| 7 | Sin cambios de alcance (3.7/3.8/3.9, Auth, frontend) | Verificado: solo policies + ENABLE + evidencia. Smoke STR-5 comentado y rotulado como NO evidencia funcional. |

---

## 3. DISEÑO TÉCNICO

### 3.1 Regla canónica RLS
- **negocio**: `empresa_id IN (SELECT authz.empresas_autorizadas())`
- **híbrido**: `(empresa_id IS NULL OR empresa_id IN (SELECT authz.empresas_autorizadas()))` — aplicado **solo si** PC1 detecta filas con `empresa_id IS NULL`.
- **autorización** (sin recursión; nunca `empresas_autorizadas()`):
  - `usuarios_sistema` → select `auth.uid() = auth_id OR authz.es_super_admin()`; escritura solo super_admin.
  - `usuario_empresas` → select `EXISTS(...usuarios_sistema us WHERE us.id = usuario_id AND us.auth_id = auth.uid()) OR es_super_admin()`; escritura solo super_admin.
  - `roles` → select `true` (authenticated); escritura solo super_admin.

> `authz.es_super_admin()` / `authz.empresas_autorizadas()` son `SECURITY DEFINER` con `search_path` fijo (SQL FASE 3.2B), verificadas y sin recursión dentro de policies.

### 3.2 Clasificación (reglas exactas, determinadas en corrida)
1. **autorización**: `usuarios_sistema`, `usuario_empresas`, `roles` (por nombre, antecede a `empresa_id`).
2. **negocio**: tiene `empresa_id` y `count(empresa_id IS NULL) = 0`.
3. **híbrido**: tiene `empresa_id` y `count(empresa_id IS NULL) > 0`.
4. **excluida**: sin `empresa_id`; motivos documentados en `tz36_inventario` (global/técnica o evidencia F3.3/F3.6).

### 3.3 Atomicidad e idempotencia
- Ejecución COMPLETA del archivo en una única corrida del SQL Editor (protocolo simple → transacción implícita única de PostgreSQL); cualquier `RAISE EXCEPTION` revierte policies + ENABLE + evidencia. La garantía "todo o nada" depende de esa única corrida; `psql` en autocommit por sentencia NO la preserva.
- Re-ejecución válida: `DROP+CREATE` de `tz36_*`; PC2 acepta RLS OFF-total o ON-total (regla R3) con **excepción legacy**: `usuarios_sistema` y `ubicaciones_personalizadas` se aceptan en cualquier estado (RLS ON preexistente documentado).
- Evidencia `public.tz36_inventario` anti-sobrescritura (no se regenera si existe).

---

## 4. HALLAZGOS DEL REPOSITORIO (revisión estática, previos a corrida)

| Hallazgo | Origen | Consecuencia en la corrida |
|---|---|---|
| `usuarios_sistema` con RLS **YA ACTIVA** + 4 policies `USING/WITH CHECK true` | `sql/configuracion_roles_series.sql` | PC3 **BLOQUEA** hasta resolución humana manual (ver §6). |
| `ubicaciones_personalizadas` con RLS **YA ACTIVA** + 6 policies `USING/WITH CHECK true` (3 "para usuarios autenticados" + 3 duplicadas sin "para"; confirmadas en vivo 2026-09-28) | `sql/crear_ubicaciones_personalizadas.sql` (+3 duplicadas en BD real) | PC3 **BLOQUEA** hasta resolución humana manual (ver §6). |
| `usuario_empresas.usuario_id` uuid vs `usuarios_sistema.id` bigint en el archivo legacy | `migracion_fase_3_2b.sql` vs `configuracion_roles_series.sql` | Debe verificarse en la BD real; si no compara, PC0/policies fallan y revierte (seguro). |
| GATE anti-recursión usaba `policyname`/`tablename` (inexistentes en catálogo `pg_policy`) | revisión previa | **Bug corregido**: ahora `p.polname`/`c.relname`. |

---

## 5. RESULTADOS DE EJECUCIÓN — **PENDIENTE (corrida OWNER)**

> Esta sección se completa tras ejecutar `sql/migracion_fase_3_6.sql` ENTERO como OWNER en Supabase y pegar salidas.

- [ ] PE0: salidas de PC0–PC7 (NOTICEs) — *pendiente*
- [ ] Inventario real clasificado (negocio / híbrido / autorización / excluida) — *pendiente*
- [ ] Grids V1 (RLS activa) / V2 (policies por tabla) / V3 (sin policies desconocidas) — *pendiente*
- [ ] `GATE-ESTRUCTURAL 3.6 OK` (o excepción con motivo) — *pendiente*
- [ ] `tz36_inventario` materializado — *pendiente*
- [ ] Bloque B (funcional, JWT real, post-commit) — *pendiente* (ver Sección 6 del SQL: B-T1a/T1b, T2pos/T2neg, T3, T4, T5)
- [ ] Bloque C (verificación final OWNER) — *pendiente*
- [ ] `npm run build` (No aplica a 3.6: sin cambios de frontend) 

---

## 6. PUNTOS DE REVISIÓN HUMANA ANTES DE EJECUTAR (entregable E del SQL)

1. **Policies legacy** (bloquean PC3). Confirmadas en vivo 2026-09-28: **10 en total** (4 en `usuarios_sistema` + 6 en `ubicaciones_personalizadas` — las 3 duplicadas sin "para" existen en la BD real aunque el repo solo definía las 3 "para"). Eliminarlas primero como OWNER (nunca se borran en silencio), junto con el archivo 3.6 en la misma corrida:
   ```sql
   DROP POLICY "Lectura para autenticados"        ON public.usuarios_sistema;
   DROP POLICY "Insercion para autenticados"      ON public.usuarios_sistema;
   DROP POLICY "Actualizacion para autenticados"  ON public.usuarios_sistema;
   DROP POLICY "Eliminacion para autenticados"    ON public.usuarios_sistema;
   DROP POLICY "Lectura para usuarios autenticados"      ON public.ubicaciones_personalizadas;
   DROP POLICY "Insercion para usuarios autenticados"    ON public.ubicaciones_personalizadas;
   DROP POLICY "Eliminacion para usuarios autenticados"  ON public.ubicaciones_personalizadas;
   DROP POLICY "Lectura usuarios autenticados"           ON public.ubicaciones_personalizadas;
   DROP POLICY "Insercion usuarios autenticados"         ON public.ubicaciones_personalizadas;
   DROP POLICY "Eliminacion usuarios autenticados"       ON public.ubicaciones_personalizadas;
   ```
2. **RLS legacy ya activa**: aceptada por PC2 en las 2 tablas mencionadas (excepción documentada).
3. **galheroa**: no exige vínculo (escala por rol); verificar que `authz.es_super_admin()` le responde `true`.
4. **vanessa**: debe tener vínculo activo hacia `adc5f324-a108-49ad-875c-779afe3b9f7f` (PC4 bloquea si no).
5. **Tipos**: comparable `usuario_empresas.usuario_id` ↔ `usuarios_sistema.id` en la BD real.
6. **Diseño**: híbridos permiten INSERT de maestras (`empresa_id IS NULL`) a cualquier autenticado; negocio permite UPDATE/DELETE de la propia empresa. Endurecimientos por tabla = fuera de alcance 3.6.
7. **Empresa activa** `adc5f324…` se usa solo para baselines (`filas_empresa_act`), no en la lógica de policies.
8. **Pruebas negativas multiempresa** (T1b/T2neg): PENDIENTES si PC5 no detecta empresa ajena real (no se fabrica).

---

## 7. COMPROBACIÓN ESTÁTICA REALIZADA (sin ejecutar contra Supabase)

Entorno sin motor PG local (sin `psql`/`docker`); validación estática del archivo:

- 13 bloques `DO $$` balanceados / `END $$`; 0 `BEGIN/COMMIT/ROLLBACK` explícitos.
- `DROP POLICY IF EXISTS` : `CREATE POLICY` 1:1 en Secciones 2.1/2.2.
- `LIKE 'tz36\_%'` con escape de underscore correcto.
- `format('%I'/'%L')`, `count(*) FILTER`, loops record/explícitos correctos.
- **Bug corregido**: referencias a `pg_policy.policyname/tablename` (no existen) → `p.polname`/`c.relname`.
- 24 `RAISE EXCEPTION` de bloqueo en pre-checks y GATE.

> El primer parse real ocurre en Supabase al ejecutar; por atomicidad, cualquier error revierte todo.

---

## 8. POLICIES `tz36_*` A GENERAR

Para cada tabla negocio/híbrido `T` del inventario dinámico → `tz36_T_select`, `tz36_T_insert`, `tz36_T_update`, `tz36_T_delete`.
Fijas (12): `tz36_{usuarios_sistema,usuario_empresas,roles}_{select,insert,update,delete}`.

---

## 9. EVIDENCIA Y SEGUIMIENTO

- SQL de migración: `sql/migracion_fase_3_6.sql` (único artefacto de esta fase; no se ejecutó).
- Inventario clasificado persistido: `public.tz36_inventario` (post-corrida).
- Documento de diseño: `FASE3.6_PLAN_DETALLADO.md` (Revisión R3).

---

**ESTADO: SQL GENERADO Y REVISADO (20 condiciones R3). EJECUCIÓN PENDIENTE — la hará el usuario como OWNER en Supabase.**
**GATE 3.6: NO CERRADO.** Tras ejecutar y pegar salidas, se llena §5, se redactan evidencias definitivas y se cierra el GATE (commit si se solicita).