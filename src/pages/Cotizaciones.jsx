import React, { useState, useEffect, useRef } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, newId, CATALOGO, tarifaVeh, RUTAS } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, ErrBoundary } from '../components/shared.jsx';

// --- Autocomplete local de clientes ---
function ClienteAutocomplete({ value, onChange, onSelect, clientes }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const handleChange = e => {
    const v = e.target.value; onChange(v);
    if (v.length > 0) { setFiltered(clientes.filter(c => c.nombre.toLowerCase().includes(v.toLowerCase()) || (c.codigo||"").toLowerCase().includes(v.toLowerCase())).slice(0, 7)); setOpen(true); }
    else setOpen(false);
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={S.inp} value={value} onChange={handleChange} placeholder="Escribe nombre o codigo del cliente..." autoComplete="off" />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surf, border: `1px solid ${T.acc}`, borderRadius: 8, zIndex: 200, maxHeight: 220, overflowY: "auto", marginTop: 2 }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.bord}22`, fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = T.accDim}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600 }}>{c.nombre}</div>
              <div style={{ fontSize: 10, color: T.sub }}>{c.codigo ? "Cod: " + c.codigo + " | " : ""}NIT: {c.nit || "—"} · {c.tipo || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Generador de PDF (HTML — se abre en nueva ventana para imprimir/guardar como PDF) ---
function generarPDF(d) {
  const servicios_incl = [];
  if (d.incl_piloto)       servicios_incl.push("Conductor / piloto profesional");
  if (d.incl_combustible)  servicios_incl.push("Combustible segun recorrido acordado");
  if (d.incl_peajes)       servicios_incl.push("Peajes y casetas de cobro");
  if (d.incl_hospedaje)    servicios_incl.push("Hospedaje del piloto");
  if (d.incl_alimentacion) servicios_incl.push("Alimentacion del piloto");
  if (d.incl_seguro)       servicios_incl.push("Seguro basico de viaje");
  if (!d.incl_piloto)      servicios_incl.push("Vehiculo entregado con tanque lleno (devolver lleno)");
  servicios_incl.push("Vehiculo higienizado antes del servicio");
  servicios_incl.push("Atencion personalizada");

  const costoRows = [];
  if (d.sub_veh > 0) costoRows.push([`Vehiculo — ${d.vehiculo || ""}`, `${d.dias} dia(s) x Q ${fmt(d.rate)}`, d.sub_veh]);
  if (d.incl_piloto && d.sub_piloto > 0) costoRows.push(["Piloto / conductor", `${d.dias} dia(s) x Q ${fmt(d.costo_piloto)}`, d.sub_piloto]);
  if (d.incl_hospedaje && d.sub_hospedaje > 0) costoRows.push(["Hospedaje piloto", `${d.dias} dia(s) x Q ${fmt(d.costo_hospedaje)}`, d.sub_hospedaje]);
  if (d.incl_alimentacion && d.sub_ali > 0) costoRows.push(["Alimentacion piloto", `${d.dias} dia(s) x Q ${fmt(d.costo_alimentacion)}`, d.sub_ali]);
  if (d.incl_combustible && d.sub_comb > 0) costoRows.push(["Combustible", `${fmt(d.gals)} galones x Q ${fmt(d.precio_galon)}`, d.sub_comb]);
  if (d.incl_peajes && d.sub_peajes > 0) costoRows.push(["Peajes", "Segun recorrido", d.sub_peajes]);
  if (d.extras > 0) costoRows.push(["Gastos extras / varios", "", d.extras]);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>${d.es_orden ? "Orden de Venta" : "Cotizacion"} ${d.numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1E293B;background:#fff}
.hdr{background:#1B2D5C;color:white;padding:18px 24px;display:flex;justify-content:space-between;align-items:flex-start}
.hdr h1{font-size:15px;color:#00D4AA;margin-bottom:3px}
.hdr p{font-size:8.5px;color:#94A3B8;margin-top:1px}
.hdr-r{text-align:right}
.hdr-r .tipo{font-size:18px;font-weight:700;color:#00D4AA}
.hdr-r .num{font-size:11px;color:white;margin-top:3px}
.hdr-r .fecha{font-size:8.5px;color:#94A3B8;margin-top:2px}
.bar{height:3px;background:linear-gradient(to right,#00D4AA,#1B2D5C)}
.body{padding:18px 24px}
.sec{margin-bottom:14px}
.sec-title{font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;margin-bottom:7px}
.client-name{font-size:13px;font-weight:700;color:#1B2D5C}
.client-sub{font-size:9.5px;color:#64748B;margin-top:2px}
.greeting{background:#F0FDF9;border-left:3px solid #00D4AA;padding:9px 13px;font-size:10px;color:#334155;font-style:italic;border-radius:0 6px 6px 0}
.svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.svc-item{display:flex;align-items:center;gap:6px;padding:3px 4px;font-size:9.5px}
.chk{width:13px;height:13px;background:#00D4AA;border-radius:2px;display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700;flex-shrink:0}
table{width:100%;border-collapse:collapse}
th{background:#1B2D5C;color:white;padding:5px 7px;text-align:left;font-size:9.5px}
td{padding:4px 7px;border-bottom:1px solid #F1F5F9;font-size:9.5px}
.amt{text-align:right;font-weight:600}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.totals{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:11px}
.t-row{display:flex;justify-content:space-between;padding:2px 0;font-size:10px;color:#64748B}
.t-main{display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#00D4AA;border-top:2px solid #00D4AA;margin-top:5px;padding-top:5px}
.t-card{display:flex;justify-content:space-between;font-size:10px;color:#F59E0B;font-weight:600;margin-top:3px}
.t-usd{text-align:right;font-size:8.5px;color:#94A3B8;margin-top:2px}
.bank{font-size:9.5px}
.bank b{color:#00D4AA;display:block;margin-bottom:1px;margin-top:8px}
.terms li{font-size:9px;color:#475569;padding:2px 0 2px 12px;position:relative}
.terms li::before{content:"•";position:absolute;left:0;color:#00D4AA}
.footer{margin-top:14px;border-top:2px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-end}
.fbar{background:#1B2D5C;color:#94A3B8;font-size:7.5px;text-align:center;padding:7px;margin-top:12px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}button{display:none!important}}
</style></head><body>
<div class="hdr">
  <div><h1>TZ'UNUN AUTORENTAS</h1><p>MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</p><p>2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala</p><p>502-31221538 &nbsp;|&nbsp; tzununautorentas@gmail.com &nbsp;|&nbsp; @TzununAutorentas</p></div>
  <div class="hdr-r"><div class="tipo">${d.es_orden ? "ORDEN DE VENTA" : "COTIZACION"}</div><div class="num"># ${d.numero}</div><div class="fecha">Emision: ${d.fecha}</div><div class="fecha">Valida hasta: ${d.fecha_vence || "15 dias"}</div></div>
</div>
<div class="bar"></div>
<div class="body">
  <div class="sec">
    <div class="sec-title">Facturar a</div>
    <div class="client-name">${d.cliente}</div>
    <div class="client-sub">${d.codigo ? "Codigo: " + d.codigo + " &nbsp;|&nbsp; " : ""}NIT: ${d.nit || "CF"}${d.dir ? " &nbsp;|&nbsp; " + d.dir : ""}</div>
  </div>
  ${d.saludo ? `<div class="sec"><div class="greeting">${d.saludo}:<br/>Le presentamos la siguiente cotizacion con mucho gusto, esperando sea de su entera conformidad.</div></div>` : ""}
  ${d.servicio ? `<div class="sec"><div class="sec-title">Descripcion del servicio</div><p style="font-size:9.5px;color:#475569;font-style:italic">${d.servicio}</p></div>` : ""}
  <div class="sec">
    <div class="sec-title">Servicios incluidos en esta cotizacion</div>
    <div class="svc-grid">${servicios_incl.map(s => `<div class="svc-item"><div class="chk">&#10003;</div><span>${s}</span></div>`).join("")}</div>
  </div>
  <div class="sec">
    <div class="sec-title">Desglose de costos</div>
    <table><thead><tr><th>Concepto</th><th>Detalle</th><th style="text-align:right">Total GTQ</th></tr></thead>
    <tbody>${costoRows.map(([c,det,tot]) => `<tr><td>${c}</td><td style="color:#64748B">${det}</td><td class="amt">Q ${fmt(tot)}</td></tr>`).join("")}</tbody></table>
  </div>
  <div class="two">
    <div>
      <div class="sec-title">Resumen financiero</div>
      <div class="totals">
        <div class="t-row"><span>Subtotal</span><span>Q ${fmt(d.sub)}</span></div>
        <div class="t-row"><span>IVA (${d.iva_pct}%)</span><span>Q ${fmt(d.iva_amt)}</span></div>
        <div class="t-main"><span>PRECIO BENEFICIO</span><span>Q ${fmt(d.total_ef)}</span></div>
        <div class="t-card"><span>Con tarjeta C/D (+5%)</span><span>Q ${fmt(d.total_tc)}</span></div>
        <div class="t-usd">Equivalente: $ ${fmt(d.total_ef / (d.exch || 7.70))} USD</div>
      </div>
      ${d.iva_pct === 5 ? '<p style="font-size:8px;color:#94A3B8;margin-top:3px">* No genera derecho a credito fiscal</p>' : ""}
    </div>
    <div>
      <div class="sec-title">Datos de pago</div>
      <div class="bank"><b>Banco Industrial</b>Cta. Monetaria No. 853-000016-8<br/>A nombre de: Transportes Tz'unun<b>Banrural</b>Cta. No. 3309159475</div>
      <div class="sec-title" style="margin-top:10px">Terminos y condiciones</div>
      <ul class="terms">
        <li>Higienizacion del vehiculo incluida.</li>
        <li>Se requiere copia de DPI del responsable.</li>
        <li>Anticipo del 75% para confirmar el servicio.</li>
        <li>${d.incl_piloto ? "Combustible incluido segun recorrido acordado." : "Vehiculo entregado con tanque lleno — devolver lleno."}</li>
        <li>Vehiculo debe devolverse limpio (recargo Q 75.00).</li>
        <li>Saldo se cancela al finalizar el servicio.</li>
      </ul>
    </div>
  </div>
  <div class="footer">
    <div style="font-size:9px;color:#64748B"><div style="border-top:1px solid #E2E8F0;padding-top:4px;margin-top:22px;width:150px">Oscar Galvez</div><div>Cel. 502 31221538 | @TzununAutorentas</div></div>
    <div style="font-size:10px;font-style:italic;color:#1B2D5C;font-weight:600;text-align:right">Muchas gracias por su preferencia.<br/>Quedamos a la espera de su aprobacion.</div>
  </div>
