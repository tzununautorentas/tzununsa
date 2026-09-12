# FASE 3.1 — Plan detallado de implementación (JWT / Sesión / Fetcher autenticado)

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Estado: **PLAN SOLO ANÁLISIS — aún sin cambios, sin instalar Node, sin deploy**

---

## 1. Archivos de `src/` a modificar o crear

**Crear (1)**

| Archivo | Propósito |
|---|---|
| `src/services/session.js` | Única capa de sesión: `initAuth/getSession/getAccessToken/refreshSession/onAuth/signIn/logout/getUserEmail`. No importa `config.js` (evita ciclo). |

**Modificar (11 + config)**

| Archivo | Cambio |
|---|---|
| `src/config.js` | Reemplazar `H` (estático anon) por `apiFetch()` (auth+retry) y `api()` (JSON, igual semántica que los `api` locales). `dbGet/dbIns/dbUpd/dbDel/siguienteNumero` sobre `apiFetch`. `sbLogin/sbLogout` → delegar a `session.signIn/logout`. |
| `src/App.jsx` | Sesión inicial desde `getSession()`; suscripción `onAuthStateChange` (INITIAL_SESSION/SIGNED_IN/TOKEN_REFRESHED/SIGNED_OUT); `handleLogin/handleLogout` sin depender de `tzunun_session`. |
| `src/hooks/usePaginacion.js` | Usar `apiFetch` (conserva `Range` + `Prefer: count=exact`). |
| `src/services/dashboardService.js` | Usar `apiFetch` (conserva devolver `[]` si falla). |
| `src/pages/Banca.jsx` | `loadAllMovs` usa `apiFetch`; quitar import `H`. |
| `src/pages/Contabilidad.jsx` | Eliminar `api` local + importar `api` de config. |
| `src/pages/Contratos.jsx` | Ídem. |
| `src/pages/Facturacion.jsx` | Ídem. |
| `src/pages/Gastos.jsx` | Ídem + `userName` lee de `getUserEmail()` en vez de `localStorage('tzunun_session')`. |
| `src/pages/Proveedores.jsx` | `apiFetch` local → `api` de config. |
| `src/pages/Empleados.jsx` | **Elimina el anon key duplicado en el archivo (líneas 12-14)** y usa `api` de config. |
| `src/components/ImportadorSAT.jsx` | `api` local → `api` de config. |

## 2. Cambios en la autenticación actual

Hoy: `sbLogin` hace `POST /auth/v1/token?grant_type=password`, guarda `{token, user}` en `localStorage('tzunun_session')` y **descarta `refresh_token`/`expires_in`**. No hay refresh → la app muere en silencio tras ~1 h.

Nuevo: `sbLogin` → `supabase.auth.signInWithPassword`; la sesión vive **dentro del SDK** (persistida por Supabase Auth en `localStorage` bajo su propia clave). `tzunun_session` se deja de leer; la interfaz visual del login no cambia.

## 3. Integración de `@supabase/supabase-js` v2

- `package.json` → `"@supabase/supabase-js": "^2.45.0"` (solo esta dependencia; sin upgrades del resto).
- `session.initAuth(SB, SK)` crea el cliente con:
  ```js
  createClient(SB, SK, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "tzunun_auth" } })
  ```
- `config.js` llama `initAuth(SB, SK)` al arrancar (módulo), antes de cualquier fetch. Sin ciclo: `session.js` no importa `config.js`.

## 4. Funciones de `session.js`

- `initAuth(SB, SK)` → crea/retorna el cliente (idempotente).
- `getSession()` → `supabase.auth.getSession()` → `data.session`.
- `getAccessToken()` → si `session.expires_at*1000 - Date.now() < 60 s` → `refreshSession()`; devuelve `access_token` (o `null` sin sesión).
- `refreshSession()` → `supabase.auth.refreshSession()` con **single-flight** (una promesa compartida; `finally` la reinicia). Es coordinación, no un 2º sistema.
- `onAuth(cb)` → `supabase.auth.onAuthStateChange((event, session) => cb(event, session))`; retorna `{ subscription }` para limpiar.
- `signIn(email, password)` → `signInWithPassword` → `{ user, access_token }` o `{ error }`.
- `logout()` → `signOut()` + limpieza de la clave de sesión del SDK.
- `getUserEmail()` → email del usuario para UI.

## 5. Eliminar `tzunun_session` como autoridad sin romper el ERP

