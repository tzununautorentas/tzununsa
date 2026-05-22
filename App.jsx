import React, { useState, useEffect, Component } from "react";
import { T, S, sbLogin, sbLogout, dbGet } from "./config.js";

import PageDashboard     from "./pages/Dashboard.jsx";
import PageCalculadora   from "./pages/Calculadora.jsx";
import PageCotizaciones  from "./pages/Cotizaciones.jsx";
import PageReservas      from "./pages/Reservas.jsx";
import PageFlota         from "./pages/Flota.jsx";
import PageMantenimiento from "./pages/Mantenimiento.jsx";
import PageClientes      from "./pages/Clientes.jsx";
import PageCatalogo      from "./pages/Catalogo.jsx";
import PageFacturacion   from "./pages/Facturacion.jsx";
import PageBanca         from "./pages/Banca.jsx";
import PageGastos        from "./pages/Gastos.jsx";
import PagePagos         from "./pages/Pagos.jsx";
import PageContabilidad  from "./pages/Contabilidad.jsx";
import PageReportes      from "./pages/Reportes.jsx";
import PageProveedores   from "./pages/Proveedores.jsx";

// ─── Error Boundary ───────────────────────────────────────────────
class ErrBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ ...S.card, margin: 16 }}>
        <div style={{ color: T.red, fontWeight: 700, marginBottom: 8 }}>Error en este modulo</div>
        <div style={{ fontSize: 12, color: T.sub, fontFamily: "monospace", marginBottom: 12 }}>
          {String(this.state.err)}
        </div>
        <button onClick={() => this.setState({ err: null })} style={S.btn("primary")}>
          Reintentar
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Modulos ──────────────────────────────────────────────────────
const MODS = [
  { id:"dashboard",     label:"Dashboard",       letters:"DB", c1:"#00D4AA", c2:"#009a7a" },
  { id:"calculadora",   label:"Calculadora",     letters:"CA", c1:"#3B82F6", c2:"#1d4ed8" },
  { id:"cotizaciones",  label:"Cotizaciones",    letters:"CO", c1:"#6366f1", c2:"#4338ca" },
  { id:"reservas",      label:"Reservas",        letters:"RE", c1:"#A855F7", c2:"#7e22ce" },
  { id:"flota",         label:"Flota",           letters:"FL", c1:"#10B981", c2:"#047857" },
  { id:"mantenimiento", label:"Mantenim.",       letters:"MT", c1:"#F59E0B", c2:"#b45309" },
  { id:"clientes",      label:"Clientes",        letters:"CL", c1:"#22C55E", c2:"#15803d" },
  { id:"catalogo",      label:"Catalogo",        letters:"KT", c1:"#06B6D4", c2:"#0e7490" },
  { id:"facturacion",   label:"Facturas FEL",    letters:"FA", c1:"#00D4AA", c2:"#00796b" },
  { id:"banca",         label:"La Banca",        letters:"BA", c1:"#2563EB", c2:"#1e40af" },
  { id:"gastos",        label:"Gastos",          letters:"GS", c1:"#EF4444", c2:"#b91c1c" },
  { id:"pagos",         label:"Pagos",           letters:"PG", c1:"#22C55E", c2:"#166534" },
  { id:"proveedores",   label:"Proveedores",     letters:"PV", c1:"#F97316", c2:"#c2410c" },
  { id:"contabilidad",  label:"Contabilidad",    letters:"AC", c1:"#8B5CF6", c2:"#6d28d9" },
  { id:"reportes",      label:"Reportes",        letters:"RP", c1:"#EC4899", c2:"#be185d" },
];

const TITULOS = {
  dashboard:"Dashboard", calculadora:"Calculadora", cotizaciones:"Cotizaciones",
  reservas:"Reservas", flota:"Flota", mantenimiento:"Mantenimiento",
  clientes:"Clientes", catalogo:"Catalogo de Servicios",
  facturacion:"Facturacion FEL", banca:"La Banca",
  gastos:"Gastos y Compras", pagos:"Pagos Recibidos",
  proveedores:"Proveedores", contabilidad:"Contabilidad", reportes:"Reportes",
};

