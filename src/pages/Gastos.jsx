import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, CAT_GASTO } from '../config.js';
import { Spinner, Empty, Fld, CatBadge } from '../components/shared.jsx';

// ─── Estados del gasto ────────────────────────────────────────────
const ESTADOS = {
  pendiente:     { c: T.mut,   bg: "#1E293B",  l: "Pendiente"     },
  en_revision:   { c: T.blue,  bg: T.blueDim,  l: "En revision"   },
  aprobado:      { c: T.acc,   bg: T.accDim,   l: "Aprobado"      },
  rechazado:     { c: T.red,   bg: T.redDim,   l: "Rechazado"     },
  contabilizado: { c: T.green, bg: T.greenDim, l: "Contabilizado" },
};

const CC = {
  combustible:"#F59E0B", mantenimiento:"#3B82F6", seguros:"#A855F7",
  salarios:"#22C55E", impuestos:"#EF4444", servicios:"#00D4AA",
  llantas:"#EF4444", repuestos:"#3B82F6", hospedaje:"#8B5CF6",
  alimentacion:"#F97316", peajes:"#6B7280", oficina:"#64748B", otros:"#94A3B8",
};

// Mapa categoria → codigo de cuenta contable (catalogo Tz'unun)
const CATEGORIA_CUENTA = {
  combustible: "5.1", mantenimiento: "5.2", llantas: "5.3",
  repuestos: "5.3", seguros: "5.4", salarios: "6.1",
  servicios: "6.4", oficina: "6.5", papeleria: "6.5",
  alimentacion: "6.7", hospedaje: "6.7", impuestos: "6.9",
  peajes: "6.11", otros: "6.11",
};

const EF = {
  fecha: today(), categoria: "combustible", descripcion: "",
  proveedor: "", proveedor_id: "", proveedor_nit: "",
  numero_factura: "", subtotal: "", impuestos: "", total: "",
  metodo_pago: "efectivo", referencia: "", estado: "pendiente",
  empleado_nombre: "", vehiculo_id: "", vehiculo_nombre: "",
  reserva_id: "", notas: "", archivo_url: "", archivo_tipo: "", moneda: "GTQ",
};

// ─── API helper ───────────────────────────────────────────────────
async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) }, ...rest,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// OCR GRATUITO — Tesseract.js + PDF.js (sin API key)
// ═══════════════════════════════════════════════════════════════════
const cargarScript = (url) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
  const s = document.createElement('script');
  s.src = url; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

