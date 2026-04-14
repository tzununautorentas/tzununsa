import { defineConfig }
    
import React, { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SB="https://fmijbpatkddkbxlkfoza.supabase.co";
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"};
const T={bg:"#0A0F1E",surf:"#111827",card:"#162032",bord:"#1E3A5F",acc:"#00D4AA",accDim:"#00D4AA22",sec:"#F59E0B",secDim:"#F59E0B22",red:"#EF4444",redDim:"#EF444422",blue:"#3B82F6",blueDim:"#3B82F622",purple:"#A855F7",purpleDim:"#A855F722",green:"#22C55E",greenDim:"#22C55E22",txt:"#F1F5F9",mut:"#64748B",sub:"#94A3B8"};
const fmt=n=>new Intl.NumberFormat("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const fmtK=n=>n>=1000?`Q ${(n/1000).toFixed(1)}k`:`Q ${fmt(n)}`;
const fmtD=s=>{if(!s)return"—";try{return new Date(s+"T12:00:00").toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});}catch{return s;}};
const today=()=>new Date().toISOString().slice(0,10);
const S={
  card:{background:T.card,border:`1px solid ${T.bord}`,borderRadius:14,padding:18},
  lbl:{fontSize:11,color:T.mut,display:"block",marginBottom:4,fontWeight:600},
  inp:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},
  sel:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},
  btn:v=>({padding:"8px 16px",borderRadius:8,border:v==="ghost"?`1px solid ${T.bord}`:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:v==="primary"?T.acc:v==="danger"?T.red:v==="blue"?T.blue:v==="purple"?T.purple:v==="warn"?T.sec:T.card,color:v==="primary"?"#0A0F1E":T.txt}),
  div:{borderTop:`1px solid ${T.bord}`,margin:"12px 0"},
  th:{textAlign:"left",fontSize:11,color:T.mut,padding:"0 10px 9px",fontWeight:600},
  td:{padding:"10px",borderTop:`1px solid ${T.bord}22`,fontSize:13},
  srow:b=>({display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:b?14:13,fontWeight:b?700:400,color:b?T.txt:T.sub}),
};
async function dbGet(t,q=""){try{const r=await fetch(`${SB}/rest/v1/${t}?order=created_at.desc${q}`,{headers:H});return r.json();}catch{return[];}}
async function dbIns(t,d){try{const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbUpd(t,id,d){try{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbDel(t,id){try{await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});}catch{}}
function Badge({color,bg,label,small}){return <span style={{display:"inline-block",padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:600,color,background:bg}}>{label}</span>;}
function Toast({msg,type}){if(!msg)return null;const c=type==="ok"?T.acc:T.red;return <div style={{background:T.card,border:`1px solid ${c}`,borderRadius:10,padding:"11px 18px",fontSize:13,color:c,fontWeight:600,marginBottom:14}}>{type==="ok"?"✅":"❌"} {msg}</div>;}
function Spinner(){return <div style={{textAlign:"center",padding:36,color:T.sub}}>⏳ Cargando...</div>;}
function Fld({label,children,span2}){return <div style={span2?{gridColumn:"span 2"}:{}}><label style={S.lbl}>{label}</label>{children}</div>;}
function Empty({icon,msg,action,onAction}){return <div style={{textAlign:"center",padding:48,color:T.sub}}><div style={{fontSize:36,marginBottom:10}}>{icon}</div><div style={{fontSize:14,marginBottom:6}}>{msg}</div>{action&&<button onClick={onAction} style={{...S.btn("primary"),marginTop:10,fontSize:12}}>{action}</button>}</div>;}
const GT={"Guatemala":["Guatemala","Mixco","Villa Nueva","San Miguel Petapa","Chinautla","Palencia","Fraijanes","Amatitlán","Villa Canales"],"Alta Verapaz":["Cobán","San Pedro Carchá","Tactic","Panzós","Senahú","Lanquín","Cahabón","Chisec","Fray Bartolomé de las Casas","Raxruhá"],"Baja Verapaz":["Salamá","Rabinal","Cubulco","Granados","San Jerónimo","Purulhá"],"Chimaltenango":["Chimaltenango","Comalapa","Tecpán","Patzún","Patzicía","Acatenango","Yepocapa","Zaragoza","El Tejar"],"Chiquimula":["Chiquimula","Jocotán","Camotán","Olopa","Esquipulas","Quezaltepeque","Ipala"],"El Progreso":["Guastatoya","Morazán","San Agustín Acasaguastlán","Sanarate"],"Escuintla":["Escuintla","Santa Lucía Cotzumalguapa","Tiquisate","La Gomera","San José","Iztapa","Palín","Nueva Concepción"],"Huehuetenango":["Huehuetenango","Chiantla","Cuilco","Jacaltenango","San Pedro Soloma","Todos Santos","Santa Eulalia","Aguacatán","Barillas"],"Izabal":["Puerto Barrios","Livingston","El Estor","Morales","Los Amates"],"Jalapa":["Jalapa","San Pedro Pinula","Monjas","Mataquescuintla"],"Jutiapa":["Jutiapa","Santa Catarina Mita","Asunción Mita","Jalpatagua","Comapa","Moyuta","Quesada"],"Petén":["Flores","San Benito","San Andrés","La Libertad","Dolores","San Luis","Sayaxché","Melchor de Mencos","Poptún"],"Quetzaltenango":["Quetzaltenango","Salcajá","Ostuncalco","Almolonga","Cantel","Zunil","Coatepeque","El Palmar"],"Quiché":["Santa Cruz del Quiché","Chichicastenango","Cunén","Nebaj","Sacapulas","Uspantán","Ixcán","Joyabaj"],"Retalhuleu":["Retalhuleu","San Sebastián","San Martín Zapotitlán","Champerico","Nuevo San Carlos"],"Sacatepéquez":["Antigua Guatemala","Jocotenango","Sumpango","San Lucas Sacatepéquez","Ciudad Vieja","Alotenango"],"San Marcos":["San Marcos","Comitancillo","Tacaná","Tajumulco","Malacatán","Catarina","Ayutla","Ocós","Pajapita"],"Santa Rosa":["Cuilapa","Barberena","Casillas","Chiquimulilla","Taxisco","Guazacapán","Nueva Santa Rosa"],"Sololá":["Sololá","Nahualá","Panajachel","San Lucas Tolimán","Santiago Atitlán","San Pedro La Laguna"],"Suchitepéquez":["Mazatenango","Cuyotenango","Santo Domingo Suchitepéquez","Samayac","Chicacao","Patulul","Río Bravo"],"Totonicapán":["Totonicapán","San Cristóbal Totonicapán","San Francisco El Alto","Momostenango","San Bartolo"],"Zacapa":["Zacapa","Estanzuela","Río Hondo","Gualán","Teculután","La Unión"]};
const CATALOGO=[{id:"c1",nombre:"Hyundai Verna (Sedán)",tipo:"Sedán",dia:300,sem:275,mes:250},{id:"c2",nombre:"Toyota RAV4 Híbrida (SUV)",tipo:"SUV",dia:600,sem:575,mes:550},{id:"c3",nombre:"Suzuki XL7 3 filas (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c4",nombre:"Suzuki Jimny 5p 4x4 (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c5",nombre:"Mitsubishi L200 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c6",nombre:"Mahindra Pikup 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c7",nombre:"Nissan Urvan Wide 16p",tipo:"Microbús",dia:750,sem:700,mes:650},{id:"c8",nombre:"Bus tipo County",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c9",nombre:"Bus tipo Pullman",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c10",nombre:"Bus Escolar",tipo:"Bus",dia:600,sem:550,mes:500}];
const EST_VEH={disponible:{c:T.acc,bg:T.accDim,l:"Disponible"},rentado:{c:T.blue,bg:T.blueDim,l:"Rentado"},mantenimiento:{c:T.sec,bg:T.secDim,l:"Mantenim."}};
const EST_RES={pendiente:{c:T.mut,bg:"#1E293B",l:"Pendiente"},confirmada:{c:T.acc,bg:T.accDim,l:"Confirmada"},en_curso:{c:T.blue,bg:T.blueDim,l:"En curso"},completada:{c:T.acc,bg:T.accDim,l:"Completada"},cancelada:{c:T.red,bg:T.redDim,l:"Cancelada"}};
const EST_FAC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},emitida:{c:T.blue,bg:T.blueDim,l:"Emitida"},certificada:{c:T.acc,bg:T.accDim,l:"Certificada"},pagada:{c:T.acc,bg:T.accDim,l:"Pagada"},anulada:{c:T.red,bg:T.redDim,l:"Anulada"}};
const FLUJO_RES={pendiente:[{v:"confirmada",l:"✓ Confirmar",s:"primary"},{v:"cancelada",l:"✗",s:"danger"}],confirmada:[{v:"en_curso",l:"▶ Iniciar",s:"blue"},{v:"cancelada",l:"✗",s:"danger"}],en_curso:[{v:"completada",l:"✓ Completar",s:"primary"},{v:"cancelada",l:"✗",s:"danger"}],completada:[],cancelada:[{v:"pendiente",l:"↺",s:"ghost"}]};
const CAT_GASTO=["combustible","mantenimiento","seguros","salarios","impuestos","servicios","llantas","repuestos","oficina","otros"];
const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:T.green,impuestos:T.red,servicios:T.acc,llantas:T.blue,repuestos:T.sec,oficina:T.mut,otros:T.sub};

