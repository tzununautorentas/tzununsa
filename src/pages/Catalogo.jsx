import React, { useState, useEffect } from "react";
import { T, S, fmt, today, getEmpId, dbGet, dbIns, dbUpd, dbDel } from "../config.js";
import { Toast, Spinner, Empty, Fld, ModalExportar } from "../components/shared.jsx";

const CATEGORIAS_PROD = ["transporte", "turismo", "renta veh├¡culo", "traslado", "servicio especial", "paquete corporativo", "otro"];

function FormProducto({ initial, empId, onSave, onCancel }) {
  const [f, setF] = useState({
    codigo: initial?.codigo || "",
    nombre: initial?.nombre || "",
    descripcion: initial?.descripcion || "",
    categoria: initial?.categoria || "transporte",
    precio_base: initial?.precio_base || "",
    precio_tarjeta: initial?.precio_tarjeta || "",
    unidad: initial?.unidad || "servicio",
    aplica_iva: initial?.aplica_iva !== false,
    tasa_iva: initial?.tasa_iva || 5,
    activo: initial?.activo !== false,
    imagen_emoji: initial?.imagen_emoji || "­ƒÜù",
    notas: initial?.notas || "",
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);

  const precioConIVA = f.aplica_iva ? parseFloat(f.precio_base || 0) * (1 + (f.tasa_iva || 0) / 100) : parseFloat(f.precio_base || 0);

  const guardar = async () => {
    if (!f.nombre.trim()) { alert("El nombre es requerido"); return; }
    if (!f.precio_base || parseFloat(f.precio_base) <= 0) { alert("El precio base es requerido"); return; }
    setSaving(true);
    const eid = empId || await getEmpId();
    const payload = { ...f, empresa_id: eid, precio_base: parseFloat(f.precio_base), precio_tarjeta: parseFloat(f.precio_tarjeta) || parseFloat(f.precio_base) * 1.05, tasa_iva: parseInt(f.tasa_iva) || 0 };
    const result = initial?.id ? await dbUpd("catalogo_servicios", initial.id, payload) : await dbIns("catalogo_servicios", payload);
    if (result?.error) { alert("Error: " + result.error); setSaving(false); return; }
    setSaving(false); onSave();
  };

  const EMOJIS = ["­ƒÜù", "­ƒÜî", "­ƒÅì´©Å", "­ƒÜÉ", "­ƒø╗", "Ô£ê´©Å", "­ƒîÄ", "­ƒÅö´©Å", "­ƒÅû´©Å", "­ƒÅó", "­ƒæÑ", "­ƒôª", "Ô¡É", "­ƒÆ╝", "­ƒÄ»"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>{initial?.id ? "Editar servicio" : "Nuevo servicio / producto"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>ÔåÉ Volver</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={S.lbl}>├ìCONO</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => sf("imagen_emoji", e)} style={{ fontSize: 22, width: 40, height: 40, borderRadius: 8, border: `2px solid ${f.imagen_emoji === e ? T.acc : T.bord}`, background: f.imagen_emoji === e ? T.accD : T.surf, cursor: "pointer" }}>{e}</button>
              ))}
            </div>
          </div>
          <Fld label="C├ôDIGO"><input style={S.inp} value={f.codigo} onChange={e => sf("codigo", e.target.value)} placeholder="SRV-001" /></Fld>
          <Fld label="CATEGOR├ìA">
            <select style={S.sel} value={f.categoria} onChange={e => sf("categoria", e.target.value)}>
              {CATEGORIAS_PROD.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </Fld>
          <Fld label="NOMBRE DEL SERVICIO" span2><input style={S.inp} value={f.nombre} onChange={e => sf("nombre", e.target.value)} placeholder="Ej: Traslado aeropuerto zona 10" /></Fld>
          <Fld label="DESCRIPCI├ôN" span2><textarea style={{ ...S.inp, minHeight: 70, resize: "vertical" }} value={f.descripcion} onChange={e => sf("descripcion", e.target.value)} placeholder="Descripci├│n del servicio para el cliente..." /></Fld>
          <Fld label="UNIDAD DE COBRO">
            <select style={S.sel} value={f.unidad} onChange={e => sf("unidad", e.target.value)}>
              <option value="servicio">Por servicio</option>
              <option value="dia">Por d├¡a</option>
              <option value="km">Por kil├│metro</option>
              <option value="hora">Por hora</option>
              <option value="persona">Por persona</option>
            </select>
          </Fld>
          <Fld label="ESTADO">
            <select style={S.sel} value={f.activo ? "activo" : "inactivo"} onChange={e => sf("activo", e.target.value === "activo")}>
              <option value="activo">Ô£à Activo</option>
              <option value="inactivo">ÔÅ© Inactivo</option>
            </select>
          </Fld>
          <Fld label="NOTAS INTERNAS" span2><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Notas para el equipo..." /></Fld>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>PRECIOS</div>
            <div style={{ display: "grid", gap: 11 }}>
              <Fld label="PRECIO BASE (sin IVA, en GTQ)"><input style={{ ...S.inp, fontWeight: 700 }} type="number" step="0.01" value={f.precio_base} onChange={e => sf("precio_base", e.target.value)} placeholder="0.00" /></Fld>
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 8, background: T.surf }}>
                <input type="checkbox" id="aplIVA" checked={f.aplica_iva} onChange={e => sf("aplica_iva", e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="aplIVA" style={{ fontSize: 13, cursor: "pointer" }}>Aplica IVA</label>
                {f.aplica_iva && (
                  <select style={{ ...S.sel, width: "auto", marginLeft: "auto" }} value={f.tasa_iva} onChange={e => sf("tasa_iva", parseInt(e.target.value))}>
                    <option value={12}>12%</option>
                    <option value={5}>5%</option>
                  </select>
                )}
              </div>
              {f.aplica_iva && <div style={{ background: T.accD, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                <div style={{ color: T.sub }}>Precio con IVA incluido</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>Q {fmt(precioConIVA)}</div>
              </div>}
              <Fld label="PRECIO CON TARJETA (+5%, se calcula solo)"><input style={S.inp} type="number" step="0.01" value={f.precio_tarjeta || ""} onChange={e => sf("precio_tarjeta", e.target.value)} placeholder={fmt(precioConIVA * 1.05)} /></Fld>
            </div>
          </div>
          {/* Vista previa */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>VISTA PREVIA EN CAT├üLOGO</div>
            <div style={{ background: T.surf, borderRadius: 12, padding: 16, border: `1px solid ${T.bord}` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{f.imagen_emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.nombre || "Nombre del servicio"}</div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{f.descripcion || "Descripci├│n del servicio"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>Q {fmt(precioConIVA)}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>por {f.unidad}</div>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: f.activo ? T.greenD : T.redD, color: f.activo ? T.green : T.red }}>{f.activo ? "Activo" : "Inactivo"}</span>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), width: "100%", padding: 11, fontSize: 13 }}>{saving ? "Guardando..." : "­ƒÆ¥ Guardar servicio"}</button>
            <button onClick={onCancel} style={{ ...S.btn("ghost"), width: "100%", padding: 11, marginTop: 8 }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PageCatalogo({ showToast, empId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("catalogo");
  const [editItem, setEditItem] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [exportar, setExportar] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  const load = async () => {
    setLoading(true);
    const d = await dbGet("catalogo_servicios", "&order=categoria.asc,nombre.asc");
    if (!Array.isArray(d) || (d.length === 0 && d.error)) setTableExists(false);
    setRows(Array.isArray(d) ? d : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm("┬┐Eliminar este servicio del cat├ílogo?")) return;
    await dbDel("catalogo_servicios", id);
    showToast("Eliminado"); load();
  };
  const toggleActivo = async (id, activo) => {
    await dbUpd("catalogo_servicios", id, { activo: !activo });
    showToast(!activo ? "Activado Ô£ö" : "Desactivado"); load();
  };

  const filtered = rows.filter(r => {
    const matchCat = filtroCat === "todas" || r.categoria === filtroCat;
    const matchBuscar = !buscar || r.nombre?.toLowerCase().includes(buscar.toLowerCase()) || r.codigo?.toLowerCase().includes(buscar.toLowerCase());
    return matchCat && matchBuscar;
  });

  const categorias = ["todas", ...new Set(rows.map(r => r.categoria).filter(Boolean))];
  const CAMPOS_EXP = [{ label: "C├│digo", key: "codigo" }, { label: "Nombre", key: "nombre" }, { label: "Categor├¡a", key: "categoria" }, { label: "Precio base", key: "precio_base" }, { label: "Unidad", key: "unidad" }, { label: "Activo", key: "activo" }];

  if (!tableExists) return (
    <div style={S.card}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.red, marginBottom: 12 }}>ÔÜá´©Å Tabla no encontrada</div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>La tabla <code>catalogo_servicios</code> no existe en Supabase. Ejecuta este SQL:</div>
      <div style={{ background: "#0D1117", borderRadius: 10, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#7DD3FC", lineHeight: 1.8 }}>
        {\`CREATE TABLE catalogo_servicios (\\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\\n  empresa_id UUID,\\n  codigo TEXT,\\n  nombre TEXT NOT NULL,\\n  descripcion TEXT,\\n  categoria TEXT DEFAULT 'transporte',\\n  precio_base DECIMAL(12,2) DEFAULT 0,\\n  precio_tarjeta DECIMAL(12,2) DEFAULT 0,\\n  unidad TEXT DEFAULT 'servicio',\\n  aplica_iva BOOLEAN DEFAULT true,\\n  tasa_iva INTEGER DEFAULT 5,\\n  activo BOOLEAN DEFAULT true,\\n  imagen_emoji TEXT DEFAULT '­ƒÜù',\\n  notas TEXT,\\n  created_at TIMESTAMPTZ DEFAULT NOW()\\n);\\nALTER TABLE catalogo_servicios DISABLE ROW LEVEL SECURITY;\`}
      </div>
      <button onClick={load} style={{ ...S.btn("primary"), marginTop: 14 }}>Ôå║ Reintentar despu├®s de crear la tabla</button>
    </div>
  );

  if (vista === "form") return (
    <FormProducto initial={editItem} empId={empId}
      onSave={() => { setVista("catalogo"); setEditItem(null); load(); showToast("Guardado Ô£ö"); }}
      onCancel={() => { setVista("catalogo"); setEditItem(null); }} />
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Cat├ílogo de Servicios" datos={rows} campos={CAMPOS_EXP} onClose={() => setExportar(false)} />}
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[{ l: "Total servicios", v: rows.length, c: T.acc }, { l: "Activos", v: rows.filter(r => r.activo !== false).length, c: T.green }, { l: "Inactivos", v: rows.filter(r => r.activo === false).length, c: T.red }, { l: "Categor├¡as", v: new Set(rows.map(r => r.categoria)).size, c: T.blue }].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      {/* Controles */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...S.inp, maxWidth: 260 }} value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="­ƒöì Buscar por nombre o c├│digo..." />
        {categorias.map(c => (
          <button key={c} onClick={() => setFiltroCat(c)} style={{ ...S.btn(filtroCat === c ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {c === "todas" ? "Todas" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>­ƒôñ Exportar</button>
        <button onClick={load} style={{ ...S.btn("ghost"), fontSize: 11 }}>Ôå║</button>
        <button onClick={() => { setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize: 12, marginLeft: "auto" }}>+ Agregar servicio</button>
      </div>
      {/* Grid de tarjetas tipo cat├ílogo */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon="­ƒôª" msg="Sin servicios en el cat├ílogo" action="+ Agregar primer servicio" onAction={() => { setEditItem(null); setVista("form"); }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...S.card, opacity: r.activo === false ? 0.6 : 1, transition: "transform .15s", cursor: "default", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 36 }}>{r.imagen_emoji || "­ƒÜù"}</div>
                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: r.activo !== false ? T.greenD : T.redD, color: r.activo !== false ? T.green : T.red }}>{r.activo !== false ? "Activo" : "Inactivo"}</span>
              </div>
              {r.codigo && <div style={{ fontFamily: "monospace", fontSize: 10, color: T.mut }}>{r.codigo}</div>}
              <div style={{ fontSize: 14, fontWeight: 700 }}>{r.nombre}</div>
              {r.descripcion && <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.4 }}>{r.descripcion}</div>}
              <div style={{ padding: "8px 0", borderTop: \`1px solid \${T.bord}22\` }}>
                <div style={{ fontSize: 11, color: T.mut, marginBottom: 2 }}>{r.categoria} ┬À por {r.unidad}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.acc }}>Q {fmt(r.aplica_iva ? (r.precio_base || 0) * (1 + (r.tasa_iva || 0) / 100) : r.precio_base)}</div>
                {r.aplica_iva && <div style={{ fontSize: 11, color: T.sub }}>Incluye IVA {r.tasa_iva}% ┬À sin IVA: Q {fmt(r.precio_base)}</div>}
                {r.precio_tarjeta > 0 && <div style={{ fontSize: 11, color: T.sec }}>­ƒÆ│ Con tarjeta: Q {fmt(r.precio_tarjeta)}</div>}
              </div>
              {r.notas && <div style={{ fontSize: 11, color: T.mut, fontStyle: "italic" }}>{r.notas}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: \`1px solid \${T.bord}22\` }}>
                <button onClick={() => { setEditItem(r); setVista("form"); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11, padding: "5px 8px" }}>Ô£Å´©Å Editar</button>
                <button onClick={() => toggleActivo(r.id, r.activo)} style={{ ...S.btn(r.activo !== false ? "warn" : "green"), flex: 1, fontSize: 11, padding: "5px 8px" }}>{r.activo !== false ? "ÔÅ© Pausar" : "ÔûÂ Activar"}</button>
                <button onClick={() => del(r.id)} style={{ ...S.btn("danger"), fontSize: 11, padding: "5px 8px" }}>­ƒùæ´©Å</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
