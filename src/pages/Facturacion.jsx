import React, { useState, useEffect, lazy, Suspense } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, BuscadorCliente } from '../components/shared.jsx';
import ImportadorSAT from '../components/ImportadorSAT.jsx';

const ESTADOS = {
  borrador:    { c:T.mut,   bg:"#1E293B",  l:"Borrador"    },
  emitida:     { c:T.blue,  bg:T.blueDim,  l:"Emitida"     },
  certificada: { c:T.acc,   bg:T.accDim,   l:"Certificada" },
  pagada:      { c:T.green, bg:T.greenDim, l:"Pagada"      },
  parcial:     { c:T.sec,   bg:T.secDim,   l:"Pago parcial"},
  anulada:     { c:T.red,   bg:T.redDim,   l:"Anulada"     },
};

const EF = {
  numero_factura:"", serie:"", fecha:today(),
  cliente_nombre:"", cliente_nit:"CF", cliente_id:"",
  descripcion:"", subtotal:0, impuestos:0, total:0,
  metodo_pago:"efectivo", estado:"borrador", notas:"",
  reserva_id:"", tasa_iva:12,
};

export default function PageFacturacion({ showToast, empId }) {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState("lista");
  const [editItem,  setEditItem]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [filtro,    setFiltro]    = useState("todos");
  const [busqueda,  setBusqueda]  = useState("");
  const [exportar,  setExportar]  = useState(false);
  const [showSAT,   setShowSAT]   = useState(false);
  const [f, setF] = useState({ ...EF });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const d = await dbGet("facturas", "&order=fecha.desc,created_at.desc");
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const calcular = (sub, iva) => {
    const s = parseFloat(sub) || 0;
    const i = parseFloat(iva) || 0;
    const impuesto = Math.round(s * (i / 100) * 100) / 100;
    sf("impuestos", impuesto);
    sf("total", s + impuesto);
  };

  const abrirNuevo = () => {
    const numero = "FEL-" + Date.now().toString().slice(-6);
    setF({ ...EF, numero_factura: numero }); setEditItem(null); setVista("form");
  };

  const abrirEditar = r => {
    setF({ numero_factura:r.numero_factura||"", serie:r.serie||"", fecha:r.fecha||today(),
      cliente_nombre:r.cliente_nombre||"", cliente_nit:r.cliente_nit||"CF", cliente_id:r.cliente_id||"",
      descripcion:r.descripcion||"", subtotal:r.subtotal||0, impuestos:r.impuestos||0,
      total:r.total||0, metodo_pago:r.metodo_pago||"efectivo",
      estado:r.estado||"borrador", notas:r.notas||"", tasa_iva:r.tasa_iva||12 });
    setEditItem(r); setVista("form");
  };

  const guardar = async () => {
    if (!f.cliente_nombre.trim()) { showToast("Cliente requerido","err"); return; }
    if (!(parseFloat(f.total) > 0)) { showToast("Total debe ser mayor a 0","err"); return; }
    setSaving(true);
    const p = { ...f, empresa_id:empId,
      subtotal:parseFloat(f.subtotal)||0, impuestos:parseFloat(f.impuestos)||0,
      total:parseFloat(f.total)||0, tasa_iva:parseFloat(f.tasa_iva)||12 };
    if (editItem?.id) await dbUpd("facturas", editItem.id, p);
    else await dbIns("facturas", p);
    showToast("Factura guardada"); setSaving(false); setVista("lista"); load();
  };

  const del = async id => {
    if (!confirm("Eliminar esta factura?")) return;
    await dbDel("facturas", id); showToast("Eliminada"); load();
  };

  const cambiarEstado = async (id, est) => {
    await dbUpd("facturas", id, { estado: est }); showToast("Estado actualizado"); load();
  };

  const imprimirFactura = (r) => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Factura ${r.numero_factura}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;font-size:12px;color:#1E293B}
    .header{display:flex;justify-content:space-between;margin-bottom:30px}
    h1{color:#1B2D5C;font-size:22px;margin:0}
    .info{background:#F8FAFC;border-radius:8px;padding:16px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#1B2D5C;color:#fff;padding:8px 12px;text-align:left}
    td{padding:8px 12px;border-bottom:1px solid #E2E8F0}
    .total{text-align:right;font-size:18px;font-weight:bold;color:#1B2D5C}
    @media print{body{padding:20px}}</style>
    </head><body>
    <div class="header">
      <div><h1>Tz'unun AutoRentas</h1><div>Sistema de Facturacion FEL</div></div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:bold">FACTURA FEL</div>
        <div>No. ${r.numero_factura}</div>
        ${r.serie ? `<div>Serie: ${r.serie}</div>` : ""}
        <div>Fecha: ${fmtD(r.fecha)}</div>
      </div>
    </div>
    <div class="info">
      <strong>Cliente:</strong> ${r.cliente_nombre}<br/>
      <strong>NIT:</strong> ${r.cliente_nit || "CF"}<br/>
    </div>
    <table>
      <thead><tr><th>Descripcion</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>
        <tr><td>${r.descripcion || "Servicios de renta"}</td><td style="text-align:right">Q ${fmt(r.subtotal)}</td></tr>
        <tr><td>IVA (${r.tasa_iva || 12}%)</td><td style="text-align:right">Q ${fmt(r.impuestos)}</td></tr>
      </tbody>
    </table>
    <div class="total">TOTAL: Q ${fmt(r.total)}</div>
    <div style="margin-top:30px;font-size:10px;color:#94A3B8;text-align:center">
      Documento generado por Tz'unun AutoRentas — ${new Date().toLocaleDateString("es-GT")}
    </div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`;
    const w = window.open("","_blank"); w.document.write(html); w.document.close();
  };

  const filtrados = rows.filter(r => {
    if (filtro !== "todos" && r.estado !== filtro) return false;
    if (busqueda && !r.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !r.numero_factura?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const totales = {
    emitidas:    rows.filter(r => r.estado !== "anulada").reduce((s,r) => s+(parseFloat(r.total)||0), 0),
    cobradas:    rows.filter(r => r.estado === "pagada").reduce((s,r) => s+(parseFloat(r.total)||0), 0),
    pendientes:  rows.filter(r => ["emitida","certificada","parcial"].includes(r.estado)).length,
  };

  if (vista === "form") return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:T.acc }}>{editItem ? "Editar factura" : "Nueva factura FEL"}</div>
        <button onClick={() => { setVista("lista"); setEditItem(null); }} style={S.btn("ghost")}>Volver</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>DATOS DE FACTURA</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
              <Fld label="NUMERO FACTURA">
                <input style={{ ...S.inp, fontFamily:"monospace" }} value={f.numero_factura}
                  onChange={e => sf("numero_factura", e.target.value)} placeholder="FEL-000001" />
              </Fld>
              <Fld label="SERIE">
                <input style={S.inp} value={f.serie} onChange={e => sf("serie", e.target.value)} placeholder="A" />
              </Fld>
              <Fld label="FECHA">
                <input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} />
              </Fld>
              <Fld label="ESTADO">
                <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                  {Object.entries(ESTADOS).map(([k,v]) => <option key={k} value={k}>{v.l}</option>)}
                </select>
              </Fld>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>CLIENTE</div>
            <div style={{ display:"grid", gap:11 }}>
              <Fld label="CLIENTE *">
                <BuscadorCliente value={f.cliente_nombre} onChange={v => sf("cliente_nombre", v)} empId={empId} />
              </Fld>
              <Fld label="NIT CLIENTE">
                <input style={S.inp} value={f.cliente_nit} onChange={e => sf("cliente_nit", e.target.value)} placeholder="CF o NIT" />
              </Fld>
            </div>
          </div>
          <div style={S.card}>
            <Fld label="DESCRIPCION DEL SERVICIO">
              <textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }}
                value={f.descripcion} onChange={e => sf("descripcion", e.target.value)}
                placeholder="Descripcion del servicio facturado..." />
            </Fld>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>MONTOS (Q)</div>
            <div style={{ display:"grid", gap:11 }}>
              <Fld label="IVA">
                <select style={S.sel} value={f.tasa_iva} onChange={e => { sf("tasa_iva", e.target.value); calcular(f.subtotal, e.target.value); }}>
                  <option value={12}>12% Regimen General</option>
                  <option value={5}>5% Pequeno Contribuyente</option>
                  <option value={0}>Sin IVA</option>
                </select>
              </Fld>
              <Fld label="SUBTOTAL">
                <input style={S.inp} type="number" step="0.01" value={f.subtotal}
                  onChange={e => { sf("subtotal", e.target.value); calcular(e.target.value, f.tasa_iva); }} placeholder="0.00" />
              </Fld>
              <Fld label={`IVA (${f.tasa_iva}%)`}>
                <input style={{ ...S.inp, background:T.card }} value={fmt(f.impuestos)} readOnly />
              </Fld>
              <div style={{ background:T.accDim, border:`1px solid ${T.acc}44`, borderRadius:10, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:T.sub }}>TOTAL FACTURA</span>
                <span style={{ fontSize:20, fontWeight:800, color:T.acc }}>Q {fmt(f.total)}</span>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <Fld label="METODO DE PAGO">
              <div style={{ display:"flex", gap:8 }}>
                {["efectivo","transferencia","tarjeta","cheque"].map(p => (
                  <button key={p} onClick={() => sf("metodo_pago", p)}
                    style={{ ...S.btn(f.metodo_pago===p?"primary":"ghost"), flex:1, fontSize:11 }}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </Fld>
          </div>
          <div style={S.card}>
            <Fld label="NOTAS">
              <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
                value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
            </Fld>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setVista("lista"); setEditItem(null); }} style={{ ...S.btn("ghost"), flex:1 }}>Cancelar</button>
            <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex:2 }}>
              {saving ? "Guardando..." : editItem ? "Actualizar factura" : "Crear factura"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Facturas FEL" datos={filtrados} campos={[
        {label:"No. Factura",key:"numero_factura"},{label:"Serie",key:"serie"},{label:"Fecha",key:"fecha"},
        {label:"Cliente",key:"cliente_nombre"},{label:"NIT",key:"cliente_nit"},
        {label:"Subtotal",key:"subtotal"},{label:"IVA",key:"impuestos"},{label:"Total",key:"total"},
        {label:"Metodo",key:"metodo_pago"},{label:"Estado",key:"estado"}
      ]} onClose={() => setExportar(false)} />}

      {showSAT && <ImportadorSAT tipo="ventas" empId={empId} showToast={showToast}
        onClose={() => setShowSAT(false)} onImportado={load} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
        {[
          { l:"Total facturado", v:`Q ${fmt(totales.emitidas)}`,  c:T.acc   },
          { l:"Total cobrado",   v:`Q ${fmt(totales.cobradas)}`,  c:T.green },
          { l:"Pendientes",      v:totales.pendientes,            c:T.sec   },
        ].map((s,i) => (
          <div key={i} style={{ background:T.surf, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:11, color:T.mut }}>{s.l}</div>
            <div style={{ fontSize:i===2?24:16, fontWeight:800, color:s.c, marginTop:4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {["todos",...Object.keys(ESTADOS)].map(est => (
          <button key={est} onClick={() => setFiltro(est)}
            style={{ ...S.btn(filtro===est?"primary":"ghost"), fontSize:11, padding:"5px 10px" }}>
            {est==="todos"?"Todos":ESTADOS[est]?.l||est}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={() => setShowSAT(true)} style={{ ...S.btn("blue"), fontSize:11 }}>Importar SAT</button>
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize:11 }}>Exportar</button>
        <button onClick={abrirNuevo} style={{ ...S.btn("primary"), fontSize:12 }}>+ Nueva factura</button>
      </div>

      <div style={{ marginBottom:14 }}>
        <input style={S.inp} placeholder="Buscar por cliente o numero de factura..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtrados.length === 0 ? (
        <Empty icon="F" msg="Sin facturas registradas" action="+ Nueva factura" onAction={abrirNuevo} />
      ) : (
        <div style={S.card}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              {["No. Factura","Fecha","Cliente","NIT","Total","Metodo","Estado",""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtrados.map(r => {
                const est = ESTADOS[r.estado] || ESTADOS.borrador;
                return (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background=T.surf}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={{ ...S.td, fontFamily:"monospace", fontSize:11, color:T.acc }}>
                      {r.numero_factura}
                      {r.serie && <div style={{ fontSize:9, color:T.mut }}>Serie: {r.serie}</div>}
                    </td>
                    <td style={{ ...S.td, fontSize:11, color:T.sub, whiteSpace:"nowrap" }}>{fmtD(r.fecha)}</td>
                    <td style={{ ...S.td, fontWeight:600 }}>{r.cliente_nombre}</td>
                    <td style={{ ...S.td, fontSize:11, fontFamily:"monospace", color:T.mut }}>{r.cliente_nit||"CF"}</td>
                    <td style={{ ...S.td, fontWeight:700, color:T.acc }}>Q {fmt(r.total)}</td>
                    <td style={{ ...S.td, fontSize:11, color:T.sub }}>{r.metodo_pago||"—"}</td>
                    <td style={S.td}>
                      <span style={{ padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:600, color:est.c, background:est.bg }}>{est.l}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => imprimirFactura(r)} style={{ ...S.btn("ghost"), padding:"3px 7px", fontSize:10 }}>Imprimir</button>
                        {r.estado === "borrador" && <button onClick={() => cambiarEstado(r.id,"emitida")} style={{ ...S.btn("primary"), padding:"3px 7px", fontSize:10 }}>Emitir</button>}
                        {r.estado === "emitida"  && <button onClick={() => cambiarEstado(r.id,"pagada")}  style={{ ...S.btn("green"),   padding:"3px 7px", fontSize:10 }}>Cobrada</button>}
                        <button onClick={() => abrirEditar(r)} style={{ ...S.btn("ghost"), padding:"3px 7px", fontSize:10 }}>Editar</button>
                        {r.estado === "borrador" && <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), padding:"3px 7px", fontSize:10 }}>Eliminar</button>}
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