// ══ DASHBOARD ═══════════════════════════════════════════════════════════════
function PageDashboard(){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    const [veh,res,cots,fac,movs,cuentas,clientes]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("movimientos_bancarios",""),dbGet("cuentas_bancarias",""),dbGet("clientes","")]);
    const v=Array.isArray(veh)?veh:[],r=Array.isArray(res)?res:[],c=Array.isArray(cots)?cots:[],f=Array.isArray(fac)?fac:[],m=Array.isArray(movs)?movs:[],cb=Array.isArray(cuentas)?cuentas:[],cl=Array.isArray(clientes)?clientes:[];
    const ingMes=m.filter(x=>x.tipo==="ingreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const egMes=m.filter(x=>x.tipo==="egreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const saldoGTQ=cb.filter(x=>x.moneda==="GTQ").reduce((s,x)=>s+(parseFloat(x.saldo_actual)||0),0);
    const facTotal=f.filter(x=>x.estado!=="anulada"&&x.estado!=="borrador").reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const vMant=v.filter(x=>x.estado==="mantenimiento").length;
    const rPend=r.filter(x=>x.estado==="pendiente").length;
    const cotEnv=c.filter(x=>x.estado==="enviada").length;
    const pendConc=m.filter(x=>!x.conciliado).length;
    const alertas=[];
    if(vMant>0)alertas.push({icon:"🔧",msg:`${vMant} vehículo${vMant>1?"s":""} en mantenimiento`,c:T.sec});
    if(rPend>0)alertas.push({icon:"📅",msg:`${rPend} reserva${rPend>1?"s":""} pendiente${rPend>1?"s":""} de confirmar`,c:T.sec});
    if(cotEnv>0)alertas.push({icon:"📋",msg:`${cotEnv} cotización${cotEnv>1?"es":""} esperando aprobación`,c:T.blue});
    if(pendConc>0)alertas.push({icon:"🏦",msg:`${pendConc} movimientos sin conciliar`,c:T.sec});
    const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const chartIE=meses.map((mes,i)=>({mes,Ingresos:Math.round(m.filter(x=>x.tipo==="ingreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0)),Egresos:Math.round(m.filter(x=>x.tipo==="egreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0))})).filter(x=>x.Ingresos>0||x.Egresos>0);
    const chartFlota=[{name:"Disponible",value:v.filter(x=>x.estado==="disponible").length,color:T.acc},{name:"Rentado",value:v.filter(x=>x.estado==="rentado").length,color:T.blue},{name:"Mantenim.",value:vMant,color:T.sec}].filter(x=>x.value>0);
    setD({v,r,c,f,cl,cb,ingMes,egMes,saldoGTQ,facTotal,alertas,chartIE,chartFlota,vDisp:v.filter(x=>x.estado==="disponible").length,vRent:v.filter(x=>x.estado==="rentado").length,vMant,rActivas:r.filter(x=>["en_curso","confirmada"].includes(x.estado)).length,cotApr:c.filter(x=>x.estado==="aprobada").length,cotEnv,pendConc});
    setLoading(false);
  };
  if(loading)return <Spinner/>;
  return(
    <div>
      {d.alertas.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{d.alertas.map((a,i)=><div key={i} style={{background:T.card,border:`1px solid ${a.c}44`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{a.icon}</span><span style={{fontSize:13}}>{a.msg}</span><div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:a.c}}/></div>)}</div>}
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>OPERACIÓN</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[{icon:"🚗",l:"Flota total",v:d.v.length,c:T.acc,bg:T.accDim},{icon:"✅",l:"Disponibles",v:d.vDisp,c:T.acc,bg:T.accDim},{icon:"🔑",l:"Rentados",v:d.vRent,c:T.blue,bg:T.blueDim},{icon:"📅",l:"Reservas activas",v:d.rActivas,c:T.blue,bg:T.blueDim},{icon:"👥",l:"Clientes",v:d.cl.length,c:T.purple,bg:T.purpleDim}].map((s,i)=>(
          <div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>FINANZAS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{icon:"💰",l:"Ingresos",v:fmtK(d.ingMes),c:T.acc,bg:T.accDim},{icon:"💸",l:"Egresos",v:fmtK(d.egMes),c:T.red,bg:T.redDim},{icon:"🏦",l:"Saldo GTQ",v:fmtK(d.saldoGTQ),c:T.acc,bg:T.accDim},{icon:"🧾",l:"Facturado",v:fmtK(d.facTotal),c:T.purple,bg:T.purpleDim}].map((s,i)=>(
          <div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos vs Egresos</div>
          {d.chartIE.length>0?(<ResponsiveContainer width="100%" height={180}><BarChart data={d.chartIE}><XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/><Tooltip contentStyle={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="Ingresos" fill={T.acc} radius={[4,4,0,0]}/><Bar dataKey="Egresos" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>):<div style={{textAlign:"center",padding:40,color:T.sub,fontSize:13}}>Sin datos de movimientos aún</div>}
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Estado de Flota</div>
          {d.chartFlota.length>0?(<><ResponsiveContainer width="100%" height={130}><PieChart><Pie data={d.chartFlota} cx="50%" cy="50%" innerRadius={38} outerRadius={55} dataKey="value" paddingAngle={3}>{d.chartFlota.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>{d.chartFlota.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div><span style={{fontWeight:700,color:e.color}}>{e.value}</span></div>)}</>):<div style={{textAlign:"center",padding:30,color:T.sub,fontSize:12}}>Sin datos</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Reservas Recientes</div>{d.r.slice(0,4).map(r=>{const e=EST_RES[r.estado]||EST_RES.pendiente;return <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bord}22`}}><div><div style={{fontSize:13,fontWeight:600}}>{r.cliente_nombre}</div><div style={{fontSize:11,color:T.sub}}>{r.tipo==="renta"?"🔑":"🗺"} {fmtD(r.fecha_inicio)}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.acc}}>Q {fmt(r.monto)}</div><Badge color={e.c} bg={e.bg} label={e.l} small/></div></div>;})}</div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Cotizaciones Recientes</div>{d.c.slice(0,4).map(c=>{const e={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"}}[c.estado]||{c:T.mut,bg:"#1E293B",l:"—"};return <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bord}22`}}><div><div style={{fontSize:13,fontWeight:600}}>{c.cliente_nombre}</div><div style={{fontSize:11,color:T.sub,fontFamily:"monospace"}}>{c.numero}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.acc}}>Q {fmt(c.total_gtq)}</div><Badge color={e.c} bg={e.bg} label={e.l} small/></div></div>;})}</div>
      </div>
    </div>
  );
}

