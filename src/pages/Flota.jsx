import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, EST_VEH } from '../config.js';
import { Spinner, Empty, Fld } from '../components/shared.jsx';

export default function PageFlota({ showToast, empId }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista]     = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [f, setF] = useState({
    codigo: "", propietario: "propio", placa: "", marca: "", modelo: "",
    anio: new Date().getFullYear(), tipo: "SUV", estado: "disponible", km_actual: 0,
    color: "", vin: "", poliza_seguro: "", vencimiento_seguro: "", notas: ""
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const TIPOS = ["Sedan", "SUV", "Pickup", "Van", "Microbus", "Bus"];

  const load = async () => {
    setLoading(true);
    const d = await dbGet("vehiculos", "");
    const arr = Array.isArray(d) ? d : [];
    const PRIO = { propio: 0, socio: 1, alquilado: 2 };
    arr.sort((a, b) => {
      const pa = PRIO[a.propietario] ?? 9;
      const pb = PRIO[b.propietario] ?? 9;
      if (pa !== pb) return pa - pb;
      const ca = (a.codigo || "").match(/\d+/)?.[0] || "999999";
      const cb = (b.codigo || "").match(/\d+/)?.[0] || "999999";
      return parseInt(ca) - parseInt(cb);
    });
    setRows(arr);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const SFX = { propio: "P", socio: "A", alquilado: "R" };

  const genCodigoVehiculo = (propietario) => {
    const sfx = SFX[propietario] || "F";
    let max = 0;
    rows.filter(r => (r.codigo || "").endsWith(sfx)).forEach(r => {
      const m = (r.codigo || "").match(/^(\d+)/);
      if (m) { const n = parseInt(m[1]); if (n > max) max = n; }
    });
    return String(max + 1).padStart(3, "0") + sfx;
  };

  const abrirEditar = v => {
    setF({
      codigo: v.codigo || '', propietario: v.propietario || 'propio',
      placa: v.placa || '', marca: v.marca || '', modelo: v.modelo || '',
      anio: v.anio || new Date().getFullYear(), tipo: v.tipo || 'SUV',
      estado: v.estado || 'disponible', km_actual: v.km_actual || 0,
      color: v.color || '', vin: v.vin || '',
      poliza_seguro: v.poliza_seguro || '', vencimiento_seguro: v.vencimiento_seguro || '',
      notas: v.notas || ''
    });
    setEditItem(v); setVista("form");
  };

  const abrirNuevo = () => {
    setF({ codigo: genCodigoVehiculo('propio'), propietario: 'propio', placa: '', marca: '', modelo: '',
      anio: new Date().getFullYear(), tipo: 'SUV', estado: 'disponible', km_actual: 0,
      color: '', vin: '', poliza_seguro: '', vencimiento_seguro: '', notas: '' });
    setEditItem(null); setVista("form");
  };

  const guardar = async () => {
    if (!f.placa.trim()) { showToast("Placa requerida", "err"); return; }
    setSaving(true);
    const payload = { empresa_id: empId, codigo: f.codigo, propietario: f.propietario, placa: f.placa, marca: f.marca, modelo: f.modelo, tipo: f.tipo, color: f.color, estado: f.estado, anio: parseInt(f.anio) || new Date().getFullYear(), km_actual: parseInt(f.km_actual) || 0, vin: f.vin, poliza_seguro: f.poliza_seguro, vencimiento_seguro: f.vencimiento_seguro || null, notas: f.notas };
    let res;
    if (editItem?.id) res = await dbUpd("vehiculos", editItem.id, payload);
    else res = await dbIns("vehiculos", payload);
    if (res?.error) { showToast(res.error, "err"); setSaving(false); return; }
    showToast("Guardado"); setSaving(false); setVista("lista"); setEditItem(null); load();
  };

  const del = async id => {
    if (!confirm("Eliminar vehiculo?")) return;
    await dbDel("vehiculos", id); showToast("Eliminado"); load();
  };

  const chEst = async (id, estado) => {
    await dbUpd("vehiculos", id, { estado });
    showToast("Estado actualizado"); load();
  };

  const PROP = { propio: "Propio (P)", socio: "Socio (A)", alquilado: "Alquilado" };
  const disp = rows.filter(r => r.estado === "disponible").length;
  const rent = rows.filter(r => r.estado === "rentado").length;
  const mant = rows.filter(r => r.estado === "mantenimiento").length;

  if (vista === "form") return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.acc }}>
          {editItem ? "Editar vehiculo" : "Registrar vehiculo"}
        </div>
        <button onClick={() => { setVista("lista"); setEditItem(null); }} style={S.btn("ghost")}>
          Volver
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "span 2", fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1 }}>
            IDENTIFICACION
          </div>
          <Fld label="CODIGO VEHICULO">
            <input style={{ ...S.inp, fontFamily: "monospace", fontWeight: 700 }}
              value={f.codigo} onChange={e => sf("codigo", e.target.value.toUpperCase())}
              placeholder="001F" />
          </Fld>
          <Fld label="PROPIETARIO">
            <select style={S.sel} value={f.propietario}
              onChange={e => { const p = e.target.value; sf("propietario", p); if (!editItem) sf("codigo", genCodigoVehiculo(p)); }}>
              <option value="propio">Propio (P)</option>
              <option value="socio">Socio (A)</option>
              <option value="alquilado">Alquilado (R)</option>
            </select>
          </Fld>
          <Fld label="PLACA *">
            <input style={S.inp} value={f.placa}
              onChange={e => sf("placa", e.target.value.toUpperCase())} placeholder="P-000-ABC" />
          </Fld>
          <Fld label="ANIO">
            <input style={S.inp} type="number" value={f.anio} onChange={e => sf("anio", e.target.value)} />
          </Fld>
          <Fld label="MARCA">
            <input style={S.inp} value={f.marca} onChange={e => sf("marca", e.target.value)} placeholder="Toyota" />
          </Fld>
          <Fld label="MODELO">
            <input style={S.inp} value={f.modelo} onChange={e => sf("modelo", e.target.value)} placeholder="RAV4" />
          </Fld>
          <Fld label="TIPO">
            <select style={S.sel} value={f.tipo} onChange={e => sf("tipo", e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Fld>
          <Fld label="COLOR">
            <input style={S.inp} value={f.color} onChange={e => sf("color", e.target.value)} placeholder="Blanco" />
          </Fld>
          <Fld label="ESTADO">
            <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="rentado">Rentado</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </Fld>
          <Fld label="KM ACTUAL">
            <input style={S.inp} type="number" value={f.km_actual}
              onChange={e => sf("km_actual", e.target.value)} placeholder="0" />
          </Fld>
        </div>

        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "span 2", fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1 }}>
            SEGURO Y DOCUMENTOS
          </div>
          <Fld label="VIN / CHASIS">
            <input style={S.inp} value={f.vin} onChange={e => sf("vin", e.target.value)} placeholder="Numero de chasis" />
          </Fld>
          <Fld label="NO. POLIZA SEGURO">
            <input style={S.inp} value={f.poliza_seguro} onChange={e => sf("poliza_seguro", e.target.value)} />
          </Fld>
          <Fld label="VENCIMIENTO SEGURO">
            <input style={S.inp} type="date" value={f.vencimiento_seguro} onChange={e => sf("vencimiento_seguro", e.target.value)} />
          </Fld>
          <Fld label="NOTAS">
            <input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
          </Fld>
          <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
            <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex: 2 }}>
              {saving ? "Guardando..." : "Guardar vehiculo"}
            </button>
            <button onClick={() => { setVista("lista"); setEditItem(null); }} style={{ ...S.btn("ghost"), flex: 1 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { l: "Disponibles",   v: disp, c: T.acc,  bg: T.accDim  },
          { l: "Rentados",      v: rent, c: T.blue,  bg: T.blueDim },
          { l: "Mantenimiento", v: mant, c: T.sec,   bg: T.secDim  },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.c}44`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Flota ({rows.length} vehiculos)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 12 }}>Actualizar</button>
          <button onClick={abrirNuevo} style={{ ...S.btn("primary"), fontSize: 12 }}>+ Registrar vehiculo</button>
        </div>
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty icon="V" msg="Sin vehiculos registrados" action="+ Registrar" onAction={abrirNuevo} />
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Codigo", "Vehiculo", "Placa", "Tipo", "Propietario", "Km", "Estado", "Cambiar estado", ""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(v => {
                const e = EST_VEH[v.estado] || EST_VEH.disponible;
                const segVenc = v.vencimiento_seguro && new Date(v.vencimiento_seguro) < new Date();
                return (
                  <tr key={v.id}>
                    <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 12 }}>
                      {v.codigo || "—"}
                      {v.propietario && <div style={{ fontSize: 9, color: T.mut }}>{PROP[v.propietario] || v.propietario}</div>}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>
                      {v.marca} {v.modelo}
                      {v.anio && <div style={{ fontSize: 10, color: T.mut }}>{v.anio} {v.color ? `· ${v.color}` : ''}</div>}
                    </td>
                    <td style={{ ...S.td, fontFamily: "monospace", color: T.sub, fontSize: 11 }}>{v.placa}</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={{ ...S.td, fontSize: 11 }}>
                      <span style={{ padding: "2px 7px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                        background: v.propietario === "propio" ? T.accDim : v.propietario === "socio" ? T.blueDim : T.secDim,
                        color: v.propietario === "propio" ? T.acc : v.propietario === "socio" ? T.blue : T.sec }}>
                        {PROP[v.propietario] || v.propietario || "—"}
                      </span>
                    </td>
                    <td style={S.td}>{(v.km_actual || 0).toLocaleString()} km</td>
                    <td style={S.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, color: e.c, background: e.bg }}>
                        {e.l}
                      </span>
                      {segVenc && <div style={{ fontSize: 9, color: T.red, marginTop: 2 }}>Seguro vencido</div>}
                    </td>
                    <td style={S.td}>
                      <select style={{ ...S.sel, padding: "4px 8px", fontSize: 11, width: "auto" }}
                        value={v.estado} onChange={ev => chEst(v.id, ev.target.value)}>
                        <option value="disponible">Disponible</option>
                        <option value="rentado">Rentado</option>
                        <option value="mantenimiento">Mantenimiento</option>
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => abrirEditar(v)} style={{ ...S.btn("ghost"), padding: "3px 9px", fontSize: 11 }}>
                          Editar
                        </button>
                        <button onClick={() => del(v.id)} style={{ ...S.btn("danger"), padding: "3px 9px", fontSize: 11 }}>
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
