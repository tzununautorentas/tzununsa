// src/pages/Facturacion.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO FACTURACIÓN FEL — Tz'ununSA
// Tabla: facturas (confirmada en Supabase)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, api, TIPOS_SERVICIO } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, Paginador, Buscador, generarPDF } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';
import ImportadorSAT from '../components/ImportadorSAT.jsx';
import ImportadorXML from '../components/ImportadorXML.jsx';
import ImportadorPDF from '../components/ImportadorPDF.jsx';

// ─── Estados de factura ───────────────────────────────────────────
const ESTADOS = {
  borrador:    { c: T.mut,   bg: '#1E293B',  l: 'Borrador'     },
  emitida:     { c: T.blue,  bg: T.blueDim,  l: 'Emitida'      },
  certificada: { c: T.acc,   bg: T.accDim,   l: 'Certificada'  },
  pagada:      { c: T.green, bg: T.greenDim, l: 'Pagada'       },
  parcial:     { c: T.sec,   bg: T.secDim,   l: 'Pago parcial' },
  anulada:     { c: T.red,   bg: T.redDim,   l: 'Anulada'      },
};

const EF = {
  numero_factura: '', numero: '', serie: '', fecha: today(),
  fecha_hora_emision: '', fecha_vencimiento: '',
  tipo_dte: 'FACT', moneda: 'GTQ', tasa_cambio: 1, condicion_pago: 'contado',
  numero_autorizacion: '', fecha_certificacion: '',
  cliente_nombre: '', cliente_nit: 'CF', cliente_id: '',
  direccion_receptor: '', municipio_receptor: '', departamento_receptor: '',
  codigo_postal_receptor: '', correo_receptor: '', telefono_receptor: '',
  numero_cuenta: '', total_descuentos: 0,
  descripcion: '', lineas: [], subtotal: '', tasa_iva: 12, impuestos: '', total: '',
  metodo_pago: 'efectivo', estado: 'borrador', notas: '', reserva_id: '',
  emisor_id: '',
};

// ─── Utilidades para el PDF ────────────────────────────────────────
const fmtFH = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 16);
  return d.toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const generarQRdata = (texto) => new Promise((resolve, reject) => {
  const gen = () => {
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(texto || '');
      qr.make();
      resolve(qr.createDataURL(5, 4));
    } catch (e) { reject(e); }
  };
  if (window.qrcode) return gen();
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  s.onload = () => gen();
  s.onerror = () => reject(new Error('No se pudo cargar el generador QR'));
  document.head.appendChild(s);
});

