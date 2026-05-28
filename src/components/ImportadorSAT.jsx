// src/components/ImportadorSAT.jsx
// ══════════════════════════════════════════════════════════════════
// IMPORTADOR SAT GUATEMALA — Tz'ununSA
// Lee archivos Excel/CSV exportados desde portal SAT
// Detecta proveedores/clientes existentes por NIT
// Crea registros automáticos en gastos o facturas
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, today } from '../config.js';
import { IconUpload, IconCheck, IconAlert, IconClose, IconDocument } from './Icons.jsx';

const SB = "https://fmijbpatkddkbxlkfoza.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, { headers: { ...H, ...(extraHeaders||{}) }, ...rest });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Error ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
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

// ─── Normalizar NIT Guatemala ─────────────────────────────────────
const normalizarNIT = (nit) => {
  if (!nit) return '';
  return String(nit).replace(/\s+/g, '').replace(/CF/i, 'CF').toUpperCase();
};

// ─── Detectar tipo de archivo SAT ────────────────────────────────
// SAT Guatemala exporta con estas columnas para compras:
// NIT PROVEEDOR, NOMBRE PROVEEDOR, NO. FACTURA, SERIE, FECHA EMISION,
// FECHA CERTIFICACION, MONTO, IVA, TOTAL, TIPO DOCUMENTO, ESTADO
//
// Para facturas emitidas:
// NIT RECEPTOR, NOMBRE RECEPTOR, SERIE, NO. DOCUMENTO, FECHA, MONTO, IVA, TOTAL

const detectarTipoSAT = (headers) => {
  const h = headers.map(x => String(x || '').toLowerCase());
  const tieneProveedor = h.some(x => x.includes('proveedor') || x.includes('vendedor') || x.includes('emisor'));
  const tieneReceptor  = h.some(x => x.includes('receptor') || x.includes('comprador') || x.includes('cliente'));
  if (tieneProveedor) return 'compras';
  if (tieneReceptor)  return 'ventas';
  return 'desconocido';
};

// ─── Mapear columnas SAT → campos internos ───────────────────────
const mapearColumna = (headers, posibles) => {
  const h = headers.map(x => String(x || '').toLowerCase().trim());
  for (const p of posibles) {
    const idx = h.findIndex(x => x.includes(p.toLowerCase()));
    if (idx >= 0) return idx;
  }
  return -1;
};

const parsearFilaCompra = (fila, headers) => {
  const col = (claves) => {
    const idx = mapearColumna(headers, claves);
    return idx >= 0 ? String(fila[idx] || '').trim() : '';
  };
  const num = (claves) => parseFloat(String(col(claves)).replace(/,/g, '').replace(/Q/gi, '').trim()) || 0;
  const fecha = (s) => {
    if (!s) return today();
    // Formatos SAT: dd/mm/yyyy o yyyy-mm-dd
    const m1 = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const m2 = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    if (m2) return s.slice(0, 10);
    return today();
  };

  return {
    proveedor_nit:   normalizarNIT(col(['nit proveedor', 'nit vendedor', 'nit emisor', 'nit'])),
    proveedor:       col(['nombre proveedor', 'nombre vendedor', 'nombre emisor', 'proveedor', 'vendedor', 'emisor']),
    numero_factura:  col(['no. factura', 'numero factura', 'no. documento', 'numero documento', 'documento']),
    serie:           col(['serie']),
    fecha:           fecha(col(['fecha emision', 'fecha de emision', 'fecha', 'emision'])),
    subtotal:        num(['monto', 'subtotal', 'base']),
    impuestos:       num(['iva', 'impuesto']),
    total:           num(['total']),
    tipo_documento:  col(['tipo documento', 'tipo']),
    estado_sat:      col(['estado']),
  };
};

