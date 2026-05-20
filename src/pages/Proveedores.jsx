// src/pages/Proveedores.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO PROVEEDORES — Tz'ununSA
// CRUD completo + historial de gastos, compras y mantenimientos
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { T, S } from "../config.js";

const SB_URL = "https://fmijbpatkddkbxlkfoza.supabase.co/rest/v1";
const getToken = () => {
  try { return JSON.parse(localStorage.getItem("tzunun_session"))?.token || ""; }
  catch { return ""; }
};
const hdr = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
  "apikey": getToken(),
});

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${SB_URL}${path}`, { headers: hdr(), ...opts });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

// ─── Constantes ───────────────────────────────────────────────────
const TIPOS = [
  { value: "combustible",  label: "⛽ Combustible",       color: "#F59E0B" },
  { value: "repuestos",    label: "🔩 Repuestos",          color: "#6366F1" },
  { value: "mecanica",     label: "🔧 Mecánica / Taller",  color: "#EF4444" },
  { value: "seguros",      label: "🛡️ Seguros",            color: "#10B981" },
  { value: "servicios",    label: "🏢 Servicios Generales",color: "#3B82F6" },
  { value: "papeleria",    label: "📄 Papelería / Oficina",color: "#8B5CF6" },
  { value: "tecnologia",   label: "💻 Tecnología",         color: "#06B6D4" },
  { value: "bancos",       label: "🏦 Bancos / Financiero",color: "#2563EB" },
  { value: "otros",        label: "📦 Otros",              color: "#6B7280" },
];

const tipoInfo = (v) => TIPOS.find(t => t.value === v) || TIPOS[TIPOS.length - 1];

const EMPTY_FORM = {
  nombre: "", nit: "", tipo: "otros", telefono: "", email: "",
  direccion: "", contacto_nombre: "", contacto_tel: "", notas: "", activo: true,
};

// ─── Formato ──────────────────────────────────────────────────────
const fmt = (n) => "Q " + (Number(n) || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ════════════════════════════════════════════════════════════════════
export default function PageProveedores({ showToast, empId }) {
  const [proveedores, setProveedores]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [vista, setVista]               = useState("lista");       // lista | detalle | form
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editId, setEditId]             = useState(null);
  const [filtroTipo, setFiltroTipo]     = useState("todos");
  const [busqueda, setBusqueda]         = useState("");
  const [detTab, setDetTab]             = useState("datos");       // datos | gastos | compras | mantenimientos
  const [historial, setHistorial]       = useState({ gastos: [], compras: [], mantenimientos: [] });
  const [loadingHist, setLoadingHist]   = useState(false);
  const [guardando, setGuardando]       = useState(false);

  // ─── Carga ────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const data = await apiFetch(
        `/proveedores?empresa_id=eq.${empId}&order=nombre.asc&select=*`
      );
      setProveedores(data || []);
    } catch (e) {
      showToast("Error cargando proveedores", "err");
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ─── Historial del proveedor ──────────────────────────────────
  const cargarHistorial = useCallback(async (provId) => {
    setLoadingHist(true);
    try {
      const [gastos, compras, mantenimientos] = await Promise.all([
        apiFetch(`/gastos?proveedor_id=eq.${provId}&order=fecha.desc&select=*&limit=50`).catch(() => []),
        apiFetch(`/compras?proveedor_id=eq.${provId}&order=fecha.desc&select=*&limit=50`).catch(() => []),
        apiFetch(`/mantenimientos?proveedor_id=eq.${provId}&order=fecha.desc&select=*&limit=50`).catch(() => []),
      ]);
      setHistorial({ gastos: gastos || [], compras: compras || [], mantenimientos: mantenimientos || [] });
    } catch {
      setHistorial({ gastos: [], compras: [], mantenimientos: [] });
    } finally {
      setLoadingHist(false);
    }
  }, []);

  // ─── Abrir detalle ────────────────────────────────────────────
  const abrirDetalle = (prov) => {
    setSeleccionado(prov);
    setDetTab("datos");
    setVista("detalle");
    cargarHistorial(prov.id);
  };

  // ─── Abrir form ───────────────────────────────────────────────
  const abrirForm = (prov = null) => {
    if (prov) {
      setForm({ ...EMPTY_FORM, ...prov });
      setEditId(prov.id);
    } else {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
    setVista("form");
  };

  // ─── Guardar ──────────────────────────────────────────────────
  const guardar = async () => {
    if (!form.nombre.trim()) { showToast("El nombre es requerido", "err"); return; }
    setGuardando(true);
    try {
      const payload = { ...form, empresa_id: empId };
      if (editId) {
        await apiFetch(`/proveedores?id=eq.${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast("Proveedor actualizado");
      } else {
        await apiFetch("/proveedores", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { ...hdr(), "Prefer": "return=representation" },
        });
        showToast("Proveedor creado");
      }
      setVista("lista");
      cargar();
    } catch (e) {
      showToast("Error al guardar: " + e.message, "err");
    } finally {
      setGuardando(false);
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────
  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este proveedor? Esta acción no se puede deshacer.")) return;
    try {
      await apiFetch(`/proveedores?id=eq.${id}`, { method: "DELETE" });
      showToast("Proveedor eliminado");
      setVista("lista");
      cargar();
    } catch (e) {
      showToast("Error al eliminar", "err");
    }
  };

  // ─── Filtrado ─────────────────────────────────────────────────
  const filtrados = proveedores.filter(p => {
    const matchTipo = filtroTipo === "todos" || p.tipo === filtroTipo;
    const matchBus  = !busqueda || [p.nombre, p.nit, p.email, p.telefono]
      .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()));
    return matchTipo && matchBus;
  });

  // ─── Stats ────────────────────────────────────────────────────
  const stats = TIPOS.map(t => ({
    ...t,
    count: proveedores.filter(p => p.tipo === t.value).length,
  })).filter(t => t.count > 0);

  // ════════════════════════════════════════════════════════════════
  // VISTA: FORMULARIO
  // ════════════════════════════════════════════════════════════════
  if (vista === "form") {
    const inp = (field, label, type = "text", placeholder = "") => (
      <div>
        <label style={S.lbl}>{label}</label>
        <input
          style={S.inp} type={type} placeholder={placeholder}
          value={form[field] || ""}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        />
      </div>
    );
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setVista("lista")} style={S.btn("ghost")}>← Volver</button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.txt }}>
            {editId ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tipo */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>TIPO DE PROVEEDOR</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TIPOS.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                  style={{ border: `2px solid ${form.tipo === t.value ? t.color : T.bord}`, background: form.tipo === t.value ? t.color + "22" : "transparent", borderRadius: 10, padding: "8px 6px", cursor: "pointer", color: form.tipo === t.value ? t.color : T.sub, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datos fiscales */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DATOS FISCALES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>{inp("nombre", "NOMBRE / RAZÓN SOCIAL *", "text", "Nombre del proveedor")}</div>
              {inp("nit", "NIT", "text", "1234567-8")}
              {inp("telefono", "TELÉFONO", "tel", "+502 0000-0000")}
              <div style={{ gridColumn: "1/-1" }}>{inp("email", "CORREO ELECTRÓNICO", "email", "proveedor@email.com")}</div>
              <div style={{ gridColumn: "1/-1" }}>{inp("direccion", "DIRECCIÓN", "text", "Dirección completa")}</div>
            </div>
          </div>

          {/* Contacto */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>PERSONA DE CONTACTO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {inp("contacto_nombre", "NOMBRE DEL CONTACTO")}
              {inp("contacto_tel", "TELÉFONO DIRECTO")}
            </div>
          </div>

          {/* Notas */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 8, letterSpacing: 1 }}>NOTAS INTERNAS</div>
            <textarea
              style={{ ...S.inp, minHeight: 80, resize: "vertical" }}
              placeholder="Condiciones de crédito, observaciones, etc."
              value={form.notas || ""}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            />
          </div>

          {/* Estado */}
          <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.txt }}>Proveedor activo</span>
            <button onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.activo ? T.acc : T.bord, transition: "background .2s", position: "relative" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: form.activo ? 22 : 3, transition: "left .2s" }} />
            </button>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setVista("lista")} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando} style={{ ...S.btn("primary"), flex: 2 }}>
              {guardando ? "Guardando..." : editId ? "Actualizar Proveedor" : "Crear Proveedor"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VISTA: DETALLE
  // ════════════════════════════════════════════════════════════════
  if (vista === "detalle" && seleccionado) {
    const p     = seleccionado;
    const ti    = tipoInfo(p.tipo);
    const tabs  = [
      { id: "datos",          label: "Datos" },
      { id: "gastos",         label: `Gastos (${historial.gastos.length})` },
      { id: "compras",        label: `Compras (${historial.compras.length})` },
      { id: "mantenimientos", label: `Mantenim. (${historial.mantenimientos.length})` },
    ];
    const totalGastos = historial.gastos.reduce((s, g) => s + (Number(g.total) || 0), 0);
    const totalCompras = historial.compras.reduce((s, c) => s + (Number(c.total) || 0), 0);
    const totalMant = historial.mantenimientos.reduce((s, m) => s + (Number(m.costo_total) || 0), 0);
    const totalGeneral = totalGastos + totalCompras + totalMant;

    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setVista("lista")} style={S.btn("ghost")}>← Lista</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => abrirForm(p)} style={S.btn("ghost")}>✏️ Editar</button>
          <button onClick={() => eliminar(p.id)} style={{ ...S.btn("ghost"), color: T.red, borderColor: T.red + "44" }}>🗑️</button>
        </div>

        {/* Tarjeta proveedor */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: ti.color + "22", border: `2px solid ${ti.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
              {ti.label.split(" ")[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.txt }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: ti.color, fontWeight: 600, marginTop: 2 }}>{ti.label}</div>
              {p.nit && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>NIT: {p.nit}</div>}
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 20, background: p.activo ? "#10B98122" : "#EF444422", color: p.activo ? T.green : T.red, fontSize: 11, fontWeight: 700 }}>
              {p.activo ? "ACTIVO" : "INACTIVO"}
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Gastos",  value: fmt(totalGastos),  color: T.red   },
            { label: "Total Compras", value: fmt(totalCompras), color: T.blue  },
            { label: "Mantenimien.",  value: fmt(totalMant),    color: T.sec   },
            { label: "TOTAL",         value: fmt(totalGeneral), color: T.acc, big: true },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, textAlign: "center", padding: 12, border: s.big ? `1px solid ${s.color}44` : undefined }}>
              <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: s.big ? 14 : 13, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setDetTab(t.id)}
              style={{ ...S.btn(detTab === t.id ? "primary" : "ghost"), whiteSpace: "nowrap", fontSize: 12 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Datos */}
        {detTab === "datos" && (
          <div style={S.card}>
            {[
              ["Nombre / Razón Social", p.nombre],
              ["NIT", p.nit || "—"],
              ["Tipo", tipoInfo(p.tipo).label],
              ["Teléfono", p.telefono || "—"],
              ["Email", p.email || "—"],
              ["Dirección", p.direccion || "—"],
              ["Contacto", p.contacto_nombre || "—"],
              ["Tel. Contacto", p.contacto_tel || "—"],
              ["Notas", p.notas || "—"],
              ["Registrado", fmtDate(p.created_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.bord}`, gap: 12 }}>
                <span style={{ fontSize: 12, color: T.sub, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, color: T.txt, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Gastos */}
        {detTab === "gastos" && (
          <div style={S.card}>
            {loadingHist ? <div style={{ color: T.sub, textAlign: "center", padding: 24 }}>Cargando...</div>
            : historial.gastos.length === 0
            ? <div style={{ color: T.mut, textAlign: "center", padding: 24 }}>Sin gastos registrados</div>
            : historial.gastos.map(g => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize: 13, color: T.txt, fontWeight: 600 }}>{g.descripcion || g.categoria || "Gasto"}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{fmtDate(g.fecha)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.red }}>{fmt(g.total)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Compras */}
        {detTab === "compras" && (
          <div style={S.card}>
            {loadingHist ? <div style={{ color: T.sub, textAlign: "center", padding: 24 }}>Cargando...</div>
            : historial.compras.length === 0
            ? <div style={{ color: T.mut, textAlign: "center", padding: 24 }}>Sin compras registradas</div>
            : historial.compras.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize: 13, color: T.txt, fontWeight: 600 }}>{c.descripcion || c.numero_orden || "Compra"}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{fmtDate(c.fecha)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.blue }}>{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Mantenimientos */}
        {detTab === "mantenimientos" && (
          <div style={S.card}>
            {loadingHist ? <div style={{ color: T.sub, textAlign: "center", padding: 24 }}>Cargando...</div>
            : historial.mantenimientos.length === 0
            ? <div style={{ color: T.mut, textAlign: "center", padding: 24 }}>Sin mantenimientos registrados</div>
            : historial.mantenimientos.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize: 13, color: T.txt, fontWeight: 600 }}>{m.tipo_mantenimiento || m.descripcion || "Mantenimiento"}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{fmtDate(m.fecha)} {m.vehiculo_placa ? `· ${m.vehiculo_placa}` : ""}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B" }}>{fmt(m.costo_total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VISTA: LISTA (principal)
  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.txt }}>Proveedores</h2>
          <div style={{ fontSize: 12, color: T.sub }}>{proveedores.length} proveedores registrados</div>
        </div>
        <button onClick={() => abrirForm()} style={S.btn("primary")}>+ Nuevo</button>
      </div>

      {/* Tarjetas de resumen por tipo */}
      {stats.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
          <button onClick={() => setFiltroTipo("todos")}
            style={{ border: `2px solid ${filtroTipo === "todos" ? T.acc : T.bord}`, background: filtroTipo === "todos" ? T.acc + "22" : "transparent", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: filtroTipo === "todos" ? T.acc : T.sub, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
            Todos ({proveedores.length})
          </button>
          {stats.map(s => (
            <button key={s.value} onClick={() => setFiltroTipo(s.value)}
              style={{ border: `2px solid ${filtroTipo === s.value ? s.color : T.bord}`, background: filtroTipo === s.value ? s.color + "22" : "transparent", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: filtroTipo === s.value ? s.color : T.sub, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              {s.label} ({s.count})
            </button>
          ))}
        </div>
      )}

      {/* Búsqueda */}
      <div style={{ marginBottom: 16 }}>
        <input style={S.inp} placeholder="🔍  Buscar por nombre, NIT, email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: T.sub }}>Cargando proveedores...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ color: T.sub, fontSize: 14 }}>
            {proveedores.length === 0 ? "Aún no hay proveedores registrados" : "Sin resultados para tu búsqueda"}
          </div>
          {proveedores.length === 0 && (
            <button onClick={() => abrirForm()} style={{ ...S.btn("primary"), marginTop: 16 }}>
              Agregar primer proveedor
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map(p => {
            const ti = tipoInfo(p.tipo);
            return (
              <div key={p.id} onClick={() => abrirDetalle(p)}
                style={{ ...S.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ti.color + "66"}
                onMouseLeave={e => e.currentTarget.style.borderColor = ""}>
                {/* Icono */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: ti.color + "22", border: `2px solid ${ti.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {ti.label.split(" ")[0]}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                    {p.nit ? `NIT: ${p.nit}` : "Sin NIT"} · {p.telefono || "Sin teléfono"}
                  </div>
                </div>
                {/* Tipo + estado */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ti.color, background: ti.color + "22", padding: "2px 8px", borderRadius: 20, marginBottom: 4 }}>
                    {ti.label.replace(/^\S+\s/, "")}
                  </div>
                  {!p.activo && <div style={{ fontSize: 10, color: T.mut }}>INACTIVO</div>}
                </div>
                <div style={{ color: T.mut, fontSize: 18, flexShrink: 0 }}>›</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
