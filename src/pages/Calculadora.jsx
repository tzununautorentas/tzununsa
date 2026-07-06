import React, { useState, useEffect } from 'react';
import { T, S, fmt, dbIns, dbGet, today, CATALOGO, siguienteNumero } from '../config.js';
import { Fld, BuscadorCliente } from '../components/shared.jsx';
import PlanificadorRutas from '../components/PlanificadorRutas.jsx';
import ItinerarioServicio, { generarDescripcionDesdeItinerario, calcularTotalesItinerario, itinerarioToFlat } from '../components/ItinerarioServicio.jsx';

const calcDias = (fi, ff) => {
  if (!fi || !ff) return 1;
  const d1 = new Date(fi + "T12:00:00");
  const d2 = new Date(ff + "T12:00:00");
  const diff = Math.floor((d2 - d1) / 86400000) + 1;
  return Math.max(1, diff);
};

const generarSaludo = (tipo, nombre) => {
  const nom = nombre || "";
  switch (tipo) {
    case 'persona':
      const pn = nom.trim().split(/\s+/)[0] || "";
      return (pn.endsWith("a") ? "Estimada " : "Estimado ") + nom + ": Agradecemos su confianza en Transportes Tz'unun. Nos complace presentar la siguiente propuesta de servicio elaborada conforme a su requerimiento.";
    case 'empresa':
      return "Estimados representantes de " + nom + ": Reciban un cordial saludo de Transportes Tz'unun. Agradecemos la oportunidad de presentar nuestra propuesta de movilidad y log\u00edstica para el servicio solicitado.";
    case 'gobierno':
      return "Distinguidos representantes de " + nom + ": Reciban un cordial saludo de Transportes Tz'unun. Agradecemos la oportunidad de presentar nuestra propuesta de servicios de transporte institucional.";
    case 'ong':
      return "Estimados representantes de " + nom + ": Reciban un cordial saludo de Transportes Tz'unun. Agradecemos la oportunidad de presentar nuestra propuesta de movilidad y log\u00edstica para el servicio solicitado.";
    default:
      return "Estimados se\u00f1ores de " + nom + ": Reciban un cordial saludo de Transportes Tz'unun. Nos complace presentar nuestra propuesta de servicios de movilidad corporativa.";
  }
};

