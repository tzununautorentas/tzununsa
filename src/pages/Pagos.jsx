import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, CatBadge } from '../components/shared.jsx';

const METODOS = ["efectivo", "transferencia", "deposito", "tarjeta", "cheque"];
const METODO_COLOR = {
  efectivo: T.acc, transferencia: T.blue, deposito: T.green,
  tarjeta: T.purple, cheque: T.sec,
};

const EMPTY_F = {
  fecha: today(), cliente_nombre: "", monto: "", metodo: "efectivo",
  referencia: "", concepto: "", reserva_id: "", factura_id: "", notas: "",
};

export default function PagePagos({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exportar, setExportar] = useState(false);
  const [filtroMet, setFiltroMet] = useState("todos");
  const [f, setF] = useState({ ...EMPTY_F });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const [p, r, fa] = await Promise.all([
      dbGet("pagos_recibidos"),
      dbGet("reservas", "&estado=in.(confirmada,en_curso,completada)&select=id,numero,cliente_nombre,monto"),
      dbGet("facturas", "&estado=not.in.(anulada,borrador)&select=id,numero,nombre_receptor,total,saldo_pendiente"),
    ]);
    setRows(Array.isArray(p) ? p : []);
    setReservas(Array.isArray(r) ? r : []);
    setFacturas(Array.isArray(fa) ? fa : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-llenar cliente desde reserva o factura seleccionada
  const onSelectReserva = (id) => {
    sf("reserva_id", id);
    const r = reservas.find(x => x.id === id);
    if (r) { sf("cliente_nombre", r.cliente_nombre); sf("concepto", "Pago reserva " + r.numero); sf("monto", r.monto || ""); }
  };
  const onSelectFactura = (id) => {
    sf("factura_id", id);
    const fa = facturas.find(x => x.id === id);
    if (fa) { sf("cliente_nombre", fa.nombre_receptor); sf("concepto", "Pago factura " + fa.numero); sf("monto", fa.saldo_pendiente || fa.total || ""); }
  };

  const guardar = async () => {
    if (!f.cliente_nombre.trim() || !(parseFloat(f.monto) > 0)) {
      showToast("Cliente y monto son requeridos", "err"); return;
    }
    setSaving(true);
    const payload = {
      empresa_id: empId, fecha: f.fecha, cliente_nombre: f.cliente_nombre,
      monto: parseFloat(f.monto), metodo: f.metodo, referencia: f.referencia || "",
      concepto: f.concepto || "", reserva_id: f.reserva_id || null,
      factura_id: f.factura_id || null, notas: f.notas || "",
    };
    let result;
    if (editId) result = await dbUpd("pagos_recibidos", editId, payload);
    else result = await dbIns("pagos_recibidos", payload);

    if (result?.error) { showToast("Error: " + result.error, "err"); setSaving(false); return; }

    // Actualizar saldo de factura vinculada
    if (f.factura_id && !editId) {
      const fac = facturas.find(x => x.id === f.factura_id);
      if (fac) {
        const nuevoSaldo = Math.max(0, (parseFloat(fac.saldo_pendiente) || parseFloat(fac.total) || 0) - parseFloat(f.monto));
        await dbUpd("facturas", f.factura_id, {
          saldo_pendiente: nuevoSaldo,
          estado: nuevoSaldo <= 0 ? "pagada" : "parcial",
        });
      }
    }
    showToast(editId ? "Pago actualizado" : "Pago registrado");
    setSaving(false); setShowForm(false); setEditId(null); setF({ ...EMPTY_F }); load();
  };

  const abrirEditar = (r) => {
    setEditId(r.id);
    setF({ fecha: r.fecha || today(), cliente_nombre: r.cliente_nombre || "", monto: r.monto || "", metodo: r.metodo || "efectivo", referencia: r.referencia || "", concepto: r.concepto || "", reserva_id: r.reserva_id || "", factura_id: r.factura_id || "", notas: r.notas || "" });
    setShowForm(true);
  };

  const del = async id => {
    if (!confirm("Eliminar este pago?")) return;
    await dbDel("pagos_recibidos", id); showToast("Eliminado"); load();
  };

  const filtered = filtroMet === "todos" ? rows : rows.filter(r => r.metodo === filtroMet);
  const totalGral = rows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const totalMes = rows.filter(r => (r.fecha || "").slice(0, 7) === today().slice(0, 7)).reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const porMetodo = METODOS.map(m => ({ m, total: rows.filter(r => r.metodo === m).reduce((s, r) => s + (parseFloat(r.monto) || 0), 0) })).filter(x => x.total > 0);

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Pagos Recibidos" datos={rows}
          campos={[{ label: "Fecha", key: "fecha" }, { label: "Cliente", key: "cliente_nombre" }, { label: "Concepto", key: "concepto" }, { label: "Monto", key: "monto" }, { label: "Metodo", key: "metodo" }, { label: "Referencia", key: "referencia" }]}
          onClose={() => setExportar(false)} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total recibido", v: `Q ${fmt(totalGral)}`, c: T.acc, bg: T.accDim },
          { l: "Este mes", v: `Q ${fmt(totalMes)}`, c: T.blue, bg: T.blueDim },
          { l: "Registros", v: rows.length, c: T.purple, bg: T.purpleDim },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.c}44`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: T.mut }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16 }}>
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {["todos", ...METODOS].map(m => (
              <button key={m} onClick={() => setFiltroMet(m)} style={{ ...S.btn(filtroMet === m ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
                {m === "todos" ? "Todos" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
            <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11 }}>Actualizar</button>
            <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
            <button onClick={() => { setEditId(null); setF({ ...EMPTY_F }); setShowForm(!showForm); }}
              style={{ ...S.btn(showForm && !editId ? "warn" : "primary"), fontSize: 12, marginLeft: "auto" }}>
              {showForm && !editId ? "Cancelar" : "+ Registrar pago"}
            </button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>
                {editId ? "Editar pago" : "Registrar pago recibido"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>

                {/* Vincular a Reserva o Factura */}
                <Fld label="VINCULAR A RESERVA (opcional)">
                  <select style={S.sel} value={f.reserva_id} onChange={e => onSelectReserva(e.target.value)}>
                    <option value="">Sin vinculacion</option>
                    {reservas.map(r => <option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre} — Q {fmt(r.monto)}</option>)}
                  </select>
                </Fld>
                <Fld label="VINCULAR A FACTURA (opcional)">
                  <select style={S.sel} value={f.factura_id} onChange={e => onSelectFactura(e.target.value)}>
                    <option value="">Sin vinculacion</option>
                    {facturas.map(fa => <option key={fa.id} value={fa.id}>{fa.numero} — {fa.nombre_receptor} — Saldo: Q {fmt(fa.saldo_pendiente || fa.total)}</option>)}
                  </select>
                </Fld>

                <Fld label="CLIENTE / RECEPTOR" span2>
                  <input style={S.inp} value={f.cliente_nombre} onChange={e => sf("cliente_nombre", e.target.value)} placeholder="Nombre del cliente que pago" />
                </Fld>
                <Fld label="CONCEPTO / DESCRIPCION" span2>
                  <input style={S.inp} value={f.concepto} onChange={e => sf("concepto", e.target.value)} placeholder="Ej: Anticipo reserva RES-001, saldo factura FAC-002..." />
                </Fld>

                <Fld label="FECHA DE PAGO">
                  <input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} />
                </Fld>
                <Fld label="MONTO RECIBIDO (GTQ)">
                  <input style={{ ...S.inp, fontWeight: 700, color: T.acc }} type="number" step="0.01" value={f.monto} onChange={e => sf("monto", e.target.value)} placeholder="0.00" />
                </Fld>

                <Fld label="METODO DE PAGO">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {METODOS.map(m => (
                      <button key={m} onClick={() => sf("metodo", m)}
                        style={{ ...S.btn(f.metodo === m ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px", flex: "none" }}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </Fld>
                <Fld label="N. REFERENCIA / BOLETA">
                  <input style={S.inp} value={f.referencia} onChange={e => sf("referencia", e.target.value)} placeholder="No. transferencia, boleta..." />
                </Fld>

                <Fld label="NOTAS" span2>
                  <input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones adicionales..." />
                </Fld>

                <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
                  <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex: 1 }}>
                    {saving ? "Guardando..." : editId ? "Actualizar pago" : "Registrar pago"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Lista */}
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <Empty icon="P" msg="Sin pagos registrados" action="+ Registrar primer pago" onAction={() => { setEditId(null); setF({ ...EMPTY_F }); setShowForm(true); }} />
          ) : (
            <div style={S.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Fecha", "Cliente", "Concepto", "Metodo", "Monto", "Referencia", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ ...S.td, whiteSpace: "nowrap", color: T.sub, fontSize: 11 }}>{fmtD(r.fecha)}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>
                        {r.cliente_nombre}
                        {r.reserva_id && <div style={{ fontSize: 9, color: T.blue, marginTop: 1 }}>Reserva vinculada</div>}
                        {r.factura_id && <div style={{ fontSize: 9, color: T.acc, marginTop: 1 }}>Factura vinculada</div>}
                      </td>
                      <td style={{ ...S.td, maxWidth: 180 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 175, fontSize: 12, color: T.sub }}>{r.concepto || "—"}</div>
                        {r.notas && <div style={{ fontSize: 9, color: T.mut }}>{r.notas}</div>}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: (METODO_COLOR[r.metodo] || T.mut) + "22", color: METODO_COLOR[r.metodo] || T.mut }}>
                          {r.metodo || "—"}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontWeight: 700, color: T.acc, whiteSpace: "nowrap" }}>
                        Q {fmt(r.monto)}
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: T.mut, fontFamily: "monospace" }}>{r.referencia || "—"}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => abrirEditar(r)} style={{ ...S.btn("ghost"), padding: "3px 8px", fontSize: 10 }}>Editar</button>
                          <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), padding: "3px 8px", fontSize: 10 }}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.surf }}>
                    <td colSpan={4} style={{ padding: "9px 10px", fontSize: 12, fontWeight: 700, color: T.sub }}>TOTAL</td>
                    <td style={{ padding: "9px 10px", fontWeight: 800, color: T.acc, fontSize: 14 }}>Q {fmt(filtered.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar: resumen por metodo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12 }}>POR METODO</div>
            {porMetodo.length === 0 ? (
              <div style={{ fontSize: 12, color: T.sub }}>Sin datos aun</div>
            ) : porMetodo.map(({ m, total }) => {
              const c = METODO_COLOR[m] || T.mut;
              const pct = totalGral > 0 ? Math.round((total / totalGral) * 100) : 0;
              return (
                <div key={m} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: T.sub }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c }}>Q {fmt(total)}</span>
                  </div>
                  <div style={{ background: T.surf, borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: c, width: `${pct}%`, transition: "width .3s" }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.mut, marginTop: 2, textAlign: "right" }}>{pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Resumen del mes */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 10 }}>ESTE MES</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.acc }}>Q {fmt(totalMes)}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
              {rows.filter(r => (r.fecha || "").slice(0, 7) === today().slice(0, 7)).length} pagos registrados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