// ─── Imprimir factura (PDF FEL) ────────────────────────────────────
const imprimirFactura = async (r, emisor) => {
  const em = emisor || {};
  const nombreEnt = em.nombre_entidad || 'Tz\'unun AutoRentas';
  const dirEnt    = em.direccion || 'Guatemala City, Guatemala';
  const nitEnt    = em.nit || r.nit_emisor || '';
  const telEnt    = em.telefono || '';
  const propietario = em.responsable || '';
  const regimen = (r.regimen || (r.tasa_iva == 5 ? 'PEQUENIO' : 'GENERAL'));
  const esPequeno = regimen === 'PEQUENIO' || (r.tipo_dte || '').toUpperCase().includes('FPEQ') || (r.tasa_iva == 5);
  const qrBydoc = r.qr_imagen ? null : (r.numero_autorizacion || `${r.serie || ''}${r.serie ? '-' : ''}${r.numero_factura || r.numero || ''}`);
  let qrImg = r.qr_imagen || '';
  if (!qrImg) { try { qrImg = await generarQRdata(qrBydoc); } catch {} }
  const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Arial',sans-serif;padding:32px;font-size:11px;color:#1E293B;background:#fff}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #1B2D5C}
.logo-area h1{color:#1B2D5C;font-size:20px;font-weight:800;margin-bottom:4px}
.logo-area p{color:#64748B;font-size:10px}
.factura-info{text-align:right}
.factura-info .num{font-size:18px;font-weight:800;color:#1B2D5C}
.factura-info p{font-size:10px;color:#64748B;margin-top:2px}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;background:#00D4AA22;color:#00D4AA;margin-top:4px}
.aut-box{display:flex;justify-content:space-between;align-items:center;background:#0B1F4B;color:#fff;border-radius:8px;padding:10px 16px;margin-bottom:20px}
.aut-box .qr{background:#fff;padding:6px;border-radius:6px;width:74px;height:74px;display:flex;align-items:center;justify-content:center}
.aut-box .qr img{width:62px;height:62px}
.aut-box .aut-info{font-size:10px;line-height:1.7;word-break:break-all}
.aut-box .aut-info strong{font-size:12px;color:#00D4AA}
.section{margin-bottom:20px}
.section-title{font-size:9px;font-weight:700;color:#94A3B8;letter-spacing:1.5px;margin-bottom:8px}
.client-box{background:#F8FAFC;border-radius:8px;padding:14px;border-left:3px solid #1B2D5C}
.client-box strong{font-size:13px;color:#1B2D5C}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead tr{background:#1B2D5C}
th{color:#fff;padding:8px 12px;text-align:left;font-size:10px;font-weight:600}
td{padding:8px 12px;border-bottom:1px solid #E2E8F0;font-size:11px}
.amounts{margin-left:auto;width:280px}
.amount-row{display:flex;justify-content:space-between;padding:5px 0;font-size:11px;color:#475569}
.amount-total{display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #1B2D5C;font-size:16px;font-weight:800;color:#1B2D5C}
.qr-ley{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:18px;padding-top:16px;border-top:2px solid #1B2D5C}
.qr-box{display:flex;flex-direction:column;align-items:center}
.qr-box img{width:110px;height:110px;border:1px solid #E2E8F0;padding:6px;border-radius:8px;background:#fff}
.qr-box .qr-tit{font-size:9px;font-weight:700;color:#1B2D5C;margin-top:6px}
.leyendas{flex:1;font-size:9px;color:#475569;line-height:1.7;text-align:right}
.gris-claro{background:#F8FAFC;padding:8px 12px;border-radius:6px}
.footer{margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;text-align:center;font-size:9px;color:#94A3B8}
`;
  const detalle = Array.isArray(r.detalles) && r.detalles.length ? r.detalles : null;
  const filasDet = detalle ? detalle.map((x, i) => `
      <tr>
        <td>${i + 1}. ${[x.tipo_servicio, x.descripcion].filter(Boolean).map(s => s.trim()).join(' — ')}</td>
        <td style="text-align:right">${x.cantidad || 1}</td>
        <td style="text-align:right">Q ${fmt(x.precio_unitario)}</td>
        <td style="text-align:right;font-weight:600">Q ${fmt(x.total_linea || x.precio)}</td>
      </tr>`).join('') : `
      <tr><td>${r.descripcion || 'Servicios de transporte y renta'}</td>
      <td style="text-align:right">1</td>
      <td style="text-align:right">Q ${fmt(r.subtotal)}</td>
      <td style="text-align:right;font-weight:600">Q ${fmt(r.subtotal)}</td></tr>`;
  const descTotal = parseFloat(r.total_descuentos) || 0;
  const numDoc = r.numero_factura || r.numero || '—';
  const html = `
<div class="header">
  <div class="logo-area">
    <h1>${nombreEnt}</h1>
    ${propietario ? `<p style="font-weight:700;color:#1B2D5C">Propietario: ${propietario}</p>` : ''}
    ${em.eslogan ? `<p>${em.eslogan}</p>` : ''}
    <p>${dirEnt}</p>
    ${nitEnt ? `<p>NIT: ${nitEnt}</p>` : ''}
    ${telEnt ? `<p>Tel: ${telEnt}</p>` : ''}
  </div>
  <div class="factura-info">
    <div class="num">FACTURA ${r.tipo_dte || 'FEL'}</div>
    <p>No. ${numDoc}</p>
    ${r.serie ? `<p>Serie: ${r.serie}</p>` : ''}
    <p>Fecha y hora de emision: ${r.fecha_hora_emision ? fmtFH(r.fecha_hora_emision) : fmtD(r.fecha)}</p>
    ${r.fecha_certificacion ? `<p>Fecha y hora de certificacion: ${fmtFH(r.fecha_certificacion)}</p>` : ''}
    ${r.condicion_pago ? `<p>Condicion: ${r.condicion_pago}${r.fecha_vencimiento ? ` · Vence: ${fmtD(r.fecha_vencimiento)}` : ''}</p>` : ''}
    ${r.moneda ? `<p>Moneda: ${r.moneda}${r.tasa_cambio > 1 ? ` (TC ${r.tasa_cambio})` : ''}</p>` : ''}
    <div class="badge">${ESTADOS[r.estado]?.l || r.estado}</div>
  </div>
</div>
${(r.numero_autorizacion || numDoc) ? `
<div class="aut-box">
  <div class="aut-info">
    <strong>No. de autorizacion: ${r.numero_autorizacion || numDoc}</strong>
    ${r.numero_acceso ? `<div>No. de acceso: ${r.numero_acceso}</div>` : ''}
    <div>Serie ${r.serie || '—'} · No. ${numDoc}</div>
    ${r.fecha_certificacion ? `<div>Fecha y hora de certificacion: ${fmtFH(r.fecha_certificacion)}</div>` : ''}
  </div>
</div>` : ''}
<div class="section">
  <div class="section-title">DATOS DEL CLIENTE</div>
  <div class="client-box">
    <strong>${r.cliente_nombre || r.nombre_receptor || 'Consumidor Final'}</strong>
    <p style="margin-top:4px;color:#475569">NIT: ${r.cliente_nit || r.nit_receptor || 'CF'}</p>
    ${r.direccion_receptor ? `<p style="margin-top:2px;color:#94A3B8">${r.direccion_receptor}</p>` : ''}
    ${(r.municipio_receptor || r.departamento_receptor) ? `<p style="margin-top:2px;color:#94A3B8">${r.municipio_receptor || ''}${r.municipio_receptor && r.departamento_receptor ? ', ' : ''}${r.departamento_receptor || ''}</p>` : ''}
    ${r.correo_receptor ? `<p style="margin-top:2px;color:#94A3B8">${r.correo_receptor}</p>` : ''}
    ${r.telefono_receptor ? `<p style="margin-top:2px;color:#94A3B8">Tel: ${r.telefono_receptor}</p>` : ''}
  </div>
</div>
<div class="section">
  <div class="section-title">DETALLE DEL SERVICIO</div>
  <table>
    <thead><tr><th>Descripcion</th><th style="text-align:right">Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${filasDet}</tbody>
  </table>
</div>
<div class="amounts">
  <div class="amount-row"><span>Subtotal</span><span>Q ${fmt(r.subtotal)}</span></div>
  ${descTotal > 0 ? `<div class="amount-row"><span>Descuentos</span><span>-Q ${fmt(descTotal)}</span></div>` : ''}
  <div class="amount-row"><span>IVA (${r.tasa_iva || 12}%)</span><span>Q ${fmt(r.impuestos)}</span></div>
  <div class="amount-total"><span>TOTAL</span><span>Q ${fmt(r.total)}</span></div>
</div>
<div class="qr-ley">
  <div style="display:flex;gap:18px;align-items:flex-start">
    <div class="qr-box">
      ${qrImg ? `<img src="${qrImg}" alt="QR FEL"/>` : `<div class="gris-claro" style="width:110px;height:110px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:9px;text-align:center">QR no disponible</div>`}
      <div class="qr-tit">Codigo QR de verificacion</div>
    </div>
    <div>
      ${esPequeno ? `<div style="font-size:10px;font-weight:700;color:#1B2D5C;margin-bottom:8px">Factura de Pequenio Contribuyente</div>` : ''}
      <div style="font-size:10px;color:#475569;line-height:1.8">
        ${r.metodo_pago ? `<div>Metodo de pago: ${r.metodo_pago}${r.numero_cuenta ? ` · Numero de cuenta: ${r.numero_cuenta}` : ''}</div>` : ''}
        ${r.total_descuentos > 0 ? `<div>Descuento aplicado: Q ${fmt(descTotal)}</div>` : ''}
        ${r.pais_receptor ? `<div>Pais receptor: ${r.pais_receptor}</div>` : ''}
      </div>
    </div>
  </div>
  <div class="leyendas">
    ${esPequeno ? `<div>* No genera derecho a credito fiscal.</div>` : ''}
    ${r.textos_frases ? `<div>${r.textos_frases.replace(/\|/g, ' · ')}</div>` : ''}
    <div>Datos del certificador: Superintendencia de Administracion Tributaria (SAT)</div>
    <div>NIT: 16693949 · Ciudad de Guatemala, Guatemala</div>
  </div>
</div>
<div class="footer">
  Documento generado por Tz'unun AutoRentas &nbsp;|&nbsp;
  ${new Date().toLocaleDateString('es-GT', { day:'2-digit', month:'long', year:'numeric' })}
</div>`;
  generarPDF({ html, css, filename: `FEL_${numDoc.replace(/[^A-Za-z0-9_-]/g, '')}.pdf` });
};

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function PageFacturacion({ showToast, empId, userEmail }) {
  const [vista,    setVista]    = useState('lista');
  const [editItem, setEditItem] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [filtro,   setFiltro]   = useState('todos');
  const [filtroEm, setFiltroEm] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [exportar, setExportar] = useState(false);
  const [showSAT,  setShowSAT]  = useState(false);
  const [showXML,  setShowXML]  = useState(false);
  const [showPDF,  setShowPDF]  = useState(false);
  const [emisores, setEmisores] = useState([]);
  const [cuentas,  setCuentas]  = useState([]);
  const [f,        setF]        = useState({ ...EF });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const queryFact = [
    filtro !== 'todos' ? 'estado=eq.'+filtro : '',
    filtroEm ? 'emisor_id=eq.'+filtroEm : '',
  ].filter(Boolean).join('&');
  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload, desde, hasta } = usePaginacion({
    table: 'facturas',
    query: queryFact,
    search: busqueda,
    columns: ['cliente_nombre', 'cliente_nit', 'numero_factura', 'numero', 'serie', 'descripcion', 'numero_autorizacion'],
    order: 'created_at.desc',
  });

  useEffect(() => {
    dbGet("emisores", `&empresa_id=eq.${empId}&order=nombre_entidad.asc`).then(d => {
      setEmisores(Array.isArray(d) ? d : []);
    });
    dbGet("cuentas_bancarias", `&empresa_id=eq.${empId}&select=id,banco,numero_cuenta`).then(d => {
      setCuentas(Array.isArray(d) ? d : []);
    });
  }, [empId]);

  const emisorDeUsuario = () => {
    if (!userEmail || emisores.length === 0) return '';
    const em = emisores.find(e => (e.user_email || '').toLowerCase() === userEmail.toLowerCase());
    return em ? em.id : (emisores[0]?.id || '');
  };

  // ─── Control por entidad (reporte) ─────────────────────────────
  const [controlEnt, setControlEnt] = useState(null);
  const cargarControl = async () => {
    const [pagos, facs] = await Promise.all([
      dbGet("pagos_recibidos", `&empresa_id=eq.${empId}&select=id,monto,emisor_id,cuenta_bancaria_id,fecha`),
      dbGet("facturas", `&empresa_id=eq.${empId}&select=id,total,estado,emisor_id`),
    ]);
    const res = (emisores.length ? emisores : [{ id: "", nombre_entidad: "Sin emisor" }]).map(em => {
      const fact = (Array.isArray(facs) ? facs : []).filter(x => (x.emisor_id || "") === (em.id || "") && x.estado !== "anulada");
      const pg    = (Array.isArray(pagos) ? pagos : []).filter(x => (x.emisor_id || "") === (em.id || ""));
      const facturado = fact.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
      const cobrado   = pg.reduce((s, x) => s + (parseFloat(x.monto) || 0), 0);
      const porCuenta = {};
      for (const p of pg) {
        const cid = p.cuenta_bancaria_id || "sin_cuenta";
        porCuenta[cid] = (porCuenta[cid] || 0) + (parseFloat(p.monto) || 0);
      }
      return { em, facturado, facturas: fact.length, cobrado, pendiente: facturado - cobrado, porCuenta };
    });
    setControlEnt(res);
  };
  useEffect(() => { if (empId && emisores.length > 0 && !controlEnt) cargarControl(); }, [empId, emisores]);

  // ─── Calcular IVA y total ──────────────────────────────────────
  const calcular = (sub, tasaIva) => {
    const s = parseFloat(sub) || 0;
    const t = parseInt(tasaIva) || 0;
    const imp = Math.round(s * (t / 100) * 100) / 100;
    setF(p => ({ ...p, impuestos: imp.toFixed(2), total: (s + imp).toFixed(2) }));
  };

  // ─── Lineas de cobro (desglose del servicio) ───────────────────
  const subtotalLineas = (lineas) => (lineas || []).reduce(
    (s, l) => s + ((parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0)), 0);
  const recalcularLineas = (lineas, tasaIva) => {
    const s = Math.round(subtotalLineas(lineas) * 100) / 100;
    const t = parseInt(tasaIva) || 0;
    const imp = Math.round(s * (t / 100) * 100) / 100;
    return { subtotal: s ? s.toFixed(2) : '', impuestos: imp.toFixed(2), total: (s + imp).toFixed(2) };
  };
  const setLineaVal = (i, campo, val) => setF(p => {
    const lineas = (p.lineas || []).map((l, idx) => idx === i ? { ...l, [campo]: val } : l);
    return { ...p, lineas, ...recalcularLineas(lineas, p.tasa_iva) };
  });
  const agregarLinea = () => setF(p => ({ ...p, lineas: [...(p.lineas || []), { tipo_servicio: '', servicio_x: '', descripcion: '', cantidad: 1, precio_unitario: '' }] }));
  const quitarLinea = (i) => setF(p => {
    const lineas = (p.lineas || []).filter((_, idx) => idx !== i);
    return { ...p, lineas, ...recalcularLineas(lineas, p.tasa_iva) };
  });

  // ─── Abrir nuevo ──────────────────────────────────────────────
  const abrirNuevo = () => {
    const numero = 'FEL-' + Date.now().toString().slice(-6);
    setF({ ...EF, numero_factura: numero, numero: numero, fecha: today(), emisor_id: emisorDeUsuario() });
    setEditItem(null);
    setVista('form');
  };

  // ─── Abrir editar ─────────────────────────────────────────────
  const abrirEditar = (r) => {
    const det = Array.isArray(r.detalles) ? r.detalles : [];
    setF({
      numero_factura: r.numero_factura || r.numero || '',
      numero:         r.numero || r.numero_factura || '',
      serie:          r.serie          || '',
      fecha:          r.fecha          || today(),
      fecha_hora_emision: r.fecha_hora_emision || '',
      fecha_vencimiento: r.fecha_vencimiento || '',
      tipo_dte:       r.tipo_dte       || 'FACT',
      moneda:         r.moneda         || 'GTQ',
      tasa_cambio:    r.tasa_cambio    ?? 1,
      condicion_pago: r.condicion_pago || 'contado',
      numero_autorizacion: r.numero_autorizacion || '',
      fecha_certificacion: r.fecha_certificacion || '',
      cliente_nombre: r.cliente_nombre || '',
      cliente_nit:    r.cliente_nit    || 'CF',
      cliente_id:     r.cliente_id     || '',
      direccion_receptor: r.direccion_receptor || '',
      municipio_receptor: r.municipio_receptor || '',
      departamento_receptor: r.departamento_receptor || '',
      codigo_postal_receptor: r.codigo_postal_receptor || '',
      correo_receptor: r.correo_receptor || '',
      telefono_receptor: r.telefono_receptor || '',
      numero_cuenta:  r.numero_cuenta  || '',
      total_descuentos: r.total_descuentos || 0,
      descripcion:    det.length ? det.map(x => x.descripcion).join(' | ') : (r.descripcion || ''),
      lineas:         det.length ? det.map(x => ({
        tipo_servicio:  x.tipo_servicio || '',
        servicio_x:     x.servicio_x || '',
        descripcion:    x.descripcion || '',
        cantidad:       x.cantidad || 1,
        precio_unitario: x.precio_unitario != null ? x.precio_unitario : (x.precio || ''),
      })) : [],
      subtotal:       r.subtotal       || '',
      tasa_iva:       r.tasa_iva       ?? 12,
      impuestos:      r.impuestos      || '',
      total:          r.total          || '',
      metodo_pago:    r.metodo_pago    || 'efectivo',
      estado:         r.estado         || 'borrador',
      notas:          r.notas          || '',
      reserva_id:     r.reserva_id     || '',
      emisor_id:      r.emisor_id      || emisorDeUsuario(),
    });
    setEditItem(r);
    setVista('form');
  };

  // ─── Guardar factura ──────────────────────────────────────────
  const guardar = async () => {
    // Validaciones explícitas
    if (!f.cliente_nombre.trim()) {
      showToast('El nombre del cliente es requerido', 'err'); return;
    }
    if (!f.fecha) {
      showToast('La fecha es requerida', 'err'); return;
    }
    if (!(parseFloat(f.total) > 0)) {
      showToast('El total debe ser mayor a 0', 'err'); return;
    }
    if (!empId) {
      showToast('Error: empresa no identificada. Recarga la pagina.', 'err'); return;
    }

    setSaving(true);
    try {
      const payload = {
        empresa_id:     empId,
        emisor_id:      f.emisor_id        || null,
        numero_factura: f.numero_factura || ('FEL-' + Date.now().toString().slice(-6)),
        numero:         f.numero_factura || f.numero || ('FEL-' + Date.now().toString().slice(-6)),
        serie:          f.serie          || null,
        fecha:          f.fecha,
        fecha_hora_emision: f.fecha_hora_emision || null,
        fecha_vencimiento: f.fecha_vencimiento || null,
        tipo_dte:       f.tipo_dte       || 'FACT',
        moneda:         f.moneda         || 'GTQ',
        tasa_cambio:    parseFloat(f.tasa_cambio) || 1,
        condicion_pago: f.condicion_pago || 'contado',
        numero_autorizacion: f.numero_autorizacion || null,
        fecha_certificacion: f.fecha_certificacion || null,
        cliente_nombre: f.cliente_nombre.trim(),
        cliente_nit:    f.cliente_nit.trim() || 'CF',
        cliente_id:     f.cliente_id     || null,
        direccion_receptor: f.direccion_receptor || null,
        municipio_receptor: f.municipio_receptor || null,
        departamento_receptor: f.departamento_receptor || null,
        codigo_postal_receptor: f.codigo_postal_receptor || null,
        correo_receptor: f.correo_receptor || null,
        telefono_receptor: f.telefono_receptor || null,
        numero_cuenta:  f.numero_cuenta  || null,
        total_descuentos: parseFloat(f.total_descuentos) || 0,
        descripcion:    (f.lineas || []).length
        ? f.lineas
            .map(l => [l.tipo_servicio, l.descripcion].filter(Boolean).map(s => s.trim()).join(' — '))
            .filter(Boolean).join(' | ')
        : (f.descripcion || null),
        detalles:       (f.lineas || []).length ? f.lineas.map((l, i) => ({
          numero_linea:    i + 1,
          bien_servicio:   'Servicio',
          tipo_servicio:   l.tipo_servicio || l.servicio_x || '',
          servicio_x:      l.servicio_x || '',
          cantidad:        parseFloat(l.cantidad) || 1,
          unidad_medida:   'UNI',
          descripcion:     [l.tipo_servicio, l.servicio_x, l.descripcion].filter(Boolean).map(s => s.trim()).join(' — ') || 'Servicio',
          precio_unitario: parseFloat(l.precio_unitario) || 0,
          precio:          (parseFloat(l.cantidad) || 1) * (parseFloat(l.precio_unitario) || 0),
          total_linea:     (parseFloat(l.cantidad) || 1) * (parseFloat(l.precio_unitario) || 0),
        })) : null,
        subtotal:       parseFloat(f.subtotal)  || 0,
        tasa_iva:       parseInt(f.tasa_iva)    || 12,
        impuestos:      parseFloat(f.impuestos) || 0,
        total:          parseFloat(f.total)     || 0,
        metodo_pago:    f.metodo_pago    || 'efectivo',
        estado:         f.estado         || 'borrador',
        notas:          f.notas          || null,
        reserva_id:     f.reserva_id     || null,
      };

      if (editItem?.id) {
        await api(`/facturas?id=eq.${editItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('Factura actualizada');
      } else {
        await api('/facturas', {
          method: 'POST',
          body: JSON.stringify(payload),
          extraHeaders: { Prefer: 'return=minimal' },
        });
        showToast('Factura creada correctamente');
      }

      setVista('lista');
      setEditItem(null);
      reload();
    } catch (e) {
      showToast('Error al guardar: ' + e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────
  const del = async (id) => {
    if (!confirm('Eliminar esta factura?')) return;
    try {
      await api(`/facturas?id=eq.${id}`, { method: 'DELETE' });
      showToast('Factura eliminada');
      reload();
    } catch (e) {
      showToast('Error al eliminar: ' + e.message, 'err');
    }
  };

  // ─── Cambiar estado ───────────────────────────────────────────
  const cambiarEstado = async (id, estado) => {
    try {
      await api(`/facturas?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
      showToast('Estado actualizado');
      reload();
    } catch (e) {
      showToast('Error: ' + e.message, 'err');
    }
  };

  const totales = {
    facturado:  rows.filter(r => r.estado !== 'anulada').reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
    cobrado:    rows.filter(r => r.estado === 'pagada').reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
    pendiente:  rows.filter(r => ['emitida','certificada','parcial'].includes(r.estado)).reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
    anuladas:   rows.filter(r => r.estado === 'anulada').length,
  };

  const cuentaBancariaNombre = (id) => {
    const c = cuentas.find(x => x.id === id);
    return c ? (`${c.banco || ''}${c.numero_cuenta ? ' ' + c.numero_cuenta : ''}`.trim() || '—') : '—';
  };

  // ════════════════════════════════════════════════════════════════
  // VISTA: FORMULARIO
  // ════════════════════════════════════════════════════════════════
  if (vista === 'form') return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>
            {editItem ? 'Editar factura' : 'Nueva factura FEL'}
          </div>
          {editItem && (
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
              {editItem.numero_factura}
            </div>
          )}
        </div>
        <button onClick={() => { setVista('lista'); setEditItem(null); }} style={S.btn('ghost')}>
          Volver
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>
              DATOS DE FACTURA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <Fld label="EMISOR (ENTIDAD QUE FACTURA)" >
                <select style={S.sel} value={f.emisor_id || ''}
                  onChange={e => sf('emisor_id', e.target.value)}>
                  <option value="">Seleccionar emisor...</option>
                  {emisores.map(em => (
                    <option key={em.id} value={em.id}>
                      {em.nombre_entidad}{em.responsable ? ` — ${em.responsable}` : ''}
                    </option>
                  ))}
                </select>
              </Fld>
              <Fld label="NUMERO FACTURA">
                <input style={{ ...S.inp, fontFamily: 'monospace', fontWeight: 700 }}
                  value={f.numero_factura}
                  onChange={e => { const v = e.target.value; setF(p => ({ ...p, numero_factura: v, numero: v })); }}
                  placeholder="FEL-000001" />
              </Fld>
              <Fld label="SERIE">
                <input style={S.inp} value={f.serie}
                  onChange={e => sf('serie', e.target.value.toUpperCase())}
                  placeholder="A" />
              </Fld>
              <Fld label="FECHA *">
                <input style={S.inp} type="date" value={f.fecha}
                  onChange={e => sf('fecha', e.target.value)} />
              </Fld>
              <Fld label="TIPO DE DOCUMENTO">
                <select style={S.sel} value={f.tipo_dte} onChange={e => sf('tipo_dte', e.target.value)}>
                  {['FACT', 'FPEQ', 'CCF', 'FCF', 'NF', 'NC'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Fld>
              <Fld label="MONEDA">
                <select style={S.sel} value={f.moneda} onChange={e => sf('moneda', e.target.value)}>
                  <option value="GTQ">GTQ — Quetzales</option>
                  <option value="USD">USD — Dolares</option>
                  <option value="EUR">EUR — Euros</option>
                </select>
              </Fld>
              {f.moneda !== 'GTQ' && (
                <Fld label="TIPO DE CAMBIO">
                  <input style={S.inp} type="number" step="0.0001" value={f.tasa_cambio}
                    onChange={e => sf('tasa_cambio', e.target.value)} placeholder="7.50" />
                </Fld>
              )}
              <Fld label="CONDICION DE PAGO">
                <select style={S.sel} value={f.condicion_pago} onChange={e => sf('condicion_pago', e.target.value)}>
                  <option value="contado">Contado</option>
                  <option value="credito">Credito</option>
                </select>
              </Fld>
              <Fld label="FECHA VENCIMIENTO">
                <input style={S.inp} type="date" value={f.fecha_vencimiento}
                  onChange={e => sf('fecha_vencimiento', e.target.value)} />
              </Fld>
              <Fld label="NO. AUTORIZACION / CERTIFICACION">
                <input style={{ ...S.inp, fontFamily: 'monospace', fontSize: 11 }}
                  value={f.numero_autorizacion}
                  onChange={e => sf('numero_autorizacion', e.target.value)}
                  placeholder="UUID de certificacion SAT" />
              </Fld>
              <Fld label="ESTADO">
                <select style={S.sel} value={f.estado}
                  onChange={e => sf('estado', e.target.value)}>
                  {Object.entries(ESTADOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.l}</option>
                  ))}
                </select>
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>
              CLIENTE *
            </div>
            <div style={{ display: 'grid', gap: 11 }}>
              <Fld label="NOMBRE / RAZON SOCIAL *">
                <BuscadorCliente value={f.cliente_nombre}
                  onChange={v => sf('cliente_nombre', v)} empId={empId} />
              </Fld>
              <Fld label="NIT DEL CLIENTE">
                <input style={S.inp} value={f.cliente_nit}
                  onChange={e => sf('cliente_nit', e.target.value)}
                  placeholder="CF o NIT del cliente" />
              </Fld>
              <Fld label="DIRECCION">
                <input style={S.inp} value={f.direccion_receptor}
                  onChange={e => sf('direccion_receptor', e.target.value)}
                  placeholder="Calle, numero, zona, ciudad" />
              </Fld>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <Fld label="MUNICIPIO">
                  <input style={S.inp} value={f.municipio_receptor}
                    onChange={e => sf('municipio_receptor', e.target.value)} placeholder="Guatemala" />
                </Fld>
                <Fld label="DEPARTAMENTO">
                  <input style={S.inp} value={f.departamento_receptor}
                    onChange={e => sf('departamento_receptor', e.target.value)} placeholder="Guatemala" />
                </Fld>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <Fld label="CORREO">
                  <input style={S.inp} type="email" value={f.correo_receptor}
                    onChange={e => sf('correo_receptor', e.target.value)} placeholder="cliente@correo.com" />
                </Fld>
                <Fld label="TELEFONO">
                  <input style={S.inp} value={f.telefono_receptor}
                    onChange={e => sf('telefono_receptor', e.target.value)} placeholder="502-00000000" />
                </Fld>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>
              DESGLOSE DEL SERVICIO (LINEAS DE COBRO)
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(f.lineas || []).map((l, i) => (
                <div key={i} style={{ border: `1px solid ${T.bord}`, borderRadius: 10, padding: 10, background: T.card }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 34px', gap: 6, alignItems: 'center' }}>
                    <select style={S.sel} value={l.tipo_servicio}
                      onChange={e => setLineaVal(i, 'tipo_servicio', e.target.value)}>
                      <option value="">Tipo de servicio...</option>
                      {TIPOS_SERVICIO.map(ts => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                    <input style={S.inp} value={l.descripcion}
                      onChange={e => setLineaVal(i, 'descripcion', e.target.value)}
                      placeholder="Descripcion (ej: Hyundai Verna 14 dias, chofer 3 dias...)" />
                    <button onClick={() => quitarLinea(i)} title="Quitar linea"
                      style={{ ...S.btn('danger'), padding: '5px 9px', fontSize: 12 }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 120px 1fr', gap: 6, marginTop: 8, alignItems: 'center' }}>
                    <input style={S.inp} type="number" min="1" value={l.cantidad}
                      onChange={e => setLineaVal(i, 'cantidad', e.target.value)}
                      placeholder="Cant." title="Cantidad" />
                    <input style={S.inp} type="number" step="0.01" value={l.precio_unitario}
                      onChange={e => setLineaVal(i, 'precio_unitario', e.target.value)}
                      placeholder="P. unit." title="Precio unitario" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Q {fmt((parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0))}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={agregarLinea}
                style={{ ...S.btn('blue'), padding: '8px 12px', fontSize: 12 }}>
                + Agregar linea de cobro
              </button>
            </div>
            {!(f.lineas || []).length && (
              <div style={{ marginTop: 10 }}>
                <Fld label="DESCRIPCION GENERAL (opcional, si no usas lineas)">
                  <textarea style={{ ...S.inp, minHeight: 60, resize: 'vertical' }}
                    value={f.descripcion}
                    onChange={e => sf('descripcion', e.target.value)}
                    placeholder="O escribi una descripcion simple..." />
                </Fld>
              </div>
            )}
            <div style={{ fontSize: 10, color: T.mut, marginTop: 8, lineHeight: 1.6 }}>
              Usa las lineas para desglosar cada servicio cobrado: elegi el TIPO DE SERVICIO (ej: Alquiler de vehiculo, Limpieza de vehiculo, Servicio de chofer) y agrega la cantidad y precio. El subtotal y el total se calculan solos.
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>
              MONTOS (Quetzales)
            </div>
            <div style={{ display: 'grid', gap: 11 }}>
              <Fld label="REGIMEN DE IVA">
                <select style={S.sel} value={f.tasa_iva}
                  onChange={e => { sf('tasa_iva', e.target.value); calcular(f.subtotal, e.target.value); }}>
                  <option value={12}>12% — Regimen General</option>
                  <option value={5}>5% — Pequeno Contribuyente</option>
                  <option value={0}>Sin IVA</option>
                </select>
              </Fld>
              <Fld label="SUBTOTAL">
                <input style={S.inp} type="number" step="0.01" min="0"
                  value={f.subtotal}
                  onChange={e => { sf('subtotal', e.target.value); calcular(e.target.value, f.tasa_iva); }}
                  placeholder="0.00" />
              </Fld>
              <Fld label={`IVA CALCULADO (${f.tasa_iva}%)`}>
                <input style={{ ...S.inp, background: T.card, color: T.sub }}
                  value={f.impuestos ? `Q ${fmt(f.impuestos)}` : '0.00'}
                  readOnly />
              </Fld>
              <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>TOTAL FACTURA</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.acc }}>
                  Q {fmt(f.total || 0)}
                </div>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>
              METODO DE PAGO
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['efectivo', 'transferencia', 'tarjeta', 'cheque', 'deposito', 'credito'].map(p => (
                <button key={p} onClick={() => sf('metodo_pago', p)}
                  style={{
                    ...S.btn(f.metodo_pago === p ? 'primary' : 'ghost'),
                    fontSize: 11, padding: '7px 10px',
                  }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {['transferencia', 'deposito', 'cheque'].includes(f.metodo_pago) && (
              <Fld label="NUMERO DE CUENTA / REFERENCIA">
                <input style={S.inp} value={f.numero_cuenta}
                  onChange={e => sf('numero_cuenta', e.target.value)}
                  placeholder="No. de cuenta bancaria del emisor" />
              </Fld>
            )}
          </div>

          <div style={S.card}>
            <Fld label="NOTAS INTERNAS">
              <textarea style={{ ...S.inp, minHeight: 60, resize: 'vertical' }}
                value={f.notas}
                onChange={e => sf('notas', e.target.value)}
                placeholder="Observaciones internas (no aparecen en factura)..." />
            </Fld>
          </div>

          {/* Botones de accion */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setVista('lista'); setEditItem(null); }}
              style={{ ...S.btn('ghost'), flex: 1 }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={saving}
              style={{ ...S.btn('primary'), flex: 2 }}>
              {saving ? 'Guardando...' : editItem ? 'Actualizar factura' : 'Crear factura'}
            </button>
          </div>

          {/* Debug info visible solo si hay empresa_id */}
          {!empId && (
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: T.red }}>
              Advertencia: empresa_id no disponible. Recarga la pagina.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // VISTA: LISTA
  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Modal exportar */}
      {exportar && (
        <ModalExportar titulo="Facturas FEL" datos={rows.map(r => ({
          ...r,
          emisor_nombre: emisores.find(x => x.id === r.emisor_id)?.nombre_entidad || '',
        }))}
          campos={[
            { label: 'No. Factura',  key: 'numero_factura' },
            { label: 'Serie',        key: 'serie'          },
            { label: 'Fecha',        key: 'fecha'          },
            { label: 'Cliente',      key: 'cliente_nombre' },
            { label: 'NIT',          key: 'cliente_nit'    },
            { label: 'Subtotal',     key: 'subtotal'       },
            { label: 'IVA',          key: 'impuestos'      },
            { label: 'Total',        key: 'total'          },
            { label: 'Metodo',       key: 'metodo_pago'    },
            { label: 'Emisor',       key: 'emisor_nombre'  },
            { label: 'Estado',       key: 'estado'         },
          ]}
          onClose={() => setExportar(false)} />
      )}

      {/* Modal importador SAT */}
      {showSAT && (
        <ImportadorSAT tipo="ventas" empId={empId} emisores={emisores} userEmail={userEmail} showToast={showToast}
          onClose={() => setShowSAT(false)} onImportado={reload} />
      )}

      {/* Modal importador XML FEL */}
      {showXML && (
        <ImportadorXML empId={empId} emisores={emisores} showToast={showToast}
          onClose={() => setShowXML(false)} onImportado={reload} />
      )}

      {/* Modal importador PDF FEL */}
      {showPDF && (
        <ImportadorPDF empId={empId} emisores={emisores} userEmail={userEmail} showToast={showToast}
          onClose={() => setShowPDF(false)} onImportado={reload} />
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total facturado',  v: `Q ${fmt(totales.facturado)}`,  c: T.acc,   bg: T.accDim  },
          { l: 'Total cobrado',    v: `Q ${fmt(totales.cobrado)}`,    c: T.green, bg: T.greenDim },
          { l: 'Por cobrar',       v: `Q ${fmt(totales.pendiente)}`,  c: T.sec,   bg: T.secDim  },
          { l: 'Facturas totales', v: total,                    c: T.blue,  bg: T.blueDim },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.c}44`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: T.mut }}>{s.l}</div>
            <div style={{ fontSize: i === 3 ? 24 : 16, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Control por entidad */}
      {controlEnt && emisores.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 10 }}>
            CONTROL POR ENTIDAD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {controlEnt.map(({ em, facturado, facturas, cobrado, pendiente, porCuenta }) => (
              <div key={em.id} style={{ border: `1px solid ${T.bord}`, borderRadius: 10, padding: 12, background: T.surf }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>{em.nombre_entidad}</div>
                    {em.responsable && <div style={{ fontSize: 10, color: T.sub }}>{em.responsable}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                    <div>Facturado: <strong style={{ color: T.blue }}>Q {fmt(facturado)}</strong> ({facturas})</div>
                    <div>Cobrado: <strong style={{ color: T.green }}>Q {fmt(cobrado)}</strong></div>
                    <div>Por cobrar: <strong style={{ color: pendiente > 0 ? T.sec : T.mut }}>Q {fmt(Math.max(pendiente, 0))}</strong></div>
                  </div>
                </div>
                {Object.keys(porCuenta).length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(porCuenta).map(([cid, tot]) => (
                      <div key={cid} style={{ fontSize: 10, background: T.accDim, padding: "3px 8px", borderRadius: 6, color: T.acc }}>
                        Recibido en: <strong>{cid === "sin_cuenta" ? "sin cuenta" : (cuentaBancariaNombre(cid))} — Q {fmt(tot)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{ fontSize: 10, color: T.mut }}>
              Muestra cuánto facturó y cobró cada entidad. Aunque el pago entre a cualquier cuenta bancaria, aquí se asocia a la entidad que facturó el servicio.
            </div>
          </div>
        </div>
      )}

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['todos', ...Object.keys(ESTADOS)].map(est => (
          <button key={est} onClick={() => setFiltro(est)}
            style={{ ...S.btn(filtro === est ? 'primary' : 'ghost'), fontSize: 11, padding: '5px 10px' }}>
            {est === 'todos' ? `Todas (${rows.length})` : `${ESTADOS[est]?.l} (${rows.filter(r => r.estado === est).length})`}
          </button>
        ))}
      </div>

      {/* Barra de acciones */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o numero de factura..." />
        <select style={S.sel} value={filtroEm} onChange={e => setFiltroEm(e.target.value)}>
          <option value="">Todos los emisores</option>
          {emisores.map(em => (
            <option key={em.id} value={em.id}>{em.nombre_entidad}</option>
          ))}
        </select>
        <button onClick={() => setShowPDF(true)}
          style={{ ...S.btn('blue'), fontSize: 11, whiteSpace: 'nowrap' }}>
          Importar PDF FEL
        </button>
        <button onClick={() => setShowXML(true)}
          style={{ ...S.btn('ghost'), fontSize: 11, whiteSpace: 'nowrap' }}>
          Importar XML FEL
        </button>
        <button onClick={() => setShowSAT(true)}
          style={{ ...S.btn('ghost'), fontSize: 11, whiteSpace: 'nowrap' }}>
          Importar Excel SAT
        </button>
        <button onClick={() => setExportar(true)}
          style={{ ...S.btn('ghost'), fontSize: 11 }}>
          Exportar
        </button>
        <button onClick={abrirNuevo}
          style={{ ...S.btn('primary'), fontSize: 12, whiteSpace: 'nowrap' }}>
          + Nueva factura
        </button>
      </div>

      {/* Cards */}
      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty icon="F" msg={total === 0 ? 'Sin facturas registradas' : 'Sin resultados'}
          action="+ Nueva factura" onAction={abrirNuevo} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(r => {
            const est = ESTADOS[r.estado] || ESTADOS.borrador;
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 13 }}>
                        {r.numero_factura || '—'}
                      </span>
                      {r.serie && <span style={{ fontSize: 10, color: T.mut }}>Serie: {r.serie}</span>}
                    </div>
                    <div style={{ fontWeight: 600, color: T.txt, fontSize: 14, marginTop: 2 }}>
                      {r.cliente_nombre}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", fontSize: 11, color: T.mut }}>
                      <span>NIT: {r.nit_receptor || r.cliente_nit || 'CF'}</span>
                      <span>{fmtD(r.fecha_hora_emision || r.fecha)}</span>
                      {r.tipo_dte && <span style={{ fontWeight: 600 }}>• {r.tipo_dte}</span>}
                      {r.moneda && <span>• {r.moneda}</span>}
                      {r.numero_autorizacion && <span style={{ color: T.blue }}>• Aut: {r.numero_autorizacion}</span>}
                      {r.emisor_id && (() => {
                        const em = emisores.find(x => x.id === r.emisor_id);
                        return em ? <span style={{ fontWeight: 600 }}>• {em.nombre_entidad}</span> : null;
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>
                      Q {fmt(r.total)}
                    </div>
                    <Badge c={est.c} bg={est.bg} l={est.l} small />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: T.sub }}>{r.metodo_pago || '—'}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => imprimirFactura(r, emisores.find(x => x.id === r.emisor_id))}
                      style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>
                      Imprimir
                    </button>
                    {r.estado === 'borrador' && (
                      <button onClick={() => cambiarEstado(r.id, 'emitida')}
                        style={{ ...S.btn("primary"), padding: "3px 7px", fontSize: 10 }}>
                        Emitir
                      </button>
                    )}
                    {r.estado === 'emitida' && (
                      <button onClick={() => cambiarEstado(r.id, 'pagada')}
                        style={{ ...S.btn("green"), padding: "3px 7px", fontSize: 10 }}>
                        Cobrada
                      </button>
                    )}
                    {['emitida','certificada','parcial'].includes(r.estado) && (
                      <button onClick={() => cambiarEstado(r.id, 'anulada')}
                        style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 10 }}>
                        Anular
                      </button>
                    )}
                    <button onClick={() => abrirEditar(r)}
                      style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>
                      Editar
                    </button>
                    {r.estado === 'borrador' && (
                      <button onClick={() => del(r.id)}
                        style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 10 }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{rows.length} facturas</span>
            <span style={{ fontWeight: 800, color: T.acc, fontSize: 16 }}>
              Q {fmt(rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0))}
            </span>
          </div>
        </div>
      )}
      <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta}
        pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
    </div>
  );
}
