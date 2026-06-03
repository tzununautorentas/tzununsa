import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

const TIPOS_MANT = ["Preventivo","Correctivo","Cambio de aceite","Frenos","Llantas","Electricidad","Carroceria","Revision general","Otro"];
const ESTADOS_MANT = {
  programado: { c: T.blue,  bg: T.blueDim,  l: "Programado"  },
  en_proceso: { c: T.sec,   bg: T.secDim,   l: "En proceso"  },
  completado: { c: T.green, bg: T.greenDim, l: "Completado"   },
  cancelado:  { c: T.red,   bg: T.redDim,   l: "Cancelado"   },
};
const EF = {
  vehiculo_id:"", vehiculo_nombre:"", vehiculo_placa:"",
  tipo_mantenimiento:"Preventivo", descripcion:"",
  fecha: today(), fecha_fin:"", taller:"", mecanico:"",
  km_actual:0, km_proximo_mantenimiento:0,
  costo_repuestos:0, costo_mano_obra:0, costo_total:0,
  estado:"programado", notas:"",
};

export default function PageMantenimiento({ showToast, empId }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [vista,     setVista]     = useState("lista");
  const [editItem,  setEditItem]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [filtroEst, setFiltroEst] = useState("todos");
  const [filtroVeh, setFiltroVeh] = useState("todos");
  const [exportar,  setExportar]  = useState(false);
  const [busqueda,  setBusqueda]  = useState('');
  const [f, setF] = useState({ ...EF });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      const v = await dbGet("vehiculos", "&order=marca.asc");
      setVehiculos(Array.isArray(v) ? v : []);
    })();
  }, []);

  const calcTotal = (rep, mo) => {
    const t = (parseFloat(rep) || 0) + (parseFloat(mo) || 0);
    sf("costo_total", t);
  };

  const qEst = filtroEst && filtroEst !== 'todos' ? 'estado=eq.'+filtroEst : '';
  const qVeh = filtroVeh && filtroVeh !== 'todos' ? 'vehiculo_id=eq.'+filtroVeh : '';
  const query = [qEst, qVeh].filter(Boolean).join('&');

  const pag = usePaginacion({
    table: 'mantenimientos',
    query,
    search: busqueda,
    columns: ['vehiculo_nombre', 'placa', 'tipo', 'descripcion'],
    order: 'fecha.desc',
  });

  const abrirEditar = r => {
    setF({ ...EF, ...r, costo_repuestos: r.costo_repuestos||0, costo_mano_obra: r.costo_mano_obra||0, costo_total: r.costo_total||0 });
    setEditItem(r); setVista("form");
  };

  const guardar = async () => {
    if (!f.vehiculo_id && !f.vehiculo_nombre) { showToast("Selecciona un vehiculo","err"); return; }
    setSaving(true);
    const p = { ...f, empresa_id: empId,
      km_actual: parseInt(f.km_actual)||0,
      km_proximo_mantenimiento: parseInt(f.km_proximo_mantenimiento)||0,
      costo_repuestos: parseFloat(f.costo_repuestos)||0,
      costo_mano_obra: parseFloat(f.costo_mano_obra)||0,
      costo_total: parseFloat(f.costo_total)||0,
    };
    if (editItem?.id) await dbUpd("mantenimientos", editItem.id, p);
    else await dbIns("mantenimientos", p);
    showToast("Guardado"); setSaving(false); setVista("lista"); pag.reload();
  };

  const del = async id => {
    if (!confirm("Eliminar este mantenimiento?")) return;
    await dbDel("mantenimientos", id); showToast("Eliminado"); pag.reload();
  };

  const totCosto = pag.data.reduce((s,r) => s+(parseFloat(r.costo_total)||0), 0);

  if (vista === "form") return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:T.acc }}>
          {editItem ? "Editar mantenimiento" : "Nuevo mantenimiento"}
        </div>
        <button onClick={() => { setVista("lista"); setEditItem(null); }} style={S.btn("ghost")}>Volver</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>VEHICULO</div>
            <div style={{ display:"grid", gap:11 }}>
              <Fld label="VEHICULO *">
                <select style={S.sel} value={f.vehiculo_id}
                  onChange={e => {
                    const v = vehiculos.find(x => x.id === e.target.value);
                    setF(p => ({ ...p,
                      vehiculo_id: e.target.value,
                      vehiculo_nombre: v ? `${v.marca} ${v.modelo}` : "",
                      vehiculo_placa: v?.placa || "",
                      km_actual: v?.km_actual || 0,
                    }));
                  }}>
                  <option value="">Seleccionar vehiculo...</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa}</option>)}
                </select>
              </Fld>
              {f.vehiculo_placa && (
                <div style={{ fontSize:12, color:T.acc, fontFamily:"monospace" }}>
                  Placa: {f.vehiculo_placa}
                </div>
              )}
              <Fld label="TIPO DE MANTENIMIENTO">
                <select style={S.sel} value={f.tipo_mantenimiento} onChange={e => sf("tipo_mantenimiento", e.target.value)}>
                  {TIPOS_MANT.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Fld>
              <Fld label="DESCRIPCION">
                <textarea style={{ ...S.inp, minHeight:70, resize:"vertical" }}
                  value={f.descripcion} onChange={e => sf("descripcion", e.target.value)}
                  placeholder="Trabajos a realizar o realizados..." />
              </Fld>
              <Fld label="ESTADO">
                <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                  {Object.entries(ESTADOS_MANT).map(([k,v]) => <option key={k} value={k}>{v.l}</option>)}
                </select>
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>FECHAS</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
              <Fld label="FECHA INICIO">
                <input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} />
              </Fld>
              <Fld label="FECHA FIN">
                <input style={S.inp} type="date" value={f.fecha_fin} onChange={e => sf("fecha_fin", e.target.value)} />
              </Fld>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>TALLER Y MECANICO</div>
            <div style={{ display:"grid", gap:11 }}>
              <Fld label="TALLER / PROVEEDOR">
                <input style={S.inp} value={f.taller} onChange={e => sf("taller", e.target.value)} placeholder="Nombre del taller" />
              </Fld>
              <Fld label="MECANICO / TECNICO">
                <input style={S.inp} value={f.mecanico} onChange={e => sf("mecanico", e.target.value)} placeholder="Nombre del mecanico" />
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>KILOMETRAJE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
              <Fld label="KM ACTUAL">
                <input style={S.inp} type="number" value={f.km_actual}
                  onChange={e => sf("km_actual", e.target.value)} placeholder="0" />
              </Fld>
              <Fld label="KM PROXIMO MANTENIMIENTO">
                <input style={{ ...S.inp, borderColor: T.acc + "66" }} type="number"
                  value={f.km_proximo_mantenimiento}
                  onChange={e => sf("km_proximo_mantenimiento", e.target.value)}
                  placeholder="0" />
              </Fld>
            </div>
            {f.km_proximo_mantenimiento > 0 && f.km_actual > 0 && (
              <div style={{ marginTop:8, fontSize:11, color:T.acc, background:T.accDim, borderRadius:8, padding:"6px 10px" }}>
                Faltan {Math.max(0, parseInt(f.km_proximo_mantenimiento)-parseInt(f.km_actual)).toLocaleString()} km para el proximo mantenimiento
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>COSTOS (Q)</div>
            <div style={{ display:"grid", gap:11 }}>
              <Fld label="COSTO REPUESTOS">
                <input style={S.inp} type="number" step="0.01" value={f.costo_repuestos}
                  onChange={e => { sf("costo_repuestos", e.target.value); calcTotal(e.target.value, f.costo_mano_obra); }}
                  placeholder="0.00" />
              </Fld>
              <Fld label="MANO DE OBRA">
                <input style={S.inp} type="number" step="0.01" value={f.costo_mano_obra}
                  onChange={e => { sf("costo_mano_obra", e.target.value); calcTotal(f.costo_repuestos, e.target.value); }}
                  placeholder="0.00" />
              </Fld>
              <div style={{ background:T.accDim, border:`1px solid ${T.acc}44`, borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:T.sub }}>TOTAL MANTENIMIENTO</span>
                <span style={{ fontSize:18, fontWeight:800, color:T.acc }}>Q {fmt(f.costo_total)}</span>
              </div>
            </div>
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
              {saving ? "Guardando..." : editItem ? "Actualizar" : "Registrar mantenimiento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Mantenimientos" datos={pag.data} campos={[
        {label:"Fecha",key:"fecha"},{label:"Vehiculo",key:"vehiculo_nombre"},{label:"Placa",key:"vehiculo_placa"},
        {label:"Tipo",key:"tipo_mantenimiento"},{label:"Taller",key:"taller"},{label:"KM Actual",key:"km_actual"},
        {label:"KM Prox. Mant.",key:"km_proximo_mantenimiento"},{label:"Costo Total",key:"costo_total"},{label:"Estado",key:"estado"}
      ]} onClose={() => setExportar(false)} />}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { l:"Total registros", v:pag.total,                                              c:T.txt   },
          { l:"Programados",    v:pag.data.filter(r=>r.estado==="programado").length,       c:T.blue  },
          { l:"En proceso",     v:pag.data.filter(r=>r.estado==="en_proceso").length,       c:T.sec   },
          { l:"Costo total",    v:`Q ${fmt(pag.data.reduce((s,r)=>s+(parseFloat(r.costo_total)||0),0))}`, c:T.red },
        ].map((s,i) => (
          <div key={i} style={{ background:T.surf, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
            <div style={{ fontSize:i===3?14:22, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.mut, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {["todos",...Object.keys(ESTADOS_MANT)].map(est => (
          <button key={est} onClick={() => setFiltroEst(est)}
            style={{ ...S.btn(filtroEst===est?"primary":"ghost"), fontSize:11, padding:"5px 10px" }}>
            {est==="todos" ? "Todos" : ESTADOS_MANT[est]?.l || est}
          </button>
        ))}
        <select style={{ ...S.sel, width:"auto", fontSize:11, padding:"5px 10px" }}
          value={filtroVeh} onChange={e => setFiltroVeh(e.target.value)}>
          <option value="todos">Todos los vehiculos</option>
          {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa}</option>)}
        </select>
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar mantenimiento..." />
        <div style={{ flex:1 }} />
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize:11 }}>Exportar</button>
        <button onClick={() => { setF({...EF}); setEditItem(null); setVista("form"); }}
          style={{ ...S.btn("primary"), fontSize:12 }}>+ Nuevo mantenimiento</button>
      </div>

      {pag.data.length > 0 && (
        <div style={{ background:T.redDim, border:`1px solid ${T.red}44`, borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", fontSize:13 }}>
          <span style={{ color:T.sub }}>{pag.data.length} registros</span>
          <span style={{ fontWeight:800, color:T.red }}>Costo total: Q {fmt(totCosto)}</span>
        </div>
      )}

      {pag.loading ? <Spinner /> : pag.data.length === 0 ? (
        <Empty icon="M" msg="Sin mantenimientos registrados" action="+ Nuevo mantenimiento"
          onAction={() => { setF({...EF}); setEditItem(null); setVista("form"); }} />
      ) : (
        <div style={{ ...S.card, overflowX: 'auto' }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              {["Fecha","Vehiculo","Tipo","Taller","KM Actual","KM Prox. Mant.","Costo","Estado",""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pag.data.map(r => {
                const est = ESTADOS_MANT[r.estado] || ESTADOS_MANT.programado;
                const kmFaltan = r.km_proximo_mantenimiento && r.km_actual
                  ? Math.max(0, r.km_proximo_mantenimiento - r.km_actual) : null;
                return (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background=T.surf}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={{ ...S.td, fontSize:11, color:T.sub, whiteSpace:"nowrap" }}>{fmtD(r.fecha)}</td>
                    <td style={{ ...S.td, fontWeight:600 }}>
                      {r.vehiculo_nombre}
                      <div style={{ fontSize:10, color:T.mut, fontFamily:"monospace" }}>{r.vehiculo_placa}</div>
                    </td>
                    <td style={{ ...S.td, fontSize:12 }}>{r.tipo_mantenimiento}</td>
                    <td style={{ ...S.td, fontSize:12, color:T.sub }}>{r.taller||"—"}</td>
                    <td style={{ ...S.td, fontSize:12, color:T.sub }}>{r.km_actual ? r.km_actual.toLocaleString()+" km" : "—"}</td>
                    <td style={{ ...S.td, fontSize:12 }}>
                      {r.km_proximo_mantenimiento ? (
                        <div>
                          <div style={{ fontFamily:"monospace", color:T.acc }}>{parseInt(r.km_proximo_mantenimiento).toLocaleString()} km</div>
                          {kmFaltan !== null && <div style={{ fontSize:9, color:kmFaltan < 1000 ? T.red : T.mut }}>Faltan {kmFaltan.toLocaleString()} km</div>}
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ ...S.td, fontWeight:700, color:T.red }}>Q {fmt(r.costo_total)}</td>
                    <td style={S.td}>
                      <span style={{ padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:600, color:est.c, background:est.bg }}>{est.l}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => abrirEditar(r)} style={{ ...S.btn("ghost"), padding:"3px 8px", fontSize:11 }}>Editar</button>
                        <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), padding:"3px 8px", fontSize:11 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pag.data.length > 0 && (
        <Paginador page={pag.page} totalPages={pag.totalPages} total={pag.total} desde={pag.desde} hasta={pag.hasta} pageSize={pag.pageSize} onPage={pag.setPage} onPageSize={pag.setPageSize} />
      )}
    </div>
  );
}
