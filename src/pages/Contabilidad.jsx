// src/pages/Contabilidad.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO CONTABILIDAD — Tz'ununSA
// Catálogo · Libro Diario · Libro Mayor · Balance · Resultados
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { T, S, SB, H, dbIns, dbUpd } from "../config.js";

// ─── Helper fetch ─────────────────────────────────────────────────
async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders||{}) },
    ...rest,
  });
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e.message || e.hint || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Utilidades ───────────────────────────────────────────────────
const fmtQ    = (n) => "Q " + (Number(n)||0).toLocaleString("es-GT",{minimumFractionDigits:2});
const fmtN    = (n) => (Number(n)||0).toLocaleString("es-GT",{minimumFractionDigits:2});
const fmtDate = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const hoy     = () => new Date().toISOString().split("T")[0];
const primerMes = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };

const TIPO_COLOR = { activo:"#10B981", pasivo:"#EF4444", capital:"#8B5CF6", ingreso:"#3B82F6", costo:"#F59E0B", gasto:"#F97316" };
const TIPO_LABEL = { activo:"Activo", pasivo:"Pasivo", capital:"Capital", ingreso:"Ingreso", costo:"Costo", gasto:"Gasto" };

const TABS = [
  { id:"catalogo",   label:"📚 Catálogo" },
  { id:"diario",     label:"📓 Libro Diario" },
  { id:"mayor",      label:"📊 Libro Mayor" },
  { id:"balance",    label:"⚖️ Balance General" },
  { id:"resultados", label:"📈 Estado de Resultados" },
];

