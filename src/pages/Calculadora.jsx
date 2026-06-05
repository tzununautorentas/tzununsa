import React, { useState } from 'react';
import { T, S, fmt, dbIns, dbGet, today, CATALOGO } from '../config.js';
import { Fld, BuscadorCliente } from '../components/shared.jsx';
import PlanificadorRutas from '../components/PlanificadorRutas.jsx';
import { getMuni, getDepto } from '../data/municipios.js';

const calcDias = (fi, ff) => {
  if (!fi || !ff) return 1;
  const d1 = new Date(fi + "T12:00:00");
  const d2 = new Date(ff + "T12:00:00");
  return Math.max(1, Math.ceil((d2 - d1) / 86400000));
};

export default function PageCalculadora({ showToast, empId }) {
  const [tab, setTab]       = useState("renta");
  const [cli, setCli]       = useState("");
  const [selVeh, setSelVeh] = useState(null);
  const [dias, setDias]     = useState(1);
  const [fechaInicio, setFechaInicio] = useState(today());
  const [fechaFin, setFechaFin]       = useState("");
  const [iva, setIva]       = useState(5);
  const [pago, setPago]     = useState("efectivo");
  const [conTC, setConTC]   = useState(false);
  const [exch, setExch]     = useState(7.70);
  const [saving, setSaving] = useState(false);

  const [tf, setTf] = useState({
    cliente: "", dias: 1, veh: 0, pil: 0, hos: 0, ali: 0,
    galon: 48, kpg: 27, kmi: 0, kmr: 0, varios: 0,
    iva: 5, pago: "efectivo", conTC: false, exch: 7.70, ruta: ""
  });
  const [rutaCalc, setRutaCalc] = useState(null);
  const stf = (k, v) => setTf(p => ({ ...p, [k]: v }));

  // ─ Renta ─────────────────────────────────────────────────────
  const diasCalc = fechaInicio && fechaFin ? calcDias(fechaInicio, fechaFin) : dias;
  const tarifaFn = (v, d) => {
    if (!v || d === 0) return 0;
    if (d >= 30) return v.mes;
    if (d >= 8)  return v.sem;
    return v.dia;
  };
  const rate    = selVeh ? tarifaFn(selVeh, diasCalc) : 0;
  const sub     = diasCalc * rate;
  const ivaAmt  = Math.round(sub * iva / 100 * 100) / 100;
  const base    = sub + ivaAmt;
  const recTC   = conTC ? Math.round(base * 0.05 * 100) / 100 : 0;
  const tot     = base + recTC;

  // ─ Traslado ───────────────────────────────────────────────────
  const d2   = parseFloat(tf.dias) || 0;
  const kmi  = parseFloat(tf.kmi) || 0;
  const kmr  = parseFloat(tf.kmr) || 0;
  const tkm  = kmi + kmr;
  const kpg  = parseFloat(tf.kpg) || 1;
  const gals = tkm / kpg;
  const fuel = gals * (parseFloat(tf.galon) || 0);
  const vT   = d2 * (parseFloat(tf.veh) || 0);
  const pT   = d2 * (parseFloat(tf.pil) || 0);
  const hT   = d2 * (parseFloat(tf.hos) || 0);
  const aT   = d2 * (parseFloat(tf.ali) || 0);
  const misc = parseFloat(tf.varios) || 0;
  const tsub = vT + pT + hT + aT + fuel + misc;
  const tiva = tsub * (parseFloat(tf.iva) || 0) / 100;
  const tbase = tsub + tiva;
  const ttcr  = tf.conTC ? tbase * 0.05 : 0;
  const ttot  = tbase + ttcr;

  const guardar = async (estado) => {
    const cn = tab === "renta" ? cli : tf.cliente;
    if (!cn.trim()) { showToast("Ingresa el nombre del cliente", "err"); return; }
    setSaving(true);
    const eId = empId || (await dbGet("empresas", "&select=id&limit=1").then(d => d?.[0]?.id || null));
    if (!eId) { showToast("Error: no se encontro empresa", "err"); setSaving(false); return; }
    const p = {
      empresa_id: eId, tipo: tab, cliente_nombre: cn,
      numero: "COT-" + Date.now().toString().slice(-6),
      dias: tab === "renta" ? diasCalc : d2,
      tasa_iva: tab === "renta" ? iva : parseFloat(tf.iva) || 5,
      metodo_pago: tab === "renta" ? pago : tf.pago,
      tasa_cambio: tab === "renta" ? exch : parseFloat(tf.exch) || 7.70,
      subtotal: tab === "renta" ? sub : tsub,
      total_iva: tab === "renta" ? ivaAmt : tiva,
      recargo_tarjeta: tab === "renta" ? recTC : ttcr,
      total_gtq: tab === "renta" ? tot : ttot,
      total_usd: (tab === "renta" ? tot : ttot) / (tab === "renta" ? exch : parseFloat(tf.exch) || 7.70),
      vehiculo_nombre: selVeh?.nombre || "",
      estado,
      km_total: tkm,
      costo_vehiculo: tab === "renta" ? rate : (parseFloat(tf.veh) || 0),
      costo_piloto: pT,
      costo_hospedaje: hT,
      costo_alimentacion: aT,
      precio_galon: parseFloat(tf.galon) || 0,
      km_por_galon: parseFloat(tf.kpg) || 0,
      extras: misc,
      peajes: 0,
    };
    const r = await dbIns("cotizaciones", p);
    if (r && !r.error) showToast(estado === "enviada" ? "Cotizacion guardada" : "Borrador guardado");
    else showToast("Error: " + (r?.error || "Error al guardar"), "err");
    setSaving(false);
  };

  const Row = ({ l, v, bold, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: bold ? 14 : 13, fontWeight: bold ? 700 : 400, color: color || (bold ? T.txt : T.sub) }}>
      <span>{l}</span><span>{v}</span>
    </div>
  );

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, borderBottom: `1px solid ${T.bord}`, paddingBottom: 0 }}>
        {[
          { id: "renta",    l: "Renta por dias"   },
          { id: "traslado", l: "Traslado / Viaje"  },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: tab === t.id ? T.acc : T.sub,
              borderBottom: tab === t.id ? `2px solid ${T.acc}` : "2px solid transparent" }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Formulario */}
        <div style={S.card}>
          {tab === "renta" ? (
            <div style={{ display: "grid", gap: 12 }}>
              <Fld label="CLIENTE">
                <BuscadorCliente value={cli} onChange={setCli} empId={empId} />
              </Fld>
              <Fld label="FECHA INICIO">
                <input style={S.inp} type="date" value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)} />
              </Fld>
              <Fld label="FECHA FIN">
                <input style={S.inp} type="date" value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)} />
              </Fld>
              <Fld label="DIAS">
                <div style={{ ...S.inp, background: T.card, display: "flex", alignItems: "center", fontWeight: 700, color: T.acc }}>
                  {diasCalc} dia{diasCalc !== 1 ? "s" : ""}
                </div>
              </Fld>
              <Fld label="VEHICULO">
                <select style={S.sel} value={selVeh?.id || ""} onChange={e => setSelVeh(CATALOGO.find(v => v.id === e.target.value) || null)}>
                  <option value="">Seleccionar...</option>
                  {CATALOGO.map(v => <option key={v.id} value={v.id}>{v.nombre} — Q{fmt(v.dia)}/dia</option>)}
                </select>
              </Fld>
              <Fld label="IVA">
                <select style={S.sel} value={iva} onChange={e => setIva(parseInt(e.target.value))}>
                  <option value={12}>12% Regimen General</option>
                  <option value={5}>5% Pequeno Contribuyente</option>
                  <option value={0}>Sin IVA</option>
                </select>
              </Fld>
              <Fld label="TASA DE CAMBIO (Q por $1)">
                <input style={S.inp} type="number" step="0.01" value={exch}
                  onChange={e => setExch(parseFloat(e.target.value) || 7.70)} />
              </Fld>
              <Fld label="METODO DE PAGO">
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPago("efectivo")} style={{ ...S.btn(pago === "efectivo" ? "primary" : "ghost"), flex: 1 }}>
                    Efectivo
                  </button>
                  <button onClick={() => setPago("transferencia")} style={{ ...S.btn(pago === "transferencia" ? "primary" : "ghost"), flex: 1 }}>
                    Transferencia
                  </button>
                </div>
              </Fld>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <input type="checkbox" id="conTC" checked={conTC} onChange={e => setConTC(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }} />
                <label htmlFor="conTC" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>
                  Incluir opcion pago con tarjeta (+5%)
                </label>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Fld label="CLIENTE" span2>
                <BuscadorCliente value={tf.cliente} onChange={v => stf("cliente", v)} empId={empId} />
              </Fld>
              <Fld label="RUTA" span2>
                <PlanificadorRutas value={rutaCalc} onChange={data => {
                  setRutaCalc(data);
                  if (data?.resultado) {
                    const oMuni = getMuni(parseInt(data.origen?.muni));
                    const dMuni = getMuni(parseInt(data.destino?.muni));
                    stf("dias", data.resultado.dias);
                    stf("kmi", data.resultado.km);
                    stf("kmr", data.resultado.km);
                    stf("kpg", data.kpg || 27);
                    stf("galon", data.pGalon || 48);
                    stf("ruta", `${oMuni?.nombre || "?"} → ${dMuni?.nombre || "?"}`);
                  }
                }} />
              </Fld>
              <Fld label="DIAS"><input style={S.inp} type="number" value={tf.dias} onChange={e => stf("dias", e.target.value)} /></Fld>
              <Fld label="COSTO VEHICULO/DIA"><input style={S.inp} type="number" value={tf.veh} onChange={e => stf("veh", e.target.value)} placeholder="0.00" /></Fld>
              <Fld label="COSTO PILOTO/DIA"><input style={S.inp} type="number" value={tf.pil} onChange={e => stf("pil", e.target.value)} placeholder="0.00" /></Fld>
              <Fld label="HOSPEDAJE/DIA"><input style={S.inp} type="number" value={tf.hos} onChange={e => stf("hos", e.target.value)} placeholder="0.00" /></Fld>
              <Fld label="ALIMENTACION/DIA"><input style={S.inp} type="number" value={tf.ali} onChange={e => stf("ali", e.target.value)} placeholder="0.00" /></Fld>
              <Fld label="PRECIO GALON (Q)"><input style={S.inp} type="number" value={tf.galon} onChange={e => stf("galon", e.target.value)} placeholder="48" /></Fld>
              <Fld label="KM POR GALON"><input style={S.inp} type="number" value={tf.kpg} onChange={e => stf("kpg", e.target.value)} placeholder="27" /></Fld>
              <Fld label="KM IDA"><input style={S.inp} type="number" value={tf.kmi} onChange={e => stf("kmi", e.target.value)} placeholder="0" /></Fld>
              <Fld label="KM REGRESO"><input style={S.inp} type="number" value={tf.kmr} onChange={e => stf("kmr", e.target.value)} placeholder="0" /></Fld>
              <Fld label="GASTOS VARIOS"><input style={S.inp} type="number" value={tf.varios} onChange={e => stf("varios", e.target.value)} placeholder="0.00" /></Fld>
              <Fld label="IVA">
                <select style={S.sel} value={tf.iva} onChange={e => stf("iva", e.target.value)}>
                  <option value="12">12%</option>
                  <option value="5">5%</option>
                  <option value="0">Sin IVA</option>
                </select>
              </Fld>
              <Fld label="TASA CAMBIO">
                <input style={S.inp} type="number" step="0.01" value={tf.exch} onChange={e => stf("exch", e.target.value)} />
              </Fld>
              <Fld label="METODO DE PAGO" span2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => stf("pago", "efectivo")} style={{ ...S.btn(tf.pago === "efectivo" ? "primary" : "ghost"), flex: 1 }}>Efectivo</button>
                  <button onClick={() => stf("pago", "transferencia")} style={{ ...S.btn(tf.pago === "transferencia" ? "primary" : "ghost"), flex: 1 }}>Transferencia</button>
                </div>
              </Fld>
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e => stf("conTC", e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }} />
                <label htmlFor="conTC2" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>
                  Incluir opcion pago con tarjeta (+5%)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Resumen del presupuesto</div>
            {tab === "renta" ? (
              <>
                {selVeh && <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{selVeh.nombre} · {diasCalc} dia{diasCalc !== 1 ? "s" : ""}</div>}
                <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Row l="Tarifa" v={"Q " + fmt(rate) + "/dia"} />
                  <Row l="Subtotal" v={"Q " + fmt(sub)} />
                  <Row l={`IVA ${iva}%`} v={"Q " + fmt(ivaAmt)} />
                  {conTC && <Row l="Recargo tarjeta (5%)" v={"Q " + fmt(recTC)} color={T.sec} />}
                </div>
                <div style={{ background: T.accDim, border: `1px solid ${T.acc}55`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}>
                    <span>{conTC ? "Con tarjeta" : "TOTAL"}</span>
                    <span>Q {fmt(tot)}</span>
                  </div>
                  {conTC && <div style={{ fontSize: 12, color: T.sub }}>Efectivo: Q {fmt(base)}</div>}
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>$ {fmt(exch > 0 ? tot / exch : 0)} USD</div>
                </div>
              </>
            ) : (
              <>
                {tf.ruta && <div style={{ fontSize: 12, color: T.acc, marginBottom: 8 }}>{tf.ruta} · {Math.round(tkm)} km totales</div>}
                <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <Row l={`Vehiculo (x${d2}d)`} v={"Q " + fmt(vT)} />
                  <Row l={`Piloto (x${d2}d)`} v={"Q " + fmt(pT)} />
                  <Row l={`Hospedaje (x${d2}d)`} v={"Q " + fmt(hT)} />
                  <Row l={`Aliment. (x${d2}d)`} v={"Q " + fmt(aT)} />
                  <Row l={`Combustible (${fmt(gals)} gal)`} v={"Q " + fmt(fuel)} />
                  <Row l="Varios" v={"Q " + fmt(misc)} />
                  <div style={{ borderTop: `1px solid ${T.bord}`, margin: "8px 0" }} />
                  <Row l="Subtotal" v={"Q " + fmt(tsub)} />
                  <Row l={`IVA ${tf.iva}%`} v={"Q " + fmt(tiva)} />
                  {tf.conTC && <Row l="Recargo tarjeta (5%)" v={"Q " + fmt(ttcr)} color={T.sec} />}
                </div>
                <div style={{ background: T.accDim, border: `1px solid ${T.acc}55`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: T.acc }}>
                    <span>TOTAL</span><span>Q {fmt(ttot)}</span>
                  </div>
                  {tf.conTC && <div style={{ fontSize: 12, color: T.sub }}>Sin tarjeta: Q {fmt(tbase)}</div>}
                </div>
              </>
            )}
          </div>

          <div style={S.card}>
            <button onClick={() => guardar("borrador")} disabled={saving}
              style={{ ...S.btn("ghost"), width: "100%", marginBottom: 8 }}>
              {saving ? "Guardando..." : "Guardar como borrador"}
            </button>
            <button onClick={() => guardar("enviada")} disabled={saving}
              style={{ ...S.btn("primary"), width: "100%" }}>
              {saving ? "Guardando..." : "Guardar y enviar cotizacion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
