import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
export default function PageBanca({showToast,empId}){
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [saving,setSaving]=useState(false);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");const [exportar,setExportar]=useState(false);
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
                <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
                <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
              </div>
            </div>
            {showForm&&<div style={{...S.card,marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                <Fld label="TIPO"><div style={{display:"flex",gap:8}}><button onClick={()=>sf("tipo","ingreso")} style={{...S.btn(f.tipo==="ingreso"?"primary":"ghost"),flex:1,fontSize:12}}>Ô¼å Ingreso</button><button onClick={()=>sf("tipo","egreso")} style={{...S.btn(f.tipo==="egreso"?"danger":"ghost"),flex:1,fontSize:12}}>Ô¼ç Egreso</button></div></Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripción..."/></Fld>
                <Fld label="MONTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/></Fld>
                <Fld label="CATEGOR├ìA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
                <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="N┬░ factura..."/></Fld>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:18}}><input type="checkbox" checked={f.conciliado} onChange={e=>sf("conciliado",e.target.checked)} style={{width:16,height:16}}/><label style={{...S.lbl,marginBottom:0}}>CONCILIADO</label></div>
                <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardarMov} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"­ƒÆ¥ Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
              </div>
            </div>}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {["todos","ingreso","egreso"].map(t=><button key={t} onClick={()=>setFiltroT(t)} style={{...S.btn(filtroT===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todos":t==="ingreso"?"Ô¼å Ingresos":"Ô¼ç Egresos"}</button>)}
              {["todos","conciliado","pendiente"].map(t=><button key={t} onClick={()=>setFiltroC(t)} style={{...S.btn(filtroC===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todo":t==="conciliado"?"✅ Conciliados":"⏳ Pendientes"}</button>)}
            </div>
            {movsFil.length===0?<Empty icon="­ƒÆ│" msg="Sin movimientos" action="+ Registrar" onAction={()=>setShowForm(true)}/>:(
              <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Cat.","Monto","Ô£ô",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{movsFil.map(m=><tr key={m.id}><td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(m.fecha)}</td><td style={{...S.td,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:175}}>{m.descripcion}</div>{m.referencia&&<div style={{fontSize:9,color:T.mut}}>{m.referencia}</div>}</td><td style={S.td}><span style={{padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:600,background:(CC[m.categoria]||T.mut)+"22",color:CC[m.categoria]||T.mut}}>{m.categoria}</span></td><td style={{...S.td,fontWeight:700,color:m.tipo==="ingreso"?T.acc:T.red,whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+ ":"ÔêÆ "}Q {fmt(m.monto)}</td><td style={S.td}><button onClick={()=>conciliar(m.id,!m.conciliado)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,padding:0}}>{m.conciliado?"✅":"Ô¼£"}</button></td><td style={S.td}><button onClick={async()=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("movimientos_bancarios",m.id);loadMovs(cuentaAct.id);}} style={{...S.btn("danger"),padding:"3px 7px",fontSize:11}}>­ƒùæ´©Å</button></td></tr>)}
              </tbody></table></div>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}

// ÔòÉÔòÉÔòÉ GASTOS PAGE ÔòÉÔòÉÔòÉ

