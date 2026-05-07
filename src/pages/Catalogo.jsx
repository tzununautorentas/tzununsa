<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { T, S, fmt, today, getEmpId, dbGet, dbIns, dbUpd, dbDel } from "../config.js";
import { Toast, Spinner, Empty, Fld, ModalExportar } from "../components/shared.jsx";

const CATEGORIAS_PROD = ["transporte", "turismo", "renta vehículo", "traslado", "servicio especial", "paquete corporativo", "otro"];

function FormProducto({ initial, empId, onSave, onCancel }) {
  const [f, setF] = useState({
    codigo: initial?.codigo || "",
    nombre: initial?.nombre || "",
    descripcion: initial?.descripcion || "",
    categoria: initial?.categoria || "transporte",
    precio_base: initial?.precio_base || "",
    precio_tarjeta: initial?.precio_tarjeta || "",
    unidad: initial?.unidad || "servicio",
    aplica_iva: initial?.aplica_iva !== false,
    tasa_iva: initial?.tasa_iva || 5,
    activo: initial?.activo !== false,
    imagen_emoji: initial?.imagen_emoji || "🚗",
    notas: initial?.notas || "",
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);

  const precioConIVA = f.aplica_iva ? parseFloat(f.precio_base || 0) * (1 + (f.tasa_iva || 0) / 100) : parseFloat(f.precio_base || 0);

  const guardar = async () => {
    if (!f.nombre.trim()) { alert("El nombre es requerido"); return; }
    if (!f.precio_base || parseFloat(f.precio_base) <= 0) { alert("El precio base es requerido"); return; }
    setSaving(true);
    const eid = empId || await getEmpId();
    const payload = { ...f, empresa_id: eid, precio_base: parseFloat(f.precio_base), precio_tarjeta: parseFloat(f.precio_tarjeta) || parseFloat(f.precio_base) * 1.05, tasa_iva: parseInt(f.tasa_iva) || 0 };
    const result = initial?.id ? await dbUpd("catalogo_servicios", initial.id, payload) : await dbIns("catalogo_servicios", payload);
    if (result?.error) { alert("Error: " + result.error); setSaving(false); return; }
    setSaving(false); onSave();
  };

  const EMOJIS = ["🚗", "🚌", "🏍️", "🚐", "🛻", "✈️", "🌎", "🏔️", "🏖️", "🏢", "👥", "📦", "⭐", "💼", "🎯"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>{initial?.id ? "Editar servicio" : "Nuevo servicio / producto"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={S.lbl}>ÍCONO</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => sf("imagen_emoji", e)} style={{ fontSize: 22, width: 40, height: 40, borderRadius: 8, border: `2px solid ${f.imagen_emoji === e ? T.acc : T.bord}`, background: f.imagen_emoji === e ? T.accD : T.surf, cursor: "pointer" }}>{e}</button>
              ))}
            </div>
          </div>
          <Fld label="CÓDIGO"><input style={S.inp} value={f.codigo} onChange={e => sf("codigo", e.target.value)} placeholder="SRV-001" /></Fld>
          <Fld label="CATEGORÍA">
            <select style={S.sel} value={f.categoria} onChange={e => sf("categoria", e.target.value)}>
              {CATEGORIAS_PROD.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </Fld>
          <Fld label="NOMBRE DEL SERVICIO" span2><input style={S.inp} value={f.nombre} onChange={e => sf("nombre", e.target.value)} placeholder="Ej: Traslado aeropuerto zona 10" /></Fld>
          <Fld label="DESCRIPCIÓN" span2><textarea style={{ ...S.inp, minHeight: 70, resize: "vertical" }} value={f.descripcion} onChange={e => sf("descripcion", e.target.value)} placeholder="Descripción del servicio para el cliente..." /></Fld>
          <Fld label="UNIDAD DE COBRO">
            <select style={S.sel} value={f.unidad} onChange={e => sf("unidad", e.target.value)}>
              <option value="servicio">Por servicio</option>
              <option value="dia">Por día</option>
              <option value="km">Por kilómetro</option>
              <option value="hora">Por hora</option>
              <option value="persona">Por persona</option>
            </select>
          </Fld>
          <Fld label="ESTADO">
            <select style={S.sel} value={f.activo ? "activo" : "inactivo"} onChange={e => sf("activo", e.target.value === "activo")}>
              <option value="activo">✅ Activo</option>
              <option value="inactivo">⏸ Inactivo</option>
            </select>
          </Fld>
          <Fld label="NOTAS INTERNAS" span2><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Notas para el equipo..." /></Fld>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>PRECIOS</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="PRECIO BASE (sin IVA, en GTQ)"><input style={{ ...S.inp, fontWeight: 700 }} type="number" step="0.01" value={f.precio_base} onChange={e => sf("precio_base", e.target.value)} placeholder="0.00" /></Fld>
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 8, background: T.surf }}>
                <input type="checkbox" id="aplIVA" checked={f.aplica_iva} onChange={e => sf("aplica_iva", e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="aplIVA" style={{ fontSize: 13, cursor: "pointer" }}>Aplica IVA</label>
                {f.aplica_iva && (
                  <select style={{ ...S.sel, width: "auto", marginLeft: "auto" }} value={f.tasa_iva} onChange={e => sf("tasa_iva", parseInt(e.target.value))}>
                    <option value={12}>12%</option>
                    <option value={5}>5%</option>
                  </select>
                )}
              </div>
              {f.aplica_iva && <div style={{ background: T.accD, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                <div style={{ color: T.sub }}>Precio con IVA incluido</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>Q {fmt(precioConIVA)}</div>
              </div>}
              <Fld label="PRECIO CON TARJETA (+5%, se calcula solo)"><input style={S.inp} type="number" step="0.01" value={f.precio_tarjeta || ""} onChange={e => sf("precio_tarjeta", e.target.value)} placeholder={fmt(precioConIVA * 1.05)} /></Fld>
            </div>
          </div>
          {/* Vista previa */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>VISTA PREVIA EN CATÁLOGO</div>
            <div style={{ background: T.surf, borderRadius: 12, padding: 16, border: `1px solid ${T.bord}` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{f.imagen_emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.nombre || "Nombre del servicio"}</div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{f.descripcion || "Descripción del servicio"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>Q {fmt(precioConIVA)}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>por {f.unidad}</div>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: f.activo ? T.greenD : T.redD, color: f.activo ? T.green : T.red }}>{f.activo ? "Activo" : "Inactivo"}</span>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), width: "100%", padding: 11, fontSize: 13 }}>{saving ? "Guardando..." : "💾 Guardar servicio"}</button>
            <button onClick={onCancel} style={{ ...S.btn("ghost"), width: "100%", padding: 11, marginTop: 8 }}>Cancelar</button>
          </div>
=======
import React, { useState, useEffect, useRef, Component } from "react";
import { T, S, fmt, fmtD, dbGet, dbIns } from "./config.js";

// ── Error Boundary ────────────────────────────────────────────────────────────
export class ErrBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ ...S.card, margin: 16 }}>
        <div style={{ color: T.red, fontWeight: 700, marginBottom: 8 }}>⚠️ Error en este módulo</div>
        <div style={{ fontSize: 12, color: T.sub, fontFamily: "monospace", marginBottom: 12 }}>{String(this.state.err)}</div>
        <button onClick={() => this.setState({ err: null })} style={S.btn("primary")}>↺ Reintentar</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, type }) {
  if (!msg) return null;
  const c = type === "err" ? T.red : T.acc;
  return (
    <div style={{ background: T.card, border: `1px solid ${c}`, borderRadius: 10, padding: "11px 18px", fontSize: 13, color: c, fontWeight: 600, marginBottom: 14 }}>
      {type === "err" ? "❌" : "✅"} {msg}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return <div style={{ textAlign: "center", padding: 48, color: T.sub, fontSize: 14 }}>⏳ Cargando...</div>;
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon, msg, action, onAction }) {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.sub }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, marginBottom: action ? 16 : 0 }}>{msg}</div>
      {action && <button onClick={onAction} style={{ ...S.btn("primary"), marginTop: 4 }}>{action}</button>}
    </div>
  );
}

