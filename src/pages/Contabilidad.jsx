import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageContabilidad({showToast,empId}){
  const [tab,setTab]=useState("catalogo");
  const [balanceData,setBalanceData]=useState(null);
  const [loadingBalance,setLoadingBalance]=useState(false);
  const calcBalance=async()=>{
    setLoadingBalance(true);
    const [gastos,movs,facturas]=await Promise.all([
      dbGet("gastos",""),dbGet("movimientos_bancarios",""),dbGet("facturas","")
    ]);
    const ingresos=(Array.isArray(facturas)?facturas:[]).filter(f=>!["anulada","borrador"].includes(f.estado)).reduce((s,f)=>s+(parseFloat(f.total)||0),0);
    const egresosGas=(Array.isArray(gastos)?gastos:[]).reduce((s,g)=>s+(parseFloat(g.total)||0),0);
    const saldoBanca=(Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0)-
                    (Array.isArray(movs)?movs:[]).filter(m=>m.tipo==="egreso").reduce((s,m)=>s+(parseFloat(m.monto)||0),0);
    const utilidad=ingresos-egresosGas;
    setBalanceData({ingresos,gastos:egresosGas,utilidad,saldoBanca,iva:ingresos*0.05,fecha:today()});
    setLoadingBalance(false);
  };
  useEffect(()=>{if(tab==="balance")calcBalance();},[tab]);

  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:"1px solid "+T.bord,marginBottom:18}}>
        {[{id:"catalogo",l:"­ƒôï Cat├ílogo de Cuentas"},{id:"asientos_contables",l:"­ƒôÆ Diarios Manuales"},{id:"balance",l:"­ƒôè Balance General"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 18px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?T.acc:T.sub,borderBottom:tab===t.id?"2px solid "+T.acc:"2px solid transparent"}}>
            {t.l}
          </button>
        ))}
      </div>
      {tab==="catalogo"&&<TabCatalogo empId={empId} showToast={showToast}/>}
      {tab==="asientos_contables"&&<TabDiarios empId={empId} showToast={showToast}/>}
      {tab==="balance"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:T.sub}}>Balance resumido al {fmtD(today())} ÔÇö basado en facturas, gastos y movimientos registrados</div>
            <button onClick={calcBalance} disabled={loadingBalance} style={{...S.btn("ghost"),fontSize:12}}>{loadingBalance?"Calculando...":"Ôå║ Actualizar"}</button>
          </div>
          {balanceData?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Estado de Resultados */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.acc,marginBottom:14}}>­ƒôè Estado de Resultados</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Ingresos (facturas emitidas)</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt(balanceData.ingresos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Gastos registrados</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:balanceData.utilidad>=0?T.accDim:T.redDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Utilidad bruta</span>
                  <span style={{fontWeight:800,fontSize:16,color:balanceData.utilidad>=0?T.acc:T.red}}>Q {fmt(balanceData.utilidad)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",marginTop:8}}><span style={{color:T.sub}}>IVA estimado (5%)</span><span style={{color:T.sec}}>Q {fmt(balanceData.iva)}</span></div>
              </div>
              {/* Posici├│n Bancaria */}
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:700,color:T.blue,marginBottom:14}}>­ƒÅª Posici├│n Bancaria</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total ingresos banca</span><span style={{fontWeight:700,color:T.acc}}>Q {fmt((balanceData.saldoBanca||0)+(balanceData.gastos||0))}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.bord+"33"}}><span style={{color:T.sub}}>Total egresos banca</span><span style={{fontWeight:700,color:T.red}}>Q {fmt(balanceData.gastos)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",background:T.blueDim,borderRadius:8,paddingLeft:10,paddingRight:10,marginTop:8}}>
                  <span style={{fontWeight:700,fontSize:14}}>Saldo neto</span>
                  <span style={{fontWeight:800,fontSize:16,color:T.blue}}>Q {fmt(Math.abs(balanceData.saldoBanca))}</span>
                </div>
                <div style={{marginTop:12,fontSize:12,color:T.mut}}>
                  ÔÜá´©Å Este balance es un resumen estimado. Para contabilidad oficial utiliza los diarios manuales y el cat├ílogo de cuentas.
                </div>
              </div>
            </div>
          ):<Spinner/>}
        </div>
      )}
    </div>
  );
}


// ÔöÇÔöÇ Error Boundary para capturar errores de renderizado ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  render(){
    if(this.state.hasError){
      return <div style={{padding:24,background:"#162032",borderRadius:12,border:"1px solid #EF4444",margin:16}}>
        <div style={{fontSize:14,fontWeight:700,color:"#EF4444",marginBottom:8}}>ÔÜá´©Å Error en este m├│dulo</div>
        <div style={{fontSize:12,color:"#94A3B8",fontFamily:"monospace"}}>{String(this.state.error)}</div>
        <button onClick={()=>this.setState({hasError:false,error:null})} style={{marginTop:12,padding:"6px 14px",background:"#00D4AA",border:"none",borderRadius:6,fontWeight:600,color:"#0A0F1E",cursor:"pointer"}}>Ôå║ Reintentar</button>
      </div>;
    }
    return this.props.children;
  }
}


