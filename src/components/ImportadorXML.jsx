// IMPORTADOR XML DTE FEL GUATEMALA — Tz'ununSA
// Sube los archivos .xml firmados del SAT (Descarga de DTE en FEL)
// Captura TODOS los campos de factura electronica: emisor, receptor,
// direccion, certificacion/numero de autorizacion, items y totales.
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import { T, S, fmt, api } from '../config.js';

const normNIT = (v) => String(v || '').trim().replace(/\s+/g, '').toUpperCase();
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// ─── Parsear un XML DTE FEL ────────────────────────────────────────
const parsearXML = (texto) => {
  const d = new DOMParser().parseFromString(texto, 'text/xml');
  const one = (tag, cont) => (cont || d).getElementsByTagNameNS('*', tag)[0] || null;
  const txt = (el) => (el ? (el.textContent || '').trim() : '');
  const attr = (el, a) => (el ? el.getAttribute(a) || '' : '');

  const dg      = one('DatosGenerales');
  const emisor  = one('Emisor');
  const dirEmi  = one('DireccionEmisor');
  const receptor = one('Receptor');
  const dirRec  = one('DireccionReceptor');
  const frasesE = one('Frases');
  const certE   = one('NumeroAutorizacion');
  const fechaCertE = one('FechaHoraCertificacion');
  const totEl   = one('Totales');
  const itemsEls = Array.from(d.getElementsByTagNameNS('*', 'Item'));

  const tot = (tag) => num(txt(one(tag, totEl)));

  const granTotal = tot('GranTotal');
  const iva       = tot('TotalImpuestosIVA') || tot('TotalImpuestos');
  const gravado   = tot('TotalGravadoIVA');
  const exento    = tot('TotalExento');
  const exonerado = tot('TotalExonerado');
  const noSujeto  = tot('TotalNoSujeto');
  const descuentos = tot('TotalDescuentos');
  const gravadoSum = itemsEls.reduce((s, it) => s + num(txt(it.getElementsByTagNameNS('*', 'Precio')[0])), 0);

  const items = itemsEls.map((it, i) => ({
    numero_linea:   attr(it, 'NumeroLinea') || String(i + 1),
    bien_servicio:  attr(it, 'BienOServicio') === 'S' ? 'Servicio' : attr(it, 'BienOServicio') === 'B' ? 'Bien' : '',
    cantidad:       num(txt(it.getElementsByTagNameNS('*', 'Cantidad')[0])) || 1,
    unidad_medida:  txt(it.getElementsByTagNameNS('*', 'UnidadMedida')[0]),
    descripcion:    txt(it.getElementsByTagNameNS('*', 'Descripcion')[0]),
    precio_unitario: num(txt(it.getElementsByTagNameNS('*', 'PrecioUnitario')[0])),
    precio:         num(txt(it.getElementsByTagNameNS('*', 'Precio')[0])),
    descuento:      num(txt(it.getElementsByTagNameNS('*', 'Descuento')[0])) + num(txt(it.getElementsByTagNameNS('*', 'OtrosDescuento')[0])),
    total_linea:    num(txt(it.getElementsByTagNameNS('*', 'Total')[0])),
  }));

  const textosFrases = Array.from(frasesE ? frasesE.parentElement.getElementsByTagNameNS('*', 'Frase') : [])
    .map(f => `Escenario ${attr(f, 'CodigoEscenario')} / Frase ${attr(f, 'TipoFrase')}`)
    .filter(Boolean).join(' | ');

  const correlativoSerie = attr(certE, 'Serie');
  const correlativoNum   = attr(certE, 'Numero');
  const numeroAutorizacion = txt(certE);

  const fechaHoraEmision = attr(dg, 'FechaHoraEmision') || '';
  const fecha = fechaHoraEmision.slice(0, 10) || txt(one('FechaEmision')) || new Date().toISOString().slice(0, 10);

  const subtotal = gravado || gravadoSum || Math.max(0, granTotal - iva);
  const total = granTotal || (subtotal + iva);

  const descIdx = items.length ? items[0].descripcion : txt(one('Descripcion'));
  const descripcion = items.length ? `${descIdx}${items.length > 1 ? ` (${items.length} lineas)` : ''}` : '';

  return {
    numero_factura:  correlativoSerie && correlativoNum ? `${correlativoSerie}-${correlativoNum}` : (numeroAutorizacion || ''),
    serie:           correlativoSerie || (numeroAutorizacion ? numeroAutorizacion.slice(0, 8) : ''),
    numero_autorizacion,
    fecha,
    fecha_hora_emision: fechaHoraEmision || null,
    fecha_certificacion: txt(fechaCertE) || null,
    tipo_dte:        attr(dg, 'Tipo') || 'FACT',
    moneda:          attr(dg, 'CodigoMoneda') || 'GTQ',
    tasa_cambio:     num(attr(dg, 'CambioTipo')) || 1,
    nit_emisor:      normNIT(attr(emisor, 'NITEmisor')),
    nombre_emisor:   attr(emisor, 'NombreEmisor') || attr(emisor, 'NombreComercial'),
    codigo_establecimiento: attr(emisor, 'CodigoEstablecimiento'),
    direccion_emisor: txt(one('Direccion', dirEmi)),
    nit_receptor:    normNIT(attr(receptor, 'IDReceptor')),
    nombre_receptor: attr(receptor, 'NombreReceptor'),
    correo_receptor: attr(receptor, 'CorreoReceptor') || (receptor ? txt(one('Correo', receptor)) : ''),
    direccion_receptor: txt(one('Direccion', dirRec)),
    codigo_postal_receptor: txt(one('CodigoPostal', dirRec)),
    municipio_receptor: txt(one('Municipio', dirRec)),
    departamento_receptor: txt(one('Departamento', dirRec)),
    pais_receptor:   txt(one('Pais', dirRec)) || 'GT',
    items,
    subtotal:        Math.round(subtotal * 100) / 100,
    impuestos:       Math.round(iva * 100) / 100,
    total:           Math.round(total * 100) / 100,
    total_gravado:   Math.round(gravado * 100) / 100,
    total_exento:    Math.round(exento * 100) / 100,
    total_exonerado: Math.round(exonerado * 100) / 100,
    total_no_sujeto: Math.round(noSujeto * 100) / 100,
    total_descuentos: Math.round(descuentos * 100) / 100,
    textos_frases:   textosFrases,
  };
};

