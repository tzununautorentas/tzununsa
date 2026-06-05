import React, { useState } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

const TIPOS = ["Traslado","Renta diaria","Renta semanal","Renta mensual","Tour","Servicio especial","Aeropuerto","Otro"];
const EF = { codigo:"", nombre:"", tipo:"Traslado", descripcion:"", precio_base:0, precio_dia:0, precio_sem:0, precio_mes:0, activo:true, notas:"" };

export default function PageCatalogo({ showToast, empId }) {
  const [vista,    setVista]    = useState("lista");
  const [editItem, setEditItem] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [filtro,   setFiltro]   = useState("todos");
  const [exportar, setExportar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [f, setF] = useState({ ...EF });
  const sf = (k, v) => setF(p => ({ ...p, [k]: v }));

  const query = filtro && filtro !== 'todos'
    ? (filtro === 'activo' ? 'activo=is.true' : 'activo=is.false')
    : '';

  const pag = usePaginacion({
    table: 'servicios',
    query,
    search: busqueda,
    columns: ['nombre', 'codigo', 'tipo', 'descripcion', 'notas'],
    order: 'codigo.asc,nombre.asc',
  });

  const abrirEditar = s => {
    setF({ codigo:s.codigo||"", nombre:s.nombre||"", tipo:s.tipo||"Traslado",
      descripcion:s.descripcion||"", precio_base:s.precio_base||0,
      precio_dia:s.precio_dia||0, precio_sem:s.precio_sem||0,
      precio_mes:s.precio_mes||0, activo:s.activo!==false, notas:s.notas||"" });
    setEditItem(s); setVista("form");
  };

  const guardar = async () => {
    if (!f.nombre.trim()) { showToast("Nombre requerido","err"); return; }
    setSaving(true);
    const p = { ...f, empresa_id:empId,
      precio_base:parseFloat(f.precio_base)||0, precio_dia:parseFloat(f.precio_dia)||0,
      precio_sem:parseFloat(f.precio_sem)||0,   precio_mes:parseFloat(f.precio_mes)||0 };
    if (editItem?.id) await dbUpd("servicios", editItem.id, p);
    else await dbIns("servicios", p);
    showToast("Servicio guardado"); setSaving(false); setVista("lista"); pag.reload();
  };

  const del = async id => {
    if (!confirm("Eliminar este servicio?")) return;
    await dbDel("servicios", id); showToast("Eliminado"); pag.reload();
  };

  const toggleActivo = async (id, activo) => {
    await dbUpd("servicios", id, { activo: !activo });
    showToast(!activo ? "Servicio activado" : "Servicio pausado"); pag.reload();
  };

  if (vista === "form") return (
    <div style={{ maxWidth:620 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:T.acc }}>{editItem ? "Editar servicio" : "Nuevo servicio"}</div>
        <button onClick={() => { setVista("lista"); setEditItem(null); }} style={S.btn("ghost")}>Volver</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>DATOS DEL SERVICIO</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Fld label="CODIGO">
              <input style={{ ...S.inp, fontFamily:"monospace", fontWeight:700 }} value={f.codigo}
                onChange={e => sf("codigo", e.target.value.toUpperCase())} placeholder="SRV-001" />
            </Fld>
            <Fld label="TIPO">
              <select style={S.sel} value={f.tipo} onChange={e => sf("tipo", e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Fld>
            <Fld label="NOMBRE DEL SERVICIO *" span2>
              <input style={S.inp} value={f.nombre} onChange={e => sf("nombre", e.target.value)} placeholder="Nombre del servicio" />
            </Fld>
            <Fld label="DESCRIPCION" span2>
              <textarea style={{ ...S.inp, minHeight:70, resize:"vertical" }} value={f.descripcion}
                onChange={e => sf("descripcion", e.target.value)} placeholder="Descripcion del servicio..." />
            </Fld>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:T.mut, marginBottom:12, letterSpacing:1 }}>PRECIOS (Q)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Fld label="PRECIO BASE"><input style={S.inp} type="number" step="0.01" value={f.precio_base} onChange={e => sf("precio_base", e.target.value)} placeholder="0.00" /></Fld>
            <Fld label="PRECIO POR DIA"><input style={S.inp} type="number" step="0.01" value={f.precio_dia} onChange={e => sf("precio_dia", e.target.value)} placeholder="0.00" /></Fld>
            <Fld label="PRECIO SEMANAL"><input style={S.inp} type="number" step="0.01" value={f.precio_sem} onChange={e => sf("precio_sem", e.target.value)} placeholder="0.00" /></Fld>
            <Fld label="PRECIO MENSUAL"><input style={S.inp} type="number" step="0.01" value={f.precio_mes} onChange={e => sf("precio_mes", e.target.value)} placeholder="0.00" /></Fld>
          </div>
        </div>
        <div style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, color:T.txt }}>Servicio activo</span>
          <button onClick={() => sf("activo", !f.activo)}
            style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", background:f.activo?T.acc:T.bord, position:"relative", transition:"background .2s" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", background:"white", position:"absolute", top:3, left:f.activo?22:3, transition:"left .2s" }} />
          </button>
        </div>
        <div style={S.card}>
          <Fld label="NOTAS"><input style={S.inp} value={f.notas} onChange={e => sf("notas", e.target.value)} placeholder="Observaciones..." /></Fld>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => { setVista("lista"); setEditItem(null); }} style={{ ...S.btn("ghost"), flex:1 }}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{ ...S.btn("primary"), flex:2 }}>
            {saving ? "Guardando..." : editItem ? "Actualizar servicio" : "Guardar servicio"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {exportar && <ModalExportar titulo="Catalogo de Servicios" datos={pag.data} campos={[
        {label:"Codigo",key:"codigo"},{label:"Nombre",key:"nombre"},{label:"Tipo",key:"tipo"},
        {label:"Precio Base",key:"precio_base"},{label:"Precio Dia",key:"precio_dia"},
        {label:"Precio Sem.",key:"precio_sem"},{label:"Precio Mes.",key:"precio_mes"}
      ]} onClose={() => setExportar(false)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.txt }}>Catalogo de Servicios ({pag.total})</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setExportar(true)} style={{ ...S.btn("ghost"), fontSize:11 }}>Exportar</button>
          <button onClick={() => { setF({...EF}); setEditItem(null); setVista("form"); }} style={{ ...S.btn("primary"), fontSize:12 }}>+ Nuevo servicio</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {["todos","activo","inactivo"].map(f2 => (
          <button key={f2} onClick={() => setFiltro(f2)} style={{ ...S.btn(filtro===f2?"primary":"ghost"), fontSize:11, padding:"5px 10px" }}>
            {f2==="todos"?"Todos":f2==="activo"?"Activos":"Inactivos"}
          </button>
        ))}
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar servicio..." />
      </div>

      {pag.loading ? <Spinner /> : pag.data.length === 0 ? (
        <Empty icon="S" msg="Sin servicios registrados" action="+ Nuevo servicio" onAction={() => { setF({...EF}); setVista("form"); }} />
      ) : (
        <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
          {pag.data.map(s => (
            <div key={s.id} style={{ ...S.card, borderTop:`3px solid ${s.activo!==false?T.acc:T.bord}`, opacity:s.activo!==false?1:0.6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.txt }}>{s.nombre}</div>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                    {s.codigo && <span style={{ fontSize:10, fontFamily:"monospace", color:T.acc, background:T.accDim, padding:"1px 6px", borderRadius:6 }}>{s.codigo}</span>}
                    <span style={{ fontSize:10, color:T.sub, background:T.surf, padding:"1px 6px", borderRadius:6 }}>{s.tipo}</span>
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:s.activo!==false?T.greenDim:T.redDim, color:s.activo!==false?T.green:T.red }}>
                  {s.activo!==false?"Activo":"Inactivo"}
                </span>
              </div>
              {s.descripcion && <div style={{ fontSize:12, color:T.sub, marginBottom:10, lineHeight:1.5 }}>{s.descripcion}</div>}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                {[["Base",s.precio_base],["Dia",s.precio_dia],["Sem.",s.precio_sem],["Mes",s.precio_mes]].map(([l,v]) => (
                  <div key={l} style={{ background:T.surf, borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.mut }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.acc }}>Q{fmt(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => toggleActivo(s.id, s.activo)} style={{ ...S.btn("ghost"), fontSize:11, padding:"4px 10px" }}>
                  {s.activo!==false?"Pausar":"Activar"}
                </button>
                <button onClick={() => abrirEditar(s)} style={{ ...S.btn("ghost"), fontSize:11, padding:"4px 10px" }}>Editar</button>
                <button onClick={() => del(s.id)} style={{ ...S.btn("danger"), fontSize:11, padding:"4px 10px" }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
        <Paginador page={pag.page} totalPages={pag.totalPages} total={pag.total} desde={pag.desde} hasta={pag.hasta} pageSize={pag.pageSize} onPage={pag.setPage} onPageSize={pag.setPageSize} />
        </>
      )}
    </div>
  );
}
