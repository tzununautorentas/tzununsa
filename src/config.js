// --- SUPABASE ---
import { initAuth, getAccessToken, refreshSession, signIn, logout, getUserId } from "./services/session.js";

export const SB = import.meta.env.VITE_SB_URL;
export const SK = import.meta.env.VITE_SB_KEY;
if (!SB || !SK) {
  throw new Error("Faltan VITE_SB_URL / VITE_SB_KEY (definelas en .env.local para pruebas)");
}

initAuth(SB, SK);

// --- AUTHENTICATED FETCHER ---
// Con sesión: apikey + Authorization: Bearer <JWT>.
// Sin sesión: solo apikey (sin Bearer con anon key). 401 con token → refresh UNA vez → retry; si falla el refresh, logout.
export async function apiFetch(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const url = /:\/\//.test(path)
    ? path
    : `${SB}/rest/v1${path.startsWith("/") ? path : "/" + path}`;
  const token = await getAccessToken();
  const headers = {
    apikey: SK,
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
    ...(rest.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const exec = () => fetch(url, { ...rest, headers });
  let r = await exec();
  if (r.status === 401 && token) {
    const rf = await refreshSession();
    if (!rf.error) {
      const t2 = await getAccessToken();
      if (t2) {
        headers.Authorization = `Bearer ${t2}`;
        r = await exec();
      }
    } else {
      await logout();
      throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }
  }
  return r;
}

export async function api(path, opts = {}) {
  const res = await apiFetch(path, opts);
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    if (text) {
      try {
        const j = JSON.parse(text);
        msg = j?.message || j?.hint || j?.error_description || j?.error || msg;
      } catch { msg = text.slice(0, 200); }
    }
    throw new Error(msg);
  }
  if (!text || text === "null") return null;
  try { return JSON.parse(text); } catch { return null; }
}

// --- EDGE FUNCTIONS (FASE 3.7) ---
// Invoca una Edge Function del proyecto configurado usando el JWT de la sesión
// actual (nunca service_role desde el navegador). La autorizacion real la impone
// la funcion server-side; aqui solo se adjunta el token.
// Devuelve { data } en exito o { error: { code, status, mensaje } } en fallo.
export async function invokeFuncion(nombre, payload) {
  const token = await getAccessToken();
  if (!token) {
    return { error: { code: "SIN_SESION", status: 401, mensaje: "Inicia sesión para continuar." } };
  }
  try {
    const res = await fetch(`${SB}/functions/v1/${nombre}`, {
      method: "POST",
      headers: {
        apikey: SK,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const map = {
        401: "Sesión no válida o expirada. Inicia sesión nuevamente.",
        403: "No autorizado para esta operación.",
        429: "Demasiados intentos. Intenta más tarde.",
        500: "Error interno del servidor.",
      };
      return {
        error: {
          code: data?.error || `HTTP_${res.status}`,
          status: res.status,
          mensaje: data?.detalle || data?.message || map[res.status] || `Error ${res.status}`,
        },
      };
    }
    return { data };
  } catch (e) {
    return { error: { code: "SIN_CONEXION", status: 0, mensaje: e.message || "Sin conexión" } };
  }
}

// --- DB HELPERS ---
export async function dbGet(table, query = "") {
  try {
    const r = await apiFetch(`/${table}?order=created_at.desc${query}`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

export async function dbIns(table, data, timeoutMs) {
  try {
    const ctrl = timeoutMs ? new AbortController() : null;
    const timer = timeoutMs ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    const r = await apiFetch(`/${table}`, {
      method: "POST",
      extraHeaders: { Prefer: "return=representation" },
      body: JSON.stringify(data),
      signal: ctrl?.signal,
    });
    if (timer) clearTimeout(timer);
    const j = await r.json();
    if (!r.ok) return { error: j.message || j.hint || "Error al guardar" };
    return Array.isArray(j) ? j[0] : j;
  } catch (e) { return { error: e.message || "Timeout" }; }
}

export async function siguienteNumero(tabla, empId) {
  // Reserva ATOMICA del correlativo por empresa via RPC (una sola sentencia
  // UPDATE ... RETURNING en el servidor; sin MAX(numero), sin PATCH silencioso).
  // Si falla o no devuelve un correlativo valido, LANZA: el llamador NO debe
  // insertar el registro.
  if (!empId) {
    throw new Error("No se puede asignar el correlativo porque la empresa activa todavía no está disponible. Espera unos segundos y vuelve a intentarlo");
  }
  const r = await apiFetch(`/rpc/api_siguiente_numero`, {
    method: "POST",
    body: JSON.stringify({ p_modulo: tabla, p_empresa: empId }),
  });
  let data = null;
  try { data = await r.json(); } catch { data = null; }
  if (!r.ok) {
    const msg = (data && (data.message || data.hint)) || `Error ${r.status} al asignar el correlativo`;
    throw new Error(msg);
  }
  if (typeof data !== "string" || !data.trim()) {
    throw new Error("El servidor no devolvió un correlativo válido");
  }
  return data;
}

export async function dbUpd(table, id, data) {
  try {
    const r = await apiFetch(`/${table}?id=eq.${id}`, {
      method: "PATCH",
      extraHeaders: { Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.message || "Error al actualizar" };
    return Array.isArray(j) ? j[0] : j;
  } catch (e) { return { error: e.message }; }
}

export async function dbDel(table, id) {
  try {
    const r = await apiFetch(`/${table}?id=eq.${id}`, {
      method: "DELETE",
      extraHeaders: { Prefer: "return=representation" },
    });
    const text = await r.text();
    let j = null;
    try { j = text ? JSON.parse(text) : null; } catch {}
    if (!r.ok) {
      return { error: j?.message || j?.hint || text || `Error ${r.status} al eliminar` };
    }
    return { ok: true, data: Array.isArray(j) ? j : [] };
  } catch (e) {
    return { error: e.message || "Error de conexion al eliminar" };
  }
}

// Filtro REST de empresa activa (FASE 3.5). Devuelve cadena vacía si no hay empresa.
export function filtroEmpresa(empId) {
  return empId ? `empresa_id=eq.${empId}` : "";
}

// Resolución de empresas autorizadas del usuario autenticado (FASE 3.5).
// Replica el contrato de authz.empresas_autorizadas() mediante REST autenticado:
//   auth_id (JWT) -> usuarios_sistema.id -> usuario_empresas (activo=true) -> empresas.
// La RPC authz no está expuesta por PostgREST (solo public/graphql_public), por eso
// se resuelve desde las relaciones existentes. FASE 3.6 endurecerá con RLS.
export async function getEmpresasAutorizadas() {
  try {
    const authId = getUserId();
    if (!authId) return [];
    const usr = await apiFetch(`/usuarios_sistema?select=id&auth_id=eq.${authId}&limit=1`);
    const us = usr.ok ? await usr.json() : [];
    const usuario = Array.isArray(us) && us.length ? us[0] : null;
    if (!usuario?.id) return [];
    const rels = await apiFetch(`/usuario_empresas?select=empresa_id&usuario_id=eq.${usuario.id}&activo=eq.true`);
    if (!rels.ok) return [];
    const rj = await rels.json();
    const ids = Array.isArray(rj) ? rj.map(r => r.empresa_id).filter(Boolean) : [];
    if (ids.length === 0) return [];
    const ent = await apiFetch(`/empresas?select=id,nombre&id=in.(${ids.map(encodeURIComponent).join(",")})`);
    if (!ent.ok) return [];
    const ej = await ent.json();
    return Array.isArray(ej) ? ej : [];
  } catch { return []; }
}

// Fallback LEGACY (secundario): primera empresa del catálogo global.
export async function getEmpresaFallback() {
  try {
    const ent = await apiFetch(`/empresas?select=id,nombre&limit=1`);
    const ej = ent.ok ? await ent.json() : [];
    return Array.isArray(ej) && ej.length ? ej[0] : null;
  } catch { return null; }
}

export async function getEmpId() {
  const autorizadas = await getEmpresasAutorizadas();
  if (autorizadas && autorizadas.length > 0) return autorizadas[0].id;
  const fb = await getEmpresaFallback();
  return fb ? fb.id : null;
}

// --- SUPABASE AUTH (delegado al SDK) ---
export async function sbLogin(email, password) {
  try { return await signIn(email, password); } catch { return { error: "Sin conexion" }; }
}

export async function sbLogout(token) {
  await logout();
}

export { getAccessToken, refreshSession, logout, getUserId };

// --- THEME (reactivo via CSS Variables) ---
// Cualquier propiedad accedida en T se resuelve como var(--theme-<prop>)
// Las CSS variables se actualizan desde ThemeProvider en theme.jsx
export const T = new Proxy({}, {
  get: (_, prop) => `var(--theme-${prop})`,
  has: () => true,
});

// --- SHARED STYLES ---
export const S = {
  card: {
    background: T.card,
    border: `1px solid ${T.bord}`,
    borderRadius: 14,
    padding: 18,
  },
  inp: {
    width: "100%", background: T.surf, border: `1px solid ${T.bord}`,
    borderRadius: 8, padding: "9px 12px", color: T.txt, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  sel: {
    width: "100%", background: T.surf, border: `1px solid ${T.bord}`,
    borderRadius: 8, padding: "9px 12px", color: T.txt, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  },
  lbl: {
    fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600,
  },
  th: {
    textAlign: "left", fontSize: 11, color: T.mut, padding: "7px 10px",
    fontWeight: 600, background: T.surf, borderBottom: `1px solid ${T.bord}`,
  },
  td: { padding: "9px 10px", borderBottom: `1px solid ${T.bord}22`, fontSize: 13 },
   btn: (v) => ({
    padding: "8px 14px", borderRadius: 8, cursor: "pointer",
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    border: v === "ghost" ? `1px solid ${T.bord}` : "none",
    background:
      v === "primary" ? T.acc    : v === "danger"  ? T.red    :
      v === "blue"    ? T.blue   : v === "purple"   ? T.purple :
      v === "green"   ? T.green  : v === "warn"     ? T.sec    : T.card,
    color: v === "ghost" ? T.txt : "#0A0F1E",
  }),
  // Fila de resumen financiero: srow(true) = resaltado, srow(false) = normal
  srow: (hi) => ({
    display: "flex", justifyContent: "space-between",
    fontSize: 13, padding: "4px 0",
    color: hi ? T.acc : T.sub,
    fontWeight: hi ? 700 : 400,
  }),
};

// --- UTILS ---
export const fmt = (n) =>
  new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export const fmtK = (n) => {
  const num = parseFloat(n) || 0;
  if (num >= 1000) return "Q " + (num / 1000).toFixed(1) + "k";
  return "Q " + fmt(num);
};

export const fmtD = (s) => {
  if (!s || s === "null" || s === "Invalid Date") return "\u2014";
  try {
    const d = new Date((s.includes("T") ? s.split("T")[0] : s) + "T12:00:00");
    return isNaN(d.getTime())
      ? "\u2014"
      : d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "\u2014"; }
};

export const today = () => new Date().toISOString().slice(0, 10);
export const newId = () => Date.now().toString().slice(-6);

// --- TIPOS DE SERVICIO FACTURABLES ---
export const TIPOS_SERVICIO = [
  'Alquiler de vehiculo',
  'Limpieza de vehiculo',
  'Servicio de chofer',
  'Alquiler de microbús',
  'Alquiler de bus',
  'Alquiler de camioneta',
  'Traslado / viaje',
  'Otro',
];

// --- CATALOGO DE VEHICULOS ---
export const CATALOGO = [
  { id:"c1", nombre:"Hyundai Verna (Sedan)",    tipo:"Sedan",    dia:300,  sem:275,  mes:250,  cap:5,  aire:true, trans:"Manual" },
  { id:"c2", nombre:"Toyota RAV4 Hibrida",      tipo:"SUV",      dia:600,  sem:575,  mes:550,  cap:5,  aire:true, trans:"Automática" },
  { id:"c3", nombre:"Suzuki XL7 3 filas",       tipo:"SUV",      dia:550,  sem:500,  mes:450,  cap:7,  aire:true, trans:"Automática" },
  { id:"c4", nombre:"Suzuki Jimny 4x4",         tipo:"SUV",      dia:550,  sem:500,  mes:450,  cap:4,  aire:true, trans:"Manual" },
  { id:"c5", nombre:"Mitsubishi L200 4x4",      tipo:"Pickup",   dia:550,  sem:500,  mes:450,  cap:5,  aire:true, trans:"Manual" },
  { id:"c6", nombre:"Mahindra Pickup 4x4",      tipo:"Pickup",   dia:550,  sem:500,  mes:450,  cap:5,  aire:true, trans:"Manual" },
  { id:"c7", nombre:"Nissan Urvan 16p",         tipo:"Microbus", dia:750,  sem:700,  mes:650,  cap:16, aire:true, trans:"Manual" },
  { id:"c8", nombre:"Bus tipo County",          tipo:"Bus",      dia:1000, sem:950,  mes:900,  cap:30, aire:true, trans:"Manual" },
  { id:"c9", nombre:"Bus Pullman",              tipo:"Bus",      dia:2000, sem:2000, mes:2000, cap:45, aire:true, trans:"Automática" },
];

export const tarifaVeh = (v, dias) => {
  if (!v) return 0;
  if (dias >= 30) return v.mes;
  if (dias >= 8)  return v.sem;
  return v.dia;
};

// --- RUTAS (Guatemala) ---
export const RUTAS = [
  { d:"Antigua Guatemala",            km:40,  dias:1 },
  { d:"Escuintla",                    km:68,  dias:1 },
  { d:"Sacatepequez",                 km:45,  dias:1 },
  { d:"Chimaltenango",                km:110, dias:1 },
  { d:"Tecpan",                       km:93,  dias:1 },
  { d:"Solola",                       km:145, dias:1 },
  { d:"Panajachel",                   km:140, dias:1 },
  { d:"Chichicastenango",             km:150, dias:1 },
  { d:"Quiche (Sta. Cruz)",           km:269, dias:1 },
  { d:"Ixcan Quiche",                 km:385, dias:3 },
  { d:"Nebaj",                        km:235, dias:2 },
  { d:"Coban",                        km:215, dias:2 },
  { d:"Chisec Alta Verapaz",          km:350, dias:1 },
  { d:"Baja Verapaz (Salama)",        km:165, dias:1 },
  { d:"Jalapa",                       km:112, dias:1 },
  { d:"Jutiapa",                      km:205, dias:2 },
  { d:"Santa Rosa (Cuilapa)",         km:57,  dias:1 },
  { d:"Chiquimula",                   km:180, dias:1 },
  { d:"Esquipulas",                   km:215, dias:1 },
  { d:"Zacapa",                       km:160, dias:1 },
  { d:"El Progreso",                  km:135, dias:1 },
  { d:"Puerto Barrios",               km:315, dias:3 },
  { d:"Rio Dulce",                    km:300, dias:1 },
  { d:"Livingston",                   km:300, dias:1 },
  { d:"El Estor Izabal",              km:590, dias:4 },
  { d:"Peten (Flores)",               km:525, dias:3 },
  { d:"Tikal",                        km:536, dias:4 },
  { d:"Quetzaltenango",               km:210, dias:2 },
  { d:"Coatepeque",                   km:225, dias:1 },
  { d:"Retalhuleu",                   km:200, dias:1 },
  { d:"Mazatenango",                  km:164, dias:1 },
  { d:"San Marcos",                   km:284, dias:1 },
  { d:"Huehuetenango",                km:275, dias:3 },
  { d:"Frontera Mesilla",             km:320, dias:1 },
  { d:"Totonicapan",                  km:185, dias:2 },
  { d:"Monterrico",                   km:140, dias:1 },
  { d:"San Jose / Iztapa",            km:115, dias:1 },
  { d:"Semuc Champey",                km:300, dias:2 },
  { d:"Quirigua",                     km:215, dias:1 },
  { d:"Ruinas Copan Honduras",        km:235, dias:1 },
  { d:"Playa El Tunco El Salvador",   km:275, dias:2 },
];

// --- DEPARTAMENTOS DE GUATEMALA ---
export const GT = {
  "Guatemala":      ["Guatemala","Mixco","Villa Nueva","Amatitlan","Chinautla"],
  "Alta Verapaz":   ["Coban","San Pedro Carcha","Chisec","Raxruha"],
  "Baja Verapaz":   ["Salama","Rabinal","Cubulco"],
  "Chimaltenango":  ["Chimaltenango","Tecpan","Patzun","Comalapa"],
  "Chiquimula":     ["Chiquimula","Esquipulas","Jocotan"],
  "El Progreso":    ["Guastatoya","Sanarate"],
  "Escuintla":      ["Escuintla","Santa Lucia Cotzumalguapa","Tiquisate"],
  "Huehuetenango":  ["Huehuetenango","Chiantla","Todos Santos","Jacaltenango"],
  "Izabal":         ["Puerto Barrios","Livingston","El Estor","Morales"],
  "Jalapa":         ["Jalapa","Monjas"],
  "Jutiapa":        ["Jutiapa","Asuncion Mita"],
  "Peten":          ["Flores","San Benito","La Libertad","Sayaxche","Popun"],
  "Quetzaltenango": ["Quetzaltenango","Coatepeque","Zunil","Almolonga"],
  "Quiche":         ["Santa Cruz del Quiche","Chichicastenango","Nebaj","Ixcan"],
  "Retalhuleu":     ["Retalhuleu","Champerico","San Sebastian"],
  "Sacatepequez":   ["Antigua Guatemala","Jocotenango","San Lucas Sacatepequez"],
  "San Marcos":     ["San Marcos","Malacatan","Tajumulco","Catarina"],
  "Santa Rosa":     ["Cuilapa","Barberena","Chiquimulilla"],
  "Solola":         ["Solola","Panajachel","Santiago Atitlan","San Pedro La Laguna"],
  "Suchitepequez":  ["Mazatenango","Cuyotenango"],
  "Totonicapan":    ["Totonicapan","Momostenango","San Francisco El Alto"],
  "Zacapa":         ["Zacapa","Estanzuela","Rio Hondo","Gualan"],
};

export const CAT_GASTO = [
  "combustible","mantenimiento","seguros","salarios","impuestos",
  "servicios","llantas","repuestos","hospedaje","alimentacion",
  "peajes","oficina","otros",
];

// --- ESTADOS Y FLUJOS ---
export const EST_RES = {
  pendiente:  { c: T.mut,   bg: "#1E293B",  l: "Pendiente"  },
  confirmada: { c: T.acc,   bg: T.accD,     l: "Confirmada" },
  en_curso:   { c: T.blue,  bg: T.blueD,    l: "En curso"   },
  completada: { c: T.green, bg: T.greenD,   l: "Completada" },
  cancelada:  { c: T.red,   bg: T.redD,     l: "Cancelada"  },
};

export const EST_VEH = {
  disponible:    { c: T.acc,  bg: T.accD,  l: "Disponible"  },
  rentado:       { c: T.blue, bg: T.blueD, l: "Rentado"     },
  mantenimiento: { c: T.sec,  bg: T.secD,  l: "Mantenim."   },
};

export const EST_FAC = {
  borrador:    { c: T.mut,   bg: "#1E293B",  l: "Borrador"     },
  emitida:     { c: T.blue,  bg: T.blueD,   l: "Emitida"      },
  certificada: { c: T.acc,   bg: T.accD,    l: "Certificada"  },
  pagada:      { c: T.green, bg: T.greenD,  l: "Pagada"       },
  parcial:     { c: T.sec,   bg: T.secD,    l: "Pago parcial" },
  anulada:     { c: T.red,   bg: T.redD,    l: "Anulada"      },
};

export const FLUJO_RES = {
  pendiente:  [
    { v:"confirmada", l:"Confirmar", s:"primary" },
    { v:"cancelada",  l:"Cancelar",  s:"danger"  },
  ],
  confirmada: [
    { v:"en_curso",   l:"Iniciar",   s:"blue"    },
    { v:"cancelada",  l:"Cancelar",  s:"danger"  },
  ],
  en_curso:   [
    { v:"completada", l:"Completar", s:"primary" },
    { v:"cancelada",  l:"Cancelar",  s:"danger"  },
  ],
  completada: [],
  cancelada:  [
    { v:"pendiente",  l:"Reactivar", s:"ghost"   },
  ],
};

// --- LOGO (base64) ---
export const LOGO_B64 = "";

// --- Ordenar lista: primero correlativos (p.ej. COT-000104), luego numeración al azar por fecha ---
export function ordenarNumeracion(lista, campoFecha = "created_at") {
  if (!Array.isArray(lista)) return lista;
  const esCorrelativo = n => /^(COT|RES)-\d{6}$/.test(n || "");
  const fechaVal = r => {
    if (campoFecha === "fecha_emision") return r.fecha_emision || "";
    if (campoFecha === "fecha_inicio") return r.fecha_inicio || "";
    return r.created_at || r.fecha_emision || r.fecha_inicio || "";
  };
  const copy = [...lista];
  copy.sort((a, b) => {
    const ac = esCorrelativo(a.numero);
    const bc = esCorrelativo(b.numero);
    if (ac && !bc) return -1;
    if (!ac && bc) return 1;
    if (ac && bc) {
      const na = parseInt((a.numero.match(/(\d+)/) || [])[1] || "0", 10);
      const nb = parseInt((b.numero.match(/(\d+)/) || [])[1] || "0", 10);
      return nb - na;
    }
    return String(fechaVal(b)).localeCompare(String(fechaVal(a)));
  });
  return copy;
}
