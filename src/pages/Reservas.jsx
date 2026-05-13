import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';
function FormReserva({initial,onSave,onCancel,empId}){
  const EMPTY_R={cliente_nombre:"",tipo:"renta",vehiculo_nombre:"",conductor_nombre:"",
    fecha_inicio:"",fecha_fin:"",hora_recogida:"08:00",origen:"Guatemala",destino:"",
    departamento:"",municipio:"",anticipo:"",notas:"",iva:5,pago:"efectivo",
    exch:7.70,estado:"pendiente"};

  const [f,setF]=useState(()=>{
    if(!initial) return {...EMPTY_R};
    return{
      cliente_nombre:initial.cliente_nombre||"",
      tipo:initial.tipo||"renta",
      vehiculo_nombre:initial.vehiculo_nombre||"",
      conductor_nombre:initial.conductor_nombre||"",
      fecha_inicio:initial.fecha_inicio?initial.fecha_inicio.slice(0,10):"",
      fecha_fin:initial.fecha_fin?initial.fecha_fin.slice(0,10):"",
      hora_recogida:initial.hora_recogida||"08:00",
      origen:initial.origen||"Guatemala",
      destino:initial.destino||"",
      departamento:initial.departamento||"",
      municipio:initial.municipio||"",
      anticipo:initial.anticipo||"",
      notas:initial.notas||"",
      iva:initial.tasa_iva||5,
      pago:initial.metodo_pago||"efectivo",
      exch:initial.tasa_cambio||7.70,
      estado:initial.estado||"pendiente",
    };
  });

  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));

  // Calcular días
  const calcularDias=()=>{
    if(!f.fecha_inicio) return 0;
    const fi=new Date(f.fecha_inicio+"T12:00:00");
    if(!f.fecha_fin) return 1;
    const ff=new Date(f.fecha_fin+"T12:00:00");
    const diff=Math.ceil((ff-fi)/(1000*60*60*24));
    return Math.max(1,diff);
  };

  const calcularTarifa=(veh,dias)=>{
    if(!veh||dias<=0) return 0;
    if(dias>=30) return veh.mes;
    if(dias>=8) return veh.sem;
    return veh.dia;
  };

  const dias=calcularDias();
  const vehObj=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre)||null;
  const tarifaDia=calcularTarifa(vehObj,dias);
  const subtotal=dias*tarifaDia;
  const ivaAmt=subtotal*(parseFloat(f.iva)||0)/100;
  const totalEfectivo=subtotal+ivaAmt;
  const recargoTC=f.pago==="tarjeta"?totalEfectivo*0.05:0;
  const totalFinal=totalEfectivo+recargoTC;
  const exch=parseFloat(f.exch)||7.70;
  const anticipo=parseFloat(f.anticipo)||0;
  const saldo=Math.max(0,totalFinal-anticipo);
  const munis=f.departamento&&GT[f.departamento]?GT[f.departamento]:[];

  const guardar=async()=>{
    if(!f.cliente_nombre.trim()){alert("El nombre del cliente es requerido");return;}
    if(!f.fecha_inicio){alert("La fecha de inicio es requerida");return;}
    setSaving(true);
    try{
      const empId=await(async()=>{const d=await dbGet("empresas","&select=id&limit=1");return d&&d[0]?d[0].id:null;})();
      const dias=calcularDias();
      const veh=CATALOGO.find(v=>v.nombre===f.vehiculo_nombre);
      const tarifa=veh?tarifaVeh(veh,dias):0;
      const sub=dias*tarifa;
      const ivaAmt=sub*(parseFloat(f.iva)||0)/100;
      const base=sub+ivaAmt;
      const recTC=f.pago==="tarjeta"?base*0.05:0;
      const total=Math.round((base+recTC)*100)/100;
      const ant=parseFloat(f.anticipo)||0;
      const saldo=Math.max(0,total-ant);
      const payload={
        empresa_id:empId,
        cliente_nombre:f.cliente_nombre.trim(),
        tipo:f.tipo,
        numero:initial?.id?"RES-"+initial.numero?.slice(-6)||numId():"RES-"+numId(),
        vehiculo_nombre:f.vehiculo_nombre||"",
        conductor_nombre:f.conductor_nombre||"",
        fecha_inicio:f.fecha_inicio+(f.hora_recogida?"T"+f.hora_recogida+":00":"T08:00:00"),
        fecha_fin:f.fecha_fin?f.fecha_fin+"T23:59:00":null,
        hora_recogida:f.hora_recogida||"08:00",
        origen:f.origen||"Guatemala",
        destino:f.destino||"",
        departamento:f.departamento||"",
        municipio:f.municipio||"",
        monto:total,
        anticipo:ant,
        saldo:saldo,
        tasa_iva:parseFloat(f.iva)||0,
        metodo_pago:f.pago||"efectivo",
        tasa_cambio:parseFloat(f.exch)||7.70,
        estado:f.estado||"pendiente",
        notas:f.notas||"",
      };
      let result;
      if(initial?.id) result=await dbUpd("reservas",initial.id,payload);
      else result=await dbIns("reservas",payload);
      if(result&&result.error){alert("Error al guardar: "+result.error);setSaving(false);return;}
      setSaving(false);
      onSave();
    }catch(e){alert("Error: "+e.message);setSaving(false);}
  };

  const Resumen=()=>(
    <div style={S.card}>
      <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>📊 Resumen</div>
      {vehObj&&dias>0?(
        <>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>🚗 {vehObj.nombre} · {dias} día{dias!==1?"s":""}</div>
          <div style={{background:T.surf,borderRadius:10,padding:12,marginBottom:10}}>
            {[["Tarifa","Q "+fmt(tarifaDia)+"/día"],["Subtotal","Q "+fmt(subtotal)],["IVA "+f.iva+"%","Q "+fmt(ivaAmt)],...(f.pago==="tarjeta"?[["Recargo TC 5%","Q "+fmt(recargoTC)]]:[])] .map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:T.sub}}><span>{l}</span><span>{v}</span></div>
            ))}
          </div>
          <div style={{background:T.accDim,border:"1px solid "+T.acc+"55",borderRadius:10,padding:"12px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:800,color:T.acc}}><span>TOTAL</span><span>Q {fmt(totalFinal)}</span></div>
            <div style={{fontSize:11,color:T.sub,marginTop:3}}>$ {fmt(exch>0?totalFinal/exch:0)} USD</div>
          </div>
          <div style={{background:T.surf,borderRadius:9,padding:11}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"4px 0"}}><span>Anticipo</span><span>Q {fmt(anticipo)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,padding:"4px 0",color:saldo>0?T.sec:T.acc}}><span>Saldo</span><span>Q {fmt(saldo)}</span></div>
          </div>
        </>
      ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Selecciona vehículo y fechas</div>}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontSize:15,fontWeight:700,color:T.acc}}>{initial?.id?"Editar reserva":"Nueva reserva"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Fld label="CLIENTE" span2>
              <BuscadorCliente value={f.cliente_nombre} onChange={v=>sf("cliente_nombre",v)} empId={empId}/>
            </Fld>
            <Fld label="TIPO DE SERVICIO" span2>
              <div style={{display:"flex",gap:8}}>
                <button tabIndex={0} onClick={()=>sf("tipo","renta")} style={{...S.btn(f.tipo==="renta"?"primary":"ghost"),flex:1}}>­ƒöæ Renta de vehículo</button>
                <button tabIndex={0} onClick={()=>sf("tipo","traslado")} style={{...S.btn(f.tipo==="traslado"?"primary":"ghost"),flex:1}}>­ƒù║ Traslado</button>
              </div>
            </Fld>
            <Fld label="ESTADO">
              <select tabIndex={0} style={S.sel} value={f.estado} onChange={e=>sf("estado",e.target.value)}>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="en_curso">ÔûÂ En curso</option>
                <option value="completada">­ƒÅü Completada</option>
                <option value="cancelada">Ô£ù Cancelada</option>
              </select>
            </Fld>
            <Fld label="HORA DE RECOGIDA">
              <input tabIndex={0} style={S.inp} type="time" value={f.hora_recogida} onChange={e=>sf("hora_recogida",e.target.value)}/>
            </Fld>
            <Fld label="VEH├ìCULO" span2>
              <select tabIndex={0} style={S.sel} value={f.vehiculo_nombre} onChange={e=>sf("vehiculo_nombre",e.target.value)}>
                <option value="">Seleccionar vehículo...</option>
                {CATALOGO.map(v=><option key={v.id} value={v.nombre}>{v.nombre} — Q {fmt(v.dia)}/día</option>)}
              </select>
            </Fld>
            <Fld label="CONDUCTOR">
              <input tabIndex={0} style={S.inp} value={f.conductor_nombre} onChange={e=>sf("conductor_nombre",e.target.value)} placeholder="Nombre del piloto"/>
            </Fld>
            <Fld label="IVA">
              <select tabIndex={0} style={S.sel} value={f.iva} onChange={e=>sf("iva",parseInt(e.target.value))}>
                <option value={12}>12% Régimen General</option>
                <option value={5}>5% Pequeño Contrib.</option>
                <option value={0}>Sin IVA</option>
              </select>
            </Fld>
            <Fld label="FECHA ENTREGA">
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_inicio} onChange={e=>sf("fecha_inicio",e.target.value)}/>
            </Fld>
            <Fld label="FECHA DEVOLUCIÓN">
              <input tabIndex={0} style={S.inp} type="date" value={f.fecha_fin} onChange={e=>sf("fecha_fin",e.target.value)}/>
            </Fld>
            <Fld label="ORIGEN">
              <input tabIndex={0} style={S.inp} value={f.origen} onChange={e=>sf("origen",e.target.value)} placeholder="Ciudad de Guatemala"/>
            </Fld>
            <Fld label="DESTINO">
              <input tabIndex={0} style={S.inp} value={f.destino} onChange={e=>sf("destino",e.target.value)} placeholder="Destino"/>
            </Fld>
            <Fld label="DEPARTAMENTO">
              <select tabIndex={0} style={S.sel} value={f.departamento} onChange={e=>{sf("departamento",e.target.value);sf("municipio","");}}>
                <option value="">Seleccionar...</option>
                {Object.keys(GT).map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Fld>
            <Fld label="MUNICIPIO">
              <select tabIndex={0} style={S.sel} value={f.municipio} onChange={e=>sf("municipio",e.target.value)} disabled={!f.departamento}>
                <option value="">Seleccionar...</option>
                {munis.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="M├ëTODO DE PAGO" span2>
              <div style={{display:"flex",gap:8}}>
                {[["efectivo","­ƒÆÁ Efectivo"],["transferencia","🏦 Transferencia"],["tarjeta","­ƒÆ│ Tarjeta (+5%)"]].map(([v,l])=>(
                  <button tabIndex={0} key={v} onClick={()=>sf("pago",v)} style={{...S.btn(f.pago===v?"primary":"ghost"),flex:1,fontSize:11}}>{l}</button>
                ))}
              </div>
            </Fld>
            <Fld label="TASA CAMBIO ($1 USD)">
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.exch} onChange={e=>sf("exch",parseFloat(e.target.value)||7.70)}/>
            </Fld>
            <Fld label="ANTICIPO (Q)">
              <input tabIndex={0} style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e=>sf("anticipo",e.target.value)} placeholder="0.00"/>
            </Fld>
            <Fld label="NOTAS" span2>
              <textarea tabIndex={0} style={{...S.inp,minHeight:60,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
            </Fld>
            <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:6}}>
              <button tabIndex={0} onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1,padding:12,fontSize:14}}>{saving?"­ƒÆ¥ Guardando...":"­ƒÆ¥ Guardar reserva"}</button>
              <button tabIndex={0} onClick={onCancel} style={{...S.btn("ghost"),flex:1,padding:12}}>Cancelar</button>
            </div>
          </div>
        </div>
        <Resumen/>
      </div>
    </div>
  );
}

