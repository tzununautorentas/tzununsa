import React, { useState, useEffect, Component } from "react";
import { T, S, sbLogin, sbLogout, dbGet } from "./config.js";
import { ThemeProvider, useTheme, buildStyles } from "./config/theme.jsx";
import { NotificacionesBell } from "./components/Notificaciones.jsx";
import {
  IconDashboard, IconCalculadora, IconCotizaciones, IconReservas, IconFlota,
  IconMantenimiento, IconClientes, IconCatalogo, IconFacturacion, IconBanca,
  IconGastos, IconPagos, IconProveedores, IconEmpleados, IconContratos,
  IconContabilidad, IconReportes,
  IconHome, IconMenu, IconSearch, IconPlus, IconEdit, IconTrash, IconClose,
  IconCheck, IconDownload, IconUpload, IconRefresh, IconSettings, IconUser,
  IconLogout, IconNotification, IconCalendar, IconMoney, IconMap, IconStar,
  IconPrinter, IconSend, IconImage, IconFilter,
} from "./components/icons.jsx";

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
import PageEmpleados     from "./pages/Empleados.jsx";
import PageContratos     from "./pages/Contratos.jsx";

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
  { id: "dashboard",     label: "Dashboard",      icon: IconDashboard,     c1: "#00D4AA", c2: "#009a7a" },
  { id: "calculadora",   label: "Calculadora",    icon: IconCalculadora,   c1: "#3B82F6", c2: "#1d4ed8" },
  { id: "cotizaciones",  label: "Cotizaciones",   icon: IconCotizaciones,  c1: "#6366f1", c2: "#4338ca" },
  { id: "reservas",      label: "Reservas",       icon: IconReservas,      c1: "#A855F7", c2: "#7e22ce" },
  { id: "flota",         label: "Flota",          icon: IconFlota,         c1: "#10B981", c2: "#047857" },
  { id: "mantenimiento", label: "Mantenim.",      icon: IconMantenimiento, c1: "#F59E0B", c2: "#b45309" },
  { id: "clientes",      label: "Clientes",       icon: IconClientes,      c1: "#22C55E", c2: "#15803d" },
  { id: "catalogo",      label: "Catalogo",       icon: IconCatalogo,      c1: "#06B6D4", c2: "#0e7490" },
  { id: "facturacion",   label: "Facturas FEL",   icon: IconFacturacion,   c1: "#00D4AA", c2: "#00796b" },
  { id: "banca",         label: "La Banca",       icon: IconBanca,         c1: "#2563EB", c2: "#1e40af" },
  { id: "gastos",        label: "Gastos",         icon: IconGastos,        c1: "#EF4444", c2: "#b91c1c" },
  { id: "pagos",         label: "Pagos",          icon: IconPagos,         c1: "#22C55E", c2: "#166534" },
  { id: "proveedores",   label: "Proveedores",    icon: IconProveedores,   c1: "#F97316", c2: "#c2410c" },
  { id: "empleados",     label: "Empleados",      icon: IconEmpleados,     c1: "#14B8A6", c2: "#0f766e" },
  { id: "contratos",     label: "Contratos",      icon: IconContratos,     c1: "#6366F1", c2: "#4338ca" },
  { id: "contabilidad",  label: "Contabilidad",   icon: IconContabilidad,  c1: "#8B5CF6", c2: "#6d28d9" },
  { id: "reportes",      label: "Reportes",       icon: IconReportes,      c1: "#EC4899", c2: "#be185d" },
];

const TITULOS = {
  dashboard:     "Dashboard",
  calculadora:   "Calculadora de Costos",
  cotizaciones:  "Cotizaciones",
  reservas:      "Reservas",
  flota:         "Flota de Vehiculos",
  mantenimiento: "Mantenimiento",
  clientes:      "Directorio de Clientes",
  catalogo:      "Catalogo de Servicios",
  facturacion:   "Facturacion FEL",
  banca:         "La Banca",
  gastos:        "Gastos y Compras",
  pagos:         "Pagos Recibidos",
  proveedores:   "Proveedores",
  empleados:     "Empleados y Colaboradores",
  contratos:     "Contratos",
  contabilidad:  "Contabilidad",
  reportes:      "Reportes",
};