// ══ CALCULADORA ══════════════════════════════════════════════════════════════
function PageCalculadora({showToast,empId}){
  const [tab,setTab]=useState("renta");
  const [cli,setCli]=useState(""); const [selVeh,setSelVeh]=useState(null); const [dias,setDias]=useState(1); const [custom,setCustom]=useState(""); const [iva,setIva]=useState(12); const [pago,setPago]=useState("efectivo"); const [exch,setExch]=useState(7.70); const [notas,setNotas]=useState(""); const [saving,setSaving]=useState(false);
  const [tf,setTf]=useState({cliente:"",dias:1,veh:0,pil:0,hos:0,ali:0,galon:0,kpg:12,kmi:0,kmr:0,varios:0,iva:12,pago:"efectivo",exch:7.70,dept:"",muni:"",notas:""});
  const stf=(k,v)=>setTf(p=>({...p,[k]:v}));
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const rate=custom>0?parseFloat(custom):(selVeh?tarifaFn(selVeh,dias):0);
  const sub=dias*rate,ivaAmt=sub*iva/100,base=sub+ivaAmt,recTC=pago==="tarjeta"?base*0.05:0,tot=base+recTC,usd=exch>0?tot/exch:0;
  const d2=parseFloat(tf.dias)||0,kmi=parseFloat(tf.kmi)||0,kmr=parseFloat(tf.kmr)||0,tkm=kmi+kmr,kpg=parseFloat(tf.kpg)||1,gals=kpg>0?tkm/kpg:0,fuel=gals*(parseFloat(tf.galon)||0);
  const vT=d2*(parseFloat(tf.veh)||0),pT=d2*(parseFloat(tf.pil)||0),hT=d2*(parseFloat(tf.hos)||0),aT=d2*(parseFloat(tf.ali)||0),misc=parseFloat(tf.varios)||0,tsub=vT+pT+hT+aT+fuel+misc;
  const tiva=tsub*(parseFloat(tf.iva)||0)/100,tbase=tsub+tiva,ttc=tf.pago==="tarjeta"?tbase*0.05:0,ttot=tbase+ttc,tusd=(parseFloat(tf.exch)||7.70)>0?ttot/(parseFloat(tf.exch)||7.70):0;
  const munis=tf.dept&&GT[tf.dept]?GT[tf.dept]:[];
  const guardar=async(estado)=>{
    const cn=tab==="renta"?cli:tf.cliente;
    if(!cn.trim()){showToast("Ingresa el nombre del cliente","err");return;}
    setSaving(true);
    const payload={empresa_id:empId,tipo:tab,cliente_nombre:cn,numero:`COT-${Date.now().toString().slice(-6)}`,dias:tab==="renta"?dias:d2,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,km_ida:kmi,km_regreso:kmr,departamento:tf.dept,municipio:tf.muni,gastos_varios:misc,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||12,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttc,total_gtq:tab==="renta"?tot:ttot,total_usd:tab==="renta"?usd:tusd,estado,notas:tab==="renta"?notas:tf.notas};
    await dbIns("cotizaciones",payload);
    showToast(estado==="enviada"?"Guardada y enviada ✔":"Borrador guardado ✔");
    setSaving(false);
  };
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[{id:"renta",l:"🔑 Renta por días"},{id:"traslado",l:"🗺 Traslado / Viaje"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"primary":"ghost"),fontSize:13}}>{t.l}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={S.card}>
          {tab==="renta"?(
            <div style={{display:"grid",gap:11}}>
              <Fld label="CLIENTE"><input style={S.inp} value={cli} onChange={e=>setCli(e.target.value)} placeholder="Nombre del cliente"/></Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(parseInt(e.target.value)||1)}/></Fld>
              <Fld label="VEHÍCULO DEL CATÁLOGO"><select style={S.sel} value={selVeh?.id||""} onChange={e=>setSelVeh(CATALOGO.find(v=>v.id===e.target.value)||null)}><option value="">Seleccionar...</option>{CATALOGO.map(v=><option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}</select></Fld>
              {selVeh&&<div style={{background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:8,padding:"10px 14px",fontSize:12,display:"flex",gap:20}}>{[["1-7 días",selVeh.dia],["8-29 días",selVeh.sem],["30+ días",selVeh.mes]].map(([r,p])=><div key={r}><div style={{fontSize:10,color:T.mut}}>{r}</div><div style={{fontWeight:700,color:T.acc}}>Q {fmt(p)}/día</div></div>)}</div>}
              <Fld label="PRECIO PERSONALIZADO (opcional)"><input style={S.inp} type="number" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Deja vacío para precio catálogo"/></Fld>
              <Fld label="IVA"><select style={S.sel} value={iva} onChange={e=>setIva(parseInt(e.target.value))}><option value={12}>12% Régimen General</option><option value={5}>5% Pequeño Contribuyente</option><option value={0}>Sin IVA</option></select></Fld>
              <Fld label="MÉTODO DE PAGO"><div style={{display:"flex",gap:8}}><button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1,fontSize:12}}>💵 Efectivo/Depósito</button><button onClick={()=>setPago("tarjeta")} style={{...S.btn(pago==="tarjeta"?"warn":"ghost"),flex:1,fontSize:12}}>💳 Tarjeta (+5%)</button></div></Fld>
              <Fld label="TASA CAMBIO GTQ=1USD"><input style={S.inp} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/></Fld>
              <Fld label="NOTAS"><textarea style={{...S.inp,minHeight:50,resize:"vertical"}} value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Observaciones..."/></Fld>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="CLIENTE" span2><input style={S.inp} value={tf.cliente} onChange={e=>stf("cliente",e.target.value)} placeholder="Nombre del cliente"/></Fld>
              <Fld label="DÍAS"><input style={S.inp} type="number" min="1" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e=>stf("varios",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="VEHÍCULO/DÍA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="PILOTO/DÍA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/DÍA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="ALIMENTACIÓN/DÍA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="PRECIO/GALÓN"><input style={S.inp} type="number" value={tf.galon} onChange={e=>stf("galon",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="KM POR GALÓN"><input style={S.inp} type="number" value={tf.kpg} onChange={e=>stf("kpg",e.target.value)} placeholder="12"/></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e=>stf("kmi",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e=>stf("kmr",e.target.value)} placeholder="0"/></Fld>
              <Fld label="DEPARTAMENTO"><select style={S.sel} value={tf.dept} onChange={e=>{stf("dept",e.target.value);stf("muni","");}}><option value="">Seleccionar...</option>{Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}</select></Fld>
              <Fld label="MUNICIPIO"><select style={S.sel} value={tf.muni} onChange={e=>stf("muni",e.target.value)} disabled={!tf.dept}><option value="">Seleccionar...</option>{munis.map(m=><option key={m} value={m}>{m}</option>)}</select></Fld>
              <Fld label="IVA"><select style={S.sel} value={tf.iva} onChange={e=>stf("iva",e.target.value)}><option value="12">12% General</option><option value="5">5% Pequeño Contribuyente</option><option value="0">Sin IVA</option></select></Fld>
              <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e=>stf("exch",e.target.value)}/></Fld>
              <Fld label="PAGO" span2><div style={{display:"flex",gap:8}}><button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1,fontSize:12}}>💵 Efectivo</button><button onClick={()=>stf("pago","tarjeta")} style={{...S.btn(tf.pago==="tarjeta"?"warn":"ghost"),flex:1,fontSize:12}}>💳 Tarjeta (+5%)</button></div></Fld>
              <Fld label="NOTAS" span2><textarea style={{...S.inp,minHeight:44,resize:"vertical"}} value={tf.notas} onChange={e=>stf("notas",e.target.value)}/></Fld>
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
                  <div style={S.srow(false)}><span>Días</span><span>{dias} día{dias!==1?"s":""}</span></div>
                  <div style={S.srow(false)}><span>Tarifa</span><span>Q {fmt(rate)}/día</span></div>
                  <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(sub)}</span></div>
                  <div style={S.srow(false)}><span>IVA ({iva}%)</span><span>Q {fmt(ivaAmt)}</span></div>
                  {pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo TC (5%)</span><span>Q {fmt(recTC)}</span></div>}
                </div>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"13px 16px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:21,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(tot)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>USD (Q{exch}=1)</span><span>$ {fmt(usd)}</span></div>
                </div>
                {pago==="tarjeta"&&<div style={{background:T.accDim,border:`1px solid ${T.acc}33`,borderRadius:9,padding:"9px 14px",fontSize:12}}><div style={{fontSize:11,fontWeight:700,color:T.acc}}>PRECIO BENEFICIO efectivo/depósito/transferencia</div><div style={{fontSize:16,fontWeight:800,color:T.acc,marginTop:2}}>Q {fmt(base)}</div><div style={{fontSize:11,color:T.sub}}>$ {fmt(exch>0?base/exch:0)} USD</div></div>}
              </>
            ):(
              <>
                {tf.cliente&&<div style={{fontSize:13,fontWeight:700,marginBottom:8}}>👤 {tf.cliente}</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  {[[`Vehículo (×${d2}d)`,vT],[`Piloto (×${d2}d)`,pT],[`Hospedaje (×${d2}d)`,hT],[`Aliment. (×${d2}d)`,aT],[`Comb. (${fmt(gals)}gal)`,fuel],["Varios",misc]].map(([l,v],i)=><div key={i} style={S.srow(false)}><span>{l}</span><span>Q {fmt(v)}</span></div>)}
                  <div style={S.div}/>
                  <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(tsub)}</span></div>
                  <div style={S.srow(false)}><span>IVA ({tf.iva}%)</span><span>Q {fmt(tiva)}</span></div>
                  {tf.pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo TC 5%</span><span>Q {fmt(ttc)}</span></div>}
                </div>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"13px 16px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:21,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(ttot)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>USD (Q{tf.exch}=1)</span><span>$ {fmt(tusd)}</span></div>
                </div>
                <div style={{background:T.surf,borderRadius:9,padding:11,fontSize:12}}>
                  <div style={S.srow(false)}><span>Km total</span><span>{Math.round(tkm)} km</span></div>
                  <div style={S.srow(false)}><span>Galones</span><span>{fmt(gals)} gal</span></div>
                  {tf.dept&&<div style={S.srow(false)}><span>Destino</span><span>{tf.muni?tf.muni+", ":""}{tf.dept}</span></div>}
                </div>
              </>
            )}
          </div>
          <div style={S.card}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%"}}>{saving?"Guardando...":"💾 Guardar borrador"}</button>
              <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"✅ Guardar y enviar"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ COTIZACIONES ═════════════════════════════════════════════════════════════
function PageCotizaciones({showToast}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [filtro,setFiltro]=useState("todas");
  const load=async()=>{setLoading(true);const d=await dbGet("cotizaciones");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("cotizaciones",id);showToast("Eliminada");load();};
  const chEst=async(id,estado)=>{await dbUpd("cotizaciones",id,{estado});showToast(`→ ${estado}`);load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const EST={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"}};
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Enviadas",v:rows.filter(r=>r.estado==="enviada").length,c:T.blue},{l:"Aprobadas",v:rows.filter(r=>r.estado==="aprobada").length,c:T.acc},{l:"Borradores",v:rows.filter(r=>r.estado==="borrador").length,c:T.mut}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","enviada","aprobada","rechazada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:12,padding:"6px 14px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12,marginLeft:"auto"}}>↺</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="📭" msg="Sin cotizaciones"/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["N°","Cliente","Tipo","Total GTQ","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(c=>{const e=EST[c.estado]||EST.borrador;return <tr key={c.id}><td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.acc}}>{c.numero}</td><td style={{...S.td,fontWeight:600}}>{c.cliente_nombre}</td><td style={S.td}><Badge color={c.tipo==="renta"?T.acc:T.blue} bg={c.tipo==="renta"?T.accDim:T.blueDim} label={c.tipo==="renta"?"Renta":"Traslado"} small/></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(c.total_gtq)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",gap:4}}>{c.estado==="enviada"&&<><button onClick={()=>chEst(c.id,"aprobada")} style={{...S.btn("primary"),padding:"3px 8px",fontSize:11}}>✅</button><button onClick={()=>chEst(c.id,"rechazada")} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>✗</button></>}<button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>🗑️</button></div></td></tr>;})}</tbody></table></div>
      )}
    </div>
  );
}

