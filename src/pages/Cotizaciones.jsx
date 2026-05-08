import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageCotizaciones({showToast,empId}){
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [preview,setPreview]=useState(null);
  const load=async()=>{setLoading(true);const d=await dbGet("cotizaciones");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));load();},[]);
  const del=async id=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("cotizaciones",id);showToast("Eliminada");load();};
  const chEst=async(id,estado)=>{await dbUpd("cotizaciones",id,{estado,orden_venta:estado==="orden_venta"});showToast("ÔåÆ "+estado);load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro||(filtro==="orden_venta"&&r.orden_venta));
  const EC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"},orden_venta:{c:T.purple,bg:T.purpleDim,l:"Orden de Venta"}};
  if(vista==="form")return <div><FormCotizacion initial={editItem} empId={empId} clientes={clientes} onSave={()=>{showToast("Guardada Ô£ö");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      {preview&&<ModalVistaPrevia cot={preview} onClose={()=>setPreview(null)}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Enviadas",v:rows.filter(r=>r.estado==="enviada").length,c:T.blue},{l:"Aprobadas",v:rows.filter(r=>r.estado==="aprobada").length,c:T.acc},{l:"├ôrdenes",v:rows.filter(r=>r.orden_venta).length,c:T.purple}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","enviada","aprobada","rechazada","orden_venta"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f==="orden_venta"?"­ƒôª ├ôrdenes":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>Ôå║</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin cotizaciones"/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(r=>{
            const e=r.orden_venta?EC.orden_venta:(EC[r.estado]||EC.borrador);
            const total=parseFloat(r.total_gtq)||0;
            const makePDF=()=>generarPDF({numero:r.numero,fecha:r.fecha_emision||today(),fecha_vence:r.fecha_vence,cliente:r.cliente_nombre,nit:r.cliente_nit,dir_cliente:r.cliente_dir,saludo:r.saludo,servicio:r.descripcion_servicio,caract:r.caract||["Veh├¡culo","Aire acond.","Cinturones","Seguro"],incluidos:r.incluidos||["Combustible","Conductor","Atenci├│n"],beneficios:r.beneficios||["Viaje seguro","Puntualidad","Flexibilidad"],con_piloto:r.con_piloto!==false,sub:parseFloat(r.subtotal)||0,iva_pct:parseFloat(r.tasa_iva)||5,iva_amt:parseFloat(r.total_iva)||0,total_ef:total,total_tc:total*1.05,exch:parseFloat(r.tasa_cambio)||7.70,es_orden:r.orden_venta});
            return(
              <div key={r.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>{r.saludo&&<div style={{fontSize:11,color:T.sub,fontStyle:"italic"}}>"{r.saludo}"</div>}<div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {r.dias}d{r.vehiculo_nombre?" ┬À "+r.vehiculo_nombre:""}</div></div>
                  <div style={{textAlign:"right"}}><Badge color={e.c} bg={e.bg} label={e.l} small/><div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(total)}</div></div>
                </div>
                <div style={{display:"flex",gap:5,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                  <button onClick={()=>setPreview(r)} style={{...S.btn("blue"),fontSize:11,padding:"4px 9px"}}>­ƒæü Ver</button>
                  <button onClick={()=>{const doc=makePDF();if(doc)doc.save(r.numero+".pdf");}} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>Ô¼ç PDF</button>
                  <button onClick={()=>{const doc=makePDF();if(doc){const url=URL.createObjectURL(doc.output("blob"));const w=window.open(url);setTimeout(()=>w&&w.print(),1000);}}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>­ƒû¿´©Å</button>
                  <button onClick={()=>{window.open("mailto:?subject="+encodeURIComponent("Cotizaci├│n "+r.numero)+"&body="+encodeURIComponent("Estimados, adjunto cotizaci├│n "+r.numero+" por Q "+fmt(total)+". Para m├ís informaci├│n: Oscar G├ílvez 502-31221538"));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£ë´©Å</button>
                  <button onClick={()=>{const msg="Estimados, le comparto cotizaci├│n "+r.numero+" de Tz'unun AutoRentas por Q "+fmt(total)+". Para aprobar o consultar: 502-31221538";window.open("https://wa.me/?text="+encodeURIComponent(msg));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px",background:"#25D366",color:"white"}}>­ƒÆ¼ WA</button>
                  <button onClick={()=>{setEditItem({...r,__clon:true});setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>­ƒôï Clonar</button>
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£Å´©Å</button>
                  {!r.orden_venta&&<button onClick={()=>chEst(r.id,"orden_venta")} style={{...S.btn("purple"),fontSize:11,padding:"4px 9px"}}>­ƒôª</button>}
                  {r.estado==="enviada"&&<button onClick={()=>chEst(r.id,"aprobada")} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>Ô£à</button>}
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"4px 9px",marginLeft:"auto"}}>­ƒùæ´©Å</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ FACTURACI├ôN PAGE ÔòÉÔòÉÔòÉ
