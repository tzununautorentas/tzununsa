import React, { useState, useEffect } from "react";
import { T, S, sbLogin, sbLogout, dbGet } from "./config.js";
import { ErrBoundary } from "./components/shared.jsx";

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

// ─── Títulos de página ───────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "Dashboard", calculadora: "Calculadora",
  cotizaciones: "Cotizaciones", reservas: "Reservas",
  flota: "Flota", mantenimiento: "Mantenimiento",
  clientes: "Clientes", catalogo: "Catalogo de Servicios",
  facturacion: "Facturacion FEL", banca: "La Banca",
  gastos: "Gastos y Compras", pagos: "Pagos Recibidos",
  proveedores: "Proveedores", contabilidad: "Contabilidad",
  reportes: "Reportes",
};

// ─── Módulos organizados por sección ─────────────────────────────────────────
const SECTIONS = [
  {
    id: "presupuestos", label: "Presupuestos", color: T.blue,
    mods: [
      { id: "calculadora",  label: "Calculadora",  letter: "C", color: T.blue   },
      { id: "cotizaciones", label: "Cotizaciones", letter: "Q", color: T.blue   },
      { id: "reservas",     label: "Reservas",     letter: "R", color: T.purple },
    ],
  },
  {
    id: "operacion", label: "Operacion", color: T.purple,
    mods: [
      { id: "flota",         label: "Flota",        letter: "F", color: T.purple },
      { id: "mantenimiento", label: "Mantenim.",     letter: "M", color: T.sec   },
      { id: "clientes",      label: "Clientes",      letter: "CL",color: T.green },
      { id: "catalogo",      label: "Catalogo",      letter: "K", color: T.acc   },
    ],
  },
  {
    id: "finanzas", label: "Finanzas", color: T.acc,
    mods: [
      { id: "facturacion", label: "Facturas FEL",  letter: "FA", color: T.acc  },
      { id: "banca",       label: "La Banca",      letter: "B",  color: T.blue },
      { id: "gastos",      label: "Gastos",        letter: "G",  color: T.red  },
      { id: "pagos",       label: "Pagos",         letter: "P",  color: T.green},
    ],
  },
  {
    id: "analisis", label: "Analisis", color: T.sec,
    mods: [
      { id: "reportes",      label: "Reportes",     letter: "RE", color: T.sec    },
      { id: "contabilidad",  label: "Contabilidad", letter: "A",  color: T.purple },
      { id: "proveedores",   label: "Proveedores",  letter: "PR", color: T.orange || T.sec },
    ],
  },
];

// ─── Render de página ─────────────────────────────────────────────────────────
function RenderPage({ pag, empId, showToast }) {
  const p = { showToast, empId };
  switch (pag) {
    case "dashboard":     return <PageDashboard    {...p} />;
    case "calculadora":   return <PageCalculadora  {...p} />;
    case "cotizaciones":  return <PageCotizaciones {...p} />;
    case "reservas":      return <PageReservas     {...p} />;
    case "flota":         return <PageFlota        {...p} />;
    case "mantenimiento": return <PageMantenimiento{...p} />;
    case "clientes":      return <PageClientes     {...p} />;
    case "catalogo":      return <PageCatalogo     {...p} />;
    case "facturacion":   return <PageFacturacion  {...p} />;
    case "banca":         return <PageBanca        {...p} />;
    case "gastos":        return <PageGastos       {...p} />;
    case "pagos":         return <PagePagos        {...p} />;
    case "proveedores":   return <PageProveedores  {...p} />;
    case "contabilidad":  return <PageContabilidad {...p} />;
    case "reportes":      return <PageReportes     {...p} />;
    default:              return <PageDashboard    {...p} />;
  }
}