export default function PageCalculadora({ showToast, empId }) {
  const [tab, setTab]       = useState("renta");
  const [cli, setCli]       = useState("");
  const [clienteNit, setClienteNit]   = useState("");
  const [clienteDir, setClienteDir]   = useState("");
  const [clienteCodigo, setClienteCodigo] = useState("");
  const [saludo, setSaludo] = useState("");
  const [clienteTipo, setClienteTipo] = useState("");
  const [clienteContacto, setClienteContacto] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [selVeh, setSelVeh] = useState("");
  const [dias, setDias]     = useState(1);
  const [fechaInicio, setFechaInicio] = useState(today());
  const [fechaFin, setFechaFin]       = useState("");
  const [iva, setIva]       = useState(5);
  const [pago, setPago]     = useState("efectivo");
  const [conTC, setConTC]   = useState(false);
  const [exch, setExch]     = useState(7.70);
  const [origenRenta, setOrigenRenta] = useState("");
  const [destinoRenta, setDestinoRenta] = useState("");
  const [flotaVehiculos, setFlotaVehiculos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await dbGet("vehiculos", "&select=marca,modelo,tarifa_dia,tarifa_semana,tarifa_mes,capacidad,transmision,aire_acondicionado,combustible,capacidad_equipaje,traccion,foto_url&estado=eq.disponible&limit=100");
        if (res) setFlotaVehiculos(res);
      } catch {}
    })();
  }, []);

  const [tf, setTf] = useState({
    cliente: "", clienteNit: "", clienteDir: "", clienteCodigo: "",
    clienteTipo: "", clienteContacto: "", clienteEmail: "", clienteTelefono: "",
    saludo: "",
    dias: 1, veh: 0, vehiculoId: "", vehiculoNombre: "", pil: 0, hos: 0, ali: 0,
    galon: 48, kpg: 27, kmi: 0, kmr: 0, varios: 0,
    iva: 5, pago: "efectivo", conTC: false, exch: 7.70, ruta: "",
    fechaInicio: today(), fechaFin: today(),
    origen: "", destino: "", observaciones_ruta: "",
    carta_poder: false, carta_poder_costo: 0,
    itinerario: { vehiculos: [] },
    descripcion_servicio: "",
  });
  const [rutaCalc, setRutaCalc] = useState(null);
  const stf = (k, v) => setTf(p => ({ ...p, [k]: v }));

  const seleccionarClienteRenta = (c) => {
    setCli(c.nombre);
    setClienteNit(c.nit || '');
    setClienteDir(c.direccion || '');
    setClienteCodigo(c.codigo || '');
    setClienteTipo(c.tipo || '');
    setClienteContacto(c.contacto || '');
    setClienteEmail(c.email || '');
    setClienteTelefono(c.telefono || '');
    setSaludo(generarSaludo(c.tipo, c.nombre));
  };

  const seleccionarClienteTraslado = (c) => {
    stf("cliente", c.nombre);
    stf("clienteNit", c.nit || '');
    stf("clienteDir", c.direccion || '');
    stf("clienteCodigo", c.codigo || '');
    stf("clienteTipo", c.tipo || '');
    stf("clienteContacto", c.contacto || '');
    stf("clienteEmail", c.email || '');
    stf("clienteTelefono", c.telefono || '');
    stf("saludo", generarSaludo(c.tipo, c.nombre));
  };

  // ─ Renta ─────────────────────────────────────────────────────
  const diasCalc = fechaInicio && fechaFin ? calcDias(fechaInicio, fechaFin) : dias;
  const tarifaFn = (v, d) => {
    if (!v || d === 0) return 0;
    if (d >= 30) return v.mes;
    if (d >= 8)  return v.sem;
    return v.dia;
  };
  const vehSeleccionado = (() => {
    if (!selVeh) return null;
    const c = CATALOGO.find(v => v.nombre === selVeh);
    if (c) return c;
    const f = flotaVehiculos.find(v => `${v.marca||""} ${v.modelo||""}`.trim() === selVeh);
    if (f && parseFloat(f.tarifa_dia) > 0) return { ...f, dia: parseFloat(f.tarifa_dia), sem: parseFloat(f.tarifa_semana)||parseFloat(f.tarifa_dia), mes: parseFloat(f.tarifa_mes)||parseFloat(f.tarifa_dia) };
    return null;
  })();
  const rate    = vehSeleccionado ? tarifaFn(vehSeleccionado, diasCalc) : 0;
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
  const cpCost = tf.carta_poder ? (parseFloat(tf.carta_poder_costo) || 0) : 0;
  const tsub = vT + pT + hT + aT + fuel + misc + cpCost;
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
    const fi = tab === "renta" ? fechaInicio : tf.fechaInicio;
    const ff = tab === "renta" ? fechaFin : tf.fechaFin;
    const orig = tab === "renta" ? origenRenta : tf.origen;
    const dest = tab === "renta" ? destinoRenta : tf.destino;
    const vehName = tab === "renta" ? (selVeh || "") : tf.vehiculoNombre;
    const fmtDate = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("es-GT", { day:"numeric", month:"long", year:"numeric" }); } catch { return s; } };
    let descripcion_servicio = "";
    if (tab === "renta") {
      descripcion_servicio = `Renta de vehículo${vehName ? " " + vehName : ""} por el período comprendido del ${fi ? fmtDate(fi) : "—"} al ${ff ? fmtDate(ff) : "—"}, por un total de ${diasCalc} día(s) de servicio.`;
    } else {
      descripcion_servicio = tf.descripcion_servicio || generarDescripcionDesdeItinerario(tf.itinerario) || `Traslado desde ${orig || "—"} hacia ${dest || "—"}, programado del ${fi ? fmtDate(fi) : "—"} al ${ff ? fmtDate(ff) : "—"} por ${d2} día(s) de servicio.`;
    }
    const p = {
      empresa_id: eId, tipo: tab, cliente_nombre: cn,
      cliente_nit: tab === "renta" ? clienteNit : tf.clienteNit,
      cliente_dir: tab === "renta" ? clienteDir : tf.clienteDir,
      cliente_codigo: tab === "renta" ? clienteCodigo : tf.clienteCodigo,
      cliente_tipo: tab === "renta" ? clienteTipo : tf.clienteTipo,
      cliente_contacto: tab === "renta" ? clienteContacto : tf.clienteContacto,
      cliente_email: tab === "renta" ? clienteEmail : tf.clienteEmail,
      cliente_telefono: tab === "renta" ? clienteTelefono : tf.clienteTelefono,
      saludo: tab === "renta" ? saludo : tf.saludo,
      descripcion_servicio,
      fecha_inicio: fi, fecha_fin: ff,
      origen: orig, destino: dest, ruta: tab === "renta" ? "" : tf.ruta,
      observaciones_ruta: tab === "renta" ? "" : tf.observaciones_ruta,
      version: 1,
      numero: await siguienteNumero("COT-", "cotizaciones", empId),
      dias: tab === "renta" ? diasCalc : d2,
      tasa_iva: tab === "renta" ? iva : parseFloat(tf.iva) || 5,
      metodo_pago: tab === "renta" ? pago : tf.pago,
      tasa_cambio: tab === "renta" ? exch : parseFloat(tf.exch) || 7.70,
      subtotal: tab === "renta" ? sub : tsub,
      total_iva: tab === "renta" ? ivaAmt : tiva,
      recargo_tarjeta: tab === "renta" ? recTC : ttcr,
      total_gtq: tab === "renta" ? tot : ttot,
      total_usd: (tab === "renta" ? tot : ttot) / (tab === "renta" ? exch : parseFloat(tf.exch) || 7.70),
      vehiculo_nombre: vehName,
      estado,
      km_total: tkm,
      costo_vehiculo: tab === "renta" ? rate : (parseFloat(tf.veh) || 0),
      costo_piloto: pT, costo_hospedaje: hT, costo_alimentacion: aT,
      precio_galon: parseFloat(tf.galon) || 0,
      km_por_galon: parseFloat(tf.kpg) || 0,
      extras: misc, peajes: 0,
      carta_poder: tab === "renta" ? false : tf.carta_poder,
      carta_poder_costo: tab === "renta" ? 0 : cpCost,
      itinerario: tab === "renta" ? "" : JSON.stringify(tf.itinerario),
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
                <BuscadorCliente value={cli} onChange={setCli} onSelect={seleccionarClienteRenta} empId={empId} />
              </Fld>
              {clienteCodigo && <Fld label="CODIGO">
                <div style={{ ...S.inp, background: T.card }}>{clienteCodigo}</div>
              </Fld>}
              <Fld label="NIT">
                <input style={S.inp} value={clienteNit} onChange={e => setClienteNit(e.target.value)} placeholder="NIT del cliente" />
              </Fld>
              <Fld label="DIRECCION">
                <input style={S.inp} value={clienteDir} onChange={e => setClienteDir(e.target.value)} placeholder="Direccion del cliente" />
              </Fld>
              <Fld label="SALUDO PERSONALIZADO">
                <textarea style={{ ...S.inp, minHeight: 60, fontSize: 12 }} value={saludo}
                  onChange={e => setSaludo(e.target.value)} placeholder="Ej: Estimado cliente..." />
              </Fld>
              <Fld label="ORIGEN">
                <input style={S.inp} value={origenRenta} onChange={e => setOrigenRenta(e.target.value)} placeholder="Ciudad de origen" />
              </Fld>
              <Fld label="DESTINO">
                <input style={S.inp} value={destinoRenta} onChange={e => setDestinoRenta(e.target.value)} placeholder="Ciudad de destino" />
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
                <select style={S.sel} value={selVeh} onChange={e => setSelVeh(e.target.value)}>
                  <option value="">Seleccionar...</option>
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <input type="checkbox" id="cartaPoderR" checked={false} disabled
                  style={{ width: 18, height: 18, cursor: "not-allowed", opacity: 0.5 }} />
                <label htmlFor="cartaPoderR" style={{ fontSize: 13, color: T.mut, cursor: "not-allowed" }}>
                  Requiere Carta Poder (solo traslados)
                </label>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Fld label="CLIENTE" span2>
                  <BuscadorCliente value={tf.cliente} onChange={v => stf("cliente", v)} onSelect={seleccionarClienteTraslado} empId={empId} />
                </Fld>
                {tf.clienteCodigo && <Fld label="CODIGO" span2>
                  <div style={{ ...S.inp, background: T.card }}>{tf.clienteCodigo}</div>
                </Fld>}
                <Fld label="NIT" span2>
                  <input style={S.inp} value={tf.clienteNit} onChange={e => stf("clienteNit", e.target.value)} placeholder="NIT del cliente" />
                </Fld>
                <Fld label="SALUDO PERSONALIZADO" span2>
                  <input style={S.inp} value={tf.saludo} onChange={e => stf("saludo", e.target.value)} placeholder="Estimados..." />
                </Fld>
              </div>

              <div style={{ background: T.surf, borderRadius: 10, padding: 12, border: `1px solid ${T.bord}44` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 10, letterSpacing: 0.5 }}>PLANIFICADOR DE RUTAS</div>
                <PlanificadorRutas value={rutaCalc} empId={empId} onChange={r => {
                  setRutaCalc(r);
                  if (r?.puntos?.length >= 2) {
                    const primerOri = r.puntos[0];
                    const ultimoDest = r.puntos[r.puntos.length - 1];
                    const kmTotal = r.resultado?.km || 0;
                    const diasEst = r.resultado?.dias || 1;
                    stf("origen", primerOri?.nombre || "");
                    stf("destino", ultimoDest?.nombre || "");
                    stf("kmi", kmTotal);
                    stf("kmr", kmTotal);
                    if (diasEst > 1) stf("dias", diasEst);
                    const it = tf.itinerario?.vehiculos?.length > 0 ? { ...tf.itinerario } : { vehiculos: [] };
                    if (it.vehiculos.length === 0) {
                      it.vehiculos.push({
                        _id: 0, vehiculo: "", piloto: "", costo_vehiculo: 0, costo_piloto: 0,
                        costo_hospedaje: 0, costo_alimentacion: 0, km_ida: kmTotal, km_regreso: kmTotal,
                        km_por_galon: 1, precio_galon: 0, trayectos: [],
                      });
                    } else {
                      it.vehiculos[0].km_ida = kmTotal;
                      it.vehiculos[0].km_regreso = kmTotal;
                    }
                    stf("itinerario", it);
                  }
                }} />
              </div>

              <div style={{ background: T.surf, borderRadius: 10, padding: 12, border: `1px solid ${T.bord}44` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 10, letterSpacing: 0.5 }}>VEHÍCULOS E ITINERARIO</div>
                <ItinerarioServicio value={tf.itinerario} flotaVehiculos={flotaVehiculos} onChange={it => {
                  stf("itinerario", it);
                  const flat = itinerarioToFlat(it);
                  if (flat.dias) stf("dias", flat.dias);
                  if (flat.vehiculo_nombre) stf("vehiculoNombre", flat.vehiculo_nombre);
                  if (flat.fecha_inicio) stf("fechaInicio", flat.fecha_inicio);
                  if (flat.fecha_fin) stf("fechaFin", flat.fecha_fin);
                  if (flat.origen) stf("origen", flat.origen);
                  if (flat.destino) stf("destino", flat.destino);
                  stf("kmi", flat.km_total || 0);
                  stf("kmr", flat.km_total || 0);
                  stf("veh", flat.costo_vehiculo || 0);
                  stf("pil", flat.costo_piloto || 0);
                  stf("hos", flat.costo_hospedaje || 0);
                  stf("ali", flat.costo_alimentacion || 0);
                  const desc = generarDescripcionDesdeItinerario(it);
                  if (desc) stf("descripcion_servicio", desc);
                }} />
              </div>

              <div style={{ background: T.surf, borderRadius: 10, padding: 12, border: `1px solid ${T.bord}44` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.acc, marginBottom: 10, letterSpacing: 0.5 }}>DESGLOSE DE COSTOS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Fld label="Vehículo (Q/día)">
                    <input style={S.inp} type="number" step="0.01" value={tf.veh} onChange={e => stf("veh", e.target.value)} placeholder="0.00" />
                  </Fld>
                  <Fld label="Piloto (Q/día)">
                    <input style={S.inp} type="number" step="0.01" value={tf.pil} onChange={e => stf("pil", e.target.value)} placeholder="0.00" />
                  </Fld>
                  <Fld label="Hospedaje (Q/día)">
                    <input style={S.inp} type="number" step="0.01" value={tf.hos} onChange={e => stf("hos", e.target.value)} placeholder="0.00" />
                  </Fld>
                  <Fld label="Alimentación (Q/día)">
                    <input style={S.inp} type="number" step="0.01" value={tf.ali} onChange={e => stf("ali", e.target.value)} placeholder="0.00" />
                  </Fld>
                  <Fld label="Varios (Q)">
                    <input style={S.inp} type="number" step="0.01" value={tf.varios} onChange={e => stf("varios", e.target.value)} placeholder="0.00" />
                  </Fld>
                  <Fld label="Combustible — Km/Galón">
                    <input style={S.inp} type="number" step="0.1" value={tf.kpg} onChange={e => stf("kpg", e.target.value)} placeholder="27" />
                  </Fld>
                  <Fld label="Precio Galón (Q)">
                    <input style={S.inp} type="number" step="0.01" value={tf.galon} onChange={e => stf("galon", e.target.value)} placeholder="48" />
                  </Fld>
                  <Fld label="Km Ida">
                    <input style={S.inp} type="number" step="0.1" value={tf.kmi} onChange={e => stf("kmi", e.target.value)} placeholder="0" />
                  </Fld>
                  <Fld label="Km Regreso">
                    <input style={S.inp} type="number" step="0.1" value={tf.kmr} onChange={e => stf("kmr", e.target.value)} placeholder="0" />
                  </Fld>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Fld label="DESCRIPCIÓN DEL SERVICIO" span2>
                  <textarea style={{ ...S.inp, minHeight: 50, fontSize: 11, resize: "vertical" }} value={tf.descripcion_servicio}
                    onChange={e => stf("descripcion_servicio", e.target.value)} placeholder="Se generará automáticamente..." />
                </Fld>
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
                <Fld label="MÉTODO DE PAGO" span2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => stf("pago", "efectivo")} style={{ ...S.btn(tf.pago === "efectivo" ? "primary" : "ghost"), flex: 1 }}>Efectivo</button>
                    <button onClick={() => stf("pago", "transferencia")} style={{ ...S.btn(tf.pago === "transferencia" ? "primary" : "ghost"), flex: 1 }}>Transferencia</button>
                  </div>
                </Fld>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <input type="checkbox" id="conTC2" checked={tf.conTC} onChange={e => stf("conTC", e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }} />
                  <label htmlFor="conTC2" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>
                    Incluir opcion pago con tarjeta (+5%)
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", flexWrap: "wrap" }}>
                  <input type="checkbox" id="cartaPoderT" checked={tf.carta_poder} onChange={e => stf("carta_poder", e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }} />
                  <label htmlFor="cartaPoderT" style={{ fontSize: 13, color: T.sub, cursor: "pointer" }}>
                    Requiere Carta Poder (viaje internacional)
                  </label>
                  {tf.carta_poder && (
                    <input style={{ ...S.inp, width: 130, marginLeft: 8, fontSize: 11 }} type="number" step="0.01"
                      value={tf.carta_poder_costo} onChange={e => stf("carta_poder_costo", e.target.value)}
                      placeholder="Costo Q" />
                  )}
                </div>
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
                {(() => {
                  const tot = calcularTotalesItinerario(tf.itinerario, parseFloat(tf.iva) || 5);
                  const tieneItin = tot.vehiculosResumen.length > 0;
                  return (
                    <>
                      {tieneItin ? (
                        <>
                          {tot.vehiculosResumen.map((vr, i) => (
                            <div key={i} style={{ fontSize: 11, color: T.acc, marginBottom: 4, fontWeight: 600 }}>
                              {vr.nombre}{vr.piloto ? ` (piloto: ${vr.piloto})` : ""} — {vr.dias}d · {fmt(vr.km)} km · Q{fmt(vr.sub)}
                            </div>
                          ))}
                          <div style={{ fontSize: 10, color: T.mut, marginBottom: 8 }}>{Math.round(tot.totalKm)} km totales</div>
                        </>
                      ) : (
                        tf.ruta && <div style={{ fontSize: 12, color: T.acc, marginBottom: 8 }}>{tf.ruta} · {Math.round(tkm)} km totales</div>
                      )}
                      <div style={{ background: T.surf, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                        {tieneItin ? tot.items.map((item, i) => (
                          <Row key={i} l={item.label} v={"Q " + fmt(item.value)} />
                        )) : (
                          <>
                            <Row l={`Vehiculo (x${d2}d)`} v={"Q " + fmt(vT)} />
                            <Row l={`Piloto (x${d2}d)`} v={"Q " + fmt(pT)} />
                            <Row l={`Hospedaje (x${d2}d)`} v={"Q " + fmt(hT)} />
                            <Row l={`Aliment. (x${d2}d)`} v={"Q " + fmt(aT)} />
                            <Row l={`Combustible (${fmt(gals)} gal)`} v={"Q " + fmt(fuel)} />
                          </>
                        )}
                        {tf.carta_poder && <Row l="Carta Poder" v={"Q " + fmt(cpCost)} />}
                        <Row l="Varios" v={"Q " + fmt(misc)} />
                        <div style={{ borderTop: `1px solid ${T.bord}`, margin: "8px 0" }} />
                        <Row l="Subtotal" v={"Q " + fmt(tsub)} bold />
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
                  );
                })()}
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
