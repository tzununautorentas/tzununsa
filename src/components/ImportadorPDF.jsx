// IMPORTADOR PDF FEL GUATEMALA — Tz'ununSA
// Sube el PDF de la representacion impresa (DTE) y extrae:
//  - La imagen del codigo QR embebida en el PDF (pdf.js)
//  - Texto con numero de autorizacion, serie, correlativo y NIT (best-effort)
// Se guarda en la factura como qr_imagen (dataURL) y los campos detectados.
import React, { useState, useRef } from 'react';
import { T, S, fmt, api } from '../config.js';

const cargarPdfJS = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    resolve(window.pdfjsLib);
  };
  s.onerror = () => reject(new Error('No se pudo cargar el lector de PDF'));
  document.head.appendChild(s);
});

const num = (v) => { const n = parseFloat(String(v || '').replace(/[Q,\s]/g, '').replace(/[^0-9.-]/g, '')); return isNaN(n) ? 0 : n; };
const normNIT = (v) => String(v || '').trim().replace(/\s+/g, '').toUpperCase();
const hoy = () => new Date().toISOString().slice(0, 10);

// ─── Extraer imagenes del PDF (pdf.js: paintImageXObject) ──────────
async function extraerImagenes(pdfjsLib, pdf) {
  const imgs = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const ops = await page.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const esImagen = fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject;
      if (!esImagen) continue;
      let obj = null;
      try {
        const name = ops.argsArray[i][0];
        if (page.objs.has && page.objs.has(name)) obj = page.objs.get(name);
        else if (page.commonObjs && page.commonObjs.has && page.commonObjs.has(name)) obj = page.commonObjs.get(name);
        else if (typeof name === 'object') obj = name;
      } catch {}
      if (!obj || !obj.width || !obj.height) continue;
      const w = obj.width, h = obj.height;
      let canvas;
      try {
        if (obj.bitmap && typeof obj.bitmap.toDataURL === 'function') {
          canvas = obj.bitmap;
        } else if (obj.data) {
          canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          const idata = ctx.createImageData(w, h);
          if (obj.data.length >= w * h * 4) idata.data.set(obj.data.subarray(0, w * h * 4));
          else {
            // datos en escala de grises o formato reducido → duplicar canal
            for (let k = 0; k < Math.min(obj.data.length, w * h); k++) {
              const v = obj.data[k];
              idata.data.set([v, v, v, 255], k * 4);
            }
          }
          ctx.putImageData(idata, 0, 0);
        } else { continue; }
        imgs.push({ canvas, w, h, page: p });
      } catch { /* imagen no convertible → ignorar */ }
    }
  }
  return imgs;
}

// ─── Extraer texto del PDF (best-effort para campos clave) ─────────
async function extraerTexto(pdfjsLib, pdf) {
  let texto = '';
  const hasta = Math.min(pdf.numPages, 2);
  for (let p = 1; p <= hasta; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    tc.items.forEach(it => { texto += (it.str || '') + ' '; });
    texto += '\n';
  }
  return texto;
}