const parsearFilaVenta = (fila, headers) => {
  const col = (claves) => {
    const idx = mapearColumna(headers, claves);
    return idx >= 0 ? String(fila[idx] || '').trim() : '';
  };
  const num = (claves) => parseFloat(String(col(claves)).replace(/,/g, '').replace(/Q/gi, '').trim()) || 0;
  const fecha = (s) => {
    if (!s) return today();
    const m1 = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const m2 = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    if (m2) return s.slice(0, 10);
    return today();
  };

  return {
    cliente_nit:    normalizarNIT(col(['nit receptor', 'nit comprador', 'nit cliente', 'nit'])),
    cliente_nombre: col(['nombre receptor', 'nombre comprador', 'nombre cliente', 'receptor', 'comprador', 'cliente']),
    numero_factura: col(['no. documento', 'numero documento', 'no. factura', 'documento']),
    serie:          col(['serie']),
    fecha:          fecha(col(['fecha emision', 'fecha', 'emision'])),
    subtotal:       num(['monto', 'subtotal', 'base']),
    impuestos:      num(['iva', 'impuesto']),
    total:          num(['total']),
    tipo_documento: col(['tipo documento', 'tipo']),
    estado_sat:     col(['estado']),
  };
};

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function ImportadorSAT({ tipo, empId, showToast, onClose, onImportado }) {
  // tipo: 'compras' | 'ventas'
  const [paso,        setPaso]        = useState(1); // 1=subir, 2=preview, 3=resultado
  const [cargando,    setCargando]    = useState(false);
  const [importando,  setImportando]  = useState(false);
  const [progreso,    setProgreso]    = useState('');
  const [filas,       setFilas]       = useState([]);
  const [tipoDetect,  setTipoDetect]  = useState('');
  const [nombre,      setNombre]      = useState('');
  const [resultado,   setResultado]   = useState(null);
  const [drag,        setDrag]        = useState(false);
  const inputRef = useRef(null);

  // ─── Leer archivo ───────────────────────────────────────────────
  const leerArchivo = async (file) => {
    if (!file) return;
    setCargando(true);
    setProgreso('Cargando lector de archivos...');
    setNombre(file.name);
    try {
      const XLSX = await cargarXLSX();
      setProgreso('Leyendo archivo...');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

      // Buscar la fila de encabezados (puede haber filas de metadata arriba)
      let headerRow = 0;
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = data[i];
        if (Array.isArray(row) && row.length >= 5 && row.filter(Boolean).length >= 4) {
          // Verificar si parece encabezado SAT
          const rowStr = row.map(x => String(x||'')).join(' ').toLowerCase();
          if (rowStr.includes('nit') || rowStr.includes('factura') || rowStr.includes('monto') || rowStr.includes('serie')) {
            headerRow = i;
            break;
          }
        }
      }

      const headers = data[headerRow] || [];
      const rows = data.slice(headerRow + 1).filter(r => r && r.some(Boolean));

      setProgreso('Analizando estructura...');
      const tipoDetectado = detectarTipoSAT(headers);
      setTipoDetect(tipoDetectado);

      const parsed = rows.map(r =>
        tipoDetectado === 'ventas'
          ? parsearFilaVenta(r, headers)
          : parsearFilaCompra(r, headers)
      ).filter(r => r.total > 0 || r.numero_factura);

      setFilas(parsed);
      setPaso(2);
      setProgreso('');
    } catch (e) {
      showToast('Error leyendo archivo: ' + e.message, 'err');
    } finally {
      setCargando(false);
    }
  };

  // ─── Importar compras → gastos + proveedores ─────────────────────
  const importarCompras = async () => {
    setImportando(true);
    const resultado = { importados: 0, duplicados: 0, proveedoresCreados: 0, errores: [] };

    // Cargar proveedores y gastos existentes para detectar duplicados
    setProgreso('Cargando datos existentes...');
    const [provExist, gastosExist] = await Promise.all([
      api('/proveedores?select=id,nombre,nit').catch(() => []),
      api('/gastos?select=id,numero_factura,proveedor_nit&limit=2000').catch(() => []),
    ]);
    const provMap = {};
    (provExist || []).forEach(p => { if (p.nit) provMap[normalizarNIT(p.nit)] = p; });
    const factsExist = new Set((gastosExist || []).map(g => `${g.numero_factura}-${g.proveedor_nit}`));

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      setProgreso(`Procesando ${i + 1} de ${filas.length}...`);

      // Detectar duplicado por factura + NIT
      const clave = `${fila.numero_factura}-${fila.proveedor_nit}`;
      if (factsExist.has(clave)) { resultado.duplicados++; continue; }

      try {
        // Buscar o crear proveedor
        let proveedorId = null;
        if (fila.proveedor_nit) {
          const provExistente = provMap[fila.proveedor_nit];
          if (provExistente) {
            proveedorId = provExistente.id;
          } else if (fila.proveedor) {
            // Generar codigo
            const ultimoCode = Object.keys(provMap).length;
            const codigo = `PROV-${String(ultimoCode + resultado.proveedoresCreados + 1).padStart(4, '0')}`;
            const nuevo = await api('/proveedores', {
              method: 'POST',
              body: JSON.stringify({ empresa_id: empId, nombre: fila.proveedor, nit: fila.proveedor_nit, codigo, tipo: 'otros', activo: true }),
              extraHeaders: { Prefer: 'return=representation' },
            });
            const nuevoArr = Array.isArray(nuevo) ? nuevo[0] : nuevo;
            if (nuevoArr?.id) {
              provMap[fila.proveedor_nit] = nuevoArr;
              proveedorId = nuevoArr.id;
              resultado.proveedoresCreados++;
            }
          }
        }

        // Calcular montos (SAT puede venir con solo el total)
        let subtotal = fila.subtotal || 0;
        let impuestos = fila.impuestos || 0;
        let total = fila.total || 0;
        if (total > 0 && subtotal === 0 && impuestos === 0) {
          // Calcular por IVA 12%
          impuestos = Math.round(total / 1.12 * 0.12 * 100) / 100;
          subtotal  = total - impuestos;
        }

        // Determinar categoría por nombre proveedor
        const nombreLower = (fila.proveedor || '').toLowerCase();
        let categoria = 'otros';
        if (nombreLower.includes('combustible') || nombreLower.includes('gasolinera') || nombreLower.includes('puma') || nombreLower.includes('texaco') || nombreLower.includes('shell')) categoria = 'combustible';
        else if (nombreLower.includes('seguro') || nombreLower.includes('mapfre') || nombreLower.includes('asegura')) categoria = 'seguros';
        else if (nombreLower.includes('taller') || nombreLower.includes('mecanica') || nombreLower.includes('auto')) categoria = 'mantenimiento';
        else if (nombreLower.includes('farma') || nombreLower.includes('medic') || nombreLower.includes('clínica')) categoria = 'servicios';

        await api('/gastos', {
          method: 'POST',
          body: JSON.stringify({
            empresa_id: empId, fecha: fila.fecha, categoria,
            descripcion: `Importado SAT — ${fila.tipo_documento || 'Factura'} ${fila.serie || ''}-${fila.numero_factura || ''}`.trim(),
            proveedor: fila.proveedor || '', proveedor_id: proveedorId,
            proveedor_nit: fila.proveedor_nit || '',
            numero_factura: fila.numero_factura || '',
            subtotal, impuestos, total,
            metodo_pago: 'efectivo', estado: 'aprobado',
            moneda: 'GTQ', contabilizado: false,
            notas: `Serie: ${fila.serie || ''} | Estado SAT: ${fila.estado_sat || 'Vigente'} | Importado desde SAT Guatemala`,
          }),
          extraHeaders: { Prefer: 'return=minimal' },
        });

        factsExist.add(clave);
        resultado.importados++;
      } catch (e) {
        resultado.errores.push(`Fila ${i + 1}: ${e.message}`);
      }
    }

    setResultado(resultado);
    setPaso(3);
    setImportando(false);
    setProgreso('');
    if (resultado.importados > 0) {
      onImportado?.();
      showToast(`${resultado.importados} registros importados correctamente`);
    }
  };

  // ─── Importar ventas → facturas + clientes ────────────────────
  const importarVentas = async () => {
    setImportando(true);
    const resultado = { importados: 0, duplicados: 0, clientesCreados: 0, errores: [] };

    setProgreso('Cargando datos existentes...');
    const [clientesExist, factsExist_arr] = await Promise.all([
      api('/clientes?select=id,nombre,nit').catch(() => []),
      api('/facturacion?select=id,numero_factura,cliente_nit&limit=2000').catch(() => []),
    ]);
    const clienteMap = {};
    (clientesExist || []).forEach(c => { if (c.nit) clienteMap[normalizarNIT(c.nit)] = c; });
    const factsSet = new Set((factsExist_arr || []).map(f => `${f.numero_factura}-${f.cliente_nit}`));

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      setProgreso(`Procesando ${i + 1} de ${filas.length}...`);

      const clave = `${fila.numero_factura}-${fila.cliente_nit}`;
      if (factsSet.has(clave)) { resultado.duplicados++; continue; }

      try {
        // Buscar o crear cliente
        let clienteId = null;
        if (fila.cliente_nit && fila.cliente_nit !== 'CF') {
          const clienteExist = clienteMap[fila.cliente_nit];
          if (clienteExist) {
            clienteId = clienteExist.id;
          } else if (fila.cliente_nombre) {
            const nuevo = await api('/clientes', {
              method: 'POST',
              body: JSON.stringify({ empresa_id: empId, nombre: fila.cliente_nombre, nit: fila.cliente_nit, tipo: 'empresa' }),
              extraHeaders: { Prefer: 'return=representation' },
            });
            const nuevoArr = Array.isArray(nuevo) ? nuevo[0] : nuevo;
            if (nuevoArr?.id) {
              clienteMap[fila.cliente_nit] = nuevoArr;
              clienteId = nuevoArr.id;
              resultado.clientesCreados++;
            }
          }
        }

        let subtotal = fila.subtotal || 0;
        let impuestos = fila.impuestos || 0;
        let total = fila.total || 0;
        if (total > 0 && subtotal === 0) {
          impuestos = Math.round(total / 1.12 * 0.12 * 100) / 100;
          subtotal  = total - impuestos;
        }

        await api('/facturacion', {
          method: 'POST',
          body: JSON.stringify({
            empresa_id: empId, fecha: fila.fecha,
            numero_factura: fila.numero_factura || '',
            serie: fila.serie || '',
            cliente_nombre: fila.cliente_nombre || 'Consumidor Final',
            cliente_nit: fila.cliente_nit || 'CF',
            cliente_id: clienteId,
            subtotal, impuestos, total,
            estado: 'certificada',
            notas: `Importado desde SAT Guatemala | Estado SAT: ${fila.estado_sat || 'Vigente'}`,
          }),
          extraHeaders: { Prefer: 'return=minimal' },
        });

        factsSet.add(clave);
        resultado.importados++;
      } catch (e) {
        resultado.errores.push(`Fila ${i + 1}: ${e.message}`);
      }
    }

    setResultado(resultado);
    setPaso(3);
    setImportando(false);
    setProgreso('');
    if (resultado.importados > 0) {
      onImportado?.();
      showToast(`${resultado.importados} facturas importadas correctamente`);
    }
  };

  const ejecutarImportacion = () =>
    tipoDetect === 'ventas' ? importarVentas() : importarCompras();

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={paso < 2 ? onClose : undefined}>
      <div style={{ background: T.surf, borderRadius: 20, width: '100%', maxWidth: 740, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.bord}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.bord}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>
              Importar desde SAT Guatemala
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
              {tipo === 'ventas' ? 'Facturas emitidas' : 'Compras y gastos'} · Paso {paso} de 3
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.mut, cursor: 'pointer', fontSize: 20, padding: '4px 8px' }}>
            <IconClose size={20} color={T.mut} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* ─── PASO 1: Subir archivo ─── */}
          {paso === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                  Instrucciones para exportar desde SAT:
                </div>
                <div style={{ background: T.card, borderRadius: 10, padding: '14px 16px', fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, color: T.acc, marginBottom: 6 }}>Portal SAT Guatemala → Consulta de documentos fiscales:</div>
                  <div>1. Ingresar a <strong style={{ color: T.txt }}>portal.sat.gob.gt</strong> con tu usuario y contraseña</div>
                  <div>2. Ir a <strong style={{ color: T.txt }}>Servicios → Consulta de documentos → {tipo === 'ventas' ? 'Documentos emitidos' : 'Documentos recibidos'}</strong></div>
                  <div>3. Seleccionar el periodo (mes/año)</div>
                  <div>4. Clic en <strong style={{ color: T.txt }}>Exportar → Excel o CSV</strong></div>
                  <div>5. Subir el archivo descargado aqui abajo</div>
                </div>
              </div>

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); leerArchivo(e.dataTransfer.files[0]); }}
                style={{ border: `2px dashed ${drag ? T.acc : T.bord}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? T.accDim : 'transparent', transition: 'all .15s' }}>
                {cargando ? (
                  <div>
                    <div style={{ fontSize: 32, color: T.acc, marginBottom: 10 }}>
                      <IconDocument size={40} color={T.acc} />
                    </div>
                    <div style={{ fontSize: 14, color: T.acc, fontWeight: 600 }}>{progreso}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                      <IconUpload size={40} color={T.acc} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
                      Arrastra el archivo o haz clic para seleccionar
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      Formatos aceptados: Excel (.xlsx, .xls) · CSV (.csv)
                    </div>
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

          {/* ─── PASO 2: Preview ─── */}
          {paso === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>
                    Vista previa: {filas.length} registros encontrados
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                    Archivo: {nombre} · Tipo detectado: {tipoDetect === 'ventas' ? 'Facturas emitidas' : 'Compras / Gastos'}
                  </div>
                </div>
                <button onClick={() => setPaso(1)} style={S.btn("ghost")}>Cambiar archivo</button>
              </div>

              {/* Resumen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { l: 'Registros a importar', v: filas.length, c: T.acc },
                  { l: 'Total suma', v: `Q ${fmt(filas.reduce((s,f) => s+(parseFloat(f.total)||0), 0))}`, c: T.blue },
                  { l: 'IVA total', v: `Q ${fmt(filas.reduce((s,f) => s+(parseFloat(f.impuestos)||0), 0))}`, c: T.sec },
                ].map((s,i) => (
                  <div key={i} style={{ ...S.card, textAlign: 'center', padding: 14 }}>
                    <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Tabla preview */}
              <div style={{ ...S.card, maxHeight: 320, overflowY: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr>
                      {(tipoDetect === 'ventas'
                        ? ['NIT', 'Cliente', 'No. Factura', 'Fecha', 'Subtotal', 'IVA', 'Total']
                        : ['NIT', 'Proveedor', 'No. Factura', 'Fecha', 'Subtotal', 'IVA', 'Total']
                      ).map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 100).map((fila, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>
                          {tipoDetect === 'ventas' ? fila.cliente_nit : fila.proveedor_nit}
                        </td>
                        <td style={{ ...S.td, maxWidth: 160, fontSize: 12 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>
                            {tipoDetect === 'ventas' ? fila.cliente_nombre : fila.proveedor}
                          </div>
                        </td>
                        <td style={{ ...S.td, fontSize: 11, fontFamily: 'monospace' }}>
                          {fila.serie && `${fila.serie}-`}{fila.numero_factura}
                        </td>
                        <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{fila.fecha}</td>
                        <td style={{ ...S.td, fontSize: 12, textAlign: 'right' }}>Q {fmt(fila.subtotal)}</td>
                        <td style={{ ...S.td, fontSize: 12, textAlign: 'right', color: T.sec }}>Q {fmt(fila.impuestos)}</td>
                        <td style={{ ...S.td, fontSize: 13, fontWeight: 700, textAlign: 'right', color: T.acc }}>Q {fmt(fila.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filas.length > 100 && (
                  <div style={{ padding: '10px 14px', fontSize: 11, color: T.mut, textAlign: 'center', borderTop: `1px solid ${T.bord}` }}>
                    Mostrando 100 de {filas.length} registros. Todos seran importados.
                  </div>
                )}
              </div>

              {/* Aviso */}
              <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 12, color: T.acc }}>
                <strong>Que hara el sistema automaticamente:</strong>
                <div style={{ color: T.sub, marginTop: 4, lineHeight: 1.8 }}>
                  {tipoDetect === 'ventas' ? (
                    <>
                      • Buscar cada cliente por NIT — si no existe, lo creara automaticamente<br/>
                      • Validar facturas duplicadas por numero + NIT para no repetirlas<br/>
                      • Crear registros en el modulo Facturacion FEL como "Certificada"
                    </>
                  ) : (
                    <>
                      • Buscar cada proveedor por NIT — si no existe, lo creara automaticamente con codigo PROV-XXXX<br/>
                      • Validar gastos duplicados por numero de factura + NIT para no repetirlos<br/>
                      • Detectar categoria automaticamente por nombre del proveedor<br/>
                      • Crear registros en Gastos con estado "Aprobado"
                    </>
                  )}
                </div>
              </div>

              {importando && (
                <div style={{ background: T.blueDim, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: '12px 16px', marginTop: 12, fontSize: 13, color: T.blue, textAlign: 'center', fontWeight: 600 }}>
                  {progreso || 'Procesando...'}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => setPaso(1)} style={{ ...S.btn('ghost'), flex: 1 }} disabled={importando}>
                  Cancelar
                </button>
                <button onClick={ejecutarImportacion} disabled={importando || filas.length === 0}
                  style={{ ...S.btn('primary'), flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {importando
                    ? progreso || 'Importando...'
                    : `Importar ${filas.length} registros`}
                </button>
              </div>
            </div>
          )}

          {/* ─── PASO 3: Resultado ─── */}
          {paso === 3 && resultado && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                {resultado.errores.length === 0
                  ? <IconCheck size={60} color={T.green} />
                  : <IconAlert size={60} color={T.sec} />}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: resultado.errores.length === 0 ? T.green : T.sec, marginBottom: 6 }}>
                {resultado.errores.length === 0 ? 'Importacion completada' : 'Completado con advertencias'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, margin: '20px 0', textAlign: 'left' }}>
                {[
                  { l: 'Registros importados', v: resultado.importados, c: T.green },
                  { l: 'Duplicados omitidos',  v: resultado.duplicados, c: T.sec   },
                  { l: tipoDetect === 'ventas' ? 'Clientes creados' : 'Proveedores creados',
                    v: resultado.proveedoresCreados || resultado.clientesCreados || 0, c: T.acc },
                  { l: 'Errores', v: resultado.errores.length, c: resultado.errores.length > 0 ? T.red : T.mut },
                ].map((s,i) => (
                  <div key={i} style={{ ...S.card, padding: '12px 16px' }}>
                    <div style={{ fontSize: 10, color: T.mut }}>{s.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {resultado.errores.length > 0 && (
                <div style={{ ...S.card, textAlign: 'left', maxHeight: 150, overflowY: 'auto', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 8 }}>ERRORES DETALLADOS:</div>
                  {resultado.errores.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.sub, padding: '3px 0', borderBottom: `1px solid ${T.bord}` }}>{e}</div>
                  ))}
                </div>
              )}

              <button onClick={onClose} style={{ ...S.btn('primary'), width: '100%', padding: 12, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IconCheck size={16} /> Cerrar y ver registros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
