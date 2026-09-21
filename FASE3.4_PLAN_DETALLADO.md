# FASE 3.4 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Multiempresa · **Población real de usuarios** → `usuarios_sistema` + `usuario_empresas` · **PUERTA DURA de FASE 3.6 (RLS)**

---

## 1. OBJETIVO

Poblar la identidad y los vínculos usuario↔empresa↔rol con la **lista real de usuarios** (negocio), de modo que `authz.empresas_autorizadas()` y `authz.es_super_admin()` (esquema creado en 3.2B) dejen de devolver vacío/false y FASE 3.6 (RLS) pueda activarse con al menos un usuario que demuestre lectura restringida.

**Puerta dura:** la RLS (3.6) **NO** se activa sin esta fase completada (decisión `FASE3A1 §16`: "Activación RLS sin usuario de prueba ❌ NO APROBADO").

---

## 2. DIAGNÓSTICO (esquema y datos)

Estructura ya instalada en 3.2B (no se recrea):

- `authz` schema; `usuario_empresas(usuario_id uuid FK→usuarios_sistema.id ON DELETE CASCADE, empresa_id uuid FK→empresas.id, rol_id integer FK→roles.id, activo bool)` + índices `idx_ue_empresa`, `idx_ue_usuario`.
- `authz.empresas_autorizadas()` (REVOKE PUBLIC + GRANT authenticated) — devuelve solo empresas con vínculo `activa`.
- `authz.es_super_admin()` — (1) super_admin en alguna empresa vía `usuario_empresas`; (2) fallback legacy a `usuarios_sistema.rol_id` SOLO mientras el usuario no tenga vínculos.
- Índices únicos: `uq_us_auth(auth_id)`, `uq_us_email(lower(email))`.
- Estado actual: `usuarios_sistema` = 0 filas, `usuario_empresas` = 0 filas.
- `auth.users` (Supabase Auth): fuente real de identidades (`auth_id` = `auth.uid()`).

Hechos de diseño (`FASE3.2B §5-8`): la autorización se resuelve SIEMPRE desde `usuario_empresas`; `usuarios_sistema.empresa_id`/`rol_id` quedan como compatibilidad legacy; fallback por usuario mientras no exista vínculo.

---

## 3. DECISIONES DE DISEÑO

**D1 — Fuente de identidad:** para cada usuario real se crea/sincroniza la fila `usuarios_sistema` espejo de `auth.users`, usando `auth_id` (único) y conservando `email` como clave humana de mapeo. Reconciliación: los `auth.users` existentes que aún no tienen espejo se registran; puede existir un usuario registrado en Auth sin rol/sin empresa → se decide (rol por defecto o solo lectura).

**D2 — Mapeo email → empresa → rol es ENTRADA DE NEGOCIO:** se muestra el mapeo propuesto ANTES de aplicar (tabla: email → empresas con rol y `activo`). El owner aprueba fila por fila o el conjunto; nada se infiere.

**D3 — Rollback limpio:** al tratarse SOLO de filas en dos tablas de autorización, el rollback es `TRUNCATE usuario_empresas; TRUNCATE usuarios_sistema;` (ambas vacías hoy; se verifica en pre-check que así siga). No toca `auth.users` ni `empresas` ni `roles`.

**D4 — Super admin registrado:** se identifica expresamente al menos 1 usuario super_admin (global o por empresa) para garantizar que `es_super_admin()` devuelva `true` para él (hoy `false` porque todo está vacío — R1 de 3.2B).

**D5 — No alterar `auth.users`:** solo lectura (listar UIDs/emails) para construir el mapa; se inserta únicamente en `usuarios_sistema`/`usuario_empresas`.

---

## 4. PRE-CHECKS (owner, SOLO lectura; el script se detiene si uno es bloqueante)

- **PC1** — Estructura authz presente (tabla + 2 funciones + 2 índices únicos); `count(usuarios_sistema)=0` y `count(usuario_empresas)=0` (sin restos).
- **PC2** — Inventario `auth.users`: email + uid + `created_at` (para mapear con la lista real). Confirmar coherencia: cada email de la lista existe en Auth (o se marca como pendiente de registro).
- **PC3** — `roles`: inventario de `roles` (id, nombre, permisos jsonb) para asignar `rol_id` correcto.
- **PC4** — `empresas`: inventario (id, nombre) para asignar `empresa_id`.
- **PC5** — Validación del mapeo propuesto: fixtures en tabla temporal (email, empresa_id, rol_id, activo) verificados contra los `id` reales de `empresas`/`roles` y contra `auth.users` (todos los emails existen). NUNCA `id` inventados.
- **PC6** — Seguridad: duplicados esperados (un email en varias empresas es válido por diseño N:M; pero `(usuario,empresa)` no duplica) y unicidad de `auth_id`/`email` en `usuarios_sistema` post-merge.

---

## 5. MIGRACIÓN PROPUESTA (NO ejecutar; con aprobación expresa del mapeo)

