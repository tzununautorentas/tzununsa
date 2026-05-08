import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageReservas({showToast,empId}){
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
  const del=async id=>{if(!confirm("┬┐Eliminar reserva?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada Ô£ö":"Guardada Ô£ö");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
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
        <button onClick={()=>setViewMode(viewMode==="lista"?"calendario":"lista")} style={{...S.btn("ghost"),fontSize:11}}>{viewMode==="lista"?"­ƒôà Ver calendario":"­ƒôï Ver lista"}</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>Ôå║</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva reserva</button>
      </div>
      {viewMode==="calendario"?(
        <CalendarioReservas rows={rows} onEdit={r=>{setEditItem(r);setVista("form");}}/>
      ):(loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>setVista("form")}/>:(
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
                    <div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" ÔåÆ "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" ┬À "+r.vehiculo_nombre:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                    {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>Ô£Å´©Å Editar</button>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>­ƒùæ´©Å</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

