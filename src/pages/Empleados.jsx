import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';
import {
  IconEdit, IconDelete, IconSave, IconBack, IconPlus, IconSearch,
  IconRefresh, IconPDF, IconExcel, IconUser, IconEmployee,
  IconCheck, IconMoney, IconDocument, IconClose, IconList
} from '../components/Icons.jsx';

// ─── API helper ───────────────────────────────────────────────────
const SB = "https://fmijbpatkddkbxlkfoza.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaWpicGF0a2Rka2J4bGtmb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ3NDAsImV4cCI6MjA5MDQ5MDc0MH0.zEVmDgLUQWv9gnQrJggGhAmTuqRcQyhGbMvcL_i8joA";
const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };
async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, { headers: { ...H, ...(extraHeaders || {}) }, ...rest });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Constantes ───────────────────────────────────────────────────
const TIPOS = {
  fijo:     { c: T.acc,   bg: T.accDim,   l: "Fijo"       },
  temporal: { c: T.blue,  bg: T.blueDim,  l: "Temporal"   },
  por_dia:  { c: T.sec,   bg: T.secDim,   l: "Por dia"    },
};
const ESTADOS = {
  activo:    { c: T.green, bg: T.greenDim, l: "Activo"    },
  inactivo:  { c: T.red,   bg: T.redDim,  l: "Inactivo"  },
  vacaciones:{ c: T.blue,  bg: T.blueDim, l: "Vacaciones" },
};

const EF = {
  codigo: "", nombre: "", dpi: "", nit: "", telefono: "", email: "",
  direccion: "", tipo: "fijo", puesto: "", salario: "", pago_diario: "",
  estado: "activo", fecha_ingreso: today(), notas: "",
};

// ─── Generar codigo auto ──────────────────────────────────────────
async function generarCodigo() {
  try {
    const d = await api("/empleados?select=codigo&order=codigo.desc&limit=1");
    const ultimo = d?.[0]?.codigo;
    if (!ultimo) return "EMP-0001";
    const n = parseInt(ultimo.replace(/\D/g, "")) || 0;
    return `EMP-${String(n + 1).padStart(4, "0")}`;
  } catch { return "EMP-0001"; }
}

// ─── Exportar PDF ─────────────────────────────────────────────────
const exportarPDF = (rows) => {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Empleados</title>
  <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}
  h2{color:#1B2D5C}table{width:100%;border-collapse:collapse}
  th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left}
  td{padding:5px 8px;border-bottom:1px solid #E2E8F0}
  @media print{button{display:none}}</style></head><body>
  <h2>Tz'unun AutoRentas — Empleados y Colaboradores</h2>
  <p>Total: ${rows.length} empleados — ${new Date().toLocaleDateString("es-GT")}</p>
  <table><thead><tr><th>Codigo</th><th>Nombre</th><th>Tipo</th><th>Puesto</th><th>Telefono</th><th>Estado</th><th>Salario/Dia</th></tr></thead>
  <tbody>${rows.map(r => `<tr><td>${r.codigo||""}</td><td>${r.nombre}</td><td>${TIPOS[r.tipo]?.l||r.tipo}</td><td>${r.puesto||"—"}</td><td>${r.telefono||"—"}</td><td>${ESTADOS[r.estado]?.l||r.estado}</td><td>Q ${fmt(r.tipo==="por_dia"?r.pago_diario:r.salario)}</td></tr>`).join("")}
  </tbody></table>
  <script>window.onload=()=>window.print()<\/script></body></html>`;
  const w = window.open("", "_blank"); w.document.write(html); w.document.close();
};

const exportarExcel = (rows) => {
  const cols = ["Codigo","Nombre","DPI","NIT","Tipo","Puesto","Telefono","Email","Estado","Salario","Pago Diario","Fecha Ingreso"];
  const keys = ["codigo","nombre","dpi","nit","tipo","puesto","telefono","email","estado","salario","pago_diario","fecha_ingreso"];
  const bom = "\uFEFF";
  const csv = [cols.join(","), ...rows.map(r => keys.map(k => `"${String(r[k]||"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([bom+csv],{type:"text/csv;charset=utf-8;"})), download:"Empleados_Tzunun.csv" });
  a.click(); URL.revokeObjectURL(a.href);
};

