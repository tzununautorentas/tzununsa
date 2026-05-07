import React, { useState, useEffect } from "react";
import { T, S, fmt, fmtD, today, newId, getEmpId, dbGet, dbIns, dbUpd, dbDel, CATALOGO, tarifaVeh, GT, EST_RES, FLUJO_RES } from "../config.js";
import { Toast, Spinner, Empty, Fld, Badge, BuscadorCliente } from "../components/shared.jsx";

function calcDias(fi, ff) {
  if (!fi) return 1;
  const a = new Date(fi + "T12:00:00"), b = ff ? new Date(ff + "T12:00:00") : a;
  return Math.max(1, Math.ceil((b - a) / 86400000));
}

function CalendarioReservas({ rows, onEdit }) {
  const [mes, setMes] = useState(new Date());
  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const y = mes.getFullYear(), m = mes.getMonth();
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  let startDow = first.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const cells = [];
  for (let i = 0; i < Math.ceil((startDow + last.getDate()) / 7) * 7; i++) {
    const day = i - startDow + 1;
    const valid = day >= 1 && day <= last.getDate();
    const dateStr = valid ? \`\${y}-\${String(m+1).padStart(2,"0")}-\${String(day).padStart(2,"0")}\` : "";
    const dayRows = valid ? rows.filter(r => {
      const fi = (r.fecha_inicio || "").slice(0, 10);
      const ff = (r.fecha_fin || fi).slice(0, 10);
      return fi <= dateStr && dateStr <= ff;
    }) : [];
    const isToday = valid && new Date().toDateString() === new Date(y, m, day).toDateString();
    cells.push({ day, valid, isToday, dayRows, dateStr });
  }
  const colors = { pendiente: T.mut, confirmada: T.acc, en_curso: T.blue, completada: T.green, cancelada: T.red };
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setMes(new Date(y, m - 1, 1))} style={{ ...S.btn("ghost"), padding: "4px 12px" }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{MESES[m]} {y}</div>
        <button onClick={() => setMes(new Date(y, m + 1, 1))} style={{ ...S.btn("ghost"), padding: "4px 12px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DIAS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.mut, padding: "4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ minHeight: 72, background: c.isToday ? T.accD : c.valid ? T.surf : "transparent", borderRadius: 6, padding: 4, border: c.isToday ? \`1px solid \${T.acc}\` : "1px solid transparent" }}>
            {c.valid && <>
              <div style={{ fontSize: 12, fontWeight: c.isToday ? 700 : 400, color: c.isToday ? T.acc : T.sub, marginBottom: 2 }}>{c.day}</div>
              {c.dayRows.slice(0, 3).map(r => (
                <div key={r.id} onClick={() => onEdit(r)} style={{ fontSize: 9, fontWeight: 600, background: (colors[r.estado] || T.mut) + "33", color: colors[r.estado] || T.mut, borderLeft: \`2px solid \${colors[r.estado] || T.mut}\`, padding: "1px 4px", borderRadius: 2, marginBottom: 1, cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {r.cliente_nombre?.split(" ")[0]}
                </div>
              ))}
              {c.dayRows.length > 3 && <div style={{ fontSize: 9, color: T.mut }}>+{c.dayRows.length - 3}</div>}
            </>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
        {Object.entries(EST_RES).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: v.c + "44", border: \`1px solid \${v.c}\` }} />
            <span style={{ color: T.sub }}>{v.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormReserva({ initial, empId, onSave, onCancel }) {
  const [f, setF] = useState({
    cliente_nombre: initial?.cliente_nombre || "",
    tipo: initial?.tipo || "renta",
    vehiculo_nombre: initial?.vehiculo_nombre || "",
    conductor_nombre: initial?.conductor_nombre || "",
    fecha_inicio: initial?.fecha_inicio ? initial.fecha_inicio.slice(0, 10) : "",
    fecha_fin: initial?.fecha_fin ? initial.fecha_fin.slice(0, 10) : "",
    hora_recogida: initial?.hora_recogida || "08:00",
    origen: initial?.origen || "Guatemala",
    destino: initial?.destino || "",
    departamento: initial?.departamento || "",
    municipio: initial?.municipio || "",
    anticipo: initial?.anticipo || "",
    notas: initial?.notas || "",
    iva: initial?.tasa_iva || 5,
    pago: initial?.metodo_pago || "efectivo",
    exch: initial?.tasa_cambio || 7.70,
    estado: initial?.estado || "pendiente",
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);

  const dias = calcDias(f.fecha_inicio, f.fecha_fin);
  const vehObj = CATALOGO.find(v => v.nombre === f.vehiculo_nombre);
  const tarifa = tarifaVeh(vehObj, dias);
  const sub = dias * tarifa;
  const ivaAmt = sub * (parseInt(f.iva) || 0) / 100;
  const base = sub + ivaAmt;
  const recTC = f.pago === "tarjeta" ? base * 0.05 : 0;
  const total = Math.round((base + recTC) * 100) / 100;
  const ant = parseFloat(f.anticipo) || 0;
  const saldo = Math.max(0, total - ant);
  const munis = f.departamento && GT[f.departamento] ? GT[f.departamento] : [];

  const guardar = async () => {
    if (!f.cliente_nombre.trim()) { alert("El nombre del cliente es requerido"); return; }
    if (!f.fecha_inicio) { alert("La fecha de inicio es requerida"); return; }
    setSaving(true);
    try {
      const eid = empId || await getEmpId();
      if (!eid) { alert("Error: empresa no encontrada"); setSaving(false); return; }
      const payload = {
        empresa_id: eid,
        cliente_nombre: f.cliente_nombre.trim(),
        tipo: f.tipo,
        numero: initial?.id ? initial.numero : "RES-" + newId(),
        vehiculo_nombre: f.vehiculo_nombre || "",
        conductor_nombre: f.conductor_nombre || "",
        fecha_inicio: f.fecha_inicio + "T" + (f.hora_recogida || "08:00") + ":00",
        fecha_fin: f.fecha_fin ? f.fecha_fin + "T23:59:00" : null,
        hora_recogida: f.hora_recogida || "08:00",
        origen: f.origen || "Guatemala",
        destino: f.destino || "",
        departamento: f.departamento || "",
        municipio: f.municipio || "",
        monto: total,
        anticipo: ant,
        saldo: saldo,
        tasa_iva: parseInt(f.iva) || 0,
        metodo_pago: f.pago,
        tasa_cambio: parseFloat(f.exch) || 7.70,
        estado: f.estado,
        notas: f.notas || "",
      };
      const result = initial?.id ? await dbUpd("reservas", initial.id, payload) : await dbIns("reservas", payload);
      if (result?.error) { alert("Error: " + result.error); setSaving(false); return; }
      setSaving(false);
      onSave();
    } catch (e) { alert("Error: " + e.message); setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>{initial?.id ? "Editar reserva" : "Nueva reserva"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>← Volver</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Fld label="CLIENTE" span2><BuscadorCliente value={f.cliente_nombre} onChange={v => sf("cliente_nombre", v)} empId={empId} /></Fld>
          <Fld label="TIPO" span2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => sf("tipo", "renta")} style={{ ...S.btn(f.tipo === "renta" ? "primary" : "ghost"), flex: 1 }}>🔑 Renta</button>
              <button onClick={() => sf("tipo", "traslado")} style={{ ...S.btn(f.tipo === "traslado" ? "primary" : "ghost"), flex: 1 }}>🗺 Traslado</button>
            </div>
          </Fld>
          <Fld label="ESTADO">
            <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="confirmada">✅ Confirmada</option>
              <option value="en_curso">▶ En curso</option>
              <option value="completada">🏁 Completada</option>
              <option value="cancelada">✗ Cancelada</option>
            </select>
          </Fld>
          <Fld label="HORA RECOGIDA"><input style={S.inp} type="time" value={f.hora_recogida} onChange={e => sf("hora_recogida", e.target.value)} /></Fld>
          <Fld label="VEHÍCULO" span2>
            <select style={S.sel} value={f.vehiculo_nombre} onChange={e => sf("vehiculo_nombre", e.target.value)}>
              <option value="">Seleccionar vehículo...</option>
              {CATALOGO.map(v => <option key={v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/día</option>)}
            </select>
          </Fld>
          <Fld label="CONDUCTOR"><input style={S.inp} value={f.conductor_nombre} onChange={e => sf("conductor_nombre", e.target.value)} placeholder="Nombre del piloto" /></Fld>
          <Fld label="IVA">
            <select style={S.sel} value={f.iva} onChange={e => sf("iva", parseInt(e.target.value))}>
              <option value={12}>12% General</option>
              <option value={5}>5% Pequeño Contrib.</option>
              <option value={0}>Sin IVA</option>
            </select>
          </Fld>
          <Fld label="FECHA INICIO"><input style={S.inp} type="date" value={f.fecha_inicio} onChange={e => sf("fecha_inicio", e.target.value)} /></Fld>
          <Fld label="FECHA FIN"><input style={S.inp} type="date" value={f.fecha_fin} onChange={e => sf("fecha_fin", e.target.value)} /></Fld>
          <Fld label="ORIGEN"><input style={S.inp} value={f.origen} onChange={e => sf("origen", e.target.value)} /></Fld>
          <Fld label="DESTINO"><input style={S.inp} value={f.destino} onChange={e => sf("destino", e.target.value)} /></Fld>
          <Fld label="DEPARTAMENTO">
            <select style={S.sel} value={f.departamento} onChange={e => { sf("departamento", e.target.value); sf("municipio", ""); }}>
              <option value="">Seleccionar...</option>
              {Object.keys(GT).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Fld>
          <Fld label="MUNICIPIO">
            <select style={S.sel} value={f.municipio} onChange={e => sf("municipio", e.target.value)} disabled={!f.departamento}>
              <option value="">Seleccionar...</option>
              {munis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Fld>
          <Fld label="MÉTODO DE PAGO" span2>
            <div style={{ display: "flex", gap: 8 }}>
              {[["efectivo", "💵 Efectivo"], ["transferencia", "🏦 Transferencia"], ["tarjeta", "💳 Tarjeta (+5%)"]].map(([v, l]) => (
                <button key={v} onClick={() => sf("pago", v)} style={{ ...S.btn(f.pago === v ? "primary" : "ghost"), flex: 1, fontSize: 11 }}>{l}</button>
              ))}
            </div>
          </Fld>
          <Fld label="ANTICIPO (Q)"><input style={S.inp} type="number" step="0.01" value={f.anticipo} onChange={e => sf("anticipo", e.target.value)} placeholder="0.00" /></Fld>
          <Fld label="TASA CAMBIO ($1)"><input style={S.inp} type="number" step="0.01" value={f.exch} onChange={e => sf("exch", e.target.value)} /></Fld>
          <Fld label="NOTAS" span2><textarea style={{ ...S.inp, minHeight: 55, resize: "vertical" }} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." /></Fld>
          <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
            <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex: 1, padding: 11, fontSize: 13 }}>{saving ? "💾 Guardando..." : "💾 Guardar reserva"}</button>
            <button onClick={onCancel} style={{ ...S.btn("ghost"), flex: 1, padding: 11 }}>Cancelar</button>
          </div>
        </div>
        {/* Resumen */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>📊 Resumen</div>
          {vehObj && dias > 0 ? <>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>🚗 {vehObj.nombre} · {dias} día{dias !== 1 ? "s" : ""}</div>
            <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              {[["Tarifa", \`Q \${fmt(tarifa)}/día\`], ["Subtotal", \`Q \${fmt(sub)}\`], [\`IVA \${f.iva}%\`, \`Q \${fmt(ivaAmt)}\`], ...(f.pago === "tarjeta" ? [["Recargo TC 5%", \`Q \${fmt(recTC)}\`]] : [])].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: T.sub }}><span>{l}</span><span>{v}</span></div>
              ))}
            </div>
            <div style={{ background: T.accD, border: \`1px solid \${T.acc}55\`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}><span>TOTAL</span><span>Q {fmt(total)}</span></div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>$ {fmt(f.exch > 0 ? total / f.exch : 0)} USD</div>
            </div>
            {ant > 0 && <div style={{ background: T.surf, borderRadius: 9, padding: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, padding: "4px 0" }}><span>Anticipo</span><span>Q {fmt(ant)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, padding: "4px 0", color: saldo > 0 ? T.sec : T.acc }}><span>Saldo pendiente</span><span>Q {fmt(saldo)}</span></div>
            </div>}
          </> : <div style={{ textAlign: "center", padding: 32, color: T.sub, fontSize: 12 }}>Selecciona vehículo y fechas para ver el resumen</div>}
        </div>
      </div>
    </div>
  );
}

export default function PageReservas({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("lista");
  const [viewMode, setViewMode] = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro] = useState("todas");

  const load = async () => {
    setLoading(true);
    const d = await dbGet("reservas");
    setRows(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const chEst = async (id, estado) => {
    const res = rows.find(r => r.id === id);
    await dbUpd("reservas", id, { estado });
    if (estado === "en_curso" && res?.vehiculo_nombre) {
      const vehs = await dbGet("vehiculos", \`&vehiculo_nombre=eq.\${encodeURIComponent(res.vehiculo_nombre)}\`);
      if (vehs[0]) await dbUpd("vehiculos", vehs[0].id, { estado: "rentado" });
    }
    if (estado === "completada" && res?.vehiculo_nombre) {
      const vehs = await dbGet("vehiculos", \`&vehiculo_nombre=eq.\${encodeURIComponent(res.vehiculo_nombre)}\`);
      if (vehs[0]) await dbUpd("vehiculos", vehs[0].id, { estado: "mantenimiento" });
    }
    if (estado === "cancelada" && res?.vehiculo_nombre) {
      const vehs = await dbGet("vehiculos", \`&vehiculo_nombre=eq.\${encodeURIComponent(res.vehiculo_nombre)}\`);
      if (vehs[0]) await dbUpd("vehiculos", vehs[0].id, { estado: "disponible" });
    }
    showToast("Estado actualizado");
    load();
  };
  const del = async (id) => {
    if (!confirm("¿Eliminar esta reserva?")) return;
    await dbDel("reservas", id);
    showToast("Eliminada");
    load();
  };

  const filtered = filtro === "todas" ? rows : rows.filter(r => r.estado === filtro);

  if (vista === "form") return (
    <FormReserva initial={editItem} empId={empId}
      onSave={() => { setVista("lista"); setEditItem(null); load(); showToast("Reserva guardada ✔"); }}
      onCancel={() => { setVista("lista"); setEditItem(null); }} />
  );

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        {Object.entries(EST_RES).map(([k, v]) => (
          <div key={k} style={{ background: T.surf, borderRadius: 10, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: v.c }}>{rows.filter(r => r.estado === k).length}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{v.l}</div>
          </div>
        ))}
      </div>
      {/* Controles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["todas", "pendiente", "confirmada", "en_curso", "completada", "cancelada"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ ...S.btn(filtro === f ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {f === "todas" ? "Todas" : EST_RES[f]?.l || f}
          </button>
        ))}
        <button onClick={() => setViewMode(viewMode === "lista" ? "calendario" : "lista")} style={{ ...S.btn("ghost"), fontSize: 11 }}>
          {viewMode === "lista" ? "📅 Calendario" : "📋 Lista"}
        </button>
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11 }}>↺</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12, marginLeft: "auto" }}>+ Nueva reserva</button>
      </div>
      {/* Vista */}
      {loading ? <Spinner /> : viewMode === "calendario" ? (
        <CalendarioReservas rows={rows} onEdit={r => { setEditItem(r); setVista("form"); }} />
      ) : filtered.length === 0 ? (
        <Empty icon="📭" msg="Sin reservas" action="+ Nueva reserva" onAction={() => { setEditItem(null); setVista("form"); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => {
            const e = EST_RES[r.estado] || EST_RES.pendiente;
            const sig = FLUJO_RES[r.estado] || [];
            return (
              <div key={r.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>{r.numero}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.cliente_nombre}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      {r.tipo === "renta" ? "🔑" : "🗺"} {fmtD(r.fecha_inicio)}{r.fecha_fin ? " → " + fmtD(r.fecha_fin) : ""}
                      {r.vehiculo_nombre ? " · " + r.vehiculo_nombre : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge c={e.c} bg={e.bg} l={e.l} small />
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.acc, marginTop: 4 }}>Q {fmt(r.monto)}</div>
                    {parseFloat(r.saldo) > 0 && <div style={{ fontSize: 11, color: T.sec }}>Saldo: Q {fmt(r.saldo)}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, paddingTop: 10, borderTop: \`1px solid \${T.bord}22\`, flexWrap: "wrap" }}>
                  {sig.map(s => <button key={s.v} onClick={() => chEst(r.id, s.v)} style={{ ...S.btn(s.s), fontSize: 11, padding: "5px 10px" }}>{s.l}</button>)}
                  <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), fontSize: 11, padding: "5px 10px" }}>✏️ Editar</button>
                  <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "5px 10px" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
