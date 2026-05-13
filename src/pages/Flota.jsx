import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, EST_VEH, EST_FAC, FLUJO_RES, RUTAS, LOGO_B64, CAT_GASTO } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
export default function PageFlota({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",propietario:"propio",placa:"",marca:"",modelo:"",anio:new Date().getFullYear(),tipo:"SUV",estado:"disponible",km_actual:0});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["Sedán","SUV","Pickup","Van","Microbús","Bus"];
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
    showToast("Guardado ✔");setSaving(false);setVista("lista");setEditItem(null);load();
  };
  const del=async id=>{if(!confirm("┬┐Eliminar vehículo?"))return;await dbDel("vehiculos",id);showToast("Eliminado");load();};
  const chEst=async(id,estado)=>{await dbUpd("vehiculos",id,{estado});showToast("Estado actualizado");load();};
  const disp=rows.filter(r=>r.estado==="disponible").length;
  const rent=rows.filter(r=>r.estado==="rentado").length;
  const mant=rows.filter(r=>r.estado==="mantenimiento").length;
  if(vista==="form")return(
    <div style={{maxWidth:580}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Registrar"} vehículo</div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
      </div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="CÓDIGO VEH├ìCULO"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001P"/></Fld>
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
            <option value="disponible">✅ Disponible</option>
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
        <div style={{fontSize:14,fontWeight:700}}>Flota ({rows.length} vehículos)</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar vehículo</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="🚗" msg="Sin vehículos registrados" action="+ Registrar" onAction={abrirNuevo}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Código","Vehículo","Placa","Tipo","Km","Estado","Cambiar estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(v=>{
                const e=EST_VEH[v.estado]||EST_VEH.disponible;
                return(
                  <tr key={v.id}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>
                      {v.codigo||"—"}
                      {v.propietario&&<div style={{fontSize:9,color:T.mut}}>{v.propietario==="propio"?"­ƒÅó Propio":v.propietario==="socio"?"­ƒñØ Socio":"­ƒöæ Alq."}</div>}
                    </td>
                    <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:T.sub,fontSize:11}}>{v.placa}</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span></td>
                    <td style={S.td}>
                      <select style={{...S.sel,padding:"4px 8px",fontSize:11,width:"auto"}} value={v.estado} onChange={ev=>chEst(v.id,ev.target.value)}>
                        <option value="disponible">✅ Disponible</option>
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

