import React, { useState, useEffect, useRef } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Paginador, Buscador, ModalExportar } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

export default function PageClientes({ showToast, empId }) {
  const [vista, setVista]     = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [saving, setSaving]   = useState(false);
  const [allCodes, setAllCodes] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDel, setConfirmDel] = useState(null); // { id?, label }
  const [f, setF] = useState({
    codigo: "", nombre: "", tipo: "empresa", nit: "",
    direccion: "", telefono: "", email: "", contacto: "", notas: ""
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const { data: rows, loading, total, page, totalPages, pageSize, desde, hasta, setPage, setPageSize, reload } = usePaginacion({
    table: 'clientes', query: '', search: busqueda,
    columns: ['nombre', 'codigo', 'nit', 'telefono'],
    order: 'codigo.asc',
  });

  useEffect(() => {
    dbGet("clientes", "&select=codigo").then(d => setAllCodes(Array.isArray(d) ? d : []));
  }, []);

  const genCodigo = () => {
    let max = 0;
    allCodes.forEach(r => {
      const m = (r.codigo || "").match(/^(\d+)/);
      if (m) { const n = parseInt(m[1]); if (n > max) max = n; }
    });
    return String(max + 1).padStart(3, "0") + "C";
  };

  const abrirEditar = c => {
    setF({
      codigo: c.codigo || '', nombre: c.nombre || '', tipo: c.tipo || 'empresa',
      nit: c.nit || '', direccion: c.direccion || '', telefono: c.telefono || '',
      email: c.email || '', contacto: c.contacto || '', notas: c.notas || ''
    });
    setEditItem(c); setVista("form");
  };

  const abrirNuevo = () => {
    setF({ codigo: genCodigo(), nombre: '', tipo: 'empresa', nit: '', direccion: '', telefono: '', email: '', contacto: '', notas: '' });
    setEditItem(null); setVista("form");
  };

  const guardar = async () => {
    if (!f.nombre.trim()) { showToast("Nombre requerido", "err"); return; }
    setSaving(true);
    const p = { ...f, empresa_id: empId };
    let res;
    if (editItem?.id) res = await dbUpd("clientes", editItem.id, p);
    else res = await dbIns("clientes", p);
    if (res?.error) { showToast(res.error, "err"); setSaving(false); return; }
    showToast("Cliente guardado"); setSaving(false); setVista("lista"); setEditItem(null);
    setAllCodes(prev => {
      const exist = prev.find(x => x.codigo === f.codigo);
      return exist ? prev : [...prev, { codigo: f.codigo }];
    });
    reload();
  };

  const del = async id => {
    const r = await dbDel("clientes", id);
    if (r?.error) { showToast(r.error, "err"); return; }
    showToast("Eliminado"); reload();
  };

  const delSelected = async () => {
    const n = selectedIds.size;
    if (n === 0) return;
    let ok = 0, errs = 0;
    for (const id of selectedIds) {
      const r = await dbDel("clientes", id);
      if (r?.error) { errs++; continue; }
      ok++;
    }
    showToast(`${ok} eliminado${ok !== 1 ? "s" : ""}, ${errs} error${errs !== 1 ? "es" : ""}`);
    setSelectedIds(new Set());
    reload();
  };

  const toggleSel = id => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const cargarScript = (url) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  function ImportadorClientes({ onClose }) {
    const [archivo, setArchivo] = useState(null);
    const [preview, setPreview] = useState([]);
    const [parsedRows, setParsedRows] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [encabezados, setEncabezados] = useState([]);
    const refFile = useRef(null);
    const iCols = useRef({ nombre: "", nit: "", telefono: "", email: "", direccion: "", contacto: "", notas: "", tipo: "" });

    const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ]/g, " ").trim();

    const detectarColumnas = (headers) => {
      if (!Array.isArray(headers) || headers.length === 0) return;
      const h = headers.map(hh => norm(hh));
      const orig = headers.map(hh => String(hh).trim());
      const c = { nombre: "", nit: "", telefono: "", email: "", direccion: "", contacto: "", notas: "", tipo: "" };
      h.forEach((hh, i) => {
        if (/nombre|razon social|cliente|full name|name|empresa/.test(hh)) c.nombre = i;
        else if (/nit|ruc|cui|id fiscal|documento|identificacion/.test(hh)) c.nit = i;
        else if (/telefono|movil|cel|phone/.test(hh)) c.telefono = i;
        else if (/email|correo|e.mail|mail/.test(hh)) c.email = i;
        else if (/direccion|dir|domicilio|address/.test(hh)) c.direccion = i;
        else if (/contacto|atencion/.test(hh)) c.contacto = i;
        else if (/notas|obs|coment|note/.test(hh)) c.notas = i;
        else if (/tipo|categoria|class/.test(hh)) c.tipo = i;
      });
      if (c.nombre === "" && headers.length > 0) c.nombre = 0;
      iCols.current = c;
      return orig; // for debug display
    };

    const csvRowToArray = (linea, delim) => {
      const vals = []; let cur = "", inQ = false;
      for (const ch of linea) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === delim && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      vals.push(cur.trim());
      return vals;
    };

    const detectarDelim = (linea) => {
      const c = (linea.match(/,/g) || []).length;
      const s = (linea.match(/;/g) || []).length;
      const t = (linea.match(/\t/g) || []).length;
      if (c >= s && c >= t) return ",";
      if (s >= c && s >= t) return ";";
      return "\t";
    };

    const leerCSV = (texto) => {
      let text = texto;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const lineas = text.split(/\r?\n/).filter(l => l.trim() || l === "");
      if (lineas.length < 2) return [];
      const delim = detectarDelim(lineas[0]);
      const headers = csvRowToArray(lineas[0], delim).map(h => h.replace(/^"|"$/g, "").trim());
      const orig = detectarColumnas(headers) || headers;
      setEncabezados(orig);
      return lineas.slice(1).map(l => csvRowToArray(l, delim));
    };

    const leerXLSX = async (data) => {
      const wb = window.XLSX.read(data, { type: "array", codepage: 65001 });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 });
      if (json.length < 2) return [];
      const headers = json[0].map(h => String(h).trim());
      const orig = detectarColumnas(headers) || headers;
      setEncabezados(orig);
      return json.slice(1).map(row => {
        const arr = [];
        headers.forEach((_, i) => arr.push(row[i] !== undefined ? String(row[i]).trim() : ""));
        return arr;
      });
    };

    const handleFile = async (file) => {
      setArchivo(file);
      setResultado(null);
      setPreview([]);
      setParsedRows([]);
      setEncabezados([]);
      if (!file) return;
      setProcesando(true);
      try {
        const ext = file.name.split(".").pop().toLowerCase();
        const buf = await file.arrayBuffer();
        const dec = new TextDecoder("utf-8");
        let allRows;
        if (ext === "csv") {
          allRows = leerCSV(dec.decode(buf));
        } else if (ext === "xlsx") {
          await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
          allRows = await leerXLSX(buf);
        } else {
          showToast("Formato no soportado. Usa .csv o .xlsx", "err");
          setProcesando(false); return;
        }
        setParsedRows(allRows);
        setPreview(allRows.slice(0, 11));
      } catch (e) { showToast("Error al leer archivo: " + e.message, "err"); }
      setProcesando(false);
    };

    const importar = async () => {
      try {
        if (!archivo || parsedRows.length === 0) { showToast("Selecciona un archivo valido", "err"); return; }
        setProcesando(true);
        const c = iCols.current;
        let maxCode = 0;
        allCodes.forEach(r => {
          const m = (r.codigo || "").match(/^(\d+)/);
          if (m) { const n = parseInt(m[1]); if (n > maxCode) maxCode = n; }
        });
        let ok = 0, err = 0, imported = [];
        for (const vals of parsedRows) {
          const nombre = vals[c.nombre] != null ? String(vals[c.nombre]).trim() : "";
          if (!nombre) { err++; continue; }
          maxCode++;
          let tipo = "empresa";
          if (c.tipo !== "") {
            const raw = (vals[c.tipo] || "").toLowerCase();
            if (/gobierno|ong|oficial|publico/.test(raw)) tipo = "gobierno";
            else if (/persona|natural|individual/.test(raw)) tipo = "persona";
          }
          const codigo = String(maxCode).padStart(3, "0") + "C";
          const r = await dbIns("clientes", {
            codigo, nombre, empresa_id: empId,
            nit: vals[c.nit] != null ? String(vals[c.nit]).trim() : "",
            telefono: vals[c.telefono] != null ? String(vals[c.telefono]).trim() : "",
            email: vals[c.email] != null ? String(vals[c.email]).trim() : "",
            direccion: vals[c.direccion] != null ? String(vals[c.direccion]).trim() : "",
            contacto: vals[c.contacto] != null ? String(vals[c.contacto]).trim() : "",
            notas: vals[c.notas] != null ? String(vals[c.notas]).trim() : "",
            tipo,
          });
          if (r?.error) { err++; continue; }
          ok++;
          imported.push({ codigo });
        }
        setAllCodes(prev => [...prev, ...imported]);
        setResultado({ ok, err });
        showToast(`Importacion completada: ${ok} exitosos, ${err} omitidos`);
        setProcesando(false);
        onClose();
        reload();
      } catch (e) { showToast("Error en importacion: " + (e.message || e), "err"); setProcesando(false); }
    };

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...S.card, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Importar clientes desde Excel</div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 22 }}>X</button>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ border: `2px dashed ${archivo ? T.acc : T.bord}`, borderRadius: 12, padding: "24px 14px", textAlign: "center", cursor: "pointer", background: archivo ? T.accDim : "transparent" }}
              onClick={() => refFile.current?.click()}>
              <div style={{ fontSize: 28, marginBottom: 6, color: archivo ? T.acc : T.sub }}>XLS</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{archivo ? archivo.name : "Selecciona archivo .xlsx o .csv"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Columnas: nombre, nit, telefono, email, direccion, contacto</div>
              <input ref={refFile} type="file" accept=".csv,.xlsx" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            </div>
          </div>
          {procesando && <div style={{ textAlign: "center", padding: 12, color: T.acc }}>Procesando...</div>}
          {archivo && !procesando && (
            <div style={{ fontSize: 11, color: T.mut, marginBottom: 10, padding: "6px 10px", background: T.surf, borderRadius: 6 }}>
              Encabezados: <b>{encabezados.join(" | ") || "(sin encabezados)"}</b>
              <br />Mapeo: {
                Object.entries(iCols.current).filter(([,v]) => v !== "").map(([k, v]) => `${k}→col.${v}`).join(", ") || "ninguno"
              } — {parsedRows.length} filas
              {parsedRows.length > 0 && (
                <><br />Fila 1: <b>{JSON.stringify(parsedRows[0])}</b> — valor nombre (col.{iCols.current.nombre}): <b>"{parsedRows[0][iCols.current.nombre]}"</b></>
              )}
            </div>
          )}
          {preview.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: 14, border: `1px solid ${T.bord}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>
                  {Array.from({length: preview[0].length}, (_, i) => (
                    <th key={i} style={{ ...S.th, whiteSpace: "nowrap", background: T.surf, fontSize: 10 }}>
                      Col {i}{iCols.current.nombre === i ? " (nombre)" : ""}
                    </th>
                  ))}
                </tr></thead>
                <tbody>{preview.map((row, i) => <tr key={i}>{(row).map((v, j) => <td key={j} style={{ ...S.td, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</td>)}</tr>)}</tbody>
              </table>
              <div style={{ fontSize: 10, color: T.mut, padding: "3px 8px", textAlign: "right" }}>
                Mostrando {preview.length} de {parsedRows.length} filas
              </div>
            </div>
          )}
          {resultado && (
            <div style={{ padding: "10px 14px", background: resultado.err > 0 ? (resultado.ok > 0 ? T.secDim : T.redDim) : T.greenDim, borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
              {resultado.ok} importados, {resultado.err} omitidos
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={importar} disabled={procesando || parsedRows.length === 0} style={{ ...S.btn("primary"), flex: 2 }}>
              {procesando ? "Importando..." : `Importar ${parsedRows.length} registros`}
            </button>
            <button onClick={onClose} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  const TC = {
    empresa:  { c: T.sec,  bg: T.secDim,  l: "Empresa"       },
    gobierno: { c: T.blue, bg: T.blueDim, l: "Gobierno / ONG" },
    persona:  { c: T.acc,  bg: T.accDim,  l: "Persona"        },
  };

  if (vista === "form") return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.acc }}>
          {editItem ? "Editar cliente" : "Nuevo cliente"}
        </div>
        <button onClick={() => { setVista("lista"); setEditItem(null); }} style={S.btn("ghost")}>
          Volver
        </button>
      </div>

      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Fld label="CODIGO DE CLIENTE">
          <input style={{ ...S.inp, fontFamily: "monospace", fontWeight: 700 }}
            value={f.codigo} onChange={e => sf("codigo", e.target.value.toUpperCase())}
            placeholder="001C" />
        </Fld>
        <Fld label="TIPO DE CLIENTE">
          <select style={S.sel} value={f.tipo} onChange={e => sf("tipo", e.target.value)}>
            <option value="empresa">Empresa</option>
            <option value="gobierno">Gobierno / ONG</option>
            <option value="persona">Persona natural</option>
          </select>
        </Fld>
        <Fld label="NOMBRE / RAZON SOCIAL" span2>
          <input style={S.inp} value={f.nombre} onChange={e => sf("nombre", e.target.value)}
            placeholder="Nombre completo o razon social" />
        </Fld>
        <Fld label="NIT">
          <input style={S.inp} value={f.nit} onChange={e => sf("nit", e.target.value)} placeholder="1234567-8" />
        </Fld>
        <Fld label="TELEFONO">
          <input style={S.inp} value={f.telefono} onChange={e => sf("telefono", e.target.value)} placeholder="(502) 0000-0000" />
        </Fld>
        <Fld label="CORREO ELECTRONICO" span2>
          <input style={S.inp} type="email" value={f.email} onChange={e => sf("email", e.target.value)} placeholder="correo@empresa.com" />
        </Fld>
        <Fld label="PERSONA DE CONTACTO">
          <input style={S.inp} value={f.contacto} onChange={e => sf("contacto", e.target.value)} placeholder="Nombre del contacto" />
        </Fld>
        <Fld label="DIRECCION">
          <input style={S.inp} value={f.direccion} onChange={e => sf("direccion", e.target.value)} placeholder="Direccion completa" />
        </Fld>
        <Fld label="NOTAS" span2>
          <textarea style={{ ...S.inp, minHeight: 60, resize: "vertical" }}
            value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
        </Fld>
        <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
          <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex: 2 }}>
            {saving ? "Guardando..." : "Guardar cliente"}
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
      {showExport && (
        <ModalExportar titulo="Clientes" datos={rows} campos={[
          { key: 'codigo', label: 'Codigo' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'nit', label: 'NIT' },
          { key: 'telefono', label: 'Telefono' },
          { key: 'email', label: 'Email' },
          { key: 'contacto', label: 'Contacto' },
          { key: 'direccion', label: 'Direccion' },
          { key: 'notas', label: 'Notas' },
        ]} onClose={() => setShowExport(false)} />
      )}

      {showImport && (
        <ImportadorClientes onClose={() => setShowImport(false)} />
      )}

      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...S.card, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
              {confirmDel.ids ? `Eliminar ${confirmDel.n} clientes?` : "Eliminar cliente?"}
            </div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>
              {confirmDel.ids
                ? `Se eliminaran ${confirmDel.n} clientes seleccionados permanentemente.`
                : `Se eliminara "${confirmDel.label}" permanentemente.`}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={async () => {
                if (confirmDel.ids) {
                  let ok = 0, errs = 0;
                  for (const id of confirmDel.ids) {
                    const r = await dbDel("clientes", id);
                    if (r?.error) { errs++; continue; }
                    ok++;
                  }
                  showToast(`${ok} eliminado${ok !== 1 ? "s" : ""}, ${errs} error${errs !== 1 ? "es" : ""}`);
                  setSelectedIds(new Set());
                } else {
                  const r = await dbDel("clientes", confirmDel.id);
                  if (r?.error) { showToast(r.error, "err"); setConfirmDel(null); return; }
                  showToast("Eliminado");
                }
                setConfirmDel(null);
                reload();
              }} style={{ ...S.btn("danger"), flex: 1 }}>Eliminar</button>
              <button onClick={() => setConfirmDel(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>
          Directorio de Clientes ({total})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={{ ...S.btn("blue"), fontSize: 12 }}>Importar</button>
          <button onClick={() => setShowExport(true)} style={{ ...S.btn("green"), fontSize: 12 }}>Exportar</button>
          <button onClick={reload} style={{ ...S.btn("ghost"), fontSize: 12 }}>Actualizar</button>
          <button onClick={abrirNuevo} style={{ ...S.btn("primary"), fontSize: 12 }}>+ Nuevo cliente</button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, codigo, NIT..." />
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty icon="C" msg={total === 0 ? "Sin clientes registrados" : "Sin resultados"}
          action="+ Agregar cliente" onAction={abrirNuevo} />
      ) : (
        <>
          <div style={{ ...S.card, overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 32, textAlign: "center" }}>
                    <input type="checkbox" style={{ cursor: "pointer" }}
                      checked={rows.length > 0 && rows.every(r => selectedIds.has(r.id))}
                      onChange={() => {
                        if (rows.every(r => selectedIds.has(r.id))) setSelectedIds(new Set());
                        else setSelectedIds(new Set(rows.map(r => r.id)));
                      }} />
                  </th>
                  {["Codigo", "Cliente", "Tipo", "NIT", "Telefono", "Email", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows].sort((a, b) => {
                  if (!a.codigo && !b.codigo) return 0;
                  if (!a.codigo) return 1;
                  if (!b.codigo) return -1;
                  return a.codigo.localeCompare(b.codigo);
                }).map(c => {
                  const tc = TC[c.tipo] || TC.empresa;
                  const sel = selectedIds.has(c.id);
                  return (
                    <tr key={c.id}
                      style={{ background: sel ? T.accDim : "transparent" }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = T.surf; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        <input type="checkbox" checked={sel}
                          onChange={() => toggleSel(c.id)} style={{ cursor: "pointer" }} />
                      </td>
                      <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 12 }}>
                        {c.codigo || "—"}
                      </td>
                      <td style={{ ...S.td, fontWeight: 600 }}>
                        {c.nombre}
                        {c.contacto && <div style={{ fontSize: 10, color: T.mut }}>Contacto: {c.contacto}</div>}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, color: tc.c, background: tc.bg }}>
                          {tc.l}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: T.mut }}>{c.nit || "—"}</td>
                      <td style={{ ...S.td, color: T.sub, fontSize: 12 }}>{c.telefono || "—"}</td>
                      <td style={{ ...S.td, color: T.sub, fontSize: 11 }}>{c.email || "—"}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => abrirEditar(c)} style={{ ...S.btn("ghost"), padding: "3px 9px", fontSize: 11 }}>
                            Editar
                          </button>
                          <button onClick={() => setConfirmDel({ id: c.id, label: c.nombre })} style={{ ...S.btn("danger"), padding: "3px 9px", fontSize: 11 }}>
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
          {selectedIds.size > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.sub }}>{selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}</span>
              <button onClick={() => setConfirmDel({ ids: [...selectedIds], n: selectedIds.size })} style={{ ...S.btn("danger"), fontSize: 12 }}>Eliminar seleccionados</button>
              <button onClick={() => setSelectedIds(new Set())} style={{ ...S.btn("ghost"), fontSize: 12 }}>Limpiar</button>
            </div>
          )}
          <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta}
            pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </div>
  );
}