</div>
<div class="fbar">TZ'UNUN AUTORENTAS — 502-31221538 | tzununautorentas@gmail.com | @TzununAutorentas | Guatemala</div>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Permite ventanas emergentes para generar el PDF."); return; }
  w.document.write(html); w.document.close();
}

// Construye los datos de PDF desde un registro guardado
function makePDFData(r) {
  const dias = parseInt(r.dias) || 1;
  const rate = parseFloat(r.precio_personalizado) || parseFloat(r.costo_vehiculo) || 0;
  const sub_veh = dias * rate;
  const cp = parseFloat(r.costo_piloto) || 0;
  const ch = parseFloat(r.costo_hospedaje) || 0;
  const ca = parseFloat(r.costo_alimentacion) || 0;
  const sub_piloto = dias * cp;
  const sub_hospedaje = dias * ch;
  const sub_ali = dias * ca;
  const kmpg = parseFloat(r.km_por_galon) || 1;
  const gals = kmpg > 0 ? (parseFloat(r.km_total) || 0) / kmpg : 0;
  const sub_comb = gals * (parseFloat(r.precio_galon) || 0);
  const sub_peajes = parseFloat(r.peajes) || 0;
  const extras = parseFloat(r.extras) || 0;
  let svc = {};
  try { svc = JSON.parse(r.servicios_incluidos || "{}"); } catch {}
  return {
    numero: r.numero, fecha: r.fecha_emision || today(), fecha_vence: r.fecha_vence,
    es_orden: r.orden_venta, cliente: r.cliente_nombre, codigo: r.cliente_codigo,
    nit: r.cliente_nit, dir: r.cliente_dir, saludo: r.saludo, servicio: r.descripcion_servicio,
    vehiculo: r.vehiculo_nombre, dias, rate,
    sub_veh, sub_piloto, sub_hospedaje, sub_ali, sub_comb, sub_peajes, extras,
    costo_piloto: cp, costo_hospedaje: ch, costo_alimentacion: ca,
    gals, precio_galon: parseFloat(r.precio_galon) || 0,
    incl_piloto: svc.piloto || sub_piloto > 0,
    incl_combustible: svc.combustible || sub_comb > 0,
    incl_peajes: svc.peajes || sub_peajes > 0,
    incl_hospedaje: svc.hospedaje || sub_hospedaje > 0,
    incl_alimentacion: svc.alimentacion || sub_ali > 0,
    incl_seguro: svc.seguro !== false,
    sub: parseFloat(r.subtotal) || (sub_veh + sub_piloto + sub_hospedaje + sub_ali + sub_comb + sub_peajes + extras),
    iva_pct: parseFloat(r.tasa_iva) || 5,
    iva_amt: parseFloat(r.total_iva) || 0,
    total_ef: parseFloat(r.total_gtq) || 0,
    total_tc: (parseFloat(r.total_gtq) || 0) * 1.05,
    exch: parseFloat(r.tasa_cambio) || 7.70,
  };
}

