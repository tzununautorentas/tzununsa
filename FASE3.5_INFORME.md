# FASE 3.5 — INFORME DE IMPLEMENTACIÓN

> Multiempresa · **Empresa activa + selector + filtros `empresa_id`** (UX + datos)
> Estado: **IMPLEMENTADO (código frontend)** — pendiente prueba manual del owner con ≥2 empresas

---

## 1. RESUMEN

Se implementó la **empresa activa** del usuario autenticado y su propagación global a la UI y a todas las consultas REST de tablas con `empresa_id`:

- Selector de empresa activa (usuario con varias empresas autorizadas), con chip estático si solo hay una.
- `empresa_activa` persistida en `localStorage` (`tzunun_empresa_activa`), con restauración validada contra las empresas autorizadas.
- Helper centralizado `filtroEmpresa(empId)` en `config.js` + inyección en `usePaginacion`, `dashboardService`, Notificaciones y páginas.
- Resolución de empresas autorizadas **replicando el contrato de `authz.empresas_autorizadas()` vía REST autenticado** (decisión R1 del usuario), con fallback legacy secundario.
- Cambios 100% frontend: **sin SQL de datos, sin RLS, sin cambios en la BD**.

---

## 2. ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---|---|
| `src/services/session.js` | Captura `_userId` desde `session.user.id`; exporta `getUserId()`; lo resetea en `logout`. |
| `src/config.js` | `filtroEmpresa(empId)`; `getEmpresasAutorizadas()` (REST autenticado); `getEmpresaFallback()` (legacy); `getEmpId()` migrado; re-export de `getUserId`. |
| `src/hooks/usePaginacion.js` | Nuevo parámetro `empresaId`; anexa `filtroEmpresa` al query; incluido en `loadKey` (recarga al cambiar empresa). |
| `src/App.jsx` | Estado `empresaActiva`/`empresasAutorizadas`; resolución al autenticar; persistencia/restauración validada; `EmpresaSelector`; `.REMITO` selector en layouts + `NotificacionesBell` con `empId`; recoja de empresa al cambiar (deps `[empId]`). |
| `src/services/dashboardService.js` | `loadDashboardData(empId)` con filtro de empresa en las 9 consultas. |
| `src/pages/Dashboard.jsx` | Recibe `empId` (incl. home móvil) y recarga al cambiar de empresa. |
| `src/components/Notificaciones.jsx` | `useNotificaciones(empId)` con filtro en las 5 consultas. |
| `src/pages/Banca.jsx` | Cuentas/movimientos filtrados; `cuentaAct` se reinicia al cambiar de empresa. |
| `src/pages/Facturacion.jsx` | `empreId` ya presente; verificado. |
| `src/pages/Gastos.jsx` | Paginación + lookups `cuentas_contables` con filtro híbrido. |
| `src/pages/Contratos.jsx` | Paginación con `empresaId`. |
| `src/pages/Proveedores.jsx` | Paginación + historial (gastos/mantenimientos) con filtro. |
| `src/pages/Empleados.jsx` | Paginación + `generarCodigo(empId)` + historial (gastos/pagos/reservas) con filtro. |
| `src/pages/Clientes.jsx` | Paginación con `empresaId`. |
| `src/pages/Catalogo.jsx` | Paginación (`servicios`) con `empresaId`. |
| `src/pages/Cotizaciones.jsx` | Paginación + clientes con filtro; recarga en `[empId]`. |
| `src/pages/Reservas.jsx` | Paginación + flota/empleados selector con filtro; deps `[empId]`. |
| `src/pages/Flota.jsx` | Paginación (`vehiculos`) con `empresaId`. |
| `src/pages/Mantenimiento.jsx` | Paginación + selector de vehículos con filtro; deps `[empId]`. |
| `src/pages/Pagos.jsx` | Fuentes (reservas/facturas/cotizaciones/cuentas) con filtro; ya dependía de `[empId]`. |
| `src/pages/Calculadora.jsx` | Flota disponible con filtro; deps `[empId]`. |
| `src/pages/Contabilidad.jsx` | Catálogo híbrido `cuentas_contables`; asientos y `asiento_lineas` filtrados por empresa (embedded). |
| `src/pages/Configuracion.jsx` | `PageConfiguracion` recibe `empId` prop (usa empresa activa en vez de `limit=1`); cuentas de `PanelEmpresa` filtradas. |

---

## 3. DECISIÓN DE DISEÑO (R1) — EMPRESAS AUTORIZADAS VÍA REST AUTH