- `App.jsx`: estado inicial `null`; `useEffect` restaura con `getSession()`; `onAuthStateChange` actualiza a `{ user }` en SIGNED_IN/INITIAL_SESSION/TOKEN_REFRESHED y a `null` en SIGNED_OUT.
- `Gastos.jsx:667` (nombre de usuario en UI) → `getUserEmail()`.
- Se **elimina** la escritura/lectura de `tzunun_session`. Si quedara residual por sesiones viejas de navegadores, se borra la clave en `logout` y no se usa nunca como fuente.
- Pre-login no hay llamadas REST; si alguna ocurriera sin sesión, `apiFetch` envía anon (como hoy) y no rompe.

## 6. `api()` con JWT real (corrección: sin fallback anon)

`apiFetch(path|url, opts)`:

```js
token = await getAccessToken();
const headers = { apikey: SK, "Content-Type": "application/json" };
if (token) headers.Authorization = `Bearer ${token}`;
// SIN sesión: NO se envía Authorization artificial ni Bearer con el anon key.
```

`api(path, opts)` (exportado) usa `apiFetch`, `null` en 204, lanza `Error(message/hint)` si `!ok`, JSON en éxito. Hereda la semántica exacta de los `api` locales actuales actuales.

**Regla de control:** sin sesión no hay `Authorization` (PostgREST la trataría como rol anon; la app **no** debe consultar REST antes del login — `App.jsx` restringe el render al login). El 401-retry solo aplica cuando había token. Con esto, el anon key deja de ser una vía alternativa de autenticación y queda solo como requisito del gateway.

## 7. Expiración, refresh y retry 401

```
fetch
 ├─ SIN token → solo se envía `apikey: SK`; sin retry 401 (no hay nada que refrescar).
 │              Comportamiento controlado por la app (sin REST pre-login).
 └─ CON token → 401?
      ├─ no → respuesta tal cual
      └─ sí → refreshSession() [single-flight del SDK]
              ├─ token nuevo → reintentar UNA sola vez
              └─ falla      → logout() + throw Error("La sesión expiró. Inicia sesión nuevamente.")
```

No loops. SDK también autorrefresca (autoRefreshToken). `getAccessToken` refresca cuando faltan ≤ 60 s — cubre el caso de expiración cercana sin esperar el 401.

## 8. Dependencias y versión de Node

| Ítem | Recomendación |
|---|---|
| `@supabase/supabase-js` | `^2.45.0` (2.x estable, compatible React 18/Vite 5). Única dependencia nueva. |
| Node.js | **LTS 22.x** (activa en 2026; Vite 5 exige ≥18). Alternativa: 20.x LTS. |
| npm | El que trae Node (10.x+). Sin `package-lock.json` hoy; se genera con `npm install`. |

## 9. Verificación de que login/sesiones/llamadas siguen funcionando

- `npm run build` (Vite) tras implementar.
- No hay lint/test scripts en `package.json` (solo `dev/build/preview`).
- Pruebas manuales A–H (ver aceptación): necesitan navegador + usuario Supabase existente. Las pruebas E/F (expiración/401) se validan con DevTools (degradar token o modificar `expires_at`) o esperando la expiración.
- Inspección de red: toda consulta `/rest/v1/` debe llevar `Authorization: Bearer <JWT>`.

## 10. Riesgos / incompatibilidades

1. **Alcance**: los `api` locales devuelven/saltan distinto → se unifica en un `api` de config migrando cada sitio con su semántica actual; el build + smoke de cada módulo lo confirma.
2. **401-retry tras refresh con token nuevo**: si el server devuelve 401 de nuevo, no se reintenta más (evita loop).
3. **`onAuthStateChange` + estado React**: se usa un único `useEffect` con cleanup (`subscribe.unsubscribe`).
4. **Empleados.jsx contiene la anon key duplicada**: al migrar a `api` de config se elimina el duplicado (mejora de seguridad, sin cambio funcional).
5. **Compatibilidad GoTrue del proyecto**: el endpoint es el mismo (`/auth/v1`), solo cambia el cliente que llama → sin cambios en Supabase.
6. **Persistencia**: sesión en `localStorage` del SDK (clave `tzunun_auth`); al recargar la página `getSession()` la restaura sin tocar `tzunun_session`.
7. **`package-lock.json` no existe hoy**: se creará al `npm install`, cambio esperado y controlado.

---

## 11. Anexo — Auditoría final de usos de sesión y transporte (verificada)

Resultado de la búsqueda completa en el repo (antes de tocar código; árbol limpio, tag `pre-fase-3.1-jwt` creado).

