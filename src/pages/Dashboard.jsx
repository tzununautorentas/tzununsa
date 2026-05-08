import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function PageDashboard(){
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
        {[{icon:"🚗",l:"Flota",v:d.v.length,c:T.acc,bg:T.accDim},{icon:"✅",l:"Disponibles",v:d.vDisp,c:T.acc,bg:T.accDim},{icon:"­ƒöæ",l:"Rentados",v:d.vRent,c:T.blue,bg:T.blueDim},{icon:"📅",l:"Res. activas",v:d.rAct,c:T.blue,bg:T.blueDim},{icon:"👥",l:"Clientes",v:d.clientes.length,c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>FINANZAS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{icon:"💰",l:"Ingresos",v:fmtK(d.ing),c:T.acc,bg:T.accDim},{icon:"🛍️",l:"Egresos",v:fmtK(d.eg),c:T.red,bg:T.redDim},{icon:"🏦",l:"Saldo GTQ",v:fmtK(d.saldo),c:T.acc,bg:T.accDim},{icon:"🧾",l:"Facturado",v:fmtK(d.facTot),c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos vs Egresos</div>{d.chart.length>0?<ResponsiveContainer width="100%" height={180}><BarChart data={d.chart}><XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/><Tooltip contentStyle={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="Ingresos" fill={T.acc} radius={[4,4,0,0]}/><Bar dataKey="Egresos" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>:<div style={{textAlign:"center",padding:40,color:T.sub,fontSize:13}}>Sin movimientos aún</div>}</div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Flota</div>{d.pie.length>0?<><ResponsiveContainer width="100%" height={120}><PieChart><Pie data={d.pie} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={3}>{d.pie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>{d.pie.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div><span style={{fontWeight:700,color:e.color}}>{e.value}</span></div>)}</>:<div style={{textAlign:"center",padding:30,color:T.sub,fontSize:12}}>Sin datos</div>}</div>
      </div>
    </div>
  );
}

// ÔòÉÔòÉÔòÉ RESERVAS PAGE ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ CALCULADORA ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ COTIZACIONES PAGE ÔòÉÔòÉÔòÉ

