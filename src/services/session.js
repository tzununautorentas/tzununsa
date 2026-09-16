import { createClient } from "@supabase/supabase-js";

let _sb = null;
let _inited = false;
let _userEmail = null;
let _userName = "Usuario";

function setUserFromSession(session) {
  const email = session?.user?.email || "Usuario";
  _userEmail = email;
  _userName = email.split("@")[0] || "Usuario";
}

export function initAuth(sbUrl, sbKey) {
  if (_inited) return _sb;
  _sb = createClient(sbUrl, sbKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "tzunun_auth",
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

export async function logout() {
  try { await client().auth.signOut(); } catch {}
  _userEmail = null;
  _userName = "Usuario";
  try { localStorage.removeItem("tzunun_session"); } catch {}
}

export function getUserEmail() {
  return _userEmail;
}

export function getUserName() {
  return _userName;
}