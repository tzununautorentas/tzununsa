/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const LOGO_B64="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";
const SB="https://fmijbpatkddkbxlkfoza.supabase.co";
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"};
const T={bg:"#0A0F1E",surf:"#111827",card:"#162032",bord:"#1E3A5F",acc:"#00D4AA",accDim:"#00D4AA22",sec:"#F59E0B",secDim:"#F59E0B22",red:"#EF4444",redDim:"#EF444422",blue:"#3B82F6",blueDim:"#3B82F622",purple:"#A855F7",purpleDim:"#A855F722",green:"#22C55E",greenDim:"#22C55E22",txt:"#F1F5F9",mut:"#64748B",sub:"#94A3B8"};
const fmt=n=>new Intl.NumberFormat("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fmtK=n=>n>=1000?`Q ${(n/1000).toFixed(1)}k`:`Q ${fmt(n)}`;
const fmtD=s=>{if(!s)return"—";try{return new Date(s+"T12:00:00").toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});}catch{return s;}};
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
  doc.text(d.cliente,22,y); y+=11;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","normal");
  if(d.nit) doc.text("NIT: "+d.nit+(d.dir_cliente?"   |   "+d.dir_cliente:""),22,y);
  y+=8;
  doc.setDrawColor(226,232,240); doc.setLineWidth(0.5); doc.line(22,y,W-22,y); y+=12;

  // Saludo
  doc.setFillColor(232,245,240); doc.roundedRect(22,y,W-44,46,4,4,"F");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,46,"F");
  doc.setTextColor(27,45,92); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text((d.saludo||"Estimados señores de "+d.cliente)+":",32,y+13);
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
    "• El vehículo debe devolverse lavado (recargo Q.75.00 si no).",
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
    };
  });
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
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

  const guardar=async(estado)=>{
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
    setSaving(true);
    const numero=isClone?`COT-${Date.now().toString().slice(-6)}`:(initial?.numero||`COT-${Date.now().toString().slice(-6)}`);
    const payload={
      empresa_id:empId,
      numero,
      tipo:f.tipo,
      cliente_nombre:f.cliente_nombre,
      cliente_nit:f.cliente_nit,
      cliente_dir:f.cliente_dir,
      saludo:f.saludo,
      descripcion_servicio:f.descripcion_servicio,
      vehiculo_nombre:f.vehiculo_nombre,
      con_piloto:f.con_piloto,
      dias:f.dias,
      precio_personalizado:parseFloat(f.precio_custom)||null,
      tasa_iva:f.iva_pct,
      metodo_pago:f.pago,
      tasa_cambio:exch,
      subtotal:sub,
      total_iva:iva_amt,
      recargo_tarjeta:f.pago==="tarjeta"?total_ef*0.05:0,
      total_gtq:f.pago==="tarjeta"?total_tc:total_ef,
      total_usd:(f.pago==="tarjeta"?total_tc:total_ef)/exch,
      fecha_emision:f.fecha_emision,
      fecha_vence:f.fecha_vence,
      estado,
      notas:f.notas,
      caract,
      incluidos,
      beneficios,
      orden_venta:estado==="orden_venta",
    };
    if(!isClone && initial?.id && !initial?.__clon){
      await dbUpd("cotizaciones",initial.id,payload);
    } else {
      await dbIns("cotizaciones",payload);
    }
    setSaving(false);
    onSave(estado);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.acc}}>
          {isClone?"Clonar cotización":initial?.id?"Editar cotización":"Nueva cotización"}
        </div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
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