```sql
-- 5.1 sincronizar espejo usuarios_sistema desde auth.users (para los emails de la lista aprobada; insert/update idempotente)
INSERT INTO public.usuarios_sistema (auth_id, email, nombre, activo)
SELECT au.id, au.email, coalesce(au.raw_user_meta_data->>'nombre', au.email), true
  FROM auth.users au
 WHERE au.email = ANY(<emails aprobados>)
   AND NOT EXISTS (SELECT 1 FROM public.usuarios_sistema us WHERE us.auth_id = au.id)
ON CONFLICT DO NOTHING;

-- 5.2 poblar vínculos (mapeo aprobado)
INSERT INTO public.usuario_empresas (usuario_id, empresa_id, rol_id, activo)
SELECT us.id, m.empresa_id, m.rol_id, m.activo
  FROM (VALUES ...) AS m(email, empresa_id, rol_id, activo)
  JOIN public.usuarios_sistema us ON lower(us.email) = lower(m.email)
ON CONFLICT DO NOTHING;
```

- Idempotente: segundas corridas solo aplican diferencias del mapeo aprobado.
- Determinado por las tablas de autorización (`ON CONFLICT DO NOTHING` sobre `(usuario_id, empresa_id)` si existe constraint, o guarda con `NOT EXISTS`).

---

## 6. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| `count(usuarios_sistema)` | = nº de usuarios únicos del mapeo |
| `count(usuario_empresas)` | = nº de vínculos (`(usuario,empresa)` sin duplicados) |
| Cada `auth_id` único y cada email único | `uq_us_auth` / `uq_us_email` no fallan |
| `(usuario, empresa)` sin duplicados | `count(*) = count(distinct (usuario_id, empresa_id))` |
| `authz.empresas_autorizadas()` para un usuario con vínculo | devuelve SUS empresas (vía RPC con sesión real) |
| `authz.es_super_admin()` para el super admin aprobado | `true` |
| Fallback legacy | para usuario SIN vínculos sigue leyendo `usuarios_sistema.rol_id` |
| Interdicción: datos ajenos | `usuarios_sistema` / `empresas` / `roles` no modificados (solo lecturas para mapeo) |

**GATE** (DO posterior, transacción propia): valida conteos, unicidades y que las funciones devuelvan lo esperado para una muestra (incluido un usuario restringido y el super admin). Fallo → `RAISE EXCEPTION 'GATE 3.4 BLOQUEO: …'`; éxito → `RAISE NOTICE 'GATE 3.4 OK: …'`.

---

## 7. IDEMPOTENCIA

- La migración es **idempotente** sobre `ON CONFLICT DO NOTHING`/`NOT EXISTS` (re-corrida no duplica).
- El mapeo aprobado se versiona (archivo de texto en el informe) para trazabilidad; cambiarlo requiere nueva aprobación.

---

## 8. ROLLBACK

```sql
TRUNCATE TABLE public.usuario_empresas;
TRUNCATE TABLE public.usuarios_sistema;
```

- Solo filas de estas 2 tablas; `auth.users`, `empresas`, `roles` intactos. Verificar `count=0` tras truncate.

---

## 9. FRONTERAS EXPLÍCITAS (NO en 3.4)

1. **RLS / políticas** — FASE 3.6 (puerta: 3.4 completada + demo de lectura restringida).
2. **`auth.users`** — ninguna escritura/modificación.
3. **`empresas` / `roles`** — solo lectura.
4. **Fallback legacy UI** — el código se ajusta en 3.5/3.7 (selector empresa activa y filtros).
5. **Registro de nuevos usuarios** — flujo de creación de usuarios (si no existe hoy en `auth.users`) se documenta como decisión, no se ejecuta sin aprobación.

---

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Mapeo email→empresa incorrecto (negocio) | Medio | D2: mapeo mostrado y aprobado antes de aplicar; trazabilidad en informe |
| Usuario sin fila en `auth.users` | Medio | PC2/PC5 lo detectan → NO se inventa uid; se marca pendiente |
| Super admin no registrado → `es_super_admin()=false` | Medio | D4: super admin explícito en el mapeo + GATE lo verifica |
| Duplicados de identidad | Bajo | `uq_us_auth`/`uq_us_email` + PC6 |
| Rollback dejando restos | Bajo | TRUNCATE de solo 2 tablas + verificación |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan + provisión de la **lista real de usuarios** (email, empresas, roles) — requisito de negocio.
2. **PRE-FLIGHT owner** (SQL Editor, SOLO lectura): PC1–PC6; pegar salidas.
3. **Mostrar el mapeo** propuesto (email → empresa/rol/activo) y **aprobar**.
4. **Escribir** `sql/migracion_fase_3_4.sql` y aprobar.
5. **Ejecutar ENTERO** como OWNER + verificación RPC con sesión real (usuario restringido y super admin).
6. **Cerrar FASE 3.4** y NO activar RLS (3.6) sin nueva aprobación.

---

## 12. ENTREGABLES

- `FASE3.4_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación + lista real: `sql/migracion_fase_3_4.sql` + `FASE3.4_INFORME.md` (incluye el mapeo aprobado y las salidas RPC).

---

**ESTADO: PREPARADO PARA REVISIÓN — BLOQUEADO por la lista real de usuarios (entrada de negocio). Pendiente aprobación del usuario.**