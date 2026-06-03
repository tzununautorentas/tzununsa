import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

export default function PageBanca({ showToast, empId }) {
  const [cuentas,    setCuentas]    = useState([]);
  const [cuentaAct,  setCuentaAct]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [showCuenta, setShowCuenta] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [filtroT,    setFiltroT]    = useState("todos");
  const [filtroC,    setFiltroC]    = useState("todos");
  const [exportar,   setExportar]   = useState(false);
  const [busqueda,   setBusqueda]   = useState("");

  const EFM = { fecha: today(), tipo: "ingreso", descripcion: "", monto: "", referencia: "", categoria: "ventas", conciliado: false, notas: "" };
  const EFC = { banco: "", numero_cuenta: "", tipo_cuenta: "monetaria", moneda: "GTQ", saldo_inicial: "", saldo_actual: "", notas: "" };
  const [f,  setF]  = useState({ ...EFM });
  const [fc, setFc] = useState({ ...EFC });
  const sf  = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sfc = (k, v) => setFc(p => ({ ...p, [k]: v }));

  const CATS = ["ventas", "combustible", "mantenimiento", "salarios", "seguros", "servicios", "oficina", "otros"];
  const CC = { ventas: T.acc, combustible: T.sec, mantenimiento: T.blue, salarios: T.green, seguros: T.purple, servicios: T.acc, oficina: T.mut, otros: T.sub };

  const loadCuentas = async () => {
    setLoading(true);
    const c = await dbGet("cuentas_bancarias");
    const arr = Array.isArray(c) ? c : [];
    setCuentas(arr);
    if (arr.length > 0 && !cuentaAct) setCuentaAct(arr[0]);
    setLoading(false);
  };

  const queryMovs = cuentaAct ? 'cuenta_id=eq.'+cuentaAct.id : '';
  const { data: movs, loading: loadingMovs, total: totalMovs, page: pageMovs, totalPages: totalPagesMovs, pageSize: pageSizeMovs, setPage: setPageMovs, setPageSize: setPageSizeMovs, reload: reloadMovs, desde: desdeMovs, hasta: hastaMovs } = usePaginacion({
    table: 'movimientos_bancarios',
    query: queryMovs,
    search: busqueda,
    columns: ['concepto', 'referencia', 'descripcion'],
    order: 'fecha.desc',
  });

  useEffect(() => { loadCuentas(); }, []);

  const guardarCuenta = async () => {
    if (!fc.banco.trim()) { showToast("Nombre del banco requerido", "err"); return; }
    setSaving(true);
    const saldoInicial = parseFloat(fc.saldo_inicial) || 0;
    const payload = { ...fc, empresa_id: empId, saldo_inicial: saldoInicial, saldo_actual: saldoInicial };
    const r = await dbIns("cuentas_bancarias", payload);
    if (r?.error) { showToast("Error: " + r.error, "err"); setSaving(false); return; }
    showToast("Cuenta registrada"); setSaving(false); setShowCuenta(false); setFc({ ...EFC }); loadCuentas();
  };

  const guardarMov = async () => {
    if (!f.descripcion.trim() || !(parseFloat(f.monto) > 0)) {
      showToast("Descripcion y monto requeridos", "err"); return;
    }
    setSaving(true);
    const mov = await dbIns("movimientos_bancarios", {
      empresa_id: empId, cuenta_id: cuentaAct.id,
      fecha: f.fecha, tipo: f.tipo, descripcion: f.descripcion,
      monto: parseFloat(f.monto), referencia: f.referencia,
      categoria: f.categoria, conciliado: f.conciliado, notas: f.notas,
    });
    if (mov?.error) { showToast("Error: " + mov.error, "err"); setSaving(false); return; }
    const delta = f.tipo === "ingreso" ? parseFloat(f.monto) : -parseFloat(f.monto);
    const nuevoSaldo = (parseFloat(cuentaAct.saldo_actual) || 0) + delta;
    await dbUpd("cuentas_bancarias", cuentaAct.id, { saldo_actual: nuevoSaldo });
    setCuentaAct(p => ({ ...p, saldo_actual: nuevoSaldo }));
    setCuentas(p => p.map(c => c.id === cuentaAct.id ? { ...c, saldo_actual: nuevoSaldo } : c));
    showToast("Guardado"); setSaving(false); setShowForm(false);
    setF({ ...EFM }); reloadMovs();
  };

  const conciliar = async (id, val) => {
    await dbUpd("movimientos_bancarios", id, { conciliado: val });
    reloadMovs();
  };

  const delMov = async id => {
    if (!confirm("Eliminar movimiento?")) return;
    const mov = movs.find(m => m.id === id);
    if (mov) {
      const delta = mov.tipo === "ingreso" ? -parseFloat(mov.monto) : parseFloat(mov.monto);
      const nuevoSaldo = (parseFloat(cuentaAct.saldo_actual) || 0) + delta;
      await dbUpd("cuentas_bancarias", cuentaAct.id, { saldo_actual: nuevoSaldo });
      setCuentaAct(p => ({ ...p, saldo_actual: nuevoSaldo }));
    }
    await dbDel("movimientos_bancarios", id);
    showToast("Eliminado"); reloadMovs();
  };

  const movsFil = movs.filter(m => {
    if (filtroT !== "todos" && m.tipo !== filtroT) return false;
    if (filtroC === "conciliado" && !m.conciliado) return false;
    if (filtroC === "pendiente"  &&  m.conciliado) return false;
    return true;
  });

  const saldoTotal  = cuentas.reduce((s, c) => s + (parseFloat(c.saldo_actual) || 0), 0);
  const ingTotal    = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const egTotal     = movs.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const sinConciliar = movs.filter(m => !m.conciliado).length;

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Movimientos Bancarios" datos={movs}
          campos={[
            { label: "Fecha", key: "fecha" }, { label: "Descripcion", key: "descripcion" },
            { label: "Categoria", key: "categoria" }, { label: "Tipo", key: "tipo" },
            { label: "Monto", key: "monto" }, { label: "Referencia", key: "referencia" },
            { label: "Conciliado", key: "conciliado" },
          ]} onClose={() => setExportar(false)} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Saldo total GTQ",  v: `Q ${fmt(saldoTotal)}`,  c: T.acc,  bg: T.accDim  },
          { l: "Ingresos periodo", v: `Q ${fmt(ingTotal)}`,    c: T.green, bg: T.greenDim },
          { l: "Egresos periodo",  v: `Q ${fmt(egTotal)}`,     c: T.red,  bg: T.redDim  },
          { l: "Sin conciliar",    v: sinConciliar,             c: T.sec,  bg: T.secDim  },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.c}44`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: T.mut }}>{s.l}</div>
            <div style={{ fontSize: i === 0 ? 18 : 20, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}>
        {/* Panel cuentas */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut }}>MIS CUENTAS</div>
            <button onClick={() => setShowCuenta(!showCuenta)} style={{ ...S.btn("ghost"), fontSize: 10, padding: "3px 8px" }}>
              {showCuenta ? "Cancelar" : "+ Cuenta"}
            </button>
          </div>

          {showCuenta && (
            <div style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Nueva cuenta bancaria</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Fld label="BANCO"><input style={S.inp} value={fc.banco} onChange={e => sfc("banco", e.target.value)} placeholder="Nombre del banco" /></Fld>
                <Fld label="NO. CUENTA"><input style={S.inp} value={fc.numero_cuenta} onChange={e => sfc("numero_cuenta", e.target.value)} placeholder="000-000000-00" /></Fld>
                <Fld label="TIPO">
                  <select style={S.sel} value={fc.tipo_cuenta} onChange={e => sfc("tipo_cuenta", e.target.value)}>
                    <option value="monetaria">Monetaria</option>
                    <option value="ahorro">Ahorro</option>
                    <option value="credito">Credito</option>
                  </select>
                </Fld>
                <Fld label="MONEDA">
                  <select style={S.sel} value={fc.moneda} onChange={e => sfc("moneda", e.target.value)}>
                    <option value="GTQ">GTQ - Quetzal</option>
                    <option value="USD">USD - Dolar</option>
                  </select>
                </Fld>
                <Fld label="SALDO INICIAL"><input style={S.inp} type="number" step="0.01" value={fc.saldo_inicial} onChange={e => sfc("saldo_inicial", e.target.value)} placeholder="0.00" /></Fld>
                <button onClick={guardarCuenta} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>
                  {saving ? "Guardando..." : "Registrar cuenta"}
                </button>
              </div>
            </div>
          )}

          {loading ? <Spinner /> : cuentas.length === 0 ? (
            <Empty icon="B" msg="Sin cuentas registradas" />
          ) : cuentas.map(c => (
            <div key={c.id} onClick={() => setCuentaAct(c)}
              style={{ ...S.card, cursor: "pointer", marginBottom: 10,
                border: `1px solid ${cuentaAct?.id === c.id ? T.acc : T.bord}`,
                background: cuentaAct?.id === c.id ? T.accDim : T.card }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{c.banco}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{c.numero_cuenta} · {c.moneda}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.acc, marginTop: 8 }}>
                Q {fmt(c.saldo_actual)}
              </div>
            </div>
          ))}
        </div>

        {/* Panel movimientos */}
        <div>
          {cuentaAct ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{cuentaAct.banco}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{cuentaAct.numero_cuenta} · Saldo: Q {fmt(cuentaAct.saldo_actual)}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
                  <button onClick={() => setShowForm(!showForm)}
                    style={{ ...S.btn(showForm ? "warn" : "primary"), fontSize: 12 }}>
                    {showForm ? "Cancelar" : "+ Movimiento"}
                  </button>
                </div>
              </div>

              {showForm && (
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                    <Fld label="FECHA">
                      <input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} />
                    </Fld>
                    <Fld label="TIPO">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => sf("tipo", "ingreso")} style={{ ...S.btn(f.tipo === "ingreso" ? "primary" : "ghost"), flex: 1, fontSize: 12 }}>
                          Ingreso
                        </button>
                        <button onClick={() => sf("tipo", "egreso")} style={{ ...S.btn(f.tipo === "egreso" ? "danger" : "ghost"), flex: 1, fontSize: 12 }}>
                          Egreso
                        </button>
                      </div>
                    </Fld>
                    <Fld label="DESCRIPCION" span2>
                      <input style={S.inp} value={f.descripcion} onChange={e => sf("descripcion", e.target.value)} placeholder="Descripcion del movimiento..." />
                    </Fld>
                    <Fld label="MONTO (GTQ)">
                      <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e => sf("monto", e.target.value)} placeholder="0.00" />
                    </Fld>
                    <Fld label="CATEGORIA">
                      <select style={S.sel} value={f.categoria} onChange={e => sf("categoria", e.target.value)}>
                        {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </Fld>
                    <Fld label="REFERENCIA">
                      <input style={S.inp} value={f.referencia} onChange={e => sf("referencia", e.target.value)} placeholder="No. factura, doc..." />
                    </Fld>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 18 }}>
                      <input type="checkbox" checked={f.conciliado} onChange={e => sf("conciliado", e.target.checked)} style={{ width: 16, height: 16 }} />
                      <label style={{ ...S.lbl, marginBottom: 0 }}>CONCILIADO</label>
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
                      <button onClick={guardarMov} disabled={saving} style={{ ...S.btn("primary"), flex: 2 }}>
                        {saving ? "Guardando..." : "Guardar movimiento"}
                      </button>
                      <button onClick={() => setShowForm(false)} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {["todos", "ingreso", "egreso"].map(t => (
                  <button key={t} onClick={() => setFiltroT(t)}
                    style={{ ...S.btn(filtroT === t ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
                    {t === "todos" ? "Todos" : t === "ingreso" ? "Ingresos" : "Egresos"}
                  </button>
                ))}
                {["todos", "conciliado", "pendiente"].map(t => (
                  <button key={t} onClick={() => setFiltroC(t)}
                    style={{ ...S.btn(filtroC === t ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
                    {t === "todos" ? "Todos" : t === "conciliado" ? "Conciliados" : "Pendientes"}
                  </button>
                ))}
                <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar en movimientos..." />
              </div>

              {movsFil.length === 0 ? (
                <Empty icon="B" msg="Sin movimientos" action="+ Registrar" onAction={() => setShowForm(true)} />
              ) : (
                <div style={S.card}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Fecha", "Descripcion", "Categoria", "Monto", "Conciliado", ""].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movsFil.map(m => (
                        <tr key={m.id}
                          onMouseEnter={e => e.currentTarget.style.background = T.surf}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ ...S.td, color: T.sub, fontSize: 11, whiteSpace: "nowrap" }}>{fmtD(m.fecha)}</td>
                          <td style={{ ...S.td, maxWidth: 180 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 175, fontWeight: 500, color: T.txt }}>
                              {m.descripcion}
                            </div>
                            {m.referencia && <div style={{ fontSize: 9, color: T.mut }}>{m.referencia}</div>}
                          </td>
                          <td style={S.td}>
                            <span style={{ padding: "2px 6px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                              background: (CC[m.categoria] || T.mut) + "22", color: CC[m.categoria] || T.mut }}>
                              {m.categoria}
                            </span>
                          </td>
                          <td style={{ ...S.td, fontWeight: 700, color: m.tipo === "ingreso" ? T.green : T.red, whiteSpace: "nowrap" }}>
                            {m.tipo === "ingreso" ? "+ " : "- "}Q {fmt(m.monto)}
                          </td>
                          <td style={{ ...S.td, textAlign: "center" }}>
                            <button onClick={() => conciliar(m.id, !m.conciliado)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: 0,
                                color: m.conciliado ? T.green : T.mut, fontWeight: 700 }}>
                              {m.conciliado ? "OK" : "---"}
                            </button>
                          </td>
                          <td style={S.td}>
                            <button onClick={() => delMov(m.id)}
                              style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 11 }}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: T.surf }}>
                        <td colSpan={3} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: T.mut }}>
                          {movsFil.length} movimientos filtrados
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 800, color: T.acc, fontSize: 13 }}>
                          Q {fmt(movsFil.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0) -
                              movsFil.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {movsFil.length > 0 && (
                <Paginador page={pageMovs} totalPages={totalPagesMovs} total={totalMovs}
                  desde={desdeMovs} hasta={hastaMovs} pageSize={pageSizeMovs}
                  onPage={setPageMovs} onPageSize={setPageSizeMovs} />
              )}
            </>
          ) : (
            <div style={{ ...S.card, textAlign: "center", padding: 40, color: T.sub }}>
              Selecciona una cuenta bancaria para ver sus movimientos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
