// src/pages/Reservas.jsx
import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, CATALOGO, GT, EST_RES, FLUJO_RES, siguienteNumero } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, BuscadorCliente, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

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
  const tipoLabel = r.tipo === "traslado" ? "Traslado" : "Renta de vehículo";
  const title = encodeURIComponent(`${tipoLabel} — ${r.cliente_nombre}${r.vehiculo_nombre ? ` — ${r.vehiculo_nombre}` : ""}`);
  const det   = encodeURIComponent(
    `Cliente: ${r.cliente_nombre}\nVehiculo: ${r.vehiculo_nombre || "—"}\nTotal: Q ${fmt(r.total_gtq || 0)}\nEstado: ${r.estado}`
  );
  const loc = encodeURIComponent("Guatemala City, Guatemala");
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${inicio}/${fin}&details=${det}&location=${loc}`,
    "_blank"
  );
};

// ─── Estados ─────────────────────────────────────────────────────
const calcDias = (fi, ff, hi = "09:00", hf = "09:00") => {
  if (!fi) return 0;
  const d1 = new Date(fi + "T" + hi + ":00");
  const d2 = ff ? new Date(ff + "T" + hf + ":00") : d1;
  const diff = Math.ceil(Math.max(0, d2 - d1) / 86400000);
  return Math.max(1, diff);
};

const EMPTY_R = {
  cliente_nombre: "", tipo: "renta", vehiculo_nombre: "", conductor_nombre: "",
  fecha_inicio: "", fecha_fin: "", hora_recogida: "09:00", hora_entrega: "09:00", hora_regreso: "09:00",
  origen: "", destino: "", departamento: "", municipio: "",
  anticipo: "", total_gtq: "", notas: "", tasa_iva: 5,
  metodo_pago: "efectivo", tasa_cambio: 7.70, estado: "pendiente",
  saludo: "", cliente_tipo: "", cliente_contacto: "", cliente_email: "", cliente_telefono: "",
  descripcion_servicio: "", servicios_incluidos: "{}",
  ruta: "", observaciones_ruta: "", version: 1, carta_poder: false, carta_poder_costo: 0, itinerario: "",
};

// ─── Formulario de Reserva ────────────────────────────────────────
function FormReserva({ initial, onSave, onCancel, empId }) {
  const [f, setF]         = useState(initial ? { ...EMPTY_R, ...initial, saludo: initial.saludo || "", cliente_tipo: initial.cliente_tipo || "", cliente_contacto: initial.cliente_contacto || "", cliente_email: initial.cliente_email || "", cliente_telefono: initial.cliente_telefono || "", tasa_iva: initial.tasa_iva || 5, tasa_cambio: initial.tasa_cambio || 7.70, origen: initial.origen || "", destino: initial.destino || "", ruta: initial.ruta || "", observaciones_ruta: initial.observaciones_ruta || "", descripcion_servicio: initial.descripcion_servicio || "", version: parseInt(initial.version) || 1, carta_poder: initial.carta_poder || false, carta_poder_costo: parseFloat(initial.carta_poder_costo) || 0, itinerario: initial.itinerario || "", hora_entrega: initial.hora_entrega || "09:00", hora_regreso: initial.hora_regreso || "09:00" } : { ...EMPTY_R });
  const [flotaVehiculos, setFlotaVehiculos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [saving, setSaving] = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const res = await dbGet("vehiculos", "&select=marca,modelo,tarifa_dia,tarifa_semana,tarifa_mes&estado=eq.disponible&limit=100");
        if (res) setFlotaVehiculos(res);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await dbGet("empleados", "&select=id,nombre,puesto,estado&estado=eq.activo&order=nombre.asc&limit=200");
        if (res) setEmpleados(res);
      } catch {}
    })();
  }, []);

  const fromCotizacion = f.cotizacion_id && parseFloat(f.subtotal) > 0;

  // Si la reserva viene de una cotizacion, usar valores heredados (no recalcular)
  const dias = fromCotizacion ? f.dias : calcDias(f.fecha_inicio, f.fecha_fin, f.hora_entrega, f.hora_regreso);
  const vehCat  = CATALOGO.find(v => v.nombre === f.vehiculo_nombre);
  const vehFlota = flotaVehiculos.find(v => `${v.marca||""} ${v.modelo||""}`.trim() === f.vehiculo_nombre);
  const veh = vehCat || (vehFlota && parseFloat(vehFlota.tarifa_dia) > 0 ? { ...vehFlota, dia: parseFloat(vehFlota.tarifa_dia), sem: parseFloat(vehFlota.tarifa_semana)||parseFloat(vehFlota.tarifa_dia), mes: parseFloat(vehFlota.tarifa_mes)||parseFloat(vehFlota.tarifa_dia) } : null);
  const tarifa = fromCotizacion ? (f.dias > 0 ? f.subtotal / f.dias : 0) : (veh ? (dias >= 30 ? veh.mes : dias >= 8 ? veh.sem : veh.dia) : 0);
  const sub  = fromCotizacion ? f.subtotal : dias * tarifa;
  const iva  = fromCotizacion ? f.total_iva : Math.round(sub * (f.tasa_iva / 100) * 100) / 100;
  const tot  = fromCotizacion ? f.total_gtq : sub + iva;

  const guardar = async () => {
    if (!f.cliente_nombre.trim() || !f.fecha_inicio) {
      alert("Cliente y fecha inicio son requeridos"); return;
    }
    setSaving(true);
    const numero = initial?.numero || await siguienteNumero("RES-", "reservas", empId);
    const nextVersion = (parseInt(f.version) || 1) + 1;
    const payload = {
      ...f, empresa_id: empId,
      numero,
      dias, tarifa, subtotal: sub, total_iva: iva, total_gtq: tot,
      tasa_iva: f.tasa_iva, tasa_cambio: f.tasa_cambio,
      metodo_pago: f.metodo_pago,
      version: initial?.id ? nextVersion : 1,
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
                  <optgroup label="Catalogo">
                    {CATALOGO.map(v => <option key={"cat_"+v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                  </optgroup>
                  {flotaVehiculos.length > 0 && (
                    <optgroup label="Flota">
                      {flotaVehiculos.map(v => {
                        const nom = `${v.marca||""} ${v.modelo||""}`.trim();
                        if (!nom) return null;
                        const p = parseFloat(v.tarifa_dia) > 0 ? ` — Q${fmt(v.tarifa_dia)}/dia` : "";
                        return <option key={"fl_"+nom} value={nom}>{nom}{p}</option>;
                      })}
                    </optgroup>
                  )}
                </select>
              </Fld>
              <Fld label="CONDUCTOR / PILOTO">
                <select style={S.sel} value={f.conductor_nombre} onChange={e => sf("conductor_nombre", e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.nombre}>
                      {emp.nombre}{emp.puesto ? ` (${emp.puesto})` : ""}
                    </option>
                  ))}
                </select>
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
              {f.tipo === "renta" ? (
                <>
                  <Fld label="HORA ENTREGA">
                    <input style={S.inp} type="time" value={f.hora_entrega} onChange={e => sf("hora_entrega", e.target.value)} />
                  </Fld>
                  <Fld label="HORA REGRESO">
                    <input style={S.inp} type="time" value={f.hora_regreso} onChange={e => sf("hora_regreso", e.target.value)} />
                  </Fld>
                </>
              ) : (
                <Fld label="HORA RECOGIDA">
                  <input style={S.inp} type="time" value={f.hora_recogida} onChange={e => sf("hora_recogida", e.target.value)} />
                </Fld>
              )}
              <Fld label="DIAS">
                <div style={{ ...S.inp, background: T.card, display: "flex", alignItems: "center", fontWeight: 700, color: T.acc, gap: 6 }}>
                  {dias} dia{dias !== 1 ? "s" : ""}
                  {f.tipo === "renta" && <span style={{ fontSize: 10, color: T.mut }}>({f.hora_entrega} → {f.hora_regreso})</span>}
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
              <Fld label="RUTA / OBSERVACIONES">
                <input style={S.inp} value={f.ruta} onChange={e => sf("ruta", e.target.value)} placeholder="Via Cobán, ruta alternativa..." />
              </Fld>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", flexWrap: "wrap" }}>
                <input type="checkbox" id="cartaPoderRes" checked={f.carta_poder} onChange={e => sf("carta_poder", e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }} />
                <label htmlFor="cartaPoderRes" style={{ fontSize: 12, color: T.sub, cursor: "pointer" }}>
                  Requiere Carta Poder (viaje internacional)
                </label>
                {f.carta_poder && (
                  <input style={{ ...S.inp, width: 120, fontSize: 11, marginLeft: 4 }} type="number" step="0.01"
                    value={f.carta_poder_costo} onChange={e => sf("carta_poder_costo", e.target.value)}
                    placeholder="Costo Q" />
                )}
              </div>
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
          {/* Monto global — se muestra siempre el total de la cotización */}
          {tot > 0 && (
            <div style={{ ...S.card, background: fromCotizacion ? T.accDim : T.surf, border: `1px solid ${T.acc}44` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 10, letterSpacing: 1 }}>
                {fromCotizacion ? "MONTO GLOBAL DE COTIZACIÓN" : "MONTO TOTAL"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, color: T.acc }}>
                <span>Total</span><span>Q {fmt(tot)}</span>
              </div>
              {fromCotizacion && (
                <div style={{ fontSize: 11, color: T.mut, marginTop: 4 }}>
                  Monto heredado de la cotización — no se modifican costos individuales
                </div>
              )}
            </div>
          )}

          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, marginBottom: 12, letterSpacing: 1 }}>PAGO</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="MÉTODO DE PAGO">
                <div style={{ display: "flex", gap: 8 }}>
                  {["efectivo", "transferencia", "tarjeta"].map(p => (
                    <button key={p} onClick={() => sf("metodo_pago", p)}
                      style={{ ...S.btn(f.metodo_pago === p ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </Fld>
              <Fld label="ANTICIPO RECIBIDO (Q)">
                <input style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e => sf("anticipo", e.target.value)} placeholder="0.00" />
              </Fld>
              <Fld label="SALDO PENDIENTE">
                <div style={{ ...S.inp, background: T.card, display: "flex", alignItems: "center", fontWeight: 700, color: T.red }}>
                  Q {fmt((tot || 0) - (parseFloat(f.anticipo) || 0))}
                </div>
              </Fld>
            </div>
          </div>

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
  const [vista, setVista]       = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro]     = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [exportar, setExportar] = useState(false);

  const query = filtro !== 'todos' ? 'estado=eq.'+filtro : '';

  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload: load, desde, hasta } = usePaginacion({
    table: 'reservas',
    query,
    search: busqueda,
    columns: ['cliente_nombre', 'numero', 'vehiculo_nombre', 'destino', 'origen', 'departamento', 'municipio', 'conductor_nombre', 'notas'],
    order: 'numero.desc',
  });

  const cambiarEstado = async (id, nuevoEstado) => {
    await dbUpd("reservas", id, { estado: nuevoEstado });
    showToast("Estado actualizado"); load();
  };

  const del = async id => {
    if (!confirm("Eliminar esta reserva?")) return;
    await dbDel("reservas", id); showToast("Eliminada"); load();
  };

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
        <ModalExportar titulo="Reservas" datos={rows} campos={CAMPOS_EXP} onClose={() => setExportar(false)} />
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total",       v: total,                                    c: T.txt   },
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
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar reserva..." />
        <div style={{ flex: 1 }} />
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12 }}>
          + Nueva reserva
        </button>
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty icon="R" msg="Sin reservas" action="+ Nueva reserva" onAction={() => setVista("form")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(r => {
            const est = EST_RES[r.estado] || EST_RES.pendiente;
            const total = parseFloat(r.total_gtq) || 0;
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}{r.version ? <span style={{color:T.sub,fontSize:9}}> v{r.version}</span> : ""}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.cliente_nombre}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      {r.tipo === "renta" ? "Renta por dias" : "Traslado"}
                      {r.vehiculo_nombre ? " · " + r.vehiculo_nombre : ""}
                      {r.conductor_nombre ? " · " + r.conductor_nombre : ""}
                    </div>
                    <div style={{ fontSize: 11, color: T.mut, marginTop: 4 }}>
                      {fmtD(r.fecha_inicio)}{r.fecha_fin ? " → " + fmtD(r.fecha_fin) : ""}
                    </div>
                    {r.destino && <div style={{ fontSize: 11, color: T.mut }}>{r.origen || "Guatemala"} → {r.destino}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge c={est.c} bg={est.bg} l={est.l} small />
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.acc, marginTop: 4 }}>Q {fmt(total)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, paddingTop: 10, borderTop: `1px solid ${T.bord}22`, flexWrap: "wrap" }}>
                  {(FLUJO_RES[r.estado] || []).map(accion => (
                    <button key={accion.v} onClick={() => cambiarEstado(r.id, accion.v)}
                      style={{ ...S.btn(accion.s), fontSize: 11, padding: "4px 9px" }}>{accion.l}</button>
                  ))}
                  <button onClick={() => abrirGoogleCalendar(r)}
                    style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Calendario</button>
                  <button onClick={() => { setEditItem(r); setVista("form"); }}
                    style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 9px" }}>Editar</button>
                  <button onClick={() => del(r.id)}
                    style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 9px", marginLeft: "auto" }}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {rows.length > 0 && (
        <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}
    </div>
  );
}
