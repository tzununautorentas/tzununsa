// src/pages/Cotizaciones.jsx
import React, { useState, useEffect, useRef } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, CATALOGO, siguienteNumero } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

// ─── Autocomplete local ───────────────────────────────────────────────────────
function ClienteAC({ value, onChange, onSelect, clientes }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const fil = value.length > 0
    ? clientes.filter(c => c.nombre.toLowerCase().includes(value.toLowerCase()) || (c.codigo || "").toLowerCase().includes(value.toLowerCase())).slice(0, 7)
    : [];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={S.inp} value={value} onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder="Escribe nombre o codigo..." autoComplete="off" />
      {open && fil.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surf, border: `1px solid ${T.acc}`, borderRadius: 8, zIndex: 200, maxHeight: 220, overflowY: "auto", marginTop: 2 }}>
          {fil.map(c => (
            <div key={c.id} onClick={() => { onSelect(c); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.bord}22`, fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = T.accDim}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600 }}>{c.nombre}</div>
              <div style={{ fontSize: 10, color: T.sub }}>{c.codigo ? "Cod: " + c.codigo + " | " : ""}NIT: {c.nit || "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PDF (HTML - abre en nueva ventana para imprimir) ─────────────────────────
function generarPDF(d) {
  const svc = [];
  if (d.incl_piloto)       svc.push("Conductor / piloto profesional");
  if (d.incl_combustible)  svc.push("Combustible segun recorrido");
  if (d.incl_peajes)       svc.push("Peajes y casetas de cobro");
  if (d.incl_hospedaje)    svc.push("Hospedaje del piloto");
  if (d.incl_alimentacion) svc.push("Alimentacion del piloto");
  if (d.incl_seguro)       svc.push("Seguro basico de viaje");
  if (!d.incl_piloto)      svc.push("Vehiculo entregado con tanque lleno");
  svc.push("Vehiculo higienizado antes del servicio");
  svc.push("Atencion personalizada");

  const rows = [];
  if (d.sub_veh > 0)                           rows.push([`Vehiculo — ${d.vehiculo}`, `${d.dias}d x Q${fmt(d.rate)}`, d.sub_veh]);
  if (d.incl_piloto && d.sub_piloto > 0)       rows.push(["Piloto / conductor", `${d.dias}d x Q${fmt(d.cp)}`, d.sub_piloto]);
  if (d.incl_hospedaje && d.sub_hos > 0)       rows.push(["Hospedaje piloto", `${d.dias}d x Q${fmt(d.ch)}`, d.sub_hos]);
  if (d.incl_alimentacion && d.sub_ali > 0)    rows.push(["Alimentacion piloto", `${d.dias}d x Q${fmt(d.ca)}`, d.sub_ali]);
  if (d.incl_combustible && d.sub_comb > 0)    rows.push(["Combustible", `${fmt(d.gals)} gal x Q${fmt(d.pgal)}`, d.sub_comb]);
  if (d.incl_peajes && d.sub_peajes > 0)       rows.push(["Peajes", "Segun recorrido", d.sub_peajes]);
  if (d.extras > 0)                            rows.push(["Gastos extras", "", d.extras]);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>${d.es_orden ? "Orden de Venta" : "Cotizacion"} ${d.numero}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B}
.hdr{background:#1B2D5C;color:#fff;padding:18px 22px;display:flex;justify-content:space-between}
.hdr h1{font-size:15px;color:#00D4AA;margin-bottom:3px}.hdr p{font-size:8px;color:#94A3B8;margin-top:1px}
.hr{text-align:right}.hr .tipo{font-size:18px;font-weight:700;color:#00D4AA}
.hr .n{font-size:11px;color:#fff;margin-top:3px}.hr .f{font-size:8px;color:#94A3B8;margin-top:2px}
.bar{height:3px;background:linear-gradient(to right,#00D4AA,#1B2D5C)}
.body{padding:18px 22px}.sec{margin-bottom:14px}
.st{font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;margin-bottom:7px}
.cn{font-size:13px;font-weight:700;color:#1B2D5C}.cs{font-size:9px;color:#64748B;margin-top:2px}
.gt{background:#F0FDF9;border-left:3px solid #00D4AA;padding:9px 13px;font-size:10px;color:#334155;font-style:italic}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.si{display:flex;align-items:center;gap:6px;padding:3px 4px;font-size:9.5px}
.ck{width:13px;height:13px;background:#00D4AA;border-radius:2px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;flex-shrink:0}
table{width:100%;border-collapse:collapse}th{background:#1B2D5C;color:#fff;padding:5px 7px;text-align:left;font-size:9.5px}
td{padding:4px 7px;border-bottom:1px solid #F1F5F9;font-size:9.5px}.amt{text-align:right;font-weight:600}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tot{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:11px}
.tr{display:flex;justify-content:space-between;padding:2px 0;font-size:10px;color:#64748B}
.tm{display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#00D4AA;border-top:2px solid #00D4AA;margin-top:5px;padding-top:5px}
.tc{display:flex;justify-content:space-between;font-size:10px;color:#F59E0B;font-weight:600;margin-top:3px}
.bk{font-size:9.5px}.bn{font-weight:700;color:#00D4AA;display:block;margin-bottom:1px;margin-top:8px}
.tl li{font-size:9px;color:#475569;padding:2px 0 2px 12px;position:relative}
.tl li::before{content:"\\2022";position:absolute;left:0;color:#00D4AA}
.ft{margin-top:14px;border-top:2px solid #E2E8F0;padding-top:10px;display:flex;justify-content:space-between;align-items:flex-end}
.fb{background:#1B2D5C;color:#94A3B8;font-size:7.5px;text-align:center;padding:7px;margin-top:12px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="hdr">
  <div><h1>TZ'UNUN AUTORENTAS</h1><p>MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS</p><p>2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala</p><p>502-31221538 | tzununautorentas@gmail.com | @TzununAutorentas</p></div>
  <div class="hr"><div class="tipo">${d.es_orden ? "ORDEN DE VENTA" : "COTIZACION"}</div><div class="n"># ${d.numero}</div><div class="f">Emision: ${d.fecha}</div><div class="f">Valida hasta: ${d.fecha_vence || "15 dias"}</div></div>
</div><div class="bar"></div>
<div class="body">
  <div class="sec"><div class="st">Facturar a</div>
    <div class="cn">${d.cliente}</div>
    <div class="cs">${d.codigo ? "Cod: " + d.codigo + " | " : ""}NIT: ${d.nit || "CF"}${d.dir ? " | " + d.dir : ""}</div>
  </div>
  ${d.saludo ? `<div class="sec"><div class="gt">${d.saludo}:<br/>Le presentamos la siguiente cotizacion con mucho gusto.</div></div>` : ""}
  ${d.servicio ? `<div class="sec"><div class="st">Descripcion del servicio</div><p style="font-size:9.5px;color:#475569;font-style:italic">${d.servicio}</p></div>` : ""}
  <div class="sec"><div class="st">Servicios incluidos</div>
    <div class="sg">${svc.map(s => `<div class="si"><div class="ck">&#10003;</div><span>${s}</span></div>`).join("")}</div>
  </div>
  <div class="sec"><div class="st">Desglose de costos</div>
    <table><thead><tr><th>Concepto</th><th>Detalle</th><th style="text-align:right">GTQ</th></tr></thead>
    <tbody>${rows.map(([c, det, tot]) => `<tr><td>${c}</td><td style="color:#64748B">${det}</td><td class="amt">Q ${fmt(tot)}</td></tr>`).join("")}</tbody></table>
  </div>
  <div class="two">
    <div><div class="st">Resumen financiero</div>
      <div class="tot">
        <div class="tr"><span>Subtotal</span><span>Q ${fmt(d.sub)}</span></div>
        <div class="tr"><span>IVA (${d.iva_pct}%)</span><span>Q ${fmt(d.iva_amt)}</span></div>
        <div class="tm"><span>PRECIO BENEFICIO</span><span>Q ${fmt(d.total_ef)}</span></div>
        <div class="tc"><span>Con tarjeta C/D (+5%)</span><span>Q ${fmt(d.total_tc)}</span></div>
        <div style="text-align:right;font-size:8.5px;color:#94A3B8;margin-top:2px">$ ${fmt(d.total_ef / (d.exch || 7.70))} USD</div>
      </div>
      ${d.iva_pct === 5 ? '<p style="font-size:8px;color:#94A3B8;margin-top:3px">* No genera derecho a credito fiscal</p>' : ""}
    </div>
    <div><div class="st">Datos de pago</div>
      <div class="bk"><span class="bn">Banco Industrial</span>Cta. Monetaria No. 853-000016-8<br/>A nombre de: Transportes Tz'unun<span class="bn">Banrural</span>Cta. No. 3309159475</div>
      <div class="st" style="margin-top:10px">Terminos y condiciones</div>
      <ul class="tl">
        <li>Higienizacion del vehiculo incluida.</li>
        <li>Se requiere copia de DPI del responsable.</li>
        <li>Anticipo del 75% para confirmar el servicio.</li>
        <li>${d.incl_piloto ? "Combustible incluido segun recorrido." : "Vehiculo con tanque lleno \u2014 devolver lleno."}</li>
        <li>Vehiculo debe devolverse limpio (recargo Q 75.00).</li>
        <li>Saldo se cancela al finalizar el servicio.</li>
      </ul>
    </div>
  </div>
  <div class="ft">
    <div style="font-size:9px;color:#64748B"><div style="border-top:1px solid #E2E8F0;padding-top:4px;margin-top:22px;width:150px">Oscar Galvez</div><div>Cel. 502 31221538 | @TzununAutorentas</div></div>
    <div style="font-size:10px;font-style:italic;color:#1B2D5C;font-weight:600;text-align:right">Muchas gracias por su preferencia.<br/>Quedamos a la espera de su aprobacion.</div>
  </div>
</div>
<div class="fb">TZ'UNUN AUTORENTAS \u2014 502-31221538 | tzununautorentas@gmail.com | Guatemala</div>
<script>window.onload=()=>window.print();</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Permite ventanas emergentes para generar el PDF."); return; }
  w.document.write(html); w.document.close();
}

// Construye datos PDF desde registro guardado
function makePDFData(r) {
  const dias = parseInt(r.dias) || 1;
  const rate = parseFloat(r.precio_personalizado) || parseFloat(r.costo_vehiculo) || 0;
  const cp = parseFloat(r.costo_piloto) || 0;
  const ch = parseFloat(r.costo_hospedaje) || 0;
  const ca = parseFloat(r.costo_alimentacion) || 0;
  const sub_veh = dias * rate;
  const sub_piloto = dias * cp;
  const sub_hos = dias * ch;
  const sub_ali = dias * ca;
  const kmpg = parseFloat(r.km_por_galon) || 1;
  const gals = (parseFloat(r.km_total) || 0) / kmpg;
  const pgal = parseFloat(r.precio_galon) || 0;
  const sub_comb = gals * pgal;
  const sub_peajes = parseFloat(r.peajes) || 0;
  const extras = parseFloat(r.extras) || 0;
  let svc = {};
  try { svc = JSON.parse(r.servicios_incluidos || "{}"); } catch {}
  return {
    numero: r.numero, fecha: r.fecha_emision || today(), fecha_vence: r.fecha_vence,
    es_orden: r.orden_venta, cliente: r.cliente_nombre, codigo: r.cliente_codigo,
    nit: r.cliente_nit, dir: r.cliente_dir, saludo: r.saludo, servicio: r.descripcion_servicio,
    vehiculo: r.vehiculo_nombre, dias, rate, cp, ch, ca, gals, pgal,
    sub_veh, sub_piloto, sub_hos, sub_ali, sub_comb, sub_peajes, extras,
    incl_piloto: svc.piloto || sub_piloto > 0,
    incl_combustible: svc.combustible || sub_comb > 0,
    incl_peajes: svc.peajes || sub_peajes > 0,
    incl_hospedaje: svc.hospedaje || sub_hos > 0,
    incl_alimentacion: svc.alimentacion || sub_ali > 0,
    incl_seguro: svc.seguro !== false,
    sub: parseFloat(r.subtotal) || (sub_veh + sub_piloto + sub_hos + sub_ali + sub_comb + sub_peajes + extras),
    iva_pct: parseFloat(r.tasa_iva) || 5,
    iva_amt: parseFloat(r.total_iva) || 0,
    total_ef: parseFloat(r.total_gtq) || 0,
    total_tc: (parseFloat(r.total_gtq) || 0) * 1.05,
    exch: parseFloat(r.tasa_cambio) || 7.70,
  };
}

// ─── Estado inicial formulario ────────────────────────────────────────────────
const EMPTY_F = {
  cliente_nombre: "", cliente_nit: "", cliente_dir: "", cliente_codigo: "",
  saludo: "", descripcion_servicio: "",
  vehiculo_nombre: "", dias: 1, precio_custom: "",
  incl_piloto: false, incl_combustible: false, incl_peajes: false,
  incl_hospedaje: false, incl_alimentacion: false, incl_seguro: true,
  costo_piloto: "", costo_hospedaje: "", costo_alimentacion: "",
  km_total: "", km_por_galon: 27, precio_galon: 48,
  peajes: "", extras: "",
  iva_pct: 5, pago: "efectivo", exch: 7.70,
  fecha_emision: today(), fecha_vence: "", estado: "borrador", notas: "",
};

// ─── Formulario de cotización ─────────────────────────────────────────────────
function FormCotizacion({ initial, empId, clientes, onSave, onCancel, showToast }) {
  const isClone = initial?.__clon;
  const [f, setF] = useState(() => {
    if (!initial) return { ...EMPTY_F };
    let svc = {};
    try { svc = JSON.parse(initial.servicios_incluidos || "{}"); } catch {}
    return {
      ...EMPTY_F,
      cliente_nombre: initial.cliente_nombre || "", cliente_nit: initial.cliente_nit || "",
      cliente_dir: initial.cliente_dir || "", cliente_codigo: initial.cliente_codigo || "",
      saludo: initial.saludo || "", descripcion_servicio: initial.descripcion_servicio || "",
      vehiculo_nombre: initial.vehiculo_nombre || "", dias: initial.dias || 1,
      precio_custom: initial.precio_personalizado || "",
      incl_piloto: svc.piloto || (parseFloat(initial.costo_piloto) > 0),
      incl_combustible: svc.combustible || (parseFloat(initial.km_total) > 0),
      incl_peajes: svc.peajes || (parseFloat(initial.peajes) > 0),
      incl_hospedaje: svc.hospedaje || (parseFloat(initial.costo_hospedaje) > 0),
      incl_alimentacion: svc.alimentacion || (parseFloat(initial.costo_alimentacion) > 0),
      incl_seguro: svc.seguro !== false,
      costo_piloto: initial.costo_piloto || "", costo_hospedaje: initial.costo_hospedaje || "",
      costo_alimentacion: initial.costo_alimentacion || "", km_total: initial.km_total || "",
      km_por_galon: initial.km_por_galon || 27, precio_galon: initial.precio_galon || 48,
      peajes: initial.peajes || "", extras: initial.extras || "",
      iva_pct: initial.tasa_iva || 5, pago: initial.metodo_pago || "efectivo",
      exch: initial.tasa_cambio || 7.70, fecha_vence: initial.fecha_vence || "",
      estado: "borrador", notas: initial.notas || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const tarifaFn = (v, d) => { if (!v) return 0; if (d >= 30) return v.mes; if (d >= 8) return v.sem; return v.dia; };
  const vehObj = CATALOGO.find(v => v.nombre === f.vehiculo_nombre) || null;
  const dias = parseInt(f.dias) || 1;
  const rate = parseFloat(f.precio_custom) > 0 ? parseFloat(f.precio_custom) : (vehObj ? tarifaFn(vehObj, dias) : 0);
  const sub_veh = dias * rate;
  const cp = parseFloat(f.costo_piloto) || 0;
  const ch = parseFloat(f.costo_hospedaje) || 0;
  const ca = parseFloat(f.costo_alimentacion) || 0;
  const sub_piloto = f.incl_piloto ? dias * cp : 0;
  const sub_hos = f.incl_hospedaje ? dias * ch : 0;
  const sub_ali = f.incl_alimentacion ? dias * ca : 0;
  const kmpg = parseFloat(f.km_por_galon) || 1;
  const pgal = parseFloat(f.precio_galon) || 0;
  const gals = f.incl_combustible ? (parseFloat(f.km_total) || 0) / kmpg : 0;
  const sub_comb = gals * pgal;
  const sub_peajes = f.incl_peajes ? (parseFloat(f.peajes) || 0) : 0;
  const sub_extras = parseFloat(f.extras) || 0;
  const sub = sub_veh + sub_piloto + sub_hos + sub_ali + sub_comb + sub_peajes + sub_extras;
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
        empresa_id: eId, cliente_nombre: f.cliente_nombre, cliente_nit: f.cliente_nit || "",
        cliente_dir: f.cliente_dir || "", cliente_codigo: f.cliente_codigo || "",
        tipo: "renta",
        numero: (!initial?.id || isClone) ? await siguienteNumero("COT-", "cotizaciones", eId) : initial.numero,
        dias, vehiculo_nombre: f.vehiculo_nombre || "",
        precio_personalizado: parseFloat(f.precio_custom) || 0, costo_vehiculo: rate,
        saludo: f.saludo || "", descripcion_servicio: f.descripcion_servicio || "",
        servicios_incluidos: JSON.stringify({ piloto: f.incl_piloto, combustible: f.incl_combustible, peajes: f.incl_peajes, hospedaje: f.incl_hospedaje, alimentacion: f.incl_alimentacion, seguro: f.incl_seguro }),
        costo_piloto: cp, costo_hospedaje: ch, costo_alimentacion: ca,
        km_total: parseFloat(f.km_total) || 0, km_por_galon: kmpg, precio_galon: pgal,
        peajes: sub_peajes, extras: sub_extras,
        tasa_iva: f.iva_pct, metodo_pago: f.pago || "efectivo", tasa_cambio: exch,
        subtotal: sub, total_iva: iva_amt, recargo_tarjeta: total_tc - total_ef,
        total_gtq: total_ef, total_usd: total_ef / exch,
        estado: estado === "orden_venta" ? "aprobada" : estado,
        orden_venta: estado === "orden_venta",
        fecha_emision: f.fecha_emision || today(), fecha_vence: f.fecha_vence || "", notas: f.notas || "",
      };
      let result;
      if (initial?.id && !isClone) result = await dbUpd("cotizaciones", initial.id, payload);
      else result = await dbIns("cotizaciones", payload);
      if (result?.error) { showToast("Error: " + result.error, "err"); setSaving(false); return; }
      showToast("Cotizacion guardada");
      setSaving(false); onSave(estado);
    } catch (e) { showToast("Error: " + e.message, "err"); setSaving(false); }
  };

  const SVC = [
    { k: "incl_piloto", l: "Piloto" }, { k: "incl_combustible", l: "Combustible" },
    { k: "incl_peajes", l: "Peajes" }, { k: "incl_hospedaje", l: "Hospedaje piloto" },
    { k: "incl_alimentacion", l: "Alimentacion" }, { k: "incl_seguro", l: "Seguro viaje" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>
          {isClone ? "Clonar cotizacion" : initial?.id ? "Editar cotizacion" : "Nueva cotizacion"}
        </div>
        <button onClick={onCancel} style={S.btn("ghost")}>Volver</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18 }}>
        {/* Izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Cliente */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>DATOS DEL CLIENTE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>CLIENTE</label>
                <ClienteAC value={f.cliente_nombre} onChange={v => sf("cliente_nombre", v)}
                  onSelect={c => {
                    sf("cliente_nombre", c.nombre); sf("cliente_nit", c.nit || ""); sf("cliente_dir", c.direccion || ""); sf("cliente_codigo", c.codigo || "");
                    const base = "en Transportes Tz'unun, nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas, el mercado de renta de vehículos, viajes de turismo y traslado de personas a diferentes lugares de Guatemala y Centroamérica.";
                    const saludos = { persona: "Estimado(a) cliente", empresa: "Estimados clientes", gobierno: "Distinguidos señores", ong: "Estimados miembros" };
                    sf("saludo", (saludos[c.tipo] || "Estimado(a) cliente") + ", " + base);
                  }}
                  clientes={clientes} />
              </div>
              {f.cliente_codigo && (
                <div style={{ gridColumn: "span 2", background: T.accDim, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: T.acc }}>
                  Codigo: <strong>{f.cliente_codigo}</strong>
                </div>
              )}
              <div><label style={S.lbl}>NIT</label><input style={S.inp} value={f.cliente_nit} onChange={e => sf("cliente_nit", e.target.value)} placeholder="CF o NIT" /></div>
              <div><label style={S.lbl}>DIRECCION</label><input style={S.inp} value={f.cliente_dir} onChange={e => sf("cliente_dir", e.target.value)} placeholder="Ciudad..." /></div>
              <div style={{ gridColumn: "span 2" }}><label style={S.lbl}>SALUDO PERSONALIZADO</label><input style={S.inp} value={f.saludo} onChange={e => sf("saludo", e.target.value)} placeholder="Estimados señores de..." /></div>
            </div>
          </div>

          {/* Vehiculo */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>VEHICULO Y PERIODO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>VEHICULO</label>
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e => sf("vehiculo_nombre", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CATALOGO.map(v => <option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>DIAS</label><input style={S.inp} type="number" min="1" value={f.dias} onChange={e => sf("dias", parseInt(e.target.value) || 1)} /></div>
              <div><label style={S.lbl}>PRECIO PERSONALIZADO</label><input style={S.inp} type="number" value={f.precio_custom} onChange={e => sf("precio_custom", e.target.value)} placeholder="Vacio = catalogo" /></div>
              <div style={{ gridColumn: "span 2" }}><label style={S.lbl}>DESCRIPCION DEL SERVICIO</label><textarea style={{ ...S.inp, minHeight: 56, resize: "vertical" }} value={f.descripcion_servicio} onChange={e => sf("descripcion_servicio", e.target.value)} placeholder="Traslado desde Guatemala hacia..." /></div>
            </div>
          </div>

          {/* Servicios y costos */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>SERVICIOS INCLUIDOS Y COSTOS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {SVC.map(({ k, l }) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 11px", borderRadius: 8, background: f[k] ? T.accDim : T.surf, border: `1px solid ${f[k] ? T.acc : T.bord}`, fontSize: 12, userSelect: "none" }}>
                  <input type="checkbox" checked={f[k]} onChange={e => sf(k, e.target.checked)} style={{ accentColor: T.acc }} />
                  {l}
                </label>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              {f.incl_piloto && <Fld label="COSTO PILOTO / DIA (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_piloto} onChange={e => sf("costo_piloto", e.target.value)} placeholder="0.00" /></Fld>}
              {f.incl_hospedaje && <Fld label="HOSPEDAJE / DIA (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_hospedaje} onChange={e => sf("costo_hospedaje", e.target.value)} placeholder="0.00" /></Fld>}
              {f.incl_alimentacion && <Fld label="ALIMENTACION / DIA (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_alimentacion} onChange={e => sf("costo_alimentacion", e.target.value)} placeholder="0.00" /></Fld>}
              {f.incl_combustible && <>
                <Fld label="KM TOTALES"><input style={S.inp} type="number" value={f.km_total} onChange={e => sf("km_total", e.target.value)} placeholder="0" /></Fld>
                <Fld label="KM POR GALON"><input style={S.inp} type="number" value={f.km_por_galon} onChange={e => sf("km_por_galon", e.target.value)} placeholder="27" /></Fld>
                <Fld label="PRECIO GALON (Q)"><input style={S.inp} type="number" value={f.precio_galon} onChange={e => sf("precio_galon", e.target.value)} placeholder="48" /></Fld>
              </>}
              {f.incl_peajes && <Fld label="PEAJES TOTAL (Q)"><input style={S.inp} type="number" step="0.01" value={f.peajes} onChange={e => sf("peajes", e.target.value)} placeholder="0.00" /></Fld>}
              <Fld label="GASTOS EXTRAS / VARIOS (Q)"><input style={S.inp} type="number" step="0.01" value={f.extras} onChange={e => sf("extras", e.target.value)} placeholder="0.00" /></Fld>
            </div>
          </div>

          {/* Fiscal */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>FISCAL Y VALIDEZ</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.lbl}>IVA</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: 12, l: "12% General" }, { v: 5, l: "5% Pequeño Cont." }, { v: 0, l: "Sin IVA" }].map(o => (
                    <button key={o.v} onClick={() => sf("iva_pct", o.v)} style={{ ...S.btn(f.iva_pct === o.v ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div><label style={S.lbl}>TASA CAMBIO (Q/$1)</label><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e => sf("exch", e.target.value)} /></div>
              <div><label style={S.lbl}>VALIDA HASTA</label><input style={S.inp} value={f.fecha_vence} onChange={e => sf("fecha_vence", e.target.value)} placeholder="Ej: 30 de mayo" /></div>
              <div>
                <label style={S.lbl}>ESTADO</label>
                <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada al cliente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div><label style={S.lbl}>NOTAS INTERNAS</label><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." /></div>
            </div>
          </div>
        </div>

        {/* Derecha — Resumen */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Resumen</div>
          {f.cliente_nombre && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{f.cliente_nombre}</div>
              {f.cliente_codigo && <div style={{ fontSize: 11, color: T.acc }}>Cod: {f.cliente_codigo}</div>}
              {f.cliente_nit && <div style={{ fontSize: 11, color: T.sub }}>NIT: {f.cliente_nit}</div>}
            </div>
          )}
          {vehObj && <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{vehObj.nombre} · {dias} dia{dias !== 1 ? "s" : ""}</div>}
          {sub > 0 ? (
            <>
              <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 12 }}>
                {sub_veh > 0 && <div style={S.srow(false)}><span>Vehiculo</span><span>Q {fmt(sub_veh)}</span></div>}
                {f.incl_piloto && sub_piloto > 0 && <div style={S.srow(false)}><span>Piloto</span><span>Q {fmt(sub_piloto)}</span></div>}
                {f.incl_hospedaje && sub_hos > 0 && <div style={S.srow(false)}><span>Hospedaje</span><span>Q {fmt(sub_hos)}</span></div>}
                {f.incl_alimentacion && sub_ali > 0 && <div style={S.srow(false)}><span>Alimentacion</span><span>Q {fmt(sub_ali)}</span></div>}
                {f.incl_combustible && sub_comb > 0 && <div style={S.srow(false)}><span>Combustible ({fmt(gals)} gal)</span><span>Q {fmt(sub_comb)}</span></div>}
                {f.incl_peajes && sub_peajes > 0 && <div style={S.srow(false)}><span>Peajes</span><span>Q {fmt(sub_peajes)}</span></div>}
                {sub_extras > 0 && <div style={S.srow(false)}><span>Extras</span><span>Q {fmt(sub_extras)}</span></div>}
                <div style={{ borderTop: `1px solid ${T.bord}`, margin: "6px 0" }} />
                <div style={S.srow(false)}><span>Subtotal</span><span>Q {fmt(sub)}</span></div>
                <div style={S.srow(false)}><span>IVA {f.iva_pct}%</span><span>Q {fmt(iva_amt)}</span></div>
              </div>
              <div style={{ background: T.accDim, border: `1px solid ${T.acc}55`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.acc, marginBottom: 3 }}>PRECIO BENEFICIO (Efectivo / Transf.)</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}>
                  <span>Q {fmt(total_ef)}</span>
                  <span style={{ fontSize: 12, color: T.sub, alignSelf: "flex-end" }}>$ {fmt(total_ef / exch)}</span>
                </div>
              </div>
              <div style={{ background: T.secDim, border: `1px solid ${T.sec}44`, borderRadius: 9, padding: "9px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: T.sec }}>Con Tarjeta C/D (+5%)</div>
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PageCotizaciones({ showToast, empId }) {
  const [clientes, setClientes] = useState([]);
  const [vista, setVista] = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState('');
  const [exportar, setExportar] = useState(false);

  const query = filtro === 'todas' ? '' : (filtro === 'orden_venta' ? 'orden_venta=eq.true' : 'estado=eq.'+filtro);

  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload: load, desde, hasta } = usePaginacion({
    table: 'cotizaciones',
    query,
    search: busqueda,
    columns: ['numero', 'cliente_nombre', 'cliente_nit', 'cliente_dir', 'vehiculo_nombre', 'descripcion_servicio', 'notas'],
    order: 'numero.desc',
  });

  useEffect(() => {
    dbGet("clientes", "&order=codigo.asc,nombre.asc").then(d => setClientes(Array.isArray(d) ? d : []));
  }, []);

  const del = async id => {
    if (!confirm("Eliminar esta cotizacion?")) return;
    await dbDel("cotizaciones", id);
    showToast("Eliminada"); load();
  };

  const chEst = async (id, estado) => {
    await dbUpd("cotizaciones", id, { estado, orden_venta: estado === "orden_venta" });
    showToast("Estado actualizado"); load();
  };

  const convertirAReserva = async (cot) => {
    if (!confirm(`Convertir ${cot.numero} en Reserva confirmada?`)) return;
    const eId = empId || (await dbGet("empresas", "&select=id&limit=1").then(d => d?.[0]?.id || null));
    const numero = await siguienteNumero("RES-", "reservas", eId);

    const r = await dbIns("reservas", {
      empresa_id: eId,
      cliente_nombre: cot.cliente_nombre,
      tipo: cot.tipo || "renta",
      numero,
      estado: "confirmada",
      cotizacion_id: cot.id,
      notas: "Generada desde cotizacion " + cot.numero,
      vehiculo_nombre: cot.vehiculo_nombre || "",
      conductor_nombre: "",
      fecha_inicio: cot.fecha_inicio || null,
      fecha_fin: cot.fecha_fin || null,
      dias: parseInt(cot.dias) || 0,
      tarifa: parseFloat(cot.precio_personalizado) || parseFloat(cot.costo_vehiculo) || 0,
      subtotal: parseFloat(cot.subtotal) || 0,
      total_iva: parseFloat(cot.total_iva) || 0,
      total_gtq: parseFloat(cot.total_gtq) || 0,
      tasa_iva: parseFloat(cot.tasa_iva) || 5,
      metodo_pago: cot.metodo_pago || "efectivo",
      tasa_cambio: parseFloat(cot.tasa_cambio) || 7.70,
      monto: parseFloat(cot.total_gtq) || 0,
      anticipo: 0,
      saldo: parseFloat(cot.total_gtq) || 0,
    });
    if (r && !r.error) {
      await dbUpd("cotizaciones", cot.id, { reserva_id: r.id, estado: "aprobada" });
      showToast("Reserva " + numero + " creada"); load();
    } else { showToast("Error: " + (r?.error || ""), "err"); }
  };

  const EC = {
    borrador:    { c: T.mut,    bg: "#1E293B",   l: "Borrador"       },
    enviada:     { c: T.blue,   bg: T.blueDim,   l: "Enviada"        },
    aprobada:    { c: T.acc,    bg: T.accDim,    l: "Aprobada"       },
    rechazada:   { c: T.red,    bg: T.redDim,    l: "Rechazada"      },
    orden_venta: { c: T.purple, bg: T.purpleDim, l: "Orden de Venta" },
  };

  if (vista === "form") return (
    <FormCotizacion initial={editItem} empId={empId} clientes={clientes} showToast={showToast}
      onSave={() => { showToast("Guardada"); setEditItem(null); setVista("lista"); load(); }}
      onCancel={() => { setEditItem(null); setVista("lista"); }} />
  );

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Cotizaciones" datos={rows}
          campos={[{ label: "Numero", key: "numero" }, { label: "Cliente", key: "cliente_nombre" }, { label: "Vehiculo", key: "vehiculo_nombre" }, { label: "Total GTQ", key: "total_gtq" }, { label: "Estado", key: "estado" }]}
          onClose={() => setExportar(false)} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[{ l: "Total", v: total, c: T.acc }, { l: "Enviadas", v: rows.filter(r => r.estado === "enviada").length, c: T.blue }, { l: "Aprobadas", v: rows.filter(r => r.estado === "aprobada").length, c: T.acc }, { l: "Ordenes", v: rows.filter(r => r.orden_venta).length, c: T.purple }].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["todas", "borrador", "enviada", "aprobada", "rechazada", "orden_venta"].map(fi => (
          <button key={fi} onClick={() => setFiltro(fi)} style={{ ...S.btn(filtro === fi ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {fi === "orden_venta" ? "Ordenes" : fi.charAt(0).toUpperCase() + fi.slice(1)}
          </button>
        ))}
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar cotización..." />
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11, marginLeft: "auto" }}>Actualizar</button>
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12 }}>+ Nueva</button>
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? <Empty icon="Q" msg="Sin cotizaciones" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(r => {
            const e = r.orden_venta ? EC.orden_venta : (EC[r.estado] || EC.borrador);
            const total = parseFloat(r.total_gtq) || 0;
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.cliente_nombre}</div>
                    {r.cliente_codigo && <div style={{ fontSize: 11, color: T.acc }}>Cod: {r.cliente_codigo}</div>}
                    <div style={{ fontSize: 12, color: T.sub }}>{r.dias}d{r.vehiculo_nombre ? " · " + r.vehiculo_nombre : ""}</div>
                    {r.reserva_id && <div style={{ fontSize: 11, color: T.green, marginTop: 2 }}>Reserva vinculada</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={e.c} bg={e.bg} label={e.l} small />
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.acc, marginTop: 4 }}>Q {fmt(total)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, paddingTop: 10, borderTop: `1px solid ${T.bord}22`, flexWrap: "wrap" }}>
                  <button onClick={() => generarPDF(makePDFData(r))} style={{ ...S.btn("blue"), fontSize: 11, padding: "4px 9px" }}>Ver PDF</button>
                  <button onClick={() => { setEditItem({ ...r, __clon: true }); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Clonar</button>
                  <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Editar</button>
                  {r.estado === "enviada" && <button onClick={() => chEst(r.id, "aprobada")} style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 9px" }}>Aprobar</button>}
                  {(r.estado === "aprobada" || r.orden_venta) && !r.reserva_id && (
                    <button onClick={() => convertirAReserva(r)} style={{ ...S.btn("green"), fontSize: 11, padding: "4px 9px" }}>Crear Reserva</button>
                  )}
                  {!r.orden_venta && <button onClick={() => chEst(r.id, "orden_venta")} style={{ ...S.btn("purple"), fontSize: 11, padding: "4px 9px" }}>Orden Venta</button>}
                  <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 9px", marginLeft: "auto" }}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {rows.length > 0 && (
        <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}
    </div>
  );
}
