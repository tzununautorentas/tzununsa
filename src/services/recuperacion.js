// Logica pura del flujo de recuperacion de contraseña (Tz'unun ERP).
//
// Se aisla de UI y del SDK de Supabase para poder probarla con node:test
// sin red. NO contiene secretos ni claves: el envio real lo hace el SDK
// (auth.resetPasswordForEmail) desde el navegador con la anon/publishable key.

// Requisito de contraseña del proyecto. El proyecto no tenia una politica
// definida, por lo que se establece un minimo razonable y se comunica al usuario.
export const PASSWORD_MIN = 8;

// Ruta publica donde Supabase debe devolver el enlace de recuperacion.
export const RECOVERY_PATH = "/reset-password";

// Valida un correo con una comprobacion de formato razonable (no exhaustiva).
export function esEmailValido(email) {
  const e = String(email || "").trim();
  if (!e || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Valida la nueva contraseña. Devuelve { ok, error }.
export function validarNuevaPassword(pwd, confirm) {
  const p = String(pwd || "");
  const c = String(confirm || "");
  if (!p) return { ok: false, error: "Ingresa la nueva contraseña." };
  if (p.length < PASSWORD_MIN) {
    return { ok: false, error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` };
  }
  if (p !== c) return { ok: false, error: "Las contraseñas no coinciden." };
  return { ok: true, error: "" };
}

// Mensaje NEUTRAL de solicitud de recuperacion. Nunca revela si el correo
// esta registrado o no: se muestre para exista o no la cuenta.
export function mensajeSolicitudNeutral() {
  return "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.";
}

// Limpia el fragmento/query de recuperacion de la URL para no dejar tokens
// ni parametros sensibles visibles. Se ejecuta tras procesar el enlace.
// Ej: "#access_token=...&type=recovery" -> "/reset-password"
export function limpiarUrlRecuperacion(hash = "", search = "", pathname = "/") {
  return `${pathname || "/"}`;
}

// Extrae el tipo de enlace a partir del fragmento o del query.
// Supabase (supabase-js v2 con flujo implicit) devuelve `type=recovery`
// en el hash; el flujo PKCE devuelve `code` en el query (?code=...).
export function detectarTipoEnlace(hash = "", search = "") {
  const h = String(hash || "").replace(/^#/, "");
  const s = String(search || "").replace(/^\?/, "");
  const params = new URLSearchParams(h || s);
  const type = params.get("type") || "";
  const hasCode = params.has("code");
  const hasAccessToken = params.has("access_token");
  const error = params.get("error") || "";
  const errorCode = params.get("error_code") || "";
  return { type, hasCode, hasAccessToken, error, errorCode };
}