// ─── Componente ────────────────────────────────────────────────────
export default function ImportadorXML({ empId, emisores = [], showToast, onClose, onImportado }) {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [filas, setFilas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [erroresArch, setErroresArch] = useState([]);
  const [drag, setDrag] = useState(false);
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef(null);

  const leerArchivos = async (files) => {
    const lista = [...(files || [])].filter(f => /\.xml$/i.test(f.name));
    if (lista.length === 0) {
      showToast('Selecciona archivos .xml de FEL', 'err'); return;
    }
    setCargando(true); setNombre(`${lista.length} archivo(s) XML`);
    setErroresArch([]);
    const parsed = [];
    const errs = [];
    for (const f of lista) {
      try {
        const txt = await f.text();
        const obj = parsearXML(txt);
        if (!obj.numero_autorizacion && !obj.total) throw new Error('No parece un DTE FEL valido');
        parsed.push({ ...obj, _file: f.name });
      } catch (e) {
        errs.push(`${f.name}: ${e.message}`);
      }
    }
    setErroresArch(errs);
    setFilas(parsed);
    setCargando(false);
    if (parsed.length) setPaso(2);
  };

  const importarVentas = async () => {
    const res = { importados: 0, duplicados: 0, clientesCreados: 0, errores: [] };
    const existing = await api(`/facturas?empresa_id=eq.${empId}&select=numero_autorizacion&limit=5000`).catch(() => []);
    const existSet = new Set((existing || []).map(f => f.numero_autorizacion || '').filter(Boolean));

    const cliExist = await api(`/clientes?empresa_id=eq.${empId}&select=id,nombre,nit`).catch(() => []);
    const cliMap = {};
    (cliExist || []).forEach(c => { if (c.nit) cliMap[normNIT(c.nit)] = c; });

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      const clave = f.numero_autorizacion || `XML-${f.numero_factura}`;
      if (existSet.has(clave)) { res.duplicados++; continue; }
      try {
        let clienteId = null;
        if (f.nit_receptor && f.nit_receptor !== 'CF') {
          const c = cliMap[f.nit_receptor];
          if (c) clienteId = c.id;
          else if (f.nombre_receptor) {
            const nuevo = await api('/clientes', {
              method: 'POST',
              body: JSON.stringify({ empresa_id: empId, nombre: f.nombre_receptor, nit: f.nit_receptor, tipo: 'empresa' }),
              extraHeaders: { Prefer: 'return=representation' },
            });
            const n = Array.isArray(nuevo) ? nuevo[0] : nuevo;
            if (n?.id) { cliMap[f.nit_receptor] = n; clienteId = n.id; res.clientesCreados++; }
          }
        }
        const emisor = (emisores || []).find(e => e.nit && normNIT(e.nit) === f.nit_emisor);
        await api('/facturas', {
          method: 'POST',
          body: JSON.stringify({
            empresa_id: empId,
            emisor_id: emisor?.id || null,
            numero_factura: f.numero_factura || `FEL-${i + 1}`,
            numero: f.numero_factura || `FEL-${i + 1}`,
            serie: f.serie || null,
            fecha: f.fecha,
            fecha_hora_emision: f.fecha_hora_emision || null,
            fecha_certificacion: f.fecha_certificacion || null,
            tipo_dte: f.tipo_dte,
            moneda: f.moneda,
            tasa_cambio: f.tasa_cambio,
            condicion_pago: 'contado',
            numero_autorizacion: f.numero_autorizacion,
            nit_emisor: f.nit_emisor,
            codigo_establecimiento: f.codigo_establecimiento,
            cliente_nombre: f.nombre_receptor || 'Consumidor Final',
            cliente_nit: f.nit_receptor || 'CF',
            cliente_id: clienteId,
            direccion_receptor: f.direccion_receptor,
            municipio_receptor: f.municipio_receptor,
            departamento_receptor: f.departamento_receptor,
            pais_receptor: f.pais_receptor,
            codigo_postal_receptor: f.codigo_postal_receptor,
            correo_receptor: f.correo_receptor,
            descripcion: f.items.length ? f.items.map(it => it.descripcion).join(' | ') : 'Importado XML FEL',
            detalles: f.items,
            subtotal: f.subtotal,
            tasa_iva: f.impuestos > 0 ? 12 : 0,
            impuestos: f.impuestos,
            total: f.total,
            total_gravado: f.total_gravado,
            total_exento: f.total_exento,
            total_exonerado: f.total_exonerado,
            total_no_sujeto: f.total_no_sujeto,
            total_descuentos: f.total_descuentos,
            textos_frases: f.textos_frases,
            metodo_pago: 'efectivo',
            estado: 'certificada',
            notas: `Importado desde XML FEL SAT — ${f._file || ''} — ${f.tipo_dte || 'FEL'}`,
          }),
          extraHeaders: { Prefer: 'return=minimal' },
        });
        existSet.add(clave);
        res.importados++;
      } catch (e) {
        res.errores.push(`${f._file || f.numero_factura}: ${e.message}`);
      }
    }
    return res;
  };

  const ejecutar = async () => {
    if (!empId) { showToast('Empresa no identificada. Recarga la pagina.', 'err'); return; }
    setImportando(true);
    try {
      const res = await importarVentas();
      setResultado(res); setPaso(3);
      if (res.importados > 0) { onImportado?.(); showToast(`${res.importados} facturas importadas desde XML`); }
      else if (res.duplicados > 0) showToast(`Todos ya existen (${res.duplicados} duplicados)`, 'err');
    } catch (e) {
      showToast('Error en importacion: ' + e.message, 'err');
    } finally { setImportando(false); }
  };

  const totalMonto = filas.reduce((s, f) => s + (f.total || 0), 0);
  const totalIVA = filas.reduce((s, f) => s + (f.impuestos || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={paso < 2 ? onClose : undefined}>
      <div style={{ background: T.surf, borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.bord}` }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>Importar facturas desde XML FEL</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>DTE firmados descargados de FEL · Paso {paso} de 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.mut, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {paso === 1 && (
            <div>
              <div style={{ background: T.card, borderRadius: 12, padding: '16px 18px', marginBottom: 20, fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6, fontSize: 13 }}>Como descargar los XML desde FEL:</div>
                <div>1. Ingresa a <strong style={{ color: T.txt }}>portal.sat.gob.gt</strong> y entra a <strong style={{ color: T.txt }}>FEL</strong></div>
                <div>2. Busca las facturas del periodo deseado</div>
                <div>3. En cada factura usa la opcion de <strong style={{ color: T.txt }}>Descargar XML</strong> (o descarga por lote)</div>
                <div>4. Sube los archivos <strong style={{ color: T.txt }}>.xml</strong> aqui abajo (puedes elegir varios)</div>
              </div>

              <div onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); leerArchivos(e.dataTransfer.files); }}
                style={{ border: `2px dashed ${drag ? T.acc : T.bord}`, borderRadius: 14, padding: '44px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? T.accDim : 'transparent', transition: 'all .15s' }}>
                {cargando ? (
                  <div><div style={{ fontSize: 32, marginBottom: 10, color: T.acc }}>⏳</div>
                    <div style={{ fontSize: 14, color: T.acc, fontWeight: 600 }}>Leyendo archivos XML...</div></div>
                ) : (
                  <div>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 6 }}>Arrastra los XML de FEL o haz clic para seleccionar</div>
                    <div style={{ fontSize: 12, color: T.sub }}>Formatos: .xml (DTE FEL firmado) · puede elegir varios</div>
                  </div>
                )}
                <input ref={inputRef} type="file" accept=".xml" multiple style={{ display: 'none' }}
                  onChange={e => leerArchivos(e.target.files)} />
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Vista previa — {filas.length} facturas encontradas</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{nombre}</div>
                </div>
                <button onClick={() => { setFilas([]); setPaso(1); }} style={S.btn('ghost')}>Cambiar archivos</button>
              </div>

              {erroresArch.length > 0 && (
                <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 12, color: T.red }}>
                  <strong>{erroresArch.length} archivo(s) no se pudieron leer:</strong> {erroresArch.join(' · ')}
                </div>
              )}

              {filas.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { l: 'Facturas a importar', v: filas.length,            c: T.acc  },
                      { l: 'Suma total',          v: `Q ${fmt(totalMonto)}`,  c: T.blue },
                      { l: 'IVA total',           v: `Q ${fmt(totalIVA)}`,    c: T.sec  },
                    ].map((s, i) => (
                      <div key={i} style={{ ...S.card, textAlign: 'center', padding: 14 }}>
                        <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...S.card, maxHeight: 320, overflowY: 'auto', padding: 0, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          {['No. Doc.', 'Fecha', 'Cliente', 'NIT', 'Subtotal', 'IVA', 'Total'].map(h => <th key={h} style={S.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, i) => (
                          <tr key={i}>
                            <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace', color: T.acc }}>{fila.numero_factura}</td>
                            <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{fila.fecha}</td>
                            <td style={{ ...S.td, fontSize: 12, maxWidth: 160 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>{fila.nombre_receptor}</div>
                            </td>
                            <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace' }}>{fila.nit_receptor}</td>
                            <td style={{ ...S.td, fontSize: 12, textAlign: 'right' }}>Q {fmt(fila.subtotal)}</td>
                            <td style={{ ...S.td, fontSize: 12, textAlign: 'right', color: T.sec }}>Q {fmt(fila.impuestos)}</td>
                            <td style={{ ...S.td, fontSize: 13, fontWeight: 700, textAlign: 'right', color: T.acc }}>Q {fmt(fila.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6 }}>El sistema importara automaticamente:</div>
                    <div style={{ color: T.sub, lineHeight: 1.9 }}>
                      Emisor, receptor, NIT y direccion del XML<br/>
                      Numero de autorizacion y certificacion FEL <br/>
                      Items detallados, subtotal, IVA y totales desglosados<br/>
                      Creara al cliente por NIT si no existe · Evitara duplicados por numero de certificacion
                    </div>
                  </div>

                  {importando && (
                    <div style={{ background: T.blueDim, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: T.blue, textAlign: 'center', fontWeight: 600 }}>
                      Procesando facturas...
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => { setFilas([]); setPaso(1); }} style={{ ...S.btn('ghost'), flex: 1 }} disabled={importando}>Cancelar</button>
                    <button onClick={ejecutar} disabled={importando || filas.length === 0} style={{ ...S.btn('primary'), flex: 2 }}>
                      {importando ? 'Importando...' : `Importar ${filas.length} facturas`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {paso === 3 && resultado && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{resultado.errores.length === 0 ? '✅' : '⚠️'}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: resultado.errores.length === 0 ? T.green : T.sec, marginBottom: 6 }}>
                {resultado.importados > 0 ? 'Importacion completada' : resultado.duplicados > 0 ? 'Facturas ya existentes' : 'Sin facturas nuevas'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, margin: '20px 0', textAlign: 'left' }}>
                {[
                  { l: 'Facturas importadas', v: resultado.importados, c: T.green },
                  { l: 'Duplicados omitidos',  v: resultado.duplicados, c: T.sec },
                  { l: 'Clientes creados',     v: resultado.clientesCreados, c: T.acc },
                  { l: 'Errores',              v: resultado.errores.length, c: resultado.errores.length > 0 ? T.red : T.mut },
                ].map((s, i) => (
                  <div key={i} style={{ ...S.card, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: T.mut }}>{s.l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {resultado.errores.length > 0 && (
                <div style={{ ...S.card, textAlign: 'left', maxHeight: 140, overflowY: 'auto', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 8 }}>DETALLE DE ERRORES:</div>
                  {resultado.errores.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.sub, padding: '3px 0', borderBottom: `1px solid ${T.bord}` }}>{e}</div>
                  ))}
                </div>
              )}
              <button onClick={onClose} style={{ ...S.btn('primary'), width: '100%', padding: 13, fontSize: 14 }}>Cerrar y ver facturas</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}