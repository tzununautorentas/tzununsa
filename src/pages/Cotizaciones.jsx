import React, { useState, useEffect, useRef } from 'react';
import { T, S, fmt, fmtD, fmtK, dbGet, dbIns, dbUpd, dbDel, today, newId, CATALOGO, tarifaVeh, RUTAS, LOGO_B64 } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, ErrBoundary } from '../components/shared.jsx';

// --- Autocomplete local de clientes (usa lista pre-cargada) ---
function ClienteAutocomplete({ value, onChange, onSelect, clientes }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = e => {
    const v = e.target.value;
    onChange(v);
    if (v.length > 0) {
      setFiltered(clientes.filter(c => c.nombre.toLowerCase().includes(v.toLowerCase())).slice(0, 6));
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={S.inp} value={value} onChange={handleChange} placeholder="Escribe para buscar cliente..." autoComplete="off" />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surf, border: `1px solid ${T.acc}`, borderRadius: 8, zIndex: 100, maxHeight: 200, overflowY: "auto", marginTop: 2 }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${T.bord}22`, fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = T.accDim}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600, color: T.txt }}>{c.nombre}</div>
              <div style={{ fontSize: 11, color: T.sub }}>NIT: {c.nit || "—"} · {c.tipo}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Generador de PDF de cotización ---
function generarPDF(d) {
  if (!window.jspdf) { alert("PDF no disponible. Recarga la página e intenta de nuevo."); return null; }
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { alert("jsPDF no cargó. Intenta de nuevo."); return; }
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const HP = doc.internal.pageSize.getHeight();
  const NAVY = [27, 45, 92], TEAL = [0, 212, 170], TEAL2 = [29, 158, 117];
  const GRAY = [100, 116, 139], LGRAY = [241, 245, 249], WHITE = [255, 255, 255];
  const AMBER = [245, 158, 11], DKGRAY = [51, 65, 85];

  // Header
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 90, "F");
  doc.setFillColor(...TEAL); doc.rect(0, 0, W, 3, "F");
  try { doc.addImage("data:image/png;base64," + LOGO_B64, "PNG", 18, 8, 70, 70); } catch (e) { }
  doc.setTextColor(...WHITE); doc.setFontSize(17); doc.setFont("helvetica", "bold");
  doc.text("TZ'UNUN AUTORENTAS", 100, 34);
  doc.setTextColor(0, 212, 170); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS", 100, 48);
  doc.setTextColor(148, 163, 184); doc.setFontSize(7.5);
  doc.text("2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala", 100, 61);
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas", 100, 72);
  doc.setTextColor(0, 212, 170); doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text(d.es_orden ? "ORDEN DE VENTA" : "COTIZACION", W - 20, 33, { align: "right" });
  doc.setTextColor(...WHITE); doc.setFontSize(10);
  doc.text("# " + d.numero, W - 20, 48, { align: "right" });
  doc.setTextColor(148, 163, 184); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text("Emision:      " + d.fecha, W - 20, 61, { align: "right" });
  doc.text("Valida hasta: " + (d.fecha_vence || "15 dias"), W - 20, 72, { align: "right" });
  doc.setDrawColor(...TEAL); doc.setLineWidth(2); doc.line(0, 92, W, 92);

  let y = 110;
  // Cliente
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("FACTURAR A:", 22, y); y += 12;
  doc.setTextColor(30, 41, 59); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  const clientLines = doc.splitTextToSize(d.cliente || "", 180);
  doc.text(clientLines, 22, y); y += clientLines.length * 8;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  if (d.nit) doc.text("NIT: " + d.nit + (d.dir_cliente ? "   |   " + d.dir_cliente : ""), 22, y);
  y += 8;
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5); doc.line(22, y, W - 22, y); y += 12;

  // Saludo
  doc.setFillColor(232, 245, 240); doc.roundedRect(22, y, W - 44, 46, 4, 4, "F");
  doc.setFillColor(...TEAL2); doc.rect(22, y, 3, 46, "F");
  doc.setTextColor(27, 45, 92); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  const saludoText = (d.saludo || "Estimados señores de " + (d.cliente || "")) + ":";
  const saludoLines = doc.splitTextToSize(saludoText, W - 70);
  doc.text(saludoLines[0].slice(0, 80), 32, y + 13);
  doc.setTextColor(...DKGRAY); doc.setFontSize(7.8); doc.setFont("helvetica", "normal");
  const intro = "En Transportes Tz'unun nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas en renta de vehiculos y traslado de personas en Guatemala.";
  const introL = doc.splitTextToSize(intro, W - 88);
  introL.slice(0, 3).forEach((ln, i) => doc.text(ln, 32, y + 25 + (i * 9)));
  y += 58;

  // Descripcion
  if (d.servicio) {
    doc.setFillColor(...TEAL2); doc.rect(22, y, 3, 12, "F");
    doc.setTextColor(27, 45, 92); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.text("DESCRIPCION DEL SERVICIO", 30, y + 8); y += 16;
    doc.setTextColor(...DKGRAY); doc.setFontSize(8); doc.setFont("helvetica", "italic");
    const sl = doc.splitTextToSize(d.servicio, W - 44);
    sl.slice(0, 3).forEach((ln, i) => doc.text(ln, 22, y + (i * 10)));
    y += sl.slice(0, 3).length * 10 + 8;
  }

  // 3 columnas
  const colW = (W - 44) / 3;
  const cols = [
    { title: "VEHICULO Y CARACTERISTICAS", items: d.caract, color: [0, 200, 150] },
    { title: "SERVICIOS INCLUIDOS", items: d.incluidos, color: [27, 45, 92] },
    { title: "BENEFICIOS", items: d.beneficios, color: [245, 158, 11] },
  ];
  const maxR = Math.max(...cols.map(c => c.items.length));
  const boxH = 14 + maxR * 9.5 + 8;
  cols.forEach((col, ci) => {
    const cx = 22 + ci * colW;
    doc.setFillColor(ci % 2 === 0 ? 241 : 232, ci % 2 === 0 ? 245 : 238, ci % 2 === 0 ? 249 : 244);
    doc.roundedRect(cx, y, colW - 2, boxH, 3, 3, "F");
    doc.setFillColor(...col.color); doc.rect(cx, y, 3, boxH, "F");
    doc.setTextColor(...col.color); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(col.title, cx + 8, y + 10);
    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.3); doc.line(cx + 6, y + 13, cx + colW - 8, y + 13);
    doc.setTextColor(...DKGRAY); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    col.items.forEach((item, j) => doc.text("- " + item, cx + 9, y + 22 + (j * 9.5)));
  });
  y += boxH + 10;

  // Nota combustible
  if (!d.con_piloto) {
    doc.setFillColor(255, 248, 231); doc.roundedRect(22, y, W - 44, 13, 3, 3, "F");
    doc.setFillColor(...AMBER); doc.rect(22, y, 3, 13, "F");
    doc.setTextColor(146, 64, 14); doc.setFontSize(7.2); doc.setFont("helvetica", "bold");
    doc.text("SIN PILOTO: Vehiculo entregado con tanque lleno — debe devolverse con tanque lleno.", 32, y + 8);
    y += 18;
  }

  // Tabla financiera
  doc.setFillColor(...TEAL2); doc.rect(22, y, 3, 12, "F");
  doc.setTextColor(27, 45, 92); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
  doc.text("RESUMEN FINANCIERO", 30, y + 8); y += 14;
  const finRows = [
    ["Subtotal (precio base)", fmt(d.sub), fmt(d.sub / d.exch), false, false],
    ["Impuesto " + d.iva_pct + "%", fmt(d.iva_amt), fmt(d.iva_amt / d.exch), false, false],
    ["PRECIO BENEFICIO — Efectivo / Deposito / Transferencia", fmt(d.total_ef), fmt(d.total_ef / d.exch), true, false],
    ["Con Tarjeta de Credito / Debito", fmt(d.total_tc), fmt(d.total_tc / d.exch), false, true],
  ];
  doc.setFillColor(...NAVY); doc.rect(22, y, W - 44, 16, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Concepto", 28, y + 10);
  doc.text("GTQ", 22 + 310 + 100 - 6, y + 10, { align: "right" });
  doc.text("USD", 22 + 310 + 100 + 90 - 6, y + 10, { align: "right" }); y += 16;
  finRows.forEach((row, ri) => {
    const [concepto, gtq, usd, isBenef, isTC] = row;
    if (isBenef) doc.setFillColor(232, 245, 240);
    else if (isTC) doc.setFillColor(255, 253, 235);
    else doc.setFillColor(ri % 2 === 0 ? 255 : 241, ri % 2 === 0 ? 255 : 245, ri % 2 === 0 ? 255 : 249);
    doc.rect(22, y, W - 44, 16, "F");
    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.3); doc.rect(22, y, W - 44, 16, "S");
    doc.setTextColor(isBenef ? TEAL2[0] : isTC ? AMBER[0] : DKGRAY[0], isBenef ? TEAL2[1] : isTC ? AMBER[1] : DKGRAY[1], isBenef ? TEAL2[2] : isTC ? AMBER[2] : DKGRAY[2]);
    doc.setFontSize(isBenef || isTC ? 8.5 : 8); doc.setFont("helvetica", isBenef ? "bold" : "normal");
    doc.text(concepto, 28, y + 10);
    doc.setFont("helvetica", "bold"); doc.text(gtq, 22 + 310 + 100 - 6, y + 10, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
    doc.text("$ " + usd, 22 + 310 + 100 + 90 - 6, y + 10, { align: "right" }); y += 16;
  });
  y += 10;

  // Terminos y cuentas
  const termH = 66;
  doc.setFillColor(241, 245, 249); doc.roundedRect(22, y, W - 44, termH, 4, 4, "F");
  doc.setFillColor(...TEAL2); doc.rect(22, y, 3, termH, "F");
  doc.setTextColor(27, 45, 92); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text("TERMINOS Y CONDICIONES", 30, y + 10);
  const terms = [
    "- Nuestros vehiculos son higienizados antes y despues de cada servicio.",
    "- Se requiere copia de DPI del responsable del grupo.",
    "- Anticipo del 75% para confirmar el servicio.",
    d.con_piloto ? "- Combustible incluido segun el recorrido acordado." : "- Vehiculo entregado con tanque lleno — devolver lleno.",
    "- El vehiculo debe devolverse limpio (recargo Q.75.00 si no cumple).",
    "- El saldo restante se cancela al finalizar el servicio.",
  ];
  doc.setFontSize(7.2); doc.setFont("helvetica", "normal"); doc.setTextColor(...DKGRAY);
  terms.forEach((t, i) => doc.text(t, 30, y + 20 + (i * 7.5)));
  doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.4); doc.line(372, y + 8, 372, y + termH - 8);
  doc.setTextColor(27, 45, 92); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text("DATOS DE PAGO", 380, y + 10);
  doc.setTextColor(0, 200, 150); doc.text("Banco Industrial", 380, y + 22);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
  doc.text("Cta. Monetaria No. 853-000016-8", 380, y + 31);
  doc.text("A nombre de: Transportes Tz'unun", 380, y + 39);
  doc.setDrawColor(203, 213, 225); doc.line(380, y + 43, W - 26, y + 43);
  doc.setTextColor(0, 200, 150); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  doc.text("Banrural", 380, y + 52);
  doc.setTextColor(...DKGRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
  doc.text("Cta. No. 3309159475", 380, y + 61);
  y += termH + 10;

  // Firma
  doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.6); doc.line(22, y, 180, y);
  doc.setTextColor(27, 45, 92); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Oscar Galvez", 22, y + 11);
  doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.text("Cel. 502 31221538   |   @TzununAutorentas", 22, y + 21);
  doc.setTextColor(0, 200, 150); doc.setFontSize(8.5); doc.setFont("helvetica", "bolditalic");
  doc.text("Muchas gracias por su preferencia, esperamos poder servirle.", W / 2, y + 11, { align: "center" });

  // Pie de pagina
  doc.setFillColor(...NAVY); doc.rect(0, HP - 36, W, 36, "F");
  doc.setFillColor(...TEAL); doc.rect(0, HP - 36, W, 2, "F");
  doc.setTextColor(148, 163, 184); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
  doc.text("TZ'UNUN AUTORENTAS  —  Mas comodidad, rapidez y mejores precios", W / 2, HP - 21, { align: "center" });
  doc.text("502-31221538   |   tzununautorentas@gmail.com   |   @TzununAutorentas   |   Guatemala", W / 2, HP - 11, { align: "center" });

  return doc;
}

// --- Modal Vista Previa ---
function ModalVistaPrevia({ cot, onClose }) {
  if (!cot) return null;
  const sub = parseFloat(cot.subtotal) || 0;
  const iva_pct = parseFloat(cot.tasa_iva) || 5;
  const iva_amt = sub * iva_pct / 100;
  const total_ef = sub + iva_amt;
  const total_tc = total_ef * 1.05;
  const exch = parseFloat(cot.tasa_cambio) || 7.70;

  const makePDFData = () => ({
    numero: cot.numero, fecha: cot.fecha_emision || today(), fecha_vence: cot.fecha_vence,
    cliente: cot.cliente_nombre, nit: cot.cliente_nit, dir_cliente: cot.cliente_dir,
    saludo: cot.saludo, servicio: cot.descripcion_servicio,
    caract: cot.caract || ["Vehiculo seleccionado", "Aire acondicionado", "Cinturones", "Seguro total"],
    incluidos: cot.incluidos || ["Combustible lleno", "Conductor profesional", "Atencion especializada"],
    beneficios: cot.beneficios || ["Viaje seguro y comodo", "Puntualidad", "Flexibilidad"],
    con_piloto: cot.con_piloto !== false, sub, iva_pct, iva_amt, total_ef, total_tc, exch,
    es_orden: cot.orden_venta,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.bord}`, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bord}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>Vista previa — {cot.numero}</div>
          <button onClick={onClose} style={{ ...S.btn("ghost"), padding: "4px 10px" }}>X</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: "#1B2D5C", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.acc }}>TZ'UNUN AUTORENTAS</div>
            <div style={{ fontSize: 10, color: T.sub }}>502-31221538 · tzununautorentas@gmail.com</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.acc, marginTop: 8 }}>{cot.orden_venta ? "ORDEN DE VENTA" : "COTIZACION"} #{cot.numero}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: T.mut, fontWeight: 700, marginBottom: 4 }}>FACTURAR A:</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cot.cliente_nombre}</div>
            <div style={{ fontSize: 12, color: T.sub }}>NIT: {cot.cliente_nit || "—"}</div>
          </div>
          {cot.saludo && <div style={{ background: `${T.acc}11`, border: `1px solid ${T.acc}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: T.sub, fontStyle: "italic" }}>"{cot.saludo}"</div>}
          <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 12 }}>
            {[["Subtotal", fmt(sub)], [`IVA (${iva_pct}%)`, fmt(iva_amt)]].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: T.sub }}><span>{l}</span><span>Q {v}</span></div>
            ))}
            <div style={{ borderTop: `1px solid ${T.bord}`, margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: T.acc }}><span>PRECIO BENEFICIO</span><span>Q {fmt(total_ef)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginTop: 3 }}><span>USD</span><span>$ {fmt(total_ef / exch)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sec, marginTop: 6 }}><span>Con Tarjeta C/D</span><span>Q {fmt(total_tc)}</span></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { const doc = generarPDF(makePDFData()); if (doc) doc.save(`${cot.numero}.pdf`); }} style={{ ...S.btn("primary"), fontSize: 12 }}>Descargar PDF</button>
            <button onClick={() => { const doc = generarPDF(makePDFData()); if (doc) { const blob = doc.output("blob"); window.open(URL.createObjectURL(blob), "_blank"); } }} style={{ ...S.btn("blue"), fontSize: 12 }}>Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Constantes del formulario ---
const EMPTY_F = {
  cliente_nombre: "", cliente_nit: "", cliente_dir: "",
  saludo: "", descripcion_servicio: "",
  tipo: "renta", vehiculo_nombre: "", con_piloto: true,
  dias: 1, precio_custom: "",
  iva_pct: 5, pago: "efectivo", exch: 7.70,
  fecha_emision: today(), fecha_vence: "",
  estado: "borrador", notas: "",
};

// --- Formulario de Cotización ---
function FormCotizacion({ initial, empId, clientes, onSave, onCancel, showToast }) {
  const isClone = initial?.__clon;
  const [f, setF] = useState(() => {
    if (!initial) return { ...EMPTY_F };
    return {
      ...EMPTY_F,
      cliente_nombre: initial.cliente_nombre || "",
      cliente_nit: initial.cliente_nit || "",
      cliente_dir: initial.cliente_dir || "",
      saludo: initial.saludo || "",
      descripcion_servicio: initial.descripcion_servicio || "",
      tipo: initial.tipo || "renta",
      vehiculo_nombre: initial.vehiculo_nombre || "",
      con_piloto: initial.con_piloto !== false,
      dias: initial.dias || 1,
      precio_custom: initial.precio_personalizado || "",
      iva_pct: initial.tasa_iva || 5,
      pago: initial.metodo_pago || "efectivo",
      exch: initial.tasa_cambio || 7.70,
      fecha_emision: today(),
      fecha_vence: initial.fecha_vence || "",
      estado: "borrador",
      notas: initial.notas || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Calculos
  const tarifaFn = (v, d) => { if (!v || d === 0) return 0; if (d >= 30) return v.mes; if (d >= 8) return v.sem; return v.dia; };
  const vehObj = CATALOGO.find(v => v.nombre === f.vehiculo_nombre) || null;
  const rate = parseFloat(f.precio_custom) > 0 ? parseFloat(f.precio_custom) : (vehObj ? tarifaFn(vehObj, f.dias) : 0);
  const sub = (parseInt(f.dias) || 1) * rate;
  const iva_amt = sub * f.iva_pct / 100;
  const total_ef = sub + iva_amt;
  const total_tc = total_ef * 1.05;
  const exch = parseFloat(f.exch) || 7.70;

  const guardar = async (estado) => {
    if (!f.cliente_nombre.trim()) { showToast("Ingresa el nombre del cliente", "err"); return; }
    setSaving(true);
    try {
      const eId = empId || (await dbGet("empresas", "&select=id&limit=1").then(d => d?.[0]?.id || null));
      const payload = {
        empresa_id: eId,
        cliente_nombre: f.cliente_nombre,
        cliente_nit: f.cliente_nit || "",
        cliente_dir: f.cliente_dir || "",
        tipo: f.tipo || "renta",
        numero: (!initial?.id || isClone) ? "COT-" + Date.now().toString().slice(-6) : initial.numero,
        dias: parseInt(f.dias) || 1,
        vehiculo_nombre: f.vehiculo_nombre || "",
        precio_personalizado: parseFloat(f.precio_custom) || 0,
        saludo: f.saludo || "",
        descripcion_servicio: f.descripcion_servicio || "",
        con_piloto: f.con_piloto !== false,
        tasa_iva: f.iva_pct,
        metodo_pago: f.pago || "efectivo",
        tasa_cambio: exch,
        subtotal: sub,
        total_iva: iva_amt,
        recargo_tarjeta: total_tc - total_ef,
        total_gtq: total_ef,
        total_usd: total_ef / exch,
        estado: estado === "orden_venta" ? "aprobada" : estado,
        orden_venta: estado === "orden_venta",
        fecha_emision: f.fecha_emision || today(),
        fecha_vence: f.fecha_vence || "",
        notas: f.notas || "",
      };
      let result;
      if (initial?.id && !isClone) result = await dbUpd("cotizaciones", initial.id, payload);
      else result = await dbIns("cotizaciones", payload);
      if (result && result.error) { showToast("Error: " + result.error, "err"); setSaving(false); return; }
      showToast("Cotizacion guardada");
      setSaving(false);
      onSave(estado);
    } catch (e) { showToast("Error: " + e.message, "err"); setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>
          {isClone ? "Clonar cotizacion" : initial?.id ? "Editar cotizacion" : "Nueva cotizacion"}
        </div>
        <button onClick={onCancel} style={S.btn("ghost")}>Volver</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* FORM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Cliente */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>DATOS DEL CLIENTE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>CLIENTE</label>
                <ClienteAutocomplete
                  value={f.cliente_nombre}
                  onChange={v => sf("cliente_nombre", v)}
                  onSelect={c => { sf("cliente_nombre", c.nombre); sf("cliente_nit", c.nit || ""); sf("cliente_dir", c.direccion || ""); sf("saludo", "Estimados señores de " + c.nombre); }}
                  clientes={clientes}
                />
              </div>
              <div><label style={S.lbl}>NIT</label><input style={S.inp} value={f.cliente_nit} onChange={e => sf("cliente_nit", e.target.value)} placeholder="CF o NIT" /></div>
              <div><label style={S.lbl}>DIRECCION</label><input style={S.inp} value={f.cliente_dir} onChange={e => sf("cliente_dir", e.target.value)} placeholder="Ciudad, zona..." /></div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>SALUDO PERSONALIZADO</label>
                <input style={S.inp} value={f.saludo} onChange={e => sf("saludo", e.target.value)} placeholder="Ej: Estimados señores de Fundacion..." />
              </div>
            </div>
          </div>
          {/* Servicio */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>SERVICIO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>VEHICULO</label>
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e => sf("vehiculo_nombre", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CATALOGO.map(v => <option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>DIAS</label><input style={S.inp} type="number" min="1" value={f.dias} onChange={e => sf("dias", parseInt(e.target.value) || 1)} /></div>
              <div><label style={S.lbl}>PRECIO PERSONALIZADO (opcional)</label><input style={S.inp} type="number" value={f.precio_custom} onChange={e => sf("precio_custom", e.target.value)} placeholder="Vacio = catalogo" /></div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>MODALIDAD</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => sf("con_piloto", true)} style={{ ...S.btn(f.con_piloto ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>Con piloto</button>
                  <button onClick={() => sf("con_piloto", false)} style={{ ...S.btn(!f.con_piloto ? "warn" : "ghost"), flex: 1, fontSize: 11 }}>Sin piloto</button>
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>DESCRIPCION DEL SERVICIO</label>
                <textarea style={{ ...S.inp, minHeight: 64, resize: "vertical" }} value={f.descripcion_servicio} onChange={e => sf("descripcion_servicio", e.target.value)} placeholder="Ej: Traslado de Guatemala hacia Quetzaltenango, ida y vuelta..." />
              </div>
            </div>
          </div>
          {/* Fiscal */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>FISCAL Y FECHAS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>IVA</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: 12, l: "12% General" }, { v: 5, l: "5% Pequeño Cont." }, { v: 0, l: "Sin IVA" }].map(o => (
                    <button key={o.v} onClick={() => sf("iva_pct", o.v)} style={{ ...S.btn(f.iva_pct === o.v ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div><label style={S.lbl}>TASA CAMBIO (Q por $1)</label><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e => sf("exch", e.target.value)} /></div>
              <div><label style={S.lbl}>VALIDA HASTA</label><input style={S.inp} value={f.fecha_vence} onChange={e => sf("fecha_vence", e.target.value)} placeholder="Ej: 28 de mayo de 2026" /></div>
              <div>
                <label style={S.lbl}>ESTADO</label>
                <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div><label style={S.lbl}>NOTAS</label><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." /></div>
            </div>
          </div>
        </div>

        {/* RESUMEN */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Resumen</div>
          {f.cliente_nombre && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.cliente_nombre}</div>}
          {f.saludo && <div style={{ fontSize: 12, color: T.sub, fontStyle: "italic", marginBottom: 8 }}>{f.saludo}</div>}
          {vehObj && <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{vehObj.nombre} · {f.dias} dia{f.dias !== 1 ? "s" : ""}</div>}
          {sub > 0 ? (
            <>
              {vehObj && (
                <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[["1-7d", vehObj.dia], ["8-29d", vehObj.sem], ["30+d", vehObj.mes]].map(([r, p], i) => (
                      <div key={i} style={{ textAlign: "center", opacity: (i === 0 && f.dias <= 7) || (i === 1 && f.dias >= 8 && f.dias <= 29) || (i === 2 && f.dias >= 30) ? 1 : 0.4 }}>
                        <div style={{ fontSize: 9, color: T.sub }}>{r}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>Q{fmt(p)}/d</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={S.srow(false)}><span>{f.dias}d x Q{fmt(rate)}</span><span>Q {fmt(sub)}</span></div>
                <div style={S.srow(false)}><span>IVA {f.iva_pct}%</span><span>Q {fmt(iva_amt)}</span></div>
              </div>
              <div style={{ background: T.accDim, border: `1px solid ${T.acc}55`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.acc, marginBottom: 3 }}>PRECIO BENEFICIO — Efectivo/Deposito/Transf.</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}>
                  <span>Q {fmt(total_ef)}</span>
                  <span style={{ fontSize: 12, color: T.sub, alignSelf: "flex-end" }}>$ {fmt(total_ef / exch)}</span>
                </div>
              </div>
              <div style={{ background: T.secDim, border: `1px solid ${T.sec}44`, borderRadius: 9, padding: "9px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sec }}>Con Tarjeta C/D</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.sec }}>Q {fmt(total_tc)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => guardar("borrador")} disabled={saving} style={{ ...S.btn("ghost"), width: "100%" }}>{saving ? "..." : "Guardar borrador"}</button>
                <button onClick={() => guardar(f.estado === "borrador" ? "enviada" : f.estado)} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>{saving ? "..." : "Guardar cotizacion"}</button>
                <button onClick={() => guardar("orden_venta")} disabled={saving} style={{ ...S.btn("purple"), width: "100%" }}>{saving ? "..." : "Convertir a Orden de Venta"}</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 24, color: T.sub, fontSize: 13 }}>Selecciona vehiculo y dias para ver el resumen</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Pagina principal de Cotizaciones ---
export default function PageCotizaciones({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [preview, setPreview] = useState(null);
  const [exportar, setExportar] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await dbGet("cotizaciones");
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };

  useEffect(() => {
    dbGet("clientes", "").then(d => setClientes(Array.isArray(d) ? d : []));
    load();
  }, []);

  const del = async id => {
    if (!confirm("Eliminar esta cotizacion?")) return;
    await dbDel("cotizaciones", id);
    showToast("Eliminada");
    load();
  };

  const chEst = async (id, estado) => {
    await dbUpd("cotizaciones", id, { estado, orden_venta: estado === "orden_venta" });
    showToast("Estado actualizado: " + estado);
    load();
  };

  // CONVERSION: Cotizacion aprobada → Reserva
  const convertirAReserva = async (cot) => {
    if (!confirm(`Convertir cotizacion ${cot.numero} en Reserva confirmada?`)) return;
    const eId = empId || (await dbGet("empresas", "&select=id&limit=1").then(d => d?.[0]?.id || null));
    const numero = "RES-" + Date.now().toString().slice(-6);
    const reservaPayload = {
      empresa_id: eId,
      cliente_nombre: cot.cliente_nombre,
      tipo: cot.tipo || "renta",
      numero,
      vehiculo_nombre: cot.vehiculo_nombre || "",
      conductor_nombre: "",
      monto: parseFloat(cot.total_gtq) || 0,
      anticipo: 0,
      saldo: parseFloat(cot.total_gtq) || 0,
      tasa_iva: parseFloat(cot.tasa_iva) || 5,
      metodo_pago: cot.metodo_pago || "efectivo",
      tasa_cambio: parseFloat(cot.tasa_cambio) || 7.70,
      estado: "confirmada",
      cotizacion_id: cot.id,
      notas: "Generada desde cotizacion " + cot.numero,
    };
    const reserva = await dbIns("reservas", reservaPayload);
    if (reserva && !reserva.error) {
      await dbUpd("cotizaciones", cot.id, { reserva_id: reserva.id, estado: "aprobada" });
      showToast("Reserva " + numero + " creada y vinculada a la cotizacion");
      load();
    } else {
      showToast("Error al crear reserva: " + (reserva?.error || ""), "err");
    }
  };

  const filtered = filtro === "todas" ? rows : rows.filter(r => r.estado === filtro || (filtro === "orden_venta" && r.orden_venta));

  const EC = {
    borrador: { c: T.mut, bg: "#1E293B", l: "Borrador" },
    enviada: { c: T.blue, bg: T.blueDim, l: "Enviada" },
    aprobada: { c: T.acc, bg: T.accDim, l: "Aprobada" },
    rechazada: { c: T.red, bg: T.redDim, l: "Rechazada" },
    orden_venta: { c: T.purple, bg: T.purpleDim, l: "Orden de Venta" },
  };

  if (vista === "form") return (
    <div>
      <FormCotizacion
        initial={editItem}
        empId={empId}
        clientes={clientes}
        showToast={showToast}
        onSave={() => { showToast("Guardada"); setEditItem(null); setVista("lista"); load(); }}
        onCancel={() => { setEditItem(null); setVista("lista"); }}
      />
    </div>
  );

  return (
    <div>
      {preview && <ModalVistaPrevia cot={preview} onClose={() => setPreview(null)} />}
      {exportar && (
        <ModalExportar titulo="Cotizaciones" datos={rows}
          campos={[{ label: "Numero", key: "numero" }, { label: "Cliente", key: "cliente_nombre" }, { label: "Vehiculo", key: "vehiculo_nombre" }, { label: "Total GTQ", key: "total_gtq" }, { label: "Estado", key: "estado" }, { label: "Fecha", key: "fecha_emision" }]}
          onClose={() => setExportar(false)} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total", v: rows.length, c: T.acc },
          { l: "Enviadas", v: rows.filter(r => r.estado === "enviada").length, c: T.blue },
          { l: "Aprobadas", v: rows.filter(r => r.estado === "aprobada").length, c: T.acc },
          { l: "Ordenes", v: rows.filter(r => r.orden_venta).length, c: T.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros y acciones */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["todas", "borrador", "enviada", "aprobada", "rechazada", "orden_venta"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ ...S.btn(filtro === f ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {f === "orden_venta" ? "Ordenes" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11, marginLeft: "auto" }}>Actualizar</button>
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12 }}>+ Nueva</button>
      </div>

      {/* Lista */}
      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="📋" msg="Sin cotizaciones" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => {
            const e = r.orden_venta ? EC.orden_venta : (EC[r.estado] || EC.borrador);
            const total = parseFloat(r.total_gtq) || 0;
            const makePDF = () => generarPDF({
              numero: r.numero, fecha: r.fecha_emision || today(), fecha_vence: r.fecha_vence,
              cliente: r.cliente_nombre, nit: r.cliente_nit, dir_cliente: r.cliente_dir,
              saludo: r.saludo, servicio: r.descripcion_servicio,
              caract: r.caract || ["Vehiculo", "Aire acond.", "Cinturones", "Seguro"],
              incluidos: r.incluidos || ["Combustible", "Conductor", "Atencion"],
              beneficios: r.beneficios || ["Viaje seguro", "Puntualidad", "Flexibilidad"],
              con_piloto: r.con_piloto !== false,
              sub: parseFloat(r.subtotal) || 0, iva_pct: parseFloat(r.tasa_iva) || 5,
              iva_amt: parseFloat(r.total_iva) || 0, total_ef: total,
              total_tc: total * 1.05, exch: parseFloat(r.tasa_cambio) || 7.70, es_orden: r.orden_venta,
            });
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.cliente_nombre}</div>
                    {r.saludo && <div style={{ fontSize: 11, color: T.sub, fontStyle: "italic" }}>"{r.saludo}"</div>}
                    <div style={{ fontSize: 12, color: T.sub }}>{r.dias}d{r.vehiculo_nombre ? " · " + r.vehiculo_nombre : ""}</div>
                    {r.reserva_id && (
                      <div style={{ fontSize: 11, color: T.acc, marginTop: 4, fontWeight: 600 }}>
                        Reserva vinculada
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={e.c} bg={e.bg} label={e.l} small />
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.acc, marginTop: 4 }}>Q {fmt(total)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, paddingTop: 10, borderTop: `1px solid ${T.bord}22`, flexWrap: "wrap" }}>
                  <button onClick={() => setPreview(r)} style={{ ...S.btn("blue"), fontSize: 11, padding: "4px 9px" }}>Ver</button>
                  <button onClick={() => { const doc = makePDF(); if (doc) doc.save(r.numero + ".pdf"); }} style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 9px" }}>PDF</button>
                  <button onClick={() => { const doc = makePDF(); if (doc) { const url = URL.createObjectURL(doc.output("blob")); const w = window.open(url); setTimeout(() => w && w.print(), 1000); } }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Imprimir</button>
                  <button onClick={() => { setEditItem({ ...r, __clon: true }); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Clonar</button>
                  <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Editar</button>
                  {/* Aprobar si esta enviada */}
                  {r.estado === "enviada" && (
                    <button onClick={() => chEst(r.id, "aprobada")} style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 9px" }}>Aprobar</button>
                  )}
                  {/* Convertir a Reserva si esta aprobada y no tiene reserva aun */}
                  {(r.estado === "aprobada" || r.orden_venta) && !r.reserva_id && (
                    <button onClick={() => convertirAReserva(r)} style={{ ...S.btn("green"), fontSize: 11, padding: "4px 9px" }}>
                      Crear Reserva
                    </button>
                  )}
                  {!r.orden_venta && (
                    <button onClick={() => chEst(r.id, "orden_venta")} style={{ ...S.btn("purple"), fontSize: 11, padding: "4px 9px" }}>Orden Venta</button>
                  )}
                  <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 9px", marginLeft: "auto" }}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