// ══ RESERVAS ═════════════════════════════════════════════════════════════════
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
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>{f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="📭" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>{setEditItem(null);setVista("form");}}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(r=>{const e=EST_RES[r.estado]||EST_RES.pendiente;const sig=FLUJO_RES[r.estado]||[];return(
            <div key={r.id} style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero||"—"}</div>
                  <div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>{r.tipo==="renta"?"🔑":"🗺"} {fmtD(r.fecha_inicio)}{r.fecha_fin?` → ${fmtD(r.fecha_fin)}`:""}</div>
                  {r.vehiculo_nombre&&<div style={{fontSize:12,color:T.sub}}>🚗 {r.vehiculo_nombre}</div>}
                  {r.destino&&<div style={{fontSize:12,color:T.sub}}>📍 {r.origen||""}{r.destino?` → ${r.destino}`:""}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <Badge color={e.c} bg={e.bg} label={e.l}/>
                  <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                  {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 12px"}}>{s.l}</button>)}
                <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>✏️ Editar</button>
                <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>🗑️</button>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

function FormReserva({initial,empId,onSave,onCancel}){
  const EMPTY={cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"",destino:"",departamento:"",municipio:"",anticipo:"",estado:"pendiente",notas:"",iva:12,pago:"efectivo",exch:7.70};
  const [f,setF]=useState(initial?{...EMPTY,...initial,iva:initial.tasa_iva||12,pago:initial.metodo_pago||"efectivo",exch:initial.tasa_cambio||7.70,fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):""}:EMPTY);
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];
  const calcDias=(fi,ff)=>{if(!fi||!ff)return 0;const d=Math.ceil((new Date(ff)-new Date(fi))/(1000*60*60*24));return d>0?d:0;};
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const dias=calcDias(f.fecha_inicio,f.fecha_fin),rate=tarifaFn(vehObj,dias),sub=dias*rate,ivaAmt=sub*f.iva/100,base=sub+ivaAmt,recTC=f.pago==="tarjeta"?base*0.05:0,tot=base+recTC,saldo=tot-(parseFloat(f.anticipo)||0);
  const guardar=async()=>{
    if(!f.cliente_nombre.trim()){alert("Nombre del cliente requerido");return;}
    if(!f.fecha_inicio){alert("Fecha de inicio requerida");return;}
    setSaving(true);
    const p={empresa_id:empId,cliente_nombre:f.cliente_nombre,tipo:f.tipo,vehiculo_nombre:f.vehiculo_nombre,conductor_nombre:f.conductor_nombre,numero:initial?.id?undefined:`RES-${Date.now().toString().slice(-6)}`,fecha_inicio:new Date(f.fecha_inicio+"T"+(f.hora_recogida||"08:00")+":00").toISOString(),fecha_fin:f.fecha_fin?new Date(f.fecha_fin+"T23:59:00").toISOString():null,hora_recogida:f.hora_recogida,origen:f.origen,destino:f.destino,departamento:f.departamento,municipio:f.municipio,monto:tot,anticipo:parseFloat(f.anticipo)||0,saldo,tasa_iva:f.iva,metodo_pago:f.pago,tasa_cambio:f.exch,estado:f.estado,notas:f.notas};
    if(initial?.id)await dbUpd("reservas",initial.id,p);else await dbIns("reservas",p);
    setSaving(false);onSave();
  };
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc}}>{initial?.id?"Editar reserva":"Nueva reserva"}</div>
          <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <Fld label="CLIENTE" span2><input style={S.inp} value={f.cliente_nombre} onChange={e=>sf("cliente_nombre",e.target.value)} placeholder="Nombre del cliente"/></Fld>
          <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}><option value="renta">Renta de vehículo</option><option value="traslado">Traslado con conductor</option></select></Fld>
          <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="en_curso">En curso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select></Fld>
          <Fld label="VEHÍCULO" span2><select style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}><option value="">Seleccionar...</option>{CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre}</option>)}</select></Fld>
          <Fld label="CONDUCTOR"><input style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del conductor"/></Fld>
          <Fld label="HORA RECOGIDA"><input style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/></Fld>
          <Fld label="FECHA ENTREGA"><input style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/></Fld>
          <Fld label="FECHA DEVOLUCIÓN"><input style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/></Fld>
          <Fld label="ORIGEN" span2><input style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Punto de partida"/></Fld>
          <Fld label="DESTINO" span2><input style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Destino"/></Fld>
          <Fld label="DEPARTAMENTO"><select style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}><option value="">Seleccionar...</option>{Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}</select></Fld>
          <Fld label="MUNICIPIO"><select style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}><option value="">Seleccionar...</option>{munis.map(m=><option key={m} value={m}>{m}</option>)}</select></Fld>
          <Fld label="IVA"><select style={S.sel} value={f.iva} onChange={e=>sf("iva",parseInt(e.target.value))}><option value={12}>12% General</option><option value={5}>5% Pequeño Contribuyente</option><option value={0}>Sin IVA</option></select></Fld>
          <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/></Fld>
          <Fld label="MÉTODO PAGO" span2><div style={{display:"flex",gap:8}}><button onClick={()=>sf("pago","efectivo")} style={{...S.btn(f.pago==="efectivo"?"primary":"ghost"),flex:1,fontSize:12}}>💵 Efectivo/Depósito</button><button onClick={()=>sf("pago","tarjeta")} style={{...S.btn(f.pago==="tarjeta"?"warn":"ghost"),flex:1,fontSize:12}}>💳 Tarjeta (+5%)</button></div></Fld>
          <Fld label="ANTICIPO (GTQ)"><input style={S.inp} type="number" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/></Fld>
          <Fld label="NOTAS"><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones"/></Fld>
          <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar reserva"}</button>
            <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
        {f.cliente_nombre&&<div style={{fontSize:13,fontWeight:700,marginBottom:4}}>👤 {f.cliente_nombre}</div>}
        {vehObj&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre}</div>}
        {dias>0&&vehObj?(
          <>
            <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
              <div style={S.srow(false)}><span>Días</span><span style={{fontWeight:700,color:T.acc}}>{dias} día{dias!==1?"s":""}</span></div>
              <div style={S.srow(false)}><span>Tarifa {dias>=30?"mensual":dias>=8?"semanal":"diaria"}</span><span>Q {fmt(rate)}/día</span></div>
              <div style={S.div}/>
              <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(sub)}</span></div>
              <div style={S.srow(false)}><span>IVA ({f.iva}%)</span><span>Q {fmt(ivaAmt)}</span></div>
              {f.pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo TC (5%)</span><span>Q {fmt(recTC)}</span></div>}
            </div>
            <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"13px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(tot)}</span></div>
              <div style={{fontSize:12,color:T.sub,marginTop:3}}>$ {fmt(f.exch>0?tot/f.exch:0)} USD</div>
            </div>
            <div style={{background:T.surf,borderRadius:9,padding:11,fontSize:12}}>
              <div style={S.srow(false)}><span>Anticipo</span><span>Q {fmt(parseFloat(f.anticipo)||0)}</span></div>
              <div style={S.srow(true)}><span>Saldo pendiente</span><span style={{color:saldo>0?T.sec:T.acc}}>Q {fmt(saldo)}</span></div>
            </div>
          </>
        ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:13}}>Selecciona vehículo y fechas para ver el cálculo</div>}
      </div>
    </div>
  );
}

