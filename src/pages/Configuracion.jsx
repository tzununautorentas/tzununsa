import React, { useState, useEffect, useRef, Component } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, sbLogin, sbLogout, today, newId, getEmpId, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES, RUTAS, LOGO_B64 } from '../config.js';
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir, ErrBoundary } from '../components/shared.jsx';

export default function PageConfiguracion({showToast}){
  const [tab, setTab] = useState("empresa");
  const [emp, setEmp] = useState({});
  const [empId, setEmpId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exch, setExch] = useState(7.70);
  const [iva, setIva] = useState(5);
  const [catalogo, setCatalogo] = useState(CATALOGO.map(v=>({...v})));
  const [editId, setEditId] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [showNewVeh, setShowNewVeh] = useState(false);
  const [newVeh, setNewVeh] = useState({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
  const TIPOS = ["Sedan","SUV","Pickup","Van","Microbus","Bus"];

  useEffect(()=>{
    dbGet("empresas","&select=*&limit=1").then(d=>{if(d&&d[0]){setEmp(d[0]);setEmpId(d[0].id);}});
  },[]);

  const guardarEmp = async()=>{
    if(!emp.nombre?.trim()){showToast("Nombre requerido","err");return;}
    setSaving(true);
    if(empId) await dbUpd("empresas",empId,{
      nombre: emp.nombre, nit: emp.nit, direccion: emp.direccion,
      telefono: emp.telefono, email: emp.email,
    });
    showToast("Guardado");
    setSaving(false);
  };

  const se = (k,v) => setEmp(p=>({...p,[k]:v}));

  const saveEdit = () => {
    setCatalogo(p=>p.map(v=>v.id===editId?{...v,...editVals}:v));
    setEditId(null);
    showToast("Tarifa actualizada");
  };

  const delVeh = id => {
    if(!confirm("Eliminar?")) return;
    setCatalogo(p=>p.filter(v=>v.id!==id));
  };

  const addVeh = () => {
    if(!newVeh.nombre.trim()){showToast("Nombre requerido","err");return;}
    setCatalogo(p=>[...p,{
      ...newVeh, id:`c${Date.now()}`,
      dia: parseFloat(newVeh.dia)||0,
      sem: parseFloat(newVeh.sem)||0,
      mes: parseFloat(newVeh.mes)||0,
    }]);
    setNewVeh({nombre:"",tipo:"SUV",dia:"",sem:"",mes:""});
    setShowNewVeh(false);
    showToast("Agregado");
  };

  return(
    <div>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bord}`,marginBottom:20}}>
        {[
          {id:"empresa", l:"Empresa"},
          {id:"tarifas",  l:"Tarifas"},
          {id:"fiscal",   l:"Fiscal"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{
              padding:"10px 16px", background:"transparent", border:"none",
              cursor:"pointer", fontSize:13, fontWeight:600,
              color: tab===t.id ? T.acc : T.sub,
              borderBottom: tab===t.id ? `2px solid ${T.acc}` : "2px solid transparent",
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab==="empresa" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Datos de la Empresa</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:11}}>
              <Fld label="NOMBRE" span2>
                <input style={S.inp} value={emp.nombre||""} onChange={e=>se("nombre",e.target.value)} placeholder="Tz'unun AutoRentas"/>
              </Fld>
              <Fld label="NIT">
                <input style={S.inp} value={emp.nit||""} onChange={e=>se("nit",e.target.value)} placeholder="16693949"/>
              </Fld>
              <Fld label="TELEFONO">
                <input style={S.inp} value={emp.telefono||""} onChange={e=>se("telefono",e.target.value)} placeholder="502-31221538"/>
              </Fld>
              <Fld label="EMAIL" span2>
                <input style={S.inp} value={emp.email||""} onChange={e=>se("email",e.target.value)} placeholder="tzununautorentas@gmail.com"/>
              </Fld>
              <Fld label="DIRECCION" span2>
                <input style={S.inp} value={emp.direccion||""} onChange={e=>se("direccion",e.target.value)} placeholder="2da. Avenida 0-68, Col. Bran, Zona 3"/>
              </Fld>
              <div style={{gridColumn:"span 2"}}>
                <button onClick={guardarEmp} disabled={saving} style={{...S.btn("primary"),width:"100%"}}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:12}}>Vista previa encabezado</div>
            <div style={{background:T.surf, borderRadius:10, padding:16, border:`1px solid ${T.bord}`}}>
              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:10}}>
                <div style={{width:44,height:44,borderRadius:10,background:T.accDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:T.acc}}>T</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:T.acc}}>{emp.nombre||"Tz'unun AutoRentas"}</div>
                  <div style={{fontSize:10,color:T.sub}}>MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</div>
                </div>
              </div>
              <div style={{fontSize:11,color:T.sub, lineHeight:1.8}}>
                <div>{emp.direccion||"2da. Av. 0-68, Col. Bran, Zona 3"}</div>
                <div>{emp.telefono||"502-31221538"}</div>
                <div>{emp.email||"tzununautorentas@gmail.com"}</div>
                <div>NIT: {emp.nit||"16693949"}</div>
              </div>
            </div>
            <div style={{...S.card, marginTop:12, background:T.surf, fontSize:12, color:T.sub, lineHeight:2}}>
              <div>Banco Industrial - 853-000016-8</div>
              <div>Banrural - 3309159475</div>
            </div>
          </div>
        </div>
      )}

      {tab==="tarifas" && (
        <div style={S.card}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700}}>Catalogo y Tarifas</div>
            <button onClick={()=>setShowNewVeh(!showNewVeh)} style={{...S.btn(showNewVeh?"warn":"primary"),fontSize:12}}>
              {showNewVeh ? "Cancelar" : "+ Agregar vehiculo"}
            </button>
          </div>
          {showNewVeh && (
            <div style={{
              background:T.surf, borderRadius:10, padding:14, marginBottom:14,
              display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"flex-end",
            }}>
              <Fld label="NOMBRE"><input style={S.inp} value={newVeh.nombre} onChange={e=>setNewVeh(p=>({...p,nombre:e.target.value}))} placeholder="Nombre..."/></Fld>
              <Fld label="TIPO"><select style={S.sel} value={newVeh.tipo} onChange={e=>setNewVeh(p=>({...p,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
              <Fld label="Q/DIA"><input style={S.inp} type="number" value={newVeh.dia} onChange={e=>setNewVeh(p=>({...p,dia:e.target.value}))} placeholder="0"/></Fld>
              <Fld label="Q/SEM"><input style={S.inp} type="number" value={newVeh.sem} onChange={e=>setNewVeh(p=>({...p,sem:e.target.value}))} placeholder="0"/></Fld>
              <Fld label="Q/MES"><input style={S.inp} type="number" value={newVeh.mes} onChange={e=>setNewVeh(p=>({...p,mes:e.target.value}))} placeholder="0"/></Fld>
              <button onClick={addVeh} style={{...S.btn("primary"),padding:"9px 14px",alignSelf:"flex-end"}}>+</button>
            </div>
          )}
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["Vehiculo","Tipo","Q/Dia","Q/Semana","Q/Mes",""].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {catalogo.map(v=>(
                <tr key={v.id}>
                  <td style={{...S.td,fontWeight:600}}>
                    {editId===v.id ? (
                      <input style={{...S.inp,padding:"5px 8px",fontSize:12}} value={editVals.nombre} onChange={e=>setEditVals(p=>({...p,nombre:e.target.value}))}/>
                    ) : v.nombre}
                  </td>
                  <td style={S.td}>
                    {editId===v.id ? (
                      <select style={{...S.sel,padding:"5px 8px",fontSize:12}} value={editVals.tipo} onChange={e=>setEditVals(p=>({...p,tipo:e.target.value}))}>
                        {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : v.tipo}
                  </td>
                  {["dia","sem","mes"].map(c=>(
                    <td key={c} style={{...S.td,fontWeight:700,color:T.acc}}>
                      {editId===v.id ? (
                        <input style={{...S.inp,padding:"5px 8px",fontSize:12,width:80}} type="number" value={editVals[c]} onChange={e=>setEditVals(p=>({...p,[c]:parseFloat(e.target.value)||0}))}/>
                      ) : `Q ${fmt(v[c])}`}
                    </td>
                  ))}
                  <td style={S.td}>
                    <div style={{display:"flex",gap:4}}>
                      {editId===v.id ? (
                        <>
                          <button onClick={saveEdit} style={{...S.btn("primary"),padding:"4px 9px",fontSize:11}}>OK</button>
                          <button onClick={()=>setEditId(null)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>X</button>
                        </>
                      ) : (
                        <>
                          <button onClick={()=>{setEditId(v.id);setEditVals({...v});}} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:11}}>Editar</button>
                          <button onClick={()=>delVeh(v.id)} style={{...S.btn("danger"),padding:"4px 9px",fontSize:11}}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:10,fontSize:11,color:T.mut}}>
            * 1-7 dias = diaria / 8-29 dias = semanal / 30+ dias = mensual
          </div>
        </div>
      )}

      {tab==="fiscal" && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Tasa de Cambio del Dia</div>
            <label style={S.lbl}>GTQ POR 1 USD</label>
            <input style={{...S.inp,fontSize:20,fontWeight:700,color:T.acc}} type="number" step="0.01" value={exch} onChange={e=>setExch(parseFloat(e.target.value)||7.70)}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"10px 14px",background:T.surf,borderRadius:9,fontSize:14}}>
              <span style={{color:T.sub}}>1 USD =</span>
              <span style={{fontWeight:800,color:T.acc}}>Q {fmt(exch)}</span>
            </div>
          </div>
          <div style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>Regimen Fiscal</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {v:12, l:"12% - Regimen General"},
                {v:5,  l:"5% - Pequeno Contribuyente"},
                {v:0,  l:"Sin IVA"},
              ].map(o=>(
                <button key={o.v} onClick={()=>setIva(o.v)}
                  style={{...S.btn(iva===o.v?"primary":"ghost"), textAlign:"left"}}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
