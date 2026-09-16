# INFORME FASE 3.1 — JWT / Sesión / Fetcher autenticado

**Proyecto:** tzununsa · **Rama:** main · **Fecha:** 2026-09-16
**Alcance:** Implementación exclusiva de frontend: sesión real vía Supabase SDK, JWT en todas las llamadas REST y eliminación del anon key como vía de autenticación y de `tzunun_session` como autoridad.

---

## 1. Archivos modificados

**Nuevos**
- `src/services/session.js` — creado: `initAuth`, `getSession`, `getAccessToken`, `refreshSession`, `onAuth`, `signIn`, `logout`, `getUserEmail`, `getUserName`. `initAuth` crea el cliente con `persistSession:true`, `autoRefreshToken:true`, `detectSessionInUrl:false`, `storageKey:"tzunun_auth"` y limpia el residuo `tzunun_session` (solo `removeItem`, nunca lectura).
- `.gitignore` — añadido `node_modules/` y `dist/`.
- `package-lock.json` — generado por npm (antes no existía el proyecto); no altera rangos de `package.json`.

**Modificados (FASE 3.1)**
- `src/config.js` — añade `import initAuth(...)` desde session.js y lo ejecuta al cargar; exporta `apiFetch` (apikey + JWT; **sin sesión → sin `Authorization`**; 401 con token → refresh único → retry único; si el refresh falla → `logout()` + error visible) y `api` (misma semántica de error que los `api` locales). `dbGet/dbIns/dbUpd/dbDel/siguienteNumero` reescritos sobre `apiFetch`. `H` eliminado. `sbLogin/sbLogout` quedan como wrappers que delegan en el SDK.
- `src/App.jsx` — restaura sesión con `getSession()` + suscripción `onAuthStateChange` (INITIAL_SESSION/SIGNED_IN/TOKEN_REFRESHED/SIGNED_OUT); login vía `signInWithPassword`; logout vía `signOut`; eliminado todo uso de `localStorage("tzunun_session")`.
- `src/pages/Gastos.jsx` — `userName` ahora lee `getUserName()` (SDK), ya no `tzunun_session`; `api` local eliminada y usada la de config.
- `src/pages/{Contabilidad,Contratos,Facturacion,Proveedores,Empleados}.jsx` — `api` locales eliminadas y sustituidas por `api` de config; imports de `SB`/`H` retirados.
- `src/pages/Banca.jsx` — `loadAllMovs` migrado a `apiFetch`.
- `src/hooks/usePaginacion.js` — paginación vía `apiFetch` (Range/Prefer `count=exact`).
- `src/services/dashboardService.js` — lee vía `apiFetch` conservando su semántica tolerante (devuelve `[]` en error).
- `src/components/ImportadorSAT.jsx`, `ImportadorXML.jsx`, `ImportadorPDF.jsx` — `api` local con `H` eliminada; usan `api` de config (los XML/PDF llegaron a `main` en el merge del trabajo remoto y fueron migrados al fetcher JWT).
- `src/pages/Empleados.jsx` — **eliminada la copia duplicada de la anon key y de `H`** (`:12-14`): la anon key queda solo en `config.js`.

**Integrados vía merge (trabajo remoto, sin sobrescribir)** — `sql/catalogo_cuentas_tzunun.sql`, `sql/migracion_emisores.sql`, `sql/migracion_facturas_fel.sql`, `sql/migracion_qr_import.sql`, `src/components/ImportadorXML.jsx`, `src/components/ImportadorPDF.jsx`, cambios en `Facturacion.jsx`, `Configuracion.jsx`, `Gastos.jsx`, `Pagos.jsx`, `ImportadorSAT.jsx`, `App.jsx`, `config.js` (añade `TIPOS_SERVICIO`).

**Verificación de limpieza:** grep final en `src/` — sin `H`, sin `Authorization: Bearer ${SK}`, sin `localStorage("tzunun_session")` (solo `removeItem` de limpieza), sin `fetch` directo a `/rest/v1` o `/auth/v1` salvo el constructor de URL en `apiFetch`.

## 2. Dependencias instaladas y versiones
- **Node.js:** v22.23.2 (LTS 22.x) — instalado **portable** en `%LOCALAPPDATA%\Programs\nodejs` (sin requerir admin; añadido a PATH de usuario).
- **npm:** 10.9.8.
- **@supabase/supabase-js:** **2.45.0** (`^2.45.0`). Única dependencia añadida a `package.json`.
- **No se actualizó** React (18.2.0), Vite (5.4.21), Recharts (2.8.0), jspdf ni ninguna otra. npm no exigió cambios por compatibilidad.

## 3. Resultado de `npm run build`
**PASS** — `vite v5.4.21`, **941 módulos transformados**, build en 7.75 s, generado `dist/` (`index.html` 4.06 kB; `index-0AWU-fte.js` 1,280 kB / 340 kB gzip).

