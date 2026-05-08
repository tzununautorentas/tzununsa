// --- SUPABASE ---
export const SB = "https://fmijbpatkddkbxlkfoza.supabase.co";
export const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
export const H  = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

// --- DB HELPERS ---
export async function dbGet(table, query = "") {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}?order=created_at.desc${query}`, { headers: H });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

export async function dbIns(table, data) {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.message || j.hint || "Error al guardar" };
    return Array.isArray(j) ? j[0] : j;
  } catch (e) { return { error: e.message }; }
}

export async function dbUpd(table, id, data) {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.message || "Error al actualizar" };
    return Array.isArray(j) ? j[0] : j;
  } catch (e) { return { error: e.message }; }
}

export async function dbDel(table, id) {
  try {
    await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: H });
  } catch {}
}

export async function getEmpId() {
  const d = await dbGet("empresas", "&select=id&limit=1");
  return d && d[0] ? d[0].id : null;
}

// --- SUPABASE AUTH ---
export async function sbLogin(email, password) {
  try {
    const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SK, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  } catch { return { error: "Sin conexion" }; }
}

export async function sbLogout(token) {
  try {
    await fetch(`${SB}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SK, Authorization: `Bearer ${token}` },
    });
  } catch {}
}

// --- THEME ---
// Nota: cada color tiene dos alias: "D" y "Dim" apuntan al mismo valor
export const T = {
  bg:      "#0A0F1E",
  surf:    "#111827",
  card:    "#162032",
  bord:    "#1E3A5F",

  acc:     "#00D4AA", accD:    "#00D4AA22", accDim:    "#00D4AA22",
  sec:     "#F59E0B", secD:    "#F59E0B22", secDim:    "#F59E0B22",
  red:     "#EF4444", redD:    "#EF444422", redDim:    "#EF444422",
  blue:    "#3B82F6", blueD:   "#3B82F622", blueDim:   "#3B82F622",
  purple:  "#A855F7", purpleD: "#A855F722", purpleDim: "#A855F722",
  green:   "#22C55E", greenD:  "#22C55E22", greenDim:  "#22C55E22",

  txt: "#F1F5F9",
  mut: "#64748B",
  sub: "#94A3B8",
};

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
    color: (v === "primary" || v === "green") ? "#0A0F1E" : T.txt,
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
    const d = s.includes("T") ? new Date(s) : new Date(s + "T12:00:00");
    return isNaN(d.getTime())
      ? "\u2014"
      : d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "\u2014"; }
};

export const today = () => new Date().toISOString().slice(0, 10);
export const newId = () => Date.now().toString().slice(-6);

// --- CATALOGO DE VEHICULOS ---
export const CATALOGO = [
  { id:"c1", nombre:"Hyundai Verna (Sedan)",    tipo:"Sedan",    dia:300,  sem:275,  mes:250  },
  { id:"c2", nombre:"Toyota RAV4 Hibrida",      tipo:"SUV",      dia:600,  sem:575,  mes:550  },
  { id:"c3", nombre:"Suzuki XL7 3 filas",       tipo:"SUV",      dia:550,  sem:500,  mes:450  },
  { id:"c4", nombre:"Suzuki Jimny 4x4",         tipo:"SUV",      dia:550,  sem:500,  mes:450  },
  { id:"c5", nombre:"Mitsubishi L200 4x4",      tipo:"Pickup",   dia:550,  sem:500,  mes:450  },
  { id:"c6", nombre:"Mahindra Pickup 4x4",      tipo:"Pickup",   dia:550,  sem:500,  mes:450  },
  { id:"c7", nombre:"Nissan Urvan 16p",         tipo:"Microbus", dia:750,  sem:700,  mes:650  },
  { id:"c8", nombre:"Bus tipo County",          tipo:"Bus",      dia:1000, sem:950,  mes:900  },
  { id:"c9", nombre:"Bus Pullman",              tipo:"Bus",      dia:2000, sem:2000, mes:2000 },
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
export const LOGO_B64 = "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";
