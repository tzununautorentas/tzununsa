// IMPORTADOR SAT GUATEMALA — Tz'ununSA
// Compatible con exportaciones de Agencia Virtual SAT Guatemala
// Soporta: facturas emitidas (ventas) y facturas recibidas (compras)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import { T, S, SB, H, fmt, today } from '../config.js';

async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) }, ...rest,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || JSON.parse(text).hint || text; } catch {}
    throw new Error(msg);
  }
  try { return JSON.parse(text); } catch { return null; }
}

// ─── Cargar SheetJS desde CDN ─────────────────────────────────────
const cargarXLSX = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error('No se pudo cargar el lector de Excel'));
  document.head.appendChild(s);
});

// ─── Normalizar NIT ───────────────────────────────────────────────
const normNIT = (v) => String(v || '').trim().replace(/\s+/g, '').toUpperCase();

const normText = (v) => String(v || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

// ─── Normalizar fecha SAT (dd/mm/yyyy → yyyy-mm-dd) ───────────────
const normFecha = (v) => {
  if (!v) return today();
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) return s.slice(0, 10);
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  const m2 = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (m2) return s.slice(0,10);
  return today();
};

// ─── Normalizar monto ─────────────────────────────────────────────
const normMonto = (v) => parseFloat(String(v||'0').replace(/[Q,\s]/g,'').replace(/[^0-9.-]/g,'')) || 0;

// ─── Buscar índice de columna por palabras clave ──────────────────
const findCol = (headers, claves) => {
  const h = headers.map(normText);
  for (const c of claves) {
    const needle = normText(c);
    const idx = h.findIndex(x => x === needle);
    if (idx >= 0) return idx;
  }
  for (const c of claves) {
    const needle = normText(c);
    const idx = h.findIndex(x => x.includes(needle));
    if (idx >= 0) return idx;
  }
  return -1;
};

const getVal = (row, idx) => idx >= 0 ? String(row[idx] || '').trim() : '';
const pick = (row, headers, claves) => getVal(row, findCol(headers, claves));

// ─── Detectar tipo de archivo SAT ─────────────────────────────────
// SAT exporta dos tipos:
// VENTAS  → columnas: NIT RECEPTOR, NOMBRE RECEPTOR, SERIE, NO. DOCUMENTO...
// COMPRAS → columnas: NIT EMISOR/VENDEDOR, NOMBRE EMISOR/VENDEDOR, SERIE, NO. DOCUMENTO...
const detectarTipo = (headers) => {
  const h = normText(headers.join(' '));
  if (h.includes('id del receptor') && h.includes('nit del emisor')) return 'ventas';
  if (h.includes('nit del emisor') && h.includes('nombre completo del emisor')) return 'compras';
  if (h.includes('receptor') || h.includes('comprador')) return 'ventas';
  if (h.includes('emisor')   || h.includes('vendedor') || h.includes('proveedor')) return 'compras';
  return 'desconocido';
};

// ─── Parsear fila de VENTAS (facturas emitidas) ───────────────────
const parsearVenta = (row, headers) => {
  const autorizacion = pick(row, headers, ['numero de autorizacion', 'autorizacion']);
  const nitRec    = normNIT(pick(row, headers, ['id del receptor', 'nit del receptor', 'nit receptor', 'nit comprador']));
  const nombreRec = pick(row, headers, ['nombre completo del receptor', 'nombre del receptor', 'nombre receptor', 'comprador', 'cliente']);
  const serie     = pick(row, headers, ['serie']);
  const numDoc    = pick(row, headers, ['numero del dte', 'numero dte', 'numero de dte', 'no. documento', 'numero documento']).replace(/^0+/,'');
  const fecha     = normFecha(pick(row, headers, ['fecha de emision', 'fecha emision', 'emision', 'fecha']));
  const granTotal = normMonto(pick(row, headers, ['gran total (moneda original)', 'gran total', 'total']));
  const iva       = normMonto(pick(row, headers, ['iva (monto de este impuesto)', 'iva']));
  const estado    = pick(row, headers, ['estado']);
  const tipo      = pick(row, headers, ['tipo de dte (nombre)', 'tipo dte', 'tipo documento']);
  const anulado   = pick(row, headers, ['marca de anulado']);
  const subtotal  = Math.max(0, Math.round((granTotal - iva) * 100) / 100);

  return { autorizacion, nitRec, nombreRec, serie, numDoc, fecha, subtotal, iva, total: granTotal, estado, tipo, anulado };
};