// --- Estado inicial del formulario ---
const EMPTY_F = {
  cliente_nombre: "", cliente_nit: "", cliente_dir: "", cliente_codigo: "",
  saludo: "", descripcion_servicio: "",
  tipo: "renta", vehiculo_nombre: "",
  dias: 1, precio_custom: "",
  // Checklist de servicios
  incl_piloto: false, incl_combustible: false, incl_peajes: false,
  incl_hospedaje: false, incl_alimentacion: false, incl_seguro: true,
  // Costos por servicio
  costo_piloto: "", costo_hospedaje: "", costo_alimentacion: "",
  km_total: "", km_por_galon: 27, precio_galon: 48,
  peajes: "", extras: "",
  // Fiscal
  iva_pct: 5, pago: "efectivo", exch: 7.70,
  fecha_emision: today(), fecha_vence: "",
  estado: "borrador", notas: "",
};

// --- Formulario de Cotización ---
function FormCotizacion({ initial, empId, clientes, onSave, onCancel, showToast }) {
  const isClone = initial?.__clon;
  const [f, setF] = useState(() => {
    if (!initial) return { ...EMPTY_F };
    let svc = {};
    try { svc = JSON.parse(initial.servicios_incluidos || "{}"); } catch {}
    return {
      ...EMPTY_F,
      cliente_nombre: initial.cliente_nombre || "",
      cliente_nit: initial.cliente_nit || "",
      cliente_dir: initial.cliente_dir || "",
      cliente_codigo: initial.cliente_codigo || "",
      saludo: initial.saludo || "",
      descripcion_servicio: initial.descripcion_servicio || "",
      tipo: initial.tipo || "renta",
      vehiculo_nombre: initial.vehiculo_nombre || "",
      dias: initial.dias || 1,
      precio_custom: initial.precio_personalizado || "",
      incl_piloto: svc.piloto || (parseFloat(initial.costo_piloto) > 0),
      incl_combustible: svc.combustible || (parseFloat(initial.km_total) > 0),
      incl_peajes: svc.peajes || (parseFloat(initial.peajes) > 0),
      incl_hospedaje: svc.hospedaje || (parseFloat(initial.costo_hospedaje) > 0),
      incl_alimentacion: svc.alimentacion || (parseFloat(initial.costo_alimentacion) > 0),
      incl_seguro: svc.seguro !== false,
      costo_piloto: initial.costo_piloto || "",
      costo_hospedaje: initial.costo_hospedaje || "",
      costo_alimentacion: initial.costo_alimentacion || "",
      km_total: initial.km_total || "",
      km_por_galon: initial.km_por_galon || 27,
      precio_galon: initial.precio_galon || 48,
      peajes: initial.peajes || "",
      extras: initial.extras || "",
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

  // Cálculos
  const tarifaFn = (v, d) => { if (!v || d === 0) return 0; if (d >= 30) return v.mes; if (d >= 8) return v.sem; return v.dia; };
  const vehObj = CATALOGO.find(v => v.nombre === f.vehiculo_nombre) || null;
  const dias = parseInt(f.dias) || 1;
  const rate = parseFloat(f.precio_custom) > 0 ? parseFloat(f.precio_custom) : (vehObj ? tarifaFn(vehObj, dias) : 0);
  const sub_veh = dias * rate;
  const sub_piloto = f.incl_piloto ? dias * (parseFloat(f.costo_piloto) || 0) : 0;
  const sub_hospedaje = f.incl_hospedaje ? dias * (parseFloat(f.costo_hospedaje) || 0) : 0;
  const sub_ali = f.incl_alimentacion ? dias * (parseFloat(f.costo_alimentacion) || 0) : 0;
  const kmpg = parseFloat(f.km_por_galon) || 1;
  const gals = f.incl_combustible ? (parseFloat(f.km_total) || 0) / kmpg : 0;
  const sub_comb = gals * (parseFloat(f.precio_galon) || 0);
  const sub_peajes = f.incl_peajes ? (parseFloat(f.peajes) || 0) : 0;
  const sub_extras = parseFloat(f.extras) || 0;
  const sub = sub_veh + sub_piloto + sub_hospedaje + sub_ali + sub_comb + sub_peajes + sub_extras;
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
        cliente_nombre: f.cliente_nombre, cliente_nit: f.cliente_nit || "",
        cliente_dir: f.cliente_dir || "", cliente_codigo: f.cliente_codigo || "",
        tipo: f.tipo || "renta",
        numero: (!initial?.id || isClone) ? "COT-" + Date.now().toString().slice(-6) : initial.numero,
        dias, vehiculo_nombre: f.vehiculo_nombre || "",
        precio_personalizado: parseFloat(f.precio_custom) || 0,
        costo_vehiculo: rate,
        saludo: f.saludo || "", descripcion_servicio: f.descripcion_servicio || "",
        servicios_incluidos: JSON.stringify({
          piloto: f.incl_piloto, combustible: f.incl_combustible, peajes: f.incl_peajes,
          hospedaje: f.incl_hospedaje, alimentacion: f.incl_alimentacion, seguro: f.incl_seguro,
        }),
        costo_piloto: parseFloat(f.costo_piloto) || 0,
        costo_hospedaje: parseFloat(f.costo_hospedaje) || 0,
        costo_alimentacion: parseFloat(f.costo_alimentacion) || 0,
        km_total: parseFloat(f.km_total) || 0,
        km_por_galon: parseFloat(f.km_por_galon) || 0,
        precio_galon: parseFloat(f.precio_galon) || 0,
        peajes: sub_peajes, extras: sub_extras,
        tasa_iva: f.iva_pct, metodo_pago: f.pago || "efectivo",
        tasa_cambio: exch, subtotal: sub, total_iva: iva_amt,
        recargo_tarjeta: total_tc - total_ef,
        total_gtq: total_ef, total_usd: total_ef / exch,
        estado: estado === "orden_venta" ? "aprobada" : estado,
        orden_venta: estado === "orden_venta",
        fecha_emision: f.fecha_emision || today(), fecha_vence: f.fecha_vence || "",
        notas: f.notas || "",
      };
      let result;
      if (initial?.id && !isClone) result = await dbUpd("cotizaciones", initial.id, payload);
      else result = await dbIns("cotizaciones", payload);
      if (result?.error) { showToast("Error: " + result.error, "err"); setSaving(false); return; }
      showToast("Cotizacion guardada");
      setSaving(false); onSave(estado);
    } catch (e) { showToast("Error: " + e.message, "err"); setSaving(false); }
  };

  const SVC_LIST = [
    { k: "incl_piloto",      l: "Piloto / conductor" },
    { k: "incl_combustible", l: "Combustible" },
    { k: "incl_peajes",      l: "Peajes" },
    { k: "incl_hospedaje",   l: "Hospedaje piloto" },
    { k: "incl_alimentacion",l: "Alimentacion piloto" },
    { k: "incl_seguro",      l: "Seguro de viaje" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>
          {isClone ? "Clonar cotizacion" : initial?.id ? "Editar cotizacion" : "Nueva cotizacion"}
        