const BOTTOM_TABS = [
  { id:"dashboard",    label:"Inicio",   mods:["dashboard"] },
  { id:"cotizaciones", label:"Negocio",  mods:["calculadora","cotizaciones","reservas"] },
  { id:"flota",        label:"Flota",    mods:["flota","mantenimiento","clientes","catalogo"] },
  { id:"banca",        label:"Finanzas", mods:["facturacion","banca","gastos","pagos"] },
  { id:"__menu__",     label:"Mas",      mods:[] },
];

const DESKTOP_NAV = [
  { sep:true, label:"PRINCIPAL"    },
  { id:"dashboard",     label:"Dashboard",       c:"#00D4AA" },
  { sep:true, label:"PRESUPUESTOS" },
  { id:"calculadora",   label:"Calculadora",     c:"#3B82F6" },
  { id:"cotizaciones",  label:"Cotizaciones",    c:"#6366f1" },
  { id:"reservas",      label:"Reservas",        c:"#A855F7" },
  { sep:true, label:"OPERACION"    },
  { id:"flota",         label:"Flota",           c:"#10B981" },
  { id:"mantenimiento", label:"Mantenimiento",   c:"#F59E0B" },
  { id:"clientes",      label:"Clientes",        c:"#22C55E" },
  { id:"catalogo",      label:"Catalogo",        c:"#06B6D4" },
  { sep:true, label:"FINANZAS"     },
  { id:"facturacion",   label:"Facturacion FEL", c:"#00D4AA" },
  { id:"banca",         label:"La Banca",        c:"#2563EB" },
  { id:"gastos",        label:"Gastos / Compras",c:"#EF4444" },
  { id:"pagos",         label:"Pagos Recibidos", c:"#22C55E" },
  { id:"proveedores",   label:"Proveedores",     c:"#F97316" },
  { id:"contabilidad",  label:"Contabilidad",    c:"#8B5CF6" },
  { sep:true, label:"ANALISIS"     },
  { id:"reportes",      label:"Reportes",        c:"#EC4899" },
];

