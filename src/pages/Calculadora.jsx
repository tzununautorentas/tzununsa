import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
export default function PageCalculadora({showToast,empId}){
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
    const p={empresa_id:empId,tipo:tab,cliente_nombre:cn,numero:"COT-"+Date.now().toString().slice(-6),dias:tab==="renta"?dias:d2,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||5,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttcr,total_gtq:tab==="renta"?tot:ttot,total_usd:(tab==="renta"?tot:ttot)/(tab==="renta"?exch:parseFloat(tf.exch)||7.70),vehiculo_nombre:selVeh?.nombre||"",estado,km_ida:kmi,km_regreso:kmr,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,gastos_varios:misc};
    const r=await dbIns("cotizaciones",p);
    if(r&&!r.error){showToast(estado==="enviada"?"Cotización guardada ✔":"Borrador guardado ✔");}
    else{showToast("Error al guardar","err");}
    setSaving(false);
  };

  const Row=({l,v,bold,color})=><div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:bold?14:13,fontWeight:bold?700:400,color:color||(bold?T.txt:T.sub)}}><span>{l}</span><span>{v}</span></div>;

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"renta",l:"­ƒöæ Renta por días"},{id:"traslado",l:"­ƒù║ Traslado/Viaje"}].map(t=>(
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
              <Fld label="D├ìAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(Math.max(1,parseInt(e.target.value)||1))}/></Fld>
              <Fld label="VEH├ìCULO">
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
              <Fld label="M├ëTODO DE PAGO">
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                  <button onClick={()=>setPago("transferencia")} style={{...S.btn(pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                </div>
              </Fld>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <input type="checkbox" id="conTC" checked={conTC} onChange={e=>setConTC(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
                <label htmlFor="conTC" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción de pago con tarjeta (+5%)</label>
              </div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Fld label="CLIENTE" span2>
                <ClienteBuscador value={tf.cliente} onChange={v=>stf("cliente",v)} empId={empId}/>
              </Fld>
              <Fld label="DESTINO (tabla de rutas)" span2>
                <select style={S.sel} value={tf.ruta} onChange={e=>{
                  const r=RUTAS.find(x=>x.d===e.target.value);
                  if(r){stf("ruta",r.d);stf("kmi",r.km);stf("kmr",r.km);stf("dias",r.dias);}
                  else stf("ruta",e.target.value);
                }}>
                  <option value="">Seleccionar destino...</option>
                  {RUTAS.map(r=><option key={r.d} value={r.d}>{r.d} — {r.km} km · {r.dias}d</option>)}
                </select>
              </Fld>
              <Fld label="D├ìAS"><input style={S.inp} type="number" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              <Fld label="COSTO VEH├ìCULO/D├ìA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO PILOTO/D├ìA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/D├ìA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="ALIMENTACIÓN/D├ìA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
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
                  <button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                  <button onClick={()=>stf("pago","transferencia")} style={{...S.btn(tf.pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                </div>
              </Fld>
              <div style={{gridColumn:"span 2",display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e=>stf("conTC",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
                <label htmlFor="conTC2" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción con tarjeta (+5%)</label>
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
                {tf.ruta&&<div style={{fontSize:12,color:T.acc,marginBottom:8}}>­ƒôì {tf.ruta} · {Math.round(tkm)} km totales</div>}
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                  <Row l={"Vehículo (├ù"+d2+"d)"} v={"Q "+fmt(vT)}/>
                  <Row l={"Piloto (├ù"+d2+"d)"} v={"Q "+fmt(pT)}/>
                  <Row l={"Hospedaje (├ù"+d2+"d)"} v={"Q "+fmt(hT)}/>
                  <Row l={"Aliment. (├ù"+d2+"d)"} v={"Q "+fmt(aT)}/>
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
            <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>{saving?"Guardando...":"­ƒÆ¥ Guardar como borrador"}</button>
            <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"✅ Guardar y enviar cotización"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


