import React, { useState, useEffect } from "react";
import { T, S, sbLogin, sbLogout, dbGet } from "./config.js";
import { ErrBoundary } from "./components/shared.jsx";

// ── Importar todas las páginas ────────────────────────────────────────────────
import PageDashboard    from "./pages/Dashboard.jsx";
import PageCalculadora  from "./pages/Calculadora.jsx";
import PageCotizaciones from "./pages/Cotizaciones.jsx";
import PageReservas     from "./pages/Reservas.jsx";
import PageFlota        from "./pages/Flota.jsx";
import PageMantenimiento from "./pages/Mantenimiento.jsx";
import PageClientes     from "./pages/Clientes.jsx";
import PageCatalogo     from "./pages/Catalogo.jsx";
import PageFacturacion  from "./pages/Facturacion.jsx";
import PageBanca        from "./pages/Banca.jsx";
import PageGastos       from "./pages/Gastos.jsx";
import PagePagos        from "./pages/Pagos.jsx";
import PageContabilidad from "./pages/Contabilidad.jsx";
import PageReportes     from "./pages/Reportes.jsx";

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    if (!email || !pwd) { setError("Ingresa correo y contraseña"); return; }
    setLoading(true); setError("");
    const res = await sbLogin(email, pwd);
    if (res.error || res.error_description) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } else {
      onLogin(res);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🐦</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.acc, fontFamily: "monospace" }}>TzununSA</div>
          <div style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>Sistema de Gestión — Tz'unun AutoRentas</div>
        </div>
        <form onSubmit={login} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>CORREO ELECTRÓNICO</label>
            <input style={S.inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" autoFocus />
          </div>
          <div>
            <label style={S.lbl}>CONTRASEÑA</label>
            <input style={S.inp} type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div style={{ background: T.redD, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn("primary"), padding: 13, fontSize: 14, marginTop: 4 }}>
            {loading ? "Ingresando..." : "Entrar →"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: T.mut }}>
          tzununsa.vercel.app · v1.0
        </div>
      </div>
    </div>
  );
}

// ── Navigation Config ─────────────────────────────────────────────────────────
const NAV = [
  { sep: true, label: "PRINCIPAL" },
  { id: "dashboard",     icon: "📊", label: "Dashboard" },
  { sep: true, label: "PRESUPUESTOS" },
  { id: "calculadora",   icon: "🧮", label: "Calculadora" },
  { id: "cotizaciones",  icon: "📋", label: "Cotizaciones" },
  { id: "reservas",      icon: "📅", label: "Reservas" },
  { sep: true, label: "OPERACIÓN" },
  { id: "flota",         icon: "🚗", label: "Flota" },
  { id: "mantenimiento", icon: "🔧", label: "Mantenimiento" },
  { id: "clientes",      icon: "👥", label: "Clientes" },
  { id: "catalogo",      icon: "📦", label: "Catálogo" },
  { sep: true, label: "FINANZAS" },
  { id: "facturacion",   icon: "🧾", label: "Facturación FEL" },
  { id: "banca",         icon: "🏦", label: "La Banca" },
  { id: "gastos",        icon: "💸", label: "Gastos / Compras" },
  { id: "pagos",         icon: "💰", label: "Pagos Recibidos" },
  { id: "contabilidad",  icon: "📒", label: "Contabilidad" },
  { sep: true, label: "ANÁLISIS" },
  { id: "reportes",      icon: "📈", label: "Reportes" },
];

const PAGE_TITLES = {
  dashboard: "Dashboard", calculadora: "Calculadora", cotizaciones: "Cotizaciones",
  reservas: "Reservas", flota: "Flota", mantenimiento: "Mantenimiento",
  clientes: "Clientes", catalogo: "Catálogo de Servicios",
  facturacion: "Facturación FEL", banca: "La Banca",
  gastos: "Gastos y Compras", pagos: "Pagos Recibidos",
  contabilidad: "Contabilidad", reportes: "Reportes",
};