const NAV_ICONS = {
  dashboard: IconDashboard, calculadora: IconCalculadora, cotizaciones: IconCotizaciones,
  reservas: IconReservas, flota: IconFlota, mantenimiento: IconMantenimiento,
  clientes: IconClientes, catalogo: IconCatalogo, facturacion: IconFacturacion,
  banca: IconBanca, gastos: IconGastos, pagos: IconPagos,
  proveedores: IconProveedores, empleados: IconEmpleados, contratos: IconContratos,
  contabilidad: IconContabilidad, reportes: IconReportes,
};

const DESKTOP_NAV = [
  { sep: true,  label: "PRINCIPAL"    },
  { id: "dashboard",     label: "Dashboard",        c: "#00D4AA", icon: NAV_ICONS.dashboard },
  { sep: true,  label: "PRESUPUESTOS" },
  { id: "calculadora",   label: "Calculadora",      c: "#3B82F6", icon: NAV_ICONS.calculadora },
  { id: "cotizaciones",  label: "Cotizaciones",     c: "#6366f1", icon: NAV_ICONS.cotizaciones },
  { id: "reservas",      label: "Reservas",         c: "#A855F7", icon: NAV_ICONS.reservas },
  { sep: true,  label: "OPERACION"    },
  { id: "flota",         label: "Flota",            c: "#10B981", icon: NAV_ICONS.flota },
  { id: "mantenimiento", label: "Mantenimiento",    c: "#F59E0B", icon: NAV_ICONS.mantenimiento },
  { id: "clientes",      label: "Clientes",         c: "#22C55E", icon: NAV_ICONS.clientes },
  { id: "catalogo",      label: "Catalogo",         c: "#06B6D4", icon: NAV_ICONS.catalogo },
  { sep: true,  label: "FINANZAS"     },
  { id: "facturacion",   label: "Facturacion FEL",  c: "#00D4AA", icon: NAV_ICONS.facturacion },
  { id: "banca",         label: "La Banca",         c: "#2563EB", icon: NAV_ICONS.banca },
  { id: "gastos",        label: "Gastos / Compras", c: "#EF4444", icon: NAV_ICONS.gastos },
  { id: "pagos",         label: "Pagos Recibidos",  c: "#22C55E", icon: NAV_ICONS.pagos },
  { sep: true,  label: "EQUIPO"       },
  { id: "proveedores",   label: "Proveedores",      c: "#F97316", icon: NAV_ICONS.proveedores },
  { id: "empleados",     label: "Empleados",        c: "#14B8A6", icon: NAV_ICONS.empleados },
  { id: "contratos",     label: "Contratos",        c: "#6366F1", icon: NAV_ICONS.contratos },
  { sep: true,  label: "ANALISIS"     },
  { id: "contabilidad",  label: "Contabilidad",     c: "#8B5CF6", icon: NAV_ICONS.contabilidad },
  { id: "reportes",      label: "Reportes",         c: "#EC4899", icon: NAV_ICONS.reportes },
];

const BOTTOM_TABS = [
  { id: "dashboard",    label: "Inicio",   icon: IconHome,      mods: ["dashboard"] },
  { id: "cotizaciones", label: "Negocio",  icon: IconCalculadora,mods: ["calculadora","cotizaciones","reservas"] },
  { id: "flota",        label: "Flota",    icon: IconFlota,     mods: ["flota","mantenimiento","clientes","catalogo"] },
  { id: "banca",        label: "Finanzas", icon: IconMoney,     mods: ["facturacion","banca","gastos","pagos"] },
  { id: "__menu__",     label: "Mas",      icon: IconMenu,      mods: [] },
];

const MENU_SECTIONS = [
  { label: "PRESUPUESTOS", ids: ["calculadora","cotizaciones","reservas"] },
  { label: "OPERACION",    ids: ["flota","mantenimiento","clientes","catalogo"] },
  { label: "FINANZAS",     ids: ["facturacion","banca","gastos","pagos"] },
  { label: "EQUIPO",       ids: ["proveedores","empleados","contratos"] },
  { label: "ANALISIS",     ids: ["contabilidad","reportes"] },
];

const QUICK_ACCESS = ["cotizaciones","reservas","contratos","gastos","empleados","facturacion"];

