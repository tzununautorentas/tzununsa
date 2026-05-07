<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { T, S, fmt, fmtD, today, newId, getEmpId, dbGet, dbIns, dbUpd, dbDel, CATALOGO, tarifaVeh, RUTAS, GT } from "../config.js";
import { Toast, Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, BotonesCompartir } from "../components/shared.jsx";

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generarPDF(d) {
  if (!window.jspdf) { alert("PDF cargando, intenta en 5 segundos"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  // Header azul
  doc.setFillColor(27, 45, 92); doc.rect(0, 0, W, 80, "F");
  doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont(undefined, "bold");
  doc.text("TZ'UNUN AUTORENTAS", 22, 30);
  doc.setFontSize(9); doc.setFont(undefined, "normal");
  doc.text("Más comodidad, rapidez y mejores precios", 22, 44);
  doc.text("2da. Av. 0-68 Apto. A, Col. Bran, Zona 3 · 502-31221538 · tzununautorentas@gmail.com", 22, 56);
  doc.setFontSize(20); doc.setFont(undefined, "bold"); doc.setTextColor(0, 212, 170);
  doc.text(d.esOrden ? "ORDEN DE VENTA" : "COTIZACIÓN", W - 22, 28, { align: "right" });
  doc.setFontSize(10); doc.setTextColor(200, 200, 200); doc.setFont(undefined, "normal");
  doc.text(\`# \${d.numero}\`, W - 22, 44, { align: "right" });
  doc.text(\`Emisión: \${d.fecha}\`, W - 22, 56, { align: "right" });
  doc.text(\`Válida: \${d.fechaVence || "15 días"}\`, W - 22, 68, { align: "right" });
  // Cliente
  let y = 100;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.text("FACTURAR A:", 22, y); y += 12;
  doc.setFontSize(13); doc.setFont(undefined, "bold"); doc.setTextColor(27, 45, 92);
  const clienteLines = doc.splitTextToSize(d.cliente || "", 380);
  doc.text(clienteLines, 22, y); y += clienteLines.length * 14 + 4;
  if (d.nit) { doc.setFontSize(9); doc.setFont(undefined, "normal"); doc.setTextColor(100); doc.text(\`NIT: \${d.nit}\`, 22, y); y += 12; }
  // Saludo
  y += 8;
  doc.setFillColor(245, 248, 255); doc.rect(18, y, W - 36, 32, "F");
  doc.setFontSize(9); doc.setFont(undefined, "normal"); doc.setTextColor(50);
  const saludoText = d.saludo ? d.saludo + ":" : \`Estimados señores de \${d.cliente}:\`;
  const saludoLines = doc.splitTextToSize(saludoText, W - 50);
  doc.text(saludoLines[0].slice(0, 90), 24, y + 12);
  doc.text("En Transportes Tz'unun nos enfocamos en brindarle la mejor experiencia de viaje.", 24, y + 24);
  y += 44;
  // Tabla de precios
  doc.setFillColor(27, 45, 92); doc.rect(18, y, W - 36, 22, "F");
  doc.setTextColor(255); doc.setFontSize(9); doc.setFont(undefined, "bold");
  doc.text("DESCRIPCIÓN DEL SERVICIO", 24, y + 14);
  doc.text("PRECIO", W - 24, y + 14, { align: "right" });
  y += 22;
  doc.setFillColor(240, 248, 255); doc.rect(18, y, W - 36, 22, "F");
  doc.setTextColor(30); doc.setFont(undefined, "normal");
  doc.text(d.descripcion || \`Servicio de transporte — \${d.vehiculo || ""}\`, 24, y + 14);
  y += 22;
  // Totales
  y += 12;
  const col2 = W - 180;
  const drawRow = (label, val, bold = false, color = [30, 30, 30]) => {
    if (bold) doc.setFont(undefined, "bold"); else doc.setFont(undefined, "normal");
    doc.setTextColor(...color); doc.setFontSize(10);
    doc.text(label, col2, y); doc.text(val, W - 24, y, { align: "right" }); y += 16;
  };
  drawRow("Subtotal (sin IVA):", \`Q \${fmt(d.sub)}\`);
  drawRow(\`IVA (\${d.ivaPct}%):\`, \`Q \${fmt(d.ivaAmt)}\`);
  doc.setDrawColor(200); doc.line(col2, y, W - 24, y); y += 8;
  drawRow("TOTAL EFECTIVO / DEPÓSITO:", \`Q \${fmt(d.totalEf)}\`, true, [0, 148, 106]);
  if (d.mostrarTC) drawRow("TOTAL CON TARJETA (+5%):", \`Q \${fmt(d.totalEf * 1.05)}\`, false, [100]);
  drawRow(\`Equivalente USD (Q\${fmt(d.exch)}=\$1):\`, \`$ \${fmt(d.exch > 0 ? d.totalEf / d.exch : 0)}\`);
  // Términos
  y += 16;
  doc.setFillColor(245, 245, 245); doc.rect(18, y, W - 36, 90, "F");
  doc.setFontSize(8); doc.setFont(undefined, "bold"); doc.setTextColor(27, 45, 92);
  doc.text("TÉRMINOS Y CONDICIONES", 24, y + 12); y += 16;
  doc.setFont(undefined, "normal"); doc.setTextColor(80);
  const terms = [
    "• Nuestros vehículos son higienizados antes y después de cada servicio.",
    "• Se requiere copia de DPI del responsable del grupo.",
    "• Anticipo del 75% para confirmar el servicio.",
    "• Combustible incluido según el recorrido acordado.",
    "• El vehículo debe devolverse limpio (recargo Q.75.00 si no cumple).",
    "• El saldo restante se cancela al finalizar el servicio.",
  ];
  terms.forEach((t, i) => { doc.text(t, 24, y + i * 11); });
  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(27, 45, 92); doc.rect(0, pageH - 40, W, 40, "F");
  doc.setFontSize(8); doc.setTextColor(180); doc.setFont(undefined, "normal");
  doc.text("Banco Industrial: 853-000016-8  |  Banrural: 3309159475  |  @TzununAutorentas", W / 2, pageH - 22, { align: "center" });
  doc.text("tzununautorentas@gmail.com  |  502-31221538", W / 2, pageH - 10, { align: "center" });
  return doc;
}

// ── Form Cotización ───────────────────────────────────────────────────────────
function FormCotizacion({ initial, empId, onSave, onCancel }) {
  const isClone = initial?.__clon;
  const [f, setF] = useState({
    cliente_nombre: initial?.cliente_nombre || "",
    tipo: initial?.tipo || "renta",
    vehiculo_nombre: initial?.vehiculo_nombre || "",
    saludo: initial?.saludo || "",
    descripcion_servicio: initial?.descripcion_servicio || "",
    dias: initial?.dias || 1,
    iva: initial?.tasa_iva || 5,
    pago: initial?.metodo_pago || "efectivo",
    exch: initial?.tasa_cambio || 7.70,
    mostrarTC: initial?.mostrarTC || false,
    con_piloto: initial?.con_piloto !== false,
    incl: initial?.incl || [],
    notas: initial?.notas || "",
    cliente_nit: initial?.cliente_nit || "",
    cliente_dir: initial?.cliente_dir || "",
    // traslado
    kmi: initial?.km_ida || 0,
    kmr: initial?.km_regreso || 0,
    ruta: "",
    veh_dia: initial?.costo_vehiculo || 0,
    pil_dia: initial?.costo_piloto || 0,
    hos_dia: initial?.costo_hospedaje || 0,
    ali_dia: initial?.costo_alimentacion || 0,
    galon: initial?.precio_galon || 48,
    kpg: initial?.km_por_galon || 27,
    varios: initial?.gastos_varios || 0,
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // ── Cálculos Renta ──
  const vehObj = CATALOGO.find(v => v.nombre === f.vehiculo_nombre);
  const dias = parseInt(f.dias) || 1;
  const tarifaDia = tarifaVeh(vehObj, dias);
  const subRenta = dias * tarifaDia;
  const ivaRenta = subRenta * (parseInt(f.iva) || 0) / 100;
  const totalEfRenta = subRenta + ivaRenta;

  // ── Cálculos Traslado ──
  const tkm = (parseFloat(f.kmi) || 0) + (parseFloat(f.kmr) || 0);
  const gals = f.kpg > 0 ? tkm / parseFloat(f.kpg) : 0;
  const fuel = gals * (parseFloat(f.galon) || 0);
  const d2 = parseFloat(f.dias) || 1;
  const subTr = d2 * (parseFloat(f.veh_dia) || 0) + d2 * (parseFloat(f.pil_dia) || 0) +
    d2 * (parseFloat(f.hos_dia) || 0) + d2 * (parseFloat(f.ali_dia) || 0) + fuel + (parseFloat(f.varios) || 0);
  const ivaTr = subTr * (parseInt(f.iva) || 0) / 100;
  const totalEfTr = subTr + ivaTr;

  const sub = f.tipo === "renta" ? subRenta : subTr;
  const ivaAmt = f.tipo === "renta" ? ivaRenta : ivaTr;
  const totalEf = f.tipo === "renta" ? totalEfRenta : totalEfTr;

  const SERVICIOS_INCL = [
    ["combustible", "⛽ Combustible incluido"],
    ["conductor", "👨 Conductor incluido"],
    ["hospedaje", "🏨 Hospedaje incluido"],
    ["alimentacion", "🍽️ Alimentación incluida"],
    ["tanque_lleno", "⛽ Tanque lleno (devolver igual)"],
    ["tanque_cliente", "⛽ Combustible por cuenta del cliente"],
    ["dpi", "📋 Copia de DPI requerida"],
    ["lavado", "🚗 Vehículo debe devolverse limpio"],
  ];

  const guardar = async (estado) => {
    if (!f.cliente_nombre.trim()) { showToast("El nombre del cliente es requerido", "err"); return; }
    setSaving(true);
    try {
      const eid = empId || await getEmpId();
      if (!eid) { showToast("Error: empresa no encontrada. Recarga la página.", "err"); setSaving(false); return; }
      const payload = {
        empresa_id: eid,
        cliente_nombre: f.cliente_nombre.trim(),
        tipo: f.tipo,
        numero: (!initial?.id || isClone) ? "COT-" + newId() : initial.numero,
        dias,
        vehiculo_nombre: f.vehiculo_nombre || "",
        saludo: f.saludo || "",
        descripcion_servicio: f.descripcion_servicio || "",
        con_piloto: f.con_piloto,
        incl: f.incl,
        mostrarTC: f.mostrarTC,
        tasa_iva: parseInt(f.iva) || 5,
        metodo_pago: f.pago,
        tasa_cambio: parseFloat(f.exch) || 7.70,
        subtotal: sub,
        total_iva: ivaAmt,
        total_gtq: totalEf,
        total_usd: f.exch > 0 ? totalEf / f.exch : 0,
        cliente_nit: f.cliente_nit || "",
        cliente_dir: f.cliente_dir || "",
        km_ida: parseFloat(f.kmi) || 0,
        km_regreso: parseFloat(f.kmr) || 0,
        costo_vehiculo: parseFloat(f.veh_dia) || 0,
        costo_piloto: parseFloat(f.pil_dia) || 0,
        costo_hospedaje: parseFloat(f.hos_dia) || 0,
        costo_alimentacion: parseFloat(f.ali_dia) || 0,
        precio_galon: parseFloat(f.galon) || 0,
        km_por_galon: parseFloat(f.kpg) || 0,
        gastos_varios: parseFloat(f.varios) || 0,
        notas: f.notas || "",
        estado: estado === "orden_venta" ? "aprobada" : estado,
        orden_venta: estado === "orden_venta",
      };
      let result;
      if (initial?.id && !isClone) result = await dbUpd("cotizaciones", initial.id, payload);
      else result = await dbIns("cotizaciones", payload);
      if (result?.error) { showToast("Error: " + result.error, "err"); setSaving(false); return; }
      showToast("Cotización guardada ✔");
      setTimeout(() => onSave(estado), 800);
    } catch (e) { showToast("Error: " + e.message, "err"); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>
          {isClone ? "Clonar cotización" : initial?.id ? "Editar cotización" : "Nueva cotización"}
        </div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Columna izq */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>DATOS DEL CLIENTE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Fld label="CLIENTE" span2>
                <BuscadorCliente value={f.cliente_nombre} onChange={v => sf("cliente_nombre", v)} empId={empId} />
              </Fld>
              <Fld label="NIT (opcional)"><input style={S.inp} value={f.cliente_nit} onChange={e => sf("cliente_nit", e.target.value)} placeholder="CF o NIT" /></Fld>
              <Fld label="DIRECCIÓN (opcional)"><input style={S.inp} value={f.cliente_dir} onChange={e => sf("cliente_dir", e.target.value)} placeholder="Ciudad" /></Fld>
              <Fld label="SALUDO INICIAL" span2><input style={S.inp} value={f.saludo} onChange={e => sf("saludo", e.target.value)} placeholder="Estimados señores de..." /></Fld>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>TIPO DE SERVICIO</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => sf("tipo", "renta")} style={{ ...S.btn(f.tipo === "renta" ? "primary" : "ghost"), flex: 1 }}>🔑 Renta por días</button>
              <button onClick={() => sf("tipo", "traslado")} style={{ ...S.btn(f.tipo === "traslado" ? "primary" : "ghost"), flex: 1 }}>🗺 Traslado / Viaje</button>
            </div>
            {f.tipo === "renta" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Fld label="VEHÍCULO" span2>
                  <select style={S.sel} value={f.vehiculo_nombre} onChange={e => sf("vehiculo_nombre", e.target.value)}>
                    <option value="">Seleccionar vehículo...</option>
                    {CATALOGO.map(v => <option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
                  </select>
                </Fld>
                <Fld label="DÍAS"><input style={S.inp} type="number" min="1" value={f.dias} onChange={e => sf("dias", parseInt(e.target.value) || 1)} /></Fld>
                <Fld label="IVA">
                  <select style={S.sel} value={f.iva} onChange={e => sf("iva", parseInt(e.target.value))}>
                    <option value={12}>12% Régimen General</option>
                    <option value={5}>5% Pequeño Contribuyente</option>
                    <option value={0}>Sin IVA</option>
                  </select>
                </Fld>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Fld label="DESTINO (tabla de rutas)" span2>
                  <select style={S.sel} value={f.ruta} onChange={e => {
                    const r = RUTAS.find(x => x.d === e.target.value);
                    if (r) { sf("ruta", r.d); sf("kmi", r.km); sf("kmr", r.km); sf("dias", r.dias); }
                  }}>
                    <option value="">Seleccionar destino...</option>
                    {RUTAS.map(r => <option key={r.d} value={r.d}>{r.d} — {r.km} km · {r.dias}d</option>)}
                  </select>
                </Fld>
                <Fld label="DÍAS"><input style={S.inp} type="number" value={f.dias} onChange={e => sf("dias", e.target.value)} /></Fld>
                <Fld label="IVA"><select style={S.sel} value={f.iva} onChange={e => sf("iva", parseInt(e.target.value))}><option value={12}>12%</option><option value={5}>5%</option><option value={0}>Sin IVA</option></select></Fld>
                <Fld label="VEHÍCULO/DÍA (Q)"><input style={S.inp} type="number" value={f.veh_dia} onChange={e => sf("veh_dia", e.target.value)} placeholder="0" /></Fld>
                <Fld label="PILOTO/DÍA (Q)"><input style={S.inp} type="number" value={f.pil_dia} onChange={e => sf("pil_dia", e.target.value)} placeholder="0" /></Fld>
                <Fld label="HOSPEDAJE/DÍA (Q)"><input style={S.inp} type="number" value={f.hos_dia} onChange={e => sf("hos_dia", e.target.value)} placeholder="0" /></Fld>
                <Fld label="ALIMENTACIÓN/DÍA (Q)"><input style={S.inp} type="number" value={f.ali_dia} onChange={e => sf("ali_dia", e.target.value)} placeholder="0" /></Fld>
                <Fld label="PRECIO GALÓN (Q)"><input style={S.inp} type="number" value={f.galon} onChange={e => sf("galon", e.target.value)} placeholder="48" /></Fld>
                <Fld label="KM/GALÓN"><input style={S.inp} type="number" value={f.kpg} onChange={e => sf("kpg", e.target.value)} placeholder="27" /></Fld>
                <Fld label="KM IDA"><input style={S.inp} type="number" value={f.kmi} onChange={e => sf("kmi", e.target.value)} /></Fld>
                <Fld label="KM REGRESO"><input style={S.inp} type="number" value={f.kmr} onChange={e => sf("kmr", e.target.value)} /></Fld>
                <Fld label="GASTOS VARIOS (Q)" span2><input style={S.inp} type="number" value={f.varios} onChange={e => sf("varios", e.target.value)} placeholder="0" /></Fld>
              </div>
            )}
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 10 }}>SERVICIOS INCLUIDOS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {SERVICIOS_INCL.map(([k, l]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "5px 8px", borderRadius: 6, background: f.incl?.includes(k) ? T.accD : T.surf }}>
                  <input type="checkbox" checked={f.incl?.includes(k) || false}
                    onChange={e => { const arr = f.incl || []; sf("incl", e.target.checked ? [...arr, k] : arr.filter(x => x !== k)); }}
                    style={{ width: 14, height: 14 }} />
                  {l}
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* Columna der */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>RESUMEN Y TOTALES</div>
            <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              {[["Subtotal", \`Q \${fmt(sub)}\`], [\`IVA \${f.iva}%\`, \`Q \${fmt(ivaAmt)}\`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: T.sub }}><span>{l}</span><span>{v}</span></div>
              ))}
            </div>
            <div style={{ background: T.accD, border: \`1px solid \${T.acc}55\`, borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}><span>TOTAL EFECTIVO</span><span>Q {fmt(totalEf)}</span></div>
              {f.mostrarTC && <div style={{ fontSize: 12, color: T.sec, marginTop: 4 }}>Con tarjeta (+5%): Q {fmt(totalEf * 1.05)}</div>}
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>$ {fmt(f.exch > 0 ? totalEf / f.exch : 0)} USD</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Fld label="TASA DE CAMBIO (Q por $1)"><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e => sf("exch", e.target.value)} /></Fld>
              <Fld label="MÉTODO DE PAGO">
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => sf("pago", "efectivo")} style={{ ...S.btn(f.pago === "efectivo" ? "primary" : "ghost"), flex: 1 }}>💵 Efectivo</button>
                  <button onClick={() => sf("pago", "transferencia")} style={{ ...S.btn(f.pago === "transferencia" ? "primary" : "ghost"), flex: 1 }}>🏦 Transf.</button>
                </div>
              </Fld>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: f.mostrarTC ? T.secD : T.surf, border: \`1px solid \${f.mostrarTC ? T.sec : T.bord}\` }}>
                <input type="checkbox" checked={f.mostrarTC} onChange={e => sf("mostrarTC", e.target.checked)} style={{ width: 16, height: 16 }} />
                💳 Mostrar precio con tarjeta (+5%) en PDF
              </label>
              <Fld label="DESCRIPCIÓN DEL SERVICIO (para PDF)">
                <textarea style={{ ...S.inp, minHeight: 60, resize: "vertical" }} value={f.descripcion_servicio} onChange={e => sf("descripcion_servicio", e.target.value)} placeholder="Ej: Traslado en bus para 30 personas..." />
              </Fld>
              <Fld label="NOTAS INTERNAS">
                <input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Notas internas (no aparecen en PDF)" />
              </Fld>
            </div>
          </div>
          <div style={S.card}>
            <button onClick={() => guardar("borrador")} disabled={saving} style={{ ...S.btn("ghost"), width: "100%", marginBottom: 8, padding: 10 }}>
              {saving ? "Guardando..." : "💾 Guardar como borrador"}
            </button>
            <button onClick={() => guardar("enviada")} disabled={saving} style={{ ...S.btn("primary"), width: "100%", padding: 10, fontSize: 13 }}>
              {saving ? "Guardando..." : "✅ Guardar y marcar como Enviada"}
            </button>
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
// ── Page Cotizaciones ─────────────────────────────────────────────────────────
export default function PageCotizaciones({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [exportar, setExportar] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await dbGet("cotizaciones");
    setRows(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar esta cotización?")) return;
    await dbDel("cotizaciones", id);
    showToast("Eliminada");
    load();
  };
  const chEst = async (id, estado) => {
    await dbUpd("cotizaciones", id, { estado, orden_venta: estado === "orden_venta" });
    showToast("Estado actualizado");
    load();
  };

  const filtered = filtro === "todas" ? rows : rows.filter(r =>
    filtro === "orden_venta" ? r.orden_venta : r.estado === filtro
  );

  const ESTADOS = { borrador: { c: T.mut, bg: "#1E293B", l: "Borrador" }, enviada: { c: T.blue, bg: T.blueD, l: "Enviada" }, aprobada: { c: T.acc, bg: T.accD, l: "Aprobada" }, rechazada: { c: T.red, bg: T.redD, l: "Rechazada" }, orden_venta: { c: T.purple, bg: T.purpleD, l: "Orden de Venta" } };
  const CAMPOS_EXP = [{ label: "N°", key: "numero" }, { label: "Cliente", key: "cliente_nombre" }, { label: "Tipo", key: "tipo" }, { label: "Total Q", key: "total_gtq" }, { label: "Estado", key: "estado" }];

  if (vista === "form") return (
    <FormCotizacion initial={editItem} empId={empId}
      onSave={() => { setVista("lista"); setEditItem(null); load(); showToast("Cotización guardada ✔"); }}
      onCancel={() => { setVista("lista"); setEditItem(null); }} />
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Cotizaciones" datos={rows} campos={CAMPOS_EXP} onClose={() => setExportar(false)} />}
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[{ l: "Total", v: rows.length, c: T.acc }, { l: "Enviadas", v: rows.filter(r => r.estado === "enviada").length, c: T.blue }, { l: "Aprobadas", v: rows.filter(r => r.estado === "aprobada").length, c: T.green }, { l: "Órdenes", v: rows.filter(r => r.orden_venta).length, c: T.purple }]
          .map((s, i) => <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div></div>)}
      </div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["todas", "borrador", "enviada", "aprobada", "rechazada", "orden_venta"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ ...S.btn(filtro === f ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {f === "orden_venta" ? "📦 Órdenes" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>📤 Exportar</button>
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11 }}>↺</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12, marginLeft: "auto" }}>+ Nueva cotización</button>
      </div>
      {/* Lista */}
      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="📋" msg="Sin cotizaciones" action="+ Nueva cotización" onAction={() => setVista("form")} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => {
            const e = r.orden_venta ? ESTADOS.orden_venta : (ESTADOS[r.estado] || ESTADOS.borrador);
            const total = parseFloat(r.total_gtq) || 0;
            const makePDF = () => generarPDF({
              numero: r.numero, fecha: r.fecha_emision || today(), cliente: r.cliente_nombre,
              nit: r.cliente_nit, saludo: r.saludo, descripcion: r.descripcion_servicio,
              vehiculo: r.vehiculo_nombre, sub: parseFloat(r.subtotal) || 0,
              ivaPct: parseFloat(r.tasa_iva) || 5, ivaAmt: parseFloat(r.total_iva) || 0,
              totalEf: total, exch: parseFloat(r.tasa_cambio) || 7.70,
              mostrarTC: r.mostrarTC, esOrden: r.orden_venta,
            });
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.cliente_nombre}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{r.tipo === "renta" ? "🔑" : "🗺"} {r.dias}d {r.vehiculo_nombre ? "· " + r.vehiculo_nombre : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge c={e.c} bg={e.bg} l={e.l} small />
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.acc, marginTop: 4 }}>Q {fmt(total)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, paddingTop: 10, borderTop: \`1px solid \${T.bord}22\`, flexWrap: "wrap" }}>
                  <button onClick={() => { const doc = makePDF(); if (doc) doc.save(r.numero + ".pdf"); }} style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 10px" }}>⬇ PDF</button>
                  <button onClick={() => { const doc = makePDF(); if (doc) { const url = URL.createObjectURL(doc.output("blob")); const w = window.open(url); setTimeout(() => w?.print(), 1000); } }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 10px" }}>🖨️</button>
                  <BotonesCompartir numero={r.numero} total={total} tipo="Cotización" />
                  <button onClick={() => { setEditItem({ ...r, __clon: true }); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 10px" }}>📋 Clonar</button>
                  <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 10px" }}>✏️</button>
                  {!r.orden_venta && <button onClick={() => chEst(r.id, "orden_venta")} style={{ ...S.btn("purple"), fontSize: 11, padding: "4px 10px" }}>📦 OV</button>}
                  {r.estado === "enviada" && <button onClick={() => chEst(r.id, "aprobada")} style={{ ...S.btn("green"), fontSize: 11, padding: "4px 10px" }}>✅ Aprobar</button>}
                  <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", marginLeft: "auto" }}>🗑️</button>
                </div>
              </div>
            );
          })}
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
