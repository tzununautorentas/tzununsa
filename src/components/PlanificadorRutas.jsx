import React, { useState, useCallback, useRef } from 'react';
import { T, S, fmt } from '../config.js';
import { DEPARTAMENTOS, MUNICIPIOS, munisByDepto, getMuni } from '../data/municipios.js';
import { consultarOSRM, distanciaHaversine, calcularCombustible, estimarDias, geocodificar, MI_UBICACION } from '../services/ruteoService.js';

const TIPOS_PUNTO = [
  { v: "municipio", l: "Municipio" },
  { v: "direccion", l: "Dirección o lugar" },
  { v: "mi_ubicacion", l: "Mi ubicación" },
];

function PuntoSelector({ idx, punto, onChange, onRemove, esOrigen, esDestino, esUnico }) {
  const [buscando, setBuscando] = useState(false);
  const [sugs, setSugs] = useState(null);
  const [showSugs, setShowSugs] = useState(false);
  const refSugs = useRef(null);

  const cambiar = (campo, val) => onChange(idx, { ...punto, [campo]: val });

  const buscarDireccion = async (q) => {
    if (!q?.trim()) { setSugs(null); return; }
    setBuscando(true);
    const r = await geocodificar(q + ", Guatemala");
    setSugs(r);
    setShowSugs(true);
    setBuscando(false);
  };

  const seleccionarSug = (s) => {
    cambiar("tipo", "direccion");
    cambiar("direccion", s.direccion);
    cambiar("nombre", s.nombre);
    cambiar("lat", s.lat);
    cambiar("lng", s.lng);
    setShowSugs(false);
  };

  let latLngLabel = "";
  if (punto.lat && punto.lng) latLngLabel = `${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}`;

  const munisDisponibles = punto.depto ? munisByDepto(parseInt(punto.depto)) : [];

  return (
    <div style={{ ...S.card, padding: 12, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: esOrigen ? T.green : esDestino ? T.red : T.sec,
          color: "#fff", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {esOrigen ? "O" : esDestino ? "D" : idx + 1}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.txt, flex: 1 }}>
          {esOrigen ? "Origen" : esDestino ? "Destino" : `Parada ${idx}`}
        </span>
        {punto.nombre && <span style={{ fontSize: 10, color: T.acc }}>{punto.nombre}</span>}
        {latLngLabel && <span style={{ fontSize: 9, color: T.mut, fontFamily: 'monospace' }}>{latLngLabel}</span>}
        {!esOrigen && !esDestino && (
          <button onClick={() => onRemove(idx)}
            style={{ ...S.btn("danger"), padding: "2px 6px", fontSize: 9 }}>X</button>
        )}
      </div>

      {/* Tipo de punto */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {TIPOS_PUNTO.map(tp => (
          <button key={tp.v} onClick={() => cambiar("tipo", tp.v)}
            style={{
              ...S.btn(punto.tipo === tp.v ? "primary" : "ghost"),
              fontSize: 9, padding: "3px 8px",
            }}>
            {tp.l}
          </button>
        ))}
      </div>

      {/* Municipio */}
      {punto.tipo === "municipio" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select style={S.sel} value={punto.depto} onChange={e => {
            cambiar("depto", e.target.value);
            cambiar("muni", "");
            cambiar("nombre", "");
            cambiar("lat", null);
            cambiar("lng", null);
          }}>
            <option value="">Departamento...</option>
            {DEPARTAMENTOS.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          <select style={S.sel} value={punto.muni} onChange={e => {
            const m = getMuni(parseInt(e.target.value));
            cambiar("muni", e.target.value);
            cambiar("nombre", m?.nombre || "");
            cambiar("lat", m?.lat || null);
            cambiar("lng", m?.lng || null);
          }} disabled={!punto.depto}>
            <option value="">Municipio...</option>
            {munisDisponibles.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Dirección personalizada */}
      {punto.tipo === "direccion" && (
        <div ref={refSugs} style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={S.inp} value={punto.direccion || ""}
              onChange={e => {
                cambiar("direccion", e.target.value);
                cambiar("nombre", e.target.value);
                cambiar("lat", null);
                cambiar("lng", null);
                setSugs(null);
              }}
              placeholder="Hotel, oficina, dirección..." />
            <button onClick={() => buscarDireccion(punto.direccion)}
              disabled={buscando || !punto.direccion?.trim()}
              style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: 11, whiteSpace: "nowrap" }}>
              {buscando ? "..." : "Buscar"}
            </button>
          </div>
          {/* Sugerencias Nominatim */}
          {showSugs && sugs && sugs.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300,
              background: T.surf, border: `1px solid ${T.acc}`, borderRadius: 8,
              maxHeight: 200, overflowY: "auto", marginTop: 4,
            }}>
              {sugs.map((s, i) => (
                <div key={i} onClick={() => seleccionarSug(s)}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 12,
                    borderBottom: i < sugs.length - 1 ? `1px solid ${T.bord}22` : "none",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accDim}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 600, color: T.txt }}>{s.nombre}</div>
                  <div style={{ fontSize: 10, color: T.mut }}>{s.direccion?.slice(0, 80)}</div>
                </div>
              ))}
            </div>
          )}
          {showSugs && sugs && sugs.length === 0 && punto.direccion?.trim() && (
            <div style={{ padding: "8px 12px", fontSize: 11, color: T.mut }}>
              Sin resultados. Usa coordenadas o cambia a modo manual.
            </div>
          )}
          {/* Coordenadas manuales */}
          {punto.direccion && !punto.lat && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={{ ...S.inp, width: "50%", fontSize: 10, padding: "4px 8px" }}
                type="number" step="any" value={punto._latManual || ""}
                onChange={e => cambiar("_latManual", e.target.value)}
                placeholder="Lat. manual (opcional)" />
              <input style={{ ...S.inp, width: "50%", fontSize: 10, padding: "4px 8px" }}
                type="number" step="any" value={punto._lngManual || ""}
                onChange={e => cambiar("_lngManual", e.target.value)}
                placeholder="Lng. manual (opcional)" />
              {punto._latManual && punto._lngManual && (
                <button onClick={() => {
                  cambiar("lat", parseFloat(punto._latManual));
                  cambiar("lng", parseFloat(punto._lngManual));
                }} style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 8px" }}>
                  Fijar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mi ubicación */}
      {punto.tipo === "mi_ubicacion" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <span style={{ fontSize: 13, color: T.txt, fontWeight: 600 }}>{MI_UBICACION.nombre}</span>
          <span style={{ fontSize: 10, color: T.sub }}>{MI_UBICACION.direccion}</span>
          <button onClick={() => {
            cambiar("nombre", MI_UBICACION.nombre);
            cambiar("direccion", MI_UBICACION.direccion);
            cambiar("lat", MI_UBICACION.lat);
            cambiar("lng", MI_UBICACION.lng);
          }} style={{ ...S.btn("primary"), padding: "3px 8px", fontSize: 9 }}>
            Usar
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlanificadorRutas({ value, onChange }) {
  const initPuntos = value?.puntos?.length > 0
    ? value.puntos
    : [
        { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null },
        { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null },
      ];

  const [puntos, setPuntos] = useState(initPuntos);
  const [resultado, setResultado] = useState(value?.resultado || null);
  const [calculando, setCalculando] = useState(false);
  const [manualKm, setManualKm] = useState(value?.manualKm || "");
  const [modo, setModo] = useState(value?.modo || "auto");
  const [kpg, setKpg] = useState(value?.kpg || 27);
  const [pGalon, setPGalon] = useState(value?.pGalon || 48);

  const actualizar = (idx, nuevoPunto) => {
    const p = [...puntos];
    p[idx] = nuevoPunto;
    setPuntos(p);
    setResultado(null);
  };

  const agregarParada = () => setPuntos(p => [...p, { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null }]);
  const quitarParada = (idx) => {
    if (puntos.length <= 2) return;
    setPuntos(p => p.filter((_, i) => i !== idx));
    setResultado(null);
  };

  const invertirRuta = () => {
    setPuntos(p => [...p].reverse());
    setResultado(null);
  };

  const obtenerCoords = (p) => {
    if (p.lat && p.lng) return [p.lat, p.lng];
    if (p.tipo === "mi_ubicacion") return [MI_UBICACION.lat, MI_UBICACION.lng];
    const m = p.muni ? getMuni(parseInt(p.muni)) : null;
    if (m) return [m.lat, m.lng];
    return null;
  };

  const calcularRuta = useCallback(async () => {
    const validos = puntos.filter(p => {
      if (p.tipo === "municipio") return p.depto && p.muni;
      if (p.tipo === "direccion") return p.lat && p.lng;
      if (p.tipo === "mi_ubicacion") return true;
      return false;
    });
    if (validos.length < 2) return;

    setCalculando(true);

    const coords = validos.map(obtenerCoords);
    if (coords.some(c => !c)) { setCalculando(false); return; }

    let km, minutos;
    if (modo === "auto") {
      const osrm = await consultarOSRM(coords);
      if (osrm) {
        km = osrm.km;
        minutos = osrm.minutos;
      } else {
        km = distanciaHaversine(coords);
        minutos = Math.round(km * 1.5 * 60 / 50);
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

    const nomPunto = (p) => p.nombre || p.direccion?.slice(0, 30) || "?";
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
        origenNombre: nomPunto(validos[0]),
        destinoNombre: nomPunto(validos[validos.length - 1]),
      });
    }
  }, [puntos, modo, manualKm, kpg, pGalon, onChange]);

  const validos = puntos.filter(p => {
    if (p.tipo === "municipio") return p.depto && p.muni;
    if (p.tipo === "direccion") return p.lat && p.lng;
    if (p.tipo === "mi_ubicacion") return true;
    return false;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Puntos de ruta */}
      {puntos.map((p, i) => (
        <PuntoSelector
          key={i}
          idx={i}
          punto={p}
          onChange={actualizar}
          onRemove={quitarParada}
          esOrigen={i === 0}
          esDestino={i === puntos.length - 1}
          esUnico={puntos.length <= 2}
        />
      ))}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={agregarParada}
          style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }}>
          + Agregar parada
        </button>
        <button onClick={invertirRuta} disabled={validos.length < 2}
          style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }}>
          Invertir ruta
        </button>
        <button onClick={calcularRuta} disabled={validos.length < 2 || calculando}
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
        <label style={{ fontSize: 10, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}>
          Km/galón:
          <input style={{ ...S.inp, width: 60, fontSize: 11, padding: "4px 6px" }}
            type="number" value={kpg} onChange={e => setKpg(e.target.value)} />
        </label>
        <label style={{ fontSize: 10, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}>
          Precio galón (Q):
          <input style={{ ...S.inp, width: 70, fontSize: 11, padding: "4px 6px" }}
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
          <div style={{ textAlign: "center", padding: 8, background: T.card, borderRadius: 10, marginTop: 10 }}>
            <div style={{ fontSize: 10, color: T.mut }}>Combustible</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.sec }}>{fmt(resultado.galones)} gal</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Q {fmt(resultado.costo)}</div>
          </div>
          {validos.length >= 2 && (
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8, textAlign: "center" }}>
              {(() => {
                const nom0 = validos[0].nombre || validos[0].direccion?.slice(0, 25) || "?";
                const nomU = validos[validos.length - 1].nombre || validos[validos.length - 1].direccion?.slice(0, 25) || "?";
                return `${nom0} → ${nomU}${validos.length > 2 ? ` · ${validos.length - 2} parada(s)` : ""}`;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