// ════════════════════════════════════════════════════════════════════
export default function PageContabilidad({ showToast, empId }) {
  const [tab, setTab]           = useState("catalogo");
  const [cuentas, setCuentas]   = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [desdeDiario, setDesdeDiario] = useState(primerMes());
  const [hastaDiario, setHastaDiario] = useState(hoy());

  const [cuentaMayor, setCuentaMayor] = useState("");
  const [desdeMayor,  setDesdeMayor]  = useState(primerMes());
  const [hastaMayor,  setHastaMayor]  = useState(hoy());
  const [mayorData,   setMayorData]   = useState([]);
  const [loadingMayor,setLoadingMayor]= useState(false);

  const [fechaBalance,   setFechaBalance]   = useState(hoy());
  const [balanceData,    setBalanceData]    = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [desdeResult,   setDesdeResult]   = useState(primerMes());
  const [hastaResult,   setHastaResult]   = useState(hoy());
  const [resultData,    setResultData]    = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const [modalAsiento, setModalAsiento] = useState(false);
  const [asientoForm,  setAsientoForm]  = useState({ fecha:hoy(), descripcion:"", referencia:"" });
  const [lineas, setLineas] = useState([
    { cuenta_id:"", descripcion:"", debe:0, haber:0 },
    { cuenta_id:"", descripcion:"", debe:0, haber:0 },
  ]);
  const [guardando, setGuardando] = useState(false);

  const [modalCuenta,  setModalCuenta]  = useState(false);
  const [cuentaForm,   setCuentaForm]   = useState({ codigo:"", nombre:"", tipo:"activo", nivel:3, activa:true });
  const [editCuentaId, setEditCuentaId] = useState(null);

  const [asientoAbierto,  setAsientoAbierto]  = useState(null);
  const [lineasDetalle,   setLineasDetalle]   = useState({});

  // ─── Cargar cuentas ──────────────────────────────────────────
  const cargarCuentas = useCallback(async () => {
    try {
      const data = await api(`/cuentas_contables?order=codigo.asc&select=*`);
      setCuentas(data||[]);
    } catch { showToast("Error cargando catálogo","err"); }
  }, []);

  // ─── Cargar asientos ─────────────────────────────────────────
  const cargarAsientos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/asientos_contables?fecha=gte.${desdeDiario}&fecha=lte.${hastaDiario}&order=fecha.desc,created_at.desc&select=*`);
      setAsientos(data||[]);
    } catch { showToast("Error cargando asientos","err"); }
    finally { setLoading(false); }
  }, [desdeDiario, hastaDiario]);

  useEffect(() => { cargarCuentas(); }, [cargarCuentas]);
  useEffect(() => {
    if (["diario","mayor","balance","resultados"].includes(tab)) cargarAsientos();
  }, [tab, cargarAsientos]);

  // ─── Guardar asiento ─────────────────────────────────────────
  const guardarAsiento = async () => {
    if (!asientoForm.descripcion.trim()) { showToast("Agrega una descripción","err"); return; }
    const lv = lineas.filter(l=>l.cuenta_id && (Number(l.debe)>0||Number(l.haber)>0));
    if (lv.length<2) { showToast("Mínimo 2 líneas con cuenta y monto","err"); return; }
    const tD = lv.reduce((s,l)=>s+Number(l.debe),0);
    const tH = lv.reduce((s,l)=>s+Number(l.haber),0);
    if (Math.abs(tD-tH)>0.01) { showToast(`Descuadrado: Debe=${fmtQ(tD)} Haber=${fmtQ(tH)}`,"err"); return; }
    setGuardando(true);
    try {
      const payload = { ...asientoForm, empresa_id:empId, modulo_origen:"manual", estado:"activo" };
      const res = await api("/asientos_contables", {
        method:"POST", body:JSON.stringify(payload),
        extraHeaders:{ Prefer:"return=representation" },
      });
      const nuevoId = Array.isArray(res) ? res[0]?.id : res?.id;
      if (!nuevoId) throw new Error("No se obtuvo ID del asiento");
      await Promise.all(lv.map(l=>api("/asiento_lineas",{
        method:"POST",
        body:JSON.stringify({ ...l, asiento_id:nuevoId, debe:Number(l.debe), haber:Number(l.haber) }),
        extraHeaders:{ Prefer:"return=minimal" },
      })));
      showToast("Asiento registrado");
      setModalAsiento(false);
      setAsientoForm({ fecha:hoy(), descripcion:"", referencia:"" });
      setLineas([{ cuenta_id:"",descripcion:"",debe:0,haber:0 },{ cuenta_id:"",descripcion:"",debe:0,haber:0 }]);
      cargarAsientos();
    } catch (e) { showToast("Error: "+e.message,"err"); }
    finally { setGuardando(false); }
  };

  // ─── Guardar cuenta ──────────────────────────────────────────
  const guardarCuenta = async () => {
    if (!cuentaForm.codigo.trim()||!cuentaForm.nombre.trim()) { showToast("Código y nombre requeridos","err"); return; }
    setGuardando(true);
    try {
      if (editCuentaId) {
        await dbUpd("cuentas_contables", editCuentaId, cuentaForm);
        showToast("Cuenta actualizada");
      } else {
        const r = await dbIns("cuentas_contables", { ...cuentaForm, empresa_id:empId });
        if (r?.error) throw new Error(r.error);
        showToast("Cuenta creada");
      }
      setModalCuenta(false);
      setCuentaForm({ codigo:"",nombre:"",tipo:"activo",nivel:3,activa:true });
      setEditCuentaId(null);
      cargarCuentas();
    } catch (e) { showToast("Error: "+e.message,"err"); }
    finally { setGuardando(false); }
  };

  // ─── Cargar líneas de un asiento ─────────────────────────────
  const cargarLineas = async (id) => {
    if (lineasDetalle[id]) return;
    try {
      const data = await api(`/asiento_lineas?asiento_id=eq.${id}&select=*`);
      setLineasDetalle(p=>({...p,[id]:data||[]}));
    } catch {}
  };

  // ─── Libro Mayor ─────────────────────────────────────────────
  const cargarMayor = async () => {
    if (!cuentaMayor) { showToast("Selecciona una cuenta","err"); return; }
    setLoadingMayor(true);
    try {
      const lineas = await api(`/asiento_lineas?cuenta_id=eq.${cuentaMayor}&select=*,asientos_contables(fecha,descripcion,referencia)`);
      const filtradas = (lineas||[])
        .filter(l=>{ const f=l.asientos_contables?.fecha||""; return f>=desdeMayor && f<=hastaMayor; })
        .sort((a,b)=>a.asientos_contables?.fecha>b.asientos_contables?.fecha?1:-1);
      setMayorData(filtradas);
    } catch (e) { showToast("Error: "+e.message,"err"); }
    finally { setLoadingMayor(false); }
  };

  // ─── Balance General ─────────────────────────────────────────
  const cargarBalance = async () => {
    setLoadingBalance(true);
    try {
      const lineas = await api(`/asiento_lineas?select=*,asientos_contables(fecha,estado),cuentas_contables(codigo,nombre,tipo,nivel)`);
      const filtradas = (lineas||[]).filter(l=>l.asientos_contables?.fecha<=fechaBalance && l.asientos_contables?.estado==="activo");
      const saldos = {};
      filtradas.forEach(l=>{
        const c=l.cuentas_contables; if(!c) return;
        if(!saldos[l.cuenta_id]) saldos[l.cuenta_id]={...c,debe:0,haber:0};
        saldos[l.cuenta_id].debe+=Number(l.debe);
        saldos[l.cuenta_id].haber+=Number(l.haber);
      });
      const porTipo=(t)=>Object.values(saldos).filter(c=>c.tipo===t&&c.nivel===3).map(c=>({...c,saldo:Number(c.debe)-Number(c.haber)})).filter(c=>Math.abs(c.saldo)>0.001);
      setBalanceData({ activos:porTipo("activo"), pasivos:porTipo("pasivo"), capital:porTipo("capital") });
    } catch (e) { showToast("Error: "+e.message,"err"); }
    finally { setLoadingBalance(false); }
  };

  // ─── Estado de Resultados ────────────────────────────────────
  const cargarResultados = async () => {
    setLoadingResult(true);
    try {
      const lineas = await api(`/asiento_lineas?select=*,asientos_contables(fecha,estado),cuentas_contables(codigo,nombre,tipo,nivel)`);
      const f=(lineas||[]).filter(l=>l.asientos_contables?.fecha>=desdeResult&&l.asientos_contables?.fecha<=hastaResult&&l.asientos_contables?.estado==="activo");
      const saldos={};
      f.forEach(l=>{
        const c=l.cuentas_contables; if(!c) return;
        if(!saldos[l.cuenta_id]) saldos[l.cuenta_id]={...c,debe:0,haber:0};
        saldos[l.cuenta_id].debe+=Number(l.debe);
        saldos[l.cuenta_id].haber+=Number(l.haber);
      });
      const porTipo=(t)=>Object.values(saldos).filter(c=>c.tipo===t&&c.nivel>=2).map(c=>({...c,saldo:Math.abs(Number(c.debe)-Number(c.haber))})).filter(c=>c.saldo>0.001);
      const ingresos=porTipo("ingreso"),costos=porTipo("costo"),gastos=porTipo("gasto");
      const tI=ingresos.reduce((s,c)=>s+c.saldo,0),tC=costos.reduce((s,c)=>s+c.saldo,0),tG=gastos.reduce((s,c)=>s+c.saldo,0);
      setResultData({ ingresos,costos,gastos,tI,tC,tG,utilBruta:tI-tC,utilNeta:tI-tC-tG });
    } catch (e) { showToast("Error: "+e.message,"err"); }
    finally { setLoadingResult(false); }
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER: CATÁLOGO
  // ════════════════════════════════════════════════════════════════
  const renderCatalogo = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:T.txt }}>Catálogo de Cuentas</div>
          <div style={{ fontSize:12, color:T.sub }}>{cuentas.length} cuentas</div>
        </div>
        <button onClick={()=>{ setCuentaForm({codigo:"",nombre:"",tipo:"activo",nivel:3,activa:true}); setEditCuentaId(null); setModalCuenta(true); }} style={S.btn("primary")}>+ Nueva Cuenta</button>
      </div>
      {["activo","pasivo","capital","ingreso","costo","gasto"].map(tipo=>{
        const lista=cuentas.filter(c=>c.tipo===tipo);
        if(!lista.length) return null;
        const color=TIPO_COLOR[tipo];
        return (
          <div key={tipo} style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:800, color, letterSpacing:1.5, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:3, height:14, borderRadius:2, background:color }}/>
              {TIPO_LABEL[tipo].toUpperCase()} ({lista.length})
            </div>
            {lista.map(c=>(
              <div key={c.id} style={{ ...S.card, padding:"9px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:4,
                paddingLeft:c.nivel===1?14:c.nivel===2?24:36,
                background:c.nivel===1?color+"18":c.nivel===2?color+"0a":"transparent",
                border:c.nivel===1?`1px solid ${color}33`:undefined }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color, fontWeight:700, minWidth:56 }}>{c.codigo}</div>
                <div style={{ flex:1, fontSize:c.nivel===1?14:13, fontWeight:c.nivel===1?800:c.nivel===2?600:400, color:T.txt }}>{c.nombre}</div>
                <button onClick={()=>{ setCuentaForm({codigo:c.codigo,nombre:c.nombre,tipo:c.tipo,nivel:c.nivel||3,activa:c.activa}); setEditCuentaId(c.id); setModalCuenta(true); }}
                  style={{ background:"transparent", border:"none", color:T.mut, cursor:"pointer", fontSize:13, padding:"2px 6px" }}>✏️</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // RENDER: LIBRO DIARIO
  // ════════════════════════════════════════════════════════════════
  const renderDiario = () => (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, alignItems:"flex-end", marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800, color:T.txt }}>Libro Diario</div>
          <div style={{ fontSize:12, color:T.sub }}>{asientos.length} asientos en el período</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <div><label style={S.lbl}>DESDE</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={desdeDiario} onChange={e=>setDesdeDiario(e.target.value)}/></div>
          <div><label style={S.lbl}>HASTA</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={hastaDiario} onChange={e=>setHastaDiario(e.target.value)}/></div>
          <button onClick={()=>setModalAsiento(true)} style={{ ...S.btn("primary"), marginTop:18 }}>+ Asiento</button>
        </div>
      </div>
      {loading ? <div style={{ textAlign:"center", padding:40, color:T.sub }}>Cargando...</div>
      : asientos.length===0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📓</div>
          <div style={{ color:T.sub }}>Sin asientos en este período</div>
          <button onClick={()=>setModalAsiento(true)} style={{ ...S.btn("primary"), marginTop:16 }}>Registrar primer asiento</button>
        </div>
      ) : asientos.map(a=>(
        <div key={a.id} style={{ marginBottom:8 }}>
          <div onClick={()=>{ const open=asientoAbierto===a.id; setAsientoAbierto(open?null:a.id); if(!open)cargarLineas(a.id); }}
            style={{ ...S.card, cursor:"pointer", display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ textAlign:"center", flexShrink:0, minWidth:44 }}>
              <div style={{ fontSize:12, color:T.acc, fontWeight:700 }}>{fmtDate(a.fecha).split(" ")[0]}</div>
              <div style={{ fontSize:10, color:T.sub }}>{fmtDate(a.fecha).split(" ").slice(1).join(" ")}</div>
            </div>
            <div style={{ width:1, height:36, background:T.bord, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.txt }}>{a.descripcion}</div>
              {a.referencia && <div style={{ fontSize:11, color:T.sub }}>Ref: {a.referencia}</div>}
              {a.modulo_origen&&a.modulo_origen!=="manual"&&<div style={{ fontSize:10, color:T.acc, fontWeight:600 }}>⚡ Auto: {a.modulo_origen}</div>}
            </div>
            <div style={{ fontSize:16, color:T.mut }}>{asientoAbierto===a.id?"▲":"▼"}</div>
          </div>
          {asientoAbierto===a.id&&(
            <div style={{ background:T.card, borderRadius:"0 0 12px 12px", border:`1px solid ${T.bord}`, borderTop:"none", padding:"12px 16px" }}>
              {!lineasDetalle[a.id] ? <div style={{ color:T.sub, fontSize:12 }}>Cargando...</div> : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 3fr 1fr 1fr", gap:8, marginBottom:6 }}>
                    {["CUENTA","DESCRIPCIÓN","DEBE","HABER"].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:T.mut, textAlign:h==="DEBE"||h==="HABER"?"right":"left" }}>{h}</div>)}
                  </div>
                  {(lineasDetalle[a.id]||[]).map((l,i)=>{
                    const cuenta=cuentas.find(c=>c.id===l.cuenta_id);
                    return (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 3fr 1fr 1fr", gap:8, padding:"5px 0", borderTop:`1px solid ${T.bord}` }}>
                        <div style={{ fontSize:11, color:T.acc, fontFamily:"monospace" }}>{cuenta?.codigo} {cuenta?.nombre||"—"}</div>
                        <div style={{ fontSize:11, color:T.sub }}>{l.descripcion||"—"}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.green, textAlign:"right" }}>{Number(l.debe)>0?fmtN(l.debe):""}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.red,   textAlign:"right" }}>{Number(l.haber)>0?fmtN(l.haber):""}</div>
                      </div>
                    );
                  })}
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 3fr 1fr 1fr", gap:8, padding:"8px 0 0", borderTop:`2px solid ${T.bord}`, marginTop:4 }}>
                    <div style={{ gridColumn:"1/3", fontSize:11, fontWeight:700, color:T.mut }}>TOTALES</div>
                    <div style={{ fontSize:13, fontWeight:800, color:T.green, textAlign:"right" }}>{fmtN((lineasDetalle[a.id]||[]).reduce((s,l)=>s+Number(l.debe),0))}</div>
                    <div style={{ fontSize:13, fontWeight:800, color:T.red,   textAlign:"right" }}>{fmtN((lineasDetalle[a.id]||[]).reduce((s,l)=>s+Number(l.haber),0))}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // RENDER: LIBRO MAYOR
  // ════════════════════════════════════════════════════════════════
  const renderMayor = () => {
    let saldo=0;
    const cuenta=cuentas.find(c=>c.id===cuentaMayor);
    return (
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:T.txt, marginBottom:16 }}>Libro Mayor</div>
        <div style={{ ...S.card, display:"flex", flexWrap:"wrap", gap:12, alignItems:"flex-end", marginBottom:20 }}>
          <div style={{ flex:1, minWidth:180 }}>
            <label style={S.lbl}>CUENTA</label>
            <select style={S.inp} value={cuentaMayor} onChange={e=>setCuentaMayor(e.target.value)}>
              <option value="">— Selecciona cuenta —</option>
              {cuentas.filter(c=>c.nivel===3).map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </div>
          <div><label style={S.lbl}>DESDE</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={desdeMayor} onChange={e=>setDesdeMayor(e.target.value)}/></div>
          <div><label style={S.lbl}>HASTA</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={hastaMayor} onChange={e=>setHastaMayor(e.target.value)}/></div>
          <button onClick={cargarMayor} style={S.btn("primary")} disabled={loadingMayor}>{loadingMayor?"Cargando...":"Consultar"}</button>
        </div>
        {mayorData.length>0 ? (
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:800, color:T.txt, marginBottom:12 }}>
              {cuenta?.codigo} — {cuenta?.nombre}
              <span style={{ marginLeft:8, fontSize:12, color:TIPO_COLOR[cuenta?.tipo], fontWeight:600 }}>{TIPO_LABEL[cuenta?.tipo]}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"90px 2fr 1fr 1fr 1fr", gap:8, padding:"5px 0", borderBottom:`2px solid ${T.bord}`, marginBottom:4 }}>
              {["FECHA","DESCRIPCIÓN","DEBE","HABER","SALDO"].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:T.mut, textAlign:h==="FECHA"||h==="DESCRIPCIÓN"?"left":"right" }}>{h}</div>)}
            </div>
            {mayorData.map((l,i)=>{
              saldo+=Number(l.debe)-Number(l.haber);
              return (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"90px 2fr 1fr 1fr 1fr", gap:8, padding:"7px 0", borderBottom:`1px solid ${T.bord}44` }}>
                  <div style={{ fontSize:11, color:T.sub }}>{fmtDate(l.asientos_contables?.fecha)}</div>
                  <div style={{ fontSize:12, color:T.txt }}>{l.asientos_contables?.descripcion}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.green, textAlign:"right" }}>{Number(l.debe)>0?fmtN(l.debe):""}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.red,   textAlign:"right" }}>{Number(l.haber)>0?fmtN(l.haber):""}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:saldo>=0?T.acc:T.red, textAlign:"right" }}>{fmtN(Math.abs(saldo))}</div>
                </div>
              );
            })}
            <div style={{ display:"grid", gridTemplateColumns:"90px 2fr 1fr 1fr 1fr", gap:8, padding:"9px 0 0", borderTop:`2px solid ${T.bord}`, marginTop:4 }}>
              <div style={{ gridColumn:"1/3", fontSize:11, fontWeight:700, color:T.mut }}>TOTALES</div>
              <div style={{ fontSize:14, fontWeight:800, color:T.green, textAlign:"right" }}>{fmtN(mayorData.reduce((s,l)=>s+Number(l.debe),0))}</div>
              <div style={{ fontSize:14, fontWeight:800, color:T.red,   textAlign:"right" }}>{fmtN(mayorData.reduce((s,l)=>s+Number(l.haber),0))}</div>
              <div style={{ fontSize:14, fontWeight:800, color:T.acc,   textAlign:"right" }}>{fmtN(Math.abs(mayorData.reduce((s,l)=>s+Number(l.debe)-Number(l.haber),0)))}</div>
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign:"center", padding:40, color:T.sub }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
            {cuentaMayor ? "Sin movimientos en el período" : "Selecciona una cuenta y consulta"}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER: BALANCE GENERAL
  // ════════════════════════════════════════════════════════════════
  const renderBalance = () => {
    const tA=balanceData?.activos?.reduce((s,c)=>s+c.saldo,0)||0;
    const tP=balanceData?.pasivos?.reduce((s,c)=>s+Math.abs(c.saldo),0)||0;
    const tK=balanceData?.capital?.reduce((s,c)=>s+Math.abs(c.saldo),0)||0;
    const tPK=tP+tK;
    const cuadrado=Math.abs(tA-tPK)<1;

    const seccion=(titulo,items,color,inv=false)=>(
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:800, color, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:3, height:12, borderRadius:2, background:color }}/>
          {titulo}
        </div>
        {(items||[]).map((c,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${T.bord}44`, fontSize:13 }}>
            <span style={{ color:T.sub }}>{c.codigo} — {c.nombre}</span>
            <span style={{ fontWeight:700, color:T.txt }}>{fmtQ(inv?Math.abs(c.saldo):c.saldo)}</span>
          </div>
        ))}
      </div>
    );

    return (
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:T.txt, marginBottom:16 }}>Balance General</div>
        <div style={{ ...S.card, display:"flex", gap:12, alignItems:"flex-end", marginBottom:20, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}><label style={S.lbl}>AL DÍA</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={fechaBalance} onChange={e=>setFechaBalance(e.target.value)}/></div>
          <button onClick={cargarBalance} style={S.btn("primary")} disabled={loadingBalance}>{loadingBalance?"Calculando...":"Generar Balance"}</button>
        </div>
        {balanceData ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={S.card}>
              {seccion("ACTIVOS",balanceData.activos,TIPO_COLOR.activo)}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderTop:`2px solid ${TIPO_COLOR.activo}`, fontWeight:800 }}>
                <span style={{ color:T.txt }}>TOTAL ACTIVOS</span>
                <span style={{ color:TIPO_COLOR.activo, fontSize:15 }}>{fmtQ(tA)}</span>
              </div>
            </div>
            <div style={S.card}>
              {seccion("PASIVOS",balanceData.pasivos,TIPO_COLOR.pasivo,true)}
              {seccion("CAPITAL",balanceData.capital,TIPO_COLOR.capital,true)}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderTop:`2px solid ${T.bord}`, fontWeight:800 }}>
                <span style={{ color:T.txt }}>TOTAL PASIVO + CAPITAL</span>
                <span style={{ color:cuadrado?T.green:T.red, fontSize:15 }}>{fmtQ(tPK)}</span>
              </div>
            </div>
            <div style={{ gridColumn:"1/-1", ...S.card, textAlign:"center", padding:14, border:`1px solid ${cuadrado?T.acc:T.red}44` }}>
              <div style={{ fontSize:14, fontWeight:800, color:cuadrado?T.acc:T.red }}>
                {cuadrado ? "✅ Balance cuadrado — Activos = Pasivos + Capital" : `⚠️ Diferencia: ${fmtQ(Math.abs(tA-tPK))}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign:"center", padding:48, color:T.sub }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⚖️</div>
            Selecciona la fecha y presiona "Generar Balance"
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER: ESTADO DE RESULTADOS
  // ════════════════════════════════════════════════════════════════
  const renderResultados = () => {
    const fila=(c,color,i)=>(
      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 14px", borderBottom:`1px solid ${T.bord}44`, fontSize:13 }}>
        <span style={{ color:T.sub }}>{c.codigo} — {c.nombre}</span>
        <span style={{ fontWeight:700, color }}>{fmtQ(c.saldo)}</span>
      </div>
    );
    const subtotal=(label,valor,color)=>(
      <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", fontWeight:800, background:color+"11", borderRadius:8, marginBottom:8, marginTop:4 }}>
        <span style={{ color:T.txt }}>{label}</span>
        <span style={{ color, fontSize:15 }}>{fmtQ(valor)}</span>
      </div>
    );
    return (
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:T.txt, marginBottom:16 }}>Estado de Resultados</div>
        <div style={{ ...S.card, display:"flex", gap:12, alignItems:"flex-end", marginBottom:20, flexWrap:"wrap" }}>
          <div><label style={S.lbl}>DESDE</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={desdeResult} onChange={e=>setDesdeResult(e.target.value)}/></div>
          <div><label style={S.lbl}>HASTA</label><input type="date" style={{ ...S.inp, padding:"6px 10px" }} value={hastaResult} onChange={e=>setHastaResult(e.target.value)}/></div>
          <button onClick={cargarResultados} style={S.btn("primary")} disabled={loadingResult}>{loadingResult?"Calculando...":"Generar Reporte"}</button>
        </div>
        {resultData ? (
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:TIPO_COLOR.ingreso, marginBottom:8, letterSpacing:1 }}>INGRESOS</div>
            {resultData.ingresos.map((c,i)=>fila(c,TIPO_COLOR.ingreso,i))}
            {subtotal("TOTAL INGRESOS",resultData.tI,TIPO_COLOR.ingreso)}
            <div style={{ fontSize:11, fontWeight:800, color:TIPO_COLOR.costo, marginBottom:8, letterSpacing:1 }}>COSTOS DE OPERACIÓN</div>
            {resultData.costos.map((c,i)=>fila(c,TIPO_COLOR.costo,i))}
            {subtotal("TOTAL COSTOS",resultData.tC,TIPO_COLOR.costo)}
            {subtotal("UTILIDAD BRUTA",resultData.utilBruta,resultData.utilBruta>=0?T.acc:T.red)}
            <div style={{ fontSize:11, fontWeight:800, color:TIPO_COLOR.gasto, marginBottom:8, letterSpacing:1 }}>GASTOS DE OPERACIÓN</div>
            {resultData.gastos.map((c,i)=>fila(c,TIPO_COLOR.gasto,i))}
            {subtotal("TOTAL GASTOS",resultData.tG,TIPO_COLOR.gasto)}
            <div style={{ padding:16, borderRadius:12, background:resultData.utilNeta>=0?T.accD:T.redD, border:`2px solid ${resultData.utilNeta>=0?T.acc:T.red}44`, display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
              <span style={{ fontSize:15, fontWeight:900, color:T.txt }}>{resultData.utilNeta>=0?"✅ UTILIDAD NETA":"❌ PÉRDIDA NETA"}</span>
              <span style={{ fontSize:22, fontWeight:900, color:resultData.utilNeta>=0?T.acc:T.red }}>{fmtQ(Math.abs(resultData.utilNeta))}</span>
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign:"center", padding:48, color:T.sub }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📈</div>
            Selecciona el período y presiona "Generar Reporte"
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // MODAL: NUEVO ASIENTO
  // ════════════════════════════════════════════════════════════════
  const tD=lineas.reduce((s,l)=>s+Number(l.debe||0),0);
  const tH=lineas.reduce((s,l)=>s+Number(l.haber||0),0);
  const cuadrado=Math.abs(tD-tH)<0.01&&tD>0;

  const renderModalAsiento = () => !modalAsiento ? null : (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={()=>setModalAsiento(false)}>
      <div style={{ background:T.surf, borderRadius:20, width:"100%", maxWidth:720, maxHeight:"90vh", overflowY:"auto", border:`1px solid ${T.bord}` }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.bord}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:T.txt }}>Nuevo Asiento Contable</div>
        </div>
        <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div><label style={S.lbl}>FECHA</label><input type="date" style={S.inp} value={asientoForm.fecha} onChange={e=>setAsientoForm(f=>({...f,fecha:e.target.value}))}/></div>
            <div style={{ gridColumn:"2/4" }}><label style={S.lbl}>DESCRIPCIÓN *</label><input style={S.inp} placeholder="Descripción del asiento..." value={asientoForm.descripcion} onChange={e=>setAsientoForm(f=>({...f,descripcion:e.target.value}))}/></div>
          </div>
          <div><label style={S.lbl}>REFERENCIA</label><input style={S.inp} placeholder="No. factura, recibo, etc." value={asientoForm.referencia} onChange={e=>setAsientoForm(f=>({...f,referencia:e.target.value}))}/></div>
          <div style={{ fontSize:11, fontWeight:700, color:T.mut, letterSpacing:1 }}>LÍNEAS DEL ASIENTO</div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr 28px", gap:6 }}>
            {["CUENTA","DESCRIPCIÓN","DEBE","HABER",""].map(h=><div key={h} style={{ fontSize:10, fontWeight:700, color:T.mut }}>{h}</div>)}
          </div>
          {lineas.map((l,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr 28px", gap:6 }}>
              <select style={{ ...S.inp, fontSize:12 }} value={l.cuenta_id} onChange={e=>{ const n=[...lineas]; n[i]={...n[i],cuenta_id:e.target.value}; setLineas(n); }}>
                <option value="">— Cuenta —</option>
                {cuentas.filter(c=>c.nivel===3).map(c=><option key={c.id} value={c.id}>{c.codigo} {c.nombre}</option>)}
              </select>
              <input style={{ ...S.inp, fontSize:12 }} placeholder="Detalle..." value={l.descripcion} onChange={e=>{ const n=[...lineas]; n[i]={...n[i],descripcion:e.target.value}; setLineas(n); }}/>
              <input type="number" style={{ ...S.inp, fontSize:12 }} placeholder="0.00" min="0" step="0.01" value={l.debe||""}
                onChange={e=>{ const n=[...lineas]; n[i]={...n[i],debe:e.target.value,haber:e.target.value?0:n[i].haber}; setLineas(n); }}/>
              <input type="number" style={{ ...S.inp, fontSize:12 }} placeholder="0.00" min="0" step="0.01" value={l.haber||""}
                onChange={e=>{ const n=[...lineas]; n[i]={...n[i],haber:e.target.value,debe:e.target.value?0:n[i].debe}; setLineas(n); }}/>
              <button onClick={()=>setLineas(lineas.filter((_,j)=>j!==i))} disabled={lineas.length<=2}
                style={{ background:"transparent", border:"none", color:T.mut, cursor:"pointer", fontSize:16, padding:2 }}>✕</button>
            </div>
          ))}
          <button onClick={()=>setLineas([...lineas,{cuenta_id:"",descripcion:"",debe:0,haber:0}])} style={{ ...S.btn("ghost"), alignSelf:"flex-start", fontSize:12 }}>+ Línea</button>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ ...S.card, textAlign:"center", padding:10, border:`1px solid ${T.green}44` }}>
              <div style={{ fontSize:10, color:T.mut }}>TOTAL DEBE</div>
              <div style={{ fontSize:15, fontWeight:800, color:T.green }}>{fmtQ(tD)}</div>
            </div>
            <div style={{ ...S.card, textAlign:"center", padding:10, border:`1px solid ${T.red}44` }}>
              <div style={{ fontSize:10, color:T.mut }}>TOTAL HABER</div>
              <div style={{ fontSize:15, fontWeight:800, color:T.red }}>{fmtQ(tH)}</div>
            </div>
          </div>
          {tD>0 && <div style={{ padding:"8px 14px", borderRadius:8, fontSize:12, background:cuadrado?T.greenD:T.redD, border:`1px solid ${cuadrado?T.green:T.red}44`, color:cuadrado?T.green:T.red }}>
            {cuadrado ? "✅ Asiento cuadrado correctamente" : "⚠️ Debe y Haber deben ser iguales"}
          </div>}
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>setModalAsiento(false)} style={{ ...S.btn("ghost"), flex:1 }}>Cancelar</button>
            <button onClick={guardarAsiento} disabled={guardando||!cuadrado} style={{ ...S.btn("primary"), flex:2, opacity:!cuadrado?0.5:1 }}>
              {guardando?"Guardando...":"Registrar Asiento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // MODAL: CUENTA CONTABLE
  // ════════════════════════════════════════════════════════════════
  const renderModalCuenta = () => !modalCuenta ? null : (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={()=>setModalCuenta(false)}>
      <div style={{ background:T.surf, borderRadius:20, width:"100%", maxWidth:480, border:`1px solid ${T.bord}` }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.bord}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:T.txt }}>{editCuentaId?"Editar Cuenta":"Nueva Cuenta"}</div>
        </div>
        <div style={{ padding:"18px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:12 }}>
            <div><label style={S.lbl}>CÓDIGO *</label><input style={S.inp} placeholder="6.12" value={cuentaForm.codigo} onChange={e=>setCuentaForm(f=>({...f,codigo:e.target.value}))}/></div>
            <div><label style={S.lbl}>NOMBRE *</label><input style={S.inp} placeholder="Nombre de la cuenta" value={cuentaForm.nombre} onChange={e=>setCuentaForm(f=>({...f,nombre:e.target.value}))}/></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={S.lbl}>TIPO</label>
              <select style={S.inp} value={cuentaForm.tipo} onChange={e=>setCuentaForm(f=>({...f,tipo:e.target.value}))}>
                {Object.entries(TIPO_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label style={S.lbl}>NIVEL</label>
              <select style={S.inp} value={cuentaForm.nivel} onChange={e=>setCuentaForm(f=>({...f,nivel:Number(e.target.value)}))}>
                <option value={1}>1 — Principal</option>
                <option value={2}>2 — Grupo</option>
                <option value={3}>3 — Detalle</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>setModalCuenta(false)} style={{ ...S.btn("ghost"), flex:1 }}>Cancelar</button>
            <button onClick={guardarCuenta} disabled={guardando} style={{ ...S.btn("primary"), flex:2 }}>
              {guardando?"Guardando...":editCuentaId?"Actualizar":"Crear Cuenta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:24, overflowX:"auto", paddingBottom:4 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ ...S.btn(tab===t.id?"primary":"ghost"), whiteSpace:"nowrap", fontSize:12, flexShrink:0 }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="catalogo"   && renderCatalogo()}
      {tab==="diario"     && renderDiario()}
      {tab==="mayor"      && renderMayor()}
      {tab==="balance"    && renderBalance()}
      {tab==="resultados" && renderResultados()}
      {renderModalAsiento()}
      {renderModalCuenta()}
    </div>
  );
}
