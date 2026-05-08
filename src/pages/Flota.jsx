import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageFlota({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",propietario:"propio",placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["Sed├ín","SUV","Pickup","Van","Microb├║s","Bus"];
  const load=async()=>{setLoading(true);const d=await dbGet("vehiculos","&order=codigo.asc,marca.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const abrirEditar=v=>{setF({codigo:v.codigo||'',propietario:v.propietario||'propio',placa:v.placa||"",marca:v.marca||"",modelo:v.modelo||"",anio:v.anio||new Date().getFullYear(),tipo:v.tipo||"SUV",estado:v.estado||"disponible",km_actual:v.km_actual||0});setEditItem(v);setVista("form");};
  const abrirNuevo=()=>{setF({placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});setEditItem(null);setVista("form");};
  const guardar=async()=>{
    if(!f.placa.trim()){showToast("Placa requerida","err");return;}
    setSaving(true);
    const p={...f,empresa_id:empId,anio:parseInt(f.anio)||new Date().getFullYear(),km_actual:parseInt(f.km_actual)||0};
    if(editItem?.id) await dbUpd("vehiculos",editItem.id,p);
    else await dbIns("vehiculos",p);
    showToast("Guardado Ô£ö");setSaving(false);setVista("lista");setEditItem(null);load();
  };
  const del=async id=>{if(!confirm("┬┐Eliminar veh├¡culo?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast("Estado actualizado");load();};
  const disp=rows.filter(r=>r.estado==="disponible").length;
  const rent=rows.filter(r=>r.estado==="rentado").length;
  const mant=rows.filter(r=>r.estado==="mantenimiento").length;
  if(vista==="form")return(
    <div style={{maxWidth:580}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Registrar"} veh├¡culo</div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
      </div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="C├ôDIGO VEH├ìCULO"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001P"/></Fld>
        <Fld label="PROPIETARIO">
          <select style={S.sel} value={f.propietario} onChange={e=>sf("propietario",e.target.value)}>
            <option value="propio">­ƒÅó Propio (P)</option>
            <option value="socio">­ƒñØ Socio (A)</option>
            <option value="alquilado">­ƒöæ Alquilado</option>
          </select>
        </Fld>
        <Fld label="PLACA"><input style={S.inp} value={f.placa} onChange={e=>sf("placa",e.target.value.toUpperCase())} placeholder="P-000-ABC"/></Fld>
        <Fld label="A├æO"><input style={S.inp} type="number" value={f.anio} onChange={e=>sf("anio",e.target.value)}/></Fld>
        <Fld label="MARCA"><input style={S.inp} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Toyota"/></Fld>
        <Fld label="MODELO"><input style={S.inp} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="RAV4"/></Fld>
        <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
        <Fld label="ESTADO">
          <select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
            <option value="disponible">Ô£à Disponible</option>
            <option value="rentado">­ƒöÁ Rentado</option>
            <option value="mantenimiento">­ƒƒí Mantenimiento</option>
          </select>
        </Fld>
        <Fld label="KILOMETRAJE ACTUAL" span2><input style={S.inp} type="number" value={f.km_actual} onChange={e=>sf("km_actual",e.target.value)} placeholder="0"/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Disponibles",v:disp,c:T.acc,bg:T.accDim},{l:"Rentados",v:rent,c:T.blue,bg:T.blueDim},{l:"Mantenimiento",v:mant,c:T.sec,bg:T.secDim}].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:"1px solid "+s.c+"44",borderRadius:12,padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:12,color:T.sub}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} veh├¡culos)</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>Ôå║</button>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar veh├¡culo</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒÜù" msg="Sin veh├¡culos registrados" action="+ Registrar" onAction={abrirNuevo}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["C├│digo","Veh├¡culo","Placa","Tipo","Km","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(v=>{
                const e=EST_VEH[v.estado]||EST_VEH.disponible;
                return(
                  <tr key={v.id}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>
                      {v.codigo||"ÔÇö"}
                      {v.propietario&&<div style={{fontSize:9,color:T.mut}}>{v.propietario==="propio"?"­ƒÅó Propio":v.propietario==="socio"?"­ƒñØ Socio":"­ƒöæ Alq."}</div>}
                    </td>
                    <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:T.sub,fontSize:11}}>{v.placa}</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span></td>
                    <td style={S.td}>
                      <select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={ev=>chEst(v.id,ev.target.value)}>
                        <option value="disponible">Ô£à Disponible</option>
                        <option value="rentado">­ƒöÁ Rentado</option>
                        <option value="mantenimiento">­ƒƒí Mantenimiento</option>
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>abrirEditar(v)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                        <button onClick={()=>del(v.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
                      </div>
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


// ÔöÇÔöÇ Vista Calendario de Reservas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
function CalendarioReservas({rows,onNewReserva,onEdit}){
  const [mes,setMes]=useState(new Date());
  const DIAS=["Lun","Mar","Mi├®","Jue","Vie","S├íb","Dom"];
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const EST_C={pendiente:"#64748B",confirmada:"#00D4AA",en_curso:"#3B82F6",completada:"#22C55E",cancelada:"#EF4444"};

  const year=mes.getFullYear();
  const month=mes.getMonth();
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  // Start from Monday
  let startDow=firstDay.getDay(); // 0=Sun
  startDow=startDow===0?6:startDow-1; // convert to Mon=0
  const totalCells=Math.ceil((startDow+lastDay.getDate())/7)*7;

  const getReservasForDay=(day)=>{
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return rows.filter(r=>{
      if(!r.fecha_inicio) return false;
      const fi=r.fecha_inicio.slice(0,10);
      const ff=r.fecha_fin?r.fecha_fin.slice(0,10):fi;
      return fi<=dateStr && dateStr<=ff;
    });
  };

  const cells=[];
  for(let i=0;i<totalCells;i++){
    const dayNum=i-startDow+1;
    const isValid=dayNum>=1&&dayNum<=lastDay.getDate();
    const isToday=isValid&&new Date().toDateString()===new Date(year,month,dayNum).toDateString();
    const dayReservas=isValid?getReservasForDay(dayNum):[];
    cells.push({dayNum,isValid,isToday,dayReservas});
  }

  return(
    <div style={S.card}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setMes(new Date(year,month-1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ╣</button>
        <div style={{fontSize:16,fontWeight:700}}>{MESES[month]} {year}</div>
        <button onClick={()=>setMes(new Date(year,month+1,1))} style={{...S.btn("ghost"),padding:"4px 12px"}}>ÔÇ║</button>
      </div>
      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
        {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#64748B",padding:"4px 0"}}>{d}</div>)}
      </div>
      {/* Calendar cells */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((cell,idx)=>(
          <div key={idx} style={{minHeight:80,background:cell.isToday?T.accDim:cell.isValid?T.surf:"transparent",borderRadius:6,padding:4,border:cell.isToday?"1px solid "+T.acc:"1px solid transparent"}}>
            {cell.isValid&&(
              <>
                <div style={{fontSize:12,fontWeight:cell.isToday?700:400,color:cell.isToday?T.acc:T.sub,marginBottom:3}}>{cell.dayNum}</div>
                {cell.dayReservas.slice(0,3).map(r=>(
                  <div key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{fontSize:9,fontWeight:600,background:(EST_C[r.estado]||"#64748B")+"33",color:EST_C[r.estado]||"#64748B",borderLeft:"2px solid "+(EST_C[r.estado]||"#64748B"),padding:"1px 4px",borderRadius:2,marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={r.cliente_nombre+" ÔÇö "+r.vehiculo_nombre}>
                    {r.cliente_nombre?.split(" ")[0]} {r.vehiculo_nombre?.split(" ")[0]||""}
                  </div>
                ))}
                {cell.dayReservas.length>3&&<div style={{fontSize:9,color:T.mut}}>+{cell.dayReservas.length-3} m├ís</div>}
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>
        {[["Pendiente","#64748B"],["Confirmada","#00D4AA"],["En curso","#3B82F6"],["Completada","#22C55E"],["Cancelada","#EF4444"]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
            <div style={{width:10,height:10,borderRadius:2,background:c+"44",border:"1px solid "+c}}/>
            <span style={{color:T.sub}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


