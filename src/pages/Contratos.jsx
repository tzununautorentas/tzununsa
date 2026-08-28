// src/pages/Contratos.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO CONTRATOS — Tz'ununSA
// Contrato unificado: Renta · Traslado · Servicio Corporativo
// Auto-fill desde: Reservas, Cotizaciones, Clientes, Vehículos
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Badge, Paginador, Buscador, generarPDF, generarPDFEditable } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

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

// ─── Arquitectura por tipo de servicio ────────────────────────────
const SERVICIOS_INC_FLAGS = [
  { k: 'piloto',       l: 'Conductor / piloto profesional' },
  { k: 'combustible',  l: 'Combustible correspondiente al servicio' },
  { k: 'peajes',       l: 'Peajes y casetas de cobro' },
  { k: 'hospedaje',    l: 'Hospedaje del piloto' },
  { k: 'alimentacion', l: 'Alimentacion del piloto' },
  { k: 'seguro',       l: 'Seguro del vehiculo' },
  { k: 'carta_poder',  l: 'Carta poder' },
];

function getContractType(serviceType) {
  const m = { renta: 'renta', traslado: 'traslado', corporativo: 'corporativo', logistica: 'logistica' };
  return m[serviceType] || 'renta';
}

function getContractTitle(tipo) {
  return {
    renta:       'CONTRATO DE ARRENDAMIENTO DE VEHICULO',
    traslado:    'CONTRATO DE PRESTACION DE SERVICIOS DE TRANSPORTE DE PASAJEROS',
    corporativo: 'CONTRATO DE PRESTACION DE SERVICIOS DE TRANSPORTE CORPORATIVO',
    logistica:   'CONTRATO DE PRESTACION DE SERVICIOS DE TRANSPORTE Y LOGISTICA',
  }[getContractType(tipo)] || 'CONTRATO DE SERVICIO';
}

const esServicioTipo = (tipo) => ['traslado', 'corporativo', 'logistica'].includes(getContractType(tipo));

