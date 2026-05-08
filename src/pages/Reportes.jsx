import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

function KpiCard({icon,label,value,sub,color,bg}){
  return (
    <div style={{...S.card,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
      <div style={{width:38,height:38,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color}}>{value}</div>
      <div style={{fontSize:11,color:T.mut,marginTop:2}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:2}}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surf,border:`1px solid ${T.bord}`,borderRadius:8,padding:"10px 14px",fontSize:11}}>
    <div style={{color:T.sub,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,fontWeight:600}}>{p.name}: Q {fmt(p.value)}</div>)}
  </div>;
}

function ReporteVentas({data}){
  const {reservas,cotizaciones,facturas} = data;

  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const chartMensual=meses.map((mes,i)=>({
    mes,
    Reservas: Math.round(reservas.filter(r=>new Date(r.fecha_inicio||r.created_at).getMonth()===i&&r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0)),
    Cotizaciones: Math.round(cotizaciones.filter(co=>new Date(co.created_at).getMonth()===i&&co.estado!=="rechazada").reduce((s,co)=>s+(parseFloat(co.total_gtq)||0),0)),
  })).filter(x=>x.Reservas>0||x.Cotizaciones>0);

  const totalRes=reservas.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const totalCot=cotizaciones.filter(c=>c.estado!=="rechazada").reduce((s,c)=>s+(parseFloat(c.total_gtq)||0),0);
  const totalFac=facturas.filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);

  const tablaRows=reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>[
    r.numero||"ÔÇö",r.cliente_nombre,r.tipo==="renta"?"Renta":"Traslado",
    r.vehiculo_nombre||"ÔÇö",fmtD(r.fecha_inicio),`Q ${fmt(r.monto)}`,
    `Q ${fmt(r.anticipo)}`,`Q ${fmt(r.saldo)}`,r.estado
  ]);

  const exportar=()=>exportCSV("Reporte_Ventas_TzununSA",
    ["N┬░ Reserva","Cliente","Tipo","Veh├¡culo","Fecha inicio","Monto","Anticipo","Saldo","Estado"],
    tablaRows
  );
  const imprimir=()=>imprimirTabla("Reporte de Ventas",
    ["N┬░ Reserva","Cliente","Tipo","Veh├¡culo","Fecha","Monto","Anticipo","Saldo","Estado"],
    tablaRows
  );

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <KpiCard icon="­ƒôà" label="Total reservas (activas)" value={`Q ${fmt(totalRes).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="­ƒôï" label="Cotizaciones enviadas" value={`Q ${fmt(totalCot).split(".")[0]}`} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="­ƒº¥" label="Total facturado" value={`Q ${fmt(totalFac).split(".")[0]}`} color={T.purple} bg={T.purpleDim}/>
      </div>

      <div style={{...S.card,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ventas mensuales ÔÇö Reservas vs Cotizaciones</div>
        {chartMensual.length>0?(
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMensual}>
              <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="Reservas" fill={T.acc} radius={[4,4,0,0]}/>
              <Bar dataKey="Cotizaciones" fill={T.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos suficientes</div>}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Reservas</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr>{["N┬░ Reserva","Cliente","Tipo","Veh├¡culo","Fecha","Monto","Anticipo","Saldo","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {reservas.filter(r=>r.estado!=="cancelada").slice(0,20).map(r=>(
                <tr key={r.id}>
                  <td style={{...S.td,fontFamily:"monospace",color:T.acc}}>{r.numero}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.cliente_nombre}</td>
                  <td style={S.td}>{r.tipo==="renta"?"­ƒöæ Renta":"­ƒù║ Traslado"}</td>
                  <td style={{...S.td,color:T.sub}}>{r.vehiculo_nombre||"ÔÇö"}</td>
                  <td style={{...S.td,color:T.sub,whiteSpace:"nowrap"}}>{fmtD(r.fecha_inicio)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(r.monto)}</td>
                  <td style={{...S.td,color:T.acc}}>Q {fmt(r.anticipo)}</td>
                  <td style={{...S.td,color:parseFloat(r.saldo)>0?T.sec:T.acc}}>Q {fmt(r.saldo)}</td>
                  <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:r.estado==="completada"?T.accDim:T.secDim,color:r.estado==="completada"?T.acc:T.sec}}>{r.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReporteFlota({data}){
  const {vehiculos,reservas} = data;

  const flotaData=vehiculos.map(v=>{
    const resV=reservas.filter(r=>r.vehiculo_nombre===`${v.marca} ${v.modelo}`||r.vehiculo_nombre?.includes(v.modelo));
    const ingresos=resV.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    const viajes=resV.length;
    return {...v,ingresos,viajes};
  });

  const chartFlota=flotaData.map(v=>({nombre:`${v.marca} ${v.modelo}`,Ingresos:Math.round(v.ingresos),Viajes:v.viajes}));
  const pieData=[
    {name:"Disponible",value:vehiculos.filter(v=>v.estado==="disponible").length,color:T.acc},
    {name:"Rentado",value:vehiculos.filter(v=>v.estado==="rentado").length,color:T.blue},
    {name:"Mantenimiento",value:vehiculos.filter(v=>v.estado==="mantenimiento").length,color:T.sec},
  ].filter(x=>x.value>0);

  const tablaRows=flotaData.map(v=>[v.placa,`${v.marca} ${v.modelo}`,v.tipo,v.anio,(v.km_actual||0).toLocaleString()+" km",v.viajes,`Q ${fmt(v.ingresos)}`,v.estado]);
  const exportar=()=>exportCSV("Reporte_Flota_TzununSA",["Placa","Veh├¡culo","Tipo","A├▒o","Km actual","Viajes","Ingresos generados","Estado"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Flota",["Placa","Veh├¡culo","Tipo","A├▒o","Km","Viajes","Ingresos","Estado"],tablaRows);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Ingresos por veh├¡culo</div>
          {chartFlota.some(x=>x.Ingresos>0)?(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartFlota} layout="vertical">
                <XAxis type="number" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <YAxis type="category" dataKey="nombre" tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} width={120}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="Ingresos" fill={T.acc} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ):<div style={{textAlign:"center",padding:24,color:T.sub,fontSize:12}}>Sin datos de ingresos por veh├¡culo</div>}
        </div>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Estado actual de flota</div>
          {pieData.length>0?(
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
              {pieData.map((e,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><span style={{color:T.sub}}>{e.name}</span></div>
                  <span style={{fontWeight:700,color:e.color}}>{e.value} veh.</span>
                </div>
              ))}
            </>
          ):<div style={{textAlign:"center",padding:24,color:T.sub}}>Sin datos</div>}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Flota</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Placa","Veh├¡culo","Tipo","A├▒o","Km actual","Viajes","Ingresos","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {flotaData.map(v=>(
              <tr key={v.id}>
                <td style={{...S.td,fontFamily:"monospace",color:T.acc,fontWeight:700}}>{v.placa}</td>
                <td style={{...S.td,fontWeight:600}}>{v.marca} {v.modelo}</td>
                <td style={S.td}>{v.tipo}</td>
                <td style={{...S.td,color:T.sub}}>{v.anio}</td>
                <td style={S.td}>{(v.km_actual||0).toLocaleString()} km</td>
                <td style={{...S.td,color:T.blue,fontWeight:600}}>{v.viajes}</td>
                <td style={{...S.td,fontWeight:700,color:T.acc}}>Q {fmt(v.ingresos)}</td>
                <td style={S.td}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:v.estado==="disponible"?T.accDim:v.estado==="rentado"?T.blueDim:T.secDim,color:v.estado==="disponible"?T.acc:v.estado==="rentado"?T.blue:T.sec}}>{v.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReporteGastos({data}){
  const {gastos} = data;
  const CAT_COLOR={combustible:T.sec,mantenimiento:T.blue,seguros:T.purple,salarios:"#22C55E",impuestos:T.red,servicios:T.acc,otros:T.sub};

  const porCat=[...new Set(gastos.map(g=>g.categoria))].map(cat=>({
    cat,
    total:gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+(parseFloat(g.total)||0),0),
    count:gastos.filter(g=>g.categoria===cat).length,
    pagados:gastos.filter(g=>g.categoria===cat&&g.estado==="pagado").reduce((s,g)=>s+(parseFloat(g.total)||0),0),
  })).sort((a,b)=>b.total-a.total);

  const totalGastos=gastos.reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const totalPend=gastos.filter(g=>g.estado==="pendiente").reduce((s,g)=>s+(parseFloat(g.total)||0),0);
  const pieData=porCat.map(c=>({name:c.cat,value:Math.round(c.total),color:CAT_COLOR[c.cat]||T.mut}));

  const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const chartMensual=meses.map((mes,i)=>({
    mes,
    Gastos:Math.round(gastos.filter(g=>new Date(g.fecha).getMonth()===i).reduce((s,g)=>s+(parseFloat(g.total)||0),0)),
  })).filter(x=>x.Gastos>0);

  const tablaRows=gastos.map(g=>[fmtD(g.fecha),g.categoria,g.descripcion,`Q ${fmt(g.monto)}`,`Q ${fmt(g.iva)}`,`Q ${fmt(g.total)}`,g.metodo_pago,g.referencia||"ÔÇö",g.estado]);
  const exportar=()=>exportCSV("Reporte_Gastos_TzununSA",["Fecha","Categor├¡a","Descripci├│n","Monto","IVA","Total","M├®todo pago","Referencia","Estado"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Gastos",["Fecha","Categor├¡a","Descripci├│n","Monto","IVA","Total","Estado"],tablaRows);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        <KpiCard icon="­ƒÆ©" label="Total gastos" value={`Q ${fmt(totalGastos).split(".")[0]}`} color={T.red} bg={T.redDim}/>
        <KpiCard icon="Ô£à" label="Pagados" value={`Q ${fmt(totalGastos-totalPend).split(".")[0]}`} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="ÔÅ│" label="Pendientes de pago" value={`Q ${fmt(totalPend).split(".")[0]}`} color={T.sec} bg={T.secDim}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos por categor├¡a</div>
          {porCat.map(({cat,total,count})=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||T.mut}}/>
                  <span style={{fontSize:12,color:T.sub}}>{cat} ({count})</span>
                </div>
                <span style={{fontSize:12,fontWeight:600}}>Q {fmt(total)}</span>
              </div>
              <div style={{background:T.surf,borderRadius:4,height:5,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:CAT_COLOR[cat]||T.mut,width:`${totalGastos>0?Math.round((total/totalGastos)*100):0}%`}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Gastos mensuales</div>
          {chartMensual.length>0?(
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartMensual}>
                <XAxis dataKey="mes" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?v/1000+"k":v}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="Gastos" stroke={T.red} strokeWidth={2} dot={{fill:T.red,r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          ):<div style={{textAlign:"center",padding:32,color:T.sub}}>Sin datos</div>}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Detalle de Gastos</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr>{["Fecha","Categor├¡a","Descripci├│n","Monto","IVA","Total","M├®todo","Ref.","Estado"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {gastos.map(g=>(
                <tr key={g.id}>
                  <td style={{...S.td,whiteSpace:"nowrap",color:T.sub}}>{fmtD(g.fecha)}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:(CAT_COLOR[g.categoria]||T.mut)+"22",color:CAT_COLOR[g.categoria]||T.mut}}>{g.categoria}</span></td>
                  <td style={{...S.td,maxWidth:200}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:195}}>{g.descripcion}</div></td>
                  <td style={S.td}>Q {fmt(g.monto)}</td>
                  <td style={S.td}>Q {fmt(g.iva)}</td>
                  <td style={{...S.td,fontWeight:700,color:T.red}}>Q {fmt(g.total)}</td>
                  <td style={{...S.td,color:T.sub,fontSize:11}}>{g.metodo_pago}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:10,color:T.mut}}>{g.referencia||"ÔÇö"}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:g.estado==="pagado"?T.accDim:T.secDim,color:g.estado==="pagado"?T.acc:T.sec}}>{g.estado==="pagado"?"Ô£ö Pagado":"ÔÅ│ Pendiente"}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:T.surf}}>
                <td colSpan={5} style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub}}>TOTAL</td>
                <td style={{padding:"9px 10px",fontWeight:800,color:T.red,fontSize:13}}>Q {fmt(totalGastos)}</td>
                <td colSpan={3}/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReporteClientes({data}){
  const {clientes,reservas,cotizaciones} = data;

  const clientesData=clientes.map(c=>{
    const resC=reservas.filter(r=>r.cliente_nombre===c.nombre&&r.estado!=="cancelada");
    const cotC=cotizaciones.filter(co=>co.cliente_nombre===c.nombre&&co.estado!=="rechazada");
    const ingresos=resC.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
    return {...c,reservas:resC.length,cotizaciones:cotC.length,ingresos};
  }).sort((a,b)=>b.ingresos-a.ingresos);

  const tablaRows=clientesData.map(c=>[c.nombre,c.tipo,c.nit||"ÔÇö",c.telefono||"ÔÇö",c.email||"ÔÇö",c.reservas,c.cotizaciones,`Q ${fmt(c.ingresos)}`]);
  const exportar=()=>exportCSV("Reporte_Clientes_TzununSA",["Cliente","Tipo","NIT","Tel├®fono","Email","Reservas","Cotizaciones","Ingresos generados"],tablaRows);
  const imprimir=()=>imprimirTabla("Reporte de Clientes",["Cliente","Tipo","NIT","Tel├®fono","Reservas","Cotizaciones","Ingresos"],tablaRows);

  const TC={empresa:{c:T.sec,bg:T.secDim},gobierno:{c:T.blue,bg:T.blueDim},persona:{c:T.acc,bg:T.accDim}};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <KpiCard icon="­ƒæÑ" label="Total clientes" value={clientes.length} color={T.acc} bg={T.accDim}/>
        <KpiCard icon="­ƒÅó" label="Empresas" value={clientes.filter(c=>c.tipo==="empresa").length} color={T.sec} bg={T.secDim}/>
        <KpiCard icon="­ƒÅø´©Å" label="Gobierno/ONG" value={clientes.filter(c=>c.tipo==="gobierno").length} color={T.blue} bg={T.blueDim}/>
        <KpiCard icon="­ƒæñ" label="Personas" value={clientes.filter(c=>c.tipo==="persona").length} color={T.purple} bg={T.purpleDim}/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={exportar} style={{...S.btn("green")}}>Ô¼ç Exportar Excel (.csv)</button>
        <button onClick={imprimir} style={{...S.btn("ghost")}}>­ƒû¿´©Å Imprimir</button>
      </div>

      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Clientes por ingresos generados</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Cliente","Tipo","NIT","Tel├®fono","Reservas","Cotizaciones","Ingresos generados"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {clientesData.map((c,i)=>{
              const tc=TC[c.tipo]||TC.empresa;
              return (
                <tr key={c.id} style={{background:i===0?T.accDim:"transparent"}}>
                  <td style={{...S.td,fontWeight:600}}>{i===0&&"­ƒÑç "}{c.nombre}</td>
                  <td style={S.td}><span style={{padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:tc.bg,color:tc.c}}>{c.tipo}</span></td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:11,color:T.mut}}>{c.nit||"ÔÇö"}</td>
                  <td style={{...S.td,color:T.sub}}>{c.telefono||"ÔÇö"}</td>
                  <td style={{...S.td,fontWeight:600,color:T.blue,textAlign:"center"}}>{c.reservas}</td>
                  <td style={{...S.td,fontWeight:600,color:T.purple,textAlign:"center"}}>{c.cotizaciones}</td>
                  <td style={{...S.td,fontWeight:700,color:c.ingresos>0?T.acc:T.mut}}>Q {fmt(c.ingresos)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ÔòÉÔòÉÔòÉ GASTOS ÔòÉÔòÉÔòÉ

export default function PageReportes(){
  const [tab,setTab]=useState("ventas");const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    const [vehiculos,reservas,cotizaciones,facturas,gastos,clientes,movimientos]=await Promise.all([dbGet("vehiculos",""),dbGet("reservas",""),dbGet("cotizaciones",""),dbGet("facturas",""),dbGet("gastos",""),dbGet("clientes",""),dbGet("movimientos_bancarios","")]);
    setData({vehiculos:Array.isArray(vehiculos)?vehiculos:[],reservas:Array.isArray(reservas)?reservas:[],cotizaciones:Array.isArray(cotizaciones)?cotizaciones:[],facturas:Array.isArray(facturas)?facturas:[],gastos:Array.isArray(gastos)?gastos:[],clientes:Array.isArray(clientes)?clientes:[],movimientos:Array.isArray(movimientos)?movimientos:[]});
    setLoading(false);
  };
  const TABS=[{id:"ventas",l:"­ƒôè Ventas"},{id:"flota",l:"­ƒÜù Flota"},{id:"gastos",l:"­ƒÆ© Gastos"},{id:"clientes",l:"­ƒæÑ Clientes"}];
  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:16}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?`2px solid ${T.acc}`:"2px solid transparent"}}>{t.l}</button>)}
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11,marginLeft:"auto"}}>Ôå║ Actualizar</button>
      </div>
      {loading?<Spinner/>:data&&<>{tab==="ventas"&&<ReporteVentas data={data}/>}{tab==="flota"&&<ReporteFlota data={data}/>}{tab==="gastos"&&<ReporteGastos data={data}/>}{tab==="clientes"&&<ReporteClientes data={data}/>}</>}
    </div>
  );
}

// ÔòÉÔòÉÔòÉ CONFIGURACI├ôN ÔòÉÔòÉÔòÉ