// ══ CLIENTES ═════════════════════════════════════════════════════════════════
function PageClientes({showToast,empId}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);
  const [f,setF]=useState({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("clientes");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const editar=c=>{setF({nombre:c.nombre||"",tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""});setEditItem(c);setVista("form");};
  const guardar=async()=>{if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}setSaving(true);const p={...f,empresa_id:empId};if(editItem?.id)await dbUpd("clientes",editItem.id,p);else await dbIns("clientes",p);showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();};
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("clientes",id);showToast("Eliminado");load();};
  const TC={empresa:{c:T.sec,bg:T.secDim,l:"Empresa"},gobierno:{c:T.blue,bg:T.blueDim,l:"Gobierno/ONG"},persona:{c:T.acc,bg:T.accDim,l:"Persona"}};
  if(vista==="form")return(
    <div style={{maxWidth:600}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar cliente":"Nuevo cliente"}</div><button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>← Volver</button></div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre"/></Fld>
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}><option value="empresa">Empresa</option><option value="gobierno">Gobierno / ONG</option><option value="persona">Persona</option></select></Fld>
        <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
        <Fld label="TELÉFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
        <Fld label="EMAIL"><input style={S.inp} value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="correo@cliente.com"/></Fld>
        <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección"/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar"}</button><button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>Directorio de Clientes ({rows.length})</div>
        <button onClick={()=>{setF({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo cliente</button>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="👥" msg="Sin clientes" action="+ Agregar" onAction={()=>setVista("form")}/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Cliente","Tipo","NIT","Teléfono","Email",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(c=>{const tc=TC[c.tipo]||TC.empresa;return <tr key={c.id}><td style={{...S.td,fontWeight:600}}>{c.nombre}</td><td style={S.td}><Badge color={tc.c} bg={tc.bg} label={tc.l} small/></td><td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td><td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td><td style={{...S.td,color:T.sub,fontSize:12}}>{c.email||"—"}</td><td style={S.td}><div style={{display:"flex",gap:4}}><button onClick={()=>editar(c)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>✏️</button><button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>🗑️</button></div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ══ FLOTA ════════════════════════════════════════════════════════════════════
function PageFlota({showToast,empId}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);
  const [f,setF]=useState({placa:"",marca:"",modelo:"",anio:2024,tipo:"SUV",estado:"disponible",km_actual:0});const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const load=async()=>{setLoading(true);const d=await dbGet("vehiculos","&order=created_at.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const editar=v=>{setF({placa:v.placa||"",marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||2024,tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0});setEditItem(v);setVista("form");};
  const guardar=async()=>{if(!f.placa.trim()){showToast("Placa requerida","err");return;}setSaving(true);const p={...f,empresa_id:empId,anio:parseInt(f.anio)||2024,km_actual:parseInt(f.km_actual)||0};if(editItem?.id)await dbUpd("vehiculos",editItem.id,p);else await dbIns("vehiculos",p);showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();};
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast(`→ ${estado}`);setTimeout(load,300);};
  const res={dis:rows.filter(r=>r.estado==="disponible").length,ren:rows.filter(r=>r.estado==="rentado").length,man:rows.filter(r=>r.estado==="mantenimiento").length};
  if(vista==="form")return(
    <div style={{maxWidth:580}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar vehículo":"Registrar vehículo"}</div><button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>← Volver</button></div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="PLACA"><input style={S.inp} value={f.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
        <Fld label="AÑO"><input style={S.inp} type="number" value={f.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
        <Fld label="MARCA"><input style={S.inp} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota"/></Fld>
        <Fld label="MODELO"><input style={S.inp} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="RAV4"/></Fld>
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="disponible">✅ Disponible</option><option value="rentado">🔵 Rentado</option><option value="mantenimiento">🟡 Mantenimiento</option></select></Fld>
        <Fld label="KM ACTUAL" span2><input style={S.inp} type="number" value={f.km_actual} onChange={e=>sf("km_actual",e.target.value)}/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"💾 Guardar"}</button><button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Disponibles",v:res.dis,c:T.acc,bg:T.accDim},{l:"Rentados",v:res.ren,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",v:res.man,c:T.sec,bg:T.secDim}].map((s,i)=><div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"13px 18px",display:"flex",gap:12,alignItems:"center"}}><div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:T.sub}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} vehículos)</div>
        <div style={{display:"flex",gap:8}}><button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button><button onClick={()=>{setF({placa:"",marca:"",modelo:"",anio:2024,tipo:"SUV",estado:"disponible",km_actual:0});setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Registrar</button></div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🚗" msg="Sin vehículos" action="+ Registrar" onAction={()=>setVista("form")}/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Vehículo","Placa","Tipo","Km","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(v=>{const e=EST_VEH[v.estado]||EST_VEH.disponible;return <tr key={v.id}><td style={S.td}><div style={{fontWeight:600}}>{v.marca} {v.modelo}</div><div style={{fontSize:11,color:T.mut}}>{v.anio}</div></td><td style={{...S.td,fontFamily:"monospace",color:T.acc}}>{v.placa}</td><td style={S.td}>{v.tipo}</td><td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",gap:4,alignItems:"center"}}><select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={e=>chEst(v.id,e.target.value)}><option value="disponible">✅ Disponible</option><option value="rentado">🔵 Rentado</option><option value="mantenimiento">🟡 Mantenim.</option></select><button onClick={()=>editar(v)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>✏️</button><button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>🗑️</button></div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ══ FACTURACIÓN FEL ══════════════════════════════════════════════════════════
function PageFacturacion({showToast,empId}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [editItem,setEditItem]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");const [saving,setSaving]=useState(false);
  const [f,setF]=useState({serie:"TZAR2026",tipo_dte:"FACT",fecha_emision:today(),nit_receptor:"",nombre_receptor:"",descripcion_servicio:"",cantidad:1,precio_unitario:"",tasa_iva:12,metodo_pago:"efectivo",tasa_cambio:7.70,regimen:"GENERAL",estado:"borrador",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const sub=(parseFloat(f.cantidad)||0)*(parseFloat(f.precio_unitario)||0);
  const ivaAmt=sub*(parseFloat(f.tasa_iva)||0)/100;
  const recTC=f.metodo_pago==="tarjeta"?(sub+ivaAmt)*0.05:0;
  const tot=sub+ivaAmt+recTC;
  const handleRegimen=r=>{sf("regimen",r);sf("tasa_iva",r==="GENERAL"?12:5);};
  const guardar=async(estado)=>{
    if(!f.nit_receptor.trim()||!f.nombre_receptor.trim()||!f.descripcion_servicio.trim()){showToast("Llena NIT, nombre y descripción","err");return;}
    setSaving(true);
    const p={empresa_id:empId,numero:editItem?.numero||`FAC-${Date.now().toString().slice(-6)}`,serie:f.serie,tipo_dte:f.tipo_dte,nit_emisor:"16693949",nombre_emisor:"Tz'unun AutoRentas",regimen:f.regimen,nit_receptor:f.nit_receptor,nombre_receptor:f.nombre_receptor,descripcion_servicio:f.descripcion_servicio,cantidad:parseFloat(f.cantidad)||1,precio_unitario:parseFloat(f.precio_unitario)||0,subtotal:sub,tasa_iva:parseFloat(f.tasa_iva)||0,monto_iva:ivaAmt,total:tot,total_usd:f.tasa_cambio>0?tot/f.tasa_cambio:0,tasa_cambio:f.tasa_cambio,metodo_pago:f.metodo_pago,estado,fecha_emision:f.fecha_emision,notas:f.notas};
    if(editItem?.id)await dbUpd("facturas",editItem.id,p);else await dbIns("facturas",p);
    showToast(estado==="emitida"?"Factura emitida ✔":"Borrador guardado ✔");
    setSaving(false);setShowForm(false);setEditItem(null);load();
  };
  const chEst=async(id,estado)=>{await dbUpd("facturas",id,{estado});showToast(`→ ${estado}`);load();};
  const registrarAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. DTE","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const totalFac=rows.filter(r=>r.estado!=="anulada"&&r.estado!=="borrador").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalIva=rows.filter(r=>r.estado!=="anulada"&&r.estado!=="borrador").reduce((s,r)=>s+(parseFloat(r.monto_iva)||0),0);
  return(
    <div>
      {authFac&&<div style={{...S.card,marginBottom:16,border:`1px solid ${T.acc}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:10}}>🔐 Registrar No. DTE — {authFac.numero}</div>
        <div style={{display:"flex",gap:8}}><input style={{...S.inp,flex:1,fontFamily:"monospace"}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID de autorización SAT..."/><button onClick={registrarAuth} style={{...S.btn("primary"),whiteSpace:"nowrap"}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={S.btn("ghost")}>Cancelar</button></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Total facturado",v:fmtK(totalFac),c:T.purple},{l:"IVA acumulado",v:fmtK(totalIva),c:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?14:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>Facturas FEL — NIT Emisor: 16693949</div>
        <div style={{display:"flex",gap:8}}><button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button><button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nueva factura"}</button></div>
      </div>
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Nueva factura FEL</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="RÉGIMEN" span2><div style={{display:"flex",gap:8}}>{[{v:"GENERAL",l:"12% — Régimen General"},{v:"PEQUENIO",l:"5% — Pequeño Contribuyente"}].map(r=><button key={r.v} onClick={()=>handleRegimen(r.v)} style={{...S.btn(f.regimen===r.v?"primary":"ghost"),flex:1,fontSize:12}}>{r.l}</button>)}</div></Fld>
            <Fld label="NIT RECEPTOR"><input style={S.inp} value={f.nit_receptor} onChange={e=>sf("nit_receptor",e.target.value)} placeholder="1234567-8 o CF"/></Fld>
            <Fld label="NOMBRE RECEPTOR"><input style={S.inp} value={f.nombre_receptor} onChange={e=>sf("nombre_receptor",e.target.value)} placeholder="Nombre del cliente"/></Fld>
            <Fld label="DESCRIPCIÓN" span2><textarea style={{...S.inp,minHeight:50,resize:"vertical"}} value={f.descripcion_servicio} onChange={e=>sf("descripcion_servicio",e.target.value)} placeholder="Descripción del servicio..."/></Fld>
            <Fld label="CANTIDAD"><input style={S.inp} type="number" value={f.cantidad} onChange={e=>sf("cantidad",e.target.value)}/></Fld>
            <Fld label="PRECIO UNITARIO (sin IVA)"><input style={S.inp} type="number" value={f.precio_unitario} onChange={e=>sf("precio_unitario",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="MÉTODO PAGO"><select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}><option value="efectivo">💵 Efectivo</option><option value="transferencia">🏦 Transferencia</option><option value="deposito">💰 Depósito</option><option value="tarjeta">💳 Tarjeta (+5%)</option><option value="cheque">📄 Cheque</option></select></Fld>
            <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e=>sf("tasa_cambio",parseFloat(e.target.value)||7.70)}/></Fld>
            <div style={{gridColumn:"span 2",background:T.surf,borderRadius:9,padding:"11px 14px",fontSize:13}}>
              <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(sub)}</span></div>
              <div style={S.srow(false)}><span>IVA ({f.tasa_iva}%)</span><span>Q {fmt(ivaAmt)}</span></div>
              {f.metodo_pago==="tarjeta"&&<div style={{...S.srow(false),color:T.sec}}><span>Recargo TC (5%)</span><span>Q {fmt(recTC)}</span></div>}
              <div style={S.div}/>
              <div style={S.srow(true)}><span>TOTAL</span><span style={{color:T.acc}}>Q {fmt(tot)}</span></div>
            </div>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),flex:1}}>{saving?"...":"💾 Borrador"}</button>
              <button onClick={()=>guardar("emitida")} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"🧾 Emitir"}</button>
            </div>
          </div>
        </div>
      )}
      {loading?<Spinner/>:rows.length===0?<Empty icon="🧾" msg="Sin facturas"/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Régimen","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;return <tr key={r.id}><td style={{...S.td}}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{r.serie} · {fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>✓ DTE</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:11,color:T.mut}}>NIT: {r.nit_receptor}</div></td><td style={S.td}><Badge color={r.regimen==="GENERAL"?T.acc:T.sec} bg={r.regimen==="GENERAL"?T.accDim:T.secDim} label={r.regimen==="GENERAL"?"12% General":"5% Pequeño"} small/></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 8px",fontSize:10}}>🔐 DTE</button>}
          {r.estado==="certificada"&&<button onClick={()=>chEst(r.id,"pagada")} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>✅ Pagar</button>}
          {r.estado!=="anulada"&&r.estado!=="pagada"&&<button onClick={()=>chEst(r.id,"anulada")} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>🚫</button>}
        </div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ══ LA BANCA ═════════════════════════════════════════════════════════════════
function PageBanca({showToast,empId}){
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [editMov,setEditMov]=useState(null);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");const [saving,setSaving]=useState(false);
  const [f,setF]=useState({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{loadCuentas();},[]);
  const loadCuentas=async()=>{setLoading(true);const c=await dbGet("cuentas_bancarias");const arr=Array.isArray(c)?c:[];setCuentas(arr);if(arr.length>0)setCuentaAct(a=>a||arr[0]);setLoading(false);};
  const loadMovs=async(cid)=>{if(!cid)return;const m=await dbGet("movimientos_bancarios",`&cuenta_id=eq.${cid}&order=fecha.desc`);setMovs(Array.isArray(m)?m:[]);};
  useEffect(()=>{if(cuentaAct)loadMovs(cuentaAct.id);},[cuentaAct]);
  const conciliar=async(id,val)=>{await dbUpd("movimientos_bancarios",id,{conciliado:val});showToast(val?"Conciliado ✔":"Pendiente");loadMovs(cuentaAct.id);};
  const delMov=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("movimientos_bancarios",id);showToast("Eliminado");loadMovs(cuentaAct.id);};
  const guardarMov=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.monto)>0)){showToast("Descripción y monto requeridos","err");return;}setSaving(true);const p={empresa_id:empId,cuenta_id:cuentaAct.id,fecha:f.fecha,tipo:f.tipo,descripcion:f.descripcion,monto:parseFloat(f.monto),referencia:f.referencia,categoria:f.categoria,conciliado:f.conciliado,notas:f.notas};if(editMov?.id)await dbUpd("movimientos_bancarios",editMov.id,p);else await dbIns("movimientos_bancarios",p);showToast("Guardado ✔");setSaving(false);setShowForm(false);setEditMov(null);setF({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});loadMovs(cuentaAct.id);};
  const movsFil=movs.filter(m=>{if(filtroT==="ingreso"&&m.tipo!=="ingreso")return false;if(filtroT==="egreso"&&m.tipo!=="egreso")return false;if(filtroC==="conciliado"&&!m.conciliado)return false;if(filtroC==="pendiente"&&m.conciliado)return false;return true;});
  const totalIng=movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const totalEg=movs.filter(m=>m.tipo==="egreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const pendConc=movs.filter(m=>!m.conciliado).length;
  const saldoGTQ=cuentas.filter(c=>c.moneda==="GTQ").reduce((s,c)=>s+(parseFloat(c.saldo_actual)||0),0);
  const CATS=["ventas","combustible","mantenimiento","salarios","seguros","servicios","oficina","otros"];
  const CC={ventas:T.acc,combustible:T.sec,mantenimiento:T.blue,salarios:T.green,seguros:T.purple,servicios:T.acc,oficina:T.mut,otros:T.sub};
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[{l:"Saldo total GTQ",v:`Q ${fmt(saldoGTQ)}`,c:T.acc,bg:T.accDim},{l:"Ingresos registrados",v:`Q ${fmt(totalIng)}`,c:T.acc,bg:T.accDim},{l:"Sin conciliar",v:pendConc,c:pendConc>0?T.sec:T.acc,bg:pendConc>0?T.secDim:T.accDim}].map((s,i)=><div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}><div style={{fontSize:11,color:T.mut}}>{s.l}</div><div style={{fontSize:22,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:18}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>MIS CUENTAS</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {loading?<Spinner/>:cuentas.map(c=>(
              <div key={c.id} onClick={()=>setCuentaAct(c)} style={{...S.card,cursor:"pointer",border:`1px solid ${cuentaAct?.id===c.id?T.acc:T.bord}`,background:cuentaAct?.id===c.id?T.accDim:T.card}}>
                <div style={{fontSize:13,fontWeight:700}}>{c.banco}</div>
                <div style={{fontSize:11,color:T.sub}}>{c.numero_cuenta} · {c.moneda}</div>
                <div style={{fontSize:20,fontWeight:800,color:cuentaAct?.id===c.id?T.acc:T.sub,marginTop:8}}>{c.moneda==="GTQ"?"Q":"$"} {fmt(c.saldo_actual)}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {cuentaAct&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div><div style={{fontSize:14,fontWeight:700}}>{cuentaAct.banco}</div><div style={{fontSize:12,color:T.sub}}>{cuentaAct.numero_cuenta} · {cuentaAct.tipo_cuenta}</div></div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setEditMov(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
                {[{l:"Ingresos",v:`Q ${fmt(totalIng)}`,c:T.acc},{l:"Egresos",v:`Q ${fmt(totalEg)}`,c:T.red},{l:"Movimientos",v:movs.length,c:T.blue}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:12,textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
              </div>
              {showForm&&(
                <div style={{...S.card,marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Nuevo movimiento</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                    <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                    <Fld label="TIPO"><div style={{display:"flex",gap:8}}><button onClick={()=>sf("tipo","ingreso")} style={{...S.btn(f.tipo==="ingreso"?"primary":"ghost"),flex:1,fontSize:12}}>⬆ Ingreso</button><button onClick={()=>sf("tipo","egreso")} style={{...S.btn(f.tipo==="egreso"?"danger":"ghost"),flex:1,fontSize:12}}>⬇ Egreso</button></div></Fld>
                    <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripción del movimiento"/></Fld>
                    <Fld label="MONTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/></Fld>
                    <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="No. factura, transf..."/></Fld>
                    <Fld label="CATEGORÍA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
                    <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:20}}><input type="checkbox" checked={f.conciliado} onChange={e=>sf("conciliado",e.target.checked)} style={{width:16,height:16}}/><label style={{...S.lbl,marginBottom:0}}>CONCILIADO</label></div>
                    <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardarMov} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"💾 Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                {["todos","ingreso","egreso"].map(t=><button key={t} onClick={()=>setFiltroT(t)} style={{...S.btn(filtroT===t?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>{t==="todos"?"Todos":t==="ingreso"?"⬆ Ingresos":"⬇ Egresos"}</button>)}
                <div style={{width:1,height:20,background:T.bord,margin:"0 4px"}}/>
                {["todos","conciliado","pendiente"].map(t=><button key={t} onClick={()=>setFiltroC(t)} style={{...S.btn(filtroC===t?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>{t==="todos"?"Todos":t==="conciliado"?"✅ Conciliados":"⏳ Pendientes"}</button>)}
              </div>
              {movsFil.length===0?<Empty icon="💳" msg="Sin movimientos" action="+ Registrar" onAction={()=>setShowForm(true)}/>:(
                <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Categoría","Monto","Conciliado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{movsFil.map(m=><tr key={m.id}><td style={{...S.td,color:T.sub,whiteSpace:"nowrap",fontSize:12}}>{fmtD(m.fecha)}</td><td style={{...S.td,fontWeight:500,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:175}}>{m.descripcion}</div></td><td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CC[m.categoria]||T.mut)+"22",color:CC[m.categoria]||T.mut}}>{m.categoria}</span></td><td style={{...S.td,fontWeight:700,color:m.tipo==="ingreso"?T.acc:T.red,whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+ ":"− "}Q {fmt(m.monto)}</td><td style={S.td}><button onClick={()=>conciliar(m.id,!m.conciliado)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,padding:0}}>{m.conciliado?"✅":"⬜"}</button></td><td style={S.td}><div style={{display:"flex",gap:4}}><button onClick={()=>{setEditMov(m);setF({fecha:m.fecha||today(),tipo:m.tipo,descripcion:m.descripcion||"",monto:m.monto||"",referencia:m.referencia||"",categoria:m.categoria||"ventas",conciliado:m.conciliado||false,notas:m.notas||""});setShowForm(true);}} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:11}}>✏️</button><button onClick={()=>delMov(m.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>🗑️</button></div></td></tr>)}
                </tbody></table></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══ COMPRAS ══════════════════════════════════════════════════════════════════
function PageCompras({showToast,empId}){
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todos");const [saving,setSaving]=useState(false);
  const [f,setF]=useState({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("gastos");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const calcTotal=(m,i)=>sf("total",(parseFloat(m||f.monto)||0)+(parseFloat(i||f.iva)||0));
  const guardar=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.total)>0)){showToast("Descripción y total requeridos","err");return;}setSaving(true);const p={empresa_id:empId,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,fecha_pago:f.estado==="pagado"?f.fecha:null,notas:f.notas};if(editItem?.id)await dbUpd("gastos",editItem.id,p);else await dbIns("gastos",p);showToast("Gasto guardado ✔");setSaving(false);setShowForm(false);setEditItem(null);load();};
  const marcarPagado=async id=>{await dbUpd("gastos",id,{estado:"pagado",fecha_pago:today()});showToast("Marcado como pagado ✔");load();};
  const del=async id=>{if(!confirm("¿Eliminar?"))return;await dbDel("gastos",id);showToast("Eliminado");load();};
  const filtered=filtro==="todos"?rows:rows.filter(r=>r.estado===filtro);
  const totalG=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPend=rows.filter(r=>r.estado==="pendiente").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const CC=CAT_COLOR;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total gastos",v:`Q ${fmt(totalG)}`,c:T.red},{l:"Pagados",v:`Q ${fmt(totalG-totalPend)}`,c:T.acc},{l:"Pendientes de pago",v:`Q ${fmt(totalPend)}`,c:T.sec}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todos","pendiente","pagado"].map(t=><button key={t} onClick={()=>setFiltro(t)} style={{...S.btn(filtro===t?"primary":"ghost"),fontSize:12,padding:"6px 14px"}}>{t==="todos"?"Todos":t==="pendiente"?"⏳ Pendientes":"✅ Pagados"}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo gasto"}</button>
      </div>
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Registrar gasto / compra</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
            <Fld label="CATEGORÍA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
            <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Diésel — Toyota RAV4"/></Fld>
            <Fld label="MONTO SIN IVA"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>{sf("monto",e.target.value);calcTotal(e.target.value,f.iva);}} placeholder="0.00"/></Fld>
            <Fld label="IVA"><input style={S.inp} type="number" step="0.01" value={f.iva} onChange={e=>{sf("iva",e.target.value);calcTotal(f.monto,e.target.value);}} placeholder="0.00"/></Fld>
            <Fld label="TOTAL"><input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="MÉTODO PAGO"><select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}><option value="efectivo">💵 Efectivo</option><option value="transferencia">🏦 Transferencia</option><option value="tarjeta">💳 Tarjeta</option><option value="credito">📋 Crédito</option></select></Fld>
            <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="No. factura, recibo..."/></Fld>
            <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="pendiente">⏳ Pendiente</option><option value="pagado">✅ Pagado</option></select></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"💾 Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
          </div>
        </div>
      )}
      {loading?<Spinner/>:filtered.length===0?<Empty icon="💸" msg="Sin gastos registrados" action="+ Registrar gasto" onAction={()=>setShowForm(true)}/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Categoría","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(r=><tr key={r.id}><td style={{...S.td,color:T.sub,fontSize:12,whiteSpace:"nowrap"}}>{fmtD(r.fecha)}</td><td style={{...S.td,fontWeight:500,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{r.descripcion}</div></td><td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CC[r.categoria]||T.mut)+"22",color:CC[r.categoria]||T.mut}}>{r.categoria}</span></td><td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(r.total)}</td><td style={S.td}><Badge color={r.estado==="pagado"?T.acc:T.sec} bg={r.estado==="pagado"?T.accDim:T.secDim} label={r.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"} small/></td><td style={S.td}><div style={{display:"flex",gap:4}}>{r.estado==="pendiente"&&<button onClick={()=>marcarPagado(r.id)} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>Pagar</button>}<button onClick={()=>{setEditItem(r);setF({fecha:r.fecha||today(),categoria:r.categoria||"combustible",descripcion:r.descripcion||"",monto:r.monto||"",iva:r.iva||"",total:r.total||"",metodo_pago:r.metodo_pago||"efectivo",referencia:r.referencia||"",estado:r.estado||"pendiente",notas:r.notas||""});setShowForm(true);}} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>✏️</button><button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>🗑️</button></div></td></tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}

// ══ CONFIGURACIÓN ════════════════════════════════════════════════════════════
function PageConfiguracion({showToast}){
  const [tab,setTab]=useState("empresa");
  const [emp,setEmp]=useState({});const [empId,setEmpId]=useState(null);const [saving,setSaving]=useState(false);
  const [exch,setExch]=useState(7.70);const [iva,setIva]=useState(12);
  const [catalogo,setCatalogo]=useState(JSON.parse(JSON.stringify(CATALOGO)));
  const [editId,setEditId]=useState(null);const [editVals,setEditVals]=useState({});
  const [showNewVeh,setShowNewVeh]=useState(false);const [newVeh,setNewVeh]=useState({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  useEffect(()=>{dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0]){setEmp(d[0]);setEmpId(d[0].id);}});},[]); 
  const guardarEmp=async()=>{if(!emp.nombre?.trim()){showToast("Nombre requerido","err");return;}setSaving(true);if(empId)await dbUpd("empresas",empId,{nombre:emp.nombre,nit:emp.nit,direccion:emp.direccion,telefono:emp.telefono,email:emp.email});showToast("Datos actualizados ✔");setSaving(false);};
  const se=(k,v)=>setEmp(p=>({...p,[k]:v}));
  const startEdit=v=>{setEditId(v.id);setEditVals({...v});};
  const saveEdit=()=>{setCatalogo(p=>p.map(v=>v.id===editId?{...v,...editVals}:v));setEditId(null);showToast("Tarifa actualizada ✔");};
  const delVeh=id=>{if(!confirm("¿Eliminar?"))return;setCatalogo(p=>p.filter(v=>v.id!==id));showToast("Eliminado");};
  const addVeh=()=>{if(!newVeh.nombre.trim()){showToast("Nombre requerido","err");return;}setCatalogo(p=>[...p,{...newVeh,id:`c${Date.now()}`,dia:parseFloat(newVeh.dia)||0,sem:parseFloat(newVeh.sem)||0,mes:parseFloat(newVeh.mes)||0}]);setNewVeh({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});setShowNewVeh(false);showToast("Vehículo agregado ✔");};
  const TABS=[{id:"empresa",l:"🏢 Empresa"},{id:"tarifas",l:"💰 Tarifas"},{id:"fiscal",l:"🧾 Fiscal"}];
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:20}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      </div>
      {tab==="empresa"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:16}}>Datos de la Empresa</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Fld label="NOMBRE" span2><input style={S.inp} value={emp.nombre||""} onChange={e=>se("nombre",e.target.value)} placeholder="Tz'unun AutoRentas"/></Fld>
              <Fld label="NIT"><input style={S.inp} value={emp.nit||""} onChange={e=>se("nit",e.target.value)} placeholder="16693949"/></Fld>
              <Fld label="TELÉFONO"><input style={S.inp} value={emp.telefono||""} onChange={e=>se("telefono",e.target.value)} placeholder="502-31221538"/></Fld>
              <Fld label="EMAIL" span2><input style={S.inp} value={emp.email||""} onChange={e=>se("email",e.target.value)} placeholder="tzununautorentas@gmail.com"/></Fld>
              <Fld label="DIRECCIÓN" span2><input style={S.inp} value={emp.direccion||""} onChange={e=>se("direccion",e.target.value)} placeholder="2da. Avenida 0-68 Apto. A, Col. Bran, Zona 3"/></Fld>
              <div style={{gridColumn:"span 2"}}><button onClick={guardarEmp} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"💾 Guardar datos"}</button></div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Vista previa encabezado</div>
            <div style={{background:T.surf,borderRadius:10,padding:16,border:`1px solid ${T.bord}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#00D4AA,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🐦</div>
                <div><div style={{fontSize:14,fontWeight:800,color:T.acc}}>{emp.nombre||"Tz'unun AutoRentas"}</div><div style={{fontSize:10,color:T.sub}}>MÁS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</div></div>
              </div>
              <div style={{fontSize:11,color:T.sub,display:"flex",flexDirection:"column",gap:2}}>
                <div>📍 {emp.direccion||"2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala"}</div>
                <div>📞 {emp.telefono||"502-31221538"}</div>
                <div>✉️ {emp.email||"tzununautorentas@gmail.com"}</div>
                <div>🆔 NIT: {emp.nit||"16693949"}</div>
              </div>
            </div>
            <div style={{...S.card,marginTop:12,background:T.surf}}>
              <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>CUENTAS BANCARIAS</div>
              <div style={{fontSize:12,color:T.sub,lineHeight:1.8}}>
                <div>🏦 Banco Industrial — Cta. Monetaria 853-000016-8</div>
                <div>🏦 Banrural — Cta. 3309159475</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab==="tarifas"&&(
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700}}>Catálogo de Vehículos y Tarifas</div>
            <button onClick={()=>setShowNewVeh(!showNewVeh)} style={{...S.btn(showNewVeh?"warn":"primary"),fontSize:12}}>{showNewVeh?"Cancelar":"+ Agregar vehículo"}</button>
          </div>
          {showNewVeh&&(
            <div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${T.bord}`}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
                <Fld label="NOMBRE"><input style={S.inp} value={newVeh.nombre} onChange={e=>setNewVeh(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Toyota Hilux 4x4"/></Fld>
                <Fld label="TIPO"><select style={S.sel} value={newVeh.tipo} onChange={e=>setNewVeh(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
                <Fld label="Q/DÍA"><input style={S.inp} type="number" value={newVeh.dia} onChange={e=>setNewVeh(p=>({...p,dia:e.target.value}))} placeholder="0"/></Fld>
                <Fld label="Q/SEMANA"><input style={S.inp} type="number" value={newVeh.sem} onChange={e=>setNewVeh(p=>({...p,sem:e.target.value}))} placeholder="0"/></Fld>
                <Fld label="Q/MES"><input style={S.inp} type="number" value={newVeh.mes} onChange={e=>setNewVeh(p=>({...p,mes:e.target.value}))} placeholder="0"/></Fld>
                <button onClick={addVeh} style={{...S.btn("primary"),padding:"9px 14px",alignSelf:"flex-end"}}>+ Agregar</button>
              </div>
            </div>
          )}
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Vehículo","Tipo","Q/Día","Q/Semana","Q/Mes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{catalogo.map(v=>(
              <tr key={v.id}>
                <td style={{...S.td,fontWeight:600}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12}} value={editVals.nombre} onChange={e=>setEditVals(p=>({...p,nombre:e.target.value}))}/>:v.nombre}</td>
                <td style={S.td}>{editId===v.id?<select style={{...S.sel,padding:"5px 8px",fontSize:12}} value={editVals.tipo} onChange={e=>setEditVals(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>:v.tipo}</td>
                {["dia","sem","mes"].map(c=><td key={c} style={{...S.td,fontWeight:700,color:T.acc}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12,width:90,color:T.acc,fontWeight:700}} type="number" value={editVals[c]} onChange={e=>setEditVals(p=>({...p,[c]:parseFloat(e.target.value)||0}))}/>:`Q ${fmt(v[c])}`}</td>)}
                <td style={S.td}><div style={{display:"flex",gap:4}}>{editId===v.id?<><button onClick={saveEdit} style={{...S.btn("primary"),padding:"4px 10px",fontSize:11}}>✔ Guardar</button><button onClick={()=>setEditId(null)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}}>✕</button></>:<><button onClick={()=>startEdit(v)} style={{...S.btn("ghost"),padding:"4px 10px",fontSize:11}}>✏️</button><button onClick={()=>delVeh(v.id)} style={{...S.btn("danger"),padding:"4px 10px",fontSize:11}}>🗑️</button></>}</div></td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:10,fontSize:11,color:T.mut}}>* 1-7 días = tarifa diaria · 8-29 días = semanal · 30+ días = mensual</div>
        </div>
      )}
      {tab==="fiscal"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:14}}>💱 Tasa de Cambio del Día</div>
            <label style={S.lbl}>GTQ POR 1 USD</label>
            <input style={{...S.inp,fontSize:20,fontWeight:700,color:T.acc}} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"10px 14px",background:T.surf,borderRadius:9,fontSize:14}}>
              <span style={{color:T.sub}}>1 USD =</span>
              <span style={{fontWeight:800,color:T.acc}}>Q {fmt(exch)}</span>
            </div>
            <div style={{fontSize:11,color:T.sub,marginTop:8}}>Se aplica en cotizaciones, reservas y facturas.</div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:14}}>🧾 Régimen Fiscal por Defecto</div>
            <label style={S.lbl}>IVA PREDETERMINADO</label>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{v:12,l:"12% — Régimen General",d:"Facturas tipo A"},{v:5,l:"5% — Pequeño Contribuyente",d:"Facturas tipo PC"},{v:0,l:"Sin IVA",d:"Facturas exentas"}].map(o=>(
                <button key={o.v} onClick={()=>setIva(o.v)} style={{...S.btn(iva===o.v?"primary":"ghost"),textAlign:"left",padding:"12px 16px"}}>
                  <div style={{fontWeight:700}}>{o.l}</div>
                  <div style={{fontSize:11,opacity:.8,marginTop:2}}>{o.d}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ APP PRINCIPAL ═════════════════════════════════════════════════════════════
export default function App(){
  const [pag,setPag]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [empId,setEmpId]=useState(null);
  const [sideOpen,setSideOpen]=useState(true);
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
    {id:"compras",icon:"💸",label:"Compras"},
    {id:"sep5",label:"SISTEMA",sep:true},
    {id:"configuracion",icon:"⚙️",label:"Configuración"},
  ];
  const renderPage=()=>{
    if(pag==="dashboard")    return <PageDashboard/>;
    if(pag==="flota")        return <PageFlota showToast={showToast} empId={empId}/>;
    if(pag==="reservas")     return <PageReservas showToast={showToast} empId={empId}/>;
    if(pag==="clientes")     return <PageClientes showToast={showToast} empId={empId}/>;
    if(pag==="calculadora")  return <PageCalculadora showToast={showToast} empId={empId}/>;
    if(pag==="cotizaciones") return <PageCotizaciones showToast={showToast}/>;
    if(pag==="facturacion")  return <PageFacturacion showToast={showToast} empId={empId}/>;
    if(pag==="banca")        return <PageBanca showToast={showToast} empId={empId}/>;
    if(pag==="compras")      return <PageCompras showToast={showToast} empId={empId}/>;
    if(pag==="configuracion")return <PageConfiguracion showToast={showToast}/>;
    return <Empty icon="🚧" msg="Módulo en construcción"/>;
  };
  const curNav=NAV.find(n=>n.id===pag);
  return(
    <div style={{display:"flex",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:T.bg,color:T.txt,minHeight:"100vh",maxHeight:"100vh",overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sideOpen?220:60,background:T.surf,borderRight:`1px solid ${T.bord}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden"}}>
        {/* Logo */}
        <div style={{padding:"16px 14px",borderBottom:`1px solid ${T.bord}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#00D4AA,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🐦</div>
          {sideOpen&&<div><div style={{fontSize:13,fontWeight:800,color:T.acc,lineHeight:1.2}}>Tz'unun</div><div style={{fontSize:9,color:T.mut}}>AutoRentas</div></div>}
          <button onClick={()=>setSideOpen(!sideOpen)} style={{...S.btn("ghost"),padding:"4px 8px",marginLeft:"auto",fontSize:12,flexShrink:0}}>☰</button>
        </div>
        {/* Nav items */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {NAV.map(n=>{
            if(n.sep)return sideOpen?<div key={n.id} style={{fontSize:9,fontWeight:700,color:T.mut,padding:"14px 16px 4px",letterSpacing:1}}>{n.label}</div>:<div key={n.id} style={{height:1,background:T.bord,margin:"8px 10px"}}/>;
            const act=pag===n.id;
            return <button key={n.id} onClick={()=>setPag(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:act?T.accDim:"transparent",border:"none",borderLeft:act?`3px solid ${T.acc}`:"3px solid transparent",cursor:"pointer",color:act?T.acc:T.sub,fontWeight:act?700:400,fontSize:13,textAlign:"left"}}>
              <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
              {sideOpen&&<span style={{whiteSpace:"nowrap",overflow:"hidden"}}>{n.label}</span>}
            </button>;
          })}
        </div>
      </div>
      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:T.surf,borderBottom:`1px solid ${T.bord}`,padding:"11px 22px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:700}}>{curNav?.icon} {curNav?.label}</div>
          <div style={{marginLeft:"auto",fontSize:11,color:T.mut}}>{new Date().toLocaleDateString("es-GT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:22}}>
          {toast&&<Toast msg={toast.msg} type={toast.type}/>}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
