import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

const CATS = ["ventas", "combustible", "mantenimiento", "salarios", "seguros", "servicios", "oficina", "otros"];
const CC = { ventas: T.acc, combustible: T.sec, mantenimiento: T.blue, salarios: T.green, seguros: T.purple, servicios: T.acc, oficina: T.mut, otros: T.sub };

const EFM = { fecha: today(), tipo: "ingreso", descripcion: "", monto: "", referencia: "", categoria: "ventas", conciliado: false, notas: "" };
const EFC = { banco: "", numero_cuenta: "", tipo_cuenta: "monetaria", moneda: "GTQ", saldo_inicial: "", saldo_actual: "", notas: "" };

function DetalleMovimiento({ mov, onClose }) {
  if (!mov) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400 }} onClick={onClose}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 380, background: T.card, borderLeft: `1px solid ${T.bord}`, overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.bord}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Detalle del movimiento</div>
          <button onClick={onClose} style={{ ...S.btn("ghost"), padding: "4px 10px" }}>X</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: mov.tipo === "ingreso" ? T.green : T.red, marginBottom: 16 }}>
            {mov.tipo === "ingreso" ? "+ " : "- "}Q {fmt(mov.monto)}
          </div>
          {[
            ["Fecha", fmtD(mov.fecha)],
            ["Tipo", mov.tipo === "ingreso" ? "Ingreso" : "Egreso"],
            ["Descripcion", mov.descripcion || "—"],
            ["Categoria", mov.categoria],
            ["Referencia", mov.referencia || "—"],
            ["Conciliado", mov.conciliado ? "Si" : "No"],
            ["Cliente asociado", mov.cliente_nombre || "—"],
            ["Reserva asociada", mov.reserva_numero || "—"],
            ["Factura asociada", mov.factura_numero || "—"],
            ["Observaciones", mov.notas || "—"],
            ["Creado", fmtD(mov.created_at)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.bord}18`, fontSize: 12 }}>
              <span style={{ color: T.sub }}>{l}</span>
              <span style={{ fontWeight: 500, color: T.txt, textAlign: "right", maxWidth: "55%" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportadorBancario({ showToast, empId, cuentaAct, onImported, onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [todasFilas, setTodasFilas] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [cols, setCols] = useState({ fecha: "", descripcion: "", monto: "", tipo: "", referencia: "", debito: "", credito: "" });
  const [resultado, setResultado] = useState(null);
  const refFile = useRef(null);

  const parsearCSV = (lineas, separador) => {
    let headerIdx = -1;
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i].toLowerCase();
      if (/fecha|date/.test(l) && /descripc|concepto|detalle/.test(l)) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return { headers: [], rows: [] };
    const headers = lineas[headerIdx].split(separador).map(h => h.replace(/^"|"$/g, "").trim());
    const rows = lineas.slice(headerIdx + 1).map(l => {
      const vals = [];
      let cur = "", inQ = false;
      for (const ch of l) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === separador && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      vals.push(cur.trim());
      const row = {};
      headers.forEach((h, i) => row[h] = vals[i] !== undefined ? vals[i] : "");
      return row;
    });
    return { headers, rows };
  };

  const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const detectarColumnas = (headers) => {
    const h = headers.map(hh => normalizar(hh.toLowerCase().trim()));
    const c = { fecha: "", descripcion: "", monto: "", tipo: "", referencia: "", debito: "", credito: "" };
    h.forEach((hh, i) => {
      if (/fecha|date/.test(hh)) c.fecha = i;
      else if (/descripc|concepto|detalle|glosa/.test(hh)) c.descripcion = i;
      else if (/monto|importe|valor|total|cantidad/.test(hh)) c.monto = i;
      else if (/tipo/.test(hh)) c.tipo = i;
      else if (/refe|doc|numero|comprob/.test(hh)) c.referencia = i;
      else if (/debito|debe|cargo/.test(hh)) c.debito = i;
      else if (/credito|haber/.test(hh)) c.credito = i;
    });
    if (c.monto !== "" && c.debito !== "" && c.credito !== "") c.monto = "";
    setCols(c);
  };

  const leerCSVcompleto = (texto) => {
    const lineas = texto.split(/\r?\n/).filter(l => l.trim());
    if (lineas.length < 2) return [];
    const sep = texto.includes(";") ? ";" : texto.includes("\t") ? "\t" : ",";
    const { headers, rows } = parsearCSV(lineas, sep);
    if (headers.length === 0) return [];
    detectarColumnas(headers);
    return rows;
  };

  const leerXLSXcompleto = async (data) => {
    try {
      const wb2 = window.XLSX.read(data, { type: "array", codepage: 65001 });
      const ws = wb2.Sheets[wb2.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 });
      if (json.length < 2) return [];
      const headers = json[0].map(h => String(h).trim());
      detectarColumnas(headers);
      return json.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]).trim() : "");
        return obj;
      });
    } catch { return []; }
  };

  const handleFile = async (file) => {
    setArchivo(file);
    setResultado(null);
    setPreview([]);
    setTodasFilas([]);
    if (!file) return;
    setProcesando(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const buf = await file.arrayBuffer();
      let dec = new TextDecoder("utf-8");
      let texto = dec.decode(buf);
      if (/^\uFFFD/.test(texto)) {
        dec = new TextDecoder("windows-1252");
        texto = dec.decode(buf);
      }
      let rows;
      if (ext === "csv" || ext === "txt") {
        rows = leerCSVcompleto(texto);
      } else if (ext === "xlsx") {
        await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
        rows = await leerXLSXcompleto(buf);
      } else {
        showToast("Formato no soportado. Usa .csv, .txt o .xlsx", "err");
        setProcesando(false); return;
      }
      setTodasFilas(rows);
      setPreview(rows.slice(0, 10));
    } catch (e) { showToast("Error al leer archivo: " + e.message, "err"); }
    setProcesando(false);
  };

  const importar = async () => {
    if (todasFilas.length === 0) { showToast("Selecciona un archivo valido", "err"); return; }
    setProcesando(true);
    const headers = Object.keys(todasFilas[0] || {});
    const iF = cols.fecha !== "" ? headers[parseInt(cols.fecha)] : "";
    const iD = cols.descripcion !== "" ? headers[parseInt(cols.descripcion)] : "";
    const iM = cols.monto !== "" ? headers[parseInt(cols.monto)] : "";
    const iT = cols.tipo !== "" ? headers[parseInt(cols.tipo)] : "";
    const iR = cols.referencia !== "" ? headers[parseInt(cols.referencia)] : "";
    const iDeb = cols.debito !== "" ? headers[parseInt(cols.debito)] : "";
    const iCred = cols.credito !== "" ? headers[parseInt(cols.credito)] : "";
    let ok = 0, err = 0;
    for (const row of todasFilas) {
      const fecha = iF ? (row[iF] || "") : "";
      const descripcion = iD ? (row[iD] || "") : "";
      let monto = 0, tipo = "ingreso";
      if (iM) {
        let raw = (row[iM] || "0").replace(/["']/g, "").trim();
        raw = raw.replace(",", ".");
        monto = parseFloat(raw.replace(/[^0-9.\-]/g, "")) || 0;
        if (iT) {
          const tv = (row[iT] || "").toLowerCase();
          tipo = tv.includes("egr") || tv.includes("sal") ? "egreso" : "ingreso";
        } else {
          tipo = monto >= 0 ? "ingreso" : "egreso";
        }
      } else if (iDeb || iCred) {
        let d = iDeb ? (row[iDeb] || "0").replace(/["']/g, "").trim() : "0";
        let c = iCred ? (row[iCred] || "0").replace(/["']/g, "").trim() : "0";
        d = d.replace(",", "."); c = c.replace(",", ".");
        const deb = parseFloat(d.replace(/[^0-9.\-]/g, "")) || 0;
        const cred = parseFloat(c.replace(/[^0-9.\-]/g, "")) || 0;
        if (deb > 0) { monto = deb; tipo = "egreso"; }
        else if (cred > 0) { monto = cred; tipo = "ingreso"; }
        else { err++; continue; }
      }
      const referencia = iR ? (row[iR] || "") : "";
      if (!descripcion || monto === 0) { err++; continue; }
      const r = await dbIns("movimientos_bancarios", {
        empresa_id: empId, cuenta_id: cuentaAct.id,
        fecha, tipo, descripcion, monto,
        referencia, categoria: "otros", conciliado: false,
      });
      if (r?.error) { err++; continue; }
      ok++;
    }
    setResultado({ ok, err });
    showToast(`Importacion completada: ${ok} exitosos, ${err} errores`);
    setProcesando(false);
    onImported();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Importar movimientos bancarios</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 22 }}>X</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ border: `2px dashed ${archivo ? T.acc : T.bord}`, borderRadius: 12, padding: "24px 14px", textAlign: "center", cursor: "pointer", background: archivo ? T.accDim : "transparent" }}
            onClick={() => refFile.current?.click()}>
            <div style={{ fontSize: 28, marginBottom: 6, color: archivo ? T.acc : T.sub }}>XLS</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{archivo ? archivo.name : "Selecciona archivo .xlsx o .csv"}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Columnas: fecha, descripcion, monto/tipo o debito/credito</div>
            <input ref={refFile} type="file" accept=".csv,.xlsx,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          </div>
        </div>
        {procesando && <div style={{ textAlign: "center", padding: 12, color: T.acc }}>Procesando...</div>}
        {Object.keys(cols).length > 0 && (
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Columnas detectadas: {Object.entries(cols).filter(([,v]) => v !== "").map(([k]) => k).join(", ") || "ninguna"}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {["fecha", "descripcion", "monto", "tipo", "referencia", "debito", "credito"].map(campo => (
            <div key={campo}>
              <label style={{ ...S.lbl, fontSize: 10 }}>{campo}</label>
              <select style={{ ...S.sel, fontSize: 11, padding: "4px 8px" }} value={cols[campo]} onChange={e => setCols(p => ({ ...p, [campo]: e.target.value }))}>
                <option value="">Sin mapeo</option>
                {preview.length > 0 && Object.keys(preview[0]).map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>
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
          <button onClick={importar} disabled={procesando || todasFilas.length === 0} style={{ ...S.btn("primary"), flex: 2 }}>
            {procesando ? "Importando..." : `Importar ${todasFilas.length} registros`}
          </button>
          <button onClick={onClose} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function PageBanca({ showToast, empId }) {
  const [cuentas,    setCuentas]    = useState([]);
  const [cuentaAct,  setCuentaAct]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [showCuenta, setShowCuenta] = useState(false);
  const [editMovId,  setEditMovId]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [filtroT,    setFiltroT]    = useState("todos");
  const [filtroC,    setFiltroC]    = useState("todos");
  const [exportar,   setExportar]   = useState(false);
  const [importar,   setImportar]   = useState(false);
  const [detalleMov, setDetalleMov] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [recalcMsg,  setRecalcMsg]  = useState(null);

  const [f,  setF]  = useState({ ...EFM });
  const [fc, setFc]  = useState({ ...EFC });
  const sf  = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sfc = (k, v) => setFc(p => ({ ...p, [k]: v }));

  const recalcularSaldo = async (cuentaId) => {
    const todo = await dbGet(`movimientos_bancarios?cuenta_id=eq.${cuentaId}&select=monto,tipo`);
    const movsArr = Array.isArray(todo) ? todo : [];
    const cta = await dbGet(`cuentas_bancarias?id=eq.${cuentaId}`);
    const ctaArr = Array.isArray(cta) ? cta : [cta];
    if (!ctaArr || ctaArr.length === 0) return;
    const saldoInicial = parseFloat(ctaArr[0].saldo_inicial) || 0;
    const ingresos = movsArr.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
    const egresos = movsArr.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
    const nuevoSaldo = saldoInicial + ingresos - egresos;
    await dbUpd("cuentas_bancarias", cuentaId, { saldo_actual: nuevoSaldo });
    setCuentaAct(p => p?.id === cuentaId ? { ...p, saldo_actual: nuevoSaldo } : p);
    setCuentas(p => p.map(c => c.id === cuentaId ? { ...c, saldo_actual: nuevoSaldo } : c));
    return nuevoSaldo;
  };

  const loadCuentas = async () => {
    setLoading(true);
    const c = await dbGet("cuentas_bancarias");
    const arr = Array.isArray(c) ? c : [];
    setCuentas(arr);
    if (arr.length > 0 && !cuentaAct) setCuentaAct(arr[0]);
    setLoading(false);
  };

  const queryMovs = cuentaAct ? 'cuenta_id=eq.'+cuentaAct.id : '';
  const { data: movs, loading: loadingMovs, total: totalMovs, page: pageMovs, totalPages: totalPagesMovs, pageSize: pageSizeMovs, setPage: setPageMovs, setPageSize: setPageSizeMovs, reload: reloadMovs, desde: desdeMovs, hasta: hastaMovs } = usePaginacion({
    table: 'movimientos_bancarios',
    query: queryMovs,
    search: busqueda,
    columns: ['concepto', 'referencia', 'descripcion'],
    order: 'fecha.desc',
  });

  useEffect(() => { loadCuentas(); }, []);

  const guardarCuenta = async () => {
    if (!fc.banco.trim()) { showToast("Nombre del banco requerido", "err"); return; }
    setSaving(true);
    const saldoInicial = parseFloat(fc.saldo_inicial) || 0;
    const payload = { ...fc, empresa_id: empId, saldo_inicial: saldoInicial, saldo_actual: saldoInicial };
    const r = await dbIns("cuentas_bancarias", payload);
    if (r?.error) { showToast("Error: " + r.error, "err"); setSaving(false); return; }
    showToast("Cuenta registrada"); setSaving(false); setShowCuenta(false); setFc({ ...EFC }); loadCuentas();
  };

  const abrirEditarMov = (mov) => {
    setEditMovId(mov.id);
    setF({
      fecha: mov.fecha || today(),
      tipo: mov.tipo || "ingreso",
      descripcion: mov.descripcion || "",
      monto: mov.monto || "",
      referencia: mov.referencia || "",
      categoria: mov.categoria || "ventas",
      conciliado: mov.conciliado || false,
      notas: mov.notas || "",
    });
    setShowForm(true);
  };

  const guardarMov = async () => {
    if (!f.descripcion.trim() || !(parseFloat(f.monto) > 0)) {
      showToast("Descripcion y monto requeridos", "err"); return;
    }
    setSaving(true);
    const payload = {
      empresa_id: empId, cuenta_id: cuentaAct.id,
      fecha: f.fecha, tipo: f.tipo, descripcion: f.descripcion,
      monto: parseFloat(f.monto), referencia: f.referencia,
      categoria: f.categoria, conciliado: f.conciliado, notas: f.notas,
    };
    if (editMovId) {
      const r = await dbUpd("movimientos_bancarios", editMovId, payload);
      if (r?.error) { showToast("Error: " + r.error, "err"); setSaving(false); return; }
      showToast("Movimiento actualizado");
    } else {
      const mov = await dbIns("movimientos_bancarios", payload);
      if (mov?.error) { showToast("Error: " + mov.error, "err"); setSaving(false); return; }
      showToast("Guardado");
    }
    setSaving(false); setShowForm(false); setEditMovId(null);
    setF({ ...EFM }); await recalcularSaldo(cuentaAct.id); reloadMovs();
  };

  const conciliar = async (id, val) => {
    await dbUpd("movimientos_bancarios", id, { conciliado: val });
    reloadMovs();
  };

  const delMov = async id => {
    const mov = movs.find(m => m.id === id);
    if (!mov) return;
    await dbDel("movimientos_bancarios", id);
    showToast("Eliminado");
    await recalcularSaldo(cuentaAct.id);
    reloadMovs();
  };

  const cerrarForm = () => { setShowForm(false); setEditMovId(null); setF({ ...EFM }); };

  const movsFil = movs.filter(m => {
    if (filtroT !== "todos" && m.tipo !== filtroT) return false;
    if (filtroC === "conciliado" && !m.conciliado) return false;
    if (filtroC === "pendiente"  &&  m.conciliado) return false;
    return true;
  });

  const saldoCalculado = cuentaAct
    ? (parseFloat(cuentaAct.saldo_inicial) || 0)
      + movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
      - movs.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
    : 0;
  const saldoAlmacenado = parseFloat(cuentaAct?.saldo_actual || 0);
  const saldoOK = Math.abs(saldoCalculado - saldoAlmacenado) < 0.01;
  const saldoTotal  = cuentas.reduce((s, c) => s + (parseFloat(c.saldo_actual) || 0), 0);
  const ingTotal    = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const egTotal     = movs.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const sinConciliar = movs.filter(m => !m.conciliado).length;

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Movimientos Bancarios" datos={movs}
          campos={[
            { label: "Fecha", key: "fecha" }, { label: "Descripcion", key: "descripcion" },
            { label: "Categoria", key: "categoria" }, { label: "Tipo", key: "tipo" },
            { label: "Monto", key: "monto" }, { label: "Referencia", key: "referencia" },
            { label: "Conciliado", key: "conciliado" },
          ]} onClose={() => setExportar(false)} />
      )}

      {importar && (
        <ImportadorBancario showToast={showToast} empId={empId} cuentaAct={cuentaAct}
          onImported={() => { setImportar(false); recalcularSaldo(cuentaAct.id); reloadMovs(); }}
          onClose={() => setImportar(false)} />
      )}

      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...S.card, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Eliminar movimiento?</div>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>Se eliminara permanentemente.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={async () => { await delMov(confirmDel); setConfirmDel(null); }}
                style={{ ...S.btn("danger"), flex: 1 }}>Eliminar</button>
              <button onClick={() => setConfirmDel(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <DetalleMovimiento mov={detalleMov} onClose={() => setDetalleMov(null)} />

      {recalcMsg && (
        <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: T.txt }}>
          {recalcMsg}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Saldo total GTQ",  v: `Q ${fmt(saldoTotal)}`,  c: T.acc,  bg: T.accDim  },
          { l: "Ingresos periodo", v: `Q ${fmt(ingTotal)}`,    c: T.green, bg: T.greenDim },
          { l: "Egresos periodo",  v: `Q ${fmt(egTotal)}`,     c: T.red,  bg: T.redDim  },
          { l: "Sin conciliar",    v: sinConciliar,             c: T.sec,  bg: T.secDim  },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.c}44`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: T.mut }}>{s.l}</div>
            <div style={{ fontSize: i === 0 ? 18 : 20, fontWeight: 800, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}>
        {/* Panel cuentas */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.mut }}>MIS CUENTAS</div>
            <button onClick={() => setShowCuenta(!showCuenta)} style={{ ...S.btn("ghost"), fontSize: 10, padding: "3px 8px" }}>
              {showCuenta ? "Cancelar" : "+ Cuenta"}
            </button>
          </div>

          {showCuenta && (
            <div style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Nueva cuenta bancaria</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Fld label="BANCO"><input style={S.inp} value={fc.banco} onChange={e => sfc("banco", e.target.value)} placeholder="Nombre del banco" /></Fld>
                <Fld label="NO. CUENTA"><input style={S.inp} value={fc.numero_cuenta} onChange={e => sfc("numero_cuenta", e.target.value)} placeholder="000-000000-00" /></Fld>
                <Fld label="TIPO">
                  <select style={S.sel} value={fc.tipo_cuenta} onChange={e => sfc("tipo_cuenta", e.target.value)}>
                    <option value="monetaria">Monetaria</option>
                    <option value="ahorro">Ahorro</option>
                    <option value="credito">Credito</option>
                  </select>
                </Fld>
                <Fld label="MONEDA">
                  <select style={S.sel} value={fc.moneda} onChange={e => sfc("moneda", e.target.value)}>
                    <option value="GTQ">GTQ - Quetzal</option>
                    <option value="USD">USD - Dolar</option>
                  </select>
                </Fld>
                <Fld label="SALDO INICIAL"><input style={S.inp} type="number" step="0.01" value={fc.saldo_inicial} onChange={e => sfc("saldo_inicial", e.target.value)} placeholder="0.00" /></Fld>
                <button onClick={guardarCuenta} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>
                  {saving ? "Guardando..." : "Registrar cuenta"}
                </button>
              </div>
            </div>
          )}

          {loading ? <Spinner /> : cuentas.length === 0 ? (
            <Empty icon="B" msg="Sin cuentas registradas" />
          ) : cuentas.map(c => (
            <div key={c.id} onClick={() => setCuentaAct(c)}
              style={{ ...S.card, cursor: "pointer", marginBottom: 10,
                border: `1px solid ${cuentaAct?.id === c.id ? T.acc : T.bord}`,
                background: cuentaAct?.id === c.id ? T.accDim : T.card }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{c.banco}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{c.numero_cuenta} · {c.moneda}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.acc, marginTop: 8 }}>
                Q {fmt(c.saldo_actual)}
              </div>
            </div>
          ))}
        </div>

        {/* Panel movimientos */}
        <div>
          {cuentaAct ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{cuentaAct.banco}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{cuentaAct.numero_cuenta}</div>
                  <div style={{ fontSize: 12, color: T.mut }}>Saldo inicial: Q {fmt(cuentaAct.saldo_inicial)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: saldoOK ? T.green : T.red, marginTop: 2 }}>
                    Saldo actual: Q {fmt(saldoAlmacenado)}
                    {!saldoOK && <span style={{ fontSize: 11, color: T.red, marginLeft: 8 }}>
                      (deberia ser Q {fmt(saldoCalculado)})
                    </span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={async () => { const s = await recalcularSaldo(cuentaAct.id); setRecalcMsg(`Saldo recalculado: Q ${fmt(s)}`); setTimeout(() => setRecalcMsg(null), 4000); }}
                    style={{ ...S.btn("warn"), fontSize: 11 }}>Recalcular</button>
                  <button onClick={async () => { await dbUpd("cuentas_bancarias", cuentaAct.id, { saldo_actual: 0 }); setCuentaAct(p => ({ ...p, saldo_actual: 0 })); setCuentas(p => p.map(c => c.id === cuentaAct.id ? { ...c, saldo_actual: 0 } : c)); setRecalcMsg("Saldo reseteado a Q 0.00"); setTimeout(() => setRecalcMsg(null), 4000); }}
                    style={{ ...S.btn("danger"), fontSize: 11 }}>Resetear saldo</button>
                  <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
                  <button onClick={() => setImportar(true)} style={{ ...S.btn("blue"), fontSize: 11 }}>Importar</button>
                  <button onClick={() => { cerrarForm(); setShowForm(!showForm); }}
                    style={{ ...S.btn(showForm ? "warn" : "primary"), fontSize: 12 }}>
                    {showForm ? "Cancelar" : "+ Movimiento"}
                  </button>
                </div>
              </div>

              {showForm && (
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 12 }}>
                    {editMovId ? "Editar movimiento" : "Nuevo movimiento"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                    <Fld label="FECHA">
                      <input style={S.inp} type="date" value={f.fecha} onChange={e => sf("fecha", e.target.value)} />
                    </Fld>
                    <Fld label="TIPO">
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => sf("tipo", "ingreso")} style={{ ...S.btn(f.tipo === "ingreso" ? "primary" : "ghost"), flex: 1, fontSize: 12 }}>
                          Ingreso
                        </button>
                        <button onClick={() => sf("tipo", "egreso")} style={{ ...S.btn(f.tipo === "egreso" ? "danger" : "ghost"), flex: 1, fontSize: 12 }}>
                          Egreso
                        </button>
                      </div>
                    </Fld>
                    <Fld label="DESCRIPCION" span2>
                      <input style={S.inp} value={f.descripcion} onChange={e => sf("descripcion", e.target.value)} placeholder="Descripcion del movimiento..." />
                    </Fld>
                    <Fld label="MONTO (GTQ)">
                      <input style={S.inp} type="number" step="0.01" value={f.monto} onChange={e => sf("monto", e.target.value)} placeholder="0.00" />
                    </Fld>
                    <Fld label="CATEGORIA">
                      <select style={S.sel} value={f.categoria} onChange={e => sf("categoria", e.target.value)}>
                        {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </Fld>
                    <Fld label="REFERENCIA">
                      <input style={S.inp} value={f.referencia} onChange={e => sf("referencia", e.target.value)} placeholder="No. factura, doc..." />
                    </Fld>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 18 }}>
                      <input type="checkbox" checked={f.conciliado} onChange={e => sf("conciliado", e.target.checked)} style={{ width: 16, height: 16 }} />
                      <label style={{ ...S.lbl, marginBottom: 0 }}>CONCILIADO</label>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <Fld label="NOTAS">
                        <textarea style={{ ...S.inp, minHeight: 50, resize: "vertical" }} value={f.notas}
                          onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
                      </Fld>
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
                      <button onClick={guardarMov} disabled={saving} style={{ ...S.btn("primary"), flex: 2 }}>
                        {saving ? "Guardando..." : editMovId ? "Actualizar movimiento" : "Guardar movimiento"}
                      </button>
                      <button onClick={cerrarForm} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {["todos", "ingreso", "egreso"].map(t => (
                  <button key={t} onClick={() => setFiltroT(t)}
                    style={{ ...S.btn(filtroT === t ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
                    {t === "todos" ? "Todos" : t === "ingreso" ? "Ingresos" : "Egresos"}
                  </button>
                ))}
                {["todos", "conciliado", "pendiente"].map(t => (
                  <button key={t} onClick={() => setFiltroC(t)}
                    style={{ ...S.btn(filtroC === t ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
                    {t === "todos" ? "Todos" : t === "conciliado" ? "Conciliados" : "Pendientes"}
                  </button>
                ))}
                <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar en movimientos..." />
              </div>

              {movsFil.length === 0 ? (
                <Empty icon="B" msg="Sin movimientos" action="+ Registrar" onAction={() => { cerrarForm(); setShowForm(true); }} />
              ) : (
                <div style={{ ...S.card, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Fecha", "Descripcion", "Categoria", "Monto", "Conciliado", "Acciones"].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movsFil.map(m => (
                        <tr key={m.id}
                          onMouseEnter={e => e.currentTarget.style.background = T.surf}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ ...S.td, color: T.sub, fontSize: 11, whiteSpace: "nowrap" }}>{fmtD(m.fecha)}</td>
                          <td style={{ ...S.td, maxWidth: 180 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 175, fontWeight: 500, color: T.txt }}>
                              {m.descripcion}
                            </div>
                            {m.referencia && <div style={{ fontSize: 9, color: T.mut }}>{m.referencia}</div>}
                          </td>
                          <td style={S.td}>
                            <span style={{ padding: "2px 6px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                              background: (CC[m.categoria] || T.mut) + "22", color: CC[m.categoria] || T.mut }}>
                              {m.categoria}
                            </span>
                          </td>
                          <td style={{ ...S.td, fontWeight: 700, color: m.tipo === "ingreso" ? T.green : T.red, whiteSpace: "nowrap" }}>
                            {m.tipo === "ingreso" ? "+ " : "- "}Q {fmt(m.monto)}
                          </td>
                          <td style={{ ...S.td, textAlign: "center" }}>
                            <button onClick={() => conciliar(m.id, !m.conciliado)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: 0,
                                color: m.conciliado ? T.green : T.mut, fontWeight: 700 }}>
                              {m.conciliado ? "OK" : "---"}
                            </button>
                          </td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => setDetalleMov(m)}
                                style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 11 }} title="Ver detalle">
                                Ver
                              </button>
                              <button onClick={() => abrirEditarMov(m)}
                                style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 11 }} title="Editar">
                                Editar
                              </button>
                              <button onClick={() => setConfirmDel(m.id)}
                                style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 11 }} title="Eliminar">
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: T.surf }}>
                        <td colSpan={3} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: T.mut }}>
                          {movsFil.length} movimientos filtrados
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 800, color: T.acc, fontSize: 13 }}>
                          Q {fmt(movsFil.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0) -
                              movsFil.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {movsFil.length > 0 && (
                <Paginador page={pageMovs} totalPages={totalPagesMovs} total={totalMovs}
                  desde={desdeMovs} hasta={hastaMovs} pageSize={pageSizeMovs}
                  onPage={setPageMovs} onPageSize={setPageSizeMovs} />
              )}
            </>
          ) : (
            <div style={{ ...S.card, textAlign: "center", padding: 40, color: T.sub }}>
              Selecciona una cuenta bancaria para ver sus movimientos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