// ── Toast global ──────────────────────────────────────────────────────────────
function ToastGlobal({ toast }) {
  if (!toast) return null;
  const c = toast.type === "err" ? T.red : T.acc;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: T.card, border: `1px solid ${c}`, borderRadius: 12, padding: "13px 20px", fontSize: 13, color: c, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,.4)", maxWidth: 360 }}>
      {toast.type === "err" ? "❌" : "✅"} {toast.msg}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tzunun_session")); } catch { return null; }
  });
  const [pag, setPag] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [empId, setEmpId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (session) {
      dbGet("empresas", "&select=id&limit=1").then(d => {
        if (d && d[0]) setEmpId(d[0].id);
      });
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
    setSession(null);
  };

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const userEmail = session?.user?.email || "";
  const userName = userEmail.split("@")[0];

  const renderPage = () => {
    const props = { showToast, empId };
    switch (pag) {
      case "dashboard":     return <PageDashboard {...props} />;
      case "calculadora":   return <PageCalculadora {...props} />;
      case "cotizaciones":  return <PageCotizaciones {...props} />;
      case "reservas":      return <PageReservas {...props} />;
      case "flota":         return <PageFlota {...props} />;
      case "mantenimiento": return <PageMantenimiento {...props} />;
      case "clientes":      return <PageClientes {...props} />;
      case "catalogo":      return <PageCatalogo {...props} />;
      case "facturacion":   return <PageFacturacion {...props} />;
      case "banca":         return <PageBanca {...props} />;
      case "gastos":        return <PageGastos {...props} />;
      case "pagos":         return <PagePagos {...props} />;
      case "contabilidad":  return <PageContabilidad {...props} />;
      case "reportes":      return <PageReportes {...props} />;
      default:              return <PageDashboard {...props} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.txt, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* ── Sidebar ── */}
      <div style={{ width: collapsed ? 64 : 220, background: T.surf, borderRight: `1px solid ${T.bord}`, flexShrink: 0, display: "flex", flexDirection: "column", transition: "width .2s", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "18px 0" : "18px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.bord}`, justifyContent: collapsed ? "center" : "flex-start" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🐦</span>
          {!collapsed && <div><div style={{ fontSize: 14, fontWeight: 800, color: T.acc }}>Tz'unun</div><div style={{ fontSize: 10, color: T.sub }}>AutoRentas</div></div>}
        </div>
        {/* Nav Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV.map((item, i) => {
            if (item.sep) return collapsed ? null : (
              <div key={i} style={{ fontSize: 9, fontWeight: 700, color: T.mut, letterSpacing: 1.5, padding: "14px 16px 4px", textTransform: "uppercase" }}>{item.label}</div>
            );
            const active = pag === item.id;
            return (
              <div key={item.id} onClick={() => setPag(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 0" : "9px 14px", cursor: "pointer", background: active ? T.accD : "transparent", borderRight: active ? `2px solid ${T.acc}` : "2px solid transparent", justifyContent: collapsed ? "center" : "flex-start", transition: "background .15s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.card; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? T.acc : T.txt, whiteSpace: "nowrap" }}>{item.label}</span>}
              </div>
            );
          })}
        </div>
        {/* User + Logout */}
        <div style={{ borderTop: `1px solid ${T.bord}`, padding: collapsed ? "12px 0" : "12px 14px" }}>
          {!collapsed && <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {userName}</div>}
          <button onClick={handleLogout} style={{ ...S.btn("ghost"), width: collapsed ? "auto" : "100%", fontSize: 11, padding: "6px 10px" }}>
            {collapsed ? "🚪" : "🚪 Salir"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: T.surf, borderBottom: `1px solid ${T.bord}`, padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 18, padding: "4px 6px" }}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{PAGE_TITLES[pag] || ""}</div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: T.sub }}>{new Date().toLocaleDateString("es-GT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>
        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <ErrBoundary>
            {renderPage()}
          </ErrBoundary>
        </div>
      </div>

      <ToastGlobal toast={toast} />
    </div>
  );
}
