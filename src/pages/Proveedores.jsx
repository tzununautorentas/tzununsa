import React, { useState, useEffect } from "react";
import { T, S, SB, H, dbIns, dbUpd, dbDel } from "../config.js";
import { Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(opts.extraHeaders || {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const TIPOS = [
  { value:"combustible", label:"⛽ Combustible",        color:"#F59E0B" },
  { value:"repuestos",   label:"🔩 Repuestos",           color:"#6366F1" },
  { value:"mecanica",    label:"🔧 Mecánica / Taller",   color:"#EF4444" },
  { value:"seguros",     label:"🛡️ Seguros",             color:"#10B981" },
  { value:"servicios",   label:"🏢 Servicios Generales", color:"#3B82F6" },
  { value:"papeleria",   label:"📄 Papelería / Oficina", color:"#8B5CF6" },
  { value:"tecnologia",  label:"💻 Tecnología",          color:"#06B6D4" },
  { value:"bancos",      label:"🏦 Bancos / Financiero", color:"#2563EB" },
  { value:"otros",       label:"📦 Otros",               color:"#6B7280" },
];
const tipoInfo = (v) => TIPOS.find(t => t.value === v) || TIPOS[TIPOS.length - 1];

const EMPTY = {
  nombre:"", nit:"", tipo:"otros", telefono:"", email:"",
  direccion:"", contacto_nombre:"", contacto_tel:"", notas:"", activo:true,
};

const fmtQ   = (n) => "Q " + (Number(n)||0).toLocaleString("es-GT",{minimumFractionDigits:2});
const fmtDate = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"}) : "—";

export default function PageProveedores({ showToast, empId }) {
  const [vista, setVista]               = useState("lista");
  const [sel, setSel]                   = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [editId, setEditId]             = useState(null);
  const [filtroTipo, setFiltroTipo]     = useState("todos");
  const [busqueda, setBusqueda]         = useState("");
  const [detTab, setDetTab]             = useState("datos");
  const [historial, setHistorial]       = useState({ gastos:[], compras:[], mantenimientos:[] });
  const [loadingHist, setLoadingHist]   = useState(false);
  const [guardando, setGuardando]       = useState(false);

  const { data: proveedores, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload, desde, hasta } = usePaginacion({
    table: "proveedores",
    query: filtroTipo !== "todos" ? "tipo=eq."+filtroTipo : "",
    search: busqueda,
    columns: ['nombre', 'nit', 'telefono', 'email', 'direccion', 'contacto_nombre', 'contacto_tel', 'notas'],
    order: 'nombre.asc',
  });

  useEffect(() => { setPage(1); }, [filtroTipo]);

  const cargarHistorial = async (provId) => {
    setLoadingHist(true);
    try {
      const [g, m] = await Promise.all([
        apiFetch(`/gastos?proveedor_id=eq.${provId}&order=fecha.desc&limit=50`).catch(()=>[]),
        apiFetch(`/mantenimientos?proveedor_id=eq.${provId}&order=fecha.desc&limit=50`).catch(()=>[]),
      ]);
      setHistorial({ gastos: g||[], compras:[], mantenimientos: m||[] });
    } catch { setHistorial({ gastos:[], compras:[], mantenimientos:[] }); }
    finally { setLoadingHist(false); }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { showToast("El nombre es requerido","err"); return; }
    setGuardando(true);
    try {
      const payload = { ...form, empresa_id: empId };
      let res;
      if (editId) {
        res = await dbUpd("proveedores", editId, payload);
      } else {
        res = await dbIns("proveedores", payload);
      }
      if (res?.error) { showToast("Error: " + res.error,"err"); return; }
      showToast(editId ? "Proveedor actualizado" : "Proveedor creado");
      setVista("lista");
      reload();
    } catch (e) { showToast("Error: " + e.message,"err"); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    await dbDel("proveedores", id);
    showToast("Proveedor eliminado");
    setVista("lista");
    reload();
  };

  const stats = TIPOS.map(t => ({ ...t, count: proveedores.filter(p=>p.tipo===t.value).length })).filter(t=>t.count>0);

  if (vista === "form") {
    const inp = (field, label, type="text", ph="") => (
      <div>
        <label style={S.lbl}>{label}</label>
        <input style={S.inp} type={type} placeholder={ph}
          value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}/>
      </div>
    );
    return (
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={()=>setVista("lista")} style={S.btn("ghost")}>← Volver</button>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:T.txt }}>
            {editId ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>TIPO DE PROVEEDOR</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {TIPOS.map(t => (
                <button key={t.value} onClick={()=>setForm(f=>({...f,tipo:t.value}))}
                  style={{ border:`2px solid ${form.tipo===t.value?t.color:T.bord}`, background:form.tipo===t.value?t.color+"22":"transparent", borderRadius:10, padding:"8px 6px", cursor:"pointer", color:form.tipo===t.value?t.color:T.sub, fontSize:11, fontWeight:600, textAlign:"center" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>DATOS FISCALES</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ gridColumn:"1/-1" }}>{inp("nombre","NOMBRE / RAZÓN SOCIAL *","text","Nombre del proveedor")}</div>
              {inp("nit","NIT","text","1234567-8")}
              {inp("telefono","TELÉFONO","tel","+502 0000-0000")}
              <div style={{ gridColumn:"1/-1" }}>{inp("email","CORREO ELECTRÓNICO","email","proveedor@email.com")}</div>
              <div style={{ gridColumn:"1/-1" }}>{inp("direccion","DIRECCIÓN","text","Dirección completa")}</div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>PERSONA DE CONTACTO</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {inp("contacto_nombre","NOMBRE DEL CONTACTO")}
              {inp("contacto_tel","TELÉFONO DIRECTO")}
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:8, letterSpacing:1 }}>NOTAS INTERNAS</div>
            <textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }}
              placeholder="Condiciones de crédito, observaciones..."
              value={form.notas||""} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/>
          </div>
          <div style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, color:T.txt }}>Proveedor activo</span>
            <button onClick={()=>setForm(f=>({...f,activo:!f.activo}))}
              style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", background:form.activo?T.acc:T.bord, position:"relative", transition:"background .2s" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:"white", position:"absolute", top:3, left:form.activo?22:3, transition:"left .2s" }}/>
            </button>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={()=>setVista("lista")} style={{ ...S.btn("ghost"), flex:1 }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando} style={{ ...S.btn("primary"), flex:2 }}>
              {guardando ? "Guardando..." : editId ? "Actualizar" : "Crear Proveedor"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (vista === "detalle" && sel) {
    const ti = tipoInfo(sel.tipo);
    const totalG = historial.gastos.reduce((s,g)=>s+Number(g.total||0),0);
    const totalM = historial.mantenimientos.reduce((s,m)=>s+Number(m.costo_total||0),0);
    const tabs = [
      { id:"datos",          label:"📋 Datos" },
      { id:"gastos",         label:`💸 Gastos (${historial.gastos.length})` },
      { id:"mantenimientos", label:`🔧 Mantenim. (${historial.mantenimientos.length})` },
    ];
    return (
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <button onClick={()=>setVista("lista")} style={S.btn("ghost")}>← Lista</button>
          <div style={{ flex:1 }}/>
          <button onClick={()=>{ setForm({...EMPTY,...sel}); setEditId(sel.id); setVista("form"); }} style={S.btn("ghost")}>✏️ Editar</button>
          <button onClick={()=>eliminar(sel.id)} style={{ ...S.btn("ghost"), color:T.red, borderColor:T.red+"44" }}>🗑️</button>
        </div>

        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
            <div style={{ width:52, height:52, borderRadius:14, background:ti.color+"22", border:`2px solid ${ti.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
              {ti.label.split(" ")[0]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.txt }}>{sel.nombre}</div>
              <div style={{ fontSize:12, color:ti.color, fontWeight:600 }}>{ti.label}</div>
              {sel.nit && <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>NIT: {sel.nit}</div>}
            </div>
            <div style={{ padding:"3px 10px", borderRadius:20, background:sel.activo?T.greenD:T.redD, color:sel.activo?T.green:T.red, fontSize:11, fontWeight:700 }}>
              {sel.activo?"ACTIVO":"INACTIVO"}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { l:"Total Gastos",    v:fmtQ(totalG), c:T.red  },
            { l:"Mantenimientos",  v:fmtQ(totalM), c:T.sec  },
            { l:"TOTAL HISTÓRICO", v:fmtQ(totalG+totalM), c:T.acc, hi:true },
          ].map(s=>(
            <div key={s.l} style={{ ...S.card, textAlign:"center", padding:12, border:s.hi?`1px solid ${s.c}44`:undefined }}>
              <div style={{ fontSize:10, color:T.mut, marginBottom:4 }}>{s.l}</div>
              <div style={{ fontSize:14, fontWeight:800, color:s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setDetTab(t.id)}
              style={{ ...S.btn(detTab===t.id?"primary":"ghost"), fontSize:12 }}>
              {t.label}
            </button>
          ))}
        </div>

        {detTab==="datos" && (
          <div style={S.card}>
            {[["Nombre",sel.nombre],["NIT",sel.nit||"—"],["Tipo",ti.label],["Teléfono",sel.telefono||"—"],["Email",sel.email||"—"],["Dirección",sel.direccion||"—"],["Contacto",sel.contacto_nombre||"—"],["Tel. Contacto",sel.contacto_tel||"—"],["Notas",sel.notas||"—"],["Registrado",fmtDate(sel.created_at)]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.bord}`, gap:12 }}>
                <span style={{ fontSize:12, color:T.sub, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:13, color:T.txt, textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {detTab==="gastos" && (
          <div style={S.card}>
            {loadingHist ? <div style={{ color:T.sub, textAlign:"center", padding:24 }}>Cargando...</div>
            : historial.gastos.length===0 ? <div style={{ color:T.mut, textAlign:"center", padding:24 }}>Sin gastos registrados</div>
            : historial.gastos.map(g=>(
              <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.txt }}>{g.descripcion||g.categoria||"Gasto"}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{fmtDate(g.fecha)}</div>
                </div>
                <div style={{ fontWeight:700, color:T.red }}>{fmtQ(g.total)}</div>
              </div>
            ))}
          </div>
        )}

        {detTab==="mantenimientos" && (
          <div style={S.card}>
            {loadingHist ? <div style={{ color:T.sub, textAlign:"center", padding:24 }}>Cargando...</div>
            : historial.mantenimientos.length===0 ? <div style={{ color:T.mut, textAlign:"center", padding:24 }}>Sin mantenimientos registrados</div>
            : historial.mantenimientos.map(m=>(
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.txt }}>{m.tipo_mantenimiento||m.descripcion||"Mantenimiento"}</div>
                  <div style={{ fontSize:11, color:T.sub }}>{fmtDate(m.fecha)}</div>
                </div>
                <div style={{ fontWeight:700, color:T.sec }}>{fmtQ(m.costo_total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:T.txt }}>Proveedores</h2>
          <div style={{ fontSize:12, color:T.sub }}>{total} registrados</div>
        </div>
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, NIT, telefono..." />
        <button onClick={()=>{ setForm(EMPTY); setEditId(null); setVista("form"); }} style={S.btn("primary")}>+ Nuevo</button>
      </div>

      {stats.length>0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16, paddingBottom:4 }}>
          <button onClick={()=>setFiltroTipo("todos")}
            style={{ border:`2px solid ${filtroTipo==="todos"?T.acc:T.bord}`, background:filtroTipo==="todos"?T.accD:"transparent", borderRadius:10, padding:"6px 14px", cursor:"pointer", color:filtroTipo==="todos"?T.acc:T.sub, fontSize:12, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
            Todos ({total})
          </button>
          {stats.map(s=>(
            <button key={s.value} onClick={()=>setFiltroTipo(s.value)}
              style={{ border:`2px solid ${filtroTipo===s.value?s.color:T.bord}`, background:filtroTipo===s.value?s.color+"22":"transparent", borderRadius:10, padding:"6px 14px", cursor:"pointer", color:filtroTipo===s.value?s.color:T.sub, fontSize:12, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
              {s.label.replace(/^\S+\s/,"")} ({s.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:T.sub }}>Cargando proveedores...</div>
      ) : proveedores.length===0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
          <div style={{ color:T.sub, fontSize:14 }}>
            {total===0 ? "Aún no hay proveedores" : "Sin resultados"}
          </div>
          {total===0 && (
            <button onClick={()=>{ setForm(EMPTY); setEditId(null); setVista("form"); }} style={{ ...S.btn("primary"), marginTop:16 }}>
              Agregar primer proveedor
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {proveedores.map(p => {
            const ti = tipoInfo(p.tipo);
            return (
              <div key={p.id} onClick={()=>{ setSel(p); setDetTab("datos"); setVista("detalle"); cargarHistorial(p.id); }}
                style={{ ...S.card, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=ti.color+"66"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.bord}>
                <div style={{ width:44, height:44, borderRadius:12, background:ti.color+"22", border:`2px solid ${ti.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                  {ti.label.split(" ")[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.nombre}</div>
                  <div style={{ fontSize:11, color:T.sub }}>
                    {p.nit?`NIT: ${p.nit}`:"Sin NIT"} · {p.telefono||"Sin telefono"}
                  </div>
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:ti.color, background:ti.color+"22", padding:"2px 8px", borderRadius:20, flexShrink:0 }}>
                  {ti.label.replace(/^\S+\s/,"")}
                </div>
                <div style={{ color:T.mut, fontSize:18, flexShrink:0 }}>›</div>
              </div>
            );
          })}
        </div>
      )}

      <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
    </div>
  );
}
