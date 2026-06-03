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
  const [f, setF] = useState({
    codigo: "", nombre: "", tipo: "empresa", nit: "",
    direccion: "", telefono: "", email: "", contacto: "", notas: ""
  });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const { data: rows, loading, total, page, totalPages, pageSize, desde, hasta, setPage, setPageSize, reload } = usePaginacion({
    table: 'clientes', query: '', search: busqueda,
    columns: ['nombre', 'codigo', 'nit', 'telefono'],
    order: 'codigo.asc.nullslast',
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
    if (!confirm("Eliminar cliente?")) return;
    await dbDel("clientes", id); showToast("Eliminado"); reload();
  };

  const cargarScript = (url) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  function ImportadorClientes({ onClose }) {
    const [archivo, setArchivo] = useState(null);
    const [preview, setPreview] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const refFile = useRef(null);
    const [cols, setCols] = useState({ nombre: "", nit: "", telefono: "", email: "", direccion: "", contacto: "", notas: "" });

    const detectarColumnas = (headers) => {
      const h = headers.map(hh => hh.toLowerCase().trim());
      const c = { nombre: "", nit: "", telefono: "", email: "", direccion: "", contacto: "", notas: "" };
      h.forEach((hh, i) => {
        if (/nombre|razon|cliente|empresa/.test(hh)) c.nombre = i;
        else if (/nit|ruc|cui/.test(hh)) c.nit = i;
        else if (/tel[eé]fono|movil|cel/.test(hh)) c.telefono = i;
        else if (/email|correo|e-mail/.test(hh)) c.email = i;
        else if (/direccion|dir|domicilio/.test(hh)) c.direccion = i;
        else if (/contacto|atenci/.test(hh)) c.contacto = i;
        else if (/notas|obs|coment/.test(hh)) c.notas = i;
      });
      setCols(c);
    };

    const leerCSV = (texto) => {
      const lineas = texto.split(/\r?\n/).filter(l => l.trim());
      if (lineas.length < 2) return [];
      const headers = lineas[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
      detectarColumnas(headers);
      return lineas.slice(1, 12).map(l => {
        const vals = []; let cur = "", inQ = false;
        for (const ch of l) {
          if (ch === '"') { inQ = !inQ; continue; }
          if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
          cur += ch;
        }
        vals.push(cur.trim());
        const row = {};
        headers.forEach((h, i) => row[h] = vals[i] || "");
        return row;
      });
    };

    const leerXLSX = async (data) => {
      const wb = window.XLSX.read(data, { type: "array", codepage: 65001 });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 });
      if (json.length < 2) return [];
      const headers = json[0].map(h => String(h).trim());
      detectarColumnas(headers);
      return json.slice(1, 12).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]).trim() : "");
        return obj;
      });
    };

    const handleFile = async (file) => {
      setArchivo(file);
      setResultado(null);
      setPreview([]);
      if (!file) return;
      setProcesando(true);
      try {
        const ext = file.name.split(".").pop().toLowerCase();
        const buf = await file.arrayBuffer();
        const dec = new TextDecoder("utf-8");
        let rows;
        if (ext === "csv") {
          rows = leerCSV(dec.decode(buf));
        } else if (ext === "xlsx") {
          await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
          rows = await leerXLSX(buf);
        } else {
          showToast("Formato no soportado. Usa .csv o .xlsx", "err");
          setProcesando(false); return;
        }
        setPreview(rows);
      } catch (e) { showToast("Error al leer archivo: " + e.message, "err"); }
      setProcesando(false);
    };

    const importar = async () => {
      if (!archivo || preview.length === 0) { showToast("Selecciona un archivo valido", "err"); return; }
      setProcesando(true);
      const headers = Object.keys(preview[0] || {});
      const iN = cols.nombre, iNi = cols.nit, iT = cols.telefono, iE = cols.email, iD = cols.direccion, iC = cols.contacto, iNo = cols.notas;
      let ok = 0, err = 0;
      const archivoTexto = await archivo.text().catch(() => "");
      const lineas = archivoTexto.split(/\r?\n/).filter(l => l.trim());
      const datos = lineas.slice(1);
      for (const linea of datos) {
        const vals = []; let cur = "", inQ = false;
        for (const ch of linea) {
          if (ch === '"') { inQ = !inQ; continue; }
          if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
          cur += ch;
        }
        vals.push(cur.trim());
        const nombre = vals[iN] || "";
        if (!nombre) { err++; continue; }
        const r = await dbIns("clientes", {
          codigo: genCodigo(), nombre, empresa_id: empId,
          nit: vals[iNi] || "", telefono: vals[iT] || "",
          email: vals[iE] || "", direccion: vals[iD] || "",
          contacto: vals[iC] || "", notas: vals[iNo] || "", tipo: "empresa",
        });
        if (r?.error) { err++; continue; }
        ok++;
      }
      setResultado({ ok, err });
      showToast(`Importacion completada: ${ok} exitosos, ${err} omitidos`);
      setProcesando(false);
      onClose();
      reload();
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
          {preview.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: 14, border: `1px solid ${T.bord}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>{Object.keys(preview[0]).map(h => <th key={h} style={{ ...S.th, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>{preview.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ ...S.td, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {resultado && (
            <div style={{ padding: "10px 14px", background: resultado.err > 0 ? (resultado.ok > 0 ? T.secDim : T.redDim) : T.greenDim, borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
              {resultado.ok} importados, {resultado.err} omitidos
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={importar} disabled={procesando || preview.length === 0} style={{ ...S.btn("primary"), flex: 2 }}>
              {procesando ? "Importando..." : `Importar ${preview.length} registros`}
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
                  {["Codigo", "Cliente", "Tipo", "NIT", "Telefono", "Email", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const tc = TC[c.tipo] || TC.empresa;
                  return (
                    <tr key={c.id}
                      onMouseEnter={e => e.currentTarget.style.background = T.surf}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
                          <button onClick={() => del(c.id)} style={{ ...S.btn("danger"), padding: "3px 9px", fontSize: 11 }}>
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
          <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta}
            pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </div>
  );
}
