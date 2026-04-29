/** @jsxRuntime classic */
/** @jsx React.createElement */
alert("ESTE ES EL ARCHIVO CORRECTO");
import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
const DEFAULT_EMPRESA_ID = "adc5f324-a108-49ad-875c-779afe3b9f7f";
const LOGO_B64="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";
const SB="https://fmijbpatkddkbxlkfoza.supabase.co";
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"};
const T={bg:"#0A0F1E",surf:"#111827",card:"#162032",bord:"#1E3A5F",acc:"#00D4AA",accDim:"#00D4AA22",sec:"#F59E0B",secDim:"#F59E0B22",red:"#EF4444",redDim:"#EF444422",blue:"#3B82F6",blueDim:"#3B82F622",purple:"#A855F7",purpleDim:"#A855F722",green:"#22C55E",greenDim:"#22C55E22",txt:"#F1F5F9",mut:"#64748B",sub:"#94A3B8"};
const fmt=n=>new Intl.NumberFormat("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fmtK=n=>n>=1000?`Q ${(n/1000).toFixed(1)}k`:`Q ${fmt(n)}`;
const fmtD=s=>{
  if(!s||s==="Invalid Date"||s==="null"||s==="undefined")return"—";
  try{
    let d;
    if(s instanceof Date){d=s;}
    else if(typeof s==="string"&&s.includes("T")){d=new Date(s);}
    else if(typeof s==="string"&&s.match(/^\d{4}-\d{2}-\d{2}$/)){d=new Date(s+"T12:00:00");}
    else{d=new Date(s);}
    if(!d||isNaN(d.getTime()))return s;
    return d.toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});
  }catch{return String(s);}
};
const today=()=>new Date().toISOString().slice(0,10);
const S={card:{background:T.card,border:`1px solid ${T.bord}`,borderRadius:14,padding:18},lbl:{fontSize:11,color:T.mut,display:"block",marginBottom:4,fontWeight:600},inp:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},sel:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},btn:v=>({padding:"8px 14px",borderRadius:8,border:v==="ghost"?`1px solid ${T.bord}`:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:v==="primary"?T.acc:v==="danger"?T.red:v==="blue"?T.blue:v==="purple"?T.purple:v==="green"?T.green:v==="warn"?T.sec:T.card,color:v==="primary"||v==="green"?"#0A0F1E":T.txt}),div:{borderTop:`1px solid ${T.bord}`,margin:"12px 0"},th:{textAlign:"left",fontSize:11,color:T.mut,padding:"6px 10px",fontWeight:600,background:T.surf},td:{padding:"9px 10px",borderTop:`1px solid ${T.bord}22`,fontSize:13},srow:b=>({display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:b?14:13,fontWeight:b?700:400,color:b?T.txt:T.sub})};
async function dbGet(t,q=""){try{const r=await fetch(`${SB}/rest/v1/${t}?order=created_at.desc${q}`,{headers:H});return r.json();}catch{return[];}}
async function dbIns(t,d){try{const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbUpd(t,id,d){try{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbDel(t,id){try{await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});}catch{}}
function Badge({color,bg,label,small}){return <span style={{display:"inline-block",padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:600,color,background:bg}}>{label}</span>;}
function Toast({msg,type}){if(!msg)return null;const c=type==="ok"?T.acc:T.red;return <div style={{background:T.card,border:`1px solid ${c}`,borderRadius:10,padding:"11px 18px",fontSize:13,color:c,fontWeight:600,marginBottom:14}}>{type==="ok"?"✅":"❌"} {msg}</div>;}
function Spinner(){return <div style={{textAlign:"center",padding:36,color:T.sub}}>⏳ Cargando...</div>;}
function Fld({label,children,span2}){return <div style={span2?{gridColumn:"span 2"}:{}}><label style={S.lbl}>{label}</label>{children}</div>;}
function Empty({icon,msg,action,onAction}){return <div style={{...S.card,textAlign:"center",padding:40,color:T.sub}}><div style={{fontSize:32,marginBottom:10}}>{icon}</div><div>{msg}</div>{action&&<button onClick={onAction} style={{...S.btn("primary"),marginTop:14,fontSize:12}}>{action}</button>}</div>;}
const GT={"Guatemala":["Guatemala","Mixco","Villa Nueva","San Miguel Petapa","Chinautla","Palencia","Fraijanes","Amatitlán"],"Alta Verapaz":["Cobán","San Pedro Carchá","Tactic","Panzós","Senahú","Lanquín","Cahabón","Chisec","Raxruhá"],"Baja Verapaz":["Salamá","Rabinal","Cubulco","Granados","San Jerónimo","Purulhá"],"Chimaltenango":["Chimaltenango","Comalapa","Tecpán","Patzún","Patzicía","Acatenango","Yepocapa"],"Chiquimula":["Chiquimula","Jocotán","Camotán","Olopa","Esquipulas","Quezaltepeque"],"El Progreso":["Guastatoya","Morazán","San Agustín Acasaguastlán","Sanarate"],"Escuintla":["Escuintla","Santa Lucía Cotzumalguapa","Tiquisate","La Gomera","San José","Iztapa"],"Huehuetenango":["Huehuetenango","Chiantla","Cuilco","Jacaltenango","San Pedro Soloma","Todos Santos","Barillas"],"Izabal":["Puerto Barrios","Livingston","El Estor","Morales"],"Jalapa":["Jalapa","San Pedro Pinula","Monjas","Mataquescuintla"],"Jutiapa":["Jutiapa","Santa Catarina Mita","Asunción Mita","Jalpatagua","Moyuta"],"Petén":["Flores","San Benito","San Andrés","La Libertad","Dolores","San Luis","Sayaxché","Poptún"],"Quetzaltenango":["Quetzaltenango","Salcajá","Ostuncalco","Almolonga","Cantel","Zunil","Coatepeque"],"Quiché":["Santa Cruz del Quiché","Chichicastenango","Cunén","Nebaj","Sacapulas","Uspantán","Ixcán"],"Retalhuleu":["Retalhuleu","San Sebastián","San Martín Zapotitlán","Champerico"],"Sacatepéquez":["Antigua Guatemala","Jocotenango","Sumpango","San Lucas Sacatepéquez","Ciudad Vieja"],"San Marcos":["San Marcos","Comitancillo","Tacaná","Tajumulco","Malacatán","Catarina","Ayutla"],"Santa Rosa":["Cuilapa","Barberena","Casillas","Chiquimulilla","Taxisco"],"Sololá":["Sololá","Nahualá","Panajachel","San Lucas Tolimán","Santiago Atitlán"],"Suchitepéquez":["Mazatenango","Cuyotenango","Santo Domingo Suchitepéquez","Chicacao"],"Totonicapán":["Totonicapán","San Cristóbal Totonicapán","San Francisco El Alto","Momostenango"],"Zacapa":["Zacapa","Estanzuela","Río Hondo","Gualán","Teculután"]};
const CATALOGO=[{id:"c1",nombre:"Hyundai Verna (Sedán)",tipo:"Sedán",dia:300,sem:275,mes:250},{id:"c2",nombre:"Toyota RAV4 Híbrida (SUV)",tipo:"SUV",dia:600,sem:575,mes:550},{id:"c3",nombre:"Suzuki XL7 3 filas (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c4",nombre:"Suzuki Jimny 5p 4x4 (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c5",nombre:"Mitsubishi L200 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c6",nombre:"Mahindra Pikup 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c7",nombre:"Nissan Urvan Wide 16p",tipo:"Microbús",dia:750,sem:700,mes:650},{id:"c8",nombre:"Bus tipo County",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c9",nombre:"Bus tipo Pullman",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c10",nombre:"Bus Escolar",tipo:"Bus",dia:600,sem:550,mes:500}];
const CAT_GASTO=["combustible","mantenimiento","seguros","salarios","impuestos","servicios","llantas","repuestos","hospedaje","alimentacion","peajes","oficina","otros"];
const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:T.green,impuestos:T.red,servicios:T.acc,llantas:T.blue,repuestos:T.sec,hospedaje:"#06B6D4",alimentacion:"#EC4899",peajes:T.sec,oficina:T.mut,otros:T.sub};
const EST_RES={pendiente:{c:T.mut,bg:"#1E293B",l:"Pendiente"},confirmada:{c:T.acc,bg:T.accDim,l:"Confirmada"},en_curso:{c:T.blue,bg:T.blueDim,l:"En curso"},completada:{c:T.acc,bg:T.accDim,l:"Completada"},cancelada:{c:T.red,bg:T.redDim,l:"Cancelada"}};
const EST_VEH={disponible:{c:T.acc,bg:T.accDim,l:"Disponible"},rentado:{c:T.blue,bg:T.blueDim,l:"Rentado"},mantenimiento:{c:T.sec,bg:T.secDim,l:"Mantenim."}};
const EST_FAC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},emitida:{c:T.blue,bg:T.blueDim,l:"Emitida"},certificada:{c:T.acc,bg:T.accDim,l:"Certificada"},pagada:{c:T.acc,bg:T.accDim,l:"Pagada"},parcial:{c:T.sec,bg:T.secDim,l:"Pago parcial"},anulada:{c:T.red,bg:T.redDim,l:"Anulada"}};
const FLUJO_RES={pendiente:[{v:"confirmada",l:"✓ Confirmar",s:"primary"},{v:"cancelada",l:"✗",s:"danger"}],confirmada:[{v:"en_curso",l:"▶ Iniciar",s:"blue"},{v:"cancelada",l:"✗",s:"danger"}],en_curso:[{v:"completada",l:"✓ Completar",s:"primary"},{v:"cancelada",l:"✗",s:"danger"}],completada:[],cancelada:[{v:"pendiente",l:"↺",s:"ghost"}]};

// ═══ TABLA DE RUTAS Y DISTANCIAS (de tarifario Tz'unun) ═══
const RUTAS_GT=[
  {d:"Antigua Guatemala",km:40,dias:1},{d:"Baja Verapaz",km:165,dias:1},
  {d:"Champerico",km:230,dias:1},{d:"Chichicastenango",km:150,dias:1},
  {d:"Chimaltenango",km:110,dias:1},{d:"Chiquimula",km:180,dias:1},
  {d:"Cobán",km:215,dias:2},{d:"Coatepéque",km:225,dias:1},
  {d:"El Estor Izabal",km:590,dias:4},{d:"El Progreso",km:135,dias:1},
  {d:"Esquipulas",km:215,dias:1},{d:"Escuintla",km:68,dias:1},
  {d:"Flores Petén",km:520,dias:2},{d:"Frontera Mesilla",km:320,dias:1},
  {d:"Huehuetenango",km:275,dias:3},{d:"Irtra Retalhuleu",km:190,dias:1},
  {d:"Ixcán Quiché",km:385,dias:3},{d:"Izabal",km:245,dias:1},
  {d:"Jalapa",km:112,dias:1},{d:"Jutiapa",km:205,dias:2},
  {d:"Livingston",km:300,dias:1},{d:"Monterrico",km:140,dias:3},
  {d:"Panajachel",km:140,dias:1},{d:"Petén (Flores)",km:525,dias:3},
  {d:"Puerto Barrios",km:315,dias:3},{d:"Quetzaltenango",km:210,dias:2},
  {d:"Quiché (Sta. Cruz)",km:269,dias:1},{d:"Quiriguá",km:215,dias:1},
  {d:"Rabinal Baja Verapaz",km:185,dias:1},{d:"Retalhuleu",km:200,dias:1},
  {d:"Río Dulce",km:300,dias:1},{d:"Río Hondo Zacapa",km:145,dias:1},
  {d:"Ruinas Copán Honduras",km:235,dias:1},{d:"Sacatepéquez",km:45,dias:1},
  {d:"San José / Iztapa",km:115,dias:1},{d:"San Lucas Sacatepéquez",km:25,dias:1},
  {d:"San Marcos",km:284,dias:1},{d:"San Pedro La Laguna",km:180,dias:3},
  {d:"Santa Rosa",km:57,dias:1},{d:"Semuc Champey",km:300,dias:2},
  {d:"Sololá",km:145,dias:1},{d:"Suchitepéquez",km:164,dias:1},
  {d:"Tecpán",km:93,dias:1},{d:"Tikal Petén",km:536,dias:4},
  {d:"Totonicapán",km:185,dias:2},{d:"Zacapa",km:160,dias:1},
  {d:"Nebaj Quiché",km:235,dias:2},{d:"Chisec Alta Verapaz",km:350,dias:1},
  {d:"Playa El Tunco El Salvador",km:275,dias:2},{d:"Suchitoto El Salvador",km:253,dias:2},
  {d:"Jocotan Chiquimula",km:210,dias:1},{d:"Zacualpa Quiché",km:210,dias:2},
];

// ═══════════════════════════════════════════════════════════════
// AUTENTICACIÓN — Login con Supabase Auth
// ═══════════════════════════════════════════════════════════════
const USERS_ALLOWED = [
  "oscar@tzununautorentas.com",
  "empleado1@tzununautorentas.com",
  "empleado2@tzununautorentas.com",
  "empleado3@tzununautorentas.com",
  "empleado4@tzununautorentas.com",
];

async function sbSignIn(email, password) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SK, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

async function sbSignOut(token) {
  await fetch(`${SB}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
  });
}

async function sbGetUser(token) {
  const r = await fetch(`${SB}/auth/v1/user`, {
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
  });
  return r.json();
}


// ── PANTALLA: CREAR/CAMBIAR CONTRASEÑA (desde link de invitación) ─────────────
async function sbSetPassword(token, newPassword) {
  const r = await fetch(`${SB}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: SK, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password: newPassword }),
  });
  return r.json();
}