// ─── Toast global ─────────────────────────────────────────────────────────────
function ToastGlobal({ toast }) {
  if (!toast) return null;
  const c = toast.type === "err" ? T.red : T.acc;
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 9999, background: T.card, border: `1px solid ${c}`, borderRadius: 12, padding: "12px 18px", fontSize: 13, color: c, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,.5)", maxWidth: 320 }}>
      {toast.type === "err" ? "[X]" : "[OK]"} {toast.msg}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: T.accDim, border: `2px solid ${T.acc}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: T.acc, margin: "0 auto 16px" }}>T</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.acc }}>Tz'unun SA</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Sistema de Gestion · AutoRentas</div>
        </div>
        <form onSubmit={login} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>CORREO ELECTRONICO</label>
            <input style={S.inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" autoFocus />
          </div>
          <div>
            <label style={S.lbl}>CONTRASENA</label>
            <input style={S.inp} type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: 14, fontSize: 14, marginTop: 4 }}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.mut }}>tzununsa.vercel.app</div>
      </div>
    </div>
  );
}

// ─── MENÚ MÓVIL (bottom sheet) ────────────────────────────────────────────────
function MobileMenu({ pag, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300 }} onClick={onClose}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: T.surf, borderRadius: "22px 22px 0 0", maxHeight: "82vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 44, height: 4, background: T.bord, borderRadius: 2, margin: "14px auto 16px" }} />
        <div style={{ padding: "0 16px 100px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.txt, marginBottom: 18 }}>Todos los modulos</div>
          {SECTIONS.map(sec => (
            <div key={sec.id} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>{sec.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {sec.mods.map(m => {
                  const active = pag === m.id;
                  return (
                    <button key={m.id} onClick={() => onSelect(m.id)}
                      style={{ background: active ? m.color + "22" : T.card, border: `1px solid ${active ? m.color : T.bord}`, borderRadius: 14, padding: "12px 6px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: m.color + (active ? "33" : "18"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: m.color }}>
                        {m.letter}
                      </div>
                      <div style={{ fontSize: 9, color: active ? m.color : T.sub, fontWeight: active ? 700 : 400, textAlign: "center", lineHeight: 1.3 }}>{m.label}</div>
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

// ─── LAYOUT MÓVIL ────────────────────────────────────────────────────────────
function MobileLayout({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [showMenu, setShowMenu] = useState(false);
  const userName = userEmail.split("@")[0];

  const TABS = [
    { id: "dashboard",    label: "Inicio",    letter: "H",  color: T.acc    },
    { id: "cotizaciones", label: "Cotizac.",  letter: "Q",  color: T.blue   },
    { id: "reservas",     label: "Reservas",  letter: "R",  color: T.purple },
    { id: "banca",        label: "Finanzas",  letter: "$",  color: T.green  },
    { id: "__menu__",     label: "Menu",      letter: "...", color: T.mut   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, color: T.txt, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Top header */}
      <div style={{ background: T.surf, borderBottom: `1px solid ${T.bord}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: T.acc, flexShrink: 0 }}>T</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>Tz'unun AutoRentas</div>
          <div style={{ fontSize: 10, color: T.mut }}>{PAGE_TITLES[pag] || "Dashboard"}</div>
        </div>
        <button onClick={handleLogout} style={{ ...S.btn("ghost"), fontSize: 11, padding: "5px 10px" }}>Salir</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 90px" }}>
        <ErrBoundary>
          <RenderPage pag={pag} empId={empId} showToast={showToast} />
        </ErrBoundary>
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surf, borderTop: `1px solid ${T.bord}`, display: "flex", height: 66, zIndex: 200 }}>
        {TABS.map(tab => {
          const isActive = tab.id !== "__menu__" && pag === tab.id;
          const isMenu = tab.id === "__menu__";
          return (
            <button key={tab.id} onClick={() => {
              if (isMenu) setShowMenu(true);
              else setPag(tab.id);
            }} style={{ flex: 1, background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: tab.color, borderRadius: "0 0 3px 3px" }} />}
              <div style={{ width: 32, height: 32, borderRadius: 9, background: isActive ? tab.color + "22" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: isActive ? tab.color : T.mut, transition: "all .15s" }}>
                {tab.letter}
              </div>
              <div style={{ fontSize: 9, color: isActive ? tab.color : T.mut, fontWeight: isActive ? 700 : 400 }}>{tab.label}</div>
            </button>
          );
        })}
      </div>

      {showMenu && <MobileMenu pag={pag} onSelect={id => { setPag(id); setShowMenu(false); }} onClose={() => setShowMenu(false)} />}
      <ToastGlobal toast={toast} />
    </div>
  );
}