### Hallazgo de pre-flight
- **PC1** — `/rest/v1/rpc/empresas_autorizadas` → `404 PGRST202` (la función `authz.empresas_autorizadas()` existe en el schema `authz`, que **no está expuesto** por PostgREST). Con `Accept-Profile: authz` → `406 PGRST106` ("Only the following schemas are exposed: public, graphql_public").
- **PC2** — `authz.es_super_admin()`: misma situación (404/406); no recuperable vía REST sin exponer schema.
- **PC3** — `empresas`: **1 registro**, `id` uuid, `nombre` = `Transportes Tz´unun` (`adc5f324-a108-49ad-875c-779afe3b9f7f`).
- **PC4** — `usuario_empresas`: **2 relaciones activas** (usuario_id 3 y 4 → empresa_id `adc5f324…`, rol_id 1/2, `activo=true`). Confirmado que FASE 3.4 quedó poblada.
- **PC5** — Build baseline: no se pudo capturar antes de editar (las ediciones comenzaron tras la aprobación R1); sí se verifica build final PASS (ver §9).

### Decisión del usuario (R1): replicar vía REST, SIN SQL
La RPC `authz` no está expuesta y NO se permite (en 3.5) exponer schemas ni crear wrappers. Por tanto se replica el contrato de la función con relaciones existentes y **JWT autenticado**:

```
auth_id (JWT, auth.uid())  ──>  usuarios_sistema (por auth_id)  ──>  usuario_empresas (activo=true)  ──>  empresas (id, nombre)
```

- `getEmpresasAutorizadas()` usa `getUserId()` (id del usuario autenticado) y consulta solo relaciones `activo=true`.
- **NO** se usa el catálogo global `empresas` para decidir autorización (reservado solo para fallback).
- **NO** se usa `usuarios_sistema?empresa_id=…` como sustituto de `usuario_empresas`.
- Se respeta la regla "empresa activa ∈ autorizadas", con descalada segura si deja de estarlo.
- Queda documentado: **FASE 3.6 endurecerá con RLS** a nivel servidor; 3.5 filtra a nivel app.

---

## 4. FALLBACK LEGACY

Si `getEmpresasAutorizadas()` devuelve vacío (p. ej. `usuario_empresas` sin filas, o usuario sin `auth_id` mapeado):

1. `getEmpresaFallback()` → primera empresa del catálogo global (`empresas?select=id,nombre&limit=1`).
2. Si tampoco hay → estado sin empresa activa: vistas cargan sin filtro (como antes de 3.5), sin crashear.

El fallback es **secundario y explícito**: solo se usa cuando la resolución autenticada no entrega resultados.

---

## 5. PERSISTENCIA Y RESTAURACIÓN (D2)

- Clave: `tzunun_empresa_activa` (localStorage).
- Al autenticar: se obtienen autorizadas → se restaura la persistida **solo si sigue autorizada**; si no, primera autorizada; si no hay autorizadas, fallback.
- Al cambiar en el selector: se persiste inmediatamente (`onChangeEmpresa`).
- Al logout: se limpian `empresaActiva`, `empId`, `empresasAutorizadas` y la clave persistida.
- Restauración es **desescalada segura**: nunca queda una empresa no autorizada como activa.

---

## 6. MÓDULOS REVISADOS Y CONSULTAS CORREGIDAS

| Tabla/consulta | Filtro aplicado |
|---|---|
| `vehiculos`, `clientes`, `servicios`, `contratos`, `cotizaciones`, `empleados`, `facturas`, `gastos`, `mantenimientos`, `pagos_recibidos`, `reservas`, `movimientos_bancarios`, `cuentas_bancarias`, `proveedores`, `pagos` (historial) | `empresa_id=eq.<activa>` vía `usePaginacion` o `dbGet`/`api` directos |
| `boxDashboard` (9 agregaciones) | `empresa_id=eq.<activa>` |
| Notificaciones (reservas, vehiculos, mantenimientos, cotizaciones, facturas) | `empresa_id=eq.<activa>` |
| `asientos_contables` (diario + contabilizar) | `empresa_id=eq.<activa>` (query e inserción) |
| `asiento_lineas` (mayor, balance, resultados) | Filtro embedido `asientos_contables(empresa_id=eq.<activa>,…)` |
| `cuentas_contables` (Contabilidad, lookups de Gastos) | **Híbrido**: `or=(empresa_id.is.null,empresa_id.eq.<activa>)` |
| `usuarios_sistema` no afectado | PanelUsuarios conserva modelo con `empresa_id=eq.<activa>` (ajuste fino en 3.7) |

