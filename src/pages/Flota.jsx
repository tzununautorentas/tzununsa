import React, { useState, useMemo } from 'react';
import { T, S, dbIns, dbUpd, dbDel, EST_VEH } from '../config.js';
import { Spinner, Empty, Fld, Badge, Paginador, Buscador, ModalExportar } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

export default function PageFlota({ showToast, empId }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [exportar, setExportar] = useState(false);
  const [vista, setVista]     = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [f, setF] = useState({
    codigo: "", propietario: "propio", placa: "", marca: "", modelo: "",
    anio: new Date().getFullYear(), tipo: "SUV", estado: "disponible", km_actual: 0,
    color: "", vin: "", poliza_seguro: "", vencimiento_seguro: "", tipo_deducible: "",
    monto_deducible: "", notas: "", foto_url: "",
    capacidad: 4, transmision: "Automática", aire_acondicionado: true,
    combustible: "Gasolina", capacidad_equipaje: "2 maletas", traccion: "4x2",
    tarifa_dia: "", tarifa_semana: "", tarifa_mes: ""
  });
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const TIPOS = ["Sedan", "SUV", "Pickup", "Van", "Microbus", "Bus"];

  const query = filtro !== 'todos' ? `estado=eq.${filtro}` : '';

  const { data: rows, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload: load, desde, hasta } = usePaginacion({
    table: "vehiculos",
    query,
    search: busqueda,
    columns: ['marca', 'modelo', 'placa', 'codigo', 'color', 'tipo', 'vin', 'notas'],
    order: 'codigo.asc',
  });

  const ordenProp = { propio: 0, socio: 1, alquilado: 2 };
  const sortedRows = useMemo(() => {
    if (!rows) return rows;
    return [...rows].sort((a, b) => {
      const pa = ordenProp[a.propietario] ?? 3;
      const pb = ordenProp[b.propietario] ?? 3;
      if (pa !== pb) return pa - pb;
      return (a.codigo || '').localeCompare(b.codigo || '');
    });
  }, [rows]);

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

  const manejarFoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("La foto no puede superar 2MB", "err"); return; }
    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = ev => { sf("foto_url", ev.target.result); setSubiendoFoto(false); };
    reader.onerror = () => { showToast("Error al leer la imagen", "err"); setSubiendoFoto(false); };
    reader.readAsDataURL(file);
  };

  const abrirEditar = v => {
    setF({
      codigo: v.codigo || '', propietario: v.propietario || 'propio',
      placa: v.placa || '', marca: v.marca || '', modelo: v.modelo || '',
      anio: v.anio || new Date().getFullYear(), tipo: v.tipo || 'SUV',
      estado: v.estado || 'disponible', km_actual: v.km_actual || 0,
      color: v.color || '', vin: v.vin || '',
      poliza_seguro: v.poliza_seguro || '', vencimiento_seguro: v.vencimiento_seguro || '',
      tipo_deducible: v.tipo_deducible || '', monto_deducible: v.monto_deducible || 0,
      notas: v.notas || '', foto_url: v.foto_url || '',
      capacidad: v.capacidad || 4, transmision: v.transmision || 'Automática',
      aire_acondicionado: v.aire_acondicionado ?? true, combustible: v.combustible || 'Gasolina',
      capacidad_equipaje: v.capacidad_equipaje || '2 maletas', traccion: v.traccion || '4x2',
      tarifa_dia: v.tarifa_dia || '', tarifa_semana: v.tarifa_semana || '', tarifa_mes: v.tarifa_mes || ''
    });
    setEditItem(v); setVista("form");
  };

  const abrirNuevo = () => {
    setF({ codigo: genCodigoVehiculo('propio'), propietario: 'propio', placa: '', marca: '', modelo: '',
      anio: new Date().getFullYear(), tipo: 'SUV', estado: 'disponible', km_actual: 0,
      color: '', vin: '', poliza_seguro: '', vencimiento_seguro: '', notas: '', foto_url: '',
      capacidad: 4, transmision: 'Automática', aire_acondicionado: true, combustible: 'Gasolina',
      capacidad_equipaje: '2 maletas', traccion: '4x2', tarifa_dia: '', tarifa_semana: '', tarifa_mes: '' });
    setEditItem(null); setVista("form");
  };

  const guardar = async () => {
    if (!f.placa.trim()) { showToast("Placa requerida", "err"); return; }
    setSaving(true);
    const payload = { empresa_id: empId, codigo: f.codigo, propietario: f.propietario, placa: f.placa, marca: f.marca, modelo: f.modelo, tipo: f.tipo, color: f.color, estado: f.estado, anio: parseInt(f.anio) || new Date().getFullYear(), km_actual: parseInt(f.km_actual) || 0, vin: f.vin, poliza_seguro: f.poliza_seguro, vencimiento_seguro: f.vencimiento_seguro || null, tipo_deducible: f.tipo_deducible, monto_deducible: parseFloat(f.monto_deducible) || 0, notas: f.notas, foto_url: f.foto_url || null, capacidad: parseInt(f.capacidad) || 4, transmision: f.transmision, aire_acondicionado: !!f.aire_acondicionado, combustible: f.combustible, capacidad_equipaje: f.capacidad_equipaje, traccion: f.traccion, tarifa_dia: parseFloat(f.tarifa_dia) || 0, tarifa_semana: parseFloat(f.tarifa_semana) || 0, tarifa_mes: parseFloat(f.tarifa_mes) || 0 };
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

  const FILTROS = [
    { key: "todos", l: "Todos" },
    { key: "disponible", l: "Disponibles" },
    { key: "rentado", l: "Rentados" },
    { key: "mantenimiento", l: "Mantenimiento" },
  ];

  const exportData = (ev) => {
    setExportar(true);
  };

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
          <Fld label="DEDUCIBLE">
            <select style={S.sel} value={f.tipo_deducible} onChange={e => sf("tipo_deducible", e.target.value)}>
              <option value="">Sin deducible</option>
              <option value="fijo">Monto fijo</option>
              <option value="porcentaje">Porcentaje</option>
            </select>
          </Fld>
          {f.tipo_deducible && (
            <Fld label={f.tipo_deducible === "fijo" ? "MONTO DEDUCIBLE (Q)" : "% DEDUCIBLE"}>
              <input style={S.inp} type="number" step="0.01" value={f.monto_deducible}
                onChange={e => sf("monto_deducible", e.target.value)} placeholder="0.00" />
            </Fld>
          )}
          <Fld label="NOTAS">
            <input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
          </Fld>
        </div>

        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "span 2", fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1 }}>
            FOTOGRAFIA PRINCIPAL
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              {f.foto_url ? (
                <div style={{ position: "relative", width: 140, height: 105, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.bord}` }}>
                  <img src={f.foto_url} alt="Vehiculo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => sf("foto_url", "")}
                    style={{ position: "absolute", top: 4, right: 4, ...S.btn("danger"), padding: "1px 6px", fontSize: 10, borderRadius: 4, cursor: "pointer", border: "none", opacity: 0.85 }}>X</button>
                </div>
              ) : (
                <div style={{ width: 140, height: 105, borderRadius: 8, border: `2px dashed ${T.bord}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.mut, fontSize: 11, textAlign: "center", padding: 4 }}>
                  Sin foto
                </div>
              )}
              <div>
                <label style={{ cursor: "pointer", display: "inline-block", ...S.btn("primary"), fontSize: 11, padding: "6px 14px" }}>
                  {subiendoFoto ? "Cargando..." : "Subir foto"}
                  <input type="file" accept="image/*" onChange={manejarFoto} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: 10, color: T.mut, marginTop: 4 }}>M&aacute;ximo 2MB</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "span 2", fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1 }}>
            CARACTERISTICAS TECNICAS
          </div>
          <Fld label="CAPACIDAD (PASAJEROS)">
            <input style={S.inp} type="number" min="1" max="60" value={f.capacidad}
              onChange={e => sf("capacidad", e.target.value)} placeholder="4" />
          </Fld>
          <Fld label="TRANSMISION">
            <select style={S.sel} value={f.transmision} onChange={e => sf("transmision", e.target.value)}>
              <option value="Automática">Automática</option>
              <option value="Manual">Manual</option>
              <option value="Automática / Manual">Automática / Manual</option>
            </select>
          </Fld>
          <Fld label="AIRE ACONDICIONADO">
            <select style={S.sel} value={f.aire_acondicionado ? "si" : "no"} onChange={e => sf("aire_acondicionado", e.target.value === "si")}>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </Fld>
          <Fld label="COMBUSTIBLE">
            <select style={S.sel} value={f.combustible} onChange={e => sf("combustible", e.target.value)}>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Gasolina / Gas">Gasolina / Gas</option>
            </select>
          </Fld>
          <Fld label="CAPACIDAD EQUIPAJE">
            <input style={S.inp} value={f.capacidad_equipaje}
              onChange={e => sf("capacidad_equipaje", e.target.value)} placeholder="2 maletas" />
          </Fld>
          <Fld label="TRACCION">
            <select style={S.sel} value={f.traccion} onChange={e => sf("traccion", e.target.value)}>
              <option value="4x2">4x2</option>
              <option value="4x4">4x4</option>
              <option value="AWD">AWD</option>
            </select>
          </Fld>
        </div>

        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "span 2", fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1 }}>
            INFORMACION COMERCIAL
          </div>
          <Fld label="TARIFA DIA (Q)">
            <input style={S.inp} type="number" step="0.01" value={f.tarifa_dia}
              onChange={e => sf("tarifa_dia", e.target.value)} placeholder="0.00" />
          </Fld>
          <Fld label="TARIFA SEMANA (Q)">
            <input style={S.inp} type="number" step="0.01" value={f.tarifa_semana}
              onChange={e => sf("tarifa_semana", e.target.value)} placeholder="0.00" />
          </Fld>
          <Fld label="TARIFA MES (Q)">
            <input style={S.inp} type="number" step="0.01" value={f.tarifa_mes}
              onChange={e => sf("tarifa_mes", e.target.value)} placeholder="0.00" />
          </Fld>
        </div>

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
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 18 }}>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {FILTROS.map(fl => (
          <button key={fl.key}
            onClick={() => setFiltro(fl.key)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filtro === fl.key ? T.acc : T.brd}`,
              background: filtro === fl.key ? T.accDim : 'transparent',
              color: filtro === fl.key ? T.acc : T.sub, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            {fl.l}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: T.sub }}>
          {total > 0 ? `${desde}-${hasta} de ${total} vehiculos` : 'Sin vehiculos'}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar vehículo..." />
          <button onClick={exportData} style={{ ...S.btn("ghost"), fontSize: 12 }}>Exportar</button>
          <button onClick={abrirNuevo} style={{ ...S.btn("primary"), fontSize: 12 }}>
            + Nuevo vehículo
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : sortedRows.length === 0 ? (
        <Empty icon="V" msg="Sin vehículos registrados" action="+ Registrar" onAction={abrirNuevo} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedRows.map(v => {
            const e = EST_VEH[v.estado] || EST_VEH.disponible;
            const segVenc = v.vencimiento_seguro && new Date(v.vencimiento_seguro) < new Date();
            const pBadge = { propio: { c: T.acc, bg: T.accDim }, socio: { c: T.blue, bg: T.blueDim }, alquilado: { c: T.sec, bg: T.secDim } }[v.propietario] || { c: T.mut, bg: T.bg2 };
            return (
              <div key={v.id} style={S.card}>
                <div style={{ display: "flex", gap: 14 }}>
                  {v.foto_url && (
                    <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={v.foto_url} alt={v.placa} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 13 }}>
                        {v.codigo || "—"}
                      </span>
                      <span style={{ fontFamily: "monospace", color: T.sub, fontSize: 11 }}>{v.placa}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: T.txt, fontSize: 14, marginTop: 2 }}>
                      {v.marca} {v.modelo}
                      {v.anio ? ` · ${v.anio}` : ''}
                      {v.color ? ` · ${v.color}` : ''}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: T.mut }}>
                        {v.tipo} · {(v.km_actual || 0).toLocaleString()} km
                        {v.capacidad ? ` · ${v.capacidad} pasajeros` : ''}
                        {v.transmision ? ` · ${v.transmision}` : ''}
                        {v.aire_acondicionado ? ' · A/C' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <Badge c={e.c} bg={e.bg} l={e.l} small />
                    {segVenc && <span style={{ fontSize: 9, color: T.red, fontWeight: 600 }}>Seguro vencido</span>}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ padding: "2px 7px", borderRadius: 8, fontSize: 10, fontWeight: 600, color: pBadge.c, background: pBadge.bg }}>
                      {PROP[v.propietario] || v.propietario || "—"}
                    </span>
                    <select style={{ ...S.sel, padding: "3px 7px", fontSize: 11, width: "auto" }}
                      value={v.estado} onChange={ev => chEst(v.id, ev.target.value)}>
                      <option value="disponible">Disponible</option>
                      <option value="rentado">Rentado</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => abrirEditar(v)} style={{ ...S.btn("ghost"), padding: "3px 9px", fontSize: 11 }}>
                      Editar
                    </button>
                    <button onClick={() => del(v.id)} style={{ ...S.btn("danger"), padding: "3px 9px", fontSize: 11 }}>
                      Eliminar
                    </button>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />

      {exportar && (
        <ModalExportar titulo="Vehículos" datos={rows} campos={[
          { key: 'codigo', label: 'Código' },
          { key: 'placa', label: 'Placa' },
          { key: 'marca', label: 'Marca' },
          { key: 'modelo', label: 'Modelo' },
          { key: 'anio', label: 'Año' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'propietario', label: 'Propietario' },
          { key: 'color', label: 'Color' },
          { key: 'estado', label: 'Estado' },
          { key: 'km_actual', label: 'KM Actual' },
          { key: 'vin', label: 'VIN' },
          { key: 'poliza_seguro', label: 'Póliza' },
          { key: 'vencimiento_seguro', label: 'Venc. Seguro' },
          { key: 'notas', label: 'Notas' },
          { key: 'capacidad', label: 'Capacidad' },
          { key: 'transmision', label: 'Transmisión' },
          { key: 'aire_acondicionado', label: 'Aire' },
          { key: 'combustible', label: 'Combustible' },
          { key: 'capacidad_equipaje', label: 'Equipaje' },
          { key: 'traccion', label: 'Tracción' },
          { key: 'tarifa_dia', label: 'Tarifa Día' },
          { key: 'tarifa_semana', label: 'Tarifa Semana' },
          { key: 'tarifa_mes', label: 'Tarifa Mes' },
        ]} onClose={() => setExportar(false)} />
      )}
    </div>
  );
}
