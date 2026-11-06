import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, fmt, fmtD, dbGet, dbIns, dbUpd, today, apiFetch, rpc } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';
import {
  crearPayloadCuentaBancaria,
  crearParametrosMovimientoBancario,
  crearParametrosTransferencia,
  ejecutarRpcBancaria,
  ejecutarUnaVez,
  obtenerOperacionId,
  TIPOS_FLUJO_BANCARIO,
} from '../services/bancaCore.js';

const CATS = ["ventas", "combustible", "mantenimiento", "salarios", "seguros", "servicios", "oficina", "otros"];
const CC = { ventas: T.acc, combustible: T.sec, mantenimiento: T.blue, salarios: T.green, seguros: T.purple, servicios: T.acc, oficina: T.mut, otros: T.sub };

const EFM = { fecha: today(), tipo: "ingreso", tipo_flujo: "OPERATIVA", descripcion: "", monto: "", referencia: "", categoria: "ventas", notas: "" };
const EFC = { banco: "", numero_cuenta: "", tipo_cuenta: "monetaria", moneda: "GTQ", saldo_inicial: "", saldo_actual: "", notas: "", titular: "" };
const EFT = { cuenta_origen_id: "", cuenta_destino_id: "", fecha: today(), monto: "", descripcion: "", referencia: "" };
const DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO =
  import.meta.env.DEV
  && /^https:\/\/eyojdedlxfgtcnvyqinr\.supabase\.co(?:\/|$)/i.test(SB);
const DIAGNOSTICO_RPC_PROYECTO = DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO
  ? new URL(SB).hostname.split(".")[0]
  : null;

