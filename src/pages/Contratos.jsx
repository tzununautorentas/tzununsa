// src/pages/Contratos.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO CONTRATOS — Tz'ununSA
// Contrato unificado: Renta · Traslado · Servicio Corporativo
// Auto-fill desde: Reservas, Cotizaciones, Clientes, Vehículos
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld } from '../components/shared.jsx';

// ─── API ──────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) }, ...rest,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) { let m = text; try { m = JSON.parse(text).message || text; } catch {} throw new Error(m); }
  try { return JSON.parse(text); } catch { return null; }
}

// ─── Estados ─────────────────────────────────────────────────────
const ESTADOS = {
  borrador:        { c: T.mut,   bg: '#1E293B',  l: 'Borrador'         },
  pendiente_firma: { c: T.sec,   bg: T.secDim,   l: 'Pendiente firma'  },
  firmado:         { c: T.blue,  bg: T.blueDim,  l: 'Firmado'          },
  activo:          { c: T.acc,   bg: T.accDim,   l: 'Activo'           },
  completado:      { c: T.green, bg: T.greenDim, l: 'Completado'       },
  cancelado:       { c: T.red,   bg: T.redDim,   l: 'Cancelado'        },
};

const TIPOS = [
  { v: 'renta',        l: 'Renta de vehiculo'       },
  { v: 'traslado',     l: 'Traslado / Viaje'        },
  { v: 'corporativo',  l: 'Servicio corporativo'    },
  { v: 'logistica',    l: 'Logistica / Carga'       },
];

const COMBUSTIBLE = ['Lleno', '3/4', '1/2', '1/4', 'Reserva'];

const CHECKLIST_ITEMS = [
  { id: 'carroceria',   label: 'Carroceria sin danos visibles'   },
  { id: 'vidrios',      label: 'Vidrios completos'               },
  { id: 'espejos',      label: 'Espejos completos'               },
  { id: 'llantas',      label: 'Llantas en buen estado'          },
  { id: 'luces',        label: 'Luces funcionando'               },
  { id: 'documentos',   label: 'Documentos y tarjeta de circulacion' },
  { id: 'herramientas', label: 'Kit de herramientas y gato'      },
  { id: 'extintor',     label: 'Extintor vigente'                },
  { id: 'triangulos',   label: 'Triangulos de seguridad'         },
  { id: 'tapetes',      label: 'Tapetes interiores'              },
  { id: 'limpieza',     label: 'Vehiculo limpio (interior/exterior)' },
  { id: 'ac',           label: 'Aire acondicionado funcionando'  },
];

const EF = {
  numero: '', tipo: 'renta', estado: 'borrador', fecha: today(),
  // Arrendador
  representante_nombre: '', representante_dpi: '', patente_comercio: '',
  // Arrendatario
  cliente_nombre: '', cliente_nit: 'CF', cliente_dpi: '', cliente_nacionalidad: 'guatemalteca',
  cliente_representando: '', cliente_id: '',
  // Vehiculo
  vehiculo_id: '', vehiculo_marca: '', vehiculo_modelo: '', vehiculo_tipo: '',
  vehiculo_color: '', vehiculo_placa: '', km_salida: 0, km_retorno: 0,
  combustible_salida: 'Lleno', combustible_retorno: '',
  // Plazo
  fecha_salida: today(), hora_salida: '08:00',
  fecha_retorno: '', hora_retorno: '18:00',
  // Financiero
  concepto: 'renta', total_gtq: 0, metodo_pago: 'efectivo',
  banco: 'Banrural', numero_cuenta: '', tipo_cuenta: 'Monetaria',
  deducible_colision: 5000, deducible_robo: 10000, deducible_terceros: 3000,
  // Facturacion
  factura_nombre: '', factura_nit: 'CF',
  // Conductores (array serializado como JSON)
  conductores: '[]',
  // Checklist (objeto serializado)
  checklist_salida: '{}', checklist_retorno: '{}',
  // Firmas (base64 canvas)
  firma_arrendador: '', firma_arrendatario: '',
  // Fotos y docs (URLs o base64)
  fotos_salida: '[]', fotos_retorno: '[]',
  foto_dpi: '', foto_licencia: '',
  // Extras
  danos_previos: '', observaciones: '',
  reserva_id: '', cotizacion_id: '',
};

// ─── Generador de numero de contrato ─────────────────────────────
const genNumero = () => 'CONT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);

// ─── Componente Firma Digital (Canvas) ───────────────────────────
function FirmaDigital({ valor, onChange, label }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const [tiene,   setTiene]   = useState(!!valor);

  useEffect(() => {
    if (valor && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 340, 120);
        ctx.drawImage(img, 0, 0);
      };
      img.src = valor;
    }
  }, []);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = '#0A0F1E'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e, canvasRef.current);
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const data = canvasRef.current.toDataURL('image/png');
    onChange(data);
    setTiene(true);
  };

  const limpiar = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 340, 120);
    onChange(''); setTiene(false);
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 6 }}>{label}</div>
      <div style={{ border: `2px solid ${tiene ? T.acc : T.bord}`, borderRadius: 10, overflow: 'hidden', background: '#fff', position: 'relative' }}>
        <canvas ref={canvasRef} width={340} height={120} style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
        {!tiene && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ color: '#CBD5E1', fontSize: 12 }}>Firma aqui con el dedo o mouse</span>
          </div>
        )}
      </div>
      {tiene && (
        <button onClick={limpiar} style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px', marginTop: 6 }}>
          Limpiar firma
        </button>
      )}
    </div>
  );
}

