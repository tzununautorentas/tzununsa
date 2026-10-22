import { createClient } from "@supabase/supabase-js";

let _sb = null;
let _inited = false;
let _userEmail = null;
let _userName = "Usuario";
let _userId = null;

function setUserFromSession(session) {
  const email = session?.user?.email || "Usuario";
  _userEmail = email;
  _userName = email.split("@")[0] || "Usuario";
  _userId = session?.user?.id || null;
}

export function initAuth(sbUrl, sbKey) {
  if (_inited) return _sb;
  const m = String(sbUrl || "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  const ref = m ? m[1] : "default";
  const storageKey = ref === "fmijbpatkddkbxlkfoza" ? "tzunun_auth" : `tzunun_auth_${ref}`;
  _sb = createClient(sbUrl, sbKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey,
    },
  });
  try { localStorage.removeItem("tzunun_session"); } catch {}
  _inited = true;
  return _sb;
}

function client() {
  if (!_inited || !_sb) throw new Error("Auth no inicializada. Llama initAuth() primero.");
  return _sb;
}

export async function getSession() {
  const { data } = await client().auth.getSession();
  const session = data?.session ?? null;
  setUserFromSession(session);
  return session;
}

export async function getAccessToken() {
  const session = await getSession();
  if (!session?.access_token) return null;
  const exp = session.expires_at ? session.expires_at * 1000 : 0;
  if (exp - Date.now() < 60000 && session.refresh_token) {
    const { data, error } = await client().auth.refreshSession({ refresh_token: session.refresh_token });
    if (!error && data?.session?.access_token) {
      setUserFromSession(data.session);
      return data.session.access_token;
    }
    return session.access_token;
  }
  return session.access_token;
}

export async function refreshSession() {
  const { data, error } = await client().auth.refreshSession();
  if (error) return { error };
  setUserFromSession(data?.session ?? null);
  return { session: data?.session ?? null };
}

export function onAuth(cb) {
  return client().auth.onAuthStateChange((event, session) => {
    setUserFromSession(session);
    cb(event, session);
  });
}

export async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  setUserFromSession(data?.session);
  return { session: data.session };
}

// --- RECUPERACION DE CONTRASEÑA ---
// Solicita el correo de restablecimiento. El SDK envia el enlace usando la
// anon/publishable key del navegador (nunca service_role). `redirectTo` apunta
// a una ruta PUBLICA del mismo origen donde el usuario define la nueva clave.
// No lanza por "usuario inexistente": el llamador muestra un mensaje neutral.
export async function resetPasswordForEmail(email, redirectTo) {
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { ok: true };
}

// Establece la nueva contraseña para la sesion de recuperacion vigente.
// Requiere una sesion activa (la que crea Supabase al abrir el enlace).
export async function updatePassword(password) {
  const { data, error } = await client().auth.updateUser({ password });
  if (error) return { error: error.message };
  return { user: data?.user ?? null };
}

// ¿Hay una sesion de recuperacion valida? Se apoya en la sesion persistida
// por supabase-js tras procesar el enlace (detectSessionInUrl) o el evento
// PASSWORD_RECOVERY. No crea ni expone credenciales.
export async function hasRecoverySession() {
  const { data } = await client().auth.getSession();
  return !!data?.session;
}

// Procesa EXPLICITAMENTE el enlace de recuperación de la URL.
//
// El cliente se inicializa con `detectSessionInUrl: false` (para no interferir
// con el ruteo manual del ERP), por lo que supabase-js NO procesa por su cuenta
// el fragmento. Aquí se hace de forma controlada y compatible con las dos
// variantes de supabase-js v2:
//   - Flujo implicit (por defecto): #access_token=...&refresh_token=...&type=recovery
//     -> auth.setSession(...)
//   - Flujo PKCE: ?code=...  -> auth.exchangeCodeForSession(code)
//
// Devuelve { ok:true } si se estableció una sesión de recuperación, o
// { error: { code } } con code: 'ENLACE_VENCIDO' | 'ENLACE_INVALIDO' | 'ERROR'.
export async function procesarEnlaceRecuperacion(href) {
  const url = String(href || (typeof window !== "undefined" ? window.location.href : ""));
  const hash = (url.split("#")[1] || "");
  const query = (url.split("?")[1] || "").split("#")[0];
  const hp = new URLSearchParams(hash);
  const qp = new URLSearchParams(query);

  // Errores explícitos devueltos por Supabase en el enlace.
  const errCode = hp.get("error_code") || qp.get("error_code") || "";
  const err = hp.get("error") || qp.get("error") || "";
  if (errCode || err) {
    const vencido = errCode === "otp_expired" || /expired/i.test(err);
    return { error: { code: vencido ? "ENLACE_VENCIDO" : "ENLACE_INVALIDO" } };
  }

  const accessToken = hp.get("access_token") || qp.get("access_token");
  const refreshToken = hp.get("refresh_token") || qp.get("refresh_token");
  const code = qp.get("code");

  try {
    if (accessToken && refreshToken) {
      const { data, error } = await client().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { error: { code: "ENLACE_INVALIDO" } };
      setUserFromSession(data?.session ?? null);
      return { ok: true };
    }
    if (code) {
      const { data, error } = await client().auth.exchangeCodeForSession(code);
      if (error) {
        return { error: { code: /expired/i.test(error.message || "") ? "ENLACE_VENCIDO" : "ENLACE_INVALIDO" } };
      }
      setUserFromSession(data?.session ?? null);
      return { ok: true };
    }
  } catch {
    return { error: { code: "ERROR" } };
  }
  return { error: { code: "ENLACE_INVALIDO" } };
}

export async function logout() {
  try { await client().auth.signOut(); } catch {}
  _userEmail = null;
  _userName = "Usuario";
  _userId = null;
  try { localStorage.removeItem("tzunun_session"); } catch {}
}

export function getUserEmail() {
  return _userEmail;
}

export function getUserName() {
  return _userName;
}

export function getUserId() {
  return _userId;
}