function SetPasswordScreen({ token, onDone }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSet = async () => {
    if (pwd.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (pwd !== pwd2) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    const data = await sbSetPassword(token, pwd);
    if (data.id) {
      setMsg("✅ Contraseña creada. Ya puedes iniciar sesión.");
      setTimeout(onDone, 2000);
    } else {
      setError("Error al guardar. Pide una nueva invitación.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.acc }}>Crear contraseña</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Tz'unun AutoRentas — Primer acceso</div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
          {msg ? (
            <div style={{ textAlign: "center", fontSize: 16, color: T.acc, padding: 20 }}>{msg}</div>
          ) : (
            <>
              {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>❌ {error}</div>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>NUEVA CONTRASEÑA (mínimo 8 caracteres)</label>
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONFIRMAR CONTRASEÑA</label>
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && handleSet()} />
              </div>
              <button onClick={handleSet} disabled={loading}
                style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Guardando..." : "Crear contraseña →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await sbSignIn(email.trim(), password);
      if (data.access_token) {
        localStorage.setItem("tzunun_token", data.access_token);
        localStorage.setItem("tzunun_user", JSON.stringify({ email: data.user?.email, name: data.user?.user_metadata?.name || data.user?.email }));
        onLogin(data.access_token, data.user);
      } else {
        setError("Correo o contraseña incorrectos");
      }
    } catch {
      setError("Error de conexión. Verifica tu internet.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.acc }}>Tz'unun AutoRentas</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Sistema de Gestión Integral</div>
        </div>

        {/* Card login */}
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 24, textAlign: "center" }}>Iniciar sesión</div>

          {error && (
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>
              ❌ {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CORREO ELECTRÓNICO</label>
            <input
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@tzununautorentas.com"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONTRASEÑA</label>
            <input
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Verificando..." : "Entrar →"}
          </button>

          <div style={{ marginTop: 20, padding: "12px 14px", background: T.surf, borderRadius: 8, fontSize: 12, color: T.sub }}>
            <div style={{ fontWeight: 600, color: T.mut, marginBottom: 4 }}>¿PRIMER ACCESO?</div>
            Ve a Supabase → Authentication → Users → Invite user y agrega el correo de cada empleado. Ellos recibirán un correo para crear su contraseña.
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.mut }}>
          TzununSA · Acceso exclusivo para personal autorizado
        </div>
      </div>
    </div>
  );
}



// ═══ COTIZACIONES ═══

function ClienteAutocomplete({value, onChange, onSelect, clientes}){
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(()=>{
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[]);

  const handleChange = e => {
    const v = e.target.value;
    onChange(v);
    if(v.length > 0){
      setFiltered(clientes.filter(c=>c.nombre.toLowerCase().includes(v.toLowerCase())).slice(0,6));
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const select = c => {
    onSelect(c);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{position:"relative"}}>
      <input style={S.inp} value={value} onChange={handleChange}
        placeholder="Escribe para buscar cliente..." autoComplete="off"/>
      {open && filtered.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:100,maxHeight:200,overflowY:"auto",marginTop:2}}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>select(c)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`,fontSize:13}}
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontWeight:600,color:T.txt}}>{c.nombre}</div>
              <div style={{fontSize:11,color:T.sub}}>NIT: {c.nit||"—"} · {c.tipo}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function generarPDF(d){
  if(!window.jspdf){alert("PDF no disponible. Recarga la página e intenta de nuevo.");return null;}
  const {jsPDF} = window.jspdf;
  if(!jsPDF){alert("jsPDF no cargó. Intenta de nuevo en unos segundos.");return;}
  const doc = new jsPDF({orientation:"portrait",unit:"pt",format:"letter"});
  const W = doc.internal.pageSize.getWidth();
  const HP = doc.internal.pageSize.getHeight();
  const NAVY=[27,45,92],TEAL=[0,212,170],TEAL2=[29,158,117],GRAY=[100,116,139];
  const LGRAY=[241,245,249],WHITE=[255,255,255],AMBER=[245,158,11],DKGRAY=[51,65,85];

  // Header
  doc.setFillColor(...NAVY); doc.rect(0,0,W,90,"F");
  doc.setFillColor(...TEAL); doc.rect(0,0,W,3,"F");
  try{ doc.addImage("data:image/png;base64,"+LOGO_B64,"PNG",18,8,70,70); }catch(e){}
  doc.setTextColor(...WHITE); doc.setFontSize(17); doc.setFont("helvetica","bold");
  doc.text("TZ'UNUN AUTORENTAS",100,34);
  doc.setTextColor(0,212,170); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("MÁS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS  ★  ★",100,48);
  doc.setTextColor(148,163,184); doc.setFontSize(7.5);
  doc.text("2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala",100,61);
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas",100,72);
  doc.setTextColor(0,212,170); doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text(d.es_orden?"ORDEN DE VENTA":"COTIZACIÓN",W-20,33,{align:"right"});
  doc.setTextColor(...WHITE); doc.setFontSize(10);
  doc.text("# "+d.numero,W-20,48,{align:"right"});
  doc.setTextColor(148,163,184); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Emisión:      "+d.fecha,W-20,61,{align:"right"});
  doc.text("Válida hasta: "+(d.fecha_vence||"15 días"),W-20,72,{align:"right"});
  doc.setDrawColor(...TEAL); doc.setLineWidth(2); doc.line(0,92,W,92);

  let y = 110;

  // Cliente
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("FACTURAR A:",22,y); y+=12;
  doc.setTextColor(30,41,59); doc.setFontSize(12); doc.setFont("helvetica","bold");
  // Client name with auto-wrap for long names
  const clientLines = doc.splitTextToSize(d.cliente||"", 180);
  doc.text(clientLines, 22, y);
  y += clientLines.length * 8;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","normal");
  if(d.nit) doc.text("NIT: "+d.nit+(d.dir_cliente?"   |   "+d.dir_cliente:""),22,y);
  y+=8;
  doc.setDrawColor(226,232,240); doc.setLineWidth(0.5); doc.line(22,y,W-22,y); y+=12;

  // Saludo
  doc.setFillColor(232,245,240); doc.roundedRect(22,y,W-44,46,4,4,"F");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,46,"F");
  doc.setTextColor(27,45,92); doc.setFontSize(9); doc.setFont("helvetica","bold");
  const saludoText = (d.saludo||"Estimados señores de "+(d.cliente||"")) + ":";
  const saludoLines = doc.splitTextToSize(saludoText, W-70);
  doc.text(saludoLines[0].slice(0, 80), 32, y+13);
  doc.setTextColor(...DKGRAY); doc.setFontSize(7.8); doc.setFont("helvetica","normal");
  const intro="En Transportes Tz'unun nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas en renta de vehículos, viajes de turismo y traslado de personas en Guatemala y Centroamérica. Con mucho gusto le presentamos la siguiente cotización:";
  const introL=doc.splitTextToSize(intro,W-88);
  introL.slice(0,3).forEach((ln,i)=>doc.text(ln,32,y+25+(i*9)));
  y+=58;

  // Descripción
  if(d.servicio){
    doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
    doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
    doc.text("DESCRIPCIÓN DEL SERVICIO",30,y+8); y+=16;
    doc.setTextColor(...DKGRAY); doc.setFontSize(8); doc.setFont("helvetica","italic");
    const sl=doc.splitTextToSize(d.servicio,W-44);
    sl.slice(0,3).forEach((ln,i)=>doc.text(ln,22,y+(i*10)));
    y+=sl.slice(0,3).length*10+8;
  }

  // 3 columnas
  const colW=(W-44)/3;
  const cols=[
    {title:"VEHÍCULO Y CARACTERÍSTICAS",items:d.caract,color:[0,200,150]},
    {title:"SERVICIOS INCLUIDOS",items:d.incluidos,color:[27,45,92]},
    {title:"BENEFICIOS",items:d.beneficios,color:[245,158,11]},
  ];
  const maxR=Math.max(...cols.map(c=>c.items.length));
  const boxH=14+maxR*9.5+8;
  cols.forEach((col,ci)=>{
    const cx=22+ci*colW;
    doc.setFillColor(ci%2===0?241:232,ci%2===0?245:238,ci%2===0?249:244);
    doc.roundedRect(cx,y,colW-2,boxH,3,3,"F");
    doc.setFillColor(...col.color); doc.rect(cx,y,3,boxH,"F");
    doc.setTextColor(...col.color); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.text(col.title,cx+8,y+10);
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.line(cx+6,y+13,cx+colW-8,y+13);
    doc.setTextColor(...DKGRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
    col.items.forEach((item,j)=>doc.text("• "+item,cx+9,y+22+(j*9.5)));
  });
  y+=boxH+10;

  // Nota combustible
  if(!d.con_piloto){
    doc.setFillColor(255,248,231); doc.roundedRect(22,y,W-44,13,3,3,"F");
    doc.setFillColor(...AMBER); doc.rect(22,y,3,13,"F");
    doc.setTextColor(146,64,14); doc.setFontSize(7.2); doc.setFont("helvetica","bold");
    doc.text("⚠  SIN PILOTO: Vehículo entregado con tanque lleno — debe devolverse con tanque lleno.",32,y+8);
    y+=18;
  }

  // Tabla financiera
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
  doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
  doc.text("RESUMEN FINANCIERO",30,y+8); y+=14;
  const finRows=[
    ["Subtotal (precio base)",fmt(d.sub),fmt(d.sub/d.exch),false,false],
    ["Impuesto "+d.iva_pct+"% ("+(d.iva_pct===5?"Pequeño Contribuyente":"Régimen General")+")",fmt(d.iva_amt),fmt(d.iva_amt/d.exch),false,false],
    ["PRECIO BENEFICIO — Efectivo / Depósito / Transferencia",fmt(d.total_ef),fmt(d.total_ef/d.exch),true,false],
    ["Con Tarjeta de Crédito / Débito",fmt(d.total_tc),fmt(d.total_tc/d.exch),false,true],
  ];
  const cW=[310,100,90];
  doc.setFillColor(...NAVY); doc.rect(22,y,W-44,16,"F");
  doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("Concepto",28,y+10); doc.text("GTQ",22+310+100-6,y+10,{align:"right"});
  doc.text("USD",22+310+100+90-6,y+10,{align:"right"}); y+=16;
  finRows.forEach((row,ri)=>{
    const [concepto,gtq,usd,isBenef,isTC]=row;
    if(isBenef) doc.setFillColor(232,245,240);
    else if(isTC) doc.setFillColor(255,253,235);
    else doc.setFillColor(ri%2===0?255:241,ri%2===0?255:245,ri%2===0?255:249);
    doc.rect(22,y,W-44,16,"F");
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.rect(22,y,W-44,16,"S");
    doc.setTextColor(isBenef?TEAL2[0]:isTC?AMBER[0]:DKGRAY[0],isBenef?TEAL2[1]:isTC?AMBER[1]:DKGRAY[1],isBenef?TEAL2[2]:isTC?AMBER[2]:DKGRAY[2]);
    doc.setFontSize(isBenef||isTC?8.5:8); doc.setFont("helvetica",isBenef?"bold":"normal");
    doc.text(concepto,28,y+10);
    doc.setFont("helvetica","bold"); doc.text(gtq,22+310+100-6,y+10,{align:"right"});
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.text("$ "+usd,22+310+100+90-6,y+10,{align:"right"}); y+=16;
  });
  y+=10;

  // Términos y cuentas
  const termH=66;
  doc.setFillColor(241,245,249); doc.roundedRect(22,y,W-44,termH,4,4,"F");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,termH,"F");
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.text("TÉRMINOS Y CONDICIONES",30,y+10);
  const terms=[
    "• Nuestros vehículos son higienizados antes y después de cada servicio.",
    "• Se requiere copia de DPI del responsable del grupo.",
    "• Anticipo del 75% para confirmar el servicio.",
    d.con_piloto?"• Combustible incluido según el recorrido acordado.":"• Vehículo entregado con tanque lleno — devolver lleno.",
    "• El vehículo debe devolverse limpio (recargo Q.75.00 si no cumple).",
    "• El saldo restante se cancela al finalizar el servicio.",
  ];
  doc.setFontSize(7.2); doc.setFont("helvetica","normal"); doc.setTextColor(...DKGRAY);
  terms.forEach((t,i)=>doc.text(t,30,y+20+(i*7.5)));
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.4); doc.line(372,y+8,372,y+termH-8);
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.text("DATOS DE PAGO",380,y+10);
  doc.setTextColor(0,200,150); doc.text("Banco Industrial",380,y+22);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.text("Cta. Monetaria No. 853-000016-8",380,y+31);
  doc.text("A nombre de: Transportes Tz'unun",380,y+39);
  doc.setDrawColor(203,213,225); doc.line(380,y+43,W-26,y+43);
  doc.setTextColor(0,200,150); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.text("Banrural",380,y+52);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.text("Cta. No. 3309159475",380,y+61);
  y+=termH+10;

  // Firma y cierre
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.6); doc.line(22,y,180,y);
  doc.setTextColor(27,45,92); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("Oscar Gálvez",22,y+11);
  doc.setTextColor(...GRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
  doc.text("Cel. 502 31221538   |   @TzununAutorentas",22,y+21);
  doc.setTextColor(0,200,150); doc.setFontSize(8.5); doc.setFont("helvetica","bolditalic");
  doc.text("Muchas gracias por su preferencia, esperamos poder servirle.",W/2,y+11,{align:"center"});
  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Adjunto cotización, quedamos a la espera de su aprobación.",W/2,y+21,{align:"center"});

  // Pie
  doc.setFillColor(...NAVY); doc.rect(0,HP-36,W,36,"F");
  doc.setFillColor(...TEAL); doc.rect(0,HP-36,W,2,"F");
  doc.setTextColor(148,163,184); doc.setFontSize(6.5); doc.setFont("helvetica","normal");
  doc.text("TZ'UNUN AUTORENTAS  —  Más comodidad, rapidez y mejores precios",W/2,HP-21,{align:"center"});
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas   |   Guatemala",W/2,HP-11,{align:"center"});

  return doc;
}

function ModalVistaPrevia({cot, onClose}){
  if(!cot) return null;
  const sub=parseFloat(cot.subtotal)||0;
  const iva_pct=parseFloat(cot.tasa_iva)||5;
  const iva_amt=sub*iva_pct/100;
  const total_ef=sub+iva_amt;
  const total_tc=total_ef*1.05;
  const exch=parseFloat(cot.tasa_cambio)||7.70;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.bord}`,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.bord}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14,fontWeight:700,color:T.acc}}>Vista previa — {cot.numero}</div>
          <button onClick={onClose} style={{...S.btn("ghost"),padding:"4px 10px"}}>✕</button>
        </div>
        <div style={{padding:20}}>
          {/* Mini header */}
          <div style={{background:"#1B2D5C",borderRadius:10,padding:16,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:T.acc}}>TZ'UNUN AUTORENTAS</div>
                <div style={{fontSize:10,color:T.sub}}>502-31221538 · tzununautorentas@gmail.com</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:800,color:T.acc}}>{cot.orden_venta?"ORDEN DE VENTA":"COTIZACIÓN"}</div>
              <div style={{fontSize:12,color:"#fff"}}>#{cot.numero}</div>
              <div style={{fontSize:11,color:T.sub}}>{cot.fecha_emision||cot.created_at?.slice(0,10)}</div>
            </div>
          </div>
          {/* Cliente */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:T.mut,fontWeight:700,marginBottom:4}}>FACTURAR A:</div>
            <div style={{fontSize:14,fontWeight:700}}>{cot.cliente_nombre}</div>
            <div style={{fontSize:12,color:T.sub}}>NIT: {cot.cliente_nit||"—"} · {cot.cliente_dir||""}</div>
          </div>
          {/* Saludo */}
          {cot.saludo&&<div style={{background:"#00D4AA11",border:"1px solid #00D4AA33",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.sub,fontStyle:"italic"}}>"{cot.saludo}"</div>}
          {/* Descripción */}
          {cot.descripcion_servicio&&<div style={{marginBottom:12,fontSize:12,color:T.sub,fontStyle:"italic"}}>{cot.descripcion_servicio}</div>}
          {/* Financiero */}
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:12}}>
            {[[`Subtotal`,fmt(sub)],[`IVA (${iva_pct}%)`,fmt(iva_amt)]].map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13,color:T.sub}}><span>{l}</span><span>Q {v}</span></div>
            ))}
            <div style={{borderTop:`1px solid ${T.bord}`,margin:"8px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800,color:T.acc}}><span>PRECIO BENEFICIO</span><span>Q {fmt(total_ef)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>Equivalente USD</span><span>$ {fmt(total_ef/exch)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,marginTop:6}}><span>Con Tarjeta C/D</span><span>Q {fmt(total_tc)}</span></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc)doc.save(`${cot.numero}.pdf`);}} style={{...S.btn("primary"),fontSize:12}}>⬇ Descargar PDF</button>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc){const blob=doc.output("blob");const url=URL.createObjectURL(blob);window.open(url,"_blank");}}} style={{...S.btn("blue"),fontSize:12}}>🖨️ Imprimir</button>
            <button onClick={()=>{const subject=encodeURIComponent(`Cotización ${cot.numero} — Tz'unun AutoRentas`);const body=encodeURIComponent(`Estimados,\n\nAdjunto cotización ${cot.numero} por Q ${fmt(total_ef)}.\n\nSaludos,\nOscar Gálvez\nTz'unun AutoRentas\n502-31221538`);window.open(`mailto:?subject=${subject}&body=${body}`);}} style={{...S.btn("ghost"),fontSize:12}}>✉️ Email</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FORMULARIO COTIZACIÓN ─────────────────────────────────────────────────────
const EMPTY_F={
  cliente_nombre:"",cliente_nit:"",cliente_dir:"",
  saludo:"",descripcion_servicio:"",
  tipo:"renta",vehiculo_nombre:"",con_piloto:true,
  dias:1,precio_custom:"",
  iva_pct:5,pago:"efectivo",exch:7.70,
  fecha_emision:today(),fecha_vence:"",
  estado:"borrador",notas:"",
  caract:[],incluidos:[],beneficios:[],
  imagen_url:"",
};

function FormCotizacion({initial, empId, clientes, onSave, onCancel}){
  const isClone = initial?.__clon;
  const [f,setF]=useState(()=>{
    if(!initial) return {...EMPTY_F};
    return {
      ...EMPTY_F,
      cliente_nombre:initial.cliente_nombre||"",
      cliente_nit:initial.cliente_nit||"",
      cliente_dir:initial.cliente_dir||"",
      saludo:initial.saludo||"",
      descripcion_servicio:initial.descripcion_servicio||"",
      tipo:initial.tipo||"renta",
      vehiculo_nombre:initial.vehiculo_nombre||"",
      con_piloto:initial.con_piloto!==false,
      dias:initial.dias||1,
      precio_custom:initial.precio_personalizado||"",
      iva_pct:initial.tasa_iva||5,
      pago:initial.metodo_pago||"efectivo",
      exch:initial.tasa_cambio||7.70,
      fecha_emision:today(),
      fecha_vence:initial.fecha_vence||"",
      estado:"borrador",
      notas:initial.notas||"",
      incl:initial.incl||[],
      incluidos_texto:initial.incluidos_texto||"",
    };
  });
  const [saving,setSaving]=useState(false);

  const [mostrarTC,setMostrarTC]=useState(true);  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const fileRef=useRef(null);
  const [imgPreview,setImgPreview]=useState(null);

  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const rate=f.precio_custom>0?parseFloat(f.precio_custom)||0:(vehObj?tarifaFn(vehObj,f.dias):0);
  const sub=f.dias*rate;
  const iva_amt=sub*f.iva_pct/100;
  const total_ef=sub+iva_amt;
  const total_tc=total_ef*1.05;
  const exch=parseFloat(f.exch)||7.70;

  const caract=vehObj?[vehObj.nombre,"Aire acondicionado","Cinturones de seguridad","Seguro total"]:["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"];
  const incluidos=f.con_piloto?["Combustible lleno (súper/diésel)","Conductor/piloto profesional","Servicio y atención especializada"]:["Vehículo entregado con tanque lleno","Asistencia en ruta disponible","Servicio y atención especializada"];
  const beneficios=["Experiencia de viaje segura y cómoda","Flexibilidad a sus necesidades","Puntualidad garantizada"];

  const handleFile=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

const guardar = async (estado) => {
  alert("Estoy entrando a guardar");
  try {
    const payload = {
      empresa_id: DEFAULT_EMPRESA_ID,
      numero: "TEST-" + Date.now(),
      cliente_nombre: "PRUEBA DIRECTA"
    };

    console.log("📤 Enviando:", payload);

    const { data, error } = await supabase
      .from("cotizaciones")
      .insert([payload])
      .select();

    console.log("📥 DATA:", data);
    console.log("❌ ERROR:", error);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Guardado correctamente");
    }

  } catch (err) {
    console.error("🔥 ERROR:", err);
  }
};

  if(!isClone && initial?.id && !initial?.__clon){
    result = await dbUpd("cotizaciones", initial.id, payload);
  } else {
    result = await dbIns("cotizaciones", payload);
  }

  console.log("✅ RESULTADO:", result);

  if (!result || result.error) {
    console.error("❌ ERROR AL GUARDAR:", result?.error);
    alert("Error al guardar: " + (result?.error?.message || "Error desconocido"));
    setSaving(false);
    return;
  }

  setSaving(false);
  onSave(estado);

} catch (err) {
  console.error("🔥 ERROR CRÍTICO:", err);
  alert("Error crítico: " + err.message);
  setSaving(false);
}
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.acc}}>
          {isClone?"Clonar cotización":initial?.id?"Editar cotización":"Nueva cotización"}
        </div>
        <button onClick={() => guardar("borrador")} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {/* FORM */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Cliente */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>👤 DATOS DEL CLIENTE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <div style={{gridColumn:"span 2"}}>
                <label style={S.lbl}>CLIENTE (escribe para buscar)</label>
                <ClienteAutocomplete
                  value={f.cliente_nombre}
                  onChange={v=>sf("cliente_nombre",v)}
                  onSelect={c=>{sf("cliente_nombre",c.nombre);sf("cliente_nit",c.nit||"");sf("cliente_dir",c.direccion||"");sf("saludo","Estimados señores de "+c.nombre);}}
                  clientes={clientes}
                />
              </div>
              <div><label style={S.lbl}>NIT</label><input style={S.inp} value={f.cliente_nit} onChange={e=>sf("cliente_nit",e.target.value)} placeholder="7032528"/></div>
              <div><label style={S.lbl}>DIRECCIÓN DEL CLIENTE</label><input style={S.inp} value={f.cliente_dir} onChange={e=>sf("cliente_dir",e.target.value)} placeholder="Ciudad, zona..."/></div>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>SALUDO PERSONALIZADO</label>
                <input style={S.inp} value={f.saludo} onChange={e=>sf("saludo",e.target.value)} placeholder="Ej: Estimados señores de Fundación Myrna Mack"/>
              </div>
            </div>
          </div>
          {/* Servicio */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>🚗 SERVICIO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>VEHÍCULO</label>
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>DÍAS</label><input style={S.inp} type="number" min="1" value={f.dias} onChange={e=>sf("dias",parseInt(e.target.value)||1)}/></div>
              <div><label style={S.lbl}>PRECIO PERSONALIZADO</label><input style={S.inp} type="number" value={f.precio_custom} onChange={e=>sf("precio_custom",e.target.value)} placeholder="Vacío = catálogo"/></div>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>MODALIDAD</label>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>sf("con_piloto",true)} style={{...S.btn(f.con_piloto?"primary":"ghost"),flex:1,fontSize:11}}>🧑‍✈️ Con piloto</button>
                  <button onClick={()=>sf("con_piloto",false)} style={{...S.btn(!f.con_piloto?"warn":"ghost"),flex:1,fontSize:11}}>🔑 Sin piloto</button>
                </div>
              </div>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>DESCRIPCIÓN DEL SERVICIO</label>
                <textarea style={{...S.inp,minHeight:64,resize:"vertical"}} value={f.descripcion_servicio} onChange={e=>sf("descripcion_servicio",e.target.value)} placeholder="Ej: Servicio de traslado de personas de Ciudad Guatemala hacia Quetzaltenango, ida y vuelta, del 19 al 21 de marzo..."/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <label style={S.lbl}>IMAGEN DEL VEHÍCULO (opcional)</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>fileRef.current?.click()} style={{...S.btn("ghost"),fontSize:11}}>📷 Adjuntar imagen</button>
                  {imgPreview&&<img src={imgPreview} style={{height:40,borderRadius:6,border:`1px solid ${T.bord}`}} alt="veh"/>}
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
                </div>
              </div>
            </div>
          </div>
          {/* Fiscal */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>💰 FISCAL Y FECHAS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>IVA</label>
                <div style={{display:"flex",gap:8}}>
                  {[{v:12,l:"12% General"},{v:5,l:"5% Pequeño Cont."},{v:0,l:"Sin IVA"}].map(o=>(
                    <button key={o.v} onClick={()=>sf("iva_pct",o.v)} style={{...S.btn(f.iva_pct===o.v?"primary":"ghost"),flex:1,fontSize:11}}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div><label style={S.lbl}>TASA CAMBIO GTQ=1USD</label><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",e.target.value)}/></div>
              <div><label style={S.lbl}>VÁLIDA HASTA</label><input style={S.inp} value={f.fecha_vence} onChange={e=>sf("fecha_vence",e.target.value)} placeholder="Ej: 28 de abril de 2026"/></div>
              <div><label style={S.lbl}>ESTADO</label>
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div><label style={S.lbl}>NOTAS INTERNAS</label><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></div>
            </div>
          </div>
        </div>
        {/* RESUMEN */}
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
          {f.cliente_nombre&&<div style={{fontSize:13,fontWeight:700,marginBottom:4}}>👤 {f.cliente_nombre}</div>}
          {f.saludo&&<div style={{fontSize:12,color:T.sub,fontStyle:"italic",marginBottom:8}}>{f.saludo}</div>}
          {vehObj&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {f.dias} día{f.dias!==1?"s":""}</div>}
          {sub>0?(
            <>
              {vehObj&&(
                <div style={{background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:8,padding:"10px 14px",marginBottom:10}}>
                  <div style={{display:"flex",gap:16}}>
                    {[["1-7d",vehObj.dia],["8-29d",vehObj.sem],["30+d",vehObj.mes]].map(([r,p],i)=>(
                      <div key={i} style={{textAlign:"center",opacity:(i===0&&f.dias<=7)||(i===1&&f.dias>=8&&f.dias<=29)||(i===2&&f.dias>=30)?1:0.4}}>
                        <div style={{fontSize:9,color:T.sub}}>{r}</div>
                        <div style={{fontSize:12,fontWeight:700,color:T.acc}}>Q{fmt(p)}/d</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                <div style={S.srow(false)}><span>{f.dias}d × Q{fmt(rate)}</span><span>Q {fmt(sub)}</span></div>
                <div style={S.srow(false)}><span>IVA {f.iva_pct}%</span><span>Q {fmt(iva_amt)}</span></div>
              </div>
              <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:T.acc,marginBottom:3}}>PRECIO BENEFICIO — Efectivo/Depósito/Transf.</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                  <span>Q {fmt(total_ef)}</span>
                  <span style={{fontSize:12,color:T.sub,alignSelf:"flex-end"}}>$ {fmt(total_ef/exch)}</span>
                </div>
              </div>
              <div style={{background:T.secDim,border:`1px solid ${T.sec}44`,borderRadius:9,padding:"9px 14px",marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sec}}>Con Tarjeta C/D</div>
                <div style={{fontSize:15,fontWeight:700,color:T.sec}}>Q {fmt(total_tc)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%"}}>{saving?"...":"💾 Borrador"}</button>
                <button onClick={()=>guardar(f.estado==="borrador"?"enviada":f.estado)} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"...":"✅ Guardar cotización"}</button>
                <button onClick={()=>guardar("orden_venta")} disabled={saving} style={{...S.btn("purple"),width:"100%"}}>{saving?"...":"📦 Convertir a Orden de Venta"}</button>
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:24,color:T.sub,fontSize:13}}>Selecciona vehículo y días para ver el resumen</div>
          )}
        </div>
      </div>
    </div>
  );
}



// ═══ FACTURACIÓN ═══

function Autocomplete({value,onChange,onSelect,items,placeholder,renderItem,getLabel}){
  const [open,setOpen]=useState(false);
  const [filtered,setFiltered]=useState([]);
  const ref=useRef(null);
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  const handleChange=e=>{
    const v=e.target.value;onChange(v);
    if(v.length>0){setFiltered(items.filter(i=>getLabel(i).toLowerCase().includes(v.toLowerCase())).slice(0,6));setOpen(true);}
    else setOpen(false);
  };
  return (
    <div ref={ref} style={{position:"relative"}}>
      <input style={S.inp} value={value} onChange={handleChange} placeholder={placeholder} autoComplete="off"/>
      {open&&filtered.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:200,maxHeight:200,overflowY:"auto",marginTop:2}}>
          {filtered.map((item,i)=>(
            <div key={i} onClick={()=>{onSelect(item);setOpen(false);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`}}
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalAnular({factura,onConfirm,onCancel}){
  const [motivo,setMotivo]=useState("");
  if(!factura)return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.red}`,width:"100%",maxWidth:440,padding:24}}>
        <div style={{fontSize:15,fontWeight:700,color:T.red,marginBottom:6}}>🚫 Anular Factura</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:16}}>Factura <strong style={{color:T.txt}}>{factura.numero}</strong> · Q {fmt(factura.total)}</div>
        <label style={S.lbl}>MOTIVO DE ANULACIÓN (requerido)</label>
        <textarea style={{...S.inp,minHeight:70,resize:"vertical",marginBottom:16}} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Error en datos del receptor, duplicado, etc."/>
        <div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.red,marginBottom:16}}>
          ⚠️ Esta acción no se puede deshacer. La factura quedará marcada como ANULADA en el sistema.
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onConfirm(motivo)} disabled={!motivo.trim()} style={{...S.btn("danger"),flex:1,opacity:motivo.trim()?1:0.5}}>🚫 Confirmar anulación</button>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function ModalPago({factura,onConfirm,onCancel}){
  const [monto,setMonto]=useState("");
  const [fecha,setFecha]=useState(today());
  const [metodo,setMetodo]=useState("transferencia");
  if(!factura)return null;
  const saldo=parseFloat(factura.saldo_pendiente)||parseFloat(factura.total)||0;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:440,padding:24}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc,marginBottom:6}}>💰 Registrar Pago</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:4}}>{factura.numero} · {factura.nombre_receptor}</div>
        <div style={{background:T.surf,borderRadius:9,padding:"10px 14px",marginBottom:16}}>
          <div style={S.srow(false)}><span>Total factura</span><span>Q {fmt(factura.total)}</span></div>
          <div style={S.srow(false)}><span>Anticipo aplicado</span><span>Q {fmt(factura.anticipo_aplicado)}</span></div>
          <div style={S.srow(true)}><span>Saldo pendiente</span><span style={{color:T.sec}}>Q {fmt(saldo)}</span></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:16}}>
          <Fld label="MONTO A PAGAR (GTQ)">
            <input style={S.inp} type="number" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} placeholder={fmt(saldo)}/>
          </Fld>
          <Fld label="FECHA DE PAGO">
            <input style={S.inp} type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
          </Fld>
          <Fld label="MÉTODO" span2>
            <select style={S.sel} value={metodo} onChange={e=>setMetodo(e.target.value)}>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="deposito">💰 Depósito</option>
              <option value="tarjeta">💳 Tarjeta</option>
              <option value="cheque">📄 Cheque</option>
            </select>
          </Fld>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onConfirm(parseFloat(monto)||saldo,fecha,metodo)} style={{...S.btn("primary"),flex:1}}>✅ Registrar pago</button>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function FormFactura({initial,empId,clientes,reservas,cotizaciones,onSave,onCancel}){
  // ── State ──────────────────────────────────────────────────────────
  const [f,setF]=useState({
    numero_autorizacion:initial?.numero_autorizacion||"",
    serie:initial?.serie||"TZAR2026",
    numero_dte:initial?.numero_dte||"",
    numero_acceso:initial?.numero_acceso||"",
    fecha_emision:initial?.fecha_emision?.slice(0,10)||today(),
    fecha_certificacion:initial?.fecha_certificacion?.slice(0,10)||today(),
    nit_receptor:initial?.nit_receptor||"",
    nombre_receptor:initial?.nombre_receptor||"",
    direccion_receptor:initial?.direccion_receptor||"CIUDAD",
    correo_receptor:initial?.correo_receptor||"",
    regimen:initial?.regimen||"PEQUENIO", // GENERAL | PEQUENIO | NINGUNO
    metodo_pago:initial?.metodo_pago||"efectivo",
    tasa_cambio:initial?.tasa_cambio||7.70,
    cliente_id:initial?.cliente_id||"",
    reserva_id:initial?.reserva_id||"",
    cotizacion_id:initial?.cotizacion_id||"",
    anticipo_aplicado:initial?.anticipo_aplicado||0,
    notas:initial?.notas||"",
    estado:initial?.estado||"borrador",
  });
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // ── Líneas de detalle ───────────────────────────────────────────────
  const EMPTY_LINE={tipo:"Servicio",cantidad:1,descripcion:"",precio_unitario:"",descuento:0};
  const [lineas,setLineas]=useState(()=>{
    if(initial?.lineas&&initial.lineas.length>0) return initial.lineas;
    return [{...EMPTY_LINE}];
  });
  const addLinea=()=>setLineas(p=>[...p,{...EMPTY_LINE}]);
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));

  const [saving,setSaving]=useState(false);

  // ── Cálculos ────────────────────────────────────────────────────────
  const subtotalBruto=lineas.reduce((s,l)=>{
    const q=parseFloat(l.cantidad)||0;
    const p=parseFloat(l.precio_unitario)||0;
    const d=parseFloat(l.descuento)||0;
    return s+(q*p-d);
  },0);

  const ivaPct=f.regimen==="GENERAL"?12:f.regimen==="PEQUENIO"?5:0;
  // For pequeño contribuyente, price already includes IVA
  const subtotalSinIVA=ivaPct>0?subtotalBruto/(1+ivaPct/100):subtotalBruto;
  const ivaAmt=subtotalBruto-subtotalSinIVA;
  const total=subtotalBruto;
  const saldoPend=Math.max(0,total-(parseFloat(f.anticipo_aplicado)||0));

  // ── Auto-fill from cliente/reserva/cotizacion ───────────────────────
  const onSelectCliente=id=>{
    sf("cliente_id",id);
    const c=clientes.find(x=>x.id===id);
    if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("direccion_receptor",c.direccion||"CIUDAD");sf("correo_receptor",c.email||"");}
  };
  const onSelectReserva=id=>{
    sf("reserva_id",id);
    const r=reservas.find(x=>x.id===id);
    if(r&&!f.nombre_receptor){
      const c=clientes.find(x=>x.nombre===r.cliente_nombre);
      if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("cliente_id",c.id||"");}
      else sf("nombre_receptor",r.cliente_nombre||"");
      if(lineas.length===1&&!lineas[0].descripcion){
        setLineas([{tipo:"Servicio",cantidad:1,descripcion:"Servicio de transporte / alquiler de vehículo",precio_unitario:r.monto||"",descuento:0}]);
      }
    }
  };
  const onSelectCotizacion=id=>{
    sf("cotizacion_id",id);
    const co=cotizaciones.find(x=>x.id===id);
    if(co&&!f.nombre_receptor){sf("nombre_receptor",co.cliente_nombre||"");sf("nit_receptor",co.cliente_nit||"");}
  };

  // ── Guardar ─────────────────────────────────────────────────────────
  const guardar=async()=>{
    if(!f.nombre_receptor.trim()){alert("Nombre del receptor requerido");return;}
    if(lineas.filter(l=>l.descripcion&&parseFloat(l.precio_unitario)>0).length===0){alert("Agrega al menos una línea con descripción y precio");return;}
    setSaving(true);
    const numero="FAC-"+Date.now().toString().slice(-8);
    const payload={
      ...f,
      empresa_id: empId || DEFAULT_EMPRESA_ID,
      numero:initial?.numero||numero,
      tasa_iva:ivaPct,
      subtotal:subtotalSinIVA,
      total_iva:ivaAmt,
      total,
      saldo_pendiente:saldoPend,
      lineas:JSON.stringify(lineas),
      tasa_cambio:parseFloat(f.tasa_cambio)||7.70,
      anticipo_aplicado:parseFloat(f.anticipo_aplicado)||0,
    };
    if(initial?.id) await dbUpd("facturas",initial.id,payload);
    else await dbIns("facturas",payload);
    setSaving(false);
    onSave();
  };

  // ── PDF SAT-style ────────────────────────────────────────────────────
  const generarPDFFactura=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Factura ${f.serie||""}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:20px}