const parsearTextoFactura = (texto) => {
  const result = { proveedor: '', proveedor_nit: '', fecha: '', numero_factura: '', subtotal: 0, impuestos: 0, total: 0, descripcion: '' };

  // NIT Guatemala: XXXXXXXX-X o XXXXXXXXX
  const nitMatch = texto.match(/(?:nit|n\.i\.t\.?)[:\s]*([0-9]{5,8}[-–]?[0-9kK])/i);
  if (nitMatch) result.proveedor_nit = nitMatch[1].replace('–', '-');

  // Fecha: dd/mm/yyyy o dd-mm-yyyy o yyyy-mm-dd
  const f1 = texto.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
  const f2 = texto.match(/(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/);
  if (f1) result.fecha = `${f1[3]}-${f1[2].padStart(2,'0')}-${f1[1].padStart(2,'0')}`;
  else if (f2) result.fecha = `${f2[1]}-${f2[2]}-${f2[3]}`;

  // Numero de factura / serie
  const facMatch = texto.match(/(?:factura|serie|doc|no\.?|numero)[:\s#]*([A-Z0-9\-]{4,20})/i);
  if (facMatch) result.numero_factura = facMatch[1].trim();

  // Total
  const totMatch = texto.match(/(?:total\s*(?:a\s*pagar)?|gran\s*total)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (totMatch) result.total = parseFloat(totMatch[1].replace(/,/g, '')) || 0;

  // IVA / impuesto
  const ivaMatch = texto.match(/(?:iva|impuesto(?:\s*12%)?)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (ivaMatch) result.impuestos = parseFloat(ivaMatch[1].replace(/,/g, '')) || 0;

  // Subtotal
  const subMatch = texto.match(/(?:subtotal|sub[\s\-]total)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (subMatch) result.subtotal = parseFloat(subMatch[1].replace(/,/g, '')) || 0;
  else if (result.total && result.impuestos) result.subtotal = result.total - result.impuestos;

  // Descripcion (primeras lineas utiles)
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 4 && l.length < 80);
  result.descripcion = lineas.slice(0, 2).join(' — ').slice(0, 100);

  return result;
};

const escanearImagen = async (base64, setProgreso) => {
  try {
    setProgreso("Cargando motor OCR...");
    await cargarScript('https://unpkg.com/tesseract.js@5/dist/tesseract.min.js');
    setProgreso("Reconociendo texto...");
    const { data: { text } } = await window.Tesseract.recognize(base64, 'spa+eng', {
      logger: m => { if (m.status === 'recognizing text') setProgreso(`OCR: ${Math.round(m.progress * 100)}%`); }
    });
    setProgreso("Extrayendo datos...");
    return parsearTextoFactura(text);
  } catch (e) {
    console.error('OCR error:', e);
    return null;
  }
};

const escanearPDF = async (base64, setProgreso) => {
  try {
    setProgreso("Cargando lector PDF...");
    await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    setProgreso("Leyendo PDF...");
    const binStr = atob(base64.split(',')[1]);
    const bytes  = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    const pdf  = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    let texto  = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map(it => it.str).join(' ') + '\n';
    }
    if (texto.trim().length > 20) {
      setProgreso("Extrayendo datos...");
      return parsearTextoFactura(texto);
    }
    // PDF escaneado → usar Tesseract sobre la primera página
    setProgreso("PDF escaneado, usando OCR...");
    const page    = await pdf.getPage(1);
    const vp      = page.getViewport({ scale: 2 });
    const canvas  = document.createElement('canvas');
    canvas.width  = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    return escanearImagen(canvas.toDataURL('image/png'), setProgreso);
  } catch (e) {
    console.error('PDF scan error:', e);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// BUSCADOR DE PROVEEDORES con autocompletado
// ═══════════════════════════════════════════════════════════════════
function BuscadorProveedor({ value, nit, onChange, onNitChange, proveedores, empId, showToast }) {
  const [query,   setQuery]   = useState(value || '');
  const [open,    setOpen]    = useState(false);
  const [creating,setCreating]= useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newNit,    setNewNit]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtrados = query.length >= 1
    ? proveedores.filter(p =>
        p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
        p.nit?.includes(query)
      ).slice(0, 8)
    : proveedores.slice(0, 8);

  const seleccionar = (p) => {
    setQuery(p.nombre);
    onChange(p.nombre, p.id);
    if (p.nit) onNitChange(p.nit);
    setOpen(false);
    setCreating(false);
  };

  const crearNuevo = async () => {
    if (!newNombre.trim()) { showToast('Nombre requerido', 'err'); return; }
    setSaving(true);
    const r = await dbIns('proveedores', { nombre: newNombre, nit: newNit, tipo: 'otros', empresa_id: empId, activo: true });
    if (r?.error) { showToast('Error al crear proveedor: ' + r.error, 'err'); setSaving(false); return; }
    showToast('Proveedor creado');
    seleccionar({ nombre: newNombre, nit: newNit, id: r?.id });
    setCreating(false); setNewNombre(''); setNewNit('');
    setSaving(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input style={S.inp} value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value, ''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar por nombre o NIT..." />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.card, border: `1px solid ${T.bord}`, borderRadius: 10, zIndex: 200, maxHeight: 280, overflowY: 'auto', marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
          {filtrados.map(p => (
            <div key={p.id} onClick={() => seleccionar(p)}
              style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.bord}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{p.nombre}</div>
                {p.nit && <div style={{ fontSize: 10, color: T.sub }}>NIT: {p.nit}</div>}
              </div>
              <div style={{ fontSize: 10, color: T.mut }}>{p.tipo || ''}</div>
            </div>
          ))}
          {filtrados.length === 0 && !creating && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: T.mut }}>
              No encontrado — "{query}"
            </div>
          )}
          {!creating ? (
            <div onClick={() => { setCreating(true); setNewNombre(query); setOpen(true); }}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 12, color: T.acc, fontWeight: 600, borderTop: `1px solid ${T.bord}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              + Crear nuevo proveedor{query ? ` "${query}"` : ''}
            </div>
          ) : (
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.bord}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 8 }}>NUEVO PROVEEDOR</div>
              <input style={{ ...S.inp, marginBottom: 8, fontSize: 12 }} value={newNombre}
                onChange={e => setNewNombre(e.target.value)} placeholder="Nombre / Razon social *" />
              <input style={{ ...S.inp, marginBottom: 8, fontSize: 12 }} value={newNit}
                onChange={e => setNewNit(e.target.value)} placeholder="NIT (opcional)" />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={crearNuevo} disabled={saving} style={{ ...S.btn('primary'), flex: 2, fontSize: 11, padding: 7 }}>
                  {saving ? '...' : 'Crear y seleccionar'}
                </button>
                <button onClick={() => setCreating(false)} style={{ ...S.btn('ghost'), flex: 1, fontSize: 11, padding: 7 }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UPLOAD DE DOCUMENTOS con OCR gratuito
// ═══════════════════════════════════════════════════════════════════
function FileUpload({ onFile, preview, tipo }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const handle = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => onFile(e.target.result, file.type, file.name);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        style={{ border: `2px dashed ${drag ? T.acc : T.bord}`, borderRadius: 12, padding: '20px 14px', textAlign: 'center', cursor: 'pointer', background: drag ? T.accDim : 'transparent', transition: 'all .15s' }}>
        <div style={{ fontSize: 28, marginBottom: 6, color: T.acc }}>DOC</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>Arrastra o haz clic para subir</div>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>PDF, JPG, PNG — Facturas y recibos</div>
        <div style={{ fontSize: 10, color: T.acc, marginTop: 4 }}>OCR automatico gratuito incluido</div>
        <input ref={ref} type="file" accept=".pdf,image/*" style={{ display: 'none' }}
          onChange={e => handle(e.target.files[0])} />
      </div>
      {preview && (
        <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.bord}`, maxHeight: 220 }}>
          {tipo?.startsWith('image') ? (
            <img src={preview} alt="Documento" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', background: T.surf }} />
          ) : (
            <div style={{ background: T.surf, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4, color: T.blue }}>PDF</div>
              <div style={{ fontSize: 11, color: T.sub }}>Archivo PDF cargado</div>
              <a href={preview} target="_blank" rel="noreferrer"
                style={{ ...S.btn('primary'), display: 'inline-block', marginTop: 6, fontSize: 11, textDecoration: 'none', padding: '5px 12px' }}>
                Ver PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PANEL DE DETALLE / APROBACION
// ═══════════════════════════════════════════════════════════════════
function GastoPanel({ gasto, onClose, onAprobar, onRechazar, onContabilizar, empId, userName }) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazo,   setShowRechazo]   = useState(false);
  if (!gasto) return null;
  const e = ESTADOS[gasto.estado] || ESTADOS.pendiente;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300 }} onClick={onClose}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 420, background: T.card, borderLeft: `1px solid ${T.bord}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        onClick={ev => ev.stopPropagation()}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{gasto.descripcion?.slice(0, 30) || 'Gasto'}</div>
            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: e.bg, color: e.c }}>{e.l}</span>
          </div>
          <button onClick={onClose} style={{ ...S.btn('ghost'), padding: '4px 10px' }}>X</button>
        </div>

        {gasto.archivo_url && (
          <div style={{ borderBottom: `1px solid ${T.bord}`, background: T.surf }}>
            {gasto.archivo_tipo?.startsWith('image') ? (
              <img src={gasto.archivo_url} alt="Documento" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4, color: T.blue }}>PDF</div>
                <a href={gasto.archivo_url} target="_blank" rel="noreferrer"
                  style={{ ...S.btn('primary'), display: 'inline-block', fontSize: 11, textDecoration: 'none', padding: '5px 12px' }}>
                  Ver documento
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '14px 18px', flex: 1 }}>
          {[
            ['Fecha',      fmtD(gasto.fecha)],
            ['Proveedor',  gasto.proveedor || '—'],
            ['NIT',        gasto.proveedor_nit || '—'],
            ['No. Factura',gasto.numero_factura || '—'],
            ['Categoria',  gasto.categoria],
            ['Empleado',   gasto.empleado_nombre || '—'],
            ['Vehiculo',   gasto.vehiculo_nombre || '—'],
            ['Metodo',     gasto.metodo_pago],
            ['Referencia', gasto.referencia || '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.bord}18`, fontSize: 12 }}>
              <span style={{ color: T.sub }}>{l}</span>
              <span style={{ fontWeight: 500, color: T.txt }}>{v}</span>
            </div>
          ))}

          <div style={{ background: T.surf, borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
            {parseFloat(gasto.subtotal) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.sub, padding: '2px 0' }}><span>Subtotal</span><span>Q {fmt(gasto.subtotal)}</span></div>}
            {parseFloat(gasto.impuestos) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.sub, padding: '2px 0' }}><span>Impuestos</span><span>Q {fmt(gasto.impuestos)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: T.red, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.bord}` }}>
              <span>TOTAL</span><span>Q {fmt(gasto.total)}</span>
            </div>
          </div>

          {gasto.notas && <div style={{ marginTop: 10, fontSize: 12, color: T.sub, fontStyle: 'italic' }}>{gasto.notas}</div>}
          {gasto.aprobado_por && <div style={{ marginTop: 10, fontSize: 11, color: T.acc }}>Aprobado por: {gasto.aprobado_por}</div>}
          {gasto.rechazado_por && <div style={{ marginTop: 6, fontSize: 11, color: T.red }}>Rechazado: {gasto.motivo_rechazo}</div>}

          {gasto.estado === 'aprobado' && !gasto.contabilizado && (
            <div style={{ marginTop: 14, background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 6 }}>ASIENTO CONTABLE PENDIENTE</div>
              <div style={{ fontSize: 11, color: T.sub }}>DEBE: Cuenta de gasto ({gasto.categoria}) — Q {fmt(gasto.total)}</div>
              <div style={{ fontSize: 11, color: T.sub }}>HABER: Caja / Banco — Q {fmt(gasto.total)}</div>
            </div>
          )}
          {gasto.contabilizado && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 8, fontSize: 11, color: T.green, fontWeight: 600 }}>
              Asiento contable publicado
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.bord}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gasto.estado === 'pendiente' && (
            <button onClick={() => onAprobar(gasto, 'en_revision')} style={{ ...S.btn('blue'), width: '100%' }}>Enviar a revision</button>
          )}
          {gasto.estado === 'en_revision' && (
            <>
              <button onClick={() => onAprobar(gasto, 'aprobado')} style={{ ...S.btn('primary'), width: '100%' }}>Aprobar gasto</button>
              {!showRechazo ? (
                <button onClick={() => setShowRechazo(true)} style={{ ...S.btn('danger'), width: '100%' }}>Rechazar</button>
              ) : (
                <div>
                  <input style={{ ...S.inp, marginBottom: 6 }} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo del rechazo..." />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { onRechazar(gasto, motivoRechazo); setShowRechazo(false); setMotivoRechazo(''); }} style={{ ...S.btn('danger'), flex: 1 }}>Confirmar rechazo</button>
                    <button onClick={() => setShowRechazo(false)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}
          {gasto.estado === 'aprobado' && !gasto.contabilizado && (
            <button onClick={() => onContabilizar(gasto)} style={{ ...S.btn('green'), width: '100%' }}>Publicar asiento contable</button>
          )}
          {gasto.estado === 'rechazado' && (
            <button onClick={() => onAprobar(gasto, 'pendiente')} style={{ ...S.btn('ghost'), width: '100%' }}>Reactivar como pendiente</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FORMULARIO DE GASTO
// ═══════════════════════════════════════════════════════════════════
function FormGasto({ initial, empId, proveedores, vehiculos, reservas, empleados, onSave, onCancel, showToast }) {
  const [f, setF] = useState(initial ? { ...EF, ...initial, subtotal: initial.subtotal || '', impuestos: initial.impuestos || '', total: initial.total || '' } : { ...EF });
  const [saving,   setSaving]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progreso, setProgreso] = useState('');
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const calcTotal = (sub, imp) => {
    const t = (parseFloat(sub) || 0) + (parseFloat(imp) || 0);
    sf('total', t > 0 ? t.toFixed(2) : '');
  };

  const onFile = async (base64, tipo, nombre) => {
    sf('archivo_url', base64); sf('archivo_tipo', tipo);
    setScanning(true);
    setProgreso('Iniciando analisis...');
    try {
      const datos = tipo === 'application/pdf' || nombre?.endsWith('.pdf')
        ? await escanearPDF(base64, setProgreso)
        : await escanearImagen(base64, setProgreso);
      if (datos && (datos.total || datos.proveedor_nit || datos.fecha)) {
        setF(p => ({
          ...p,
          fecha:          datos.fecha          || p.fecha,
          proveedor_nit:  datos.proveedor_nit  || p.proveedor_nit,
          numero_factura: datos.numero_factura || p.numero_factura,
          subtotal:       datos.subtotal       || p.subtotal,
          impuestos:      datos.impuestos      || p.impuestos,
          total:          datos.total          || p.total,
          descripcion:    datos.descripcion && !p.descripcion ? datos.descripcion : p.descripcion,
        }));
        showToast('Datos extraidos automaticamente (revisa y corrige si es necesario)');
      } else {
        showToast('OCR no pudo extraer datos, completa manualmente', 'err');
      }
    } catch { showToast('Error en OCR, completa manualmente', 'err'); }
    finally { setScanning(false); setProgreso(''); }
  };

  const guardar = async () => {
    if (!f.descripcion.trim() || !(parseFloat(f.total) > 0)) {
      showToast('Descripcion y total son requeridos', 'err'); return;
    }
    setSaving(true);
    const payload = {
      empresa_id: empId, fecha: f.fecha, categoria: f.categoria,
      descripcion: f.descripcion, proveedor: f.proveedor || '',
      proveedor_id: f.proveedor_id || null, proveedor_nit: f.proveedor_nit || '',
      numero_factura: f.numero_factura || '', subtotal: parseFloat(f.subtotal) || 0,
      impuestos: parseFloat(f.impuestos) || 0, total: parseFloat(f.total) || 0,
      metodo_pago: f.metodo_pago, referencia: f.referencia || '',
      estado: f.estado || 'pendiente', empleado_nombre: f.empleado_nombre || '',
      vehiculo_id: f.vehiculo_id || null, vehiculo_nombre: f.vehiculo_nombre || '',
      reserva_id: f.reserva_id || null, notas: f.notas || '',
      archivo_url: f.archivo_url || '', archivo_tipo: f.archivo_tipo || '', moneda: f.moneda || 'GTQ',
    };
    const r = initial?.id ? await dbUpd('gastos', initial.id, payload) : await dbIns('gastos', payload);
    if (r?.error) { showToast('Error: ' + r.error, 'err'); setSaving(false); return; }
    showToast('Gasto guardado'); setSaving(false); onSave();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>{initial?.id ? 'Editar gasto' : 'Nuevo gasto'}</div>
        <button onClick={onCancel} style={S.btn('ghost')}>Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Documento / OCR */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 10 }}>DOCUMENTO / FACTURA</div>
            <FileUpload onFile={onFile} preview={f.archivo_url} tipo={f.archivo_tipo} />
            {scanning && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: T.accDim, borderRadius: 8, fontSize: 12, color: T.acc, textAlign: 'center' }}>
                {progreso || 'Procesando...'}
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 10, color: T.mut }}>
              OCR gratuito con Tesseract.js — no requiere API key
            </div>
          </div>

          {/* Datos del gasto */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>DATOS DEL GASTO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <Fld label="FECHA">
                <input style={S.inp} type="date" value={f.fecha} onChange={e => sf('fecha', e.target.value)} />
              </Fld>
              <Fld label="CATEGORIA">
                <select style={S.sel} value={f.categoria} onChange={e => sf('categoria', e.target.value)}>
                  {CAT_GASTO.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </Fld>
              <Fld label="DESCRIPCION" span2>
                <input style={S.inp} value={f.descripcion} onChange={e => sf('descripcion', e.target.value)} placeholder="Descripcion del gasto" />
              </Fld>

              {/* Proveedor con autocompletado */}
              <Fld label="PROVEEDOR" span2>
                <BuscadorProveedor
                  value={f.proveedor} nit={f.proveedor_nit}
                  onChange={(nombre, id) => setF(p => ({ ...p, proveedor: nombre, proveedor_id: id || p.proveedor_id }))}
                  onNitChange={nit => sf('proveedor_nit', nit)}
                  proveedores={proveedores} empId={empId} showToast={showToast} />
              </Fld>

              <Fld label="NIT PROVEEDOR">
                <input style={S.inp} value={f.proveedor_nit} onChange={e => sf('proveedor_nit', e.target.value)} placeholder="1234567-8" />
              </Fld>
              <Fld label="NO. FACTURA">
                <input style={S.inp} value={f.numero_factura} onChange={e => sf('numero_factura', e.target.value)} placeholder="FAC-0001" />
              </Fld>
              <Fld label="METODO DE PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e => sf('metodo_pago', e.target.value)}>
                  {['efectivo', 'transferencia', 'deposito', 'tarjeta', 'cheque', 'credito'].map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </Fld>
              <Fld label="REFERENCIA">
                <input style={S.inp} value={f.referencia} onChange={e => sf('referencia', e.target.value)} placeholder="No. doc..." />
              </Fld>
            </div>
          </div>

          {/* Montos */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>MONTOS (GTQ)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11 }}>
              <Fld label="SUBTOTAL">
                <input style={S.inp} type="number" step="0.01" value={f.subtotal}
                  onChange={e => { sf('subtotal', e.target.value); calcTotal(e.target.value, f.impuestos); }} placeholder="0.00" />
              </Fld>
              <Fld label="IMPUESTOS (IVA)">
                <input style={S.inp} type="number" step="0.01" value={f.impuestos}
                  onChange={e => { sf('impuestos', e.target.value); calcTotal(f.subtotal, e.target.value); }} placeholder="0.00" />
              </Fld>
              <Fld label="TOTAL">
                <input style={{ ...S.inp, fontWeight: 700, color: T.red }} type="number" step="0.01"
                  value={f.total} onChange={e => sf('total', e.target.value)} placeholder="0.00" />
              </Fld>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>ASOCIAR A</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Fld label="EMPLEADO">
                {empleados.length > 0 ? (
                  <select style={S.sel} value={f.empleado_nombre} onChange={e => sf('empleado_nombre', e.target.value)}>
                    <option value="">Sin empleado</option>
                    {empleados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                ) : (
                  <input style={S.inp} value={f.empleado_nombre} onChange={e => sf('empleado_nombre', e.target.value)} placeholder="Nombre del empleado" />
                )}
              </Fld>
              <Fld label="VEHICULO">
                <select style={S.sel} value={f.vehiculo_id}
                  onChange={e => { sf('vehiculo_id', e.target.value); const v = vehiculos.find(x => x.id === e.target.value); if (v) sf('vehiculo_nombre', `${v.marca || ''} ${v.modelo || ''} (${v.placa})`); }}>
                  <option value="">Sin vehiculo</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa}</option>)}
                </select>
              </Fld>
              <Fld label="RESERVA / TRASLADO">
                <select style={S.sel} value={f.reserva_id} onChange={e => sf('reserva_id', e.target.value)}>
                  <option value="">Sin reserva</option>
                  {reservas.map(r => <option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre}</option>)}
                </select>
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>ESTADO INICIAL</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['pendiente', 'en_revision'].map(est => (
                <button key={est} onClick={() => sf('estado', est)}
                  style={{ ...S.btn(f.estado === est ? 'primary' : 'ghost'), fontSize: 11, padding: '6px 12px' }}>
                  {ESTADOS[est].l}
                </button>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <Fld label="NOTAS / OBSERVACIONES">
              <textarea style={{ ...S.inp, minHeight: 80, resize: 'vertical' }} value={f.notas}
                onChange={e => sf('notas', e.target.value)} placeholder="Observaciones adicionales..." />
            </Fld>
          </div>

          {parseFloat(f.total) > 0 && (
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: T.mut, marginBottom: 4 }}>TOTAL DEL GASTO</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: T.red }}>Q {fmt(f.total)}</div>
              {f.proveedor && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Proveedor: {f.proveedor}</div>}
              {f.empleado_nombre && <div style={{ fontSize: 11, color: T.sub }}>Por: {f.empleado_nombre}</div>}
            </div>
          )}

          <button onClick={guardar} disabled={saving} style={{ ...S.btn('primary'), width: '100%', padding: 12, fontSize: 13 }}>
            {saving ? 'Guardando...' : initial?.id ? 'Actualizar gasto' : 'Registrar gasto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTACIONES
// ═══════════════════════════════════════════════════════════════════
const exportarPDF = (rows, filtros = '') => {
  const total = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Gastos</title>
  <style>body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:20px}
  h1{color:#1B2D5C;font-size:16px;margin-bottom:4px}.sub{font-size:9px;color:#64748B;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
  td{padding:5px 8px;border-bottom:1px solid #E2E8F0;font-size:10px}.tot td{font-weight:700;background:#F1F5F9}
  @media print{body{padding:10px}}</style></head><body>
  <h1>TZ'UNUN AUTORENTAS — Reporte de Gastos</h1>
  <div class="sub">${filtros} · ${new Date().toLocaleDateString('es-GT')} · ${rows.length} registros</div>
  <table><thead><tr><th>Fecha</th><th>Descripcion</th><th>Categoria</th><th>Proveedor</th><th>Empleado</th><th>Vehiculo</th><th>Metodo</th><th>Estado</th><th>Total Q</th></tr></thead>
  <tbody>${rows.map(r => `<tr><td>${r.fecha || ''}</td><td>${r.descripcion || ''}</td><td>${r.categoria || ''}</td><td>${r.proveedor || '—'}</td><td>${r.empleado_nombre || '—'}</td><td>${r.vehiculo_nombre || '—'}</td><td>${r.metodo_pago || ''}</td><td>${ESTADOS[r.estado]?.l || r.estado}</td><td style="text-align:right;font-weight:600">Q ${fmt(r.total)}</td></tr>`).join('')}
  <tr class="tot"><td colspan="8">TOTAL</td><td style="text-align:right">Q ${fmt(total)}</td></tr></tbody></table>
  <script>window.onload=()=>window.print()<\/script></body></html>`;
  const w = window.open('', '_blank'); w.document.write(html); w.document.close();
};