// ÔòÉÔòÉÔòÉ CLIENTES Y FLOTA ÔòÉÔòÉÔòÉ



// ÔòÉÔòÉÔòÉ DASHBOARD ÔòÉÔòÉÔòÉ

// ÔòÉÔòÉÔòÉ EXPORTAR UNIVERSAL ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
function CalendarioReservas({rows,onNewReserva,onEdit}){
  const [mes,setMes]=useState(new Date());
  const DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
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
                  <div key={r.id} onClick={()=>onEdit&&onEdit(r)} style={{fontSize:9,fontWeight:600,background:(EST_C[r.estado]||"#64748B")+"33",color:EST_C[r.estado]||"#64748B",borderLeft:"2px solid "+(EST_C[r.estado]||"#64748B"),padding:"1px 4px",borderRadius:2,marginBottom:1,cursor:"pointer",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}} title={r.cliente_nombre+" — "+r.vehiculo_nombre}>
                    {r.cliente_nombre?.split(" ")[0]} {r.vehiculo_nombre?.split(" ")[0]||""}
                  </div>
                ))}
                {cell.dayReservas.length>3&&<div style={{fontSize:9,color:T.mut}}>+{cell.dayReservas.length-3} más</div>}
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


export default function PageReservas({showToast,empId}){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vista,setVista]=useState("lista");
  const [editItem,setEditItem]=useState(null);
  const [filtro,setFiltro]=useState("todas");
  const [viewMode,setViewMode]=useState("lista"); // lista | calendario
  const load=async()=>{setLoading(true);const d=await dbGet("reservas","");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const chEst=async(id,estado)=>{
    await dbUpd("reservas",id,{estado});
    if(estado==="en_curso"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"rentado"});
    }
    if(estado==="completada"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"mantenimiento"});
    }
    if(estado==="cancelada"){
      const res=rows.find(r=>r.id===id);
      if(res?.vehiculo_id) await dbUpd("vehiculos",res.vehiculo_id,{estado:"disponible"});
    }
    showToast("Estado actualizado");load();
  };
  const del=async id=>{if(!confirm("┬┐Eliminar reserva?"))return;await dbDel("reservas",id);showToast("Eliminada");load();};
  const filtered=filtro==="todas"?rows:rows.filter(r=>r.estado===filtro);
  if(vista==="form")return <FormReserva initial={editItem} empId={empId} onSave={()=>{setVista("lista");setEditItem(null);load();showToast(editItem?"Actualizada ✔":"Guardada ✔");}} onCancel={()=>{setVista("lista");setEditItem(null);}}/>;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[{l:"Total",v:rows.length,c:T.acc},{l:"Pendientes",v:rows.filter(r=>r.estado==="pendiente").length,c:T.mut},{l:"Confirmadas",v:rows.filter(r=>r.estado==="confirmada").length,c:T.acc},{l:"En curso",v:rows.filter(r=>r.estado==="en_curso").length,c:T.blue},{l:"Completadas",v:rows.filter(r=>r.estado==="completada").length,c:T.acc}].map((s,i)=>(
          <div key={i} style={{background:T.surf,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["todas","pendiente","confirmada","en_curso","completada","cancelada"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{...S.btn(filtro===f?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>
            {f==="en_curso"?"En curso":f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <button onClick={()=>setViewMode(viewMode==="lista"?"calendario":"lista")} style={{...S.btn("ghost"),fontSize:11}}>{viewMode==="lista"?"📅 Ver calendario":"📋 Ver lista"}</button>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>↺</button>
        <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nueva reserva</button>
      </div>
      {viewMode==="calendario"?(
        <CalendarioReservas rows={rows} onEdit={r=>{setEditItem(r);setVista("form");}}/>
      ):(loading?<Spinner/>:filtered.length===0?<Empty icon="­ƒô¡" msg="Sin reservas" action="+ Nueva reserva" onAction={()=>setVista("form")}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(r=>{
            const e=EST_RES[r.estado]||EST_RES.pendiente;
            const sig=FLUJO_RES[r.estado]||[];
            return(
              <div key={r.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:T.acc}}>{r.numero}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{r.cliente_nombre}</div>
                    <div style={{fontSize:12,color:T.sub}}>{r.tipo==="renta"?"­ƒöæ":"­ƒù║"} {fmtD(r.fecha_inicio)}{r.fecha_fin?" → "+fmtD(r.fecha_fin):""}{r.vehiculo_nombre?" · "+r.vehiculo_nombre:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color:e.c,background:e.bg}}>{e.l}</span>
                    <div style={{fontSize:15,fontWeight:700,color:T.acc,marginTop:4}}>Q {fmt(r.monto)}</div>
                    {parseFloat(r.saldo)>0&&<div style={{fontSize:11,color:T.sec}}>Saldo: Q {fmt(r.saldo)}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid "+T.bord+"22",flexWrap:"wrap"}}>
                  {sig.map(s=><button key={s.v} onClick={()=>chEst(r.id,s.v)} style={{...S.btn(s.s),fontSize:11,padding:"5px 10px"}}>{s.l}</button>)}
                  <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),fontSize:11,padding:"5px 10px"}}>Ô£Å´©Å Editar</button>
                  <button onClick={()=>del(r.id)} style={{...S.btn("danger"),fontSize:11,padding:"5px 10px"}}>­ƒùæ´©Å</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}


