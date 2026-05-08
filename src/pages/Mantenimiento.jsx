import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
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
  const TIPOS=["preventivo","correctivo","aceite","llantas","frenos","electricidad","carrocer├¡a","lavado","otro"];
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
    if(!f.vehiculo_nombre){showToast("Selecciona un veh├¡culo","err");return;}
    if(!f.descripcion.trim()){showToast("Ingresa la descripci├│n del trabajo","err");return;}
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
      showToast("Guardado correctamente Ô£ö");setSaving(false);setShowForm(false);setEditItem(null);
      setF({vehiculo_id:"",vehiculo_nombre:"",tipo:"preventivo",descripcion:"",km_entrada:0,km_salida:0,costo:0,proveedor:"",fecha_entrada:today(),fecha_salida:"",estado:"en_proceso",notas:""});
      load();
    }catch(e){showToast("Error: "+e.message,"err");setSaving(false);}
  };
  const terminar=async item=>{
    await dbUpd("mantenimientos",item.id,{estado:"completado",fecha_salida:today()});
    if(item.vehiculo_id) await dbUpd("vehiculos",item.vehiculo_id,{estado:"disponible"});
    showToast("Completado Ô£ö ÔÇö veh├¡culo disponible");load();
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
      {exportar&&<ModalExportar titulo="Mantenimiento de Veh├¡culos" datos={rows} campos={[{label:"Veh├¡culo",key:"vehiculo_nombre"},{label:"Tipo",key:"tipo"},{label:"Descripci├│n",key:"descripcion"},{label:"KM Entrada",key:"km_entrada"},{label:"KM Salida",key:"km_salida"},{label:"Costo",key:"costo"},{label:"Proveedor",key:"proveedor"},{label:"Fecha Entrada",key:"fecha_entrada"},{label:"Estado",key:"estado"}]} onClose={()=>setExportar(false)}/>}
      {alertas.length>0&&(
        <div style={{background:T.redDim,border:"1px solid "+T.red+"44",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:6}}>­ƒö┤ Requieren mantenimiento (ÔëÑ5,000 km desde ├║ltimo servicio)</div>
          {alertas.map(v=><div key={v.id} style={{fontSize:12,color:T.txt}}>ÔÇó {v.marca} {v.modelo} ({v.placa}) ÔÇö {(v.km_actual||0).toLocaleString()} km</div>)}
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
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>Ôå║</button>
        <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:12}}>­ƒôñ Exportar</button>
        <button onClick={abrirNuevo} style={{...S.btn("primary"),fontSize:12}}>+ Registrar mantenimiento</button>
      </div>
      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editItem?"Editar":"Nuevo"} registro de mantenimiento</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="VEH├ìCULO" span2>
              <select style={S.sel} value={f.vehiculo_id} onChange={e=>{const v=vehiculos.find(x=>x.id===e.target.value);sf("vehiculo_id",e.target.value);sf("vehiculo_nombre",v?v.marca+" "+v.modelo+" ("+v.placa+")":"");if(v)sf("km_entrada",v.km_actual||0);}}>
                <option value="">Seleccionar veh├¡culo...</option>
                {vehiculos.map(v=><option key={v.id} value={v.id}>{v.marca} {v.modelo} ÔÇö {v.placa} ┬À {(v.km_actual||0).toLocaleString()} km</option>)}
              </select>
            </Fld>
            <Fld label="TIPO"><select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>{TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></Fld>
            <Fld label="ESTADO"><select style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}><option value="en_proceso">­ƒöº En proceso</option><option value="completado">Ô£à Completado</option></select></Fld>
            <Fld label="DESCRIPCI├ôN DEL TRABAJO" span2><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y filtro de aire..."/></Fld>
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
      {loading?<Spinner/>:rows.length===0?<Empty icon="­ƒöº" msg="Sin registros de mantenimiento" action="+ Registrar" onAction={abrirNuevo}/>:(
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
                    <div style={{fontSize:12,color:T.sub,marginTop:2}}>­ƒöº {r.tipo} ┬À {r.proveedor||"Sin taller"} ┬À {fmtD(r.fecha_entrada)}</div>
                    <div style={{fontSize:12,color:T.txt,marginTop:4}}>{r.descripcion}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:r.estado==="completado"?T.acc:T.sec,background:r.estado==="completado"?T.accDim:T.secDim}}>{r.estado==="completado"?"Ô£à Completado":"­ƒöº En proceso"}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.red,marginTop:4}}>Q {fmt(r.costo)}</div>
                    <div style={{fontSize:11,color:T.sub}}>KM entrada: {(r.km_entrada||0).toLocaleString()}{r.km_salida>0?" ┬À Salida: "+(r.km_salida).toLocaleString():""}</div>
                    {alerta&&<div style={{fontSize:10,fontWeight:700,color:T.red,marginTop:2}}>­ƒö┤ +{kmDesde.toLocaleString()} km ÔÇö necesita mantenimiento</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {r.estado==="en_proceso"&&<button onClick={()=>terminar(r)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>Ô£à Marcar completado</button>}
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
// M├ôDULO: CONTABILIDAD ÔÇö Cat├ílogo de Cuentas + Diarios Manuales
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

// ÔöÇÔöÇ Cat├ílogo de Cuentas ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const CUENTAS_DEFAULT=[
  {codigo:"1",   nombre:"ACTIVOS",                   tipo:"activo",  nivel:1},
  {codigo:"1.1", nombre:"Activo Corriente",           tipo:"activo",  nivel:2},
  {codigo:"1101",nombre:"Caja",                       tipo:"activo",  nivel:3},
  {codigo:"1102",nombre:"Banco Industrial GTQ",       tipo:"activo",  nivel:3},
  {codigo:"1103",nombre:"Banrural GTQ",               tipo:"activo",  nivel:3},
  {codigo:"1104",nombre:"Cuentas por Cobrar Clientes",tipo:"activo",  nivel:3},
  {codigo:"1105",nombre:"Anticipos Recibidos",        tipo:"activo",  nivel:3},
  {codigo:"1106",nombre:"IVA Cr├®dito Fiscal",         tipo:"activo",  nivel:3},
  {codigo:"1.2", nombre:"Activo No Corriente",        tipo:"activo",  nivel:2},
  {codigo:"1201",nombre:"Veh├¡culos",                  tipo:"activo",  nivel:3},
  {codigo:"1202",nombre:"Depreciaci├│n Acumulada Veh.",tipo:"activo",  nivel:3},
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
  {codigo:"4101",nombre:"Ingresos por Renta Veh├¡culos",tipo:"ingreso",nivel:3},
  {codigo:"4102",nombre:"Ingresos por Traslados",     tipo:"ingreso", nivel:3},
  {codigo:"4103",nombre:"Otros Ingresos",             tipo:"ingreso", nivel:3},
  {codigo:"5",   nombre:"GASTOS",                     tipo:"gasto",   nivel:1},
  {codigo:"5.1", nombre:"Gastos de Operaci├│n",        tipo:"gasto",   nivel:2},
  {codigo:"5101",nombre:"Combustible",                tipo:"gasto",   nivel:3},
  {codigo:"5102",nombre:"Mantenimiento y Reparaci├│n", tipo:"gasto",   nivel:3},
  {codigo:"5103",nombre:"Seguros de Veh├¡culos",       tipo:"gasto",   nivel:3},
  {codigo:"5104",nombre:"Salarios y Prestaciones",    tipo:"gasto",   nivel:3},
  {codigo:"5105",nombre:"Depreciaci├│n Veh├¡culos",     tipo:"gasto",   nivel:3},
  {codigo:"5106",nombre:"Llantas y Repuestos",        tipo:"gasto",   nivel:3},
  {codigo:"5107",nombre:"Hospedaje Pilotos",          tipo:"gasto",   nivel:3},
  {codigo:"5108",nombre:"Alimentaci├│n",               tipo:"gasto",   nivel:3},
  {codigo:"5109",nombre:"Peajes",                     tipo:"gasto",   nivel:3},
  {codigo:"5110",nombre:"Impuestos y Licencias",      tipo:"gasto",   nivel:3},
  {codigo:"5111",nombre:"Servicios P├║blicos",         tipo:"gasto",   nivel:3},
  {codigo:"5112",nombre:"Gastos de Oficina",          tipo:"gasto",   nivel:3},
];

const TIPO_COLOR={activo:T.blue,pasivo:T.red,capital:T.purple,ingreso:T.acc,gasto:T.sec};

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
    if(!confirm("┬┐Cargar el cat├ílogo de cuentas base? Esto crear├í las cuentas predeterminadas."))return;
    setSaving(true);
    for(const c of CUENTAS_DEFAULT){
      await dbIns("catalogo_cuentas",{...c,empresa_id:empId});
    }
    showToast("Cat├ílogo inicializado Ô£ö");
    setSaving(false);
    load();
  };

  const guardar=async()=>{
    if(!f.codigo.trim()||!f.nombre.trim()){showToast("C├│digo y nombre requeridos","err");return;}
    setSaving(true);
    await dbIns("catalogo_cuentas",{...f,empresa_id:empId});
    showToast("Cuenta agregada Ô£ö");setSaving(false);setShowForm(false);
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
        <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>Ôå║</button>
        {cuentas.filter(c=>!c.id?.startsWith("def_")).length===0&&(
          <button onClick={inicializarCatalogo} disabled={saving} style={{...S.btn("blue"),fontSize:12}}>{saving?"Cargando...":"­ƒôï Inicializar cat├ílogo base"}</button>
        )}
        <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>{showForm?"Cancelar":"+ Nueva cuenta"}</button>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:12}}>Nueva cuenta contable</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,alignItems:"flex-end"}}>
            <Fld label="C├ôDIGO"><input style={S.inp} value={f.codigo} onChange={e=>sf("codigo",e.target.value)} placeholder="5101"/></Fld>
            <Fld label="NOMBRE DE LA CUENTA"><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Combustible"/></Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
                {tiposGrupo.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="NIVEL">
              <select style={S.sel} value={f.nivel} onChange={e=>sf("nivel",parseInt(e.target.value))}>
                <option value={1}>1 ÔÇö Grupo principal</option>
                <option value={2}>2 ÔÇö Subgrupo</option>
                <option value={3}>3 ÔÇö Cuenta detalle</option>
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
              <tr>{["C├│digo","Cuenta","Tipo","Nivel","Activa",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
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
                        {c.activa!==false?"Ô£à":"Ô¼£"}
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
    if(!fd.descripcion.trim()){showToast("Descripci├│n requerida","err");return;}
    if(!cuadrado){showToast("El diario no cuadra ÔÇö Debe Ôëá Haber","err");return;}
    if(lineas.filter(l=>l.cuenta_id&&(l.debe>0||l.haber>0)).length<2){showToast("M├¡nimo 2 l├¡neas con cuenta y monto","err");return;}
    setSaving(true);
    const numero="DJ-"+Date.now().toString().slice(-6);
    const diario=await dbIns("asientos_contables",{...fd,empresa_id:empId,numero,total_debe:totalDebe,total_haber:totalHaber});
    if(diario&&diario[0]?.id){
      for(const l of lineas.filter(x=>x.cuenta_id)){
        await dbIns("asiento_lineas",{...l,diario_id:diario[0].id,debe:parseFloat(l.debe)||0,haber:parseFloat(l.haber)||0});
      }
    }
    showToast("Diario guardado Ô£ö");setSaving(false);setShowForm(false);
    setFd({fecha:today(),descripcion:"",referencia:"",estado:"borrador"});
    setLineas([{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0},{cuenta_id:"",cuenta_nombre:"",cuenta_codigo:"",descripcion:"",debe:0,haber:0}]);
    load();
  };

  const del=async id=>{if(!confirm("┬┐Eliminar este diario?"))return;await dbDel("asientos_contables",id);showToast("Eliminado");load();};

  const publicar=async d=>{
    await dbUpd("asientos_contables",d.id,{estado:"publicado"});
    showToast("Diario publicado Ô£ö");load();
  };

  const imprimirDiario=async(d)=>{
    // Fetch lines
    const lineas=await dbGet("asiento_lineas","&diario_id=eq."+d.id+"&order=created_at.asc");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Diario ${d.numero}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1E293B}h2{color:#1B2D5C}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1B2D5C;color:#fff;padding:7px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #E2E8F0}.right{text-align:right}.total{font-weight:700;background:#F1F5F9}.green{color:#16A34A}.blue{color:#1D4ED8}@media print{button{display:none}}</style>
    </head><body>
    <h2>Tz'unun AutoRentas ÔÇö Diario Manual</h2>
    <p><b>N┬░:</b> ${d.numero} &nbsp;|&nbsp; <b>Fecha:</b> ${d.fecha} &nbsp;|&nbsp; <b>Estado:</b> ${d.estado}</p>
    <p><b>Descripci├│n:</b> ${d.descripcion}</p>
    ${d.referencia?`<p><b>Referencia:</b> ${d.referencia}</p>`:""}
    <table><thead><tr><th>C├│digo</th><th>Cuenta</th><th>Descripci├│n</th><th class="right">Debe</th><th class="right">Haber</th></tr></thead>
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
          <button onClick={load} style={{...S.btn("ghost"),fontSize:12}}>Ôå║</button>
          <button onClick={()=>setShowForm(!showForm)} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo diario"}</button>
        </div>
      </div>

      {showForm&&(
        <div style={{...S.card,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Nuevo Diario Manual</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",gap:10,marginBottom:14}}>
            <Fld label="FECHA"><input style={S.inp} type="date" value={fd.fecha} onChange={e=>sfd("fecha",e.target.value)}/></Fld>
            <Fld label="DESCRIPCI├ôN"><input style={S.inp} value={fd.descripcion} onChange={e=>sfd("descripcion",e.target.value)} placeholder="Ej: Registro de combustible semana del 21 al 25 de abril"/></Fld>
            <Fld label="REFERENCIA"><input style={S.inp} value={fd.referencia} onChange={e=>sfd("referencia",e.target.value)} placeholder="FAC-001, REC-045..."/></Fld>
            <Fld label="ESTADO">
              <select style={S.sel} value={fd.estado} onChange={e=>sfd("estado",e.target.value)}>
                <option value="borrador">­ƒôØ Borrador</option>
                <option value="publicado">Ô£à Publicado</option>
              </select>
            </Fld>
          </div>

          {/* L├¡neas del diario */}
          <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>L├ìNEAS DEL DIARIO (partida doble)</div>
          <div style={{...S.card,background:T.surf,padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Cuenta","Descripci├│n de la l├¡nea","DEBE (Q)","HABER (Q)",""].map(h=><th key={h} style={{...S.th,padding:"8px 10px"}}>{h}</th>)}</tr></thead>
              <tbody>
                {lineas.map((l,idx)=>(
                  <tr key={idx}>
                    <td style={{padding:"6px 8px",width:260}}>
                      <select style={{...S.sel,fontSize:12,padding:"6px 8px"}} value={l.cuenta_id} onChange={e=>selCuenta(idx,e.target.value)}>
                        <option value="">Seleccionar cuenta...</option>
                        {cuentas.filter(c=>c.nivel===3||c.nivel===2).map(c=><option key={c.id} value={c.id}>{c.codigo} ÔÇö {c.nombre}</option>)}
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
                    <button onClick={addLinea} style={{...S.btn("ghost"),fontSize:11,padding:"5px 12px"}}>+ Agregar l├¡nea</button>
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
              {cuadrado?"Ô£à El diario cuadra correctamente":"ÔØî No cuadra ÔÇö diferencia: Q "+fmt(Math.abs(totalDebe-totalHaber))}
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
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>{fmtD(d.fecha)}{d.referencia?" ┬À Ref: "+d.referencia:""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:d.estado==="publicado"?T.acc:T.sec,background:d.estado==="publicado"?T.accDim:T.secDim}}>
                    {d.estado==="publicado"?"Ô£à Publicado":"­ƒôØ Borrador"}
                  </span>
                  <div style={{marginTop:6,fontSize:12,color:T.sub}}>
                    <span style={{color:T.acc}}>Debe: Q {fmt(d.total_debe)}</span> | <span style={{color:T.blue}}>Haber: Q {fmt(d.total_haber)}</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                {d.estado==="borrador"&&<button onClick={()=>publicar(d)} style={{...S.btn("primary"),fontSize:11,padding:"5px 12px"}}>Ô£à Publicar</button>}
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

// ÔöÇÔöÇ P├ígina principal de Contabilidad ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
