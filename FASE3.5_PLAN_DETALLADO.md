# FASE 3.5 — PLAN DETALLADO DE IMPLEMENTACIÓN

> Multiempresa · **Empresa activa + selector + filtros `empresa_id`** (UX + datos) — prepara la UI para que FASE 3.6 (RLS) pueda demostrar lectura restringida

---

## 1. OBJETIVO

Implementar la **empresa activa** del usuario autenticado y aplicarla como **filtro global** en la UI y en todas las consultas de datos:

1. Selector de empresa activa (usuario con varias empresas autorizadas).
2. `empresa_activa` persistida (sesión) y propagada a las consultas (`empresa_id=eq.<activa>`).
3. Filtros `empresa_id` en `dashboardService`, `usePaginacion` y páginas (Banca, Facturación, Gastos, etc.).
4. Resolver la empresa activa desde `authz.empresas_autorizadas()` (vía RPC autenticada, FASE 3.1) con fallback legacy (primera empresa / `empresas limit=1`) mientras `usuario_empresas` no esté poblada.

**No forma parte:** RLS (3.6), backfill de datos, reglas de negocio (3.7), frontend de administración de usuarios (PanelUsuarios se ajusta en 3.7 si aplica).

---

## 2. DIAGNÓSTICO (código actual que consulta sin filtro de empresa)

| Componente | Estado (hallazgo) | Acción |
|---|---|---|
| `src/config.js` (`getEmpId` :150) | Hoy resuelve empresa legacy (`empresas limit=1`) | Migrar a `authz.empresas_autorizadas()` + fallback legacy |
| `src/App.jsx` | Selector de empresa inexistente; login/logout ya vía SDK (3.1) | Añadir selector + `empresa_activa` en estado/contexto/sesión |
| `src/services/dashboardService.js` | `:18,45-50` agrega ingresos/egresos por `tipo` **sin filtro de empresa** | Añadir `empresa_id=eq.<activa>` |
| `src/hooks/usePaginacion.js` | Paginación vía `apiFetch` sin filtro de empresa | Añadir filtro configurable |
| Páginas (Banca, Facturación, Gastos, Contratos, etc.) | Combinan `empresa_id` en algunas llamadas, no en todas | Unificar filtro `empresa_id=eq.<activa>` según componente |
| `src/pages/Configuracion.jsx` (`PanelUsuarios` :274) | Modelo legacy (`usuarios_sistema?select=…&empresa_id=eq.${empId}`) | Se mantiene con fallback; ajuste fino en 3.7 |

---

## 3. DECISIONES DE DISEÑO

**D1 — Fuente de verdad de empresas:** `authz.empresas_autorizadas()` vía RPC `/rpc/empresas_autorizadas` (JWT, FASE 3.1). Si devuelve vacío → fallback legacy (`empresas` limit=1, comportamiento actual) — mismas reglas que `FASE3.2B §5`/`§10`.

**D2 — `empresa_activa` en sesión:** se guarda en la sesión de usuario (contexto de App) y se persiste (localStorage bajo la misma clave de auth, p.ej. `tzunun_auth`/`tzunun_empresa_activa`) para restaurarla al recargar. Validada contra la lista de autorizadas: si ya no está autorizada → se cae a la primera autorizada o fallback.

**D3 — Filtros centralizados:** `apiFetch`/helpers de config exponen un helper `filtroEmpresa(empresaActiva)` o el propio filtro se inyecta en `usePaginacion` y en cada consulta de módulo. La regla es: **toda** lectura/escritura de tablas con `empresa_id` debe filtra `empresa_id=eq.<activa>` (a nivel REST) — sin depender aún de RLS (3.6).

**D4 — No tocar RLS:** esta fase no habilita RLS; el filtro es a nivel app. Permite que el owner valide visualmente "2 empresas → solo veo la activa" (prueba de 3.5) y deja la puerta lista para 3.6.

**D5 — Interacción con 3.2C catálogo híbrido:** las cuentas `cuentas_contables` pueden ser maestras (`empresa_id NULL`) o por empresa; el catálogo se filtra por `(empresa_id IS NULL OR empresa_id=eq.activa)`. Decisión pendiente de negocio `5.2.1` se registra, no se resuelve aquí (GRUPO C / P3).

---

## 4. PRE-CHECKS (owner, SOLO lectura)

- **PC1** — `authz.empresas_autorizadas()` ejecuta sin error vía RPC con sesión autenticada (devuelve vacío hoy si `usuario_empresas` vacía — esperado y ok).
- **PC2** — `authz.es_super_admin()` no rompe (fase 3.5 habla de empresas; útil para selector).
- **PC3** — `empresas` inventario: `count`, columnas `id/nombre` (para pintar selector).
- **PC4** — Situación de `usuario_empresas` (0 filas → fallback legacy; N filas → empresas reales del usuario).
- **PC5** — Build actual del frontend (baseline: `npm run build` pasa) antes de tocar código (se re-verifica al final).