const parsearCompra = (row, headers) => {
  const autorizacion = pick(row, headers, ['numero de autorizacion', 'autorizacion']);
  const nitEmi    = normNIT(pick(row, headers, ['nit del emisor', 'nit emisor', 'nit vendedor', 'nit proveedor']));
  const nombreEmi = pick(row, headers, ['nombre completo del emisor', 'nombre del emisor', 'nombre emisor', 'vendedor', 'proveedor']);
  const serie     = pick(row, headers, ['serie']);
  const numDoc    = pick(row, headers, ['numero del dte', 'numero dte', 'numero de dte', 'no. documento', 'numero documento']).replace(/^0+/,'');
  const fecha     = normFecha(pick(row, headers, ['fecha de emision', 'fecha emision', 'emision', 'fecha']));
  const granTotal = normMonto(pick(row, headers, ['gran total (moneda original)', 'gran total', 'total']));
  const iva       = normMonto(pick(row, headers, ['iva (monto de este impuesto)', 'iva']));
  const estado    = pick(row, headers, ['estado']);
  const tipo      = pick(row, headers, ['tipo de dte (nombre)', 'tipo dte', 'tipo documento']);
  const anulado   = pick(row, headers, ['marca de anulado']);
  const subtotal  = Math.max(0, Math.round((granTotal - iva) * 100) / 100);

  return { autorizacion, nitEmi, nombreEmi, serie, numDoc, fecha, subtotal, iva, total: granTotal, estado, tipo, anulado };
};

// SOLO marca como duplicado si tiene numero de documento real.
const claveDoc = (numDoc, serie, nit) => {
  if (!numDoc || numDoc === '0') return null; // sin clave = no se puede deduplicar
  return `${String(serie || '').trim()}|${String(numDoc || '').trim()}|${normNIT(nit)}`;
};

const normalizarTipoImportacion = (tipo) => {
  const t = normText(tipo);
  if (['ventas', 'venta', 'emitidas', 'emitidos', 'ingresos', 'facturacion'].includes(t)) return 'ventas';
  if (['compras', 'compra', 'recibidas', 'recibidos', 'gastos', 'egresos'].includes(t)) return 'compras';
  return '';
};

