import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

function TabCatalogo({empId,showToast}){
  const [cuentas,setCuentas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"activo",subtipo:"",nivel:3,activa:true});
  const [buscar,setBuscar]=useState("");
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{
    setLoading(true);
    const d=await dbGet("catalogo_cuentas","&order=codigo.asc");
    if(Array.isArray(d)&&d.length>0){
      setCuentas(d);
    } else {
      // Load defaults if empty
      setCuentas(CUENTAS_DEFAULT.map((c,i)=>({...c,id:"def_"+i,activa:true})));
    }
    setLoading(false);
  };

  useEffect(()=>{load();},[]);

  const inicializarCatalogo=async()=>{
    if(!confirm("┬┐Cargar el catálogo de cuentas base? Esto creará las cuentas predeterminadas."))return;
    setSaving(true);
    for(const c of CUENTAS_DEFAULT){
      await dbIns("catalogo_cuentas",{...c,empresa_id:empId});
    }
    showToast("Catálogo inicializado ✔");
    setSaving(false);
    load();
  };

  const guardar=async()=>{
    if(!f.codigo.trim()||!f.nombre.trim()){showToast("Código y nombre requeridos","err");return;}
    setSaving(true);
    await dbIns("catalogo_cuentas",{...f,empresa_id:empId});
    showToast("Cuenta agregada ✔");setSaving(false);setShowForm(false);
    setF({codigo:"",nombre:"",tipo:"activo",subtipo:"",nivel:3,activa:true});
    load();
  };

  const toggleActiva=async(id,val)=>{
    await dbUpd("catalogo_cuentas",id,{activa:val});
    setCuentas(p=>p.map(c=>c.id===id?{...c,activa:val}:c));
  };

  const del=async id=>{
    if(!confirm("┬┐Eliminar esta cuenta?"))return;
    await dbDel("catalogo_cuentas",id);
    showToast("Eliminada");load();
  };

  const filtradas=buscar.trim()
    ?cuentas.filter(c=>c.codigo.includes(buscar)||c.nombre.toLowerCase().includes(buscar.toLowerCase()))
    :cuentas;

  const tiposGrupo=["activo","pasivo","capital","ingreso","gasto"];

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.inp,maxWidth:280}} value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="­ƒöì Buscar cuenta..."/>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        {cuentas.filter(c=>!c.id?.startsWith("def_")).length===0&&(
          <button onClick={inicializarCatalogo} disabled={saving} style={{...S.btn("blue"),fontSize:12}}>{saving?"Cargando...":"📋 Inicializar catálogo base"}</button>
        )}
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nueva cuenta"}</button>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Nueva cuenta contable</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,alignItems:"flex-end"}}>
            <Fld label="CÓDIGO"><input style={S.inp} value={f.codigo} onChange={e=>sf("codigo",e.target.value)} placeholder="5101"/></Fld>
            <Fld label="NOMBRE DE LA CUENTA"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Combustible"/></Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
                {tiposGrupo.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="NIVEL">
              <select style={S.sel} value={f.nivel} onChange={e=>sf("nivel",parseInt(e.target.value))}>
                <option value={1}>1 — Grupo principal</option>
                <option value={2}>2 — Subgrupo</option>
                <option value={3}>3 — Cuenta detalle</option>
              </select>
            </Fld>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar cuenta"}</button>
            <button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Código","Cuenta","Tipo","Nivel","Activa",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtradas.map((c,i)=>{
                const color=TIPO_COLOR[c.tipo]||T.mut;
                const indent=((c.nivel||1)-1)*16;
                return(
                  <tr key={c.id||i} style={{opacity:c.activa===false?0.45:1}}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo}</td>
                    <td style={{...S.td,paddingLeft:8+indent}}>
                      <span style={{fontWeight:c.nivel<=2?700:400,fontSize:c.nivel===1?14:13}}>{c.nombre}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color,background:color+"22"}}>{c.tipo}</span>
                    </td>
                    <td style={{...S.td,color:T.sub,textAlign:"center"}}>{c.nivel}</td>
                    <td style={{...S.td,textAlign:"center"}}>
                      <button onClick={()=>toggleActiva(c.id,!c.activa)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18}}>
                        {c.activa!==false?"✅":"Ô¼£"}
                      </button>
                    </td>
                    <td style={S.td}>
                      {!c.id?.startsWith("def_")&&(
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>­ƒùæ´©Å</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ÔöÇÔöÇ Diarios Manuales ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function TabDiarios({empId,showToast}){
  const [diarios,setDiarios]=useState([]);
  const [cuentas,setCuentas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [verDetalle,setVerDetalle]=useState(null);
  const [fd,setFd]=useState({fecha:today(),descripcion:"",referencia:"",estado:"borrador"});
  const [lineas,setLineas]=useState([
    {cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},
    {cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},
  ]);
  const sfd=(k,v)=>setFd(p=>({...p,[k]:v}));

  const load=async()=>{
    setLoading(true);
    const [d,c]=await Promise.all([
      dbGet("asientos_contables",""),
      dbGet("catalogo_cuentas","&order=codigo.asc&activa=eq.true")
    ]);
    setDiarios(Array.isArray(d)?d:[]);
    setCuentas(Array.isArray(c)?c:[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const totalDebe=lineas.reduce((s,l)=>s+(parseFloat(l.debe)||0),0);
  const totalHaber=lineas.reduce((s,l)=>s+(parseFloat(l.haber)||0),0);
  const cuadrado=Math.abs(totalDebe-totalHaber)<0.01;

  const addLinea=()=>setLineas(p=>[...p,{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0}]);
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const selCuenta=(idx,cuentaId)=>{
    const c=cuentas.find(x=>x.id===cuentaId);
    if(c)updateLinea(idx,"cuenta_id",c.id);
    if(c)updateLinea(idx,"cuenta_nombre",c.nombre);
    if(c)updateLinea(idx,"cuenta_codigo",c.codigo);
  };

  const guardar=async()=>{
    if(!fd.descripcion.trim()){showToast("Descripción requerida","err");return;}
    if(!cuadrado){showToast("El diario no cuadra — Debe Ôëá Haber","err");return;}
    if(lineas.filter(l=>l.cuenta_id&&(l.debe>0||l.haber>0)).length<2){showToast("Mínimo 2 líneas con cuenta y monto","err");return;}
    setSaving(true);
    const numero="DJ-"+Date.now().toString().slice(-6);
    const diario=await dbIns("asientos_contables",{...fd,empresa_id:empId,numero,total_debe:totalDebe,total_haber:totalHaber});
    if(diario&&diario[0]?.id){
      for(const l of lineas.filter(x=>x.cuenta_id)){
        await dbIns("asiento_lineas",{...l,diario_id:diario[0].id,debe:parseFloat(l.debe)||0,haber:parseFloat(l.haber)||0});
      }
    }
    showToast("Diario guardado ✔");setSaving(false);setShowForm(false);
    setFd({fecha:today(),descripcion:"",referencia:"",estado:"borrador"});
    setLineas([{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0}]);
    load();
  };

  const del=async id=>{if(!confirm("┬┐Eliminar este diario?"))return;await dbDel("asientos_contables",id);showToast("Eliminado");load();};

  const publicar=async d=>{
    await dbUpd("asientos_contables",d.id,{estado:"publicado"});
    showToast("Diario publicado ✔");load();
  };

  const imprimirDiario=async(d)=>{
    // Fetch lines
    const lineas=await dbGet("asiento_lineas","&diario_id=eq."+d.id+"&order=created_at.asc");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Diario ${d.numero}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1E293B}h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1B2D5C;color:#fff;padding:7px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #E2E8F0}.right{text-align:right}.total{font-weight:700;background:#F1F5F9}.green{color:#16A34A}.blue{color:#1D4ED8}@media print{button{display:none}}</style>
    </head><body>
    <h2>Tz'unun AutoRentas — Diario Manual</h2>
    <p><b>N┬░:</b> ${d.numero} &nbsp;|&nbsp; <b>Fecha:</b> ${d.fecha} &nbsp;|&nbsp; <b>Estado:</b> ${d.estado}</p>
    <p><b>Descripción:</b> ${d.descripcion}</p>
    ${d.referencia?`<p><b>Referencia:</b> ${d.referencia}</p>`:""}
    <table><thead><tr><th>Código</th><th>Cuenta</th><th>Descripción</th><th class="right">Debe</th><th class="right">Haber</th></tr></thead>
    <tbody>
    ${(Array.isArray(lineas)?lineas:[]).map(l=>`<tr>
      <td>${l.cuenta_codigo||""}</td><td>${l.cuenta_nombre||""}</td><td>${l.descripcion||""}</td>
      <td class="right green">${l.debe>0?"Q "+parseFloat(l.debe).toFixed(2):""}</td>
      <td class="right blue">${l.haber>0?"Q "+parseFloat(l.haber).toFixed(2):""}</td>
    </tr>`).join("")}
    </tbody>
    <tfoot><tr class="total"><td colspan="3">TOTALES</td><td class="right green">Q ${parseFloat(d.total_debe||0).toFixed(2)}</td><td class="right blue">Q ${parseFloat(d.total_haber||0).toFixed(2)}</td></tr></tfoot>
    </table>
    <script>window.onload=()=>window.print();</script></body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:T.sub}}>Registra asientos contables manuales con partida doble</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
          <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo diario"}</button>
        </div>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Nuevo Diario Manual</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,marginBottom:14}}>
            <Fld label="FECHA"><input style={S.inp} type="date" value={fd.fecha} onChange={e=>sfd("fecha",e.target.value)}/></Fld>
            <Fld label="DESCRIPCIÓN"><input style={S.inp} value={fd.descripcion} onChange={e=>sfd("descripcion",e.target.value)} placeholder="Ej: Registro de combustible semana del 21 al 25 de abril"/></Fld>
            <Fld label="REFERENCIA"><input style={S.inp} value={fd.referencia} onChange={e=>sfd("referencia",e.target.value)} placeholder="FAC-001, REC-045..."/></Fld>
            <Fld label="ESTADO">
              <select style={S.sel} value={fd.estado} onChange={e=>sfd("estado",e.target.value)}>
                <option value="borrador">­ƒôØ Borrador</option>
                <option value="publicado">✅ Publicado</option>
              </select>
            </Fld>
          </div>

          {/* Líneas del diario */}
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>L├ìNEAS DEL DIARIO (partida doble)</div>
          <div style={{...S.card,background:T.surf,padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Cuenta","Descripción de la línea","DEBE (Q)","HABER (Q)",""].map(h=><th key={h} style={{...S.th,padding:"8px 10px"}}>{h}</th>)}</tr></thead>
              <tbody>
                {lineas.map((l,idx)=>(
                  <tr key={idx}>
                    <td style={{padding:"6px 8px",width:260}}>
                      <select style={{...S.sel,fontSize:12,padding:"6px 8px"}} value={l.cuenta_id} onChange={e=>selCuenta(idx,e.target.value)}>
                        <option value="">Seleccionar cuenta...</option>
                        {cuentas.filter(c=>c.nivel===3||c.nivel===2).map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px"}} value={l.descripcion} onChange={e=>updateLinea(idx,"descripcion",e.target.value)} placeholder="Detalle..."/>
                    </td>
                    <td style={{padding:"6px 8px",width:110}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px",textAlign:"right",color:T.acc}} type="number" step="0.01" value={l.debe||""} onChange={e=>{updateLinea(idx,"debe",parseFloat(e.target.value)||0);if(parseFloat(e.target.value)>0)updateLinea(idx,"haber",0);}} placeholder="0.00"/>
                    </td>
                    <td style={{padding:"6px 8px",width:110}}>
                      <input style={{...S.inp,fontSize:12,padding:"6px 8px",textAlign:"right",color:T.blue}} type="number" step="0.01" value={l.haber||""} onChange={e=>{updateLinea(idx,"haber",parseFloat(e.target.value)||0);if(parseFloat(e.target.value)>0)updateLinea(idx,"debe",0);}} placeholder="0.00"/>
                    </td>
                    <td style={{padding:"6px 8px"}}>
                      {lineas.length>2&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"4px 8px",fontSize:11}}>Ô£ò</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:T.card}}>
                  <td colSpan={2} style={{padding:"8px 10px"}}>
                    <button onClick={addLinea} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>+ Agregar línea</button>
                  </td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:cuadrado?T.acc:T.red,fontSize:13}}>Q {fmt(totalDebe)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:cuadrado?T.acc:T.red,fontSize:13}}>Q {fmt(totalHaber)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance indicator */}
          <div style={{marginTop:10,padding:"10px 14px",borderRadius:9,background:cuadrado?T.accDim:T.redDim,border:"1px solid "+(cuadrado?T.acc:T.red)+"44",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600,color:cuadrado?T.acc:T.red}}>
              {cuadrado?"✅ El diario cuadra correctamente":"❌ No cuadra — diferencia: Q "+fmt(Math.abs(totalDebe-totalHaber))}
            </span>
            <div style={{fontSize:12,color:T.sub}}>Debe: Q {fmt(totalDebe)} | Haber: Q {fmt(totalHaber)}</div>
          </div>

          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={guardar} disabled={saving||!cuadrado} style={{...S.btn(cuadrado?"primary":"ghost"),flex:1,opacity:cuadrado?1:0.5}}>{saving?"Guardando...":"­ƒÆ¥ Guardar diario"}</button>
            <button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:diarios.length===0?<Empty icon="­ƒôÆ" msg="Sin diarios registrados" action="+ Nuevo diario" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {diarios.map(d=>(
            <div key={d.id} style={{...S.card,borderLeft:"3px solid "+(d.estado==="publicado"?T.acc:T.sec)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{d.numero}</div>
                  <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{d.descripcion}</div>
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>{fmtD(d.fecha)}{d.referencia?" · Ref: "+d.referencia:""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:d.estado==="publicado"?T.acc:T.sec,background:d.estado==="publicado"?T.accDim:T.secDim}}>
                    {d.estado==="publicado"?"✅ Publicado":"­ƒôØ Borrador"}
                  </span>
                  <div style={{marginTop:6,fontSize:12,color:T.sub}}>
                    <span style={{color:T.acc}}>Debe: Q {fmt(d.total_debe)}</span> | <span style={{color:T.blue}}>Haber: Q {fmt(d.total_haber)}</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                {d.estado==="borrador"&&<button onClick={()=>publicar(d)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>✅ Publicar</button>}
                <button onClick={()=>imprimirDiario(d)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>­ƒû¿´©Å Imprimir</button>
                {d.estado==="borrador"&&<button onClick={()=>del(d.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ÔöÇÔöÇ Página principal de Contabilidad ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export default function PageContabilidad({showToast,empId}){
  const [tab,setTab]=useState("catalogo");
  const [balanceData,setBalanceData]=useState(null);
  const [loadingBalance,setLoadingBalance]=useState(false);
  const calcBalance=async()=>{
    setLoadingBalance(true);
    const [gastos,movs,facturas]=await Promise.all([
      dbGet("gastos",""),dbGet("movimientos_bancarios",""),dbGet("facturas","")
    ]);
    const ingresos=(Array.isArray(facturas)?facturas:[]).filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);
    const egresosGas=(Array.isArray(gastos)?gastos:[]).reduce((s,g)=>s+(parseFloat(g.total)||0),0);
    const saldoBanca=(Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0)-
                    (Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="egreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
    const utilidad=ingresos-egresosGas;
    setBalanceData({ingresos,gastos:egresosGas,utilidad,saldoBanca,iva:ingresos*0.05,fecha:today()});
    setLoadingBalance(false);
  };
  useEffect(()=>{if(tab==="balance")calcBalance();},[tab]);

  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:"1px solid "+T.bord,marginBottom:18}}>
        {[{id:"catalogo",l:"📋 Catálogo de Cuentas"},{id:"asientos_contables",l:"­ƒôÆ Diarios Manuales"},{id:"balance",l:"📊 Balance General"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 18px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?"2px solid "+T.acc:"2px solid transparent"}}>
            {t.l}
          </button>
        ))}
      </div>
      {tab==="catalogo"&&<TabCatalogo empId={empId} showToast={showToast}/>}
      {tab==="asientos_contables"&&<TabDiarios empId={empId} showToast={showToast}/>}
      {tab==="balance"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:T.sub}}>Balance resumido al {fmtD(today())} — basado en facturas, gastos y movimientos registrados</div>
            <button onClick={calcBalance} disabled={loadingBalance} style={{...S.btn("ghost"),fontSize:12}}>{loadingBalance?"Calculando...":"↺ Actualizar"}</button>
          </div>
          {balanceData?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Estado de Resultados */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Estado de Resultados</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Ingresos (facturas emitidas)</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt(balanceData.ingresos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Gastos registrados</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:balanceData.utilidad>=0?T.accDim:T.redDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Utilidad bruta</span>
                  <span style={{fontWeight:800,fontSize:16,color:balanceData.utilidad>=0?T.acc:T.red}}>Q {fmt(balanceData.utilidad)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",marginTop:8}}><span style={{color:T.sub}}>IVA estimado (5%)</span><span style={{color:T.sec}}>Q {fmt(balanceData.iva)}</span></div>
              </div>
              {/* Posición Bancaria */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.blue,marginBottom:14}}>🏦 Posición Bancaria</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total ingresos banca</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt((balanceData.saldoBanca||0)+(balanceData.gastos||0))}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total egresos banca</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:T.blueDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Saldo neto</span>
                  <span style={{fontWeight:800,fontSize:16,color:T.blue}}>Q {fmt(Math.abs(balanceData.saldoBanca))}</span>
                </div>
                <div style={{marginTop:12,fontSize:12,color:T.mut}}>
                  ⚠️´©Å Este balance es un resumen estimado. Para contabilidad oficial utiliza los diarios manuales y el catálogo de cuentas.
                </div>
              </div>
            </div>
          ):<Spinner/>}
        </div>
      )}
    </div>
  );
}


// ÔöÇÔöÇ Error Boundary para capturar errores de renderizado ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  render(){
    if(this.state.hasError){
      return <div style={{padding:24,background:"#162032",borderRadius:12,border:"1px solid #EF4444",margin:16}}>
        <div style={{fontSize:14,fontWeight:700,color:"#EF4444",marginBottom:8}}>⚠️´©Å Error en este módulo</div>
        <div style={{fontSize:12,color:"#94A3B8",fontFamily:"monospace"}}>{String(this.state.error)}</div>
        <button onClick={()=>this.setState({hasError:false,error:null})} style={{marginTop:12,padding:"6px 14px",background:"#00D4AA",border:"none",borderRadius:6,fontWeight:600,color:"#0A0F1E",cursor:"pointer"}}>↺ Reintentar</button>
      </div>;
    }
    return this.props.children;
  }
}



