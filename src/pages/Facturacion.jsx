import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
function ModalAnular({factura,onConfirm,onCancel}){
  const [motivo,setMotivo]=useState("");
  if(!factura)return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.red}`,width:"100%",maxWidth:440,padding:24}}>
        <div style={{fontSize:15,fontWeight:700,color:T.red,marginBottom:6}}>­ƒÜ½ Anular Factura</div>
        <div style={{fontSize:13,color:T.sub,marginBottom:16}}>Factura <strong style={{color:T.txt}}>{factura.numero}</strong> · Q {fmt(factura.total)}</div>
        <label style={S.lbl}>MOTIVO DE ANULACIÓN (requerido)</label>
        <textarea style={{...S.inp,minHeight:70,resize:"vertical",marginBottom:16}} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Error en datos del receptor, duplicado, etc."/>
        <div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.red,marginBottom:16}}>
          ⚠️´©Å Esta acción no se puede deshacer. La factura quedará marcada como ANULADA en el sistema.
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onConfirm(motivo)} disabled={!motivo.trim()} style={{...S.btn("danger"),flex:1,opacity:motivo.trim()?1:0.5}}>­ƒÜ½ Confirmar anulación</button>
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
          <Fld label="M├ëTODO" span2>
            <select style={S.sel} value={metodo} onChange={e=>setMetodo(e.target.value)}>
              <option value="efectivo">­ƒÆÁ Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="deposito">💰 Depósito</option>
              <option value="tarjeta">­ƒÆ│ Tarjeta</option>
              <option value="cheque">­ƒôä Cheque</option>
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
  // ÔöÇÔöÇ State ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

  // ÔöÇÔöÇ Líneas de detalle ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const EMPTY_LINE={tipo:"Servicio",cantidad:1,descripcion:"",precio_unitario:"",descuento:0};
  const [lineas,setLineas]=useState(()=>{
    if(initial?.lineas&&initial.lineas.length>0) return initial.lineas;
    return [{...EMPTY_LINE}];
  });
  const addLinea=()=>setLineas(p=>[...p,{...EMPTY_LINE}]);
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));

  const [saving,setSaving]=useState(false);

  // ÔöÇÔöÇ Cálculos ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

  // ÔöÇÔöÇ Auto-fill from cliente/reserva/cotizacion ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

  // ÔöÇÔöÇ Guardar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const guardar=async()=>{
    if(!f.nombre_receptor.trim()){alert("Nombre del receptor requerido");return;}
    if(lineas.filter(l=>l.descripcion&&parseFloat(l.precio_unitario)>0).length===0){alert("Agrega al menos una línea con descripción y precio");return;}
    setSaving(true);
    const numero="FAC-"+Date.now().toString().slice(-8);
    const payload={
      ...f,
      empresa_id:empId,
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

  // ÔöÇÔöÇ PDF SAT-style ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
    <strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong>
    Nit Emisor: 20160860<br/>
    <strong>TRANSPORTES TZUNUN</strong>
    6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO
  </div>
  <div class="autorizacion">
    <span class="num">N├ÜMERO DE AUTORIZACIÓN:</span><br/>
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

  // ÔöÇÔöÇ JSX ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar factura":"Nueva factura"}</div>
        <div style={{display:"flex",gap:8}}>
          {initial?.id&&<button onClick={generarPDFFactura} style={{...S.btn("blue"),fontSize:12}}>­ƒû¿´©Å Vista previa / Imprimir</button>}
          <button onClick={onCancel} style={{...S.btn("ghost"),fontSize:12}}>ÔåÉ Volver</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Columna izquierda */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Datos SAT */}
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>DATOS SAT / DTE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label="N┬░ AUTORIZACIÓN SAT" span2>
                <input style={{...S.inp,fontFamily:"monospace",fontSize:11}} value={f.numero_autorizacion} onChange={e=>sf("numero_autorizacion",e.target.value)} placeholder="F047F606-C8E3-43D7-8B21-A77A28299F83"/>
              </Fld>
              <Fld label="SERIE"><input style={S.inp} value={f.serie} onChange={e=>sf("serie",e.target.value)} placeholder="TZAR2026"/></Fld>
              <Fld label="N┬░ DTE"><input style={S.inp} value={f.numero_dte} onChange={e=>sf("numero_dte",e.target.value)} placeholder="3370337239"/></Fld>
              <Fld label="N┬░ ACCESO"><input style={S.inp} value={f.numero_acceso} onChange={e=>sf("numero_acceso",e.target.value)} placeholder="Número de acceso"/></Fld>
              <Fld label="R├ëGIMEN FISCAL">
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
              <Fld label="M├ëTODO PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                  <option value="efectivo">­ƒÆÁ Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="deposito">💰 Depósito</option>
                  <option value="tarjeta">­ƒÆ│ Tarjeta</option>
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
                  <option value="borrador">­ƒôØ Borrador</option>
                  <option value="emitida">­ƒôñ Emitida</option>
                  <option value="certificada">✅ Certificada (DTE)</option>
                  <option value="pagada">­ƒÆÜ Pagada</option>
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
                      {lineas.length>1&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"5px 8px",fontSize:11}}>Ô£ò</button>}
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
              {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sec}}><span>Anticipo aplicado</span><span>ÔÇô Q {fmt(f.anticipo_aplicado)}</span></div>}
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
            <button onClick={generarPDFFactura} style={{...S.btn("blue"),width:"100%",marginBottom:8,padding:10,fontSize:13}}>­ƒû¿´©Å Vista previa / Imprimir factura</button>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),width:"100%",padding:10,fontSize:13}}>{saving?"Guardando...":"­ƒÆ¥ "+( initial?.id?"Actualizar":"Crear factura")}</button>
            <button onClick={onCancel} style={{...S.btn("ghost"),width:"100%",padding:10,marginTop:6,fontSize:12}}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ÔòÉÔòÉÔòÉ REPORTES ÔòÉÔòÉÔòÉ

export default function PageFacturacion({showToast,empId}){
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [exportar,setExportar]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const delFac=async id=>{if(!confirm("┬┐Eliminar esta factura permanentemente?"))return;await dbDel("facturas",id);showToast("Factura eliminada");load();};
  const imprimirFac=r=>{
    const lineas=r.lineas?JSON.parse(r.lineas):[];
    const ivaPct=parseFloat(r.tasa_iva)||5;
    const total=parseFloat(r.total)||0;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${r.numero}</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}.titulo{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:8px}.emisor{color:#1B2D5C;font-size:10px;margin-bottom:4px}.right{text-align:right}.autorizacion{text-align:right;font-size:9px;color:#DC2626}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}th{background:#1B2D5C;color:#fff;padding:5px 6px}td{padding:5px 6px;border-bottom:1px solid #E2E8F0}.footer{margin-top:10px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}@media print{button{display:none}}</style></head><body>
    <div class="titulo">${ivaPct===5?"Factura Pequeño Contribuyente":"Factura"}</div>
    <div style="display:flex;justify-content:space-between">
      <div class="emisor"><strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong><br/>Nit Emisor: 20160860<br/><strong>TRANSPORTES TZUNUN</strong><br/>6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO</div>
      <div class="autorizacion"><strong>N├ÜMERO DE AUTORIZACIÓN:</strong><br/>${r.numero_autorizacion||"—"}<br/>Serie: ${r.serie||"—"} Número DTE: ${r.numero_dte||"—"}</div>
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
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id:empId,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" — "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada ✔":"Pago parcial ✔");setMPago(null);load();};
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorización","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  return(
    <div>
      {exportar&&<ModalExportar titulo="Facturas" datos={rows} campos={[{label:"N┬░",key:"numero"},{label:"Cliente",key:"nombre_receptor"},{label:"NIT",key:"nit_receptor"},{label:"Fecha",key:"fecha_emision"},{label:"Total",key:"total"},{label:"Saldo",key:"saldo_pendiente"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>­ƒöÉ Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
                <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
      </div>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="🧾" msg="Sin facturas"/>:(
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Total","Anticipo","Saldo","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;const saldo=parseFloat(r.saldo_pendiente)||0;const ant=parseFloat(r.anticipo_aplicado)||0;return <tr key={r.id}><td style={S.td}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc,fontWeight:700}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>Ô£ô DTE</div>}{r.motivo_anulacion&&<div style={{fontSize:9,color:T.red}}>⚠️ {r.motivo_anulacion.slice(0,20)}</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:10,color:T.mut}}>{r.nit_receptor}</div></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={{...S.td,color:ant>0?T.acc:T.mut,fontSize:12}}>{ant>0?"Q "+fmt(ant):"—"}</td><td style={{...S.td,fontWeight:700,color:saldo>0?T.sec:T.acc}}>{r.estado==="anulada"?"—":"Q "+fmt(saldo)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:90}}>{r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒöÉ DTE</button>}{["emitida","certificada","parcial"].includes(r.estado)&&<button onClick={()=>setMPago(r)} style={{...S.btn("primary"),padding:"3px 7px",fontSize:10,width:"100%"}}>💰 Pago</button>}{r.estado!=="anulada"&&<button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 7px",fontSize:10,width:"100%"}}>Ô£Å´©Å</button>}{!["anulada","pagada"].includes(r.estado)&&<button onClick={()=>setMAnular(r)} style={{...S.btn("danger"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒÜ½</button>}</div></td></tr>;})}
        </tbody></table></div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ LA BANCA ÔòÉÔòÉÔòÉ