function FormFactura({initial,empId,clientes,reservas,cotizaciones,anticipos,onSave,onCancel}){
  const [f,setF]=useState({
    serie:"TZAR2026",tipo_dte:"FACT",fecha_emision:today(),
    nit_receptor:initial?.nit_receptor||"",
    nombre_receptor:initial?.nombre_receptor||"",
    direccion_receptor:initial?.direccion_receptor||"",
    correo_receptor:initial?.correo_receptor||"",
    descripcion_servicio:initial?.descripcion_servicio||"",
    cantidad:initial?.cantidad||1,
    precio_unitario:initial?.precio_unitario||"",
    tasa_iva:initial?.tasa_iva||12,
    metodo_pago:initial?.metodo_pago||"efectivo",
    tasa_cambio:initial?.tasa_cambio||7.70,
    regimen:initial?.regimen||"GENERAL",
    estado:initial?.estado||"borrador",
    notas:initial?.notas||"",
    cliente_id:initial?.cliente_id||"",
    reserva_id:initial?.reserva_id||"",
    cotizacion_id:initial?.cotizacion_id||"",
    anticipo_aplicado:initial?.anticipo_aplicado||0,
  });
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // Cálculos
  const sub=(parseFloat(f.cantidad)||0)*(parseFloat(f.precio_unitario)||0);
  const ivaAmt=sub*(parseFloat(f.tasa_iva)||0)/100;
  const recTC=f.metodo_pago==="tarjeta"?(sub+ivaAmt)*0.05:0;
  const total=sub+ivaAmt+recTC;
  const anticipo=parseFloat(f.anticipo_aplicado)||0;
  const saldo=Math.max(0,total-anticipo);
  const exch=parseFloat(f.tasa_cambio)||7.70;

  // Al seleccionar cliente — prellenar datos
  const selCliente=c=>{
    sf("nombre_receptor",c.nombre);sf("nit_receptor",c.nit||"");
    sf("direccion_receptor",c.direccion||"");sf("correo_receptor",c.email||"");
    sf("cliente_id",c.id);
  };
  // Al seleccionar reserva — prellenar servicio y monto
  const selReserva=r=>{
    sf("reserva_id",r.id);
    sf("descripcion_servicio",`${r.tipo==="renta"?"Renta de vehículo":"Servicio de traslado"} — ${r.vehiculo_nombre||""} · ${r.origen||""}${r.destino?" → "+r.destino:""}`);
    sf("precio_unitario",parseFloat(r.monto)||"");
    sf("anticipo_aplicado",parseFloat(r.anticipo)||0);
  };
  // Al seleccionar cotización — prellenar
  const selCotizacion=c=>{
    sf("cotizacion_id",c.id);
    sf("descripcion_servicio",c.descripcion_servicio||`Cotización ${c.numero}`);
    sf("precio_unitario",parseFloat(c.subtotal)||"");
    sf("tasa_iva",parseFloat(c.tasa_iva)||12);
  };
  // Al seleccionar anticipo
  const selAnticipo=m=>{sf("anticipo_aplicado",parseFloat(m.monto)||0);};

  const guardar=async()=>{
    if(!f.nit_receptor.trim()||!f.nombre_receptor.trim()||!f.descripcion_servicio.trim()){
      alert("NIT, nombre del receptor y descripción son requeridos");return;
    }
    setSaving(true);
    const p={
      empresa_id:empId,
      numero:initial?.numero||`FAC-${Date.now().toString().slice(-6)}`,
      serie:f.serie,tipo_dte:f.tipo_dte,
      nit_emisor:"16693949",nombre_emisor:"Tz'unun AutoRentas",
      regimen:f.regimen,
      nit_receptor:f.nit_receptor,nombre_receptor:f.nombre_receptor,
      direccion_receptor:f.direccion_receptor,correo_receptor:f.correo_receptor,
      descripcion_servicio:f.descripcion_servicio,
      cantidad:parseFloat(f.cantidad)||1,
      precio_unitario:parseFloat(f.precio_unitario)||0,
      subtotal:sub,tasa_iva:parseFloat(f.tasa_iva)||0,monto_iva:ivaAmt,
      total,total_usd:exch>0?total/exch:0,tasa_cambio:exch,
      metodo_pago:f.metodo_pago,
      estado:f.estado,fecha_emision:f.fecha_emision,notas:f.notas,
      cliente_id:f.cliente_id||null,
      reserva_id:f.reserva_id||null,
      cotizacion_id:f.cotizacion_id||null,
      anticipo_aplicado:anticipo,
      saldo_pendiente:saldo,
    };
    if(initial?.id) await dbUpd("facturas",initial.id,p);
    else await dbIns("facturas",p);
    setSaving(false);onSave();
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.acc}}>{initial?.id?"Editar factura":"Nueva factura FEL"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        {/* FORM IZQUIERDO */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Régimen */}
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>RÉGIMEN FISCAL SAT</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[{v:"GENERAL",l:"12% Régimen General"},{v:"PEQUENIO",l:"5% Pequeño Contribuyente"}].map(r=>(
                <button key={r.v} onClick={()=>{sf("regimen",r.v);sf("tasa_iva",r.v==="GENERAL"?12:5);}}
                  style={{...S.btn(f.regimen===r.v?"primary":"ghost"),flex:1,fontSize:11}}>{r.l}</button>
              ))}
            </div>
            <div style={{background:f.regimen==="GENERAL"?T.accDim:T.secDim,borderRadius:8,padding:"8px 12px",fontSize:12,color:f.regimen==="GENERAL"?T.acc:T.sec,fontWeight:600}}>
              NIT Emisor: 16693949 · Tz'unun AutoRentas · {f.regimen==="GENERAL"?"IVA 12%":"5% Pequeño Contribuyente"}
            </div>
          </div>

          {/* Vincular receptor */}
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>RECEPTOR (CLIENTE)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="BUSCAR CLIENTE EXISTENTE" span2>
                <Autocomplete
                  value={f.nombre_receptor}
                  onChange={v=>sf("nombre_receptor",v)}
                  onSelect={selCliente}
                  items={clientes}
                  placeholder="Escribe para buscar..."
                  getLabel={c=>c.nombre}
                  renderItem={c=><div><div style={{fontWeight:600,color:T.txt,fontSize:13}}>{c.nombre}</div><div style={{fontSize:11,color:T.sub}}>NIT: {c.nit||"—"} · {c.tipo}</div></div>}
                />
              </Fld>
              <Fld label="NIT RECEPTOR">
                <input style={S.inp} value={f.nit_receptor} onChange={e=>sf("nit_receptor",e.target.value)} placeholder="1234567-8 o CF"/>
              </Fld>
              <Fld label="CORREO (envío DTE)">
                <input style={S.inp} type="email" value={f.correo_receptor} onChange={e=>sf("correo_receptor",e.target.value)} placeholder="correo@cliente.com"/>
              </Fld>
              <Fld label="DIRECCIÓN" span2>
                <input style={S.inp} value={f.direccion_receptor} onChange={e=>sf("direccion_receptor",e.target.value)} placeholder="Dirección del receptor"/>
              </Fld>
            </div>
          </div>

          {/* Vincular servicio */}
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>VINCULAR SERVICIO (opcional)</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <label style={S.lbl}>VINCULAR A RESERVA</label>
                <Autocomplete
                  value={reservas.find(r=>r.id===f.reserva_id)?.numero||""}
                  onChange={()=>{}}
                  onSelect={selReserva}
                  items={reservas.filter(r=>r.estado!=="cancelada")}
                  placeholder="Buscar reserva por cliente..."
                  getLabel={r=>r.cliente_nombre+" "+r.numero}
                  renderItem={r=><div><div style={{fontWeight:600,color:T.txt,fontSize:12}}>{r.numero} · {r.cliente_nombre}</div><div style={{fontSize:11,color:T.sub}}>Q {fmt(r.monto)} · Saldo: Q {fmt(r.saldo)}</div></div>}
                />
              </div>
              <div>
                <label style={S.lbl}>VINCULAR A COTIZACIÓN</label>
                <Autocomplete
                  value={cotizaciones.find(c=>c.id===f.cotizacion_id)?.numero||""}
                  onChange={()=>{}}
                  onSelect={selCotizacion}
                  items={cotizaciones.filter(c=>c.estado==="aprobada"||c.estado==="orden_venta")}
                  placeholder="Buscar cotización aprobada..."
                  getLabel={c=>c.cliente_nombre+" "+c.numero}
                  renderItem={c=><div><div style={{fontWeight:600,color:T.txt,fontSize:12}}>{c.numero} · {c.cliente_nombre}</div><div style={{fontSize:11,color:T.sub}}>Q {fmt(c.total_gtq)} · {c.estado}</div></div>}
                />
              </div>
              <div>
                <label style={S.lbl}>APLICAR ANTICIPO DE LA BANCA</label>
                <Autocomplete
                  value={f.anticipo_aplicado>0?`Q ${fmt(f.anticipo_aplicado)} aplicado`:""}
                  onChange={()=>{}}
                  onSelect={selAnticipo}
                  items={anticipos}
                  placeholder="Buscar anticipo recibido..."
                  getLabel={m=>m.descripcion+" "+m.monto}
                  renderItem={m=><div><div style={{fontWeight:600,color:T.txt,fontSize:12}}>{m.descripcion}</div><div style={{fontSize:11,color:T.acc}}>Q {fmt(m.monto)} · {fmtD(m.fecha)}</div></div>}
                />
                {f.anticipo_aplicado>0&&<div style={{marginTop:6,background:T.accDim,borderRadius:7,padding:"6px 12px",fontSize:12,color:T.acc,fontWeight:600}}>✔ Anticipo de Q {fmt(f.anticipo_aplicado)} aplicado a esta factura</div>}
              </div>
            </div>
          </div>
        </div>

        {/* FORM DERECHO */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Servicio */}
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>SERVICIO FACTURADO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="DESCRIPCIÓN" span2>
                <textarea style={{...S.inp,minHeight:64,resize:"vertical"}} value={f.descripcion_servicio} onChange={e=>sf("descripcion_servicio",e.target.value)} placeholder="Descripción del servicio..."/>
              </Fld>
              <Fld label="CANTIDAD">
                <input style={S.inp} type="number" min="1" step="0.01" value={f.cantidad} onChange={e=>sf("cantidad",e.target.value)}/>
              </Fld>
              <Fld label="PRECIO UNITARIO (sin impuesto)">
                <input style={S.inp} type="number" step="0.01" value={f.precio_unitario} onChange={e=>sf("precio_unitario",e.target.value)} placeholder="0.00"/>
              </Fld>
              <Fld label="MÉTODO DE PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="deposito">💰 Depósito</option>
                  <option value="tarjeta">💳 Tarjeta (+5%)</option>
                  <option value="cheque">📄 Cheque</option>
                </select>
              </Fld>
              <Fld label="TASA CAMBIO GTQ=1USD">
                <input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e=>sf("tasa_cambio",e.target.value)}/>
              </Fld>
              <Fld label="ESTADO">
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="emitida">Emitida</option>
                  <option value="certificada">Certificada SAT</option>
                  <option value="pagada">Pagada</option>
                </select>
              </Fld>
              <Fld label="NOTAS INTERNAS" span2>
                <input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
              </Fld>
            </div>
          </div>

          {/* Resumen financiero */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:12}}>💰 Resumen Financiero</div>
            <div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={S.srow(false)}><span>Subtotal (sin impuesto)</span><span>Q {fmt(sub)}</span></div>
              <div style={S.srow(false)}><span>{f.regimen==="GENERAL"?"IVA (12%)":"Impuesto Pequeño Cont. (5%)"}</span><span>Q {fmt(ivaAmt)}</span></div>
              {f.metodo_pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo tarjeta (5%)</span><span>Q {fmt(recTC)}</span></div>}
            </div>
            <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(total)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>USD (Q{f.tasa_cambio}=1)</span><span>$ {fmt(total/exch)}</span></div>
            </div>
            {anticipo>0&&(
              <div style={{background:T.surf,borderRadius:9,padding:12}}>
                <div style={S.srow(false)}><span>Total factura</span><span>Q {fmt(total)}</span></div>
                <div style={S.srow(false)}><span>Anticipo aplicado</span><span style={{color:T.acc}}>− Q {fmt(anticipo)}</span></div>
                <div style={S.div}/>
                <div style={S.srow(true)}><span>SALDO PENDIENTE</span><span style={{color:saldo>0?T.sec:T.acc}}>Q {fmt(saldo)}</span></div>
                <div style={{fontSize:11,color:T.sub,marginTop:4}}>$ {fmt(exch>0?saldo/exch:0)} USD</div>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>{sf("estado","borrador");setTimeout(guardar,0);}} disabled={saving} style={{...S.btn("ghost"),flex:1}}>{saving?"...":"💾 Borrador"}</button>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"🧾 Emitir factura"}</button>
            </div>
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
    const payload={empresa_id:empId,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,proveedor_id:f.proveedor_id||null,notas:f.notas,fecha_pago:f.estado==="pagado"?f.fecha:null};
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
    const payload={empresa_id:empId,nombre:f.nombre,nit:f.nit,categoria:f.categoria,contacto:f.contacto,telefono:f.telefono,email:f.email,direccion:f.direccion,credito_limite:parseFloat(f.credito_limite)||0,notas:f.notas,activo:true};
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