// ─── Checklist visual ─────────────────────────────────────────────
function ChecklistVehiculo({ titulo, valor, onChange }) {
  const items = JSON.parse(valor || '{}');
  const toggle = (id) => {
    const nuevo = { ...items, [id]: !items[id] };
    onChange(JSON.stringify(nuevo));
  };
  const ok = Object.values(items).filter(Boolean).length;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>{titulo}</div>
        <div style={{ fontSize: 11, color: T.acc }}>{ok}/{CHECKLIST_ITEMS.length} OK</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {CHECKLIST_ITEMS.map(item => (
          <label key={item.id} onClick={() => toggle(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              background: items[item.id] ? T.accDim : T.surf,
              border: `1px solid ${items[item.id] ? T.acc : T.bord}`,
              transition: 'all .15s' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${items[item.id] ? T.acc : T.bord}`,
              background: items[item.id] ? T.acc : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {items[item.id] && <span style={{ color: '#0A0F1E', fontSize: 11, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 11, color: items[item.id] ? T.acc : T.sub }}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GENERADOR DE PDF — HTML profesional
// ═══════════════════════════════════════════════════════════════════
const generarPDF = (contrato) => {
  const conductores = JSON.parse(contrato.conductores || '[]');
  const checkSal    = JSON.parse(contrato.checklist_salida  || '{}');
  const checkRet    = JSON.parse(contrato.checklist_retorno || '{}');

  const checkRow = (item, val) =>
    `<tr><td>${item.label}</td><td style="text-align:center;font-weight:700;color:${val ? '#16A34A' : '#DC2626'}">${val ? 'OK' : '---'}</td></tr>`;

  const html = `<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8"/>
  <title>Contrato ${contrato.numero}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Arial',sans-serif;font-size:10.5px;color:#1E293B;background:#fff;padding:32px 40px}
    /* Header */
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:3px solid #1B2D5C;margin-bottom:22px}
    .brand h1{color:#1B2D5C;font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand p{color:#64748B;font-size:9px;margin-top:2px}
    .doc-info{text-align:right}
    .doc-info .num{font-size:17px;font-weight:800;color:#1B2D5C}
    .doc-info p{font-size:9px;color:#64748B;margin-top:2px}
    .badge{display:inline-block;padding:3px 10px;border-radius:12px;background:#00D4AA22;color:#00D4AA;font-size:9px;font-weight:700;margin-top:4px}
    /* Secciones */
    .section{margin-bottom:18px;page-break-inside:avoid}
    .section-title{font-size:9px;font-weight:700;letter-spacing:1.5px;color:#94A3B8;margin-bottom:8px;text-transform:uppercase;display:flex;align-items:center;gap:6px}
    .section-title::after{content:'';flex:1;height:1px;background:#E2E8F0}
    /* Cajas de datos */
    .data-box{background:#F8FAFC;border-radius:8px;padding:14px 16px;border-left:3px solid #1B2D5C}
    .data-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .data-item label{font-size:8px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:2px}
    .data-item span{font-size:11px;color:#1E293B;font-weight:500}
    .data-item.full{grid-column:1/-1}
    /* Tablas */
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#1B2D5C;color:#fff;padding:7px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:0.5px}
    td{padding:7px 10px;border-bottom:1px solid #F1F5F9;font-size:10px}
    tr:nth-child(even) td{background:#F8FAFC}
    /* Checklist */
    .check-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
    .check-item{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;background:#F8FAFC}
    .check-ok{color:#16A34A;font-weight:700;font-size:11px}
    .check-no{color:#DC2626;font-weight:700;font-size:11px}
    /* Clausulas */
    .clausula{margin-bottom:14px}
    .clausula h3{font-size:10px;font-weight:700;color:#1B2D5C;margin-bottom:6px;text-transform:uppercase}
    .clausula ol,.clausula ul{padding-left:16px}
    .clausula li{font-size:10px;color:#475569;margin-bottom:3px;line-height:1.5}
    /* Financiero */
    .fin-box{background:#1B2D5C;color:#fff;border-radius:10px;padding:16px 20px;margin-top:8px}
    .fin-row{display:flex;justify-content:space-between;padding:4px 0;font-size:10px;color:#CBD5E1}
    .fin-total{display:flex;justify-content:space-between;padding:10px 0 0;border-top:1px solid rgba(255,255,255,.3);font-size:16px;font-weight:800;color:#00D4AA}
    /* Firmas */
    .firmas{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
    .firma-box{text-align:center;padding-top:8px}
    .firma-img{width:100%;height:90px;border:1px dashed #CBD5E1;border-radius:6px;margin-bottom:8px;object-fit:contain;background:#F8FAFC}
    .firma-line{border-top:1.5px solid #1B2D5C;padding-top:6px;margin-top:8px}
    .firma-name{font-weight:700;font-size:10px;color:#1B2D5C}
    .firma-title{font-size:9px;color:#64748B}
    /* Footer */
    .footer{margin-top:24px;padding-top:14px;border-top:1px solid #E2E8F0;text-align:center;font-size:9px;color:#94A3B8}
    @media print{body{padding:20px 24px}.no-print{display:none}@page{size:A4;margin:15mm}}
  </style></head><body>

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <h1>Tz'unun AutoRentas</h1>
      <p>Servicios de Movilidad · Transporte Corporativo · Logistica</p>
      <p>Guatemala, Centroamerica</p>
    </div>
    <div class="doc-info">
      <div class="num">CONTRATO DE ARRENDAMIENTO</div>
      <p>No. ${contrato.numero || '—'}</p>
      <p>Fecha: ${fmtD(contrato.fecha)}</p>
      <p>Tipo: ${TIPOS.find(t=>t.v===contrato.tipo)?.l || contrato.tipo}</p>
      <div class="badge">${ESTADOS[contrato.estado]?.l || contrato.estado}</div>
    </div>
  </div>

  <!-- I. PARTES -->
  <div class="section">
    <div class="section-title">I. Partes contratantes</div>
    <div class="data-grid">
      <div class="data-box">
        <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:8px">EL ARRENDADOR</div>
        <div class="data-item"><label>Empresa</label><span>Tz'unun AutoRentas</span></div>
        <div class="data-item" style="margin-top:6px"><label>Representante legal</label><span>${contrato.representante_nombre || '________________________________'}</span></div>
        <div class="data-item" style="margin-top:6px"><label>DPI Representante</label><span>${contrato.representante_dpi || '________________________________'}</span></div>
        ${contrato.patente_comercio ? `<div class="data-item" style="margin-top:6px"><label>Patente de comercio</label><span>${contrato.patente_comercio}</span></div>` : ''}
      </div>
      <div class="data-box">
        <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:8px">EL ARRENDATARIO</div>
        <div class="data-item"><label>Nombre completo</label><span>${contrato.cliente_nombre || '________________________________'}</span></div>
        <div class="data-item" style="margin-top:6px"><label>DPI / Pasaporte / NIT</label><span>${contrato.cliente_dpi || contrato.cliente_nit || '________________________________'}</span></div>
        <div class="data-item" style="margin-top:6px"><label>Nacionalidad</label><span>${contrato.cliente_nacionalidad || 'Guatemalteca'}</span></div>
        ${contrato.cliente_representando ? `<div class="data-item" style="margin-top:6px"><label>En representacion de</label><span>${contrato.cliente_representando}</span></div>` : ''}
      </div>
    </div>
  </div>

  <!-- II. VEHICULO -->
  <div class="section">
    <div class="section-title">II. Objeto del contrato — Datos del vehiculo</div>
    <div class="data-box">
      <div class="data-grid">
        <div class="data-item"><label>Marca</label><span>${contrato.vehiculo_marca || '—'}</span></div>
        <div class="data-item"><label>Modelo</label><span>${contrato.vehiculo_modelo || '—'}</span></div>
        <div class="data-item"><label>Tipo</label><span>${contrato.vehiculo_tipo || '—'}</span></div>
        <div class="data-item"><label>Color</label><span>${contrato.vehiculo_color || '—'}</span></div>
        <div class="data-item"><label>Placas</label><span style="font-weight:700;font-family:monospace;font-size:12px">${contrato.vehiculo_placa || '—'}</span></div>
        <div class="data-item"><label>Kilometraje salida</label><span>${(contrato.km_salida||0).toLocaleString()} km</span></div>
        <div class="data-item"><label>Combustible salida</label><span>${contrato.combustible_salida || '—'}</span></div>
        ${contrato.km_retorno ? `<div class="data-item"><label>Kilometraje retorno</label><span>${parseInt(contrato.km_retorno).toLocaleString()} km</span></div>` : ''}
      </div>
    </div>
    <p style="font-size:10px;color:#64748B;margin-top:8px;font-style:italic">
      El vehiculo se entrega en condiciones optimas de funcionamiento mecanico y operativo.
    </p>
  </div>

  <!-- III. PLAZO -->
  <div class="section">
    <div class="section-title">III. Plazo del arrendamiento</div>
    <div class="data-box">
      <div class="data-grid">
        <div class="data-item"><label>Fecha y hora de salida</label><span>${fmtD(contrato.fecha_salida)} a las ${contrato.hora_salida || '08:00'} hrs</span></div>
        <div class="data-item"><label>Fecha y hora de retorno</label><span>${contrato.fecha_retorno ? fmtD(contrato.fecha_retorno) + ' a las ' + (contrato.hora_retorno||'18:00') + ' hrs' : 'Por confirmar'}</span></div>
      </div>
    </div>
    <p style="font-size:10px;color:#64748B;margin-top:8px">
      Cualquier prorroga debera ser autorizada previamente por EL ARRENDADOR. El incumplimiento en la devolucion
      generara cargos adicionales y responsabilidades legales aplicables.
    </p>
  </div>

  <!-- IV. PAGO -->
  <div class="section">
    <div class="section-title">IV. Valor del servicio y forma de pago</div>
    <div class="fin-box">
      <div class="fin-row"><span>Concepto</span><span>${TIPOS.find(t=>t.v===contrato.tipo)?.l || contrato.tipo}</span></div>
      <div class="fin-row"><span>Forma de pago</span><span>${contrato.metodo_pago}</span></div>
      <div class="fin-total"><span>TOTAL A PAGAR</span><span>Q ${fmt(contrato.total_gtq)}</span></div>
    </div>
    ${(contrato.banco || contrato.numero_cuenta) ? `
    <div class="data-box" style="margin-top:10px">
      <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:6px">DATOS BANCARIOS PARA TRANSFERENCIA</div>
      <div class="data-grid">
        ${contrato.banco ? `<div class="data-item"><label>Banco</label><span>${contrato.banco}</span></div>` : ''}
        ${contrato.numero_cuenta ? `<div class="data-item"><label>No. Cuenta</label><span style="font-family:monospace">${contrato.numero_cuenta}</span></div>` : ''}
        ${contrato.tipo_cuenta ? `<div class="data-item"><label>Tipo de cuenta</label><span>${contrato.tipo_cuenta}</span></div>` : ''}
      </div>
    </div>` : ''}
    <p style="font-size:10px;color:#64748B;margin-top:8px">
      Los cargos adicionales por danos, multas, combustible, kilometraje adicional, limpieza o deducibles
      seran cobrados adicionalmente al valor inicial del contrato.
    </p>
  </div>

  <!-- V. RESPONSABILIDADES -->
  <div class="section">
    <div class="section-title">V. Responsabilidades del arrendatario</div>
    <div class="clausula">
      <p style="font-size:10px;color:#475569;margin-bottom:6px">EL ARRENDATARIO se compromete a:</p>
      <ol>
        <li>Utilizar el vehiculo unicamente para fines licitos.</li>
        <li>No conducir bajo efectos de alcohol, drogas o sustancias prohibidas.</li>
        <li>Respetar las leyes de transito vigentes de la Republica de Guatemala.</li>
        <li>No subarrendar ni ceder el vehiculo a terceros no autorizados.</li>
        <li>No sacar el vehiculo del pais sin autorizacion escrita de EL ARRENDADOR.</li>
        <li>No sobrecargar el vehiculo mas alla de su capacidad.</li>
        <li>Devolver el vehiculo en las mismas condiciones en que lo recibe.</li>
      </ol>
      <p style="font-size:10px;color:#475569;margin-top:8px;margin-bottom:4px">EL ARRENDATARIO sera responsable por:</p>
      <ul>
        <li>Danos al vehiculo, danos a terceros, multas de transito</li>
        <li>Perdida de documentos, robo por negligencia, uso indebido</li>
      </ul>
    </div>
  </div>

  <!-- VI. CONDUCTORES -->
  ${conductores.length > 0 ? `
  <div class="section">
    <div class="section-title">VI. Conductores autorizados</div>
    <table>
      <thead><tr><th>Nombre completo</th><th>DPI / Pasaporte</th><th>No. Licencia</th><th>Tipo licencia</th></tr></thead>
      <tbody>
        ${conductores.map(c => `<tr><td>${c.nombre||'—'}</td><td style="font-family:monospace">${c.dpi||'—'}</td><td style="font-family:monospace">${c.licencia||'—'}</td><td>${c.tipo_licencia||'—'}</td></tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:10px;color:#64748B;margin-top:6px">
      Todos los conductores deberan contar con licencia de conducir vigente. Conducir sin autorizacion anula toda cobertura.
    </p>
  </div>` : ''}

  <!-- VII. RESTRICCIONES -->
  <div class="section">
    <div class="section-title">VII. Restricciones</div>
    <div class="clausula">
      <p style="font-size:10px;color:#475569;margin-bottom:4px">Queda terminantemente prohibido:</p>
      <ul>
        <li>Conducir bajo efectos de alcohol, drogas o sustancias prohibidas</li>
        <li>Utilizar el vehiculo para actos ilicitos o transporte de mercancia prohibida</li>
        <li>Fumar dentro del vehiculo</li>
        <li>Cruzar fronteras internacionales sin autorizacion escrita</li>
        <li>Sobrecargar el vehiculo o participar en competencias</li>
        <li>Realizar modificaciones al vehiculo sin autorizacion</li>
      </ul>
      <p style="font-size:10px;color:#DC2626;margin-top:6px;font-style:italic">
        El incumplimiento de estas restricciones anula cualquier cobertura o beneficio y genera responsabilidad legal.
      </p>
    </div>
  </div>

  <!-- VIII. DEDUCIBLES -->
  <div class="section">
    <div class="section-title">VIII. Deducibles y seguro</div>
    <table>
      <thead><tr><th>Tipo de siniestro</th><th>Deducible a cargo del arrendatario</th></tr></thead>
      <tbody>
        <tr><td>Colisiones y vuelcos</td><td style="font-weight:700">Q ${fmt(contrato.deducible_colision||5000)}</td></tr>
        <tr><td>Robo o hurto</td><td style="font-weight:700">Q ${fmt(contrato.deducible_robo||10000)}</td></tr>
        <tr><td>Danos a terceros</td><td style="font-weight:700">Q ${fmt(contrato.deducible_terceros||3000)}</td></tr>
      </tbody>
    </table>
    <p style="font-size:10px;color:#64748B;margin-top:6px">
      Los danos seran evaluados por EL ARRENDADOR y/o la aseguradora correspondiente.
    </p>
  </div>

  <!-- CHECKLIST SALIDA -->
  ${Object.keys(checkSal).length > 0 ? `
  <div class="section">
    <div class="section-title">Checklist de condicion — Entrega del vehiculo</div>
    <div class="check-grid">
      ${CHECKLIST_ITEMS.map(item => `
        <div class="check-item">
          <span class="${checkSal[item.id] ? 'check-ok' : 'check-no'}">${checkSal[item.id] ? '✓' : '✗'}</span>
          <span style="font-size:10px">${item.label}</span>
        </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- IX. OBJETOS PERSONALES -->
  <div class="section">
    <div class="section-title">IX. Objetos personales y facturacion</div>
    <p style="font-size:10px;color:#475569;margin-bottom:8px">
      EL ARRENDADOR no se hace responsable por objetos olvidados dentro del vehiculo.
      EL ARRENDATARIO debera revisar el vehiculo antes de entregarlo.
    </p>
    <div class="data-box">
      <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:6px">DATOS DE FACTURACION</div>
      <div class="data-grid">
        <div class="data-item"><label>Nombre / Razon social</label><span>${contrato.factura_nombre || contrato.cliente_nombre}</span></div>
        <div class="data-item"><label>NIT</label><span style="font-family:monospace">${contrato.factura_nit || 'CF'}</span></div>
      </div>
    </div>
  </div>

  <!-- X. TERMINACION -->
  <div class="section">
    <div class="section-title">X. Terminacion del contrato</div>
    <div class="clausula">
      <p style="font-size:10px;color:#475569;margin-bottom:4px">EL ARRENDADOR podra dar por terminado el contrato de forma inmediata en caso de:</p>
      <ul>
        <li>Incumplimiento de cualquier clausula contractual</li>
        <li>Uso indebido o actos ilicitos con el vehiculo</li>
        <li>Falsedad de informacion proporcionada</li>
        <li>Riesgo inminente para el vehiculo o terceros</li>
      </ul>
    </div>
  </div>

  <!-- DANOS PREVIOS -->
  ${contrato.danos_previos ? `
  <div class="section">
    <div class="section-title">Observaciones y danos previos documentados</div>
    <div class="data-box">
      <p style="font-size:10px;color:#475569">${contrato.danos_previos}</p>
    </div>
  </div>` : ''}

  <!-- XI. ACEPTACION Y FIRMAS -->
  <div class="section">
    <div class="section-title">XI. Aceptacion</div>
    <p style="font-size:10px;color:#475569;margin-bottom:16px">
      Ambas partes manifiestan haber leido, entendido y aceptado integra y voluntariamente
      todas las clausulas del presente contrato, el cual se suscribe en la ciudad de
      Guatemala, el dia ${fmtD(contrato.fecha)}.
    </p>
    <div class="firmas">
      <div class="firma-box">
        ${contrato.firma_arrendador ? `<img src="${contrato.firma_arrendador}" class="firma-img" alt="Firma arrendador"/>` : '<div class="firma-img"></div>'}
        <div class="firma-line">
          <div class="firma-name">Tz'unun AutoRentas</div>
          <div class="firma-title">EL ARRENDADOR</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">${contrato.representante_nombre || ''}</div>
        </div>
      </div>
      <div class="firma-box">
        ${contrato.firma_arrendatario ? `<img src="${contrato.firma_arrendatario}" class="firma-img" alt="Firma arrendatario"/>` : '<div class="firma-img"></div>'}
        <div class="firma-line">
          <div class="firma-name">${contrato.cliente_nombre || '________________________________'}</div>
          <div class="firma-title">EL ARRENDATARIO</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">DPI: ${contrato.cliente_dpi || contrato.cliente_nit || '—'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <strong>Tz'unun AutoRentas</strong> — Conduciendo confianza, llegando mas lejos.<br/>
    Contrato No. ${contrato.numero} | Guatemala, Centroamerica | ${new Date().toLocaleDateString('es-GT')}
  </div>

  <script>window.onload = () => window.print()<\/script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};

// ═══════════════════════════════════════════════════════════════════
// FORMULARIO MULTI-PASO
// ═══════════════════════════════════════════════════════════════════
function FormContrato({ initial, empId, onSave, onCancel, showToast }) {
  const [f, setF]           = useState(initial ? { ...EF, ...initial } : { ...EF, numero: genNumero() });
  const [paso, setPaso]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [reservas,  setReservas]  = useState([]);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    Promise.all([
      dbGet('vehiculos', '&order=marca.asc'),
      dbGet('reservas', '&estado=in.(confirmada,en_curso)&order=fecha_inicio.desc&limit=50'),
    ]).then(([v, r]) => {
      setVehiculos(Array.isArray(v) ? v : []);
      setReservas(Array.isArray(r) ? r : []);
    });
  }, []);

  // Auto-fill desde reserva
  const cargarDesdeReserva = (reservaId) => {
    const r = reservas.find(x => x.id === reservaId);
    if (!r) return;
    setF(p => ({
      ...p,
      reserva_id:      r.id,
      cliente_nombre:  r.cliente_nombre || p.cliente_nombre,
      tipo:            r.tipo           || p.tipo,
      fecha_salida:    r.fecha_inicio   || p.fecha_salida,
      fecha_retorno:   r.fecha_fin      || p.fecha_retorno,
      total_gtq:       r.total_gtq      || p.total_gtq,
      metodo_pago:     r.metodo_pago    || p.metodo_pago,
      vehiculo_id:     r.vehiculo_id    || p.vehiculo_id,
      vehiculo_nombre: r.vehiculo_nombre|| p.vehiculo_nombre,
      factura_nombre:  r.cliente_nombre || p.factura_nombre,
    }));
    // Auto-fill vehiculo si tiene vehiculo_id
    if (r.vehiculo_id) {
      const v = vehiculos.find(x => x.id === r.vehiculo_id);
      if (v) {
        setF(p => ({ ...p,
          vehiculo_marca: v.marca  || '', vehiculo_modelo: v.modelo || '',
          vehiculo_tipo:  v.tipo   || '', vehiculo_color:  v.color  || '',
          vehiculo_placa: v.placa  || '', km_salida: v.km_actual || 0,
        }));
      }
    }
    showToast('Datos cargados desde la reserva');
  };

  const guardar = async () => {
    if (!f.cliente_nombre.trim()) { showToast('Nombre del arrendatario requerido', 'err'); return; }
    setSaving(true);
    // Convierte cadenas vacías en null para campos UUID y fecha
    // Supabase/PostgreSQL no acepta "" en columnas UUID o DATE
    const uuid  = (v) => (v && String(v).trim().length > 8 ? v : null);
    const fecha = (v) => (v && String(v).trim().length >= 8 ? v : null);
    try {
      const payload = {
        // Campos de texto — se envían tal cual
        empresa_id:           empId,
        numero:               f.numero               || null,
        tipo:                 f.tipo                 || 'renta',
        estado:               f.estado               || 'borrador',
        fecha:                fecha(f.fecha)         || today(),
        representante_nombre: f.representante_nombre || null,
        representante_dpi:    f.representante_dpi    || null,
        patente_comercio:     f.patente_comercio     || null,
        cliente_nombre:       f.cliente_nombre       || null,
        cliente_nit:          f.cliente_nit          || 'CF',
        cliente_dpi:          f.cliente_dpi          || null,
        cliente_nacionalidad: f.cliente_nacionalidad || 'guatemalteca',
        cliente_representando:f.cliente_representando|| null,
        vehiculo_marca:       f.vehiculo_marca       || null,
        vehiculo_modelo:      f.vehiculo_modelo      || null,
        vehiculo_tipo:        f.vehiculo_tipo        || null,
        vehiculo_color:       f.vehiculo_color       || null,
        vehiculo_placa:       f.vehiculo_placa       || null,
        combustible_salida:   f.combustible_salida   || 'Lleno',
        combustible_retorno:  f.combustible_retorno  || null,
        hora_salida:          f.hora_salida          || '08:00',
        hora_retorno:         f.hora_retorno         || '18:00',
        concepto:             f.tipo                 || 'renta',
        metodo_pago:          f.metodo_pago          || 'efectivo',
        banco:                f.banco                || null,
        numero_cuenta:        f.numero_cuenta        || null,
        tipo_cuenta:          f.tipo_cuenta          || null,
        factura_nombre:       f.factura_nombre       || f.cliente_nombre || null,
        factura_nit:          f.factura_nit          || 'CF',
        conductores:          f.conductores          || '[]',
        checklist_salida:     f.checklist_salida     || '{}',
        checklist_retorno:    f.checklist_retorno    || '{}',
        firma_arrendador:     f.firma_arrendador     || null,
        firma_arrendatario:   f.firma_arrendatario   || null,
        fotos_salida:         f.fotos_salida         || '[]',
        fotos_retorno:        f.fotos_retorno        || '[]',
        foto_dpi:             f.foto_dpi             || null,
        foto_licencia:        f.foto_licencia        || null,
        danos_previos:        f.danos_previos        || null,
        observaciones:        f.observaciones        || null,
        // Campos numéricos
        total_gtq:            parseFloat(f.total_gtq)            || 0,
        km_salida:            parseInt(f.km_salida)              || 0,
        km_retorno:           parseInt(f.km_retorno)             || 0,
        deducible_colision:   parseFloat(f.deducible_colision)   || 5000,
        deducible_robo:       parseFloat(f.deducible_robo)       || 10000,
        deducible_terceros:   parseFloat(f.deducible_terceros)   || 3000,
        // Campos UUID — null si están vacíos (nunca "")
        cliente_id:    uuid(f.cliente_id),
        vehiculo_id:   uuid(f.vehiculo_id),
        reserva_id:    uuid(f.reserva_id),
        cotizacion_id: uuid(f.cotizacion_id),
        // Campos DATE — null si están vacíos (nunca "")
        fecha_salida:  fecha(f.fecha_salida),
        fecha_retorno: fecha(f.fecha_retorno),
      };
      if (initial?.id) {
        await api(`/contratos?id=eq.${initial.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        showToast('Contrato actualizado');
      } else {
        await api('/contratos', { method: 'POST', body: JSON.stringify(payload), extraHeaders: { Prefer: 'return=minimal' } });
        showToast('Contrato creado');
      }
      onSave();
    } catch (e) {
      showToast('Error: ' + e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const PASOS = ['Partes', 'Vehiculo', 'Conductores', 'Condiciones', 'Checklist', 'Firmas'];

  // Conductores como array
  const conductores = JSON.parse(f.conductores || '[]');
  const setConductor = (idx, campo, val) => {
    const arr = [...conductores];
    arr[idx] = { ...arr[idx], [campo]: val };
    sf('conductores', JSON.stringify(arr));
  };
  const addConductor = () => sf('conductores', JSON.stringify([...conductores, { nombre: '', dpi: '', licencia: '', tipo_licencia: '' }]));
  const delConductor = (idx) => sf('conductores', JSON.stringify(conductores.filter((_, i) => i !== idx)));

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>
            {initial ? 'Editar contrato' : 'Nuevo contrato'}
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{f.numero}</div>
        </div>
        <button onClick={onCancel} style={S.btn('ghost')}>Volver</button>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {PASOS.map((p, i) => (
          <button key={i} onClick={() => setPaso(i + 1)}
            style={{ ...S.btn(paso === i + 1 ? 'primary' : 'ghost'),
              fontSize: 11, padding: '6px 12px', whiteSpace: 'nowrap',
              opacity: i + 1 > paso ? 0.6 : 1 }}>
            {i + 1}. {p}
          </button>
        ))}
      </div>

      {/* ── PASO 1: PARTES ── */}
      {paso === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Auto-fill desde reserva */}
          {reservas.length > 0 && (
            <div style={{ ...S.card, background: T.accDim, border: `1px solid ${T.acc}44` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 10 }}>
                Cargar datos desde una reserva existente
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select style={{ ...S.sel, flex: 1 }} value={f.reserva_id}
                  onChange={e => { sf('reserva_id', e.target.value); if (e.target.value) cargarDesdeReserva(e.target.value); }}>
                  <option value="">Seleccionar reserva...</option>
                  {reservas.map(r => <option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre} ({fmtD(r.fecha_inicio)})</option>)}
                </select>
              </div>
            </div>
          )}

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>TIPO DE SERVICIO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {TIPOS.map(t => (
                <button key={t.v} onClick={() => sf('tipo', t.v)}
                  style={{ ...S.btn(f.tipo === t.v ? 'primary' : 'ghost'), fontSize: 11, padding: '8px 6px' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={S.card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>EL ARRENDADOR — TZ'UNUN</div>
              <div style={{ display: 'grid', gap: 11 }}>
                <Fld label="REPRESENTANTE LEGAL">
                  <input style={S.inp} value={f.representante_nombre} onChange={e => sf('representante_nombre', e.target.value)} placeholder="Nombre completo" />
                </Fld>
                <Fld label="DPI DEL REPRESENTANTE">
                  <input style={S.inp} value={f.representante_dpi} onChange={e => sf('representante_dpi', e.target.value)} placeholder="0000 00000 0000" />
                </Fld>
                <Fld label="PATENTE DE COMERCIO">
                  <input style={S.inp} value={f.patente_comercio} onChange={e => sf('patente_comercio', e.target.value)} placeholder="No. patente" />
                </Fld>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>EL ARRENDATARIO</div>
              <div style={{ display: 'grid', gap: 11 }}>
                <Fld label="NOMBRE COMPLETO *">
                  <input style={S.inp} value={f.cliente_nombre} onChange={e => sf('cliente_nombre', e.target.value)} placeholder="Nombre o razon social" />
                </Fld>
                <Fld label="DPI / PASAPORTE / NIT">
                  <input style={S.inp} value={f.cliente_dpi} onChange={e => sf('cliente_dpi', e.target.value)} placeholder="Numero de identificacion" />
                </Fld>
                <Fld label="NACIONALIDAD">
                  <input style={S.inp} value={f.cliente_nacionalidad} onChange={e => sf('cliente_nacionalidad', e.target.value)} placeholder="Guatemalteca" />
                </Fld>
                <Fld label="EN REPRESENTACION DE (opcional)">
                  <input style={S.inp} value={f.cliente_representando} onChange={e => sf('cliente_representando', e.target.value)} placeholder="Empresa u organizacion" />
                </Fld>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DATOS DE FACTURACIÓN</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Fld label="NOMBRE PARA FACTURA">
                <input style={S.inp} value={f.factura_nombre || f.cliente_nombre} onChange={e => sf('factura_nombre', e.target.value)} />
              </Fld>
              <Fld label="NIT PARA FACTURA">
                <input style={S.inp} value={f.factura_nit} onChange={e => sf('factura_nit', e.target.value)} placeholder="CF o NIT" />
              </Fld>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: VEHÍCULO ── */}
      {paso === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>SELECCIONAR VEHÍCULO</div>
            <select style={{ ...S.sel, marginBottom: 14 }} value={f.vehiculo_id}
              onChange={e => {
                const v = vehiculos.find(x => x.id === e.target.value);
                if (v) setF(p => ({ ...p, vehiculo_id: v.id, vehiculo_marca: v.marca||'', vehiculo_modelo: v.modelo||'', vehiculo_tipo: v.tipo||'', vehiculo_color: v.color||'', vehiculo_placa: v.placa||'', km_salida: v.km_actual||0 }));
                else sf('vehiculo_id', e.target.value);
              }}>
              <option value="">Seleccionar vehiculo de la flota...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa} ({v.estado})</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <Fld label="MARCA"><input style={S.inp} value={f.vehiculo_marca} onChange={e => sf('vehiculo_marca', e.target.value)} placeholder="Toyota" /></Fld>
              <Fld label="MODELO"><input style={S.inp} value={f.vehiculo_modelo} onChange={e => sf('vehiculo_modelo', e.target.value)} placeholder="RAV4" /></Fld>
              <Fld label="TIPO"><input style={S.inp} value={f.vehiculo_tipo} onChange={e => sf('vehiculo_tipo', e.target.value)} placeholder="SUV" /></Fld>
              <Fld label="COLOR"><input style={S.inp} value={f.vehiculo_color} onChange={e => sf('vehiculo_color', e.target.value)} placeholder="Blanco" /></Fld>
              <Fld label="PLACA"><input style={{ ...S.inp, fontFamily: 'monospace', fontWeight: 700 }} value={f.vehiculo_placa} onChange={e => sf('vehiculo_placa', e.target.value.toUpperCase())} placeholder="P-000-ABC" /></Fld>
              <Fld label="KM SALIDA"><input style={S.inp} type="number" value={f.km_salida} onChange={e => sf('km_salida', e.target.value)} /></Fld>
              <Fld label="COMBUSTIBLE SALIDA">
                <select style={S.sel} value={f.combustible_salida} onChange={e => sf('combustible_salida', e.target.value)}>
                  {COMBUSTIBLE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Fld>
              <Fld label="KM RETORNO (al devolver)"><input style={S.inp} type="number" value={f.km_retorno} onChange={e => sf('km_retorno', e.target.value)} placeholder="0" /></Fld>
              <Fld label="COMBUSTIBLE RETORNO">
                <select style={S.sel} value={f.combustible_retorno} onChange={e => sf('combustible_retorno', e.target.value)}>
                  <option value="">Por confirmar</option>
                  {COMBUSTIBLE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>PLAZO DEL SERVICIO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <Fld label="FECHA SALIDA *"><input style={S.inp} type="date" value={f.fecha_salida} onChange={e => sf('fecha_salida', e.target.value)} /></Fld>
              <Fld label="HORA SALIDA"><input style={S.inp} type="time" value={f.hora_salida} onChange={e => sf('hora_salida', e.target.value)} /></Fld>
              <Fld label="FECHA RETORNO"><input style={S.inp} type="date" value={f.fecha_retorno} onChange={e => sf('fecha_retorno', e.target.value)} /></Fld>
              <Fld label="HORA RETORNO"><input style={S.inp} type="time" value={f.hora_retorno} onChange={e => sf('hora_retorno', e.target.value)} /></Fld>
            </div>
          </div>

          <div style={S.card}>
            <Fld label="DAÑOS PREVIOS DOCUMENTADOS">
              <textarea style={{ ...S.inp, minHeight: 80, resize: 'vertical' }}
                value={f.danos_previos} onChange={e => sf('danos_previos', e.target.value)}
                placeholder="Descripcion de danos o rayones existentes al momento de la entrega..." />
            </Fld>
          </div>
        </div>
      )}

      {/* ── PASO 3: CONDUCTORES ── */}
      {paso === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>Conductores autorizados</div>
              <button onClick={addConductor} style={{ ...S.btn('primary'), fontSize: 11 }}>+ Agregar conductor</button>
            </div>
            {conductores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.sub, fontSize: 13 }}>
                Sin conductores registrados — el arrendatario conduce el vehiculo
              </div>
            ) : conductores.map((c, i) => (
              <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>Conductor {i + 1}</div>
                  <button onClick={() => delConductor(i)} style={{ ...S.btn('danger'), fontSize: 11, padding: '3px 8px' }}>Eliminar</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
                  <Fld label="NOMBRE COMPLETO">
                    <input style={S.inp} value={c.nombre||''} onChange={e => setConductor(i, 'nombre', e.target.value)} placeholder="Nombre del conductor" />
                  </Fld>
                  <Fld label="DPI / PASAPORTE">
                    <input style={S.inp} value={c.dpi||''} onChange={e => setConductor(i, 'dpi', e.target.value)} placeholder="Numero DPI" />
                  </Fld>
                  <Fld label="NO. LICENCIA">
                    <input style={S.inp} value={c.licencia||''} onChange={e => setConductor(i, 'licencia', e.target.value)} placeholder="No. licencia" />
                  </Fld>
                  <Fld label="TIPO LICENCIA">
                    <select style={S.sel} value={c.tipo_licencia||''} onChange={e => setConductor(i, 'tipo_licencia', e.target.value)}>
                      <option value="">Tipo...</option>
                      <option>Tipo A</option><option>Tipo B</option><option>Tipo C</option>
                      <option>Tipo E</option><option>Tipo M</option>
                    </select>
                  </Fld>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PASO 4: CONDICIONES FINANCIERAS ── */}
      {paso === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>VALOR DEL SERVICIO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Fld label="TOTAL DEL CONTRATO (Q) *">
                <input style={{ ...S.inp, fontSize: 16, fontWeight: 700, color: T.acc }} type="number" step="0.01"
                  value={f.total_gtq} onChange={e => sf('total_gtq', e.target.value)} placeholder="0.00" />
              </Fld>
              <Fld label="MÉTODO DE PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e => sf('metodo_pago', e.target.value)}>
                  {['efectivo','transferencia','cheque','tarjeta','deposito'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </Fld>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DATOS BANCARIOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Fld label="BANCO"><input style={S.inp} value={f.banco} onChange={e => sf('banco', e.target.value)} placeholder="Banrural" /></Fld>
              <Fld label="NO. CUENTA"><input style={S.inp} value={f.numero_cuenta} onChange={e => sf('numero_cuenta', e.target.value)} placeholder="000-000000-00" /></Fld>
              <Fld label="TIPO DE CUENTA"><input style={S.inp} value={f.tipo_cuenta} onChange={e => sf('tipo_cuenta', e.target.value)} placeholder="Monetaria" /></Fld>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DEDUCIBLES EN CASO DE SINIESTRO (Q)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Fld label="COLISIONES Y VUELCOS"><input style={S.inp} type="number" value={f.deducible_colision} onChange={e => sf('deducible_colision', e.target.value)} /></Fld>
              <Fld label="ROBO O HURTO"><input style={S.inp} type="number" value={f.deducible_robo} onChange={e => sf('deducible_robo', e.target.value)} /></Fld>
              <Fld label="DAÑOS A TERCEROS"><input style={S.inp} type="number" value={f.deducible_terceros} onChange={e => sf('deducible_terceros', e.target.value)} /></Fld>
            </div>
          </div>
          <div style={S.card}>
            <Fld label="OBSERVACIONES ADICIONALES">
              <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' }} value={f.observaciones} onChange={e => sf('observaciones', e.target.value)} placeholder="Condiciones especiales, acuerdos particulares..." />
            </Fld>
          </div>
        </div>
      )}

      {/* ── PASO 5: CHECKLIST ── */}
      {paso === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <ChecklistVehiculo titulo="Checklist de ENTREGA (salida)"
              valor={f.checklist_salida} onChange={v => sf('checklist_salida', v)} />
          </div>
          <div style={S.card}>
            <ChecklistVehiculo titulo="Checklist de RECEPCION (retorno)"
              valor={f.checklist_retorno} onChange={v => sf('checklist_retorno', v)} />
          </div>
        </div>
      )}

      {/* ── PASO 6: FIRMAS ── */}
      {paso === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
              Estado del contrato
            </div>
            <select style={S.sel} value={f.estado} onChange={e => sf('estado', e.target.value)}>
              {Object.entries(ESTADOS).map(([k,v]) => <option key={k} value={k}>{v.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={S.card}>
              <FirmaDigital label="FIRMA DEL ARRENDADOR (Tz'unun AutoRentas)"
                valor={f.firma_arrendador} onChange={v => sf('firma_arrendador', v)} />
            </div>
            <div style={S.card}>
              <FirmaDigital label={`FIRMA DEL ARRENDATARIO (${f.cliente_nombre || 'Cliente'})`}
                valor={f.firma_arrendatario} onChange={v => sf('firma_arrendatario', v)} />
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 12 }}>
              Vista previa del contrato
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => generarPDF(f)} style={{ ...S.btn('blue'), flex: 1 }}>
                Ver PDF completo
              </button>
              <button onClick={() => navigator.clipboard?.writeText(f.numero).then(() => showToast('Numero copiado'))}
                style={{ ...S.btn('ghost'), fontSize: 11 }}>
                Copiar No. contrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegacion de pasos */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onCancel} style={{ ...S.btn('ghost'), fontSize: 12 }}>Cancelar</button>
        {paso > 1 && <button onClick={() => setPaso(p => p - 1)} style={{ ...S.btn('ghost'), flex: 1 }}>Anterior</button>}
        {paso < 6
          ? <button onClick={() => setPaso(p => p + 1)} style={{ ...S.btn('primary'), flex: 2 }}>Siguiente →</button>
          : <button onClick={guardar} disabled={saving} style={{ ...S.btn('primary'), flex: 2 }}>
              {saving ? 'Guardando...' : initial ? 'Actualizar contrato' : 'Crear contrato'}
            </button>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function PageContratos({ showToast, empId }) {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [vista,    setVista]    = useState('lista');
  const [editItem, setEditItem] = useState(null);
  const [filtro,   setFiltro]   = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api('/contratos?order=created_at.desc&select=*');
      setRows(Array.isArray(d) ? d : []);
    } catch (e) {
      showToast('Error: ' + e.message, 'err');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!confirm('Eliminar este contrato?')) return;
    try {
      await api(`/contratos?id=eq.${id}`, { method: 'DELETE' });
      showToast('Contrato eliminado'); load();
    } catch (e) { showToast('Error: ' + e.message, 'err'); }
  };

  const filtrados = rows.filter(r => {
    if (filtro !== 'todos' && r.estado !== filtro) return false;
    if (busqueda && !r.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !r.numero?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  if (vista === 'form') return (
    <FormContrato initial={editItem} empId={empId} showToast={showToast}
      onSave={() => { setVista('lista'); setEditItem(null); load(); }}
      onCancel={() => { setVista('lista'); setEditItem(null); }} />
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total',         v: rows.length,                                                 c: T.txt   },
          { l: 'Activos',       v: rows.filter(r => r.estado === 'activo').length,               c: T.acc   },
          { l: 'Pend. firma',   v: rows.filter(r => r.estado === 'pendiente_firma').length,      c: T.sec   },
          { l: 'Completados',   v: rows.filter(r => r.estado === 'completado').length,           c: T.green },
          { l: 'Valor total',   v: `Q ${fmt(rows.reduce((s,r) => s+(parseFloat(r.total_gtq)||0),0))}`, c: T.blue },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: i === 4 ? 13 : 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: T.mut, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['todos', ...Object.keys(ESTADOS)].map(est => (
          <button key={est} onClick={() => setFiltro(est)}
            style={{ ...S.btn(filtro === est ? 'primary' : 'ghost'), fontSize: 11, padding: '5px 10px' }}>
            {est === 'todos' ? 'Todos' : ESTADOS[est]?.l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => { setEditItem(null); setVista('form'); }} style={{ ...S.btn('primary'), fontSize: 12 }}>
          + Nuevo contrato
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input style={S.inp} placeholder="Buscar por cliente o numero de contrato..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtrados.length === 0 ? (
        <Empty icon="C" msg="Sin contratos registrados" action="+ Nuevo contrato"
          onAction={() => { setEditItem(null); setVista('form'); }} />
      ) : (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['No. Contrato', 'Tipo', 'Cliente', 'Vehiculo', 'Salida', 'Retorno', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => {
                const est = ESTADOS[r.estado] || ESTADOS.borrador;
                const tipo = TIPOS.find(t => t.v === r.tipo);
                return (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = T.surf}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: T.acc, fontWeight: 700 }}>
                      {r.numero}
                    </td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{tipo?.l || r.tipo}</td>
                    <td style={{ ...S.td, fontWeight: 600, maxWidth: 150 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 145 }}>
                        {r.cliente_nombre}
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub }}>
                      {r.vehiculo_placa ? <span style={{ fontFamily: 'monospace', color: T.acc }}>{r.vehiculo_placa}</span> : '—'}
                      {r.vehiculo_marca && <div style={{ fontSize: 9, color: T.mut }}>{r.vehiculo_marca} {r.vehiculo_modelo}</div>}
                    </td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: 'nowrap' }}>{fmtD(r.fecha_salida)}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: 'nowrap' }}>{r.fecha_retorno ? fmtD(r.fecha_retorno) : '—'}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: T.acc }}>Q {fmt(r.total_gtq)}</td>
                    <td style={S.td}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: est.c, background: est.bg }}>
                        {est.l}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => generarPDF(r)}
                          style={{ ...S.btn('blue'), padding: '3px 7px', fontSize: 10 }}>
                          PDF
                        </button>
                        <button onClick={() => { setEditItem(r); setVista('form'); }}
                          style={{ ...S.btn('ghost'), padding: '3px 7px', fontSize: 10 }}>
                          Editar
                        </button>
                        <button onClick={() => del(r.id)}
                          style={{ ...S.btn('danger'), padding: '3px 7px', fontSize: 10 }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