**`tzunun_session` (solo código; los otros hits están en BDs de informes `.md`, no en runtime):**
- `src/App.jsx:593` (lectura inicial), `:656` (escritura post-login), `:662` (borrado en logout).
- `src/pages/Gastos.jsx:667` (solo nombre de usuario en UI).

**`localStorage` no relacionados con auth (NO se tocan):** `tzunun_theme` (theme.jsx), `tzunun_read` (readState.js / Notificaciones / Dashboard). `sessionStorage`: sin usos.

**`/auth/v1` (llamadas directas a eliminar):** `src/config.js:103` (`sbLogin`, `POST token?grant_type=password`) y `:114` (`sbLogout`). Se reemplazan por `signInWithPassword` / `signOut` del SDK.

**`/rest/v1` (llamadas directas a migrar al fetcher autenticado):**
| Archivo | Línea | Uso |
|---|---|---|
| `src/config.js` | :9,20,39,44,53,66,79 | `dbGet/dbIns/dbUpd/dbDel/siguienteNumero` |
| `src/hooks/usePaginacion.js` | :27-29 | fetch con `Range` + `count=exact` |
| `src/services/dashboardService.js` | :5-6 | `api` local |
| `src/pages/Banca.jsx` | :364-365 | `loadAllMovs` |
| `src/pages/Contabilidad.jsx` | :13-14 | `api` local |
| `src/pages/Contratos.jsx` | :15-16 | `api` local |
| `src/pages/Facturacion.jsx` | :15-16 | `api` local |
| `src/pages/Gastos.jsx` | :44-45 | `api` local |
| `src/pages/Proveedores.jsx` | :7-8 | `apiFetch` local |
| `src/pages/Empleados.jsx` | :17 | `api` local |
| `src/components/ImportadorSAT.jsx` | :10-11 | `api` local |

**Anon key (`SK`) y `H` (Bearer con anon):**
- `src/config.js:3-4` — única definición canónica (`SK`, `H`).
- `src/pages/Empleados.jsx:12-14` — **anon key y `H` duplicados en el archivo** (se eliminan al migrar; ya no se duplica el secreto).
- `Authorization: Bearer ${SK}` hoy solo en `config.js:4` y `Empleados.jsx:14` (ambos se eliminan).

**Other `fetch()` a Supabase:** ninguno adicional. Los `fetch()` de `ruteoService.js` (Nominatim/OSRM) son externos (geocoding) y NO pasan por Supabase; quedan intactos.

**`process.env` / `import.meta.env`:** sin usos.

---

## Plan paso a paso de implementación

1. Punto de recuperación: `git tag pre-fase-3.1-jwt` (árbol limpio) — y confirmamos.
2. Instalar Node 22 LTS (winget `OpenJS.NodeJS.LTS`).
3. `npm install @supabase/supabase-js@^2.45.0` (crea lockfile).
4. Crear `src/services/session.js`.
5. Refactor `src/config.js` (eliminar `H`, añadir `apiFetch`/`api`, reescribir helpers, delegar `sbLogin/sbLogout`).
6. Actualizar `App.jsx` (restauración + `onAuthStateChange` + login/logout).
7. Migrar `usePaginacion.js`, `dashboardService.js`, `Banca.jsx`, `Contabilidad.jsx`, `Contratos.jsx`, `Facturacion.jsx`, `Gastos.jsx`, `Proveedores.jsx`, `Empleados.jsx`, `ImportadorSAT.jsx`.
8. `npm run build` → corregir hasta verde.
9. Pruebas A–H en navegador.
10. Commit `fase-3.1-jwt`, informe y push.

## Pruebas de aceptación (A–H)

- **A** Login correcto con usuario Supabase real.
- **B** Logout → vuelve al login y no quedan llamadas con token viejo.
- **C** Recargar navegador tras login → sigue dentro.
- **D** Sesión persiste (no depende de `tzunun_session`).
- **E** Token cercano a expiración → `getAccessToken` refresca (visible en consola de red).
- **F** Respuesta 401 forzada → refresh + retry único → éxito.
- **G** Logout elimina estado autenticado (`session=null`, login visible).
- **H** En DevTools, las peticiones REST llevan `Authorization: Bearer <JWT>` (nunca solo anon).
- **+Build** `npm run build` exitoso; smoke de Dashboard, Clientes, Cotizaciones, Reservas, Flota, Facturación, Gastos, Banca, Contabilidad, Contratos, Mantenimientos.

---

**Regla de esta fase:** solo análisis y plan. No se modifica código, no se modifica Supabase, no se hace deploy, no se instala Node hasta que des aprobación explícita.