const parsearTexto = (texto) => {
  const d = {};
  const mUuid = texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (mUuid) d.numero_autorizacion = mUuid[0].toUpperCase();
  const mSerie = texto.match(/serie\s*[:.]?\s*([A-Z0-9-]{1,10})/i);
  if (mSerie && !/[0-9-]{10,}/.test(mSerie[1])) d.serie = mSerie[1];
  const mNit = texto.match(/nit\s*(?:del\s*receptor|receptor)?\s*[:.#]?\s*(\d{7,9}[0-9A-Z]?)/i);
  if (mNit) d.nit_receptor = normNIT(mNit[1]);
  const mNo = texto.match(/no\.?\s*(?:de\s*)?\s*(?:dte|documento)\s*[:.#]?\s*([A-Z0-9-]+)/i);
  if (mNo) d.numero_factura = mNo[1].replace(/^0+/, '');
  return d;
};

// ─── Componente ────────────────────────────────────────────────────
export default function ImportadorPDF({ empId, emisores = [], userEmail = '', showToast, onClose, onImportado }) {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [qrList, setQrList] = useState([]);
  const [qrSel, setQrSel] = useState(null);
  const [bueno, setBueno] = useState(null);
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({
    numero_factura: '', serie: '', numero_autorizacion: '',
    fecha: hoy(), fecha_hora_emision: '', fecha_certificacion: '',
    cliente_nombre: '', cliente_nit: '', subtotal: '', impuestos: '', total: '', tasa_iva: 12,
  });
  const inputRef = useRef(null);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const leerArchivo = async (file) => {
    if (!file) return;
    setCargando(true); setNombre(file.name); setQrList([]); setQrSel(null); setBueno(null);
    try {
      const pdfjsLib = await cargarPdfJS();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const [texto, imgs] = await Promise.all([
        extraerTexto(pdfjsLib, pdf),
        extraerImagenes(pdfjsLib, pdf),
      ]);
      const campos = parsearTexto(texto);
      setForm(p => ({ ...p, ...campos }));
      if (imgs.length === 0) {
        showToast('No se encontro imagen (QR) dentro del PDF. Prueba con el XML o Excel de SAT.', 'err');
        setPaso(3);
      } else {
        setQrList(imgs);
        // Mejor candidato: imagen cuadrada de tamano medio-grande
        let mejor = 0, mejorScore = -1;
        imgs.forEach((img, idx) => {
          const lado = Math.min(img.w, img.h);
          if (lado < 20) return;
          const cuadrada = 1 - Math.abs(img.w - img.h) / Math.max(img.w, img.h);
          const score = cuadrada * 100 + Math.min(lado, 200);
          if (score > mejorScore) { mejorScore = score; mejor = idx; }
        });
        setQrSel(imgs.length ? mejor : null);
        setBueno(imgs.length ? mejor : null);
        setPaso(2);
      }
    } catch (e) {
      showToast('Error leyendo PDF: ' + e.message, 'err');
      setPaso(3);
    } finally { setCargando(false); }
  };

  const emisorDefault = (emisores || []).find(e => (e.user_email || '').toLowerCase() === (userEmail || '').toLowerCase())
    || (emisores || [])[0] || null;

  const guardar = async () => {
    if (!empId) { showToast('Empresa no identificada. Recarga la pagina.', 'err'); return; }
    if (qrSel == null && bueno == null) { showToast('Selecciona el QR del PDF antes de guardar', 'err'); return; }
    setGuardando(true);
    try {
      const qr = (qrList[qrSel != null ? qrSel : bueno])?.canvas.toDataURL('image/png');
      if (!qr) throw new Error('No se pudo convertir el QR');
      const sub = num(form.subtotal), iva = num(form.impuestos), tot = num(form.total) || sub + iva;
      const payload = {
        empresa_id: empId,
        numero: form.numero_factura || `PDF-${Date.now()}`,
        numero_factura: form.numero_factura || null,
        serie: form.serie || null,
        fecha: form.fecha || hoy(),
        fecha_hora_emision: form.fecha_hora_emision || null,
        fecha_certificacion: form.fecha_certificacion || null,
        numero_autorizacion: form.numero_autorizacion || null,
        qr_imagen: qr,
        emisor_id: emisorDefault?.id || null,
        nit_emisor: emisorDefault?.nit || '',
        nombre_emisor: emisorDefault?.nombre_entidad || '',
        cliente_nombre: form.cliente_nombre || (form.cliente_nit ? 'Consumidor Final' : 'Consumidor Final'),
        cliente_nit: form.cliente_nit || 'CF',
        condicion_pago: 'contado',
        descripcion: `Importado desde PDF FEL — ${nombre}`,
        subtotal: sub,
        tasa_iva: num(form.tasa_iva) || 12,
        impuestos: iva,
        total: tot,
        metodo_pago: 'efectivo',
        estado: Number(form.tasa_iva) === 5 ? 'certificada' : 'certificada',
        notas: `Importado desde PDF FEL SAT — ${nombre} — ${qr ? 'QR extraido del PDF' : ''}`,
      };
      // ¿Existe ya por numero de autorizacion? → actualiza (solo QR + enriquecer).
      let duplicado = null;
      if (form.numero_autorizacion) {
        const ex = await api(`/facturas?empresa_id=eq.${empId}&numero_autorizacion=eq.${encodeURIComponent(form.numero_autorizacion)}&select=id&limit=1`).catch(() => []);
        duplicado = Array.isArray(ex) && ex.length ? ex[0] : null;
      }
      if (duplicado) {
        await api(`/facturas?id=eq.${duplicado.id}`, { method: 'PATCH', body: JSON.stringify({ qr_imagen: qr }) });
        showToast('QR actualizado en la factura existente');
        onImportado?.();
      } else {
        await api('/facturas', {
          method: 'POST',
          body: JSON.stringify(payload),
          extraHeaders: { Prefer: 'return=minimal' },
        });
        showToast('Factura importada desde PDF con su QR');
        onImportado?.();
      }
      onClose();
    } catch (e) {
      showToast('Error guardando: ' + e.message, 'err');
    } finally { setGuardando(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={paso < 2 ? onClose : undefined}>
      <div style={{ background: T.surf, borderRadius: 20, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.bord}` }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>Importar factura desde PDF FEL</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Extrae el codigo QR y los datos de la representacion impresa</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.mut, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {paso === 1 && (
            <div>
              <div style={{ background: T.card, borderRadius: 12, padding: '16px 18px', marginBottom: 20, fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6, fontSize: 13 }}>Que hace este importador:</div>
                <div>1. Abre el <strong style={{ color: T.txt }}>PDF de la factura FEL</strong> (representacion impresa que descargas de la SAT)</div>
                <div>2. Extrae el <strong style={{ color: T.txt }}>codigo QR</strong> que viene dentro del PDF</div>
                <div>3. Detecta numero de autorizacion, serie, correlativo y NIT</div>
                <div>4. Si la factura ya existe, le agrega el QR; si no, la crea</div>
              </div>

              <div onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); leerArchivo(e.dataTransfer.files[0]); }}
                style={{ border: `2px dashed ${drag ? T.acc : T.bord}`, borderRadius: 14, padding: '44px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? T.accDim : 'transparent', transition: 'all .15s' }}>
                {cargando ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 10, color: T.acc }}>⏳</div>
                    <div style={{ fontSize: 14, color: T.acc, fontWeight: 600 }}>Extrayendo QR y datos del PDF...</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 6 }}>Arrastra el PDF de la factura FEL o haz clic para seleccionar</div>
                    <div style={{ fontSize: 12, color: T.sub }}>Formato: .pdf (representacion impresa / DTE FEL)</div>
                  </div>
                )}
                <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                  onChange={e => leerArchivo(e.target.files[0])} />
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>QR y datos detectados</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{nombre}</div>
                </div>
                <button onClick={() => { setQrList([]); setPaso(1); }} style={S.btn('ghost')}>Cambiar PDF</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 16 }}>
                {/* Columna QR */}
                <div style={{ ...S.card, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 10 }}>CODIGO QR DEL PDF</div>
                  {qrList.map((img, i) => (
                    <div key={i} onClick={() => setQrSel(i)}
                      style={{ border: `3px solid ${qrSel === i ? T.acc : 'transparent'}`, borderRadius: 10, padding: 6, marginBottom: 8, cursor: 'pointer', background: '#fff' }}>
                      <img src={img.canvas.toDataURL('image/png')} alt={`QR ${i + 1}`}
                        style={{ width: 120, height: 120, objectFit: 'contain', display: 'block' }} />
                      <div style={{ fontSize: 10, color: T.sub, textAlign: 'center', marginTop: 4 }}>
                        Imagen {i + 1} · {img.w}×{img.h}{qrSel === i ? ' · ✓' : ' · click para elegir'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Columna campos */}
                <div style={{ ...S.card, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 10 }}>DATOS (revisalos y corregi si hace falta)</div>
                  {[
                    ['numero_factura', 'No. de factura / correlativo'],
                    ['serie', 'Serie'],
                    ['numero_autorizacion', 'Numero de autorizacion (certificado)'],
                  ].map(([k, l]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>{l}</label>
                      <input value={form[k]} onChange={e => sf(k, e.target.value)} style={S.inp} placeholder={l} />
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>Fecha</label>
                      <input type="date" value={form.fecha} onChange={e => sf('fecha', e.target.value)} style={S.inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>Tasa IVA %</label>
                      <select value={form.tasa_iva} onChange={e => sf('tasa_iva', e.target.value)} style={S.inp}>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>Cliente</label>
                      <input value={form.cliente_nombre} onChange={e => sf('cliente_nombre', e.target.value)} style={S.inp} placeholder="Nombre" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>NIT</label>
                      <input value={form.cliente_nit} onChange={e => sf('cliente_nit', e.target.value)} style={S.inp} placeholder="CF" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>Subtotal</label>
                      <input value={form.subtotal} onChange={e => sf('subtotal', e.target.value)} style={S.inp} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>IVA</label>
                      <input value={form.impuestos} onChange={e => sf('impuestos', e.target.value)} style={S.inp} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: T.mut, display: 'block', marginBottom: 3 }}>Total</label>
                      <input value={form.total} onChange={e => sf('total', e.target.value)} style={S.inp} placeholder="0.00" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onClose} style={{ ...S.btn('ghost'), flex: 1 }} disabled={guardando}>Cancelar</button>
                <button onClick={guardar} disabled={guardando} style={{ ...S.btn('primary'), flex: 2 }}>
                  {guardando ? 'Guardando...' : 'Guardar factura con su QR'}
                </button>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.sec, marginBottom: 6 }}>No se pudo leer el PDF</div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 20 }}>
                Asegurate de que sea el PDF de la factura FEL (representacion impresa de la SAT).<br />
                Este PDF debe contener una imagen de codigo QR embebida.<br />
                Si tu PDF no la tiene, usa <strong>Importar XML FEL</strong> o <strong>Importar Excel SAT</strong>.
              </div>
              <button onClick={() => { setNombre(''); setPaso(1); }} style={{ ...S.btn('primary'), padding: '12px 24px' }}>
                Intentar con otro PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}