// src/pages/Facturacion.jsx
// ══════════════════════════════════════════════════════════════════
// MÓDULO FACTURACIÓN FEL — Tz'ununSA
// Tabla: facturas (confirmada en Supabase)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, Paginador, Buscador, generarPDF } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';
import ImportadorSAT from '../components/ImportadorSAT.jsx';

// ─── API directa con manejo de errores explícito ──────────────────
async function apiFetch(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) },
    ...rest,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || JSON.parse(text).hint || text; } catch {}
    throw new Error(`[${res.status}] ${msg}`);
  }
  if (!text || text === 'null') return null;
  try { return JSON.parse(text); } catch { return null; }
}

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
  numero_factura: '', serie: '', fecha: today(),
  cliente_nombre: '', cliente_nit: 'CF', cliente_id: '',
  descripcion: '', subtotal: '', tasa_iva: 12, impuestos: '', total: '',
  metodo_pago: 'efectivo', estado: 'borrador', notas: '', reserva_id: '',
};

// ─── Imprimir factura (ventana HTML) ─────────────────────────────
const imprimirFactura = (r) => {
  const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Arial',sans-serif;padding:32px;font-size:11px;color:#1E293B;background:#fff}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #1B2D5C}
.logo-area h1{color:#1B2D5C;font-size:20px;font-weight:800;margin-bottom:4px}
.logo-area p{color:#64748B;font-size:10px}
.factura-info{text-align:right}
.factura-info .num{font-size:18px;font-weight:800;color:#1B2D5C}
.factura-info p{font-size:10px;color:#64748B;margin-top:2px}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;background:#00D4AA22;color:#00D4AA;margin-top:4px}
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
.footer{margin-top:28px;padding-top:16px;border-top:1px solid #E2E8F0;text-align:center;font-size:9px;color:#94A3B8}
`;
  const html = `
<div class="header">
  <div class="logo-area">
    <h1>Tz'unun AutoRentas</h1>
    <p>Servicios de Transporte y Renta de Vehiculos</p>
    <p>Guatemala City, Guatemala</p>
  </div>
  <div class="factura-info">
    <div class="num">FACTURA FEL</div>
    <p>No. ${r.numero_factura || '—'}</p>
    ${r.serie ? `<p>Serie: ${r.serie}</p>` : ''}
    <p>Fecha: ${fmtD(r.fecha)}</p>
    <div class="badge">${ESTADOS[r.estado]?.l || r.estado}</div>
  </div>
</div>
<div class="section">
  <div class="section-title">DATOS DEL CLIENTE</div>
  <div class="client-box">
    <strong>${r.cliente_nombre || 'Consumidor Final'}</strong>
    <p style="margin-top:4px;color:#475569">NIT: ${r.cliente_nit || 'CF'}</p>
  </div>
</div>
<div class="section">
  <div class="section-title">DETALLE DEL SERVICIO</div>
  <table>
    <thead><tr><th>Descripcion</th><th style="text-align:right">Monto Q</th></tr></thead>
    <tbody>
      <tr><td>${r.descripcion || 'Servicios de transporte y renta'}</td>
      <td style="text-align:right;font-weight:600">Q ${fmt(r.subtotal)}</td></tr>
    </tbody>
  </table>
</div>
<div class="amounts">
  <div class="amount-row"><span>Subtotal</span><span>Q ${fmt(r.subtotal)}</span></div>
  <div class="amount-row"><span>IVA (${r.tasa_iva || 12}%)</span><span>Q ${fmt(r.impuestos)}</span></div>
  <div class="amount-total"><span>TOTAL</span><span>Q ${fmt(r.total)}</span></div>
</div>
${r.metodo_pago ? `<p style="margin-top:12px;font-size:10px;color:#64748B">Metodo de pago: ${r.metodo_pago}</p>` : ''}
<div class="footer">
  Documento generado por Tz'unun AutoRentas &nbsp;|&nbsp;
  ${new Date().toLocaleDateString('es-GT', { day:'2-digit', month:'long', year:'numeric' })}
</div>`;
  generarPDF({ html, css, filename: `FEL_${r.numero_factura || r.id || "factura"}.pdf` });
};

// ════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function PageFacturacion({ showToast, empId }) {
  const [vista,    setVista]    = useState('lista');
  const [editItem, setEditItem] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [filtro,   setFiltro]   = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [exportar, setExportar] = useState(false);
  const [showSAT,  setShowSAT]  = useState(false);
  const [f,        setF]        = useState({ ...EF });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const queryFact = filtro !== 'todos' ? 'estado=eq.'+filtro : '';
  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload, desde, hasta } = usePaginacion({
    table: 'facturas',
    query: queryFact,
    search: busqueda,
    columns: ['numero', 'nombre_receptor', 'nit_receptor', 'serie', 'descripcion'],
    order: 'created_at.desc',
  });

  // ─── Calcular IVA y total ──────────────────────────────────────
  const calcular = (sub, tasaIva) => {
    const s = parseFloat(sub) || 0;
    const t = parseInt(tasaIva) || 0;
    const imp = Math.round(s * (t / 100) * 100) / 100;
    setF(p => ({ ...p, impuestos: imp.toFixed(2), total: (s + imp).toFixed(2) }));
  };

  // ─── Abrir nuevo ──────────────────────────────────────────────
  const abrirNuevo = () => {
    const numero = 'FEL-' + Date.now().toString().slice(-6);
    setF({ ...EF, numero_factura: numero, fecha: today() });
    setEditItem(null);
    setVista('form');
  };

  // ─── Abrir editar ─────────────────────────────────────────────
  const abrirEditar = (r) => {
    setF({
      numero_factura: r.numero_factura || '',
      serie:          r.serie          || '',
      fecha:          r.fecha          || today(),
      cliente_nombre: r.cliente_nombre || '',
      cliente_nit:    r.cliente_nit    || 'CF',
      cliente_id:     r.cliente_id     || '',
      descripcion:    r.descripcion    || '',
      subtotal:       r.subtotal       || '',
      tasa_iva:       r.tasa_iva       ?? 12,
      impuestos:      r.impuestos      || '',
      total:          r.total          || '',
      metodo_pago:    r.metodo_pago    || 'efectivo',
      estado:         r.estado         || 'borrador',
      notas:          r.notas          || '',
      reserva_id:     r.reserva_id     || '',
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
        numero_factura: f.numero_factura || ('FEL-' + Date.now().toString().slice(-6)),
        serie:          f.serie          || null,
        fecha:          f.fecha,
        cliente_nombre: f.cliente_nombre.trim(),
        cliente_nit:    f.cliente_nit.trim() || 'CF',
        cliente_id:     f.cliente_id     || null,
        descripcion:    f.descripcion    || null,
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
        await apiFetch(`/facturas?id=eq.${editItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('Factura actualizada');
      } else {
        await apiFetch('/facturas', {
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
      await apiFetch(`/facturas?id=eq.${id}`, { method: 'DELETE' });
      showToast('Factura eliminada');
      reload();
    } catch (e) {
      showToast('Error al eliminar: ' + e.message, 'err');
    }
  };

  // ─── Cambiar estado ───────────────────────────────────────────
  const cambiarEstado = async (id, estado) => {
    try {
      await apiFetch(`/facturas?id=eq.${id}`, {
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
              <Fld label="NUMERO FACTURA">
                <input style={{ ...S.inp, fontFamily: 'monospace', fontWeight: 700 }}
                  value={f.numero_factura}
                  onChange={e => sf('numero_factura', e.target.value)}
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
            </div>
          </div>

          <div style={S.card}>
            <Fld label="DESCRIPCION DEL SERVICIO">
              <textarea style={{ ...S.inp, minHeight: 90, resize: 'vertical' }}
                value={f.descripcion}
                onChange={e => sf('descripcion', e.target.value)}
                placeholder="Descripcion detallada del servicio facturado..." />
            </Fld>
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
        <ModalExportar titulo="Facturas FEL" datos={rows}
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
            { label: 'Estado',       key: 'estado'         },
          ]}
          onClose={() => setExportar(false)} />
      )}

      {/* Modal importador SAT */}
      {showSAT && (
        <ImportadorSAT tipo="ventas" empId={empId} showToast={showToast}
          onClose={() => setShowSAT(false)} onImportado={reload} />
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
        <button onClick={() => setShowSAT(true)}
          style={{ ...S.btn('blue'), fontSize: 11, whiteSpace: 'nowrap' }}>
          Importar SAT
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
                      <span>NIT: {r.cliente_nit || 'CF'}</span>
                      <span>{fmtD(r.fecha)}</span>
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
                    <button onClick={() => imprimirFactura(r)}
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
