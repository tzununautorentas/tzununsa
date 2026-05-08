import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
export default function PagePagos({showToast,empId}){
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
    if(!f.cuenta_id){showToast("Selecciona la cuenta bancaria","err");return;}
    if(!f.concepto.trim()&&!f.factura_id&&!f.reserva_id){showToast("Ingresa concepto o vincula a factura/reserva","err");return;}
    setSaving(true);
    try{
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
      const monto=parseFloat(f.monto);
      let concepto=f.concepto.trim();
      if(!concepto){
        const fa=facturas.find(x=>x.id===f.factura_id);
        const re=reservas.find(x=>x.id===f.reserva_id);
        concepto=fa?"Pago factura "+(fa.numero||"")+" — "+fa.nombre_receptor:re?"Pago reserva "+(re.numero||"")+" — "+re.cliente_nombre:"Pago recibido";
      }
      // 1. Guardar pago
      const pago=await dbIns("pagos_recibidos",{empresa_id:empId,fecha:f.fecha,monto,metodo:f.metodo,referencia:f.referencia||"",concepto,cuenta_id:f.cuenta_id,notas:f.notas||"",factura_id:f.factura_id||null,reserva_id:f.reserva_id||null});
      if(pago&&pago.error){showToast("Error: "+pago.error,"err");setSaving(false);return;}
      // 2. Actualizar saldo de factura
      if(f.factura_id){
        const fa=facturas.find(x=>x.id===f.factura_id);
        if(fa){const saldo=Math.max(0,(parseFloat(fa.saldo_pendiente)||parseFloat(fa.total)||0)-monto);await dbUpd("facturas",f.factura_id,{saldo_pendiente:saldo,estado:saldo<=0?"pagada":"parcial"});}
      }
      // 3. Actualizar saldo de reserva
      if(f.reserva_id){
        const re=reservas.find(x=>x.id===f.reserva_id);
        if(re){const saldo=Math.max(0,(parseFloat(re.saldo)||0)-monto);const anticipo=(parseFloat(re.anticipo)||0)+monto;await dbUpd("reservas",f.reserva_id,{saldo,anticipo});}
      }
      // 4. Registrar en movimientos bancarios
      await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:f.cuenta_id,fecha:f.fecha,tipo:"ingreso",descripcion:concepto,monto,referencia:f.referencia||"",categoria:"ventas",conciliado:false,notas:f.notas||""});
      // 5. Actualizar saldo de cuenta bancaria
      const cu=cuentas.find(x=>x.id===f.cuenta_id);
      if(cu)await dbUpd("cuentas_bancarias",f.cuenta_id,{saldo_actual:(parseFloat(cu.saldo_actual)||0)+monto});
      showToast("Pago registrado correctamente ✔");
      setSaving(false);setShowForm(false);
      setF({fecha:today(),monto:"",metodo:"transferencia",referencia:"",factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""});
      load();
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
  };

  const del=async id=>{
    if(!confirm("┬┐Eliminar este pago? Esta acción no se puede deshacer."))return;
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
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
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
              {cuentas.length===0&&<div style={{fontSize:11,color:T.red,marginTop:3}}>⚠️ No hay cuentas bancarias. Ve a La Banca para crearlas.</div>}
            </Fld>
            <Fld label="M├ëTODO DE PAGO">
              <select tabIndex={0} style={S.sel} value={f.metodo} onChange={e=>sf("metodo",e.target.value)}>
                <option value="transferencia">🏦 Transferencia bancaria</option>
                <option value="deposito">💰 Depósito en banco</option>
                <option value="efectivo">­ƒÆÁ Efectivo</option>
                <option value="tarjeta">­ƒÆ│ Tarjeta de crédito/débito</option>
                <option value="cheque">­ƒôä Cheque</option>
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
            <Fld label="REFERENCIA / N┬░ COMPROBANTE">
              <input tabIndex={0} style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REF-00001"/>
            </Fld>
            <Fld label="NOTAS">
              <input tabIndex={0} style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones"/>
            </Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:10,fontSize:13}}>
                {saving?"­ƒÆ¥ Registrando...":"­ƒÆ¥ Registrar pago"}
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
                    <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>­ƒùæ´©Å</button>
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


