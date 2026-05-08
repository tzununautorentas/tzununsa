import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageFacturacion({showToast,empId}){
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [exportar,setExportar]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const delFac=async id=>{if(!confirm("┬┐Eliminar esta factura permanentemente?"))return;await dbDel("facturas",id);showToast("Factura eliminada");load();};
  const imprimirFac=r=>{
    const lineas=r.lineas?JSON.parse(r.lineas):[];
    const ivaPct=parseFloat(r.tasa_iva)||5;
    const total=parseFloat(r.total)||0;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${r.numero}</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}.titulo{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:8px}.emisor{color:#1B2D5C;font-size:10px;margin-bottom:4px}.right{text-align:right}.autorizacion{text-align:right;font-size:9px;color:#DC2626}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}th{background:#1B2D5C;color:#fff;padding:5px 6px}td{padding:5px 6px;border-bottom:1px solid #E2E8F0}.footer{margin-top:10px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}@media print{button{display:none}}</style></head><body>
    <div class="titulo">${ivaPct===5?"Factura Peque├▒o Contribuyente":"Factura"}</div>
    <div style="display:flex;justify-content:space-between">
      <div class="emisor"><strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong><br/>Nit Emisor: 20160860<br/><strong>TRANSPORTES TZUNUN</strong><br/>6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO</div>
      <div class="autorizacion"><strong>N├ÜMERO DE AUTORIZACI├ôN:</strong><br/>${r.numero_autorizacion||"ÔÇö"}<br/>Serie: ${r.serie||"ÔÇö"} N├║mero DTE: ${r.numero_dte||"ÔÇö"}</div>
    </div>
    <hr/>
    <div style="font-size:10px">NIT Receptor: ${r.nit_receptor||"CF"} &nbsp;|&nbsp; Nombre: <strong>${r.nombre_receptor}</strong> &nbsp;|&nbsp; Fecha: ${r.fecha_emision||""} &nbsp;|&nbsp; Moneda: GTQ</div>
    <table><thead><tr><th>#</th><th>B/S</th><th>Cant.</th><th>Descripci├│n</th><th class="right">P. Unitario</th><th class="right">Total</th></tr></thead>
    <tbody>${lineas.map((l,i)=>`<tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">Q ${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">Q ${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-(parseFloat(l.descuento)||0)).toFixed(2)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="4"/><td class="right"><strong>TOTAL:</strong></td><td class="right"><strong>Q ${total.toFixed(2)}</strong></td></tr></tfoot></table>
    ${ivaPct===5?'<p style="font-size:9px;color:#64748B">* No genera derecho a cr├®dito fiscal</p>':""}
    <div class="footer"><strong>Datos del certificador:</strong> Superintendencia de Administraci├│n Tributaria &nbsp; NIT: 16693949</div>
    <div style="text-align:center;margin-top:12px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
    <script>window.onload=()=>window.print();</script></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));dbGet("reservas","").then(d=>setReservas(Array.isArray(d)?d:[]));dbGet("cotizaciones","&estado=eq.aprobada").then(d=>setCotizaciones(Array.isArray(d)?d:[]));dbGet("movimientos_bancarios","&tipo=eq.ingreso").then(d=>setAnticipos(Array.isArray(d)?d:[]));load();},[]);
  const anular=async(fac,mot)=>{await dbUpd("facturas",fac.id,{estado:"anulada",motivo_anulacion:mot});showToast("Anulada");setMAnular(null);load();};
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id:empId,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" ÔÇö "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada Ô£ö":"Pago parcial Ô£ö");setMPago(null);load();};
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorizaci├│n","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado Ô£ö");setAuthFac(null);setAuthId("");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada Ô£ö");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      {exportar&&<ModalExportar titulo="Facturas" datos={rows} campos={[{label:"N┬░",key:"numero"},{label:"Cliente",key:"nombre_receptor"},{label:"NIT",key:"nit_receptor"},{label:"Fecha",key:"fecha_emision"},{label:"Total",key:"total"},{label:"Saldo",key:"saldo_pendiente"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>­ƒöÉ Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>Ô£à Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>Ôå║</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
                <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒº¥" msg="Sin facturas"/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Total","Anticipo","Saldo","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;const saldo=parseFloat(r.saldo_pendiente)||0;const ant=parseFloat(r.anticipo_aplicado)||0;return <tr key={r.id}><td style={S.td}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc,fontWeight:700}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>Ô£ô DTE</div>}{r.motivo_anulacion&&<div style={{fontSize:9,color:T.red}}>ÔÜá {r.motivo_anulacion.slice(0,20)}</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:10,color:T.mut}}>{r.nit_receptor}</div></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={{...S.td,color:ant>0?T.acc:T.mut,fontSize:12}}>{ant>0?"Q "+fmt(ant):"ÔÇö"}</td><td style={{...S.td,fontWeight:700,color:saldo>0?T.sec:T.acc}}>{r.estado==="anulada"?"ÔÇö":"Q "+fmt(saldo)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:90}}>{r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒöÉ DTE</button>}{["emitida","certificada","parcial"].includes(r.estado)&&<button onClick={()=>setMPago(r)} style={{...S.btn("primary"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒÆ░ Pago</button>}{r.estado!=="anulada"&&<button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 7px",fontSize:10,width:"100%"}}>Ô£Å´©Å</button>}{!["anulada","pagada"].includes(r.estado)&&<button onClick={()=>setMAnular(r)} style={{...S.btn("danger"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒÜ½</button>}</div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ LA BANCA ÔòÉÔòÉÔòÉ
