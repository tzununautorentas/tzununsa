import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { T, S, fmt } from '../config.js';
import { DEPARTAMENTOS, munisByDepto, getMuni } from '../data/municipios.js';
import { consultarOSRM, distanciaHaversine, calcularCombustible, estimarDias, geocodificar } from '../services/ruteoService.js';
import { listarUbicaciones, guardarUbicacion, eliminarUbicacion } from '../services/ubicacionesService.js';
import MapaRuta from './MapaRuta.jsx';

const TIPOS_PUNTO = [
  { v: "municipio", l: "Municipio" },
  { v: "direccion", l: "Dirección o lugar" },
  { v: "mi_ubicacion", l: "Mi ubicación" },
];

const PuntoSelector = memo(function PuntoSelector({ idx, punto, onChange, onRemove, esOrigen, esDestino, empId }) {
  const [buscando, setBuscando] = useState(false);
  const [sugs, setSugs] = useState(null);
  const [showSugs, setShowSugs] = useState(false);
  const [gpsState, setGpsState] = useState("idle");
  const [ubicaciones, setUbicaciones] = useState(null);
  const [mostrarUbi, setMostrarUbi] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombreGuardar, setNombreGuardar] = useState("");
  const [showGuardar, setShowGuardar] = useState(false);
  const refSugs = useRef(null);

  useEffect(() => {
    if (!empId) return;
    listarUbicaciones(empId).then(setUbicaciones);
  }, [empId]);

  const recargarUbi = useCallback(() => {
    if (!empId) return;
    listarUbicaciones(empId).then(setUbicaciones);
  }, [empId]);

  const cambiar = useCallback((campo, val) => {
    onChange(idx, { ...punto, [campo]: val });
  }, [onChange, idx, punto]);

  useEffect(() => {
    if (!showSugs) return;
    const handler = (e) => {
      if (refSugs.current && !refSugs.current.contains(e.target)) {
        setShowSugs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSugs]);

  const buscarDireccion = async (q) => {
    if (!q?.trim()) { setSugs(null); return; }
    setBuscando(true);
    const r = await geocodificar(q);
    setSugs(r);
    setShowSugs(true);
    setBuscando(false);
  };

  const seleccionarSug = (s) => {
    onChange(idx, { ...punto, tipo: "direccion", direccion: s.direccion, nombre: s.nombre, lat: s.lat, lng: s.lng });
    setShowSugs(false);
  };

  const obtenerGps = () => {
    if (!navigator.geolocation) { setGpsState("error"); return; }
    setGpsState("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange(idx, { ...punto, lat, lng, nombre: "Mi ubicación (GPS)", direccion: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        setGpsState("ok");
      },
      () => setGpsState("error"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const munisDisponibles = punto.depto ? munisByDepto(parseInt(punto.depto)) : [];
  const latLngLabel = (punto.lat && punto.lng) ? `${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}` : "";

  const inpBase = { ...S.inp, pointerEvents: "auto" };
  const selBase = { ...S.sel, pointerEvents: "auto" };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%",
          background: esOrigen ? T.green : esDestino ? T.red : T.sec,
          color: "#fff", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {esOrigen ? "O" : esDestino ? "D" : idx + 1}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.txt, flex: 1 }}>
          {esOrigen ? "Origen" : esDestino ? "Destino" : `Parada ${idx}`}
        </span>
        {punto.nombre && <span style={{ fontSize: 10, color: T.acc }}>{punto.nombre}</span>}
        {latLngLabel && <span style={{ fontSize: 9, color: T.mut, fontFamily: "monospace" }}>{latLngLabel}</span>}
        {!esOrigen && !esDestino && (
          <button onClick={() => onRemove(idx)}
            style={{ ...S.btn("danger"), padding: "2px 6px", fontSize: 9, pointerEvents: "auto" }}>X</button>
        )}
      </div>

      {/* Tipo */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {TIPOS_PUNTO.map(tp => (
          <button key={tp.v} type="button" onClick={() => cambiar("tipo", tp.v)}
            style={{ ...S.btn(punto.tipo === tp.v ? "primary" : "ghost"), fontSize: 9, padding: "3px 8px", pointerEvents: "auto" }}>
            {tp.l}
          </button>
        ))}
      </div>

      {/* Municipio */}
      {punto.tipo === "municipio" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select style={selBase} value={punto.depto} onChange={e => {
            onChange(idx, { ...punto, depto: e.target.value, muni: "", nombre: "", lat: null, lng: null });
          }}>
            <option value="">Departamento...</option>
            {DEPARTAMENTOS.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          <select style={selBase} value={punto.muni} disabled={!punto.depto} onChange={e => {
            const m = getMuni(parseInt(e.target.value));
            onChange(idx, { ...punto, muni: e.target.value, nombre: m?.nombre || "", lat: m?.lat || null, lng: m?.lng || null });
          }}>
            <option value="">Municipio...</option>
            {munisDisponibles.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Dirección */}
      {punto.tipo === "direccion" && (
        <div ref={refSugs} style={{ position: "relative" }}>
          {/* Mis ubicaciones guardadas */}
          {empId && ubicaciones && ubicaciones.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <button type="button" onClick={() => setMostrarUbi(!mostrarUbi)}
                style={{ ...S.btn("ghost"), fontSize: 10, padding: "2px 8px", pointerEvents: "auto" }}>
                {mostrarUbi ? "Ocultar" : "Mis ubicaciones"} ({ubicaciones.length})
              </button>
              {mostrarUbi && (
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2, maxHeight: 160, overflowY: "auto" }}>
                  {ubicaciones.map(u => (
                    <div key={u.id} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button type="button" onClick={() => {
                        onChange(idx, { ...punto, nombre: u.nombre, direccion: u.direccion || u.nombre, lat: u.lat, lng: u.lng });
                      }} style={{ flex: 1, textAlign: "left", ...S.btn("ghost"), fontSize: 10, padding: "3px 8px", pointerEvents: "auto" }}>
                        <span style={{ fontWeight: 600, color: T.acc }}>{u.nombre}</span>
                        {u.direccion && u.direccion !== u.nombre && <span style={{ color: T.mut, marginLeft: 4 }}>— {u.direccion?.slice(0, 40)}</span>}
                      </button>
                      <button type="button" onClick={async () => {
                        if (!confirm("Eliminar " + u.nombre + "?")) return;
                        await eliminarUbicacion(u.id);
                        recargarUbi();
                      }} style={{ ...S.btn("danger"), padding: "2px 5px", fontSize: 8, pointerEvents: "auto" }}>X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <input style={inpBase} value={punto.direccion || ""}
              onChange={e => { setSugs(null); onChange(idx, { ...punto, direccion: e.target.value, nombre: e.target.value, lat: null, lng: null }); }}
              onFocus={() => { if (sugs && sugs.length > 0) setShowSugs(true); }}
              placeholder="Hotel, oficina, dirección..." />
            <button type="button" onClick={() => buscarDireccion(punto.direccion)}
              disabled={buscando || !punto.direccion?.trim()}
              style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: 11, whiteSpace: "nowrap", pointerEvents: "auto" }}>
              {buscando ? "..." : "Buscar"}
            </button>
          </div>
          {showSugs && sugs && sugs.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              background: T.surf, border: `1px solid ${T.acc}`, borderRadius: 8, maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
              {sugs.map((s, i) => (
                <div key={i} onMouseDown={() => seleccionarSug(s)}
                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12,
                    borderBottom: i < sugs.length - 1 ? `1px solid ${T.bord}22` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accDim}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 600, color: T.txt }}>{s.nombre}</div>
                  <div style={{ fontSize: 10, color: T.mut }}>{s.direccion?.slice(0, 80)}</div>
                </div>
              ))}
            </div>
          )}
          {showSugs && sugs && sugs.length === 0 && punto.direccion?.trim() && (
            <div style={{ padding: "8px 12px", fontSize: 11, color: T.mut }}>Sin resultados. Usa coordenadas o cambia a modo manual.</div>
          )}
          {punto.direccion && !punto.lat && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={{ ...inpBase, width: "50%", fontSize: 10, padding: "4px 8px" }}
                type="number" step="any" value={punto._latManual || ""}
                onChange={e => cambiar("_latManual", e.target.value)} placeholder="Lat. manual" />
              <input style={{ ...inpBase, width: "50%", fontSize: 10, padding: "4px 8px" }}
                type="number" step="any" value={punto._lngManual || ""}
                onChange={e => cambiar("_lngManual", e.target.value)} placeholder="Lng. manual" />
              {punto._latManual && punto._lngManual && (
                <button type="button" onClick={() => { cambiar("lat", parseFloat(punto._latManual)); cambiar("lng", parseFloat(punto._lngManual)); }}
                  style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>Fijar</button>
              )}
            </div>
          )}
          {/* Guardar ubicación */}
          {empId && punto.lat && punto.lng && (
            <div style={{ marginTop: 6 }}>
              {!showGuardar ? (
                <button type="button" onClick={() => setShowGuardar(true)}
                  style={{ ...S.btn("primary"), fontSize: 10, padding: "3px 10px", pointerEvents: "auto" }}>
                  + Guardar ubicación
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={{ ...inpBase, flex: 1, fontSize: 10, padding: "4px 8px" }}
                    value={nombreGuardar} onChange={e => setNombreGuardar(e.target.value)}
                    placeholder="Nombre de la ubicación..." />
                  <button type="button" disabled={guardando || !nombreGuardar.trim()}
                    onClick={async () => {
                      setGuardando(true);
                      const r = await guardarUbicacion({
                        empresa_id: empId, nombre: nombreGuardar.trim(),
                        direccion: punto.direccion || punto.nombre || "",
                        lat: punto.lat, lng: punto.lng,
                      });
                      setGuardando(false);
                      if (r?.error) { alert(r.error); return; }
                      setShowGuardar(false);
                      setNombreGuardar("");
                      recargarUbi();
                    }} style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>
                    {guardando ? "..." : "Guardar"}
                  </button>
                  <button type="button" onClick={() => { setShowGuardar(false); setNombreGuardar(""); }}
                    style={{ ...S.btn("ghost"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>Cancelar</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mi ubicación (GPS) */}
      {punto.tipo === "mi_ubicacion" && (
        <div>
          {gpsState === "idle" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: T.sub }}>Obtén tu ubicación actual vía GPS</span>
              <button type="button" onClick={obtenerGps}
                style={{ ...S.btn("primary"), padding: "4px 12px", fontSize: 10, pointerEvents: "auto" }}>Obtener ubicación</button>
            </div>
          )}
          {gpsState === "buscando" && <div style={{ fontSize: 12, color: T.acc }}>Obteniendo ubicación GPS...</div>}
          {gpsState === "ok" && punto.lat && punto.lng && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>Ubicación: {punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}</span>
                <button type="button" onClick={obtenerGps}
                  style={{ ...S.btn("ghost"), padding: "2px 8px", fontSize: 9, pointerEvents: "auto" }}>Actualizar</button>
              </div>
              {empId && (
                <div style={{ marginTop: 6 }}>
                  {!showGuardar ? (
                    <button type="button" onClick={() => setShowGuardar(true)}
                      style={{ ...S.btn("primary"), fontSize: 10, padding: "3px 10px", pointerEvents: "auto" }}>
                      + Guardar ubicación
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input style={{ ...inpBase, flex: 1, fontSize: 10, padding: "4px 8px" }}
                        value={nombreGuardar} onChange={e => setNombreGuardar(e.target.value)}
                        placeholder="Nombre de la ubicación..." />
                      <button type="button" disabled={guardando || !nombreGuardar.trim()}
                        onClick={async () => {
                          setGuardando(true);
                          const r = await guardarUbicacion({
                            empresa_id: empId, nombre: nombreGuardar.trim(),
                            direccion: punto.direccion || punto.nombre || "",
                            lat: punto.lat, lng: punto.lng,
                          });
                          setGuardando(false);
                          if (r?.error) { alert(r.error); return; }
                          setShowGuardar(false);
                          setNombreGuardar("");
                          recargarUbi();
                        }} style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>
                        {guardando ? "..." : "Guardar"}
                      </button>
                      <button type="button" onClick={() => { setShowGuardar(false); setNombreGuardar(""); }}
                        style={{ ...S.btn("ghost"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {gpsState === "error" && (
            <div>
              <div style={{ fontSize: 11, color: T.red, marginBottom: 6 }}>No se pudo obtener la ubicación. Verifica permisos o ingresa coordenadas.</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <input style={{ ...inpBase, width: 120, fontSize: 10, padding: "4px 8px" }}
                  type="number" step="any" value={punto._latManual || ""}
                  onChange={e => cambiar("_latManual", e.target.value)} placeholder="Latitud" />
                <input style={{ ...inpBase, width: 120, fontSize: 10, padding: "4px 8px" }}
                  type="number" step="any" value={punto._lngManual || ""}
                  onChange={e => cambiar("_lngManual", e.target.value)} placeholder="Longitud" />
                <button type="button" onClick={() => {
                  if (punto._latManual && punto._lngManual) {
                    onChange(idx, { ...punto, lat: parseFloat(punto._latManual), lng: parseFloat(punto._lngManual), nombre: "Ubicación manual", direccion: `${punto._latManual}, ${punto._lngManual}` });
                    setGpsState("ok");
                  }
                }} disabled={!punto._latManual || !punto._lngManual}
                  style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 8px", pointerEvents: "auto" }}>Usar</button>
                <button type="button" onClick={() => { setGpsState("idle"); obtenerGps(); }}
                  style={{ ...S.btn("ghost"), fontSize: 9, padding: "4px 8px", pointerEvents: "auto" }}>Reintentar GPS</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function PlanificadorRutas({ value, onChange, empId }) {
  const initPuntos = value?.puntos?.length > 0
    ? value.puntos
    : [
        { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null },
        { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null },
      ];

  const [puntos, setPuntos] = useState(initPuntos);
  const [resultado, setResultado] = useState(value?.resultado || null);
  const [geometria, setGeometria] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [manualKm, setManualKm] = useState(value?.manualKm || "");
  const [modo, setModo] = useState(value?.modo || "auto");
  const [kpg, setKpg] = useState(value?.kpg || 27);
  const [pGalon, setPGalon] = useState(value?.pGalon || 48);
  const [alternativas, setAlternativas] = useState(null);
  const [rutaSel, setRutaSel] = useState(0);
  const [viaQuery, setViaQuery] = useState("");
  const [viaBuscando, setViaBuscando] = useState(false);
  const [viaRoutes, setViaRoutes] = useState([]);
  const [viaSel, setViaSel] = useState(-1);

  const actualizar = useCallback((idx, nuevoPunto) => {
    setPuntos(prev => {
      const p = [...prev];
      p[idx] = nuevoPunto;
      return p;
    });
    setResultado(null);
  }, []);

  const agregarParada = useCallback(() => setPuntos(p => [...p, { tipo: "municipio", depto: "", muni: "", nombre: "", direccion: "", lat: null, lng: null }]), []);
  const quitarParada = useCallback((idx) => {
    setPuntos(p => { if (p.length <= 2) return p; return p.filter((_, i) => i !== idx); });
    setResultado(null);
  }, []);
  const invertirRuta = useCallback(() => {
    setPuntos(p => [...p].reverse());
    setResultado(null);
  }, []);

  const obtenerCoords = (p) => {
    if (p.lat && p.lng) return [p.lat, p.lng];
    const m = p.muni ? getMuni(parseInt(p.muni)) : null;
    if (m) return [m.lat, m.lng];
    return null;
  };

  const calcularRuta = useCallback(async () => {
    const validos = puntos.filter(p => {
      if (p.tipo === "municipio") return p.depto && p.muni;
      if (p.tipo === "direccion") return p.lat && p.lng;
      if (p.tipo === "mi_ubicacion") return p.lat && p.lng;
      return false;
    });
    if (validos.length < 2) return;
    setCalculando(true);
    setGeometria(null);
    setAlternativas(null);
    setRutaSel(0);
    let localRutaSel = 0;
    const coords = validos.map(obtenerCoords);
    if (coords.some(c => !c)) { setCalculando(false); return; }
    let km, minutos, geometriaRuta;
    if (modo === "auto") {
      const osrm = await consultarOSRM(coords, 3);
      if (osrm && osrm.routes.length > 0) {
        setAlternativas(osrm.routes);
        const idx = localRutaSel < osrm.routes.length ? localRutaSel : 0;
        const ruta = osrm.routes[idx];
        km = ruta.km;
        minutos = ruta.minutos;
        geometriaRuta = ruta.geometria;
      } else {
        setAlternativas(null);
        km = distanciaHaversine(coords);
        minutos = Math.round(km * 1.5 * 60 / 50);
      }
    } else {
      setAlternativas(null);
      km = parseFloat(manualKm) || distanciaHaversine(coords);
      minutos = Math.round(km * 1.5 * 60 / 50);
    }
    const comb = calcularCombustible(km, kpg, pGalon);
    const dias = estimarDias(km);
    const res = { km, minutos, dias, ...comb };
    setResultado(res);
    if (geometriaRuta) setGeometria(geometriaRuta);
    setCalculando(false);
    const nomPunto = (p) => p.nombre || p.direccion?.slice(0, 30) || "?";
    if (onChange) {
      onChange({
        puntos: validos, resultado: res, modo, manualKm, kpg, pGalon,
        origen: validos[0], destino: validos[validos.length - 1],
        paradas: validos.slice(1, -1),
        origenNombre: nomPunto(validos[0]), destinoNombre: nomPunto(validos[validos.length - 1]),
        distanciaTotal: km, diasEstimados: dias,
      });
    }
  }, [puntos, modo, manualKm, kpg, pGalon, onChange]);

  const calcularVia = useCallback(async () => {
    const validos = puntos.filter(p => {
      if (p.tipo === "municipio") return p.depto && p.muni;
      if (p.tipo === "direccion") return p.lat && p.lng;
      if (p.tipo === "mi_ubicacion") return p.lat && p.lng;
      return false;
    });
    if (!viaQuery.trim() || validos.length < 2) return;
    setViaBuscando(true);
    const geo = await geocodificar(viaQuery.trim());
    if (!geo || geo.length === 0) { setViaBuscando(false); return; }
    const { lat, lng, nombre } = geo[0];
    const viaPunto = { tipo: "direccion", direccion: nombre, nombre, lat, lng };
    // Agrega el punto ANTES del destino (se acumulan en orden)
    const nuevosPuntos = [...puntos.slice(0, -1), viaPunto, puntos[puntos.length - 1]];
    setPuntos(nuevosPuntos);
    setViaQuery("");
    setViaBuscando(false);
    setAlternativas(null);
    setRutaSel(0);
    const coords = nuevosPuntos.map(obtenerCoords).filter(Boolean);
    if (coords.length < 2) return;
    const osrm = await consultarOSRM(coords);
    const km = osrm ? osrm.routes[0].km : distanciaHaversine(coords);
    const minutos = osrm ? osrm.routes[0].minutos : Math.round(km * 1.5 * 60 / 50);
    const geometriaRuta = osrm ? osrm.routes[0].geometria : null;
    const comb = calcularCombustible(km, kpg, pGalon);
    const dias = estimarDias(km);
    const res = { km, minutos, dias, ...comb, via: nombre };
    setResultado(res);
    if (geometriaRuta) setGeometria(geometriaRuta);
    // Guarda la ruta completa con todos los puntos acumulados
    const puntosLabel = nuevosPuntos.slice(1, -1).map(p => p.nombre || p.direccion?.slice(0, 20)).join(" → ");
    const rutaLabel = `Vía ${puntosLabel}`;
    const existIdx = viaRoutes.findIndex(r => r.label === rutaLabel);
    if (existIdx >= 0) {
      const upd = [...viaRoutes]; upd[existIdx] = { via: rutaLabel, resultado: res, geometria: geometriaRuta, puntos: nuevosPuntos, label: rutaLabel };
      setViaRoutes(upd);
    } else {
      setViaRoutes([...viaRoutes, { via: rutaLabel, resultado: res, geometria: geometriaRuta, puntos: nuevosPuntos, label: rutaLabel }]);
    }
    setViaSel(existIdx >= 0 ? existIdx : viaRoutes.length);
    const nomPunto = (p) => p.nombre || p.direccion?.slice(0, 30) || "?";
    if (onChange) {
      onChange({
        puntos: nuevosPuntos, resultado: res, modo, manualKm, kpg, pGalon,
        origen: nuevosPuntos[0], destino: nuevosPuntos[nuevosPuntos.length - 1],
        paradas: nuevosPuntos.slice(1, -1),
        origenNombre: nomPunto(nuevosPuntos[0]), destinoNombre: nomPunto(nuevosPuntos[nuevosPuntos.length - 1]),
        distanciaTotal: km, diasEstimados: dias,
      });
    }
  }, [viaQuery, puntos, kpg, pGalon, modo, manualKm, onChange, viaRoutes]);

  const seleccionarViaRoute = useCallback((idx) => {
    const vr = viaRoutes[idx];
    if (!vr) return;
    setViaSel(idx);
    setResultado(vr.resultado);
    setGeometria(vr.geometria);
    setPuntos(vr.puntos);
    if (onChange) {
      const nomPunto = (p) => p.nombre || p.direccion?.slice(0, 30) || "?";
      onChange({
        puntos: vr.puntos, resultado: vr.resultado, modo, manualKm, kpg, pGalon,
        origen: vr.puntos[0], destino: vr.puntos[vr.puntos.length - 1],
        paradas: vr.puntos.slice(1, -1),
        origenNombre: nomPunto(vr.puntos[0]), destinoNombre: nomPunto(vr.puntos[vr.puntos.length - 1]),
        distanciaTotal: vr.resultado.km, diasEstimados: vr.resultado.dias,
      });
    }
  }, [viaRoutes, modo, manualKm, kpg, pGalon, onChange]);

  const limpiarViaRoutes = useCallback(() => {
    setViaRoutes([]);
    setViaSel(-1);
  }, []);

  const validos = puntos.filter(p => {
    if (p.tipo === "municipio") return p.depto && p.muni;
    if (p.tipo === "direccion") return p.lat && p.lng;
    if (p.tipo === "mi_ubicacion") return p.lat && p.lng;
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
          empId={empId}
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

      {/* Calcular vía — agregar punto intermedio en orden */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", background: T.card, borderRadius: 8, padding: "8px 10px", border: `1px solid ${T.bord}44` }}>
        <span style={{ fontSize: 11, color: T.mut, fontWeight: 600 }}>+ Punto de paso:</span>
        <input style={{ ...S.inp, width: 200, fontSize: 11, padding: "4px 8px" }}
          value={viaQuery} onChange={e => setViaQuery(e.target.value)}
          placeholder="Ej: Chimaltenango, luego Los Encuentros..." />
        <button onClick={calcularVia} disabled={viaBuscando || !viaQuery.trim() || validos.length < 2}
          style={{ ...S.btn("primary"), fontSize: 10, padding: "4px 10px" }}>
          {viaBuscando ? "..." : "Agregar y calcular"}
        </button>
        {viaRoutes.length > 0 && (
          <button onClick={limpiarViaRoutes}
            style={{ ...S.btn("ghost"), fontSize: 9, padding: "2px 8px", color: T.red }}>Limpiar todo</button>
        )}
      </div>

      {/* Rutas creadas vía (ruta completa con todos los puntos acumulados) */}
      {viaRoutes.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.mut }}>Rutas guardadas:</span>
          <button key="no-via"
            onClick={() => {
              setViaSel(-1);
              setViaRoutes([]);
              const resetPuntos = [puntos[0], puntos[puntos.length - 1]];
              setPuntos(resetPuntos);
              setResultado(null);
              setGeometria(null);
              if (onChange) onChange({ puntos: resetPuntos, resultado: null, modo, manualKm, kpg, pGalon });
            }}
            style={{ ...S.btn(viaSel === -1 ? "primary" : "ghost"), fontSize: 10, padding: "4px 10px" }}>
            Sin escala
          </button>
          {viaRoutes.map((vr, i) => (
            <button key={vr.via}
              onClick={() => seleccionarViaRoute(i)}
              style={{ ...S.btn(viaSel === i ? "primary" : "ghost"), fontSize: 10, padding: "4px 10px" }}>
              {vr.label} — {vr.resultado.km} km
            </button>
          ))}
        </div>
      )}

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

      {/* Selector de ruta alternativa — antes del mapa */}
      {alternativas && alternativas.length > 1 && (
        <div style={{ background: T.card, borderRadius: 10, padding: 10, border: `1px solid ${T.acc}33` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, marginBottom: 8, letterSpacing: 0.5 }}>RUTAS DISPONIBLES — selecciona la que prefieras:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {alternativas.map((r, i) => {
              const sel = rutaSel === i;
              return (
                <button key={i}
                  onClick={async () => {
                    setRutaSel(i);
                    const coords = validos.map(obtenerCoords);
                    const ruta = alternativas[i];
                    const comb = calcularCombustible(ruta.km, kpg, pGalon);
                    const dias = estimarDias(ruta.km);
                    const res = { km: ruta.km, minutos: ruta.minutos, dias, ...comb };
                    setResultado(res);
                    setGeometria(ruta.geometria);
                    const nomPunto = (p) => p.nombre || p.direccion?.slice(0, 30) || "?";
                    if (onChange) {
                      onChange({
                        puntos: validos, resultado: res, modo, manualKm, kpg, pGalon,
                        origen: validos[0], destino: validos[validos.length - 1],
                        paradas: validos.slice(1, -1),
                        origenNombre: nomPunto(validos[0]), destinoNombre: nomPunto(validos[validos.length - 1]),
                        distanciaTotal: ruta.km,
                        diasEstimados: dias,
                      });
                    }
                  }}
                  style={{
                    flex: "1 1 auto", minWidth: 160,
                    ...S.btn(sel ? "primary" : "ghost"),
                    fontSize: 10, padding: "8px 12px", textAlign: "left",
                    border: sel ? `2px solid ${T.acc}` : `1px solid ${T.bord}`,
                    opacity: sel ? 1 : 0.75,
                  }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>
                    {r.km} km
                  </div>
                  <div style={{ fontSize: 9, color: T.sub }}>
                    {r.minutos >= 60 ? `${Math.floor(r.minutos / 60)}h ${r.minutos % 60}m` : `${r.minutos} min`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mapa */}
      {resultado && puntos.length >= 2 && (
        <MapaRuta
          points={puntos.filter(p => p.lat && p.lng).map(p => ({ lat: p.lat, lng: p.lng, nombre: p.nombre || p.direccion }))}
          geometria={geometria}
          style={{ border: `1px solid ${T.bord}`, boxShadow: `0 2px 12px rgba(0,0,0,.15)` }}
        />
      )}

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
