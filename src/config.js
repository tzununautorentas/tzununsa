// â”€â”€â”€ SUPABASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const SB = "https://fmijbpatkddkbxlkfoza.supabase.co";
export const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
export const H  = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

// â”€â”€â”€ DB HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Siempre obtiene el empId fresco desde la BD
export async function getEmpId() {
  const d = await dbGet("empresas", "&select=id&limit=1");
  return d && d[0] ? d[0].id : null;
}

// â”€â”€â”€ SUPABASE AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sbLogin(email, password) {
  try {
    const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SK, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  } catch { return { error: "Sin conexiÃ³n" }; }
}

export async function sbLogout(token) {
  try {
    await fetch(`${SB}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SK, Authorization: `Bearer ${token}` },
    });
  } catch {}
}

// â”€â”€â”€ THEME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const T = {
  bg: "#0A0F1E", surf: "#111827", card: "#162032", bord: "#1E3A5F",
  acc: "#00D4AA", accD: "#00D4AA22", sec: "#F59E0B", secD: "#F59E0B22",
  red: "#EF4444", redD: "#EF444422", blue: "#3B82F6", blueD: "#3B82F622",
  purple: "#A855F7", purpleD: "#A855F722", green: "#22C55E", greenD: "#22C55E22",
  txt: "#F1F5F9", mut: "#64748B", sub: "#94A3B8",
};

// â”€â”€â”€ SHARED STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const S = {
  card: { background: T.card, border: `1px solid ${T.bord}`, borderRadius: 14, padding: 18 },
  inp:  { width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8,
          padding: "9px 12px", color: T.txt, fontSize: 13, outline: "none",
          boxSizing: "border-box", fontFamily: "inherit" },
  sel:  { width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8,
          padding: "9px 12px", color: T.txt, fontSize: 13, outline: "none", boxSizing: "border-box" },
  lbl:  { fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 },
  th:   { textAlign: "left", fontSize: 11, color: T.mut, padding: "7px 10px",
          fontWeight: 600, background: T.surf, borderBottom: `1px solid ${T.bord}` },
  td:   { padding: "9px 10px", borderBottom: `1px solid ${T.bord}22`, fontSize: 13 },
  btn:  (v) => ({
    padding: "8px 14px", borderRadius: 8, cursor: "pointer",
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    border: v === "ghost" ? `1px solid ${T.bord}` : "none",
    background: v === "primary" ? T.acc  : v === "danger" ? T.red :
                v === "blue"    ? T.blue : v === "purple"  ? T.purple :
                v === "green"   ? T.green : v === "warn"   ? T.sec : T.card,
    color: (v === "primary" || v === "green") ? "#0A0F1E" : T.txt,
  }),
};

// â”€â”€â”€ UTILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fmt = (n) =>
  new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export const fmtK = (n) => {
  if (n >= 1000) return "Q " + (n / 1000).toFixed(1) + "k";
  return "Q " + fmt(n);
};

export const fmtD = (s) => {
  if (!s || s === "null" || s === "Invalid Date") return "â€”";
  try {
    const d = s.includes("T") ? new Date(s) : new Date(s + "T12:00:00");
    return isNaN(d.getTime()) ? "â€”" : d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "â€”"; }
};

export const today = () => new Date().toISOString().slice(0, 10);
export const newId = () => Date.now().toString().slice(-6);

// â”€â”€â”€ DATA CONSTANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const CATALOGO = [
  { id: "c1", nombre: "Hyundai Verna (SedÃ¡n)",   tipo: "SedÃ¡n",   dia: 300, sem: 275, mes: 250 },
  { id: "c2", nombre: "Toyota RAV4 HÃ­brida",     tipo: "SUV",     dia: 600, sem: 575, mes: 550 },
  { id: "c3", nombre: "Suzuki XL7 3 filas",      tipo: "SUV",     dia: 550, sem: 500, mes: 450 },
  { id: "c4", nombre: "Suzuki Jimny 4x4",         tipo: "SUV",     dia: 550, sem: 500, mes: 450 },
  { id: "c5", nombre: "Mitsubishi L200 4x4",      tipo: "Pickup",  dia: 550, sem: 500, mes: 450 },
  { id: "c6", nombre: "Mahindra Pickup 4x4",      tipo: "Pickup",  dia: 550, sem: 500, mes: 450 },
  { id: "c7", nombre: "Nissan Urvan 16p",         tipo: "MicrobÃºs",dia: 750, sem: 700, mes: 650 },
  { id: "c8", nombre: "Bus tipo County",          tipo: "Bus",     dia: 1000, sem: 950, mes: 900 },
  { id: "c9", nombre: "Bus Pullman",              tipo: "Bus",     dia: 2000, sem: 2000, mes: 2000 },
];

export const tarifaVeh = (v, dias) => {
  if (!v) return 0;
  if (dias >= 30) return v.mes;
  if (dias >= 8)  return v.sem;
  return v.dia;
};

export const RUTAS = [
  { d: "Antigua Guatemala",         km: 40,  dias: 1 },
  { d: "Escuintla",                 km: 68,  dias: 1 },
  { d: "SacatepÃ©quez",              km: 45,  dias: 1 },
  { d: "Chimaltenango",             km: 110, dias: 1 },
  { d: "TecpÃ¡n",                    km: 93,  dias: 1 },
  { d: "SololÃ¡",                    km: 145, dias: 1 },
  { d: "Panajachel",                km: 140, dias: 1 },
  { d: "Chichicastenango",          km: 150, dias: 1 },
  { d: "QuichÃ© (Sta. Cruz)",        km: 269, dias: 1 },
  { d: "IxcÃ¡n QuichÃ©",              km: 385, dias: 3 },
  { d: "Nebaj",                     km: 235, dias: 2 },
  { d: "CobÃ¡n",                     km: 215, dias: 2 },
  { d: "Chisec Alta Verapaz",       km: 350, dias: 1 },
  { d: "Baja Verapaz (SalamÃ¡)",     km: 165, dias: 1 },
  { d: "Jalapa",                    km: 112, dias: 1 },
  { d: "Jutiapa",                   km: 205, dias: 2 },
  { d: "Santa Rosa (Cuilapa)",      km: 57,  dias: 1 },
  { d: "Chiquimula",                km: 180, dias: 1 },
  { d: "Esquipulas",                km: 215, dias: 1 },
  { d: "Zacapa",                    km: 160, dias: 1 },
  { d: "El Progreso",               km: 135, dias: 1 },
  { d: "Puerto Barrios",            km: 315, dias: 3 },
  { d: "RÃ­o Dulce",                 km: 300, dias: 1 },
  { d: "Livingston",                km: 300, dias: 1 },
  { d: "El Estor Izabal",           km: 590, dias: 4 },
  { d: "PetÃ©n (Flores)",            km: 525, dias: 3 },
  { d: "Tikal",                     km: 536, dias: 4 },
  { d: "Quetzaltenango",            km: 210, dias: 2 },
  { d: "CoatepÃ©que",               km: 225, dias: 1 },
  { d: "Retalhuleu",               km: 200, dias: 1 },
  { d: "Mazatenango",               km: 164, dias: 1 },
  { d: "San Marcos",                km: 284, dias: 1 },
  { d: "Huehuetenango",             km: 275, dias: 3 },
  { d: "Frontera Mesilla",          km: 320, dias: 1 },
  { d: "TotonicapÃ¡n",              km: 185, dias: 2 },
  { d: "Monterrico",                km: 140, dias: 1 },
  { d: "San JosÃ© / Iztapa",         km: 115, dias: 1 },
  { d: "Semuc Champey",             km: 300, dias: 2 },
  { d: "QuiriguÃ¡",                  km: 215, dias: 1 },
  { d: "Ruinas CopÃ¡n Honduras",     km: 235, dias: 1 },
  { d: "Playa El Tunco El Salvador",km: 275, dias: 2 },
];

export const GT = {
  "Guatemala":       ["Guatemala","Mixco","Villa Nueva","AmatitlÃ¡n","Chinautla"],
  "Alta Verapaz":    ["CobÃ¡n","San Pedro CarchÃ¡","Chisec","RaxruhÃ¡"],
  "Baja Verapaz":    ["SalamÃ¡","Rabinal","Cubulco"],
  "Chimaltenango":   ["Chimaltenango","TecpÃ¡n","PatzÃºn","Comalapa"],
  "Chiquimula":      ["Chiquimula","Esquipulas","JocotÃ¡n"],
  "El Progreso":     ["Guastatoya","Sanarate"],
  "Escuintla":       ["Escuintla","Santa LucÃ­a Cotzumalguapa","Tiquisate"],
  "Huehuetenango":   ["Huehuetenango","Chiantla","Todos Santos","Jacaltenango"],
  "Izabal":          ["Puerto Barrios","Livingston","El Estor","Morales"],
  "Jalapa":          ["Jalapa","Monjas"],
  "Jutiapa":         ["Jutiapa","AsunciÃ³n Mita"],
  "PetÃ©n":           ["Flores","San Benito","La Libertad","SayaxchÃ©","PoptÃºn"],
  "Quetzaltenango":  ["Quetzaltenango","CoatepÃ©que","Zunil","Almolonga"],
  "QuichÃ©":          ["Santa Cruz del QuichÃ©","Chichicastenango","Nebaj","IxcÃ¡n"],
  "Retalhuleu":      ["Retalhuleu","Champerico","San SebastiÃ¡n"],
  "SacatepÃ©quez":    ["Antigua Guatemala","Jocotenango","San Lucas SacatepÃ©quez"],
  "San Marcos":      ["San Marcos","MalacatÃ¡n","Tajumulco","Catarina"],
  "Santa Rosa":      ["Cuilapa","Barberena","Chiquimulilla"],
  "SololÃ¡":          ["SololÃ¡","Panajachel","Santiago AtitlÃ¡n","San Pedro La Laguna"],
  "SuchitepÃ©quez":   ["Mazatenango","Cuyotenango"],
  "TotonicapÃ¡n":     ["TotonicapÃ¡n","Momostenango","San Francisco El Alto"],
  "Zacapa":          ["Zacapa","Estanzuela","RÃ­o Hondo","GualÃ¡n"],
};

export const CAT_GASTO = [
  "combustible","mantenimiento","seguros","salarios","impuestos",
  "servicios","llantas","repuestos","hospedaje","alimentacion","peajes","oficina","otros",
];

export const EST_RES = {
  pendiente:  { c: T.mut,   bg: "#1E293B", l: "Pendiente"  },
  confirmada: { c: T.acc,   bg: T.accD,   l: "Confirmada" },
  en_curso:   { c: T.blue,  bg: T.blueD,  l: "En curso"   },
  completada: { c: T.green, bg: T.greenD, l: "Completada" },
  cancelada:  { c: T.red,   bg: T.redD,   l: "Cancelada"  },
};

export const EST_VEH = {
  disponible:    { c: T.acc,  bg: T.accD,  l: "Disponible"  },
  rentado:       { c: T.blue, bg: T.blueD, l: "Rentado"     },
  mantenimiento: { c: T.sec,  bg: T.secD,  l: "Mantenim."   },
};

export const EST_FAC = {
  borrador:    { c: T.mut,   bg: "#1E293B", l: "Borrador"     },
  emitida:     { c: T.blue,  bg: T.blueD,  l: "Emitida"      },
  certificada: { c: T.acc,   bg: T.accD,   l: "Certificada"  },
  pagada:      { c: T.green, bg: T.greenD, l: "Pagada"       },
  parcial:     { c: T.sec,   bg: T.secD,   l: "Pago parcial" },
  anulada:     { c: T.red,   bg: T.redD,   l: "Anulada"      },
};

export const FLUJO_RES = {
  pendiente:  [{ v: "confirmada", l: "âœ“ Confirmar", s: "primary" }, { v: "cancelada", l: "âœ—", s: "danger" }],
  confirmada: [{ v: "en_curso",   l: "â–¶ Iniciar",   s: "blue"    }, { v: "cancelada", l: "âœ—", s: "danger" }],
  en_curso:   [{ v: "completada", l: "âœ“ Completar", s: "primary" }, { v: "cancelada", l: "âœ—", s: "danger" }],
  completada: [],
  cancelada:  [{ v: "pendiente",  l: "â†º Reactivar", s: "ghost"   }],
};

export const LOGO_B64 = "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";
