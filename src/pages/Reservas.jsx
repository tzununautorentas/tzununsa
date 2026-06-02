// src/pages/Reservas.jsx
import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, CATALOGO, GT, EST_RES, FLUJO_RES } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente } from '../components/shared.jsx';

// ─── Google Calendar (fecha corregida) ───────────────────────────
const toGCal = (dateStr, hora = "080000") => {
  if (!dateStr) return "";
  const solo = String(dateStr).replace(/[-T:]/g, "").slice(0, 8);
  if (solo.length < 8) return "";
  return solo + "T" + hora;
};

const abrirGoogleCalendar = (r) => {
  const inicio = toGCal(r.fecha_inicio, "080000");
  const fin    = toGCal(r.fecha_fin || r.fecha_inicio, "180000");
  if (!inicio) { alert("La reserva no tiene fecha de inicio"); return; }
  const title = encodeURIComponent(`Reserva Tz'unun — ${r.cliente_nombre}`);
  const det   = encodeURIComponent(
    `Vehiculo: ${r.vehiculo_nombre || "—"}\nCliente: ${r.cliente_nombre}\nTotal: Q ${fmt(r.total_gtq || 0)}\nEstado: ${r.estado}`
  );
  const loc = encodeURIComponent("Guatemala City, Guatemala");
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${inicio}/${fin}&details=${det}&location=${loc}`,
    "_blank"
  );
};

// ─── Estados ─────────────────────────────────────────────────────
const calcDias = (fi, ff) => {
  if (!fi) return 0;
  const d1 = new Date(fi + "T12:00:00");
  const d2 = ff ? new Date(ff + "T12:00:00") : d1;
  return Math.max(1, Math.ceil((d2 - d1) / 86400000));
};

const EMPTY_R = {
  cliente_nombre: "", tipo: "renta", vehiculo_nombre: "", conductor_nombre: "",
  fecha_inicio: "", fecha_fin: "", hora_recogida: "08:00",
  origen: "Guatemala", destino: "", departamento: "", municipio: "",
  anticipo: "", total_gtq: "", notas: "", tasa_iva: 5,
  metodo_pago: "efectivo", tasa_cambio: 7.70, estado: "pendiente",
};

// ─── Formulario de Reserva ────────────────────────────────────────
function FormReserva({ initial, onSave, onCancel, empId }) {
  const [f, setF]         = useState(initial ? { ...EMPTY_R, ...initial, tasa_iva: initial.tasa_iva || 5, tasa_cambio: initial.tasa_cambio || 7.70 } : { ...EMPTY_R });
  const [saving, setSaving] = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const fromCotizacion = f.cotizacion_id && parseFloat(f.subtotal) > 0;

  // Si la reserva viene de una cotizacion, usar valores heredados (no recalcular)
  const dias = fromCotizacion ? f.dias : calcDias(f.fecha_inicio, f.fecha_fin);
  const veh  = CATALOGO.find(v => v.nombre === f.vehiculo_nombre);
  const tarifa = fromCotizacion ? (f.dias > 0 ? f.subtotal / f.dias : 0) : (veh ? (dias >= 30 ? veh.mes : dias >= 8 ? veh.sem : veh.dia) : 0);
  const sub  = fromCotizacion ? f.subtotal : dias * tarifa;
  const iva  = fromCotizacion ? f.total_iva : Math.round(sub * (f.tasa_iva / 100) * 100) / 100;
  const tot  = fromCotizacion ? f.total_gtq : sub + iva;

  const guardar = async () => {
    if (!f.cliente_nombre.trim() || !f.fecha_inicio) {
      alert("Cliente y fecha inicio son requeridos"); return;
    }
    setSaving(true);
    const numero = "RES-" + Date.now().toString().slice(-6);
    const payload = {
      ...f, empresa_id: empId,
      numero: initial?.numero || numero,
      dias, tarifa, subtotal: sub, total_iva: iva, total_gtq: tot,
      tasa_iva: f.tasa_iva, tasa_cambio: f.tasa_cambio,
      metodo_pago: f.metodo_pago,
    };
    const result = initial?.id
      ? await dbUpd("reservas", initial.id, payload)
      : await dbIns("reservas", payload);
    if (result?.error) { alert("Error: " + result.error); setSaving(false); return; }
    setSaving(false); onSave();
  };

  const deptos = Object.keys(GT);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>
          {initial ? "Editar reserva" : "Nueva reserva"}
        </div>
        <button onClick={onCancel} style={S.btn("ghost")}>Volver</button>
      </div>

      {/* Banner si viene de cotizacion */}
      {fromCotizacion && (
        <div style={{ background: T.accDim, border: `1px solid ${T.acc}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: T.acc, fontWeight: 600 }}>
            Vinculada a Cotización #{f.cotizacion_id?.toString().slice(-6) || ""}
          </div>
          <div style={{ fontSize: 10, color: T.sub }}>Los costos fueron heredados de la cotización</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Columna izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>CLIENTE Y TIPO</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="TIPO DE SERVICIO">
                <div style={{ display: "flex", gap: 8 }}>
                  {["renta", "traslado"].map(t => (
                    <button key={t} onClick={() => sf("tipo", t)}
                      style={{ ...S.btn(f.tipo === t ? "primary" : "ghost"), flex: 1, fontSize: 12 }}>
                      {t === "renta" ? "Renta por dias" : "Traslado / Viaje"}
                    </button>
                  ))}
                </div>
              </Fld>
              <Fld label="CLIENTE *">
                <BuscadorCliente value={f.cliente_nombre} onChange={v => sf("cliente_nombre", v)} empId={empId} />
              </Fld>
              <Fld label="VEHICULO">
                <select style={S.sel} value={f.vehiculo_nombre} onChange={e => sf("vehiculo_nombre", e.target.value)}>
                  <option value="">Sin asignar</option>
                  {CATALOGO.map(v => <option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                </select>
              </Fld>
              <Fld label="CONDUCTOR / PILOTO">
                <input style={S.inp} value={f.conductor_nombre} onChange={e => sf("conductor_nombre", e.target.value)} placeholder="Nombre del conductor" />
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>FECHAS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <Fld label="FECHA INICIO *">
                <input style={S.inp} type="date" value={f.fecha_inicio} onChange={e => sf("fecha_inicio", e.target.value)} />
              </Fld>
              <Fld label="FECHA FIN">
                <input style={S.inp} type="date" value={f.fecha_fin} onChange={e => sf("fecha_fin", e.target.value)} />
              </Fld>
              <Fld label="HORA RECOGIDA">
                <input style={S.inp} type="time" value={f.hora_recogida} onChange={e => sf("hora_recogida", e.target.value)} />
              </Fld>
              <Fld label="DIAS">
                <div style={{ ...S.inp, background: T.card, display: "flex", alignItems: "center", fontWeight: 700, color: T.acc }}>
                  {dias} dia{dias !== 1 ? "s" : ""}
                </div>
              </Fld>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>RUTA</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="ORIGEN">
                <input style={S.inp} value={f.origen} onChange={e => sf("origen", e.target.value)} placeholder="Ciudad de origen" />
              </Fld>
              <Fld label="DESTINO">
                <input style={S.inp} value={f.destino} onChange={e => sf("destino", e.target.value)} placeholder="Ciudad de destino" />
              </Fld>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                <Fld label="DEPARTAMENTO">
                  <select style={S.sel} value={f.departamento} onChange={e => { sf("departamento", e.target.value); sf("municipio", ""); }}>
                    <option value="">Seleccionar...</option>
                    {deptos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Fld>
                <Fld label="MUNICIPIO">
                  <select style={S.sel} value={f.municipio} onChange={e => sf("municipio", e.target.value)} disabled={!f.departamento}>
                    <option value="">Seleccionar...</option>
                    {(GT[f.departamento] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Fld>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>FINANZAS</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="IVA">
                <select style={S.sel} value={f.tasa_iva} onChange={e => sf("tasa_iva", parseInt(e.target.value))} disabled={fromCotizacion}>
                  <option value={12}>12% Regimen General</option>
                  <option value={5}>5% Pequeno Contribuyente</option>
                  <option value={0}>Sin IVA</option>
                </select>
              </Fld>
              <Fld label="METODO DE PAGO">
                <div style={{ display: "flex", gap: 8 }}>
                  {["efectivo", "transferencia", "tarjeta"].map(p => (
                    <button key={p} onClick={() => sf("metodo_pago", p)}
                      style={{ ...S.btn(f.metodo_pago === p ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </Fld>
              <Fld label="TASA CAMBIO (Q por $1)">
                <input style={S.inp} type="number" step="0.01" value={f.tasa_cambio} onChange={e => sf("tasa_cambio", parseFloat(e.target.value) || 7.70)} disabled={fromCotizacion} />
              </Fld>
              <Fld label="ANTICIPO RECIBIDO (Q)">
                <input style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e => sf("anticipo", e.target.value)} placeholder="0.00" />
              </Fld>
            </div>
          </div>

          {/* Resumen de costos */}
          {tot > 0 && (
            <div style={{ ...S.card, background: fromCotizacion ? T.accDim : T.surf, border: `1px solid ${T.acc}44` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 12, letterSpacing: 1 }}>
                {fromCotizacion ? "COSTOS HEREDADOS DE COTIZACION" : "RESUMEN DE COSTOS"}
              </div>
              {[
                { l: "Tarifa diaria", v: `Q ${fmt(tarifa)}` },
                { l: `Dias (x${dias})`, v: `Q ${fmt(sub)}` },
                { l: `IVA ${f.tasa_iva}%`, v: `Q ${fmt(iva)}` },
              ].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", color: T.sub }}>
                  <span>{r.l}</span><span>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: T.acc, borderTop: `1px solid ${T.acc}44`, paddingTop: 10, marginTop: 6 }}>
                <span>TOTAL</span><span>Q {fmt(tot)}</span>
              </div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
                $ {fmt(f.tasa_cambio > 0 ? tot / f.tasa_cambio : 0)} USD
              </div>
            </div>
          )}

          <div style={S.card}>
            <Fld label="ESTADO">
              <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                {Object.entries(EST_RES).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
              </select>
            </Fld>
          </div>

          <div style={S.card}>
            <Fld label="NOTAS / INSTRUCCIONES">
              <textarea style={{ ...S.inp, minHeight: 80, resize: "vertical" }}
                value={f.notas} onChange={e => sf("notas", e.target.value)}
                placeholder="Instrucciones especiales, puntos de recogida..." />
            </Fld>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
            <button onClick={guardar} disabled={saving}
              style={{ ...S.btn("primary"), flex: 2 }}>
              {saving ? "Guardando..." : initial ? "Actualizar reserva" : "Crear reserva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina principal ─────────────────────────────────────────────
export default function PageReservas({ showToast, empId }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [vista, setVista]       = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro]     = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [exportar, setExportar] = useState(false);

  const load = async () => {
    setLoading(true);
    const d = await dbGet("reservas", "&order=fecha_inicio.desc");
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    await dbUpd("reservas", id, { estado: nuevoEstado });
    showToast("Estado actualizado"); load();
  };

  const del = async id => {
    if (!confirm("Eliminar esta reserva?")) return;
    await dbDel("reservas", id); showToast("Eliminada"); load();
  };

  const filtrados = rows.filter(r => {
    if (filtro !== "todos" && r.estado !== filtro) return false;
    if (busqueda && !r.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) &&
        !r.numero?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const CAMPOS_EXP = [
    { label: "Numero",   key: "numero"           },
    { label: "Cliente",  key: "cliente_nombre"   },
    { label: "Vehiculo", key: "vehiculo_nombre"  },
    { label: "Tipo",     key: "tipo"             },
    { label: "Inicio",   key: "fecha_inicio"     },
    { label: "Fin",      key: "fecha_fin"        },
    { label: "Dias",     key: "dias"             },
    { label: "Total",    key: "total_gtq"        },
    { label: "Estado",   key: "estado"           },
  ];

  if (vista === "form") return (
    <FormReserva
      initial={editItem} empId={empId}
      onSave={() => { setVista("lista"); setEditItem(null); showToast("Reserva guardada"); load(); }}
      onCancel={() => { setVista("lista"); setEditItem(null); }}
    />
  );

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Reservas" datos={filtrados} campos={CAMPOS_EXP} onClose={() => setExportar(false)} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total",       v: rows.length,                                    c: T.txt   },
          { l: "Pendientes",  v: rows.filter(r => r.estado === "pendiente").length,  c: T.mut   },
          { l: "Confirmadas", v: rows.filter(r => r.estado === "confirmada").length, c: T.acc   },
          { l: "En curso",    v: rows.filter(r => r.estado === "en_curso").length,   c: T.blue  },
          { l: "Completadas", v: rows.filter(r => r.estado === "completada").length, c: T.green },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: T.mut, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {["todos", "pendiente", "confirmada", "en_curso", "completada", "cancelada"].map(est => {
          const info = EST_RES[est];
          return (
            <button key={est} onClick={() => setFiltro(est)}
              style={{ ...S.btn(filtro === est ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
              {est === "todos" ? "Todos" : info?.l || est}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12 }}>
          + Nueva reserva
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input style={S.inp} placeholder="Buscar por cliente o numero de reserva..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {loading ? <Spinner /> : filtrados.length === 0 ? (
        <Empty icon="R" msg="Sin reservas" action="+ Nueva reserva" onAction={() => setVista("form")} />
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["No.", "Cliente", "Vehiculo", "Conductor", "Inicio", "Fin", "Total", "Estado", "Acciones"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => {
                const est = EST_RES[r.estado] || EST_RES.pendiente;
                return (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = T.surf}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>
                      {r.cliente_nombre}
                      {r.tipo && <div style={{ fontSize: 10, color: T.mut }}>{r.tipo}</div>}
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: T.sub }}>{r.vehiculo_nombre || "—"}</td>
                    <td style={{ ...S.td, fontSize: 12, color: T.sub }}>{r.conductor_nombre || "—"}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: "nowrap" }}>{fmtD(r.fecha_inicio)}</td>
                    <td style={{ ...S.td, fontSize: 11, color: T.sub, whiteSpace: "nowrap" }}>{fmtD(r.fecha_fin) || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: T.acc }}>Q {fmt(r.total_gtq)}</td>
                    <td style={S.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, color: est.c, background: est.bg }}>
                        {est.l}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(FLUJO_RES[r.estado] || []).map(accion => (
                          <button key={accion.v} onClick={() => cambiarEstado(r.id, accion.v)}
                            style={{ ...S.btn(accion.s), padding: "3px 7px", fontSize: 10 }}>
                            {accion.l}
                          </button>
                        ))}
                        <button onClick={() => abrirGoogleCalendar(r)}
                          style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>
                          Calendario
                        </button>
                        <button onClick={() => { setEditItem(r); setVista("form"); }}
                          style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>
                          Editar
                        </button>
                        <button onClick={() => del(r.id)}
                          style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 10 }}>
                          Eliminar
                        </button>
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