// Cláusulas configurables por tipo de servicio (revisables con asesoría legal)
const CLAUSULAS = {
  renta: {
    tituloPartes:      'Responsabilidades del arrendatario',
    rolArrendador:     'EL ARRENDADOR',
    rolArrendatario:   'EL ARRENDATARIO',
    introProveedor:    '',
    obligacionesProveedor: [],
    introCliente:      'EL ARRENDATARIO se compromete a:',
    obligacionesCliente: [
      'Utilizar el vehiculo unicamente para fines licitos.',
      'No conducir bajo efectos de alcohol, drogas o sustancias prohibidas.',
      'Respetar las leyes de transito vigentes de la Republica de Guatemala.',
      'No subarrendar ni ceder el vehiculo a terceros no autorizados.',
      'No sacar el vehiculo del pais sin autorizacion escrita de EL ARRENDADOR.',
      'No sobrecargar el vehiculo mas alla de su capacidad.',
      'Devolver el vehiculo en las mismas condiciones en que lo recibe.',
    ],
    responsablePor: ['Danos al vehiculo, danos a terceros, multas de transito', 'Perdida de documentos, robo por negligencia, uso indebido'],
    restricciones: [
      'Conducir bajo efectos de alcohol, drogas o sustancias prohibidas',
      'Utilizar el vehiculo para actos ilicitos o transporte de mercancia prohibida',
      'Fumar dentro del vehiculo',
      'Cruzar fronteras internacionales sin autorizacion escrita',
      'Sobrecargar el vehiculo o participar en competencias',
      'Realizar modificaciones al vehiculo sin autorizacion',
    ],
    muestraDeducibles: true,
    terminacion: ['Incumplimiento de cualquier clausula contractual', 'Uso indebido o actos ilicitos con el vehiculo', 'Falsedad de informacion proporcionada', 'Riesgo inminente para el vehiculo o terceros'],
  },
  traslado: {
    tituloPartes:    'Obligaciones de las partes',
    rolArrendador:   'EL PRESTADOR DEL SERVICIO',
    rolArrendatario: 'EL CLIENTE',
    introProveedor:  "EL PRESTADOR DEL SERVICIO (Tz'unun AutoRentas) se compromete a:",
    obligacionesProveedor: [
      'Prestar el servicio de transporte de pasajeros durante las fechas, horarios, rutas y destinos acordados en la cotizacion.',
      'Proporcionar vehiculo en optimas condiciones mecanicas, de seguridad y con documentacion vigente.',
      'Asignar conductor propio, debidamente autorizado, manteniendo la operacion y control del vehiculo durante todo el servicio.',
      'Cubrir el combustible correspondiente al servicio cotizado.',
      'Coordinar el itinerario, los puntos de abordaje y dar seguimiento durante el servicio.',
      'Cumplir las disposiciones de transito y migratorias de los paises en ruta.',
    ],
    introCliente:    'EL CLIENTE se compromete a:',
    obligacionesCliente: [
      'Presentar la documentacion requerida para el viaje (incluidos pasaportes y visas para cruces internacionales).',
      'Abordar en los puntos y horarios pactados; la espera se sujetara a las condiciones acordadas.',
      'No subir al vehiculo personas ajenas al grupo contratado.',
      'No fumar, ingerir alcohol ni sustancias prohibidas a bordo.',
      'No solicitar desvios o paradas no programadas sin previo acuerdo.',
      'Cuidar el vehiculo y sus accesorios durante el trayecto.',
      'Comunicar con antelacion cualquier cambio de itinerario.',
    ],
    responsablePor: [],
    restricciones: [
      'Transportar pasajeros ajenos al grupo pactado',
      'Introducir mercancia prohibida o ilegal al vehiculo',
      'Fumar o consumir alcohol a bordo',
      'Modificar la ruta o el itinerario sin autorizacion previa',
      'Sobrecargar el vehiculo mas alla de su capacidad',
    ],
    muestraDeducibles: false,
    terminacion: ['Incumplimiento de cualquier clausula contractual', 'Riesgo inminente para la seguridad de los pasajeros o del vehiculo', 'Falsedad de informacion proporcionada', 'Uso del servicio para fines ilicitos'],
  },
  corporativo: {
    tituloPartes:    'Obligaciones de las partes',
    rolArrendador:   'EL PRESTADOR DEL SERVICIO',
    rolArrendatario: 'EL CLIENTE',
    introProveedor:  "EL PRESTADOR DEL SERVICIO (Tz'unun AutoRentas) se compromete a:",
    obligacionesProveedor: [
      'Prestar el transporte corporativo acordado durante el periodo, frecuencia, rutas, zonas y horarios pactados.',
      'Asignar los vehiculos y conductores indicados, manteniendo la operacion y control de las unidades.',
      'Mantener las unidades en condiciones optimas, con documentacion y seguro vigentes.',
      'Garantizar puntualidad y seguimiento durante la vigencia del servicio.',
      'Cumplir las disposiciones de transito aplicables.',
    ],
    introCliente:    'EL CLIENTE se compromete a:',
    obligacionesCliente: [
      'Proporcionar la informacion y acceso necesarios para la prestacion del servicio.',
      'Comunicar con antelacion cambios de horarios, rutas o servicios.',
      'Utilizar las unidades exclusivamente para el personal autorizado.',
      'Cumplir con la forma de facturacion y pago acordada.',
    ],
    responsablePor: [],
    restricciones: [
      'Utilizar las unidades para fines ajenos al servicio contratado',
      'Ceder o subcontratar el servicio a terceros',
      'Transportar mercancia prohibida o ilegal',
      'Fumar o consumir alcohol a bordo',
      'Sobrecargar las unidades mas alla de su capacidad',
    ],
    muestraDeducibles: false,
    terminacion: ['Incumplimiento de cualquier clausula contractual', 'Falsedad de informacion proporcionada', 'Impago en los terminos acordados', 'Uso del servicio para fines ilicitos'],
  },
  logistica: {
    tituloPartes:    'Obligaciones de las partes',
    rolArrendador:   'EL PRESTADOR DEL SERVICIO',
    rolArrendatario: 'EL CLIENTE',
    introProveedor:  "EL PRESTADOR DEL SERVICIO (Tz'unun AutoRentas) se compromete a:",
    obligacionesProveedor: [
      'Transportar la carga descrita desde el origen hasta el destino en las fechas y horarios pactados.',
      'Asignar vehiculo adecuado a la capacidad y caracteristicas de la carga.',
      'Mantener la operacion y control del vehiculo durante todo el servicio.',
      'Coordinar y dar seguimiento a la carga durante el trayecto.',
      'Cumplir las disposiciones de transito y de transporte aplicables.',
    ],
    introCliente:    'EL CLIENTE se compromete a:',
    obligacionesCliente: [
      'Preparar, embalar y entregar la carga en condiciones aptas para su transporte.',
      'Proporcionar la documentacion y especificaciones de la carga (peso, volumen, manejo especial).',
      'Coordinar las operaciones de carga y descarga en los puntos acordados.',
      'Designar o informar el responsable de entrega y recepcion.',
      'Declarar cualquier condicion especial o riesgo de la carga.',
    ],
    responsablePor: [],
    restricciones: [
      'Mercancia prohibida o ilegal',
      'Carga peligrosa no declarada o sin la documentacion requerida',
      'Sobrepasar la capacidad de carga del vehiculo',
      'Fumar o manipular la carga sin autorizacion',
      'Modificar puntos de carga o descarga sin previo acuerdo',
    ],
    muestraDeducibles: false,
    terminacion: ['Incumplimiento de cualquier clausula contractual', 'Declaracion falsa de la carga', 'Falsedad de informacion proporcionada', 'Riesgo inminente para la carga, el vehiculo o terceros'],
  },
};

const CLAUSULAS_VACIO = {
  tituloPartes: 'Obligaciones de las partes', rolArrendador: 'EL PRESTADOR DEL SERVICIO', rolArrendatario: 'EL CLIENTE',
  introProveedor: '', obligacionesProveedor: [], introCliente: '', obligacionesCliente: [], responsablePor: [],
  restricciones: [], muestraDeducibles: false, terminacion: [],
};

