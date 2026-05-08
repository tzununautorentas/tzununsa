import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
export default function PageMantenimiento({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [vehiculos,setVehiculos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [saving,setSaving]=useState(false);

  const [exportar,setExportar]=useState(false);  const EMPTY={vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""};
  const [f,setF]=useState({...EMPTY});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const TIPOS=["preventivo","correctivo","aceite","llantas","frenos","electricidad","carrocería","lavado","otro"];
  const load=async()=>{
    setLoading(true);
    const [m,v]=await Promise.all([dbGet("mantenimientos",""),dbGet("vehiculos","")]);
    setRows(Array.isArray(m)?m:[]);
    setVehiculos(Array.isArray(v)?v:[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const abrirNuevo=()=>{setEditItem(null);setF({...EMPTY});setShowForm(true);};
  const abrirEditar=item=>{setEditItem(item);setF({...item,fecha_entrada:item.fecha_entrada?.slice(0,10)||today(),fecha_salida:item.fecha_salida?.slice(0,10)||""});setShowForm(true);};
  const guardar=async()=>{
    if(!f.vehiculo_nombre){showToast("Selecciona un vehículo","err");return;}
    if(!f.descripcion.trim()){showToast("Ingresa la descripción del trabajo","err");return;}
    setSaving(true);
    try{
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
      const payload={
        empresa_id:empId,
        vehiculo_id:f.vehiculo_id||null,
        vehiculo_nombre:f.vehiculo_nombre,
        tipo:f.tipo||"preventivo",
        descripcion:f.descripcion,
        km_entrada:parseInt(f.km_entrada)||0,
        km_salida:parseInt(f.km_salida)||0,
        costo:parseFloat(f.costo)||0,
        proveedor:f.proveedor||"",
        fecha_entrada:f.fecha_entrada||today(),
        fecha_salida:f.fecha_salida||null,
        estado:f.estado||"en_proceso",
        notas:f.notas||"",
      };
      let result;
      if(editItem?.id){
        result=await dbUpd("mantenimientos",editItem.id,payload);
        if(parseInt(f.km_salida)>0&&f.vehiculo_id)await dbUpd("vehiculos",f.vehiculo_id,{km_actual:parseInt(f.km_salida)});
      }else{
        result=await dbIns("mantenimientos",payload);
        if(result&&!result.error&&f.vehiculo_id)await dbUpd("vehiculos",f.vehiculo_id,{estado:"mantenimiento"});
      }
      if(result&&result.error){showToast("Error: "+result.error,"err");setSaving(false);return;}
      showToast("Guardado correctamente ✔");setSaving(false);setShowForm(false);setEditItem(null);
      setF({vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""});
      load();
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
  };
  const terminar=async item=>{
    await dbUpd("mantenimientos",item.id,{estado:"completado",fecha_salida:today()});
    if(item.vehiculo_id) await dbUpd("vehiculos",item.vehiculo_id,{estado:"disponible"});
    showToast("Completado ✔ — vehículo disponible");load();
  };
  const del=async id=>{if(!confirm("┬┐Eliminar?"))return;await dbDel("mantenimientos",id);showToast("Eliminado");load();};
  const necesitaMant=veh=>{
    const ultimoKm=rows.filter(r=>r.vehiculo_id===veh.id&&r.estado==="completado").reduce((max,r)=>Math.max(max,r.km_salida||0),0);
    return(veh.km_actual||0)-ultimoKm>=5000;
  };
  const alertas=vehiculos.filter(necesitaMant);
  const totalCosto=rows.reduce((s,r)=>s+(parseFloat(r.costo)||0),0);
  return(
    <div>
      {exportar&&<ModalExportar titulo="Mantenimiento de Vehículos" datos={rows} campos={[{label:"Vehículo",key:"vehiculo_nombre"},{label:"Tipo",key:"tipo"},{label:"Descripción",key:"descripcion"},{label:"KM Entrada",key:"km_entrada"},{label:"KM Salida",key:"km_salida"},{label:"Costo",key:"costo"},{label:"Proveedor",key:"proveedor"},{label:"Fecha Entrada",key:"fecha_entrada"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      {alertas.length>0&&(
        <div style={{background:T.redDim,border:"1px solid "+T.red+"44",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:6}}>­ƒö┤ Requieren mantenimiento (ÔëÑ5,000 km desde último servicio)</div>
          {alertas.map(v=><div key={v.id} style={{fontSize:12,color:T.txt}}>ÔÇó {v.marca} {v.modelo} ({v.placa}) — {(v.km_actual||0).toLocaleString()} km</div>)}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Total registros",v:rows.length,c:T.acc},{l:"En proceso",v:rows.filter(r=>r.estado==="en_proceso").length,c:T.sec},{l:"Completados",v:rows.filter(r=>r.estado==="completado").length,c:T.acc},{l:"Costo total",v:"Q "+fmt(totalCosto),c:T.red}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:i===3?13:22,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:14}}>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>↺</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
        <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar mantenimiento</button>
      </div>
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar":"Nuevo"} registro de mantenimiento</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="VEH├ìCULO" span2>
              <select style={S.sel} value={f.vehiculo_id} onChange={e=>{const v=vehiculos.find(x=>x.id===e.target.value);sf("vehiculo_id",e.target.value);sf("vehiculo_nombre",v?v.marca+" "+v.modelo+" ("+v.placa+")":"");if(v)sf("km_entrada",v.km_actual||0);}}>
                <option value="">Seleccionar vehículo...</option>
                {vehiculos.map(v=><option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa} · {(v.km_actual||0).toLocaleString()} km</option>)}
              </select>
            </Fld>
            <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></Fld>
            <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="en_proceso">🔧 En proceso</option><option value="completado">✅ Completado</option></select></Fld>
            <Fld label="DESCRIPCIÓN DEL TRABAJO" span2><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y filtro de aire..."/></Fld>
            <Fld label="KM AL ENTRAR"><input style={S.inp} type="number" value={f.km_entrada} onChange={e=>sf("km_entrada",e.target.value)}/></Fld>
            <Fld label="KM AL SALIR"><input style={S.inp} type="number" value={f.km_salida} onChange={e=>sf("km_salida",e.target.value)} placeholder="Al terminar"/></Fld>
            <Fld label="COSTO (GTQ)"><input style={S.inp} type="number" step="0.01" value={f.costo} onChange={e=>sf("costo",e.target.value)} placeholder="0.00"/></Fld>
            <Fld label="TALLER / PROVEEDOR"><input style={S.inp} value={f.proveedor} onChange={e=>sf("proveedor",e.target.value)} placeholder="Nombre del taller"/></Fld>
            <Fld label="FECHA ENTRADA"><input style={S.inp} type="date" value={f.fecha_entrada} onChange={e=>sf("fecha_entrada",e.target.value)}/></Fld>
            <Fld label="FECHA SALIDA"><input style={S.inp} type="date" value={f.fecha_salida} onChange={e=>sf("fecha_salida",e.target.value)}/></Fld>
            <Fld label="NOTAS" span2><input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/></Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
              <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"Guardando...":"­ƒÆ¥ Guardar"}</button>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {loading?<Spinner/>:rows.length===0?<Empty icon="🔧" msg="Sin registros de mantenimiento" action="+ Registrar" onAction={abrirNuevo}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rows.map(r=>{
            const veh=vehiculos.find(v=>v.id===r.vehiculo_id);
            const kmAct=veh?.km_actual||0;
            const kmDesde=r.estado==="completado"?kmAct-(r.km_salida||0):0;
            const alerta=kmDesde>=5000;
            return(
              <div key={r.id} style={{...S.card,borderLeft:"3px solid "+(r.estado==="completado"?T.acc:T.sec)}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.vehiculo_nombre}</div>
                    <div style={{fontSize:12,color:T.sub,marginTop:2}}>🔧 {r.tipo} · {r.proveedor||"Sin taller"} · {fmtD(r.fecha_entrada)}</div>
                    <div style={{fontSize:12,color:T.txt,marginTop:4}}>{r.descripcion}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:r.estado==="completado"?T.acc:T.sec,background:r.estado==="completado"?T.accDim:T.secDim}}>{r.estado==="completado"?"✅ Completado":"🔧 En proceso"}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.red,marginTop:4}}>Q {fmt(r.costo)}</div>
                    <div style={{fontSize:11,color:T.sub}}>KM entrada: {(r.km_entrada||0).toLocaleString()}{r.km_salida>0?" · Salida: "+(r.km_salida).toLocaleString():""}</div>
                    {alerta&&<div style={{fontSize:10,fontWeight:700,color:T.red,marginTop:2}}>­ƒö┤ +{kmDesde.toLocaleString()} km — necesita mantenimiento</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {r.estado==="en_proceso"&&<button onClick={()=>terminar(r)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>✅ Marcar completado</button>}
                  <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>Ô£Å´©Å Editar</button>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 12px"}}>­ƒùæ´©Å</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// MÓDULO: CONTABILIDAD — Catálogo de Cuentas + Diarios Manuales
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

// ÔöÇÔöÇ Catálogo de Cuentas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const CUENTAS_DEFAULT=[
  {codigo:"1",   nombre:"ACTIVOS",                   tipo:"activo",  nivel:1},
  {codigo:"1.1", nombre:"Activo Corriente",           tipo:"activo",  nivel:2},
  {codigo:"1101",nombre:"Caja",                       tipo:"activo",  nivel:3},
  {codigo:"1102",nombre:"Banco Industrial GTQ",       tipo:"activo",  nivel:3},
  {codigo:"1103",nombre:"Banrural GTQ",               tipo:"activo",  nivel:3},
  {codigo:"1104",nombre:"Cuentas por Cobrar Clientes",tipo:"activo",  nivel:3},
  {codigo:"1105",nombre:"Anticipos Recibidos",        tipo:"activo",  nivel:3},
  {codigo:"1106",nombre:"IVA Crédito Fiscal",         tipo:"activo",  nivel:3},
  {codigo:"1.2", nombre:"Activo No Corriente",        tipo:"activo",  nivel:2},
  {codigo:"1201",nombre:"Vehículos",                  tipo:"activo",  nivel:3},
  {codigo:"1202",nombre:"Depreciación Acumulada Veh.",tipo:"activo",  nivel:3},
  {codigo:"2",   nombre:"PASIVOS",                    tipo:"pasivo",  nivel:1},
  {codigo:"2.1", nombre:"Pasivo Corriente",           tipo:"pasivo",  nivel:2},
  {codigo:"2101",nombre:"Cuentas por Pagar Proveed.", tipo:"pasivo",  nivel:3},
  {codigo:"2102",nombre:"IVA por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2103",nombre:"ISR por Pagar",              tipo:"pasivo",  nivel:3},
  {codigo:"2104",nombre:"IGSS por Pagar",             tipo:"pasivo",  nivel:3},
  {codigo:"3",   nombre:"PATRIMONIO",                 tipo:"capital", nivel:1},
  {codigo:"3101",nombre:"Capital Social",             tipo:"capital", nivel:3},
  {codigo:"3102",nombre:"Utilidades Retenidas",       tipo:"capital", nivel:3},
  {codigo:"4",   nombre:"INGRESOS",                   tipo:"ingreso", nivel:1},
  {codigo:"4101",nombre:"Ingresos por Renta Vehículos",tipo:"ingreso",nivel:3},
  {codigo:"4102",nombre:"Ingresos por Traslados",     tipo:"ingreso", nivel:3},
  {codigo:"4103",nombre:"Otros Ingresos",             tipo:"ingreso", nivel:3},
  {codigo:"5",   nombre:"GASTOS",                     tipo:"gasto",   nivel:1},
  {codigo:"5.1", nombre:"Gastos de Operación",        tipo:"gasto",   nivel:2},
  {codigo:"5101",nombre:"Combustible",                tipo:"gasto",   nivel:3},
  {codigo:"5102",nombre:"Mantenimiento y Reparación", tipo:"gasto",   nivel:3},
  {codigo:"5103",nombre:"Seguros de Vehículos",       tipo:"gasto",   nivel:3},
  {codigo:"5104",nombre:"Salarios y Prestaciones",    tipo:"gasto",   nivel:3},
  {codigo:"5105",nombre:"Depreciación Vehículos",     tipo:"gasto",   nivel:3},
  {codigo:"5106",nombre:"Llantas y Repuestos",        tipo:"gasto",   nivel:3},
  {codigo:"5107",nombre:"Hospedaje Pilotos",          tipo:"gasto",   nivel:3},
  {codigo:"5108",nombre:"Alimentación",               tipo:"gasto",   nivel:3},
  {codigo:"5109",nombre:"Peajes",                     tipo:"gasto",   nivel:3},
  {codigo:"5110",nombre:"Impuestos y Licencias",      tipo:"gasto",   nivel:3},
  {codigo:"5111",nombre:"Servicios Públicos",         tipo:"gasto",   nivel:3},
  {codigo:"5112",nombre:"Gastos de Oficina",          tipo:"gasto",   nivel:3},
];

const TIPO_COLOR={activo:T.blue,pasivo:T.red,capital:T.purple,ingreso:T.acc,gasto:T.sec};