---

## 5. IMPLEMENTACIÓN (solo código; NO SQL de datos)

Archivos (según `FASE3A1 §12` y diagnóstico):

- `src/config.js` — `getEmpId()`/resolucción de empresa activa: intentar `authz.empresas_autorizadas()`; vacío → legacy. Exportar helper de proceso de empresas y `filtroEmpresa`.
- `src/App.jsx` — estado `empresaActiva` + opciones (autorizadas/fallback) + selector persistido + validación al restaurar sesión.
- `src/services/dashboardService.js` — agregar `empresa_id=eq.<activa>` a las agregaciones `ingresos/egresos`.
- `src/hooks/usePaginacion.js` — aceptar `empresaId` y anexarlo al filtro del query.
- Páginas (Banca, Facturación, Gastos, Contratos, Proveedores, Empleados) — pasar `empresaId` en sus consultas (filtro REST `empresa_id=eq.<activa>`).
- `src/pages/Notificaciones.jsx` — si consulta tablas con `empresa_id`, aplicar filtro.

**Sin SQL de migración de datos.** Cambios 100% frontend.

---

## 6. PRUEBAS DE ACEPTACIÓN

1. **Selector activo:** usuario con ≥2 empresas autorizadas → el selector lista sus empresas y solo se ven datos de la activa.
2. **Cambio de empresa activa:** al cambiar, todas las vistas/dashboard recargan con el nuevo `empresa_id`.
3. **Fallback legacy:** con `usuario_empresas` vacía → funciona como hoy (primera empresa).
4. **Restauración:** recargar página conserva la empresa activa (si sigue autorizada).
5. **Descenso de privilegios (validación de 3.6 future):** si la empresa activa deja de estar autorizada, la app cae a otra autorizada/fallback sin crashear.
6. **Build:** `npm run build` pasa (como 3.1: 941 módulos).
7. **REST check:** en DevTools, las llamadas a tablas con `empresa_id` llevan `empresa_id=eq.<activa>`.

**Se documentan como manuales:** navegador con credencial real (como en 3.1).

---

## 7. POST-CHECKS y GATE DE CIERRE

| Verificación | Esperado |
|---|---|
| `npm run build` | PASS (sin nuevos warnings relevantes) |
| Grep de llamadas a tablas con `empresa_id` | todas filtan (sin llamada global sin filtro) |
| Selector + resto de empresa activa | implementado y persistido |
| `authz.empresas_autorizadas()` integrada | sin regresión en fallback |
| Dashboard | `ingresos/egresos` filtrados por empresa activa |

**GATE de cierre (frontend):** checklist de aceptación completo + build PASS + prueba manual del owner (2 empresas → solo se ve la activa).

---

## 8. ROLLBACK

- **revert git** del cambio de 3.5 (mismo patrón que 3.1). No hay SQL de datos que revertir.

---

## 9. FRONTERAS EXPLÍCITAS (NO en 3.5)

1. **RLS / políticas** — FASE 3.6 (la app no depende de RLS para el filtro en esta fase).
2. **Población de usuarios/empresas** — FASE 3.4 (si `usuario_empresas` ya está poblada se usa; si no, fallback).
3. **`concepto` en Banca / `numero` en Pagos / reversa** — FASE 3.7.
4. **Decisión de `5.2.1` y cuentas inactivas** — GRUPO C, no se resuelve aquí.

---

## 10. RIESGOS

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Quebrar un módulo al añadir filtro empresa | Medio | Filtro centralizado + `npm run build` + smoke por página |
| Pérdida de la empresa activa al recargar | Bajo | Persistencia + restauración validada vs autorizadas (D2) |
| Confusión empresa activa vs autorizada | Bajo | La activa siempre ∈ autorizadas (D2 valida); fallback si no |
| Doble fuente de empresa (app y RLS futura) | Bajo | Documentado: 3.5 filtra a nivel app; 3.6 añade RLS servidor |

---

## 11. ORDEN DE EJECUCIÓN

1. **Revisión humana** de este plan (aprobación).
2. **PRE-FLIGHT owner**: PC1–PC5 (lecturas).
3. **Implementar código** (config, App, dashboardService, usePaginacion, páginas).
4. **`npm run build`** + smoke → PASS.
5. **Prueba manual del owner** (selector, cambio de empresa, restauración, filtros REST en DevTools) con credencial real.
6. **Cerrar FASE 3.5** y NO activar RLS (3.6) sin nueva aprobación.

---

## 12. ENTREGABLES

- `FASE3.5_PLAN_DETALLADO.md` (este documento) — plan, sin ejecutar.
- Tras aprobación: cambios en `src/` + `FASE3.5_INFORME.md` (build + pruebas).

---

**ESTADO: PREPARADO PARA REVISIÓN — sin código modificado ni SQL ejecutado. Pendiente aprobación del usuario.**