export default function ImportadorSAT({ tipo, empId, showToast, onClose, onImportado }) {
  const tipoForzado = normalizarTipoImportacion(tipo);
  const [paso,       setPaso]       = useState(1);
  const [cargando,   setCargando]   = useState(false);
  const [importando, setImportando] = useState(false);
  const [progreso,   setProgreso]   = useState('');
  const [filas,      setFilas]      = useState([]);
  const [tipoDetect, setTipoDetect] = useState(tipoForzado);
  const [nombre,     setNombre]     = useState('');
  const [resultado,  setResultado]  = useState(null);
  const [drag,       setDrag]       = useState(false);
  const [headers,    setHeaders]    = useState([]);
  const inputRef = useRef(null);

  // ─── Leer y parsear archivo ────────────────────────────────────
  const leerArchivo = async (file) => {
    if (!file) return;
    setCargando(true);
    setProgreso('Cargando lector de archivos...');
    setNombre(file.name);
    try {
      const XLSX = await cargarXLSX();
      setProgreso('Leyendo archivo SAT...');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', raw: false, cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

      // Encontrar fila de encabezados — SAT suele tener 1-3 filas de metadata arriba
      let headerRow = 0;
      for (let i = 0; i < Math.min(data.length, 8); i++) {
        const row = data[i] || [];
        const rowStr = row.map(x => String(x||'')).join(' ').toLowerCase();
        if (rowStr.includes('nit') || rowStr.includes('serie') || rowStr.includes('documento') || rowStr.includes('dte')) {
          headerRow = i;
          break;
        }
      }

      const hdrs = (data[headerRow] || []).map(x => String(x || '').trim());
      const rows = data.slice(headerRow + 1).filter(r =>
        Array.isArray(r) && r.some(x => x !== '' && x != null)
      );

      setProgreso('Analizando estructura SAT...');
      const tipoD = tipoForzado || detectarTipo(hdrs);
      setTipoDetect(tipoD);
      setHeaders(hdrs);

      const parsed = rows.map(r =>
        tipoD === 'ventas' ? parsearVenta(r, hdrs) : parsearCompra(r, hdrs)
      ).filter(r => r.total > 0 || r.numDoc);

      setFilas(parsed);
      setPaso(2);
      setProgreso('');
    } catch (e) {
      showToast('Error leyendo archivo: ' + e.message, 'err');
    } finally {
      setCargando(false);
    }
  };

  // ─── Importar VENTAS → tabla facturas ─────────────────────────
  const importarVentas = async () => {
    const res = { importados: 0, duplicados: 0, clientesCreados: 0, errores: [] };
    setProgreso('Consultando facturas existentes...');

    // Cargar claves existentes para deduplicación
    const existing = await api(`/facturas?empresa_id=eq.${empId}&select=numero_factura,serie,cliente_nit&limit=5000`).catch(() => []);
    const existSet = new Set(
      (existing || [])
        .map(f => claveDoc(f.numero_factura, f.serie, f.cliente_nit))
        .filter(Boolean)
    );

    // Cargar clientes existentes por NIT
    const cliExist = await api(`/clientes?empresa_id=eq.${empId}&select=id,nombre,nit`).catch(() => []);
    const cliMap = {};
    (cliExist || []).forEach(c => { if (c.nit) cliMap[normNIT(c.nit)] = c; });

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      setProgreso(`Procesando ${i + 1} de ${filas.length}...`);

      // Deduplicación robusta — solo si tiene número de documento
      const clave = claveDoc(f.numDoc, f.serie, f.nitRec);
      if (clave && existSet.has(clave)) { res.duplicados++; continue; }

      try {
        // Buscar o crear cliente
        let clienteId = null;
        if (f.nitRec && f.nitRec !== 'CF') {
          const c = cliMap[f.nitRec];
          if (c) {
            clienteId = c.id;
          } else if (f.nombreRec) {
            const nuevo = await api('/clientes', {
              method: 'POST',
              body: JSON.stringify({ empresa_id: empId, nombre: f.nombreRec, nit: f.nitRec, tipo: 'empresa' }),
              extraHeaders: { Prefer: 'return=representation' },
            });
            const n = Array.isArray(nuevo) ? nuevo[0] : nuevo;
            if (n?.id) { cliMap[f.nitRec] = n; clienteId = n.id; res.clientesCreados++; }
          }
        }

        await api('/facturas', {
          method: 'POST',
          body: JSON.stringify({
            empresa_id:     empId,
            numero_factura: f.numDoc || null,
            serie:          f.serie  || null,
            fecha:          f.fecha,
            cliente_nombre: f.nombreRec || 'Consumidor Final',
            cliente_nit:    f.nitRec   || 'CF',
            cliente_id:     clienteId,
            descripcion:    `Importado SAT — ${f.tipo || 'Factura'} ${f.serie || ''}-${f.numDoc || ''}`.trim(),
            subtotal:       f.subtotal,
            tasa_iva:       12,
            impuestos:      f.iva,
            total:          f.total,
            metodo_pago:    'efectivo',
            estado:         normText(f.estado).includes('anulad') || normText(f.anulado) === 'si' ? 'anulada' : 'certificada',
            notas:          `Autorizacion SAT: ${f.autorizacion || ''} | Estado SAT: ${f.estado || 'Vigente'} | Importado desde Agencia Virtual SAT`,
          }),
          extraHeaders: { Prefer: 'return=minimal' },
        });

        if (clave) existSet.add(clave);
        res.importados++;
      } catch (e) {
        res.errores.push(`Fila ${i + 1} (${f.numDoc || 'sin num'}): ${e.message}`);
      }
    }

    return res;
  };

  // ─── Importar COMPRAS → tabla gastos ──────────────────────────
  const importarCompras = async () => {
    const res = { importados: 0, duplicados: 0, proveedoresCreados: 0, errores: [] };
    setProgreso('Consultando gastos existentes...');

    const existing = await api(`/gastos?empresa_id=eq.${empId}&select=numero_factura,proveedor_nit&limit=5000`).catch(() => []);
    const existSet = new Set(
      (existing || [])
        .map(f => claveDoc(f.numero_factura, '', f.proveedor_nit))
        .filter(Boolean)
    );

    const provExist = await api(`/proveedores?empresa_id=eq.${empId}&select=id,nombre,nit`).catch(() => []);
    const provMap = {};
    (provExist || []).forEach(p => { if (p.nit) provMap[normNIT(p.nit)] = p; });

    // Contar proveedores para generar código
    let contProv = Object.keys(provMap).length;

    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      setProgreso(`Procesando ${i + 1} de ${filas.length}...`);

      const clave = claveDoc(f.numDoc, '', f.nitEmi);
      if (clave && existSet.has(clave)) { res.duplicados++; continue; }

      try {
        // Buscar o crear proveedor por NIT
        let proveedorId = null;
        if (f.nitEmi) {
          const p = provMap[f.nitEmi];
          if (p) {
            proveedorId = p.id;
          } else if (f.nombreEmi) {
            contProv++;
            const codigo = `PROV-${String(contProv).padStart(4, '0')}`;
            const nuevo = await api('/proveedores', {
              method: 'POST',
              body: JSON.stringify({
                empresa_id: empId, nombre: f.nombreEmi, nit: f.nitEmi,
                codigo, tipo: 'otros', activo: true,
              }),
              extraHeaders: { Prefer: 'return=representation' },
            });
            const n = Array.isArray(nuevo) ? nuevo[0] : nuevo;
            if (n?.id) { provMap[f.nitEmi] = n; proveedorId = n.id; res.proveedoresCreados++; }
          }
        }

        // Detectar categoría por nombre de proveedor
        const nom = (f.nombreEmi || '').toLowerCase();
        let categoria = 'otros';
        if (nom.match(/combustible|gasolinera|puma|texaco|shell|petroleo|gulf/)) categoria = 'combustible';
        else if (nom.match(/seguro|mapfre|qualitas|asegurado|seguros/))          categoria = 'seguros';
        else if (nom.match(/taller|mecanica|automotriz|repuesto|llanta/))        categoria = 'mantenimiento';
        else if (nom.match(/hotel|hosped|alojamiento/))                          categoria = 'hospedaje';
        else if (nom.match(/restaurante|comida|aliment/))                        categoria = 'alimentacion';
        else if (nom.match(/telef|claro|tigo|movistar|internet/))                categoria = 'servicios';
        else if (nom.match(/papeleria|oficina|libreria/))                        categoria = 'oficina';

        await api('/gastos', {
          method: 'POST',
          body: JSON.stringify({
            empresa_id:     empId,
            fecha:          f.fecha,
            categoria,
            descripcion:    `${f.tipo || 'Compra'} ${f.serie || ''}-${f.numDoc || ''} — ${f.nombreEmi || ''}`.trim(),
            proveedor:      f.nombreEmi || '',
            proveedor_id:   proveedorId,
            proveedor_nit:  f.nitEmi || '',
            numero_factura: f.numDoc || '',
            subtotal:       f.subtotal,
            impuestos:      f.iva,
            total:          f.total,
            metodo_pago:    'efectivo',
            estado:         'aprobado',
            moneda:         'GTQ',
            contabilizado:  false,
            notas:          `Serie: ${f.serie||''} | Autorizacion SAT: ${f.autorizacion || ''} | Estado SAT: ${f.estado||'Vigente'} | Importado desde SAT Guatemala`,
          }),
          extraHeaders: { Prefer: 'return=minimal' },
        });

        if (clave) existSet.add(clave);
        res.importados++;
      } catch (e) {
        res.errores.push(`Fila ${i + 1} (${f.numDoc || 'sin num'}): ${e.message}`);
      }
    }

    return res;
  };

  // ─── Ejecutar importación ──────────────────────────────────────
  const ejecutar = async () => {
    if (!empId) {
      showToast('Empresa no identificada. Recarga la pagina antes de importar.', 'err');
      return;
    }
    setImportando(true);
    try {
      const modo = tipoForzado || tipoDetect;
      const res = modo === 'ventas'
        ? await importarVentas()
        : await importarCompras();
      setResultado(res);
      setPaso(3);
      if (res.importados > 0) {
        onImportado?.();
        showToast(`${res.importados} registros importados`);
      } else if (res.duplicados > 0 && res.importados === 0) {
        showToast(`Todos los registros ya existen (${res.duplicados} duplicados)`, 'err');
      }
    } catch (e) {
      showToast('Error en importacion: ' + e.message, 'err');
    } finally {
      setImportando(false);
      setProgreso('');
    }
  };

  const esVentas  = (tipoDetect || tipoForzado) === 'ventas';
  const totalMonto = filas.reduce((s, f) => s + (f.total || 0), 0);
  const totalIVA   = filas.reduce((s, f) => s + (f.iva   || 0), 0);

  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={paso < 2 ? onClose : undefined}>
      <div style={{ background: T.surf, borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.bord}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>
              Importar desde SAT Guatemala
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
              {esVentas ? 'Facturas emitidas (ventas)' : 'Facturas recibidas (compras/gastos)'} · Paso {paso} de 3
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.mut, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* ══ PASO 1: Subir archivo ══ */}
          {paso === 1 && (
            <div>
              <div style={{ background: T.card, borderRadius: 12, padding: '16px 18px', marginBottom: 20, fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6, fontSize: 13 }}>
                  Como exportar desde SAT Agencia Virtual:
                </div>
                <div>1. Ingresa a <strong style={{ color: T.txt }}>portal.sat.gob.gt</strong> con tu usuario</div>
                <div>2. Ve a <strong style={{ color: T.txt }}>Servicios → Consulta de documentos DTE</strong></div>
                <div>3. Selecciona: <strong style={{ color: T.txt }}>{esVentas ? 'Documentos emitidos' : 'Documentos recibidos'}</strong></div>
                <div>4. Filtra por periodo y descarga en formato <strong style={{ color: T.txt }}>Excel (.xlsx)</strong></div>
                <div>5. Sube el archivo aqui abajo</div>
              </div>

              <div onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); leerArchivo(e.dataTransfer.files[0]); }}
                style={{ border: `2px dashed ${drag ? T.acc : T.bord}`, borderRadius: 14, padding: '44px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? T.accDim : 'transparent', transition: 'all .15s' }}>
                {cargando ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 10, color: T.acc }}>⏳</div>
                    <div style={{ fontSize: 14, color: T.acc, fontWeight: 600 }}>{progreso}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📂</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
                      Arrastra el archivo Excel de SAT o haz clic para seleccionar
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>Formatos: .xlsx · .xls · .csv</div>
                    <div style={{ fontSize: 11, color: T.acc, marginTop: 8 }}>
                      Deteccion automatica de columnas SAT Guatemala
                    </div>
                  </div>
                )}
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                  onChange={e => leerArchivo(e.target.files[0])} />
              </div>
            </div>
          )}

          {/* ══ PASO 2: Preview y confirmación ══ */}
          {paso === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>
                    Vista previa — {filas.length} registros encontrados
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                    {nombre} · {esVentas ? 'Facturas emitidas (ventas)' : 'Facturas recibidas (compras)'}
                  </div>
                </div>
                <button onClick={() => { setFilas([]); setPaso(1); }} style={S.btn('ghost')}>
                  Cambiar archivo
                </button>
              </div>

              {filas.length === 0 ? (
                <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 10, padding: '16px 18px', marginBottom: 16, color: T.red, fontSize: 13 }}>
                  <strong>No se encontraron registros validos.</strong> Verifica que el archivo sea la exportacion correcta de SAT.
                  Las columnas detectadas fueron: {headers.slice(0, 6).join(', ')}
                </div>
              ) : (
                <>
                  {/* Resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { l: 'Registros a importar', v: filas.length,          c: T.acc  },
                      { l: 'Suma total',            v: `Q ${fmt(totalMonto)}`, c: T.blue },
                      { l: 'IVA total',             v: `Q ${fmt(totalIVA)}`,  c: T.sec  },
                    ].map((s, i) => (
                      <div key={i} style={{ ...S.card, textAlign: 'center', padding: 14 }}>
                        <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabla preview */}
                  <div style={{ ...S.card, maxHeight: 300, overflowY: 'auto', padding: 0, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          {(esVentas
                            ? ['NIT Cliente', 'Cliente', 'No. Doc.', 'Fecha', 'Subtotal', 'IVA', 'Total']
                            : ['NIT Proveedor', 'Proveedor', 'No. Doc.', 'Fecha', 'Subtotal', 'IVA', 'Total']
                          ).map(h => <th key={h} style={S.th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.slice(0, 100).map((fila, i) => (
                          <tr key={i}>
                            <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: T.acc }}>
                              {esVentas ? fila.nitRec : fila.nitEmi}
                            </td>
                            <td style={{ ...S.td, fontSize: 12, maxWidth: 140 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 135 }}>
                                {esVentas ? fila.nombreRec : fila.nombreEmi}
                              </div>
                            </td>
                            <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace', color: T.sub }}>
                              {fila.serie && `${fila.serie}-`}{fila.numDoc}
                            </td>
                            <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{fila.fecha}</td>
                            <td style={{ ...S.td, fontSize: 12, textAlign: 'right' }}>Q {fmt(fila.subtotal)}</td>
                            <td style={{ ...S.td, fontSize: 12, textAlign: 'right', color: T.sec }}>Q {fmt(fila.iva)}</td>
                            <td style={{ ...S.td, fontSize: 13, fontWeight: 700, textAlign: 'right', color: T.acc }}>Q {fmt(fila.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filas.length > 100 && (
                      <div style={{ padding: '8px 14px', fontSize: 11, color: T.mut, textAlign: 'center', borderTop: `1px solid ${T.bord}` }}>
                        Mostrando 100 de {filas.length} — todos seran importados
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Info de lo que hara */}
              <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6 }}>El sistema realizara automaticamente:</div>
                <div style={{ color: T.sub, lineHeight: 1.9 }}>
                  {esVentas ? (
                    <>
                      Buscara cada cliente por NIT — si no existe lo creara automaticamente<br/>
                      Evitara duplicados comparando numero de documento + fecha + NIT<br/>
                      Creara registros en Facturacion con estado "Certificada"
                    </>
                  ) : (
                    <>
                      Buscara cada proveedor por NIT — si no existe lo creara con codigo PROV-XXXX<br/>
                      Evitara duplicados comparando numero de documento + fecha + NIT<br/>
                      Detectara categoria automaticamente (combustible, seguros, taller, etc.)<br/>
                      Creara registros en Gastos con estado "Aprobado"
                    </>
                  )}
                </div>
              </div>

              {importando && (
                <div style={{ background: T.blueDim, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: T.blue, textAlign: 'center', fontWeight: 600 }}>
                  {progreso || 'Procesando...'}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setFilas([]); setPaso(1); }} style={{ ...S.btn('ghost'), flex: 1 }} disabled={importando}>
                  Cancelar
                </button>
                <button onClick={ejecutar}
                  disabled={importando || filas.length === 0}
                  style={{ ...S.btn('primary'), flex: 2 }}>
                  {importando ? progreso || 'Importando...' : `Importar ${filas.length} registros`}
                </button>
              </div>
            </div>
          )}

          {/* ══ PASO 3: Resultado ══ */}
          {paso === 3 && resultado && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>
                {resultado.errores.length === 0 ? '✅' : '⚠️'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: resultado.errores.length === 0 ? T.green : T.sec, marginBottom: 6 }}>
                {resultado.importados > 0 ? 'Importacion completada' : resultado.duplicados > 0 ? 'Registros ya existentes' : 'Sin registros nuevos'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, margin: '20px 0', textAlign: 'left' }}>
                {[
                  { l: 'Registros importados', v: resultado.importados, c: resultado.importados > 0 ? T.green : T.mut },
                  { l: 'Duplicados omitidos',  v: resultado.duplicados, c: resultado.duplicados > 0 ? T.sec : T.mut  },
                  { l: esVentas ? 'Clientes creados' : 'Proveedores creados',
                    v: resultado.clientesCreados ?? resultado.proveedoresCreados ?? 0, c: T.acc },
                  { l: 'Errores',  v: resultado.errores.length, c: resultado.errores.length > 0 ? T.red : T.mut },
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

              <button onClick={onClose}
                style={{ ...S.btn('primary'), width: '100%', padding: 13, fontSize: 14 }}>
                Cerrar y ver registros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
ENDFILE
echo "ImportadorSAT.jsx: $(wc -l < /home/claude/tzunun/ImportadorSAT.jsx) lineas"
