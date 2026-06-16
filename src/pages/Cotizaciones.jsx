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

// ─── Cargar script dinámicamente ──────────────────────────────────────────────
const cargarScript = (url) => new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = url;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error('Error al cargar ' + url));
  document.head.appendChild(s);
});

// ─── PDF Premium — Propuesta Comercial Corporativa ──────────────────────────────
async function generarPDFPremium(d, empId, mode = "download") {
  const empData = await dbGet("empresas", `&select=*&id=eq.${empId}`).then(dd => dd?.[0] || {});
  const e = {
    nombre:    empData.nombre             || "Tz'unun AutoRentas",
    eslogan:   empData.eslogan            || "Servicios de Movilidad Corporativa",
    direccion: empData.direccion          || "2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala",
    telefono:  empData.telefono           || "502-31221538",
    email:     empData.email              || "tzununautorentas@gmail.com",
    email_contacto: empData.email_contacto || empData.email || "propuestas@tzunun.com",
    web:       empData.web                || "@TzununAutorentas",
    logo_url:  empData.logo_url           || "",
    banco1:    empData.banco1             || "Banco Industrial — Cta. Monetaria No. 853-000016-8",
    banco2:    empData.banco2             || "Banco de Desarrollo Rural — BANRURAL — Cta. No. 3309159475",
    firmante:  empData.firmante           || "Oscar Gálvez",
    cargo_firmante: empData.cargo_firmante || "Coordinador de Servicios Corporativos",
    tel_firmante: empData.tel_firmante    || "+502 3122 1538",
    firma_digital: empData.firma_digital  || "",
    titulo_footer: empData.titulo_footer  || "Conduciendo confianza, llegando más lejos.",
    cierre_corporativo: empData.cierre_corporativo || "",
    tarifa_limpieza: parseFloat(empData.tarifa_limpieza) || 75,
    termino_pago_def: empData.termino_pago_def || "50% anticipo",
  };
  // Cargar html2canvas y jsPDF por separado
  if (typeof window.html2canvas === "undefined") {
    try {
      await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    } catch {
      alert("Error al cargar el generador de PDF. Verifica tu conexión.");
      return;
    }
  }
  if (typeof window.jspdf === "undefined") {
    try {
      await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    } catch {
      alert("Error al cargar el generador de PDF. Verifica tu conexión.");
      return;
    }
  }

  // Buscar foto del vehículo
  let fotoVehiculo = "";
  if (d.vehiculo) {
    try {
      const vehiculos = await dbGet("vehiculos", "&select=foto_url,marca,modelo&limit=20");
      const match = vehiculos.find(v => {
        const vn = `${v.marca || ""} ${v.modelo || ""}`.toLowerCase();
        const dn = d.vehiculo.toLowerCase();
        return vn.includes(dn) || dn.includes(vn) || dn.includes((v.marca || "").toLowerCase());
      });
      if (match && match.foto_url) fotoVehiculo = match.foto_url;
    } catch {}
  }

  const mostrarIVA = d.iva_pct > 0 && d.iva_amt > 0;

  const totalTC = d.total_ef * 1.05;

  const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#1E293B;background:#fff;line-height:1.35}
.page{width:100%;padding:0;min-height:880px;display:flex;flex-direction:column}

/* ── HEADER ── */
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:8px;border-bottom:3px solid #1B2D5C;margin-bottom:6px;position:relative}
.header::after{content:"";position:absolute;bottom:-5px;left:0;right:70%;height:3px;background:#00D4AA}
.h-left{display:flex;gap:12px;align-items:center}
.h-logo{width:207px;height:150px;object-fit:contain}
.h-logo-fallback{width:207px;height:150px;border-radius:8px;background:#1B2D5C;display:flex;align-items:center;justify-content:center;color:#fff;font-size:40px;font-weight:900}
.h-info h1{font-size:18px;font-weight:800;color:#1B2D5C;letter-spacing:-0.4px;margin-bottom:1px}
.h-info .slogan{font-size:10px;color:#00D4AA;margin-top:0;font-weight:600;font-style:italic}
.h-info .detail{font-size:9px;color:#64748B;margin-top:2px;line-height:1.3}
.h-right{text-align:right;padding-top:0}
.h-right .doc-type{font-size:18px;font-weight:800;color:#00D4AA;letter-spacing:2.5px;margin-bottom:0}
.h-right .doc-num{font-size:14px;color:#1B2D5C;font-weight:700;margin-top:2px}
.h-right .doc-date{font-size:9px;color:#64748B;margin-top:1px}

/* ── SECTION TITLES ── */
.st{font-size:8.5px;font-weight:700;color:#1B2D5C;text-transform:uppercase;letter-spacing:1.8px;border-bottom:1.5px solid #00D4AA55;padding-bottom:3px;margin-bottom:5px}
.section{margin-bottom:6px}

/* ── FACTURAR A ── */
.client-box{margin-bottom:3px}
.client-name{font-size:16px;font-weight:700;color:#1B2D5C}
.client-meta{font-size:11px;color:#475569;margin-top:2px;line-height:1.3}

/* ── SALUDO ── */
.saludo-box{background:#F8FAFC;border-left:4px solid #00D4AA;padding:7px 14px;font-size:12px;color:#334155;font-style:italic;line-height:1.4;margin-bottom:8px;border-radius:0 6px 6px 0}

/* ── DESCRIPCIÓN ── */
.servicio-text{font-size:12px;color:#475569;line-height:1.4;margin-bottom:1px;padding:0 2px}

/* ── TWO COLUMNS ── */
.two-col{display:flex;gap:12px;margin-bottom:6px;align-items:flex-start}
.col-services{flex:3;min-width:0}
.col-photo{flex:2;min-width:0}
.vehiculo-card{border:1.5px solid #E2E8F0;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.04);background:#fff}
.vehiculo-card img{width:100%;height:auto;display:block}
.vehiculo-card .veh-nombre{padding:4px 6px;font-size:9px;font-weight:700;color:#1B2D5C;background:#F8FAFC;text-align:center;border-top:1px solid #E2E8F0}

/* ── SERVICIOS INCLUIDOS ── */
.inc-list{list-style:none;padding:0;margin:0}
.inc-item{padding:3px 0;font-size:12px;color:#475569;display:flex;align-items:center;gap:7px}
.inc-check{width:15px;height:15px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;background:#00D4AA;flex-shrink:0;line-height:1}

/* ── RESUMEN ECONÓMICO ── */
.inv-box{background:#F8FAFC;border-radius:8px;padding:6px 14px;margin-bottom:6px;border:1px solid #E2E8F0}
.inv-row{display:flex;justify-content:space-between;padding:2px 0;font-size:11.5px;color:#475569}
.inv-divider{border-top:2.5px solid #00D4AA;margin:3px 0}
.inv-total{display:flex;justify-content:space-between;padding:4px 0 1px;font-size:16px;font-weight:800;color:#1B2D5C}
.inv-total .amt{color:#00D4AA;font-size:18px}

/* ── MODALIDADES DE PAGO ── */
.pago-grid{display:flex;gap:8px;margin-bottom:6px}
.pago-card{border-radius:8px;padding:8px 12px;border:2px solid #E2E8F0;background:#fff}
.pago-card.principal{flex:1.12;border-color:#00D4AA;background:#F0FDF9}
.pago-card.principal .pago-label{font-size:10px;color:#1B2D5C;font-weight:700;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px}
.pago-card.principal .pago-monto{font-size:18px;font-weight:800;color:#1B2D5C}
.pago-card.secundaria{flex:1;border-color:#CBD5E1;background:#FAFBFC}
.pago-card.secundaria .pago-label{font-size:8.5px;color:#94A3B8;font-weight:600;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.3px}
.pago-card.secundaria .pago-monto{font-size:14px;font-weight:700;color:#64748B}
.badge-preferente{display:inline-block;background:#00D4AA;color:#fff;font-size:7px;font-weight:700;padding:1px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}

/* ── DATOS BANCARIOS ── */
.bancos-box{font-size:10px;color:#475569;line-height:1.4;margin-bottom:6px;padding:5px 10px;background:#FAFBFC;border-radius:6px;border:1px solid #E2E8F0}
.bancos-box .b-label{font-weight:700;color:#1B2D5C;font-size:10px;margin-bottom:1px}
.bancos-box .b-item{padding:1px 0}

/* ── TÉRMINOS ── */
.terms-list{list-style:none;padding:0;margin:0 0 6px 0}
.terms-list li{font-size:9.5px;color:#475569;padding:1.5px 0 1.5px 14px;position:relative;line-height:1.3}
.terms-list li::before{content:"\\2713";position:absolute;left:0;color:#00D4AA;font-weight:700;font-size:10px}

/* ── CIERRE ── */
.cierre-box{font-size:11px;color:#475569;font-style:italic;line-height:1.4;margin:2px 0 6px;padding:6px 12px;background:#FAFBFC;border-radius:8px;border:1px solid #E2E8F0}

/* ── FIRMA ── */
.firma-box{display:flex;flex-direction:column;align-items:flex-start;margin-top:6px;padding-top:6px;border-top:3px solid #1B2D5C;width:100%}
.firma-img{height:140px;margin-bottom:3px}
.f-name{font-weight:700;color:#1B2D5C;font-size:15px}
.f-title{font-size:12px;color:#64748B;margin-top:1px}
.f-contact{font-size:10px;color:#94A3B8;margin-top:1px}

/* ── FOOTER ── */
.footer{text-align:center;font-size:8.5px;color:#94A3B8;margin-top:auto;padding-top:4px;border-top:1px solid #E2E8F0;line-height:1.3;padding-bottom:3px}
.footer strong{color:#64748B}
`;

  const htmlContent = `
<div class="page">

<!-- ═══ 1. HEADER CORPORATIVO ═══ -->
<div class="header">
  <div class="h-left">
    ${e.logo_url
      ? `<img src="${e.logo_url}" class="h-logo" alt="Logo"/>`
      : `<div class="h-logo-fallback">T</div>`}
    <div class="h-info">
      <h1>${e.nombre}</h1>
      <div class="slogan">${e.eslogan || "Transporte Ejecutivo"}</div>
      <div class="detail">${e.direccion}<br/>${e.telefono} | ${e.email} | ${e.web}</div>
    </div>
  </div>
  <div class="h-right">
    <div class="doc-type">COTIZACI&Oacute;N</div>
    <div class="doc-num"># ${d.numero}</div>
    <div class="doc-date">Emisi&oacute;n: ${d.fecha}</div>
    <div class="doc-date">Vigencia: ${d.fecha_vence || "15 d&iacute;as"}</div>
  </div>
</div>

<!-- ═══ 2. FACTURAR A ═══ -->
<div class="section">
  <div class="st">FACTURAR A</div>
  <div class="client-box">
    <div class="client-name">${d.cliente}</div>
    <div class="client-meta">
      <strong>NIT:</strong> ${d.nit || "CF"}${d.dir ? "<br/>" + d.dir : ""}
      ${d.contacto ? "<br/><strong>Contacto:</strong> " + d.contacto : ""}
    </div>
  </div>
</div>

<!-- ═══ 3. SALUDO CORPORATIVO ═══ -->
${d.saludo ? `<div class="saludo-box">${d.saludo}</div>` : ""}

<!-- ═══ 4. DESCRIPCIÓN DEL SERVICIO ═══ -->
${d.servicio ? `<div class="section">
  <div class="st">DESCRIPCI&Oacute;N DEL SERVICIO</div>
  <div class="servicio-text">${d.servicio}</div>
</div>` : ""}

<!-- ═══ 5. BLOQUE CENTRAL — SERVICIOS + FOTO ═══ -->
<div class="two-col">
  <div class="col-services">
    <div class="st">SERVICIOS INCLUIDOS</div>
    <div class="inc-list">
      ${d.incl_piloto ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Piloto profesional</span></div>` : ""}
      ${d.incl_combustible ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Combustible seg&uacute;n recorrido</span></div>` : ""}
      ${d.incl_peajes ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Peajes y casetas de cobro</span></div>` : ""}
      ${d.incl_hospedaje ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Hospedaje del piloto</span></div>` : ""}
      ${d.incl_alimentacion ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Alimentaci&oacute;n del piloto</span></div>` : ""}
      ${d.incl_seguro !== false ? `<div class="inc-item"><span class="inc-check">&#10003;</span><span>Seguro de viaje</span></div>` : ""}
    </div>
  </div>
  <div class="col-photo">
    ${fotoVehiculo ? `<div class="vehiculo-card">
      <img src="${fotoVehiculo}" alt="Veh&iacute;culo"/>
      ${d.vehiculo ? `<div class="veh-nombre">${d.vehiculo}</div>` : ""}
    </div>` : `<div style="height:100%;min-height:140px;border:1.5px dashed #E2E8F0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#CBD5E1;text-align:center;padding:12px">Sin fotograf&iacute;a</div>`}
  </div>
</div>

<!-- ═══ 6. RESUMEN ECONÓMICO ═══ -->
<div class="section">
  <div class="st">RESUMEN ECON&Oacute;MICO</div>
  <div class="inv-box">
    <div class="inv-row"><span>Servicio contratado</span><span>Q ${fmt(d.sub)}</span></div>
    ${mostrarIVA ? `<div class="inv-row" style="color:#64748B"><span>IVA (${d.iva_pct}%)</span><span>Q ${fmt(d.iva_amt)}</span></div>` : ""}
    <div class="inv-divider"></div>
    <div class="inv-total"><span>TOTAL DEL SERVICIO</span><span class="amt">Q ${fmt(d.total_ef)}</span></div>
  </div>
</div>

<!-- ═══ 7. MODALIDADES DE PAGO ═══ -->
<div class="section">
  <div class="st">MODALIDADES DE PAGO</div>
  <div class="pago-grid">
    <div class="pago-card secundaria">
      <div class="pago-label">Tarjeta de cr&eacute;dito o d&eacute;bito</div>
      <div class="pago-monto">Q ${fmt(totalTC)}</div>
    </div>
    <div class="pago-card principal">
      <div class="badge-preferente">Pago preferente</div>
      <div class="pago-label">Transferencia, dep&oacute;sito o efectivo</div>
      <div class="pago-monto">Q ${fmt(d.total_ef)}</div>
    </div>
  </div>
</div>

<!-- ═══ 8. INFORMACIÓN BANCARIA ═══ -->
<div class="section">
  <div class="st">DATOS BANCARIOS</div>
  <div class="bancos-box">
    <div class="b-label">A nombre de: ${e.nombre}</div>
    <div class="b-item">&bull; ${e.banco1}</div>
    <div class="b-item">&bull; ${e.banco2}</div>
  </div>
</div>

<!-- ═══ 9. TÉRMINOS Y CONDICIONES ═══ -->
<div class="section">
  <div class="st">T&Eacute;RMINOS Y CONDICIONES</div>
  <ul class="terms-list">
    <li>La presente cotizaci&oacute;n tiene una vigencia de 15 d&iacute;as calendario a partir de su fecha de emisi&oacute;n.</li>
    <li>La reserva del servicio se confirma mediante el pago del anticipo acordado entre las partes.</li>
    <li>Cualquier servicio o requerimiento adicional no contemplado ser&aacute; cotizado por separado.</li>
    <li>Se emitir&aacute; la Factura Electr&oacute;nica en L&iacute;nea (FEL) por los servicios contratados.</li>
    <li>Todos nuestros veh&iacute;culos son entregados limpios e higienizados. Si al finalizar el servicio se requiere limpieza extraordinaria, se aplicar&aacute; el cargo correspondiente seg&uacute;n la tarifa vigente (Q ${fmt(e.tarifa_limpieza)}).</li>
  </ul>
</div>

<!-- ═══ 10. CIERRE CORPORATIVO ═══ -->
<div class="cierre-box">
  ${e.cierre_corporativo || "Agradecemos la oportunidad de presentar esta propuesta de movilidad. Quedamos atentos para coordinar la ejecuci&oacute;n del servicio y resolver cualquier consulta adicional."}
</div>

<!-- ═══ 11. FIRMA ═══ -->
<div class="firma-box">
  ${e.firma_digital ? `<img src="${e.firma_digital}" alt="Firma" class="firma-img"/>` : ""}
  <div class="f-name">${e.firmante}</div>
  <div class="f-title">${e.cargo_firmante}</div>
  <div class="f-contact">Cel. ${e.tel_firmante} &middot; ${e.email_contacto}</div>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <strong>${e.titulo_footer}</strong><br/>
  ${e.nombre} &middot; ${e.direccion} &middot; ${e.telefono} &middot; ${e.email}
</div>

</div>`;

  // Construir DOM oculto para renderizar el PDF
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;width:750px;opacity:0.01;z-index:-1;pointer-events:none;background:#fff;font-family:Arial,Helvetica,sans-serif;";
  wrapper.innerHTML = `<style>${css}</style>${htmlContent}`;
  document.body.appendChild(wrapper);
  console.log("PDF wrapper contenido:", wrapper.innerHTML.substring(0, 200) + "...");

  // Esperar carga de imágenes
  const imgs = Array.from(wrapper.querySelectorAll("img"));
  if (imgs.length > 0) {
    console.log("PDF esperando " + imgs.length + " imagenes...");
    await Promise.all(
      imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if (img.complete && img.naturalWidth === 0) {
          img.src = img.src;
          return new Promise(r => { img.onload = r; img.onerror = r; });
        }
        return new Promise(r => { img.onload = r; img.onerror = r; });
      })
    );
    console.log("PDF todas las imagenes cargadas");
  }
  await new Promise(r => setTimeout(r, 600));

  // Generar y descargar PDF
  const sanitizar = s => (s || "").replace(/[^a-zA-Z0-9À-ÿ\-_ ]/g, "").trim().replace(/\s+/g, "_").slice(0, 40);
  const filename = `${d.numero || "COT"}-${sanitizar(d.cliente)}.pdf`;

  const isMobile = window.innerWidth < 768;
  const canvasScale = isMobile ? 1.2 : 2;
  // Subir opacidad a 1 justo antes de capturar (opacity baja produce canvas transparente → JPEG blanco)
  wrapper.style.opacity = "1";
  await new Promise(r => requestAnimationFrame(r));

  console.log("PDF wrapper listo — generando con scale=" + canvasScale);

  try {
    const canvas = await window.html2canvas(wrapper, {
      scale: canvasScale, useCORS: true, allowTaint: true, logging: true,
      width: 750,
    });
    console.log("PDF canvas:", canvas.width + "x" + canvas.height);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (mode === "preview") {
      wrapper.style.opacity = "0.01";
      document.body.removeChild(wrapper);
      return imgData;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth() - 16;
    const ph = (canvas.height * pw) / canvas.width;
    pdf.addImage(imgData, "JPEG", 8, 8, pw, ph, undefined, "FAST");
    pdf.save(filename);
  } catch (err) {
    console.error("PDF error:", err);
    alert("Error al generar el PDF: " + (err.message || err));
  }

  wrapper.style.opacity = "0.01";
  document.body.removeChild(wrapper);
}

// Construye datos PDF desde registro guardado
function makePDFData(r) {
  const dias = parseInt(r.dias) || 1;
  const total_ef = parseFloat(r.total_gtq) || 0;
  let svc = {};
  try { svc = JSON.parse(r.servicios_incluidos || "{}"); } catch {}
  return {
    numero: r.numero, fecha: r.fecha_emision || today(), fecha_vence: r.fecha_vence,
    cliente: r.cliente_nombre, codigo: r.cliente_codigo,
    nit: r.cliente_nit, dir: r.cliente_dir, tipo: r.cliente_tipo || "",
    contacto: r.cliente_contacto || "",
    email: r.cliente_email || "", telefono: r.cliente_telefono || "",
    saludo: r.saludo, servicio: r.descripcion_servicio,
    vehiculo: r.vehiculo_nombre, dias,
    incl_piloto: !!svc.piloto || parseFloat(r.costo_piloto) > 0,
    incl_combustible: !!svc.combustible || parseFloat(r.km_total) > 0,
    incl_peajes: !!svc.peajes || parseFloat(r.peajes) > 0,
    incl_hospedaje: !!svc.hospedaje || parseFloat(r.costo_hospedaje) > 0,
    incl_alimentacion: !!svc.alimentacion || parseFloat(r.costo_alimentacion) > 0,
    incl_seguro: svc.seguro !== false,
    sub: parseFloat(r.subtotal) || 0,
    iva_pct: parseFloat(r.tasa_iva) || 5,
    iva_amt: parseFloat(r.total_iva) || 0,
    total_ef,
  };
}

// ─── Estado inicial formulario ────────────────────────────────────────────────
const EMPTY_F = {
  cliente_nombre: "", cliente_nit: "", cliente_dir: "", cliente_codigo: "",
  cliente_tipo: "", cliente_contacto: "", cliente_email: "", cliente_telefono: "",
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
      cliente_tipo: initial.cliente_tipo || "", cliente_contacto: initial.cliente_contacto || "",
      cliente_email: initial.cliente_email || "", cliente_telefono: initial.cliente_telefono || "",
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
  const rate = parseFloat(f.precio_custom) > 0 ? parseFloat(f.precio_custom) : (vehObj ? tarifaFn(vehObj, dias) : parseFloat(initial?.costo_vehiculo) || 0);
  const sub_veh = dias * rate;
  const cp = parseFloat(f.costo_piloto) || 0;
  const ch = parseFloat(f.costo_hospedaje) || 0;
  const ca = parseFloat(f.costo_alimentacion) || 0;
  const sub_piloto = f.incl_piloto ? cp : 0;
  const sub_hos = f.incl_hospedaje ? ch : 0;
  const sub_ali = f.incl_alimentacion ? ca : 0;
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
        tipo: "renta", cliente_tipo: f.cliente_tipo || "", cliente_contacto: f.cliente_contacto || "",
        cliente_email: f.cliente_email || "", cliente_telefono: f.cliente_telefono || "",
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
                    sf("cliente_tipo", c.tipo || ""); sf("cliente_contacto", c.contacto || "");
                    sf("cliente_email", c.email || ""); sf("cliente_telefono", c.telefono || "");
                    const nom = c.nombre || "";
                    const tipo = c.tipo || "empresa";
                    let saludo = "";
                    if (tipo === "persona") {
                      const pn = nom.trim().split(/\s+/)[0] || "";
                      saludo = (pn.endsWith("a") ? "Estimada " : "Estimado ") + nom + ", reciba un atento saludo. En Transportes Tz'unun nos ponemos a sus ordenes para brindarle el mejor servicio de movilidad.";
                    } else if (tipo === "gobierno") {
                      saludo = "Distinguidos representantes de " + nom + ": Por este medio, nos dirigimos a ustedes para presentar nuestra propuesta de servicios de transporte institucional.";
                    } else if (["ong", "asociacion", "asociación", "cooperativa", "colectivo", "comite", "comité", "grupo", "social"].includes(tipo)) {
                      saludo = "Estimados representantes de " + nom + ": Reciban un cordial saludo de parte de Transportes Tz'unun. Agradecemos la oportunidad de presentar nuestra propuesta de movilidad.";
                    } else {
                      saludo = "Estimados senores de " + nom + ": Por medio de la presente, nos complace presentar nuestra propuesta de servicios de movilidad corporativa.";
                    }
                    sf("saludo", saludo);
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
              <div><label style={S.lbl}>TELEFONO</label><input style={S.inp} value={f.cliente_telefono} onChange={e => sf("cliente_telefono", e.target.value)} placeholder="(502) 0000-0000" /></div>
              <div><label style={S.lbl}>CORREO</label><input style={S.inp} type="email" value={f.cliente_email} onChange={e => sf("cliente_email", e.target.value)} placeholder="correo@empresa.com" /></div>
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
              {f.incl_piloto && <Fld label="COSTO PILOTO TOTAL (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_piloto} onChange={e => sf("costo_piloto", e.target.value)} placeholder="0.00" /></Fld>}
              {f.incl_hospedaje && <Fld label="HOSPEDAJE TOTAL (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_hospedaje} onChange={e => sf("costo_hospedaje", e.target.value)} placeholder="0.00" /></Fld>}
              {f.incl_alimentacion && <Fld label="ALIMENTACION TOTAL (Q)"><input style={S.inp} type="number" step="0.01" value={f.costo_alimentacion} onChange={e => sf("costo_alimentacion", e.target.value)} placeholder="0.00" /></Fld>}
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
  const [previewData, setPreviewData] = useState(null);

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
      saludo: cot.saludo || "",
      cliente_tipo: cot.cliente_tipo || "",
      cliente_contacto: cot.cliente_contacto || "",
      cliente_email: cot.cliente_email || "",
      cliente_telefono: cot.cliente_telefono || "",
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
                  <button onClick={async () => {
                    const d = makePDFData(r);
                    const dataUrl = await generarPDFPremium(d, empId, "preview");
                    const sanitizar = s => (s || "").replace(/[^a-zA-Z0-9À-ÿ\-_ ]/g, "").trim().replace(/\s+/g, "_").slice(0, 40);
                    setPreviewData({ dataUrl, filename: `${r.numero || "COT"}-${sanitizar(r.cliente_nombre)}.pdf`, d, e: empId });
                  }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Vista Previa</button>
                  <button onClick={() => generarPDFPremium(makePDFData(r), empId, "download")} style={{ ...S.btn("blue"), fontSize: 11, padding: "4px 9px" }}>Descargar PDF</button>
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

      {previewData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPreviewData(null)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: "92vw", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2D5C", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Vista previa de cotizaci&oacute;n</span>
              <button onClick={() => setPreviewData(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94A3B8", padding: "2px 8px", borderRadius: 6 }}>&times;</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", textAlign: "center", background: "#F1F5F9", borderRadius: 8, padding: 8 }}>
              <img src={previewData.dataUrl} style={{ maxWidth: "100%", maxHeight: "75vh", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", borderRadius: 4 }} alt="Vista previa" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setPreviewData(null)} style={{ ...S.btn("ghost"), fontSize: 12 }}>Cerrar</button>
              <button onClick={() => { setPreviewData(null); generarPDFPremium(previewData.d, previewData.e, "download"); }} style={{ ...S.btn("primary"), fontSize: 12 }}>Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
