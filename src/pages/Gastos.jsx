import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageGastos({showToast,empId}){
  const [tab,setTab]=useState("gastos");const [proveedores,setProveedores]=useState([]);
  useEffect(()=>{dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));},[]);
  const reloadProv=()=>dbGet("proveedores","").then(d=>setProveedores(Array.isArray(d)?d:[]));
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
        {[{id:"gastos",l:"­ƒÆ© Gastos y Compras"},{id:"proveedores",l:"­ƒÅ¬ Proveedores"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
      </div>
      {tab==="gastos"&&<ModGastos empId={empId} proveedores={proveedores} showToast={showToast}/>}
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={(m,tp)=>{showToast(m,tp);reloadProv();}}/>}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ REPORTES PAGE ÔòÉÔòÉÔòÉ