function getContractClauses(tipo) {
  return CLAUSULAS[getContractType(tipo)] || CLAUSULAS_VACIO;
}

function getContractFields(tipo) {
  const t = getContractType(tipo);
  return {
    esRenta:      t === 'renta',
    esServicio:   t !== 'renta',
    esTraslado:   t === 'traslado',
    esCorporativo: t === 'corporativo',
    esLogistica:  t === 'logistica',
  };
}

function listaServicios(c) {
  let svc = {};
  try { svc = JSON.parse(c.servicios_incluidos || '{}'); } catch {}
  const items = [];
  if (esServicioTipo(c.tipo)) items.push('Servicio de transporte segun lo cotizado y aceptado');
  SERVICIOS_INC_FLAGS.forEach(({ k, l }) => { if (svc[k] === true) items.push(l); });
  return items;
}

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
  anticipo: 0, condiciones_cancelacion: '',
  banco: 'Banrural', numero_cuenta: '', tipo_cuenta: 'Monetaria', titular: '',
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
  // Ruta (traslados / servicios)
  origen: '', destino: '', ruta: '', itinerario: '', descripcion_servicio: '',
  num_pasajeros: 0, servicios_incluidos: '{}', servicios_no_incluidos: '',
  frecuencia: '', tarifacion: '', tipo_carga: '', responsable_entrega: '',
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
function buildContratoHTML(contrato) {
  const conductores = JSON.parse(contrato.conductores || '[]');
  const checkSal    = JSON.parse(contrato.checklist_salida  || '{}');
  const checkRet    = JSON.parse(contrato.checklist_retorno || '{}');

  const checkRow = (item, val) =>
    `<tr><td>${item.label}</td><td style="text-align:center;font-weight:700;color:${val ? '#16A34A' : '#DC2626'}">${val ? 'OK' : '---'}</td></tr>`;

  const css = `
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
    .page-break-before{display:block;height:0;page-break-before:always}
  `;
  const tipo       = getContractType(contrato.tipo);
  const esServicio = tipo !== 'renta';
  const C          = getContractClauses(tipo);
  const F          = getContractFields(tipo);
  const tituloDoc  = getContractTitle(tipo);
  const logoURL    = window.location.origin + '/icons/Logo_Tzunun_Transp.png';
  const svcList    = listaServicios(contrato);
  const saldo      = (parseFloat(contrato.total_gtq) || 0) - (parseFloat(contrato.anticipo) || 0);

  const html = `
  <!-- HEADER -->
  <div class="header">
    <div class="brand" style="display:flex;align-items:center;gap:12px">
      <img src="${logoURL}" alt="Tz'unun AutoRentas" style="height:50px;width:auto;object-fit:contain" />
      <div>
        <h1>Tz'unun AutoRentas</h1>
        <p>Servicios de Movilidad · Transporte Corporativo · Logistica</p>
        <p>Guatemala, Centroamerica</p>
      </div>
    </div>
    <div class="doc-info">
      <div class="num">${tituloDoc}</div>
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
        <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:8px">${C.rolArrendador} — TZ'UNUN AUTORENTAS</div>
        <div class="data-item"><label>Empresa</label><span>Tz'unun AutoRentas</span></div>
        <div class="data-item" style="margin-top:6px"><label>Representante legal</label><span>${contrato.representante_nombre || '________________________________'}</span></div>
        <div class="data-item" style="margin-top:6px"><label>DPI Representante</label><span>${contrato.representante_dpi || '________________________________'}</span></div>
        ${contrato.patente_comercio ? `<div class="data-item" style="margin-top:6px"><label>Patente de comercio</label><span>${contrato.patente_comercio}</span></div>` : ''}
      </div>
      <div class="data-box">
        <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:8px">${C.rolArrendatario}</div>
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
      ${esServicio
        ? 'El vehiculo es operado por EL PRESTADOR DEL SERVICIO y se encuentra en optimas condiciones mecanicas, de seguridad y operativas.'
        : 'El vehiculo se entrega en condiciones optimas de funcionamiento mecanico y operativo.'}
    </p>
  </div>

  <!-- III. PLAZO -->
  <div class="section">
    <div class="section-title">${esServicio ? 'III. Plazo y horarios del servicio' : 'III. Plazo del arrendamiento'}</div>
    <div class="data-box">
      <div class="data-grid">
        <div class="data-item"><label>Fecha y hora de salida</label><span>${fmtD(contrato.fecha_salida)} a las ${contrato.hora_salida || '08:00'} hrs</span></div>
        <div class="data-item"><label>Fecha y hora de retorno</label><span>${contrato.fecha_retorno ? fmtD(contrato.fecha_retorno) + ' a las ' + (contrato.hora_retorno||'18:00') + ' hrs' : 'Por confirmar'}</span></div>
      </div>
    </div>
    <p style="font-size:10px;color:#64748B;margin-top:8px">
      ${esServicio
        ? 'El servicio se presta con piloto de EL PRESTADOR DEL SERVICIO. Cualquier cambio de horario o itinerario debera acordarse previamente y por escrito.'
        : 'Cualquier prorroga debera ser autorizada previamente por EL ARRENDADOR. El incumplimiento en la devolucion generara cargos adicionales y responsabilidades legales aplicables.'}
    </p>
  </div>

  <!-- III-B. RUTA E ITINERARIO (traslados / servicios) -->
  ${esServicio ? `
  <div class="section">
    <div class="section-title">Ruta e itinerario del servicio</div>
    <div class="data-box">
      <div class="data-grid">
        <div class="data-item"><label>Origen</label><span>${contrato.origen || '—'}</span></div>
        <div class="data-item"><label>Destino</label><span>${contrato.destino || '—'}</span></div>
        ${F.esTraslado ? `<div class="data-item"><label>Pasajeros</label><span>${contrato.num_pasajeros || '—'}</span></div>` : ''}
        ${F.esCorporativo ? `<div class="data-item"><label>Frecuencia</label><span>${contrato.frecuencia || '—'}</span></div>` : ''}
        ${F.esLogistica ? `<div class="data-item"><label>Tipo de carga</label><span>${contrato.tipo_carga || '—'}</span></div>` : ''}
        <div class="data-item"><label>Salida</label><span>${fmtD(contrato.fecha_salida)} a las ${contrato.hora_salida || '08:00'} hrs</span></div>
        <div class="data-item"><label>Retorno</label><span>${contrato.fecha_retorno ? fmtD(contrato.fecha_retorno) + ' a las ' + (contrato.hora_retorno||'18:00') + ' hrs' : 'Por confirmar'}</span></div>
        ${contrato.ruta ? `<div class="data-item full"><label>Ruta</label><span>${contrato.ruta}</span></div>` : ''}
        ${contrato.itinerario ? `<div class="data-item full"><label>Itinerario</label><span>${contrato.itinerario}</span></div>` : ''}
        ${contrato.responsable_entrega ? `<div class="data-item full"><label>Responsable entrega / recepcion</label><span>${contrato.responsable_entrega}</span></div>` : ''}
        ${contrato.descripcion_servicio ? `<div class="data-item full"><label>Descripcion del servicio</label><span>${contrato.descripcion_servicio}</span></div>` : ''}
      </div>
    </div>
  </div>` : ''}

  <!-- IV. PAGO -->
  <div class="page-break-before"></div>
  <div class="section">
    <div class="section-title">IV. Valor del servicio y forma de pago</div>
    <div class="fin-box">
      <div class="fin-row"><span>Concepto</span><span>${TIPOS.find(t=>t.v===contrato.tipo)?.l || contrato.tipo}</span></div>
      <div class="fin-row"><span>Forma de pago</span><span>${contrato.metodo_pago}</span></div>
      ${parseFloat(contrato.anticipo || 0) > 0 ? `
      <div class="fin-row"><span>Anticipo</span><span>Q ${fmt(contrato.anticipo)}</span></div>
      <div class="fin-row"><span>Saldo pendiente</span><span>Q ${fmt(saldo)}</span></div>` : ''}
      <div class="fin-total"><span>TOTAL A PAGAR</span><span>Q ${fmt(contrato.total_gtq)}</span></div>
    </div>
    ${(contrato.banco || contrato.numero_cuenta) ? `
    <div class="data-box" style="margin-top:10px">
      <div style="font-size:9px;font-weight:700;color:#94A3B8;margin-bottom:6px">DATOS BANCARIOS PARA TRANSFERENCIA</div>
      <div class="data-grid">
        ${contrato.banco ? `<div class="data-item"><label>Banco</label><span>${contrato.banco}</span></div>` : ''}
        ${contrato.numero_cuenta ? `<div class="data-item"><label>No. Cuenta</label><span style="font-family:monospace">${contrato.numero_cuenta}</span></div>` : ''}
        ${contrato.tipo_cuenta ? `<div class="data-item"><label>Tipo de cuenta</label><span>${contrato.tipo_cuenta}</span></div>` : ''}
        ${contrato.titular ? `<div class="data-item"><label>Titular</label><span style="font-weight:600">${contrato.titular}</span></div>` : ''}
      </div>
    </div>` : ''}
    <p style="font-size:10px;color:#64748B;margin-top:8px">
      ${esServicio
        ? 'El pago se realiza segun lo pactado en la cotizacion aprobada. Los costos no incluidos seran informados y autorizados previamente por EL CLIENTE.'
        : 'Los cargos adicionales por danos, multas, combustible, kilometraje adicional, limpieza o deducibles seran cobrados adicionalmente al valor inicial del contrato.'}
    </p>
    ${contrato.condiciones_cancelacion ? `
    <p style="font-size:10px;color:#64748B;margin-top:6px"><strong>Condiciones de cancelacion:</strong> ${contrato.condiciones_cancelacion}</p>` : ''}
  </div>

  <!-- SERVICIOS INCLUIDOS (traslados / servicios) -->
  ${esServicio ? `
  <div class="section">
    <div class="section-title">Servicios incluidos</div>
    <div class="data-box">
      <ul style="padding-left:16px">
        ${svcList.map(s => `<li style="font-size:10px;color:#475569;margin-bottom:3px">${s}</li>`).join('')}
      </ul>
      ${contrato.servicios_no_incluidos ? `<p style="font-size:10px;color:#64748B;margin-top:8px"><strong>No incluidos:</strong> ${contrato.servicios_no_incluidos}</p>` : ''}
    </div>
  </div>` : ''}

  <!-- V. RESPONSABILIDADES -->
  <div class="section">
    <div class="section-title">V. ${C.tituloPartes}</div>
    <div class="clausula">
      ${C.introProveedor && C.obligacionesProveedor.length ? `
      <p style="font-size:10px;color:#475569;margin-bottom:6px">${C.introProveedor}</p>
      <ol>
        ${C.obligacionesProveedor.map((x, i) => `<li>${x}</li>`).join('')}
      </ol>` : ''}
      ${C.introCliente && C.obligacionesCliente.length ? `
      <p style="font-size:10px;color:#475569;margin-top:${C.introProveedor ? '8px' : '0'};margin-bottom:6px">${C.introCliente}</p>
      <ol>
        ${C.obligacionesCliente.map((x, i) => `<li>${x}</li>`).join('')}
      </ol>` : ''}
      ${C.responsablePor.length ? `
      <p style="font-size:10px;color:#475569;margin-top:8px;margin-bottom:4px">${C.rolArrendatario} sera responsable por:</p>
      <ul>
        ${C.responsablePor.map(x => `<li>${x}</li>`).join('')}
      </ul>` : ''}
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
  <div class="page-break-before"></div>
  <div class="section">
    <div class="section-title">VII. Restricciones</div>
    <div class="clausula">
      <p style="font-size:10px;color:#475569;margin-bottom:4px">Queda terminantemente prohibido:</p>
      <ul>
        ${C.restricciones.map(x => `<li>${x}</li>`).join('')}
      </ul>
      <p style="font-size:10px;color:#DC2626;margin-top:6px;font-style:italic">
        El incumplimiento de estas restricciones anula cualquier cobertura o beneficio y genera responsabilidad legal.
      </p>
    </div>
  </div>

  <!-- VIII. DEDUCIBLES (solo renta) -->
  ${C.muestraDeducibles ? `
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
  </div>` : ''}

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
      ${C.rolArrendador} no se hace responsable por objetos olvidados dentro del vehiculo.
      ${C.rolArrendatario} debera revisar el vehiculo antes de retirarse.
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
      <p style="font-size:10px;color:#475569;margin-bottom:4px">${C.rolArrendador} podra dar por terminado el contrato de forma inmediata en caso de:</p>
      <ul>
        ${C.terminacion.map(x => `<li>${x}</li>`).join('')}
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
          <div class="firma-title">${C.rolArrendador}</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">${contrato.representante_nombre || ''}</div>
        </div>
      </div>
      <div class="firma-box">
        ${contrato.firma_arrendatario ? `<img src="${contrato.firma_arrendatario}" class="firma-img" alt="Firma arrendatario"/>` : '<div class="firma-img"></div>'}
        <div class="firma-line">
          <div class="firma-name">${contrato.cliente_nombre || '________________________________'}</div>
          <div class="firma-title">${C.rolArrendatario}</div>
          <div style="font-size:9px;color:#94A3B8;margin-top:2px">DPI: ${contrato.cliente_dpi || contrato.cliente_nit || '—'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <strong>Tz'unun AutoRentas</strong> — Conduciendo confianza, llegando mas lejos.<br/>
    Contrato No. ${contrato.numero} | Guatemala, Centroamerica | ${new Date().toLocaleDateString('es-GT')}
  </div>

  `;
  return { html, css };
}