// ════════════════════════════════════════════════════════════════════
export default function PageEmpleados({ showToast, empId }) {
  const [vista,    setVista]    = useState("lista");   // lista | form | detalle
  const [editItem, setEditItem] = useState(null);
  const [selItem,  setSelItem]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [f,        setF]        = useState({ ...EF });
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("todos");
  const [filtroEst,  setFiltroEst]    = useState("todos");
  const [historial,  setHistorial]    = useState({ gastos: [], pagos: [] });
  const [loadHist,   setLoadHist]     = useState(false);
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const query = [
    filtroTipo !== "todos" ? `tipo=eq.${filtroTipo}` : "",
    filtroEst !== "todos" ? `estado=eq.${filtroEst}` : "",
  ].filter(Boolean).join("&");

  const { data, loading, total, page, totalPages, pageSize, setPage, setPageSize, reload, desde, hasta } = usePaginacion({
    table: "empleados",
    query,
    search: busqueda,
    columns: ['nombre', 'codigo', 'telefono', 'puesto'],
    order: 'nombre.asc',
  });

  useEffect(() => { setPage(1); }, [filtroTipo, filtroEst]);

  // ─── Historial del empleado ────────────────────────────────────
  const cargarHistorial = async (nombre) => {
    setLoadHist(true);
    try {
      const [g, p] = await Promise.all([
        api(`/gastos?empleado_nombre=eq.${encodeURIComponent(nombre)}&order=fecha.desc&limit=30`).catch(() => []),
        api(`/pagos?cliente_nombre=eq.${encodeURIComponent(nombre)}&order=fecha.desc&limit=30`).catch(() => []),
      ]);
      setHistorial({ gastos: g || [], pagos: p || [] });
    } catch { setHistorial({ gastos: [], pagos: [] }); }
    finally { setLoadHist(false); }
  };

  // ─── Abrir nuevo ──────────────────────────────────────────────
  const abrirNuevo = async () => {
    const codigo = await generarCodigo();
    setF({ ...EF, codigo });
    setEditItem(null); setVista("form");
  };

  // ─── Abrir editar ─────────────────────────────────────────────
  const abrirEditar = (e) => {
    setF({ codigo: e.codigo||"", nombre: e.nombre||"", dpi: e.dpi||"", nit: e.nit||"",
      telefono: e.telefono||"", email: e.email||"", direccion: e.direccion||"",
      tipo: e.tipo||"fijo", puesto: e.puesto||"", salario: e.salario||"",
      pago_diario: e.pago_diario||"", estado: e.estado||"activo",
      fecha_ingreso: e.fecha_ingreso||today(), notas: e.notas||"" });
    setEditItem(e); setVista("form");
  };

  // ─── Guardar ──────────────────────────────────────────────────
  const guardar = async () => {
    if (!f.nombre.trim()) { showToast("Nombre requerido", "err"); return; }
    setSaving(true);
    const payload = { ...f, empresa_id: empId,
      salario: parseFloat(f.salario) || 0,
      pago_diario: parseFloat(f.pago_diario) || 0 };
    if (editItem?.id) await dbUpd("empleados", editItem.id, payload);
    else await dbIns("empleados", payload);
    showToast(editItem ? "Empleado actualizado" : "Empleado registrado");
    setSaving(false); setVista("lista"); setEditItem(null); reload();
  };

  const del = async (id) => {
    if (!confirm("Eliminar empleado? Esta accion no se puede deshacer.")) return;
    await dbDel("empleados", id); showToast("Eliminado"); reload();
  };

  // ─── Stats ─────────────────────────────────────────────────────
  const stats = {
    total,
    activos:  data.filter(r => r.estado === "activo").length,
    fijos:    data.filter(r => r.tipo === "fijo").length,
    temporales: data.filter(r => r.tipo !== "fijo").length,
    nomina:   data.filter(r => r.tipo === "fijo" && r.estado === "activo").reduce((s,r) => s + (parseFloat(r.salario)||0), 0),
  };

  // ════════════════════════════════════════════════════════════════
  // VISTA: FORMULARIO
  // ════════════════════════════════════════════════════════════════
  if (vista === "form") return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setVista("lista"); setEditItem(null); }}
          style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 6 }}>
          <IconBack size={14} /> Volver
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.acc }}>
          {editItem ? "Editar Empleado" : "Nuevo Empleado / Colaborador"}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Identificacion */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 14 }}>
            IDENTIFICACION
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="CODIGO EMPLEADO">
              <input style={{ ...S.inp, fontFamily: "monospace", fontWeight: 700 }}
                value={f.codigo} onChange={e => sf("codigo", e.target.value.toUpperCase())}
                placeholder="EMP-0001" readOnly={!editItem} />
            </Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e => sf("tipo", e.target.value)}>
                <option value="fijo">Fijo / Planilla</option>
                <option value="temporal">Temporal</option>
                <option value="por_dia">Por dia / Eventual</option>
              </select>
            </Fld>
            <Fld label="NOMBRE COMPLETO *" span2>
              <input style={S.inp} value={f.nombre} onChange={e => sf("nombre", e.target.value)} placeholder="Nombre y apellidos" />
            </Fld>
            <Fld label="DPI">
              <input style={S.inp} value={f.dpi} onChange={e => sf("dpi", e.target.value)} placeholder="0000 00000 0000" />
            </Fld>
            <Fld label="NIT">
              <input style={S.inp} value={f.nit} onChange={e => sf("nit", e.target.value)} placeholder="1234567-8" />
            </Fld>
          </div>
        </div>

        {/* Contacto */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 14 }}>CONTACTO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="TELEFONO">
              <input style={S.inp} value={f.telefono} onChange={e => sf("telefono", e.target.value)} placeholder="(502) 0000-0000" />
            </Fld>
            <Fld label="CORREO">
              <input style={S.inp} type="email" value={f.email} onChange={e => sf("email", e.target.value)} placeholder="correo@gmail.com" />
            </Fld>
            <Fld label="DIRECCION" span2>
              <input style={S.inp} value={f.direccion} onChange={e => sf("direccion", e.target.value)} placeholder="Direccion de residencia" />
            </Fld>
          </div>
        </div>

        {/* Laboral */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 14 }}>DATOS LABORALES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="PUESTO / CARGO">
              <input style={S.inp} value={f.puesto} onChange={e => sf("puesto", e.target.value)} placeholder="Piloto, Mecanico, Admin..." />
            </Fld>
            <Fld label="ESTADO">
              <select style={S.sel} value={f.estado} onChange={e => sf("estado", e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo / Baja</option>
                <option value="vacaciones">Vacaciones</option>
              </select>
            </Fld>
            <Fld label="FECHA INGRESO">
              <input style={S.inp} type="date" value={f.fecha_ingreso} onChange={e => sf("fecha_ingreso", e.target.value)} />
            </Fld>
            {f.tipo === "fijo" ? (
              <Fld label="SALARIO MENSUAL (Q)">
                <input style={S.inp} type="number" step="0.01" value={f.salario}
                  onChange={e => sf("salario", e.target.value)} placeholder="0.00" />
              </Fld>
            ) : (
              <Fld label="PAGO POR DIA (Q)">
                <input style={S.inp} type="number" step="0.01" value={f.pago_diario}
                  onChange={e => sf("pago_diario", e.target.value)} placeholder="0.00" />
              </Fld>
            )}
            <Fld label="NOTAS" span2>
              <textarea style={{ ...S.inp, minHeight: 60, resize: "vertical" }}
                value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." />
            </Fld>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setVista("lista"); setEditItem(null); }}
            style={{ ...S.btn("ghost"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconClose size={14} /> Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            style={{ ...S.btn("primary"), flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconSave size={14} />
            {saving ? "Guardando..." : editItem ? "Actualizar empleado" : "Registrar empleado"}
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // VISTA: DETALLE
  // ════════════════════════════════════════════════════════════════
  if (vista === "detalle" && selItem) {
    const e = selItem;
    const ti = TIPOS[e.tipo] || TIPOS.fijo;
    const es = ESTADOS[e.estado] || ESTADOS.activo;
    const totalGastos = historial.gastos.reduce((s, g) => s + (parseFloat(g.total)||0), 0);

    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => { setVista("lista"); setSelItem(null); }}
            style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 6 }}>
            <IconBack size={14} /> Lista
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => abrirEditar(e)}
            style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 6 }}>
            <IconEdit size={14} /> Editar
          </button>
          <button onClick={() => del(e.id)}
            style={{ ...S.btn("danger"), display: "flex", alignItems: "center", gap: 6 }}>
            <IconDelete size={14} /> Eliminar
          </button>
        </div>

        {/* Card empleado */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: ti.bg, border: `2px solid ${ti.c}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconEmployee size={28} color={ti.c} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.txt }}>{e.nombre}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{e.puesto || "Sin puesto"} · Codigo: {e.codigo}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: ti.bg, color: ti.c }}>{ti.l}</span>
                <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: es.bg, color: es.c }}>{es.l}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: T.mut }}>
                {e.tipo === "por_dia" ? "Pago por dia" : "Salario mensual"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.acc }}>
                Q {fmt(e.tipo === "por_dia" ? e.pago_diario : e.salario)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { l: "Gastos registrados", v: historial.gastos.length, c: T.red  },
            { l: "Total gastos",       v: `Q ${fmt(totalGastos)}`, c: T.red  },
            { l: "Fecha ingreso",      v: fmtD(e.fecha_ingreso),   c: T.acc  },
          ].map((s, i) => (
            <div key={i} style={{ ...S.card, textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Datos */}
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>DATOS PERSONALES</div>
          {[
            ["DPI",       e.dpi       || "—"],
            ["NIT",       e.nit       || "—"],
            ["Telefono",  e.telefono  || "—"],
            ["Email",     e.email     || "—"],
            ["Direccion", e.direccion || "—"],
            ["Notas",     e.notas     || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.bord}`, fontSize: 13 }}>
              <span style={{ color: T.sub }}>{k}</span>
              <span style={{ color: T.txt, textAlign: "right", maxWidth: "60%" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Historial gastos */}
        {historial.gastos.length > 0 && (
          <div style={{ ...S.card, marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.mut, marginBottom: 12 }}>
              HISTORIAL DE GASTOS ({historial.gastos.length})
            </div>
            {loadHist ? <Spinner /> : historial.gastos.map(g => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.bord}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{g.descripcion || g.categoria}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{fmtD(g.fecha)} · {g.categoria}</div>
                </div>
                <div style={{ fontWeight: 700, color: T.red }}>Q {fmt(g.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // VISTA: LISTA
  // ════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total",       v: stats.total,               c: T.txt  },
          { l: "Activos",     v: stats.activos,             c: T.green },
          { l: "Fijos",       v: stats.fijos,               c: T.acc  },
          { l: "Temporales",  v: stats.temporales,          c: T.blue },
          { l: "Nomina mens.",v: `Q ${fmt(stats.nomina)}`,  c: T.sec  },
        ].map((s, i) => (
          <div key={i} style={{ background: T.surf, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: i === 4 ? 13 : 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: T.mut, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Header + acciones */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>
          Empleados y Colaboradores ({total})
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={reload} style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <IconRefresh size={13} /> Actualizar
          </button>
          <button onClick={() => exportarPDF(data)} style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <IconPDF size={13} /> PDF
          </button>
          <button onClick={() => exportarExcel(data)} style={{ ...S.btn("ghost"), display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <IconExcel size={13} /> Excel
          </button>
          <button onClick={abrirNuevo} style={{ ...S.btn("primary"), display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <IconPlus size={14} /> Nuevo empleado
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {["todos", "fijo", "temporal", "por_dia"].map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)}
            style={{ ...S.btn(filtroTipo === t ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {t === "todos" ? "Todos los tipos" : TIPOS[t]?.l || t}
          </button>
        ))}
        {["todos", "activo", "inactivo"].map(e => (
          <button key={e} onClick={() => setFiltroEst(e)}
            style={{ ...S.btn(filtroEst === e ? "primary" : "ghost"), fontSize: 11, padding: "5px 10px" }}>
            {e === "todos" ? "Todos" : ESTADOS[e]?.l || e}
          </button>
        ))}
      </div>

      {/* Busqueda */}
      <div style={{ marginBottom: 14 }}>
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, codigo, telefono, puesto..." />
      </div>

      {/* Lista */}
      {loading ? <Spinner /> : data.length === 0 ? (
        <Empty icon={<IconEmployee size={36} color={T.mut} />}
          msg={total === 0 ? "Sin empleados registrados" : "Sin resultados para la busqueda"}
          action="Registrar empleado" onAction={abrirNuevo} />
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Codigo", "Nombre", "Tipo", "Puesto", "Telefono", "Estado", "Pago", ""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(emp => {
                const ti = TIPOS[emp.tipo] || TIPOS.fijo;
                const es = ESTADOS[emp.estado] || ESTADOS.activo;
                return (
                  <tr key={emp.id}
                    onMouseEnter={e => e.currentTarget.style.background = T.surf}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => {
                      setSelItem(emp);
                      setVista("detalle");
                      cargarHistorial(emp.nombre);
                    }}
                    style={{ cursor: "pointer" }}>
                    <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 700, color: T.acc, fontSize: 12 }}>
                      {emp.codigo || "—"}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: T.txt }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: ti.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconUser size={14} color={ti.c} />
                        </div>
                        <div>
                          {emp.nombre}
                          {emp.dpi && <div style={{ fontSize: 10, color: T.mut }}>DPI: {emp.dpi}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: ti.bg, color: ti.c }}>
                        {ti.l}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: T.sub }}>{emp.puesto || "—"}</td>
                    <td style={{ ...S.td, fontSize: 12, color: T.sub }}>{emp.telefono || "—"}</td>
                    <td style={S.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: es.bg, color: es.c }}>
                        {es.l}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: T.acc, fontSize: 13 }}>
                      Q {fmt(emp.tipo === "por_dia" ? emp.pago_diario : emp.salario)}
                      <div style={{ fontSize: 9, color: T.mut }}>
                        {emp.tipo === "por_dia" ? "/dia" : "/mes"}
                      </div>
                    </td>
                    <td style={S.td} onClick={ev => ev.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => abrirEditar(emp)}
                          style={{ ...S.btn("ghost"), padding: "3px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                          <IconEdit size={12} /> Editar
                        </button>
                        <button onClick={() => del(emp.id)}
                          style={{ ...S.btn("danger"), padding: "3px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                          <IconDelete size={12} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Paginador page={page} totalPages={totalPages} total={total} desde={desde} hasta={hasta} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
    </div>
  );
}