Lecturas marcadas legacy (solo fallback cuando no hay empresa activa): `empresas?select=id&limit=1` en guardas de `Cotizaciones`/`Calculadora`/`Configuracion` sin prop.

---

## 7. TRATAMIENTO DE `cuentas_contables` (catálogo híbrido; D5)

No se aplicó un filtro simple: se respeta el modelo híbrido de FASE 3.2C:

- **Maestras**: `empresa_id IS NULL` (catálogo base).
- **Específicas**: `empresa_id = <empresa activa>`.

Consulta: `or=(empresa_id.is.null,empresa_id.eq.<activa>)`. Las cuentas nuevas se crean con la empresa activa (`empresa_id: empId`). La decisión de negocio `5.2.1` (cuentas inactivas/maestras) queda registrada para GRUPO C, sin resolver aquí.

---

## 8. CAMBIO DE EMPRESA ACTIVA (recarga)

- `usePaginacion`: `empresaId` incluido en `loadKey` → al cambiar la empresa, cada grid vuelve a cargar.
- `useEffect` de cargas directas con `[empId]` en deps (Dashboard, Banca cuentas, Notificaciones, Calculadora, Reservas flota/empleados, Mantenimiento vehículos, Cotizaciones clientes, Pagos).
- Dashboard: `loadDashboardData(empId)` con deps `[empId]`; home móvil pasa `empId`.

---

## 9. BUILD

- `npm run build` → **PASS**. `941 modules transformed`, `✓ built in ~12–15s`. Solo warnings preexistentes: chunk >500 kB (no relacionados con 3.5).

---

## 10. PRUEBAS REALIZADAS

- Build PASS (§9).
- Revisión estática/por grep: todas las tablas empresariales consultadas llevan `empresa_id=eq.<activa>` o el híbrido correspondiente.
- **Prueba manual del owner (navegador, credencial real): PASÓ** ✅
  - Login autenticado → chip de empresa activa visible (`Transportes Tz´unun`).
  - Network/DevTools: llamadas con `empresa_id=eq.adc5f324-a108-49ad-875c-779afe3b9f7f` en dashboard, módulos y notificaciones.
  - Resolución por REST autenticado confirmada: `usuarios_sistema` (auth_id) → `usuario_empresas` (activo=true) → `empresas`.
  - Persistencia `tzunun_empresa_activa` en localStorage y restauración al recargar OK.
  - **Pendiente**: selector con ≥2 empresas (bloqueado, ver §11).

---

## 11. PRUEBA DE 2 EMPRESAS — PENDIENTE (bloqueada)

No realizada: **no existe un usuario con ≥2 empresas autorizadas** en el entorno actual (1 sola empresa; 2 relaciones de usuarios distintos). Se permitió por la regla de no modificar datos en 3.5 (no crear empresas/relaciones ficticias).

**Pendiente para cuando exista un usuario multiempresa:** validar selector + recarga por empresa + persistencia, y registrar el resultado en este informe.

> Nota: el flujo de **descenso de privilegios** (empresa activa deja de estar autorizada → caer a primera autorizada/fallback) también queda pendiente de probar con datos reales; implementado y cubierto por revisión de código.

---

## 12. HALLAZGOS / ALCANCE Y FRONTERAS

1. **RPC `authz` no expuesta a PostgREST** (404 PGRST202 / 406 PGRST106). FASE 3.5 se resolvió por **REST autenticado sobre relaciones existentes** (R1, sin SQL): `auth_id (JWT) → usuarios_sistema → usuario_empresas (activo=true) → empresas`. **FASE 3.6** podrá endurecer con RLS / exponer schema.
2. **Sin SQL de datos, sin RLS, sin cambios de BD** en 3.5.
3. **Selectores de opciones dentro de módulos** (vehículos, empleados, clientes, cuentas en formularios) también filtrados por empresa activa.
4. **PanelUsuarios**: ajuste mínimo; administración completa de usuarios/empresas es FASE 3.7.
5. **Back up/rollback**: revert de git del cambio (no hay SQL que revertir).

---

**ESTADO: FASE 3.5 IMPLEMENTADA Y VALIDADA (build PASS + prueba manual del owner OK).**
**GATE 3.5: CERRADO. Pendiente futuro: prueba multiempresa y descenso de privilegios cuando exista un usuario con ≥2 empresas.**