.header-top{display:flex;justify-content:space-between;margin-bottom:8px}
.emisor{color:#1B2D5C}
.emisor strong{display:block;font-size:13px}
.autorizacion{text-align:right;color:#1B2D5C;font-size:10px}
.autorizacion .num{font-weight:700;color:#DC2626}
.divider{border-top:2px solid #1B2D5C;margin:8px 0}
.receptor-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;font-size:10px}
.label{color:#64748B;font-size:9px;display:block}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}
th{background:#1B2D5C;color:white;padding:5px 6px;text-align:left}
td{padding:5px 6px;border-bottom:1px solid #E2E8F0}
.right{text-align:right}
.totals-section{margin-top:8px;display:flex;justify-content:flex-end}
.totals-table{width:260px;font-size:10px}
.totals-table td{padding:3px 6px}
.total-row td{font-weight:700;font-size:12px;border-top:1px solid #1B2D5C}
.footer{margin-top:12px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}
.footer-grid{display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px}
.certificador{background:#F8FAFC;padding:6px;border:1px solid #E2E8F0}
.titulo-factura{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:6px}
@media print{button{display:none}}
</style></head><body>
<div class="titulo-factura">${f.regimen==="GENERAL"?"Factura":f.regimen==="PEQUENIO"?"Factura Pequeño Contribuyente":"Documento"}</div>
<div class="header-top">
  <div class="emisor">
    <strong>VANESSA MARÍA, GÁLVEZ HERNÁNDEZ</strong>
    Nit Emisor: 20160860<br/>
    <strong>TRANSPORTES TZUNUN</strong>
    6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO
  </div>
  <div class="autorizacion">
    <span class="num">NÚMERO DE AUTORIZACIÓN:</span><br/>
    ${f.numero_autorizacion||"—"}<br/>
    Serie: ${f.serie||"—"} &nbsp; Número de DTE: ${f.numero_dte||"—"}<br/>
    Numero Acceso: ${f.numero_acceso||"—"}
  </div>
</div>
<div class="divider"/>
<div class="receptor-row">
  <div><span class="label">NIT Receptor:</span> ${f.nit_receptor||"CF"}</div>
  <div><span class="label">Fecha y hora de emisión:</span> ${f.fecha_emision||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">Nombre Receptor:</span> <strong>${f.nombre_receptor||"—"}</strong></div>
  <div><span class="label">Fecha y hora de certificación:</span> ${f.fecha_certificacion||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">Dirección comprador:</span> ${f.direccion_receptor||"CIUDAD"}</div>
  <div><span class="label">Moneda:</span> GTQ</div>
</div>
<div class="divider"/>
<table>
  <thead><tr><th>#No</th><th>B/S</th><th>Cantidad</th><th>Descripción</th><th class="right">P. Unitario con IVA (Q)</th><th class="right">Descuentos (Q)</th><th class="right">Otros Desc.(Q)</th><th class="right">Total (Q)</th></tr></thead>
  <tbody>
${lineas.filter(l=>l.descripcion).map((l,i)=>`    <tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">${parseFloat(l.descuento||0).toFixed(2)}</td><td class="right">0.00</td><td class="right">${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-parseFloat(l.descuento||0)).toFixed(2)}</td></tr>`).join("\n")}
  </tbody>
  <tfoot><tr><td colspan="5"/><td class="right"><strong>TOTALES:</strong></td><td class="right">0.00</td><td class="right"><strong>${total.toFixed(2)}</strong></td></tr></tfoot>
</table>
<div class="totals-section">
  <table class="totals-table">
    <tr><td>Subtotal</td><td class="right">Q ${subtotalSinIVA.toFixed(2)}</td></tr>
    <tr><td>IVA (${ivaPct}%)</td><td class="right">Q ${ivaAmt.toFixed(2)}</td></tr>
    <tr class="total-row"><td>TOTAL</td><td class="right">Q ${total.toFixed(2)}</td></tr>
  </table>
</div>
${ivaPct===5?'<p style="margin-top:6px;font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
<div class="footer">
  <div class="footer-grid">
    <div class="certificador">
      <div style="font-weight:700;margin-bottom:3px">Datos del certificador</div>
      <div>Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
    </div>
  </div>
  ${f.notas?`<div style="margin-top:6px"><strong>Notas:</strong> ${f.notas}</div>`:""}
</div>
<div style="text-align:center;margin-top:16px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };

  // ── JSX ─────────────────────────────────────────────────────────────
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar factura":"Nueva factura"}</div>
        <div style={{display:"flex",gap:8}}>
          {initial?.id&&<button onClick={generarPDFFactura} style={{...S.btn("blue"),fontSize:12}}>🖨️ Vista previa / Imprimir</button>}
          <button onClick={onCancel} style={{...S.btn("ghost"),fontSize:12}}>← Volver</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Columna izquierda */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Datos SAT */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>DATOS SAT / DTE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label="N° AUTORIZACIÓN SAT" span2>
                <input style={{...S.inp,fontFamily:"monospace",fontSize:11}} value={f.numero_autorizacion} onChange={e=>sf("numero_autorizacion",e.target.value)} placeholder="F047F606-C8E3-43D7-8B21-A77A28299F83"/>
              </Fld>
              <Fld label="SERIE"><input style={S.inp} value={f.serie} onChange={e=>sf("serie",e.target.value)} placeholder="TZAR2026"/></Fld>
              <Fld label="N° DTE"><input style={S.inp} value={f.numero_dte} onChange={e=>sf("numero_dte",e.target.value)} placeholder="3370337239"/></Fld>
              <Fld label="N° ACCESO"><input style={S.inp} value={f.numero_acceso} onChange={e=>sf("numero_acceso",e.target.value)} placeholder="Número de acceso"/></Fld>
              <Fld label="RÉGIMEN FISCAL">
                <select style={S.sel} value={f.regimen} onChange={e=>sf("regimen",e.target.value)}>
                  <option value="GENERAL">12% IVA — Régimen General</option>
                  <option value="PEQUENIO">5% — Pequeño Contribuyente</option>
                  <option value="NINGUNO">Sin impuestos</option>
                </select>
              </Fld>
              <Fld label="TASA DE CAMBIO ($)"><input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e=>sf("tasa_cambio",e.target.value)}/></Fld>
              <Fld label="FECHA EMISIÓN"><input style={S.inp} type="date" value={f.fecha_emision} onChange={e=>sf("fecha_emision",e.target.value)}/></Fld>
              <Fld label="FECHA CERTIFICACIÓN"><input style={S.inp} type="date" value={f.fecha_certificacion} onChange={e=>sf("fecha_certificacion",e.target.value)}/></Fld>
            </div>
          </div>

          {/* Receptor */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RECEPTOR</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label="VINCULAR A CLIENTE" span2>
                <select style={S.sel} value={f.cliente_id} onChange={e=>onSelectCliente(e.target.value)}>
                  <option value="">Seleccionar cliente (auto-llena datos)...</option>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.codigo?c.codigo+" — ":""}{c.nombre}</option>)}
                </select>
              </Fld>
              <Fld label="NIT RECEPTOR"><input style={S.inp} value={f.nit_receptor} onChange={e=>sf("nit_receptor",e.target.value)} placeholder="CF o NIT"/></Fld>
              <Fld label="NOMBRE RECEPTOR"><input style={S.inp} value={f.nombre_receptor} onChange={e=>sf("nombre_receptor",e.target.value)} placeholder="Nombre o razón social"/></Fld>
              <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion_receptor} onChange={e=>sf("direccion_receptor",e.target.value)} placeholder="Ciudad"/></Fld>
              <Fld label="CORREO"><input style={S.inp} type="email" value={f.correo_receptor} onChange={e=>sf("correo_receptor",e.target.value)} placeholder="email@cliente.com"/></Fld>
              <Fld label="MÉTODO PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="deposito">💰 Depósito</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
              </Fld>
            </div>
          </div>

          {/* Vincular */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>VINCULAR A RESERVA O COTIZACIÓN</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
              <Fld label="RESERVA (opcional)">
                <select style={S.sel} value={f.reserva_id} onChange={e=>onSelectReserva(e.target.value)}>
                  <option value="">Sin vinculación a reserva</option>
                  {reservas.map(r=><option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre} — Q {fmt(r.monto)}</option>)}
                </select>
              </Fld>
              <Fld label="COTIZACIÓN (opcional)">
                <select style={S.sel} value={f.cotizacion_id} onChange={e=>onSelectCotizacion(e.target.value)}>
                  <option value="">Sin vinculación a cotización</option>
                  {cotizaciones.map(c=><option key={c.id} value={c.id}>{c.numero} — {c.cliente_nombre} — Q {fmt(c.total_gtq)}</option>)}
                </select>
              </Fld>
              <Fld label="ANTICIPO RECIBIDO (Q)">
                <input style={S.inp} type="number" step="0.01" value={f.anticipo_aplicado} onChange={e=>sf("anticipo_aplicado",parseFloat(e.target.value)||0)} placeholder="0.00"/>
              </Fld>
            </div>
          </div>

          {/* Notas */}
          <div style={S.card}>
            <Fld label="NOTAS / OBSERVACIONES">
              <textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/>
            </Fld>
            <div style={{marginTop:10}}>
              <Fld label="ESTADO">
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                  <option value="borrador">📝 Borrador</option>
                  <option value="emitida">📤 Emitida</option>
                  <option value="certificada">✅ Certificada (DTE)</option>
                  <option value="pagada">💚 Pagada</option>
                </select>
              </Fld>
            </div>
          </div>
        </div>

        {/* Columna derecha - Líneas y resumen */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Líneas de detalle */}
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:T.mut}}>DETALLE DE SERVICIOS / PRODUCTOS</div>
              <button onClick={addLinea} style={{...S.btn("primary"),fontSize:11,padding:"4px 10px"}}>+ Agregar línea</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {lineas.map((l,idx)=>(
                <div key={idx} style={{background:T.surf,borderRadius:8,padding:10,border:"1px solid "+T.bord}}>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:6}}>
                    <div>
                      <label style={{...S.lbl,fontSize:9}}>TIPO</label>
                      <select style={{...S.sel,padding:"5px 6px",fontSize:11}} value={l.tipo} onChange={e=>updateLinea(idx,"tipo",e.target.value)}>
                        <option value="Bien">Bien</option>
                        <option value="Servicio">Servicio</option>
                      </select>
                    </div>
                    <div>
                      <label style={{...S.lbl,fontSize:9}}>DESCRIPCIÓN</label>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px"}} value={l.descripcion} onChange={e=>updateLinea(idx,"descripcion",e.target.value)} placeholder="Descripción del servicio o producto"/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"60px 1fr 1fr auto",gap:6,alignItems:"flex-end"}}>
                    <div>
                      <label style={{...S.lbl,fontSize:9}}>CANT.</label>
                      <input style={{...S.inp,fontSize:12,padding:"5px 6px",textAlign:"center"}} type="number" value={l.cantidad} onChange={e=>updateLinea(idx,"cantidad",e.target.value)} min="1"/>
                    </div>
                    <div>
                      <label style={{...S.lbl,fontSize:9}}>P. UNITARIO (Q)</label>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right",color:T.acc}} type="number" step="0.01" value={l.precio_unitario} onChange={e=>updateLinea(idx,"precio_unitario",e.target.value)} placeholder="0.00"/>
                    </div>
                    <div>
                      <label style={{...S.lbl,fontSize:9}}>DESCUENTO (Q)</label>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right"}} type="number" step="0.01" value={l.descuento} onChange={e=>updateLinea(idx,"descuento",e.target.value)} placeholder="0.00"/>
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end"}}>
                      {lineas.length>1&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"5px 8px",fontSize:11}}>✕</button>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",marginTop:4,fontSize:11,color:T.acc,fontWeight:600}}>
                    Subtotal: Q {(((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0))-(parseFloat(l.descuento)||0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen totales */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RESUMEN</div>
            <div style={{background:T.surf,borderRadius:9,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>Subtotal (sin IVA)</span><span>Q {fmt(subtotalSinIVA)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>IVA ({ivaPct}%)</span><span>Q {fmt(ivaAmt)}</span></div>
              {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sec}}><span>Anticipo aplicado</span><span>– Q {fmt(f.anticipo_aplicado)}</span></div>}
              <div style={{borderTop:"1px solid "+T.bord,marginTop:6,paddingTop:6}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(total)}</span></div>
                {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,fontWeight:600}}><span>Saldo pendiente</span><span>Q {fmt(saldoPend)}</span></div>}
                <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(f.tasa_cambio>0?total/f.tasa_cambio:0)} USD</div>
              </div>
            </div>
            {ivaPct===5&&<div style={{marginTop:8,fontSize:11,color:T.mut,fontStyle:"italic"}}>* No genera derecho a crédito fiscal</div>}
          </div>

          {/* Acciones */}
          <div style={S.card}>
            <button onClick={generarPDFFactura} style={{...S.btn("blue"),width:"100%",marginBottom:8,padding:10,fontSize:13}}>🖨️ Vista previa / Imprimir factura</button>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),width:"100%",padding:10,fontSize:13}}>{saving?"Guardando...":"💾 "+( initial?.id?"Actualizar":"Crear factura")}</button>
            <button onClick={onCancel} style={{...S.btn("ghost"),width:"100%",padding:10,marginTop:6,fontSize:12}}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══ REPORTES ═══

function exportCSV(filename, headers, rows){
  const bom="\uFEFF";
  const csv=bom+[headers.join(","),...rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename+".csv";a.click();
  URL.revokeObjectURL(url);
}

function imprimirTabla(titulo, headers, rows){
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${titulo}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
    h2{color:#1B2D5C;margin-bottom:4px}
    p{color:#64748B;font-size:12px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#1B2D5C;color:#fff;padding:8px 10px;text-align:left}
    td{padding:7px 10px;border-bottom:1px solid #E2E8F0}
    tr:nth-child(even){background:#F8FAFC}
    .total{font-weight:bold;background:#E1F5EE!important}
    @media print{button{display:none}}
  </style></head><body>
  <h2>Tz'unun AutoRentas — ${titulo}</h2>
  <p>Generado: ${new Date().toLocaleDateString("es-GT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</p>
  <table><thead><tr>${headers.map(h=>"<th>"+h+"</th>").join("")}</tr></thead>
  <tbody>${rows.map(r=>"<tr>"+r.map(v=>"<td>"+(v||"—")+"</td>").join("")+"</tr>").join("")}</tbody>
  </table>
  <script>window.onload=()=>window.print();</script>
  </body></html>`;
  const w=window.open("","_blank");
  w.document.write(html);w.document.close();
}

function KpiCard({icon,label,value,sub,color,bg}){
  return (
    <div style={{...S.card,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
      <div style={{width:38,height:38,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color}}>{value}</div>
      <div style={{fontSize:11,color:T.mut,marginTop:2}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"10px 14px",fontSize:11}}>
    <div style={{color:T.sub,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: Q {fmt(p.value)}</div>)}
  </div>;
}

function ReporteVentas({data}){
  const {reservas,cotizaciones,facturas} = data;

  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const chartMensual=meses.map((mes,i)=>({
    mes,
    Reservas: Math.round(reservas.filter(r=>new Date(r.fecha_inicio||r.created_at).getMonth()===i&&r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0)),
    Cotizaciones: Math.round(cotizaciones.filter(co=>new Date(co.created_at).getMonth()===i&&co.estado!=="rechazada").reduce((s,co)=>s+(parseFloat(co.total_gtq)||0),0)),
  })).filter(x=>x.Reservas>0||x.Cotizaciones>0);

  const totalRes=reservas.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const totalCot=cotizaciones.filter(c=>c.estado!=="rechazada").reduce((s,c)=>s+(parseFloat(c.total_gtq)||0),0);
  const totalFac=facturas.filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);

  const tablaRows=reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>[
    r.numero||"—",r.cliente_nombre,r.tipo==="renta"?"Renta":"Traslado",
    r.vehiculo_nombre||"—",fmtD(r.fecha_inicio),`Q ${fmt(r.monto)}`,
    `Q ${fmt(r.anticipo)}`,`Q ${fmt(r.saldo)}`,r.estado
  ]);

  const exportar=()=>exportCSV("Reporte_Ventas_TzununSA",
    ["N° Reserva","Cliente","Tipo","Vehículo","Fecha inicio","Monto","Anticipo","Saldo","Estado"],
    tablaRows
  );
  const imprimir=()=>imprimirTabla("Reporte de Ventas",
    ["N° Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"],
    tablaRows
  );

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <KpiCard icon="📅" label="Total reservas (activas)" value={`Q ${fmt(totalRes).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="📋" label="Cotizaciones enviadas" value={`Q ${fmt(totalCot).split(".")[0]}`} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="🧾" label="Total facturado" value={`Q ${fmt(totalFac).split(".")[0]}`} color={T.purple} bg={T.purpleDim}/>
      </div>

      <div style={{...S.card,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ventas mensuales — Reservas vs Cotizaciones</div>
        {chartMensual.length>0?(
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMensual}>
              <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="Reservas" fill={T.acc} radius={[4,4,0,0]}/>
              <Bar dataKey="Cotizaciones" fill={T.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos suficientes</div>}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>⬇ Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>🖨️ Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Reservas</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr>{["N° Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>(
                <tr key={r.id}>
                  <td style={{...S.td,fontFamily:"monospace",color:T.acc}}>{r.numero}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.cliente_nombre}</td>
                  <td style={S.td}>{r.tipo==="renta"?"🔑 Renta":"🗺 Traslado"}</td>
                  <td style={{...S.td,color:T.sub}}>{r.vehiculo_nombre||"—"}</td>
                  <td style={{...S.td,color:T.sub,whiteSpace:"nowrap"}}>{fmtD(r.fecha_inicio)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,color:T.acc}}>Q {fmt(r.anticipo)}</td>
                  <td style={{...S.td,color:parseFloat(r.saldo)>0?T.sec:T.acc}}>Q {fmt(r.saldo)}</td>
                  <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="completada"?T.accDim:T.secDim,color:r.estado==="completada"?T.acc:T.sec}}>{r.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReporteFlota({data}){
  const {vehiculos,reservas} = data;

  const flotaData=vehiculos.map(v=>{
    const resV=reservas.filter(r=>r.vehiculo_nombre===`${v.marca} ${v.modelo}`||r.vehiculo_nombre?.includes(v.modelo));
    const ingresos=resV.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const viajes=resV.length;
    return {...v,ingresos,viajes};
  });

  const chartFlota=flotaData.map(v=>({nombre:`${v.marca} ${v.modelo}`,Ingresos:Math.round(v.ingresos),Viajes:v.viajes}));
  const pieData=[
    {name:"Disponible",value:vehiculos.filter(v=>v.estado==="disponible").length,color:T.acc},
    {name:"Rentado",value:vehiculos.filter(v=>v.estado==="rentado").length,color:T.blue},
    {name:"Mantenimiento",value:vehiculos.filter(v=>v.estado==="mantenimiento").length,color:T.sec},
  ].filter(x=>x.value>0);

  const tablaRows=flotaData.map(v=>[v.placa,`${v.marca} ${v.modelo}`,v.tipo,v.anio,(v.km_actual||0).toLocaleString()+" km",v.viajes,`Q ${fmt(v.ingresos)}`,v.estado]);
  const exportar=()=>exportCSV("Reporte_Flota_TzununSA",["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos generados","Estado"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Flota",["Placa","Vehículo","Tipo","Año","Km","Viajes","Ingresos","Estado"],tablaRows);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos por vehículo</div>
          {chartFlota.some(x=>x.Ingresos>0)?(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartFlota} layout="vertical">
                <XAxis type="number" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <YAxis type="category" dataKey="nombre" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} width={120}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="Ingresos" fill={T.acc} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Sin datos de ingresos por vehículo</div>}
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Estado actual de flota</div>
          {pieData.length>0?(
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
              {pieData.map((e,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div>
                  <span style={{fontWeight:700,color:e.color}}>{e.value} veh.</span>
                </div>
              ))}
            </>
          ):<div style={{textAlign:"center",padding:24,color:T.sub}}>Sin datos</div>}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>⬇ Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>🖨️ Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Flota</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {flotaData.map(v=>(
              <tr key={v.id}>
                <td style={{...S.td,fontFamily:"monospace",color:T.acc,fontWeight:700}}>{v.placa}</td>
                <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                <td style={S.td}>{v.tipo}</td>
                <td style={{...S.td,color:T.sub}}>{v.anio}</td>
                <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                <td style={{...S.td,color:T.blue,fontWeight:600}}>{v.viajes}</td>
                <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(v.ingresos)}</td>
                <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:v.estado==="disponible"?T.accDim:v.estado==="rentado"?T.blueDim:T.secDim,color:v.estado==="disponible"?T.acc:v.estado==="rentado"?T.blue:T.sec}}>{v.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReporteGastos({data}){
  const {gastos} = data;
  const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:"#22C55E",impuestos:T.red,servicios:T.acc,otros:T.sub};

  const porCat=[...new Set(gastos.map(g=>g.categoria))].map(cat=>({
    cat,
    total:gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    count:gastos.filter(g=>g.categoria===cat).length,
    pagados:gastos.filter(g=>g.categoria===cat&&g.estado==="pagado").reduce((s,g)=>s+(parseFloat(g.total)||0),0),
  })).sort((a,b)=>b.total-a.total);

  const totalGastos=gastos.reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const totalPend=gastos.filter(g=>g.estado==="pendiente").reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const pieData=porCat.map(c=>({name:c.cat,value:Math.round(c.total),color:CAT_COLOR[c.cat]||T.mut}));

  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const chartMensual=meses.map((mes,i)=>({
    mes,
    Gastos:Math.round(gastos.filter(g=>new Date(g.fecha).getMonth()===i).reduce((s,g)=>s+(parseFloat(g.total)||0),0)),
  })).filter(x=>x.Gastos>0);

  const tablaRows=gastos.map(g=>[fmtD(g.fecha),g.categoria,g.descripcion,`Q ${fmt(g.monto)}`,`Q ${fmt(g.iva)}`,`Q ${fmt(g.total)}`,g.metodo_pago,g.referencia||"—",g.estado]);
  const exportar=()=>exportCSV("Reporte_Gastos_TzununSA",["Fecha","Categoría","Descripción","Monto","IVA","Total","Método pago","Referencia","Estado"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Gastos",["Fecha","Categoría","Descripción","Monto","IVA","Total","Estado"],tablaRows);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        <KpiCard icon="💸" label="Total gastos" value={`Q ${fmt(totalGastos).split(".")[0]}`} color={T.red} bg={T.redDim}/>
        <KpiCard icon="✅" label="Pagados" value={`Q ${fmt(totalGastos-totalPend).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="⏳" label="Pendientes de pago" value={`Q ${fmt(totalPend).split(".")[0]}`} color={T.sec} bg={T.secDim}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos por categoría</div>
          {porCat.map(({cat,total,count})=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                  <span style={{fontSize:12,color:T.sub}}>{cat} ({count})</span>
                </div>
                <span style={{fontSize:12,fontWeight:600}}>Q {fmt(total)}</span>
              </div>
              <div style={{background:T.surf,borderRadius:4,height:5,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalGastos>0?Math.round((total/totalGastos)*100):0}%`}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos mensuales</div>
          {chartMensual.length>0?(
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartMensual}>
                <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="Gastos" stroke={T.red} strokeWidth={2} dot={{fill:T.red,r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos</div>}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>⬇ Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>🖨️ Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Gastos</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr>{["Fecha","Categoría","Descripción","Monto","IVA","Total","Método","Ref.","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {gastos.map(g=>(
                <tr key={g.id}>
                  <td style={{...S.td,whiteSpace:"nowrap",color:T.sub}}>{fmtD(g.fecha)}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[g.categoria]||T.mut)+"22",color:CAT_COLOR[g.categoria]||T.mut}}>{g.categoria}</span></td>
                  <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{g.descripcion}</div></td>
                  <td style={S.td}>Q {fmt(g.monto)}</td>
                  <td style={S.td}>Q {fmt(g.iva)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(g.total)}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{g.metodo_pago}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:10,color:T.mut}}>{g.referencia||"—"}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:g.estado==="pagado"?T.accDim:T.secDim,color:g.estado==="pagado"?T.acc:T.sec}}>{g.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:T.surf}}>
                <td colSpan={5} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL</td>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(totalGastos)}</td>
                <td colSpan={3}/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReporteClientes({data}){
  const {clientes,reservas,cotizaciones} = data;

  const clientesData=clientes.map(c=>{
    const resC=reservas.filter(r=>r.cliente_nombre===c.nombre&&r.estado!=="cancelada");
    const cotC=cotizaciones.filter(co=>co.cliente_nombre===c.nombre&&co.estado!=="rechazada");
    const ingresos=resC.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    return {...c,reservas:resC.length,cotizaciones:cotC.length,ingresos};
  }).sort((a,b)=>b.ingresos-a.ingresos);

  const tablaRows=clientesData.map(c=>[c.nombre,c.tipo,c.nit||"—",c.telefono||"—",c.email||"—",c.reservas,c.cotizaciones,`Q ${fmt(c.ingresos)}`]);
  const exportar=()=>exportCSV("Reporte_Clientes_TzununSA",["Cliente","Tipo","NIT","Teléfono","Email","Reservas","Cotizaciones","Ingresos generados"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Clientes",["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos"],tablaRows);

  const TC={empresa:{c:T.sec,bg:T.secDim},gobierno:{c:T.blue,bg:T.blueDim},persona:{c:T.acc,bg:T.accDim}};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <KpiCard icon="👥" label="Total clientes" value={clientes.length} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="🏢" label="Empresas" value={clientes.filter(c=>c.tipo==="empresa").length} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="🏛️" label="Gobierno/ONG" value={clientes.filter(c=>c.tipo==="gobierno").length} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="👤" label="Personas" value={clientes.filter(c=>c.tipo==="persona").length} color={T.purple} bg={T.purpleDim}/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>⬇ Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>🖨️ Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Clientes por ingresos generados</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos generados"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {clientesData.map((c,i)=>{
              const tc=TC[c.tipo]||TC.empresa;
              return (
                <tr key={c.id} style={{background:i===0?T.accDim:"transparent"}}>
                  <td style={{...S.td,fontWeight:600}}>{i===0&&"🥇 "}{c.nombre}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:tc.bg,color:tc.c}}>{c.tipo}</span></td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                  <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                  <td style={{...S.td,fontWeight:600,color:T.blue,textAlign:"center"}}>{c.reservas}</td>
                  <td style={{...S.td,fontWeight:600,color:T.purple,textAlign:"center"}}>{c.cotizaciones}</td>
                  <td style={{...S.td,fontWeight:700,color:c.ingresos>0?T.acc:T.mut}}>Q {fmt(c.ingresos)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ GASTOS ═══

function CatBadge({cat}){
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[cat]||T.mut)+"22",color:CAT_COLOR[cat]||T.mut}}>{cat}</span>;
}

function ModGastos({empId,proveedores,showToast}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [filtroEst,setFiltroEst]=useState("todos");
  const [filtroCat,setFiltroCat]=useState("todas");
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{setLoading(true);const d=await dbGet("gastos");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);

  const calcTotal=(m,i)=>{
    const t=(parseFloat(m)||0)+(parseFloat(i)||0);
    sf("total",t>0?t.toFixed(2):"");
  };

  const abrirEditar=item=>{
    setEditItem(item);
    setF({fecha:item.fecha||today(),categoria:item.categoria||"combustible",descripcion:item.descripcion||"",monto:item.monto||"",iva:item.iva||"",total:item.total||"",metodo_pago:item.metodo_pago||"efectivo",referencia:item.referencia||"",estado:item.estado||"pendiente",proveedor_id:item.proveedor_id||"",vehiculo_ref:item.vehiculo_ref||"",notas:item.notas||""});
    setShowForm(true);
  };

  const guardar=async()=>{
    if(!f.descripcion.trim()||!(parseFloat(f.total)>0)){showToast("Descripción y total son requeridos","err");return;}
    setSaving(true);
    const payload={empresa_id: empId || DEFAULT_EMPRESA_ID,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,proveedor_id:f.proveedor_id||null,notas:f.notas,fecha_pago:f.estado==="pagado"?f.fecha:null};
    if(editItem?.id) await dbUpd("gastos",editItem.id,payload);
    else await dbIns("gastos",payload);
    showToast("Gasto guardado ✔");setSaving(false);
    setShowForm(false);setEditItem(null);
    setF({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
    load();
  };

  const marcarPagado=async id=>{await dbUpd("gastos",id,{estado:"pagado",fecha_pago:today()});showToast("Marcado como pagado ✔");load();};
  const del=async id=>{if(!confirm("¿Eliminar este gasto?"))return;await dbDel("gastos",id);showToast("Eliminado");load();};

  const filtered=rows.filter(r=>{
    if(filtroEst!=="todos"&&r.estado!==filtroEst) return false;
    if(filtroCat!=="todas"&&r.categoria!==filtroCat) return false;
    return true;
  });

  const totalG=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPend=rows.filter(r=>r.estado==="pendiente").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPagado=rows.filter(r=>r.estado==="pagado").reduce((s,r)=>s+(parseFloat(r.total)||0),0);

  const porCat=CAT_GASTO.map(cat=>({cat,total:rows.filter(r=>r.categoria===cat).reduce((s,r)=>s+(parseFloat(r.total)||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total gastos",v:`Q ${fmt(totalG)}`,c:T.red,bg:T.redDim},{l:"Pagados",v:`Q ${fmt(totalPagado)}`,c:T.acc,bg:T.accDim},{l:"Pendientes",v:`Q ${fmt(totalPend)}`,c:T.sec,bg:T.secDim}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:16}}>
        <div>
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["todos","pendiente","pagado"].map(f=>(
              <button key={f} onClick={()=>setFiltroEst(f)} style={{...S.btn(filtroEst===f?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>
                {f==="todos"?"Todos":f==="pendiente"?"⏳ Pendientes":"✅ Pagados"}
              </button>
            ))}
            <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
            <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
            <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nuevo gasto"}</button>
          </div>

          {/* Formulario */}
          {showForm&&(
            <div style={{...S.card,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar gasto":"Registrar gasto / compra"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                <Fld label="CATEGORÍA">
                  <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                    {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Diésel — Toyota RAV4 viaje a Petén"/></Fld>
                <Fld label="PROVEEDOR">
                  <select style={S.sel} value={f.proveedor_id} onChange={e=>sf("proveedor_id",e.target.value)}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Fld>
                <Fld label="MÉTODO DE PAGO">
                  <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="deposito">💰 Depósito</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="cheque">📄 Cheque</option>
                    <option value="credito">📋 Crédito</option>
                  </select>
                </Fld>
                <Fld label="MONTO SIN IVA (GTQ)">
                  <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>{sf("monto",e.target.value);calcTotal(e.target.value,f.iva);}} placeholder="0.00"/>
                </Fld>
                <Fld label="IVA (GTQ)">
                  <input style={S.inp} type="number" step="0.01" value={f.iva} onChange={e=>{sf("iva",e.target.value);calcTotal(f.monto,e.target.value);}} placeholder="0.00"/>
                </Fld>
                <Fld label="TOTAL (GTQ)">
                  <input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/>
                </Fld>
                <Fld label="REFERENCIA / N° FACTURA">
                  <input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REC-0045, FAC-001..."/>
                </Fld>
                <Fld label="ESTADO">
                  <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                    <option value="pendiente">⏳ Pendiente de pago</option>
                    <option value="pagado">✅ Pagado</option>
                  </select>
                </Fld>
                <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/></Fld>
                <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
                  <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar gasto"}</button>
                  <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla gastos */}
          {loading?<Spinner/>:filtered.length===0?<Empty icon="💸" msg="Sin gastos registrados" action="+ Registrar primer gasto" onAction={()=>setShowForm(true)}/>:(
            <div style={S.card}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Fecha","Descripción","Categoría","Proveedor","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(r=>{
                    const prov=proveedores.find(p=>p.id===r.proveedor_id);
                    return (
                      <tr key={r.id}>
                        <td style={{...S.td,whiteSpace:"nowrap",color:T.sub,fontSize:11}}>{fmtD(r.fecha)}</td>
                        <td style={{...S.td,fontWeight:500,maxWidth:200}}>
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{r.descripcion}</div>
                          {r.referencia&&<div style={{fontSize:10,color:T.mut,fontFamily:"monospace"}}>{r.referencia}</div>}
                        </td>
                        <td style={S.td}><CatBadge cat={r.categoria}/></td>
                        <td style={{...S.td,fontSize:11,color:T.sub}}>{prov?.nombre||"—"}</td>
                        <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(r.total)}</td>
                        <td style={S.td}>
                          <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="pagado"?T.accDim:T.secDim,color:r.estado==="pagado"?T.acc:T.sec}}>
                            {r.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{display:"flex",gap:4}}>
                            {r.estado==="pendiente"&&<button onClick={()=>marcarPagado(r.id)} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>Pagar</button>}
                            <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>✏️</button>
                            <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:T.surf}}>
                    <td colSpan={4} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL FILTRADO</td>
                    <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(filtered.reduce((s,r)=>s+(parseFloat(r.total)||0),0))}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar categorías */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:12}}>POR CATEGORÍA</div>
            {porCat.map(({cat,total})=>(
              <div key={cat} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                    <span style={{fontSize:11,color:T.sub}}>{cat}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:600}}>Q {fmt(total)}</span>
                </div>
                <div style={{background:T.surf,borderRadius:4,height:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalG>0?Math.round((total/totalG)*100):0}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModProveedores({empId,showToast}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{setLoading(true);const d=await dbGet("proveedores");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);

  const abrirEditar=item=>{
    setEditItem(item);
    setF({nombre:item.nombre||"",nit:item.nit||"",categoria:item.categoria||"combustible",contacto:item.contacto||"",telefono:item.telefono||"",email:item.email||"",direccion:item.direccion||"",credito_limite:item.credito_limite||"",notas:item.notas||""});
    setShowForm(true);
  };

  const guardar=async()=>{
    if(!f.nombre.trim()){showToast("El nombre del proveedor es requerido","err");return;}
    setSaving(true);
    const payload={emempresa_id: empId || DEFAULT_EMPRESA_ID,nombre:f.nombre,nit:f.nit,categoria:f.categoria,contacto:f.contacto,telefono:f.telefono,email:f.email,direccion:f.direccion,credito_limite:parseFloat(f.credito_limite)||0,notas:f.notas,activo:true};
    if(editItem?.id) await dbUpd("proveedores",editItem.id,payload);
    else await dbIns("proveedores",payload);
    showToast("Proveedor guardado ✔");setSaving(false);
    setShowForm(false);setEditItem(null);
    setF({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
    load();
  };

  const del=async id=>{if(!confirm("¿Eliminar este proveedor?"))return;await dbDel("proveedores",id);showToast("Eliminado");load();};

  const totalCredito=rows.reduce((s,r)=>s+(parseFloat(r.credito_usado)||0),0);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Proveedores activos",v:rows.filter(r=>r.activo).length,c:T.acc},{l:"Crédito total usado",v:`Q ${fmt(totalCredito)}`,c:T.red},{l:"Categorías",v:[...new Set(rows.map(r=>r.categoria))].length,c:T.blue}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:i>0?16:22,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo proveedor"}</button>
      </div>

      {/* Formulario */}
      {showForm&&(
        <div style={{...S.card,marginBottom:16,maxWidth:640}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar proveedor":"Nuevo proveedor"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre del proveedor"/></Fld>
            <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
            <Fld label="CATEGORÍA">
              <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="CONTACTO"><input style={S.inp} value={f.contacto} onChange={e=>sf("contacto",e.target.value)} placeholder="Nombre de la persona de contacto"/></Fld>
            <Fld label="TELÉFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
            <Fld label="EMAIL"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="proveedor@email.com"/></Fld>
            <Fld label="LÍMITE DE CRÉDITO (GTQ)"><input style={S.inp} type="number" value={f.credito_limite} onChange={e=>sf("credito_limite",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección del proveedor"/></Fld>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar proveedor"}</button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas proveedores */}
      {loading?<Spinner/>:rows.length===0?<Empty icon="🏪" msg="Sin proveedores registrados" action="+ Agregar proveedor" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
          {rows.map(p=>{
            const creditoUsado=parseFloat(p.credito_usado)||0;
            const creditoLimite=parseFloat(p.credito_limite)||0;
            const pct=creditoLimite>0?Math.min(100,Math.round((creditoUsado/creditoLimite)*100)):0;
            return (
              <div key={p.id} style={{...S.card,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:CAT_COLOR[p.categoria]||T.mut}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{p.nombre}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>NIT: {p.nit||"—"}</div>
                  </div>
                  <CatBadge cat={p.categoria}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[["Contacto",p.contacto||"—"],["Teléfono",p.telefono||"—"],["Email",p.email||"—"],["Dirección",p.direccion||"—"]].map(([lbl,val])=>(
                    <div key={lbl} style={{background:T.surf,borderRadius:7,padding:"7px 10px"}}>
                      <div style={{fontSize:10,color:T.mut}}>{lbl}</div>
                      <div style={{fontSize:12,fontWeight:500,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
                    </div>
                  ))}
                </div>
                {creditoLimite>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                      <span>Crédito usado</span>
                      <span style={{color:pct>80?T.red:T.sub,fontWeight:600}}>Q {fmt(creditoUsado)} / Q {fmt(creditoLimite)}</span>
                    </div>
                    <div style={{background:T.surf,borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:4,background:pct>80?T.red:pct>50?T.sec:T.acc,width:`${pct}%`,transition:"width .3s"}}/>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>abrirEditar(p)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>✏️ Editar</button>
                  <button onClick={()=>del(p.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══ RESERVAS ═══


// ── Estado inicial para FormReserva ──────────────────────────────────────────
const EMPTY={
  cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
  fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"",destino:"",
  departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
  exch:7.70,con_tc:false
};


function FormReserva({initial,onSave,onCancel,empId}){
  const EMPTY_R={cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
    fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"Guatemala",destino:"",
    departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
    exch:7.70,estado:"pendiente"};

  const [f,setF]=useState(()=>{
    if(!initial) return {...EMPTY_R};
    return{
      cliente_nombre:initial.cliente_nombre||"",
      tipo:initial.tipo||"renta",
      vehiculo_nombre:initial.vehiculo_nombre||"",
      conductor_nombre:initial.conductor_nombre||"",
      fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",
      fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):"",
      hora_recogida:initial.hora_recogida||"08:00",
      origen:initial.origen||"Guatemala",
      destino:initial.destino||"",
      departamento:initial.departamento||"",
      municipio:initial.municipio||"",
      anticipo:initial.anticipo||"",
      notas:initial.notas||"",
      iva:initial.tasa_iva||5,
      pago:initial.metodo_pago||"efectivo",
      exch:initial.tasa_cambio||7.70,
      estado:initial.estado||"pendiente",
    };
  });

  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // Calcular días
  const calcularDias=()=>{
    if(!f.fecha_inicio) return 0;
    const fi=new Date(f.fecha_inicio+"T12:00:00");
    if(!f.fecha_fin) return 1;
    const ff=new Date(f.fecha_fin+"T12:00:00");
    const diff=Math.ceil((ff-fi)/(1000*60*60*24));
    return Math.max(1,diff);
  };

  const calcularTarifa=(veh,dias)=>{
    if(!veh||dias<=0) return 0;
    if(dias>=30) return veh.mes;
    if(dias>=8) return veh.sem;
    return veh.dia;
  };

  const dias=calcularDias();
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const tarifaDia=calcularTarifa(vehObj,dias);
  const subtotal=dias*tarifaDia;
  const ivaAmt=subtotal*(parseFloat(f.iva)||0)/100;
  const totalEfectivo=subtotal+ivaAmt;
  const recargoTC=f.pago==="tarjeta"?totalEfectivo*0.05:0;
  const totalFinal=totalEfectivo+recargoTC;
  const exch=parseFloat(f.exch)||7.70;
  const anticipo=parseFloat(f.anticipo)||0;
  const saldo=Math.max(0,totalFinal-anticipo);
  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];

  const guardar=async()=>{
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
    if(!f.fecha_inicio){alert("La fecha de inicio es requerida");return;}
    setSaving(true);
    const payload={
      empresa_id: empId || DEFAULT_EMPRESA_ID,
      cliente_nombre:f.cliente_nombre.trim(),
      tipo:f.tipo,
      numero:initial?.id?undefined:"RES-"+Date.now().toString().slice(-6),
      vehiculo_nombre:f.vehiculo_nombre,
      conductor_nombre:f.conductor_nombre,
      fecha_inicio:f.fecha_inicio+"T"+(f.hora_recogida||"08:00")+":00",
      fecha_fin:f.fecha_fin?f.fecha_fin+"T23:59:00":null,
      hora_recogida:f.hora_recogida,
      origen:f.origen,
      destino:f.destino,
      departamento:f.departamento,
      municipio:f.municipio,
      monto:Math.round(totalFinal*100)/100,
      anticipo:anticipo,
      saldo:Math.round(saldo*100)/100,
      tasa_iva:parseFloat(f.iva)||0,
      metodo_pago:f.pago,
      tasa_cambio:exch,
      estado:f.estado,
      notas:f.notas,
    };
    let result;
    if(initial?.id) result=await dbUpd("reservas",initial.id,payload);
    else result=await dbIns("reservas",payload);
    setSaving(false);
    if(result&&!result.error){
      onSave();
    } else {
      alert("Error al guardar. Verifica la conexión e intenta de nuevo.");
      console.error("Save error:", result);
    }
  };

  const Resumen=()=>(
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
      {vehObj&&dias>0?(
        <>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {dias} día{dias!==1?"s":""}</div>
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
            {[["Tarifa","Q "+fmt(tarifaDia)+"/día"],["Subtotal","Q "+fmt(subtotal)],["IVA "+f.iva+"%","Q "+fmt(ivaAmt)],...(f.pago==="tarjeta"?[["Recargo TC 5%","Q "+fmt(recargoTC)]]:[])] .map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:T.sub}}><span>{l}</span><span>{v}</span></div>
            ))}
          </div>
          <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(totalFinal)}</span></div>
            <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(exch>0?totalFinal/exch:0)} USD</div>
          </div>
          <div style={{background:T.surf,borderRadius:9,padding:11}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"4px 0"}}><span>Anticipo</span><span>Q {fmt(anticipo)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,padding:"4px 0",color:saldo>0?T.sec:T.acc}}><span>Saldo</span><span>Q {fmt(saldo)}</span></div>
          </div>
        </>
      ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Selecciona vehículo y fechas</div>}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar reserva":"Nueva reserva"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="CLIENTE" span2>
              <ClienteBuscador value={f.cliente_nombre} onChange={v=>sf("cliente_nombre",v)} empId={empId}/>
            </Fld>
            <Fld label="TIPO DE SERVICIO" span2>
              <div style={{display:"flex",gap:8}}>
                <button tabIndex={0} onClick={()=>sf("tipo","renta")} style={{...S.btn(f.tipo==="renta"?"primary":"ghost"),flex:1}}>🔑 Renta de vehículo</button>
                <button tabIndex={0} onClick={()=>sf("tipo","traslado")} style={{...S.btn(f.tipo==="traslado"?"primary":"ghost"),flex:1}}>🗺 Traslado</button>
              </div>
            </Fld>
            <Fld label="ESTADO">
              <select tabIndex={0} style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="en_curso">▶ En curso</option>
                <option value="completada">🏁 Completada</option>
                <option value="cancelada">✗ Cancelada</option>
              </select>
            </Fld>
            <Fld label="HORA DE RECOGIDA">
              <input tabIndex={0} style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/>
            </Fld>
            <Fld label="VEHÍCULO" span2>
              <select tabIndex={0} style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
                <option value="">Seleccionar vehículo...</option>
                {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q {fmt(v.dia)}/día</option>)}
              </select>
            </Fld>
            <Fld label="CONDUCTOR">
              <input tabIndex={0} style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del piloto"/>
            </Fld>
            <Fld label="IVA">
              <select tabIndex={0} style={S.sel} value={f.iva} onChange={e=>sf("iva",parseInt(e.target.value))}>
                <option value={12}>12% Régimen General</option>
                <option value={5}>5% Pequeño Contrib.</option>
                <option value={0}>Sin IVA</option>
              </select>
            </Fld>
            <Fld label="FECHA ENTREGA">
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/>
            </Fld>
            <Fld label="FECHA DEVOLUCIÓN">
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/>
            </Fld>
            <Fld label="ORIGEN">
              <input tabIndex={0} style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Ciudad de Guatemala"/>
            </Fld>
            <Fld label="DESTINO">
              <input tabIndex={0} style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Destino"/>
            </Fld>
            <Fld label="DEPARTAMENTO">
              <select tabIndex={0} style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}>
                <option value="">Seleccionar...</option>
                {Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Fld>
            <Fld label="MUNICIPIO">
              <select tabIndex={0} style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}>
                <option value="">Seleccionar...</option>
                {munis.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="MÉTODO DE PAGO" span2>
              <div style={{display:"flex",gap:8}}>
                {[["efectivo","💵 Efectivo"],["transferencia","🏦 Transferencia"],["tarjeta","💳 Tarjeta (+5%)"]].map(([v,l])=>(
                  <button tabIndex={0} key={v} onClick={()=>sf("pago",v)} style={{...S.btn(f.pago===v?"primary":"ghost"),flex:1,fontSize:11}}>{l}</button>
                ))}
              </div>
            </Fld>
            <Fld label="TASA CAMBIO ($1 USD)">
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/>
            </Fld>
            <Fld label="ANTICIPO (Q)">
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/>
            </Fld>
            <Fld label="NOTAS" span2>
              <textarea tabIndex={0} style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
            </Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:6}}>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:12,fontSize:14}}>{saving?"💾 Guardando...":"💾 Guardar reserva"}</button>
              <button tabIndex={0} onClick={onCancel} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
            </div>
          </div>
        </div>
        <Resumen/>
      </div>
    </div>
  );
}

// ═══ CLIENTES Y FLOTA ═══



// ═══ DASHBOARD ═══

// ═══ EXPORTAR UNIVERSAL ════════════════════════════════════════════════════════
function ModalExportar({titulo,datos,campos,onClose}){
  const [modulo,setModulo]=useState("todo");
  const [formato,setFormato]=useState("csv");
  const [fechaIni,setFechaIni]=useState("");
  const [fechaFin,setFechaFin]=useState("");

  const filtrar=()=>{
    if(!fechaIni&&!fechaFin) return datos;
    return datos.filter(r=>{
      const f=r.fecha||r.created_at||r.fecha_inicio||"";
      if(fechaIni&&f<fechaIni) return false;
      if(fechaFin&&f>fechaFin) return false;
      return true;
    });
  };

  const exportar=()=>{
    const rows=filtrar();
    const headers=campos.map(c=>c.label);
    const body=rows.map(r=>campos.map(c=>{
      const v=c.key.split(".").reduce((o,k)=>o?.[k],r);
      return String(v??"-");
    }));

    if(formato==="pdf"){
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>${titulo}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
      h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #E2E8F0}
      tr:nth-child(even){background:#F8FAFC}
      @media print{button{display:none}}</style></head><body>
      <h2>Tz'unun AutoRentas — ${titulo}</h2>
      <p>Generado: ${new Date().toLocaleDateString("es-GT",{day:"2-digit",month:"long",year:"numeric"})} · ${rows.length} registros</p>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${body.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
      </table><script>window.onload=()=>window.print();</script></body></html>`;
      const w=window.open("","_blank");w.document.write(html);w.document.close();
      onClose();return;
    }

    const bom="﻿";
    const sep=formato==="csv"?",":"	";
    const ext=formato==="csv"?".csv":".xls";
    const csv=bom+[headers.join(sep),...body.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(sep))].join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=titulo.replace(/\s+/g,"_")+ext;a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,borderRadius:16,border:"1px solid "+T.bord,width:"100%",maxWidth:480,padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800}}>📤 Exportar — {titulo}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:18}}>✕</button>
        </div>

        <div style={{marginBottom:14}}>
          <label style={S.lbl}>PERÍODO</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={{...S.lbl,fontSize:10}}>DESDE</label><input style={S.inp} type="date" value={fechaIni} onChange={e=>setFechaIni(e.target.value)}/></div>
            <div><label style={{...S.lbl,fontSize:10}}>HASTA</label><input style={S.inp} type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)}/></div>
          </div>
          {(fechaIni||fechaFin)&&<div style={{fontSize:11,color:T.acc,marginTop:4}}>{filtrar().length} registros en el período</div>}
        </div>

        <div style={{marginBottom:20}}>
          <label style={S.lbl}>FORMATO DE EXPORTACIÓN</label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["csv","📄 CSV (valor separado por coma)"],["xls","📊 XLS (compatible con Microsoft Excel)"],["pdf","🖨️ PDF (para imprimir)"]].map(([v,l])=>(
              <label key={v} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:8,background:formato===v?T.accDim:T.surf,border:"1px solid "+(formato===v?T.acc:T.bord)}}>
                <input type="radio" name="formato" value={v} checked={formato===v} onChange={()=>setFormato(v)} style={{width:16,height:16,accentColor:T.acc}}/>
                <span style={{fontSize:13}}>{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{fontSize:11,color:T.mut,marginBottom:16,padding:"8px 12px",background:T.surf,borderRadius:6}}>
          Se exportarán <b style={{color:T.acc}}>{filtrar().length}</b> registros con {campos.length} campos.
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={exportar} style={{...S.btn("primary"),flex:2,padding:12,fontSize:14}}>📤 Exportar</button>
          <button onClick={onClose} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}


// ═══ PAGOS RECIBIDOS ══════════════════════════════════════════════════════════
function PagePagos({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [facturas,setFacturas]=useState([]);
  const [reservas,setReservas]=useState([]);
  const [cuentas,setCuentas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [exportar,setExportar]=useState(false);
  const EMPTY_P={fecha:today(),monto:"",metodo:"transferencia",referencia:"",
    factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""};
  const [f,setF]=useState({...EMPTY_P});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{
    setLoading(true);
    const [p,fa,re,cu]=await Promise.all([
      dbGet("pagos_recibidos",""),
      dbGet("facturas",""),
      dbGet("reservas",""),
      dbGet("cuentas_bancarias",""),
    ]);
    setRows(Array.isArray(p)?p:[]);
    setFacturas(Array.isArray(fa)?fa.filter(x=>!["anulada","borrador"].includes(x.estado)):[]);
    setReservas(Array.isArray(re)?re.filter(x=>!["cancelada"].includes(x.estado)):[]);
    setCuentas(Array.isArray(cu)?cu:[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const guardar=async()=>{
    if(!f.monto||parseFloat(f.monto)<=0){showToast("Ingresa el monto recibido","err");return;}
    if(!f.concepto.trim()&&!f.factura_id&&!f.reserva_id){showToast("Ingresa un concepto o vincula a factura/reserva","err");return;}
    if(!f.cuenta_id){showToast("Selecciona la cuenta bancaria donde se recibe el pago","err");return;}
    setSaving(true);
    const monto=parseFloat(f.monto);
    // Auto concepto
    let concepto=f.concepto.trim();
    if(!concepto){
      const fa=facturas.find(x=>x.id===f.factura_id);
      const re=reservas.find(x=>x.id===f.reserva_id);
      if(fa) concepto="Pago factura "+(fa.numero||"")+" — "+fa.nombre_receptor;
      else if(re) concepto="Pago reserva "+(re.numero||"")+" — "+re.cliente_nombre;
      else concepto="Pago recibido";
    }
    // 1. Save pago
    const pago=await dbIns("pagos_recibidos",{
      empresa_id: empId || DEFAULT_EMPRESA_ID,
      fecha:f.fecha,
      monto,
      metodo:f.metodo,
      referencia:f.referencia,
      concepto,
      cuenta_id:f.cuenta_id,
      notas:f.notas,
      factura_id:f.factura_id||null,
      reserva_id:f.reserva_id||null,
    });
    if(!pago||pago.error){
      showToast("Error al guardar el pago: "+(pago?.error?.message||"error desconocido"),"err");
      setSaving(false);return;
    }
    // 2. Update factura saldo
    if(f.factura_id){
      const fa=facturas.find(x=>x.id===f.factura_id);
      if(fa){
        const saldo=Math.max(0,(parseFloat(fa.saldo_pendiente)||parseFloat(fa.total)||0)-monto);
        await dbUpd("facturas",f.factura_id,{
          saldo_pendiente:saldo,
          estado:saldo<=0?"pagada":"parcial"
        });
      }
    }
    // 3. Update reserva saldo
    if(f.reserva_id){
      const re=reservas.find(x=>x.id===f.reserva_id);
      if(re){
        const saldo=Math.max(0,(parseFloat(re.saldo)||0)-monto);
        const anticipo=(parseFloat(re.anticipo)||0)+monto;
        await dbUpd("reservas",f.reserva_id,{saldo,anticipo});
      }
    }
    // 4. Register in banca & update saldo
    await dbIns("movimientos_bancarios",{
      empresa_id: empId || DEFAULT_EMPRESA_ID,
      cuenta_id:f.cuenta_id,
      fecha:f.fecha,
      tipo:"ingreso",
      descripcion:concepto,
      monto,
      referencia:f.referencia,
      categoria:"ventas",
      conciliado:false,
      notas:f.notas,
    });
    const cu=cuentas.find(x=>x.id===f.cuenta_id);
    if(cu){
      await dbUpd("cuentas_bancarias",f.cuenta_id,{
        saldo_actual:(parseFloat(cu.saldo_actual)||0)+monto
      });
    }
    showToast("Pago registrado correctamente ✔");
    setSaving(false);
    setShowForm(false);
    setF({...EMPTY_P});
    load();
  };

  const del=async id=>{
    if(!confirm("¿Eliminar este pago? Esta acción no se puede deshacer."))return;
    await dbDel("pagos_recibidos",id);
    showToast("Pago eliminado");
    load();
  };

  const total=rows.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const esteMes=rows.filter(r=>(r.fecha||"").slice(0,7)===today().slice(0,7))
    .reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

  const CAMPOS=[
    {label:"Fecha",key:"fecha"},{label:"Concepto",key:"concepto"},
    {label:"Monto",key:"monto"},{label:"Método",key:"metodo"},
    {label:"Referencia",key:"referencia"},{label:"Notas",key:"notas"},
  ];

  return(
    <div>
      {exportar&&<ModalExportar titulo="Pagos Recibidos" datos={rows} campos={CAMPOS} onClose={()=>setExportar(false)}/>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Total recibido",v:"Q "+fmt(total),c:T.acc,bg:T.accDim},
          {l:"Este mes",v:"Q "+fmt(esteMes),c:T.blue,bg:T.blueDim},
          {l:"Registros",v:rows.length,c:T.purple,bg:T.purpleDim}
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>📤 Exportar</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺ Actualizar</button>
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>
          {showForm?"Cancelar":"+ Registrar pago"}
        </button>
      </div>

      {/* Formulario */}
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Registrar pago recibido</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="FECHA">
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/>
            </Fld>
            <Fld label="MONTO RECIBIDO (GTQ)">
              <input tabIndex={0} style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/>
            </Fld>
            <Fld label="CUENTA BANCARIA (donde se recibe) *">
              <select tabIndex={0} style={cuentas.length===0?{...S.sel,borderColor:T.red}:S.sel} value={f.cuenta_id} onChange={e=>sf("cuenta_id",e.target.value)}>
                <option value="">Seleccionar cuenta bancaria...</option>
                {cuentas.map(cu=>(
                  <option key={cu.id} value={cu.id}>
                    {cu.banco} — {cu.numero_cuenta} · Q {fmt(cu.saldo_actual||0)}
                  </option>
                ))}
              </select>
              {cuentas.length===0&&<div style={{fontSize:11,color:T.red,marginTop:3}}>⚠ No hay cuentas bancarias. Ve a La Banca para crearlas.</div>}
            </Fld>
            <Fld label="MÉTODO DE PAGO">
              <select tabIndex={0} style={S.sel} value={f.metodo} onChange={e=>sf("metodo",e.target.value)}>
                <option value="transferencia">🏦 Transferencia bancaria</option>
                <option value="deposito">💰 Depósito en banco</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta de crédito/débito</option>
                <option value="cheque">📄 Cheque</option>
              </select>
            </Fld>
            <Fld label="VINCULAR A FACTURA (opcional)">
              <select tabIndex={0} style={S.sel} value={f.factura_id} onChange={e=>sf("factura_id",e.target.value)}>
                <option value="">Sin factura vinculada</option>
                {facturas.map(fa=>(
                  <option key={fa.id} value={fa.id}>
                    {fa.numero} — {fa.nombre_receptor} — Saldo: Q {fmt(fa.saldo_pendiente||fa.total)}
                  </option>
                ))}
              </select>
            </Fld>
            <Fld label="VINCULAR A RESERVA (opcional)">
              <select tabIndex={0} style={S.sel} value={f.reserva_id} onChange={e=>sf("reserva_id",e.target.value)}>
                <option value="">Sin reserva vinculada</option>
                {reservas.map(re=>(
                  <option key={re.id} value={re.id}>
                    {re.numero} — {re.cliente_nombre} — Saldo: Q {fmt(re.saldo||re.monto)}
                  </option>
                ))}
              </select>
            </Fld>
            <Fld label="CONCEPTO" span2>
              <input tabIndex={0} style={S.inp} value={f.concepto} onChange={e=>sf("concepto",e.target.value)} placeholder="Ej: Anticipo reserva Cobán, Pago factura FAC-001..."/>
            </Fld>
            <Fld label="REFERENCIA / N° COMPROBANTE">
              <input tabIndex={0} style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REF-00001"/>
            </Fld>
            <Fld label="NOTAS">
              <input tabIndex={0} style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones"/>
            </Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:10,fontSize:13}}>
                {saving?"💾 Registrando...":"💾 Registrar pago"}
              </button>
              <button tabIndex={0} onClick={()=>{setShowForm(false);setF({...EMPTY_P});}} style={{...S.btn("ghost"),flex:1,padding:10}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading?<Spinner/>:rows.length===0?
        <Empty icon="💰" msg="Sin pagos registrados" action="+ Registrar pago" onAction={()=>setShowForm(true)}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Fecha","Concepto","Método","Referencia","Monto",""].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(r.fecha)}</td>
                  <td style={{...S.td,fontWeight:500}}>{r.concepto}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{r.metodo}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{r.referencia||"—"}</td>
                  <td style={{...S.td,fontWeight:700,color:T.acc,whiteSpace:"nowrap"}}>Q {fmt(r.monto)}</td>
                  <td style={S.td}>
                    <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:T.surf}}>
                <td colSpan={4} style={{padding:"9px 10px",fontWeight:700,color:T.sub,fontSize:12}}>TOTAL</td>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.acc,fontSize:14}}>Q {fmt(total)}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function PageDashboard(){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    const [veh,res,cots,fac,movs,cb,cl]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("movimientos_bancarios",""),dbGet("cuentas_bancarias",""),dbGet("clientes","")]);
    const v=Array.isArray(veh)?veh:[],r=Array.isArray(res)?res:[],c=Array.isArray(cots)?cots:[],f=Array.isArray(fac)?fac:[],m=Array.isArray(movs)?movs:[],cuentas=Array.isArray(cb)?cb:[],clientes=Array.isArray(cl)?cl:[];
    const ing=m.filter(x=>x.tipo==="ingreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const eg=m.filter(x=>x.tipo==="egreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const saldo=cuentas.filter(x=>x.moneda==="GTQ").reduce((s,x)=>s+(parseFloat(x.saldo_actual)||0),0);
    const facTot=f.filter(x=>!["anulada","borrador"].includes(x.estado)).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const vMant=v.filter(x=>x.estado==="mantenimiento").length;
    const alertas=[];
    if(vMant>0)alertas.push({icon:"🔧",msg:`${vMant} vehículo${vMant>1?"s":""} en mantenimiento`,c:T.sec});
    if(r.filter(x=>x.estado==="pendiente").length>0)alertas.push({icon:"📅",msg:`${r.filter(x=>x.estado==="pendiente").length} reservas pendientes`,c:T.sec});
    if(c.filter(x=>x.estado==="enviada").length>0)alertas.push({icon:"📋",msg:`${c.filter(x=>x.estado==="enviada").length} cotizaciones esperando aprobación`,c:T.blue});
    const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const chart=meses.map((mes,i)=>({mes,Ingresos:Math.round(m.filter(x=>x.tipo==="ingreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0)),Egresos:Math.round(m.filter(x=>x.tipo==="egreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0))})).filter(x=>x.Ingresos>0||x.Egresos>0);
    const pie=[{name:"Disponible",value:v.filter(x=>x.estado==="disponible").length,color:T.acc},{name:"Rentado",value:v.filter(x=>x.estado==="rentado").length,color:T.blue},{name:"Mantenim.",value:vMant,color:T.sec}].filter(x=>x.value>0);
    setD({v,r,c,clientes,alertas,chart,pie,ing,eg,saldo,facTot,vDisp:v.filter(x=>x.estado==="disponible").length,vRent:v.filter(x=>x.estado==="rentado").length,rAct:r.filter(x=>["en_curso","confirmada"].includes(x.estado)).length});
    setLoading(false);
  };
  if(loading)return <Spinner/>;
  return(
    <div>
      {d.alertas.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{d.alertas.map((a,i)=><div key={i} style={{background:T.card,border:`1px solid ${a.c}44`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{a.icon}</span><span style={{fontSize:13}}>{a.msg}</span><div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:a.c}}/></div>)}</div>}
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>OPERACIÓN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[{icon:"🚗",l:"Flota",v:d.v.length,c:T.acc,bg:T.accDim},{icon:"✅",l:"Disponibles",v:d.vDisp,c:T.acc,bg:T.accDim},{icon:"🔑",l:"Rentados",v:d.vRent,c:T.blue,bg:T.blueDim},{icon:"📅",l:"Res. activas",v:d.rAct,c:T.blue,bg:T.blueDim},{icon:"👥",l:"Clientes",v:d.clientes.length,c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>FINANZAS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{icon:"💰",l:"Ingresos",v:fmtK(d.ing),c:T.acc,bg:T.accDim},{icon:"💸",l:"Egresos",v:fmtK(d.eg),c:T.red,bg:T.redDim},{icon:"🏦",l:"Saldo GTQ",v:fmtK(d.saldo),c:T.acc,bg:T.accDim},{icon:"🧾",l:"Facturado",v:fmtK(d.facTot),c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos vs Egresos</div>{d.chart.length>0?<ResponsiveContainer width="100%" height={180}><BarChart data={d.chart}><XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/><Tooltip contentStyle={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="Ingresos" fill={T.acc} radius={[4,4,0,0]}/><Bar dataKey="Egresos" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>:<div style={{textAlign:"center",padding:40,color:T.sub,fontSize:13}}>Sin movimientos aún</div>}</div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Flota</div>{d.pie.length>0?<><ResponsiveContainer width="100%" height={120}><PieChart><Pie data={d.pie} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={3}>{d.pie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>{d.pie.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div><span style={{fontWeight:700,color:e.color}}>{e.value}</span></div>)}</>:<div style={{textAlign:"center",padding:30,color:T.sub,fontSize:12}}>Sin datos</div>}</div>
      </div>
    </div>
  );
}

// ═══ RESERVAS PAGE ═══

// ═══ CALCULADORA ═══

// ═══ COTIZACIONES PAGE ═══
function PageCotizaciones({showToast,empId}){
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [preview,setPreview]=useState(null);
  const load=async()=>{setLoading(true);const d=await dbGet("cotizaciones");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));load();},[]);
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("cotizaciones",id);showToast("Eliminada");load();};
  const chEst=async(id,estado)=>{await dbUpd("cotizaciones",id,{estado,orden_venta:estado==="orden_venta"});showToast("→ "+estado);load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro||(filtro==="orden_venta"&&r.orden_venta));
  const EC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"},orden_venta:{c:T.purple,bg:T.purpleDim,l:"Orden de Venta"}};
  if(vista==="form")return <div><FormCotizacion initial={editItem} empId={empId} clientes={clientes} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      {preview&&<ModalVistaPrevia cot={preview} onClose={()=>setPreview(null)}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Enviadas",v:rows.filter(r=>r.estado==="enviada").length,c:T.blue},{l:"Aprobadas",v:rows.filter(r=>r.estado==="aprobada").length,c:T.acc},{l:"Órdenes",v:rows.filter(r=>r.orden_venta).length,c:T.purple}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","enviada","aprobada","rechazada","orden_venta"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f==="orden_venta"?"📦 Órdenes":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="📭" msg="Sin cotizaciones"/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(r=>{
            const e=r.orden_venta?EC.orden_venta:(EC[r.estado]||EC.borrador);
            const total=parseFloat(r.total_gtq)||0;
            const makePDF=()=>generarPDF({numero:r.numero,fecha:r.fecha_emision||today(),fecha_vence:r.fecha_vence,cliente:r.cliente_nombre,nit:r.cliente_nit,dir_cliente:r.cliente_dir,saludo:r.saludo,servicio:r.descripcion_servicio,caract:r.caract||["Vehículo","Aire acond.","Cinturones","Seguro"],incluidos:r.incluidos||["Combustible","Conductor","Atención"],beneficios:r.beneficios||["Viaje seguro","Puntualidad","Flexibilidad"],con_piloto:r.con_piloto!==false,sub:parseFloat(r.subtotal)||0,iva_pct:parseFloat(r.tasa_iva)||5,iva_amt:parseFloat(r.total_iva)||0,total_ef:total,total_tc:total*1.05,exch:parseFloat(r.tasa_cambio)||7.70,es_orden:r.orden_venta});
            return(
              <div key={r.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>{r.saludo&&<div style={{fontSize:11,color:T.sub,fontStyle:"italic"}}>"{r.saludo}"</div>}<div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"🔑":"🗺"} {r.dias}d{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div></div>
                  <div style={{textAlign:"right"}}><Badge color={e.c} bg={e.bg} label={e.l} small/><div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(total)}</div></div>
                </div>
                <div style={{display:"flex",gap:5,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                  <button onClick={()=>setPreview(r)} style={{...S.btn("blue"),fontSize:11,padding:"4px 9px"}}>👁 Ver</button>
                  <button onClick={()=>{const doc=makePDF();if(doc)doc.save(r.numero+".pdf");}} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>⬇ PDF</button>
                  <button onClick={()=>{const doc=makePDF();if(doc){const url=URL.createObjectURL(doc.output("blob"));const w=window.open(url);setTimeout(()=>w&&w.print(),1000);}}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>🖨️</button>
                  <button onClick={()=>{window.open("mailto:?subject="+encodeURIComponent("Cotización "+r.numero)+"&body="+encodeURIComponent("Estimados, adjunto cotización "+r.numero+" por Q "+fmt(total)+". Para más información: Oscar Gálvez 502-31221538"));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>✉️</button>
                  <button onClick={()=>{const msg="Estimados, le comparto cotización "+r.numero+" de Tz'unun AutoRentas por Q "+fmt(total)+". Para aprobar o consultar: 502-31221538";window.open("https://wa.me/?text="+encodeURIComponent(msg));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px",background:"#25D366",color:"white"}}>💬 WA</button>
                  <button onClick={()=>{setEditItem({...r,__clon:true});setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>📋 Clonar</button>
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>✏️</button>
                  {!r.orden_venta&&<button onClick={()=>chEst(r.id,"orden_venta")} style={{...S.btn("purple"),fontSize:11,padding:"4px 9px"}}>📦</button>}
                  {r.estado==="enviada"&&<button onClick={()=>chEst(r.id,"aprobada")} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>✅</button>}
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"4px 9px",marginLeft:"auto"}}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══ FACTURACIÓN PAGE ═══
function PageFacturacion({showToast,empId}){
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [exportar,setExportar]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const delFac=async id=>{if(!confirm("¿Eliminar esta factura permanentemente?"))return;await dbDel("facturas",id);showToast("Factura eliminada");load();};
  const imprimirFac=r=>{
    const lineas=r.lineas?JSON.parse(r.lineas):[];
    const ivaPct=parseFloat(r.tasa_iva)||5;
    const total=parseFloat(r.total)||0;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${r.numero}</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}.titulo{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:8px}.emisor{color:#1B2D5C;font-size:10px;margin-bottom:4px}.right{text-align:right}.autorizacion{text-align:right;font-size:9px;color:#DC2626}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}th{background:#1B2D5C;color:#fff;padding:5px 6px}td{padding:5px 6px;border-bottom:1px solid #E2E8F0}.footer{margin-top:10px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}@media print{button{display:none}}</style></head><body>
    <div class="titulo">${ivaPct===5?"Factura Pequeño Contribuyente":"Factura"}</div>
    <div style="display:flex;justify-content:space-between">
      <div class="emisor"><strong>VANESSA MARÍA, GÁLVEZ HERNÁNDEZ</strong><br/>Nit Emisor: 20160860<br/><strong>TRANSPORTES TZUNUN</strong><br/>6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO</div>
      <div class="autorizacion"><strong>NÚMERO DE AUTORIZACIÓN:</strong><br/>${r.numero_autorizacion||"—"}<br/>Serie: ${r.serie||"—"} Número DTE: ${r.numero_dte||"—"}</div>
    </div>
    <hr/>
    <div style="font-size:10px">NIT Receptor: ${r.nit_receptor||"CF"} &nbsp;|&nbsp; Nombre: <strong>${r.nombre_receptor}</strong> &nbsp;|&nbsp; Fecha: ${r.fecha_emision||""} &nbsp;|&nbsp; Moneda: GTQ</div>
    <table><thead><tr><th>#</th><th>B/S</th><th>Cant.</th><th>Descripción</th><th class="right">P. Unitario</th><th class="right">Total</th></tr></thead>
    <tbody>${lineas.map((l,i)=>`<tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">Q ${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">Q ${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-(parseFloat(l.descuento)||0)).toFixed(2)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="4"/><td class="right"><strong>TOTAL:</strong></td><td class="right"><strong>Q ${total.toFixed(2)}</strong></td></tr></tfoot></table>
    ${ivaPct===5?'<p style="font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
    <div class="footer"><strong>Datos del certificador:</strong> Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
    <div style="text-align:center;margin-top:12px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
    <script>window.onload=()=>window.print();</script></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));dbGet("reservas","").then(d=>setReservas(Array.isArray(d)?d:[]));dbGet("cotizaciones","&estado=eq.aprobada").then(d=>setCotizaciones(Array.isArray(d)?d:[]));dbGet("movimientos_bancarios","&tipo=eq.ingreso").then(d=>setAnticipos(Array.isArray(d)?d:[]));load();},[]);
  const anular=async(fac,mot)=>{await dbUpd("facturas",fac.id,{estado:"anulada",motivo_anulacion:mot});showToast("Anulada");setMAnular(null);load();};
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id: empId || DEFAULT_EMPRESA_ID,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" — "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada ✔":"Pago parcial ✔");setMPago(null);load();};
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorización","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      {exportar&&<ModalExportar titulo="Facturas" datos={rows} campos={[{label:"N°",key:"numero"},{label:"Cliente",key:"nombre_receptor"},{label:"NIT",key:"nit_receptor"},{label:"Fecha",key:"fecha_emision"},{label:"Total",key:"total"},{label:"Saldo",key:"saldo_pendiente"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>🔐 Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>📤 Exportar</button>
                <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="🧾" msg="Sin facturas"/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Total","Anticipo","Saldo","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;const saldo=parseFloat(r.saldo_pendiente)||0;const ant=parseFloat(r.anticipo_aplicado)||0;return <tr key={r.id}><td style={S.td}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc,fontWeight:700}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>✓ DTE</div>}{r.motivo_anulacion&&<div style={{fontSize:9,color:T.red}}>⚠ {r.motivo_anulacion.slice(0,20)}</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:10,color:T.mut}}>{r.nit_receptor}</div></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={{...S.td,color:ant>0?T.acc:T.mut,fontSize:12}}>{ant>0?"Q "+fmt(ant):"—"}</td><td style={{...S.td,fontWeight:700,color:saldo>0?T.sec:T.acc}}>{r.estado==="anulada"?"—":"Q "+fmt(saldo)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:90}}>{r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 7px",fontSize:10,width:"100%"}}>🔐 DTE</button>}{["emitida","certificada","parcial"].includes(r.estado)&&<button onClick={()=>setMPago(r)} style={{...S.btn("primary"),padding:"3px 7px",fontSize:10,width:"100%"}}>💰 Pago</button>}{r.estado!=="anulada"&&<button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 7px",fontSize:10,width:"100%"}}>✏️</button>}{!["anulada","pagada"].includes(r.estado)&&<button onClick={()=>setMAnular(r)} style={{...S.btn("danger"),padding:"3px 7px",fontSize:10,width:"100%"}}>🚫</button>}</div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ═══ LA BANCA ═══
function PageBanca({showToast,empId}){
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [saving,setSaving]=useState(false);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");const [exportar,setExportar]=useState(false);
  const [f,setF]=useState({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const CATS=["ventas","combustible","mantenimiento","salarios","seguros","servicios","oficina","otros"];
  const CC={ventas:T.acc,combustible:T.sec,mantenimiento:T.blue,salarios:T.green,seguros:T.purple,servicios:T.acc,oficina:T.mut,otros:T.sub};
  useEffect(()=>{loadCuentas();},[]);
  const loadCuentas=async()=>{setLoading(true);const c=await dbGet("cuentas_bancarias");const arr=Array.isArray(c)?c:[];setCuentas(arr);if(arr.length>0){const first=arr[0];setCuentaAct(first);}setLoading(false);};
  const loadMovs=async(cid)=>{if(!cid)return;const m=await dbGet("movimientos_bancarios",`&cuenta_id=eq.${cid}`);setMovs(Array.isArray(m)?m:[]);};
  useEffect(()=>{if(cuentaAct)loadMovs(cuentaAct.id);},[cuentaAct?.id]);
  const guardarMov=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.monto)>0)){showToast("Descripción y monto requeridos","err");return;}setSaving(true);await dbIns("movimientos_bancarios",{empresa_id: empId || DEFAULT_EMPRESA_ID,cuenta_id:cuentaAct.id,fecha:f.fecha,tipo:f.tipo,descripcion:f.descripcion,monto:parseFloat(f.monto),referencia:f.referencia,categoria:f.categoria,conciliado:f.conciliado,notas:f.notas});showToast("Guardado ✔");setSaving(false);setShowForm(false);setF({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});loadMovs(cuentaAct.id);};
  const conciliar=async(id,val)=>{await dbUpd("movimientos_bancarios",id,{conciliado:val});loadMovs(cuentaAct.id);};
  const movsFil=movs.filter(m=>{if(filtroT!=="todos"&&m.tipo!==filtroT)return false;if(filtroC==="conciliado"&&!m.conciliado)return false;if(filtroC==="pendiente"&&m.conciliado)return false;return true;});
  const ing=movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const saldoGTQ=cuentas.filter(c=>c.moneda==="GTQ").reduce((s,c)=>s+(parseFloat(c.saldo_actual)||0),0);
  return(
    <div>
      {exportar&&<ModalExportar titulo="Movimientos Bancarios" datos={movs} campos={[{label:"Fecha",key:"fecha"},{label:"Descripción",key:"descripcion"},{label:"Categoría",key:"categoria"},{label:"Tipo",key:"tipo"},{label:"Monto",key:"monto"},{label:"Referencia",key:"referencia"},{label:"Conciliado",key:"conciliado"}]} onClose={()=>setExportar(false)}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[{l:"Saldo total GTQ",v:`Q ${fmt(saldoGTQ)}`,c:T.acc,bg:T.accDim},{l:"Ingresos",v:`Q ${fmt(ing)}`,c:T.acc,bg:T.accDim},{l:"Sin conciliar",v:movs.filter(m=>!m.conciliado).length,c:T.sec,bg:T.secDim}].map((s,i)=><div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}><div style={{fontSize:11,color:T.mut}}>{s.l}</div><div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:18}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>MIS CUENTAS</div>
          {loading?<Spinner/>:cuentas.length===0?<Empty icon="🏦" msg="Sin cuentas registradas"/>:cuentas.map(c=><div key={c.id} onClick={()=>setCuentaAct(c)} style={{...S.card,cursor:"pointer",border:`1px solid ${cuentaAct?.id===c.id?T.acc:T.bord}`,marginBottom:10,background:cuentaAct?.id===c.id?T.accDim:T.card}}><div style={{fontSize:13,fontWeight:700}}>{c.banco}</div><div style={{fontSize:11,color:T.sub}}>{c.numero_cuenta} · {c.moneda}</div><div style={{fontSize:18,fontWeight:800,color:T.acc,marginTop:8}}>Q {fmt(c.saldo_actual)}</div></div>)}
        </div>
        <div>
          {cuentaAct&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:14,fontWeight:700}}>{cuentaAct.banco}</div><div style={{fontSize:12,color:T.sub}}>{cuentaAct.numero_cuenta}</div></div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>📤 Exportar</button>
                <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
              </div>
            </div>
            {showForm&&<div style={{...S.card,marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                <Fld label="TIPO"><div style={{display:"flex",gap:8}}><button onClick={()=>sf("tipo","ingreso")} style={{...S.btn(f.tipo==="ingreso"?"primary":"ghost"),flex:1,fontSize:12}}>⬆ Ingreso</button><button onClick={()=>sf("tipo","egreso")} style={{...S.btn(f.tipo==="egreso"?"danger":"ghost"),flex:1,fontSize:12}}>⬇ Egreso</button></div></Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripción..."/></Fld>
                <Fld label="MONTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/></Fld>
                <Fld label="CATEGORÍA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
                <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="N° factura..."/></Fld>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:18}}><input type="checkbox" checked={f.conciliado} onChange={e=>sf("conciliado",e.target.checked)} style={{width:16,height:16}}/><label style={{...S.lbl,marginBottom:0}}>CONCILIADO</label></div>
                <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardarMov} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"💾 Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
              </div>
            </div>}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {["todos","ingreso","egreso"].map(t=><button key={t} onClick={()=>setFiltroT(t)} style={{...S.btn(filtroT===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todos":t==="ingreso"?"⬆ Ingresos":"⬇ Egresos"}</button>)}
              {["todos","conciliado","pendiente"].map(t=><button key={t} onClick={()=>setFiltroC(t)} style={{...S.btn(filtroC===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todo":t==="conciliado"?"✅ Conciliados":"⏳ Pendientes"}</button>)}
            </div>
            {movsFil.length===0?<Empty icon="💳" msg="Sin movimientos" action="+ Registrar" onAction={()=>setShowForm(true)}/>:(
              <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Cat.","Monto","✓",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{movsFil.map(m=><tr key={m.id}><td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(m.fecha)}</td><td style={{...S.td,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:175}}>{m.descripcion}</div>{m.referencia&&<div style={{fontSize:9,color:T.mut}}>{m.referencia}</div>}</td><td style={S.td}><span style={{padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:600,background:(CC[m.categoria]||T.mut)+"22",color:CC[m.categoria]||T.mut}}>{m.categoria}</span></td><td style={{...S.td,fontWeight:700,color:m.tipo==="ingreso"?T.acc:T.red,whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+ ":"− "}Q {fmt(m.monto)}</td><td style={S.td}><button onClick={()=>conciliar(m.id,!m.conciliado)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,padding:0}}>{m.conciliado?"✅":"⬜"}</button></td><td style={S.td}><button onClick={async()=>{if(!confirm("¿Eliminar?"))return;await dbDel("movimientos_bancarios",m.id);loadMovs(cuentaAct.id);}} style={{...S.btn("danger"),padding:"3px 7px",fontSize:11}}>🗑️</button></td></tr>)}
              </tbody></table></div>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}

// ═══ GASTOS PAGE ═══
function PageGastos({showToast,empId}){
  const [tab,setTab]=useState("gastos");const [proveedores,setProveedores]=useState([]);
  useEffect(()=>{dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));},[]);
  const reloadProv=()=>dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
        {[{id:"gastos",l:"💸 Gastos y Compras"},{id:"proveedores",l:"🏪 Proveedores"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      </div>
      {tab==="gastos"&&<ModGastos empId={empId} proveedores={proveedores} showToast={showToast}/>}
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={(m,tp)=>{showToast(m,tp);reloadProv();}}/>}
    </div>
  );
}

// ═══ REPORTES PAGE ═══
function PageReportes(){
  const [tab,setTab]=useState("ventas");const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    const [vehiculos,reservas,cotizaciones,facturas,gastos,clientes,movimientos]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("gastos",""),dbGet("clientes",""),dbGet("movimientos_bancarios","")]);
    setData({vehiculos:Array.isArray(vehiculos)?vehiculos:[],reservas:Array.isArray(reservas)?reservas:[],cotizaciones:Array.isArray(cotizaciones)?cotizaciones:[],facturas:Array.isArray(facturas)?facturas:[],gastos:Array.isArray(gastos)?gastos:[],clientes:Array.isArray(clientes)?clientes:[],movimientos:Array.isArray(movimientos)?movimientos:[]});
    setLoading(false);
  };
  const TABS=[{id:"ventas",l:"📊 Ventas"},{id:"flota",l:"🚗 Flota"},{id:"gastos",l:"💸 Gastos"},{id:"clientes",l:"👥 Clientes"}];
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺ Actualizar</button>
      </div>
      {loading?<Spinner/>:data&&<>{tab==="ventas"&&<ReporteVentas data={data}/>}{tab==="flota"&&<ReporteFlota data={data}/>}{tab==="gastos"&&<ReporteGastos data={data}/>}{tab==="clientes"&&<ReporteClientes data={data}/>}</>}
    </div>
  );
}

// ═══ CONFIGURACIÓN ═══
function PageConfiguracion({showToast}){
  const [tab,setTab]=useState("empresa");const [emp,setEmp]=useState({});const [empId,setEmpId]=useState(null);const [saving,setSaving]=useState(false);
  const [exch,setExch]=useState(7.70);const [iva,setIva]=useState(5);
  const [catalogo,setCatalogo]=useState(CATALOGO.map(v=>({...v})));
  const [editId,setEditId]=useState(null);const [editVals,setEditVals]=useState({});
  const [showNewVeh,setShowNewVeh]=useState(false);const [newVeh,setNewVeh]=useState({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  useEffect(()=>{dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0]){setEmp(d[0]);setEmpId(d[0].id);}});},[]);
  const guardarEmp=async()=>{if(!emp.nombre?.trim()){showToast("Nombre requerido","err");return;}setSaving(true);if(empId)await dbUpd("empresas",empId,{nombre:emp.nombre,nit:emp.nit,direccion:emp.direccion,telefono:emp.telefono,email:emp.email});showToast("Guardado ✔");setSaving(false);};
  const se=(k,v)=>setEmp(p=>({...p,[k]:v}));
  const saveEdit=()=>{setCatalogo(p=>p.map(v=>v.id===editId?{...v,...editVals}:v));setEditId(null);showToast("Tarifa actualizada ✔");};
  const delVeh=id=>{if(!confirm("¿Eliminar?"))return;setCatalogo(p=>p.filter(v=>v.id!==id));};
  const addVeh=()=>{if(!newVeh.nombre.trim()){showToast("Nombre requerido","err");return;}setCatalogo(p=>[...p,{...newVeh,id:`c${Date.now()}`,dia:parseFloat(newVeh.dia)||0,sem:parseFloat(newVeh.sem)||0,mes:parseFloat(newVeh.mes)||0}]);setNewVeh({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});setShowNewVeh(false);showToast("Agregado ✔");};
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:20}}>
        {[{id:"empresa",l:"🏢 Empresa"},{id:"tarifas",l:"💰 Tarifas"},{id:"fiscal",l:"🧾 Fiscal"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      </div>
      {tab==="empresa"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Datos de la Empresa</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="NOMBRE" span2><input style={S.inp} value={emp.nombre||""} onChange={e=>se("nombre",e.target.value)} placeholder="Tz'unun AutoRentas"/></Fld>
            <Fld label="NIT"><input style={S.inp} value={emp.nit||""} onChange={e=>se("nit",e.target.value)} placeholder="16693949"/></Fld>
            <Fld label="TELÉFONO"><input style={S.inp} value={emp.telefono||""} onChange={e=>se("telefono",e.target.value)} placeholder="502-31221538"/></Fld>
            <Fld label="EMAIL" span2><input style={S.inp} value={emp.email||""} onChange={e=>se("email",e.target.value)} placeholder="tzununautorentas@gmail.com"/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={emp.direccion||""} onChange={e=>se("direccion",e.target.value)} placeholder="2da. Avenida 0-68, Col. Bran, Zona 3"/></Fld>
            <div style={{gridColumn:"span 2"}}><button onClick={guardarEmp} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"💾 Guardar"}</button></div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:12}}>Vista previa encabezado</div>
          <div style={{background:T.surf,borderRadius:10,padding:16,border:`1px solid ${T.bord}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
              <div><div style={{fontSize:14,fontWeight:800,color:T.acc}}>{emp.nombre||"Tz'unun AutoRentas"}</div><div style={{fontSize:10,color:T.sub}}>MÁS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</div></div>
            </div>
            <div style={{fontSize:11,color:T.sub,lineHeight:1.8}}>
              <div>📍 {emp.direccion||"2da. Av. 0-68, Col. Bran, Zona 3"}</div>
              <div>📞 {emp.telefono||"502-31221538"}</div>
              <div>✉️ {emp.email||"tzununautorentas@gmail.com"}</div>
              <div>🆔 NIT: {emp.nit||"16693949"}</div>
            </div>
          </div>
          <div style={{...S.card,marginTop:12,background:T.surf,fontSize:12,color:T.sub,lineHeight:2}}>
            <div>🏦 Banco Industrial — 853-000016-8</div>
            <div>🏦 Banrural — 3309159475</div>
          </div>
        </div>
      </div>}
      {tab==="tarifas"&&<div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700}}>Catálogo y Tarifas</div>
          <button onClick={()=>setShowNewVeh(!showNewVeh)} style={{...S.btn(showNewVeh?"warn":"primary"),fontSize:12}}>{showNewVeh?"Cancelar":"+ Agregar vehículo"}</button>
        </div>
        {showNewVeh&&<div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
          <Fld label="NOMBRE"><input style={S.inp} value={newVeh.nombre} onChange={e=>setNewVeh(p=>({...p,nombre:e.target.value}))} placeholder="Nombre..."/></Fld>
          <Fld label="TIPO"><select style={S.sel} value={newVeh.tipo} onChange={e=>setNewVeh(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
          <Fld label="Q/DÍA"><input style={S.inp} type="number" value={newVeh.dia} onChange={e=>setNewVeh(p=>({...p,dia:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/SEM"><input style={S.inp} type="number" value={newVeh.sem} onChange={e=>setNewVeh(p=>({...p,sem:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/MES"><input style={S.inp} type="number" value={newVeh.mes} onChange={e=>setNewVeh(p=>({...p,mes:e.target.value}))} placeholder="0"/></Fld>
          <button onClick={addVeh} style={{...S.btn("primary"),padding:"9px 14px",alignSelf:"flex-end"}}>+</button>
        </div>}
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Vehículo","Tipo","Q/Día","Q/Semana","Q/Mes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{catalogo.map(v=><tr key={v.id}>
            <td style={{...S.td,fontWeight:600}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12}} value={editVals.nombre} onChange={e=>setEditVals(p=>({...p,nombre:e.target.value}))}/>:v.nombre}</td>
            <td style={S.td}>{editId===v.id?<select style={{...S.sel,padding:"5px 8px",fontSize:12}} value={editVals.tipo} onChange={e=>setEditVals(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>:v.tipo}</td>
            {["dia","sem","mes"].map(c=><td key={c} style={{...S.td,fontWeight:700,color:T.acc}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12,width:80}} type="number" value={editVals[c]} onChange={e=>setEditVals(p=>({...p,[c]:parseFloat(e.target.value)||0}))}/>:`Q ${fmt(v[c])}`}</td>)}
            <td style={S.td}><div style={{display:"flex",gap:4}}>{editId===v.id?<><button onClick={saveEdit} style={{...S.btn("primary"),padding:"4px 9px",fontSize:11}}>✔</button><button onClick={()=>setEditId(null)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>✕</button></>:<><button onClick={()=>{setEditId(v.id);setEditVals({...v});}} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>✏️</button><button onClick={()=>delVeh(v.id)} style={{...S.btn("danger"),padding:"4px 9px",fontSize:11}}>🗑️</button></>}</div></td>
          </tr>)}</tbody>
        </table>
        <div style={{marginTop:10,fontSize:11,color:T.mut}}>* 1-7 días = diaria · 8-29 días = semanal · 30+ días = mensual</div>
      </div>}
      {tab==="fiscal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>💱 Tasa de Cambio del Día</div>
          <label style={S.lbl}>GTQ POR 1 USD</label>
          <input style={{...S.inp,fontSize:20,fontWeight:700,color:T.acc}} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"10px 14px",background:T.surf,borderRadius:9,fontSize:14}}><span style={{color:T.sub}}>1 USD =</span><span style={{fontWeight:800,color:T.acc}}>Q {fmt(exch)}</span></div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>🧾 Régimen Fiscal</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{v:12,l:"12% — Régimen General"},{v:5,l:"5% — Pequeño Contribuyente"},{v:0,l:"Sin IVA"}].map(o=><button key={o.v} onClick={()=>setIva(o.v)} style={{...S.btn(iva===o.v?"primary":"ghost"),textAlign:"left"}}>{o.l}</button>)}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ═══ APP PRINCIPAL ═══


// ═══ MANTENIMIENTO DE VEHÍCULOS ═══════════════════════════════════════════════



// ── Buscador de clientes con autocompletado ───────────────────────────────────
function ClienteBuscador({value,onChange,empId}){
  const [clientes,setClientes]=useState([]);
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [newNombre,setNewNombre]=useState("");
  const [newTipo,setNewTipo]=useState("empresa");
  const ref=useRef(null);

  useEffect(()=>{
    dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));
  },[]);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const filtered=value.length>0?clientes.filter(c=>c.nombre.toLowerCase().includes(value.toLowerCase())):clientes.slice(0,8);

  const agregarCliente=async()=>{
    if(!newNombre.trim())return;
    setSaving(true);
    const r=await dbIns("clientes",{nombre:newNombre,tipo:newTipo,empresa_id: empId || DEFAULT_EMPRESA_ID});
    if(r&&!r.error){
      onChange(newNombre);
      setClientes(p=>[...p,{nombre:newNombre,tipo:newTipo}]);
      setShowNew(false);setNewNombre("");setOpen(false);
    }
    setSaving(false);
  };

  return(
    <div ref={ref} style={{position:"relative"}}>
      <input
        style={S.inp} value={value}
        onChange={e=>{onChange(e.target.value);setOpen(true);setShowNew(false);}}
        onFocus={()=>setOpen(true)}
        placeholder="Escribe para buscar cliente..."
      />
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.card,border:"1px solid "+T.bord,borderRadius:8,zIndex:100,maxHeight:220,overflowY:"auto",marginTop:2}}>
          {filtered.map((c,i)=>(
            <div key={i} onClick={()=>{onChange(c.nombre);setOpen(false);}}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid "+T.bord+"33",display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.surf}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{c.nombre}</span>
              <span style={{fontSize:10,color:T.mut}}>{c.tipo}</span>
            </div>
          ))}
          {filtered.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:T.mut}}>No encontrado</div>}
          {/* Agregar nuevo */}
          {!showNew?(
            <div onClick={()=>{setShowNew(true);setNewNombre(value);}}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:12,color:T.acc,fontWeight:600,borderTop:"1px solid "+T.bord,display:"flex",alignItems:"center",gap:6}}>
              <span>+</span> Agregar nuevo cliente
            </div>
          ):(
            <div style={{padding:10,borderTop:"1px solid "+T.bord}}>
              <input style={{...S.inp,marginBottom:6,fontSize:12}} value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Nombre del cliente"/>
              <select style={{...S.sel,marginBottom:6,fontSize:12}} value={newTipo} onChange={e=>setNewTipo(e.target.value)}>
                <option value="empresa">Empresa</option>
                <option value="gobierno">Gobierno/ONG</option>
                <option value="persona">Persona</option>
              </select>
              <div style={{display:"flex",gap:6}}>
                <button onClick={agregarCliente} disabled={saving} style={{...S.btn("primary"),flex:1,fontSize:11,padding:"6px"}}>{saving?"...":"✔ Guardar"}</button>
                <button onClick={()=>setShowNew(false)} style={{...S.btn("ghost"),flex:1,fontSize:11,padding:"6px"}}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function PageCalculadora({showToast,empId}){
  const [tab,setTab]=useState("renta");
  const [cli,setCli]=useState("");
  const [selVeh,setSelVeh]=useState(null);
  const [dias,setDias]=useState(1);
  const [iva,setIva]=useState(5);
  const [pago,setPago]=useState("efectivo");
  const [conTC,setConTC]=useState(false);
  const [exch,setExch]=useState(7.70);
  const [saving,setSaving]=useState(false);
  const [tf,setTf]=useState({cliente:"",dias:1,veh:0,pil:0,hos:0,ali:0,galon:48,kpg:27,kmi:0,kmr:0,varios:0,iva:5,pago:"efectivo",conTC:false,exch:7.70,ruta:""});
  const stf=(k,v)=>setTf(p=>({...p,[k]:v}));
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const rate=selVeh?tarifaFn(selVeh,dias):0;
  const sub=dias*rate;
  const ivaAmt=Math.round(sub*iva/100*100)/100;
  const base=sub+ivaAmt;
  const recTC=conTC?Math.round(base*0.05*100)/100:0;
  const tot=base+recTC;
  const d2=parseFloat(tf.dias)||0;
  const kmi=parseFloat(tf.kmi)||0;
  const kmr=parseFloat(tf.kmr)||0;
  const tkm=kmi+kmr;
  const kpg=parseFloat(tf.kpg)||1;
  const gals=tkm/kpg;
  const fuel=gals*(parseFloat(tf.galon)||0);
  const vT=d2*(parseFloat(tf.veh)||0);
  const pT=d2*(parseFloat(tf.pil)||0);
  const hT=d2*(parseFloat(tf.hos)||0);
  const aT=d2*(parseFloat(tf.ali)||0);
  const misc=parseFloat(tf.varios)||0;
  const tsub=vT+pT+hT+aT+fuel+misc;
  const tiva=tsub*(parseFloat(tf.iva)||0)/100;
  const tbase=tsub+tiva;
  const ttcr=tf.conTC?tbase*0.05:0;
  const ttot=tbase+ttcr;

  const guardar=async(estado)=>{
    const cn=tab==="renta"?cli:tf.cliente;
    if(!cn.trim()){showToast("Ingresa el nombre del cliente","err");return;}
    setSaving(true);
    const p={empresa_id: empId || DEFAULT_EMPRESA_ID,tipo:tab,cliente_nombre:cn,numero:"COT-"+Date.now().toString().slice(-6),dias:tab==="renta"?dias:d2,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||5,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttcr,total_gtq:tab==="renta"?tot:ttot,total_usd:(tab==="renta"?tot:ttot)/(tab==="renta"?exch:parseFloat(tf.exch)||7.70),vehiculo_nombre:selVeh?.nombre||"",estado,km_ida:kmi,km_regreso:kmr,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,gastos_varios:misc};
    const r=await dbIns("cotizaciones",p);
    if(r&&!r.error){showToast(estado==="enviada"?"Cotización guardada ✔":"Borrador guardado ✔");}
    else{showToast("Error al guardar","err");}
    setSaving(false);
  };

  const Row=({l,v,bold,color})=><div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:bold?14:13,fontWeight:bold?700:400,color:color||(bold?T.txt:T.sub)}}><span>{l}</span><span>{v}</span></div>;

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"renta",l:"🔑 Renta por días"},{id:"traslado",l:"🗺 Traslado/Viaje"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"primary":"ghost")}}>{t.l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {/* FORM */}
        <div style={S.card}>
          {tab==="renta"?(
            <div style={{display:"grid",gap:11}}>
              <Fld label="CLIENTE">
                <ClienteBuscador value={cli} onChange={setCli} empId={empId}/>
              </Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(Math.max(1,parseInt(e.target.value)||1))}/></Fld>
              <Fld label="VEHÍCULO">
                <select style={S.sel} value={selVeh?.id||""} onChange={e=>setSelVeh(CATALOGO.find(v=>v.id===e.target.value)||null)}>
                  <option value="">Seleccionar...</option>
                  {CATALOGO.map(v=><option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                </select>
              </Fld>
              <Fld label="IVA">
                <select style={S.sel} value={iva} onChange={e=>setIva(parseInt(e.target.value))}>
                  <option value={12}>12% Régimen General</option>
                  <option value={5}>5% Pequeño Contribuyente</option>
                  <option value={0}>Sin IVA</option>
                </select>
              </Fld>
              <Fld label="TASA DE CAMBIO (Q por $1)"><input style={S.inp} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/></Fld>
              <Fld label="MÉTODO DE PAGO">
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1}}>💵 Efectivo</button>
                  <button onClick={()=>setPago("transferencia")} style={{...S.btn(pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                </div>
              </Fld>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <input type="checkbox" id="conTC" checked={conTC} onChange={e=>setConTC(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
                <label htmlFor="conTC" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>💳 Incluir opción de pago con tarjeta (+5%)</label>
              </div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="CLIENTE" span2>
                <ClienteBuscador value={tf.cliente} onChange={v=>stf("cliente",v)} empId={empId}/>
              </Fld>
              <Fld label="DESTINO (tabla de rutas)" span2>
                <select style={S.sel} value={tf.ruta} onChange={e=>{
                  const r=RUTAS_GT.find(x=>x.d===e.target.value);
                  if(r){stf("ruta",r.d);stf("kmi",r.km);stf("kmr",r.km);stf("dias",r.dias);}
                  else stf("ruta",e.target.value);
                }}>
                  <option value="">Seleccionar destino...</option>
                  {RUTAS_GT.map(r=><option key={r.d} value={r.d}>{r.d} — {r.km} km · {r.dias}d</option>)}
                </select>
              </Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              <Fld label="COSTO VEHÍCULO/DÍA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO PILOTO/DÍA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/DÍA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="ALIMENTACIÓN/DÍA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="PRECIO GALÓN (Q)"><input style={S.inp} type="number" value={tf.galon} onChange={e=>stf("galon",e.target.value)} placeholder="48"/></Fld>
              <Fld label="KM POR GALÓN"><input style={S.inp} type="number" value={tf.kpg} onChange={e=>stf("kpg",e.target.value)} placeholder="27"/></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e=>stf("kmi",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e=>stf("kmr",e.target.value)} placeholder="0"/></Fld>
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e=>stf("varios",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="IVA">
                <select style={S.sel} value={tf.iva} onChange={e=>stf("iva",e.target.value)}>
                  <option value="12">12%</option><option value="5">5%</option><option value="0">Sin IVA</option>
                </select>
              </Fld>
              <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e=>stf("exch",e.target.value)}/></Fld>
              <Fld label="PAGO" span2>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1}}>💵 Efectivo</button>
                  <button onClick={()=>stf("pago","transferencia")} style={{...S.btn(tf.pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                </div>
              </Fld>
              <div style={{gridColumn:"span 2",display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e=>stf("conTC",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
                <label htmlFor="conTC2" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>💳 Incluir opción con tarjeta (+5%)</label>
              </div>
            </div>
          )}
        </div>
        {/* RESUMEN */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen del presupuesto</div>
            {tab==="renta"?(
              <>
                {selVeh&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {selVeh.nombre} · {dias} día{dias!==1?"s":""}</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  <Row l="Tarifa" v={"Q "+fmt(rate)+"/día"}/>
                  <Row l="Subtotal" v={"Q "+fmt(sub)}/>
                  <Row l={"IVA "+iva+"%"} v={"Q "+fmt(ivaAmt)}/>
                  {conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(recTC)} color={T.sec}/>}
                </div>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                    <span>{conTC?"Con tarjeta":"TOTAL"}</span><span>Q {fmt(tot)}</span>
                  </div>
                  {conTC&&<div style={{fontSize:12,color:T.sub}}>Efectivo: Q {fmt(base)}</div>}
                  <div style={{fontSize:12,color:T.sub,marginTop:3}}>$ {fmt(exch>0?tot/exch:0)} USD</div>
                </div>
              </>
            ):(
              <>
                {tf.ruta&&<div style={{fontSize:12,color:T.acc,marginBottom:8}}>📍 {tf.ruta} · {Math.round(tkm)} km totales</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  <Row l={"Vehículo (×"+d2+"d)"} v={"Q "+fmt(vT)}/>
                  <Row l={"Piloto (×"+d2+"d)"} v={"Q "+fmt(pT)}/>
                  <Row l={"Hospedaje (×"+d2+"d)"} v={"Q "+fmt(hT)}/>
                  <Row l={"Aliment. (×"+d2+"d)"} v={"Q "+fmt(aT)}/>
                  <Row l={"Combustible ("+fmt(gals)+" gal)"} v={"Q "+fmt(fuel)}/>
                  <Row l="Varios" v={"Q "+fmt(misc)}/>
                  <div style={{borderTop:"1px solid "+T.bord,margin:"8px 0"}}/>
                  <Row l="Subtotal" v={"Q "+fmt(tsub)}/>
                  <Row l={"IVA "+tf.iva+"%"} v={"Q "+fmt(tiva)}/>
                  {tf.conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(ttcr)} color={T.sec}/>}
                </div>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                    <span>TOTAL</span><span>Q {fmt(ttot)}</span>
                  </div>
                  {tf.conTC&&<div style={{fontSize:12,color:T.sub}}>Sin tarjeta: Q {fmt(tbase)}</div>}
                </div>
              </>
            )}
          </div>
          <div style={S.card}>
            <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>{saving?"Guardando...":"💾 Guardar como borrador"}</button>
            <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"✅ Guardar y enviar cotización"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageClientes({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("clientes","&order=codigo.asc,nombre.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const abrirEditar=c=>{setF({codigo:c.codigo||'',nombre:c.nombre||"",tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""});setEditItem(c);setVista("form");};
  const abrirNuevo=()=>{setF({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});setEditItem(null);setVista("form");};
  const guardar=async()=>{
    if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}
    setSaving(true);
    const p={...f,empresa_id: empId || DEFAULT_EMPRESA_ID};
    if(editItem?.id) await dbUpd("clientes",editItem.id,p);
    else await dbIns("clientes",p);
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
  };
  const del=async id=>{if(!confirm("¿Eliminar cliente?"))return;await dbDel("clientes",id);showToast("Eliminado");load();};
  const TC={empresa:{c:T.sec,bg:T.secDim,l:"Empresa"},gobierno:{c:T.blue,bg:T.blueDim,l:"Gobierno/ONG"},persona:{c:T.acc,bg:T.accDim,l:"Persona"}};
  if(vista==="form")return(
    <div style={{maxWidth:600}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Nuevo"} cliente</div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="CÓDIGO DE CLIENTE"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001"/></Fld>
        <Fld label="NOMBRE / RAZÓN SOCIAL"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre completo"/></Fld>
        <Fld label="TIPO DE CLIENTE">
          <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
            <option value="empresa">Empresa</option>
            <option value="gobierno">Gobierno / ONG</option>
            <option value="persona">Persona natural</option>
          </select>
        </Fld>
        <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
        <Fld label="TELÉFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
        <Fld label="CORREO ELECTRÓNICO"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="correo@empresa.com"/></Fld>
        <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección completa"/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar cliente"}</button>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>Directorio de Clientes ({rows.length})</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo cliente</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="👥" msg="Sin clientes registrados" action="+ Agregar cliente" onAction={abrirNuevo}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Código","Cliente","Tipo","NIT","Teléfono",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(c=>{
                const tc=TC[c.tipo]||TC.empresa;
                return(
                  <tr key={c.id}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo||"—"}</td>
                    <td style={{...S.td,fontWeight:600}}>{c.nombre}</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:tc.c,background:tc.bg}}>{tc.l}</span></td>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                    <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                    <td style={S.td}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>abrirEditar(c)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>✏️</button>
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PageFlota({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",propietario:"propio",placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const load=async()=>{setLoading(true);const d=await dbGet("vehiculos","&order=codigo.asc,marca.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const abrirEditar=v=>{setF({codigo:v.codigo||'',propietario:v.propietario||'propio',placa:v.placa||"",marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||new Date().getFullYear(),tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0});setEditItem(v);setVista("form");};
  const abrirNuevo=()=>{setF({placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});setEditItem(null);setVista("form");};
  const guardar=async()=>{
    if(!f.placa.trim()){showToast("Placa requerida","err");return;}
    setSaving(true);
    const p={...f,empresa_id: empId || DEFAULT_EMPRESA_ID,anio:parseInt(f.anio)||new Date().getFullYear(),km_actual:parseInt(f.km_actual)||0};
    if(editItem?.id) await dbUpd("vehiculos",editItem.id,p);
    else await dbIns("vehiculos",p);
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
  };
  const del=async id=>{if(!confirm("¿Eliminar vehículo?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast("Estado actualizado");load();};
  const disp=rows.filter(r=>r.estado==="disponible").length;
  const rent=rows.filter(r=>r.estado==="rentado").length;
  const mant=rows.filter(r=>r.estado==="mantenimiento").length;
  if(vista==="form")return(
    <div style={{maxWidth:580}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Registrar"} vehículo</div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="CÓDIGO VEHÍCULO"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001P"/></Fld>
        <Fld label="PROPIETARIO">
          <select style={S.sel} value={f.propietario} onChange={e=>sf("propietario",e.target.value)}>
            <option value="propio">🏢 Propio (P)</option>
            <option value="socio">🤝 Socio (A)</option>
            <option value="alquilado">🔑 Alquilado</option>
          </select>
        </Fld>
        <Fld label="PLACA"><input style={S.inp} value={f.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
        <Fld label="AÑO"><input style={S.inp} type="number" value={f.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
        <Fld label="MARCA"><input style={S.inp} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota"/></Fld>
        <Fld label="MODELO"><input style={S.inp} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="RAV4"/></Fld>
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="ESTADO">
          <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
            <option value="disponible">✅ Disponible</option>
            <option value="rentado">🔵 Rentado</option>
            <option value="mantenimiento">🟡 Mantenimiento</option>
          </select>
        </Fld>
        <Fld label="KILOMETRAJE ACTUAL" span2><input style={S.inp} type="number" value={f.km_actual} onChange={e=>sf("km_actual",e.target.value)} placeholder="0"/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar"}</button>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Disponibles",v:disp,c:T.acc,bg:T.accDim},{l:"Rentados",v:rent,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",v:mant,c:T.sec,bg:T.secDim}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:T.sub}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} vehículos)</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar vehículo</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🚗" msg="Sin vehículos registrados" action="+ Registrar" onAction={abrirNuevo}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Código","Vehículo","Placa","Tipo","Km","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(v=>{
                const e=EST_VEH[v.estado]||EST_VEH.disponible;
                return(
                  <tr key={v.id}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>
                      {v.codigo||"—"}
                      {v.propietario&&<div style={{fontSize:9,color:T.mut}}>{v.propietario==="propio"?"🏢 Propio":v.propietario==="socio"?"🤝 Socio":"🔑 Alq."}</div>}
                    </td>
                    <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:T.sub,fontSize:11}}>{v.placa}</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span></td>
                    <td style={S.td}>
                      <select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={ev=>chEst(v.id,ev.target.value)}>
                        <option value="disponible">✅ Disponible</option>
                        <option value="rentado">🔵 Rentado</option>
                        <option value="mantenimiento">🟡 Mantenimiento</option>
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>abrirEditar(v)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>✏️</button>
                        <button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ── Vista Calendario de Reservas ─────────────────────────────────────────────
function CalendarioReservas({rows,onNewReserva,onEdit}){
  const [mes,setMes]=useState(new Date());
  const DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const EST_C={pendiente:"#64748B",confirmada:"#00D4AA",en_curso:"#3B82F6",completada:"#22C55E",cancelada:"#EF4444"};

  const year=mes.getFullYear();
  const month=mes.getMonth();
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  // Start from Monday
  let startDow=firstDay.getDay(); // 0=Sun
  startDow=startDow===0?6:startDow-1; // convert to Mon=0
  const totalCells=Math.ceil((startDow+lastDay.getDate())/7)*7;

  const getReservasForDay=(day)=>{
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return rows.filter(r=>{
      if(!r.fecha_inicio) return false;
      const fi=r.fecha_inicio.slice(0,10);
      const ff=r.fecha_fin?r.fecha_fin.slice(0,10):fi;
      return fi<=dateStr && dateStr<=ff;
    });
  };

  const cells=[];
  for(let i=0;i<totalCells;i++){
    const dayNum=i-startDow+1;
    const isValid=dayNum>=1&&dayNum<=lastDay.getDate();
    const isToday=isValid&&new Date().toDateString()===new Date(year,month,dayNum).toDateString();
    const dayReservas=isValid?getReservasForDay(dayNum):[];
    cells.push({dayNum,isValid,isToday,dayReservas});
  }

  return(
    <div style={S.card}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setMes(new Date(year,month-1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>‹</button>
        <div style={{fontSize:16,fontWeight:700}}>{MESES[month]} {year}</div>
        <button onClick={()=>setMes(new Date(year,month+1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>›</button>
      </div>
      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#64748B",padding:"4px 0"}}>{d}</div>)}
      </div>
      {/* Calendar cells */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((cell,idx)=>(
          <div key={idx} style={{minHeight:80,background:cell.isToday?T.accDim:cell.isValid?T.surf:"transparent",borderRadius:6,padding:4,border:cell.isToday?"1px solid "+T.acc:"1px solid transparent"}}>
            {cell.isValid&&(
              <>
                <div style={{fontSize:12,fontWeight:cell.isToday?700:400,color:cell.isToday?T.acc:T.sub,marginBottom:3}}>{cell.dayNum}</div>
                {cell.dayReservas.slice(0,3).map(r=>(
                  <div key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{fontSize:9,fontWeight:600,background:(EST_C[r.estado]||"#64748B")+"33",color:EST_C[r.estado]||"#64748B",borderLeft:"2px solid "+(EST_C[r.estado]||"#64748B"),padding:"1px 4px",borderRadius:2,marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={r.cliente_nombre+" — "+r.vehiculo_nombre}>
                    {r.cliente_nombre?.split(" ")[0]} {r.vehiculo_nombre?.split(" ")[0]||""}
                  </div>
                ))}
                {cell.dayReservas.length>3&&<div style={{fontSize:9,color:T.mut}}>+{cell.dayReservas.length-3} más</div>}
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
        {[["Pendiente","#64748B"],["Confirmada","#00D4AA"],["En curso","#3B82F6"],["Completada","#22C55E"],["Cancelada","#EF4444"]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
            <div style={{width:10,height:10,borderRadius:2,background:c+"44",border:"1px solid "+c}}/>
            <span style={{color:T.sub}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function PageReservas({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [filtro,setFiltro]=useState("todas");
  const [viewMode,setViewMode]=useState("lista"); // lista | calendario
  const load=async()=>{setLoading(true);const d=await dbGet("reservas","");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const chEst=async(id,estado)=>{
    await dbUpd("reservas",id,{estado});
    if(estado==="en_curso"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"rentado"});
    }
    if(estado==="completada"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"mantenimiento"});
    }
    if(estado==="cancelada"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"disponible"});
    }
    showToast("Estado actualizado");load();
  };
  const del=async id=>{if(!confirm("¿Eliminar reserva?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada ✔":"Guardada ✔");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Pendientes",v:rows.filter(r=>r.estado==="pendiente").length,c:T.mut},{l:"Confirmadas",v:rows.filter(r=>r.estado==="confirmada").length,c:T.acc},{l:"En curso",v:rows.filter(r=>r.estado==="en_curso").length,c:T.blue},{l:"Completadas",v:rows.filter(r=>r.estado==="completada").length,c:T.acc}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>
            {f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <button onClick={()=>setViewMode(viewMode==="lista"?"calendario":"lista")} style={{...S.btn("ghost"),fontSize:11}}>{viewMode==="lista"?"📅 Ver calendario":"📋 Ver lista"}</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva reserva</button>
      </div>
      {viewMode==="calendario"?(
        <CalendarioReservas rows={rows} onEdit={r=>{setEditItem(r);setVista("form");}}/>
      ):(loading?<Spinner/>:filtered.length===0?<Empty icon="📭" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>setVista("form")}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(r=>{
            const e=EST_RES[r.estado]||EST_RES.pendiente;
            const sig=FLUJO_RES[r.estado]||[];
            return(
              <div key={r.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>
                    <div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"🔑":"🗺"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" → "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                    {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>✏️ Editar</button>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PageMantenimiento({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [vehiculos,setVehiculos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);

  const [exportar,setExportar]=useState(false);  const EMPTY={vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""};
  const [f,setF]=useState({...EMPTY});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["preventivo","correctivo","aceite","llantas","frenos","electricidad","carrocería","lavado","otro"];
  const load=async()=>{
    setLoading(true);
    const [m,v]=await Promise.all([dbGet("mantenimientos",""),dbGet("vehiculos","")]);
    setRows(Array.isArray(m)?m:[]);
    setVehiculos(Array.isArray(v)?v:[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const abrirNuevo=()=>{setEditItem(null);setF({...EMPTY});setShowForm(true);};
  const abrirEditar=item=>{setEditItem(item);setF({...item,fecha_entrada:item.fecha_entrada?.slice(0,10)||today(),fecha_salida:item.fecha_salida?.slice(0,10)||""});setShowForm(true);};
  const guardar=async()=>{
    if(!f.vehiculo_nombre||!f.descripcion){showToast("Vehículo y descripción requeridos","err");return;}
    setSaving(true);
    const payload={...f,empresa_id: empId || DEFAULT_EMPRESA_ID,km_entrada:parseInt(f.km_entrada)||0,km_salida:parseInt(f.km_salida)||0,costo:parseFloat(f.costo)||0};
    if(editItem?.id){
      await dbUpd("mantenimientos",editItem.id,payload);
      if(parseInt(f.km_salida)>0&&f.vehiculo_id) await dbUpd("vehiculos",f.vehiculo_id,{km_actual:parseInt(f.km_salida)});
    } else {
      await dbIns("mantenimientos",payload);
      if(f.vehiculo_id) await dbUpd("vehiculos",f.vehiculo_id,{estado:"mantenimiento"});
    }
    showToast("Guardado ✔");setSaving(false);setShowForm(false);setEditItem(null);load();
  };
  const terminar=async item=>{
    await dbUpd("mantenimientos",item.id,{estado:"completado",fecha_salida:today()});
    if(item.vehiculo_id) await dbUpd("vehiculos",item.vehiculo_id,{estado:"disponible"});
    showToast("Completado ✔ — vehículo disponible");load();
  };
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("mantenimientos",id);showToast("Eliminado");load();};
  const necesitaMant=veh=>{
    const ultimoKm=rows.filter(r=>r.vehiculo_id===veh.id&&r.estado==="completado").reduce((max,r)=>Math.max(max,r.km_salida||0),0);
    return(veh.km_actual||0)-ultimoKm>=5000;
  };
  const alertas=vehiculos.filter(necesitaMant);
  const totalCosto=rows.reduce((s,r)=>s+(parseFloat(r.costo)||0),0);
  return(
    <div>
      {exportar&&<ModalExportar titulo="Mantenimiento de Vehículos" datos={rows} campos={[{label:"Vehículo",key:"vehiculo_nombre"},{label:"Tipo",key:"tipo"},{label:"Descripción",key:"descripcion"},{label:"KM Entrada",key:"km_entrada"},{label:"KM Salida",key:"km_salida"},{label:"Costo",key:"costo"},{label:"Proveedor",key:"proveedor"},{label:"Fecha Entrada",key:"fecha_entrada"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      {alertas.length>0&&(
        <div style={{background:T.redDim,border:"1px solid "+T.red+"44",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:6}}>🔴 Requieren mantenimiento (≥5,000 km desde último servicio)</div>
          {alertas.map(v=><div key={v.id} style={{fontSize:12,color:T.txt}}>• {v.marca} {v.modelo} ({v.placa}) — {(v.km_actual||0).toLocaleString()} km</div>)}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Total registros",v:rows.length,c:T.acc},{l:"En proceso",v:rows.filter(r=>r.estado==="en_proceso").length,c:T.sec},{l:"Completados",v:rows.filter(r=>r.estado==="completado").length,c:T.acc},{l:"Costo total",v:"Q "+fmt(totalCosto),c:T.red}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:i===3?13:22,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:14}}>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>📤 Exportar</button>
        <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar mantenimiento</button>
      </div>
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar":"Nuevo"} registro de mantenimiento</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="VEHÍCULO" span2>
              <select style={S.sel} value={f.vehiculo_id} onChange={e=>{const v=vehiculos.find(x=>x.id===e.target.value);sf("vehiculo_id",e.target.value);sf("vehiculo_nombre",v?v.marca+" "+v.modelo+" ("+v.placa+")":"");if(v)sf("km_entrada",v.km_actual||0);}}>
                <option value="">Seleccionar vehículo...</option>
                {vehiculos.map(v=><option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa} · {(v.km_actual||0).toLocaleString()} km</option>)}
              </select>
            </Fld>
            <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></Fld>
            <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="en_proceso">🔧 En proceso</option><option value="completado">✅ Completado</option></select></Fld>
            <Fld label="DESCRIPCIÓN DEL TRABAJO" span2><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y filtro de aire..."/></Fld>
            <Fld label="KM AL ENTRAR"><input style={S.inp} type="number" value={f.km_entrada} onChange={e=>sf("km_entrada",e.target.value)}/></Fld>
            <Fld label="KM AL SALIR"><input style={S.inp} type="number" value={f.km_salida} onChange={e=>sf("km_salida",e.target.value)} placeholder="Al terminar"/></Fld>
            <Fld label="COSTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.costo} onChange={e=>sf("costo",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="TALLER / PROVEEDOR"><input style={S.inp} value={f.proveedor} onChange={e=>sf("proveedor",e.target.value)} placeholder="Nombre del taller"/></Fld>
            <Fld label="FECHA ENTRADA"><input style={S.inp} type="date" value={f.fecha_entrada} onChange={e=>sf("fecha_entrada",e.target.value)}/></Fld>
            <Fld label="FECHA SALIDA"><input style={S.inp} type="date" value={f.fecha_salida} onChange={e=>sf("fecha_salida",e.target.value)}/></Fld>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar"}</button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {loading?<Spinner/>:rows.length===0?<Empty icon="🔧" msg="Sin registros de mantenimiento" action="+ Registrar" onAction={abrirNuevo}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map(r=>{
            const veh=vehiculos.find(v=>v.id===r.vehiculo_id);
            const kmAct=veh?.km_actual||0;
            const kmDesde=r.estado==="completado"?kmAct-(r.km_salida||0):0;
            const alerta=kmDesde>=5000;
            return(
              <div key={r.id} style={{...S.card,borderLeft:"3px solid "+(r.estado==="completado"?T.acc:T.sec)}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.vehiculo_nombre}</div>
                    <div style={{fontSize:12,color:T.sub,marginTop:2}}>🔧 {r.tipo} · {r.proveedor||"Sin taller"} · {fmtD(r.fecha_entrada)}</div>
                    <div style={{fontSize:12,color:T.txt,marginTop:4}}>{r.descripcion}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:r.estado==="completado"?T.acc:T.sec,background:r.estado==="completado"?T.accDim:T.secDim}}>{r.estado==="completado"?"✅ Completado":"🔧 En proceso"}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.red,marginTop:4}}>Q {fmt(r.costo)}</div>
                    <div style={{fontSize:11,color:T.sub}}>KM entrada: {(r.km_entrada||0).toLocaleString()}{r.km_salida>0?" · Salida: "+(r.km_salida).toLocaleString():""}</div>
                    {alerta&&<div style={{fontSize:10,fontWeight:700,color:T.red,marginTop:2}}>🔴 +{kmDesde.toLocaleString()} km — necesita mantenimiento</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {r.estado==="en_proceso"&&<button onClick={()=>terminar(r)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>✅ Marcar completado</button>}
                  <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>✏️ Editar</button>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO: CONTABILIDAD — Catálogo de Cuentas + asientos_contables Manuales
// ═══════════════════════════════════════════════════════════════════════════════

// ── Catálogo de Cuentas ─────────────────────────────────────────────────────
const CUENTAS_DEFAULT=[
  {codigo:"1",   nombre:"ACTIVOS",                   tipo:"activo",  nivel:1},
  {codigo:"1.1", nombre:"Activo Corriente",           tipo:"activo",  nivel:2},
  {codigo:"1101",nombre:"Caja",                       tipo:"activo",  nivel:3},
  {codigo:"1102",nombre:"Banco Industrial GTQ",       tipo:"activo",  nivel:3},
  {codigo:"1103",nombre:"Banrural GTQ",               tipo:"activo",  nivel:3},
  {codigo:"1104",nombre:"Cuentas por Cobrar Clientes",tipo:"activo",  nivel:3},
  {codigo:"1105",nombre:"Anticipos Recibidos",        tipo:"activo",  nivel:3},
  {codigo:"1106",nombre:"IVA Crédito Fiscal",         tipo:"activo",  nivel:3},
  {codigo:"1.2", nombre:"Activo No Corriente",        tipo:"activo",  nivel:2},
  {codigo:"1201",nombre:"Vehículos",                  tipo:"activo",  nivel:3},
  {codigo:"1202",nombre:"Depreciación Acumulada Veh.",tipo:"activo",  nivel:3},
  {codigo:"2",   nombre:"PASIVOS",                    tipo:"pasivo",  nivel:1},
  {codigo:"2.1", nombre:"Pasivo Corriente",           tipo:"pasivo",  nivel:2},
  {codigo:"2101",nombre:"Cuentas por Pagar Proveed.", tipo:"pasivo",  nivel:3},
  {codigo:"2102",nombre:"IVA por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2103",nombre:"ISR por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2104",nombre:"IGSS por Pagar",             tipo:"pasivo",  nivel:3},
  {codigo:"3",   nombre:"PATRIMONIO",                 tipo:"capital", nivel:1},
  {codigo:"3101",nombre:"Capital Social",             tipo:"capital", nivel:3},
  {codigo:"3102",nombre:"Utilidades Retenidas",       tipo:"capital", nivel:3},
  {codigo:"4",   nombre:"INGRESOS",                   tipo:"ingreso", nivel:1},
  {codigo:"4101",nombre:"Ingresos por Renta Vehículos",tipo:"ingreso",nivel:3},
  {codigo:"4102",nombre:"Ingresos por Traslados",     tipo:"ingreso", nivel:3},
  {codigo:"4103",nombre:"Otros Ingresos",             tipo:"ingreso", nivel:3},
  {codigo:"5",   nombre:"GASTOS",                     tipo:"gasto",   nivel:1},
  {codigo:"5.1", nombre:"Gastos de Operación",        tipo:"gasto",   nivel:2},
  {codigo:"5101",nombre:"Combustible",                tipo:"gasto",   nivel:3},
  {codigo:"5102",nombre:"Mantenimiento y Reparación", tipo:"gasto",   nivel:3},
  {codigo:"5103",nombre:"Seguros de Vehículos",       tipo:"gasto",   nivel:3},
  {codigo:"5104",nombre:"Salarios y Prestaciones",    tipo:"gasto",   nivel:3},
  {codigo:"5105",nombre:"Depreciación Vehículos",     tipo:"gasto",   nivel:3},
  {codigo:"5106",nombre:"Llantas y Repuestos",        tipo:"gasto",   nivel:3},
  {codigo:"5107",nombre:"Hospedaje Pilotos",          tipo:"gasto",   nivel:3},
  {codigo:"5108",nombre:"Alimentación",               tipo:"gasto",   nivel:3},
  {codigo:"5109",nombre:"Peajes",                     tipo:"gasto",   nivel:3},
  {codigo:"5110",nombre:"Impuestos y Licencias",      tipo:"gasto",   nivel:3},
  {codigo:"5111",nombre:"Servicios Públicos",         tipo:"gasto",   nivel:3},
  {codigo:"5112",nombre:"Gastos de Oficina",          tipo:"gasto",   nivel:3},
];

const TIPO_COLOR={activo:T.blue,pasivo:T.red,capital:T.purple,ingreso:T.acc,gasto:T.sec};

function TabCatalogo({empId,showToast}){
  const [cuentas,setCuentas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"activo",subtipo:"",nivel:3,activa:true});
  const [buscar,setBuscar]=useState("");
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{
    setLoading(true);
    const d=await dbGet("catalogo_cuentas","&order=codigo.asc");
    if(Array.isArray(d)&&d.length>0){
      setCuentas(d);
    } else {
      // Load defaults if empty
      setCuentas(CUENTAS_DEFAULT.map((c,i)=>({...c,id:"def_"+i,activa:true})));
    }
    setLoading(false);
  };

  useEffect(()=>{load();},[]);

  const inicializarCatalogo=async()=>{
    if(!confirm("¿Cargar el catálogo de cuentas base? Esto creará las cuentas predeterminadas."))return;
    setSaving(true);
    for(const c of CUENTAS_DEFAULT){
      await dbIns("catalogo_cuentas",{...c,empresa_id: empId || DEFAULT_EMPRESA_ID});
    }
    showToast("Catálogo inicializado ✔");
    setSaving(false);
    load();
  };

  const guardar=async()=>{
    if(!f.codigo.trim()||!f.nombre.trim()){showToast("Código y nombre requeridos","err");return;}
    setSaving(true);
    await dbIns("catalogo_cuentas",{...f,empresa_id: empId || DEFAULT_EMPRESA_ID});
    showToast("Cuenta agregada ✔");setSaving(false);setShowForm(false);
    setF({codigo:"",nombre:"",tipo:"activo",subtipo:"",nivel:3,activa:true});
    load();
  };

  const toggleActiva=async(id,val)=>{
    await dbUpd("catalogo_cuentas",id,{activa:val});
    setCuentas(p=>p.map(c=>c.id===id?{...c,activa:val}:c));
  };

  const del=async id=>{
    if(!confirm("¿Eliminar esta cuenta?"))return;
    await dbDel("catalogo_cuentas",id);
    showToast("Eliminada");load();
  };

  const filtradas=buscar.trim()
    ?cuentas.filter(c=>c.codigo.includes(buscar)||c.nombre.toLowerCase().includes(buscar.toLowerCase()))
    :cuentas;

  const tiposGrupo=["activo","pasivo","capital","ingreso","gasto"];

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.inp,maxWidth:280}} value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar cuenta..."/>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        {cuentas.filter(c=>!c.id?.startsWith("def_")).length===0&&(
          <button onClick={inicializarCatalogo} disabled={saving} style={{...S.btn("blue"),fontSize:12}}>{saving?"Cargando...":"📋 Inicializar catálogo base"}</button>
        )}
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nueva cuenta"}</button>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Nueva cuenta contable</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,alignItems:"flex-end"}}>
            <Fld label="CÓDIGO"><input style={S.inp} value={f.codigo} onChange={e=>sf("codigo",e.target.value)} placeholder="5101"/></Fld>
            <Fld label="NOMBRE DE LA CUENTA"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Combustible"/></Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
                {tiposGrupo.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="NIVEL">
              <select style={S.sel} value={f.nivel} onChange={e=>sf("nivel",parseInt(e.target.value))}>
                <option value={1}>1 — Grupo principal</option>
                <option value={2}>2 — Subgrupo</option>
                <option value={3}>3 — Cuenta detalle</option>
              </select>
            </Fld>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar cuenta"}</button>
            <button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Código","Cuenta","Tipo","Nivel","Activa",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtradas.map((c,i)=>{
                const color=TIPO_COLOR[c.tipo]||T.mut;
                const indent=((c.nivel||1)-1)*16;
                return(
                  <tr key={c.id||i} style={{opacity:c.activa===false?0.45:1}}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo}</td>
                    <td style={{...S.td,paddingLeft:8+indent}}>
                      <span style={{fontWeight:c.nivel<=2?700:400,fontSize:c.nivel===1?14:13}}>{c.nombre}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color,background:color+"22"}}>{c.tipo}</span>
                    </td>
                    <td style={{...S.td,color:T.sub,textAlign:"center"}}>{c.nivel}</td>
                    <td style={{...S.td,textAlign:"center"}}>
                      <button onClick={()=>toggleActiva(c.id,!c.activa)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18}}>
                        {c.activa!==false?"✅":"⬜"}
                      </button>
                    </td>
                    <td style={S.td}>
                      {!c.id?.startsWith("def_")&&(
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>🗑️</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── asientos_contables Manuales ─────────────────────────────────────────────────────────
function Tabasientos_contables({empId,showToast}){
  const [asientos_contables,setasientos_contables]=useState([]);
  const [cuentas,setCuentas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [verDetalle,setVerDetalle]=useState(null);
  const [fd,setFd]=useState({fecha:today(),descripcion:"",referencia:"",estado:"borrador"});
  const [lineas,setLineas]=useState([
    {cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},
    {cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},
  ]);
  const sfd=(k,v)=>setFd(p=>({...p,[k]:v}));

  const load=async()=>{
    setLoading(true);
    const [d,c]=await Promise.all([
      dbGet("asientos_contables",""),
      dbGet("catalogo_cuentas","&order=codigo.asc&activa=eq.true")
    ]);
    setasientos_contables(Array.isArray(d)?d:[]);
    setCuentas(Array.isArray(c)?c:[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const totalDebe=lineas.reduce((s,l)=>s+(parseFloat(l.debe)||0),0);
  const totalHaber=lineas.reduce((s,l)=>s+(parseFloat(l.haber)||0),0);
  const cuadrado=Math.abs(totalDebe-totalHaber)<0.01;

  const addLinea=()=>setLineas(p=>[...p,{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0}]);
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const selCuenta=(idx,cuentaId)=>{
    const c=cuentas.find(x=>x.id===cuentaId);
    if(c)updateLinea(idx,"cuenta_id",c.id);
    if(c)updateLinea(idx,"cuenta_nombre",c.nombre);
    if(c)updateLinea(idx,"cuenta_codigo",c.codigo);
  };

  const guardar=async()=>{
    if(!fd.descripcion.trim()){showToast("Descripción requerida","err");return;}
    if(!cuadrado){showToast("El diario no cuadra — Debe ≠ Haber","err");return;}
    if(lineas.filter(l=>l.cuenta_id&&(l.debe>0||l.haber>0)).length<2){showToast("Mínimo 2 líneas con cuenta y monto","err");return;}
    setSaving(true);
    const numero="DJ-"+Date.now().toString().slice(-6);
    const diario=await dbIns("asientos_contables",{...fd,empresa_id: empId || DEFAULT_EMPRESA_ID,numero,total_debe:totalDebe,total_haber:totalHaber});
    if(diario&&diario[0]?.id){
      for(const l of lineas.filter(x=>x.cuenta_id)){
        await dbIns("asiento_lineas",{...l,diario_id:diario[0].id,debe:parseFloat(l.debe)||0,haber:parseFloat(l.haber)||0});
      }
    }
    showToast("Diario guardado ✔");setSaving(false);setShowForm(false);
    setFd({fecha:today(),descripcion:"",referencia:"",estado:"borrador"});
    setLineas([{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0}]);
    load();
  };

  const del=async id=>{if(!confirm("¿Eliminar este diario?"))return;await dbDel("asientos_contables",id);showToast("Eliminado");load();};

  const publicar=async d=>{
    await dbUpd("asientos_contables",d.id,{estado:"publicado"});
    showToast("Diario publicado ✔");load();
  };

  const imprimirDiario=async(d)=>{
    // Fetch lines
    const lineas=await dbGet("asiento_lineas","&diario_id=eq."+d.id+"&order=created_at.asc");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Diario ${d.numero}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1E293B}h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1B2D5C;color:#fff;padding:7px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #E2E8F0}.right{text-align:right}.total{font-weight:700;background:#F1F5F9}.green{color:#16A34A}.blue{color:#1D4ED8}@media print{button{display:none}}</style>
    </head><body>
    <h2>Tz'unun AutoRentas — Diario Manual</h2>
    <p><b>N°:</b> ${d.numero} &nbsp;|&nbsp; <b>Fecha:</b> ${d.fecha} &nbsp;|&nbsp; <b>Estado:</b> ${d.estado}</p>
    <p><b>Descripción:</b> ${d.descripcion}</p>
    ${d.referencia?`<p><b>Referencia:</b> ${d.referencia}</p>`:""}
    <table><thead><tr><th>Código</th><th>Cuenta</th><th>Descripción</th><th class="right">Debe</th><th class="right">Haber</th></tr></thead>
    <tbody>
    ${(Array.isArray(lineas)?lineas:[]).map(l=>`<tr>
      <td>${l.cuenta_codigo||""}</td><td>${l.cuenta_nombre||""}</td><td>${l.descripcion||""}</td>
      <td class="right green">${l.debe>0?"Q "+parseFloat(l.debe).toFixed(2):""}</td>
      <td class="right blue">${l.haber>0?"Q "+parseFloat(l.haber).toFixed(2):""}</td>
    </tr>`).join("")}
    </tbody>
    <tfoot><tr class="total"><td colspan="3">TOTALES</td><td class="right green">Q ${parseFloat(d.total_debe||0).toFixed(2)}</td><td class="right blue">Q ${parseFloat(d.total_haber||0).toFixed(2)}</td></tr></tfoot>
    </table>
    <script>window.onload=()=>window.print();</script></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:T.sub}}>Registra asientos contables manuales con partida doble</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
          <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo diario"}</button>
        </div>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Nuevo Diario Manual</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,marginBottom:14}}>
            <Fld label="FECHA"><input style={S.inp} type="date" value={fd.fecha} onChange={e=>sfd("fecha",e.target.value)}/></Fld>
            <Fld label="DESCRIPCIÓN"><input style={S.inp} value={fd.descripcion} onChange={e=>sfd("descripcion",e.target.value)} placeholder="Ej: Registro de combustible semana del 21 al 25 de abril"/></Fld>
            <Fld label="REFERENCIA"><input style={S.inp} value={fd.referencia} onChange={e=>sfd("referencia",e.target.value)} placeholder="FAC-001, REC-045..."/></Fld>
            <Fld label="ESTADO">
              <select style={S.sel} value={fd.estado} onChange={e=>sfd("estado",e.target.value)}>
                <option value="borrador">📝 Borrador</option>
                <option value="publicado">✅ Publicado</option>
              </select>
            </Fld>
          </div>

          {/* Líneas del diario */}
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>LÍNEAS DEL DIARIO (partida doble)</div>
          <div style={{...S.card,background:T.surf,padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Cuenta","Descripción de la línea","DEBE (Q)","HABER (Q)",""].map(h=><th key={h} style={{...S.th,padding:"8px 10px"}}>{h}</th>)}</tr></thead>
              <tbody>
                {lineas.map((l,idx)=>(
                  <tr key={idx}>
                    <td style={{padding:"6px 8px",width:260}}>
                      <select style={{...S.sel,fontSize:12,padding:"6px 8px"}} value={l.cuenta_id} onChange={e=>selCuenta(idx,e.target.value)}>
                        <option value="">Seleccionar cuenta...</option>
                        {cuentas.filter(c=>c.nivel===3||c.nivel===2).map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px"}} value={l.descripcion} onChange={e=>updateLinea(idx,"descripcion",e.target.value)} placeholder="Detalle..."/>
                    </td>
                    <td style={{padding:"6px 8px",width:110}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px",textAlign:"right",color:T.acc}} type="number" step="0.01" value={l.debe||""} onChange={e=>{updateLinea(idx,"debe",parseFloat(e.target.value)||0);if(parseFloat(e.target.value)>0)updateLinea(idx,"haber",0);}} placeholder="0.00"/>
                    </td>
                    <td style={{padding:"6px 8px",width:110}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px",textAlign:"right",color:T.blue}} type="number" step="0.01" value={l.haber||""} onChange={e=>{updateLinea(idx,"haber",parseFloat(e.target.value)||0);if(parseFloat(e.target.value)>0)updateLinea(idx,"debe",0);}} placeholder="0.00"/>
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      {lineas.length>2&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"4px 8px",fontSize:11}}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:T.card}}>
                  <td colSpan={2} style={{padding:"8px 10px"}}>
                    <button onClick={addLinea} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>+ Agregar línea</button>
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:cuadrado?T.acc:T.red,fontSize:13}}>Q {fmt(totalDebe)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:cuadrado?T.acc:T.red,fontSize:13}}>Q {fmt(totalHaber)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance indicator */}
          <div style={{marginTop:10,padding:"10px 14px",borderRadius:9,background:cuadrado?T.accDim:T.redDim,border:"1px solid "+(cuadrado?T.acc:T.red)+"44",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600,color:cuadrado?T.acc:T.red}}>
              {cuadrado?"✅ El diario cuadra correctamente":"❌ No cuadra — diferencia: Q "+fmt(Math.abs(totalDebe-totalHaber))}
            </span>
            <div style={{fontSize:12,color:T.sub}}>Debe: Q {fmt(totalDebe)} | Haber: Q {fmt(totalHaber)}</div>
          </div>

          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={guardar} disabled={saving||!cuadrado} style={{...S.btn(cuadrado?"primary":"ghost"),flex:1,opacity:cuadrado?1:0.5}}>{saving?"Guardando...":"💾 Guardar diario"}</button>
            <button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:asientos_contables.length===0?<Empty icon="📒" msg="Sin asientos_contables registrados" action="+ Nuevo diario" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {asientos_contables.map(d=>(
            <div key={d.id} style={{...S.card,borderLeft:"3px solid "+(d.estado==="publicado"?T.acc:T.sec)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{d.numero}</div>
                  <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{d.descripcion}</div>
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>{fmtD(d.fecha)}{d.referencia?" · Ref: "+d.referencia:""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:d.estado==="publicado"?T.acc:T.sec,background:d.estado==="publicado"?T.accDim:T.secDim}}>
                    {d.estado==="publicado"?"✅ Publicado":"📝 Borrador"}
                  </span>
                  <div style={{marginTop:6,fontSize:12,color:T.sub}}>
                    <span style={{color:T.acc}}>Debe: Q {fmt(d.total_debe)}</span> | <span style={{color:T.blue}}>Haber: Q {fmt(d.total_haber)}</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                {d.estado==="borrador"&&<button onClick={()=>publicar(d)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>✅ Publicar</button>}
                <button onClick={()=>imprimirDiario(d)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>🖨️ Imprimir</button>
                {d.estado==="borrador"&&<button onClick={()=>del(d.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>🗑️</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal de Contabilidad ─────────────────────────────────────────
function PageContabilidad({showToast,empId}){
  const [tab,setTab]=useState("catalogo");
  const [balanceData,setBalanceData]=useState(null);
  const [loadingBalance,setLoadingBalance]=useState(false);
  const calcBalance=async()=>{
    setLoadingBalance(true);
    const [gastos,movs,facturas]=await Promise.all([
      dbGet("gastos",""),dbGet("movimientos_bancarios",""),dbGet("facturas","")
    ]);
    const ingresos=(Array.isArray(facturas)?facturas:[]).filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);
    const egresosGas=(Array.isArray(gastos)?gastos:[]).reduce((s,g)=>s+(parseFloat(g.total)||0),0);
    const saldoBanca=(Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0)-
                    (Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="egreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
    const utilidad=ingresos-egresosGas;
    setBalanceData({ingresos,gastos:egresosGas,utilidad,saldoBanca,iva:ingresos*0.05,fecha:today()});
    setLoadingBalance(false);
  };
  useEffect(()=>{if(tab==="balance")calcBalance();},[tab]);

  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:"1px solid "+T.bord,marginBottom:18}}>
        {[{id:"catalogo",l:"📋 Catálogo de Cuentas"},{id:"asientos_contables",l:"📒 asientos_contables Manuales"},{id:"balance",l:"📊 Balance General"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 18px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?"2px solid "+T.acc:"2px solid transparent"}}>
            {t.l}
          </button>
        ))}
      </div>
      {tab==="catalogo"&&<TabCatalogo empId={empId} showToast={showToast}/>}
      {tab==="asientos_contables"&&<Tabasientos_contables empId={empId} showToast={showToast}/>}
      {tab==="balance"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:T.sub}}>Balance resumido al {fmtD(today())} — basado en facturas, gastos y movimientos registrados</div>
            <button onClick={calcBalance} disabled={loadingBalance} style={{...S.btn("ghost"),fontSize:12}}>{loadingBalance?"Calculando...":"↺ Actualizar"}</button>
          </div>
          {balanceData?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Estado de Resultados */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Estado de Resultados</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Ingresos (facturas emitidas)</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt(balanceData.ingresos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Gastos registrados</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:balanceData.utilidad>=0?T.accDim:T.redDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Utilidad bruta</span>
                  <span style={{fontWeight:800,fontSize:16,color:balanceData.utilidad>=0?T.acc:T.red}}>Q {fmt(balanceData.utilidad)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",marginTop:8}}><span style={{color:T.sub}}>IVA estimado (5%)</span><span style={{color:T.sec}}>Q {fmt(balanceData.iva)}</span></div>
              </div>
              {/* Posición Bancaria */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.blue,marginBottom:14}}>🏦 Posición Bancaria</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total ingresos banca</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt((balanceData.saldoBanca||0)+(balanceData.gastos||0))}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total egresos banca</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:T.blueDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Saldo neto</span>
                  <span style={{fontWeight:800,fontSize:16,color:T.blue}}>Q {fmt(Math.abs(balanceData.saldoBanca))}</span>
                </div>
                <div style={{marginTop:12,fontSize:12,color:T.mut}}>
                  ⚠️ Este balance es un resumen estimado. Para contabilidad oficial utiliza los asientos_contables manuales y el catálogo de cuentas.
                </div>
              </div>
            </div>
          ):<Spinner/>}
        </div>
      )}
    </div>
  );
}


// ── Error Boundary para capturar errores de renderizado ──────────────────────
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  render(){
    if(this.state.hasError){
      return <div style={{padding:24,background:"#162032",borderRadius:12,border:"1px solid #EF4444",margin:16}}>
        <div style={{fontSize:14,fontWeight:700,color:"#EF4444",marginBottom:8}}>⚠️ Error en este módulo</div>
        <div style={{fontSize:12,color:"#94A3B8",fontFamily:"monospace"}}>{String(this.state.error)}</div>
        <button onClick={()=>this.setState({hasError:false,error:null})} style={{marginTop:12,padding:"6px 14px",background:"#00D4AA",border:"none",borderRadius:6,fontWeight:600,color:"#0A0F1E",cursor:"pointer"}}>↺ Reintentar</button>
      </div>;
    }
    return this.props.children;
  }
}


export default function App(){
  const [pag,setPag]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [empId,setEmpId]=useState(null);
  const [sideOpen,setSideOpen]=useState(true);
  const [token,setToken]=useState(()=>localStorage.getItem("tzunun_token")||null);
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("tzunun_user"))||null;}catch{return null;}});
  const [inviteToken,setInviteToken]=useState(null);
  const [authMode,setAuthMode]=useState("login"); // login | setpassword

  // Check URL for invite/recovery token from Supabase email
  useEffect(()=>{
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#',''));
    const accessToken = params.get('access_token');
    const type = params.get('type');
    if(accessToken && (type==='invite' || type==='recovery' || type==='signup')){
      setInviteToken(accessToken);
      setAuthMode('setpassword');
      window.history.replaceState(null,'',window.location.pathname);
    }
  },[]);

  const handleLogin=(tk,usr)=>{setToken(tk);setUser({email:usr?.email,name:usr?.user_metadata?.name||usr?.email});};
  const handleLogout=async()=>{if(token)await sbSignOut(token);localStorage.removeItem("tzunun_token");localStorage.removeItem("tzunun_user");setToken(null);setUser(null);};

  if(!token){
    if(authMode==='setpassword' && inviteToken) return <SetPasswordScreen token={inviteToken} onDone={()=>{setAuthMode('login');setInviteToken(null);}}/>;
    return <LoginScreen onLogin={handleLogin}/>;
  }

  useEffect(()=>{
    dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0])setEmpId(d[0].id);});
    // Global TAB navigation style
    const style=document.createElement("style");
    style.innerHTML="input,select,textarea{outline:none}input:focus,select:focus,textarea:focus{border-color:#00D4AA!important;box-shadow:0 0 0 2px #00D4AA33}";
    document.head.appendChild(style);
    // Load jsPDF dynamically
    if(!window.jspdf){
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload=()=>console.log("jsPDF loaded");
      document.head.appendChild(s);
    }
  },[]);
  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const NAV=[
    {id:"sep1",label:"PRINCIPAL",sep:true},
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"sep2",label:"PRESUPUESTOS",sep:true},
    {id:"calculadora",icon:"🧮",label:"Calculadora"},
    {id:"cotizaciones",icon:"📋",label:"Cotizaciones"},
    {id:"reservas",icon:"📅",label:"Reservas"},
    {id:"sep3",label:"OPERACIÓN",sep:true},
    {id:"flota",icon:"🚗",label:"Flota"},
    {id:"mantenimiento",icon:"🔧",label:"Mantenimiento"},
    {id:"clientes",icon:"👥",label:"Clientes"},
    {id:"sep4",label:"FINANZAS",sep:true},
    {id:"facturacion",icon:"🧾",label:"Facturación FEL"},
    {id:"banca",icon:"🏦",label:"La Banca"},
    {id:"gastos",icon:"💸",label:"Gastos/Compras"},
    {id:"pagos",icon:"💰",label:"Pagos Recibidos"},
    {id:"contabilidad",icon:"📒",label:"Contabilidad"},
    {id:"sep5",label:"ANÁLISIS",sep:true},
    {id:"reportes",icon:"📈",label:"Reportes"},
    {id:"sep6",label:"SISTEMA",sep:true},
    {id:"configuracion",icon:"⚙️",label:"Configuración"},
  ];
  const renderPage=()=>{
    if(pag==="dashboard")    return <PageDashboard/>;
    if(pag==="flota")        return <PageFlota showToast={showToast} empId={empId}/>;
    if(pag==="reservas")     return <PageReservas showToast={showToast} empId={empId}/>;
    if(pag==="clientes")     return <PageClientes showToast={showToast} empId={empId}/>;
    if(pag==="calculadora")  return <PageCalculadora showToast={showToast} empId={empId}/>;
    if(pag==="cotizaciones") return <PageCotizaciones showToast={showToast} empId={empId}/>;
    if(pag==="facturacion")  return <PageFacturacion showToast={showToast} empId={empId}/>;
    if(pag==="mantenimiento") return <PageMantenimiento showToast={showToast} empId={empId}/>;
    if(pag==="banca")        return <PageBanca showToast={showToast} empId={empId}/>;
    if(pag==="gastos")       return <PageGastos showToast={showToast} empId={empId}/>;
    if(pag==="pagos")         return <PagePagos showToast={showToast} empId={empId}/>;
    if(pag==="contabilidad") return <PageContabilidad showToast={showToast} empId={empId}/>;
    if(pag==="reportes")     return <PageReportes/>;
    if(pag==="configuracion")return <PageConfiguracion showToast={showToast}/>;
    return <div style={{textAlign:"center",padding:60,color:T.sub}}>🚧 En construcción</div>;
  };
  const curNav=NAV.find(n=>n.id===pag);
  return(
    <div style={{display:"flex",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:T.bg,color:T.txt,minHeight:"100vh",maxHeight:"100vh",overflow:"hidden"}}>
      <div style={{width:sideOpen?220:58,background:T.surf,borderRight:`1px solid ${T.bord}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden"}}>
        <div style={{padding:"14px 12px",borderBottom:`1px solid ${T.bord}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#00D4AA,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🐦</div>
          {sideOpen&&<div><div style={{fontSize:13,fontWeight:800,color:T.acc}}>Tz'unun</div><div style={{fontSize:9,color:T.mut}}>AutoRentas</div></div>}
          <button onClick={()=>setSideOpen(!sideOpen)} style={{...S.btn("ghost"),padding:"3px 7px",marginLeft:"auto",fontSize:11,flexShrink:0}}>☰</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
          {NAV.map(n=>{
            if(n.sep)return sideOpen?<div key={n.id} style={{fontSize:9,fontWeight:700,color:T.mut,padding:"12px 14px 3px",letterSpacing:.8}}>{n.label}</div>:<div key={n.id} style={{height:1,background:T.bord,margin:"6px 8px"}}/>;
            const act=pag===n.id;
            return <button key={n.id} onClick={()=>setPag(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:act?T.accDim:"transparent",border:"none",borderLeft:act?`3px solid ${T.acc}`:"3px solid transparent",cursor:"pointer",color:act?T.acc:T.sub,fontWeight:act?700:400,fontSize:12,textAlign:"left"}}>
              <span style={{fontSize:15,flexShrink:0}}>{n.icon}</span>
              {sideOpen&&<span style={{whiteSpace:"nowrap",overflow:"hidden"}}>{n.label}</span>}
            </button>;
          })}
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:T.surf,borderBottom:`1px solid ${T.bord}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700}}>{curNav?.icon} {curNav?.label}</div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:14}}>
            {user&&<div style={{fontSize:12,color:T.sub}}>👤 {user.name&&user.name!==user.email?user.name:user.email?.split("@")[0]}</div>}
            <div style={{fontSize:11,color:T.mut}}>{new Date().toLocaleDateString("es-GT",{day:"2-digit",month:"long",year:"numeric"})}</div>
            <button onClick={handleLogout} style={{background:"transparent",border:`1px solid ${T.bord}`,borderRadius:7,padding:"4px 10px",fontSize:11,color:T.sub,cursor:"pointer"}}>Salir 🚪</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {toast&&<Toast msg={toast.msg} type={toast.type}/>}
          <ErrorBoundary>{renderPage()}</ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// jsPDF loaded via CDN in index.html