## 4. Pruebas de aceptación A–H

Automáticas (ejecutadas en Node con `fetch`/storage simulados, suite `8/8 PASS`): | |
|---|---|
| **A** Login con usuario Supabase real | Ruta `signInWithPassword` implementada y verificada con sesión simulada (PASS headless). **Validar en navegador** con credencial real (paso 1 abajo). |
| **B** Logout → vuelve al login, sin llamadas con token viejo | **PASS** headless: tras `logout()`, `getSession()=null` y las peticiones REST ya no llevan `Authorization`. |
| **C** Recargar navegador → sigue dentro | Sesión vive en el SDK (`persistSession` + `storageKey "tzunun_auth"`); headless confirma que se restaura sin `tzunun_session`. **Validar recarga real** (paso 2 abajo). |
| **D** Sesión persiste sin depender de `tzunun_session` | **PASS** headless: `getSession()` devuelve sesión con `tzunun_session` ausente. |
| **E** Token cercano a expiración → refresh | **PASS** headless: con `expires_at` a +10 s, `getAccessToken` dispara exactamente 1 refresh y devuelve el nuevo token. |
| **F** 401 forzada → refresh + retry único → éxito | **PASS** headless: 401 inicial, 1 refresh, 1 reintento, respuesta final 200. |
| **G** Logout elimina estado autenticado | **PASS** headless: `session=null` post-logout (login visible en UI). |
| **H** Peticiones REST con `Authorization: Bearer <JWT>` y nunca solo anon | **PASS** headless: con sesión → `Authorization: Bearer <JWT>`; sin sesión → **solo `apikey`**, sin Bearer anon. |

**Pendiente solo manual (requiere navegador + credencial Supabase real, no ejecutable desde CLI):**
1. **A**: iniciar sesión con usuario real → confirma acceso.
2. **C**: recargar página tras login → permanece autenticado.
3. **H** (complemento): en DevTools/Red, verificar `Authorization: Bearer <JWT>` en cada llamada `/rest/v1/*`.

## 5. Smoke test de módulos
**PASS.**
- El módulo `session.js` importa y expone sus 9 funciones sin error (Node 22, ESM claro).
- Suite automatizada (pruebas B–H automatizables): **8/8 PASS**.
- `npm run build`: 941 módulos sin errores → todos los imports/servicios/páginas migrados resuelven (`usePaginacion`, `dashboardService`, Banca, Contabilidad, Contratos, Facturacion, Gastos, Proveedores, Empleados, ImportadorSAT, ImportadorXML, ImportadorPDF).

## 6. Warnings y comportamientos pendientes
- `npm warn deprecated recharts@2.15.4` — **preexistente**, fuera de alcance (no se tocó Recharts).
- Vite: "CJS build of Vite's Node API deprecated" y chunk > 500 kB — **preexistentes**, sin relación con la fase.
- Node se instaló portable (per-user); no requiere admin y no altera instalaciones del sistema.
- `sbLogin`/`sbLogout` (config.js) son wrappers de compatibilidad que delegan en el SDK; no usan red ni anon. Pueden retirarse en una fase posterior.
- El SDK persiste sesión en `localStorage` bajo `tzunun_auth`; la clave vieja `tzunun_session` solo se elimina (nunca se lee).
- Validación manual A/C/H en navegador con credenciales reales queda pendiente del usuario.

## 7. Commit realizado
- `fcac1f7` — `fase-3.1-jwt: sesion via Supabase SDK, fetcher autenticado con JWT real, sin fallback anon`.
- `10d87f3` — merge con trabajo remoto (contabilidad/FEL) + migración de `ImportadorXML`/`ImportadorPDF` al fetcher JWT.
- **Push OK** a `origin/main` (`b743d3b..10d87f3`).
- Tags: `pre-fase-3.1-jwt` → `b851401` (punto de recuperación, intacto) · `fase-3.1-jwt` → `10d87f3`.
- El merge integró 6 commits remotos ajenos **sin `reset`/`checkout`/`restore` ni sobrescritura**; se resolvió 1 conflicto (import en Facturacion) combinando ambas versiones.

## 8. Confirmación de no-alcance
- **NO** se modificó Supabase: ninguna tabla, ninguno de los archivos SQL se ejecutó, sin cambios de RLS, sin crear/modificar usuarios, sin tocar `empresas`/`usuario_empresas`, sin tocar datos históricos.
- **NO** se hizo deploy.
- Cambios 100% de frontend (Vite/React) + dependencia `@supabase/supabase-js`.

---

**ESTADO: FASE 3.1 IMPLEMENTADA Y COMPILADA — PENDIENTE validación manual en navegador (pruebas A/C/H con credencial Supabase real) y aprobación del usuario. No se avanza a FASE 3.2 hasta aprobación del informe.**