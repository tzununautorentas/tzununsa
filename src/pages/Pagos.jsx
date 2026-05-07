<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { T, S, fmt, fmtD, today, getEmpId, dbGet, dbIns, dbUpd, dbDel } from "../config.js";
import { Toast, Spinner, Empty, Fld, ModalExportar } from "../components/shared.jsx";

export default function PagePagos({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportar, setExportar] = useState(false);
  const EMPTY = { fecha: today(), monto: "", metodo: "transferencia", referencia: "", factura_id: "", reserva_id: "", concepto: "", cuenta_id: "", notas: "" };
  const [f, setF] = useState({ ...EMPTY });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const [p, fa, re, cu] = await Promise.all([
      dbGet("pagos_recibidos"),
      dbGet("facturas"),
      dbGet("reservas"),
      dbGet("cuentas_bancarias"),
    ]);
    setRows(p); setFacturas(fa); setReservas(re); setCuentas(cu);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const guardar = async () => {
    if (!f.monto || parseFloat(f.monto) <= 0) { showToast("Ingresa el monto recibido", "err"); return; }
    if (!f.cuenta_id) { showToast("Selecciona la cuenta bancaria donde se recibió el pago", "err"); return; }
    if (!f.concepto.trim() && !f.factura_id && !f.reserva_id) { showToast("Ingresa un concepto o vincula a factura/reserva", "err"); return; }
    setSaving(true);
    try {
      const eid = empId || await getEmpId();
      const monto = parseFloat(f.monto);
      let concepto = f.concepto.trim();
      if (!concepto) {
        const fa = facturas.find(x => x.id === f.factura_id);
        const re = reservas.find(x => x.id === f.reserva_id);
        concepto = fa ? \`Pago factura \${fa.numero} — \${fa.nombre_receptor}\` : re ? \`Pago reserva \${re.numero} — \${re.cliente_nombre}\` : "Pago recibido";
      }
      const pago = await dbIns("pagos_recibidos", { empresa_id: eid, fecha: f.fecha, monto, metodo: f.metodo, referencia: f.referencia || "", concepto, cuenta_id: f.cuenta_id, notas: f.notas || "", factura_id: f.factura_id || null, reserva_id: f.reserva_id || null });
      if (pago?.error) { showToast("Error: " + pago.error, "err"); setSaving(false); return; }
      if (f.factura_id) {
        const fa = facturas.find(x => x.id === f.factura_id);
        if (fa) { const saldo = Math.max(0, (parseFloat(fa.saldo_pendiente) || parseFloat(fa.total) || 0) - monto); await dbUpd("facturas", f.factura_id, { saldo_pendiente: saldo, estado: saldo <= 0 ? "pagada" : "parcial" }); }
      }
      if (f.reserva_id) {
        const re = reservas.find(x => x.id === f.reserva_id);
        if (re) { const saldo = Math.max(0, (parseFloat(re.saldo) || 0) - monto); await dbUpd("reservas", f.reserva_id, { saldo, anticipo: (parseFloat(re.anticipo) || 0) + monto }); }
      }
      await dbIns("movimientos_bancarios", { empresa_id: eid, cuenta_id: f.cuenta_id, fecha: f.fecha, tipo: "ingreso", descripcion: concepto, monto, referencia: f.referencia || "", categoria: "ventas", conciliado: false });
      const cu = cuentas.find(x => x.id === f.cuenta_id);
      if (cu) await dbUpd("cuentas_bancarias", f.cuenta_id, { saldo_actual: (parseFloat(cu.saldo_actual) || 0) + monto });
      showToast("Pago registrado ✔"); setSaving(false); setShowForm(false); setF({ ...EMPTY }); load();
    } catch (e) { showToast("Error: " + e.message, "err"); setSaving(false); }
  };

  const del = async (id) => { if (!confirm("¿Eliminar?")) return; await dbDel("pagos_recibidos", id); showToast("Eliminado"); load(); };
  const total = rows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const esteMes = rows.filter(r => (r.fecha || "").slice(0, 7) === today().slice(0, 7)).reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const CAMPOS = [{ label: "Fecha", key: "fecha" }, { label: "Concepto", key: "concepto" }, { label: "Monto", key: "monto" }, { label: "Método", key: "metodo" }, { label: "Referencia", key: "referencia" }];

  return (
    <div>
      {exportar && <ModalExportar titulo="Pagos Recibidos" datos={rows} campos={CAMPOS} onClose={() => setExportar(false)} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {[{ l: "Total recibido", v: "Q " + fmt(total), c: T.acc, bg: T.accD }, { l: "Este mes", v: "Q " + fmt(esteMes), c: T.blue, bg: T.blueD }, { l: "Registros", v: rows.length, c: T.purple, bg: T.purpleD }].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: \`1px solid \${s.c}44\`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: T.mut }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 12 }}>📤 Exportar</button>
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 12 }}>↺</button>
        <button onClick={() => setShowForm(!showForm)} style={{ ...S.btn(showForm ? "warn" : "primary"), fontSize: 12, marginLeft: "auto" }}>{showForm ? "Cancelar" : "+ Registrar pago"}</button>
      </div>
      {showForm && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Registrar pago recibido</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} /></Fld>
            <Fld label="MONTO (GTQ)"><input style={{ ...S.inp, fontWeight: 700, color: T.acc }} type="number" step="0.01" value={f.monto} onChange={e => sf("monto", e.target.value)} placeholder="0.00" /></Fld>
            <Fld label="CUENTA BANCARIA *" span2>
              <select style={cuentas.length === 0 ? { ...S.sel, borderColor: T.red } : S.sel} value={f.cuenta_id} onChange={e => sf("cuenta_id", e.target.value)}>
                <option value="">Seleccionar cuenta bancaria...</option>
                {cuentas.map(cu => <option key={cu.id} value={cu.id}>{cu.banco} — {cu.numero_cuenta} · Saldo: Q {fmt(cu.saldo_actual)}</option>)}
              </select>
              {cuentas.length === 0 && <div style={{ fontSize: 11, color: T.red, marginTop: 3 }}>⚠ No hay cuentas. Ve a La Banca para crear una.</div>}
            </Fld>
            <Fld label="MÉTODO DE PAGO">
              <select style={S.sel} value={f.metodo} onChange={e => sf("metodo", e.target.value)}>
                <option value="transferencia">🏦 Transferencia bancaria</option>
                <option value="deposito">💰 Depósito en banco</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="cheque">📄 Cheque</option>
              </select>
            </Fld>
            <Fld label="REFERENCIA / N° COMPROBANTE"><input style={S.inp} value={f.referencia} onChange={e => sf("referencia", e.target.value)} placeholder="REF-00001" /></Fld>
            <Fld label="VINCULAR A FACTURA (opcional)">
              <select style={S.sel} value={f.factura_id} onChange={e => sf("factura_id", e.target.value)}>
                <option value="">Sin factura vinculada</option>
                {facturas.filter(fa => !["pagada", "anulada"].includes(fa.estado)).map(fa => <option key={fa.id} value={fa.id}>{fa.numero} — {fa.nombre_receptor} · Saldo: Q {fmt(fa.saldo_pendiente || fa.total)}</option>)}
              </select>
            </Fld>
            <Fld label="VINCULAR A RESERVA (opcional)">
              <select style={S.sel} value={f.reserva_id} onChange={e => sf("reserva_id", e.target.value)}>
                <option value="">Sin reserva vinculada</option>
                {reservas.filter(re => re.estado !== "cancelada").map(re => <option key={re.id} value={re.id}>{re.numero} — {re.cliente_nombre} · Saldo: Q {fmt(re.saldo || re.monto)}</option>)}
              </select>
            </Fld>
            <Fld label="CONCEPTO" span2><input style={S.inp} value={f.concepto} onChange={e => sf("concepto", e.target.value)} placeholder="Ej: Anticipo reserva Cobán..." /></Fld>
            <Fld label="NOTAS"><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones" /></Fld>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex: 1, padding: 10 }}>{saving ? "Guardando..." : "💾 Guardar"}</button>
                <button onClick={() => { setShowForm(false); setF({ ...EMPTY }); }} style={{ ...S.btn("ghost"), flex: 1, padding: 10 }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading ? <Spinner /> : rows.length === 0 ? <Empty icon="💰" msg="Sin pagos registrados" action="+ Registrar pago" onAction={() => setShowForm(true)} /> : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Fecha", "Concepto", "Método", "Referencia", "Monto", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: "nowrap" }}>{fmtD(r.fecha)}</td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{r.concepto}</td>
                  <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{r.metodo}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: T.mut }}>{r.referencia || "—"}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: T.acc, whiteSpace: "nowrap" }}>Q {fmt(r.monto)}</td>
                  <td style={S.td}><button onClick={() => del(r.id)} style={{ ...S.btn("danger"), padding: "3px 8px", fontSize: 11 }}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr style={{ background: T.surf }}>
              <td colSpan={4} style={{ padding: "9px 10px", fontWeight: 700, color: T.sub, fontSize: 12 }}>TOTAL</td>
              <td style={{ padding: "9px 10px", fontWeight: 800, color: T.acc, fontSize: 14 }}>Q {fmt(total)}</td>
              <td />
            </tr></tfoot>
          </table>
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
        </div>
      </div>
    </div>
  );
}

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