// ── Fld (Field wrapper) ───────────────────────────────────────────────────────
export function Fld({ label, children, span2 }) {
  return (
    <div style={span2 ? { gridColumn: "span 2" } : {}}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ c, bg, l, small }) {
  return (
    <span style={{ display: "inline-block", padding: small ? "2px 8px" : "3px 10px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 700, color: c, background: bg }}>
      {l}
    </span>
  );
}

// ── Modal Exportar ────────────────────────────────────────────────────────────
export function ModalExportar({ titulo, datos, campos, onClose }) {
  const [formato, setFormato] = useState("csv");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");

  const filtered = datos.filter(r => {
    const f = r.fecha || r.created_at || r.fecha_inicio || "";
    if (fi && f < fi) return false;
    if (ff && f > ff) return false;
    return true;
  });

  const exportar = () => {
    if (formato === "pdf") {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${titulo}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:11px}h2{color:#1B2D5C}
      table{width:100%;border-collapse:collapse}th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #E2E8F0}@media print{button{display:none}}</style>
      </head><body>
      <h2>Tz'unun AutoRentas — ${titulo}</h2>
      <p>${filtered.length} registros · ${new Date().toLocaleDateString("es-GT")}</p>
      <table><thead><tr>${campos.map(c => `<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${filtered.map(r => `<tr>${campos.map(c => `<td>${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table><script>window.onload=()=>window.print();</script></body></html>`;
      const w = window.open("", "_blank"); w.document.write(html); w.document.close();
    } else {
      const sep = formato === "csv" ? "," : "\t";
      const bom = "\uFEFF";
      const rows = [
        campos.map(c => c.label).join(sep),
        ...filtered.map(r => campos.map(c => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(sep))
      ].join("\n");
      const blob = new Blob([bom + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = titulo.replace(/\s+/g, "_") + (formato === "csv" ? ".csv" : ".xls");
      a.click(); URL.revokeObjectURL(url);
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>📤 Exportar — {titulo}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 22 }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <Fld label="DESDE"><input style={S.inp} type="date" value={fi} onChange={e => setFi(e.target.value)} /></Fld>
          <Fld label="HASTA"><input style={S.inp} type="date" value={ff} onChange={e => setFf(e.target.value)} /></Fld>
        </div>
        <Fld label="FORMATO DE EXPORTACIÓN">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[["csv", "📄 CSV (Excel compatible)"], ["xls", "📊 XLS (Microsoft Excel)"], ["pdf", "🖨️ PDF (imprimir)"]].map(([v, l]) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "9px 12px", borderRadius: 8, background: formato === v ? T.accD : T.surf, border: `1px solid ${formato === v ? T.acc : T.bord}` }}>
                <input type="radio" name="fmt" checked={formato === v} onChange={() => setFormato(v)} style={{ accentColor: T.acc }} />
                <span style={{ fontSize: 13 }}>{l}</span>
              </label>
            ))}
          </div>
        </Fld>
        <div style={{ fontSize: 11, color: T.mut, marginBottom: 14, padding: "8px 12px", background: T.surf, borderRadius: 6 }}>
          Se exportarán <b style={{ color: T.acc }}>{filtered.length}</b> registros
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportar} style={{ ...S.btn("primary"), flex: 2, padding: 11, fontSize: 13 }}>📤 Exportar</button>
          <button onClick={onClose} style={{ ...S.btn("ghost"), flex: 1, padding: 11 }}>Cancelar</button>
>>>>>>> 4a0f4099400f9c90dcb967c23cc8bf8c32727e98
        </div>
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default function PageCatalogo({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("catalogo");
  const [editItem, setEditItem] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [exportar, setExportar] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  const load = async () => {
    setLoading(true);
    const d = await dbGet("catalogo_servicios", "&order=categoria.asc,nombre.asc");
    if (!Array.isArray(d) || (d.length === 0 && d.error)) setTableExists(false);
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar este servicio del catálogo?")) return;
    await dbDel("catalogo_servicios", id);
    showToast("Eliminado"); load();
  };
  const toggleActivo = async (id, activo) => {
    await dbUpd("catalogo_servicios", id, { activo: !activo });
    showToast(!activo ? "Activado ✔" : "Desactivado"); load();
  };

  const filtered = rows.filter(r => {
    const matchCat = filtroCat === "todas" || r.categoria === filtroCat;
    const matchBuscar = !buscar || r.nombre?.toLowerCase().includes(buscar.toLowerCase()) || r.codigo?.toLowerCase().includes(buscar.toLowerCase());
    return matchCat && matchBuscar;
  });

  const categorias = ["todas", ...new Set(rows.map(r => r.categoria).filter(Boolean))];
  const CAMPOS_EXP = [{ label: "Código", key: "codigo" }, { label: "Nombre", key: "nombre" }, { label: "Categoría", key: "categoria" }, { label: "Precio base", key: "precio_base" }, { label: "Unidad", key: "unidad" }, { label: "Activo", key: "activo" }];

  if (!tableExists) return (
    <div style={S.card}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.red, marginBottom: 12 }}>⚠️ Tabla no encontrada</div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>La tabla <code>catalogo_servicios</code> no existe en Supabase. Ejecuta este SQL:</div>
      <div style={{ background: "#0D1117", borderRadius: 10, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#7DD3FC", lineHeight: 1.8 }}>
        {\`CREATE TABLE catalogo_servicios (\\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\\n  empresa_id UUID,\\n  codigo TEXT,\\n  nombre TEXT NOT NULL,\\n  descripcion TEXT,\\n  categoria TEXT DEFAULT 'transporte',\\n  precio_base DECIMAL(12,2) DEFAULT 0,\\n  precio_tarjeta DECIMAL(12,2) DEFAULT 0,\\n  unidad TEXT DEFAULT 'servicio',\\n  aplica_iva BOOLEAN DEFAULT true,\\n  tasa_iva INTEGER DEFAULT 5,\\n  activo BOOLEAN DEFAULT true,\\n  imagen_emoji TEXT DEFAULT '🚗',\\n  notas TEXT,\\n  created_at TIMESTAMPTZ DEFAULT NOW()\\n);\\nALTER TABLE catalogo_servicios DISABLE ROW LEVEL SECURITY;\`}
      </div>
      <button onClick={load} style={{ ...S.btn("primary"), marginTop: 14 }}>↺ Reintentar después de crear la tabla</button>
    </div>
  );

  if (vista === "form") return (
    <FormProducto initial={editItem} empId={empId}
      onSave={() => { setVista("catalogo"); setEditItem(null); load(); showToast("Guardado ✔"); }}
      onCancel={() => { setVista("catalogo"); setEditItem(null); }} />
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Catálogo de Servicios" datos={rows} campos={CAMPOS_EXP} onClose={() => setExportar(false)} />}
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[{ l: "Total servicios", v: rows.length, c: T.acc }, { l: "Activos", v: rows.filter(r => r.activo !== false).length, c: T.green }, { l: "Inactivos", v: rows.filter(r => r.activo === false).length, c: T.red }, { l: "Categorías", v: new Set(rows.map(r => r.categoria)).size, c: T.blue }].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {/* Controles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...S.inp, maxWidth: 260 }} value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="🔍 Buscar por nombre o código..." />
        {categorias.map(c => (
          <button key={c} onClick={() => setFiltroCat(c)} style={{ ...S.btn(filtroCat === c ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {c === "todas" ? "Todas" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>📤 Exportar</button>
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11 }}>↺</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12, marginLeft: "auto" }}>+ Agregar servicio</button>
      </div>
      {/* Grid de tarjetas tipo catálogo */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon="📦" msg="Sin servicios en el catálogo" action="+ Agregar primer servicio" onAction={() => { setEditItem(null); setVista("form"); }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...S.card, opacity: r.activo === false ? 0.6 : 1, transition: "transform .15s", cursor: "default", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 36 }}>{r.imagen_emoji || "🚗"}</div>
                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: r.activo !== false ? T.greenD : T.redD, color: r.activo !== false ? T.green : T.red }}>{r.activo !== false ? "Activo" : "Inactivo"}</span>
              </div>
              {r.codigo && <div style={{ fontFamily: "monospace", fontSize: 10, color: T.mut }}>{r.codigo}</div>}
              <div style={{ fontSize: 14, fontWeight: 700 }}>{r.nombre}</div>
              {r.descripcion && <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.4 }}>{r.descripcion}</div>}
              <div style={{ padding: "8px 0", borderTop: \`1px solid \${T.bord}22\` }}>
                <div style={{ fontSize: 11, color: T.mut, marginBottom: 2 }}>{r.categoria} · por {r.unidad}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.acc }}>Q {fmt(r.aplica_iva ? (r.precio_base || 0) * (1 + (r.tasa_iva || 0) / 100) : r.precio_base)}</div>
                {r.aplica_iva && <div style={{ fontSize: 11, color: T.sub }}>Incluye IVA {r.tasa_iva}% · sin IVA: Q {fmt(r.precio_base)}</div>}
                {r.precio_tarjeta > 0 && <div style={{ fontSize: 11, color: T.sec }}>💳 Con tarjeta: Q {fmt(r.precio_tarjeta)}</div>}
              </div>
              {r.notas && <div style={{ fontSize: 11, color: T.mut, fontStyle: "italic" }}>{r.notas}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: \`1px solid \${T.bord}22\` }}>
                <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11, padding: "5px 8px" }}>✏️ Editar</button>
                <button onClick={() => toggleActivo(r.id, r.activo)} style={{ ...S.btn(r.activo !== false ? "warn" : "green"), flex: 1, fontSize: 11, padding: "5px 8px" }}>{r.activo !== false ? "⏸ Pausar" : "▶ Activar"}</button>
                <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "5px 8px" }}>🗑️</button>
              </div>
            </div>
          ))}
=======
// ── Buscador de Clientes ──────────────────────────────────────────────────────
export function BuscadorCliente({ value, onChange, empId }) {
  const [clientes, setClientes] = useState([]);
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dbGet("clientes", "&order=codigo.asc,nombre.asc").then(d => setClientes(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = value.length > 0
    ? clientes.filter(c => c.nombre?.toLowerCase().includes(value.toLowerCase()) || c.codigo?.toLowerCase().includes(value.toLowerCase()))
    : clientes.slice(0, 8);

  const agregar = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    const r = await dbIns("clientes", { nombre: newNombre, tipo: "empresa", empresa_id: empId });
    if (!r.error) { setClientes(p => [...p, r]); onChange(newNombre); setShowNew(false); setNewNombre(""); setOpen(false); }
    setSaving(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={S.inp} value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Escribe nombre o código del cliente..." />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: `1px solid ${T.bord}`, borderRadius: 8, zIndex: 100, maxHeight: 240, overflowY: "auto", marginTop: 2 }}>
          {filtered.map((c, i) => (
            <div key={i} onClick={() => { onChange(c.nombre); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${T.bord}22`, display: "flex", justifyContent: "space-between" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span>{c.nombre}</span>
              <span style={{ fontSize: 11, color: T.mut }}>{c.codigo || ""}</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "8px 12px", fontSize: 12, color: T.mut }}>No encontrado</div>}
          {!showNew
            ? <div onClick={() => { setShowNew(true); setNewNombre(value); }}
                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, color: T.acc, fontWeight: 600, borderTop: `1px solid ${T.bord}` }}>
                ➕ Agregar nuevo cliente
              </div>
            : <div style={{ padding: 10, borderTop: `1px solid ${T.bord}` }}>
                <input style={{ ...S.inp, marginBottom: 6, fontSize: 12 }} value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Nombre del cliente" />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={agregar} disabled={saving} style={{ ...S.btn("primary"), flex: 1, fontSize: 11, padding: 6 }}>{saving ? "..." : "✔ Guardar"}</button>
                  <button onClick={() => setShowNew(false)} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11, padding: 6 }}>✕</button>
                </div>
              </div>
          }
>>>>>>> 4a0f4099400f9c90dcb967c23cc8bf8c32727e98
        </div>
      )}
    </div>
  );
}
<<<<<<< HEAD
=======

// ── Botones Compartir ─────────────────────────────────────────────────────────
export function BotonesCompartir({ numero, total, tipo }) {
  const msg = `Tz'unun AutoRentas — ${tipo} ${numero} por Q ${fmt(total)}. Más información: 502-31221538`;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), background: "#25D366", color: "#fff", fontSize: 11, padding: "5px 10px" }}>💬 WhatsApp</button>
      <button onClick={() => window.open("mailto:?subject=" + encodeURIComponent(tipo + " " + numero) + "&body=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), fontSize: 11, padding: "5px 10px" }}>✉️ Correo</button>
      <button onClick={() => window.open("tg://msg?text=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), background: "#2CA5E0", color: "#fff", fontSize: 11, padding: "5px 10px" }}>✈️ Telegram</button>
    </div>
  );
}
>>>>>>> 4a0f4099400f9c90dcb967c23cc8bf8c32727e98