const exportarExcel = (rows) => {
  const cols = ['Fecha','Descripcion','Categoria','Proveedor','NIT','No.Factura','Empleado','Vehiculo','Subtotal','Impuestos','Total','Metodo','Estado','Referencia','Notas'];
  const keys = ['fecha','descripcion','categoria','proveedor','proveedor_nit','numero_factura','empleado_nombre','vehiculo_nombre','subtotal','impuestos','total','metodo_pago','estado','referencia','notas'];
  const bom = '\uFEFF';
  const csv = [cols.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })), download: 'Gastos_Tzunun.csv' });
  a.click(); URL.revokeObjectURL(a.href);
};

// ═══════════════════════════════════════════════════════════════════
// MODULO PRINCIPAL DE GASTOS
// ═══════════════════════════════════════════════════════════════════
function ModGastos({ empId, showToast, vehiculos, reservas, empleados, proveedores }) {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState('lista');
  const [editItem,  setEditItem]  = useState(null);
  const [panelItem, setPanelItem] = useState(null);
  const [filtroEst, setFiltroEst] = useState('todos');
  const [filtroEmp, setFiltroEmp] = useState('');
  const [filtroCat, setFiltroCat] = useState('todas');
  const [filtroPer, setFiltroPer] = useState('');
  const [userName] = useState(() => { try { return JSON.parse(localStorage.getItem('tzunun_session'))?.user?.email?.split('@')[0] || 'Usuario'; } catch { return 'Usuario'; } });

  const load = async () => {
    setLoading(true);
    const d = await dbGet('gastos');
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Flujo de aprobaciones ──
  const cambiarEstado = async (gasto, nuevoEstado) => {
    const upd = { estado: nuevoEstado };
    if (nuevoEstado === 'aprobado') { upd.aprobado_por = userName; upd.aprobado_en = new Date().toISOString(); }
    await dbUpd('gastos', gasto.id, upd);
    setPanelItem(null);
    showToast(nuevoEstado === 'aprobado' ? 'Gasto aprobado' : 'Estado actualizado');
    load();
  };

  const rechazar = async (gasto, motivo) => {
    await dbUpd('gastos', gasto.id, { estado: 'rechazado', rechazado_por: userName, motivo_rechazo: motivo });
    setPanelItem(null); showToast('Gasto rechazado'); load();
  };

  // ── Contabilizar: crea asiento real en libro diario ──
  const contabilizar = async (gasto) => {
    try {
      // 1. Buscar la cuenta de gasto por categoria
      const codigoCuenta = CATEGORIA_CUENTA[gasto.categoria] || '6.11';
      const cuentasGasto = await api(`/cuentas_contables?codigo=eq.${codigoCuenta}&select=*`);
      const cuentaCaja   = await api(`/cuentas_contables?codigo=eq.1.1.1&select=*`);

      const cuentaDebeId  = cuentasGasto?.[0]?.id;
      const cuentaHaberId = cuentaCaja?.[0]?.id;

      // 2. Crear el asiento en libro diario
      const asientoRes = await api('/asientos_contables', {
        method: 'POST',
        body: JSON.stringify({
          empresa_id: empId, fecha: gasto.fecha,
          descripcion: `Gasto: ${gasto.descripcion} — ${gasto.proveedor || ''}`,
          referencia: gasto.numero_factura || gasto.id.slice(0, 8),
          modulo_origen: 'gastos', origen_id: gasto.id, estado: 'activo',
        }),
        extraHeaders: { Prefer: 'return=representation' },
      });
      const asientoId = Array.isArray(asientoRes) ? asientoRes[0]?.id : asientoRes?.id;

      if (asientoId) {
        // 3. Insertar lineas del asiento
        if (cuentaDebeId) {
          await api('/asiento_lineas', {
            method: 'POST',
            body: JSON.stringify({ asiento_id: asientoId, cuenta_id: cuentaDebeId, descripcion: `${gasto.categoria} — ${gasto.descripcion}`, debe: parseFloat(gasto.total) || 0, haber: 0 }),
            extraHeaders: { Prefer: 'return=minimal' },
          });
        }
        if (cuentaHaberId) {
          await api('/asiento_lineas', {
            method: 'POST',
            body: JSON.stringify({ asiento_id: asientoId, cuenta_id: cuentaHaberId, descripcion: `Pago: ${gasto.metodo_pago}`, debe: 0, haber: parseFloat(gasto.total) || 0 }),
            extraHeaders: { Prefer: 'return=minimal' },
          });
        }
      }

      // 4. Marcar gasto como contabilizado
      await dbUpd('gastos', gasto.id, { contabilizado: true, estado: 'contabilizado' });
      setPanelItem(null);
      showToast('Asiento contable publicado en libro diario');
      load();
    } catch (e) {
      showToast('Error al contabilizar: ' + e.message, 'err');
    }
  };

  const del = async id => {
    if (!confirm('Eliminar este gasto?')) return;
    await dbDel('gastos', id); showToast('Eliminado'); load();
  };

  // ── Filtros ──
  const filtered = rows.filter(r => {
    if (filtroEst !== 'todos' && r.estado !== filtroEst) return false;
    if (filtroEmp && r.empleado_nombre !== filtroEmp) return false;
    if (filtroCat !== 'todas' && r.categoria !== filtroCat) return false;
    if (filtroPer && !(r.fecha || '').startsWith(filtroPer)) return false;
    return true;
  });
  const totalFil = filtered.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  const statsEmp = [...new Set(rows.map(r => r.empleado_nombre).filter(Boolean))]
    .map(emp => ({ emp, total: rows.filter(r => r.empleado_nombre === emp).reduce((s, r) => s + (parseFloat(r.total) || 0), 0) }))
    .sort((a, b) => b.total - a.total);

  if (vista === 'form') return (
    <FormGasto initial={editItem} empId={empId} showToast={showToast}
      proveedores={proveedores} vehiculos={vehiculos} reservas={reservas} empleados={empleados}
      onSave={() => { setVista('lista'); setEditItem(null); load(); }}
      onCancel={() => { setVista('lista'); setEditItem(null); }} />
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { l: 'Total gastos',   v: `Q ${fmt(rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0))}`, c: T.red   },
          { l: 'Pendientes',     v: rows.filter(r => r.estado === 'pendiente').length,                    c: T.mut   },
          { l: 'En revision',    v: rows.filter(r => r.estado === 'en_revision').length,                  c: T.blue  },
          { l: 'Aprobados',      v: rows.filter(r => r.estado === 'aprobado').length,                     c: T.acc   },
          { l: 'Contabilizados', v: rows.filter(r => r.contabilizado).length,                             c: T.green },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: i === 0 ? 14 : 20, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['todos', ...Object.keys(ESTADOS)].map(est => (
          <button key={est} onClick={() => setFiltroEst(est)}
            style={{ ...S.btn(filtroEst === est ? 'primary' : 'ghost'), fontSize: 11, padding: '4px 10px' }}>
            {est === 'todos' ? 'Todos' : (ESTADOS[est]?.l || est)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...S.sel, width: 'auto', fontSize: 11, padding: '5px 10px' }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
          <option value="todas">Todas las categorias</option>
          {CAT_GASTO.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        {empleados.length > 0 && (
          <select style={{ ...S.sel, width: 'auto', fontSize: 11, padding: '5px 10px' }} value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)}>
            <option value="">Todos los empleados</option>
            {empleados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
        )}
        <input type="month" style={{ ...S.inp, width: 150, fontSize: 11, padding: '5px 10px' }} value={filtroPer} onChange={e => setFiltroPer(e.target.value)} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={load} style={{ ...S.btn('ghost'), fontSize: 11 }}>Actualizar</button>
          <button onClick={() => exportarPDF(filtered, `Estado: ${filtroEst}`)} style={{ ...S.btn('blue'), fontSize: 11 }}>PDF</button>
          <button onClick={() => exportarExcel(filtered)} style={{ ...S.btn('green'), fontSize: 11 }}>Excel</button>
          <button onClick={() => setVista('reporte')} style={{ ...S.btn('ghost'), fontSize: 11 }}>Reportes</button>
          <button onClick={() => { setEditItem(null); setVista('form'); }} style={{ ...S.btn('primary'), fontSize: 12 }}>+ Nuevo gasto</button>
        </div>
      </div>

      {filtered.length > 0 && (
        <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: T.sub }}>{filtered.length} gasto{filtered.length !== 1 ? 's' : ''}</span>
          <span style={{ fontWeight: 800, color: T.red }}>Total: Q {fmt(totalFil)}</span>
        </div>
      )}

      {/* Tabla */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon="G" msg="Sin gastos registrados" action="+ Registrar gasto" onAction={() => setVista('form')} />
      ) : (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Fecha', 'Descripcion', 'Categoria', 'Empleado', 'Vehiculo', 'Proveedor', 'Total', 'Estado', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const e = ESTADOS[r.estado] || ESTADOS.pendiente;
                const c = CC[r.categoria] || T.mut;
                return (
                  <tr key={r.id} onClick={() => setPanelItem(r)} style={{ cursor: 'pointer' }}
                    onMouseEnter={el => el.currentTarget.style.background = T.surf}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: 'nowrap' }}>{fmtD(r.fecha)}</td>
                    <td style={{ ...S.td, maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155, fontWeight: 500 }}>{r.descripcion}</div>
                      {r.numero_factura && <div style={{ fontSize: 9, color: T.mut, fontFamily: 'monospace' }}>FAC: {r.numero_factura}</div>}
                    </td>
                    <td style={S.td}><span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: c + '22', color: c }}>{r.categoria}</span></td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{r.empleado_nombre || '—'}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{r.vehiculo_nombre ? r.vehiculo_nombre.split('(')[0].trim() : '—'}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{r.proveedor || '—'}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: T.red, whiteSpace: 'nowrap' }}>Q {fmt(r.total)}</td>
                    <td style={S.td}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: e.bg, color: e.c }}>{e.l}</span>
                      {r.archivo_url && <div style={{ fontSize: 9, color: T.blue, marginTop: 2 }}>Doc adjunto</div>}
                    </td>
                    <td style={S.td} onClick={ev => ev.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditItem(r); setVista('form'); }} style={{ ...S.btn('ghost'), padding: '3px 8px', fontSize: 10 }}>Editar</button>
                        <button onClick={() => del(r.id)} style={{ ...S.btn('danger'), padding: '3px 8px', fontSize: 10 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: T.surf }}>
                <td colSpan={6} style={{ padding: '9px 10px', fontSize: 12, fontWeight: 700, color: T.sub }}>TOTAL FILTRADO</td>
                <td style={{ padding: '9px 10px', fontWeight: 800, color: T.red, fontSize: 14 }}>Q {fmt(totalFil)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {panelItem && (
        <GastoPanel gasto={panelItem} userName={userName}
          onClose={() => setPanelItem(null)}
          onAprobar={cambiarEstado} onRechazar={rechazar} onContabilizar={contabilizar}
          empId={empId} />
      )}

      {/* Modal reporte */}
      {vista === 'reporte' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} onClick={() => setVista('lista')}>
          <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: 'min(720px,95vw)', background: T.card, borderRadius: 16, border: `1px solid ${T.bord}`, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>Reporte de Gastos</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => exportarPDF(rows, 'Reporte completo')} style={{ ...S.btn('blue'), fontSize: 11 }}>PDF</button>
                <button onClick={() => exportarExcel(rows)} style={{ ...S.btn('green'), fontSize: 11 }}>Excel</button>
                <button onClick={() => setVista('lista')} style={{ ...S.btn('ghost'), fontSize: 11 }}>Cerrar</button>
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {statsEmp.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 10 }}>GASTOS POR EMPLEADO</div>
                  {statsEmp.map(({ emp, total }) => {
                    const pct = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
                    return (
                      <div key={emp} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: T.sub }}>{emp}</span>
                          <span style={{ fontWeight: 600, color: T.red }}>Q {fmt(total)}</span>
                        </div>
                        <div style={{ background: T.surf, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4, background: T.red, width: `${pct > 0 ? Math.round((total / pct) * 100) : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {Object.entries(ESTADOS).map(([key, val]) => {
                  const tot = rows.filter(r => r.estado === key).reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
                  const cnt = rows.filter(r => r.estado === key).length;
                  if (!cnt) return null;
                  return (
                    <div key={key} style={{ background: val.bg, border: `1px solid ${val.c}44`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: val.c }}>Q {fmt(tot)}</div>
                      <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{val.l} ({cnt})</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODULO PROVEEDORES (tab dentro de Gastos)
// ═══════════════════════════════════════════════════════════════════
function ModProveedores({ empId, showToast }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const EFP = { nombre: '', nit: '', tipo: 'otros', contacto_nombre: '', telefono: '', email: '', direccion: '', notas: '' };
  const [f, setF]             = useState({ ...EFP });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const load = async () => { setLoading(true); const d = await dbGet('proveedores'); setRows(Array.isArray(d) ? d : []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const guardar = async () => {
    if (!f.nombre.trim()) { showToast('Nombre requerido', 'err'); return; }
    setSaving(true);
    const payload = { empresa_id: empId, ...f, activo: true };
    const r = editItem?.id ? await dbUpd('proveedores', editItem.id, payload) : await dbIns('proveedores', payload);
    if (r?.error) { showToast('Error: ' + r.error, 'err'); setSaving(false); return; }
    showToast('Proveedor guardado'); setSaving(false); setShowForm(false); setEditItem(null); setF({ ...EFP }); load();
  };

  const del = async id => {
    if (!confirm('Eliminar este proveedor?')) return;
    await dbDel('proveedores', id); showToast('Eliminado'); load();
  };

  const TIPOS = ['combustible', 'repuestos', 'mecanica', 'seguros', 'servicios', 'papeleria', 'tecnologia', 'bancos', 'otros'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
        <button onClick={load} style={{ ...S.btn('ghost'), fontSize: 11 }}>Actualizar</button>
        <button onClick={() => { setEditItem(null); setF({ ...EFP }); setShowForm(!showForm); }}
          style={{ ...S.btn(showForm ? 'warn' : 'primary'), fontSize: 12 }}>
          {showForm ? 'Cancelar' : '+ Nuevo proveedor'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>
            {editItem ? 'Editar proveedor' : 'Nuevo proveedor'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <Fld label="NOMBRE *" span2><input style={S.inp} value={f.nombre} onChange={e => sf('nombre', e.target.value)} placeholder="Razon social" /></Fld>
            <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e => sf('nit', e.target.value)} placeholder="1234567-8" /></Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e => sf('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Fld>
            <Fld label="CONTACTO"><input style={S.inp} value={f.contacto_nombre} onChange={e => sf('contacto_nombre', e.target.value)} /></Fld>
            <Fld label="TELEFONO"><input style={S.inp} value={f.telefono} onChange={e => sf('telefono', e.target.value)} /></Fld>
            <Fld label="EMAIL"><input style={S.inp} value={f.email} onChange={e => sf('email', e.target.value)} /></Fld>
            <Fld label="DIRECCION" span2><input style={S.inp} value={f.direccion} onChange={e => sf('direccion', e.target.value)} /></Fld>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
              <button onClick={guardar} disabled={saving} style={{ ...S.btn('primary'), flex: 2 }}>{saving ? '...' : editItem ? 'Actualizar' : 'Guardar'}</button>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} style={{ ...S.btn('ghost'), flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : rows.length === 0 ? <Empty icon="P" msg="Sin proveedores registrados" action="+ Nuevo proveedor" onAction={() => setShowForm(true)} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {rows.map(p => (
            <div key={p.id} style={{ ...S.card, borderTop: `3px solid ${CC[p.tipo] || T.mut}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{p.nombre}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>NIT: {p.nit || '—'}</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: (CC[p.tipo] || T.mut) + '22', color: CC[p.tipo] || T.mut }}>{p.tipo || 'otros'}</span>
              </div>
              {p.telefono && <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{p.telefono}</div>}
              {p.email && <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{p.email}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => { setEditItem(p); setF({ nombre: p.nombre, nit: p.nit || '', tipo: p.tipo || 'otros', contacto_nombre: p.contacto_nombre || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', notas: p.notas || '' }); setShowForm(true); }}
                  style={{ ...S.btn('ghost'), fontSize: 11, padding: '4px 10px' }}>Editar</button>
                <button onClick={() => del(p.id)} style={{ ...S.btn('danger'), fontSize: 11, padding: '4px 10px' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function PageGastos({ showToast, empId }) {
  const [tab, setTab]           = useState('gastos');
  const [vehiculos, setVehiculos]   = useState([]);
  const [reservas, setReservas]     = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empleados, setEmpleados]   = useState([]);

  const cargarDatos = useCallback(async () => {
    const [v, r, p, e] = await Promise.all([
      dbGet('vehiculos', '&select=id,marca,modelo,placa'),
      dbGet('reservas', '&estado=in.(confirmada,en_curso)&select=id,numero,cliente_nombre'),
      dbGet('proveedores', '&select=id,nombre,nit,tipo&order=nombre.asc'),
      dbGet('empleados', '&select=id,nombre').catch(() => []),
    ]);
    setVehiculos(Array.isArray(v) ? v : []);
    setReservas(Array.isArray(r) ? r : []);
    setProveedores(Array.isArray(p) ? p : []);
    setEmpleados(Array.isArray(e) ? e : []);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.bord}`, marginBottom: 16 }}>
        {[['gastos', 'Gastos y Compras'], ['proveedores', 'Proveedores']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === id ? T.acc : T.sub, borderBottom: tab === id ? `2px solid ${T.acc}` : '2px solid transparent' }}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'gastos' && <ModGastos empId={empId} showToast={showToast} vehiculos={vehiculos} reservas={reservas} empleados={empleados} proveedores={proveedores} />}
      {tab === 'proveedores' && <ModProveedores empId={empId} showToast={showToast} />}
    </div>
  );
}
