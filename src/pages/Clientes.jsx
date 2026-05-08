import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageClientes({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,setF]=useState({codigo:"",nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("clientes","&order=codigo.asc,nombre.asc");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const abrirEditar=c=>{setF({codigo:c.codigo||'',nombre:c.nombre||"",tipo:c.tipo||"empresa",nit:c.nit||"",direccion:c.direccion||"",telefono:c.telefono||"",email:c.email||""});setEditItem(c);setVista("form");};
  const abrirNuevo=()=>{setF({nombre:"",tipo:"empresa",nit:"",direccion:"",telefono:"",email:""});setEditItem(null);setVista("form");};
  const guardar=async()=>{
    if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}
    setSaving(true);
    const p={...f,empresa_id:empId};
    if(editItem?.id) await dbUpd("clientes",editItem.id,p);
    else await dbIns("clientes",p);
    showToast("Guardado Ô£ö");setSaving(false);setVista("lista");setEditItem(null);load();
  };
  const del=async id=>{if(!confirm("┬┐Eliminar cliente?"))return;await dbDel("clientes",id);showToast("Eliminado");load();};
  const TC={empresa:{c:T.sec,bg:T.secDim,l:"Empresa"},gobierno:{c:T.blue,bg:T.blueDim,l:"Gobierno/ONG"},persona:{c:T.acc,bg:T.accDim,l:"Persona"}};
  if(vista==="form")return(
    <div style={{maxWidth:600}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>{editItem?"Editar":"Nuevo"} cliente</div>
        <button onClick={()=>{setVista("lista");setEditItem(null);}} style={S.btn("ghost")}>ÔåÉ Volver</button>
      </div>
      <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label="C├ôDIGO DE CLIENTE"><input style={{...S.inp,fontFamily:"monospace",fontWeight:700}} value={f.codigo} onChange={e=>sf("codigo",e.target.value.toUpperCase())} placeholder="001"/></Fld>
        <Fld label="NOMBRE / RAZ├ôN SOCIAL"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Nombre completo"/></Fld>
        <Fld label="TIPO DE CLIENTE">
          <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
            <option value="empresa">Empresa</option>
            <option value="gobierno">Gobierno / ONG</option>
            <option value="persona">Persona natural</option>
          </select>
        </Fld>
        <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
        <Fld label="TEL├ëFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)} placeholder="(502) 0000-0000"/></Fld>
        <Fld label="CORREO ELECTR├ôNICO"><input style={S.inp} type="email" value={f.email} onChange={e=>sf("email",e.target.value)} placeholder="correo@empresa.com"/></Fld>
        <Fld label="DIRECCI├ôN" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)} placeholder="Direcci├│n completa"/></Fld>
        <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar cliente"}</button>
          <button onClick={()=>{setVista("lista");setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700}}>Directorio de Clientes ({rows.length})</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>Ôå║</button>
          <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo cliente</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒæÑ" msg="Sin clientes registrados" action="+ Agregar cliente" onAction={abrirNuevo}/>:(
        <div style={S.card}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["C├│digo","Cliente","Tipo","NIT","Tel├®fono",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(c=>{
                const tc=TC[c.tipo]||TC.empresa;
                return(
                  <tr key={c.id}>
                    <td style={{...S.td,fontFamily:"monospace",fontWeight:700,color:T.acc,fontSize:12}}>{c.codigo||"ÔÇö"}</td>
                    <td style={{...S.td,fontWeight:600}}>{c.nombre}</td>
                    <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,color:tc.c,background:tc.bg}}>{tc.l}</span></td>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"ÔÇö"}</td>
                    <td style={{...S.td,color:T.sub}}>{c.telefono||"ÔÇö"}</td>
                    <td style={S.td}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>abrirEditar(c)} style={{...S.btn("ghost"),padding:"3px 9px",fontSize:11}}>Ô£Å´©Å</button>
                        <button onClick={()=>del(c.id)} style={{...S.btn("danger"),padding:"3px 9px",fontSize:11}}>­ƒùæ´©Å</button>
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