const generarPDFContrato = (contrato) => {
  const { html, css } = buildContratoHTML(contrato);
  const numero = contrato.numero || 'S-N';
  generarPDF({ html, css, filename: `Contrato_${numero}.pdf` });
};

const generarPDFContratoEditable = (contrato) => {
  const { html, css } = buildContratoHTML(contrato);
  const numero = contrato.numero || 'S-N';
  generarPDFEditable({ html, css, filename: `Contrato_${numero}_editable.pdf` });
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
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const F = getContractFields(f.tipo);
  const C = getContractClauses(f.tipo);

  useEffect(() => {
    Promise.all([
      dbGet('vehiculos', '&order=marca.asc'),
      dbGet('reservas', '&estado=in.(confirmada,en_curso)&order=fecha_inicio.desc&limit=50'),
      dbGet('cuentas_bancarias', '&select=id,banco,numero_cuenta,tipo_cuenta,moneda,titular&order=banco.asc'),
    ]).then(([v, r, cb]) => {
      setVehiculos(Array.isArray(v) ? v : []);
      setReservas(Array.isArray(r) ? r : []);
      setCuentasBancarias(Array.isArray(cb) ? cb : []);
    });
  }, []);

  // Auto-fill datos bancarios desde cuenta del módulo Banca
  const cargarCuentaBancaria = (id) => {
    if (!id) return;
    const c = cuentasBancarias.find(x => x.id === id);
    if (!c) return;
    setF(p => ({
      ...p,
      banco: c.banco || p.banco,
      numero_cuenta: c.numero_cuenta || p.numero_cuenta,
      tipo_cuenta: c.tipo_cuenta ? (c.tipo_cuenta.charAt(0).toUpperCase() + c.tipo_cuenta.slice(1)) : p.tipo_cuenta,
      titular: c.titular || p.titular,
    }));
  };

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
      hora_salida:     r.hora_entrega   || p.hora_salida,
      hora_retorno:    r.hora_regreso   || p.hora_retorno,
      total_gtq:       r.total_gtq      || p.total_gtq,
      metodo_pago:     r.metodo_pago    || p.metodo_pago,
      anticipo:        r.anticipo       || p.anticipo,
      origen:          r.origen         || p.origen,
      destino:         r.destino        || p.destino,
      ruta:            r.ruta           || p.ruta,
      itinerario:      r.itinerario     || p.itinerario,
      descripcion_servicio: r.descripcion_servicio || p.descripcion_servicio,
      servicios_incluidos:  r.servicios_incluidos  || p.servicios_incluidos,
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
        anticipo:             parseFloat(f.anticipo) || 0,
        condiciones_cancelacion: f.condiciones_cancelacion || null,
        banco:                f.banco                || null,
        numero_cuenta:        f.numero_cuenta        || null,
        tipo_cuenta:          f.tipo_cuenta          || null,
        titular:              f.titular              || null,
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
        // Ruta y servicio (traslados / servicios)
        origen:               f.origen               || null,
        destino:              f.destino              || null,
        ruta:                 f.ruta                 || null,
        itinerario:           f.itinerario           || null,
        descripcion_servicio: f.descripcion_servicio || null,
        num_pasajeros:        parseInt(f.num_pasajeros) || 0,
        servicios_incluidos:  f.servicios_incluidos  || '{}',
        servicios_no_incluidos: f.servicios_no_incluidos || null,
        frecuencia:           f.frecuencia           || null,
        tarifacion:           f.tarifacion           || null,
        tipo_carga:           f.tipo_carga           || null,
        responsable_entrega:  f.responsable_entrega  || null,
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
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>{C.rolArrendador} — TZ'UNUN</div>
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
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>{C.rolArrendatario}</div>
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
              {F.esRenta ? (
                <>
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
                </>
              ) : (
                <>
                  {F.esTraslado && <Fld label="NUM. PASAJEROS"><input style={S.inp} type="number" min="1" value={f.num_pasajeros} onChange={e => sf('num_pasajeros', e.target.value)} placeholder="Ej. 6" /></Fld>}
                  {F.esLogistica && <Fld label="TIPO DE CARGA"><input style={S.inp} value={f.tipo_carga} onChange={e => sf('tipo_carga', e.target.value)} placeholder="Ej. Encomiendas, equipaje..." /></Fld>}
                  {F.esLogistica && <Fld label="RESPONSABLE ENTREGA / RECEPCION"><input style={S.inp} value={f.responsable_entrega} onChange={e => sf('responsable_entrega', e.target.value)} placeholder="Nombre o area" /></Fld>}
                  {F.esCorporativo && <Fld label="FRECUENCIA"><input style={S.inp} value={f.frecuencia} onChange={e => sf('frecuencia', e.target.value)} placeholder="Ej. Diario, semanal, por evento..." /></Fld>}
                </>
              )}
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

          {/* RUTA E ITINERARIO — solo para traslados / servicios */}
          {F.esServicio && (
            <div style={S.card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>RUTA E ITINERARIO DEL SERVICIO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Fld label="ORIGEN"><input style={S.inp} value={f.origen} onChange={e => sf('origen', e.target.value)} placeholder="Ciudad de origen" /></Fld>
                <Fld label="DESTINO"><input style={S.inp} value={f.destino} onChange={e => sf('destino', e.target.value)} placeholder="Ciudad de destino" /></Fld>
                <Fld label="RUTA"><input style={S.inp} value={f.ruta} onChange={e => sf('ruta', e.target.value)} placeholder="Via Coban, ruta alternativa..." /></Fld>
                <Fld label="DESCRIPCION DEL SERVICIO"><input style={S.inp} value={f.descripcion_servicio} onChange={e => sf('descripcion_servicio', e.target.value)} placeholder="Traslado desde... hacia..." /></Fld>
                <div style={{ gridColumn: 'span 2' }}>
                  <Fld label="ITINERARIO"><textarea style={{ ...S.inp, minHeight: 60, resize: 'vertical' }} value={f.itinerario} onChange={e => sf('itinerario', e.target.value)} placeholder="Dia 1: salida de Guatemala... Dia 2: regreso..." /></Fld>
                </div>
              </div>
            </div>
          )}

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
                {F.esServicio
                  ? 'Sin conductores registrados — el conductor es asignado y operado por Tz\'unun'
                  : 'Sin conductores registrados — el arrendatario conduce el vehiculo'}
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
            <div style={{ display: 'grid', gridTemplateColumns: F.esServicio ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
              <Fld label="TOTAL DEL CONTRATO (Q) *">
                <input style={{ ...S.inp, fontSize: 16, fontWeight: 700, color: T.acc }} type="number" step="0.01"
                  value={f.total_gtq} onChange={e => sf('total_gtq', e.target.value)} placeholder="0.00" />
              </Fld>
              {F.esServicio && (
                <Fld label="ANTICIPO (Q)">
                  <input style={S.inp} type="number" step="0.01" value={f.anticipo}
                    onChange={e => sf('anticipo', e.target.value)} placeholder="0.00" />
                </Fld>
              )}
              <Fld label="MÉTODO DE PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e => sf('metodo_pago', e.target.value)}>
                  {['efectivo','transferencia','cheque','tarjeta','deposito'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </Fld>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DATOS BANCARIOS</div>
            {cuentasBancarias.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Fld label="USAR CUENTA DEL MÓDULO BANCA (auto-completa)">
                  <select style={S.sel} value="" onChange={e => { if (e.target.value) cargarCuentaBancaria(e.target.value); e.target.value = ""; }}>
                    <option value="">Seleccionar cuenta...</option>
                    {cuentasBancarias.map(c => (
                      <option key={c.id} value={c.id}>{c.banco} — {c.numero_cuenta} ({c.moneda}){c.titular ? " — Titular: " + c.titular : ""}</option>
                    ))}
                  </select>
                </Fld>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Fld label="BANCO"><input style={S.inp} value={f.banco} onChange={e => sf('banco', e.target.value)} placeholder="Banrural" /></Fld>
              <Fld label="NO. CUENTA"><input style={S.inp} value={f.numero_cuenta} onChange={e => sf('numero_cuenta', e.target.value)} placeholder="000-000000-00" /></Fld>
              <Fld label="TIPO DE CUENTA"><input style={S.inp} value={f.tipo_cuenta} onChange={e => sf('tipo_cuenta', e.target.value)} placeholder="Monetaria" /></Fld>
              <Fld label="TITULAR DE LA CUENTA" span2>
                <input style={S.inp} value={f.titular} onChange={e => sf('titular', e.target.value)} placeholder="Nombre del titular de la cuenta" />
              </Fld>
            </div>
          </div>
          {F.esRenta && (
            <div style={S.card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>DEDUCIBLES EN CASO DE SINIESTRO (Q)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Fld label="COLISIONES Y VUELCOS"><input style={S.inp} type="number" value={f.deducible_colision} onChange={e => sf('deducible_colision', e.target.value)} /></Fld>
                <Fld label="ROBO O HURTO"><input style={S.inp} type="number" value={f.deducible_robo} onChange={e => sf('deducible_robo', e.target.value)} /></Fld>
                <Fld label="DAÑOS A TERCEROS"><input style={S.inp} type="number" value={f.deducible_terceros} onChange={e => sf('deducible_terceros', e.target.value)} /></Fld>
              </div>
            </div>
          )}

          {F.esServicio && (
            <>
              {F.esCorporativo && (
                <div style={S.card}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>TARIFACIÓN CORPORATIVA</div>
                  <Fld label="ESQUEMA DE TARIFACIÓN">
                    <input style={S.inp} value={f.tarifacion} onChange={e => sf('tarifacion', e.target.value)}
                      placeholder="Ej. Precio por servicio, por dia, por ruta, mensual..." />
                  </Fld>
                </div>
              )}
              <div style={S.card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>SERVICIOS INCLUIDOS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {(() => {
                    const svc = JSON.parse(f.servicios_incluidos || '{}');
                    return SERVICIOS_INC_FLAGS.map(({ k, l }) => (
                      <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 11px', borderRadius: 8, background: svc[k] ? T.accDim : T.surf, border: `1px solid ${svc[k] ? T.acc : T.bord}`, fontSize: 12, userSelect: 'none' }}>
                        <input type="checkbox" checked={svc[k] === true}
                          onChange={e => sf('servicios_incluidos', JSON.stringify({ ...svc, [k]: e.target.checked }))} style={{ accentColor: T.acc }} />
                        {l}
                      </label>
                    ));
                  })()}
                </div>
                <Fld label="SERVICIOS NO INCLUIDOS">
                  <textarea style={{ ...S.inp, minHeight: 50, resize: 'vertical' }} value={f.servicios_no_incluidos}
                    onChange={e => sf('servicios_no_incluidos', e.target.value)}
                    placeholder="Ej. Alimentacion de pasajeros, visados, estadias..." />
                </Fld>
                <div style={{ marginTop: 10 }}>
                  <Fld label="CONDICIONES DE CANCELACION">
                    <textarea style={{ ...S.inp, minHeight: 50, resize: 'vertical' }} value={f.condiciones_cancelacion}
                      onChange={e => sf('condiciones_cancelacion', e.target.value)}
                      placeholder="Ej. Cancelacion gratuita 48h antes; despues aplica 50%..." />
                  </Fld>
                </div>
              </div>
            </>
          )}

          <div style={S.card}>
            <Fld label="OBSERVACIONES ADICIONALES">
              <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' }} value={f.observaciones} onChange={e => sf('observaciones', e.target.value)} placeholder="Condiciones especiales, acuerdos particulares..." />
            </Fld>
          </div>
        </div>
      )}

      {/* ── PASO 5: CHECKLIST (solo renta) / CONDICIONES (servicios) ── */}
      {paso === 5 && (
        F.esRenta ? (
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
        ) : (
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 12 }}>
              Condiciones especiales del servicio
            </div>
            <Fld label="DAÑOS PREVIOS DOCUMENTADOS / NOTAS">
              <textarea style={{ ...S.inp, minHeight: 80, resize: 'vertical' }}
                value={f.danos_previos} onChange={e => sf('danos_previos', e.target.value)}
                placeholder="Observaciones del vehiculo, condiciones especiales o acuerdos particulares..." />
            </Fld>
          </div>
        )
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
              <FirmaDigital label={`FIRMA DEL ${C.rolArrendador} (Tz'unun AutoRentas)`}
                valor={f.firma_arrendador} onChange={v => sf('firma_arrendador', v)} />
            </div>
            <div style={S.card}>
              <FirmaDigital label={`FIRMA DEL ${C.rolArrendatario} (${f.cliente_nombre || 'Cliente'})`}
                valor={f.firma_arrendatario} onChange={v => sf('firma_arrendatario', v)} />
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 12 }}>
              Vista previa del contrato
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => generarPDFContrato(f)} style={{ ...S.btn('blue'), flex: 1 }}>
                Ver PDF completo
              </button>
              <button onClick={() => generarPDFContratoEditable(f)} style={{ ...S.btn('green'), flex: 1 }}>
                PDF editable (texto)
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
  const [vista,    setVista]    = useState('lista');
  const [editItem, setEditItem] = useState(null);
  const [filtro,   setFiltro]   = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const query = filtro !== 'todos' ? 'estado=eq.'+filtro : '';
  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload, desde, hasta } = usePaginacion({
    table: 'contratos',
    query,
    search: busqueda,
    columns: ['numero', 'cliente_nombre', 'vehiculo_nombre', 'vehiculo_placa', 'cliente_nit', 'vehiculo_marca', 'vehiculo_modelo', 'concepto', 'observaciones', 'factura_nombre', 'factura_nit'],
    order: 'created_at.desc',
  });

  const del = async (id) => {
    if (!confirm('Eliminar este contrato?')) return;
    try {
      await api(`/contratos?id=eq.${id}`, { method: 'DELETE' });
      showToast('Contrato eliminado'); reload();
    } catch (e) { showToast('Error: ' + e.message, 'err'); }
  };

  if (vista === 'form') return (
    <FormContrato initial={editItem} empId={empId} showToast={showToast}
      onSave={() => { setVista('lista'); setEditItem(null); reload(); }}
      onCancel={() => { setVista('lista'); setEditItem(null); }} />
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total',         v: total,                                                 c: T.txt   },
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
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente o numero de contrato..." />
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty icon="C" msg="Sin contratos registrados" action="+ Nuevo contrato"
          onAction={() => { setEditItem(null); setVista('form'); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(r => {
            const est = ESTADOS[r.estado] || ESTADOS.borrador;
            const tipo = TIPOS.find(t => t.v === r.tipo);
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 13 }}>
                        {r.numero}
                      </span>
                      <span style={{ fontSize: 11, color: T.sub }}>{tipo?.l || r.tipo}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: T.txt, fontSize: 14, marginTop: 2 }}>
                      {r.cliente_nombre}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", fontSize: 11, color: T.mut }}>
                      {r.vehiculo_placa && <span style={{ fontFamily: "monospace", color: T.acc }}>{r.vehiculo_placa}</span>}
                      {r.vehiculo_marca && <span>{r.vehiculo_marca} {r.vehiculo_modelo}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11, color: T.sub }}>
                      <span>Salida: {fmtD(r.fecha_salida)}</span>
                      {r.fecha_retorno && <span>Retorno: {fmtD(r.fecha_retorno)}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>Q {fmt(r.total_gtq)}</div>
                    <Badge c={est.c} bg={est.bg} l={est.l} small />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                  <button onClick={() => generarPDFContrato(r)}
                    style={{ ...S.btn("blue"), padding: "3px 7px", fontSize: 10 }}>
                    PDF
                  </button>
                  <button onClick={() => generarPDFContratoEditable(r)}
                    style={{ ...S.btn("green"), padding: "3px 7px", fontSize: 10 }}>
                    PDF editable
                  </button>
                  <button onClick={() => { setEditItem(r); setVista('form'); }}
                    style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>
                    Editar
                  </button>
                  <button onClick={() => del(r.id)}
                    style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 10 }}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta}
        pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
    </div>
  );
}
