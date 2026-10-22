# Recuperación de contraseña — Tz'unun ERP

Implementación local del flujo de recuperación de contraseña con Supabase Auth.
Estado: **implementado en código local**. NO se aplicó ninguna configuración
remota, NO se desplegó y NO se escribieron datos. La configuración remota que se
describe abajo **debe ser revisada/aplicada por un administrador** en el panel de
Supabase antes de que el flujo funcione de punta a punta en producción.

## 1. Rutas y archivos

| Elemento | Ruta |
|---|---|
| Enlace "¿Olvidaste tu contraseña?" | `src/App.jsx` → `LoginScreen` (vista `recuperar`) |
| Pantalla de nueva contraseña | `src/pages/ResetPassword.jsx` |
| Lógica pura (validaciones, mensaje neutral, detección de enlace) | `src/services/recuperacion.js` |
| API de Auth (reset/update/sesión) | `src/services/session.js` |
| Ruta pública de restablecimiento | `/reset-password` (`RECOVERY_PATH`) |

No se añadió un router: la app es una SPA de índice único. La pantalla de
recuperación se selecciona por ruta/fragmento:
- `pathname === "/reset-password"`, o
- el fragmento contiene `type=recovery` (enlace implícito), o
- el evento `PASSWORD_RECOVERY` de Supabase.

## 2. Configuración en Supabase Auth (a revisar, NO aplicada)

En **Authentication → URL Configuration**:

- **Site URL**: `https://tzununsa.vercel.app`
- **Redirect URLs** (agregar, no reemplazar): 
  - Producción: `https://tzununsa.vercel.app/reset-password`
  - Desarrollo local: `http://localhost:5173/reset-password` (puerto por defecto de Vite)
  - Si se usa `npm run preview`: `http://localhost:4173/reset-password`

El código usa `redirectTo = window.location.origin + "/reset-password"`, por lo
que cada entorno redirige a su propio origen.

> **Importante (SPA):** al abrir el enlace, Supabase navega a
> `/reset-password`. Vercel debe servir `index.html` para esa ruta. Hoy **no
> existe `vercel.json`** en el repo y no hay rewrites configurados. Se requiere
> una regla de *rewrite* para SPA, por ejemplo:
> ```json
> { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
> ```
> Alternativa sin tocar Vercel: mantener el fallback de detección por fragmento
> (`type=recovery`) que ya funciona en cualquier path, incluida la raíz.
> Esto **no se aplicó**: debe decidirlo/ejecutarlo un administrador.

## 3. Plantillas de correo en Supabase (a revisar)

En **Authentication → Email Templates → Reset Password**:

- La plantilla debe contener el enlace `{{ .ConfirmationURL }}`.
- `{{ .ConfirmationURL }}` debe apuntar a la Redirect URL autorizada.
- Revisar el idioma/tono del correo (el proyecto está en español).
- Revisar el remitente (SMTP) si se reemplaza el servicio por defecto.

No se modificó ninguna plantilla.

## 4. Flujo implementado

1. En el login, el usuario pulsa **¿Olvidaste tu contraseña?**.
2. Introduce el correo; se valida el formato (`esEmailValido`).
3. Se llama `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
   - Se usa la **anon/publishable key** del navegador (`VITE_SB_KEY`). Nunca
     `service_role`. No hay secretos en el cliente.
   - Se muestran estados de carga y se bloquean envíos repetidos (`rSending`).
   - Errores de red se informan aparte; con cualquier otro resultado se muestra
     un **mensaje neutral** que no revela si el correo está registrado.
4. El usuario abre el enlace del correo → pantalla `/reset-password`.
5. La pantalla procesa el enlace **explícitamente** (`procesarEnlaceRecuperacion`)
   porque el cliente usa `detectSessionInUrl: false`:
   - Flujo implícito (por defecto): `#access_token=…&refresh_token=…` → `setSession`.
   - Flujo PKCE: `?code=…` → `exchangeCodeForSession`.
6. Solo con **sesión de recuperación válida** (`hasRecoverySession`) se permite el
   cambio. Se exige nueva contraseña y confirmación coincidentes, con mínimo de 8
   caracteres (`PASSWORD_MIN`).
7. Se actualiza con `supabase.auth.updateUser({ password })`.
8. Tras el éxito: mensaje de confirmación y opción de ir al login. Se cierra la
   sesión de recuperación (`logout`) y se limpia la URL (`history.replaceState`).
   La contraseña nunca se guarda en `localStorage`, ni en la URL, ni en consola.

Estados cubiertos: enlace vencido, enlace inválido, sesión ausente, error de red,
carga, éxito.

## 5. Cómo probar en desarrollo

Sin enviar correo real (limitaciones):
- **No se puede** completar el envío real sin SMTP/plantilla configurados ni sin
  autorizar la Redirect URL. Un `resetPasswordForEmail` contra la Redirect URL no
  autorizada devuelve error.
- La lógica de validación/neutralidad/detección está cubierta por pruebas
  automatizadas (`npm test`, sin red): correo válido/inválido, contraseñas
  coincidentes/mínimo, mensaje neutral, detección de `type=recovery` y `code`,
  limpieza de URL.
- Prueba manual del enlace: requiere **enviar un correo real** y tener la Redirect
  URL autorizada en el proyecto de Supabase (no configurado aquí).

```
npm.cmd test        # valida la lógica pura del flujo (sin red)
npm.cmd run build   # verifica que la app compila
npm.cmd run dev     # http://localhost:5173  (recordar autorizar esta Redirect URL)
```

## 6. Cuenta con invitación pendiente vs. recuperación de contraseña

- **Recuperar contraseña**: aplica a una cuenta **activa** (ya inicializada).
  Supabase envía el enlace de reset y el usuario define una nueva clave.
- **Invitación pendiente**: una cuenta creada pero que **nunca completó su
  registro** puede no tener una contraseña inicializada. El enlace correcto en
  ese caso es de **invitación** (p. ej. `inviteUserByEmail`), no de recuperación.
- No todos los usuarios pueden recuperar su contraseña: si la invitación está
  pendiente, el flujo de reset puede no ser el adecuado.
- Este caso es un **procedimiento separado**. No se amplían los permisos de
  recuperación para resolverlo, y no se creó ni alteró ninguna cuenta (incluida
  la de Vanessa) para probar.

## 7. Restricciones respetadas

- No se modificaron roles, permisos, RLS, Edge Functions, migraciones SQL,
  numeración de cotizaciones/reservas, contadores ni FASE 3.6/3.7.
- No se revirtieron las correcciones recientes de `Reservas.jsx`/`Cotizaciones.jsx`.
- No se hizo commit, push ni deploy. No se tocó la configuración remota.