// ─── Theme Toggle Icon ─────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        background: "transparent", border: "none",
        cursor: "pointer", padding: "4px 6px",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: T.sub,
      }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isDark ? (
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        ) : (
          <>
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </>
        )}
      </svg>
    </button>
  );
}

// ─── Icono de modulo ──────────────────────────────────────────────
function ModIcon({ mod, size = 52 }) {
  const Icon = mod.icon;
  const s = Math.round(size * 0.52);
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.27),
      background: `linear-gradient(135deg, ${mod.c1}, ${mod.c2})`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={s} color="white" />
    </div>
  );
}

// ─── Render de pagina ─────────────────────────────────────────────
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
    empleados:     <PageEmpleados     {...p} />,
    contratos:     <PageContratos     {...p} />,
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
      background: T.card, border: `1px solid ${c}`,
      borderRadius: 14, padding: "12px 18px",
      fontSize: 13, color: c, fontWeight: 600,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)", maxWidth: 320,
    }}>
      {toast.type === "err" ? "Error" : "Listo"} — {toast.msg}
    </div>
  );
}

// ─── Menu movil ───────────────────────────────────────────────────
function MenuMobile({ pag, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500 }}
      onClick={onClose}>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: T.surf, borderRadius: "24px 24px 0 0",
        maxHeight: "85vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 48, height: 4, background: T.bord, borderRadius: 2, margin: "14px auto 0" }} />
        <div style={{ padding: "16px 18px 100px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 20 }}>
            Todos los modulos
          </div>
          {MENU_SECTIONS.map(sec => (
            <div key={sec.label} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1.5, marginBottom: 12 }}>
                {sec.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {sec.ids.map(id => {
                  const m = MODS.find(x => x.id === id);
                  if (!m) return null;
                  return (
                    <button key={id} onClick={() => onSelect(id)}
                      style={{
                        background: pag === id ? m.c1 + "22" : T.card,
                        border: `1.5px solid ${pag === id ? m.c1 : T.bord}`,
                        borderRadius: 16, padding: "12px 6px 10px",
                        cursor: "pointer", display: "flex",
                        flexDirection: "column", alignItems: "center", gap: 8,
                      }}>
                      <ModIcon mod={m} size={44} />
                      <span style={{
                        fontSize: 9, color: pag === id ? m.c1 : T.sub,
                        fontWeight: pag === id ? 700 : 400,
                        textAlign: "center", lineHeight: 1.3,
                      }}>
                        {m.label}
                      </span>
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
  const [stats, setStats] = useState({ veh: 0, res: 0, cots: 0 });
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

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${T.card}, ${T.bord})`,
        borderRadius: 20, padding: "20px 18px", marginBottom: 20,
        border: `1px solid ${T.bord}`,
      }}>
        <div style={{ fontSize: 13, color: T.sub }}>{saludo},</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.txt, marginTop: 2 }}>{userName}</div>
        <div style={{ fontSize: 11, color: T.acc, marginTop: 4 }}>Tz'unun AutoRentas</div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {[
            { l: "Vehiculos libres", v: stats.veh,  c: T.acc  },
            { l: "Reservas activas", v: stats.res,  c: T.blue },
            { l: "Cots. en espera",  v: stats.cots, c: T.sec  },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, background: "rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "10px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: T.sub, marginTop: 2, lineHeight: 1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>ACCESOS RAPIDOS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {QUICK_ACCESS.map(id => {
          const m = MODS.find(x => x.id === id);
          if (!m) return null;
          return (
            <button key={id} onClick={() => setPag(id)}
              style={{
                background: T.card, border: `1px solid ${T.bord}`,
                borderRadius: 18, padding: "18px 8px 14px",
                cursor: "pointer", display: "flex",
                flexDirection: "column", alignItems: "center", gap: 10,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = m.c1 + "18";
                e.currentTarget.style.borderColor = m.c1 + "66";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.card;
                e.currentTarget.style.borderColor = T.bord;
              }}>
              <ModIcon mod={m} size={52} />
              <span style={{ fontSize: 11, color: T.txt, fontWeight: 600, textAlign: "center" }}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Layout Movil ─────────────────────────────────────────────────
function LayoutMovil({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [showMenu, setShowMenu] = useState(false);
  const [onHome,   setOnHome]   = useState(true);
  const userName  = userEmail.split("@")[0];
  const navegar   = (id) => { setPag(id); setOnHome(false); setShowMenu(false); };
  const activeTab = BOTTOM_TABS.find(t => t.mods.includes(pag))?.id || (onHome ? "dashboard" : "__menu__");

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: T.bg, color: T.txt,
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: T.surf, padding: "14px 16px 12px",
        display: "flex", alignItems: "center", gap: 12,
        flexShrink: 0, borderBottom: `1px solid ${T.bord}`,
      }}>
        <button onClick={() => setOnHome(true)}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: T.accDim, border: `1.5px solid ${T.acc}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
          <IconDashboard size={22} color={T.acc} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Tz'unun AutoRentas</div>
          <div style={{ fontSize: 10, color: T.sub }}>
            {onHome ? "Inicio" : TITULOS[pag] || ""}
          </div>
        </div>
        <NotificacionesBell isMobile={true} />
        <ThemeToggle />
        <button onClick={handleLogout}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.card, border: `1px solid ${T.bord}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
          <IconLogout size={16} color={T.sub} />
        </button>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", paddingBottom: 90 }}>
        {onHome
          ? <HomeMovil setPag={navegar} userName={userName} />
          : <ErrBoundary><RenderPage pag={pag} empId={empId} showToast={showToast} /></ErrBoundary>
        }
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: T.surf, borderTop: `1px solid ${T.bord}`,
        display: "flex", zIndex: 300,
      }}>
        {BOTTOM_TABS.map(tab => {
          const isActive = tab.id === "__menu__" ? false
            : tab.id === "dashboard" ? onHome
            : activeTab === tab.id && !onHome;
          const m     = MODS.find(x => x.id === tab.id);
          const color = m?.c1 || T.acc;
          return (
            <button key={tab.id}
              onClick={() => {
                if (tab.id === "__menu__") setShowMenu(true);
                else if (tab.id === "dashboard") setOnHome(true);
                else navegar(tab.mods[0]);
              }}
              style={{
                flex: 1, background: "transparent", border: "none",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "10px 0 8px", gap: 4, position: "relative",
              }}>
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 32, height: 3, background: color,
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isActive ? color + "22" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                  <tab.icon size={22} color={isActive ? color : T.mut} />
              </div>
              <div style={{ fontSize: 9, color: isActive ? color : T.mut, fontWeight: isActive ? 700 : 400 }}>
                {tab.label}
              </div>
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
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg,#00D4AA,#009a7a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px #00D4AA44",
          }}>
            <IconDashboard size={36} color="white" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.acc }}>Tz'unun SA</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Sistema de Gestion</div>
        </div>
        <form onSubmit={login} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.lbl}>CORREO</label>
            <input style={S.inp} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@empresa.com" autoFocus />
          </div>
          <div>
            <label style={S.lbl}>CONTRASENA</label>
            <input style={S.inp} type="password" value={pwd}
              onChange={e => setPwd(e.target.value)} placeholder="........" />
          </div>
          {error && (
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ ...S.btn("primary"), padding: 14, fontSize: 14 }}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.mut }}>
          tzununsa.vercel.app
        </div>
      </div>
    </div>
  );
}

// ─── Layout Desktop ───────────────────────────────────────────────
function LayoutDesktop({ pag, setPag, empId, showToast, toast, handleLogout, userEmail }) {
  const [collapsed, setCollapsed] = useState(false);
  const userName = userEmail.split("@")[0];

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: T.bg, color: T.txt,
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 56 : 220, background: T.surf,
        borderRight: `1px solid ${T.bord}`, flexShrink: 0,
        display: "flex", flexDirection: "column",
        transition: "width .2s", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "16px 0" : "16px 14px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: `1px solid ${T.bord}`,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#00D4AA,#009a7a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "white", flexShrink: 0,
          }}>T</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>Tz'unun</div>
              <div style={{ fontSize: 9, color: T.sub }}>AutoRentas</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {DESKTOP_NAV.map((item, i) => {
            if (item.sep) {
              return collapsed ? null : (
                <div key={i} style={{
                  fontSize: 9, fontWeight: 700, color: T.mut,
                  letterSpacing: 1.5, padding: "12px 14px 3px",
                }}>
                  {item.label}
                </div>
              );
            }
            const active = pag === item.id;
            return (
              <div key={item.id} onClick={() => setPag(item.id)}
                style={{
                  display: "flex", alignItems: "center",
                  gap: 9, padding: collapsed ? "9px 0" : "8px 12px",
                  cursor: "pointer",
                  background: active ? item.c + "18" : "transparent",
                  borderRight: active ? `2px solid ${item.c}` : "2px solid transparent",
                  justifyContent: collapsed ? "center" : "flex-start",
                  transition: "background .12s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.card; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                {React.createElement(item.icon, {
                  size: collapsed ? 20 : 18,
                  color: active ? item.c : T.sub,
                })}
                {!collapsed && (
                  <span style={{
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    color: active ? item.c : T.txt, whiteSpace: "nowrap",
                  }}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer sidebar */}
        <div style={{ borderTop: `1px solid ${T.bord}`, padding: collapsed ? "10px 4px" : "10px 12px" }}>
          {!collapsed && (
            <>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </div>
              <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <ThemeToggle />
                <span style={{ fontSize: 10, color: T.mut }}>Tema</span>
              </div>
            </>
          )}
          <button onClick={handleLogout}
            style={{ ...S.btn("ghost"), width: "100%", fontSize: 11, padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconLogout size={14} color={T.sub} />
            {collapsed ? "" : "Cerrar sesion"}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          background: T.surf, borderBottom: `1px solid ${T.bord}`,
          padding: "0 20px", height: 50,
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <button onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "transparent", border: "none",
              color: T.sub, cursor: "pointer", fontSize: 16, padding: "4px 6px",
            }}>
            {collapsed ? ">>" : "<<"}
          </button>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>
            {TITULOS[pag] || ""}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <NotificacionesBell isMobile={false} />
            <ThemeToggle />
            <div style={{ fontSize: 11, color: T.sub }}>
              {new Date().toLocaleDateString("es-GT", {
                weekday: "short", day: "2-digit", month: "short", year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Pagina activa */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
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
function AppContent() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tzunun_session")); }
    catch { return null; }
  });
  const [pag,      setPag]      = useState("dashboard");
  const [empId,    setEmpId]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Inyectar CSS responsive global
  useEffect(() => {
    const id = "tzunun-responsive-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      @media (max-width: 767px) {
        .page-grid { grid-template-columns: 1fr 1fr !important; }
        .page-grid-4 { grid-template-columns: 1fr 1fr !important; }
        .page-grid-3 { grid-template-columns: 1fr !important; }
        .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-wrap table { min-width: 580px; }
        input, select, textarea { font-size: 16px !important; }
        button, .btn-like, .fld-wrap button { min-height: 44px; }
        .hide-mobile { display: none !important; }
        .full-mobile { width: 100% !important; }
        .flex-col-mobile { flex-direction: column !important; }
        .stack-mobile > * + * { margin-top: 12px; }
        .fld-wrap { grid-column: 1 / -1 !important; }
        form { gap: 14px; }
        .buscador-input { max-width: 100% !important; }
      }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 4px; }
      input:focus, select:focus, textarea:focus, button:focus-visible { outline: 2px solid #00D4AA; outline-offset: 2px; }
    `;
    document.head.appendChild(style);
    return () => { const s = document.getElementById(id); if (s) s.remove(); };
  }, []);

  useEffect(() => {
    if (session) {
      dbGet("empresas", "&select=id&limit=1").then(d => {
        if (d?.[0]) setEmpId(d[0].id);
      });
    }
  }, [session]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (res) => {
    const s = { token: res.access_token, user: res.user };
    localStorage.setItem("tzunun_session", JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = async () => {
    if (session?.token) await sbLogout(session.token);
    localStorage.removeItem("tzunun_session");
    setSession(null);
  };

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const props = {
    pag, setPag, empId, showToast, toast, handleLogout,
    userEmail: session?.user?.email || "",
  };

  return isMobile
    ? <LayoutMovil   {...props} />
    : <LayoutDesktop {...props} />;
}

// ─── Wrapper con ThemeProvider ────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
