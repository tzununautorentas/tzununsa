import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

export default function PageClientes({ showToast, empId }) {
  const [vista, setVista]     = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [saving, setSaving]   = useState(false);
  const [allCodes, setAllCodes] = useState([]);
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
    reload();
  };

  const del = async id => {
    if (!confirm("Eliminar cliente?")) return;
    await dbDel("clientes", id); showToast("Eliminado"); reload();
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>
          Directorio de Clientes ({total})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
