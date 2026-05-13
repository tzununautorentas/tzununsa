import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, today, newId, getEmpId, CAT_GASTO, EST_FAC } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
function ModGastos({empId,proveedores,showToast}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [filtroEst,setFiltroEst]=useState("todos");
  const [filtroCat,setFiltroCat]=useState("todas");
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{setLoading(true);const d=await dbGet("gastos");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);

  const calcTotal=(m,i)=>{
    const t=(parseFloat(m)||0)+(parseFloat(i)||0);
    sf("total",t>0?t.toFixed(2):"");
  };

  const abrirEditar=item=>{
    setEditItem(item);
    setF({fecha:item.fecha||today(),categoria:item.categoria||"combustible",descripcion:item.descripcion||"",monto:item.monto||"",iva:item.iva||"",total:item.total||"",metodo_pago:item.metodo_pago||"efectivo",referencia:item.referencia||"",estado:item.estado||"pendiente",proveedor_id:item.proveedor_id||"",vehiculo_ref:item.vehiculo_ref||"",notas:item.notas||""});
    setShowForm(true);
  };

  const guardar=async()=>{
    if(!f.descripcion.trim()||!(parseFloat(f.total)>0)){showToast("Descripción y total son requeridos","err");return;}
    setSaving(true);
    const payload={empresa_id:empId,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,proveedor_id:f.proveedor_id||null,notas:f.notas,fecha_pago:f.estado==="pagado"?f.fecha:null};
    if(editItem?.id) await dbUpd("gastos",editItem.id,payload);
    else await dbIns("gastos",payload);
    showToast("Gasto guardado ✔");setSaving(false);
    setShowForm(false);setEditItem(null);
    setF({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
    load();
  };

  const marcarPagado=async id=>{await dbUpd("gastos",id,{estado:"pagado",fecha_pago:today()});showToast("Marcado como pagado ✔");load();};
  const del=async id=>{if(!confirm("┬┐Eliminar este gasto?"))return;await dbDel("gastos",id);showToast("Eliminado");load();};

  const filtered=rows.filter(r=>{
    if(filtroEst!=="todos"&&r.estado!==filtroEst) return false;
    if(filtroCat!=="todas"&&r.categoria!==filtroCat) return false;
    return true;
  });

  const totalG=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPend=rows.filter(r=>r.estado==="pendiente").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPagado=rows.filter(r=>r.estado==="pagado").reduce((s,r)=>s+(parseFloat(r.total)||0),0);

  const porCat=CAT_GASTO.map(cat=>({cat,total:rows.filter(r=>r.categoria===cat).reduce((s,r)=>s+(parseFloat(r.total)||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total gastos",v:`Q ${fmt(totalG)}`,c:T.red,bg:T.redDim},{l:"Pagados",v:`Q ${fmt(totalPagado)}`,c:T.acc,bg:T.accDim},{l:"Pendientes",v:`Q ${fmt(totalPend)}`,c:T.sec,bg:T.secDim}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:16}}>
        <div>
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["todos","pendiente","pagado"].map(f=>(
              <button key={f} onClick={()=>setFiltroEst(f)} style={{...S.btn(filtroEst===f?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>
                {f==="todos"?"Todos":f==="pendiente"?"⏳ Pendientes":"✅ Pagados"}
              </button>
            ))}
            <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
            <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
            <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nuevo gasto"}</button>
          </div>

          {/* Formulario */}
          {showForm&&(
            <div style={{...S.card,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar gasto":"Registrar gasto / compra"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                <Fld label="CATEGOR├ìA">
                  <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                    {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Diésel — Toyota RAV4 viaje a Petén"/></Fld>
                <Fld label="PROVEEDOR">
                  <select style={S.sel} value={f.proveedor_id} onChange={e=>sf("proveedor_id",e.target.value)}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Fld>
                <Fld label="M├ëTODO DE PAGO">
                  <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                    <option value="efectivo">­ƒÆÁ Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="deposito">💰 Depósito</option>
                    <option value="tarjeta">­ƒÆ│ Tarjeta</option>
                    <option value="cheque">­ƒôä Cheque</option>
                    <option value="credito">📋 Crédito</option>
                  </select>
                </Fld>
                <Fld label="MONTO SIN IVA (GTQ)">
                  <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>{sf("monto",e.target.value);calcTotal(e.target.value,f.iva);}} placeholder="0.00"/>
                </Fld>
                <Fld label="IVA (GTQ)">
                  <input style={S.inp} type="number" step="0.01" value={f.iva} onChange={e=>{sf("iva",e.target.value);calcTotal(f.monto,e.target.value);}} placeholder="0.00"/>
                </Fld>
                <Fld label="TOTAL (GTQ)">
                  <input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/>
                </Fld>
                <Fld label="REFERENCIA / N┬░ FACTURA">
                  <input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REC-0045, FAC-001..."/>
                </Fld>
                <Fld label="ESTADO">
                  <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                    <option value="pendiente">⏳ Pendiente de pago</option>
                    <option value="pagado">✅ Pagado</option>
                  </select>
                </Fld>
                <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/></Fld>
                <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
                  <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar gasto"}</button>
                  <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla gastos */}
          {loading?<Spinner/>:filtered.length===0?<Empty icon="🛍️" msg="Sin gastos registrados" action="+ Registrar primer gasto" onAction={()=>setShowForm(true)}/>:(
            <div style={S.card}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Fecha","Descripción","Categoría","Proveedor","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(r=>{
                    const prov=proveedores.find(p=>p.id===r.proveedor_id);
                    return (
                      <tr key={r.id}>
                        <td style={{...S.td,whiteSpace:"nowrap",color:T.sub,fontSize:11}}>{fmtD(r.fecha)}</td>
                        <td style={{...S.td,fontWeight:500,maxWidth:200}}>
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{r.descripcion}</div>
                          {r.referencia&&<div style={{fontSize:10,color:T.mut,fontFamily:"monospace"}}>{r.referencia}</div>}
                        </td>
                        <td style={S.td}><CatBadge cat={r.categoria}/></td>
                        <td style={{...S.td,fontSize:11,color:T.sub}}>{prov?.nombre||"—"}</td>
                        <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(r.total)}</td>
                        <td style={S.td}>
                          <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="pagado"?T.accDim:T.secDim,color:r.estado==="pagado"?T.acc:T.sec}}>
                            {r.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{display:"flex",gap:4}}>
                            {r.estado==="pendiente"&&<button onClick={()=>marcarPagado(r.id)} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>Pagar</button>}
                            <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>Ô£Å´©Å</button>
                            <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>­ƒùæ´©Å</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:T.surf}}>
                    <td colSpan={4} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL FILTRADO</td>
                    <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(filtered.reduce((s,r)=>s+(parseFloat(r.total)||0),0))}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar categorías */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:12}}>POR CATEGOR├ìA</div>
            {porCat.map(({cat,total})=>(
              <div key={cat} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                    <span style={{fontSize:11,color:T.sub}}>{cat}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:600}}>Q {fmt(total)}</span>
                </div>
                <div style={{background:T.surf,borderRadius:4,height:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalG>0?Math.round((total/totalG)*100):0}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModProveedores({empId,showToast}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const load=async()=>{setLoading(true);const d=await dbGet("proveedores");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);

  const abrirEditar=item=>{
    setEditItem(item);
    setF({nombre:item.nombre||"",nit:item.nit||"",categoria:item.categoria||"combustible",contacto:item.contacto||"",telefono:item.telefono||"",email:item.email||"",direccion:item.direccion||"",credito_limite:item.credito_limite||"",notas:item.notas||""});
    setShowForm(true);
  };

  const guardar=async()=>{
    if(!f.nombre.trim()){showToast("El nombre del proveedor es requerido","err");return;}
    setSaving(true);
    const payload={empresa_id:empId,nombre:f.nombre,nit:f.nit,categoria:f.categoria,contacto:f.contacto,telefono:f.telefono,email:f.email,direccion:f.direccion,credito_limite:parseFloat(f.credito_limite)||0,notas:f.notas,activo:true};
    if(editItem?.id) await dbUpd("proveedores",editItem.id,payload);
    else await dbIns("proveedores",payload);
    showToast("Proveedor guardado ✔");setSaving(false);
    setShowForm(false);setEditItem(null);
    setF({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
    load();
  };

  const del=async id=>{if(!confirm("┬┐Eliminar este proveedor?"))return;await dbDel("proveedores",id);showToast("Eliminado");load();};

  const totalCredito=rows.reduce((s,r)=>s+(parseFloat(r.credito_usado)||0),0);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Proveedores activos",v:rows.filter(r=>r.activo).length,c:T.acc},{l:"Crédito total usado",v:`Q ${fmt(totalCredito)}`,c:T.red},{l:"Categorías",v:[...new Set(rows.map(r=>r.categoria))].length,c:T.blue}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:i>0?16:22,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo proveedor"}</button>
      </div>

      {/* Formulario */}
      {showForm&&(
        <div style={{...S.card,marginBottom:16,maxWidth:640}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar proveedor":"Nuevo proveedor"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre del proveedor"/></Fld>
            <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
            <Fld label="CATEGOR├ìA">
              <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="CONTACTO"><input style={S.inp} value={f.contacto} onChange={e=>sf("contacto",e.target.value)} placeholder="Nombre de la persona de contacto"/></Fld>
            <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
            <Fld label="EMAIL"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="proveedor@email.com"/></Fld>
            <Fld label="L├ìMITE DE CR├ëDITO (GTQ)"><input style={S.inp} type="number" value={f.credito_limite} onChange={e=>sf("credito_limite",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección del proveedor"/></Fld>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar proveedor"}</button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas proveedores */}
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒÅ¬" msg="Sin proveedores registrados" action="+ Agregar proveedor" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
          {rows.map(p=>{
            const creditoUsado=parseFloat(p.credito_usado)||0;
            const creditoLimite=parseFloat(p.credito_limite)||0;
            const pct=creditoLimite>0?Math.min(100,Math.round((creditoUsado/creditoLimite)*100)):0;
            return (
              <div key={p.id} style={{...S.card,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:CAT_COLOR[p.categoria]||T.mut}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{p.nombre}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>NIT: {p.nit||"—"}</div>
                  </div>
                  <CatBadge cat={p.categoria}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[["Contacto",p.contacto||"—"],["Teléfono",p.telefono||"—"],["Email",p.email||"—"],["Dirección",p.direccion||"—"]].map(([lbl,val])=>(
                    <div key={lbl} style={{background:T.surf,borderRadius:7,padding:"7px 10px"}}>
                      <div style={{fontSize:10,color:T.mut}}>{lbl}</div>
                      <div style={{fontSize:12,fontWeight:500,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
                    </div>
                  ))}
                </div>
                {creditoLimite>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                      <span>Crédito usado</span>
                      <span style={{color:pct>80?T.red:T.sub,fontWeight:600}}>Q {fmt(creditoUsado)} / Q {fmt(creditoLimite)}</span>
                    </div>
                    <div style={{background:T.surf,borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:4,background:pct>80?T.red:pct>50?T.sec:T.acc,width:`${pct}%`,transition:"width .3s"}}/>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>abrirEditar(p)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>Ô£Å´©Å Editar</button>
                  <button onClick={()=>del(p.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ RESERVAS ÔòÉÔòÉÔòÉ


// ÔöÇÔöÇ Estado inicial para FormReserva ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const EMPTY={
  cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
  fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"",destino:"",
  departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
  exch:7.70,con_tc:false
};


export default function PageGastos({showToast,empId}){
  const [tab,setTab]=useState("gastos");const [proveedores,setProveedores]=useState([]);
  useEffect(()=>{dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));},[]);
  const reloadProv=()=>dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
        {[{id:"gastos",l:"🛍️ Gastos y Compras"},{id:"proveedores",l:"­ƒÅ¬ Proveedores"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      </div>
      {tab==="gastos"&&<ModGastos empId={empId} proveedores={proveedores} showToast={showToast}/>}
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={(m,tp)=>{showToast(m,tp);reloadProv();}}/>}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ REPORTES PAGE ÔòÉÔòÉÔòÉ