function FormReserva({initial,onSave,onCancel,empId}){
  const [f,setF]=useState(()=>{
    if(initial){
      return{
        ...EMPTY,
        cliente_nombre:initial.cliente_nombre||"",
        tipo:initial.tipo||"renta",
        vehiculo_nombre:initial.vehiculo_nombre||"",
        conductor_nombre:initial.conductor_nombre||"",
        fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",
        fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):"",
        hora_recogida:initial.hora_recogida||"08:00",
        origen:initial.origen||"",
        destino:initial.destino||"",
        departamento:initial.departamento||"",
        municipio:initial.municipio||"",
        anticipo:initial.anticipo||"",
        estado:initial.estado||"pendiente",
        notas:initial.notas||"",
        iva:initial.tasa_iva||12,
        pago:initial.metodo_pago||"efectivo",
        exch:initial.tasa_cambio||7.70,
      };
    }
    return EMPTY;
  });
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];

  // ── CÁLCULOS ─────────────────────────────────────────────────────────────
  const dias=calcDias(f.fecha_inicio,f.fecha_fin);
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const tarifaBase=calcTarifa(vehObj,dias);
  const nombreTarifa=getTarifaNombre(dias);

  // Subtotal catálogo (precio base sin IVA ni TC)
  const subtotalBase=dias>0&&vehObj?dias*tarifaBase:0;

  // IVA
  const ivaAmt=subtotalBase*(parseFloat(f.iva)||0)/100;

  // Total con IVA (precio efectivo/depósito/transferencia)
  const totalEfectivo=subtotalBase+ivaAmt;

  // Recargo TC 5% (solo si pago con tarjeta)
  const recargoTC=f.pago==="tarjeta"?totalEfectivo*0.05:0;

  // Total final
  const totalFinal=totalEfectivo+recargoTC;

  // USD
  const exch=parseFloat(f.exch)||7.70;
  const totalUSD=exch>0?totalFinal/exch:0;
  const totalEfUSD=exch>0?totalEfectivo/exch:0;

  // Anticipo y saldo
  const anticipo=parseFloat(f.anticipo)||0;
  const saldo=totalFinal-anticipo;

  // ── GUARDAR ──────────────────────────────────────────────────────────────
  const guardar=async()=>{
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
    if(!f.fecha_inicio){alert("La fecha de inicio es requerida");return;}
    if(f.tipo==="renta"&&!f.vehiculo_nombre){alert("Selecciona un vehículo");return;}
    setSaving(true);
    const payload={
      empresa_id:empId,
      cliente_nombre:f.cliente_nombre,
      tipo:f.tipo,
      numero:initial?.id?undefined:`RES-${Date.now().toString().slice(-6)}`,
      vehiculo_nombre:f.vehiculo_nombre,
      conductor_nombre:f.conductor_nombre,
      fecha_inicio:new Date(f.fecha_inicio+"T"+(f.hora_recogida||"08:00")+":00").toISOString(),
      fecha_fin:f.fecha_fin?new Date(f.fecha_fin+"T23:59:00").toISOString():null,
      hora_recogida:f.hora_recogida,
      origen:f.origen,destino:f.destino,
      departamento:f.departamento,municipio:f.municipio,
      monto:totalFinal,
      anticipo,saldo,
      tasa_iva:parseFloat(f.iva)||0,
      metodo_pago:f.pago,
      tasa_cambio:exch,
      estado:f.estado,
      notas:f.notas,
    };
    if(initial?.id)await dbUpd("reservas",initial.id,payload);
    else await dbIns("reservas",payload);
    setSaving(false);
    onSave();
  };

  const hasCalc=dias>0&&vehObj;

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>

      {/* FORM */}
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:16}}>
          {initial?.id?"Editar reserva":"Nueva reserva"}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>

          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>CLIENTE / EMPRESA</label>
            <input style={S.inp} value={f.cliente_nombre} onChange={e=>sf("cliente_nombre",e.target.value)} placeholder="Nombre del cliente u organización"/>
          </div>

          <div>
            <label style={S.lbl}>TIPO DE SERVICIO</label>
            <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
              <option value="renta">Renta de vehículo</option>
              <option value="traslado">Traslado con conductor</option>
            </select>
          </div>
          <div>
            <label style={S.lbl}>CONDUCTOR / PILOTO</label>
            <input style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del conductor"/>
          </div>

          {/* Vehículo */}
          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>VEHÍCULO</label>
            <select style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
              <option value="">Seleccionar vehículo...</option>
              {CATALOGO.map(v=>(
                <option key={v.nombre} value={v.nombre}>
                  {v.nombre} — Q{fmt(v.dia)}/día · Q{fmt(v.sem)}/semana · Q{fmt(v.mes)}/mes
                </option>
              ))}
            </select>
          </div>

          {/* Tarifas del vehículo */}
          {vehObj&&(
            <div style={{gridColumn:"span 2",background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:9,padding:"10px 14px"}}>
              <div style={{fontSize:10,fontWeight:700,color:T.mut,marginBottom:6}}>TARIFAS CATÁLOGO — {vehObj.tipo}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[{r:"1–7 días",v:vehObj.dia,a:dias>=1&&dias<=7},{r:"8–29 días",v:vehObj.sem,a:dias>=8&&dias<=29},{r:"30+ días",v:vehObj.mes,a:dias>=30}].map(({r,v,a})=>(
                  <div key={r} style={{textAlign:"center",opacity:a?1:0.55}}>
                    <div style={{fontSize:10,color:T.sub}}>{r}</div>
                    <div style={{fontSize:14,fontWeight:700,color:a?T.acc:T.txt}}>Q {fmt(v)}/día</div>
                    {a&&<div style={{fontSize:9,color:T.acc,fontWeight:700}}>▲ ACTIVA</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div style={{gridColumn:"span 2"}}><div style={S.div}/><div style={{fontSize:11,fontWeight:700,color:T.sub,marginBottom:8}}>FECHAS — el total se calcula automáticamente</div></div>
          <div>
            <label style={S.lbl}>FECHA DE ENTREGA</label>
            <input style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/>
          </div>
          <div>
            <label style={S.lbl}>FECHA DE DEVOLUCIÓN</label>
            <input style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/>
          </div>
          <div>
            <label style={S.lbl}>HORA DE RECOGIDA</label>
            <input style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/>
          </div>
          <div/>

          {/* Resultado días */}
          {dias>0&&(
            <div style={{gridColumn:"span 2",background:T.surf,borderRadius:9,padding:"11px 16px",display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:T.mut}}>Días calculados</div><div style={{fontSize:20,fontWeight:800,color:T.acc}}>{dias} día{dias!==1?"s":""}</div></div>
              {vehObj&&<>
                <div><div style={{fontSize:10,color:T.mut}}>Tarifa {nombreTarifa}</div><div style={{fontSize:20,fontWeight:800}}>Q {fmt(tarifaBase)}/día</div></div>
                <div><div style={{fontSize:10,color:T.mut}}>Subtotal base</div><div style={{fontSize:20,fontWeight:800,color:T.acc}}>Q {fmt(subtotalBase)}</div></div>
                <div style={{fontSize:12,color:T.sub,fontStyle:"italic"}}>{dias} × Q {fmt(tarifaBase)}</div>
              </>}
            </div>
          )}
          {f.fecha_inicio&&f.fecha_fin&&dias===0&&(
            <div style={{gridColumn:"span 2",background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:9,padding:"9px 14px",fontSize:12,color:T.red}}>
              ⚠️ La fecha de devolución debe ser posterior a la fecha de entrega.
            </div>
          )}

          {/* Ruta */}
          <div style={{gridColumn:"span 2"}}><div style={S.div}/><div style={{fontSize:11,fontWeight:700,color:T.sub,marginBottom:8}}>RUTA</div></div>
          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>ORIGEN</label>
            <input style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Ej: Zona 10, Guatemala"/>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>DESTINO</label>
            <input style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Ej: Antigua Guatemala"/>
          </div>
          <div>
            <label style={S.lbl}>DEPARTAMENTO</label>
            <select style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}>
              <option value="">Seleccionar...</option>
              {Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>MUNICIPIO</label>
            <select style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}>
              <option value="">Seleccionar...</option>
              {munis.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Fiscal y pago */}
          <div style={{gridColumn:"span 2"}}><div style={S.div}/><div style={{fontSize:11,fontWeight:700,color:T.sub,marginBottom:8}}>RÉGIMEN FISCAL Y MÉTODO DE PAGO</div></div>

          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>IVA APLICABLE</label>
            <div style={{display:"flex",gap:8}}>
              {[{v:12,l:"12% — Régimen General"},{v:5,l:"5% — Pequeño Contribuyente"},{v:0,l:"Sin IVA / Exento"}].map(o=>(
                <ToggleBtn key={o.v} active={f.iva===o.v} onClick={()=>sf("iva",o.v)}>{o.l}</ToggleBtn>
              ))}
            </div>
          </div>

          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>MÉTODO DE PAGO</label>
            <div style={{display:"flex",gap:8}}>
              <ToggleBtn active={f.pago==="efectivo"} onClick={()=>sf("pago","efectivo")}>💵 Efectivo / Depósito / Transferencia</ToggleBtn>
              <ToggleBtn active={f.pago==="tarjeta"} onClick={()=>sf("pago","tarjeta")} warn>💳 Tarjeta de crédito/débito (+5%)</ToggleBtn>
            </div>
            {f.pago==="tarjeta"&&(
              <div style={{marginTop:8,background:T.secDim,border:`1px solid ${T.sec}44`,borderRadius:8,padding:"8px 13px",fontSize:12,color:T.sec}}>
                Las tarifas del catálogo aplican para efectivo, depósito o transferencia. El pago con tarjeta incluye un recargo bancario del 5%.
              </div>
            )}
          </div>

          <div>
            <label style={S.lbl}>TASA DE CAMBIO (GTQ = 1 USD)</label>
            <input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/>
          </div>
          <div/>

          {/* Anticipo */}
          <div style={{gridColumn:"span 2"}}><div style={S.div}/><div style={{fontSize:11,fontWeight:700,color:T.sub,marginBottom:8}}>ANTICIPO Y ESTADO</div></div>
          <div>
            <label style={S.lbl}>ANTICIPO RECIBIDO (GTQ)</label>
            <input style={S.inp} type="number" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/>
          </div>
          <div>
            <label style={S.lbl}>ESTADO</label>
            <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label style={S.lbl}>NOTAS</label>
            <textarea style={{...S.inp,minHeight:54,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones, requerimientos especiales..."/>
          </div>

          <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar reserva"}</button>
            <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      </div>

      {/* RESUMEN */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen del costo</div>

          {f.cliente_nombre&&<div style={{fontSize:14,fontWeight:700,marginBottom:4}}>👤 {f.cliente_nombre}</div>}
          {vehObj&&<div style={{fontSize:12,color:T.sub,marginBottom:12}}>🚗 {vehObj.nombre}</div>}

          {hasCalc?(
            <>
              {/* Desglose */}
              <div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:T.mut,marginBottom:8}}>DESGLOSE</div>
                <div style={S.srow(false)}><span>{dias} día{dias!==1?"s":""} × Q {fmt(tarifaBase)} ({nombreTarifa})</span><span>Q {fmt(subtotalBase)}</span></div>
                <div style={S.div}/>
                <div style={S.srow(false)}><span>Subtotal sin impuesto</span><span>Q {fmt(subtotalBase)}</span></div>
                <div style={S.srow(false)}><span>IVA ({f.iva}%)</span><span>Q {fmt(ivaAmt)}</span></div>
                {f.pago==="tarjeta"&&(
                  <div style={{...S.srow(false),color:T.sec}}><span>Recargo tarjeta (5%)</span><span>Q {fmt(recargoTC)}</span></div>
                )}
              </div>

              {/* Si es tarjeta: mostrar precio catálogo como referencia */}
              {f.pago==="tarjeta"&&(
                <div style={{background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.acc,marginBottom:4}}>PRECIO CATÁLOGO (efectivo / depósito / transferencia)</div>
                  <div style={{fontSize:18,fontWeight:800,color:T.acc}}>Q {fmt(totalEfectivo)}</div>
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>$ {fmt(totalEfUSD)} USD · (Q{exch}=1 USD)</div>
                </div>
              )}

              {/* Total final */}
              <div style={{background:f.pago==="tarjeta"?T.secDim:T.accDim,border:`1px solid ${f.pago==="tarjeta"?T.sec:T.acc}55`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:22,fontWeight:800,color:f.pago==="tarjeta"?T.sec:T.acc}}>
                  <span>TOTAL {f.pago==="tarjeta"?"CON TARJETA":""}</span>
                  <span>Q {fmt(totalFinal)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sub,marginTop:4}}>
                  <span>En dólares (Q{exch} = 1 USD)</span>
                  <span>$ {fmt(totalUSD)}</span>
                </div>
              </div>

              {/* Anticipo y saldo */}
              <div style={{background:T.surf,borderRadius:10,padding:12}}>
                <div style={S.srow(false)}><span>Total a pagar</span><span>Q {fmt(totalFinal)}</span></div>
                <div style={S.srow(false)}><span>Anticipo recibido</span><span>Q {fmt(anticipo)}</span></div>
                <div style={S.div}/>
                <div style={S.srow(true)}><span>Saldo pendiente</span><span style={{color:saldo>0?T.sec:T.acc}}>Q {fmt(saldo)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:4}}>
                  <span>Saldo en USD</span><span>$ {fmt(exch>0?saldo/exch:0)}</span>
                </div>
              </div>

              {/* Nota método de pago */}
              <div style={{marginTop:10,background:T.surf,borderRadius:9,padding:"9px 13px",fontSize:11,color:T.sub}}>
                {f.pago==="tarjeta"
                  ?`Las tarifas del catálogo corresponden a pago en efectivo, depósito o transferencia. El total con tarjeta incluye el 5% de recargo bancario y el ${f.iva}% de IVA.`
                  :`Precio catálogo Tz'unun Autorentas 2025. Incluye IVA del ${f.iva}%. Válido para pago en efectivo, depósito o transferencia.`}
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:24,color:T.sub,fontSize:13}}>
              Selecciona un vehículo y las fechas para ver el cálculo automático
            </div>
          )}
        </div>

        {/* Referencia ruta */}
        {f.departamento&&(
          <div style={{...S.card,fontSize:13}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:8}}>RUTA SELECCIONADA</div>
            {f.origen&&<div style={S.srow(false)}><span>Origen</span><span>{f.origen}</span></div>}
            {f.destino&&<div style={S.srow(false)}><span>Destino</span><span>{f.destino}</span></div>}
            {f.departamento&&<div style={S.srow(false)}><span>Departamento</span><span>{f.departamento}</span></div>}
            {f.municipio&&<div style={S.srow(false)}><span>Municipio</span><span>{f.municipio}</span></div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ CLIENTES Y FLOTA ═══

function PageClientes({showToast}){
  const EMPTY_C = {nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""};
  const [rows,setRows]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [form,setForm]     = useState(null); // null=lista, {}=nuevo/editar
  const [saving,setSaving] = useState(false);
  const [empresa,setEmpresa] = useState(null);
  const [editId,setEditId] = useState(null);

  const load = async()=>{ setLoading(true); const d=await db.get("clientes"); setRows(Array.isArray(d)?d:[]); setLoading(false); };
  useEffect(()=>{ db.get("empresas").then(e=>{if(e&&e[0])setEmpresa(e[0]);}); load(); },[]);

  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  const guardar = async()=>{
    if(!form.nombre.trim()){showToast("El nombre es requerido","error");return;}
    setSaving(true);
    try{
      const p={...form,empresa_id:empresa?.id||null};
      if(editId){ await db.update("clientes",editId,p); showToast("Cliente actualizado ✔"); }
      else{ await db.insert("clientes",p); showToast("Cliente guardado ✔"); }
      setForm(null); setEditId(null); load();
    }catch(e){ showToast("Error al guardar","error"); }
    setSaving(false);
  };

  const del = async(id)=>{ if(!confirm("¿Eliminar cliente?"))return; await db.del("clientes",id); showToast("Eliminado"); load(); };
  const editar = (c)=>{ setForm({nombre:c.nombre,tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""}); setEditId(c.id); };

  const TIPOS = [{v:"empresa",l:"🏢 Empresa"},{v:"gobierno",l:"🏛️ Gobierno/ONG"},{v:"persona",l:"👤 Persona"}];

  return (
    <div>
      {form!==null?(
        <div style={{maxWidth:680}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:700}}>{editId?"✏️ Editar cliente":"➕ Nuevo cliente"}</div>
            <button onClick={()=>{setForm(null);setEditId(null);}} style={S.btn("ghost")}>← Volver</button>
          </div>
          <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.input} value={form.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre del cliente"/></Fld>
            <Fld label="TIPO DE CLIENTE">
              <select style={S.sel} value={form.tipo} onChange={e=>sf("tipo",e.target.value)}>
                {TIPOS.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </Fld>
            <Fld label="NIT"><input style={S.input} value={form.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
            <Fld label="TELÉFONO"><input style={S.input} value={form.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
            <Fld label="EMAIL"><input style={S.input} type="email" value={form.email} onChange={e=>sf("email",e.target.value)} placeholder="contacto@empresa.com"/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.input} value={form.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección completa"/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar cliente"}</button>
              <button onClick={()=>{setForm(null);setEditId(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      ):(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:700}}>👥 Directorio de Clientes</div>
            <button onClick={()=>setForm(EMPTY_C)} style={S.btn("primary")}>➕ Nuevo cliente</button>
          </div>
          <div style={S.card}>
            {loading?<Spinner/>:rows.length===0?(
              <div style={{textAlign:"center",padding:40,color:T.muted}}>
                <div style={{fontSize:32,marginBottom:8}}>👥</div>
                No hay clientes registrados.
                <br/><button onClick={()=>setForm(EMPTY_C)} style={{...S.btn("primary"),marginTop:14}}>Agregar primer cliente</button>
              </div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Cliente","Tipo","NIT","Teléfono","Email","Acciones"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(c=>(
                    <tr key={c.id}>
                      <td style={{...S.td,fontWeight:600}}>{c.nombre}</td>
                      <td style={S.td}><Badge color={c.tipo==="gobierno"?T.purple:c.tipo==="persona"?T.blue:T.second} bg={c.tipo==="gobierno"?T.purpleDim:c.tipo==="persona"?T.blueDim:T.secondDim} label={c.tipo==="gobierno"?"🏛️ Gobierno":c.tipo==="persona"?"👤 Persona":"🏢 Empresa"}/></td>
                      <td style={{...S.td,fontFamily:"monospace",fontSize:12,color:T.muted}}>{c.nit||"—"}</td>
                      <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                      <td style={{...S.td,color:T.sub,fontSize:12}}>{c.email||"—"}</td>
                      <td style={S.td}><div style={{display:"flex",gap:6}}><button onClick={()=>editar(c)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}}>✏️ Editar</button><button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}}>🗑️</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PageFlota({showToast}){
  const EMPTY_V = {placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0};
  const [rows,setRows]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [form,setForm]     = useState(null);
  const [saving,setSaving] = useState(false);
  const [empresa,setEmpresa] = useState(null);
  const [editId,setEditId] = useState(null);

  const load = async()=>{ setLoading(true); const d=await db.get("vehiculos"); setRows(Array.isArray(d)?d:[]); setLoading(false); };
  useEffect(()=>{ db.get("empresas").then(e=>{if(e&&e[0])setEmpresa(e[0]);}); load(); },[]);

  const sf = (k,v) => setForm(p=>({...p,[k]:v}));

  const guardar = async()=>{
    if(!form.placa.trim()){showToast("La placa es requerida","error");return;}
    setSaving(true);
    try{
      const p={...form,empresa_id:empresa?.id||null,km_actual:parseInt(form.km_actual)||0,anio:parseInt(form.anio)||2024};
      if(editId){ await db.update("vehiculos",editId,p); showToast("Vehículo actualizado ✔"); }
      else{ await db.insert("vehiculos",p); showToast("Vehículo registrado ✔"); }
      setForm(null); setEditId(null); load();
    }catch(e){ showToast("Error al guardar","error"); }
    setSaving(false);
  };

  const cambiarEstado = async(id,estado)=>{ await db.update("vehiculos",id,{estado}); showToast(`Estado → ${estado}`); load(); };
  const del = async(id)=>{ if(!confirm("¿Eliminar vehículo?"))return; await db.del("vehiculos",id); showToast("Eliminado"); load(); };
  const editar = (v)=>{ setForm({placa:v.placa,marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||2024,tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0}); setEditId(v.id); };

  const EST = { disponible:{c:T.accent,bg:T.accentDim,l:"Disponible"}, rentado:{c:T.blue,bg:T.blueDim,l:"Rentado"}, mantenimiento:{c:T.second,bg:T.secondDim,l:"Mantenim."} };
  const resumen = { disponible:rows.filter(r=>r.estado==="disponible").length, rentado:rows.filter(r=>r.estado==="rentado").length, mantenimiento:rows.filter(r=>r.estado==="mantenimiento").length };

  return (
    <div>
      {form!==null?(
        <div style={{maxWidth:680}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:700}}>{editId?"✏️ Editar vehículo":"➕ Registrar vehículo"}</div>
            <button onClick={()=>{setForm(null);setEditId(null);}} style={S.btn("ghost")}>← Volver</button>
          </div>
          <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Fld label="PLACA"><input style={S.input} value={form.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
            <Fld label="AÑO"><input style={S.input} type="number" value={form.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
            <Fld label="MARCA"><input style={S.input} value={form.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota, Hyundai..."/></Fld>
            <Fld label="MODELO"><input style={S.input} value={form.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="Hilux, Land Cruiser..."/></Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={form.tipo} onChange={e=>sf("tipo",e.target.value)}>
                {["Sedán","SUV","Pickup","Van","Bus","Microbús"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </Fld>
            <Fld label="ESTADO">
              <select style={S.sel} value={form.estado} onChange={e=>sf("estado",e.target.value)}>
                <option value="disponible">✅ Disponible</option>
                <option value="rentado">🔵 Rentado</option>
                <option value="mantenimiento">🟡 Mantenimiento</option>
              </select>
            </Fld>
            <Fld label="KILOMETRAJE ACTUAL" span2><input style={S.input} type="number" value={form.km_actual} onChange={e=>sf("km_actual",e.target.value)} placeholder="0"/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar vehículo"}</button>
              <button onClick={()=>{setForm(null);setEditId(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      ):(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:700}}>🚗 Gestión de Flota</div>
            <button onClick={()=>setForm(EMPTY_V)} style={S.btn("primary")}>➕ Registrar vehículo</button>
          </div>

          {/* Resumen */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
            {[{l:"Disponibles",n:resumen.disponible,c:T.accent,bg:T.accentDim},{l:"Rentados",n:resumen.rentado,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",n:resumen.mantenimiento,c:T.second,bg:T.secondDim}].map((s,i)=>(
              <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.n}</div>
                <div style={{fontSize:12,color:T.sub}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            {loading?<Spinner/>:rows.length===0?(
              <div style={{textAlign:"center",padding:40,color:T.muted}}>
                <div style={{fontSize:32,marginBottom:8}}>🚗</div>
                No hay vehículos registrados.
                <br/><button onClick={()=>setForm(EMPTY_V)} style={{...S.btn("primary"),marginTop:14}}>Registrar primer vehículo</button>
              </div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Vehículo","Placa","Tipo","Kilometraje","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map(v=>{
                    const est=EST[v.estado]||EST.disponible;
                    return(
                      <tr key={v.id}>
                        <td style={S.td}><div style={{fontWeight:600}}>{v.marca} {v.modelo}</div><div style={{fontSize:11,color:T.muted}}>{v.anio}</div></td>
                        <td style={{...S.td,fontFamily:"monospace",color:T.accent}}>{v.placa}</td>
                        <td style={S.td}>{v.tipo}</td>
                        <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                        <td style={S.td}><Badge color={est.c} bg={est.bg} label={est.l}/></td>
                        <td style={S.td}>
                          <select style={{...S.sel,width:"auto",padding:"4px 8px",fontSize:12}} value={v.estado} onChange={e=>cambiarEstado(v.id,e.target.value)}>
                            <option value="disponible">✅ Disponible</option>
                            <option value="rentado">🔵 Rentado</option>
                            <option value="mantenimiento">🟡 Mantenimiento</option>
                          </select>
                        </td>
                        <td style={S.td}><div style={{display:"flex",gap:6}}><button onClick={()=>editar(v)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}}>✏️</button><button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}}>🗑️</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══ DASHBOARD ═══
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
function PageReservas({showToast,empId}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");
  const load=async()=>{setLoading(true);const d=await dbGet("reservas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const chEst=async(id,estado)=>{await dbUpd("reservas",id,{estado});showToast(`→ ${estado}`);load();};
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada ✔":"Guardada ✔");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Pendientes",v:rows.filter(r=>r.estado==="pendiente").length,c:T.mut},{l:"Confirmadas",v:rows.filter(r=>r.estado==="confirmada").length,c:T.acc},{l:"En curso",v:rows.filter(r=>r.estado==="en_curso").length,c:T.blue},{l:"Completadas",v:rows.filter(r=>r.estado==="completada").length,c:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="📭" msg="Sin reservas" action="+ Nueva" onAction={()=>setVista("form")}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(r=>{const e=EST_RES[r.estado]||EST_RES.pendiente;const sig=FLUJO_RES[r.estado]||[];return(
            <div key={r.id} style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div><div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"🔑":"🗺"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" → "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div></div>
                <div style={{textAlign:"right"}}><Badge color={e.c} bg={e.bg} label={e.l}/><div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>{parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}</div>
              </div>
              <div style={{display:"flex",gap:6,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>✏️</button>
                <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>🗑️</button>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

// ═══ CALCULADORA ═══
function PageCalculadora({showToast,empId}){
  const [tab,setTab]=useState("renta");
  const [cli,setCli]=useState("");const [selVeh,setSelVeh]=useState(null);const [dias,setDias]=useState(1);const [custom,setCustom]=useState("");const [iva,setIva]=useState(5);const [pago,setPago]=useState("efectivo");const [exch,setExch]=useState(7.70);const [notas,setNotas]=useState("");const [saving,setSaving]=useState(false);
  const [tf,setTf]=useState({cliente:"",dias:1,veh:0,pil:0,hos:0,ali:0,galon:0,kpg:12,kmi:0,kmr:0,varios:0,iva:5,pago:"efectivo",exch:7.70,dept:"",muni:"",notas:""});
  const stf=(k,v)=>setTf(p=>({...p,[k]:v}));
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const rate=custom>0?parseFloat(custom):(selVeh?tarifaFn(selVeh,dias):0);
  const sub=dias*rate,ivaAmt=sub*iva/100,base=sub+ivaAmt,recTC=pago==="tarjeta"?base*0.05:0,tot=base+recTC;
  const d2=parseFloat(tf.dias)||0,kmi=parseFloat(tf.kmi)||0,kmr=parseFloat(tf.kmr)||0,tkm=kmi+kmr,kpg=parseFloat(tf.kpg)||1,gals=kpg>0?tkm/kpg:0,fuel=gals*(parseFloat(tf.galon)||0);
  const vT=d2*(parseFloat(tf.veh)||0),pT=d2*(parseFloat(tf.pil)||0),hT=d2*(parseFloat(tf.hos)||0),aT=d2*(parseFloat(tf.ali)||0),misc=parseFloat(tf.varios)||0,tsub=vT+pT+hT+aT+fuel+misc;
  const tiva=tsub*(parseFloat(tf.iva)||0)/100,tbase=tsub+tiva,ttc=tf.pago==="tarjeta"?tbase*0.05:0,ttot=tbase+ttc;
  const munis=tf.dept&&GT[tf.dept]?GT[tf.dept]:[];
  const guardar=async(estado)=>{
    const cn=tab==="renta"?cli:tf.cliente;
    if(!cn.trim()){showToast("Ingresa el nombre del cliente","err");return;}
    setSaving(true);
    const payload={empresa_id:empId,tipo:tab,cliente_nombre:cn,numero:`COT-${Date.now().toString().slice(-6)}`,dias:tab==="renta"?dias:d2,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,km_ida:kmi,km_regreso:kmr,departamento:tf.dept,municipio:tf.muni,gastos_varios:misc,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||5,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttc,total_gtq:tab==="renta"?tot:ttot,total_usd:(tab==="renta"?tot:ttot)/exch,estado,notas:tab==="renta"?notas:tf.notas};
    await dbIns("cotizaciones",payload);
    showToast("Guardada ✔");setSaving(false);
  };
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[{id:"renta",l:"🔑 Renta por días"},{id:"traslado",l:"🗺 Traslado/Viaje"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"primary":"ghost")}}>{t.l}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={S.card}>
          {tab==="renta"?(
            <div style={{display:"grid",gap:11}}>
              <Fld label="CLIENTE"><input style={S.inp} value={cli} onChange={e=>setCli(e.target.value)} placeholder="Nombre del cliente"/></Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(parseInt(e.target.value)||1)}/></Fld>
              <Fld label="VEHÍCULO"><select style={S.sel} value={selVeh?.id||""} onChange={e=>setSelVeh(CATALOGO.find(v=>v.id===e.target.value)||null)}><option value="">Seleccionar...</option>{CATALOGO.map(v=><option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}</select></Fld>
              <Fld label="PRECIO PERSONALIZADO"><input style={S.inp} type="number" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Vacío = catálogo"/></Fld>
              <Fld label="IVA"><select style={S.sel} value={iva} onChange={e=>setIva(parseInt(e.target.value))}><option value={12}>12% General</option><option value={5}>5% Pequeño Cont.</option><option value={0}>Sin IVA</option></select></Fld>
              <Fld label="TASA CAMBIO GTQ=1USD"><input style={S.inp} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/></Fld>
              <Fld label="MÉTODO PAGO"><div style={{display:"flex",gap:8}}><button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1,fontSize:12}}>💵 Efectivo</button><button onClick={()=>setPago("tarjeta")} style={{...S.btn(pago==="tarjeta"?"warn":"ghost"),flex:1,fontSize:12}}>💳 Tarjeta</button></div></Fld>
              <Fld label="NOTAS"><textarea style={{...S.inp,minHeight:44,resize:"vertical"}} value={notas} onChange={e=>setNotas(e.target.value)}/></Fld>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="CLIENTE" span2><input style={S.inp} value={tf.cliente} onChange={e=>stf("cliente",e.target.value)} placeholder="Nombre del cliente"/></Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e=>stf("varios",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="VEHÍCULO/DÍA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="PILOTO/DÍA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/DÍA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="ALIMENT./DÍA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="PRECIO/GALÓN"><input style={S.inp} type="number" value={tf.galon} onChange={e=>stf("galon",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="KM/GALÓN"><input style={S.inp} type="number" value={tf.kpg} onChange={e=>stf("kpg",e.target.value)} placeholder="12"/></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e=>stf("kmi",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e=>stf("kmr",e.target.value)} placeholder="0"/></Fld>
              <Fld label="DEPTO"><select style={S.sel} value={tf.dept} onChange={e=>{stf("dept",e.target.value);stf("muni","");}}><option value="">Seleccionar...</option>{Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}</select></Fld>
              <Fld label="MUNICIPIO"><select style={S.sel} value={tf.muni} onChange={e=>stf("muni",e.target.value)} disabled={!tf.dept}><option value="">Seleccionar...</option>{munis.map(m=><option key={m} value={m}>{m}</option>)}</select></Fld>
              <Fld label="IVA"><select style={S.sel} value={tf.iva} onChange={e=>stf("iva",e.target.value)}><option value="12">12%</option><option value="5">5%</option><option value="0">Sin IVA</option></select></Fld>
              <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e=>stf("exch",e.target.value)}/></Fld>
              <Fld label="PAGO" span2><div style={{display:"flex",gap:8}}><button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1,fontSize:12}}>💵 Efectivo</button><button onClick={()=>stf("pago","tarjeta")} style={{...S.btn(tf.pago==="tarjeta"?"warn":"ghost"),flex:1,fontSize:12}}>💳 Tarjeta</button></div></Fld>
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
            {tab==="renta"?(
              <>
                {cli&&<div style={{fontSize:13,fontWeight:700,marginBottom:6}}>👤 {cli}</div>}
                {selVeh&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {selVeh.nombre}</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  <div style={S.srow(false)}><span>Días</span><span>{dias}</span></div>
                  <div style={S.srow(false)}><span>Tarifa</span><span>Q {fmt(rate)}/día</span></div>
                  <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(sub)}</span></div>
                  <div style={S.srow(false)}><span>IVA {iva}%</span><span>Q {fmt(ivaAmt)}</span></div>
                  {pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo TC</span><span>Q {fmt(recTC)}</span></div>}
                </div>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(tot)}</span></div>
                  <div style={{fontSize:12,color:T.sub,marginTop:3}}>$ {fmt(exch>0?tot/exch:0)} USD</div>
                </div>
              </>
            ):(
              <>
                {tf.cliente&&<div style={{fontSize:13,fontWeight:700,marginBottom:8}}>👤 {tf.cliente}</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  {[["Vehículo",vT],["Piloto",pT],["Hospedaje",hT],["Aliment.",aT],["Combustible",fuel],["Varios",misc]].map(([l,v],i)=><div key={i} style={S.srow(false)}><span>{l}</span><span>Q {fmt(v)}</span></div>)}
                  <div style={S.div}/>
                  <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(tsub)}</span></div>
                  <div style={S.srow(false)}><span>IVA {tf.iva}%</span><span>Q {fmt(tiva)}</span></div>
                </div>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(ttot)}</span></div>
                  <div style={{fontSize:12,color:T.sub,marginTop:3}}>km: {Math.round(tkm)} · gal: {fmt(gals)}</div>
                </div>
              </>
            )}
          </div>
          <div style={S.card}>
            <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>{saving?"...":"💾 Borrador"}</button>
            <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"...":"✅ Guardar y enviar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                  <button onClick={()=>{window.open("mailto:?subject="+encodeURIComponent("Cotizacion "+r.numero)+"&body="+encodeURIComponent("Adjunto cotizacion "+r.numero+" por Q "+fmt(total)+". Oscar Galvez 502-31221538"));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>✉️</button>
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
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));dbGet("reservas","").then(d=>setReservas(Array.isArray(d)?d:[]));dbGet("cotizaciones","&estado=eq.aprobada").then(d=>setCotizaciones(Array.isArray(d)?d:[]));dbGet("movimientos_bancarios","&tipo=eq.ingreso").then(d=>setAnticipos(Array.isArray(d)?d:[]));load();},[]);
  const anular=async(fac,mot)=>{await dbUpd("facturas",fac.id,{estado:"anulada",motivo_anulacion:mot});showToast("Anulada");setMAnular(null);load();};
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id:empId,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" — "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada ✔":"Pago parcial ✔");setMPago(null);load();};
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorización","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>🔐 Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
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
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [saving,setSaving]=useState(false);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");
  const [f,setF]=useState({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const CATS=["ventas","combustible","mantenimiento","salarios","seguros","servicios","oficina","otros"];
  const CC={ventas:T.acc,combustible:T.sec,mantenimiento:T.blue,salarios:T.green,seguros:T.purple,servicios:T.acc,oficina:T.mut,otros:T.sub};
  useEffect(()=>{loadCuentas();},[]);
  const loadCuentas=async()=>{setLoading(true);const c=await dbGet("cuentas_bancarias");const arr=Array.isArray(c)?c:[];setCuentas(arr);if(arr.length>0){const first=arr[0];setCuentaAct(first);}setLoading(false);};
  const loadMovs=async(cid)=>{if(!cid)return;const m=await dbGet("movimientos_bancarios",`&cuenta_id=eq.${cid}`);setMovs(Array.isArray(m)?m:[]);};
  useEffect(()=>{if(cuentaAct)loadMovs(cuentaAct.id);},[cuentaAct?.id]);
  const guardarMov=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.monto)>0)){showToast("Descripción y monto requeridos","err");return;}setSaving(true);await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:cuentaAct.id,fecha:f.fecha,tipo:f.tipo,descripcion:f.descripcion,monto:parseFloat(f.monto),referencia:f.referencia,categoria:f.categoria,conciliado:f.conciliado,notas:f.notas});showToast("Guardado ✔");setSaving(false);setShowForm(false);setF({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});loadMovs(cuentaAct.id);};
  const conciliar=async(id,val)=>{await dbUpd("movimientos_bancarios",id,{conciliado:val});loadMovs(cuentaAct.id);};
  const movsFil=movs.filter(m=>{if(filtroT!=="todos"&&m.tipo!==filtroT)return false;if(filtroC==="conciliado"&&!m.conciliado)return false;if(filtroC==="pendiente"&&m.conciliado)return false;return true;});
  const ing=movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const saldoGTQ=cuentas.filter(c=>c.moneda==="GTQ").reduce((s,c)=>s+(parseFloat(c.saldo_actual)||0),0);
  return(
    <div>
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
              <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
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
export default function App(){
  const [pag,setPag]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [empId,setEmpId]=useState(null);
  const [sideOpen,setSideOpen]=useState(true);
  const [token,setToken]=useState(()=>localStorage.getItem("tzunun_token")||null);
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("tzunun_user"))||null;}catch{return null;}});

  const handleLogin=(tk,usr)=>{setToken(tk);setUser({email:usr?.email,name:usr?.user_metadata?.name||usr?.email});};
  const handleLogout=async()=>{if(token)await sbSignOut(token);localStorage.removeItem("tzunun_token");localStorage.removeItem("tzunun_user");setToken(null);setUser(null);};

  if(!token) return <LoginScreen onLogin={handleLogin}/>;

  useEffect(()=>{dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0])setEmpId(d[0].id);});},[]);
  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const NAV=[
    {id:"sep1",label:"PRINCIPAL",sep:true},
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"sep2",label:"OPERACIÓN",sep:true},
    {id:"flota",icon:"🚗",label:"Flota"},
    {id:"reservas",icon:"📅",label:"Reservas"},
    {id:"clientes",icon:"👥",label:"Clientes"},
    {id:"sep3",label:"PRESUPUESTOS",sep:true},
    {id:"calculadora",icon:"🧮",label:"Calculadora"},
    {id:"cotizaciones",icon:"📋",label:"Cotizaciones"},
    {id:"sep4",label:"FINANZAS",sep:true},
    {id:"facturacion",icon:"🧾",label:"Facturación FEL"},
    {id:"banca",icon:"🏦",label:"La Banca"},
    {id:"gastos",icon:"💸",label:"Gastos/Compras"},
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
    if(pag==="banca")        return <PageBanca showToast={showToast} empId={empId}/>;
    if(pag==="gastos")       return <PageGastos showToast={showToast} empId={empId}/>;
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
            {user&&<div style={{fontSize:12,color:T.sub}}>👤 {user.email}</div>}
            <div style={{fontSize:11,color:T.mut}}>{new Date().toLocaleDateString("es-GT",{day:"2-digit",month:"long",year:"numeric"})}</div>
            <button onClick={handleLogout} style={{background:"transparent",border:`1px solid ${T.bord}`,borderRadius:7,padding:"4px 10px",fontSize:11,color:T.sub,cursor:"pointer"}}>Salir 🚪</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {toast&&<Toast msg={toast.msg} type={toast.type}/>}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