// ─── Icono modulo ─────────────────────────────────────────────────
function ModIcon({ mod, size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: `linear-gradient(135deg,${mod.c1},${mod.c2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.28), fontWeight: 900, color: "white",
      letterSpacing: -0.5, flexShrink: 0,
    }}>
      {mod.letters}
    </div>
  );
}

// ─── Render pagina ────────────────────────────────────────────────
function RenderPage({ pag, empId, showToast }) {
  const p = { showToast, empId };
  const pages = {
    dashboard:     <PageDashboard     {...p} />,
    calculadora:   <PageCalculadora   {...p} />,
    cotizaciones:  <PageCotizaciones  {...p} />,
    reservas:      <PageReservas      {...p} />,
    flota:         <PageFlota         {...p} />,
    mantenimiento: <PageMantenimiento {...p} />,
    clientes:      <PageClientes      {...p} />,
    catalogo:      <PageCatalogo      {...p} />,
    facturacion:   <PageFacturacion   {...p} />,
    banca:         <PageBanca         {...p} />,
    gastos:        <PageGastos        {...p} />,
    pagos:         <PagePagos         {...p} />,
    proveedores:   <PageProveedores   {...p} />,
    contabilidad:  <PageContabilidad  {...p} />,
    reportes:      <PageReportes      {...p} />,
  };
  return pages[pag] || pages.dashboard;
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const c = toast.type === "err" ? T.red : T.acc;
  return (
    <div style={{
      position: "fixed", bottom: 80, right: 16, zIndex: 9999,
      background: T.card, border: `1px solid ${c}`, borderRadius: 14,
      padding: "12px 18px", fontSize: 13, color: c, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)", maxWidth: 320,
    }}>
      {toast.type === "err" ? "Error" : "Listo"} — {toast.msg}
    </div>
  );
}

// ─── Menu movil (bottom sheet) ────────────────────────────────────
function MenuMobile({ pag, onSelect, onClose }) {
  const sections = [
    { label:"PRESUPUESTOS", ids:["calculadora","cotizaciones","reservas"] },
    { label:"OPERACION",    ids:["flota","mantenimiento","clientes","catalogo"] },
    { label:"FINANZAS",     ids:["facturacion","banca","gastos","pagos"] },
    { label:"ANALISIS",     ids:["proveedores","contabilidad","reportes"] },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500 }}
      onClick={onClose}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.surf, borderRadius:"24px 24px 0 0", maxHeight:"85vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width:48, height:4, background:T.bord, borderRadius:2, margin:"14px auto 0" }} />
        <div style={{ padding:"16px 18px 100px" }}>
          <div style={{ fontSize:17, fontWeight:800, color:T.txt, marginBottom:20 }}>
            Todos los modulos
          </div>
          {sections.map(sec => (
            <div key={sec.label} style={{ marginBottom:24 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.mut, letterSpacing:1.5, marginBottom:12 }}>
                {sec.label}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {sec.ids.map(id => {
                  const m = MODS.find(x => x.id === id);
                  if (!m) return null;
                  return (
                    <button key={id} onClick={() => onSelect(id)}
                      style={{ background: pag===id ? m.c1+"22" : T.card, border:`1.5px solid ${pag===id ? m.c1 : T.bord}`, borderRadius:16, padding:"12px 6px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                      <ModIcon mod={m} size={44} />
                      <span style={{ fontSize:9, color: pag===id ? m.c1 : T.sub, fontWeight: pag===id ? 700 : 400, textAlign:"center", lineHeight:1.3 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Home movil ───────────────────────────────────────────────────
function HomeMovil({ setPag, userName }) {
  const [stats, setStats] = useState({ veh:0, res:0, cots:0 });
  useEffect(() => {
    Promise.all([
      dbGet("vehiculos", ""),
      dbGet("reservas", "&estado=in.(confirmada,en_curso)"),
      dbGet("cotizaciones", "&estado=eq.enviada"),
    ]).then(([v, r, c]) => setStats({
      veh:  (Array.isArray(v) ? v : []).filter(x => x.estado === "disponible").length,
      res:  (Array.isArray(r) ? r : []).length,
      cots: (Array.isArray(c) ? c : []).length,
    }));
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos dias" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const QUICK = ["cotizaciones","reservas","flota","banca","gastos","facturacion"];

  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${T.card},${T.bord})`, borderRadius:20, padding:"20px 18px", marginBottom:20, border:`1px solid ${T.bord}` }}>
        <div style={{ fontSize:13, color:T.sub }}>{saludo},</div>
        <div style={{ fontSize:22, fontWeight:800, color:T.txt, marginTop:2 }}>{userName}</div>
        <div style={{ fontSize:11, color:T.acc, marginTop:4 }}>Tz'unun AutoRentas</div>
        <div style={{ display:"flex", gap:12, marginTop:16 }}>
          {[
            { l:"Vehiculos libres", v:stats.veh,  c:T.acc  },
            { l:"Reservas activas", v:stats.res,  c:T.blue },
            { l:"Cots. en espera",  v:stats.cots, c:T.sec  },
          ].map((s, i) => (
            <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:9, color:T.sub, marginTop:2, lineHeight:1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:T.mut, marginBottom:12 }}>ACCESOS RAPIDOS</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {QUICK.map(id => {
          const m = MODS.find(x => x.id === id);
          if (!m) return null;
          return (
            <button key={id} onClick={() => setPag(id)}
              style={{ background:T.card, border:`1px solid ${T.bord}`, borderRadius:18, padding:"18px 8px 14px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}
              onMouseEnter={e => { e.currentTarget.style.background = m.c1+"18"; e.currentTarget.style.borderColor = m.c1+"66"; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.bord; }}>
              <ModIcon mod={m} size={52} />
              <span style={{ fontSize:11, color:T.txt, fontWeight:600, textAlign:"center" }}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Layout movil ─────────────────────────────────────────────────
function LayoutMovil({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [showMenu, setShowMenu] = useState(false);
  const [onHome, setOnHome]     = useState(true);
  const userName = userEmail.split("@")[0];
  const navegar  = (id) => { setPag(id); setOnHome(false); setShowMenu(false); };
  const activeTab = BOTTOM_TABS.find(t => t.mods.includes(pag))?.id || (onHome ? "dashboard" : "__menu__");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:T.bg, color:T.txt, fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background:T.surf, padding:"14px 16px 12px", display:"flex", alignItems:"center", gap:12, flexShrink:0, borderBottom:`1px solid ${T.bord}` }}>
        <button onClick={() => setOnHome(true)}
          style={{ width:40, height:40, borderRadius:12, background:T.accDim, border:`1.5px solid ${T.acc}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:T.acc, cursor:"pointer" }}>
          T
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:T.txt }}>Tz'unun AutoRentas</div>
          <div style={{ fontSize:10, color:T.sub }}>{onHome ? "Inicio" : TITULOS[pag] || ""}</div>
        </div>
        <button onClick={handleLogout}
          style={{ width:36, height:36, borderRadius:10, background:T.card, border:`1px solid ${T.bord}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:T.sub, cursor:"pointer" }}>
          X
        </button>
      </div>

      {/* Contenido */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 14px", paddingBottom:90 }}>
        {onHome
          ? <HomeMovil setPag={navegar} userName={userName} />
          : <ErrBoundary><RenderPage pag={pag} empId={empId} showToast={showToast} /></ErrBoundary>
        }
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:T.surf, borderTop:`1px solid ${T.bord}`, display:"flex", zIndex:300 }}>
        {BOTTOM_TABS.map(tab => {
          const isActive = tab.id === "__menu__" ? false
            : tab.id === "dashboard" ? onHome
            : activeTab === tab.id && !onHome;
          const m = MODS.find(x => x.id === tab.id);
          const color = m?.c1 || T.acc;
          return (
            <button key={tab.id}
              onClick={() => {
                if (tab.id === "__menu__") setShowMenu(true);
                else if (tab.id === "dashboard") setOnHome(true);
                else navegar(tab.mods[0]);
              }}
              style={{ flex:1, background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0 8px", gap:4, position:"relative" }}>
              {isActive && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:32, height:3, background:color, borderRadius:"0 0 3px 3px" }} />}
              <div style={{ width:36, height:36, borderRadius:10, background:isActive ? color+"22" : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {tab.id === "__menu__"
                  ? <span style={{ fontSize:20, color:T.mut, letterSpacing:3 }}>...</span>
                  : m ? <div style={{ width:22, height:22, borderRadius:6, background:`linear-gradient(135deg,${m.c1},${m.c2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"white" }}>{m.letters.slice(0,2)}</div>
                  : null}
              </div>
              <div style={{ fontSize:9, color:isActive ? color : T.mut, fontWeight:isActive ? 700 : 400 }}>{tab.label}</div>
            </button>
          );
        })}
      </div>

      {showMenu && <MenuMobile pag={pag} onSelect={navegar} onClose={() => setShowMenu(false)} />}
      <Toast toast={toast} />
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]     = useState("");
  const [pwd, setPwd]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const login = async (e) => {
    e.preventDefault();
    if (!email || !pwd) { setError("Ingresa correo y contrasena"); return; }
    setLoading(true); setError("");
    const res = await sbLogin(email, pwd);
    if (res.error || res.error_description) setError("Credenciales incorrectas");
    else onLogin(res);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,#00D4AA,#009a7a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:900, color:"white", margin:"0 auto 16px" }}>T</div>
          <div style={{ fontSize:26, fontWeight:800, color:T.acc }}>Tz'unun SA</div>
          <div style={{ fontSize:13, color:T.sub, marginTop:4 }}>Sistema de Gestion</div>
        </div>
        <form onSubmit={login} style={{ ...S.card, display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={S.lbl}>CORREO</label>
            <input style={S.inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" autoFocus />
          </div>
          <div>
            <label style={S.lbl}>CONTRASENA</label>
            <input style={S.inp} type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="........" />
          </div>
          {error && <div style={{ background:T.redD, border:`1px solid ${T.red}44`, borderRadius:8, padding:"10px 14px", fontSize:13, color:T.red }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding:14, fontSize:14 }}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Layout Desktop ───────────────────────────────────────────────
function LayoutDesktop({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [collapsed, setCollapsed] = useState(false);
  const userName = userEmail.split("@")[0];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.txt, fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width:collapsed ? 56 : 216, background:T.surf, borderRight:`1px solid ${T.bord}`, flexShrink:0, display:"flex", flexDirection:"column", transition:"width .2s", overflow:"hidden" }}>
        <div style={{ padding:collapsed ? "16px 0" : "16px 14px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${T.bord}`, justifyContent:collapsed ? "center" : "flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#00D4AA,#009a7a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"white", flexShrink:0 }}>T</div>
          {!collapsed && <div><div style={{ fontSize:13, fontWeight:800, color:T.acc }}>Tz'unun</div><div style={{ fontSize:9, color:T.sub }}>AutoRentas</div></div>}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
          {DESKTOP_NAV.map((item, i) => {
            if (item.sep) return collapsed ? null : (
              <div key={i} style={{ fontSize:9, fontWeight:700, color:T.mut, letterSpacing:1.5, padding:"12px 14px 3px" }}>{item.label}</div>
            );
            const active = pag === item.id;
            return (
              <div key={item.id} onClick={() => setPag(item.id)}
                style={{ display:"flex", alignItems:"center", gap:9, padding:collapsed ? "9px 0" : "8px 12px", cursor:"pointer", background:active ? item.c+"18" : "transparent", borderRight:active ? `2px solid ${item.c}` : "2px solid transparent", justifyContent:collapsed ? "center" : "flex-start" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.card; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:active ? item.c : T.bord, flexShrink:0 }} />
                {!collapsed && <span style={{ fontSize:12, fontWeight:active ? 700 : 400, color:active ? item.c : T.txt, whiteSpace:"nowrap" }}>{item.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ borderTop:`1px solid ${T.bord}`, padding:collapsed ? "10px 4px" : "10px 12px" }}>
          {!collapsed && <div style={{ fontSize:10, color:T.sub, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userName}</div>}
          <button onClick={handleLogout} style={{ ...S.btn("ghost"), width:"100%", fontSize:11, padding:"6px 8px" }}>
            {collapsed ? "X" : "Cerrar sesion"}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:T.surf, borderBottom:`1px solid ${T.bord}`, padding:"0 20px", height:50, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ background:"transparent", border:"none", color:T.sub, cursor:"pointer", fontSize:16, padding:"4px 6px" }}>
            {collapsed ? ">>" : "<<"}
          </button>
          <div style={{ fontSize:15, fontWeight:700, color:T.txt }}>{TITULOS[pag] || ""}</div>
          <div style={{ marginLeft:"auto", fontSize:11, color:T.sub }}>
            {new Date().toLocaleDateString("es-GT", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <ErrBoundary>
            <RenderPage pag={pag} empId={empId} showToast={showToast} />
          </ErrBoundary>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

// ─── App principal ────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tzunun_session")); } catch { return null; }
  });
  const [pag, setPag]     = useState("dashboard");
  const [empId, setEmpId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    if (session) {
      dbGet("empresas", "&select=id&limit=1").then(d => {
        if (d?.[0]) setEmpId(d[0].id);
      });
    }
  }, [session]);

  const showToast    = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const handleLogin  = (res) => { const s = { token:res.access_token, user:res.user }; localStorage.setItem("tzunun_session", JSON.stringify(s)); setSession(s); };
  const handleLogout = async () => { if (session?.token) await sbLogout(session.token); localStorage.removeItem("tzunun_session"); setSession(null); };

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const props = { pag, setPag, empId, showToast, toast, handleLogout, userEmail: session?.user?.email || "" };
  return isMobile ? <LayoutMovil {...props} /> : <LayoutDesktop {...props} />;
}
