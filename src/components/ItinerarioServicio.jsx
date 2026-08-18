import React, { useState, useCallback } from 'react';
import { T, S, fmt, CATALOGO } from '../config.js';

let uid = Date.now();
const id = () => ++uid;

const TRAYECTO_VACIO = () => ({ _id: id(), fecha: "", hora_salida: "", hora_estimada: "", origen: "", destino: "", observaciones: "" });
const VEHICULO_VACIO = () => ({ _id: id(), vehiculo_nombre: "", piloto_nombre: "", costo_vehiculo: 0, costo_piloto: 0, costo_hospedaje: 0, costo_alimentacion: 0, km_ida: 0, km_regreso: 0, km_por_galon: 27, precio_galon: 48, dias: 1, trayectos: [TRAYECTO_VACIO()] });

export default function ItinerarioServicio({ value, flotaVehiculos, onChange }) {
  const vehiculos = value?.vehiculos?.length > 0 ? value.vehiculos : [];

  const cambiarVeh = useCallback((vidx, campo, val) => {
    const v = [...vehiculos];
    v[vidx] = { ...v[vidx], [campo]: val };
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const cambiarTrayecto = useCallback((vidx, tidx, campo, val) => {
    const v = [...vehiculos];
    const t = [...v[vidx].trayectos];
    t[tidx] = { ...t[tidx], [campo]: val };
    v[vidx] = { ...v[vidx], trayectos: t };
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const agregarVehiculo = useCallback(() => {
    const v = [...vehiculos, VEHICULO_VACIO()];
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const quitarVehiculo = useCallback((vidx) => {
    if (vehiculos.length <= 1) return;
    const v = vehiculos.filter((_, i) => i !== vidx);
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const agregarTrayecto = useCallback((vidx) => {
    const v = [...vehiculos];
    v[vidx] = { ...v[vidx], trayectos: [...v[vidx].trayectos, TRAYECTO_VACIO()] };
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const quitarTrayecto = useCallback((vidx, tidx) => {
    const v = [...vehiculos];
    const t = v[vidx].trayectos.filter((_, i) => i !== tidx);
    v[vidx] = { ...v[vidx], trayectos: t.length === 0 ? [TRAYECTO_VACIO()] : t };
    onChange?.({ ...value, vehiculos: v });
  }, [vehiculos, value, onChange]);

  const selStyle = { ...S.sel, pointerEvents: "auto" };
  const inpStyle = { ...S.inp, pointerEvents: "auto" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {vehiculos.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: T.mut }}>
          No hay vehículos en este servicio.
          <br/><button type="button" onClick={agregarVehiculo}
            style={{ ...S.btn("primary"), marginTop: 10, fontSize: 12 }}>+ Agregar Vehículo</button>
        </div>
      )}

      {vehiculos.map((veh, vidx) => (
        <div key={veh._id} style={{ border: `1px solid ${T.bord}`, borderRadius: 10, background: T.card, overflow: "hidden" }}>
          {/* Cabecera vehículo */}
          <div style={{ background: T.accDim, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>Vehículo {vidx + 1}</span>
            {vehiculos.length > 1 && (
              <button type="button" onClick={() => quitarVehiculo(vidx)}
                style={{ ...S.btn("danger"), padding: "2px 10px", fontSize: 10 }}>Quitar</button>
            )}
          </div>

          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Selector vehículo + Piloto */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.lbl}>VEHÍCULO</label>
                <select style={selStyle} value={veh.vehiculo_nombre} onChange={e => {
                  const nom = e.target.value;
                  const c = CATALOGO.find(x => x.nombre === nom);
                  const f = flotaVehiculos?.find(x => `${x.marca||""} ${x.modelo||""}`.trim() === nom);
                  const rate = c ? c.dia : (f && parseFloat(f.tarifa_dia) > 0 ? parseFloat(f.tarifa_dia) : 0);
                  cambiarVeh(vidx, "vehiculo_nombre", nom);
                  if (rate > 0) cambiarVeh(vidx, "costo_vehiculo", rate);
                }}>
                  <option value="">Seleccionar...</option>
                  <optgroup label="Catálogo">
                    {CATALOGO.map(v => <option key={"cat_"+v.id} value={v.nombre}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                  </optgroup>
                  {flotaVehiculos?.length > 0 && (
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
              </div>
              <div>
                <label style={S.lbl}>PILOTO</label>
                <input style={inpStyle} value={veh.piloto_nombre} onChange={e => cambiarVeh(vidx, "piloto_nombre", e.target.value)} placeholder="Nombre del piloto" />
              </div>
            </div>

            {/* Costos por día */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[{ k: "costo_vehiculo", l: "Vehículo/día" }, { k: "costo_piloto", l: "Piloto/día" }, { k: "costo_hospedaje", l: "Hospedaje/día" }, { k: "costo_alimentacion", l: "Aliment./día" }].map(f => (
                <div key={f.k}>
                  <label style={{ ...S.lbl, fontSize: 9 }}>{f.l}</label>
                  <input style={{ ...inpStyle, fontSize: 11 }} type="number" step="0.01" value={veh[f.k] || ""}
                    onChange={e => cambiarVeh(vidx, f.k, parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
              ))}
            </div>

            {/* KM y combustible */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <div>
                <label style={{ ...S.lbl, fontSize: 9 }}>KM IDA</label>
                <input style={{ ...inpStyle, fontSize: 11 }} type="number" value={veh.km_ida || ""} onChange={e => cambiarVeh(vidx, "km_ida", parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              <div>
                <label style={{ ...S.lbl, fontSize: 9 }}>KM REGRESO</label>
                <input style={{ ...inpStyle, fontSize: 11 }} type="number" value={veh.km_regreso || ""} onChange={e => cambiarVeh(vidx, "km_regreso", parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              <div>
                <label style={{ ...S.lbl, fontSize: 9 }}>KM/GALÓN</label>
                <input style={{ ...inpStyle, fontSize: 11 }} type="number" value={veh.km_por_galon || ""} onChange={e => cambiarVeh(vidx, "km_por_galon", parseFloat(e.target.value) || 27)} placeholder="27" />
              </div>
              <div>
                <label style={{ ...S.lbl, fontSize: 9 }}>Q/GALÓN</label>
                <input style={{ ...inpStyle, fontSize: 11 }} type="number" step="0.01" value={veh.precio_galon || ""} onChange={e => cambiarVeh(vidx, "precio_galon", parseFloat(e.target.value) || 48)} placeholder="48" />
              </div>
            </div>

            {/* Días */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ ...S.lbl, fontSize: 9, margin: 0 }}>DÍAS DEL SERVICIO</label>
              <input style={{ ...inpStyle, width: 70, fontSize: 11 }} type="number" value={veh.dias || 1} onChange={e => cambiarVeh(vidx, "dias", parseInt(e.target.value) || 1)} placeholder="1" />
              <span style={{ fontSize: 10, color: T.mut }}>días</span>
              {(() => {
                const uniqueDates = new Set((veh.trayectos || []).map(t => t.fecha).filter(Boolean));
                if (uniqueDates.size > 1 && uniqueDates.size !== (veh.dias || 1)) {
                  return <span style={{ fontSize: 9, color: T.sec, fontStyle: "italic" }}>(según viajes: {uniqueDates.size} días)</span>;
                }
                return null;
              })()}
            </div>

            {/* TRAYECTOS */}
            <div style={{ borderTop: `1px solid ${T.bord}22`, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.acc }}>VIAJES / TRAYECTOS</span>
                <button type="button" onClick={() => agregarTrayecto(vidx)}
                  style={{ ...S.btn("primary"), padding: "3px 10px", fontSize: 10 }}>+ Agregar Viaje</button>
              </div>
              {veh.trayectos.map((t, tidx) => (
                <div key={t._id} style={{ background: T.surf, borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${T.bord}44` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.acc }}>Viaje {tidx + 1}</span>
                    {veh.trayectos.length > 1 && (
                      <button type="button" onClick={() => quitarTrayecto(vidx, tidx)}
                        style={{ ...S.btn("danger"), padding: "1px 8px", fontSize: 9, lineHeight: "18px" }}>X</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <div>
                      <label style={{ ...S.lbl, fontSize: 8 }}>FECHA</label>
                      <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} type="date" value={t.fecha} onChange={e => cambiarTrayecto(vidx, tidx, "fecha", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...S.lbl, fontSize: 8 }}>HORA SALIDA</label>
                      <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} type="time" value={t.hora_salida} onChange={e => cambiarTrayecto(vidx, tidx, "hora_salida", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...S.lbl, fontSize: 8 }}>HORA ESTIMADA</label>
                      <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} type="time" value={t.hora_estimada} onChange={e => cambiarTrayecto(vidx, tidx, "hora_estimada", e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <div>
                      <label style={{ ...S.lbl, fontSize: 8 }}>ORIGEN</label>
                      <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} value={t.origen} onChange={e => cambiarTrayecto(vidx, tidx, "origen", e.target.value)} placeholder="Ciudad / lugar" />
                    </div>
                    <div>
                      <label style={{ ...S.lbl, fontSize: 8 }}>DESTINO</label>
                      <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} value={t.destino} onChange={e => cambiarTrayecto(vidx, tidx, "destino", e.target.value)} placeholder="Ciudad / lugar" />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...S.lbl, fontSize: 8 }}>OBSERVACIONES</label>
                    <input style={{ ...inpStyle, fontSize: 10, padding: "4px 6px" }} value={t.observaciones} onChange={e => cambiarTrayecto(vidx, tidx, "observaciones", e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {vehiculos.length > 0 && (
        <button type="button" onClick={agregarVehiculo}
          style={{ ...S.btn("ghost"), fontSize: 12, padding: "10px", border: `1.5px dashed ${T.bord}` }}>
          + Agregar otro vehículo
        </button>
      )}
    </div>
  );
}

// ─── Helpers para extraer datos del itinerario ───────────────────

export function generarDescripcionDesdeItinerario(itinerario) {
  if (!itinerario?.vehiculos?.length) return "";
  const fmt = d => { try { return new Date(d + "T12:00:00").toLocaleDateString("es-GT", { day:"numeric", month:"long", year:"numeric" }); } catch { return d; } };
  const partes = [];
  for (const veh of itinerario.vehiculos) {
    const nom = veh.vehiculo_nombre || "Vehículo";
    const ts = veh.trayectos || [];
    if (ts.length === 0) continue;
    const trayectosStr = ts.map((t, i) => {
      const o = t.origen || "—";
      const d = t.destino || "—";
      const fecha = t.fecha ? fmt(t.fecha) : "";
      return `${i + 1}. ${o} → ${d}${fecha ? ` (${fecha})` : ""}`;
    }).join("; ");
    partes.push(`${nom} (piloto: ${veh.piloto_nombre || "—"}): ${trayectosStr}`);
  }
  if (partes.length === 0) return "";
  const fechas = [];
  for (const veh of itinerario.vehiculos) {
    for (const t of (veh.trayectos || [])) {
      if (t.fecha) fechas.push(t.fecha);
    }
  }
  fechas.sort();
  const periodo = fechas.length >= 2 ? `del ${fmt(fechas[0])} al ${fmt(fechas[fechas.length - 1])}` : fechas.length === 1 ? `el ${fmt(fechas[0])}` : "";
  return `Servicio de transporte con ${itinerario.vehiculos.length} vehículo(s): ${partes.join("; ")}${periodo ? ", programado " + periodo : ""}.`;
}

export function calcularTotalesItinerario(itinerario, ivaPct = 5) {
  if (!itinerario?.vehiculos?.length) return { sub: 0, iva: 0, total: 0, items: [], totalKm: 0, totalDias: 0, fechas: [], vehiculosResumen: [] };
  let sub = 0;
  let totalKm = 0;
  let maxDias = 0;
  const fechas = [];
  const items = [];
  const vehiculosResumen = [];

  for (const veh of itinerario.vehiculos) {
    const dias = parseInt(veh.dias) || 1;
    const tkm = (parseFloat(veh.km_ida) || 0) + (parseFloat(veh.km_regreso) || 0);
    const kpg = parseFloat(veh.km_por_galon) || 1;
    const pGalon = parseFloat(veh.precio_galon) || 0;
    const gals = tkm / kpg;
    const fuel = gals * pGalon;
    const vVeh = dias * (parseFloat(veh.costo_vehiculo) || 0);
    const vPil = dias * (parseFloat(veh.costo_piloto) || 0);
    const vHos = dias * (parseFloat(veh.costo_hospedaje) || 0);
    const vAli = dias * (parseFloat(veh.costo_alimentacion) || 0);
    const vSub = vVeh + vPil + vHos + vAli + fuel;

    sub += vSub;
    totalKm += tkm;
    if (dias > maxDias) maxDias = dias;
    for (const t of (veh.trayectos || [])) {
      if (t.fecha) fechas.push(t.fecha);
    }
    vehiculosResumen.push({ nombre: veh.vehiculo_nombre || "Vehículo", piloto: veh.piloto_nombre, sub: vSub, dias, km: tkm, fuel });
    items.push({ label: `${veh.vehiculo_nombre || "Vehículo"} (${dias}d)`, value: vSub });
  }

  fechas.sort();
  const iva = sub * ivaPct / 100;
  return { sub, iva, total: sub + iva, items, totalKm, totalDias: maxDias, fechas, vehiculosResumen };
}

export function itinerarioToFlat(itinerario) {
  if (!itinerario?.vehiculos?.length) return {};
  const v = itinerario.vehiculos[0];
  const ts = v.trayectos || [];
  const fechas = [];
  const uniqueDates = new Set();
  for (const veh of itinerario.vehiculos) {
    for (const t of (veh.trayectos || [])) {
      if (t.fecha) {
        fechas.push(t.fecha);
        uniqueDates.add(t.fecha);
      }
    }
  }
  fechas.sort();
  const totalKm = itinerario.vehiculos.reduce((s, v) => s + (parseFloat(v.km_ida) || 0) + (parseFloat(v.km_regreso) || 0), 0);
  const diasFromVehicles = Math.max(...itinerario.vehiculos.map(v => parseInt(v.dias) || 1), 0);
  const diasFromDates = uniqueDates.size || 1;
  const totalDias = Math.max(diasFromDates, diasFromVehicles);
  const primerTrayecto = ts[0] || {};
  const ultimoTrayecto = ts[ts.length - 1] || {};
  return {
    vehiculo_nombre: v.vehiculo_nombre || "",
    dias: totalDias,
    fecha_inicio: fechas[0] || "",
    fecha_fin: fechas[fechas.length - 1] || "",
    origen: primerTrayecto.origen || "",
    destino: ultimoTrayecto.destino || "",
    km_total: totalKm,
    costo_vehiculo: parseFloat(v.costo_vehiculo) || 0,
    costo_piloto: parseFloat(v.costo_piloto) || 0,
    costo_hospedaje: parseFloat(v.costo_hospedaje) || 0,
    costo_alimentacion: parseFloat(v.costo_alimentacion) || 0,
  };
}
