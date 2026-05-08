import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageMantenimiento({showToast,empId}){

}
  );
    </div>
      ))}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>­ƒùæ´©Å</button>
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>Ô£Å´©Å Editar</button>
                  {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                </div>
                  </div>
                    {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                    <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span>
                  <div style={{textAlign:"right"}}>
                  </div>
                    <div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" → "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div>
                  <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div key={r.id} style={S.card}>
            return(
            const sig=FLUJO_RES[r.estado]||[];
            const e=EST_RES[r.estado]||EST_RES.pendiente;
          {filtered.map(r=>{
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
      ):(loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>setVista("form")}/>:(
        <CalendarioReservas rows={rows} onEdit={r=>{setEditItem(r);setVista("form");}}/>
      {viewMode==="calendario"?(
      </div>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva reserva</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
        <button onClick={()=>setViewMode(viewMode==="lista"?"calendario":"lista")} style={{...S.btn("ghost"),fontSize:11}}>{viewMode==="lista"?"📅 Ver calendario":"📋 Ver lista"}</button>
        ))}
          </button>
            {f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}
          <button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=>(
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        ))}
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Pendientes",v:rows.filter(r=>r.estado==="pendiente").length,c:T.mut},{l:"Confirmadas",v:rows.filter(r=>r.estado==="confirmada").length,c:T.acc},{l:"En curso",v:rows.filter(r=>r.estado==="en_curso").length,c:T.blue},{l:"Completadas",v:rows.filter(r=>r.estado==="completada").length,c:T.acc}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
    <div>
  return(
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada ✔":"Guardada ✔");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const del=async id=>{if(!confirm("┬┐Eliminar reserva?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  };
    showToast("Estado actualizado");load();
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"disponible"});
      const res=rows.find(r=>r.id===id);
    if(estado==="cancelada"){
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"mantenimiento"});
      const res=rows.find(r=>r.id===id);
    if(estado==="completada"){
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"rentado"});
      const res=rows.find(r=>r.id===id);
    if(estado==="en_curso"){
    await dbUpd("reservas",id,{estado});
  const chEst=async(id,estado)=>{
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("reservas","");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [viewMode,setViewMode]=useState("lista"); // lista | calendario
  const [filtro,setFiltro]=useState("todas");
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageReservas({showToast,empId}){


}
  );
    </div>
      </div>
        ))}
          </div>
            <span style={{color:T.sub}}>{l}</span>
            <div style={{width:10,height:10,borderRadius:2,background:c+"44",border:"1px solid "+c}}/>
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
        {[["Pendiente","#64748B"],["Confirmada","#00D4AA"],["En curso","#3B82F6"],["Completada","#22C55E"],["Cancelada","#EF4444"]].map(([l,c])=>(
      <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
      </div>
        ))}
          </div>
            )}
              </>
                {cell.dayReservas.length>3&&<div style={{fontSize:9,color:T.mut}}>+{cell.dayReservas.length-3} más</div>}
                ))}
                  </div>
                    {r.cliente_nombre?.split(" ")[0]} {r.vehiculo_nombre?.split(" ")[0]||""}
                  <div key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{fontSize:9,fontWeight:600,background:(EST_C[r.estado]||"#64748B")+"33",color:EST_C[r.estado]||"#64748B",borderLeft:"2px solid "+(EST_C[r.estado]||"#64748B"),padding:"1px 4px",borderRadius:2,marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={r.cliente_nombre+" — "+r.vehiculo_nombre}>
                {cell.dayReservas.slice(0,3).map(r=>(
                <div style={{fontSize:12,fontWeight:cell.isToday?700:400,color:cell.isToday?T.acc:T.sub,marginBottom:3}}>{cell.dayNum}</div>
              <>
            {cell.isValid&&(
          <div key={idx} style={{minHeight:80,background:cell.isToday?T.accDim:cell.isValid?T.surf:"transparent",borderRadius:6,padding:4,border:cell.isToday?"1px solid "+T.acc:"1px solid transparent"}}>
        {cells.map((cell,idx)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {/* Calendar cells */}
      </div>
        {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#64748B",padding:"4px 0"}}>{d}</div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
      {/* Day headers */}
      </div>
        <button onClick={()=>setMes(new Date(year,month+1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ║</button>
        <div style={{fontSize:16,fontWeight:700}}>{MESES[month]} {year}</div>
        <button onClick={()=>setMes(new Date(year,month-1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ╣</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      {/* Header */}
    <div style={S.card}>
  return(

  }
    cells.push({dayNum,isValid,isToday,dayReservas});
    const dayReservas=isValid?getReservasForDay(dayNum):[];
    const isToday=isValid&&new Date().toDateString()===new Date(year,month,dayNum).toDateString();
    const isValid=dayNum>=1&&dayNum<=lastDay.getDate();
    const dayNum=i-startDow+1;
  for(let i=0;i<totalCells;i++){
  const cells=[];

  };
    });
      return fi<=dateStr && dateStr<=ff;
      const ff=r.fecha_fin?r.fecha_fin.slice(0,10):fi;
      const fi=r.fecha_inicio.slice(0,10);
      if(!r.fecha_inicio) return false;
    return rows.filter(r=>{
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const getReservasForDay=(day)=>{

  const totalCells=Math.ceil((startDow+lastDay.getDate())/7)*7;
  startDow=startDow===0?6:startDow-1; // convert to Mon=0
  let startDow=firstDay.getDay(); // 0=Sun
  // Start from Monday
  const lastDay=new Date(year,month+1,0);
  const firstDay=new Date(year,month,1);
  const month=mes.getMonth();
  const year=mes.getFullYear();

  const EST_C={pendiente:"#64748B",confirmada:"#00D4AA",en_curso:"#3B82F6",completada:"#22C55E",cancelada:"#EF4444"};
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const [mes,setMes]=useState(new Date());
function CalendarioReservas({rows,onNewReserva,onEdit}){
// ÔöÇÔöÇ Vista Calendario de Reservas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


}
  );
    </div>
      )}
        </div>
          </table>
            </tbody>
              })}
                );
                  </tr>
                    </td>
                      </div>
                        <button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
                        <button onClick={()=>abrirEditar(v)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                      <div style={{display:"flex",gap:4}}>
                    <td style={S.td}>
                    </td>
                      </select>
                        <option value="mantenimiento">­ƒƒí Mantenimiento</option>
                        <option value="rentado">­ƒöÁ Rentado</option>
                        <option value="disponible">✅ Disponible</option>
                      <select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={ev=>chEst(v.id,ev.target.value)}>
                    <td style={S.td}>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span></td>
                    <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:T.sub,fontSize:11}}>{v.placa}</td>
                    <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                    </td>
                      {v.propietario&&<div style={{fontSize:9,color:T.mut}}>{v.propietario==="propio"?"­ƒÅó Propio":v.propietario==="socio"?"­ƒñØ Socio":"­ƒöæ Alq."}</div>}
                      {v.codigo||"—"}
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>
                  <tr key={v.id}>
                return(
                const e=EST_VEH[v.estado]||EST_VEH.disponible;
              {rows.map(v=>{
            <tbody>
            <thead><tr>{["Código","Vehículo","Placa","Tipo","Km","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🚗" msg="Sin vehículos registrados" action="+ Registrar" onAction={abrirNuevo}/>:(
      </div>
        </div>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar vehículo</button>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} vehículos)</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      </div>
        ))}
          </div>
            <div style={{fontSize:12,color:T.sub}}>{s.l}</div>
            <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
        {[{l:"Disponibles",v:disp,c:T.acc,bg:T.accDim},{l:"Rentados",v:rent,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",v:mant,c:T.sec,bg:T.secDim}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
    <div>
  return(
  );
    </div>
      </div>
        </div>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
        <Fld label="KILOMETRAJE ACTUAL" span2><input style={S.inp} type="number" value={f.km_actual} onChange={e=>sf("km_actual",e.target.value)} placeholder="0"/></Fld>
        </Fld>
          </select>
            <option value="mantenimiento">­ƒƒí Mantenimiento</option>
            <option value="rentado">­ƒöÁ Rentado</option>
            <option value="disponible">✅ Disponible</option>
          <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
        <Fld label="ESTADO">
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="MODELO"><input style={S.inp} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="RAV4"/></Fld>
        <Fld label="MARCA"><input style={S.inp} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota"/></Fld>
        <Fld label="A├æO"><input style={S.inp} type="number" value={f.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
        <Fld label="PLACA"><input style={S.inp} value={f.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
        </Fld>
          </select>
            <option value="alquilado">­ƒöæ Alquilado</option>
            <option value="socio">­ƒñØ Socio (A)</option>
            <option value="propio">­ƒÅó Propio (P)</option>
          <select style={S.sel} value={f.propietario} onChange={e=>sf("propietario",e.target.value)}>
        <Fld label="PROPIETARIO">
        <Fld label="CÓDIGO VEH├ìCULO"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001P"/></Fld>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      </div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Registrar"} vehículo</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div style={{maxWidth:580}}>
  if(vista==="form")return(
  const mant=rows.filter(r=>r.estado==="mantenimiento").length;
  const rent=rows.filter(r=>r.estado==="rentado").length;
  const disp=rows.filter(r=>r.estado==="disponible").length;
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast("Estado actualizado");load();};
  const del=async id=>{if(!confirm("┬┐Eliminar vehículo?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  };
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
    else await dbIns("vehiculos",p);
    if(editItem?.id) await dbUpd("vehiculos",editItem.id,p);
    const p={...f,empresa_id:empId,anio:parseInt(f.anio)||new Date().getFullYear(),km_actual:parseInt(f.km_actual)||0};
    setSaving(true);
    if(!f.placa.trim()){showToast("Placa requerida","err");return;}
  const guardar=async()=>{
  const abrirNuevo=()=>{setF({placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});setEditItem(null);setVista("form");};
  const abrirEditar=v=>{setF({codigo:v.codigo||'',propietario:v.propietario||'propio',placa:v.placa||"",marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||new Date().getFullYear(),tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0});setEditItem(v);setVista("form");};
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("vehiculos","&order=codigo.asc,marca.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({codigo:"",propietario:"propio",placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageFlota({showToast,empId}){

}
  );
    </div>
      )}
        </div>
          </table>
            </tbody>
              })}
                );
                  </tr>
                    </td>
                      </div>
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
                        <button onClick={()=>abrirEditar(c)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                      <div style={{display:"flex",gap:4}}>
                    <td style={S.td}>
                    <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:tc.c,background:tc.bg}}>{tc.l}</span></td>
                    <td style={{...S.td,fontWeight:600}}>{c.nombre}</td>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo||"—"}</td>
                  <tr key={c.id}>
                return(
                const tc=TC[c.tipo]||TC.empresa;
              {rows.map(c=>{
            <tbody>
            <thead><tr>{["Código","Cliente","Tipo","NIT","Teléfono",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="👥" msg="Sin clientes registrados" action="+ Agregar cliente" onAction={abrirNuevo}/>:(
      </div>
        </div>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo cliente</button>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Directorio de Clientes ({rows.length})</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div>
  return(
  );
    </div>
      </div>
        </div>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar cliente"}</button>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
        <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección completa"/></Fld>
        <Fld label="CORREO ELECTRÓNICO"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="correo@empresa.com"/></Fld>
        <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
        <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
        </Fld>
          </select>
            <option value="persona">Persona natural</option>
            <option value="gobierno">Gobierno / ONG</option>
            <option value="empresa">Empresa</option>
          <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
        <Fld label="TIPO DE CLIENTE">
        <Fld label="NOMBRE / RAZÓN SOCIAL"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre completo"/></Fld>
        <Fld label="CÓDIGO DE CLIENTE"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001"/></Fld>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      </div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Nuevo"} cliente</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div style={{maxWidth:600}}>
  if(vista==="form")return(
  const TC={empresa:{c:T.sec,bg:T.secDim,l:"Empresa"},gobierno:{c:T.blue,bg:T.blueDim,l:"Gobierno/ONG"},persona:{c:T.acc,bg:T.accDim,l:"Persona"}};
  const del=async id=>{if(!confirm("┬┐Eliminar cliente?"))return;await dbDel("clientes",id);showToast("Eliminado");load();};
  };
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
    else await dbIns("clientes",p);
    if(editItem?.id) await dbUpd("clientes",editItem.id,p);
    const p={...f,empresa_id:empId};
    setSaving(true);
    if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}
  const guardar=async()=>{
  const abrirNuevo=()=>{setF({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});setEditItem(null);setVista("form");};
  const abrirEditar=c=>{setF({codigo:c.codigo||'',nombre:c.nombre||"",tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""});setEditItem(c);setVista("form");};
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("clientes","&order=codigo.asc,nombre.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageClientes({showToast,empId}){

}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"✅ Guardar y enviar cotización"}</button>
            <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>{saving?"Guardando...":"­ƒÆ¥ Guardar como borrador"}</button>
          <div style={S.card}>
          </div>
            )}
              </>
                </div>
                  {tf.conTC&&<div style={{fontSize:12,color:T.sub}}>Sin tarjeta: Q {fmt(tbase)}</div>}
                  </div>
                    <span>TOTAL</span><span>Q {fmt(ttot)}</span>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px"}}>
                </div>
                  {tf.conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(ttcr)} color={T.sec}/>}
                  <Row l={"IVA "+tf.iva+"%"} v={"Q "+fmt(tiva)}/>
                  <Row l="Subtotal" v={"Q "+fmt(tsub)}/>
                  <div style={{borderTop:"1px solid "+T.bord,margin:"8px 0"}}/>
                  <Row l="Varios" v={"Q "+fmt(misc)}/>
                  <Row l={"Combustible ("+fmt(gals)+" gal)"} v={"Q "+fmt(fuel)}/>
                  <Row l={"Aliment. (├ù"+d2+"d)"} v={"Q "+fmt(aT)}/>
                  <Row l={"Hospedaje (├ù"+d2+"d)"} v={"Q "+fmt(hT)}/>
                  <Row l={"Piloto (├ù"+d2+"d)"} v={"Q "+fmt(pT)}/>
                  <Row l={"Vehículo (├ù"+d2+"d)"} v={"Q "+fmt(vT)}/>
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                {tf.ruta&&<div style={{fontSize:12,color:T.acc,marginBottom:8}}>­ƒôì {tf.ruta} · {Math.round(tkm)} km totales</div>}
              <>
            ):(
              </>
                </div>
                  <div style={{fontSize:12,color:T.sub,marginTop:3}}>$ {fmt(exch>0?tot/exch:0)} USD</div>
                  {conTC&&<div style={{fontSize:12,color:T.sub}}>Efectivo: Q {fmt(base)}</div>}
                  </div>
                    <span>{conTC?"Con tarjeta":"TOTAL"}</span><span>Q {fmt(tot)}</span>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
                </div>
                  {conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(recTC)} color={T.sec}/>}
                  <Row l={"IVA "+iva+"%"} v={"Q "+fmt(ivaAmt)}/>
                  <Row l="Subtotal" v={"Q "+fmt(sub)}/>
                  <Row l="Tarifa" v={"Q "+fmt(rate)+"/día"}/>
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                {selVeh&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {selVeh.nombre} · {dias} día{dias!==1?"s":""}</div>}
              <>
            {tab==="renta"?(
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen del presupuesto</div>
          <div style={S.card}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* RESUMEN */}
        </div>
          )}
            </div>
              </div>
                <label htmlFor="conTC2" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción con tarjeta (+5%)</label>
                <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e=>stf("conTC",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
              <div style={{gridColumn:"span 2",display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              </Fld>
                </div>
                  <button onClick={()=>stf("pago","transferencia")} style={{...S.btn(tf.pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                  <button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                <div style={{display:"flex",gap:8}}>
              <Fld label="PAGO" span2>
              <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e=>stf("exch",e.target.value)}/></Fld>
              </Fld>
                </select>
                  <option value="12">12%</option><option value="5">5%</option><option value="0">Sin IVA</option>
                <select style={S.sel} value={tf.iva} onChange={e=>stf("iva",e.target.value)}>
              <Fld label="IVA">
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e=>stf("varios",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e=>stf("kmr",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e=>stf("kmi",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM POR GALÓN"><input style={S.inp} type="number" value={tf.kpg} onChange={e=>stf("kpg",e.target.value)} placeholder="27"/></Fld>
              <Fld label="PRECIO GALÓN (Q)"><input style={S.inp} type="number" value={tf.galon} onChange={e=>stf("galon",e.target.value)} placeholder="48"/></Fld>
              <Fld label="ALIMENTACIÓN/D├ìA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/D├ìA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO PILOTO/D├ìA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO VEH├ìCULO/D├ìA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="D├ìAS"><input style={S.inp} type="number" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              </Fld>
                </select>
                  {RUTAS.map(r=><option key={r.d} value={r.d}>{r.d} — {r.km} km · {r.dias}d</option>)}
                  <option value="">Seleccionar destino...</option>
                }}>
                  else stf("ruta",e.target.value);
                  if(r){stf("ruta",r.d);stf("kmi",r.km);stf("kmr",r.km);stf("dias",r.dias);}
                  const r=RUTAS.find(x=>x.d===e.target.value);
                <select style={S.sel} value={tf.ruta} onChange={e=>{
              <Fld label="DESTINO (tabla de rutas)" span2>
              </Fld>
                <ClienteBuscador value={tf.cliente} onChange={v=>stf("cliente",v)} empId={empId}/>
              <Fld label="CLIENTE" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          ):(
            </div>
              </div>
                <label htmlFor="conTC" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción de pago con tarjeta (+5%)</label>
                <input type="checkbox" id="conTC" checked={conTC} onChange={e=>setConTC(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              </Fld>
                </div>
                  <button onClick={()=>setPago("transferencia")} style={{...S.btn(pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                  <button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                <div style={{display:"flex",gap:8}}>
              <Fld label="M├ëTODO DE PAGO">
              <Fld label="TASA DE CAMBIO (Q por $1)"><input style={S.inp} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/></Fld>
              </Fld>
                </select>
                  <option value={0}>Sin IVA</option>
                  <option value={5}>5% Pequeño Contribuyente</option>
                  <option value={12}>12% Régimen General</option>
                <select style={S.sel} value={iva} onChange={e=>setIva(parseInt(e.target.value))}>
              <Fld label="IVA">
              </Fld>
                </select>
                  {CATALOGO.map(v=><option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                  <option value="">Seleccionar...</option>
                <select style={S.sel} value={selVeh?.id||""} onChange={e=>setSelVeh(CATALOGO.find(v=>v.id===e.target.value)||null)}>
              <Fld label="VEH├ìCULO">
              <Fld label="D├ìAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(Math.max(1,parseInt(e.target.value)||1))}/></Fld>
              </Fld>
                <ClienteBuscador value={cli} onChange={setCli} empId={empId}/>
              <Fld label="CLIENTE">
            <div style={{display:"grid",gap:11}}>
          {tab==="renta"?(
        <div style={S.card}>
        {/* FORM */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        ))}
          <button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"primary":"ghost")}}>{t.l}</button>
        {[{id:"renta",l:"­ƒöæ Renta por días"},{id:"traslado",l:"­ƒù║ Traslado/Viaje"}].map(t=>(
      <div style={{display:"flex",gap:8,marginBottom:16}}>
    <div>
  return(

  const Row=({l,v,bold,color})=><div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:bold?14:13,fontWeight:bold?700:400,color:color||(bold?T.txt:T.sub)}}><span>{l}</span><span>{v}</span></div>;

  };
    setSaving(false);
    else{showToast("Error al guardar","err");}
    if(r&&!r.error){showToast(estado==="enviada"?"Cotización guardada ✔":"Borrador guardado ✔");}
    const r=await dbIns("cotizaciones",p);
    const p={empresa_id:empId,tipo:tab,cliente_nombre:cn,numero:"COT-"+Date.now().toString().slice(-6),dias:tab==="renta"?dias:d2,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||5,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttcr,total_gtq:tab==="renta"?tot:ttot,total_usd:(tab==="renta"?tot:ttot)/(tab==="renta"?exch:parseFloat(tf.exch)||7.70),vehiculo_nombre:selVeh?.nombre||"",estado,km_ida:kmi,km_regreso:kmr,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,gastos_varios:misc};
    setSaving(true);
    if(!cn.trim()){showToast("Ingresa el nombre del cliente","err");return;}
    const cn=tab==="renta"?cli:tf.cliente;
  const guardar=async(estado)=>{

  const ttot=tbase+ttcr;
  const ttcr=tf.conTC?tbase*0.05:0;
  const tbase=tsub+tiva;
  const tiva=tsub*(parseFloat(tf.iva)||0)/100;
  const tsub=vT+pT+hT+aT+fuel+misc;
  const misc=parseFloat(tf.varios)||0;
  const aT=d2*(parseFloat(tf.ali)||0);
  const hT=d2*(parseFloat(tf.hos)||0);
  const pT=d2*(parseFloat(tf.pil)||0);
  const vT=d2*(parseFloat(tf.veh)||0);
  const fuel=gals*(parseFloat(tf.galon)||0);
  const gals=tkm/kpg;
  const kpg=parseFloat(tf.kpg)||1;
  const tkm=kmi+kmr;
  const kmr=parseFloat(tf.kmr)||0;
  const kmi=parseFloat(tf.kmi)||0;
  const d2=parseFloat(tf.dias)||0;
  const tot=base+recTC;
  const recTC=conTC?Math.round(base*0.05*100)/100:0;
  const base=sub+ivaAmt;
  const ivaAmt=Math.round(sub*iva/100*100)/100;
  const sub=dias*rate;
  const rate=selVeh?tarifaFn(selVeh,dias):0;
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const stf=(k,v)=>setTf(p=>({...p,[k]:v}));
  const [tf,setTf]=useState({cliente:"",dias:1,veh:0,pil:0,hos:0,ali:0,galon:48,kpg:27,kmi:0,kmr:0,varios:0,iva:5,pago:"efectivo",conTC:false,exch:7.70,ruta:""});
  const [saving,setSaving]=useState(false);
  const [exch,setExch]=useState(7.70);
  const [conTC,setConTC]=useState(false);
  const [pago,setPago]=useState("efectivo");
  const [iva,setIva]=useState(5);
  const [dias,setDias]=useState(1);
  const [selVeh,setSelVeh]=useState(null);
  const [cli,setCli]=useState("");
  const [tab,setTab]=useState("renta");
function PageCalculadora({showToast,empId}){


}
  );
    </div>
      )}
        </div>
          )}
            </div>
              </div>
                <button onClick={()=>setShowNew(false)} style={{...S.btn("ghost"),flex:1,fontSize:11,padding:"6px"}}>Cancelar</button>
                <button onClick={agregarCliente} disabled={saving} style={{...S.btn("primary"),flex:1,fontSize:11,padding:"6px"}}>{saving?"...":"✔ Guardar"}</button>
              <div style={{display:"flex",gap:6}}>
              </select>
                <option value="persona">Persona</option>
                <option value="gobierno">Gobierno/ONG</option>
                <option value="empresa">Empresa</option>
              <select style={{...S.sel,marginBottom:6,fontSize:12}} value={newTipo} onChange={e=>setNewTipo(e.target.value)}>
              <input style={{...S.inp,marginBottom:6,fontSize:12}} value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Nombre del cliente"/>
            <div style={{padding:10,borderTop:"1px solid "+T.bord}}>
          ):(
            </div>
              <span>+</span> Agregar nuevo cliente
              style={{padding:"8px 12px",cursor:"pointer",fontSize:12,color:T.acc,fontWeight:600,borderTop:"1px solid "+T.bord,display:"flex",alignItems:"center",gap:6}}>
            <div onClick={()=>{setShowNew(true);setNewNombre(value);}}
          {!showNew?(
          {/* Agregar nuevo */}
          {filtered.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:T.mut}}>No encontrado</div>}
          ))}
            </div>
              <span style={{fontSize:10,color:T.mut}}>{c.tipo}</span>
              <span>{c.nombre}</span>
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.surf}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid "+T.bord+"33",display:"flex",justifyContent:"space-between",alignItems:"center"}}
            <div key={i} onClick={()=>{onChange(c.nombre);setOpen(false);}}
          {filtered.map((c,i)=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.card,border:"1px solid "+T.bord,borderRadius:8,zIndex:100,maxHeight:220,overflowY:"auto",marginTop:2}}>
      {open&&(
      />
        placeholder="Escribe para buscar cliente..."
        onFocus={()=>setOpen(true)}
        onChange={e=>{onChange(e.target.value);setOpen(true);setShowNew(false);}}
        style={S.inp} value={value}
      <input
    <div ref={ref} style={{position:"relative"}}>
  return(

  };
    setSaving(false);
    }
      setShowNew(false);setNewNombre("");setOpen(false);
      setClientes(p=>[...p,{nombre:newNombre,tipo:newTipo}]);
      onChange(newNombre);
    if(r&&!r.error){
    const r=await dbIns("clientes",{nombre:newNombre,tipo:newTipo,empresa_id:empId});
    setSaving(true);
    if(!newNombre.trim())return;
  const agregarCliente=async()=>{

  const filtered=value.length>0?clientes.filter(c=>c.nombre.toLowerCase().includes(value.toLowerCase())):clientes.slice(0,8);

  },[]);
    return()=>document.removeEventListener("mousedown",h);
    document.addEventListener("mousedown",h);
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
  useEffect(()=>{

  },[]);
    dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));
  useEffect(()=>{

  const ref=useRef(null);
  const [newTipo,setNewTipo]=useState("empresa");
  const [newNombre,setNewNombre]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [saving,setSaving]=useState(false);
  const [open,setOpen]=useState(false);
  const [clientes,setClientes]=useState([]);
function ClienteBuscador({value,onChange,empId}){
// ÔöÇÔöÇ Buscador de clientes con autocompletado ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ



// ÔòÉÔòÉÔòÉ MANTENIMIENTO DE VEH├ìCULOS ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ


// ÔòÉÔòÉÔòÉ APP PRINCIPAL ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>}
        </div>
          </div>
            {[{v:12,l:"12% — Régimen General"},{v:5,l:"5% — Pequeño Contribuyente"},{v:0,l:"Sin IVA"}].map(o=><button key={o.v} onClick={()=>setIva(o.v)} style={{...S.btn(iva===o.v?"primary":"ghost"),textAlign:"left"}}>{o.l}</button>)}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>🧾 Régimen Fiscal</div>
        <div style={S.card}>
        </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"10px 14px",background:T.surf,borderRadius:9,fontSize:14}}><span style={{color:T.sub}}>1 USD =</span><span style={{fontWeight:800,color:T.acc}}>Q {fmt(exch)}</span></div>
          <input style={{...S.inp,fontSize:20,fontWeight:700,color:T.acc}} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/>
          <label style={S.lbl}>GTQ POR 1 USD</label>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>­ƒÆ▒ Tasa de Cambio del Día</div>
        <div style={S.card}>
      {tab==="fiscal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      </div>}
        <div style={{marginTop:10,fontSize:11,color:T.mut}}>* 1-7 días = diaria · 8-29 días = semanal · 30+ días = mensual</div>
        </table>
          </tr>)}</tbody>
            <td style={S.td}><div style={{display:"flex",gap:4}}>{editId===v.id?<><button onClick={saveEdit} style={{...S.btn("primary"),padding:"4px 9px",fontSize:11}}>✔</button><button onClick={()=>setEditId(null)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>Ô£ò</button></>:<><button onClick={()=>{setEditId(v.id);setEditVals({...v});}} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>Ô£Å´©Å</button><button onClick={()=>delVeh(v.id)} style={{...S.btn("danger"),padding:"4px 9px",fontSize:11}}>­ƒùæ´©Å</button></>}</div></td>
            {["dia","sem","mes"].map(c=><td key={c} style={{...S.td,fontWeight:700,color:T.acc}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12,width:80}} type="number" value={editVals[c]} onChange={e=>setEditVals(p=>({...p,[c]:parseFloat(e.target.value)||0}))}/>:`Q ${fmt(v[c])}`}</td>)}
            <td style={S.td}>{editId===v.id?<select style={{...S.sel,padding:"5px 8px",fontSize:12}} value={editVals.tipo} onChange={e=>setEditVals(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>:v.tipo}</td>
            <td style={{...S.td,fontWeight:600}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12}} value={editVals.nombre} onChange={e=>setEditVals(p=>({...p,nombre:e.target.value}))}/>:v.nombre}</td>
          <tbody>{catalogo.map(v=><tr key={v.id}>
          <thead><tr>{["Vehículo","Tipo","Q/Día","Q/Semana","Q/Mes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        </div>}
          <button onClick={addVeh} style={{...S.btn("primary"),padding:"9px 14px",alignSelf:"flex-end"}}>+</button>
          <Fld label="Q/MES"><input style={S.inp} type="number" value={newVeh.mes} onChange={e=>setNewVeh(p=>({...p,mes:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/SEM"><input style={S.inp} type="number" value={newVeh.sem} onChange={e=>setNewVeh(p=>({...p,sem:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/D├ìA"><input style={S.inp} type="number" value={newVeh.dia} onChange={e=>setNewVeh(p=>({...p,dia:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="TIPO"><select style={S.sel} value={newVeh.tipo} onChange={e=>setNewVeh(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
          <Fld label="NOMBRE"><input style={S.inp} value={newVeh.nombre} onChange={e=>setNewVeh(p=>({...p,nombre:e.target.value}))} placeholder="Nombre..."/></Fld>
        {showNewVeh&&<div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
        </div>
          <button onClick={()=>setShowNewVeh(!showNewVeh)} style={{...S.btn(showNewVeh?"warn":"primary"),fontSize:12}}>{showNewVeh?"Cancelar":"+ Agregar vehículo"}</button>
          <div style={{fontSize:13,fontWeight:700}}>Catálogo y Tarifas</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      {tab==="tarifas"&&<div style={S.card}>
      </div>}
        </div>
          </div>
            <div>🏦 Banrural — 3309159475</div>
            <div>🏦 Banco Industrial — 853-000016-8</div>
          <div style={{...S.card,marginTop:12,background:T.surf,fontSize:12,color:T.sub,lineHeight:2}}>
          </div>
            </div>
              <div>­ƒåö NIT: {emp.nit||"16693949"}</div>
              <div>Ô£ë´©Å {emp.email||"tzununautorentas@gmail.com"}</div>
              <div>­ƒô× {emp.telefono||"502-31221538"}</div>
              <div>­ƒôì {emp.direccion||"2da. Av. 0-68, Col. Bran, Zona 3"}</div>
            <div style={{fontSize:11,color:T.sub,lineHeight:1.8}}>
            </div>
              <div><div style={{fontSize:14,fontWeight:800,color:T.acc}}>{emp.nombre||"Tz'unun AutoRentas"}</div><div style={{fontSize:10,color:T.sub}}>M├üS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</div></div>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{background:T.surf,borderRadius:10,padding:16,border:`1px solid ${T.bord}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:12}}>Vista previa encabezado</div>
        <div style={S.card}>
        </div>
          </div>
            <div style={{gridColumn:"span 2"}}><button onClick={guardarEmp} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button></div>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={emp.direccion||""} onChange={e=>se("direccion",e.target.value)} placeholder="2da. Avenida 0-68, Col. Bran, Zona 3"/></Fld>
            <Fld label="EMAIL" span2><input style={S.inp} value={emp.email||""} onChange={e=>se("email",e.target.value)} placeholder="tzununautorentas@gmail.com"/></Fld>
            <Fld label="TEL├ëFONO"><input style={S.inp} value={emp.telefono||""} onChange={e=>se("telefono",e.target.value)} placeholder="502-31221538"/></Fld>
            <Fld label="NIT"><input style={S.inp} value={emp.nit||""} onChange={e=>se("nit",e.target.value)} placeholder="16693949"/></Fld>
            <Fld label="NOMBRE" span2><input style={S.inp} value={emp.nombre||""} onChange={e=>se("nombre",e.target.value)} placeholder="Tz'unun AutoRentas"/></Fld>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Datos de la Empresa</div>
        <div style={S.card}>
      {tab==="empresa"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      </div>
        {[{id:"empresa",l:"­ƒÅó Empresa"},{id:"tarifas",l:"💰 Tarifas"},{id:"fiscal",l:"🧾 Fiscal"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:20}}>
    <div>
  return(
  const addVeh=()=>{if(!newVeh.nombre.trim()){showToast("Nombre requerido","err");return;}setCatalogo(p=>[...p,{...newVeh,id:`c${Date.now()}`,dia:parseFloat(newVeh.dia)||0,sem:parseFloat(newVeh.sem)||0,mes:parseFloat(newVeh.mes)||0}]);setNewVeh({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});setShowNewVeh(false);showToast("Agregado ✔");};
  const delVeh=id=>{if(!confirm("┬┐Eliminar?"))return;setCatalogo(p=>p.filter(v=>v.id!==id));};
  const saveEdit=()=>{setCatalogo(p=>p.map(v=>v.id===editId?{...v,...editVals}:v));setEditId(null);showToast("Tarifa actualizada ✔");};
  const se=(k,v)=>setEmp(p=>({...p,[k]:v}));
  const guardarEmp=async()=>{if(!emp.nombre?.trim()){showToast("Nombre requerido","err");return;}setSaving(true);if(empId)await dbUpd("empresas",empId,{nombre:emp.nombre,nit:emp.nit,direccion:emp.direccion,telefono:emp.telefono,email:emp.email});showToast("Guardado ✔");setSaving(false);};
  useEffect(()=>{dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0]){setEmp(d[0]);setEmpId(d[0].id);}});},[]);
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const [showNewVeh,setShowNewVeh]=useState(false);const [newVeh,setNewVeh]=useState({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
  const [editId,setEditId]=useState(null);const [editVals,setEditVals]=useState({});
  const [catalogo,setCatalogo]=useState(CATALOGO.map(v=>({...v})));
  const [exch,setExch]=useState(7.70);const [iva,setIva]=useState(5);
  const [tab,setTab]=useState("empresa");const [emp,setEmp]=useState({});const [empId,setEmpId]=useState(null);const [saving,setSaving]=useState(false);
function PageConfiguracion({showToast}){
// ÔòÉÔòÉÔòÉ CONFIGURACIÓN ÔòÉÔòÉÔòÉ

}
  );
    </div>
      {loading?<Spinner/>:data&&<>{tab==="ventas"&&<ReporteVentas data={data}/>}{tab==="flota"&&<ReporteFlota data={data}/>}{tab==="gastos"&&<ReporteGastos data={data}/>}{tab==="clientes"&&<ReporteClientes data={data}/>}</>}
      </div>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺ Actualizar</button>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
    <div>
  return(
  const TABS=[{id:"ventas",l:"📊 Ventas"},{id:"flota",l:"🚗 Flota"},{id:"gastos",l:"🛍️ Gastos"},{id:"clientes",l:"👥 Clientes"}];
  };
    setLoading(false);
    setData({vehiculos:Array.isArray(vehiculos)?vehiculos:[],reservas:Array.isArray(reservas)?reservas:[],cotizaciones:Array.isArray(cotizaciones)?cotizaciones:[],facturas:Array.isArray(facturas)?facturas:[],gastos:Array.isArray(gastos)?gastos:[],clientes:Array.isArray(clientes)?clientes:[],movimientos:Array.isArray(movimientos)?movimientos:[]});
    const [vehiculos,reservas,cotizaciones,facturas,gastos,clientes,movimientos]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("gastos",""),dbGet("clientes",""),dbGet("movimientos_bancarios","")]);
    setLoading(true);
  const load=async()=>{
  useEffect(()=>{load();},[]);
  const [tab,setTab]=useState("ventas");const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
function PageReportes(){
// ÔòÉÔòÉÔòÉ REPORTES PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={(m,tp)=>{showToast(m,tp);reloadProv();}}/>}
      {tab==="gastos"&&<ModGastos empId={empId} proveedores={proveedores} showToast={showToast}/>}
      </div>
        {[{id:"gastos",l:"🛍️ Gastos y Compras"},{id:"proveedores",l:"­ƒÅ¬ Proveedores"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
    <div>
  return(
  const reloadProv=()=>dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));
  useEffect(()=>{dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));},[]);
  const [tab,setTab]=useState("gastos");const [proveedores,setProveedores]=useState([]);
function PageGastos({showToast,empId}){
// ÔòÉÔòÉÔòÉ GASTOS PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        </div>
          </>}
            )}
              </tbody></table></div>
              <tbody>{movsFil.map(m=><tr key={m.id}><td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(m.fecha)}</td><td style={{...S.td,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:175}}>{m.descripcion}</div>{m.referencia&&<div style={{fontSize:9,color:T.mut}}>{m.referencia}</div>}</td><td style={S.td}><span style={{padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:600,background:(CC[m.categoria]||T.mut)+"22",color:CC[m.categoria]||T.mut}}>{m.categoria}</span></td><td style={{...S.td,fontWeight:700,color:m.tipo==="ingreso"?T.acc:T.red,whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+ ":"ÔêÆ "}Q {fmt(m.monto)}</td><td style={S.td}><button onClick={()=>conciliar(m.id,!m.conciliado)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,padding:0}}>{m.conciliado?"✅":"Ô¼£"}</button></td><td style={S.td}><button onClick={async()=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("movimientos_bancarios",m.id);loadMovs(cuentaAct.id);}} style={{...S.btn("danger"),padding:"3px 7px",fontSize:11}}>­ƒùæ´©Å</button></td></tr>)}
              <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Cat.","Monto","Ô£ô",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            {movsFil.length===0?<Empty icon="­ƒÆ│" msg="Sin movimientos" action="+ Registrar" onAction={()=>setShowForm(true)}/>:(
            </div>
              {["todos","conciliado","pendiente"].map(t=><button key={t} onClick={()=>setFiltroC(t)} style={{...S.btn(filtroC===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todo":t==="conciliado"?"✅ Conciliados":"⏳ Pendientes"}</button>)}
              {["todos","ingreso","egreso"].map(t=><button key={t} onClick={()=>setFiltroT(t)} style={{...S.btn(filtroT===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todos":t==="ingreso"?"Ô¼å Ingresos":"Ô¼ç Egresos"}</button>)}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            </div>}
              </div>
                <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardarMov} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"­ƒÆ¥ Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:18}}><input type="checkbox" checked={f.conciliado} onChange={e=>sf("conciliado",e.target.checked)} style={{width:16,height:16}}/><label style={{...S.lbl,marginBottom:0}}>CONCILIADO</label></div>
                <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="N┬░ factura..."/></Fld>
                <Fld label="CATEGOR├ìA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
                <Fld label="MONTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/></Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripción..."/></Fld>
                <Fld label="TIPO"><div style={{display:"flex",gap:8}}><button onClick={()=>sf("tipo","ingreso")} style={{...S.btn(f.tipo==="ingreso"?"primary":"ghost"),flex:1,fontSize:12}}>Ô¼å Ingreso</button><button onClick={()=>sf("tipo","egreso")} style={{...S.btn(f.tipo==="egreso"?"danger":"ghost"),flex:1,fontSize:12}}>Ô¼ç Egreso</button></div></Fld>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            {showForm&&<div style={{...S.card,marginBottom:14}}>
            </div>
              </div>
                <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
                <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
              <div style={{display:"flex",gap:6}}>
              <div><div style={{fontSize:14,fontWeight:700}}>{cuentaAct.banco}</div><div style={{fontSize:12,color:T.sub}}>{cuentaAct.numero_cuenta}</div></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          {cuentaAct&&<>
        <div>
        </div>
          {loading?<Spinner/>:cuentas.length===0?<Empty icon="🏦" msg="Sin cuentas registradas"/>:cuentas.map(c=><div key={c.id} onClick={()=>setCuentaAct(c)} style={{...S.card,cursor:"pointer",border:`1px solid ${cuentaAct?.id===c.id?T.acc:T.bord}`,marginBottom:10,background:cuentaAct?.id===c.id?T.accDim:T.card}}><div style={{fontSize:13,fontWeight:700}}>{c.banco}</div><div style={{fontSize:11,color:T.sub}}>{c.numero_cuenta} · {c.moneda}</div><div style={{fontSize:18,fontWeight:800,color:T.acc,marginTop:8}}>Q {fmt(c.saldo_actual)}</div></div>)}
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>MIS CUENTAS</div>
        <div>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:18}}>
      </div>
        {[{l:"Saldo total GTQ",v:`Q ${fmt(saldoGTQ)}`,c:T.acc,bg:T.accDim},{l:"Ingresos",v:`Q ${fmt(ing)}`,c:T.acc,bg:T.accDim},{l:"Sin conciliar",v:movs.filter(m=>!m.conciliado).length,c:T.sec,bg:T.secDim}].map((s,i)=><div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}><div style={{fontSize:11,color:T.mut}}>{s.l}</div><div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
      {exportar&&<ModalExportar titulo="Movimientos Bancarios" datos={movs} campos={[{label:"Fecha",key:"fecha"},{label:"Descripción",key:"descripcion"},{label:"Categoría",key:"categoria"},{label:"Tipo",key:"tipo"},{label:"Monto",key:"monto"},{label:"Referencia",key:"referencia"},{label:"Conciliado",key:"conciliado"}]} onClose={()=>setExportar(false)}/>}
    <div>
  return(
  const saldoGTQ=cuentas.filter(c=>c.moneda==="GTQ").reduce((s,c)=>s+(parseFloat(c.saldo_actual)||0),0);
  const ing=movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const movsFil=movs.filter(m=>{if(filtroT!=="todos"&&m.tipo!==filtroT)return false;if(filtroC==="conciliado"&&!m.conciliado)return false;if(filtroC==="pendiente"&&m.conciliado)return false;return true;});
  const conciliar=async(id,val)=>{await dbUpd("movimientos_bancarios",id,{conciliado:val});loadMovs(cuentaAct.id);};
  const guardarMov=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.monto)>0)){showToast("Descripción y monto requeridos","err");return;}setSaving(true);await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:cuentaAct.id,fecha:f.fecha,tipo:f.tipo,descripcion:f.descripcion,monto:parseFloat(f.monto),referencia:f.referencia,categoria:f.categoria,conciliado:f.conciliado,notas:f.notas});showToast("Guardado ✔");setSaving(false);setShowForm(false);setF({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});loadMovs(cuentaAct.id);};
  useEffect(()=>{if(cuentaAct)loadMovs(cuentaAct.id);},[cuentaAct?.id]);
  const loadMovs=async(cid)=>{if(!cid)return;const m=await dbGet("movimientos_bancarios",`&cuenta_id=eq.${cid}`);setMovs(Array.isArray(m)?m:[]);};
  const loadCuentas=async()=>{setLoading(true);const c=await dbGet("cuentas_bancarias");const arr=Array.isArray(c)?c:[];setCuentas(arr);if(arr.length>0){const first=arr[0];setCuentaAct(first);}setLoading(false);};
  useEffect(()=>{loadCuentas();},[]);
  const CC={ventas:T.acc,combustible:T.sec,mantenimiento:T.blue,salarios:T.green,seguros:T.purple,servicios:T.acc,oficina:T.mut,otros:T.sub};
  const CATS=["ventas","combustible","mantenimiento","salarios","seguros","servicios","oficina","otros"];
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [saving,setSaving]=useState(false);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");const [exportar,setExportar]=useState(false);
function PageBanca({showToast,empId}){
// ÔòÉÔòÉÔòÉ LA BANCA ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </tbody></table></div>
        <tbody>{filtered.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;const saldo=parseFloat(r.saldo_pendiente)||0;const ant=parseFloat(r.anticipo_aplicado)||0;return <tr key={r.id}><td style={S.td}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc,fontWeight:700}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>Ô£ô DTE</div>}{r.motivo_anulacion&&<div style={{fontSize:9,color:T.red}}>⚠️ {r.motivo_anulacion.slice(0,20)}</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:10,color:T.mut}}>{r.nit_receptor}</div></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={{...S.td,color:ant>0?T.acc:T.mut,fontSize:12}}>{ant>0?"Q "+fmt(ant):"—"}</td><td style={{...S.td,fontWeight:700,color:saldo>0?T.sec:T.acc}}>{r.estado==="anulada"?"—":"Q "+fmt(saldo)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:90}}>{r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒöÉ DTE</button>}{["emitida","certificada","parcial"].includes(r.estado)&&<button onClick={()=>setMPago(r)} style={{...S.btn("primary"),padding:"3px 7px",fontSize:10,width:"100%"}}>💰 Pago</button>}{r.estado!=="anulada"&&<button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 7px",fontSize:10,width:"100%"}}>Ô£Å´©Å</button>}{!["anulada","pagada"].includes(r.estado)&&<button onClick={()=>setMAnular(r)} style={{...S.btn("danger"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒÜ½</button>}</div></td></tr>;})}
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Total","Anticipo","Saldo","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="🧾" msg="Sin facturas"/>:(
      </div>
                <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>­ƒöÉ Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      {exportar&&<ModalExportar titulo="Facturas" datos={rows} campos={[{label:"N┬░",key:"numero"},{label:"Cliente",key:"nombre_receptor"},{label:"NIT",key:"nit_receptor"},{label:"Fecha",key:"fecha_emision"},{label:"Total",key:"total"},{label:"Saldo",key:"saldo_pendiente"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
    <div>
  return(
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorización","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id:empId,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" — "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada ✔":"Pago parcial ✔");setMPago(null);load();};
  const anular=async(fac,mot)=>{await dbUpd("facturas",fac.id,{estado:"anulada",motivo_anulacion:mot});showToast("Anulada");setMAnular(null);load();};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));dbGet("reservas","").then(d=>setReservas(Array.isArray(d)?d:[]));dbGet("cotizaciones","&estado=eq.aprobada").then(d=>setCotizaciones(Array.isArray(d)?d:[]));dbGet("movimientos_bancarios","&tipo=eq.ingreso").then(d=>setAnticipos(Array.isArray(d)?d:[]));load();},[]);
  };
    const w=window.open("","_blank");w.document.write(html);w.document.close();
    <script>window.onload=()=>window.print();</script></body></html>`;
    <div style="text-align:center;margin-top:12px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
    <div class="footer"><strong>Datos del certificador:</strong> Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
    ${ivaPct===5?'<p style="font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
    <tfoot><tr><td colspan="4"/><td class="right"><strong>TOTAL:</strong></td><td class="right"><strong>Q ${total.toFixed(2)}</strong></td></tr></tfoot></table>
    <tbody>${lineas.map((l,i)=>`<tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">Q ${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">Q ${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-(parseFloat(l.descuento)||0)).toFixed(2)}</td></tr>`).join("")}</tbody>
    <table><thead><tr><th>#</th><th>B/S</th><th>Cant.</th><th>Descripción</th><th class="right">P. Unitario</th><th class="right">Total</th></tr></thead>
    <div style="font-size:10px">NIT Receptor: ${r.nit_receptor||"CF"} &nbsp;|&nbsp; Nombre: <strong>${r.nombre_receptor}</strong> &nbsp;|&nbsp; Fecha: ${r.fecha_emision||""} &nbsp;|&nbsp; Moneda: GTQ</div>
    <hr/>
    </div>
      <div class="autorizacion"><strong>N├ÜMERO DE AUTORIZACIÓN:</strong><br/>${r.numero_autorizacion||"—"}<br/>Serie: ${r.serie||"—"} Número DTE: ${r.numero_dte||"—"}</div>
      <div class="emisor"><strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong><br/>Nit Emisor: 20160860<br/><strong>TRANSPORTES TZUNUN</strong><br/>6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO</div>
    <div style="display:flex;justify-content:space-between">
    <div class="titulo">${ivaPct===5?"Factura Pequeño Contribuyente":"Factura"}</div>
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${r.numero}</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}.titulo{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:8px}.emisor{color:#1B2D5C;font-size:10px;margin-bottom:4px}.right{text-align:right}.autorizacion{text-align:right;font-size:9px;color:#DC2626}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}th{background:#1B2D5C;color:#fff;padding:5px 6px}td{padding:5px 6px;border-bottom:1px solid #E2E8F0}.footer{margin-top:10px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}@media print{button{display:none}}</style></head><body>
    const total=parseFloat(r.total)||0;
    const ivaPct=parseFloat(r.tasa_iva)||5;
    const lineas=r.lineas?JSON.parse(r.lineas):[];
  const imprimirFac=r=>{
  const delFac=async id=>{if(!confirm("┬┐Eliminar esta factura permanentemente?"))return;await dbDel("facturas",id);showToast("Factura eliminada");load();};
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [exportar,setExportar]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
function PageFacturacion({showToast,empId}){
// ÔòÉÔòÉÔòÉ FACTURACIÓN PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"4px 9px",marginLeft:"auto"}}>­ƒùæ´©Å</button>
                  {r.estado==="enviada"&&<button onClick={()=>chEst(r.id,"aprobada")} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>✅</button>}
                  {!r.orden_venta&&<button onClick={()=>chEst(r.id,"orden_venta")} style={{...S.btn("purple"),fontSize:11,padding:"4px 9px"}}>📦</button>}
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£Å´©Å</button>
                  <button onClick={()=>{setEditItem({...r,__clon:true});setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>📋 Clonar</button>
                  <button onClick={()=>{const msg="Estimados, le comparto cotización "+r.numero+" de Tz'unun AutoRentas por Q "+fmt(total)+". Para aprobar o consultar: 502-31221538";window.open("https://wa.me/?text="+encodeURIComponent(msg));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px",background:"#25D366",color:"white"}}>­ƒÆ¼ WA</button>
                  <button onClick={()=>{window.open("mailto:?subject="+encodeURIComponent("Cotización "+r.numero)+"&body="+encodeURIComponent("Estimados, adjunto cotización "+r.numero+" por Q "+fmt(total)+". Para más información: Oscar Gálvez 502-31221538"));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£ë´©Å</button>
                  <button onClick={()=>{const doc=makePDF();if(doc){const url=URL.createObjectURL(doc.output("blob"));const w=window.open(url);setTimeout(()=>w&&w.print(),1000);}}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>­ƒû¿´©Å</button>
                  <button onClick={()=>{const doc=makePDF();if(doc)doc.save(r.numero+".pdf");}} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>Ô¼ç PDF</button>
                  <button onClick={()=>setPreview(r)} style={{...S.btn("blue"),fontSize:11,padding:"4px 9px"}}>­ƒæü Ver</button>
                <div style={{display:"flex",gap:5,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                </div>
                  <div style={{textAlign:"right"}}><Badge color={e.c} bg={e.bg} label={e.l} small/><div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(total)}</div></div>
                  <div><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>{r.saludo&&<div style={{fontSize:11,color:T.sub,fontStyle:"italic"}}>"{r.saludo}"</div>}<div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {r.dias}d{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div key={r.id} style={S.card}>
            return(
            const makePDF=()=>generarPDF({numero:r.numero,fecha:r.fecha_emision||today(),fecha_vence:r.fecha_vence,cliente:r.cliente_nombre,nit:r.cliente_nit,dir_cliente:r.cliente_dir,saludo:r.saludo,servicio:r.descripcion_servicio,caract:r.caract||["Vehículo","Aire acond.","Cinturones","Seguro"],incluidos:r.incluidos||["Combustible","Conductor","Atención"],beneficios:r.beneficios||["Viaje seguro","Puntualidad","Flexibilidad"],con_piloto:r.con_piloto!==false,sub:parseFloat(r.subtotal)||0,iva_pct:parseFloat(r.tasa_iva)||5,iva_amt:parseFloat(r.total_iva)||0,total_ef:total,total_tc:total*1.05,exch:parseFloat(r.tasa_cambio)||7.70,es_orden:r.orden_venta});
            const total=parseFloat(r.total_gtq)||0;
            const e=r.orden_venta?EC.orden_venta:(EC[r.estado]||EC.borrador);
          {filtered.map(r=>{
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin cotizaciones"/>:(
      </div>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        {["todas","borrador","enviada","aprobada","rechazada","orden_venta"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f==="orden_venta"?"📦 Órdenes":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Enviadas",v:rows.filter(r=>r.estado==="enviada").length,c:T.blue},{l:"Aprobadas",v:rows.filter(r=>r.estado==="aprobada").length,c:T.acc},{l:"Órdenes",v:rows.filter(r=>r.orden_venta).length,c:T.purple}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {preview&&<ModalVistaPrevia cot={preview} onClose={()=>setPreview(null)}/>}
    <div>
  return(
  if(vista==="form")return <div><FormCotizacion initial={editItem} empId={empId} clientes={clientes} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  const EC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"},orden_venta:{c:T.purple,bg:T.purpleDim,l:"Orden de Venta"}};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro||(filtro==="orden_venta"&&r.orden_venta));
  const chEst=async(id,estado)=>{await dbUpd("cotizaciones",id,{estado,orden_venta:estado==="orden_venta"});showToast("→ "+estado);load();};
  const del=async id=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("cotizaciones",id);showToast("Eliminada");load();};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("cotizaciones");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [preview,setPreview]=useState(null);
function PageCotizaciones({showToast,empId}){
// ÔòÉÔòÉÔòÉ COTIZACIONES PAGE ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ CALCULADORA ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ RESERVAS PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Flota</div>{d.pie.length>0?<><ResponsiveContainer width="100%" height={120}><PieChart><Pie data={d.pie} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={3}>{d.pie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>{d.pie.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div><span style={{fontWeight:700,color:e.color}}>{e.value}</span></div>)}</>:<div style={{textAlign:"center",padding:30,color:T.sub,fontSize:12}}>Sin datos</div>}</div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos vs Egresos</div>{d.chart.length>0?<ResponsiveContainer width="100%" height={180}><BarChart data={d.chart}><XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/><Tooltip contentStyle={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="Ingresos" fill={T.acc} radius={[4,4,0,0]}/><Bar dataKey="Egresos" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>:<div style={{textAlign:"center",padding:40,color:T.sub,fontSize:13}}>Sin movimientos aún</div>}</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      </div>
        {[{icon:"💰",l:"Ingresos",v:fmtK(d.ing),c:T.acc,bg:T.accDim},{icon:"🛍️",l:"Egresos",v:fmtK(d.eg),c:T.red,bg:T.redDim},{icon:"🏦",l:"Saldo GTQ",v:fmtK(d.saldo),c:T.acc,bg:T.accDim},{icon:"🧾",l:"Facturado",v:fmtK(d.facTot),c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>FINANZAS</div>
      </div>
        {[{icon:"🚗",l:"Flota",v:d.v.length,c:T.acc,bg:T.accDim},{icon:"✅",l:"Disponibles",v:d.vDisp,c:T.acc,bg:T.accDim},{icon:"­ƒöæ",l:"Rentados",v:d.vRent,c:T.blue,bg:T.blueDim},{icon:"📅",l:"Res. activas",v:d.rAct,c:T.blue,bg:T.blueDim},{icon:"👥",l:"Clientes",v:d.clientes.length,c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>OPERACIÓN</div>
      {d.alertas.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{d.alertas.map((a,i)=><div key={i} style={{background:T.card,border:`1px solid ${a.c}44`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{a.icon}</span><span style={{fontSize:13}}>{a.msg}</span><div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:a.c}}/></div>)}</div>}
    <div>
  return(
  if(loading)return <Spinner/>;
  };
    setLoading(false);
    setD({v,r,c,clientes,alertas,chart,pie,ing,eg,saldo,facTot,vDisp:v.filter(x=>x.estado==="disponible").length,vRent:v.filter(x=>x.estado==="rentado").length,rAct:r.filter(x=>["en_curso","confirmada"].includes(x.estado)).length});
    const pie=[{name:"Disponible",value:v.filter(x=>x.estado==="disponible").length,color:T.acc},{name:"Rentado",value:v.filter(x=>x.estado==="rentado").length,color:T.blue},{name:"Mantenim.",value:vMant,color:T.sec}].filter(x=>x.value>0);
    const chart=meses.map((mes,i)=>({mes,Ingresos:Math.round(m.filter(x=>x.tipo==="ingreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0)),Egresos:Math.round(m.filter(x=>x.tipo==="egreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0))})).filter(x=>x.Ingresos>0||x.Egresos>0);
    const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    if(c.filter(x=>x.estado==="enviada").length>0)alertas.push({icon:"📋",msg:`${c.filter(x=>x.estado==="enviada").length} cotizaciones esperando aprobación`,c:T.blue});
    if(r.filter(x=>x.estado==="pendiente").length>0)alertas.push({icon:"📅",msg:`${r.filter(x=>x.estado==="pendiente").length} reservas pendientes`,c:T.sec});
    if(vMant>0)alertas.push({icon:"🔧",msg:`${vMant} vehículo${vMant>1?"s":""} en mantenimiento`,c:T.sec});
    const alertas=[];
    const vMant=v.filter(x=>x.estado==="mantenimiento").length;
    const facTot=f.filter(x=>!["anulada","borrador"].includes(x.estado)).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const saldo=cuentas.filter(x=>x.moneda==="GTQ").reduce((s,x)=>s+(parseFloat(x.saldo_actual)||0),0);
    const eg=m.filter(x=>x.tipo==="egreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const ing=m.filter(x=>x.tipo==="ingreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const v=Array.isArray(veh)?veh:[],r=Array.isArray(res)?res:[],c=Array.isArray(cots)?cots:[],f=Array.isArray(fac)?fac:[],m=Array.isArray(movs)?movs:[],cuentas=Array.isArray(cb)?cb:[],clientes=Array.isArray(cl)?cl:[];
    const [veh,res,cots,fac,movs,cb,cl]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("movimientos_bancarios",""),dbGet("cuentas_bancarias",""),dbGet("clientes","")]);
    setLoading(true);
  const load=async()=>{
  useEffect(()=>{load();},[]);
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
function PageDashboard(){

}
  );
    </div>
      )}
        </div>
          </table>
            </tfoot>
              </tr>
                <td/>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.acc,fontSize:14}}>Q {fmt(total)}</td>
                <td colSpan={4} style={{padding:"9px 10px",fontWeight:700,color:T.sub,fontSize:12}}>TOTAL</td>
              <tr style={{background:T.surf}}>
            <tfoot>
            </tbody>
              ))}
                </tr>
                  </td>
                    <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>­ƒùæ´©Å</button>
                  <td style={S.td}>
                  <td style={{...S.td,fontWeight:700,color:T.acc,whiteSpace:"nowrap"}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{r.referencia||"—"}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{r.metodo}</td>
                  <td style={{...S.td,fontWeight:500}}>{r.concepto}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(r.fecha)}</td>
                <tr key={r.id}>
              {rows.map(r=>(
            <tbody>
            </thead>
              ))}</tr>
                <th key={h} style={S.th}>{h}</th>
              <tr>{["Fecha","Concepto","Método","Referencia","Monto",""].map(h=>(
            <thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
        <Empty icon="💰" msg="Sin pagos registrados" action="+ Registrar pago" onAction={()=>setShowForm(true)}/>:(
      {loading?<Spinner/>:rows.length===0?
      {/* Lista */}

      )}
        </div>
          </div>
            </div>
              </button>
                Cancelar
              <button tabIndex={0} onClick={()=>{setShowForm(false);setF({...EMPTY_P});}} style={{...S.btn("ghost"),flex:1,padding:10}}>
              </button>
                {saving?"­ƒÆ¥ Registrando...":"­ƒÆ¥ Registrar pago"}
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:10,fontSize:13}}>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones"/>
            <Fld label="NOTAS">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REF-00001"/>
            <Fld label="REFERENCIA / N┬░ COMPROBANTE">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.concepto} onChange={e=>sf("concepto",e.target.value)} placeholder="Ej: Anticipo reserva Cobán, Pago factura FAC-001..."/>
            <Fld label="CONCEPTO" span2>
            </Fld>
              </select>
                ))}
                  </option>
                    {re.numero} — {re.cliente_nombre} — Saldo: Q {fmt(re.saldo||re.monto)}
                  <option key={re.id} value={re.id}>
                {reservas.map(re=>(
                <option value="">Sin reserva vinculada</option>
              <select tabIndex={0} style={S.sel} value={f.reserva_id} onChange={e=>sf("reserva_id",e.target.value)}>
            <Fld label="VINCULAR A RESERVA (opcional)">
            </Fld>
              </select>
                ))}
                  </option>
                    {fa.numero} — {fa.nombre_receptor} — Saldo: Q {fmt(fa.saldo_pendiente||fa.total)}
                  <option key={fa.id} value={fa.id}>
                {facturas.map(fa=>(
                <option value="">Sin factura vinculada</option>
              <select tabIndex={0} style={S.sel} value={f.factura_id} onChange={e=>sf("factura_id",e.target.value)}>
            <Fld label="VINCULAR A FACTURA (opcional)">
            </Fld>
              </select>
                <option value="cheque">­ƒôä Cheque</option>
                <option value="tarjeta">­ƒÆ│ Tarjeta de crédito/débito</option>
                <option value="efectivo">­ƒÆÁ Efectivo</option>
                <option value="deposito">💰 Depósito en banco</option>
                <option value="transferencia">🏦 Transferencia bancaria</option>
              <select tabIndex={0} style={S.sel} value={f.metodo} onChange={e=>sf("metodo",e.target.value)}>
            <Fld label="M├ëTODO DE PAGO">
            </Fld>
              {cuentas.length===0&&<div style={{fontSize:11,color:T.red,marginTop:3}}>⚠️ No hay cuentas bancarias. Ve a La Banca para crearlas.</div>}
              </select>
                ))}
                  </option>
                    {cu.banco} — {cu.numero_cuenta} · Q {fmt(cu.saldo_actual||0)}
                  <option key={cu.id} value={cu.id}>
                {cuentas.map(cu=>(
                <option value="">Seleccionar cuenta bancaria...</option>
              <select tabIndex={0} style={cuentas.length===0?{...S.sel,borderColor:T.red}:S.sel} value={f.cuenta_id} onChange={e=>sf("cuenta_id",e.target.value)}>
            <Fld label="CUENTA BANCARIA (donde se recibe) *">
            </Fld>
              <input tabIndex={0} style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/>
            <Fld label="MONTO RECIBIDO (GTQ)">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/>
            <Fld label="FECHA">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Registrar pago recibido</div>
        <div style={{...S.card,marginBottom:16}}>
      {showForm&&(
      {/* Formulario */}

      </div>
        </button>
          {showForm?"Cancelar":"+ Registrar pago"}
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺ Actualizar</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px"}}>
        ].map((s,i)=>(
          {l:"Registros",v:rows.length,c:T.purple,bg:T.purpleDim}
          {l:"Este mes",v:"Q "+fmt(esteMes),c:T.blue,bg:T.blueDim},
        {[{l:"Total recibido",v:"Q "+fmt(total),c:T.acc,bg:T.accDim},
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
      {/* KPIs */}

      {exportar&&<ModalExportar titulo="Pagos Recibidos" datos={rows} campos={CAMPOS} onClose={()=>setExportar(false)}/>}
    <div>
  return(

  ];
    {label:"Referencia",key:"referencia"},{label:"Notas",key:"notas"},
    {label:"Monto",key:"monto"},{label:"Método",key:"metodo"},
    {label:"Fecha",key:"fecha"},{label:"Concepto",key:"concepto"},
  const CAMPOS=[

    .reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const esteMes=rows.filter(r=>(r.fecha||"").slice(0,7)===today().slice(0,7))
  const total=rows.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

  };
    load();
    showToast("Pago eliminado");
    await dbDel("pagos_recibidos",id);
    if(!confirm("┬┐Eliminar este pago? Esta acción no se puede deshacer."))return;
  const del=async id=>{

  };
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
      load();
      setF({fecha:today(),monto:"",metodo:"transferencia",referencia:"",factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""});
      setSaving(false);setShowForm(false);
      showToast("Pago registrado correctamente ✔");
      if(cu)await dbUpd("cuentas_bancarias",f.cuenta_id,{saldo_actual:(parseFloat(cu.saldo_actual)||0)+monto});
      const cu=cuentas.find(x=>x.id===f.cuenta_id);
      // 5. Actualizar saldo de cuenta bancaria
      await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:f.cuenta_id,fecha:f.fecha,tipo:"ingreso",descripcion:concepto,monto,referencia:f.referencia||"",categoria:"ventas",conciliado:false,notas:f.notas||""});
      // 4. Registrar en movimientos bancarios
      }
        if(re){const saldo=Math.max(0,(parseFloat(re.saldo)||0)-monto);const anticipo=(parseFloat(re.anticipo)||0)+monto;await dbUpd("reservas",f.reserva_id,{saldo,anticipo});}
        const re=reservas.find(x=>x.id===f.reserva_id);
      if(f.reserva_id){
      // 3. Actualizar saldo de reserva
      }
        if(fa){const saldo=Math.max(0,(parseFloat(fa.saldo_pendiente)||parseFloat(fa.total)||0)-monto);await dbUpd("facturas",f.factura_id,{saldo_pendiente:saldo,estado:saldo<=0?"pagada":"parcial"});}
        const fa=facturas.find(x=>x.id===f.factura_id);
      if(f.factura_id){
      // 2. Actualizar saldo de factura
      if(pago&&pago.error){showToast("Error: "+pago.error,"err");setSaving(false);return;}
      const pago=await dbIns("pagos_recibidos",{empresa_id:empId,fecha:f.fecha,monto,metodo:f.metodo,referencia:f.referencia||"",concepto,cuenta_id:f.cuenta_id,notas:f.notas||"",factura_id:f.factura_id||null,reserva_id:f.reserva_id||null});
      // 1. Guardar pago
      }
        concepto=fa?"Pago factura "+(fa.numero||"")+" — "+fa.nombre_receptor:re?"Pago reserva "+(re.numero||"")+" — "+re.cliente_nombre:"Pago recibido";
        const re=reservas.find(x=>x.id===f.reserva_id);
        const fa=facturas.find(x=>x.id===f.factura_id);
      if(!concepto){
      let concepto=f.concepto.trim();
      const monto=parseFloat(f.monto);
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.concepto.trim()&&!f.factura_id&&!f.reserva_id){showToast("Ingresa concepto o vincula a factura/reserva","err");return;}
    if(!f.cuenta_id){showToast("Selecciona la cuenta bancaria","err");return;}
    if(!f.monto||parseFloat(f.monto)<=0){showToast("Ingresa el monto recibido","err");return;}
  const guardar=async()=>{

  useEffect(()=>{load();},[]);
  };
    setLoading(false);
    setCuentas(Array.isArray(cu)?cu:[]);
    setReservas(Array.isArray(re)?re.filter(x=>!["cancelada"].includes(x.estado)):[]);
    setFacturas(Array.isArray(fa)?fa.filter(x=>!["anulada","borrador"].includes(x.estado)):[]);
    setRows(Array.isArray(p)?p:[]);
    ]);
      dbGet("cuentas_bancarias",""),
      dbGet("reservas",""),
      dbGet("facturas",""),
      dbGet("pagos_recibidos",""),
    const [p,fa,re,cu]=await Promise.all([
    setLoading(true);
  const load=async()=>{

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({...EMPTY_P});
    factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""};
  const EMPTY_P={fecha:today(),monto:"",metodo:"transferencia",referencia:"",
  const [exportar,setExportar]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [cuentas,setCuentas]=useState([]);
  const [reservas,setReservas]=useState([]);
  const [facturas,setFacturas]=useState([]);
  const [rows,setRows]=useState([]);
function PagePagos({showToast,empId}){
// ÔòÉÔòÉÔòÉ PAGOS RECIBIDOS ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ


}
  );
    </div>
      </div>
        </div>
          <button onClick={onClose} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
          <button onClick={exportar} style={{...S.btn("primary"),flex:2,padding:12,fontSize:14}}>­ƒôñ Exportar</button>
        <div style={{display:"flex",gap:10}}>

        </div>
          Se exportarán <b style={{color:T.acc}}>{filtrar().length}</b> registros con {campos.length} campos.
        <div style={{fontSize:11,color:T.mut,marginBottom:16,padding:"8px 12px",background:T.surf,borderRadius:6}}>

        </div>
          </div>
            ))}
              </label>
                <span style={{fontSize:13}}>{l}</span>
                <input type="radio" name="formato" value={v} checked={formato===v} onChange={()=>setFormato(v)} style={{width:16,height:16,accentColor:T.acc}}/>
              <label key={v} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:8,background:formato===v?T.accDim:T.surf,border:"1px solid "+(formato===v?T.acc:T.bord)}}>
            {[["csv","­ƒôä CSV (valor separado por coma)"],["xls","📊 XLS (compatible con Microsoft Excel)"],["pdf","­ƒû¿´©Å PDF (para imprimir)"]].map(([v,l])=>(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <label style={S.lbl}>FORMATO DE EXPORTACIÓN</label>
        <div style={{marginBottom:20}}>

        </div>
          {(fechaIni||fechaFin)&&<div style={{fontSize:11,color:T.acc,marginTop:4}}>{filtrar().length} registros en el período</div>}
          </div>
            <div><label style={{...S.lbl,fontSize:10}}>HASTA</label><input style={S.inp} type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)}/></div>
            <div><label style={{...S.lbl,fontSize:10}}>DESDE</label><input style={S.inp} type="date" value={fechaIni} onChange={e=>setFechaIni(e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <label style={S.lbl}>PER├ìODO</label>
        <div style={{marginBottom:14}}>

        </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:18}}>Ô£ò</button>
          <div style={{fontSize:16,fontWeight:800}}>­ƒôñ Exportar — {titulo}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{background:T.card,borderRadius:16,border:"1px solid "+T.bord,width:"100%",maxWidth:480,padding:28}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return(

  };
    onClose();
    URL.revokeObjectURL(url);
    a.href=url;a.download=titulo.replace(/\s+/g,"_")+ext;a.click();
    const a=document.createElement("a");
    const url=URL.createObjectURL(blob);
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const csv=bom+[headers.join(sep),...body.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(sep))].join("\n");
    const ext=formato==="csv"?".csv":".xls";
    const sep=formato==="csv"?",":"	";
    const bom="´╗┐";

    }
      onClose();return;
      const w=window.open("","_blank");w.document.write(html);w.document.close();
      </table><script>window.onload=()=>window.print();</script></body></html>`;
      <tbody>${body.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <p>Generado: ${new Date().toLocaleDateString("es-GT",{day:"2-digit",month:"long",year:"numeric"})} · ${rows.length} registros</p>
      <h2>Tz'unun AutoRentas — ${titulo}</h2>
      @media print{button{display:none}}</style></head><body>
      tr:nth-child(even){background:#F8FAFC}
      td{padding:5px 8px;border-bottom:1px solid #E2E8F0}
      th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left}
      h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:11px}
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
      <title>${titulo}</title>
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    if(formato==="pdf"){

    }));
      return String(v??"-");
      const v=c.key.split(".").reduce((o,k)=>o?.[k],r);
    const body=rows.map(r=>campos.map(c=>{
    const headers=campos.map(c=>c.label);
    const rows=filtrar();
  const exportar=()=>{

  };
    });
      return true;
      if(fechaFin&&f>fechaFin) return false;
      if(fechaIni&&f<fechaIni) return false;
      const f=r.fecha||r.created_at||r.fecha_inicio||"";
    return datos.filter(r=>{
    if(!fechaIni&&!fechaFin) return datos;
  const filtrar=()=>{

  const [fechaFin,setFechaFin]=useState("");
  const [fechaIni,setFechaIni]=useState("");
  const [formato,setFormato]=useState("csv");
  const [modulo,setModulo]=useState("todo");
function ModalExportar({titulo,datos,campos,onClose}){
// ÔòÉÔòÉÔòÉ EXPORTAR UNIVERSAL ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ DASHBOARD ÔòÉÔòÉÔòÉ



// ÔòÉÔòÉÔòÉ CLIENTES Y FLOTA ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        <Resumen/>
        </div>
          </div>
            </div>
              <button tabIndex={0} onClick={onCancel} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:12,fontSize:14}}>{saving?"­ƒÆ¥ Guardando...":"­ƒÆ¥ Guardar reserva"}</button>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:6}}>
            </Fld>
              <textarea tabIndex={0} style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
            <Fld label="NOTAS" span2>
            </Fld>
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/>
            <Fld label="ANTICIPO (Q)">
            </Fld>
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/>
            <Fld label="TASA CAMBIO ($1 USD)">
            </Fld>
              </div>
                ))}
                  <button tabIndex={0} key={v} onClick={()=>sf("pago",v)} style={{...S.btn(f.pago===v?"primary":"ghost"),flex:1,fontSize:11}}>{l}</button>
                {[["efectivo","­ƒÆÁ Efectivo"],["transferencia","🏦 Transferencia"],["tarjeta","­ƒÆ│ Tarjeta (+5%)"]].map(([v,l])=>(
              <div style={{display:"flex",gap:8}}>
            <Fld label="M├ëTODO DE PAGO" span2>
            </Fld>
              </select>
                {munis.map(m=><option key={m} value={m}>{m}</option>)}
                <option value="">Seleccionar...</option>
              <select tabIndex={0} style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}>
            <Fld label="MUNICIPIO">
            </Fld>
              </select>
                {Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}
                <option value="">Seleccionar...</option>
              <select tabIndex={0} style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}>
            <Fld label="DEPARTAMENTO">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Destino"/>
            <Fld label="DESTINO">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Ciudad de Guatemala"/>
            <Fld label="ORIGEN">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/>
            <Fld label="FECHA DEVOLUCIÓN">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/>
            <Fld label="FECHA ENTREGA">
            </Fld>
              </select>
                <option value={0}>Sin IVA</option>
                <option value={5}>5% Pequeño Contrib.</option>
                <option value={12}>12% Régimen General</option>
              <select tabIndex={0} style={S.sel} value={f.iva} onChange={e=>sf("iva",parseInt(e.target.value))}>
            <Fld label="IVA">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del piloto"/>
            <Fld label="CONDUCTOR">
            </Fld>
              </select>
                {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q {fmt(v.dia)}/día</option>)}
                <option value="">Seleccionar vehículo...</option>
              <select tabIndex={0} style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
            <Fld label="VEH├ìCULO" span2>
            </Fld>
              <input tabIndex={0} style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/>
            <Fld label="HORA DE RECOGIDA">
            </Fld>
              </select>
                <option value="cancelada">Ô£ù Cancelada</option>
                <option value="completada">­ƒÅü Completada</option>
                <option value="en_curso">ÔûÂ En curso</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="pendiente">⏳ Pendiente</option>
              <select tabIndex={0} style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
            <Fld label="ESTADO">
            </Fld>
              </div>
                <button tabIndex={0} onClick={()=>sf("tipo","traslado")} style={{...S.btn(f.tipo==="traslado"?"primary":"ghost"),flex:1}}>­ƒù║ Traslado</button>
                <button tabIndex={0} onClick={()=>sf("tipo","renta")} style={{...S.btn(f.tipo==="renta"?"primary":"ghost"),flex:1}}>­ƒöæ Renta de vehículo</button>
              <div style={{display:"flex",gap:8}}>
            <Fld label="TIPO DE SERVICIO" span2>
            </Fld>
              <ClienteBuscador value={f.cliente_nombre} onChange={v=>sf("cliente_nombre",v)} empId={empId}/>
            <Fld label="CLIENTE" span2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar reserva":"Nueva reserva"}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
    <div>
  return(

  );
    </div>
      ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Selecciona vehículo y fechas</div>}
        </>
          </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,padding:"4px 0",color:saldo>0?T.sec:T.acc}}><span>Saldo</span><span>Q {fmt(saldo)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"4px 0"}}><span>Anticipo</span><span>Q {fmt(anticipo)}</span></div>
          <div style={{background:T.surf,borderRadius:9,padding:11}}>
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(exch>0?totalFinal/exch:0)} USD</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(totalFinal)}</span></div>
          <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
          </div>
            ))}
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:T.sub}}><span>{l}</span><span>{v}</span></div>
            {[["Tarifa","Q "+fmt(tarifaDia)+"/día"],["Subtotal","Q "+fmt(subtotal)],["IVA "+f.iva+"%","Q "+fmt(ivaAmt)],...(f.pago==="tarjeta"?[["Recargo TC 5%","Q "+fmt(recargoTC)]]:[])] .map(([l,v],i)=>(
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {dias} día{dias!==1?"s":""}</div>
        <>
      {vehObj&&dias>0?(
      <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
    <div style={S.card}>
  const Resumen=()=>(

  };
    }catch(e){alert("Error: "+e.message);setSaving(false);}
      onSave();
      setSaving(false);
      if(result&&result.error){alert("Error al guardar: "+result.error);setSaving(false);return;}
      else result=await dbIns("reservas",payload);
      if(initial?.id) result=await dbUpd("reservas",initial.id,payload);
      let result;
      };
        notas:f.notas||"",
        estado:f.estado||"pendiente",
        tasa_cambio:parseFloat(f.exch)||7.70,
        metodo_pago:f.pago||"efectivo",
        tasa_iva:parseFloat(f.iva)||0,
        saldo:saldo,
        anticipo:ant,
        monto:total,
        municipio:f.municipio||"",
        departamento:f.departamento||"",
        destino:f.destino||"",
        origen:f.origen||"Guatemala",
        hora_recogida:f.hora_recogida||"08:00",
        fecha_fin:f.fecha_fin?f.fecha_fin+"T23:59:00":null,
        fecha_inicio:f.fecha_inicio+(f.hora_recogida?"T"+f.hora_recogida+":00":"T08:00:00"),
        conductor_nombre:f.conductor_nombre||"",
        vehiculo_nombre:f.vehiculo_nombre||"",
        numero:initial?.id?"RES-"+initial.numero?.slice(-6)||numId():"RES-"+numId(),
        tipo:f.tipo,
        cliente_nombre:f.cliente_nombre.trim(),
        empresa_id:empId,
      const payload={
      const saldo=Math.max(0,total-ant);
      const ant=parseFloat(f.anticipo)||0;
      const total=Math.round((base+recTC)*100)/100;
      const recTC=f.pago==="tarjeta"?base*0.05:0;
      const base=sub+ivaAmt;
      const ivaAmt=sub*(parseFloat(f.iva)||0)/100;
      const sub=dias*tarifa;
      const tarifa=veh?tarifaVeh(veh,dias):0;
      const veh=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre);
      const dias=calcularDias();
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.fecha_inicio){alert("La fecha de inicio es requerida");return;}
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
  const guardar=async()=>{

  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];
  const saldo=Math.max(0,totalFinal-anticipo);
  const anticipo=parseFloat(f.anticipo)||0;
  const exch=parseFloat(f.exch)||7.70;
  const totalFinal=totalEfectivo+recargoTC;
  const recargoTC=f.pago==="tarjeta"?totalEfectivo*0.05:0;
  const totalEfectivo=subtotal+ivaAmt;
  const ivaAmt=subtotal*(parseFloat(f.iva)||0)/100;
  const subtotal=dias*tarifaDia;
  const tarifaDia=calcularTarifa(vehObj,dias);
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const dias=calcularDias();

  };
    return veh.dia;
    if(dias>=8) return veh.sem;
    if(dias>=30) return veh.mes;
    if(!veh||dias<=0) return 0;
  const calcularTarifa=(veh,dias)=>{

  };
    return Math.max(1,diff);
    const diff=Math.ceil((ff-fi)/(1000*60*60*24));
    const ff=new Date(f.fecha_fin+"T12:00:00");
    if(!f.fecha_fin) return 1;
    const fi=new Date(f.fecha_inicio+"T12:00:00");
    if(!f.fecha_inicio) return 0;
  const calcularDias=()=>{
  // Calcular días

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [saving,setSaving]=useState(false);

  });
    };
      estado:initial.estado||"pendiente",
      exch:initial.tasa_cambio||7.70,
      pago:initial.metodo_pago||"efectivo",
      iva:initial.tasa_iva||5,
      notas:initial.notas||"",
      anticipo:initial.anticipo||"",
      municipio:initial.municipio||"",
      departamento:initial.departamento||"",
      destino:initial.destino||"",
      origen:initial.origen||"Guatemala",
      hora_recogida:initial.hora_recogida||"08:00",
      fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):"",
      fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",
      conductor_nombre:initial.conductor_nombre||"",
      vehiculo_nombre:initial.vehiculo_nombre||"",
      tipo:initial.tipo||"renta",
      cliente_nombre:initial.cliente_nombre||"",
    return{
    if(!initial) return {...EMPTY_R};
  const [f,setF]=useState(()=>{

    exch:7.70,estado:"pendiente"};
    departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
    fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"Guatemala",destino:"",
  const EMPTY_R={cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
function FormReserva({initial,onSave,onCancel,empId}){


};
  exch:7.70,con_tc:false
  departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
  fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"",destino:"",
  cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
const EMPTY={
// ÔöÇÔöÇ Estado inicial para FormReserva ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


// ÔòÉÔòÉÔòÉ RESERVAS ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(p.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>
                  <button onClick={()=>abrirEditar(p)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>Ô£Å´©Å Editar</button>
                <div style={{display:"flex",gap:6}}>
                )}
                  </div>
                    </div>
                      <div style={{height:"100%",borderRadius:4,background:pct>80?T.red:pct>50?T.sec:T.acc,width:`${pct}%`,transition:"width .3s"}}/>
                    <div style={{background:T.surf,borderRadius:4,height:6,overflow:"hidden"}}>
                    </div>
                      <span style={{color:pct>80?T.red:T.sub,fontWeight:600}}>Q {fmt(creditoUsado)} / Q {fmt(creditoLimite)}</span>
                      <span>Crédito usado</span>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                  <div style={{marginBottom:12}}>
                {creditoLimite>0&&(
                </div>
                  ))}
                    </div>
                      <div style={{fontSize:12,fontWeight:500,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
                      <div style={{fontSize:10,color:T.mut}}>{lbl}</div>
                    <div key={lbl} style={{background:T.surf,borderRadius:7,padding:"7px 10px"}}>
                  {[["Contacto",p.contacto||"—"],["Teléfono",p.telefono||"—"],["Email",p.email||"—"],["Dirección",p.direccion||"—"]].map(([lbl,val])=>(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                </div>
                  <CatBadge cat={p.categoria}/>
                  </div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>NIT: {p.nit||"—"}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{p.nombre}</div>
                  <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4,marginBottom:12}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:CAT_COLOR[p.categoria]||T.mut}}/>
              <div key={p.id} style={{...S.card,position:"relative",overflow:"hidden"}}>
            return (
            const pct=creditoLimite>0?Math.min(100,Math.round((creditoUsado/creditoLimite)*100)):0;
            const creditoLimite=parseFloat(p.credito_limite)||0;
            const creditoUsado=parseFloat(p.credito_usado)||0;
          {rows.map(p=>{
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒÅ¬" msg="Sin proveedores registrados" action="+ Agregar proveedor" onAction={()=>setShowForm(true)}/>:(
      {/* Tarjetas proveedores */}

      )}
        </div>
          </div>
            </div>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar proveedor"}</button>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección del proveedor"/></Fld>
            <Fld label="L├ìMITE DE CR├ëDITO (GTQ)"><input style={S.inp} type="number" value={f.credito_limite} onChange={e=>sf("credito_limite",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="EMAIL"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="proveedor@email.com"/></Fld>
            <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
            <Fld label="CONTACTO"><input style={S.inp} value={f.contacto} onChange={e=>sf("contacto",e.target.value)} placeholder="Nombre de la persona de contacto"/></Fld>
            </Fld>
              </select>
                {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
            <Fld label="CATEGOR├ìA">
            <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
            <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre del proveedor"/></Fld>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar proveedor":"Nuevo proveedor"}</div>
        <div style={{...S.card,marginBottom:16,maxWidth:640}}>
      {showForm&&(
      {/* Formulario */}

      </div>
        <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo proveedor"}</button>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
            <div style={{fontSize:i>0?16:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
        {[{l:"Proveedores activos",v:rows.filter(r=>r.activo).length,c:T.acc},{l:"Crédito total usado",v:`Q ${fmt(totalCredito)}`,c:T.red},{l:"Categorías",v:[...new Set(rows.map(r=>r.categoria))].length,c:T.blue}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
      {/* Stats */}
    <div>
  return (

  const totalCredito=rows.reduce((s,r)=>s+(parseFloat(r.credito_usado)||0),0);

  const del=async id=>{if(!confirm("┬┐Eliminar este proveedor?"))return;await dbDel("proveedores",id);showToast("Eliminado");load();};

  };
    load();
    setF({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
    setShowForm(false);setEditItem(null);
    showToast("Proveedor guardado ✔");setSaving(false);
    else await dbIns("proveedores",payload);
    if(editItem?.id) await dbUpd("proveedores",editItem.id,payload);
    const payload={empresa_id:empId,nombre:f.nombre,nit:f.nit,categoria:f.categoria,contacto:f.contacto,telefono:f.telefono,email:f.email,direccion:f.direccion,credito_limite:parseFloat(f.credito_limite)||0,notas:f.notas,activo:true};
    setSaving(true);
    if(!f.nombre.trim()){showToast("El nombre del proveedor es requerido","err");return;}
  const guardar=async()=>{

  };
    setShowForm(true);
    setF({nombre:item.nombre||"",nit:item.nit||"",categoria:item.categoria||"combustible",contacto:item.contacto||"",telefono:item.telefono||"",email:item.email||"",direccion:item.direccion||"",credito_limite:item.credito_limite||"",notas:item.notas||""});
    setEditItem(item);
  const abrirEditar=item=>{

  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("proveedores");setRows(Array.isArray(d)?d:[]);setLoading(false);};

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function ModProveedores({empId,showToast}){

}
  );
    </div>
      </div>
        </div>
          </div>
            ))}
              </div>
                </div>
                  <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalG>0?Math.round((total/totalG)*100):0}%`}}/>
                <div style={{background:T.surf,borderRadius:4,height:4,overflow:"hidden"}}>
                </div>
                  <span style={{fontSize:11,fontWeight:600}}>Q {fmt(total)}</span>
                  </div>
                    <span style={{fontSize:11,color:T.sub}}>{cat}</span>
                    <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div key={cat} style={{marginBottom:10}}>
            {porCat.map(({cat,total})=>(
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:12}}>POR CATEGOR├ìA</div>
          <div style={S.card}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Sidebar categorías */}

        </div>
          )}
            </div>
              </table>
                </tfoot>
                  </tr>
                    <td colSpan={2}/>
                    <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(filtered.reduce((s,r)=>s+(parseFloat(r.total)||0),0))}</td>
                    <td colSpan={4} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL FILTRADO</td>
                  <tr style={{background:T.surf}}>
                <tfoot>
                </tbody>
                  })}
                    );
                      </tr>
                        </td>
                          </div>
                            <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>­ƒùæ´©Å</button>
                            <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>Ô£Å´©Å</button>
                            {r.estado==="pendiente"&&<button onClick={()=>marcarPagado(r.id)} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>Pagar</button>}
                          <div style={{display:"flex",gap:4}}>
                        <td style={S.td}>
                        </td>
                          </span>
                            {r.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}
                          <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="pagado"?T.accDim:T.secDim,color:r.estado==="pagado"?T.acc:T.sec}}>
                        <td style={S.td}>
                        <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(r.total)}</td>
                        <td style={{...S.td,fontSize:11,color:T.sub}}>{prov?.nombre||"—"}</td>
                        <td style={S.td}><CatBadge cat={r.categoria}/></td>
                        </td>
                          {r.referencia&&<div style={{fontSize:10,color:T.mut,fontFamily:"monospace"}}>{r.referencia}</div>}
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{r.descripcion}</div>
                        <td style={{...S.td,fontWeight:500,maxWidth:200}}>
                        <td style={{...S.td,whiteSpace:"nowrap",color:T.sub,fontSize:11}}>{fmtD(r.fecha)}</td>
                      <tr key={r.id}>
                    return (
                    const prov=proveedores.find(p=>p.id===r.proveedor_id);
                  {filtered.map(r=>{
                <tbody>
                <thead><tr>{["Fecha","Descripción","Categoría","Proveedor","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
            <div style={S.card}>
          {loading?<Spinner/>:filtered.length===0?<Empty icon="🛍️" msg="Sin gastos registrados" action="+ Registrar primer gasto" onAction={()=>setShowForm(true)}/>:(
          {/* Tabla gastos */}

          )}
            </div>
              </div>
                </div>
                  <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                  <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar gasto"}</button>
                <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
                <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/></Fld>
                </Fld>
                  </select>
                    <option value="pagado">✅ Pagado</option>
                    <option value="pendiente">⏳ Pendiente de pago</option>
                  <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                <Fld label="ESTADO">
                </Fld>
                  <input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REC-0045, FAC-001..."/>
                <Fld label="REFERENCIA / N┬░ FACTURA">
                </Fld>
                  <input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/>
                <Fld label="TOTAL (GTQ)">
                </Fld>
                  <input style={S.inp} type="number" step="0.01" value={f.iva} onChange={e=>{sf("iva",e.target.value);calcTotal(f.monto,e.target.value);}} placeholder="0.00"/>
                <Fld label="IVA (GTQ)">
                </Fld>
                  <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>{sf("monto",e.target.value);calcTotal(e.target.value,f.iva);}} placeholder="0.00"/>
                <Fld label="MONTO SIN IVA (GTQ)">
                </Fld>
                  </select>
                    <option value="credito">📋 Crédito</option>
                    <option value="cheque">­ƒôä Cheque</option>
                    <option value="tarjeta">­ƒÆ│ Tarjeta</option>
                    <option value="deposito">💰 Depósito</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="efectivo">­ƒÆÁ Efectivo</option>
                  <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                <Fld label="M├ëTODO DE PAGO">
                </Fld>
                  </select>
                    {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                    <option value="">Sin proveedor</option>
                  <select style={S.sel} value={f.proveedor_id} onChange={e=>sf("proveedor_id",e.target.value)}>
                <Fld label="PROVEEDOR">
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Diésel — Toyota RAV4 viaje a Petén"/></Fld>
                </Fld>
                  </select>
                    {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                <Fld label="CATEGOR├ìA">
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar gasto":"Registrar gasto / compra"}</div>
            <div style={{...S.card,marginBottom:16}}>
          {showForm&&(
          {/* Formulario */}

          </div>
            <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nuevo gasto"}</button>
            <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
            </select>
              {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              <option value="todas">Todas las categorías</option>
            <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}>
            ))}
              </button>
                {f==="todos"?"Todos":f==="pendiente"?"⏳ Pendientes":"✅ Pagados"}
              <button key={f} onClick={()=>setFiltroEst(f)} style={{...S.btn(filtroEst===f?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>
            {["todos","pendiente","pagado"].map(f=>(
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {/* Filtros */}
        <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:16}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
          <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}>
        {[{l:"Total gastos",v:`Q ${fmt(totalG)}`,c:T.red,bg:T.redDim},{l:"Pagados",v:`Q ${fmt(totalPagado)}`,c:T.acc,bg:T.accDim},{l:"Pendientes",v:`Q ${fmt(totalPend)}`,c:T.sec,bg:T.secDim}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
      {/* Stats */}
    <div>
  return (

  const porCat=CAT_GASTO.map(cat=>({cat,total:rows.filter(r=>r.categoria===cat).reduce((s,r)=>s+(parseFloat(r.total)||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const totalPagado=rows.filter(r=>r.estado==="pagado").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPend=rows.filter(r=>r.estado==="pendiente").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalG=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);

  });
    return true;
    if(filtroCat!=="todas"&&r.categoria!==filtroCat) return false;
    if(filtroEst!=="todos"&&r.estado!==filtroEst) return false;
  const filtered=rows.filter(r=>{

  const del=async id=>{if(!confirm("┬┐Eliminar este gasto?"))return;await dbDel("gastos",id);showToast("Eliminado");load();};
  const marcarPagado=async id=>{await dbUpd("gastos",id,{estado:"pagado",fecha_pago:today()});showToast("Marcado como pagado ✔");load();};

  };
    load();
    setF({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
    setShowForm(false);setEditItem(null);
    showToast("Gasto guardado ✔");setSaving(false);
    else await dbIns("gastos",payload);
    if(editItem?.id) await dbUpd("gastos",editItem.id,payload);
    const payload={empresa_id:empId,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,proveedor_id:f.proveedor_id||null,notas:f.notas,fecha_pago:f.estado==="pagado"?f.fecha:null};
    setSaving(true);
    if(!f.descripcion.trim()||!(parseFloat(f.total)>0)){showToast("Descripción y total son requeridos","err");return;}
  const guardar=async()=>{

  };
    setShowForm(true);
    setF({fecha:item.fecha||today(),categoria:item.categoria||"combustible",descripcion:item.descripcion||"",monto:item.monto||"",iva:item.iva||"",total:item.total||"",metodo_pago:item.metodo_pago||"efectivo",referencia:item.referencia||"",estado:item.estado||"pendiente",proveedor_id:item.proveedor_id||"",vehiculo_ref:item.vehiculo_ref||"",notas:item.notas||""});
    setEditItem(item);
  const abrirEditar=item=>{

  };
    sf("total",t>0?t.toFixed(2):"");
    const t=(parseFloat(m)||0)+(parseFloat(i)||0);
  const calcTotal=(m,i)=>{

  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("gastos");setRows(Array.isArray(d)?d:[]);setLoading(false);};

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [filtroCat,setFiltroCat]=useState("todas");
  const [filtroEst,setFiltroEst]=useState("todos");
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function ModGastos({empId,proveedores,showToast}){

}
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[cat]||T.mut)+"22",color:CAT_COLOR[cat]||T.mut}}>{cat}</span>;
function CatBadge({cat}){

// ÔòÉÔòÉÔòÉ GASTOS ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        </table>
          </tbody>
            })}
              );
                </tr>
                  <td style={{...S.td,fontWeight:700,color:c.ingresos>0?T.acc:T.mut}}>Q {fmt(c.ingresos)}</td>
                  <td style={{...S.td,fontWeight:600,color:T.purple,textAlign:"center"}}>{c.cotizaciones}</td>
                  <td style={{...S.td,fontWeight:600,color:T.blue,textAlign:"center"}}>{c.reservas}</td>
                  <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:tc.bg,color:tc.c}}>{c.tipo}</span></td>
                  <td style={{...S.td,fontWeight:600}}>{i===0&&"­ƒÑç "}{c.nombre}</td>
                <tr key={c.id} style={{background:i===0?T.accDim:"transparent"}}>
              return (
              const tc=TC[c.tipo]||TC.empresa;
            {clientesData.map((c,i)=>{
          <tbody>
          <thead><tr>{["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos generados"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Clientes por ingresos generados</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        <KpiCard icon="👤" label="Personas" value={clientes.filter(c=>c.tipo==="persona").length} color={T.purple} bg={T.purpleDim}/>
        <KpiCard icon="­ƒÅø´©Å" label="Gobierno/ONG" value={clientes.filter(c=>c.tipo==="gobierno").length} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="­ƒÅó" label="Empresas" value={clientes.filter(c=>c.tipo==="empresa").length} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="👥" label="Total clientes" value={clientes.length} color={T.acc} bg={T.accDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
    <div>
  return (

  const TC={empresa:{c:T.sec,bg:T.secDim},gobierno:{c:T.blue,bg:T.blueDim},persona:{c:T.acc,bg:T.accDim}};

  const imprimir=()=>imprimirTabla("Reporte de Clientes",["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Clientes_TzununSA",["Cliente","Tipo","NIT","Teléfono","Email","Reservas","Cotizaciones","Ingresos generados"],tablaRows);
  const tablaRows=clientesData.map(c=>[c.nombre,c.tipo,c.nit||"—",c.telefono||"—",c.email||"—",c.reservas,c.cotizaciones,`Q ${fmt(c.ingresos)}`]);

  }).sort((a,b)=>b.ingresos-a.ingresos);
    return {...c,reservas:resC.length,cotizaciones:cotC.length,ingresos};
    const ingresos=resC.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const cotC=cotizaciones.filter(co=>co.cliente_nombre===c.nombre&&co.estado!=="rechazada");
    const resC=reservas.filter(r=>r.cliente_nombre===c.nombre&&r.estado!=="cancelada");
  const clientesData=clientes.map(c=>{

  const {clientes,reservas,cotizaciones} = data;
function ReporteClientes({data}){

}
  );
    </div>
      </div>
        </div>
          </table>
            </tfoot>
              </tr>
                <td colSpan={3}/>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(totalGastos)}</td>
                <td colSpan={5} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL</td>
              <tr style={{background:T.surf}}>
            <tfoot>
            </tbody>
              ))}
                </tr>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:g.estado==="pagado"?T.accDim:T.secDim,color:g.estado==="pagado"?T.acc:T.sec}}>{g.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}</span></td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:10,color:T.mut}}>{g.referencia||"—"}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{g.metodo_pago}</td>
                  <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(g.total)}</td>
                  <td style={S.td}>Q {fmt(g.iva)}</td>
                  <td style={S.td}>Q {fmt(g.monto)}</td>
                  <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{g.descripcion}</div></td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[g.categoria]||T.mut)+"22",color:CAT_COLOR[g.categoria]||T.mut}}>{g.categoria}</span></td>
                  <td style={{...S.td,whiteSpace:"nowrap",color:T.sub}}>{fmtD(g.fecha)}</td>
                <tr key={g.id}>
              {gastos.map(g=>(
            <tbody>
            <thead><tr>{["Fecha","Categoría","Descripción","Monto","IVA","Total","Método","Ref.","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
        <div style={{overflowX:"auto"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Gastos</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        </div>
          ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos</div>}
            </ResponsiveContainer>
              </LineChart>
                <Line type="monotone" dataKey="Gastos" stroke={T.red} strokeWidth={2} dot={{fill:T.red,r:4}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <LineChart data={chartMensual}>
            <ResponsiveContainer width="100%" height={200}>
          {chartMensual.length>0?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos mensuales</div>
        <div style={S.card}>

        </div>
          ))}
            </div>
              </div>
                <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalGastos>0?Math.round((total/totalGastos)*100):0}%`}}/>
              <div style={{background:T.surf,borderRadius:4,height:5,overflow:"hidden"}}>
              </div>
                <span style={{fontSize:12,fontWeight:600}}>Q {fmt(total)}</span>
                </div>
                  <span style={{fontSize:12,color:T.sub}}>{cat} ({count})</span>
                  <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <div key={cat} style={{marginBottom:10}}>
          {porCat.map(({cat,total,count})=>(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos por categoría</div>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

      </div>
        <KpiCard icon="⏳" label="Pendientes de pago" value={`Q ${fmt(totalPend).split(".")[0]}`} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="✅" label="Pagados" value={`Q ${fmt(totalGastos-totalPend).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="🛍️" label="Total gastos" value={`Q ${fmt(totalGastos).split(".")[0]}`} color={T.red} bg={T.redDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
    <div>
  return (

  const imprimir=()=>imprimirTabla("Reporte de Gastos",["Fecha","Categoría","Descripción","Monto","IVA","Total","Estado"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Gastos_TzununSA",["Fecha","Categoría","Descripción","Monto","IVA","Total","Método pago","Referencia","Estado"],tablaRows);
  const tablaRows=gastos.map(g=>[fmtD(g.fecha),g.categoria,g.descripcion,`Q ${fmt(g.monto)}`,`Q ${fmt(g.iva)}`,`Q ${fmt(g.total)}`,g.metodo_pago,g.referencia||"—",g.estado]);

  })).filter(x=>x.Gastos>0);
    Gastos:Math.round(gastos.filter(g=>new Date(g.fecha).getMonth()===i).reduce((s,g)=>s+(parseFloat(g.total)||0),0)),
    mes,
  const chartMensual=meses.map((mes,i)=>({
  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const pieData=porCat.map(c=>({name:c.cat,value:Math.round(c.total),color:CAT_COLOR[c.cat]||T.mut}));
  const totalPend=gastos.filter(g=>g.estado==="pendiente").reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const totalGastos=gastos.reduce((s,g)=>s+(parseFloat(g.total)||0),0);

  })).sort((a,b)=>b.total-a.total);
    pagados:gastos.filter(g=>g.categoria===cat&&g.estado==="pagado").reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    count:gastos.filter(g=>g.categoria===cat).length,
    total:gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    cat,
  const porCat=[...new Set(gastos.map(g=>g.categoria))].map(cat=>({

  const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:"#22C55E",impuestos:T.red,servicios:T.acc,otros:T.sub};
  const {gastos} = data;
function ReporteGastos({data}){

}
  );
    </div>
      </div>
        </table>
          </tbody>
            ))}
              </tr>
                <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:v.estado==="disponible"?T.accDim:v.estado==="rentado"?T.blueDim:T.secDim,color:v.estado==="disponible"?T.acc:v.estado==="rentado"?T.blue:T.sec}}>{v.estado}</span></td>
                <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(v.ingresos)}</td>
                <td style={{...S.td,color:T.blue,fontWeight:600}}>{v.viajes}</td>
                <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                <td style={{...S.td,color:T.sub}}>{v.anio}</td>
                <td style={S.td}>{v.tipo}</td>
                <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                <td style={{...S.td,fontFamily:"monospace",color:T.acc,fontWeight:700}}>{v.placa}</td>
              <tr key={v.id}>
            {flotaData.map(v=>(
          <tbody>
          <thead><tr>{["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Flota</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        </div>
          ):<div style={{textAlign:"center",padding:24,color:T.sub}}>Sin datos</div>}
            </>
              ))}
                </div>
                  <span style={{fontWeight:700,color:e.color}}>{e.value} veh.</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div>
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
              {pieData.map((e,i)=>(
              </ResponsiveContainer>
                </PieChart>
                  <Tooltip/>
                  </Pie>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={3}>
                <PieChart>
              <ResponsiveContainer width="100%" height={130}>
            <>
          {pieData.length>0?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Estado actual de flota</div>
        <div style={S.card}>
        </div>
          ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Sin datos de ingresos por vehículo</div>}
            </ResponsiveContainer>
              </BarChart>
                <Bar dataKey="Ingresos" fill={T.acc} radius={[0,4,4,0]}/>
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis type="category" dataKey="nombre" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} width={120}/>
                <XAxis type="number" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <BarChart data={chartFlota} layout="vertical">
            <ResponsiveContainer width="100%" height={180}>
          {chartFlota.some(x=>x.Ingresos>0)?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos por vehículo</div>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
    <div>
  return (

  const imprimir=()=>imprimirTabla("Reporte de Flota",["Placa","Vehículo","Tipo","Año","Km","Viajes","Ingresos","Estado"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Flota_TzununSA",["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos generados","Estado"],tablaRows);
  const tablaRows=flotaData.map(v=>[v.placa,`${v.marca} ${v.modelo}`,v.tipo,v.anio,(v.km_actual||0).toLocaleString()+" km",v.viajes,`Q ${fmt(v.ingresos)}`,v.estado]);

  ].filter(x=>x.value>0);
    {name:"Mantenimiento",value:vehiculos.filter(v=>v.estado==="mantenimiento").length,color:T.sec},
    {name:"Rentado",value:vehiculos.filter(v=>v.estado==="rentado").length,color:T.blue},
    {name:"Disponible",value:vehiculos.filter(v=>v.estado==="disponible").length,color:T.acc},
  const pieData=[
  const chartFlota=flotaData.map(v=>({nombre:`${v.marca} ${v.modelo}`,Ingresos:Math.round(v.ingresos),Viajes:v.viajes}));

  });
    return {...v,ingresos,viajes};
    const viajes=resV.length;
    const ingresos=resV.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const resV=reservas.filter(r=>r.vehiculo_nombre===`${v.marca} ${v.modelo}`||r.vehiculo_nombre?.includes(v.modelo));
  const flotaData=vehiculos.map(v=>{

  const {vehiculos,reservas} = data;
function ReporteFlota({data}){

}
  );
    </div>
      </div>
        </div>
          </table>
            </tbody>
              ))}
                </tr>
                  <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="completada"?T.accDim:T.secDim,color:r.estado==="completada"?T.acc:T.sec}}>{r.estado}</span></td>
                  <td style={{...S.td,color:parseFloat(r.saldo)>0?T.sec:T.acc}}>Q {fmt(r.saldo)}</td>
                  <td style={{...S.td,color:T.acc}}>Q {fmt(r.anticipo)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,color:T.sub,whiteSpace:"nowrap"}}>{fmtD(r.fecha_inicio)}</td>
                  <td style={{...S.td,color:T.sub}}>{r.vehiculo_nombre||"—"}</td>
                  <td style={S.td}>{r.tipo==="renta"?"­ƒöæ Renta":"­ƒù║ Traslado"}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.cliente_nombre}</td>
                  <td style={{...S.td,fontFamily:"monospace",color:T.acc}}>{r.numero}</td>
                <tr key={r.id}>
              {reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>(
            <tbody>
            <thead><tr>{["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
        <div style={{overflowX:"auto"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Reservas</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos suficientes</div>}
          </ResponsiveContainer>
            </BarChart>
              <Bar dataKey="Cotizaciones" fill={T.blue} radius={[4,4,0,0]}/>
              <Bar dataKey="Reservas" fill={T.acc} radius={[4,4,0,0]}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
            <BarChart data={chartMensual}>
          <ResponsiveContainer width="100%" height={200}>
        {chartMensual.length>0?(
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ventas mensuales — Reservas vs Cotizaciones</div>
      <div style={{...S.card,marginBottom:16}}>

      </div>
        <KpiCard icon="🧾" label="Total facturado" value={`Q ${fmt(totalFac).split(".")[0]}`} color={T.purple} bg={T.purpleDim}/>
        <KpiCard icon="📋" label="Cotizaciones enviadas" value={`Q ${fmt(totalCot).split(".")[0]}`} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="📅" label="Total reservas (activas)" value={`Q ${fmt(totalRes).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
    <div>
  return (

  );
    tablaRows
    ["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"],
  const imprimir=()=>imprimirTabla("Reporte de Ventas",
  );
    tablaRows
    ["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha inicio","Monto","Anticipo","Saldo","Estado"],
  const exportar=()=>exportCSV("Reporte_Ventas_TzununSA",

  ]);
    `Q ${fmt(r.anticipo)}`,`Q ${fmt(r.saldo)}`,r.estado
    r.vehiculo_nombre||"—",fmtD(r.fecha_inicio),`Q ${fmt(r.monto)}`,
    r.numero||"—",r.cliente_nombre,r.tipo==="renta"?"Renta":"Traslado",
  const tablaRows=reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>[

  const totalFac=facturas.filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);
  const totalCot=cotizaciones.filter(c=>c.estado!=="rechazada").reduce((s,c)=>s+(parseFloat(c.total_gtq)||0),0);
  const totalRes=reservas.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

  })).filter(x=>x.Reservas>0||x.Cotizaciones>0);
    Cotizaciones: Math.round(cotizaciones.filter(co=>new Date(co.created_at).getMonth()===i&&co.estado!=="rechazada").reduce((s,co)=>s+(parseFloat(co.total_gtq)||0),0)),
    Reservas: Math.round(reservas.filter(r=>new Date(r.fecha_inicio||r.created_at).getMonth()===i&&r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0)),
    mes,
  const chartMensual=meses.map((mes,i)=>({
  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const {reservas,cotizaciones,facturas} = data;
function ReporteVentas({data}){

}
  </div>;
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: Q {fmt(p.value)}</div>)}
    <div style={{color:T.sub,marginBottom:4}}>{label}</div>
  return <div style={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"10px 14px",fontSize:11}}>
  if(!active||!payload?.length)return null;
function CustomTooltip({active,payload,label}){

}
  );
    </div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>{sub}</div>}
      <div style={{fontSize:11,color:T.mut,marginTop:2}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color}}>{value}</div>
      <div style={{width:38,height:38,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{icon}</div>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
    <div style={{...S.card,position:"relative",overflow:"hidden"}}>
  return (
function KpiCard({icon,label,value,sub,color,bg}){

}
  w.document.write(html);w.document.close();
  const w=window.open("","_blank");
  </body></html>`;
  <script>window.onload=()=>window.print();</script>
  </table>
  <tbody>${rows.map(r=>"<tr>"+r.map(v=>"<td>"+(v||"—")+"</td>").join("")+"</tr>").join("")}</tbody>
  <table><thead><tr>${headers.map(h=>"<th>"+h+"</th>").join("")}</tr></thead>
  <p>Generado: ${new Date().toLocaleDateString("es-GT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</p>
  <h2>Tz'unun AutoRentas — ${titulo}</h2>
  </style></head><body>
    @media print{button{display:none}}
    .total{font-weight:bold;background:#E1F5EE!important}
    tr:nth-child(even){background:#F8FAFC}
    td{padding:7px 10px;border-bottom:1px solid #E2E8F0}
    th{background:#1B2D5C;color:#fff;padding:8px 10px;text-align:left}
    table{width:100%;border-collapse:collapse;font-size:12px}
    p{color:#64748B;font-size:12px;margin-bottom:16px}
    h2{color:#1B2D5C;margin-bottom:4px}
    body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
  <style>
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${titulo}</title>
function imprimirTabla(titulo, headers, rows){

}
  URL.revokeObjectURL(url);
  a.href=url;a.download=filename+".csv";a.click();
  const a=document.createElement("a");
  const url=URL.createObjectURL(blob);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const csv=bom+[headers.join(","),...rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const bom="\uFEFF";
function exportCSV(filename, headers, rows){

// ÔòÉÔòÉÔòÉ REPORTES ÔòÉÔòÉÔòÉ


}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={onCancel} style={{...S.btn("ghost"),width:"100%",padding:10,marginTop:6,fontSize:12}}>Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),width:"100%",padding:10,fontSize:13}}>{saving?"Guardando...":"­ƒÆ¥ "+( initial?.id?"Actualizar":"Crear factura")}</button>
            <button onClick={generarPDFFactura} style={{...S.btn("blue"),width:"100%",marginBottom:8,padding:10,fontSize:13}}>­ƒû¿´©Å Vista previa / Imprimir factura</button>
          <div style={S.card}>
          {/* Acciones */}

          </div>
            {ivaPct===5&&<div style={{marginTop:8,fontSize:11,color:T.mut,fontStyle:"italic"}}>* No genera derecho a crédito fiscal</div>}
            </div>
              </div>
                <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(f.tasa_cambio>0?total/f.tasa_cambio:0)} USD</div>
                {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,fontWeight:600}}><span>Saldo pendiente</span><span>Q {fmt(saldoPend)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(total)}</span></div>
              <div style={{borderTop:"1px solid "+T.bord,marginTop:6,paddingTop:6}}>
              {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sec}}><span>Anticipo aplicado</span><span>ÔÇô Q {fmt(f.anticipo_aplicado)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>IVA ({ivaPct}%)</span><span>Q {fmt(ivaAmt)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>Subtotal (sin IVA)</span><span>Q {fmt(subtotalSinIVA)}</span></div>
            <div style={{background:T.surf,borderRadius:9,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RESUMEN</div>
          <div style={S.card}>
          {/* Resumen totales */}

          </div>
            </div>
              ))}
                </div>
                  </div>
                    Subtotal: Q {(((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0))-(parseFloat(l.descuento)||0)).toFixed(2)}
                  <div style={{textAlign:"right",marginTop:4,fontSize:11,color:T.acc,fontWeight:600}}>
                  </div>
                    </div>
                      {lineas.length>1&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"5px 8px",fontSize:11}}>Ô£ò</button>}
                    <div style={{display:"flex",alignItems:"flex-end"}}>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right"}} type="number" step="0.01" value={l.descuento} onChange={e=>updateLinea(idx,"descuento",e.target.value)} placeholder="0.00"/>
                      <label style={{...S.lbl,fontSize:9}}>DESCUENTO (Q)</label>
                    <div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right",color:T.acc}} type="number" step="0.01" value={l.precio_unitario} onChange={e=>updateLinea(idx,"precio_unitario",e.target.value)} placeholder="0.00"/>
                      <label style={{...S.lbl,fontSize:9}}>P. UNITARIO (Q)</label>
                    <div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 6px",textAlign:"center"}} type="number" value={l.cantidad} onChange={e=>updateLinea(idx,"cantidad",e.target.value)} min="1"/>
                      <label style={{...S.lbl,fontSize:9}}>CANT.</label>
                    <div>
                  <div style={{display:"grid",gridTemplateColumns:"60px 1fr 1fr auto",gap:6,alignItems:"flex-end"}}>
                  </div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px"}} value={l.descripcion} onChange={e=>updateLinea(idx,"descripcion",e.target.value)} placeholder="Descripción del servicio o producto"/>
                      <label style={{...S.lbl,fontSize:9}}>DESCRIPCIÓN</label>
                    <div>
                    </div>
                      </select>
                        <option value="Servicio">Servicio</option>
                        <option value="Bien">Bien</option>
                      <select style={{...S.sel,padding:"5px 6px",fontSize:11}} value={l.tipo} onChange={e=>updateLinea(idx,"tipo",e.target.value)}>
                      <label style={{...S.lbl,fontSize:9}}>TIPO</label>
                    <div>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:6}}>
                <div key={idx} style={{background:T.surf,borderRadius:8,padding:10,border:"1px solid "+T.bord}}>
              {lineas.map((l,idx)=>(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
            </div>
              <button onClick={addLinea} style={{...S.btn("primary"),fontSize:11,padding:"4px 10px"}}>+ Agregar línea</button>
              <div style={{fontSize:12,fontWeight:700,color:T.mut}}>DETALLE DE SERVICIOS / PRODUCTOS</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={S.card}>
          {/* Líneas de detalle */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Columna derecha - Líneas y resumen */}

        </div>
          </div>
            </div>
              </Fld>
                </select>
                  <option value="pagada">­ƒÆÜ Pagada</option>
                  <option value="certificada">✅ Certificada (DTE)</option>
                  <option value="emitida">­ƒôñ Emitida</option>
                  <option value="borrador">­ƒôØ Borrador</option>
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
              <Fld label="ESTADO">
            <div style={{marginTop:10}}>
            </Fld>
              <textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/>
            <Fld label="NOTAS / OBSERVACIONES">
          <div style={S.card}>
          {/* Notas */}

          </div>
            </div>
              </Fld>
                <input style={S.inp} type="number" step="0.01" value={f.anticipo_aplicado} onChange={e=>sf("anticipo_aplicado",parseFloat(e.target.value)||0)} placeholder="0.00"/>
              <Fld label="ANTICIPO RECIBIDO (Q)">
              </Fld>
                </select>
                  {cotizaciones.map(c=><option key={c.id} value={c.id}>{c.numero} — {c.cliente_nombre} — Q {fmt(c.total_gtq)}</option>)}
                  <option value="">Sin vinculación a cotización</option>
                <select style={S.sel} value={f.cotizacion_id} onChange={e=>onSelectCotizacion(e.target.value)}>
              <Fld label="COTIZACIÓN (opcional)">
              </Fld>
                </select>
                  {reservas.map(r=><option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre} — Q {fmt(r.monto)}</option>)}
                  <option value="">Sin vinculación a reserva</option>
                <select style={S.sel} value={f.reserva_id} onChange={e=>onSelectReserva(e.target.value)}>
              <Fld label="RESERVA (opcional)">
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>VINCULAR A RESERVA O COTIZACIÓN</div>
          <div style={S.card}>
          {/* Vincular */}

          </div>
            </div>
              </Fld>
                </select>
                  <option value="tarjeta">­ƒÆ│ Tarjeta</option>
                  <option value="deposito">💰 Depósito</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="efectivo">­ƒÆÁ Efectivo</option>
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
              <Fld label="M├ëTODO PAGO">
              <Fld label="CORREO"><input style={S.inp} type="email" value={f.correo_receptor} onChange={e=>sf("correo_receptor",e.target.value)} placeholder="email@cliente.com"/></Fld>
              <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion_receptor} onChange={e=>sf("direccion_receptor",e.target.value)} placeholder="Ciudad"/></Fld>
              <Fld label="NOMBRE RECEPTOR"><input style={S.inp} value={f.nombre_receptor} onChange={e=>sf("nombre_receptor",e.target.value)} placeholder="Nombre o razón social"/></Fld>
              <Fld label="NIT RECEPTOR"><input style={S.inp} value={f.nit_receptor} onChange={e=>sf("nit_receptor",e.target.value)} placeholder="CF o NIT"/></Fld>
              </Fld>
                </select>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.codigo?c.codigo+" — ":""}{c.nombre}</option>)}
                  <option value="">Seleccionar cliente (auto-llena datos)...</option>
                <select style={S.sel} value={f.cliente_id} onChange={e=>onSelectCliente(e.target.value)}>
              <Fld label="VINCULAR A CLIENTE" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RECEPTOR</div>
          <div style={S.card}>
          {/* Receptor */}

          </div>
            </div>
              <Fld label="FECHA CERTIFICACIÓN"><input style={S.inp} type="date" value={f.fecha_certificacion} onChange={e=>sf("fecha_certificacion",e.target.value)}/></Fld>
              <Fld label="FECHA EMISIÓN"><input style={S.inp} type="date" value={f.fecha_emision} onChange={e=>sf("fecha_emision",e.target.value)}/></Fld>
              <Fld label="TASA DE CAMBIO ($)"><input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e=>sf("tasa_cambio",e.target.value)}/></Fld>
              </Fld>
                </select>
                  <option value="NINGUNO">Sin impuestos</option>
                  <option value="PEQUENIO">5% — Pequeño Contribuyente</option>
                  <option value="GENERAL">12% IVA — Régimen General</option>
                <select style={S.sel} value={f.regimen} onChange={e=>sf("regimen",e.target.value)}>
              <Fld label="R├ëGIMEN FISCAL">
              <Fld label="N┬░ ACCESO"><input style={S.inp} value={f.numero_acceso} onChange={e=>sf("numero_acceso",e.target.value)} placeholder="Número de acceso"/></Fld>
              <Fld label="N┬░ DTE"><input style={S.inp} value={f.numero_dte} onChange={e=>sf("numero_dte",e.target.value)} placeholder="3370337239"/></Fld>
              <Fld label="SERIE"><input style={S.inp} value={f.serie} onChange={e=>sf("serie",e.target.value)} placeholder="TZAR2026"/></Fld>
              </Fld>
                <input style={{...S.inp,fontFamily:"monospace",fontSize:11}} value={f.numero_autorizacion} onChange={e=>sf("numero_autorizacion",e.target.value)} placeholder="F047F606-C8E3-43D7-8B21-A77A28299F83"/>
              <Fld label="N┬░ AUTORIZACIÓN SAT" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>DATOS SAT / DTE</div>
          <div style={S.card}>
          {/* Datos SAT */}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Columna izquierda */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),fontSize:12}}>ÔåÉ Volver</button>
          {initial?.id&&<button onClick={generarPDFFactura} style={{...S.btn("blue"),fontSize:12}}>­ƒû¿´©Å Vista previa / Imprimir</button>}
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar factura":"Nueva factura"}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
    <div>
  return(
  // ÔöÇÔöÇ JSX ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    const w=window.open("","_blank");w.document.write(html);w.document.close();
</body></html>`;
<script>window.onload=()=>window.print();</script>
<div style="text-align:center;margin-top:16px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
</div>
  ${f.notas?`<div style="margin-top:6px"><strong>Notas:</strong> ${f.notas}</div>`:""}
  </div>
    </div>
      <div>Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
      <div style="font-weight:700;margin-bottom:3px">Datos del certificador</div>
    <div class="certificador">
  <div class="footer-grid">
<div class="footer">
${ivaPct===5?'<p style="margin-top:6px;font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
</div>
  </table>
    <tr class="total-row"><td>TOTAL</td><td class="right">Q ${total.toFixed(2)}</td></tr>
    <tr><td>IVA (${ivaPct}%)</td><td class="right">Q ${ivaAmt.toFixed(2)}</td></tr>
    <tr><td>Subtotal</td><td class="right">Q ${subtotalSinIVA.toFixed(2)}</td></tr>
  <table class="totals-table">
<div class="totals-section">
</table>
  <tfoot><tr><td colspan="5"/><td class="right"><strong>TOTALES:</strong></td><td class="right">0.00</td><td class="right"><strong>${total.toFixed(2)}</strong></td></tr></tfoot>
  </tbody>
${lineas.filter(l=>l.descripcion).map((l,i)=>`    <tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">${parseFloat(l.descuento||0).toFixed(2)}</td><td class="right">0.00</td><td class="right">${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-parseFloat(l.descuento||0)).toFixed(2)}</td></tr>`).join("\n")}
  <tbody>
  <thead><tr><th>#No</th><th>B/S</th><th>Cantidad</th><th>Descripción</th><th class="right">P. Unitario con IVA (Q)</th><th class="right">Descuentos (Q)</th><th class="right">Otros Desc.(Q)</th><th class="right">Total (Q)</th></tr></thead>
<table>
<div class="divider"/>
</div>
  <div><span class="label">Moneda:</span> GTQ</div>
  <div><span class="label">Dirección comprador:</span> ${f.direccion_receptor||"CIUDAD"}</div>
  <div><span class="label">Fecha y hora de certificación:</span> ${f.fecha_certificacion||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">Nombre Receptor:</span> <strong>${f.nombre_receptor||"—"}</strong></div>
  <div><span class="label">Fecha y hora de emisión:</span> ${f.fecha_emision||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">NIT Receptor:</span> ${f.nit_receptor||"CF"}</div>
<div class="receptor-row">
<div class="divider"/>
</div>
  </div>
    Numero Acceso: ${f.numero_acceso||"—"}
    Serie: ${f.serie||"—"} &nbsp; Número de DTE: ${f.numero_dte||"—"}<br/>
    ${f.numero_autorizacion||"—"}<br/>
    <span class="num">N├ÜMERO DE AUTORIZACIÓN:</span><br/>
  <div class="autorizacion">
  </div>
    6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO
    <strong>TRANSPORTES TZUNUN</strong>
    Nit Emisor: 20160860<br/>
    <strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong>
  <div class="emisor">
<div class="header-top">
<div class="titulo-factura">${f.regimen==="GENERAL"?"Factura":f.regimen==="PEQUENIO"?"Factura Pequeño Contribuyente":"Documento"}</div>
</style></head><body>
@media print{button{display:none}}
.titulo-factura{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:6px}
.certificador{background:#F8FAFC;padding:6px;border:1px solid #E2E8F0}
.footer-grid{display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px}
.footer{margin-top:12px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}
.total-row td{font-weight:700;font-size:12px;border-top:1px solid #1B2D5C}
.totals-table td{padding:3px 6px}
.totals-table{width:260px;font-size:10px}
.totals-section{margin-top:8px;display:flex;justify-content:flex-end}
.right{text-align:right}
td{padding:5px 6px;border-bottom:1px solid #E2E8F0}
th{background:#1B2D5C;color:white;padding:5px 6px;text-align:left}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}
.label{color:#64748B;font-size:9px;display:block}
.receptor-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;font-size:10px}
.divider{border-top:2px solid #1B2D5C;margin:8px 0}
.autorizacion .num{font-weight:700;color:#DC2626}
.autorizacion{text-align:right;color:#1B2D5C;font-size:10px}
.emisor strong{display:block;font-size:13px}
.emisor{color:#1B2D5C}
.header-top{display:flex;justify-content:space-between;margin-bottom:8px}
body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:20px}
*{margin:0;padding:0;box-sizing:border-box}
<style>
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Factura ${f.serie||""}</title>
  const generarPDFFactura=()=>{
  // ÔöÇÔöÇ PDF SAT-style ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    onSave();
    setSaving(false);
    else await dbIns("facturas",payload);
    if(initial?.id) await dbUpd("facturas",initial.id,payload);
    };
      anticipo_aplicado:parseFloat(f.anticipo_aplicado)||0,
      tasa_cambio:parseFloat(f.tasa_cambio)||7.70,
      lineas:JSON.stringify(lineas),
      saldo_pendiente:saldoPend,
      total,
      total_iva:ivaAmt,
      subtotal:subtotalSinIVA,
      tasa_iva:ivaPct,
      numero:initial?.numero||numero,
      empresa_id:empId,
      ...f,
    const payload={
    const numero="FAC-"+Date.now().toString().slice(-8);
    setSaving(true);
    if(lineas.filter(l=>l.descripcion&&parseFloat(l.precio_unitario)>0).length===0){alert("Agrega al menos una línea con descripción y precio");return;}
    if(!f.nombre_receptor.trim()){alert("Nombre del receptor requerido");return;}
  const guardar=async()=>{
  // ÔöÇÔöÇ Guardar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    if(co&&!f.nombre_receptor){sf("nombre_receptor",co.cliente_nombre||"");sf("nit_receptor",co.cliente_nit||"");}
    const co=cotizaciones.find(x=>x.id===id);
    sf("cotizacion_id",id);
  const onSelectCotizacion=id=>{
  };
    }
      }
        setLineas([{tipo:"Servicio",cantidad:1,descripcion:"Servicio de transporte / alquiler de vehículo",precio_unitario:r.monto||"",descuento:0}]);
      if(lineas.length===1&&!lineas[0].descripcion){
      else sf("nombre_receptor",r.cliente_nombre||"");
      if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("cliente_id",c.id||"");}
      const c=clientes.find(x=>x.nombre===r.cliente_nombre);
    if(r&&!f.nombre_receptor){
    const r=reservas.find(x=>x.id===id);
    sf("reserva_id",id);
  const onSelectReserva=id=>{
  };
    if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("direccion_receptor",c.direccion||"CIUDAD");sf("correo_receptor",c.email||"");}
    const c=clientes.find(x=>x.id===id);
    sf("cliente_id",id);
  const onSelectCliente=id=>{
  // ÔöÇÔöÇ Auto-fill from cliente/reserva/cotizacion ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const saldoPend=Math.max(0,total-(parseFloat(f.anticipo_aplicado)||0));
  const total=subtotalBruto;
  const ivaAmt=subtotalBruto-subtotalSinIVA;
  const subtotalSinIVA=ivaPct>0?subtotalBruto/(1+ivaPct/100):subtotalBruto;
  // For pequeño contribuyente, price already includes IVA
  const ivaPct=f.regimen==="GENERAL"?12:f.regimen==="PEQUENIO"?5:0;

  },0);
    return s+(q*p-d);
    const d=parseFloat(l.descuento)||0;
    const p=parseFloat(l.precio_unitario)||0;
    const q=parseFloat(l.cantidad)||0;
  const subtotalBruto=lineas.reduce((s,l)=>{
  // ÔöÇÔöÇ Cálculos ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const [saving,setSaving]=useState(false);

  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const addLinea=()=>setLineas(p=>[...p,{...EMPTY_LINE}]);
  });
    return [{...EMPTY_LINE}];
    if(initial?.lineas&&initial.lineas.length>0) return initial.lineas;
  const [lineas,setLineas]=useState(()=>{
  const EMPTY_LINE={tipo:"Servicio",cantidad:1,descripcion:"",precio_unitario:"",descuento:0};
  // ÔöÇÔöÇ Líneas de detalle ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  });
    estado:initial?.estado||"borrador",
    notas:initial?.notas||"",
    anticipo_aplicado:initial?.anticipo_aplicado||0,
    cotizacion_id:initial?.cotizacion_id||"",
    reserva_id:initial?.reserva_id||"",
    cliente_id:initial?.cliente_id||"",
    tasa_cambio:initial?.tasa_cambio||7.70,
    metodo_pago:initial?.metodo_pago||"efectivo",
    regimen:initial?.regimen||"PEQUENIO", // GENERAL | PEQUENIO | NINGUNO
    correo_receptor:initial?.correo_receptor||"",
    direccion_receptor:initial?.direccion_receptor||"CIUDAD",
    nombre_receptor:initial?.nombre_receptor||"",
    nit_receptor:initial?.nit_receptor||"",
    fecha_certificacion:initial?.fecha_certificacion?.slice(0,10)||today(),
    fecha_emision:initial?.fecha_emision?.slice(0,10)||today(),
    numero_acceso:initial?.numero_acceso||"",
    numero_dte:initial?.numero_dte||"",
    serie:initial?.serie||"TZAR2026",
    numero_autorizacion:initial?.numero_autorizacion||"",
  const [f,setF]=useState({
  // ÔöÇÔöÇ State ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function FormFactura({initial,empId,clientes,reservas,cotizaciones,onSave,onCancel}){

}
  );
    </div>
      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={()=>onConfirm(parseFloat(monto)||saldo,fecha,metodo)} style={{...S.btn("primary"),flex:1}}>✅ Registrar pago</button>
        <div style={{display:"flex",gap:8}}>
        </div>
          </Fld>
            </select>
              <option value="cheque">­ƒôä Cheque</option>
              <option value="tarjeta">­ƒÆ│ Tarjeta</option>
              <option value="deposito">💰 Depósito</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="efectivo">­ƒÆÁ Efectivo</option>
            <select style={S.sel} value={metodo} onChange={e=>setMetodo(e.target.value)}>
          <Fld label="M├ëTODO" span2>
          </Fld>
            <input style={S.inp} type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
          <Fld label="FECHA DE PAGO">
          </Fld>
            <input style={S.inp} type="number" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} placeholder={fmt(saldo)}/>
          <Fld label="MONTO A PAGAR (GTQ)">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:16}}>
        </div>
          <div style={S.srow(true)}><span>Saldo pendiente</span><span style={{color:T.sec}}>Q {fmt(saldo)}</span></div>
          <div style={S.srow(false)}><span>Anticipo aplicado</span><span>Q {fmt(factura.anticipo_aplicado)}</span></div>
          <div style={S.srow(false)}><span>Total factura</span><span>Q {fmt(factura.total)}</span></div>
        <div style={{background:T.surf,borderRadius:9,padding:"10px 14px",marginBottom:16}}>
        <div style={{fontSize:13,color:T.sub,marginBottom:4}}>{factura.numero} · {factura.nombre_receptor}</div>
        <div style={{fontSize:15,fontWeight:700,color:T.acc,marginBottom:6}}>💰 Registrar Pago</div>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:440,padding:24}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  const saldo=parseFloat(factura.saldo_pendiente)||parseFloat(factura.total)||0;
  if(!factura)return null;
  const [metodo,setMetodo]=useState("transferencia");
  const [fecha,setFecha]=useState(today());
  const [monto,setMonto]=useState("");
function ModalPago({factura,onConfirm,onCancel}){

}
  );
    </div>
      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={()=>onConfirm(motivo)} disabled={!motivo.trim()} style={{...S.btn("danger"),flex:1,opacity:motivo.trim()?1:0.5}}>­ƒÜ½ Confirmar anulación</button>
        <div style={{display:"flex",gap:8}}>
        </div>
          ⚠️´©Å Esta acción no se puede deshacer. La factura quedará marcada como ANULADA en el sistema.
        <div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.red,marginBottom:16}}>
        <textarea style={{...S.inp,minHeight:70,resize:"vertical",marginBottom:16}} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Error en datos del receptor, duplicado, etc."/>
        <label style={S.lbl}>MOTIVO DE ANULACIÓN (requerido)</label>
        <div style={{fontSize:13,color:T.sub,marginBottom:16}}>Factura <strong style={{color:T.txt}}>{factura.numero}</strong> · Q {fmt(factura.total)}</div>
        <div style={{fontSize:15,fontWeight:700,color:T.red,marginBottom:6}}>­ƒÜ½ Anular Factura</div>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.red}`,width:"100%",maxWidth:440,padding:24}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  if(!factura)return null;
  const [motivo,setMotivo]=useState("");
function ModalAnular({factura,onConfirm,onCancel}){

}
  );
    </div>
      )}
        </div>
          ))}
            </div>
              {renderItem(item)}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
            <div key={i} onClick={()=>{onSelect(item);setOpen(false);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`}}
          {filtered.map((item,i)=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:200,maxHeight:200,overflowY:"auto",marginTop:2}}>
      {open&&filtered.length>0&&(
      <input style={S.inp} value={value} onChange={handleChange} placeholder={placeholder} autoComplete="off"/>
    <div ref={ref} style={{position:"relative"}}>
  return (
  };
    else setOpen(false);
    if(v.length>0){setFiltered(items.filter(i=>getLabel(i).toLowerCase().includes(v.toLowerCase())).slice(0,6));setOpen(true);}
    const v=e.target.value;onChange(v);
  const handleChange=e=>{
  },[]);
    return()=>document.removeEventListener("mousedown",h);
    document.addEventListener("mousedown",h);
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
  useEffect(()=>{
  const ref=useRef(null);
  const [filtered,setFiltered]=useState([]);
  const [open,setOpen]=useState(false);
function Autocomplete({value,onChange,onSelect,items,placeholder,renderItem,getLabel}){

// ÔòÉÔòÉÔòÉ FACTURACIÓN ÔòÉÔòÉÔòÉ



}
  );
    </div>
      </div>
        </div>
          )}
            <div style={{textAlign:"center",padding:24,color:T.sub,fontSize:13}}>Selecciona vehículo y días para ver el resumen</div>
          ):(
            </>
              </div>
                <button onClick={()=>guardar("orden_venta")} disabled={saving} style={{...S.btn("purple"),width:"100%"}}>{saving?"...":"📦 Convertir a Orden de Venta"}</button>
                <button onClick={()=>guardar(f.estado==="borrador"?"enviada":f.estado)} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"...":"✅ Guardar cotización"}</button>
                <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%"}}>{saving?"...":"­ƒÆ¥ Borrador"}</button>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
              </div>
                <div style={{fontSize:15,fontWeight:700,color:T.sec}}>Q {fmt(total_tc)}</div>
                <div style={{fontSize:10,fontWeight:700,color:T.sec}}>Con Tarjeta C/D</div>
              <div style={{background:T.secDim,border:`1px solid ${T.sec}44`,borderRadius:9,padding:"9px 14px",marginBottom:16}}>
              </div>
                </div>
                  <span style={{fontSize:12,color:T.sub,alignSelf:"flex-end"}}>$ {fmt(total_ef/exch)}</span>
                  <span>Q {fmt(total_ef)}</span>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{fontSize:10,fontWeight:700,color:T.acc,marginBottom:3}}>PRECIO BENEFICIO — Efectivo/Depósito/Transf.</div>
              <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
              </div>
                <div style={S.srow(false)}><span>IVA {f.iva_pct}%</span><span>Q {fmt(iva_amt)}</span></div>
                <div style={S.srow(false)}><span>{f.dias}d ├ù Q{fmt(rate)}</span><span>Q {fmt(sub)}</span></div>
              <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
              )}
                </div>
                  </div>
                    ))}
                      </div>
                        <div style={{fontSize:12,fontWeight:700,color:T.acc}}>Q{fmt(p)}/d</div>
                        <div style={{fontSize:9,color:T.sub}}>{r}</div>
                      <div key={i} style={{textAlign:"center",opacity:(i===0&&f.dias<=7)||(i===1&&f.dias>=8&&f.dias<=29)||(i===2&&f.dias>=30)?1:0.4}}>
                    {[["1-7d",vehObj.dia],["8-29d",vehObj.sem],["30+d",vehObj.mes]].map(([r,p],i)=>(
                  <div style={{display:"flex",gap:16}}>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:8,padding:"10px 14px",marginBottom:10}}>
              {vehObj&&(
            <>
          {sub>0?(
          {vehObj&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {f.dias} día{f.dias!==1?"s":""}</div>}
          {f.saludo&&<div style={{fontSize:12,color:T.sub,fontStyle:"italic",marginBottom:8}}>{f.saludo}</div>}
          {f.cliente_nombre&&<div style={{fontSize:13,fontWeight:700,marginBottom:4}}>👤 {f.cliente_nombre}</div>}
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
        <div style={S.card}>
        {/* RESUMEN */}
        </div>
          </div>
            </div>
              <div><label style={S.lbl}>NOTAS INTERNAS</label><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></div>
              </div>
                </select>
                  <option value="rechazada">Rechazada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="enviada">Enviada</option>
                  <option value="borrador">Borrador</option>
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
              <div><label style={S.lbl}>ESTADO</label>
              <div><label style={S.lbl}>V├üLIDA HASTA</label><input style={S.inp} value={f.fecha_vence} onChange={e=>sf("fecha_vence",e.target.value)} placeholder="Ej: 28 de abril de 2026"/></div>
              <div><label style={S.lbl}>TASA CAMBIO GTQ=1USD</label><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",e.target.value)}/></div>
              </div>
                </div>
                  ))}
                    <button key={o.v} onClick={()=>sf("iva_pct",o.v)} style={{...S.btn(f.iva_pct===o.v?"primary":"ghost"),flex:1,fontSize:11}}>{o.l}</button>
                  {[{v:12,l:"12% General"},{v:5,l:"5% Pequeño Cont."},{v:0,l:"Sin IVA"}].map(o=>(
                <div style={{display:"flex",gap:8}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>IVA</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>💰 FISCAL Y FECHAS</div>
          <div style={S.card}>
          {/* Fiscal */}
          </div>
            </div>
              </div>
                </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
                  {imgPreview&&<img src={imgPreview} style={{height:40,borderRadius:6,border:`1px solid ${T.bord}`}} alt="veh"/>}
                  <button onClick={()=>fileRef.current?.click()} style={{...S.btn("ghost"),fontSize:11}}>­ƒôÀ Adjuntar imagen</button>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <label style={S.lbl}>IMAGEN DEL VEH├ìCULO (opcional)</label>
              <div style={{gridColumn:"span 2"}}>
              </div>
                <textarea style={{...S.inp,minHeight:64,resize:"vertical"}} value={f.descripcion_servicio} onChange={e=>sf("descripcion_servicio",e.target.value)} placeholder="Ej: Servicio de traslado de personas de Ciudad Guatemala hacia Quetzaltenango, ida y vuelta, del 19 al 21 de marzo..."/>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>DESCRIPCIÓN DEL SERVICIO</label>
              </div>
                </div>
                  <button onClick={()=>sf("con_piloto",false)} style={{...S.btn(!f.con_piloto?"warn":"ghost"),flex:1,fontSize:11}}>­ƒöæ Sin piloto</button>
                  <button onClick={()=>sf("con_piloto",true)} style={{...S.btn(f.con_piloto?"primary":"ghost"),flex:1,fontSize:11}}>­ƒºæÔÇìÔ£ê´©Å Con piloto</button>
                <div style={{display:"flex",gap:8}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>MODALIDAD</label>
              <div><label style={S.lbl}>PRECIO PERSONALIZADO</label><input style={S.inp} type="number" value={f.precio_custom} onChange={e=>sf("precio_custom",e.target.value)} placeholder="Vacío = catálogo"/></div>
              <div><label style={S.lbl}>D├ìAS</label><input style={S.inp} type="number" min="1" value={f.dias} onChange={e=>sf("dias",parseInt(e.target.value)||1)}/></div>
              </div>
                </select>
                  {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                  <option value="">Seleccionar...</option>
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>VEH├ìCULO</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>🚗 SERVICIO</div>
          <div style={S.card}>
          {/* Servicio */}
          </div>
            </div>
              </div>
                <input style={S.inp} value={f.saludo} onChange={e=>sf("saludo",e.target.value)} placeholder="Ej: Estimados señores de Fundación Myrna Mack"/>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>SALUDO PERSONALIZADO</label>
              <div><label style={S.lbl}>DIRECCIÓN DEL CLIENTE</label><input style={S.inp} value={f.cliente_dir} onChange={e=>sf("cliente_dir",e.target.value)} placeholder="Ciudad, zona..."/></div>
              <div><label style={S.lbl}>NIT</label><input style={S.inp} value={f.cliente_nit} onChange={e=>sf("cliente_nit",e.target.value)} placeholder="7032528"/></div>
              </div>
                />
                  clientes={clientes}
                  onSelect={c=>{sf("cliente_nombre",c.nombre);sf("cliente_nit",c.nit||"");sf("cliente_dir",c.direccion||"");sf("saludo","Estimados señores de "+c.nombre);}}
                  onChange={v=>sf("cliente_nombre",v)}
                  value={f.cliente_nombre}
                <ClienteAutocomplete
                <label style={S.lbl}>CLIENTE (escribe para buscar)</label>
              <div style={{gridColumn:"span 2"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>👤 DATOS DEL CLIENTE</div>
          <div style={S.card}>
          {/* Cliente */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* FORM */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
        </div>
          {isClone?"Clonar cotización":initial?.id?"Editar cotización":"Nueva cotización"}
        <div style={{fontSize:14,fontWeight:700,color:T.acc}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div>
  return (

  };
    }catch(e){showToast("Error al guardar: "+e.message,"err");setSaving(false);}
      onSave(estado);
      setSaving(false);
      showToast("Cotización guardada ✔");
      if(result&&result.error){showToast("Error: "+result.error,"err");setSaving(false);return;}
      else result=await dbIns("cotizaciones",payload);
      if(initial?.id&&!initial?.__clon) result=await dbUpd("cotizaciones",initial.id,payload);
      let result;
      };
        notas:f.notas||"",
        orden_venta:estado==="orden_venta",
        estado:estado==="orden_venta"?"aprobada":estado,
        vehiculo_imagen_url:f.vehiculo_imagen_url||"",
        cliente_dir:f.cliente_dir||"",
        cliente_nit:f.cliente_nit||"",
        total_usd:parseFloat(f.total_usd)||0,
        total_gtq:parseFloat(f.total_gtq)||0,
        recargo_tarjeta:parseFloat(f.recargo_tarjeta)||0,
        total_iva:parseFloat(f.total_iva)||0,
        subtotal:parseFloat(f.subtotal)||0,
        tasa_cambio:parseFloat(f.exch)||7.70,
        metodo_pago:f.pago||"efectivo",
        tasa_iva:parseInt(f.iva)||5,
        incl:f.incl||[],
        con_piloto:f.con_piloto!==false,
        descripcion_servicio:f.descripcion_servicio||"",
        saludo:f.saludo||"",
        vehiculo_nombre:f.vehiculo_nombre||"",
        dias:parseInt(f.dias)||1,
        numero:(!initial?.id||initial?.__clon)?"COT-"+Date.now().toString().slice(-6):initial.numero,
        tipo:f.tipo||"renta",
        cliente_nombre:f.cliente_nombre,
        empresa_id:empId,
      const payload={
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.cliente_nombre.trim()){showToast("Ingresa el nombre del cliente","err");return;}
  const guardar=async(estado)=>{

  };
    reader.readAsDataURL(file);
    reader.onload=ev=>setImgPreview(ev.target.result);
    const reader=new FileReader();
    if(!file) return;
    const file=e.target.files[0];
  const handleFile=e=>{

  const beneficios=["Experiencia de viaje segura y cómoda","Flexibilidad a sus necesidades","Puntualidad garantizada"];
  const incluidos=f.con_piloto?["Combustible lleno (súper/diésel)","Conductor/piloto profesional","Servicio y atención especializada"]:["Vehículo entregado con tanque lleno","Asistencia en ruta disponible","Servicio y atención especializada"];
  const caract=vehObj?[vehObj.nombre,"Aire acondicionado","Cinturones de seguridad","Seguro total"]:["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"];

  const exch=parseFloat(f.exch)||7.70;
  const total_tc=total_ef*1.05;
  const total_ef=sub+iva_amt;
  const iva_amt=sub*f.iva_pct/100;
  const sub=f.dias*rate;
  const rate=f.precio_custom>0?parseFloat(f.precio_custom)||0:(vehObj?tarifaFn(vehObj,f.dias):0);
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;

  const [imgPreview,setImgPreview]=useState(null);
  const fileRef=useRef(null);
  const [mostrarTC,setMostrarTC]=useState(true);  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const [saving,setSaving]=useState(false);
  });
    };
      incluidos_texto:initial.incluidos_texto||"",
      incl:initial.incl||[],
      notas:initial.notas||"",
      estado:"borrador",
      fecha_vence:initial.fecha_vence||"",
      fecha_emision:today(),
      exch:initial.tasa_cambio||7.70,
      pago:initial.metodo_pago||"efectivo",
      iva_pct:initial.tasa_iva||5,
      precio_custom:initial.precio_personalizado||"",
      dias:initial.dias||1,
      con_piloto:initial.con_piloto!==false,
      vehiculo_nombre:initial.vehiculo_nombre||"",
      tipo:initial.tipo||"renta",
      descripcion_servicio:initial.descripcion_servicio||"",
      saludo:initial.saludo||"",
      cliente_dir:initial.cliente_dir||"",
      cliente_nit:initial.cliente_nit||"",
      cliente_nombre:initial.cliente_nombre||"",
      ...EMPTY_F,
    return {
    if(!initial) return {...EMPTY_F};
  const [f,setF]=useState(()=>{
  const isClone = initial?.__clon;
function FormCotizacion({initial, empId, clientes, onSave, onCancel}){

};
  imagen_url:"",
  caract:[],incluidos:[],beneficios:[],
  estado:"borrador",notas:"",
  fecha_emision:today(),fecha_vence:"",
  iva_pct:5,pago:"efectivo",exch:7.70,
  dias:1,precio_custom:"",
  tipo:"renta",vehiculo_nombre:"",con_piloto:true,
  saludo:"",descripcion_servicio:"",
  cliente_nombre:"",cliente_nit:"",cliente_dir:"",
const EMPTY_F={
// ÔöÇÔöÇ FORMULARIO COTIZACIÓN ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={()=>{const subject=encodeURIComponent(`Cotización ${cot.numero} — Tz'unun AutoRentas`);const body=encodeURIComponent(`Estimados,\n\nAdjunto cotización ${cot.numero} por Q ${fmt(total_ef)}.\n\nSaludos,\nOscar Gálvez\nTz'unun AutoRentas\n502-31221538`);window.open(`mailto:?subject=${subject}&body=${body}`);}} style={{...S.btn("ghost"),fontSize:12}}>Ô£ë´©Å Email</button>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc){const blob=doc.output("blob");const url=URL.createObjectURL(blob);window.open(url,"_blank");}}} style={{...S.btn("blue"),fontSize:12}}>­ƒû¿´©Å Imprimir</button>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc)doc.save(`${cot.numero}.pdf`);}} style={{...S.btn("primary"),fontSize:12}}>Ô¼ç Descargar PDF</button>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,marginTop:6}}><span>Con Tarjeta C/D</span><span>Q {fmt(total_tc)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>Equivalente USD</span><span>$ {fmt(total_ef/exch)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800,color:T.acc}}><span>PRECIO BENEFICIO</span><span>Q {fmt(total_ef)}</span></div>
            <div style={{borderTop:`1px solid ${T.bord}`,margin:"8px 0"}}/>
            ))}
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13,color:T.sub}}><span>{l}</span><span>Q {v}</span></div>
            {[[`Subtotal`,fmt(sub)],[`IVA (${iva_pct}%)`,fmt(iva_amt)]].map(([l,v],i)=>(
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:12}}>
          {/* Financiero */}
          {cot.descripcion_servicio&&<div style={{marginBottom:12,fontSize:12,color:T.sub,fontStyle:"italic"}}>{cot.descripcion_servicio}</div>}
          {/* Descripción */}
          {cot.saludo&&<div style={{background:"#00D4AA11",border:"1px solid #00D4AA33",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.sub,fontStyle:"italic"}}>"{cot.saludo}"</div>}
          {/* Saludo */}
          </div>
            <div style={{fontSize:12,color:T.sub}}>NIT: {cot.cliente_nit||"—"} · {cot.cliente_dir||""}</div>
            <div style={{fontSize:14,fontWeight:700}}>{cot.cliente_nombre}</div>
            <div style={{fontSize:10,color:T.mut,fontWeight:700,marginBottom:4}}>FACTURAR A:</div>
          <div style={{marginBottom:12}}>
          {/* Cliente */}
          </div>
            </div>
              <div style={{fontSize:11,color:T.sub}}>{cot.fecha_emision||cot.created_at?.slice(0,10)}</div>
              <div style={{fontSize:12,color:"#fff"}}>#{cot.numero}</div>
              <div style={{fontSize:16,fontWeight:800,color:T.acc}}>{cot.orden_venta?"ORDEN DE VENTA":"COTIZACIÓN"}</div>
            <div style={{textAlign:"right"}}>
            </div>
              </div>
                <div style={{fontSize:10,color:T.sub}}>502-31221538 · tzununautorentas@gmail.com</div>
                <div style={{fontSize:14,fontWeight:800,color:T.acc}}>TZ'UNUN AUTORENTAS</div>
              <div>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"#1B2D5C",borderRadius:10,padding:16,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {/* Mini header */}
        <div style={{padding:20}}>
        </div>
          <button onClick={onClose} style={{...S.btn("ghost"),padding:"4px 10px"}}>Ô£ò</button>
          <div style={{fontSize:14,fontWeight:700,color:T.acc}}>Vista previa — {cot.numero}</div>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.bord}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.bord}`,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto"}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  const exch=parseFloat(cot.tasa_cambio)||7.70;
  const total_tc=total_ef*1.05;
  const total_ef=sub+iva_amt;
  const iva_amt=sub*iva_pct/100;
  const iva_pct=parseFloat(cot.tasa_iva)||5;
  const sub=parseFloat(cot.subtotal)||0;
  if(!cot) return null;
function ModalVistaPrevia({cot, onClose}){

}
  return doc;

  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas   |   Guatemala",W/2,HP-11,{align:"center"});
  doc.text("TZ'UNUN AUTORENTAS  —  Más comodidad, rapidez y mejores precios",W/2,HP-21,{align:"center"});
  doc.setTextColor(148,163,184); doc.setFontSize(6.5); doc.setFont("helvetica","normal");
  doc.setFillColor(...TEAL); doc.rect(0,HP-36,W,2,"F");
  doc.setFillColor(...NAVY); doc.rect(0,HP-36,W,36,"F");
  // Pie

  doc.text("Adjunto cotización, quedamos a la espera de su aprobación.",W/2,y+21,{align:"center"});
  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Muchas gracias por su preferencia, esperamos poder servirle.",W/2,y+11,{align:"center"});
  doc.setTextColor(0,200,150); doc.setFontSize(8.5); doc.setFont("helvetica","bolditalic");
  doc.text("Cel. 502 31221538   |   @TzununAutorentas",22,y+21);
  doc.setTextColor(...GRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
  doc.text("Oscar Gálvez",22,y+11);
  doc.setTextColor(27,45,92); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.6); doc.line(22,y,180,y);
  // Firma y cierre

  y+=termH+10;
  doc.text("Cta. No. 3309159475",380,y+61);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.text("Banrural",380,y+52);
  doc.setTextColor(0,200,150); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.line(380,y+43,W-26,y+43);
  doc.text("A nombre de: Transportes Tz'unun",380,y+39);
  doc.text("Cta. Monetaria No. 853-000016-8",380,y+31);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.setTextColor(0,200,150); doc.text("Banco Industrial",380,y+22);
  doc.text("DATOS DE PAGO",380,y+10);
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.4); doc.line(372,y+8,372,y+termH-8);
  terms.forEach((t,i)=>doc.text(t,30,y+20+(i*7.5)));
  doc.setFontSize(7.2); doc.setFont("helvetica","normal"); doc.setTextColor(...DKGRAY);
  ];
    "ÔÇó El saldo restante se cancela al finalizar el servicio.",
    "ÔÇó El vehículo debe devolverse limpio (recargo Q.75.00 si no cumple).",
    d.con_piloto?"ÔÇó Combustible incluido según el recorrido acordado.":"ÔÇó Vehículo entregado con tanque lleno — devolver lleno.",
    "ÔÇó Anticipo del 75% para confirmar el servicio.",
    "ÔÇó Se requiere copia de DPI del responsable del grupo.",
    "ÔÇó Nuestros vehículos son higienizados antes y después de cada servicio.",
  const terms=[
  doc.text("T├ëRMINOS Y CONDICIONES",30,y+10);
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,termH,"F");
  doc.setFillColor(241,245,249); doc.roundedRect(22,y,W-44,termH,4,4,"F");
  const termH=66;
  // Términos y cuentas

  y+=10;
  });
    doc.text("$ "+usd,22+310+100+90-6,y+10,{align:"right"}); y+=16;
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.setFont("helvetica","bold"); doc.text(gtq,22+310+100-6,y+10,{align:"right"});
    doc.text(concepto,28,y+10);
    doc.setFontSize(isBenef||isTC?8.5:8); doc.setFont("helvetica",isBenef?"bold":"normal");
    doc.setTextColor(isBenef?TEAL2[0]:isTC?AMBER[0]:DKGRAY[0],isBenef?TEAL2[1]:isTC?AMBER[1]:DKGRAY[1],isBenef?TEAL2[2]:isTC?AMBER[2]:DKGRAY[2]);
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.rect(22,y,W-44,16,"S");
    doc.rect(22,y,W-44,16,"F");
    else doc.setFillColor(ri%2===0?255:241,ri%2===0?255:245,ri%2===0?255:249);
    else if(isTC) doc.setFillColor(255,253,235);
    if(isBenef) doc.setFillColor(232,245,240);
    const [concepto,gtq,usd,isBenef,isTC]=row;
  finRows.forEach((row,ri)=>{
  doc.text("USD",22+310+100+90-6,y+10,{align:"right"}); y+=16;
  doc.text("Concepto",28,y+10); doc.text("GTQ",22+310+100-6,y+10,{align:"right"});
  doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setFillColor(...NAVY); doc.rect(22,y,W-44,16,"F");
  const cW=[310,100,90];
  ];
    ["Con Tarjeta de Crédito / Débito",fmt(d.total_tc),fmt(d.total_tc/d.exch),false,true],
    ["PRECIO BENEFICIO — Efectivo / Depósito / Transferencia",fmt(d.total_ef),fmt(d.total_ef/d.exch),true,false],
    ["Impuesto "+d.iva_pct+"% ("+(d.iva_pct===5?"Pequeño Contribuyente":"Régimen General")+")",fmt(d.iva_amt),fmt(d.iva_amt/d.exch),false,false],
    ["Subtotal (precio base)",fmt(d.sub),fmt(d.sub/d.exch),false,false],
  const finRows=[
  doc.text("RESUMEN FINANCIERO",30,y+8); y+=14;
  doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
  // Tabla financiera

  }
    y+=18;
    doc.text("⚠️  SIN PILOTO: Vehículo entregado con tanque lleno — debe devolverse con tanque lleno.",32,y+8);
    doc.setTextColor(146,64,14); doc.setFontSize(7.2); doc.setFont("helvetica","bold");
    doc.setFillColor(...AMBER); doc.rect(22,y,3,13,"F");
    doc.setFillColor(255,248,231); doc.roundedRect(22,y,W-44,13,3,3,"F");
  if(!d.con_piloto){
  // Nota combustible

  y+=boxH+10;
  });
    col.items.forEach((item,j)=>doc.text("ÔÇó "+item,cx+9,y+22+(j*9.5)));
    doc.setTextColor(...DKGRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.line(cx+6,y+13,cx+colW-8,y+13);
    doc.text(col.title,cx+8,y+10);
    doc.setTextColor(...col.color); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.setFillColor(...col.color); doc.rect(cx,y,3,boxH,"F");
    doc.roundedRect(cx,y,colW-2,boxH,3,3,"F");
    doc.setFillColor(ci%2===0?241:232,ci%2===0?245:238,ci%2===0?249:244);
    const cx=22+ci*colW;
  cols.forEach((col,ci)=>{
  const boxH=14+maxR*9.5+8;
  const maxR=Math.max(...cols.map(c=>c.items.length));
  ];
    {title:"BENEFICIOS",items:d.beneficios,color:[245,158,11]},
    {title:"SERVICIOS INCLUIDOS",items:d.incluidos,color:[27,45,92]},
    {title:"VEH├ìCULO Y CARACTER├ìSTICAS",items:d.caract,color:[0,200,150]},
  const cols=[
  const colW=(W-44)/3;
  // 3 columnas

  }
    y+=sl.slice(0,3).length*10+8;
    sl.slice(0,3).forEach((ln,i)=>doc.text(ln,22,y+(i*10)));
    const sl=doc.splitTextToSize(d.servicio,W-44);
    doc.setTextColor(...DKGRAY); doc.setFontSize(8); doc.setFont("helvetica","italic");
    doc.text("DESCRIPCIÓN DEL SERVICIO",30,y+8); y+=16;
    doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
    doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
  if(d.servicio){
  // Descripción

  y+=58;
  introL.slice(0,3).forEach((ln,i)=>doc.text(ln,32,y+25+(i*9)));
  const introL=doc.splitTextToSize(intro,W-88);
  const intro="En Transportes Tz'unun nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas en renta de vehículos, viajes de turismo y traslado de personas en Guatemala y Centroamérica. Con mucho gusto le presentamos la siguiente cotización:";
  doc.setTextColor(...DKGRAY); doc.setFontSize(7.8); doc.setFont("helvetica","normal");
  doc.text(saludoLines[0].slice(0, 80), 32, y+13);
  const saludoLines = doc.splitTextToSize(saludoText, W-70);
  const saludoText = (d.saludo||"Estimados señores de "+(d.cliente||"")) + ":";
  doc.setTextColor(27,45,92); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,46,"F");
  doc.setFillColor(232,245,240); doc.roundedRect(22,y,W-44,46,4,4,"F");
  // Saludo

  doc.setDrawColor(226,232,240); doc.setLineWidth(0.5); doc.line(22,y,W-22,y); y+=12;
  y+=8;
  if(d.nit) doc.text("NIT: "+d.nit+(d.dir_cliente?"   |   "+d.dir_cliente:""),22,y);
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","normal");
  y += clientLines.length * 8;
  doc.text(clientLines, 22, y);
  const clientLines = doc.splitTextToSize(d.cliente||"", 180);
  // Client name with auto-wrap for long names
  doc.setTextColor(30,41,59); doc.setFontSize(12); doc.setFont("helvetica","bold");
  doc.text("FACTURAR A:",22,y); y+=12;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","bold");
  // Cliente

  let y = 110;

  doc.setDrawColor(...TEAL); doc.setLineWidth(2); doc.line(0,92,W,92);
  doc.text("Válida hasta: "+(d.fecha_vence||"15 días"),W-20,72,{align:"right"});
  doc.text("Emisión:      "+d.fecha,W-20,61,{align:"right"});
  doc.setTextColor(148,163,184); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("# "+d.numero,W-20,48,{align:"right"});
  doc.setTextColor(...WHITE); doc.setFontSize(10);
  doc.text(d.es_orden?"ORDEN DE VENTA":"COTIZACIÓN",W-20,33,{align:"right"});
  doc.setTextColor(0,212,170); doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas",100,72);
  doc.text("2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala",100,61);
  doc.setTextColor(148,163,184); doc.setFontSize(7.5);
  doc.text("M├üS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS  Ôÿà  Ôÿà",100,48);
  doc.setTextColor(0,212,170); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("TZ'UNUN AUTORENTAS",100,34);
  doc.setTextColor(...WHITE); doc.setFontSize(17); doc.setFont("helvetica","bold");
  try{ doc.addImage("data:image/png;base64,"+LOGO_B64,"PNG",18,8,70,70); }catch(e){}
  doc.setFillColor(...TEAL); doc.rect(0,0,W,3,"F");
  doc.setFillColor(...NAVY); doc.rect(0,0,W,90,"F");
  // Header

  const LGRAY=[241,245,249],WHITE=[255,255,255],AMBER=[245,158,11],DKGRAY=[51,65,85];
  const NAVY=[27,45,92],TEAL=[0,212,170],TEAL2=[29,158,117],GRAY=[100,116,139];
  const HP = doc.internal.pageSize.getHeight();
  const W = doc.internal.pageSize.getWidth();
  const doc = new jsPDF({orientation:"portrait",unit:"pt",format:"letter"});
  if(!jsPDF){alert("jsPDF no cargó. Intenta de nuevo en unos segundos.");return;}
  const {jsPDF} = window.jspdf;
  if(!window.jspdf){alert("PDF no disponible. Recarga la página e intenta de nuevo.");return null;}
function generarPDF(d){

}
  );
    </div>
      )}
        </div>
          ))}
            </div>
              <div style={{fontSize:11,color:T.sub}}>NIT: {c.nit||"—"} · {c.tipo}</div>
              <div style={{fontWeight:600,color:T.txt}}>{c.nombre}</div>
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
            <div key={c.id} onClick={()=>select(c)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`,fontSize:13}}
          {filtered.map(c=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:100,maxHeight:200,overflowY:"auto",marginTop:2}}>
      {open && filtered.length > 0 && (
        placeholder="Escribe para buscar cliente..." autoComplete="off"/>
      <input style={S.inp} value={value} onChange={handleChange}
    <div ref={ref} style={{position:"relative"}}>
  return (

  };
    setOpen(false);
    onSelect(c);
  const select = c => {

  };
    }
      setOpen(false);
    } else {
      setOpen(true);
      setFiltered(clientes.filter(c=>c.nombre.toLowerCase().includes(v.toLowerCase())).slice(0,6));
    if(v.length > 0){
    onChange(v);
    const v = e.target.value;
  const handleChange = e => {

  },[]);
    return ()=>document.removeEventListener("mousedown", handler);
    document.addEventListener("mousedown", handler);
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
  useEffect(()=>{

  const ref = useRef(null);
  const [filtered, setFiltered] = useState([]);
  const [open, setOpen] = useState(false);
function ClienteAutocomplete({value, onChange, onSelect, clientes}){

// ÔòÉÔòÉÔòÉ COTIZACIONES ÔòÉÔòÉÔòÉ



}
  );
    </div>
      </div>
        </div>
          TzununSA · Acceso exclusivo para personal autorizado
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.mut }}>

        </div>
          </div>
            Ve a Supabase → Authentication → Users → Invite user y agrega el correo de cada empleado. Ellos recibirán un correo para crear su contraseña.
            <div style={{ fontWeight: 600, color: T.mut, marginBottom: 4 }}>┬┐PRIMER ACCESO?</div>
          <div style={{ marginTop: 20, padding: "12px 14px", background: T.surf, borderRadius: 8, fontSize: 12, color: T.sub }}>

          </button>
            {loading ? "Verificando..." : "Entrar →"}
          >
            style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
            onClick={handleLogin}
          <button

          </div>
            />
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            <input
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONTRASE├æA</label>
          <div style={{ marginBottom: 24 }}>

          </div>
            />
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="tu@tzununautorentas.com"
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            <input
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CORREO ELECTRÓNICO</label>
          <div style={{ marginBottom: 14 }}>

          )}
            </div>
              ❌ {error}
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>
          {error && (

          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 24, textAlign: "center" }}>Iniciar sesión</div>
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
        {/* Card login */}

        </div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Sistema de Gestión Integral</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.acc }}>Tz'unun AutoRentas</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
        {/* Logo */}
      <div style={{ width: "100%", maxWidth: 420 }}>
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
  return (

  };
    setLoading(false);
    }
      setError("Error de conexión. Verifica tu internet.");
    } catch {
      }
        setError("Correo o contraseña incorrectos");
      } else {
        onLogin(data.access_token, data.user);
        localStorage.setItem("tzunun_user", JSON.stringify({ email: data.user?.email, name: data.user?.user_metadata?.name || data.user?.email }));
        localStorage.setItem("tzunun_token", data.access_token);
      if (data.access_token) {
      const data = await sbSignIn(email.trim(), password);
    try {
    setError("");
    setLoading(true);
    }
      return;
      setError("Ingresa tu correo y contraseña");
    if (!email.trim() || !password.trim()) {
  const handleLogin = async () => {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
function LoginScreen({ onLogin }) {


}
  );
    </div>
      </div>
        </div>
          )}
            </>
              </button>
                {loading ? "Guardando..." : "Crear contraseña →"}
                style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}>
              <button onClick={handleSet} disabled={loading}
              </div>
                  onKeyDown={e => e.key === "Enter" && handleSet()} />
                  type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONFIRMAR CONTRASE├æA</label>
              <div style={{ marginBottom: 24 }}>
              </div>
                  type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó" />
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>NUEVA CONTRASE├æA (mínimo 8 caracteres)</label>
              <div style={{ marginBottom: 14 }}>
              {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>❌ {error}</div>}
            <>
          ) : (
            <div style={{ textAlign: "center", fontSize: 16, color: T.acc, padding: 20 }}>{msg}</div>
          {msg ? (
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
        </div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Tz'unun AutoRentas — Primer acceso</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.acc }}>Crear contraseña</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
  return (

  };
    setLoading(false);
    }
      setError("Error al guardar. Pide una nueva invitación.");
    } else {
      setTimeout(onDone, 2000);
      setMsg("✅ Contraseña creada. Ya puedes iniciar sesión.");
    if (data.id) {
    const data = await sbSetPassword(token, pwd);
    setLoading(true); setError("");
    if (pwd !== pwd2) { setError("Las contraseñas no coinciden"); return; }
    if (pwd.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
  const handleSet = async () => {

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwd2, setPwd2] = useState("");
  const [pwd, setPwd] = useState("");
function SetPasswordScreen({ token, onDone }) {

}
  return r.json();
  });
    body: JSON.stringify({ password: newPassword }),
    headers: { apikey: SK, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    method: "PUT",
  const r = await fetch(`${SB}/auth/v1/user`, {
async function sbSetPassword(token, newPassword) {
// ÔöÇÔöÇ PANTALLA: CREAR/CAMBIAR CONTRASE├æA (desde link de invitación) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


}
  return r.json();
  });
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
  const r = await fetch(`${SB}/auth/v1/user`, {
async function sbGetUser(token) {

}
  });
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
    method: "POST",
  await fetch(`${SB}/auth/v1/logout`, {
async function sbSignOut(token) {

}
  return r.json();
  });
    body: JSON.stringify({ email, password }),
    headers: { apikey: SK, "Content-Type": "application/json" },
    method: "POST",
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
async function sbSignIn(email, password) {

];
  "empleado4@tzununautorentas.com",
  "empleado3@tzununautorentas.com",
  "empleado2@tzununautorentas.com",
  "empleado1@tzununautorentas.com",
  "oscar@tzununautorentas.com",
const USERS_ALLOWED = [
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// AUTENTICACIÓN — Login con Supabase Auth
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

];
  {d:"Jocotan Chiquimula",km:210,dias:1},{d:"Zacualpa Quiché",km:210,dias:1},
  {d:"Playa El Tunco El Salvador",km:275,dias:1},{d:"Suchitoto El Salvador",km:253,dias:1},
  {d:"Nebaj Quiché",km:235,dias:1},{d:"Chisec Alta Verapaz",km:350,dias:1},
  {d:"Totonicapán",km:185,dias:1},{d:"Zacapa",km:160,dias:1},
  {d:"Tecpán",km:93,dias:1},{d:"Tikal Petén",km:536,dias:1},
  {d:"Sololá",km:145,dias:1},{d:"Suchitepéquez",km:164,dias:1},
  {d:"Santa Rosa",km:57,dias:1},{d:"Semuc Champey",km:300,dias:1},
  {d:"San Marcos",km:284,dias:1},{d:"San Pedro La Laguna",km:180,dias:1},
  {d:"San José / Iztapa",km:115,dias:1},{d:"San Lucas Sacatepéquez",km:25,dias:1},
  {d:"Ruinas Copán Honduras",km:235,dias:1},{d:"Sacatepéquez",km:45,dias:1},
  {d:"Río Dulce",km:300,dias:1},{d:"Río Hondo Zacapa",km:145,dias:1},
  {d:"Rabinal Baja Verapaz",km:185,dias:1},{d:"Retalhuleu",km:200,dias:1},
  {d:"Quiché (Sta. Cruz)",km:269,dias:1},{d:"Quiriguá",km:215,dias:1},
  {d:"Puerto Barrios",km:315,dias:1},{d:"Quetzaltenango",km:210,dias:1},
  {d:"Panajachel",km:140,dias:1},{d:"Petén (Flores)",km:525,dias:1},
  {d:"Livingston",km:300,dias:1},{d:"Monterrico",km:140,dias:1},
  {d:"Jalapa",km:112,dias:1},{d:"Jutiapa",km:205,dias:1},
  {d:"Ixcán Quiché",km:385,dias:1},{d:"Izabal",km:245,dias:1},
  {d:"Huehuetenango",km:275,dias:1},{d:"Irtra Retalhuleu",km:190,dias:1},
  {d:"Flores Petén",km:520,dias:1},{d:"Frontera Mesilla",km:320,dias:1},
  {d:"Esquipulas",km:215,dias:1},{d:"Escuintla",km:68,dias:1},
  {d:"El Estor Izabal",km:590,dias:1},{d:"El Progreso",km:135,dias:1},
  {d:"Cobán",km:215,dias:1},{d:"Coatepéque",km:225,dias:1},
  {d:"Chimaltenango",km:110,dias:1},{d:"Chiquimula",km:180,dias:1},
  {d:"Champerico",km:230,dias:1},{d:"Chichicastenango",km:150,dias:1},
  {d:"Antigua Guatemala",km:40,dias:1},{d:"Baja Verapaz",km:165,dias:1},
const RUTAS=[
// ÔòÉÔòÉÔòÉ TABLA DE RUTAS Y DISTANCIAS (de tarifario Tz'unun) ÔòÉÔòÉÔòÉ

const FLUJO_RES={pendiente:[{v:"confirmada",l:"Ô£ô Confirmar",s:"primary"},{v:"cancelada",l:"Ô£ù",s:"danger"}],confirmada:[{v:"en_curso",l:"ÔûÂ Iniciar",s:"blue"},{v:"cancelada",l:"Ô£ù",s:"danger"}],en_curso:[{v:"completada",l:"Ô£ô Completar",s:"primary"},{v:"cancelada",l:"Ô£ù",s:"danger"}],completada:[],cancelada:[{v:"pendiente",l:"↺",s:"ghost"}]};
const EST_FAC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},emitida:{c:T.blue,bg:T.blueDim,l:"Emitida"},certificada:{c:T.acc,bg:T.accDim,l:"Certificada"},pagada:{c:T.acc,bg:T.accDim,l:"Pagada"},parcial:{c:T.sec,bg:T.secDim,l:"Pago parcial"},anulada:{c:T.red,bg:T.redDim,l:"Anulada"}};
const EST_VEH={disponible:{c:T.acc,bg:T.accDim,l:"Disponible"},rentado:{c:T.blue,bg:T.blueDim,l:"Rentado"},mantenimiento:{c:T.sec,bg:T.secDim,l:"Mantenim."}};
const EST_RES={pendiente:{c:T.mut,bg:"#1E293B",l:"Pendiente"},confirmada:{c:T.acc,bg:T.accDim,l:"Confirmada"},en_curso:{c:T.blue,bg:T.blueDim,l:"En curso"},completada:{c:T.acc,bg:T.accDim,l:"Completada"},cancelada:{c:T.red,bg:T.redDim,l:"Cancelada"}};
const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:T.green,impuestos:T.red,servicios:T.acc,llantas:T.blue,repuestos:T.sec,hospedaje:"#06B6D4",alimentacion:"#EC4899",peajes:T.sec,oficina:T.mut,otros:T.sub};
const CAT_GASTO=["combustible","mantenimiento","seguros","salarios","impuestos","servicios","llantas","repuestos","hospedaje","alimentacion","peajes","oficina","otros"];
const CATALOGO=[{id:"c1",nombre:"Hyundai Verna (Sedán)",tipo:"Sedán",dia:300,sem:275,mes:250},{id:"c2",nombre:"Toyota RAV4 Híbrida (SUV)",tipo:"SUV",dia:600,sem:575,mes:550},{id:"c3",nombre:"Suzuki XL7 3 filas (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c4",nombre:"Suzuki Jimny 5p 4x4 (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c5",nombre:"Mitsubishi L200 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c6",nombre:"Mahindra Pikup 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c7",nombre:"Nissan Urvan Wide 16p",tipo:"Microbús",dia:750,sem:700,mes:650},{id:"c8",nombre:"Bus tipo County",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c9",nombre:"Bus tipo Pullman",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c10",nombre:"Bus Escolar",tipo:"Bus",dia:600,sem:550,mes:500}];
const GT={"Guatemala":["Guatemala","Mixco","Villa Nueva","San Miguel Petapa","Chinautla","Palencia","Fraijanes","Amatitlán"],"Alta Verapaz":["Cobán","San Pedro Carchá","Tactic","Panzós","Senahú","Lanquín","Cahabón","Chisec","Raxruhá"],"Baja Verapaz":["Salamá","Rabinal","Cubulco","Granados","San Jerónimo","Purulhá"],"Chimaltenango":["Chimaltenango","Comalapa","Tecpán","Patzún","Patzicía","Acatenango","Yepocapa"],"Chiquimula":["Chiquimula","Jocotán","Camotán","Olopa","Esquipulas","Quezaltepeque"],"El Progreso":["Guastatoya","Morazán","San Agustín Acasaguastlán","Sanarate"],"Escuintla":["Escuintla","Santa Lucía Cotzumalguapa","Tiquisate","La Gomera","San José","Iztapa"],"Huehuetenango":["Huehuetenango","Chiantla","Cuilco","Jacaltenango","San Pedro Soloma","Todos Santos","Barillas"],"Izabal":["Puerto Barrios","Livingston","El Estor","Morales"],"Jalapa":["Jalapa","San Pedro Pinula","Monjas","Mataquescuintla"],"Jutiapa":["Jutiapa","Santa Catarina Mita","Asunción Mita","Jalpatagua","Moyuta"],"Petén":["Flores","San Benito","San Andrés","La Libertad","Dolores","San Luis","Sayaxché","Poptún"],"Quetzaltenango":["Quetzaltenango","Salcajá","Ostuncalco","Almolonga","Cantel","Zunil","Coatepeque"],"Quiché":["Santa Cruz del Quiché","Chichicastenango","Cunén","Nebaj","Sacapulas","Uspantán","Ixcán"],"Retalhuleu":["Retalhuleu","San Sebastián","San Martín Zapotitlán","Champerico"],"Sacatepéquez":["Antigua Guatemala","Jocotenango","Sumpango","San Lucas Sacatepéquez","Ciudad Vieja"],"San Marcos":["San Marcos","Comitancillo","Tacaná","Tajumulco","Malacatán","Catarina","Ayutla"],"Santa Rosa":["Cuilapa","Barberena","Casillas","Chiquimulilla","Taxisco"],"Sololá":["Sololá","Nahualá","Panajachel","San Lucas Tolimán","Santiago Atitlán"],"Suchitepéquez":["Mazatenango","Cuyotenango","Santo Domingo Suchitepéquez","Chicacao"],"Totonicapán":["Totonicapán","San Cristóbal Totonicapán","San Francisco El Alto","Momostenango"],"Zacapa":["Zacapa","Estanzuela","Río Hondo","Gualán","Teculután"]};
function Empty({icon,msg,action,onAction}){return <div style={{...S.card,textAlign:"center",padding:40,color:T.sub}}><div style={{fontSize:32,marginBottom:10}}>{icon}</div><div>{msg}</div>{action&&<button onClick={onAction} style={{...S.btn("primary"),marginTop:14,fontSize:12}}>{action}</button>}</div>;}
function Fld({label,children,span2}){return <div style={span2?{gridColumn:"span 2"}:{}}><label style={S.lbl}>{label}</label>{children}</div>;}
function Spinner(){return <div style={{textAlign:"center",padding:36,color:T.sub}}>⏳ Cargando...</div>;}
function Toast({msg,type}){if(!msg)return null;const c=type==="ok"?T.acc:T.red;return <div style={{background:T.card,border:`1px solid ${c}`,borderRadius:10,padding:"11px 18px",fontSize:13,color:c,fontWeight:600,marginBottom:14}}>{type==="ok"?"✅":"❌"} {msg}</div>;}
function Badge({color,bg,label,small}){return <span style={{display:"inline-block",padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:600,color,background:bg}}>{label}</span>;}
async function dbDel(t,id){try{await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});}catch{}}
async function dbUpd(t,id,d){try{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbIns(t,d){try{const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbGet(t,q=""){try{const r=await fetch(`${SB}/rest/v1/${t}?order=created_at.desc${q}`,{headers:H});return r.json();}catch{return[];}}
const S={card:{background:T.card,border:`1px solid ${T.bord}`,borderRadius:14,padding:18},lbl:{fontSize:11,color:T.mut,display:"block",marginBottom:4,fontWeight:600},inp:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},sel:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},btn:v=>({padding:"8px 14px",borderRadius:8,border:v==="ghost"?`1px solid ${T.bord}`:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:v==="primary"?T.acc:v==="danger"?T.red:v==="blue"?T.blue:v==="purple"?T.purple:v==="green"?T.green:v==="warn"?T.sec:T.card,color:v==="primary"||v==="green"?"#0A0F1E":T.txt}),div:{borderTop:`1px solid ${T.bord}`,margin:"12px 0"},th:{textAlign:"left",fontSize:11,color:T.mut,padding:"6px 10px",fontWeight:600,background:T.surf},td:{padding:"9px 10px",borderTop:`1px solid ${T.bord}22`,fontSize:13},srow:b=>({display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:b?14:13,fontWeight:b?700:400,color:b?T.txt:T.sub})};
const today=()=>new Date().toISOString().slice(0,10);
};
  }catch{return String(s);}
    return d.toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});
    if(!d||isNaN(d.getTime()))return s;
    else{d=new Date(s);}
    else if(typeof s==="string"&&s.match(/^\d{4}-\d{2}-\d{2}$/)){d=new Date(s+"T12:00:00");}
    else if(typeof s==="string"&&s.includes("T")){d=new Date(s);}
    if(s instanceof Date){d=s;}
    let d;
  try{
  if(!s||s==="Invalid Date"||s==="null"||s==="undefined")return"—";
const fmtD=s=>{

const fmt=n=>new Intl.NumberFormat("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const T={bg:"#0A0F1E",surf:"#111827",card:"#162032",bord:"#1E3A5F",acc:"#00D4AA",accDim:"#00D4AA22",sec:"#F59E0B",secDim:"#F59E0B22",red:"#EF4444",redDim:"#EF444422",blue:"#3B82F6",blueDim:"#3B82F622",purple:"#A855F7",purpleDim:"#A855F722",green:"#22C55E",greenDim:"#22C55E22",txt:"#F1F5F9",mut:"#64748B",sub:"#94A3B8"};
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"};
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const SB="https://fmijbpatkddkbxlkfoza.supabase.co";
const LOGO_B64="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";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import React, { useState, useEffect, useRef } from "react";
/** @jsx React.createElement */
/** @jsxRuntime classic */


const TIPO_COLOR={activo:T.blue,pasivo:T.red,capital:T.purple,ingreso:T.acc,gasto:T.sec};

];
  {codigo:"5112",nombre:"Gastos de Oficina",          tipo:"gasto",   nivel:3},
  {codigo:"5111",nombre:"Servicios Públicos",         tipo:"gasto",   nivel:3},
  {codigo:"5110",nombre:"Impuestos y Licencias",      tipo:"gasto",   nivel:3},
  {codigo:"5109",nombre:"Peajes",                     tipo:"gasto",   nivel:3},
  {codigo:"5108",nombre:"Alimentación",               tipo:"gasto",   nivel:3},
  {codigo:"5107",nombre:"Hospedaje Pilotos",          tipo:"gasto",   nivel:3},
  {codigo:"5106",nombre:"Llantas y Repuestos",        tipo:"gasto",   nivel:3},
  {codigo:"5105",nombre:"Depreciación Vehículos",     tipo:"gasto",   nivel:3},
  {codigo:"5104",nombre:"Salarios y Prestaciones",    tipo:"gasto",   nivel:3},
  {codigo:"5103",nombre:"Seguros de Vehículos",       tipo:"gasto",   nivel:3},
  {codigo:"5102",nombre:"Mantenimiento y Reparación", tipo:"gasto",   nivel:3},
  {codigo:"5101",nombre:"Combustible",                tipo:"gasto",   nivel:3},
  {codigo:"5.1", nombre:"Gastos de Operación",        tipo:"gasto",   nivel:2},
  {codigo:"5",   nombre:"GASTOS",                     tipo:"gasto",   nivel:1},
  {codigo:"4103",nombre:"Otros Ingresos",             tipo:"ingreso", nivel:3},
  {codigo:"4102",nombre:"Ingresos por Traslados",     tipo:"ingreso", nivel:3},
  {codigo:"4101",nombre:"Ingresos por Renta Vehículos",tipo:"ingreso",nivel:3},
  {codigo:"4",   nombre:"INGRESOS",                   tipo:"ingreso", nivel:1},
  {codigo:"3102",nombre:"Utilidades Retenidas",       tipo:"capital", nivel:3},
  {codigo:"3101",nombre:"Capital Social",             tipo:"capital", nivel:3},
  {codigo:"3",   nombre:"PATRIMONIO",                 tipo:"capital", nivel:1},
  {codigo:"2104",nombre:"IGSS por Pagar",             tipo:"pasivo",  nivel:3},
  {codigo:"2103",nombre:"ISR por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2102",nombre:"IVA por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2101",nombre:"Cuentas por Pagar Proveed.", tipo:"pasivo",  nivel:3},
  {codigo:"2.1", nombre:"Pasivo Corriente",           tipo:"pasivo",  nivel:2},
  {codigo:"2",   nombre:"PASIVOS",                    tipo:"pasivo",  nivel:1},
  {codigo:"1202",nombre:"Depreciación Acumulada Veh.",tipo:"activo",  nivel:3},
  {codigo:"1201",nombre:"Vehículos",                  tipo:"activo",  nivel:3},
  {codigo:"1.2", nombre:"Activo No Corriente",        tipo:"activo",  nivel:2},
  {codigo:"1106",nombre:"IVA Crédito Fiscal",         tipo:"activo",  nivel:3},
  {codigo:"1105",nombre:"Anticipos Recibidos",        tipo:"activo",  nivel:3},
  {codigo:"1104",nombre:"Cuentas por Cobrar Clientes",tipo:"activo",  nivel:3},
  {codigo:"1103",nombre:"Banrural GTQ",               tipo:"activo",  nivel:3},
  {codigo:"1102",nombre:"Banco Industrial GTQ",       tipo:"activo",  nivel:3},
  {codigo:"1101",nombre:"Caja",                       tipo:"activo",  nivel:3},
  {codigo:"1.1", nombre:"Activo Corriente",           tipo:"activo",  nivel:2},
  {codigo:"1",   nombre:"ACTIVOS",                   tipo:"activo",  nivel:1},
const CUENTAS_DEFAULT=[
// ÔöÇÔöÇ Catálogo de Cuentas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// MÓDULO: CONTABILIDAD — Catálogo de Cuentas + Diarios Manuales
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ


}
  );
    </div>
      )}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>
                  <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>Ô£Å´©Å Editar</button>
                  {r.estado==="en_proceso"&&<button onClick={()=>terminar(r)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>✅ Marcar completado</button>}
                <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                </div>
                  </div>
                    {alerta&&<div style={{fontSize:10,fontWeight:700,color:T.red,marginTop:2}}>­ƒö┤ +{kmDesde.toLocaleString()} km — necesita mantenimiento</div>}
                    <div style={{fontSize:11,color:T.sub}}>KM entrada: {(r.km_entrada||0).toLocaleString()}{r.km_salida>0?" · Salida: "+(r.km_salida).toLocaleString():""}</div>
                    <div style={{fontSize:15,fontWeight:700,color:T.red,marginTop:4}}>Q {fmt(r.costo)}</div>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:r.estado==="completado"?T.acc:T.sec,background:r.estado==="completado"?T.accDim:T.secDim}}>{r.estado==="completado"?"✅ Completado":"🔧 En proceso"}</span>
                  <div style={{textAlign:"right"}}>
                  </div>
                    <div style={{fontSize:12,color:T.txt,marginTop:4}}>{r.descripcion}</div>
                    <div style={{fontSize:12,color:T.sub,marginTop:2}}>🔧 {r.tipo} · {r.proveedor||"Sin taller"} · {fmtD(r.fecha_entrada)}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.vehiculo_nombre}</div>
                  <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div key={r.id} style={{...S.card,borderLeft:"3px solid "+(r.estado==="completado"?T.acc:T.sec)}}>
            return(
            const alerta=kmDesde>=5000;
            const kmDesde=r.estado==="completado"?kmAct-(r.km_salida||0):0;
            const kmAct=veh?.km_actual||0;
            const veh=vehiculos.find(v=>v.id===r.vehiculo_id);
          {rows.map(r=>{
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🔧" msg="Sin registros de mantenimiento" action="+ Registrar" onAction={abrirNuevo}/>:(
      )}
        </div>
          </div>
            </div>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <Fld label="FECHA SALIDA"><input style={S.inp} type="date" value={f.fecha_salida} onChange={e=>sf("fecha_salida",e.target.value)}/></Fld>
            <Fld label="FECHA ENTRADA"><input style={S.inp} type="date" value={f.fecha_entrada} onChange={e=>sf("fecha_entrada",e.target.value)}/></Fld>
            <Fld label="TALLER / PROVEEDOR"><input style={S.inp} value={f.proveedor} onChange={e=>sf("proveedor",e.target.value)} placeholder="Nombre del taller"/></Fld>
            <Fld label="COSTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.costo} onChange={e=>sf("costo",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="KM AL SALIR"><input style={S.inp} type="number" value={f.km_salida} onChange={e=>sf("km_salida",e.target.value)} placeholder="Al terminar"/></Fld>
            <Fld label="KM AL ENTRAR"><input style={S.inp} type="number" value={f.km_entrada} onChange={e=>sf("km_entrada",e.target.value)}/></Fld>
            <Fld label="DESCRIPCIÓN DEL TRABAJO" span2><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y filtro de aire..."/></Fld>
            <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="en_proceso">🔧 En proceso</option><option value="completado">✅ Completado</option></select></Fld>
            <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></Fld>
            </Fld>
              </select>
                {vehiculos.map(v=><option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa} · {(v.km_actual||0).toLocaleString()} km</option>)}
                <option value="">Seleccionar vehículo...</option>
              <select style={S.sel} value={f.vehiculo_id} onChange={e=>{const v=vehiculos.find(x=>x.id===e.target.value);sf("vehiculo_id",e.target.value);sf("vehiculo_nombre",v?v.marca+" "+v.modelo+" ("+v.placa+")":"");if(v)sf("km_entrada",v.km_actual||0);}}>
            <Fld label="VEH├ìCULO" span2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar":"Nuevo"} registro de mantenimiento</div>
        <div style={{...S.card,marginBottom:16}}>
      {showForm&&(
      </div>
        <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar mantenimiento</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:14}}>
      </div>
        ))}
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
            <div style={{fontSize:i===3?13:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
        {[{l:"Total registros",v:rows.length,c:T.acc},{l:"En proceso",v:rows.filter(r=>r.estado==="en_proceso").length,c:T.sec},{l:"Completados",v:rows.filter(r=>r.estado==="completado").length,c:T.acc},{l:"Costo total",v:"Q "+fmt(totalCosto),c:T.red}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      )}
        </div>
          {alertas.map(v=><div key={v.id} style={{fontSize:12,color:T.txt}}>ÔÇó {v.marca} {v.modelo} ({v.placa}) — {(v.km_actual||0).toLocaleString()} km</div>)}
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:6}}>­ƒö┤ Requieren mantenimiento (ÔëÑ5,000 km desde último servicio)</div>
        <div style={{background:T.redDim,border:"1px solid "+T.red+"44",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
      {alertas.length>0&&(
      {exportar&&<ModalExportar titulo="Mantenimiento de Vehículos" datos={rows} campos={[{label:"Vehículo",key:"vehiculo_nombre"},{label:"Tipo",key:"tipo"},{label:"Descripción",key:"descripcion"},{label:"KM Entrada",key:"km_entrada"},{label:"KM Salida",key:"km_salida"},{label:"Costo",key:"costo"},{label:"Proveedor",key:"proveedor"},{label:"Fecha Entrada",key:"fecha_entrada"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
    <div>
  return(
  const totalCosto=rows.reduce((s,r)=>s+(parseFloat(r.costo)||0),0);
  const alertas=vehiculos.filter(necesitaMant);
  };
    return(veh.km_actual||0)-ultimoKm>=5000;
    const ultimoKm=rows.filter(r=>r.vehiculo_id===veh.id&&r.estado==="completado").reduce((max,r)=>Math.max(max,r.km_salida||0),0);
  const necesitaMant=veh=>{
  const del=async id=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("mantenimientos",id);showToast("Eliminado");load();};
  };
    showToast("Completado ✔ — vehículo disponible");load();
    if(item.vehiculo_id) await dbUpd("vehiculos",item.vehiculo_id,{estado:"disponible"});
    await dbUpd("mantenimientos",item.id,{estado:"completado",fecha_salida:today()});
  const terminar=async item=>{
  };
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
      load();
      setF({vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""});
      showToast("Guardado correctamente ✔");setSaving(false);setShowForm(false);setEditItem(null);
      if(result&&result.error){showToast("Error: "+result.error,"err");setSaving(false);return;}
      }
        if(result&&!result.error&&f.vehiculo_id)await dbUpd("vehiculos",f.vehiculo_id,{estado:"mantenimiento"});
        result=await dbIns("mantenimientos",payload);
      }else{
        if(parseInt(f.km_salida)>0&&f.vehiculo_id)await dbUpd("vehiculos",f.vehiculo_id,{km_actual:parseInt(f.km_salida)});
        result=await dbUpd("mantenimientos",editItem.id,payload);
      if(editItem?.id){
      let result;
      };
        notas:f.notas||"",
        estado:f.estado||"en_proceso",
        fecha_salida:f.fecha_salida||null,
        fecha_entrada:f.fecha_entrada||today(),
        proveedor:f.proveedor||"",
        costo:parseFloat(f.costo)||0,
        km_salida:parseInt(f.km_salida)||0,
        km_entrada:parseInt(f.km_entrada)||0,
        descripcion:f.descripcion,
        tipo:f.tipo||"preventivo",
        vehiculo_nombre:f.vehiculo_nombre,
        vehiculo_id:f.vehiculo_id||null,
        empresa_id:empId,
      const payload={
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.descripcion.trim()){showToast("Ingresa la descripción del trabajo","err");return;}
    if(!f.vehiculo_nombre){showToast("Selecciona un vehículo","err");return;}
  const guardar=async()=>{
  const abrirEditar=item=>{setEditItem(item);setF({...item,fecha_entrada:item.fecha_entrada?.slice(0,10)||today(),fecha_salida:item.fecha_salida?.slice(0,10)||""});setShowForm(true);};
  const abrirNuevo=()=>{setEditItem(null);setF({...EMPTY});setShowForm(true);};
  useEffect(()=>{load();},[]);
  };
    setLoading(false);
    setVehiculos(Array.isArray(v)?v:[]);
    setRows(Array.isArray(m)?m:[]);
    const [m,v]=await Promise.all([dbGet("mantenimientos",""),dbGet("vehiculos","")]);
    setLoading(true);
  const load=async()=>{
  const TIPOS=["preventivo","correctivo","aceite","llantas","frenos","electricidad","carrocería","lavado","otro"];
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({...EMPTY});
  const [exportar,setExportar]=useState(false);  const EMPTY={vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""};

  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [vehiculos,setVehiculos]=useState([]);
  const [rows,setRows]=useState([]);
export default function PageMantenimiento({showToast,empId}){

}
  );
    </div>
      ))}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>­ƒùæ´©Å</button>
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>Ô£Å´©Å Editar</button>
                  {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                </div>
                  </div>
                    {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                    <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span>
                  <div style={{textAlign:"right"}}>
                  </div>
                    <div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" → "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div>
                  <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div key={r.id} style={S.card}>
            return(
            const sig=FLUJO_RES[r.estado]||[];
            const e=EST_RES[r.estado]||EST_RES.pendiente;
          {filtered.map(r=>{
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
      ):(loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>setVista("form")}/>:(
        <CalendarioReservas rows={rows} onEdit={r=>{setEditItem(r);setVista("form");}}/>
      {viewMode==="calendario"?(
      </div>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva reserva</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
        <button onClick={()=>setViewMode(viewMode==="lista"?"calendario":"lista")} style={{...S.btn("ghost"),fontSize:11}}>{viewMode==="lista"?"📅 Ver calendario":"📋 Ver lista"}</button>
        ))}
          </button>
            {f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}
          <button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=>(
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        ))}
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Pendientes",v:rows.filter(r=>r.estado==="pendiente").length,c:T.mut},{l:"Confirmadas",v:rows.filter(r=>r.estado==="confirmada").length,c:T.acc},{l:"En curso",v:rows.filter(r=>r.estado==="en_curso").length,c:T.blue},{l:"Completadas",v:rows.filter(r=>r.estado==="completada").length,c:T.acc}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
    <div>
  return(
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada ✔":"Guardada ✔");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const del=async id=>{if(!confirm("┬┐Eliminar reserva?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  };
    showToast("Estado actualizado");load();
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"disponible"});
      const res=rows.find(r=>r.id===id);
    if(estado==="cancelada"){
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"mantenimiento"});
      const res=rows.find(r=>r.id===id);
    if(estado==="completada"){
    }
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"rentado"});
      const res=rows.find(r=>r.id===id);
    if(estado==="en_curso"){
    await dbUpd("reservas",id,{estado});
  const chEst=async(id,estado)=>{
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("reservas","");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [viewMode,setViewMode]=useState("lista"); // lista | calendario
  const [filtro,setFiltro]=useState("todas");
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageReservas({showToast,empId}){


}
  );
    </div>
      </div>
        ))}
          </div>
            <span style={{color:T.sub}}>{l}</span>
            <div style={{width:10,height:10,borderRadius:2,background:c+"44",border:"1px solid "+c}}/>
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
        {[["Pendiente","#64748B"],["Confirmada","#00D4AA"],["En curso","#3B82F6"],["Completada","#22C55E"],["Cancelada","#EF4444"]].map(([l,c])=>(
      <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
      </div>
        ))}
          </div>
            )}
              </>
                {cell.dayReservas.length>3&&<div style={{fontSize:9,color:T.mut}}>+{cell.dayReservas.length-3} más</div>}
                ))}
                  </div>
                    {r.cliente_nombre?.split(" ")[0]} {r.vehiculo_nombre?.split(" ")[0]||""}
                  <div key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{fontSize:9,fontWeight:600,background:(EST_C[r.estado]||"#64748B")+"33",color:EST_C[r.estado]||"#64748B",borderLeft:"2px solid "+(EST_C[r.estado]||"#64748B"),padding:"1px 4px",borderRadius:2,marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={r.cliente_nombre+" — "+r.vehiculo_nombre}>
                {cell.dayReservas.slice(0,3).map(r=>(
                <div style={{fontSize:12,fontWeight:cell.isToday?700:400,color:cell.isToday?T.acc:T.sub,marginBottom:3}}>{cell.dayNum}</div>
              <>
            {cell.isValid&&(
          <div key={idx} style={{minHeight:80,background:cell.isToday?T.accDim:cell.isValid?T.surf:"transparent",borderRadius:6,padding:4,border:cell.isToday?"1px solid "+T.acc:"1px solid transparent"}}>
        {cells.map((cell,idx)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {/* Calendar cells */}
      </div>
        {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#64748B",padding:"4px 0"}}>{d}</div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
      {/* Day headers */}
      </div>
        <button onClick={()=>setMes(new Date(year,month+1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ║</button>
        <div style={{fontSize:16,fontWeight:700}}>{MESES[month]} {year}</div>
        <button onClick={()=>setMes(new Date(year,month-1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ╣</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      {/* Header */}
    <div style={S.card}>
  return(

  }
    cells.push({dayNum,isValid,isToday,dayReservas});
    const dayReservas=isValid?getReservasForDay(dayNum):[];
    const isToday=isValid&&new Date().toDateString()===new Date(year,month,dayNum).toDateString();
    const isValid=dayNum>=1&&dayNum<=lastDay.getDate();
    const dayNum=i-startDow+1;
  for(let i=0;i<totalCells;i++){
  const cells=[];

  };
    });
      return fi<=dateStr && dateStr<=ff;
      const ff=r.fecha_fin?r.fecha_fin.slice(0,10):fi;
      const fi=r.fecha_inicio.slice(0,10);
      if(!r.fecha_inicio) return false;
    return rows.filter(r=>{
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const getReservasForDay=(day)=>{

  const totalCells=Math.ceil((startDow+lastDay.getDate())/7)*7;
  startDow=startDow===0?6:startDow-1; // convert to Mon=0
  let startDow=firstDay.getDay(); // 0=Sun
  // Start from Monday
  const lastDay=new Date(year,month+1,0);
  const firstDay=new Date(year,month,1);
  const month=mes.getMonth();
  const year=mes.getFullYear();

  const EST_C={pendiente:"#64748B",confirmada:"#00D4AA",en_curso:"#3B82F6",completada:"#22C55E",cancelada:"#EF4444"};
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const [mes,setMes]=useState(new Date());
function CalendarioReservas({rows,onNewReserva,onEdit}){
// ÔöÇÔöÇ Vista Calendario de Reservas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


}
  );
    </div>
      )}
        </div>
          </table>
            </tbody>
              })}
                );
                  </tr>
                    </td>
                      </div>
                        <button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
                        <button onClick={()=>abrirEditar(v)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                      <div style={{display:"flex",gap:4}}>
                    <td style={S.td}>
                    </td>
                      </select>
                        <option value="mantenimiento">­ƒƒí Mantenimiento</option>
                        <option value="rentado">­ƒöÁ Rentado</option>
                        <option value="disponible">✅ Disponible</option>
                      <select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={ev=>chEst(v.id,ev.target.value)}>
                    <td style={S.td}>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span></td>
                    <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:T.sub,fontSize:11}}>{v.placa}</td>
                    <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                    </td>
                      {v.propietario&&<div style={{fontSize:9,color:T.mut}}>{v.propietario==="propio"?"­ƒÅó Propio":v.propietario==="socio"?"­ƒñØ Socio":"­ƒöæ Alq."}</div>}
                      {v.codigo||"—"}
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>
                  <tr key={v.id}>
                return(
                const e=EST_VEH[v.estado]||EST_VEH.disponible;
              {rows.map(v=>{
            <tbody>
            <thead><tr>{["Código","Vehículo","Placa","Tipo","Km","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🚗" msg="Sin vehículos registrados" action="+ Registrar" onAction={abrirNuevo}/>:(
      </div>
        </div>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar vehículo</button>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} vehículos)</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      </div>
        ))}
          </div>
            <div style={{fontSize:12,color:T.sub}}>{s.l}</div>
            <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
        {[{l:"Disponibles",v:disp,c:T.acc,bg:T.accDim},{l:"Rentados",v:rent,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",v:mant,c:T.sec,bg:T.secDim}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
    <div>
  return(
  );
    </div>
      </div>
        </div>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
        <Fld label="KILOMETRAJE ACTUAL" span2><input style={S.inp} type="number" value={f.km_actual} onChange={e=>sf("km_actual",e.target.value)} placeholder="0"/></Fld>
        </Fld>
          </select>
            <option value="mantenimiento">­ƒƒí Mantenimiento</option>
            <option value="rentado">­ƒöÁ Rentado</option>
            <option value="disponible">✅ Disponible</option>
          <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
        <Fld label="ESTADO">
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="MODELO"><input style={S.inp} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="RAV4"/></Fld>
        <Fld label="MARCA"><input style={S.inp} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota"/></Fld>
        <Fld label="A├æO"><input style={S.inp} type="number" value={f.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
        <Fld label="PLACA"><input style={S.inp} value={f.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
        </Fld>
          </select>
            <option value="alquilado">­ƒöæ Alquilado</option>
            <option value="socio">­ƒñØ Socio (A)</option>
            <option value="propio">­ƒÅó Propio (P)</option>
          <select style={S.sel} value={f.propietario} onChange={e=>sf("propietario",e.target.value)}>
        <Fld label="PROPIETARIO">
        <Fld label="CÓDIGO VEH├ìCULO"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001P"/></Fld>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      </div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Registrar"} vehículo</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div style={{maxWidth:580}}>
  if(vista==="form")return(
  const mant=rows.filter(r=>r.estado==="mantenimiento").length;
  const rent=rows.filter(r=>r.estado==="rentado").length;
  const disp=rows.filter(r=>r.estado==="disponible").length;
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast("Estado actualizado");load();};
  const del=async id=>{if(!confirm("┬┐Eliminar vehículo?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  };
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
    else await dbIns("vehiculos",p);
    if(editItem?.id) await dbUpd("vehiculos",editItem.id,p);
    const p={...f,empresa_id:empId,anio:parseInt(f.anio)||new Date().getFullYear(),km_actual:parseInt(f.km_actual)||0};
    setSaving(true);
    if(!f.placa.trim()){showToast("Placa requerida","err");return;}
  const guardar=async()=>{
  const abrirNuevo=()=>{setF({placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});setEditItem(null);setVista("form");};
  const abrirEditar=v=>{setF({codigo:v.codigo||'',propietario:v.propietario||'propio',placa:v.placa||"",marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||new Date().getFullYear(),tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0});setEditItem(v);setVista("form");};
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("vehiculos","&order=codigo.asc,marca.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({codigo:"",propietario:"propio",placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageFlota({showToast,empId}){

}
  );
    </div>
      )}
        </div>
          </table>
            </tbody>
              })}
                );
                  </tr>
                    </td>
                      </div>
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
                        <button onClick={()=>abrirEditar(c)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                      <div style={{display:"flex",gap:4}}>
                    <td style={S.td}>
                    <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:tc.c,background:tc.bg}}>{tc.l}</span></td>
                    <td style={{...S.td,fontWeight:600}}>{c.nombre}</td>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo||"—"}</td>
                  <tr key={c.id}>
                return(
                const tc=TC[c.tipo]||TC.empresa;
              {rows.map(c=>{
            <tbody>
            <thead><tr>{["Código","Cliente","Tipo","NIT","Teléfono",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="👥" msg="Sin clientes registrados" action="+ Agregar cliente" onAction={abrirNuevo}/>:(
      </div>
        </div>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo cliente</button>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Directorio de Clientes ({rows.length})</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div>
  return(
  );
    </div>
      </div>
        </div>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar cliente"}</button>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
        <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección completa"/></Fld>
        <Fld label="CORREO ELECTRÓNICO"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="correo@empresa.com"/></Fld>
        <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
        <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
        </Fld>
          </select>
            <option value="persona">Persona natural</option>
            <option value="gobierno">Gobierno / ONG</option>
            <option value="empresa">Empresa</option>
          <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
        <Fld label="TIPO DE CLIENTE">
        <Fld label="NOMBRE / RAZÓN SOCIAL"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre completo"/></Fld>
        <Fld label="CÓDIGO DE CLIENTE"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001"/></Fld>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      </div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Nuevo"} cliente</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
    <div style={{maxWidth:600}}>
  if(vista==="form")return(
  const TC={empresa:{c:T.sec,bg:T.secDim,l:"Empresa"},gobierno:{c:T.blue,bg:T.blueDim,l:"Gobierno/ONG"},persona:{c:T.acc,bg:T.accDim,l:"Persona"}};
  const del=async id=>{if(!confirm("┬┐Eliminar cliente?"))return;await dbDel("clientes",id);showToast("Eliminado");load();};
  };
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
    else await dbIns("clientes",p);
    if(editItem?.id) await dbUpd("clientes",editItem.id,p);
    const p={...f,empresa_id:empId};
    setSaving(true);
    if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}
  const guardar=async()=>{
  const abrirNuevo=()=>{setF({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});setEditItem(null);setVista("form");};
  const abrirEditar=c=>{setF({codigo:c.codigo||'',nombre:c.nombre||"",tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""});setEditItem(c);setVista("form");};
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("clientes","&order=codigo.asc,nombre.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [vista,setVista]=useState("lista");
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function PageClientes({showToast,empId}){

}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={()=>guardar("enviada")} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"✅ Guardar y enviar cotización"}</button>
            <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>{saving?"Guardando...":"­ƒÆ¥ Guardar como borrador"}</button>
          <div style={S.card}>
          </div>
            )}
              </>
                </div>
                  {tf.conTC&&<div style={{fontSize:12,color:T.sub}}>Sin tarjeta: Q {fmt(tbase)}</div>}
                  </div>
                    <span>TOTAL</span><span>Q {fmt(ttot)}</span>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px"}}>
                </div>
                  {tf.conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(ttcr)} color={T.sec}/>}
                  <Row l={"IVA "+tf.iva+"%"} v={"Q "+fmt(tiva)}/>
                  <Row l="Subtotal" v={"Q "+fmt(tsub)}/>
                  <div style={{borderTop:"1px solid "+T.bord,margin:"8px 0"}}/>
                  <Row l="Varios" v={"Q "+fmt(misc)}/>
                  <Row l={"Combustible ("+fmt(gals)+" gal)"} v={"Q "+fmt(fuel)}/>
                  <Row l={"Aliment. (├ù"+d2+"d)"} v={"Q "+fmt(aT)}/>
                  <Row l={"Hospedaje (├ù"+d2+"d)"} v={"Q "+fmt(hT)}/>
                  <Row l={"Piloto (├ù"+d2+"d)"} v={"Q "+fmt(pT)}/>
                  <Row l={"Vehículo (├ù"+d2+"d)"} v={"Q "+fmt(vT)}/>
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                {tf.ruta&&<div style={{fontSize:12,color:T.acc,marginBottom:8}}>­ƒôì {tf.ruta} · {Math.round(tkm)} km totales</div>}
              <>
            ):(
              </>
                </div>
                  <div style={{fontSize:12,color:T.sub,marginTop:3}}>$ {fmt(exch>0?tot/exch:0)} USD</div>
                  {conTC&&<div style={{fontSize:12,color:T.sub}}>Efectivo: Q {fmt(base)}</div>}
                  </div>
                    <span>{conTC?"Con tarjeta":"TOTAL"}</span><span>Q {fmt(tot)}</span>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
                </div>
                  {conTC&&<Row l="Recargo tarjeta (5%)" v={"Q "+fmt(recTC)} color={T.sec}/>}
                  <Row l={"IVA "+iva+"%"} v={"Q "+fmt(ivaAmt)}/>
                  <Row l="Subtotal" v={"Q "+fmt(sub)}/>
                  <Row l="Tarifa" v={"Q "+fmt(rate)+"/día"}/>
                <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
                {selVeh&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {selVeh.nombre} · {dias} día{dias!==1?"s":""}</div>}
              <>
            {tab==="renta"?(
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen del presupuesto</div>
          <div style={S.card}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* RESUMEN */}
        </div>
          )}
            </div>
              </div>
                <label htmlFor="conTC2" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción con tarjeta (+5%)</label>
                <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e=>stf("conTC",e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
              <div style={{gridColumn:"span 2",display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              </Fld>
                </div>
                  <button onClick={()=>stf("pago","transferencia")} style={{...S.btn(tf.pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                  <button onClick={()=>stf("pago","efectivo")} style={{...S.btn(tf.pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                <div style={{display:"flex",gap:8}}>
              <Fld label="PAGO" span2>
              <Fld label="TASA CAMBIO"><input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e=>stf("exch",e.target.value)}/></Fld>
              </Fld>
                </select>
                  <option value="12">12%</option><option value="5">5%</option><option value="0">Sin IVA</option>
                <select style={S.sel} value={tf.iva} onChange={e=>stf("iva",e.target.value)}>
              <Fld label="IVA">
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e=>stf("varios",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e=>stf("kmr",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e=>stf("kmi",e.target.value)} placeholder="0"/></Fld>
              <Fld label="KM POR GALÓN"><input style={S.inp} type="number" value={tf.kpg} onChange={e=>stf("kpg",e.target.value)} placeholder="27"/></Fld>
              <Fld label="PRECIO GALÓN (Q)"><input style={S.inp} type="number" value={tf.galon} onChange={e=>stf("galon",e.target.value)} placeholder="48"/></Fld>
              <Fld label="ALIMENTACIÓN/D├ìA"><input style={S.inp} type="number" value={tf.ali} onChange={e=>stf("ali",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="HOSPEDAJE/D├ìA"><input style={S.inp} type="number" value={tf.hos} onChange={e=>stf("hos",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO PILOTO/D├ìA"><input style={S.inp} type="number" value={tf.pil} onChange={e=>stf("pil",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="COSTO VEH├ìCULO/D├ìA"><input style={S.inp} type="number" value={tf.veh} onChange={e=>stf("veh",e.target.value)} placeholder="0.00"/></Fld>
              <Fld label="D├ìAS"><input style={S.inp} type="number" value={tf.dias} onChange={e=>stf("dias",e.target.value)}/></Fld>
              </Fld>
                </select>
                  {RUTAS.map(r=><option key={r.d} value={r.d}>{r.d} — {r.km} km · {r.dias}d</option>)}
                  <option value="">Seleccionar destino...</option>
                }}>
                  else stf("ruta",e.target.value);
                  if(r){stf("ruta",r.d);stf("kmi",r.km);stf("kmr",r.km);stf("dias",r.dias);}
                  const r=RUTAS.find(x=>x.d===e.target.value);
                <select style={S.sel} value={tf.ruta} onChange={e=>{
              <Fld label="DESTINO (tabla de rutas)" span2>
              </Fld>
                <ClienteBuscador value={tf.cliente} onChange={v=>stf("cliente",v)} empId={empId}/>
              <Fld label="CLIENTE" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          ):(
            </div>
              </div>
                <label htmlFor="conTC" style={{fontSize:13,color:T.sub,cursor:"pointer"}}>­ƒÆ│ Incluir opción de pago con tarjeta (+5%)</label>
                <input type="checkbox" id="conTC" checked={conTC} onChange={e=>setConTC(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
              </Fld>
                </div>
                  <button onClick={()=>setPago("transferencia")} style={{...S.btn(pago==="transferencia"?"primary":"ghost"),flex:1}}>🏦 Transf.</button>
                  <button onClick={()=>setPago("efectivo")} style={{...S.btn(pago==="efectivo"?"primary":"ghost"),flex:1}}>­ƒÆÁ Efectivo</button>
                <div style={{display:"flex",gap:8}}>
              <Fld label="M├ëTODO DE PAGO">
              <Fld label="TASA DE CAMBIO (Q por $1)"><input style={S.inp} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/></Fld>
              </Fld>
                </select>
                  <option value={0}>Sin IVA</option>
                  <option value={5}>5% Pequeño Contribuyente</option>
                  <option value={12}>12% Régimen General</option>
                <select style={S.sel} value={iva} onChange={e=>setIva(parseInt(e.target.value))}>
              <Fld label="IVA">
              </Fld>
                </select>
                  {CATALOGO.map(v=><option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                  <option value="">Seleccionar...</option>
                <select style={S.sel} value={selVeh?.id||""} onChange={e=>setSelVeh(CATALOGO.find(v=>v.id===e.target.value)||null)}>
              <Fld label="VEH├ìCULO">
              <Fld label="D├ìAS"><input style={S.inp} type="number" min="1" value={dias} onChange={e=>setDias(Math.max(1,parseInt(e.target.value)||1))}/></Fld>
              </Fld>
                <ClienteBuscador value={cli} onChange={setCli} empId={empId}/>
              <Fld label="CLIENTE">
            <div style={{display:"grid",gap:11}}>
          {tab==="renta"?(
        <div style={S.card}>
        {/* FORM */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        ))}
          <button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"primary":"ghost")}}>{t.l}</button>
        {[{id:"renta",l:"­ƒöæ Renta por días"},{id:"traslado",l:"­ƒù║ Traslado/Viaje"}].map(t=>(
      <div style={{display:"flex",gap:8,marginBottom:16}}>
    <div>
  return(

  const Row=({l,v,bold,color})=><div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:bold?14:13,fontWeight:bold?700:400,color:color||(bold?T.txt:T.sub)}}><span>{l}</span><span>{v}</span></div>;

  };
    setSaving(false);
    else{showToast("Error al guardar","err");}
    if(r&&!r.error){showToast(estado==="enviada"?"Cotización guardada ✔":"Borrador guardado ✔");}
    const r=await dbIns("cotizaciones",p);
    const p={empresa_id:empId,tipo:tab,cliente_nombre:cn,numero:"COT-"+Date.now().toString().slice(-6),dias:tab==="renta"?dias:d2,tasa_iva:tab==="renta"?iva:parseFloat(tf.iva)||5,metodo_pago:tab==="renta"?pago:tf.pago,tasa_cambio:tab==="renta"?exch:parseFloat(tf.exch)||7.70,subtotal:tab==="renta"?sub:tsub,total_iva:tab==="renta"?ivaAmt:tiva,recargo_tarjeta:tab==="renta"?recTC:ttcr,total_gtq:tab==="renta"?tot:ttot,total_usd:(tab==="renta"?tot:ttot)/(tab==="renta"?exch:parseFloat(tf.exch)||7.70),vehiculo_nombre:selVeh?.nombre||"",estado,km_ida:kmi,km_regreso:kmr,costo_vehiculo:parseFloat(tf.veh)||0,costo_piloto:parseFloat(tf.pil)||0,costo_hospedaje:parseFloat(tf.hos)||0,costo_alimentacion:parseFloat(tf.ali)||0,precio_galon:parseFloat(tf.galon)||0,km_por_galon:parseFloat(tf.kpg)||0,gastos_varios:misc};
    setSaving(true);
    if(!cn.trim()){showToast("Ingresa el nombre del cliente","err");return;}
    const cn=tab==="renta"?cli:tf.cliente;
  const guardar=async(estado)=>{

  const ttot=tbase+ttcr;
  const ttcr=tf.conTC?tbase*0.05:0;
  const tbase=tsub+tiva;
  const tiva=tsub*(parseFloat(tf.iva)||0)/100;
  const tsub=vT+pT+hT+aT+fuel+misc;
  const misc=parseFloat(tf.varios)||0;
  const aT=d2*(parseFloat(tf.ali)||0);
  const hT=d2*(parseFloat(tf.hos)||0);
  const pT=d2*(parseFloat(tf.pil)||0);
  const vT=d2*(parseFloat(tf.veh)||0);
  const fuel=gals*(parseFloat(tf.galon)||0);
  const gals=tkm/kpg;
  const kpg=parseFloat(tf.kpg)||1;
  const tkm=kmi+kmr;
  const kmr=parseFloat(tf.kmr)||0;
  const kmi=parseFloat(tf.kmi)||0;
  const d2=parseFloat(tf.dias)||0;
  const tot=base+recTC;
  const recTC=conTC?Math.round(base*0.05*100)/100:0;
  const base=sub+ivaAmt;
  const ivaAmt=Math.round(sub*iva/100*100)/100;
  const sub=dias*rate;
  const rate=selVeh?tarifaFn(selVeh,dias):0;
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const stf=(k,v)=>setTf(p=>({...p,[k]:v}));
  const [tf,setTf]=useState({cliente:"",dias:1,veh:0,pil:0,hos:0,ali:0,galon:48,kpg:27,kmi:0,kmr:0,varios:0,iva:5,pago:"efectivo",conTC:false,exch:7.70,ruta:""});
  const [saving,setSaving]=useState(false);
  const [exch,setExch]=useState(7.70);
  const [conTC,setConTC]=useState(false);
  const [pago,setPago]=useState("efectivo");
  const [iva,setIva]=useState(5);
  const [dias,setDias]=useState(1);
  const [selVeh,setSelVeh]=useState(null);
  const [cli,setCli]=useState("");
  const [tab,setTab]=useState("renta");
function PageCalculadora({showToast,empId}){


}
  );
    </div>
      )}
        </div>
          )}
            </div>
              </div>
                <button onClick={()=>setShowNew(false)} style={{...S.btn("ghost"),flex:1,fontSize:11,padding:"6px"}}>Cancelar</button>
                <button onClick={agregarCliente} disabled={saving} style={{...S.btn("primary"),flex:1,fontSize:11,padding:"6px"}}>{saving?"...":"✔ Guardar"}</button>
              <div style={{display:"flex",gap:6}}>
              </select>
                <option value="persona">Persona</option>
                <option value="gobierno">Gobierno/ONG</option>
                <option value="empresa">Empresa</option>
              <select style={{...S.sel,marginBottom:6,fontSize:12}} value={newTipo} onChange={e=>setNewTipo(e.target.value)}>
              <input style={{...S.inp,marginBottom:6,fontSize:12}} value={newNombre} onChange={e=>setNewNombre(e.target.value)} placeholder="Nombre del cliente"/>
            <div style={{padding:10,borderTop:"1px solid "+T.bord}}>
          ):(
            </div>
              <span>+</span> Agregar nuevo cliente
              style={{padding:"8px 12px",cursor:"pointer",fontSize:12,color:T.acc,fontWeight:600,borderTop:"1px solid "+T.bord,display:"flex",alignItems:"center",gap:6}}>
            <div onClick={()=>{setShowNew(true);setNewNombre(value);}}
          {!showNew?(
          {/* Agregar nuevo */}
          {filtered.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:T.mut}}>No encontrado</div>}
          ))}
            </div>
              <span style={{fontSize:10,color:T.mut}}>{c.tipo}</span>
              <span>{c.nombre}</span>
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.surf}
              style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid "+T.bord+"33",display:"flex",justifyContent:"space-between",alignItems:"center"}}
            <div key={i} onClick={()=>{onChange(c.nombre);setOpen(false);}}
          {filtered.map((c,i)=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.card,border:"1px solid "+T.bord,borderRadius:8,zIndex:100,maxHeight:220,overflowY:"auto",marginTop:2}}>
      {open&&(
      />
        placeholder="Escribe para buscar cliente..."
        onFocus={()=>setOpen(true)}
        onChange={e=>{onChange(e.target.value);setOpen(true);setShowNew(false);}}
        style={S.inp} value={value}
      <input
    <div ref={ref} style={{position:"relative"}}>
  return(

  };
    setSaving(false);
    }
      setShowNew(false);setNewNombre("");setOpen(false);
      setClientes(p=>[...p,{nombre:newNombre,tipo:newTipo}]);
      onChange(newNombre);
    if(r&&!r.error){
    const r=await dbIns("clientes",{nombre:newNombre,tipo:newTipo,empresa_id:empId});
    setSaving(true);
    if(!newNombre.trim())return;
  const agregarCliente=async()=>{

  const filtered=value.length>0?clientes.filter(c=>c.nombre.toLowerCase().includes(value.toLowerCase())):clientes.slice(0,8);

  },[]);
    return()=>document.removeEventListener("mousedown",h);
    document.addEventListener("mousedown",h);
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
  useEffect(()=>{

  },[]);
    dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));
  useEffect(()=>{

  const ref=useRef(null);
  const [newTipo,setNewTipo]=useState("empresa");
  const [newNombre,setNewNombre]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [saving,setSaving]=useState(false);
  const [open,setOpen]=useState(false);
  const [clientes,setClientes]=useState([]);
function ClienteBuscador({value,onChange,empId}){
// ÔöÇÔöÇ Buscador de clientes con autocompletado ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ



// ÔòÉÔòÉÔòÉ MANTENIMIENTO DE VEH├ìCULOS ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ


// ÔòÉÔòÉÔòÉ APP PRINCIPAL ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>}
        </div>
          </div>
            {[{v:12,l:"12% — Régimen General"},{v:5,l:"5% — Pequeño Contribuyente"},{v:0,l:"Sin IVA"}].map(o=><button key={o.v} onClick={()=>setIva(o.v)} style={{...S.btn(iva===o.v?"primary":"ghost"),textAlign:"left"}}>{o.l}</button>)}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>🧾 Régimen Fiscal</div>
        <div style={S.card}>
        </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"10px 14px",background:T.surf,borderRadius:9,fontSize:14}}><span style={{color:T.sub}}>1 USD =</span><span style={{fontWeight:800,color:T.acc}}>Q {fmt(exch)}</span></div>
          <input style={{...S.inp,fontSize:20,fontWeight:700,color:T.acc}} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/>
          <label style={S.lbl}>GTQ POR 1 USD</label>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>­ƒÆ▒ Tasa de Cambio del Día</div>
        <div style={S.card}>
      {tab==="fiscal"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      </div>}
        <div style={{marginTop:10,fontSize:11,color:T.mut}}>* 1-7 días = diaria · 8-29 días = semanal · 30+ días = mensual</div>
        </table>
          </tr>)}</tbody>
            <td style={S.td}><div style={{display:"flex",gap:4}}>{editId===v.id?<><button onClick={saveEdit} style={{...S.btn("primary"),padding:"4px 9px",fontSize:11}}>✔</button><button onClick={()=>setEditId(null)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>Ô£ò</button></>:<><button onClick={()=>{setEditId(v.id);setEditVals({...v});}} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>Ô£Å´©Å</button><button onClick={()=>delVeh(v.id)} style={{...S.btn("danger"),padding:"4px 9px",fontSize:11}}>­ƒùæ´©Å</button></>}</div></td>
            {["dia","sem","mes"].map(c=><td key={c} style={{...S.td,fontWeight:700,color:T.acc}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12,width:80}} type="number" value={editVals[c]} onChange={e=>setEditVals(p=>({...p,[c]:parseFloat(e.target.value)||0}))}/>:`Q ${fmt(v[c])}`}</td>)}
            <td style={S.td}>{editId===v.id?<select style={{...S.sel,padding:"5px 8px",fontSize:12}} value={editVals.tipo} onChange={e=>setEditVals(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>:v.tipo}</td>
            <td style={{...S.td,fontWeight:600}}>{editId===v.id?<input style={{...S.inp,padding:"5px 8px",fontSize:12}} value={editVals.nombre} onChange={e=>setEditVals(p=>({...p,nombre:e.target.value}))}/>:v.nombre}</td>
          <tbody>{catalogo.map(v=><tr key={v.id}>
          <thead><tr>{["Vehículo","Tipo","Q/Día","Q/Semana","Q/Mes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        </div>}
          <button onClick={addVeh} style={{...S.btn("primary"),padding:"9px 14px",alignSelf:"flex-end"}}>+</button>
          <Fld label="Q/MES"><input style={S.inp} type="number" value={newVeh.mes} onChange={e=>setNewVeh(p=>({...p,mes:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/SEM"><input style={S.inp} type="number" value={newVeh.sem} onChange={e=>setNewVeh(p=>({...p,sem:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="Q/D├ìA"><input style={S.inp} type="number" value={newVeh.dia} onChange={e=>setNewVeh(p=>({...p,dia:e.target.value}))} placeholder="0"/></Fld>
          <Fld label="TIPO"><select style={S.sel} value={newVeh.tipo} onChange={e=>setNewVeh(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
          <Fld label="NOMBRE"><input style={S.inp} value={newVeh.nombre} onChange={e=>setNewVeh(p=>({...p,nombre:e.target.value}))} placeholder="Nombre..."/></Fld>
        {showNewVeh&&<div style={{background:T.surf,borderRadius:10,padding:14,marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
        </div>
          <button onClick={()=>setShowNewVeh(!showNewVeh)} style={{...S.btn(showNewVeh?"warn":"primary"),fontSize:12}}>{showNewVeh?"Cancelar":"+ Agregar vehículo"}</button>
          <div style={{fontSize:13,fontWeight:700}}>Catálogo y Tarifas</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      {tab==="tarifas"&&<div style={S.card}>
      </div>}
        </div>
          </div>
            <div>🏦 Banrural — 3309159475</div>
            <div>🏦 Banco Industrial — 853-000016-8</div>
          <div style={{...S.card,marginTop:12,background:T.surf,fontSize:12,color:T.sub,lineHeight:2}}>
          </div>
            </div>
              <div>­ƒåö NIT: {emp.nit||"16693949"}</div>
              <div>Ô£ë´©Å {emp.email||"tzununautorentas@gmail.com"}</div>
              <div>­ƒô× {emp.telefono||"502-31221538"}</div>
              <div>­ƒôì {emp.direccion||"2da. Av. 0-68, Col. Bran, Zona 3"}</div>
            <div style={{fontSize:11,color:T.sub,lineHeight:1.8}}>
            </div>
              <div><div style={{fontSize:14,fontWeight:800,color:T.acc}}>{emp.nombre||"Tz'unun AutoRentas"}</div><div style={{fontSize:10,color:T.sub}}>M├üS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</div></div>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{background:T.surf,borderRadius:10,padding:16,border:`1px solid ${T.bord}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:12}}>Vista previa encabezado</div>
        <div style={S.card}>
        </div>
          </div>
            <div style={{gridColumn:"span 2"}}><button onClick={guardarEmp} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button></div>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={emp.direccion||""} onChange={e=>se("direccion",e.target.value)} placeholder="2da. Avenida 0-68, Col. Bran, Zona 3"/></Fld>
            <Fld label="EMAIL" span2><input style={S.inp} value={emp.email||""} onChange={e=>se("email",e.target.value)} placeholder="tzununautorentas@gmail.com"/></Fld>
            <Fld label="TEL├ëFONO"><input style={S.inp} value={emp.telefono||""} onChange={e=>se("telefono",e.target.value)} placeholder="502-31221538"/></Fld>
            <Fld label="NIT"><input style={S.inp} value={emp.nit||""} onChange={e=>se("nit",e.target.value)} placeholder="16693949"/></Fld>
            <Fld label="NOMBRE" span2><input style={S.inp} value={emp.nombre||""} onChange={e=>se("nombre",e.target.value)} placeholder="Tz'unun AutoRentas"/></Fld>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Datos de la Empresa</div>
        <div style={S.card}>
      {tab==="empresa"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      </div>
        {[{id:"empresa",l:"­ƒÅó Empresa"},{id:"tarifas",l:"💰 Tarifas"},{id:"fiscal",l:"🧾 Fiscal"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:20}}>
    <div>
  return(
  const addVeh=()=>{if(!newVeh.nombre.trim()){showToast("Nombre requerido","err");return;}setCatalogo(p=>[...p,{...newVeh,id:`c${Date.now()}`,dia:parseFloat(newVeh.dia)||0,sem:parseFloat(newVeh.sem)||0,mes:parseFloat(newVeh.mes)||0}]);setNewVeh({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});setShowNewVeh(false);showToast("Agregado ✔");};
  const delVeh=id=>{if(!confirm("┬┐Eliminar?"))return;setCatalogo(p=>p.filter(v=>v.id!==id));};
  const saveEdit=()=>{setCatalogo(p=>p.map(v=>v.id===editId?{...v,...editVals}:v));setEditId(null);showToast("Tarifa actualizada ✔");};
  const se=(k,v)=>setEmp(p=>({...p,[k]:v}));
  const guardarEmp=async()=>{if(!emp.nombre?.trim()){showToast("Nombre requerido","err");return;}setSaving(true);if(empId)await dbUpd("empresas",empId,{nombre:emp.nombre,nit:emp.nit,direccion:emp.direccion,telefono:emp.telefono,email:emp.email});showToast("Guardado ✔");setSaving(false);};
  useEffect(()=>{dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0]){setEmp(d[0]);setEmpId(d[0].id);}});},[]);
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
  const [showNewVeh,setShowNewVeh]=useState(false);const [newVeh,setNewVeh]=useState({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
  const [editId,setEditId]=useState(null);const [editVals,setEditVals]=useState({});
  const [catalogo,setCatalogo]=useState(CATALOGO.map(v=>({...v})));
  const [exch,setExch]=useState(7.70);const [iva,setIva]=useState(5);
  const [tab,setTab]=useState("empresa");const [emp,setEmp]=useState({});const [empId,setEmpId]=useState(null);const [saving,setSaving]=useState(false);
function PageConfiguracion({showToast}){
// ÔòÉÔòÉÔòÉ CONFIGURACIÓN ÔòÉÔòÉÔòÉ

}
  );
    </div>
      {loading?<Spinner/>:data&&<>{tab==="ventas"&&<ReporteVentas data={data}/>}{tab==="flota"&&<ReporteFlota data={data}/>}{tab==="gastos"&&<ReporteGastos data={data}/>}{tab==="clientes"&&<ReporteClientes data={data}/>}</>}
      </div>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺ Actualizar</button>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
    <div>
  return(
  const TABS=[{id:"ventas",l:"📊 Ventas"},{id:"flota",l:"🚗 Flota"},{id:"gastos",l:"🛍️ Gastos"},{id:"clientes",l:"👥 Clientes"}];
  };
    setLoading(false);
    setData({vehiculos:Array.isArray(vehiculos)?vehiculos:[],reservas:Array.isArray(reservas)?reservas:[],cotizaciones:Array.isArray(cotizaciones)?cotizaciones:[],facturas:Array.isArray(facturas)?facturas:[],gastos:Array.isArray(gastos)?gastos:[],clientes:Array.isArray(clientes)?clientes:[],movimientos:Array.isArray(movimientos)?movimientos:[]});
    const [vehiculos,reservas,cotizaciones,facturas,gastos,clientes,movimientos]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("gastos",""),dbGet("clientes",""),dbGet("movimientos_bancarios","")]);
    setLoading(true);
  const load=async()=>{
  useEffect(()=>{load();},[]);
  const [tab,setTab]=useState("ventas");const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
function PageReportes(){
// ÔòÉÔòÉÔòÉ REPORTES PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={(m,tp)=>{showToast(m,tp);reloadProv();}}/>}
      {tab==="gastos"&&<ModGastos empId={empId} proveedores={proveedores} showToast={showToast}/>}
      </div>
        {[{id:"gastos",l:"🛍️ Gastos y Compras"},{id:"proveedores",l:"­ƒÅ¬ Proveedores"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
    <div>
  return(
  const reloadProv=()=>dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));
  useEffect(()=>{dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));},[]);
  const [tab,setTab]=useState("gastos");const [proveedores,setProveedores]=useState([]);
function PageGastos({showToast,empId}){
// ÔòÉÔòÉÔòÉ GASTOS PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        </div>
          </>}
            )}
              </tbody></table></div>
              <tbody>{movsFil.map(m=><tr key={m.id}><td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(m.fecha)}</td><td style={{...S.td,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:175}}>{m.descripcion}</div>{m.referencia&&<div style={{fontSize:9,color:T.mut}}>{m.referencia}</div>}</td><td style={S.td}><span style={{padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:600,background:(CC[m.categoria]||T.mut)+"22",color:CC[m.categoria]||T.mut}}>{m.categoria}</span></td><td style={{...S.td,fontWeight:700,color:m.tipo==="ingreso"?T.acc:T.red,whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+ ":"ÔêÆ "}Q {fmt(m.monto)}</td><td style={S.td}><button onClick={()=>conciliar(m.id,!m.conciliado)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,padding:0}}>{m.conciliado?"✅":"Ô¼£"}</button></td><td style={S.td}><button onClick={async()=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("movimientos_bancarios",m.id);loadMovs(cuentaAct.id);}} style={{...S.btn("danger"),padding:"3px 7px",fontSize:11}}>­ƒùæ´©Å</button></td></tr>)}
              <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Fecha","Descripción","Cat.","Monto","Ô£ô",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            {movsFil.length===0?<Empty icon="­ƒÆ│" msg="Sin movimientos" action="+ Registrar" onAction={()=>setShowForm(true)}/>:(
            </div>
              {["todos","conciliado","pendiente"].map(t=><button key={t} onClick={()=>setFiltroC(t)} style={{...S.btn(filtroC===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todo":t==="conciliado"?"✅ Conciliados":"⏳ Pendientes"}</button>)}
              {["todos","ingreso","egreso"].map(t=><button key={t} onClick={()=>setFiltroT(t)} style={{...S.btn(filtroT===t?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{t==="todos"?"Todos":t==="ingreso"?"Ô¼å Ingresos":"Ô¼ç Egresos"}</button>)}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            </div>}
              </div>
                <div style={{gridColumn:"span 2",display:"flex",gap:8}}><button onClick={guardarMov} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"­ƒÆ¥ Guardar"}</button><button onClick={()=>setShowForm(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div>
                <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:18}}><input type="checkbox" checked={f.conciliado} onChange={e=>sf("conciliado",e.target.checked)} style={{width:16,height:16}}/><label style={{...S.lbl,marginBottom:0}}>CONCILIADO</label></div>
                <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="N┬░ factura..."/></Fld>
                <Fld label="CATEGOR├ìA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></Fld>
                <Fld label="MONTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/></Fld>
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripción..."/></Fld>
                <Fld label="TIPO"><div style={{display:"flex",gap:8}}><button onClick={()=>sf("tipo","ingreso")} style={{...S.btn(f.tipo==="ingreso"?"primary":"ghost"),flex:1,fontSize:12}}>Ô¼å Ingreso</button><button onClick={()=>sf("tipo","egreso")} style={{...S.btn(f.tipo==="egreso"?"danger":"ghost"),flex:1,fontSize:12}}>Ô¼ç Egreso</button></div></Fld>
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            {showForm&&<div style={{...S.card,marginBottom:14}}>
            </div>
              </div>
                <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Movimiento"}</button>
                <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
              <div style={{display:"flex",gap:6}}>
              <div><div style={{fontSize:14,fontWeight:700}}>{cuentaAct.banco}</div><div style={{fontSize:12,color:T.sub}}>{cuentaAct.numero_cuenta}</div></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          {cuentaAct&&<>
        <div>
        </div>
          {loading?<Spinner/>:cuentas.length===0?<Empty icon="🏦" msg="Sin cuentas registradas"/>:cuentas.map(c=><div key={c.id} onClick={()=>setCuentaAct(c)} style={{...S.card,cursor:"pointer",border:`1px solid ${cuentaAct?.id===c.id?T.acc:T.bord}`,marginBottom:10,background:cuentaAct?.id===c.id?T.accDim:T.card}}><div style={{fontSize:13,fontWeight:700}}>{c.banco}</div><div style={{fontSize:11,color:T.sub}}>{c.numero_cuenta} · {c.moneda}</div><div style={{fontSize:18,fontWeight:800,color:T.acc,marginTop:8}}>Q {fmt(c.saldo_actual)}</div></div>)}
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>MIS CUENTAS</div>
        <div>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:18}}>
      </div>
        {[{l:"Saldo total GTQ",v:`Q ${fmt(saldoGTQ)}`,c:T.acc,bg:T.accDim},{l:"Ingresos",v:`Q ${fmt(ing)}`,c:T.acc,bg:T.accDim},{l:"Sin conciliar",v:movs.filter(m=>!m.conciliado).length,c:T.sec,bg:T.secDim}].map((s,i)=><div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}><div style={{fontSize:11,color:T.mut}}>{s.l}</div><div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
      {exportar&&<ModalExportar titulo="Movimientos Bancarios" datos={movs} campos={[{label:"Fecha",key:"fecha"},{label:"Descripción",key:"descripcion"},{label:"Categoría",key:"categoria"},{label:"Tipo",key:"tipo"},{label:"Monto",key:"monto"},{label:"Referencia",key:"referencia"},{label:"Conciliado",key:"conciliado"}]} onClose={()=>setExportar(false)}/>}
    <div>
  return(
  const saldoGTQ=cuentas.filter(c=>c.moneda==="GTQ").reduce((s,c)=>s+(parseFloat(c.saldo_actual)||0),0);
  const ing=movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
  const movsFil=movs.filter(m=>{if(filtroT!=="todos"&&m.tipo!==filtroT)return false;if(filtroC==="conciliado"&&!m.conciliado)return false;if(filtroC==="pendiente"&&m.conciliado)return false;return true;});
  const conciliar=async(id,val)=>{await dbUpd("movimientos_bancarios",id,{conciliado:val});loadMovs(cuentaAct.id);};
  const guardarMov=async()=>{if(!f.descripcion.trim()||!(parseFloat(f.monto)>0)){showToast("Descripción y monto requeridos","err");return;}setSaving(true);await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:cuentaAct.id,fecha:f.fecha,tipo:f.tipo,descripcion:f.descripcion,monto:parseFloat(f.monto),referencia:f.referencia,categoria:f.categoria,conciliado:f.conciliado,notas:f.notas});showToast("Guardado ✔");setSaving(false);setShowForm(false);setF({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});loadMovs(cuentaAct.id);};
  useEffect(()=>{if(cuentaAct)loadMovs(cuentaAct.id);},[cuentaAct?.id]);
  const loadMovs=async(cid)=>{if(!cid)return;const m=await dbGet("movimientos_bancarios",`&cuenta_id=eq.${cid}`);setMovs(Array.isArray(m)?m:[]);};
  const loadCuentas=async()=>{setLoading(true);const c=await dbGet("cuentas_bancarias");const arr=Array.isArray(c)?c:[];setCuentas(arr);if(arr.length>0){const first=arr[0];setCuentaAct(first);}setLoading(false);};
  useEffect(()=>{loadCuentas();},[]);
  const CC={ventas:T.acc,combustible:T.sec,mantenimiento:T.blue,salarios:T.green,seguros:T.purple,servicios:T.acc,oficina:T.mut,otros:T.sub};
  const CATS=["ventas","combustible","mantenimiento","salarios","seguros","servicios","oficina","otros"];
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({fecha:today(),tipo:"ingreso",descripcion:"",monto:"",referencia:"",categoria:"ventas",conciliado:false,notas:""});
  const [cuentas,setCuentas]=useState([]);const [movs,setMovs]=useState([]);const [cuentaAct,setCuentaAct]=useState(null);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [saving,setSaving]=useState(false);const [filtroT,setFiltroT]=useState("todos");const [filtroC,setFiltroC]=useState("todos");const [exportar,setExportar]=useState(false);
function PageBanca({showToast,empId}){
// ÔòÉÔòÉÔòÉ LA BANCA ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </tbody></table></div>
        <tbody>{filtered.map(r=>{const e=EST_FAC[r.estado]||EST_FAC.borrador;const saldo=parseFloat(r.saldo_pendiente)||0;const ant=parseFloat(r.anticipo_aplicado)||0;return <tr key={r.id}><td style={S.td}><div style={{fontFamily:"monospace",fontSize:11,color:T.acc,fontWeight:700}}>{r.numero}</div><div style={{fontSize:10,color:T.mut}}>{fmtD(r.fecha_emision)}</div>{r.numero_autorizacion&&<div style={{fontSize:9,color:T.acc}}>Ô£ô DTE</div>}{r.motivo_anulacion&&<div style={{fontSize:9,color:T.red}}>⚠️ {r.motivo_anulacion.slice(0,20)}</div>}</td><td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{r.nombre_receptor}</div><div style={{fontSize:10,color:T.mut}}>{r.nit_receptor}</div></td><td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.total)}</td><td style={{...S.td,color:ant>0?T.acc:T.mut,fontSize:12}}>{ant>0?"Q "+fmt(ant):"—"}</td><td style={{...S.td,fontWeight:700,color:saldo>0?T.sec:T.acc}}>{r.estado==="anulada"?"—":"Q "+fmt(saldo)}</td><td style={S.td}><Badge color={e.c} bg={e.bg} label={e.l} small/></td><td style={S.td}><div style={{display:"flex",flexDirection:"column",gap:4,minWidth:90}}>{r.estado==="emitida"&&<button onClick={()=>{setAuthFac(r);setAuthId("");}} style={{...S.btn("blue"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒöÉ DTE</button>}{["emitida","certificada","parcial"].includes(r.estado)&&<button onClick={()=>setMPago(r)} style={{...S.btn("primary"),padding:"3px 7px",fontSize:10,width:"100%"}}>💰 Pago</button>}{r.estado!=="anulada"&&<button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 7px",fontSize:10,width:"100%"}}>Ô£Å´©Å</button>}{!["anulada","pagada"].includes(r.estado)&&<button onClick={()=>setMAnular(r)} style={{...S.btn("danger"),padding:"3px 7px",fontSize:10,width:"100%"}}>­ƒÜ½</button>}</div></td></tr>;})}
        <div style={S.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Factura","Cliente","Total","Anticipo","Saldo","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="🧾" msg="Sin facturas"/>:(
      </div>
                <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>­ƒôñ Exportar</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        {["todas","borrador","emitida","certificada","parcial","pagada","anulada"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Emitidas",v:rows.filter(r=>r.estado==="emitida").length,c:T.blue},{l:"Facturado",v:`Q ${fmt(tFac).split(".")[0]}`,c:T.purple},{l:"Saldos pend.",v:`Q ${fmt(tSaldo).split(".")[0]}`,c:tSaldo>0?T.sec:T.acc}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:i>=2?13:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {authFac&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:460,padding:24}}><div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:10}}>­ƒöÉ Registrar No. DTE</div><input style={{...S.inp,fontFamily:"monospace",marginBottom:14}} value={authId} onChange={e=>setAuthId(e.target.value)} placeholder="UUID SAT..."/><div style={{display:"flex",gap:8}}><button onClick={regAuth} style={{...S.btn("primary"),flex:1}}>✅ Certificar</button><button onClick={()=>{setAuthFac(null);setAuthId("");}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button></div></div></div>}
      <ModalPago factura={mPago} onConfirm={(mo,fe,me)=>regPago(mPago,mo,fe,me)} onCancel={()=>setMPago(null)}/>
      <ModalAnular factura={mAnular} onConfirm={m=>anular(mAnular,m)} onCancel={()=>setMAnular(null)}/>
      {exportar&&<ModalExportar titulo="Facturas" datos={rows} campos={[{label:"N┬░",key:"numero"},{label:"Cliente",key:"nombre_receptor"},{label:"NIT",key:"nit_receptor"},{label:"Fecha",key:"fecha_emision"},{label:"Total",key:"total"},{label:"Saldo",key:"saldo_pendiente"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
    <div>
  return(
  if(vista==="form")return <div><FormFactura initial={editItem} empId={empId} clientes={clientes} reservas={reservas} cotizaciones={cotizaciones} anticipos={anticipos} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  const tSaldo=rows.filter(r=>!["anulada","pagada"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.saldo_pendiente)||0),0);
  const tFac=rows.filter(r=>!["anulada","borrador"].includes(r.estado)).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  const regAuth=async()=>{if(!authId.trim()){showToast("Ingresa el No. autorización","err");return;}await dbUpd("facturas",authFac.id,{numero_autorizacion:authId,estado:"certificada",fecha_certificacion:new Date().toISOString()});showToast("DTE certificado ✔");setAuthFac(null);setAuthId("");load();};
  const regPago=async(fac,monto,fecha,metodo)=>{const ns=Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);await dbUpd("facturas",fac.id,{saldo_pendiente:ns,estado:ns<=0?"pagada":"parcial",fecha_pago:fecha});await dbIns("movimientos_bancarios",{empresa_id:empId,fecha,tipo:"ingreso",descripcion:"Pago "+fac.numero+" — "+fac.nombre_receptor,monto,referencia:fac.numero,categoria:"ventas",conciliado:true});showToast(ns<=0?"Pagada ✔":"Pago parcial ✔");setMPago(null);load();};
  const anular=async(fac,mot)=>{await dbUpd("facturas",fac.id,{estado:"anulada",motivo_anulacion:mot});showToast("Anulada");setMAnular(null);load();};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));dbGet("reservas","").then(d=>setReservas(Array.isArray(d)?d:[]));dbGet("cotizaciones","&estado=eq.aprobada").then(d=>setCotizaciones(Array.isArray(d)?d:[]));dbGet("movimientos_bancarios","&tipo=eq.ingreso").then(d=>setAnticipos(Array.isArray(d)?d:[]));load();},[]);
  };
    const w=window.open("","_blank");w.document.write(html);w.document.close();
    <script>window.onload=()=>window.print();</script></body></html>`;
    <div style="text-align:center;margin-top:12px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
    <div class="footer"><strong>Datos del certificador:</strong> Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
    ${ivaPct===5?'<p style="font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
    <tfoot><tr><td colspan="4"/><td class="right"><strong>TOTAL:</strong></td><td class="right"><strong>Q ${total.toFixed(2)}</strong></td></tr></tfoot></table>
    <tbody>${lineas.map((l,i)=>`<tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">Q ${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">Q ${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-(parseFloat(l.descuento)||0)).toFixed(2)}</td></tr>`).join("")}</tbody>
    <table><thead><tr><th>#</th><th>B/S</th><th>Cant.</th><th>Descripción</th><th class="right">P. Unitario</th><th class="right">Total</th></tr></thead>
    <div style="font-size:10px">NIT Receptor: ${r.nit_receptor||"CF"} &nbsp;|&nbsp; Nombre: <strong>${r.nombre_receptor}</strong> &nbsp;|&nbsp; Fecha: ${r.fecha_emision||""} &nbsp;|&nbsp; Moneda: GTQ</div>
    <hr/>
    </div>
      <div class="autorizacion"><strong>N├ÜMERO DE AUTORIZACIÓN:</strong><br/>${r.numero_autorizacion||"—"}<br/>Serie: ${r.serie||"—"} Número DTE: ${r.numero_dte||"—"}</div>
      <div class="emisor"><strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong><br/>Nit Emisor: 20160860<br/><strong>TRANSPORTES TZUNUN</strong><br/>6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO</div>
    <div style="display:flex;justify-content:space-between">
    <div class="titulo">${ivaPct===5?"Factura Pequeño Contribuyente":"Factura"}</div>
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${r.numero}</title><style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}.titulo{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:8px}.emisor{color:#1B2D5C;font-size:10px;margin-bottom:4px}.right{text-align:right}.autorizacion{text-align:right;font-size:9px;color:#DC2626}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}th{background:#1B2D5C;color:#fff;padding:5px 6px}td{padding:5px 6px;border-bottom:1px solid #E2E8F0}.footer{margin-top:10px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}@media print{button{display:none}}</style></head><body>
    const total=parseFloat(r.total)||0;
    const ivaPct=parseFloat(r.tasa_iva)||5;
    const lineas=r.lineas?JSON.parse(r.lineas):[];
  const imprimirFac=r=>{
  const delFac=async id=>{if(!confirm("┬┐Eliminar esta factura permanentemente?"))return;await dbDel("facturas",id);showToast("Factura eliminada");load();};
  const load=async()=>{setLoading(true);const d=await dbGet("facturas");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [reservas,setReservas]=useState([]);const [cotizaciones,setCotizaciones]=useState([]);const [anticipos,setAnticipos]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [exportar,setExportar]=useState(false);const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [mAnular,setMAnular]=useState(null);const [mPago,setMPago]=useState(null);const [authFac,setAuthFac]=useState(null);const [authId,setAuthId]=useState("");
function PageFacturacion({showToast,empId}){
// ÔòÉÔòÉÔòÉ FACTURACIÓN PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"4px 9px",marginLeft:"auto"}}>­ƒùæ´©Å</button>
                  {r.estado==="enviada"&&<button onClick={()=>chEst(r.id,"aprobada")} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>✅</button>}
                  {!r.orden_venta&&<button onClick={()=>chEst(r.id,"orden_venta")} style={{...S.btn("purple"),fontSize:11,padding:"4px 9px"}}>📦</button>}
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£Å´©Å</button>
                  <button onClick={()=>{setEditItem({...r,__clon:true});setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>📋 Clonar</button>
                  <button onClick={()=>{const msg="Estimados, le comparto cotización "+r.numero+" de Tz'unun AutoRentas por Q "+fmt(total)+". Para aprobar o consultar: 502-31221538";window.open("https://wa.me/?text="+encodeURIComponent(msg));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px",background:"#25D366",color:"white"}}>­ƒÆ¼ WA</button>
                  <button onClick={()=>{window.open("mailto:?subject="+encodeURIComponent("Cotización "+r.numero)+"&body="+encodeURIComponent("Estimados, adjunto cotización "+r.numero+" por Q "+fmt(total)+". Para más información: Oscar Gálvez 502-31221538"));}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>Ô£ë´©Å</button>
                  <button onClick={()=>{const doc=makePDF();if(doc){const url=URL.createObjectURL(doc.output("blob"));const w=window.open(url);setTimeout(()=>w&&w.print(),1000);}}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 9px"}}>­ƒû¿´©Å</button>
                  <button onClick={()=>{const doc=makePDF();if(doc)doc.save(r.numero+".pdf");}} style={{...S.btn("primary"),fontSize:11,padding:"4px 9px"}}>Ô¼ç PDF</button>
                  <button onClick={()=>setPreview(r)} style={{...S.btn("blue"),fontSize:11,padding:"4px 9px"}}>­ƒæü Ver</button>
                <div style={{display:"flex",gap:5,paddingTop:10,borderTop:`1px solid ${T.bord}22`,flexWrap:"wrap"}}>
                </div>
                  <div style={{textAlign:"right"}}><Badge color={e.c} bg={e.bg} label={e.l} small/><div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(total)}</div></div>
                  <div><div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div><div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>{r.saludo&&<div style={{fontSize:11,color:T.sub,fontStyle:"italic"}}>"{r.saludo}"</div>}<div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {r.dias}d{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div key={r.id} style={S.card}>
            return(
            const makePDF=()=>generarPDF({numero:r.numero,fecha:r.fecha_emision||today(),fecha_vence:r.fecha_vence,cliente:r.cliente_nombre,nit:r.cliente_nit,dir_cliente:r.cliente_dir,saludo:r.saludo,servicio:r.descripcion_servicio,caract:r.caract||["Vehículo","Aire acond.","Cinturones","Seguro"],incluidos:r.incluidos||["Combustible","Conductor","Atención"],beneficios:r.beneficios||["Viaje seguro","Puntualidad","Flexibilidad"],con_piloto:r.con_piloto!==false,sub:parseFloat(r.subtotal)||0,iva_pct:parseFloat(r.tasa_iva)||5,iva_amt:parseFloat(r.total_iva)||0,total_ef:total,total_tc:total*1.05,exch:parseFloat(r.tasa_cambio)||7.70,es_orden:r.orden_venta});
            const total=parseFloat(r.total_gtq)||0;
            const e=r.orden_venta?EC.orden_venta:(EC[r.estado]||EC.borrador);
          {filtered.map(r=>{
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin cotizaciones"/>:(
      </div>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>↺</button>
        {["todas","borrador","enviada","aprobada","rechazada","orden_venta"].map(f=><button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>{f==="orden_venta"?"📦 Órdenes":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      </div>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Enviadas",v:rows.filter(r=>r.estado==="enviada").length,c:T.blue},{l:"Aprobadas",v:rows.filter(r=>r.estado==="aprobada").length,c:T.acc},{l:"Órdenes",v:rows.filter(r=>r.orden_venta).length,c:T.purple}].map((s,i)=><div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {preview&&<ModalVistaPrevia cot={preview} onClose={()=>setPreview(null)}/>}
    <div>
  return(
  if(vista==="form")return <div><FormCotizacion initial={editItem} empId={empId} clientes={clientes} onSave={()=>{showToast("Guardada ✔");setEditItem(null);setVista("lista");load();}} onCancel={()=>{setEditItem(null);setVista("lista");}}/></div>;
  const EC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},enviada:{c:T.blue,bg:T.blueDim,l:"Enviada"},aprobada:{c:T.acc,bg:T.accDim,l:"Aprobada"},rechazada:{c:T.red,bg:T.redDim,l:"Rechazada"},orden_venta:{c:T.purple,bg:T.purpleDim,l:"Orden de Venta"}};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro||(filtro==="orden_venta"&&r.orden_venta));
  const chEst=async(id,estado)=>{await dbUpd("cotizaciones",id,{estado,orden_venta:estado==="orden_venta"});showToast("→ "+estado);load();};
  const del=async id=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("cotizaciones",id);showToast("Eliminada");load();};
  useEffect(()=>{dbGet("clientes","").then(d=>setClientes(Array.isArray(d)?d:[]));load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("cotizaciones");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  const [rows,setRows]=useState([]);const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);const [vista,setVista]=useState("lista");const [editItem,setEditItem]=useState(null);const [filtro,setFiltro]=useState("todas");const [preview,setPreview]=useState(null);
function PageCotizaciones({showToast,empId}){
// ÔòÉÔòÉÔòÉ COTIZACIONES PAGE ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ CALCULADORA ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ RESERVAS PAGE ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Flota</div>{d.pie.length>0?<><ResponsiveContainer width="100%" height={120}><PieChart><Pie data={d.pie} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" paddingAngle={3}>{d.pie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>{d.pie.map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div><span style={{fontWeight:700,color:e.color}}>{e.value}</span></div>)}</>:<div style={{textAlign:"center",padding:30,color:T.sub,fontSize:12}}>Sin datos</div>}</div>
        <div style={S.card}><div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos vs Egresos</div>{d.chart.length>0?<ResponsiveContainer width="100%" height={180}><BarChart data={d.chart}><XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/><Tooltip contentStyle={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="Ingresos" fill={T.acc} radius={[4,4,0,0]}/><Bar dataKey="Egresos" fill={T.red} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>:<div style={{textAlign:"center",padding:40,color:T.sub,fontSize:13}}>Sin movimientos aún</div>}</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      </div>
        {[{icon:"💰",l:"Ingresos",v:fmtK(d.ing),c:T.acc,bg:T.accDim},{icon:"🛍️",l:"Egresos",v:fmtK(d.eg),c:T.red,bg:T.redDim},{icon:"🏦",l:"Saldo GTQ",v:fmtK(d.saldo),c:T.acc,bg:T.accDim},{icon:"🧾",l:"Facturado",v:fmtK(d.facTot),c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>FINANZAS</div>
      </div>
        {[{icon:"🚗",l:"Flota",v:d.v.length,c:T.acc,bg:T.accDim},{icon:"✅",l:"Disponibles",v:d.vDisp,c:T.acc,bg:T.accDim},{icon:"­ƒöæ",l:"Rentados",v:d.vRent,c:T.blue,bg:T.blueDim},{icon:"📅",l:"Res. activas",v:d.rAct,c:T.blue,bg:T.blueDim},{icon:"👥",l:"Clientes",v:d.clientes.length,c:T.purple,bg:T.purpleDim}].map((s,i)=><div key={i} style={{...S.card,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.c}}/><div style={{width:36,height:36,borderRadius:9,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div></div>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>OPERACIÓN</div>
      {d.alertas.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{d.alertas.map((a,i)=><div key={i} style={{background:T.card,border:`1px solid ${a.c}44`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:16}}>{a.icon}</span><span style={{fontSize:13}}>{a.msg}</span><div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:a.c}}/></div>)}</div>}
    <div>
  return(
  if(loading)return <Spinner/>;
  };
    setLoading(false);
    setD({v,r,c,clientes,alertas,chart,pie,ing,eg,saldo,facTot,vDisp:v.filter(x=>x.estado==="disponible").length,vRent:v.filter(x=>x.estado==="rentado").length,rAct:r.filter(x=>["en_curso","confirmada"].includes(x.estado)).length});
    const pie=[{name:"Disponible",value:v.filter(x=>x.estado==="disponible").length,color:T.acc},{name:"Rentado",value:v.filter(x=>x.estado==="rentado").length,color:T.blue},{name:"Mantenim.",value:vMant,color:T.sec}].filter(x=>x.value>0);
    const chart=meses.map((mes,i)=>({mes,Ingresos:Math.round(m.filter(x=>x.tipo==="ingreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0)),Egresos:Math.round(m.filter(x=>x.tipo==="egreso"&&new Date(x.fecha).getMonth()===i).reduce((s,x)=>s+(parseFloat(x.monto)||0),0))})).filter(x=>x.Ingresos>0||x.Egresos>0);
    const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    if(c.filter(x=>x.estado==="enviada").length>0)alertas.push({icon:"📋",msg:`${c.filter(x=>x.estado==="enviada").length} cotizaciones esperando aprobación`,c:T.blue});
    if(r.filter(x=>x.estado==="pendiente").length>0)alertas.push({icon:"📅",msg:`${r.filter(x=>x.estado==="pendiente").length} reservas pendientes`,c:T.sec});
    if(vMant>0)alertas.push({icon:"🔧",msg:`${vMant} vehículo${vMant>1?"s":""} en mantenimiento`,c:T.sec});
    const alertas=[];
    const vMant=v.filter(x=>x.estado==="mantenimiento").length;
    const facTot=f.filter(x=>!["anulada","borrador"].includes(x.estado)).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const saldo=cuentas.filter(x=>x.moneda==="GTQ").reduce((s,x)=>s+(parseFloat(x.saldo_actual)||0),0);
    const eg=m.filter(x=>x.tipo==="egreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const ing=m.filter(x=>x.tipo==="ingreso").reduce((s,x)=>s+(parseFloat(x.monto)||0),0);
    const v=Array.isArray(veh)?veh:[],r=Array.isArray(res)?res:[],c=Array.isArray(cots)?cots:[],f=Array.isArray(fac)?fac:[],m=Array.isArray(movs)?movs:[],cuentas=Array.isArray(cb)?cb:[],clientes=Array.isArray(cl)?cl:[];
    const [veh,res,cots,fac,movs,cb,cl]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("movimientos_bancarios",""),dbGet("cuentas_bancarias",""),dbGet("clientes","")]);
    setLoading(true);
  const load=async()=>{
  useEffect(()=>{load();},[]);
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
function PageDashboard(){

}
  );
    </div>
      )}
        </div>
          </table>
            </tfoot>
              </tr>
                <td/>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.acc,fontSize:14}}>Q {fmt(total)}</td>
                <td colSpan={4} style={{padding:"9px 10px",fontWeight:700,color:T.sub,fontSize:12}}>TOTAL</td>
              <tr style={{background:T.surf}}>
            <tfoot>
            </tbody>
              ))}
                </tr>
                  </td>
                    <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:11}}>­ƒùæ´©Å</button>
                  <td style={S.td}>
                  <td style={{...S.td,fontWeight:700,color:T.acc,whiteSpace:"nowrap"}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{r.referencia||"—"}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{r.metodo}</td>
                  <td style={{...S.td,fontWeight:500}}>{r.concepto}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(r.fecha)}</td>
                <tr key={r.id}>
              {rows.map(r=>(
            <tbody>
            </thead>
              ))}</tr>
                <th key={h} style={S.th}>{h}</th>
              <tr>{["Fecha","Concepto","Método","Referencia","Monto",""].map(h=>(
            <thead>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={S.card}>
        <Empty icon="💰" msg="Sin pagos registrados" action="+ Registrar pago" onAction={()=>setShowForm(true)}/>:(
      {loading?<Spinner/>:rows.length===0?
      {/* Lista */}

      )}
        </div>
          </div>
            </div>
              </button>
                Cancelar
              <button tabIndex={0} onClick={()=>{setShowForm(false);setF({...EMPTY_P});}} style={{...S.btn("ghost"),flex:1,padding:10}}>
              </button>
                {saving?"­ƒÆ¥ Registrando...":"­ƒÆ¥ Registrar pago"}
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:10,fontSize:13}}>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones"/>
            <Fld label="NOTAS">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REF-00001"/>
            <Fld label="REFERENCIA / N┬░ COMPROBANTE">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.concepto} onChange={e=>sf("concepto",e.target.value)} placeholder="Ej: Anticipo reserva Cobán, Pago factura FAC-001..."/>
            <Fld label="CONCEPTO" span2>
            </Fld>
              </select>
                ))}
                  </option>
                    {re.numero} — {re.cliente_nombre} — Saldo: Q {fmt(re.saldo||re.monto)}
                  <option key={re.id} value={re.id}>
                {reservas.map(re=>(
                <option value="">Sin reserva vinculada</option>
              <select tabIndex={0} style={S.sel} value={f.reserva_id} onChange={e=>sf("reserva_id",e.target.value)}>
            <Fld label="VINCULAR A RESERVA (opcional)">
            </Fld>
              </select>
                ))}
                  </option>
                    {fa.numero} — {fa.nombre_receptor} — Saldo: Q {fmt(fa.saldo_pendiente||fa.total)}
                  <option key={fa.id} value={fa.id}>
                {facturas.map(fa=>(
                <option value="">Sin factura vinculada</option>
              <select tabIndex={0} style={S.sel} value={f.factura_id} onChange={e=>sf("factura_id",e.target.value)}>
            <Fld label="VINCULAR A FACTURA (opcional)">
            </Fld>
              </select>
                <option value="cheque">­ƒôä Cheque</option>
                <option value="tarjeta">­ƒÆ│ Tarjeta de crédito/débito</option>
                <option value="efectivo">­ƒÆÁ Efectivo</option>
                <option value="deposito">💰 Depósito en banco</option>
                <option value="transferencia">🏦 Transferencia bancaria</option>
              <select tabIndex={0} style={S.sel} value={f.metodo} onChange={e=>sf("metodo",e.target.value)}>
            <Fld label="M├ëTODO DE PAGO">
            </Fld>
              {cuentas.length===0&&<div style={{fontSize:11,color:T.red,marginTop:3}}>⚠️ No hay cuentas bancarias. Ve a La Banca para crearlas.</div>}
              </select>
                ))}
                  </option>
                    {cu.banco} — {cu.numero_cuenta} · Q {fmt(cu.saldo_actual||0)}
                  <option key={cu.id} value={cu.id}>
                {cuentas.map(cu=>(
                <option value="">Seleccionar cuenta bancaria...</option>
              <select tabIndex={0} style={cuentas.length===0?{...S.sel,borderColor:T.red}:S.sel} value={f.cuenta_id} onChange={e=>sf("cuenta_id",e.target.value)}>
            <Fld label="CUENTA BANCARIA (donde se recibe) *">
            </Fld>
              <input tabIndex={0} style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/>
            <Fld label="MONTO RECIBIDO (GTQ)">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/>
            <Fld label="FECHA">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Registrar pago recibido</div>
        <div style={{...S.card,marginBottom:16}}>
      {showForm&&(
      {/* Formulario */}

      </div>
        </button>
          {showForm?"Cancelar":"+ Registrar pago"}
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺ Actualizar</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px"}}>
        ].map((s,i)=>(
          {l:"Registros",v:rows.length,c:T.purple,bg:T.purpleDim}
          {l:"Este mes",v:"Q "+fmt(esteMes),c:T.blue,bg:T.blueDim},
        {[{l:"Total recibido",v:"Q "+fmt(total),c:T.acc,bg:T.accDim},
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
      {/* KPIs */}

      {exportar&&<ModalExportar titulo="Pagos Recibidos" datos={rows} campos={CAMPOS} onClose={()=>setExportar(false)}/>}
    <div>
  return(

  ];
    {label:"Referencia",key:"referencia"},{label:"Notas",key:"notas"},
    {label:"Monto",key:"monto"},{label:"Método",key:"metodo"},
    {label:"Fecha",key:"fecha"},{label:"Concepto",key:"concepto"},
  const CAMPOS=[

    .reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const esteMes=rows.filter(r=>(r.fecha||"").slice(0,7)===today().slice(0,7))
  const total=rows.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

  };
    load();
    showToast("Pago eliminado");
    await dbDel("pagos_recibidos",id);
    if(!confirm("┬┐Eliminar este pago? Esta acción no se puede deshacer."))return;
  const del=async id=>{

  };
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
      load();
      setF({fecha:today(),monto:"",metodo:"transferencia",referencia:"",factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""});
      setSaving(false);setShowForm(false);
      showToast("Pago registrado correctamente ✔");
      if(cu)await dbUpd("cuentas_bancarias",f.cuenta_id,{saldo_actual:(parseFloat(cu.saldo_actual)||0)+monto});
      const cu=cuentas.find(x=>x.id===f.cuenta_id);
      // 5. Actualizar saldo de cuenta bancaria
      await dbIns("movimientos_bancarios",{empresa_id:empId,cuenta_id:f.cuenta_id,fecha:f.fecha,tipo:"ingreso",descripcion:concepto,monto,referencia:f.referencia||"",categoria:"ventas",conciliado:false,notas:f.notas||""});
      // 4. Registrar en movimientos bancarios
      }
        if(re){const saldo=Math.max(0,(parseFloat(re.saldo)||0)-monto);const anticipo=(parseFloat(re.anticipo)||0)+monto;await dbUpd("reservas",f.reserva_id,{saldo,anticipo});}
        const re=reservas.find(x=>x.id===f.reserva_id);
      if(f.reserva_id){
      // 3. Actualizar saldo de reserva
      }
        if(fa){const saldo=Math.max(0,(parseFloat(fa.saldo_pendiente)||parseFloat(fa.total)||0)-monto);await dbUpd("facturas",f.factura_id,{saldo_pendiente:saldo,estado:saldo<=0?"pagada":"parcial"});}
        const fa=facturas.find(x=>x.id===f.factura_id);
      if(f.factura_id){
      // 2. Actualizar saldo de factura
      if(pago&&pago.error){showToast("Error: "+pago.error,"err");setSaving(false);return;}
      const pago=await dbIns("pagos_recibidos",{empresa_id:empId,fecha:f.fecha,monto,metodo:f.metodo,referencia:f.referencia||"",concepto,cuenta_id:f.cuenta_id,notas:f.notas||"",factura_id:f.factura_id||null,reserva_id:f.reserva_id||null});
      // 1. Guardar pago
      }
        concepto=fa?"Pago factura "+(fa.numero||"")+" — "+fa.nombre_receptor:re?"Pago reserva "+(re.numero||"")+" — "+re.cliente_nombre:"Pago recibido";
        const re=reservas.find(x=>x.id===f.reserva_id);
        const fa=facturas.find(x=>x.id===f.factura_id);
      if(!concepto){
      let concepto=f.concepto.trim();
      const monto=parseFloat(f.monto);
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.concepto.trim()&&!f.factura_id&&!f.reserva_id){showToast("Ingresa concepto o vincula a factura/reserva","err");return;}
    if(!f.cuenta_id){showToast("Selecciona la cuenta bancaria","err");return;}
    if(!f.monto||parseFloat(f.monto)<=0){showToast("Ingresa el monto recibido","err");return;}
  const guardar=async()=>{

  useEffect(()=>{load();},[]);
  };
    setLoading(false);
    setCuentas(Array.isArray(cu)?cu:[]);
    setReservas(Array.isArray(re)?re.filter(x=>!["cancelada"].includes(x.estado)):[]);
    setFacturas(Array.isArray(fa)?fa.filter(x=>!["anulada","borrador"].includes(x.estado)):[]);
    setRows(Array.isArray(p)?p:[]);
    ]);
      dbGet("cuentas_bancarias",""),
      dbGet("reservas",""),
      dbGet("facturas",""),
      dbGet("pagos_recibidos",""),
    const [p,fa,re,cu]=await Promise.all([
    setLoading(true);
  const load=async()=>{

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({...EMPTY_P});
    factura_id:"",reserva_id:"",concepto:"",cuenta_id:"",notas:""};
  const EMPTY_P={fecha:today(),monto:"",metodo:"transferencia",referencia:"",
  const [exportar,setExportar]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [cuentas,setCuentas]=useState([]);
  const [reservas,setReservas]=useState([]);
  const [facturas,setFacturas]=useState([]);
  const [rows,setRows]=useState([]);
function PagePagos({showToast,empId}){
// ÔòÉÔòÉÔòÉ PAGOS RECIBIDOS ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ


}
  );
    </div>
      </div>
        </div>
          <button onClick={onClose} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
          <button onClick={exportar} style={{...S.btn("primary"),flex:2,padding:12,fontSize:14}}>­ƒôñ Exportar</button>
        <div style={{display:"flex",gap:10}}>

        </div>
          Se exportarán <b style={{color:T.acc}}>{filtrar().length}</b> registros con {campos.length} campos.
        <div style={{fontSize:11,color:T.mut,marginBottom:16,padding:"8px 12px",background:T.surf,borderRadius:6}}>

        </div>
          </div>
            ))}
              </label>
                <span style={{fontSize:13}}>{l}</span>
                <input type="radio" name="formato" value={v} checked={formato===v} onChange={()=>setFormato(v)} style={{width:16,height:16,accentColor:T.acc}}/>
              <label key={v} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:8,background:formato===v?T.accDim:T.surf,border:"1px solid "+(formato===v?T.acc:T.bord)}}>
            {[["csv","­ƒôä CSV (valor separado por coma)"],["xls","📊 XLS (compatible con Microsoft Excel)"],["pdf","­ƒû¿´©Å PDF (para imprimir)"]].map(([v,l])=>(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <label style={S.lbl}>FORMATO DE EXPORTACIÓN</label>
        <div style={{marginBottom:20}}>

        </div>
          {(fechaIni||fechaFin)&&<div style={{fontSize:11,color:T.acc,marginTop:4}}>{filtrar().length} registros en el período</div>}
          </div>
            <div><label style={{...S.lbl,fontSize:10}}>HASTA</label><input style={S.inp} type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)}/></div>
            <div><label style={{...S.lbl,fontSize:10}}>DESDE</label><input style={S.inp} type="date" value={fechaIni} onChange={e=>setFechaIni(e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <label style={S.lbl}>PER├ìODO</label>
        <div style={{marginBottom:14}}>

        </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:18}}>Ô£ò</button>
          <div style={{fontSize:16,fontWeight:800}}>­ƒôñ Exportar — {titulo}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{background:T.card,borderRadius:16,border:"1px solid "+T.bord,width:"100%",maxWidth:480,padding:28}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return(

  };
    onClose();
    URL.revokeObjectURL(url);
    a.href=url;a.download=titulo.replace(/\s+/g,"_")+ext;a.click();
    const a=document.createElement("a");
    const url=URL.createObjectURL(blob);
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const csv=bom+[headers.join(sep),...body.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(sep))].join("\n");
    const ext=formato==="csv"?".csv":".xls";
    const sep=formato==="csv"?",":"	";
    const bom="´╗┐";

    }
      onClose();return;
      const w=window.open("","_blank");w.document.write(html);w.document.close();
      </table><script>window.onload=()=>window.print();</script></body></html>`;
      <tbody>${body.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <p>Generado: ${new Date().toLocaleDateString("es-GT",{day:"2-digit",month:"long",year:"numeric"})} · ${rows.length} registros</p>
      <h2>Tz'unun AutoRentas — ${titulo}</h2>
      @media print{button{display:none}}</style></head><body>
      tr:nth-child(even){background:#F8FAFC}
      td{padding:5px 8px;border-bottom:1px solid #E2E8F0}
      th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left}
      h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:11px}
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
      <title>${titulo}</title>
      const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    if(formato==="pdf"){

    }));
      return String(v??"-");
      const v=c.key.split(".").reduce((o,k)=>o?.[k],r);
    const body=rows.map(r=>campos.map(c=>{
    const headers=campos.map(c=>c.label);
    const rows=filtrar();
  const exportar=()=>{

  };
    });
      return true;
      if(fechaFin&&f>fechaFin) return false;
      if(fechaIni&&f<fechaIni) return false;
      const f=r.fecha||r.created_at||r.fecha_inicio||"";
    return datos.filter(r=>{
    if(!fechaIni&&!fechaFin) return datos;
  const filtrar=()=>{

  const [fechaFin,setFechaFin]=useState("");
  const [fechaIni,setFechaIni]=useState("");
  const [formato,setFormato]=useState("csv");
  const [modulo,setModulo]=useState("todo");
function ModalExportar({titulo,datos,campos,onClose}){
// ÔòÉÔòÉÔòÉ EXPORTAR UNIVERSAL ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ DASHBOARD ÔòÉÔòÉÔòÉ



// ÔòÉÔòÉÔòÉ CLIENTES Y FLOTA ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        <Resumen/>
        </div>
          </div>
            </div>
              <button tabIndex={0} onClick={onCancel} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:12,fontSize:14}}>{saving?"­ƒÆ¥ Guardando...":"­ƒÆ¥ Guardar reserva"}</button>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:6}}>
            </Fld>
              <textarea tabIndex={0} style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
            <Fld label="NOTAS" span2>
            </Fld>
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/>
            <Fld label="ANTICIPO (Q)">
            </Fld>
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/>
            <Fld label="TASA CAMBIO ($1 USD)">
            </Fld>
              </div>
                ))}
                  <button tabIndex={0} key={v} onClick={()=>sf("pago",v)} style={{...S.btn(f.pago===v?"primary":"ghost"),flex:1,fontSize:11}}>{l}</button>
                {[["efectivo","­ƒÆÁ Efectivo"],["transferencia","🏦 Transferencia"],["tarjeta","­ƒÆ│ Tarjeta (+5%)"]].map(([v,l])=>(
              <div style={{display:"flex",gap:8}}>
            <Fld label="M├ëTODO DE PAGO" span2>
            </Fld>
              </select>
                {munis.map(m=><option key={m} value={m}>{m}</option>)}
                <option value="">Seleccionar...</option>
              <select tabIndex={0} style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}>
            <Fld label="MUNICIPIO">
            </Fld>
              </select>
                {Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}
                <option value="">Seleccionar...</option>
              <select tabIndex={0} style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}>
            <Fld label="DEPARTAMENTO">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Destino"/>
            <Fld label="DESTINO">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Ciudad de Guatemala"/>
            <Fld label="ORIGEN">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/>
            <Fld label="FECHA DEVOLUCIÓN">
            </Fld>
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/>
            <Fld label="FECHA ENTREGA">
            </Fld>
              </select>
                <option value={0}>Sin IVA</option>
                <option value={5}>5% Pequeño Contrib.</option>
                <option value={12}>12% Régimen General</option>
              <select tabIndex={0} style={S.sel} value={f.iva} onChange={e=>sf("iva",parseInt(e.target.value))}>
            <Fld label="IVA">
            </Fld>
              <input tabIndex={0} style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del piloto"/>
            <Fld label="CONDUCTOR">
            </Fld>
              </select>
                {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q {fmt(v.dia)}/día</option>)}
                <option value="">Seleccionar vehículo...</option>
              <select tabIndex={0} style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
            <Fld label="VEH├ìCULO" span2>
            </Fld>
              <input tabIndex={0} style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/>
            <Fld label="HORA DE RECOGIDA">
            </Fld>
              </select>
                <option value="cancelada">Ô£ù Cancelada</option>
                <option value="completada">­ƒÅü Completada</option>
                <option value="en_curso">ÔûÂ En curso</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="pendiente">⏳ Pendiente</option>
              <select tabIndex={0} style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
            <Fld label="ESTADO">
            </Fld>
              </div>
                <button tabIndex={0} onClick={()=>sf("tipo","traslado")} style={{...S.btn(f.tipo==="traslado"?"primary":"ghost"),flex:1}}>­ƒù║ Traslado</button>
                <button tabIndex={0} onClick={()=>sf("tipo","renta")} style={{...S.btn(f.tipo==="renta"?"primary":"ghost"),flex:1}}>­ƒöæ Renta de vehículo</button>
              <div style={{display:"flex",gap:8}}>
            <Fld label="TIPO DE SERVICIO" span2>
            </Fld>
              <ClienteBuscador value={f.cliente_nombre} onChange={v=>sf("cliente_nombre",v)} empId={empId}/>
            <Fld label="CLIENTE" span2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar reserva":"Nueva reserva"}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
    <div>
  return(

  );
    </div>
      ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Selecciona vehículo y fechas</div>}
        </>
          </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,padding:"4px 0",color:saldo>0?T.sec:T.acc}}><span>Saldo</span><span>Q {fmt(saldo)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"4px 0"}}><span>Anticipo</span><span>Q {fmt(anticipo)}</span></div>
          <div style={{background:T.surf,borderRadius:9,padding:11}}>
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(exch>0?totalFinal/exch:0)} USD</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(totalFinal)}</span></div>
          <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
          </div>
            ))}
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:T.sub}}><span>{l}</span><span>{v}</span></div>
            {[["Tarifa","Q "+fmt(tarifaDia)+"/día"],["Subtotal","Q "+fmt(subtotal)],["IVA "+f.iva+"%","Q "+fmt(ivaAmt)],...(f.pago==="tarjeta"?[["Recargo TC 5%","Q "+fmt(recargoTC)]]:[])] .map(([l,v],i)=>(
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {dias} día{dias!==1?"s":""}</div>
        <>
      {vehObj&&dias>0?(
      <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
    <div style={S.card}>
  const Resumen=()=>(

  };
    }catch(e){alert("Error: "+e.message);setSaving(false);}
      onSave();
      setSaving(false);
      if(result&&result.error){alert("Error al guardar: "+result.error);setSaving(false);return;}
      else result=await dbIns("reservas",payload);
      if(initial?.id) result=await dbUpd("reservas",initial.id,payload);
      let result;
      };
        notas:f.notas||"",
        estado:f.estado||"pendiente",
        tasa_cambio:parseFloat(f.exch)||7.70,
        metodo_pago:f.pago||"efectivo",
        tasa_iva:parseFloat(f.iva)||0,
        saldo:saldo,
        anticipo:ant,
        monto:total,
        municipio:f.municipio||"",
        departamento:f.departamento||"",
        destino:f.destino||"",
        origen:f.origen||"Guatemala",
        hora_recogida:f.hora_recogida||"08:00",
        fecha_fin:f.fecha_fin?f.fecha_fin+"T23:59:00":null,
        fecha_inicio:f.fecha_inicio+(f.hora_recogida?"T"+f.hora_recogida+":00":"T08:00:00"),
        conductor_nombre:f.conductor_nombre||"",
        vehiculo_nombre:f.vehiculo_nombre||"",
        numero:initial?.id?"RES-"+initial.numero?.slice(-6)||numId():"RES-"+numId(),
        tipo:f.tipo,
        cliente_nombre:f.cliente_nombre.trim(),
        empresa_id:empId,
      const payload={
      const saldo=Math.max(0,total-ant);
      const ant=parseFloat(f.anticipo)||0;
      const total=Math.round((base+recTC)*100)/100;
      const recTC=f.pago==="tarjeta"?base*0.05:0;
      const base=sub+ivaAmt;
      const ivaAmt=sub*(parseFloat(f.iva)||0)/100;
      const sub=dias*tarifa;
      const tarifa=veh?tarifaVeh(veh,dias):0;
      const veh=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre);
      const dias=calcularDias();
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.fecha_inicio){alert("La fecha de inicio es requerida");return;}
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
  const guardar=async()=>{

  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];
  const saldo=Math.max(0,totalFinal-anticipo);
  const anticipo=parseFloat(f.anticipo)||0;
  const exch=parseFloat(f.exch)||7.70;
  const totalFinal=totalEfectivo+recargoTC;
  const recargoTC=f.pago==="tarjeta"?totalEfectivo*0.05:0;
  const totalEfectivo=subtotal+ivaAmt;
  const ivaAmt=subtotal*(parseFloat(f.iva)||0)/100;
  const subtotal=dias*tarifaDia;
  const tarifaDia=calcularTarifa(vehObj,dias);
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const dias=calcularDias();

  };
    return veh.dia;
    if(dias>=8) return veh.sem;
    if(dias>=30) return veh.mes;
    if(!veh||dias<=0) return 0;
  const calcularTarifa=(veh,dias)=>{

  };
    return Math.max(1,diff);
    const diff=Math.ceil((ff-fi)/(1000*60*60*24));
    const ff=new Date(f.fecha_fin+"T12:00:00");
    if(!f.fecha_fin) return 1;
    const fi=new Date(f.fecha_inicio+"T12:00:00");
    if(!f.fecha_inicio) return 0;
  const calcularDias=()=>{
  // Calcular días

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [saving,setSaving]=useState(false);

  });
    };
      estado:initial.estado||"pendiente",
      exch:initial.tasa_cambio||7.70,
      pago:initial.metodo_pago||"efectivo",
      iva:initial.tasa_iva||5,
      notas:initial.notas||"",
      anticipo:initial.anticipo||"",
      municipio:initial.municipio||"",
      departamento:initial.departamento||"",
      destino:initial.destino||"",
      origen:initial.origen||"Guatemala",
      hora_recogida:initial.hora_recogida||"08:00",
      fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):"",
      fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",
      conductor_nombre:initial.conductor_nombre||"",
      vehiculo_nombre:initial.vehiculo_nombre||"",
      tipo:initial.tipo||"renta",
      cliente_nombre:initial.cliente_nombre||"",
    return{
    if(!initial) return {...EMPTY_R};
  const [f,setF]=useState(()=>{

    exch:7.70,estado:"pendiente"};
    departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
    fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"Guatemala",destino:"",
  const EMPTY_R={cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
function FormReserva({initial,onSave,onCancel,empId}){


};
  exch:7.70,con_tc:false
  departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
  fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"",destino:"",
  cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
const EMPTY={
// ÔöÇÔöÇ Estado inicial para FormReserva ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


// ÔòÉÔòÉÔòÉ RESERVAS ÔòÉÔòÉÔòÉ

}
  );
    </div>
      )}
        </div>
          })}
            );
              </div>
                </div>
                  <button onClick={()=>del(p.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>
                  <button onClick={()=>abrirEditar(p)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>Ô£Å´©Å Editar</button>
                <div style={{display:"flex",gap:6}}>
                )}
                  </div>
                    </div>
                      <div style={{height:"100%",borderRadius:4,background:pct>80?T.red:pct>50?T.sec:T.acc,width:`${pct}%`,transition:"width .3s"}}/>
                    <div style={{background:T.surf,borderRadius:4,height:6,overflow:"hidden"}}>
                    </div>
                      <span style={{color:pct>80?T.red:T.sub,fontWeight:600}}>Q {fmt(creditoUsado)} / Q {fmt(creditoLimite)}</span>
                      <span>Crédito usado</span>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                  <div style={{marginBottom:12}}>
                {creditoLimite>0&&(
                </div>
                  ))}
                    </div>
                      <div style={{fontSize:12,fontWeight:500,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
                      <div style={{fontSize:10,color:T.mut}}>{lbl}</div>
                    <div key={lbl} style={{background:T.surf,borderRadius:7,padding:"7px 10px"}}>
                  {[["Contacto",p.contacto||"—"],["Teléfono",p.telefono||"—"],["Email",p.email||"—"],["Dirección",p.direccion||"—"]].map(([lbl,val])=>(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                </div>
                  <CatBadge cat={p.categoria}/>
                  </div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>NIT: {p.nit||"—"}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{p.nombre}</div>
                  <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4,marginBottom:12}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:CAT_COLOR[p.categoria]||T.mut}}/>
              <div key={p.id} style={{...S.card,position:"relative",overflow:"hidden"}}>
            return (
            const pct=creditoLimite>0?Math.min(100,Math.round((creditoUsado/creditoLimite)*100)):0;
            const creditoLimite=parseFloat(p.credito_limite)||0;
            const creditoUsado=parseFloat(p.credito_usado)||0;
          {rows.map(p=>{
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒÅ¬" msg="Sin proveedores registrados" action="+ Agregar proveedor" onAction={()=>setShowForm(true)}/>:(
      {/* Tarjetas proveedores */}

      )}
        </div>
          </div>
            </div>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar proveedor"}</button>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Dirección del proveedor"/></Fld>
            <Fld label="L├ìMITE DE CR├ëDITO (GTQ)"><input style={S.inp} type="number" value={f.credito_limite} onChange={e=>sf("credito_limite",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="EMAIL"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="proveedor@email.com"/></Fld>
            <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
            <Fld label="CONTACTO"><input style={S.inp} value={f.contacto} onChange={e=>sf("contacto",e.target.value)} placeholder="Nombre de la persona de contacto"/></Fld>
            </Fld>
              </select>
                {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
            <Fld label="CATEGOR├ìA">
            <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
            <Fld label="NOMBRE / RAZÓN SOCIAL" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre del proveedor"/></Fld>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar proveedor":"Nuevo proveedor"}</div>
        <div style={{...S.card,marginBottom:16,maxWidth:640}}>
      {showForm&&(
      {/* Formulario */}

      </div>
        <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo proveedor"}</button>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
            <div style={{fontSize:i>0?16:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
        {[{l:"Proveedores activos",v:rows.filter(r=>r.activo).length,c:T.acc},{l:"Crédito total usado",v:`Q ${fmt(totalCredito)}`,c:T.red},{l:"Categorías",v:[...new Set(rows.map(r=>r.categoria))].length,c:T.blue}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
      {/* Stats */}
    <div>
  return (

  const totalCredito=rows.reduce((s,r)=>s+(parseFloat(r.credito_usado)||0),0);

  const del=async id=>{if(!confirm("┬┐Eliminar este proveedor?"))return;await dbDel("proveedores",id);showToast("Eliminado");load();};

  };
    load();
    setF({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
    setShowForm(false);setEditItem(null);
    showToast("Proveedor guardado ✔");setSaving(false);
    else await dbIns("proveedores",payload);
    if(editItem?.id) await dbUpd("proveedores",editItem.id,payload);
    const payload={empresa_id:empId,nombre:f.nombre,nit:f.nit,categoria:f.categoria,contacto:f.contacto,telefono:f.telefono,email:f.email,direccion:f.direccion,credito_limite:parseFloat(f.credito_limite)||0,notas:f.notas,activo:true};
    setSaving(true);
    if(!f.nombre.trim()){showToast("El nombre del proveedor es requerido","err");return;}
  const guardar=async()=>{

  };
    setShowForm(true);
    setF({nombre:item.nombre||"",nit:item.nit||"",categoria:item.categoria||"combustible",contacto:item.contacto||"",telefono:item.telefono||"",email:item.email||"",direccion:item.direccion||"",credito_limite:item.credito_limite||"",notas:item.notas||""});
    setEditItem(item);
  const abrirEditar=item=>{

  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("proveedores");setRows(Array.isArray(d)?d:[]);setLoading(false);};

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function ModProveedores({empId,showToast}){

}
  );
    </div>
      </div>
        </div>
          </div>
            ))}
              </div>
                </div>
                  <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalG>0?Math.round((total/totalG)*100):0}%`}}/>
                <div style={{background:T.surf,borderRadius:4,height:4,overflow:"hidden"}}>
                </div>
                  <span style={{fontSize:11,fontWeight:600}}>Q {fmt(total)}</span>
                  </div>
                    <span style={{fontSize:11,color:T.sub}}>{cat}</span>
                    <div style={{width:7,height:7,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div key={cat} style={{marginBottom:10}}>
            {porCat.map(({cat,total})=>(
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:12}}>POR CATEGOR├ìA</div>
          <div style={S.card}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Sidebar categorías */}

        </div>
          )}
            </div>
              </table>
                </tfoot>
                  </tr>
                    <td colSpan={2}/>
                    <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(filtered.reduce((s,r)=>s+(parseFloat(r.total)||0),0))}</td>
                    <td colSpan={4} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL FILTRADO</td>
                  <tr style={{background:T.surf}}>
                <tfoot>
                </tbody>
                  })}
                    );
                      </tr>
                        </td>
                          </div>
                            <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>­ƒùæ´©Å</button>
                            <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>Ô£Å´©Å</button>
                            {r.estado==="pendiente"&&<button onClick={()=>marcarPagado(r.id)} style={{...S.btn("primary"),padding:"3px 8px",fontSize:10}}>Pagar</button>}
                          <div style={{display:"flex",gap:4}}>
                        <td style={S.td}>
                        </td>
                          </span>
                            {r.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}
                          <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="pagado"?T.accDim:T.secDim,color:r.estado==="pagado"?T.acc:T.sec}}>
                        <td style={S.td}>
                        <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(r.total)}</td>
                        <td style={{...S.td,fontSize:11,color:T.sub}}>{prov?.nombre||"—"}</td>
                        <td style={S.td}><CatBadge cat={r.categoria}/></td>
                        </td>
                          {r.referencia&&<div style={{fontSize:10,color:T.mut,fontFamily:"monospace"}}>{r.referencia}</div>}
                          <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{r.descripcion}</div>
                        <td style={{...S.td,fontWeight:500,maxWidth:200}}>
                        <td style={{...S.td,whiteSpace:"nowrap",color:T.sub,fontSize:11}}>{fmtD(r.fecha)}</td>
                      <tr key={r.id}>
                    return (
                    const prov=proveedores.find(p=>p.id===r.proveedor_id);
                  {filtered.map(r=>{
                <tbody>
                <thead><tr>{["Fecha","Descripción","Categoría","Proveedor","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
            <div style={S.card}>
          {loading?<Spinner/>:filtered.length===0?<Empty icon="🛍️" msg="Sin gastos registrados" action="+ Registrar primer gasto" onAction={()=>setShowForm(true)}/>:(
          {/* Tabla gastos */}

          )}
            </div>
              </div>
                </div>
                  <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                  <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar gasto"}</button>
                <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
                <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/></Fld>
                </Fld>
                  </select>
                    <option value="pagado">✅ Pagado</option>
                    <option value="pendiente">⏳ Pendiente de pago</option>
                  <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                <Fld label="ESTADO">
                </Fld>
                  <input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="REC-0045, FAC-001..."/>
                <Fld label="REFERENCIA / N┬░ FACTURA">
                </Fld>
                  <input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/>
                <Fld label="TOTAL (GTQ)">
                </Fld>
                  <input style={S.inp} type="number" step="0.01" value={f.iva} onChange={e=>{sf("iva",e.target.value);calcTotal(f.monto,e.target.value);}} placeholder="0.00"/>
                <Fld label="IVA (GTQ)">
                </Fld>
                  <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e=>{sf("monto",e.target.value);calcTotal(e.target.value,f.iva);}} placeholder="0.00"/>
                <Fld label="MONTO SIN IVA (GTQ)">
                </Fld>
                  </select>
                    <option value="credito">📋 Crédito</option>
                    <option value="cheque">­ƒôä Cheque</option>
                    <option value="tarjeta">­ƒÆ│ Tarjeta</option>
                    <option value="deposito">💰 Depósito</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="efectivo">­ƒÆÁ Efectivo</option>
                  <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                <Fld label="M├ëTODO DE PAGO">
                </Fld>
                  </select>
                    {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                    <option value="">Sin proveedor</option>
                  <select style={S.sel} value={f.proveedor_id} onChange={e=>sf("proveedor_id",e.target.value)}>
                <Fld label="PROVEEDOR">
                <Fld label="DESCRIPCIÓN" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Diésel — Toyota RAV4 viaje a Petén"/></Fld>
                </Fld>
                  </select>
                    {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                <Fld label="CATEGOR├ìA">
                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar gasto":"Registrar gasto / compra"}</div>
            <div style={{...S.card,marginBottom:16}}>
          {showForm&&(
          {/* Formulario */}

          </div>
            <button onClick={()=>{setEditItem(null);setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nuevo gasto"}</button>
            <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
            </select>
              {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              <option value="todas">Todas las categorías</option>
            <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}>
            ))}
              </button>
                {f==="todos"?"Todos":f==="pendiente"?"⏳ Pendientes":"✅ Pagados"}
              <button key={f} onClick={()=>setFiltroEst(f)} style={{...S.btn(filtroEst===f?"primary":"ghost"),fontSize:11,padding:"5px 12px"}}>
            {["todos","pendiente","pagado"].map(f=>(
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {/* Filtros */}
        <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:16}}>

      </div>
        ))}
          </div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
          <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}>
        {[{l:"Total gastos",v:`Q ${fmt(totalG)}`,c:T.red,bg:T.redDim},{l:"Pagados",v:`Q ${fmt(totalPagado)}`,c:T.acc,bg:T.accDim},{l:"Pendientes",v:`Q ${fmt(totalPend)}`,c:T.sec,bg:T.secDim}].map((s,i)=>(
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
      {/* Stats */}
    <div>
  return (

  const porCat=CAT_GASTO.map(cat=>({cat,total:rows.filter(r=>r.categoria===cat).reduce((s,r)=>s+(parseFloat(r.total)||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const totalPagado=rows.filter(r=>r.estado==="pagado").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalPend=rows.filter(r=>r.estado==="pendiente").reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const totalG=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);

  });
    return true;
    if(filtroCat!=="todas"&&r.categoria!==filtroCat) return false;
    if(filtroEst!=="todos"&&r.estado!==filtroEst) return false;
  const filtered=rows.filter(r=>{

  const del=async id=>{if(!confirm("┬┐Eliminar este gasto?"))return;await dbDel("gastos",id);showToast("Eliminado");load();};
  const marcarPagado=async id=>{await dbUpd("gastos",id,{estado:"pagado",fecha_pago:today()});showToast("Marcado como pagado ✔");load();};

  };
    load();
    setF({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
    setShowForm(false);setEditItem(null);
    showToast("Gasto guardado ✔");setSaving(false);
    else await dbIns("gastos",payload);
    if(editItem?.id) await dbUpd("gastos",editItem.id,payload);
    const payload={empresa_id:empId,fecha:f.fecha,categoria:f.categoria,descripcion:f.descripcion,monto:parseFloat(f.monto)||0,iva:parseFloat(f.iva)||0,total:parseFloat(f.total)||0,metodo_pago:f.metodo_pago,referencia:f.referencia,estado:f.estado,proveedor_id:f.proveedor_id||null,notas:f.notas,fecha_pago:f.estado==="pagado"?f.fecha:null};
    setSaving(true);
    if(!f.descripcion.trim()||!(parseFloat(f.total)>0)){showToast("Descripción y total son requeridos","err");return;}
  const guardar=async()=>{

  };
    setShowForm(true);
    setF({fecha:item.fecha||today(),categoria:item.categoria||"combustible",descripcion:item.descripcion||"",monto:item.monto||"",iva:item.iva||"",total:item.total||"",metodo_pago:item.metodo_pago||"efectivo",referencia:item.referencia||"",estado:item.estado||"pendiente",proveedor_id:item.proveedor_id||"",vehiculo_ref:item.vehiculo_ref||"",notas:item.notas||""});
    setEditItem(item);
  const abrirEditar=item=>{

  };
    sf("total",t>0?t.toFixed(2):"");
    const t=(parseFloat(m)||0)+(parseFloat(i)||0);
  const calcTotal=(m,i)=>{

  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const d=await dbGet("gastos");setRows(Array.isArray(d)?d:[]);setLoading(false);};

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [f,setF]=useState({fecha:today(),categoria:"combustible",descripcion:"",monto:"",iva:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",proveedor_id:"",vehiculo_ref:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [filtroCat,setFiltroCat]=useState("todas");
  const [filtroEst,setFiltroEst]=useState("todos");
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);
function ModGastos({empId,proveedores,showToast}){

}
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[cat]||T.mut)+"22",color:CAT_COLOR[cat]||T.mut}}>{cat}</span>;
function CatBadge({cat}){

// ÔòÉÔòÉÔòÉ GASTOS ÔòÉÔòÉÔòÉ

}
  );
    </div>
      </div>
        </table>
          </tbody>
            })}
              );
                </tr>
                  <td style={{...S.td,fontWeight:700,color:c.ingresos>0?T.acc:T.mut}}>Q {fmt(c.ingresos)}</td>
                  <td style={{...S.td,fontWeight:600,color:T.purple,textAlign:"center"}}>{c.cotizaciones}</td>
                  <td style={{...S.td,fontWeight:600,color:T.blue,textAlign:"center"}}>{c.reservas}</td>
                  <td style={{...S.td,color:T.sub}}>{c.telefono||"—"}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"—"}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:tc.bg,color:tc.c}}>{c.tipo}</span></td>
                  <td style={{...S.td,fontWeight:600}}>{i===0&&"­ƒÑç "}{c.nombre}</td>
                <tr key={c.id} style={{background:i===0?T.accDim:"transparent"}}>
              return (
              const tc=TC[c.tipo]||TC.empresa;
            {clientesData.map((c,i)=>{
          <tbody>
          <thead><tr>{["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos generados"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Clientes por ingresos generados</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        <KpiCard icon="👤" label="Personas" value={clientes.filter(c=>c.tipo==="persona").length} color={T.purple} bg={T.purpleDim}/>
        <KpiCard icon="­ƒÅø´©Å" label="Gobierno/ONG" value={clientes.filter(c=>c.tipo==="gobierno").length} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="­ƒÅó" label="Empresas" value={clientes.filter(c=>c.tipo==="empresa").length} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="👥" label="Total clientes" value={clientes.length} color={T.acc} bg={T.accDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
    <div>
  return (

  const TC={empresa:{c:T.sec,bg:T.secDim},gobierno:{c:T.blue,bg:T.blueDim},persona:{c:T.acc,bg:T.accDim}};

  const imprimir=()=>imprimirTabla("Reporte de Clientes",["Cliente","Tipo","NIT","Teléfono","Reservas","Cotizaciones","Ingresos"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Clientes_TzununSA",["Cliente","Tipo","NIT","Teléfono","Email","Reservas","Cotizaciones","Ingresos generados"],tablaRows);
  const tablaRows=clientesData.map(c=>[c.nombre,c.tipo,c.nit||"—",c.telefono||"—",c.email||"—",c.reservas,c.cotizaciones,`Q ${fmt(c.ingresos)}`]);

  }).sort((a,b)=>b.ingresos-a.ingresos);
    return {...c,reservas:resC.length,cotizaciones:cotC.length,ingresos};
    const ingresos=resC.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const cotC=cotizaciones.filter(co=>co.cliente_nombre===c.nombre&&co.estado!=="rechazada");
    const resC=reservas.filter(r=>r.cliente_nombre===c.nombre&&r.estado!=="cancelada");
  const clientesData=clientes.map(c=>{

  const {clientes,reservas,cotizaciones} = data;
function ReporteClientes({data}){

}
  );
    </div>
      </div>
        </div>
          </table>
            </tfoot>
              </tr>
                <td colSpan={3}/>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(totalGastos)}</td>
                <td colSpan={5} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL</td>
              <tr style={{background:T.surf}}>
            <tfoot>
            </tbody>
              ))}
                </tr>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:g.estado==="pagado"?T.accDim:T.secDim,color:g.estado==="pagado"?T.acc:T.sec}}>{g.estado==="pagado"?"✔ Pagado":"⏳ Pendiente"}</span></td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:10,color:T.mut}}>{g.referencia||"—"}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{g.metodo_pago}</td>
                  <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(g.total)}</td>
                  <td style={S.td}>Q {fmt(g.iva)}</td>
                  <td style={S.td}>Q {fmt(g.monto)}</td>
                  <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{g.descripcion}</div></td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[g.categoria]||T.mut)+"22",color:CAT_COLOR[g.categoria]||T.mut}}>{g.categoria}</span></td>
                  <td style={{...S.td,whiteSpace:"nowrap",color:T.sub}}>{fmtD(g.fecha)}</td>
                <tr key={g.id}>
              {gastos.map(g=>(
            <tbody>
            <thead><tr>{["Fecha","Categoría","Descripción","Monto","IVA","Total","Método","Ref.","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
        <div style={{overflowX:"auto"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Gastos</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        </div>
          ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos</div>}
            </ResponsiveContainer>
              </LineChart>
                <Line type="monotone" dataKey="Gastos" stroke={T.red} strokeWidth={2} dot={{fill:T.red,r:4}}/>
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <LineChart data={chartMensual}>
            <ResponsiveContainer width="100%" height={200}>
          {chartMensual.length>0?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos mensuales</div>
        <div style={S.card}>

        </div>
          ))}
            </div>
              </div>
                <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalGastos>0?Math.round((total/totalGastos)*100):0}%`}}/>
              <div style={{background:T.surf,borderRadius:4,height:5,overflow:"hidden"}}>
              </div>
                <span style={{fontSize:12,fontWeight:600}}>Q {fmt(total)}</span>
                </div>
                  <span style={{fontSize:12,color:T.sub}}>{cat} ({count})</span>
                  <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <div key={cat} style={{marginBottom:10}}>
          {porCat.map(({cat,total,count})=>(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos por categoría</div>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

      </div>
        <KpiCard icon="⏳" label="Pendientes de pago" value={`Q ${fmt(totalPend).split(".")[0]}`} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="✅" label="Pagados" value={`Q ${fmt(totalGastos-totalPend).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="🛍️" label="Total gastos" value={`Q ${fmt(totalGastos).split(".")[0]}`} color={T.red} bg={T.redDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
    <div>
  return (

  const imprimir=()=>imprimirTabla("Reporte de Gastos",["Fecha","Categoría","Descripción","Monto","IVA","Total","Estado"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Gastos_TzununSA",["Fecha","Categoría","Descripción","Monto","IVA","Total","Método pago","Referencia","Estado"],tablaRows);
  const tablaRows=gastos.map(g=>[fmtD(g.fecha),g.categoria,g.descripcion,`Q ${fmt(g.monto)}`,`Q ${fmt(g.iva)}`,`Q ${fmt(g.total)}`,g.metodo_pago,g.referencia||"—",g.estado]);

  })).filter(x=>x.Gastos>0);
    Gastos:Math.round(gastos.filter(g=>new Date(g.fecha).getMonth()===i).reduce((s,g)=>s+(parseFloat(g.total)||0),0)),
    mes,
  const chartMensual=meses.map((mes,i)=>({
  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const pieData=porCat.map(c=>({name:c.cat,value:Math.round(c.total),color:CAT_COLOR[c.cat]||T.mut}));
  const totalPend=gastos.filter(g=>g.estado==="pendiente").reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const totalGastos=gastos.reduce((s,g)=>s+(parseFloat(g.total)||0),0);

  })).sort((a,b)=>b.total-a.total);
    pagados:gastos.filter(g=>g.categoria===cat&&g.estado==="pagado").reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    count:gastos.filter(g=>g.categoria===cat).length,
    total:gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    cat,
  const porCat=[...new Set(gastos.map(g=>g.categoria))].map(cat=>({

  const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:"#22C55E",impuestos:T.red,servicios:T.acc,otros:T.sub};
  const {gastos} = data;
function ReporteGastos({data}){

}
  );
    </div>
      </div>
        </table>
          </tbody>
            ))}
              </tr>
                <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:v.estado==="disponible"?T.accDim:v.estado==="rentado"?T.blueDim:T.secDim,color:v.estado==="disponible"?T.acc:v.estado==="rentado"?T.blue:T.sec}}>{v.estado}</span></td>
                <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(v.ingresos)}</td>
                <td style={{...S.td,color:T.blue,fontWeight:600}}>{v.viajes}</td>
                <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                <td style={{...S.td,color:T.sub}}>{v.anio}</td>
                <td style={S.td}>{v.tipo}</td>
                <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                <td style={{...S.td,fontFamily:"monospace",color:T.acc,fontWeight:700}}>{v.placa}</td>
              <tr key={v.id}>
            {flotaData.map(v=>(
          <tbody>
          <thead><tr>{["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Flota</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        </div>
          ):<div style={{textAlign:"center",padding:24,color:T.sub}}>Sin datos</div>}
            </>
              ))}
                </div>
                  <span style={{fontWeight:700,color:e.color}}>{e.value} veh.</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div>
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
              {pieData.map((e,i)=>(
              </ResponsiveContainer>
                </PieChart>
                  <Tooltip/>
                  </Pie>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={3}>
                <PieChart>
              <ResponsiveContainer width="100%" height={130}>
            <>
          {pieData.length>0?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Estado actual de flota</div>
        <div style={S.card}>
        </div>
          ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Sin datos de ingresos por vehículo</div>}
            </ResponsiveContainer>
              </BarChart>
                <Bar dataKey="Ingresos" fill={T.acc} radius={[0,4,4,0]}/>
                <Tooltip content={<CustomTooltip/>}/>
                <YAxis type="category" dataKey="nombre" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} width={120}/>
                <XAxis type="number" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <BarChart data={chartFlota} layout="vertical">
            <ResponsiveContainer width="100%" height={180}>
          {chartFlota.some(x=>x.Ingresos>0)?(
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos por vehículo</div>
        <div style={S.card}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
    <div>
  return (

  const imprimir=()=>imprimirTabla("Reporte de Flota",["Placa","Vehículo","Tipo","Año","Km","Viajes","Ingresos","Estado"],tablaRows);
  const exportar=()=>exportCSV("Reporte_Flota_TzununSA",["Placa","Vehículo","Tipo","Año","Km actual","Viajes","Ingresos generados","Estado"],tablaRows);
  const tablaRows=flotaData.map(v=>[v.placa,`${v.marca} ${v.modelo}`,v.tipo,v.anio,(v.km_actual||0).toLocaleString()+" km",v.viajes,`Q ${fmt(v.ingresos)}`,v.estado]);

  ].filter(x=>x.value>0);
    {name:"Mantenimiento",value:vehiculos.filter(v=>v.estado==="mantenimiento").length,color:T.sec},
    {name:"Rentado",value:vehiculos.filter(v=>v.estado==="rentado").length,color:T.blue},
    {name:"Disponible",value:vehiculos.filter(v=>v.estado==="disponible").length,color:T.acc},
  const pieData=[
  const chartFlota=flotaData.map(v=>({nombre:`${v.marca} ${v.modelo}`,Ingresos:Math.round(v.ingresos),Viajes:v.viajes}));

  });
    return {...v,ingresos,viajes};
    const viajes=resV.length;
    const ingresos=resV.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const resV=reservas.filter(r=>r.vehiculo_nombre===`${v.marca} ${v.modelo}`||r.vehiculo_nombre?.includes(v.modelo));
  const flotaData=vehiculos.map(v=>{

  const {vehiculos,reservas} = data;
function ReporteFlota({data}){

}
  );
    </div>
      </div>
        </div>
          </table>
            </tbody>
              ))}
                </tr>
                  <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="completada"?T.accDim:T.secDim,color:r.estado==="completada"?T.acc:T.sec}}>{r.estado}</span></td>
                  <td style={{...S.td,color:parseFloat(r.saldo)>0?T.sec:T.acc}}>Q {fmt(r.saldo)}</td>
                  <td style={{...S.td,color:T.acc}}>Q {fmt(r.anticipo)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,color:T.sub,whiteSpace:"nowrap"}}>{fmtD(r.fecha_inicio)}</td>
                  <td style={{...S.td,color:T.sub}}>{r.vehiculo_nombre||"—"}</td>
                  <td style={S.td}>{r.tipo==="renta"?"­ƒöæ Renta":"­ƒù║ Traslado"}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.cliente_nombre}</td>
                  <td style={{...S.td,fontFamily:"monospace",color:T.acc}}>{r.numero}</td>
                <tr key={r.id}>
              {reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>(
            <tbody>
            <thead><tr>{["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
        <div style={{overflowX:"auto"}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Reservas</div>
      <div style={S.card}>

      </div>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
      <div style={{display:"flex",gap:8,marginBottom:12}}>

      </div>
        ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos suficientes</div>}
          </ResponsiveContainer>
            </BarChart>
              <Bar dataKey="Cotizaciones" fill={T.blue} radius={[4,4,0,0]}/>
              <Bar dataKey="Reservas" fill={T.acc} radius={[4,4,0,0]}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Tooltip content={<CustomTooltip/>}/>
              <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
            <BarChart data={chartMensual}>
          <ResponsiveContainer width="100%" height={200}>
        {chartMensual.length>0?(
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ventas mensuales — Reservas vs Cotizaciones</div>
      <div style={{...S.card,marginBottom:16}}>

      </div>
        <KpiCard icon="🧾" label="Total facturado" value={`Q ${fmt(totalFac).split(".")[0]}`} color={T.purple} bg={T.purpleDim}/>
        <KpiCard icon="📋" label="Cotizaciones enviadas" value={`Q ${fmt(totalCot).split(".")[0]}`} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="📅" label="Total reservas (activas)" value={`Q ${fmt(totalRes).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
    <div>
  return (

  );
    tablaRows
    ["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha","Monto","Anticipo","Saldo","Estado"],
  const imprimir=()=>imprimirTabla("Reporte de Ventas",
  );
    tablaRows
    ["N┬░ Reserva","Cliente","Tipo","Vehículo","Fecha inicio","Monto","Anticipo","Saldo","Estado"],
  const exportar=()=>exportCSV("Reporte_Ventas_TzununSA",

  ]);
    `Q ${fmt(r.anticipo)}`,`Q ${fmt(r.saldo)}`,r.estado
    r.vehiculo_nombre||"—",fmtD(r.fecha_inicio),`Q ${fmt(r.monto)}`,
    r.numero||"—",r.cliente_nombre,r.tipo==="renta"?"Renta":"Traslado",
  const tablaRows=reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>[

  const totalFac=facturas.filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);
  const totalCot=cotizaciones.filter(c=>c.estado!=="rechazada").reduce((s,c)=>s+(parseFloat(c.total_gtq)||0),0);
  const totalRes=reservas.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

  })).filter(x=>x.Reservas>0||x.Cotizaciones>0);
    Cotizaciones: Math.round(cotizaciones.filter(co=>new Date(co.created_at).getMonth()===i&&co.estado!=="rechazada").reduce((s,co)=>s+(parseFloat(co.total_gtq)||0),0)),
    Reservas: Math.round(reservas.filter(r=>new Date(r.fecha_inicio||r.created_at).getMonth()===i&&r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0)),
    mes,
  const chartMensual=meses.map((mes,i)=>({
  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const {reservas,cotizaciones,facturas} = data;
function ReporteVentas({data}){

}
  </div>;
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: Q {fmt(p.value)}</div>)}
    <div style={{color:T.sub,marginBottom:4}}>{label}</div>
  return <div style={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"10px 14px",fontSize:11}}>
  if(!active||!payload?.length)return null;
function CustomTooltip({active,payload,label}){

}
  );
    </div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>{sub}</div>}
      <div style={{fontSize:11,color:T.mut,marginTop:2}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color}}>{value}</div>
      <div style={{width:38,height:38,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{icon}</div>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
    <div style={{...S.card,position:"relative",overflow:"hidden"}}>
  return (
function KpiCard({icon,label,value,sub,color,bg}){

}
  w.document.write(html);w.document.close();
  const w=window.open("","_blank");
  </body></html>`;
  <script>window.onload=()=>window.print();</script>
  </table>
  <tbody>${rows.map(r=>"<tr>"+r.map(v=>"<td>"+(v||"—")+"</td>").join("")+"</tr>").join("")}</tbody>
  <table><thead><tr>${headers.map(h=>"<th>"+h+"</th>").join("")}</tr></thead>
  <p>Generado: ${new Date().toLocaleDateString("es-GT",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</p>
  <h2>Tz'unun AutoRentas — ${titulo}</h2>
  </style></head><body>
    @media print{button{display:none}}
    .total{font-weight:bold;background:#E1F5EE!important}
    tr:nth-child(even){background:#F8FAFC}
    td{padding:7px 10px;border-bottom:1px solid #E2E8F0}
    th{background:#1B2D5C;color:#fff;padding:8px 10px;text-align:left}
    table{width:100%;border-collapse:collapse;font-size:12px}
    p{color:#64748B;font-size:12px;margin-bottom:16px}
    h2{color:#1B2D5C;margin-bottom:4px}
    body{font-family:Arial,sans-serif;padding:20px;color:#1E293B}
  <style>
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${titulo}</title>
function imprimirTabla(titulo, headers, rows){

}
  URL.revokeObjectURL(url);
  a.href=url;a.download=filename+".csv";a.click();
  const a=document.createElement("a");
  const url=URL.createObjectURL(blob);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const csv=bom+[headers.join(","),...rows.map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const bom="\uFEFF";
function exportCSV(filename, headers, rows){

// ÔòÉÔòÉÔòÉ REPORTES ÔòÉÔòÉÔòÉ


}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={onCancel} style={{...S.btn("ghost"),width:"100%",padding:10,marginTop:6,fontSize:12}}>Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),width:"100%",padding:10,fontSize:13}}>{saving?"Guardando...":"­ƒÆ¥ "+( initial?.id?"Actualizar":"Crear factura")}</button>
            <button onClick={generarPDFFactura} style={{...S.btn("blue"),width:"100%",marginBottom:8,padding:10,fontSize:13}}>­ƒû¿´©Å Vista previa / Imprimir factura</button>
          <div style={S.card}>
          {/* Acciones */}

          </div>
            {ivaPct===5&&<div style={{marginTop:8,fontSize:11,color:T.mut,fontStyle:"italic"}}>* No genera derecho a crédito fiscal</div>}
            </div>
              </div>
                <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(f.tasa_cambio>0?total/f.tasa_cambio:0)} USD</div>
                {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,fontWeight:600}}><span>Saldo pendiente</span><span>Q {fmt(saldoPend)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(total)}</span></div>
              <div style={{borderTop:"1px solid "+T.bord,marginTop:6,paddingTop:6}}>
              {parseFloat(f.anticipo_aplicado)>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sec}}><span>Anticipo aplicado</span><span>ÔÇô Q {fmt(f.anticipo_aplicado)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>IVA ({ivaPct}%)</span><span>Q {fmt(ivaAmt)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:T.sub}}><span>Subtotal (sin IVA)</span><span>Q {fmt(subtotalSinIVA)}</span></div>
            <div style={{background:T.surf,borderRadius:9,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RESUMEN</div>
          <div style={S.card}>
          {/* Resumen totales */}

          </div>
            </div>
              ))}
                </div>
                  </div>
                    Subtotal: Q {(((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0))-(parseFloat(l.descuento)||0)).toFixed(2)}
                  <div style={{textAlign:"right",marginTop:4,fontSize:11,color:T.acc,fontWeight:600}}>
                  </div>
                    </div>
                      {lineas.length>1&&<button onClick={()=>removeLinea(idx)} style={{...S.btn("danger"),padding:"5px 8px",fontSize:11}}>Ô£ò</button>}
                    <div style={{display:"flex",alignItems:"flex-end"}}>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right"}} type="number" step="0.01" value={l.descuento} onChange={e=>updateLinea(idx,"descuento",e.target.value)} placeholder="0.00"/>
                      <label style={{...S.lbl,fontSize:9}}>DESCUENTO (Q)</label>
                    <div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px",textAlign:"right",color:T.acc}} type="number" step="0.01" value={l.precio_unitario} onChange={e=>updateLinea(idx,"precio_unitario",e.target.value)} placeholder="0.00"/>
                      <label style={{...S.lbl,fontSize:9}}>P. UNITARIO (Q)</label>
                    <div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 6px",textAlign:"center"}} type="number" value={l.cantidad} onChange={e=>updateLinea(idx,"cantidad",e.target.value)} min="1"/>
                      <label style={{...S.lbl,fontSize:9}}>CANT.</label>
                    <div>
                  <div style={{display:"grid",gridTemplateColumns:"60px 1fr 1fr auto",gap:6,alignItems:"flex-end"}}>
                  </div>
                    </div>
                      <input style={{...S.inp,fontSize:12,padding:"5px 8px"}} value={l.descripcion} onChange={e=>updateLinea(idx,"descripcion",e.target.value)} placeholder="Descripción del servicio o producto"/>
                      <label style={{...S.lbl,fontSize:9}}>DESCRIPCIÓN</label>
                    <div>
                    </div>
                      </select>
                        <option value="Servicio">Servicio</option>
                        <option value="Bien">Bien</option>
                      <select style={{...S.sel,padding:"5px 6px",fontSize:11}} value={l.tipo} onChange={e=>updateLinea(idx,"tipo",e.target.value)}>
                      <label style={{...S.lbl,fontSize:9}}>TIPO</label>
                    <div>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:6}}>
                <div key={idx} style={{background:T.surf,borderRadius:8,padding:10,border:"1px solid "+T.bord}}>
              {lineas.map((l,idx)=>(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
            </div>
              <button onClick={addLinea} style={{...S.btn("primary"),fontSize:11,padding:"4px 10px"}}>+ Agregar línea</button>
              <div style={{fontSize:12,fontWeight:700,color:T.mut}}>DETALLE DE SERVICIOS / PRODUCTOS</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={S.card}>
          {/* Líneas de detalle */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Columna derecha - Líneas y resumen */}

        </div>
          </div>
            </div>
              </Fld>
                </select>
                  <option value="pagada">­ƒÆÜ Pagada</option>
                  <option value="certificada">✅ Certificada (DTE)</option>
                  <option value="emitida">­ƒôñ Emitida</option>
                  <option value="borrador">­ƒôØ Borrador</option>
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
              <Fld label="ESTADO">
            <div style={{marginTop:10}}>
            </Fld>
              <textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales..."/>
            <Fld label="NOTAS / OBSERVACIONES">
          <div style={S.card}>
          {/* Notas */}

          </div>
            </div>
              </Fld>
                <input style={S.inp} type="number" step="0.01" value={f.anticipo_aplicado} onChange={e=>sf("anticipo_aplicado",parseFloat(e.target.value)||0)} placeholder="0.00"/>
              <Fld label="ANTICIPO RECIBIDO (Q)">
              </Fld>
                </select>
                  {cotizaciones.map(c=><option key={c.id} value={c.id}>{c.numero} — {c.cliente_nombre} — Q {fmt(c.total_gtq)}</option>)}
                  <option value="">Sin vinculación a cotización</option>
                <select style={S.sel} value={f.cotizacion_id} onChange={e=>onSelectCotizacion(e.target.value)}>
              <Fld label="COTIZACIÓN (opcional)">
              </Fld>
                </select>
                  {reservas.map(r=><option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre} — Q {fmt(r.monto)}</option>)}
                  <option value="">Sin vinculación a reserva</option>
                <select style={S.sel} value={f.reserva_id} onChange={e=>onSelectReserva(e.target.value)}>
              <Fld label="RESERVA (opcional)">
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>VINCULAR A RESERVA O COTIZACIÓN</div>
          <div style={S.card}>
          {/* Vincular */}

          </div>
            </div>
              </Fld>
                </select>
                  <option value="tarjeta">­ƒÆ│ Tarjeta</option>
                  <option value="deposito">💰 Depósito</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="efectivo">­ƒÆÁ Efectivo</option>
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
              <Fld label="M├ëTODO PAGO">
              <Fld label="CORREO"><input style={S.inp} type="email" value={f.correo_receptor} onChange={e=>sf("correo_receptor",e.target.value)} placeholder="email@cliente.com"/></Fld>
              <Fld label="DIRECCIÓN" span2><input style={S.inp} value={f.direccion_receptor} onChange={e=>sf("direccion_receptor",e.target.value)} placeholder="Ciudad"/></Fld>
              <Fld label="NOMBRE RECEPTOR"><input style={S.inp} value={f.nombre_receptor} onChange={e=>sf("nombre_receptor",e.target.value)} placeholder="Nombre o razón social"/></Fld>
              <Fld label="NIT RECEPTOR"><input style={S.inp} value={f.nit_receptor} onChange={e=>sf("nit_receptor",e.target.value)} placeholder="CF o NIT"/></Fld>
              </Fld>
                </select>
                  {clientes.map(c=><option key={c.id} value={c.id}>{c.codigo?c.codigo+" — ":""}{c.nombre}</option>)}
                  <option value="">Seleccionar cliente (auto-llena datos)...</option>
                <select style={S.sel} value={f.cliente_id} onChange={e=>onSelectCliente(e.target.value)}>
              <Fld label="VINCULAR A CLIENTE" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>RECEPTOR</div>
          <div style={S.card}>
          {/* Receptor */}

          </div>
            </div>
              <Fld label="FECHA CERTIFICACIÓN"><input style={S.inp} type="date" value={f.fecha_certificacion} onChange={e=>sf("fecha_certificacion",e.target.value)}/></Fld>
              <Fld label="FECHA EMISIÓN"><input style={S.inp} type="date" value={f.fecha_emision} onChange={e=>sf("fecha_emision",e.target.value)}/></Fld>
              <Fld label="TASA DE CAMBIO ($)"><input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e=>sf("tasa_cambio",e.target.value)}/></Fld>
              </Fld>
                </select>
                  <option value="NINGUNO">Sin impuestos</option>
                  <option value="PEQUENIO">5% — Pequeño Contribuyente</option>
                  <option value="GENERAL">12% IVA — Régimen General</option>
                <select style={S.sel} value={f.regimen} onChange={e=>sf("regimen",e.target.value)}>
              <Fld label="R├ëGIMEN FISCAL">
              <Fld label="N┬░ ACCESO"><input style={S.inp} value={f.numero_acceso} onChange={e=>sf("numero_acceso",e.target.value)} placeholder="Número de acceso"/></Fld>
              <Fld label="N┬░ DTE"><input style={S.inp} value={f.numero_dte} onChange={e=>sf("numero_dte",e.target.value)} placeholder="3370337239"/></Fld>
              <Fld label="SERIE"><input style={S.inp} value={f.serie} onChange={e=>sf("serie",e.target.value)} placeholder="TZAR2026"/></Fld>
              </Fld>
                <input style={{...S.inp,fontFamily:"monospace",fontSize:11}} value={f.numero_autorizacion} onChange={e=>sf("numero_autorizacion",e.target.value)} placeholder="F047F606-C8E3-43D7-8B21-A77A28299F83"/>
              <Fld label="N┬░ AUTORIZACIÓN SAT" span2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:10}}>DATOS SAT / DTE</div>
          <div style={S.card}>
          {/* Datos SAT */}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Columna izquierda */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),fontSize:12}}>ÔåÉ Volver</button>
          {initial?.id&&<button onClick={generarPDFFactura} style={{...S.btn("blue"),fontSize:12}}>­ƒû¿´©Å Vista previa / Imprimir</button>}
        <div style={{display:"flex",gap:8}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar factura":"Nueva factura"}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
    <div>
  return(
  // ÔöÇÔöÇ JSX ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    const w=window.open("","_blank");w.document.write(html);w.document.close();
</body></html>`;
<script>window.onload=()=>window.print();</script>
<div style="text-align:center;margin-top:16px;font-style:italic;color:#1B2D5C;font-size:11px"><em>Contribuyendo</em> juntos por Guatemala</div>
</div>
  ${f.notas?`<div style="margin-top:6px"><strong>Notas:</strong> ${f.notas}</div>`:""}
  </div>
    </div>
      <div>Superintendencia de Administración Tributaria &nbsp; NIT: 16693949</div>
      <div style="font-weight:700;margin-bottom:3px">Datos del certificador</div>
    <div class="certificador">
  <div class="footer-grid">
<div class="footer">
${ivaPct===5?'<p style="margin-top:6px;font-size:9px;color:#64748B">* No genera derecho a crédito fiscal</p>':""}
</div>
  </table>
    <tr class="total-row"><td>TOTAL</td><td class="right">Q ${total.toFixed(2)}</td></tr>
    <tr><td>IVA (${ivaPct}%)</td><td class="right">Q ${ivaAmt.toFixed(2)}</td></tr>
    <tr><td>Subtotal</td><td class="right">Q ${subtotalSinIVA.toFixed(2)}</td></tr>
  <table class="totals-table">
<div class="totals-section">
</table>
  <tfoot><tr><td colspan="5"/><td class="right"><strong>TOTALES:</strong></td><td class="right">0.00</td><td class="right"><strong>${total.toFixed(2)}</strong></td></tr></tfoot>
  </tbody>
${lineas.filter(l=>l.descripcion).map((l,i)=>`    <tr><td>${i+1}</td><td>${l.tipo||"Servicio"}</td><td class="right">${l.cantidad}</td><td>${l.descripcion}</td><td class="right">${parseFloat(l.precio_unitario||0).toFixed(2)}</td><td class="right">${parseFloat(l.descuento||0).toFixed(2)}</td><td class="right">0.00</td><td class="right">${((parseFloat(l.cantidad)||0)*(parseFloat(l.precio_unitario)||0)-parseFloat(l.descuento||0)).toFixed(2)}</td></tr>`).join("\n")}
  <tbody>
  <thead><tr><th>#No</th><th>B/S</th><th>Cantidad</th><th>Descripción</th><th class="right">P. Unitario con IVA (Q)</th><th class="right">Descuentos (Q)</th><th class="right">Otros Desc.(Q)</th><th class="right">Total (Q)</th></tr></thead>
<table>
<div class="divider"/>
</div>
  <div><span class="label">Moneda:</span> GTQ</div>
  <div><span class="label">Dirección comprador:</span> ${f.direccion_receptor||"CIUDAD"}</div>
  <div><span class="label">Fecha y hora de certificación:</span> ${f.fecha_certificacion||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">Nombre Receptor:</span> <strong>${f.nombre_receptor||"—"}</strong></div>
  <div><span class="label">Fecha y hora de emisión:</span> ${f.fecha_emision||"—"} ${new Date().toLocaleTimeString("es-GT")}</div>
  <div><span class="label">NIT Receptor:</span> ${f.nit_receptor||"CF"}</div>
<div class="receptor-row">
<div class="divider"/>
</div>
  </div>
    Numero Acceso: ${f.numero_acceso||"—"}
    Serie: ${f.serie||"—"} &nbsp; Número de DTE: ${f.numero_dte||"—"}<br/>
    ${f.numero_autorizacion||"—"}<br/>
    <span class="num">N├ÜMERO DE AUTORIZACIÓN:</span><br/>
  <div class="autorizacion">
  </div>
    6 AVENIDA 5-23 COLONIA LA CASTELLANA, zona 1, EL TEJAR, CHIMALTENANGO
    <strong>TRANSPORTES TZUNUN</strong>
    Nit Emisor: 20160860<br/>
    <strong>VANESSA MAR├ìA, G├üLVEZ HERN├üNDEZ</strong>
  <div class="emisor">
<div class="header-top">
<div class="titulo-factura">${f.regimen==="GENERAL"?"Factura":f.regimen==="PEQUENIO"?"Factura Pequeño Contribuyente":"Documento"}</div>
</style></head><body>
@media print{button{display:none}}
.titulo-factura{text-align:center;font-size:16px;font-weight:700;color:#1B2D5C;margin-bottom:6px}
.certificador{background:#F8FAFC;padding:6px;border:1px solid #E2E8F0}
.footer-grid{display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px}
.footer{margin-top:12px;font-size:9px;color:#64748B;border-top:1px solid #E2E8F0;padding-top:6px}
.total-row td{font-weight:700;font-size:12px;border-top:1px solid #1B2D5C}
.totals-table td{padding:3px 6px}
.totals-table{width:260px;font-size:10px}
.totals-section{margin-top:8px;display:flex;justify-content:flex-end}
.right{text-align:right}
td{padding:5px 6px;border-bottom:1px solid #E2E8F0}
th{background:#1B2D5C;color:white;padding:5px 6px;text-align:left}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:10px}
.label{color:#64748B;font-size:9px;display:block}
.receptor-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;font-size:10px}
.divider{border-top:2px solid #1B2D5C;margin:8px 0}
.autorizacion .num{font-weight:700;color:#DC2626}
.autorizacion{text-align:right;color:#1B2D5C;font-size:10px}
.emisor strong{display:block;font-size:13px}
.emisor{color:#1B2D5C}
.header-top{display:flex;justify-content:space-between;margin-bottom:8px}
body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:20px}
*{margin:0;padding:0;box-sizing:border-box}
<style>
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Factura ${f.serie||""}</title>
  const generarPDFFactura=()=>{
  // ÔöÇÔöÇ PDF SAT-style ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    onSave();
    setSaving(false);
    else await dbIns("facturas",payload);
    if(initial?.id) await dbUpd("facturas",initial.id,payload);
    };
      anticipo_aplicado:parseFloat(f.anticipo_aplicado)||0,
      tasa_cambio:parseFloat(f.tasa_cambio)||7.70,
      lineas:JSON.stringify(lineas),
      saldo_pendiente:saldoPend,
      total,
      total_iva:ivaAmt,
      subtotal:subtotalSinIVA,
      tasa_iva:ivaPct,
      numero:initial?.numero||numero,
      empresa_id:empId,
      ...f,
    const payload={
    const numero="FAC-"+Date.now().toString().slice(-8);
    setSaving(true);
    if(lineas.filter(l=>l.descripcion&&parseFloat(l.precio_unitario)>0).length===0){alert("Agrega al menos una línea con descripción y precio");return;}
    if(!f.nombre_receptor.trim()){alert("Nombre del receptor requerido");return;}
  const guardar=async()=>{
  // ÔöÇÔöÇ Guardar ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  };
    if(co&&!f.nombre_receptor){sf("nombre_receptor",co.cliente_nombre||"");sf("nit_receptor",co.cliente_nit||"");}
    const co=cotizaciones.find(x=>x.id===id);
    sf("cotizacion_id",id);
  const onSelectCotizacion=id=>{
  };
    }
      }
        setLineas([{tipo:"Servicio",cantidad:1,descripcion:"Servicio de transporte / alquiler de vehículo",precio_unitario:r.monto||"",descuento:0}]);
      if(lineas.length===1&&!lineas[0].descripcion){
      else sf("nombre_receptor",r.cliente_nombre||"");
      if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("cliente_id",c.id||"");}
      const c=clientes.find(x=>x.nombre===r.cliente_nombre);
    if(r&&!f.nombre_receptor){
    const r=reservas.find(x=>x.id===id);
    sf("reserva_id",id);
  const onSelectReserva=id=>{
  };
    if(c){sf("nit_receptor",c.nit||"");sf("nombre_receptor",c.nombre||"");sf("direccion_receptor",c.direccion||"CIUDAD");sf("correo_receptor",c.email||"");}
    const c=clientes.find(x=>x.id===id);
    sf("cliente_id",id);
  const onSelectCliente=id=>{
  // ÔöÇÔöÇ Auto-fill from cliente/reserva/cotizacion ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const saldoPend=Math.max(0,total-(parseFloat(f.anticipo_aplicado)||0));
  const total=subtotalBruto;
  const ivaAmt=subtotalBruto-subtotalSinIVA;
  const subtotalSinIVA=ivaPct>0?subtotalBruto/(1+ivaPct/100):subtotalBruto;
  // For pequeño contribuyente, price already includes IVA
  const ivaPct=f.regimen==="GENERAL"?12:f.regimen==="PEQUENIO"?5:0;

  },0);
    return s+(q*p-d);
    const d=parseFloat(l.descuento)||0;
    const p=parseFloat(l.precio_unitario)||0;
    const q=parseFloat(l.cantidad)||0;
  const subtotalBruto=lineas.reduce((s,l)=>{
  // ÔöÇÔöÇ Cálculos ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const [saving,setSaving]=useState(false);

  const updateLinea=(idx,k,v)=>setLineas(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const removeLinea=idx=>setLineas(p=>p.filter((_,i)=>i!==idx));
  const addLinea=()=>setLineas(p=>[...p,{...EMPTY_LINE}]);
  });
    return [{...EMPTY_LINE}];
    if(initial?.lineas&&initial.lineas.length>0) return initial.lineas;
  const [lineas,setLineas]=useState(()=>{
  const EMPTY_LINE={tipo:"Servicio",cantidad:1,descripcion:"",precio_unitario:"",descuento:0};
  // ÔöÇÔöÇ Líneas de detalle ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  });
    estado:initial?.estado||"borrador",
    notas:initial?.notas||"",
    anticipo_aplicado:initial?.anticipo_aplicado||0,
    cotizacion_id:initial?.cotizacion_id||"",
    reserva_id:initial?.reserva_id||"",
    cliente_id:initial?.cliente_id||"",
    tasa_cambio:initial?.tasa_cambio||7.70,
    metodo_pago:initial?.metodo_pago||"efectivo",
    regimen:initial?.regimen||"PEQUENIO", // GENERAL | PEQUENIO | NINGUNO
    correo_receptor:initial?.correo_receptor||"",
    direccion_receptor:initial?.direccion_receptor||"CIUDAD",
    nombre_receptor:initial?.nombre_receptor||"",
    nit_receptor:initial?.nit_receptor||"",
    fecha_certificacion:initial?.fecha_certificacion?.slice(0,10)||today(),
    fecha_emision:initial?.fecha_emision?.slice(0,10)||today(),
    numero_acceso:initial?.numero_acceso||"",
    numero_dte:initial?.numero_dte||"",
    serie:initial?.serie||"TZAR2026",
    numero_autorizacion:initial?.numero_autorizacion||"",
  const [f,setF]=useState({
  // ÔöÇÔöÇ State ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function FormFactura({initial,empId,clientes,reservas,cotizaciones,onSave,onCancel}){

}
  );
    </div>
      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={()=>onConfirm(parseFloat(monto)||saldo,fecha,metodo)} style={{...S.btn("primary"),flex:1}}>✅ Registrar pago</button>
        <div style={{display:"flex",gap:8}}>
        </div>
          </Fld>
            </select>
              <option value="cheque">­ƒôä Cheque</option>
              <option value="tarjeta">­ƒÆ│ Tarjeta</option>
              <option value="deposito">💰 Depósito</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="efectivo">­ƒÆÁ Efectivo</option>
            <select style={S.sel} value={metodo} onChange={e=>setMetodo(e.target.value)}>
          <Fld label="M├ëTODO" span2>
          </Fld>
            <input style={S.inp} type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
          <Fld label="FECHA DE PAGO">
          </Fld>
            <input style={S.inp} type="number" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)} placeholder={fmt(saldo)}/>
          <Fld label="MONTO A PAGAR (GTQ)">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:16}}>
        </div>
          <div style={S.srow(true)}><span>Saldo pendiente</span><span style={{color:T.sec}}>Q {fmt(saldo)}</span></div>
          <div style={S.srow(false)}><span>Anticipo aplicado</span><span>Q {fmt(factura.anticipo_aplicado)}</span></div>
          <div style={S.srow(false)}><span>Total factura</span><span>Q {fmt(factura.total)}</span></div>
        <div style={{background:T.surf,borderRadius:9,padding:"10px 14px",marginBottom:16}}>
        <div style={{fontSize:13,color:T.sub,marginBottom:4}}>{factura.numero} · {factura.nombre_receptor}</div>
        <div style={{fontSize:15,fontWeight:700,color:T.acc,marginBottom:6}}>💰 Registrar Pago</div>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.acc}`,width:"100%",maxWidth:440,padding:24}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  const saldo=parseFloat(factura.saldo_pendiente)||parseFloat(factura.total)||0;
  if(!factura)return null;
  const [metodo,setMetodo]=useState("transferencia");
  const [fecha,setFecha]=useState(today());
  const [monto,setMonto]=useState("");
function ModalPago({factura,onConfirm,onCancel}){

}
  );
    </div>
      </div>
        </div>
          <button onClick={onCancel} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          <button onClick={()=>onConfirm(motivo)} disabled={!motivo.trim()} style={{...S.btn("danger"),flex:1,opacity:motivo.trim()?1:0.5}}>­ƒÜ½ Confirmar anulación</button>
        <div style={{display:"flex",gap:8}}>
        </div>
          ⚠️´©Å Esta acción no se puede deshacer. La factura quedará marcada como ANULADA en el sistema.
        <div style={{background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.red,marginBottom:16}}>
        <textarea style={{...S.inp,minHeight:70,resize:"vertical",marginBottom:16}} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Error en datos del receptor, duplicado, etc."/>
        <label style={S.lbl}>MOTIVO DE ANULACIÓN (requerido)</label>
        <div style={{fontSize:13,color:T.sub,marginBottom:16}}>Factura <strong style={{color:T.txt}}>{factura.numero}</strong> · Q {fmt(factura.total)}</div>
        <div style={{fontSize:15,fontWeight:700,color:T.red,marginBottom:6}}>­ƒÜ½ Anular Factura</div>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.red}`,width:"100%",maxWidth:440,padding:24}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  if(!factura)return null;
  const [motivo,setMotivo]=useState("");
function ModalAnular({factura,onConfirm,onCancel}){

}
  );
    </div>
      )}
        </div>
          ))}
            </div>
              {renderItem(item)}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
            <div key={i} onClick={()=>{onSelect(item);setOpen(false);}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`}}
          {filtered.map((item,i)=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:200,maxHeight:200,overflowY:"auto",marginTop:2}}>
      {open&&filtered.length>0&&(
      <input style={S.inp} value={value} onChange={handleChange} placeholder={placeholder} autoComplete="off"/>
    <div ref={ref} style={{position:"relative"}}>
  return (
  };
    else setOpen(false);
    if(v.length>0){setFiltered(items.filter(i=>getLabel(i).toLowerCase().includes(v.toLowerCase())).slice(0,6));setOpen(true);}
    const v=e.target.value;onChange(v);
  const handleChange=e=>{
  },[]);
    return()=>document.removeEventListener("mousedown",h);
    document.addEventListener("mousedown",h);
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
  useEffect(()=>{
  const ref=useRef(null);
  const [filtered,setFiltered]=useState([]);
  const [open,setOpen]=useState(false);
function Autocomplete({value,onChange,onSelect,items,placeholder,renderItem,getLabel}){

// ÔòÉÔòÉÔòÉ FACTURACIÓN ÔòÉÔòÉÔòÉ



}
  );
    </div>
      </div>
        </div>
          )}
            <div style={{textAlign:"center",padding:24,color:T.sub,fontSize:13}}>Selecciona vehículo y días para ver el resumen</div>
          ):(
            </>
              </div>
                <button onClick={()=>guardar("orden_venta")} disabled={saving} style={{...S.btn("purple"),width:"100%"}}>{saving?"...":"📦 Convertir a Orden de Venta"}</button>
                <button onClick={()=>guardar(f.estado==="borrador"?"enviada":f.estado)} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>{saving?"...":"✅ Guardar cotización"}</button>
                <button onClick={()=>guardar("borrador")} disabled={saving} style={{...S.btn("ghost"),width:"100%"}}>{saving?"...":"­ƒÆ¥ Borrador"}</button>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
              </div>
                <div style={{fontSize:15,fontWeight:700,color:T.sec}}>Q {fmt(total_tc)}</div>
                <div style={{fontSize:10,fontWeight:700,color:T.sec}}>Con Tarjeta C/D</div>
              <div style={{background:T.secDim,border:`1px solid ${T.sec}44`,borderRadius:9,padding:"9px 14px",marginBottom:16}}>
              </div>
                </div>
                  <span style={{fontSize:12,color:T.sub,alignSelf:"flex-end"}}>$ {fmt(total_ef/exch)}</span>
                  <span>Q {fmt(total_ef)}</span>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}>
                <div style={{fontSize:10,fontWeight:700,color:T.acc,marginBottom:3}}>PRECIO BENEFICIO — Efectivo/Depósito/Transf.</div>
              <div style={{background:T.accDim,border:`1px solid ${T.acc}55`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
              </div>
                <div style={S.srow(false)}><span>IVA {f.iva_pct}%</span><span>Q {fmt(iva_amt)}</span></div>
                <div style={S.srow(false)}><span>{f.dias}d ├ù Q{fmt(rate)}</span><span>Q {fmt(sub)}</span></div>
              <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
              )}
                </div>
                  </div>
                    ))}
                      </div>
                        <div style={{fontSize:12,fontWeight:700,color:T.acc}}>Q{fmt(p)}/d</div>
                        <div style={{fontSize:9,color:T.sub}}>{r}</div>
                      <div key={i} style={{textAlign:"center",opacity:(i===0&&f.dias<=7)||(i===1&&f.dias>=8&&f.dias<=29)||(i===2&&f.dias>=30)?1:0.4}}>
                    {[["1-7d",vehObj.dia],["8-29d",vehObj.sem],["30+d",vehObj.mes]].map(([r,p],i)=>(
                  <div style={{display:"flex",gap:16}}>
                <div style={{background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:8,padding:"10px 14px",marginBottom:10}}>
              {vehObj&&(
            <>
          {sub>0?(
          {vehObj&&<div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {f.dias} día{f.dias!==1?"s":""}</div>}
          {f.saludo&&<div style={{fontSize:12,color:T.sub,fontStyle:"italic",marginBottom:8}}>{f.saludo}</div>}
          {f.cliente_nombre&&<div style={{fontSize:13,fontWeight:700,marginBottom:4}}>👤 {f.cliente_nombre}</div>}
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
        <div style={S.card}>
        {/* RESUMEN */}
        </div>
          </div>
            </div>
              <div><label style={S.lbl}>NOTAS INTERNAS</label><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></div>
              </div>
                </select>
                  <option value="rechazada">Rechazada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="enviada">Enviada</option>
                  <option value="borrador">Borrador</option>
                <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
              <div><label style={S.lbl}>ESTADO</label>
              <div><label style={S.lbl}>V├üLIDA HASTA</label><input style={S.inp} value={f.fecha_vence} onChange={e=>sf("fecha_vence",e.target.value)} placeholder="Ej: 28 de abril de 2026"/></div>
              <div><label style={S.lbl}>TASA CAMBIO GTQ=1USD</label><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",e.target.value)}/></div>
              </div>
                </div>
                  ))}
                    <button key={o.v} onClick={()=>sf("iva_pct",o.v)} style={{...S.btn(f.iva_pct===o.v?"primary":"ghost"),flex:1,fontSize:11}}>{o.l}</button>
                  {[{v:12,l:"12% General"},{v:5,l:"5% Pequeño Cont."},{v:0,l:"Sin IVA"}].map(o=>(
                <div style={{display:"flex",gap:8}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>IVA</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>💰 FISCAL Y FECHAS</div>
          <div style={S.card}>
          {/* Fiscal */}
          </div>
            </div>
              </div>
                </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
                  {imgPreview&&<img src={imgPreview} style={{height:40,borderRadius:6,border:`1px solid ${T.bord}`}} alt="veh"/>}
                  <button onClick={()=>fileRef.current?.click()} style={{...S.btn("ghost"),fontSize:11}}>­ƒôÀ Adjuntar imagen</button>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <label style={S.lbl}>IMAGEN DEL VEH├ìCULO (opcional)</label>
              <div style={{gridColumn:"span 2"}}>
              </div>
                <textarea style={{...S.inp,minHeight:64,resize:"vertical"}} value={f.descripcion_servicio} onChange={e=>sf("descripcion_servicio",e.target.value)} placeholder="Ej: Servicio de traslado de personas de Ciudad Guatemala hacia Quetzaltenango, ida y vuelta, del 19 al 21 de marzo..."/>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>DESCRIPCIÓN DEL SERVICIO</label>
              </div>
                </div>
                  <button onClick={()=>sf("con_piloto",false)} style={{...S.btn(!f.con_piloto?"warn":"ghost"),flex:1,fontSize:11}}>­ƒöæ Sin piloto</button>
                  <button onClick={()=>sf("con_piloto",true)} style={{...S.btn(f.con_piloto?"primary":"ghost"),flex:1,fontSize:11}}>­ƒºæÔÇìÔ£ê´©Å Con piloto</button>
                <div style={{display:"flex",gap:8}}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>MODALIDAD</label>
              <div><label style={S.lbl}>PRECIO PERSONALIZADO</label><input style={S.inp} type="number" value={f.precio_custom} onChange={e=>sf("precio_custom",e.target.value)} placeholder="Vacío = catálogo"/></div>
              <div><label style={S.lbl}>D├ìAS</label><input style={S.inp} type="number" min="1" value={f.dias} onChange={e=>sf("dias",parseInt(e.target.value)||1)}/></div>
              </div>
                </select>
                  {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                  <option value="">Seleccionar...</option>
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>VEH├ìCULO</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>🚗 SERVICIO</div>
          <div style={S.card}>
          {/* Servicio */}
          </div>
            </div>
              </div>
                <input style={S.inp} value={f.saludo} onChange={e=>sf("saludo",e.target.value)} placeholder="Ej: Estimados señores de Fundación Myrna Mack"/>
              <div style={{gridColumn:"span 2"}}><label style={S.lbl}>SALUDO PERSONALIZADO</label>
              <div><label style={S.lbl}>DIRECCIÓN DEL CLIENTE</label><input style={S.inp} value={f.cliente_dir} onChange={e=>sf("cliente_dir",e.target.value)} placeholder="Ciudad, zona..."/></div>
              <div><label style={S.lbl}>NIT</label><input style={S.inp} value={f.cliente_nit} onChange={e=>sf("cliente_nit",e.target.value)} placeholder="7032528"/></div>
              </div>
                />
                  clientes={clientes}
                  onSelect={c=>{sf("cliente_nombre",c.nombre);sf("cliente_nit",c.nit||"");sf("cliente_dir",c.direccion||"");sf("saludo","Estimados señores de "+c.nombre);}}
                  onChange={v=>sf("cliente_nombre",v)}
                  value={f.cliente_nombre}
                <ClienteAutocomplete
                <label style={S.lbl}>CLIENTE (escribe para buscar)</label>
              <div style={{gridColumn:"span 2"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <div style={{fontSize:12,fontWeight:700,color:T.mut,marginBottom:12}}>👤 DATOS DEL CLIENTE</div>
          <div style={S.card}>
          {/* Cliente */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* FORM */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      </div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
        </div>
          {isClone?"Clonar cotización":initial?.id?"Editar cotización":"Nueva cotización"}
        <div style={{fontSize:14,fontWeight:700,color:T.acc}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div>
  return (

  };
    }catch(e){showToast("Error al guardar: "+e.message,"err");setSaving(false);}
      onSave(estado);
      setSaving(false);
      showToast("Cotización guardada ✔");
      if(result&&result.error){showToast("Error: "+result.error,"err");setSaving(false);return;}
      else result=await dbIns("cotizaciones",payload);
      if(initial?.id&&!initial?.__clon) result=await dbUpd("cotizaciones",initial.id,payload);
      let result;
      };
        notas:f.notas||"",
        orden_venta:estado==="orden_venta",
        estado:estado==="orden_venta"?"aprobada":estado,
        vehiculo_imagen_url:f.vehiculo_imagen_url||"",
        cliente_dir:f.cliente_dir||"",
        cliente_nit:f.cliente_nit||"",
        total_usd:parseFloat(f.total_usd)||0,
        total_gtq:parseFloat(f.total_gtq)||0,
        recargo_tarjeta:parseFloat(f.recargo_tarjeta)||0,
        total_iva:parseFloat(f.total_iva)||0,
        subtotal:parseFloat(f.subtotal)||0,
        tasa_cambio:parseFloat(f.exch)||7.70,
        metodo_pago:f.pago||"efectivo",
        tasa_iva:parseInt(f.iva)||5,
        incl:f.incl||[],
        con_piloto:f.con_piloto!==false,
        descripcion_servicio:f.descripcion_servicio||"",
        saludo:f.saludo||"",
        vehiculo_nombre:f.vehiculo_nombre||"",
        dias:parseInt(f.dias)||1,
        numero:(!initial?.id||initial?.__clon)?"COT-"+Date.now().toString().slice(-6):initial.numero,
        tipo:f.tipo||"renta",
        cliente_nombre:f.cliente_nombre,
        empresa_id:empId,
      const payload={
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
    try{
    setSaving(true);
    if(!f.cliente_nombre.trim()){showToast("Ingresa el nombre del cliente","err");return;}
  const guardar=async(estado)=>{

  };
    reader.readAsDataURL(file);
    reader.onload=ev=>setImgPreview(ev.target.result);
    const reader=new FileReader();
    if(!file) return;
    const file=e.target.files[0];
  const handleFile=e=>{

  const beneficios=["Experiencia de viaje segura y cómoda","Flexibilidad a sus necesidades","Puntualidad garantizada"];
  const incluidos=f.con_piloto?["Combustible lleno (súper/diésel)","Conductor/piloto profesional","Servicio y atención especializada"]:["Vehículo entregado con tanque lleno","Asistencia en ruta disponible","Servicio y atención especializada"];
  const caract=vehObj?[vehObj.nombre,"Aire acondicionado","Cinturones de seguridad","Seguro total"]:["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"];

  const exch=parseFloat(f.exch)||7.70;
  const total_tc=total_ef*1.05;
  const total_ef=sub+iva_amt;
  const iva_amt=sub*f.iva_pct/100;
  const sub=f.dias*rate;
  const rate=f.precio_custom>0?parseFloat(f.precio_custom)||0:(vehObj?tarifaFn(vehObj,f.dias):0);
  const tarifaFn=(v,d)=>{if(!v||d===0)return 0;if(d>=30)return v.mes;if(d>=8)return v.sem;return v.dia;};
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;

  const [imgPreview,setImgPreview]=useState(null);
  const fileRef=useRef(null);
  const [mostrarTC,setMostrarTC]=useState(true);  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  const [saving,setSaving]=useState(false);
  });
    };
      incluidos_texto:initial.incluidos_texto||"",
      incl:initial.incl||[],
      notas:initial.notas||"",
      estado:"borrador",
      fecha_vence:initial.fecha_vence||"",
      fecha_emision:today(),
      exch:initial.tasa_cambio||7.70,
      pago:initial.metodo_pago||"efectivo",
      iva_pct:initial.tasa_iva||5,
      precio_custom:initial.precio_personalizado||"",
      dias:initial.dias||1,
      con_piloto:initial.con_piloto!==false,
      vehiculo_nombre:initial.vehiculo_nombre||"",
      tipo:initial.tipo||"renta",
      descripcion_servicio:initial.descripcion_servicio||"",
      saludo:initial.saludo||"",
      cliente_dir:initial.cliente_dir||"",
      cliente_nit:initial.cliente_nit||"",
      cliente_nombre:initial.cliente_nombre||"",
      ...EMPTY_F,
    return {
    if(!initial) return {...EMPTY_F};
  const [f,setF]=useState(()=>{
  const isClone = initial?.__clon;
function FormCotizacion({initial, empId, clientes, onSave, onCancel}){

};
  imagen_url:"",
  caract:[],incluidos:[],beneficios:[],
  estado:"borrador",notas:"",
  fecha_emision:today(),fecha_vence:"",
  iva_pct:5,pago:"efectivo",exch:7.70,
  dias:1,precio_custom:"",
  tipo:"renta",vehiculo_nombre:"",con_piloto:true,
  saludo:"",descripcion_servicio:"",
  cliente_nombre:"",cliente_nit:"",cliente_dir:"",
const EMPTY_F={
// ÔöÇÔöÇ FORMULARIO COTIZACIÓN ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

}
  );
    </div>
      </div>
        </div>
          </div>
            <button onClick={()=>{const subject=encodeURIComponent(`Cotización ${cot.numero} — Tz'unun AutoRentas`);const body=encodeURIComponent(`Estimados,\n\nAdjunto cotización ${cot.numero} por Q ${fmt(total_ef)}.\n\nSaludos,\nOscar Gálvez\nTz'unun AutoRentas\n502-31221538`);window.open(`mailto:?subject=${subject}&body=${body}`);}} style={{...S.btn("ghost"),fontSize:12}}>Ô£ë´©Å Email</button>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc){const blob=doc.output("blob");const url=URL.createObjectURL(blob);window.open(url,"_blank");}}} style={{...S.btn("blue"),fontSize:12}}>­ƒû¿´©Å Imprimir</button>
            <button onClick={()=>{const doc=generarPDF({numero:cot.numero,fecha:cot.fecha_emision||today(),fecha_vence:cot.fecha_vence,cliente:cot.cliente_nombre,nit:cot.cliente_nit,dir_cliente:cot.cliente_dir,saludo:cot.saludo,servicio:cot.descripcion_servicio,caract:cot.caract||["Vehículo seleccionado","Aire acondicionado","Cinturones","Seguro total"],incluidos:cot.incluidos||["Combustible lleno","Conductor profesional","Atención especializada"],beneficios:cot.beneficios||["Viaje seguro y cómodo","Puntualidad","Flexibilidad"],con_piloto:cot.con_piloto!==false,sub,iva_pct,iva_amt,total_ef,total_tc,exch});if(doc)doc.save(`${cot.numero}.pdf`);}} style={{...S.btn("primary"),fontSize:12}}>Ô¼ç Descargar PDF</button>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sec,marginTop:6}}><span>Con Tarjeta C/D</span><span>Q {fmt(total_tc)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,marginTop:3}}><span>Equivalente USD</span><span>$ {fmt(total_ef/exch)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800,color:T.acc}}><span>PRECIO BENEFICIO</span><span>Q {fmt(total_ef)}</span></div>
            <div style={{borderTop:`1px solid ${T.bord}`,margin:"8px 0"}}/>
            ))}
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13,color:T.sub}}><span>{l}</span><span>Q {v}</span></div>
            {[[`Subtotal`,fmt(sub)],[`IVA (${iva_pct}%)`,fmt(iva_amt)]].map(([l,v],i)=>(
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:12}}>
          {/* Financiero */}
          {cot.descripcion_servicio&&<div style={{marginBottom:12,fontSize:12,color:T.sub,fontStyle:"italic"}}>{cot.descripcion_servicio}</div>}
          {/* Descripción */}
          {cot.saludo&&<div style={{background:"#00D4AA11",border:"1px solid #00D4AA33",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.sub,fontStyle:"italic"}}>"{cot.saludo}"</div>}
          {/* Saludo */}
          </div>
            <div style={{fontSize:12,color:T.sub}}>NIT: {cot.cliente_nit||"—"} · {cot.cliente_dir||""}</div>
            <div style={{fontSize:14,fontWeight:700}}>{cot.cliente_nombre}</div>
            <div style={{fontSize:10,color:T.mut,fontWeight:700,marginBottom:4}}>FACTURAR A:</div>
          <div style={{marginBottom:12}}>
          {/* Cliente */}
          </div>
            </div>
              <div style={{fontSize:11,color:T.sub}}>{cot.fecha_emision||cot.created_at?.slice(0,10)}</div>
              <div style={{fontSize:12,color:"#fff"}}>#{cot.numero}</div>
              <div style={{fontSize:16,fontWeight:800,color:T.acc}}>{cot.orden_venta?"ORDEN DE VENTA":"COTIZACIÓN"}</div>
            <div style={{textAlign:"right"}}>
            </div>
              </div>
                <div style={{fontSize:10,color:T.sub}}>502-31221538 · tzununautorentas@gmail.com</div>
                <div style={{fontSize:14,fontWeight:800,color:T.acc}}>TZ'UNUN AUTORENTAS</div>
              <div>
              <img src={`data:image/png;base64,${LOGO_B64}`} style={{width:44,height:44,borderRadius:10}} alt="logo"/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"#1B2D5C",borderRadius:10,padding:16,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {/* Mini header */}
        <div style={{padding:20}}>
        </div>
          <button onClick={onClose} style={{...S.btn("ghost"),padding:"4px 10px"}}>Ô£ò</button>
          <div style={{fontSize:14,fontWeight:700,color:T.acc}}>Vista previa — {cot.numero}</div>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.bord}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.bord}`,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto"}}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  return (
  const exch=parseFloat(cot.tasa_cambio)||7.70;
  const total_tc=total_ef*1.05;
  const total_ef=sub+iva_amt;
  const iva_amt=sub*iva_pct/100;
  const iva_pct=parseFloat(cot.tasa_iva)||5;
  const sub=parseFloat(cot.subtotal)||0;
  if(!cot) return null;
function ModalVistaPrevia({cot, onClose}){

}
  return doc;

  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas   |   Guatemala",W/2,HP-11,{align:"center"});
  doc.text("TZ'UNUN AUTORENTAS  —  Más comodidad, rapidez y mejores precios",W/2,HP-21,{align:"center"});
  doc.setTextColor(148,163,184); doc.setFontSize(6.5); doc.setFont("helvetica","normal");
  doc.setFillColor(...TEAL); doc.rect(0,HP-36,W,2,"F");
  doc.setFillColor(...NAVY); doc.rect(0,HP-36,W,36,"F");
  // Pie

  doc.text("Adjunto cotización, quedamos a la espera de su aprobación.",W/2,y+21,{align:"center"});
  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Muchas gracias por su preferencia, esperamos poder servirle.",W/2,y+11,{align:"center"});
  doc.setTextColor(0,200,150); doc.setFontSize(8.5); doc.setFont("helvetica","bolditalic");
  doc.text("Cel. 502 31221538   |   @TzununAutorentas",22,y+21);
  doc.setTextColor(...GRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
  doc.text("Oscar Gálvez",22,y+11);
  doc.setTextColor(27,45,92); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.6); doc.line(22,y,180,y);
  // Firma y cierre

  y+=termH+10;
  doc.text("Cta. No. 3309159475",380,y+61);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.text("Banrural",380,y+52);
  doc.setTextColor(0,200,150); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.line(380,y+43,W-26,y+43);
  doc.text("A nombre de: Transportes Tz'unun",380,y+39);
  doc.text("Cta. Monetaria No. 853-000016-8",380,y+31);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica","normal"); doc.setFontSize(7.2);
  doc.setTextColor(0,200,150); doc.text("Banco Industrial",380,y+22);
  doc.text("DATOS DE PAGO",380,y+10);
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setDrawColor(203,213,225); doc.setLineWidth(0.4); doc.line(372,y+8,372,y+termH-8);
  terms.forEach((t,i)=>doc.text(t,30,y+20+(i*7.5)));
  doc.setFontSize(7.2); doc.setFont("helvetica","normal"); doc.setTextColor(...DKGRAY);
  ];
    "ÔÇó El saldo restante se cancela al finalizar el servicio.",
    "ÔÇó El vehículo debe devolverse limpio (recargo Q.75.00 si no cumple).",
    d.con_piloto?"ÔÇó Combustible incluido según el recorrido acordado.":"ÔÇó Vehículo entregado con tanque lleno — devolver lleno.",
    "ÔÇó Anticipo del 75% para confirmar el servicio.",
    "ÔÇó Se requiere copia de DPI del responsable del grupo.",
    "ÔÇó Nuestros vehículos son higienizados antes y después de cada servicio.",
  const terms=[
  doc.text("T├ëRMINOS Y CONDICIONES",30,y+10);
  doc.setTextColor(27,45,92); doc.setFontSize(7.5); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,termH,"F");
  doc.setFillColor(241,245,249); doc.roundedRect(22,y,W-44,termH,4,4,"F");
  const termH=66;
  // Términos y cuentas

  y+=10;
  });
    doc.text("$ "+usd,22+310+100+90-6,y+10,{align:"right"}); y+=16;
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.setFont("helvetica","bold"); doc.text(gtq,22+310+100-6,y+10,{align:"right"});
    doc.text(concepto,28,y+10);
    doc.setFontSize(isBenef||isTC?8.5:8); doc.setFont("helvetica",isBenef?"bold":"normal");
    doc.setTextColor(isBenef?TEAL2[0]:isTC?AMBER[0]:DKGRAY[0],isBenef?TEAL2[1]:isTC?AMBER[1]:DKGRAY[1],isBenef?TEAL2[2]:isTC?AMBER[2]:DKGRAY[2]);
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.rect(22,y,W-44,16,"S");
    doc.rect(22,y,W-44,16,"F");
    else doc.setFillColor(ri%2===0?255:241,ri%2===0?255:245,ri%2===0?255:249);
    else if(isTC) doc.setFillColor(255,253,235);
    if(isBenef) doc.setFillColor(232,245,240);
    const [concepto,gtq,usd,isBenef,isTC]=row;
  finRows.forEach((row,ri)=>{
  doc.text("USD",22+310+100+90-6,y+10,{align:"right"}); y+=16;
  doc.text("Concepto",28,y+10); doc.text("GTQ",22+310+100-6,y+10,{align:"right"});
  doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setFillColor(...NAVY); doc.rect(22,y,W-44,16,"F");
  const cW=[310,100,90];
  ];
    ["Con Tarjeta de Crédito / Débito",fmt(d.total_tc),fmt(d.total_tc/d.exch),false,true],
    ["PRECIO BENEFICIO — Efectivo / Depósito / Transferencia",fmt(d.total_ef),fmt(d.total_ef/d.exch),true,false],
    ["Impuesto "+d.iva_pct+"% ("+(d.iva_pct===5?"Pequeño Contribuyente":"Régimen General")+")",fmt(d.iva_amt),fmt(d.iva_amt/d.exch),false,false],
    ["Subtotal (precio base)",fmt(d.sub),fmt(d.sub/d.exch),false,false],
  const finRows=[
  doc.text("RESUMEN FINANCIERO",30,y+8); y+=14;
  doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
  // Tabla financiera

  }
    y+=18;
    doc.text("⚠️  SIN PILOTO: Vehículo entregado con tanque lleno — debe devolverse con tanque lleno.",32,y+8);
    doc.setTextColor(146,64,14); doc.setFontSize(7.2); doc.setFont("helvetica","bold");
    doc.setFillColor(...AMBER); doc.rect(22,y,3,13,"F");
    doc.setFillColor(255,248,231); doc.roundedRect(22,y,W-44,13,3,3,"F");
  if(!d.con_piloto){
  // Nota combustible

  y+=boxH+10;
  });
    col.items.forEach((item,j)=>doc.text("ÔÇó "+item,cx+9,y+22+(j*9.5)));
    doc.setTextColor(...DKGRAY); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
    doc.setDrawColor(203,213,225); doc.setLineWidth(0.3); doc.line(cx+6,y+13,cx+colW-8,y+13);
    doc.text(col.title,cx+8,y+10);
    doc.setTextColor(...col.color); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.setFillColor(...col.color); doc.rect(cx,y,3,boxH,"F");
    doc.roundedRect(cx,y,colW-2,boxH,3,3,"F");
    doc.setFillColor(ci%2===0?241:232,ci%2===0?245:238,ci%2===0?249:244);
    const cx=22+ci*colW;
  cols.forEach((col,ci)=>{
  const boxH=14+maxR*9.5+8;
  const maxR=Math.max(...cols.map(c=>c.items.length));
  ];
    {title:"BENEFICIOS",items:d.beneficios,color:[245,158,11]},
    {title:"SERVICIOS INCLUIDOS",items:d.incluidos,color:[27,45,92]},
    {title:"VEH├ìCULO Y CARACTER├ìSTICAS",items:d.caract,color:[0,200,150]},
  const cols=[
  const colW=(W-44)/3;
  // 3 columnas

  }
    y+=sl.slice(0,3).length*10+8;
    sl.slice(0,3).forEach((ln,i)=>doc.text(ln,22,y+(i*10)));
    const sl=doc.splitTextToSize(d.servicio,W-44);
    doc.setTextColor(...DKGRAY); doc.setFontSize(8); doc.setFont("helvetica","italic");
    doc.text("DESCRIPCIÓN DEL SERVICIO",30,y+8); y+=16;
    doc.setTextColor(27,45,92); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
    doc.setFillColor(...TEAL2); doc.rect(22,y,3,12,"F");
  if(d.servicio){
  // Descripción

  y+=58;
  introL.slice(0,3).forEach((ln,i)=>doc.text(ln,32,y+25+(i*9)));
  const introL=doc.splitTextToSize(intro,W-88);
  const intro="En Transportes Tz'unun nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas en renta de vehículos, viajes de turismo y traslado de personas en Guatemala y Centroamérica. Con mucho gusto le presentamos la siguiente cotización:";
  doc.setTextColor(...DKGRAY); doc.setFontSize(7.8); doc.setFont("helvetica","normal");
  doc.text(saludoLines[0].slice(0, 80), 32, y+13);
  const saludoLines = doc.splitTextToSize(saludoText, W-70);
  const saludoText = (d.saludo||"Estimados señores de "+(d.cliente||"")) + ":";
  doc.setTextColor(27,45,92); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.setFillColor(...TEAL2); doc.rect(22,y,3,46,"F");
  doc.setFillColor(232,245,240); doc.roundedRect(22,y,W-44,46,4,4,"F");
  // Saludo

  doc.setDrawColor(226,232,240); doc.setLineWidth(0.5); doc.line(22,y,W-22,y); y+=12;
  y+=8;
  if(d.nit) doc.text("NIT: "+d.nit+(d.dir_cliente?"   |   "+d.dir_cliente:""),22,y);
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","normal");
  y += clientLines.length * 8;
  doc.text(clientLines, 22, y);
  const clientLines = doc.splitTextToSize(d.cliente||"", 180);
  // Client name with auto-wrap for long names
  doc.setTextColor(30,41,59); doc.setFontSize(12); doc.setFont("helvetica","bold");
  doc.text("FACTURAR A:",22,y); y+=12;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica","bold");
  // Cliente

  let y = 110;

  doc.setDrawColor(...TEAL); doc.setLineWidth(2); doc.line(0,92,W,92);
  doc.text("Válida hasta: "+(d.fecha_vence||"15 días"),W-20,72,{align:"right"});
  doc.text("Emisión:      "+d.fecha,W-20,61,{align:"right"});
  doc.setTextColor(148,163,184); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("# "+d.numero,W-20,48,{align:"right"});
  doc.setTextColor(...WHITE); doc.setFontSize(10);
  doc.text(d.es_orden?"ORDEN DE VENTA":"COTIZACIÓN",W-20,33,{align:"right"});
  doc.setTextColor(0,212,170); doc.setFontSize(20); doc.setFont("helvetica","bold");
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas",100,72);
  doc.text("2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala",100,61);
  doc.setTextColor(148,163,184); doc.setFontSize(7.5);
  doc.text("M├üS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS  Ôÿà  Ôÿà",100,48);
  doc.setTextColor(0,212,170); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("TZ'UNUN AUTORENTAS",100,34);
  doc.setTextColor(...WHITE); doc.setFontSize(17); doc.setFont("helvetica","bold");
  try{ doc.addImage("data:image/png;base64,"+LOGO_B64,"PNG",18,8,70,70); }catch(e){}
  doc.setFillColor(...TEAL); doc.rect(0,0,W,3,"F");
  doc.setFillColor(...NAVY); doc.rect(0,0,W,90,"F");
  // Header

  const LGRAY=[241,245,249],WHITE=[255,255,255],AMBER=[245,158,11],DKGRAY=[51,65,85];
  const NAVY=[27,45,92],TEAL=[0,212,170],TEAL2=[29,158,117],GRAY=[100,116,139];
  const HP = doc.internal.pageSize.getHeight();
  const W = doc.internal.pageSize.getWidth();
  const doc = new jsPDF({orientation:"portrait",unit:"pt",format:"letter"});
  if(!jsPDF){alert("jsPDF no cargó. Intenta de nuevo en unos segundos.");return;}
  const {jsPDF} = window.jspdf;
  if(!window.jspdf){alert("PDF no disponible. Recarga la página e intenta de nuevo.");return null;}
function generarPDF(d){

}
  );
    </div>
      )}
        </div>
          ))}
            </div>
              <div style={{fontSize:11,color:T.sub}}>NIT: {c.nit||"—"} · {c.tipo}</div>
              <div style={{fontWeight:600,color:T.txt}}>{c.nombre}</div>
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              onMouseEnter={e=>e.currentTarget.style.background=T.accDim}
            <div key={c.id} onClick={()=>select(c)} style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.bord}22`,fontSize:13}}
          {filtered.map(c=>(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:T.surf,border:`1px solid ${T.acc}`,borderRadius:8,zIndex:100,maxHeight:200,overflowY:"auto",marginTop:2}}>
      {open && filtered.length > 0 && (
        placeholder="Escribe para buscar cliente..." autoComplete="off"/>
      <input style={S.inp} value={value} onChange={handleChange}
    <div ref={ref} style={{position:"relative"}}>
  return (

  };
    setOpen(false);
    onSelect(c);
  const select = c => {

  };
    }
      setOpen(false);
    } else {
      setOpen(true);
      setFiltered(clientes.filter(c=>c.nombre.toLowerCase().includes(v.toLowerCase())).slice(0,6));
    if(v.length > 0){
    onChange(v);
    const v = e.target.value;
  const handleChange = e => {

  },[]);
    return ()=>document.removeEventListener("mousedown", handler);
    document.addEventListener("mousedown", handler);
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
  useEffect(()=>{

  const ref = useRef(null);
  const [filtered, setFiltered] = useState([]);
  const [open, setOpen] = useState(false);
function ClienteAutocomplete({value, onChange, onSelect, clientes}){

// ÔòÉÔòÉÔòÉ COTIZACIONES ÔòÉÔòÉÔòÉ



}
  );
    </div>
      </div>
        </div>
          TzununSA · Acceso exclusivo para personal autorizado
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.mut }}>

        </div>
          </div>
            Ve a Supabase → Authentication → Users → Invite user y agrega el correo de cada empleado. Ellos recibirán un correo para crear su contraseña.
            <div style={{ fontWeight: 600, color: T.mut, marginBottom: 4 }}>┬┐PRIMER ACCESO?</div>
          <div style={{ marginTop: 20, padding: "12px 14px", background: T.surf, borderRadius: 8, fontSize: 12, color: T.sub }}>

          </button>
            {loading ? "Verificando..." : "Entrar →"}
          >
            style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
            onClick={handleLogin}
          <button

          </div>
            />
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            <input
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONTRASE├æA</label>
          <div style={{ marginBottom: 24 }}>

          </div>
            />
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="tu@tzununautorentas.com"
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            <input
            <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CORREO ELECTRÓNICO</label>
          <div style={{ marginBottom: 14 }}>

          )}
            </div>
              ❌ {error}
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>
          {error && (

          <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 24, textAlign: "center" }}>Iniciar sesión</div>
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
        {/* Card login */}

        </div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Sistema de Gestión Integral</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.acc }}>Tz'unun AutoRentas</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
        {/* Logo */}
      <div style={{ width: "100%", maxWidth: 420 }}>
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
  return (

  };
    setLoading(false);
    }
      setError("Error de conexión. Verifica tu internet.");
    } catch {
      }
        setError("Correo o contraseña incorrectos");
      } else {
        onLogin(data.access_token, data.user);
        localStorage.setItem("tzunun_user", JSON.stringify({ email: data.user?.email, name: data.user?.user_metadata?.name || data.user?.email }));
        localStorage.setItem("tzunun_token", data.access_token);
      if (data.access_token) {
      const data = await sbSignIn(email.trim(), password);
    try {
    setError("");
    setLoading(true);
    }
      return;
      setError("Ingresa tu correo y contraseña");
    if (!email.trim() || !password.trim()) {
  const handleLogin = async () => {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
function LoginScreen({ onLogin }) {


}
  );
    </div>
      </div>
        </div>
          )}
            </>
              </button>
                {loading ? "Guardando..." : "Crear contraseña →"}
                style={{ width: "100%", padding: "13px", background: loading ? T.mut : T.acc, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#0A0F1E", cursor: loading ? "not-allowed" : "pointer" }}>
              <button onClick={handleSet} disabled={loading}
              </div>
                  onKeyDown={e => e.key === "Enter" && handleSet()} />
                  type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>CONFIRMAR CONTRASE├æA</label>
              <div style={{ marginBottom: 24 }}>
              </div>
                  type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó" />
                <input style={{ width: "100%", background: T.surf, border: `1px solid ${T.bord}`, borderRadius: 8, padding: "11px 14px", color: T.txt, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                <label style={{ fontSize: 11, color: T.mut, display: "block", marginBottom: 4, fontWeight: 600 }}>NUEVA CONTRASE├æA (mínimo 8 caracteres)</label>
              <div style={{ marginBottom: 14 }}>
              {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 16 }}>❌ {error}</div>}
            <>
          ) : (
            <div style={{ textAlign: "center", fontSize: 16, color: T.acc, padding: 20 }}>{msg}</div>
          {msg ? (
        <div style={{ background: T.card, border: `1px solid ${T.bord}`, borderRadius: 16, padding: 32 }}>
        </div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Tz'unun AutoRentas — Primer acceso</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.acc }}>Crear contraseña</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#00D4AA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 16px" }}>🐦</div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
  return (

  };
    setLoading(false);
    }
      setError("Error al guardar. Pide una nueva invitación.");
    } else {
      setTimeout(onDone, 2000);
      setMsg("✅ Contraseña creada. Ya puedes iniciar sesión.");
    if (data.id) {
    const data = await sbSetPassword(token, pwd);
    setLoading(true); setError("");
    if (pwd !== pwd2) { setError("Las contraseñas no coinciden"); return; }
    if (pwd.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
  const handleSet = async () => {

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwd2, setPwd2] = useState("");
  const [pwd, setPwd] = useState("");
function SetPasswordScreen({ token, onDone }) {

}
  return r.json();
  });
    body: JSON.stringify({ password: newPassword }),
    headers: { apikey: SK, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    method: "PUT",
  const r = await fetch(`${SB}/auth/v1/user`, {
async function sbSetPassword(token, newPassword) {
// ÔöÇÔöÇ PANTALLA: CREAR/CAMBIAR CONTRASE├æA (desde link de invitación) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ


}
  return r.json();
  });
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
  const r = await fetch(`${SB}/auth/v1/user`, {
async function sbGetUser(token) {

}
  });
    headers: { apikey: SK, Authorization: `Bearer ${token}` },
    method: "POST",
  await fetch(`${SB}/auth/v1/logout`, {
async function sbSignOut(token) {

}
  return r.json();
  });
    body: JSON.stringify({ email, password }),
    headers: { apikey: SK, "Content-Type": "application/json" },
    method: "POST",
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
async function sbSignIn(email, password) {

];
  "empleado4@tzununautorentas.com",
  "empleado3@tzununautorentas.com",
  "empleado2@tzununautorentas.com",
  "empleado1@tzununautorentas.com",
  "oscar@tzununautorentas.com",
const USERS_ALLOWED = [
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// AUTENTICACIÓN — Login con Supabase Auth
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

];
  {d:"Jocotan Chiquimula",km:210,dias:1},{d:"Zacualpa Quiché",km:210,dias:1},
  {d:"Playa El Tunco El Salvador",km:275,dias:1},{d:"Suchitoto El Salvador",km:253,dias:1},
  {d:"Nebaj Quiché",km:235,dias:1},{d:"Chisec Alta Verapaz",km:350,dias:1},
  {d:"Totonicapán",km:185,dias:1},{d:"Zacapa",km:160,dias:1},
  {d:"Tecpán",km:93,dias:1},{d:"Tikal Petén",km:536,dias:1},
  {d:"Sololá",km:145,dias:1},{d:"Suchitepéquez",km:164,dias:1},
  {d:"Santa Rosa",km:57,dias:1},{d:"Semuc Champey",km:300,dias:1},
  {d:"San Marcos",km:284,dias:1},{d:"San Pedro La Laguna",km:180,dias:1},
  {d:"San José / Iztapa",km:115,dias:1},{d:"San Lucas Sacatepéquez",km:25,dias:1},
  {d:"Ruinas Copán Honduras",km:235,dias:1},{d:"Sacatepéquez",km:45,dias:1},
  {d:"Río Dulce",km:300,dias:1},{d:"Río Hondo Zacapa",km:145,dias:1},
  {d:"Rabinal Baja Verapaz",km:185,dias:1},{d:"Retalhuleu",km:200,dias:1},
  {d:"Quiché (Sta. Cruz)",km:269,dias:1},{d:"Quiriguá",km:215,dias:1},
  {d:"Puerto Barrios",km:315,dias:1},{d:"Quetzaltenango",km:210,dias:1},
  {d:"Panajachel",km:140,dias:1},{d:"Petén (Flores)",km:525,dias:1},
  {d:"Livingston",km:300,dias:1},{d:"Monterrico",km:140,dias:1},
  {d:"Jalapa",km:112,dias:1},{d:"Jutiapa",km:205,dias:1},
  {d:"Ixcán Quiché",km:385,dias:1},{d:"Izabal",km:245,dias:1},
  {d:"Huehuetenango",km:275,dias:1},{d:"Irtra Retalhuleu",km:190,dias:1},
  {d:"Flores Petén",km:520,dias:1},{d:"Frontera Mesilla",km:320,dias:1},
  {d:"Esquipulas",km:215,dias:1},{d:"Escuintla",km:68,dias:1},
  {d:"El Estor Izabal",km:590,dias:1},{d:"El Progreso",km:135,dias:1},
  {d:"Cobán",km:215,dias:1},{d:"Coatepéque",km:225,dias:1},
  {d:"Chimaltenango",km:110,dias:1},{d:"Chiquimula",km:180,dias:1},
  {d:"Champerico",km:230,dias:1},{d:"Chichicastenango",km:150,dias:1},
  {d:"Antigua Guatemala",km:40,dias:1},{d:"Baja Verapaz",km:165,dias:1},
const RUTAS=[
// ÔòÉÔòÉÔòÉ TABLA DE RUTAS Y DISTANCIAS (de tarifario Tz'unun) ÔòÉÔòÉÔòÉ

const FLUJO_RES={pendiente:[{v:"confirmada",l:"Ô£ô Confirmar",s:"primary"},{v:"cancelada",l:"Ô£ù",s:"danger"}],confirmada:[{v:"en_curso",l:"ÔûÂ Iniciar",s:"blue"},{v:"cancelada",l:"Ô£ù",s:"danger"}],en_curso:[{v:"completada",l:"Ô£ô Completar",s:"primary"},{v:"cancelada",l:"Ô£ù",s:"danger"}],completada:[],cancelada:[{v:"pendiente",l:"↺",s:"ghost"}]};
const EST_FAC={borrador:{c:T.mut,bg:"#1E293B",l:"Borrador"},emitida:{c:T.blue,bg:T.blueDim,l:"Emitida"},certificada:{c:T.acc,bg:T.accDim,l:"Certificada"},pagada:{c:T.acc,bg:T.accDim,l:"Pagada"},parcial:{c:T.sec,bg:T.secDim,l:"Pago parcial"},anulada:{c:T.red,bg:T.redDim,l:"Anulada"}};
const EST_VEH={disponible:{c:T.acc,bg:T.accDim,l:"Disponible"},rentado:{c:T.blue,bg:T.blueDim,l:"Rentado"},mantenimiento:{c:T.sec,bg:T.secDim,l:"Mantenim."}};
const EST_RES={pendiente:{c:T.mut,bg:"#1E293B",l:"Pendiente"},confirmada:{c:T.acc,bg:T.accDim,l:"Confirmada"},en_curso:{c:T.blue,bg:T.blueDim,l:"En curso"},completada:{c:T.acc,bg:T.accDim,l:"Completada"},cancelada:{c:T.red,bg:T.redDim,l:"Cancelada"}};
const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:T.green,impuestos:T.red,servicios:T.acc,llantas:T.blue,repuestos:T.sec,hospedaje:"#06B6D4",alimentacion:"#EC4899",peajes:T.sec,oficina:T.mut,otros:T.sub};
const CAT_GASTO=["combustible","mantenimiento","seguros","salarios","impuestos","servicios","llantas","repuestos","hospedaje","alimentacion","peajes","oficina","otros"];
const CATALOGO=[{id:"c1",nombre:"Hyundai Verna (Sedán)",tipo:"Sedán",dia:300,sem:275,mes:250},{id:"c2",nombre:"Toyota RAV4 Híbrida (SUV)",tipo:"SUV",dia:600,sem:575,mes:550},{id:"c3",nombre:"Suzuki XL7 3 filas (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c4",nombre:"Suzuki Jimny 5p 4x4 (SUV)",tipo:"SUV",dia:550,sem:500,mes:450},{id:"c5",nombre:"Mitsubishi L200 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c6",nombre:"Mahindra Pikup 4x4 (Pickup)",tipo:"Pickup",dia:550,sem:500,mes:450},{id:"c7",nombre:"Nissan Urvan Wide 16p",tipo:"Microbús",dia:750,sem:700,mes:650},{id:"c8",nombre:"Bus tipo County",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c9",nombre:"Bus tipo Pullman",tipo:"Bus",dia:600,sem:550,mes:500},{id:"c10",nombre:"Bus Escolar",tipo:"Bus",dia:600,sem:550,mes:500}];
const GT={"Guatemala":["Guatemala","Mixco","Villa Nueva","San Miguel Petapa","Chinautla","Palencia","Fraijanes","Amatitlán"],"Alta Verapaz":["Cobán","San Pedro Carchá","Tactic","Panzós","Senahú","Lanquín","Cahabón","Chisec","Raxruhá"],"Baja Verapaz":["Salamá","Rabinal","Cubulco","Granados","San Jerónimo","Purulhá"],"Chimaltenango":["Chimaltenango","Comalapa","Tecpán","Patzún","Patzicía","Acatenango","Yepocapa"],"Chiquimula":["Chiquimula","Jocotán","Camotán","Olopa","Esquipulas","Quezaltepeque"],"El Progreso":["Guastatoya","Morazán","San Agustín Acasaguastlán","Sanarate"],"Escuintla":["Escuintla","Santa Lucía Cotzumalguapa","Tiquisate","La Gomera","San José","Iztapa"],"Huehuetenango":["Huehuetenango","Chiantla","Cuilco","Jacaltenango","San Pedro Soloma","Todos Santos","Barillas"],"Izabal":["Puerto Barrios","Livingston","El Estor","Morales"],"Jalapa":["Jalapa","San Pedro Pinula","Monjas","Mataquescuintla"],"Jutiapa":["Jutiapa","Santa Catarina Mita","Asunción Mita","Jalpatagua","Moyuta"],"Petén":["Flores","San Benito","San Andrés","La Libertad","Dolores","San Luis","Sayaxché","Poptún"],"Quetzaltenango":["Quetzaltenango","Salcajá","Ostuncalco","Almolonga","Cantel","Zunil","Coatepeque"],"Quiché":["Santa Cruz del Quiché","Chichicastenango","Cunén","Nebaj","Sacapulas","Uspantán","Ixcán"],"Retalhuleu":["Retalhuleu","San Sebastián","San Martín Zapotitlán","Champerico"],"Sacatepéquez":["Antigua Guatemala","Jocotenango","Sumpango","San Lucas Sacatepéquez","Ciudad Vieja"],"San Marcos":["San Marcos","Comitancillo","Tacaná","Tajumulco","Malacatán","Catarina","Ayutla"],"Santa Rosa":["Cuilapa","Barberena","Casillas","Chiquimulilla","Taxisco"],"Sololá":["Sololá","Nahualá","Panajachel","San Lucas Tolimán","Santiago Atitlán"],"Suchitepéquez":["Mazatenango","Cuyotenango","Santo Domingo Suchitepéquez","Chicacao"],"Totonicapán":["Totonicapán","San Cristóbal Totonicapán","San Francisco El Alto","Momostenango"],"Zacapa":["Zacapa","Estanzuela","Río Hondo","Gualán","Teculután"]};
function Empty({icon,msg,action,onAction}){return <div style={{...S.card,textAlign:"center",padding:40,color:T.sub}}><div style={{fontSize:32,marginBottom:10}}>{icon}</div><div>{msg}</div>{action&&<button onClick={onAction} style={{...S.btn("primary"),marginTop:14,fontSize:12}}>{action}</button>}</div>;}
function Fld({label,children,span2}){return <div style={span2?{gridColumn:"span 2"}:{}}><label style={S.lbl}>{label}</label>{children}</div>;}
function Spinner(){return <div style={{textAlign:"center",padding:36,color:T.sub}}>⏳ Cargando...</div>;}
function Toast({msg,type}){if(!msg)return null;const c=type==="ok"?T.acc:T.red;return <div style={{background:T.card,border:`1px solid ${c}`,borderRadius:10,padding:"11px 18px",fontSize:13,color:c,fontWeight:600,marginBottom:14}}>{type==="ok"?"✅":"❌"} {msg}</div>;}
function Badge({color,bg,label,small}){return <span style={{display:"inline-block",padding:small?"2px 7px":"3px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:600,color,background:bg}}>{label}</span>;}
async function dbDel(t,id){try{await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});}catch{}}
async function dbUpd(t,id,d){try{const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbIns(t,d){try{const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,Prefer:"return=representation"},body:JSON.stringify(d)});return r.json();}catch{return null;}}
async function dbGet(t,q=""){try{const r=await fetch(`${SB}/rest/v1/${t}?order=created_at.desc${q}`,{headers:H});return r.json();}catch{return[];}}
const S={card:{background:T.card,border:`1px solid ${T.bord}`,borderRadius:14,padding:18},lbl:{fontSize:11,color:T.mut,display:"block",marginBottom:4,fontWeight:600},inp:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},sel:{width:"100%",background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:13,outline:"none",boxSizing:"border-box"},btn:v=>({padding:"8px 14px",borderRadius:8,border:v==="ghost"?`1px solid ${T.bord}`:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:v==="primary"?T.acc:v==="danger"?T.red:v==="blue"?T.blue:v==="purple"?T.purple:v==="green"?T.green:v==="warn"?T.sec:T.card,color:v==="primary"||v==="green"?"#0A0F1E":T.txt}),div:{borderTop:`1px solid ${T.bord}`,margin:"12px 0"},th:{textAlign:"left",fontSize:11,color:T.mut,padding:"6px 10px",fontWeight:600,background:T.surf},td:{padding:"9px 10px",borderTop:`1px solid ${T.bord}22`,fontSize:13},srow:b=>({display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:b?14:13,fontWeight:b?700:400,color:b?T.txt:T.sub})};
const today=()=>new Date().toISOString().slice(0,10);
};
  }catch{return String(s);}
    return d.toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});
    if(!d||isNaN(d.getTime()))return s;
    else{d=new Date(s);}
    else if(typeof s==="string"&&s.match(/^\d{4}-\d{2}-\d{2}$/)){d=new Date(s+"T12:00:00");}
    else if(typeof s==="string"&&s.includes("T")){d=new Date(s);}
    if(s instanceof Date){d=s;}
    let d;
  try{
  if(!s||s==="Invalid Date"||s==="null"||s==="undefined")return"—";
const fmtD=s=>{

const fmt=n=>new Intl.NumberFormat("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
const T={bg:"#0A0F1E",surf:"#111827",card:"#162032",bord:"#1E3A5F",acc:"#00D4AA",accDim:"#00D4AA22",sec:"#F59E0B",secDim:"#F59E0B22",red:"#EF4444",redDim:"#EF444422",blue:"#3B82F6",blueDim:"#3B82F622",purple:"#A855F7",purpleDim:"#A855F722",green:"#22C55E",greenDim:"#22C55E22",txt:"#F1F5F9",mut:"#64748B",sub:"#94A3B8"};
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json"};
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const SB="https://fmijbpatkddkbxlkfoza.supabase.co";
const LOGO_B64="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";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import React, { useState, useEffect, useRef } from "react";
/** @jsx React.createElement */
/** @jsxRuntime classic */


