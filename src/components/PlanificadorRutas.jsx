import React, { useState, useCallback } from 'react';
import { T, S, fmt, fmtD } from '../config.js';
import { DEPARTAMENTOS, MUNICIPIOS, munisByDepto, getDepto, getMuni } from '../data/municipios.js';
import { consultarOSRM, distanciaHaversine, calcularCombustible, estimarDias } from '../services/ruteoService.js';

export default function PlanificadorRutas({ value, onChange }) {
  const [puntos, setPuntos] = useState(value?.puntos || [{ depto: "", muni: "" }]);
  const [resultado, setResultado] = useState(value?.resultado || null);
  const [calculando, setCalculando] = useState(false);
  const [manualKm, setManualKm] = useState(value?.manualKm || "");
  const [modo, setModo] = useState(value?.modo || "auto");
  const [kpg, setKpg] = useState(value?.kpg || 27);
  const [pGalon, setPGalon] = useState(value?.pGalon || 48);

  const actualizar = (idx, campo, val) => {
    const p = [...puntos];
    p[idx] = { ...p[idx], [campo]: val };
    if (campo === "depto") p[idx].muni = "";
    setPuntos(p);
    setResultado(null);
  };

  const agregarParada = () => setPuntos(p => [...p, { depto: "", muni: "" }]);
  const quitarParada = (idx) => {
    if (puntos.length <= 2) return;
    setPuntos(p => p.filter((_, i) => i !== idx));
    setResultado(null);
  };

  const invertirRuta = () => {
    setPuntos(p => [...p].reverse());
    setResultado(null);
  };

  const calcularRuta = useCallback(async () => {
    const validos = puntos.filter(p => p.depto && p.muni);
    if (validos.length < 2) return;

    setCalculando(true);

    // Obtener coordenadas de cada punto
    const coords = validos.map(p => {
      const m = MUNICIPIOS.find(mm => mm.id === parseInt(p.muni));
      return m ? [m.lat, m.lng] : null;
    });

    if (coords.some(c => !c)) {
      setCalculando(false);
      return;
    }

    let km, minutos;
    if (modo === "auto") {
      const osrm = await consultarOSRM(coords);
      if (osrm) {
        km = osrm.km;
        minutos = osrm.minutos;
      } else {
        // Fallback a haversine si OSRM falla
        km = distanciaHaversine(coords);
        minutos = Math.round(km * 1.5 * 60 / 50); // aprox 50km/h promedio
      }
    } else {
      km = parseFloat(manualKm) || distanciaHaversine(coords);
      minutos = Math.round(km * 1.5 * 60 / 50);
    }

    const comb = calcularCombustible(km, kpg, pGalon);
    const dias = estimarDias(km);

    const res = { km, minutos, dias, ...comb };
    setResultado(res);
    setCalculando(false);

    if (onChange) {
      onChange({
        puntos: validos,
        resultado: res,
        modo,
        manualKm,
        kpg,
        pGalon,
        origen: validos[0],
        destino: validos[validos.length - 1],
        paradas: validos.slice(1, -1),
      });
    }
  }, [puntos, modo, manualKm, kpg, pGalon, onChange]);

  const primerValido = puntos.filter(p => p.depto && p.muni);
  const origenMuni = primerValido[0] ? getMuni(parseInt(primerValido[0].muni)) : null;
  const destinoMuni = primerValido[primerValido.length - 1] ? getMuni(parseInt(primerValido[primerValido.length - 1].muni)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Puntos de ruta */}
      {puntos.map((p, i) => {
        const deptosDisponibles = DEPARTAMENTOS;
        const munisDisponibles = p.depto ? munisByDepto(parseInt(p.depto)) : [];
        const esOrigen = i === 0;
        const esDestino = i === puntos.length - 1;
        const esParada = !esOrigen && !esDestino;
        return (
          <div key={i} style={{ ...S.card, padding: 12, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: esOrigen ? T.green : esDestino ? T.red : T.sec,
                color: "#fff", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {esOrigen ? "O" : esDestino ? "D" : i + 1}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>
                {esOrigen ? "Origen" : esDestino ? "Destino" : `Parada ${i}`}
              </span>
              {esParada && (
                <button onClick={() => quitarParada(i)}
                  style={{ ...S.btn("danger"), padding: "2px 6px", fontSize: 9, marginLeft: "auto" }}>
                  X
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select style={S.sel} value={p.depto} onChange={e => actualizar(i, "depto", e.target.value)}>
                <option value="">Departamento...</option>
                {deptosDisponibles.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
              <select style={S.sel} value={p.muni} onChange={e => actualizar(i, "muni", e.target.value)}
                disabled={!p.depto}>
                <option value="">Municipio...</option>
                {munisDisponibles.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={agregarParada}
          style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }}>
          + Agregar parada
        </button>
        <button onClick={invertirRuta} disabled={primerValido.length < 2}
          style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }}>
          Invertir ruta
        </button>
        <button onClick={calcularRuta} disabled={primerValido.length < 2 || calculando}
          style={{ ...S.btn("primary"), fontSize: 12, padding: "6px 16px" }}>
          {calculando ? "Calculando..." : "Calcular ruta"}
        </button>
      </div>

      {/* Modo cálculo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: T.mut }}>Modo cálculo:</span>
        <button onClick={() => setModo("auto")}
          style={{ ...S.btn(modo === "auto" ? "primary" : "ghost"), fontSize: 10, padding: "4px 10px" }}>
          Automático (OSRM)
        </button>
        <button onClick={() => setModo("manual")}
          style={{ ...S.btn(modo === "manual" ? "primary" : "ghost"), fontSize: 10, padding: "4px 10px" }}>
          Manual
        </button>
        {modo === "manual" && (
          <input style={{ ...S.inp, width: 100, fontSize: 11, padding: "4px 8px" }}
            type="number" step="0.1" value={manualKm}
            onChange={e => setManualKm(e.target.value)}
            placeholder="km manuales" />
        )}
      </div>

      {/* Parámetros combustible */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: T.mut }}>Rendimiento:</span>
        <label style={{ fontSize: 10, color: T.sub }}>
          Km/galón:
          <input style={{ ...S.inp, width: 60, fontSize: 11, padding: "4px 6px", marginLeft: 4 }}
            type="number" value={kpg} onChange={e => setKpg(e.target.value)} />
        </label>
        <label style={{ fontSize: 10, color: T.sub }}>
          Precio galón (Q):
          <input style={{ ...S.inp, width: 70, fontSize: 11, padding: "4px 6px", marginLeft: 4 }}
            type="number" step="0.01" value={pGalon} onChange={e => setPGalon(e.target.value)} />
        </label>
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{ ...S.card, background: T.accDim, border: `1px solid ${T.acc}44` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Ruta calculada</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ textAlign: "center", padding: 8, background: T.card, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: T.mut }}>Distancia</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.acc }}>{fmt(resultado.km)} km</div>
            </div>
            <div style={{ textAlign: "center", padding: 8, background: T.card, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: T.mut }}>Tiempo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.blue }}>
                {resultado.minutos >= 60
                  ? `${Math.floor(resultado.minutos / 60)}h ${resultado.minutos % 60}m`
                  : `${resultado.minutos} min`}
              </div>
            </div>
            <div style={{ textAlign: "center", padding: 8, background: T.card, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: T.mut }}>Días estimados</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{resultado.dias}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div style={{ textAlign: "center", padding: 8, background: T.card, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: T.mut }}>Combustible</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.sec }}>{fmt(resultado.galones)} gal</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Q {fmt(resultado.costo)}</div>
            </div>
          </div>
          {origenMuni && destinoMuni && (
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8, textAlign: "center" }}>
              {origenMuni.nombre} → {destinoMuni.nombre}
              {primerValido.length > 2 && ` · ${primerValido.length - 2} parada(s)`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