// ─── LAYOUT DESKTOP (sidebar) ─────────────────────────────────────────────────
const DESKTOP_NAV = [
  { sep: true, label: "PRINCIPAL" },
  { id: "dashboard",     label: "Dashboard",       color: T.acc    },
  { sep: true, label: "PRESUPUESTOS" },
  { id: "calculadora",   label: "Calculadora",     color: T.blue   },
  { id: "cotizaciones",  label: "Cotizaciones",    color: T.blue   },
  { id: "reservas",      label: "Reservas",        color: T.purple },
  { sep: true, label: "OPERACION" },
  { id: "flota",         label: "Flota",           color: T.purple },
  { id: "mantenimiento", label: "Mantenimiento",   color: T.sec    },
  { id: "clientes",      label: "Clientes",        color: T.green  },
  { id: "catalogo",      label: "Catalogo",        color: T.acc    },
  { sep: true, label: "FINANZAS" },
  { id: "facturacion",   label: "Facturacion FEL", color: T.acc    },
  { id: "banca",         label: "La Banca",        color: T.blue   },
  { id: "gastos",        label: "Gastos / Compras",color: T.red    },
  { id: "pagos",         label: "Pagos Recibidos", color: T.green  },
  { id: "proveedores",   label: "Proveedores",     color: T.sec    },
  { id: "contabilidad",  label: "Contabilidad",    color: T.purple },
  { sep: true, label: "ANALISIS" },
  { id: "reportes",      label: "Reportes",        color: T.sec    },
];

function DesktopLayout({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [collapsed, setCollapsed] = useState(false);
  const userName = userEmail.split("@")[0];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.txt, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: collapsed ? 56 : 216, background: T.surf, borderRight: `1px solid ${T.bord}`, flexShrink: 0, display: "flex", flexDirection: "column", transition: "width .2s", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "16px 0" : "16px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.bord}`, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: T.accDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: T.acc, flexShrink: 0 }}>T</div>
          {!collapsed && <div><div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>Tz'unun</div><div style={{ fontSize: 9, color: T.sub }}>AutoRentas</div></div>}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {DESKTOP_NAV.map((item, i) => {
            if (item.sep) return collapsed ? null : (
              <div key={i} style={{ fontSize: 9, fontWeight: 700, color: T.mut, letterSpacing: 1.5, padding: "12px 14px 3px", textTransform: "uppercase" }}>{item.label}</div>
            );
            const active = pag === item.id;
            return (
              <div key={item.id} onClick={() => setPag(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: collapsed ? "9px 0" : "8px 12px", cursor: "pointer", background: active ? item.color + "18" : "transparent", borderRight: active ? `2px solid ${item.color}` : "2px solid transparent", justifyContent: collapsed ? "center" : "flex-start", transition: "background .12s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.card; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? item.color : T.bord, flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? item.color : T.txt, whiteSpace: "nowrap" }}>{item.label}</span>}
              </div>
            );
          })}
        </div>

        {/* User */}
        <div style={{ borderTop: `1px solid ${T.bord}`, padding: collapsed ? "10px 0" : "10px 12px" }}>
          {!collapsed && <div style={{ fontSize: 10, color: T.sub, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>}
          <button onClick={handleLogout} style={{ ...S.btn("ghost"), width: collapsed ? "auto" : "100%", fontSize: 11, padding: "5px 8px" }}>
            {collapsed ? "X" : "Cerrar sesion"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: T.surf, borderBottom: `1px solid ${T.bord}`, padding: "0 20px", height: 50, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 16, padding: "4px 6px" }}>
            {collapsed ? ">>" : "<<"}
          </button>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{PAGE_TITLES[pag] || ""}</div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: T.sub }}>
            {new Date().toLocaleDateString("es-GT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Page */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <ErrBoundary>
            <RenderPage pag={pag} empId={empId} showToast={showToast} />
          </ErrBoundary>
        </div>
      </div>

      <ToastGlobal toast={toast} />
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tzunun_session")); } catch { return null; }
  });
  const [pag, setPag] = useState("dashboard");
  const [empId, setEmpId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (session) {
      dbGet("empresas", "&select=id&limit=1").then(d => { if (d?.[0]) setEmpId(d[0].id); });
    }
  }, [session]);

  const handleLogin = (res) => {
    const sess = { token: res.access_token, user: res.user };
    localStorage.setItem("tzunun_session", JSON.stringify(sess));
    setSession(sess);
  };

  const handleLogout = async () => {
    if (session?.token) await sbLogout(session.token);
    localStorage.removeItem("tzunun_session");
    setSes