function sanitizarDiagnosticoVisible(valor, valoresOperacion = []) {
  if (valor == null) return null;
  let texto = String(valor);
  for (const valorOperacion of valoresOperacion) {
    const sensible = valorOperacion == null ? "" : String(valorOperacion);
    if (sensible.length >= 3) texto = texto.split(sensible).join("[REDACTED_OPERATION_DATA]");
  }
  return texto
    .replace(/SQL statement "[\s\S]*?"/gi, 'SQL statement "[contenido omitido]"')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]")
    .replace(/\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+\b/gi, "[REDACTED_API_KEY]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi, "[REDACTED_UUID]")
    .replace(/\b(?:numero[_ ]?de[_ ]?cuenta|cuenta[_ ]?bancaria|account[_ ]?number|iban|swift|clabe)\b(?:\s*[:=#-]\s*|\s+)(?=[A-Z0-9 -]{0,32}\d)[A-Z0-9][A-Z0-9 -]{3,}/gi, "[REDACTED_BANK_DATA]")
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{8,30}\b/gi, "[REDACTED_BANK_DATA]")
    .replace(/\b\d(?:[\d -]{4,}\d)\b/g, "[REDACTED_BANK_DATA]")
    .replace(/\b\d{5,}\b/g, "[REDACTED_NUMBER]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[REDACTED]")
    .trim();
}

function crearDiagnosticoVisibleMovimiento({ etapa, error, postgresDiagnostics, valoresOperacion }) {
  const causa = error?.cause;
  const httpStatus = Number.isInteger(causa?.status) && causa.status > 0
    ? causa.status
    : null;
  const diagnostico = postgresDiagnostics || causa?.postgresDiagnostics || {};
  const contexto = sanitizarDiagnosticoVisible(diagnostico.context, valoresOperacion);
  const sqlstate = diagnostico.sqlstate
    || (/^[0-9A-Z]{5}$/.test(causa?.code || "") ? causa.code : null);
  let etapaDetectada = etapa;
  if (contexto && /PL\/pgSQL function|trigger function/i.test(contexto)) {
    etapaDetectada = "Ejecución dentro de función o trigger PostgreSQL";
  } else if (httpStatus) {
    etapaDetectada = "Respuesta HTTP de PostgREST";
  } else if (causa?.code === "SIN_CONEXION" || causa?.status === 0) {
    etapaDetectada = "Transporte de la llamada RPC";
  }

  return {
    rpc: "api_crear_movimiento_bancario",
    proyecto: DIAGNOSTICO_RPC_PROYECTO,
    operacion: etapa === "Llamada RPC api_crear_movimiento_bancario"
      ? "api_crear_movimiento_bancario"
      : etapa,
    estadoHttp: httpStatus,
    sqlstate: /^[0-9A-Z]{5}$/.test(sqlstate || "") ? sqlstate : null,
    mensaje: sanitizarDiagnosticoVisible(diagnostico.message || causa?.mensaje || error?.message, valoresOperacion),
    detail: sanitizarDiagnosticoVisible(diagnostico.detail, valoresOperacion),
    hint: sanitizarDiagnosticoVisible(diagnostico.hint, valoresOperacion),
    context: contexto,
    etapa: etapaDetectada,
  };
}

function serializarDiagnosticoVisible(diagnostico) {
  return [
    `RPC: ${diagnostico.rpc}`,
    `Proyecto Supabase: ${diagnostico.proyecto}`,
    `Operación: ${diagnostico.operacion}`,
    `Estado HTTP: ${diagnostico.estadoHttp ?? "No disponible"}`,
    `SQLSTATE: ${diagnostico.sqlstate || "No disponible"}`,
    `Mensaje: ${diagnostico.mensaje || "No disponible"}`,
    `DETAIL: ${diagnostico.detail || "No disponible"}`,
    `HINT: ${diagnostico.hint || "No disponible"}`,
    `CONTEXT: ${diagnostico.context || "No disponible"}`,
    `Etapa: ${diagnostico.etapa || "No determinada"}`,
  ].join("\n");
}

function DetalleMovimiento({ mov, onClose }) {
  if (!mov) return null;
  let extra = {};
  try { if (mov.notas && mov.notas.startsWith("{")) extra = JSON.parse(mov.notas); } catch {}
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400 }} onClick={onClose}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 380, background: T.card, borderLeft: `1px solid ${T.bord}`, overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.bord}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Detalle del movimiento</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onClose} style={{ ...S.btn("ghost"), padding: "4px 10px" }}>X</button>
          </div>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: mov.tipo === "ingreso" ? T.green : T.red, marginBottom: 16 }}>
            {mov.tipo === "ingreso" ? "+ " : "- "}Q {fmt(mov.monto)}
          </div>
          {[
            ["Fecha", fmtD(mov.fecha)],
            ["Tipo", mov.tipo === "ingreso" ? "Ingreso" : "Egreso"],
            ["Descripcion", mov.descripcion || "—"],
            ...(extra.oficina ? [["Oficina", extra.oficina]] : []),
            ...(extra.secuencial ? [["Secuencial", extra.secuencial]] : []),
            ...(extra.cheque ? [["Cheque", extra.cheque]] : []),
            ["Referencia", mov.referencia || "—"],
            ["Categoria", mov.categoria],
            ["Conciliado", mov.conciliado ? "Si" : "No"],
            ...(extra.saldo_contable ? [["Saldo Contable", "Q " + fmt(extra.saldo_contable)]] : []),
            ...(extra.saldo_disponible ? [["Saldo Disponible", "Q " + fmt(extra.saldo_disponible)]] : []),
            ["Cliente asociado", mov.cliente_nombre || "—"],
            ["Reserva asociada", mov.reserva_numero || "—"],
            ["Factura asociada", mov.factura_numero || "—"],
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

function ImportadorBancario({ showToast, onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState([]);
  const [todasFilas, setTodasFilas] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [cols, setCols] = useState({ fecha: "", descripcion: "", monto: "", tipo: "", referencia: "", debito: "", credito: "", oficina: "", secuencial: "", cheque: "", saldo_contable: "", saldo_disponible: "" });
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
    const c = { fecha: "", descripcion: "", monto: "", tipo: "", referencia: "", debito: "", credito: "", oficina: "", secuencial: "", cheque: "", saldo_contable: "", saldo_disponible: "" };
    h.forEach((hh, i) => {
      if (/fecha|date/.test(hh)) c.fecha = i;
      else if (/descripc|concepto|detalle|glosa/.test(hh)) c.descripcion = i;
      else if (/monto|importe|valor|total|cantidad/.test(hh)) c.monto = i;
      else if (/tipo/.test(hh)) c.tipo = i;
      else if (/refe|doc|numero|comprob/.test(hh)) c.referencia = i;
      else if (/debito|debe|cargo/.test(hh)) c.debito = i;
      else if (/credito|haber/.test(hh)) c.credito = i;
      else if (/oficina|agencia|sucursal/.test(hh)) c.oficina = i;
      else if (/secuencial|secuencia|numero.*oper/.test(hh)) c.secuencial = i;
      else if (/cheque|cheque propio|cheque.*local|efectivo/.test(hh)) c.cheque = i;
      else if (/saldo.*contable|saldo.*cont/.test(hh)) c.saldo_contable = i;
      else if (/saldo.*disponible|saldo.*disp/.test(hh)) c.saldo_disponible = i;
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
      if (/\uFFFD/.test(texto)) {
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
            <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Auto-detecta: fecha, oficina, descripcion, referencia, secuencial, cheque, debito, credito, saldo_contable</div>
            <input ref={refFile} type="file" accept=".csv,.xlsx,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          </div>
        </div>
        {procesando && <div style={{ textAlign: "center", padding: 12, color: T.acc, fontSize: 13 }}>Procesando archivo...</div>}
        {Object.keys(cols).length > 0 && (
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Columnas detectadas: {Object.entries(cols).filter(([,v]) => v !== "").map(([k]) => k).join(", ") || "ninguna"}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {["fecha", "oficina", "descripcion", "referencia", "secuencial", "cheque", "debito", "credito", "monto", "tipo", "saldo_contable", "saldo_disponible"].filter(c => c !== "monto" || !cols.debito).map(campo => (
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
        <div style={{ padding: "10px 14px", background: T.secDim, borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.txt }}>
          La vista previa está disponible. El registro y la conciliación de estados de cuenta estarán disponibles en FASE 4.3.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => showToast("El registro y la conciliación de estados de cuenta estarán disponibles en FASE 4.3.", "err")} disabled={procesando || todasFilas.length === 0} style={{ ...S.btn("primary"), flex: 2 }}>
            Registro y conciliación · FASE 4.3
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
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCuenta, setShowCuenta] = useState(false);
  const [editCuentaId, setEditCuentaId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [filtroT,    setFiltroT]    = useState("todos");
  const [filtroC,    setFiltroC]    = useState("todos");
  const [exportar,   setExportar]   = useState(false);
  const [importar,   setImportar]   = useState(false);
  const [detalleMov, setDetalleMov] = useState(null);
  const [diagnosticoMovimiento, setDiagnosticoMovimiento] = useState(null);
  const [diagnosticoCopiado, setDiagnosticoCopiado] = useState("");
  const [busqueda,   setBusqueda]   = useState("");
  const [allMovs,    setAllMovs]    = useState([]);

  const [f,  setF]  = useState({ ...EFM });
  const [fc, setFc]  = useState({ ...EFC });
  const [ft, setFt] = useState({ ...EFT });
  const intentoMovimientoRef = useRef(null);
  const intentoTransferenciaRef = useRef(null);
  const movimientoEnCursoRef = useRef(false);
  const transferenciaEnCursoRef = useRef(false);
  const sf  = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sfc = (k, v) => setFc(p => ({ ...p, [k]: v }));

  const loadCuentas = async () => {
    setLoading(true);
    const c = await dbGet("cuentas_bancarias", `&empresa_id=eq.${empId}`);
    const arr = Array.isArray(c) ? c : [];
    setCuentas(arr);
    setCuentaAct(actual => arr.find(cuenta => cuenta.id === actual?.id) || arr[0] || null);
    setLoading(false);
  };

  const queryMovs = cuentaAct ? 'cuenta_id=eq.'+cuentaAct.id : '';
  const { data: movs, loading: loadingMovs, total: totalMovs, page: pageMovs, totalPages: totalPagesMovs, pageSize: pageSizeMovs, setPage: setPageMovs, setPageSize: setPageSizeMovs, reload: reloadMovs, desde: desdeMovs, hasta: hastaMovs } = usePaginacion({
    table: 'movimientos_bancarios',
    query: queryMovs,
    search: busqueda,
    columns: ['concepto', 'referencia', 'descripcion', 'categoria', 'notas', 'tipo'],
    order: 'fecha.asc',
    empresaId: empId,
  });

  useEffect(() => { loadCuentas(); }, [empId]);

  const loadAllMovs = useCallback(async () => {
    if (!cuentaAct) { setAllMovs([]); return; }
    try {
      const url = `/movimientos_bancarios?select=*&order=fecha.asc&cuenta_id=eq.${cuentaAct.id}`;
      const r = await apiFetch(url);
      if (!r.ok) { setAllMovs([]); return; }
      const d = await r.json();
      setAllMovs(Array.isArray(d) ? d : []);
    } catch { setAllMovs([]); }
  }, [cuentaAct]);

  useEffect(() => { loadAllMovs(); }, [loadAllMovs]);

  const recargarDatosBancarios = async () => {
    await Promise.all([loadCuentas(), reloadMovs(), loadAllMovs()]);
  };

  const nuevoOperacionId = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    if (!globalThis.crypto?.getRandomValues) {
      throw new Error("Este navegador no permite generar un identificador seguro para la operación.");
    }
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  const guardarCuenta = async () => {
    if (!fc.banco.trim()) { showToast("Nombre del banco requerido", "err"); return; }
    setSaving(true);
    const payload = crearPayloadCuentaBancaria({ empresaId: empId, formulario: fc });
    let r;
    if (editCuentaId) {
      const { empresa_id: _empresaId, ...payloadUpdate } = payload;
      r = await dbUpd("cuentas_bancarias", editCuentaId, payloadUpdate);
      if (r?.error) { showToast("Error: " + r.error, "err"); setSaving(false); return; }
      showToast("Cuenta actualizada");
    } else {
      r = await dbIns("cuentas_bancarias", payload);
      if (r?.error) { showToast("Error: " + r.error, "err"); setSaving(false); return; }
      showToast("Cuenta registrada");
    }
    setSaving(false); setShowCuenta(false); setEditCuentaId(null); setFc({ ...EFC }); loadCuentas();
  };

  const abrirEditarCuenta = (c) => {
    setEditCuentaId(c.id);
    setFc({
      banco: c.banco || "", numero_cuenta: c.numero_cuenta || "",
      tipo_cuenta: c.tipo_cuenta || "monetaria", moneda: c.moneda || "GTQ",
      saldo_inicial: c.saldo_inicial || "", saldo_actual: c.saldo_actual || "",
      notas: c.notas || "", titular: c.titular || "",
    });
    setShowCuenta(true);
  };

  const cerrarCuenta = () => { setShowCuenta(false); setEditCuentaId(null); setFc({ ...EFC }); };

  const cerrarForm = () => {
    if (saving) return;
    intentoMovimientoRef.current = null;
    setShowForm(false);
    setF({ ...EFM });
  };

  const guardarMov = async () => ejecutarUnaVez(movimientoEnCursoRef, async () => {
    setSaving(true);
    let etapa = "Preparación y validación de parámetros";
    let diagnosticoRpc = null;
    let valoresOperacion = [];
    if (DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO) {
      setDiagnosticoMovimiento(null);
      setDiagnosticoCopiado("");
    }
    try {
      const base = crearParametrosMovimientoBancario({
        operacionId: null,
        empresaId: empId,
        cuentaId: cuentaAct?.id,
        formulario: f,
      });
      const operacionId = obtenerOperacionId(intentoMovimientoRef, base, nuevoOperacionId);
      valoresOperacion = [...Object.values(base), operacionId];
      etapa = "Llamada RPC api_crear_movimiento_bancario";
      const resultado = await ejecutarRpcBancaria(
        (nombreFuncion, parametros) => rpc(nombreFuncion, parametros, {
          includePostgresDiagnostics: true,
        }),
        "api_crear_movimiento_bancario",
        {
          ...base,
          p_operacion_id: operacionId,
        },
        diagnostico => {
          diagnosticoRpc = diagnostico;
        }
      );
      showToast(resultado.creado
        ? "Movimiento bancario registrado correctamente."
        : "Este movimiento ya estaba registrado; no se duplicó.");
      intentoMovimientoRef.current = null;
      setShowForm(false);
      setF({ ...EFM });
      etapa = "Recarga de datos bancarios después del registro";
      await recargarDatosBancarios();
    } catch (error) {
      if (DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO) {
        setDiagnosticoMovimiento(crearDiagnosticoVisibleMovimiento({
          etapa,
          error,
          postgresDiagnostics: diagnosticoRpc,
          valoresOperacion,
        }));
      }
      const mensajeError = DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO
        ? sanitizarDiagnosticoVisible(error.message, valoresOperacion)
        : error.message;
      showToast("No se pudo registrar el movimiento: " + mensajeError, "err");
    } finally {
      setSaving(false);
    }
  });

  const abrirTransferencia = () => {
    intentoTransferenciaRef.current = null;
    setFt({ ...EFT, cuenta_origen_id: cuentaAct?.id || "" });
    setShowForm(false);
    setShowTransfer(true);
  };

  const cerrarTransferencia = () => {
    if (saving) return;
    intentoTransferenciaRef.current = null;
    setFt({ ...EFT });
    setShowTransfer(false);
  };

  const guardarTransferencia = async () => ejecutarUnaVez(transferenciaEnCursoRef, async () => {
    setSaving(true);
    try {
      const base = crearParametrosTransferencia({
        operacionId: null,
        empresaId: empId,
        formulario: ft,
        cuentas,
      });
      const operacionId = obtenerOperacionId(intentoTransferenciaRef, base, nuevoOperacionId);
      const resultado = await ejecutarRpcBancaria(rpc, "api_crear_transferencia_interna", {
        ...base,
        p_operacion_id: operacionId,
      });
      showToast(resultado.creado
        ? "Transferencia interna registrada correctamente."
        : "Esta transferencia ya estaba registrada; no se duplicó.");
      intentoTransferenciaRef.current = null;
      setFt({ ...EFT });
      setShowTransfer(false);
      await recargarDatosBancarios();
    } catch (error) {
      showToast("No se pudo registrar la transferencia: " + error.message, "err");
    } finally {
      setSaving(false);
    }
  });

  const movsFil = movs.filter(m => {
    if (filtroT !== "todos" && m.tipo !== filtroT) return false;
    if (filtroC === "conciliado" && !m.conciliado) return false;
    if (filtroC === "pendiente"  &&  m.conciliado) return false;
    return true;
  });

  const saldoAlmacenado = parseFloat(cuentaAct?.saldo_actual || 0);
  const saldoTotal  = cuentas.reduce((s, c) => s + (parseFloat(c.saldo_actual) || 0), 0);
  const ingTotal    = allMovs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const egTotal     = allMovs.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
  const sinConciliar = allMovs.filter(m => !m.conciliado).length;
  const cuentaOrigenTransferencia = cuentas.find(cuenta => cuenta.id === ft.cuenta_origen_id);
  const cuentaDestinoTransferencia = cuentas.find(cuenta => cuenta.id === ft.cuenta_destino_id);
  const monedasTransferenciaDistintas = Boolean(
    cuentaOrigenTransferencia && cuentaDestinoTransferencia &&
    (!cuentaOrigenTransferencia.moneda || !cuentaDestinoTransferencia.moneda ||
      cuentaOrigenTransferencia.moneda.toUpperCase() !== cuentaDestinoTransferencia.moneda.toUpperCase())
  );
  const monedaTransferenciaNoDisponible = Boolean(
    cuentaOrigenTransferencia && cuentaDestinoTransferencia &&
    (!cuentaOrigenTransferencia.moneda || !cuentaDestinoTransferencia.moneda)
  );

  return (
    <div>
      {exportar && (
        <ModalExportar titulo="Estado de Cuenta Bancario" onClose={() => setExportar(false)}
          extraEncabezado={`Cuenta: ${cuentaAct.nombre} (${cuentaAct.banco || "N/A"}) · ${allMovs.length} movimientos · Generado ${new Date().toLocaleDateString("es-GT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
          datos={allMovs.map(m => ({
            ...m,
            _debito: m.tipo === "egreso" ? `Q ${fmt(m.monto)}` : "",
            _credito: m.tipo === "ingreso" ? `Q ${fmt(m.monto)}` : "",
          }))}
          campos={[
            { label: "Fecha", key: "fecha" },
            { label: "Descripcion", key: "descripcion" },
            { label: "Referencia", key: "referencia" },
            { label: "Debito (-)", render: r => r._debito, cls: "der" },
            { label: "Credito (+)", render: r => r._credito, cls: "der" },
          ]} />
      )}

      {importar && (
        <ImportadorBancario showToast={showToast} onClose={() => setImportar(false)} />
      )}

      <DetalleMovimiento mov={detalleMov} onClose={() => setDetalleMov(null)} />

      {DIAGNOSTICO_RPC_MOVIMIENTO_HABILITADO && diagnosticoMovimiento && (
        <section
          role="alert"
          aria-live="polite"
          style={{
            ...S.card,
            marginBottom: 18,
            border: `1px solid ${T.red}`,
            background: T.redDim || T.card,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <strong style={{ color: T.red, fontSize: 14 }}>Diagnóstico temporal del movimiento bancario</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(serializarDiagnosticoVisible(diagnosticoMovimiento));
                    setDiagnosticoCopiado("copiado");
                  } catch {
                    setDiagnosticoCopiado("error");
                  }
                }}
                style={S.btn("ghost")}
              >
                {diagnosticoCopiado === "copiado"
                  ? "Copiado"
                  : diagnosticoCopiado === "error"
                    ? "No se pudo copiar"
                    : "Copiar diagnóstico"}
              </button>
              <button
                type="button"
                onClick={() => setDiagnosticoMovimiento(null)}
                aria-label="Cerrar diagnóstico"
                style={S.btn("ghost")}
              >
                Cerrar
              </button>
            </div>
          </div>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(110px, 150px) minmax(0, 1fr)", gap: "7px 12px", margin: 0, fontSize: 12, color: T.txt }}>
            {[
              ["RPC", diagnosticoMovimiento.rpc],
              ["Proyecto Supabase", diagnosticoMovimiento.proyecto],
              ["Operación", diagnosticoMovimiento.operacion],
              ["Estado HTTP", diagnosticoMovimiento.estadoHttp ?? "No disponible"],
              ["SQLSTATE", diagnosticoMovimiento.sqlstate || "No disponible"],
              ["Mensaje", diagnosticoMovimiento.mensaje || "No disponible"],
              ["DETAIL", diagnosticoMovimiento.detail || "No disponible"],
              ["HINT", diagnosticoMovimiento.hint || "No disponible"],
              ["CONTEXT", diagnosticoMovimiento.context || "No disponible"],
              ["Etapa", diagnosticoMovimiento.etapa || "No determinada"],
            ].map(([label, valor]) => (
              <React.Fragment key={label}>
                <dt style={{ color: T.sub, fontWeight: 700 }}>{label}</dt>
                <dd style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{valor}</dd>
              </React.Fragment>
            ))}
          </dl>
          {diagnosticoCopiado !== "copiado" && (
            <div style={{ marginTop: 8, color: T.sub, fontSize: 11 }}>
              {diagnosticoCopiado === "error"
                ? "El navegador no permitió copiar. El diagnóstico mostrado sigue sanitizado."
                : "El diagnóstico mostrado está sanitizado; no incluye tokens ni el payload de la operación."}
            </div>
          )}
        </section>
      )}

      {/* Cuentas bancarias: horizontal */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
          {loading ? <Spinner /> : cuentas.length === 0 ? (
            <Empty icon="B" msg="Sin cuentas registradas" />
          ) : cuentas.map(c => (
            <div key={c.id} onClick={() => setCuentaAct(c)}
              style={{ ...S.card, cursor: "pointer", minWidth: 170, flex: "0 0 auto", position: "relative",
                border: `1px solid ${cuentaAct?.id === c.id ? T.acc : T.bord}`,
                background: cuentaAct?.id === c.id ? T.accDim : T.card }}>
              <button title="Editar cuenta" onClick={e => { e.stopPropagation(); abrirEditarCuenta(c); }}
                style={{ position: "absolute", top: 6, right: 6, background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>
                ✎
              </button>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, paddingRight: 14 }}>{c.banco}</div>
              {c.titular ? <div style={{ fontSize: 10, fontWeight: 600, color: T.txt }}>{c.titular}</div> : null}
              <div style={{ fontSize: 10, color: T.sub }}>{c.numero_cuenta} · {c.moneda}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.acc, marginTop: 6 }}>
                Q {fmt(c.saldo_actual)}
              </div>
            </div>
          ))}
          <button onClick={() => { setEditCuentaId(null); setFc({ ...EFC }); setShowCuenta(true); }}
            style={{ ...S.btn("primary"), flex: "0 0 auto", alignSelf: "center", padding: "10px 14px", minWidth: 80, height: "fit-content" }}>
            + Cuenta
          </button>
        </div>
      </div>

      {showCuenta && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...S.card, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>{editCuentaId ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}</div>
              <button onClick={cerrarCuenta} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 20 }}>X</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Fld label="BANCO"><input style={S.inp} value={fc.banco} onChange={e => sfc("banco", e.target.value)} placeholder="Nombre del banco" /></Fld>
              <Fld label="TITULAR DE LA CUENTA"><input style={S.inp} value={fc.titular} onChange={e => sfc("titular", e.target.value)} placeholder="Nombre del titular de la cuenta" /></Fld>
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
              <Fld label="NOTAS"><input style={S.inp} value={fc.notas} onChange={e => sfc("notas", e.target.value)} placeholder="Observaciones..." /></Fld>
              <button onClick={async () => { await guardarCuenta(); }} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>
                {saving ? "Guardando..." : editCuentaId ? "Actualizar cuenta" : "Registrar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
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

      {/* Panel movimientos */}
      <div>
        {cuentaAct ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{cuentaAct.banco}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{cuentaAct.numero_cuenta}</div>
                  <div style={{ fontSize: 12, color: T.mut }}>Saldo inicial: Q {fmt(cuentaAct.saldo_inicial)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginTop: 2 }}>
                    Saldo actual: Q {fmt(saldoAlmacenado)}
                  </div>
                  <div style={{ fontSize: 10, color: T.mut, marginTop: 3 }}>
                    La base de datos actualiza el saldo automáticamente; no se permite reiniciarlo desde esta pantalla.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize: 11 }}>Exportar</button>
                  <button onClick={() => setImportar(true)} style={{ ...S.btn("blue"), fontSize: 11 }}>Importar</button>
                  <button disabled={saving} onClick={() => {
                    if (showTransfer) cerrarTransferencia();
                    setShowTransfer(false);
                    if (showForm) cerrarForm();
                    else { intentoMovimientoRef.current = null; setF({ ...EFM }); setShowForm(true); }
                  }}
                    style={{ ...S.btn(showForm ? "warn" : "primary"), fontSize: 12 }}>
                    {showForm ? "Cancelar" : "+ Movimiento"}
                  </button>
                  <button disabled={saving} onClick={() => {
                    if (showForm) cerrarForm();
                    setShowForm(false);
                    if (showTransfer) cerrarTransferencia();
                    else abrirTransferencia();
                  }} style={{ ...S.btn(showTransfer ? "warn" : "blue"), fontSize: 12 }}>
                    {showTransfer ? "Cancelar transferencia" : "Transferir"}
                  </button>
                </div>
              </div>

              {showTransfer && (
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 12 }}>Transferencia entre cuentas propias</div>
                  <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                      <Fld label="CUENTA DE ORIGEN">
                        <select style={S.sel} value={ft.cuenta_origen_id} onChange={event => {
                          const cuenta_origen_id = event.target.value;
                          setFt(actual => ({
                            ...actual,
                            cuenta_origen_id,
                            cuenta_destino_id: actual.cuenta_destino_id === cuenta_origen_id ? "" : actual.cuenta_destino_id,
                          }));
                        }}>
                          <option value="">Seleccionar cuenta de origen...</option>
                          {cuentas.map(cuenta => (
                            <option key={cuenta.id} value={cuenta.id}>{cuenta.banco} — {cuenta.numero_cuenta} ({cuenta.moneda})</option>
                          ))}
                        </select>
                      </Fld>
                      <Fld label="CUENTA DE DESTINO">
                        <select style={S.sel} value={ft.cuenta_destino_id} onChange={event => setFt(actual => ({ ...actual, cuenta_destino_id: event.target.value }))}>
                          <option value="">Seleccionar cuenta de destino...</option>
                          {cuentas.filter(cuenta => cuenta.id !== ft.cuenta_origen_id).map(cuenta => (
                            <option key={cuenta.id} value={cuenta.id}>{cuenta.banco} — {cuenta.numero_cuenta} ({cuenta.moneda})</option>
                          ))}
                        </select>
                      </Fld>
                      <Fld label="FECHA">
                        <input style={S.inp} type="date" value={ft.fecha} onChange={event => setFt(actual => ({ ...actual, fecha: event.target.value }))} />
                      </Fld>
                      <Fld label="MONTO">
                        <input style={S.inp} type="number" min="0" step="0.01" value={ft.monto} onChange={event => setFt(actual => ({ ...actual, monto: event.target.value }))} placeholder="0.00" />
                      </Fld>
                      <Fld label="DESCRIPCIÓN" span2>
                        <input style={S.inp} value={ft.descripcion} onChange={event => setFt(actual => ({ ...actual, descripcion: event.target.value }))} placeholder="Descripción de la transferencia..." />
                      </Fld>
                      <Fld label="REFERENCIA (OPCIONAL)" span2>
                        <input style={S.inp} value={ft.referencia} onChange={event => setFt(actual => ({ ...actual, referencia: event.target.value }))} placeholder="Referencia..." />
                      </Fld>
                      {monedasTransferenciaDistintas && (
                        <div style={{ gridColumn: "span 2", color: T.red, fontSize: 12 }}>
                          {monedaTransferenciaNoDisponible
                            ? "No se pudo determinar la moneda de ambas cuentas."
                            : "Las cuentas deben utilizar la misma moneda para transferir."}
                        </div>
                      )}
                      <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
                        <button onClick={guardarTransferencia} disabled={saving || monedasTransferenciaDistintas} style={{ ...S.btn("primary"), flex: 2 }}>
                          {saving ? "Procesando..." : "Registrar transferencia"}
                        </button>
                        <button onClick={cerrarTransferencia} disabled={saving} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}

              {showForm && (
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 12 }}>Nuevo movimiento bancario</div>
                  <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
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
                    <Fld label="TIPO DE FLUJO">
                      <select style={S.sel} value={f.tipo_flujo} onChange={e => sf("tipo_flujo", e.target.value)}>
                        {TIPOS_FLUJO_BANCARIO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </select>
                    </Fld>
                    <Fld label="REFERENCIA">
                      <input style={S.inp} value={f.referencia} onChange={e => sf("referencia", e.target.value)} placeholder="No. factura, doc..." />
                    </Fld>
                    <div style={{ gridColumn: "span 2" }}>
                      <Fld label="NOTAS">
                        <textarea style={{ ...S.inp, minHeight: 50, resize: "vertical" }} value={f.notas}
                          onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
                      </Fld>
                    </div>
                    <div style={{ gridColumn: "span 2", color: T.mut, fontSize: 11 }}>
                      Los movimientos manuales se registran como no conciliados. La conciliación estará disponible en FASE 4.3.
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
                      <button onClick={guardarMov} disabled={saving} style={{ ...S.btn("primary"), flex: 2 }}>
                        {saving ? "Guardando..." : "Guardar movimiento"}
                      </button>
                      <button onClick={cerrarForm} disabled={saving} style={{ ...S.btn("ghost"), flex: 1 }}>Cancelar</button>
                    </div>
                  </div>
                  </fieldset>
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
                <Empty icon="B" msg="Sin movimientos" action="+ Registrar" onAction={() => {
                  if (saving) return;
                  cerrarTransferencia();
                  setShowTransfer(false);
                  cerrarForm();
                  setShowForm(true);
                }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {movsFil.map(m => (
                    <div key={m.id} style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setDetalleMov(m)}>
                          <div style={{ fontWeight: 600, color: T.txt, fontSize: 13 }}>
                            {m.descripcion}
                          </div>
                          <div style={{ fontSize: 11, color: T.mut, marginTop: 2 }}>
                            {m.referencia || "—"} · {m.categoria}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          {m.tipo === "egreso"
                            ? <span style={{ fontSize: 15, fontWeight: 800, color: T.red }}>- Q {fmt(m.monto)}</span>
                            : <span style={{ fontSize: 15, fontWeight: 800, color: T.green }}>+ Q {fmt(m.monto)}</span>
                          }
                          {m.conciliado
                            ? <span style={{ fontSize: 9, color: T.green }}>Conciliado</span>
                            : <span style={{ fontSize: 9, color: T.sec }}>Pendiente</span>
                          }
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 11, color: T.sub }}>{fmtD(m.fecha)}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setDetalleMov(m)}
                            style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10 }}>Ver</button>
                          <button disabled title="La edición de movimientos requiere una operación financiera aprobada."
                            style={{ ...S.btn("ghost"), padding: "3px 7px", fontSize: 10, opacity: 0.6, cursor: "not-allowed" }}>Edición no disponible</button>
                          <button disabled title="No se permite borrar físicamente operaciones financieras. La anulación requiere un flujo aprobado."
                            style={{ ...S.btn("danger"), padding: "3px 7px", fontSize: 10, opacity: 0.6, cursor: "not-allowed" }}>Anulación pendiente</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: T.mut, marginTop: 8 }}>
                        Los movimientos, pagos y transferencias no se pueden editar ni eliminar físicamente desde esta pantalla.
                      </div>
                    </div>
                  ))}
                  <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
                    <span style={{ fontSize: 12, color: T.sub }}>{movsFil.length} movimientos</span>
                    <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                      <span>Egresos: <span style={{ color: T.red, fontWeight: 700 }}>Q {fmt(movsFil.filter(m => m.tipo === "egreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0))}</span></span>
                      <span>Ingresos: <span style={{ color: T.green, fontWeight: 700 }}>Q {fmt(movsFil.filter(m => m.tipo === "ingreso").reduce((s, m) => s + (parseFloat(m.monto) || 0), 0))}</span></span>
                      <span>Balance: <span style={{ color: T.acc, fontWeight: 800 }}>Q {fmt(movsFil.reduce((s, m) => s + (m.tipo === "ingreso" ? parseFloat(m.monto) : -parseFloat(m.monto)), 0))}</span></span>
                    </div>
                  </div>
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
  );
}
