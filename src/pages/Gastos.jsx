import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, CAT_GASTO } from '../config.js';
import { Spinner, Empty, Fld, CatBadge } from '../components/shared.jsx';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = {
  pendiente:     { c: T.mut,   bg: "#1E293B",  l: "Pendiente"     },
  en_revision:   { c: T.blue,  bg: T.blueDim,  l: "En revision"   },
  aprobado:      { c: T.acc,   bg: T.accDim,   l: "Aprobado"      },
  rechazado:     { c: T.red,   bg: T.redDim,   l: "Rechazado"     },
  contabilizado: { c: T.green, bg: T.greenDim, l: "Contabilizado" },
};
const CC = { combustible:"#F59E0B",mantenimiento:"#3B82F6",seguros:"#A855F7",salarios:"#22C55E",impuestos:"#EF4444",servicios:"#00D4AA",llantas:"#EF4444",repuestos:"#3B82F6",hospedaje:"#8B5CF6",alimentacion:"#F97316",peajes:"#6B7280",oficina:"#64748B",otros:"#94A3B8" };

const EF = { fecha:today(),categoria:"combustible",descripcion:"",proveedor:"",proveedor_nit:"",numero_factura:"",subtotal:"",impuestos:"",total:"",metodo_pago:"efectivo",referencia:"",estado:"pendiente",empleado_nombre:"",vehiculo_id:"",vehiculo_nombre:"",reserva_id:"",notas:"",archivo_url:"",archivo_tipo:"",moneda:"GTQ" };

// ─── Escaneo IA (requiere clave en localStorage: "anthropic_key") ─────────────
const escanearConIA = async (base64, tipo) => {
  const key = localStorage.getItem("anthropic_key") || "";
  if (!key) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600,
        messages:[{ role:"user", content:[
          { type:"image", source:{ type:"base64", media_type:tipo, data:base64.split(",")[1] } },
          { type:"text", text:'Extrae datos de esta factura. Responde SOLO JSON sin markdown:\n{"fecha":"YYYY-MM-DD","numero_factura":"","proveedor":"","proveedor_nit":"","subtotal":0,"impuestos":0,"total":0,"moneda":"GTQ","descripcion":"","categoria":"otros"}' }
        ]}]
      })
    });
    const d = await r.json();
    return JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
  } catch { return null; }
};

// ─── Exportar PDF reporte ─────────────────────────────────────────────────────
const exportarPDF = (rows, filtros) => {
  const total = rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Reporte de Gastos</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;padding:20px}
h1{color:#1B2D5C;font-size:16px;margin-bottom:4px}
.sub{font-size:9px;color:#64748B;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th{background:#1B2D5C;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #E2E8F0;font-size:10px}
.total-row td{font-weight:700;background:#F1F5F9;font-size:12px}
.badge{padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600}
@media print{body{padding:10px}}</style>
</head><body>
<h1>TZ'UNUN AUTORENTAS — Reporte de Gastos</h1>
<div class="sub">${filtros} · Generado: ${new Date().toLocaleDateString("es-GT")} · ${rows.length} registros</div>
<table><thead><tr><th>Fecha</th><th>Descripcion</th><th>Categoria</th><th>Proveedor</th><th>Empleado</th><th>Vehiculo</th><th>Metodo</th><th>Estado</th><th style="text-align:right">Total Q</th></tr></thead>
<tbody>${rows.map(r=>`<tr><td>${r.fecha||""}</td><td>${r.descripcion||""}</td><td>${r.categoria||""}</td><td>${r.proveedor||"—"}</td><td>${r.empleado_nombre||"—"}</td><td>${r.vehiculo_nombre||"—"}</td><td>${r.metodo_pago||""}</td><td>${ESTADOS[r.estado]?.l||r.estado}</td><td style="text-align:right;font-weight:600">Q ${fmt(r.total)}</td></tr>`).join("")}
<tr class="total-row"><td colspan="8">TOTAL</td><td style="text-align:right">Q ${fmt(total)}</td></tr>
</tbody></table>
<script>window.onload=()=>window.print();</script>
</body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
};

// ─── Exportar Excel (CSV) ─────────────────────────────────────────────────────
const exportarExcel = (rows) => {
  const cols = ["Fecha","Descripcion","Categoria","Proveedor","NIT","No.Factura","Empleado","Vehiculo","Reserva","Subtotal","Impuestos","Total","Metodo","Estado","Referencia","Notas"];
  const keys = ["fecha","descripcion","categoria","proveedor","proveedor_nit","numero_factura","empleado_nombre","vehiculo_nombre","reserva_id","subtotal","impuestos","total","metodo_pago","estado","referencia","notas"];
  const bom = "\uFEFF";
  const csv = [cols.join(","), ...rows.map(r=>keys.map(k=>`"${String(r[k]||"").replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob = new Blob([bom+csv],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="Gastos_Tzunun.csv"; a.click(); URL.revokeObjectURL(a.href);
};

// ─── Componente de carga de archivos ─────────────────────────────────────────
function FileUpload({ onFile, preview, tipo }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const handle = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => onFile(e.target.result, file.type, file.name);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        style={{ border:`2px dashed ${drag?T.acc:T.bord}`, borderRadius:12, padding:"20px 14px", textAlign:"center", cursor:"pointer", background:drag?T.accDim:"transparent", transition:"all .15s" }}>
        <div style={{ fontSize:24, marginBottom:8 }}>PDF</div>
        <div style={{ fontSize:13, fontWeight:600, color:T.txt }}>Arrastra o haz clic para subir</div>
        <div style={{ fontSize:11, color:T.sub, marginTop:3 }}>PDF, JPG, PNG · Facturas y recibos</div>
        <input ref={ref} type="file" accept=".pdf,image/*" style={{ display:"none" }} onChange={e => handle(e.target.files[0])} />
      </div>
      {preview && (
        <div style={{ marginTop:10, borderRadius:10, overflow:"hidden", border:`1px solid ${T.bord}`, maxHeight:280 }}>
          {tipo?.startsWith("image") ? (
            <img src={preview} alt="Vista previa" style={{ width:"100%", maxHeight:280, objectFit:"contain", display:"block", background:T.surf }} />
          ) : (
            <div style={{ background:T.surf, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>PDF</div>
              <div style={{ fontSize:12, color:T.sub }}>Archivo PDF cargado</div>
              <a href={preview} target="_blank" rel="noreferrer"
                style={{ ...S.btn("primary"), display:"inline-block", marginTop:8, fontSize:11, textDecoration:"none", padding:"6px 12px" }}>
                Ver PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Panel lateral de vista/detalle ──────────────────────────────────────────
function GastoPanel({ gasto, onClose, onAprobar, onRechazar, onContabilizar, empId, userName }) {
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showRechazo, setShowRechazo] = useState(false);
  if (!gasto) return null;
  const e = ESTADOS[gasto.estado] || ESTADOS.pendiente;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:300 }} onClick={onClose}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:420, background:T.card, borderLeft:`1px solid ${T.bord}`, overflowY:"auto", display:"flex", flexDirection:"column" }}
        onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.bord}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.txt }}>{gasto.descripcion?.slice(0,30)||"Gasto"}</div>
            <span style={{ padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:600, background:e.bg, color:e.c }}>{e.l}</span>
          </div>
          <button onClick={onClose} style={{ ...S.btn("ghost"), padding:"4px 10px" }}>X</button>
        </div>

        {/* Preview documento */}
        {gasto.archivo_url && (
          <div style={{ borderBottom:`1px solid ${T.bord}`, background:T.surf }}>
            {gasto.archivo_tipo?.startsWith("image") ? (
              <img src={gasto.archivo_url} alt="Documento" style={{ width:"100%", maxHeight:220, objectFit:"contain", display:"block" }} />
            ) : (
              <div style={{ padding:16, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:4 }}>PDF</div>
                <a href={gasto.archivo_url} target="_blank" rel="noreferrer"
                  style={{ ...S.btn("primary"), display:"inline-block", fontSize:11, textDecoration:"none", padding:"5px 12px" }}>
                  Ver documento
                </a>
              </div>
            )}
          </div>
        )}

        {/* Datos */}
        <div style={{ padding:"14px 18px", flex:1 }}>
          {[
            ["Fecha", fmtD(gasto.fecha)],
            ["Proveedor", gasto.proveedor||"—"],
            ["NIT", gasto.proveedor_nit||"—"],
            ["No. Factura", gasto.numero_factura||"—"],
            ["Categoria", gasto.categoria],
            ["Empleado", gasto.empleado_nombre||"—"],
            ["Vehiculo", gasto.vehiculo_nombre||"—"],
            ["Metodo", gasto.metodo_pago],
            ["Referencia", gasto.referencia||"—"],
          ].map(([l,v])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.bord}18`, fontSize:12 }}>
              <span style={{ color:T.sub }}>{l}</span>
              <span style={{ fontWeight:500, color:T.txt }}>{v}</span>
            </div>
          ))}

          {/* Totales */}
          <div style={{ background:T.surf, borderRadius:10, padding:"12px 14px", marginTop:14 }}>
            {parseFloat(gasto.subtotal)>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"2px 0" }}><span>Subtotal</span><span>Q {fmt(gasto.subtotal)}</span></div>}
            {parseFloat(gasto.impuestos)>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:T.sub,padding:"2px 0" }}><span>Impuestos</span><span>Q {fmt(gasto.impuestos)}</span></div>}
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:800,color:T.red,marginTop:6,paddingTop:6,borderTop:`1px solid ${T.bord}` }}>
              <span>TOTAL</span><span>Q {fmt(gasto.total)}</span>
            </div>
          </div>

          {gasto.notas&&<div style={{ marginTop:10,fontSize:12,color:T.sub,fontStyle:"italic" }}>{gasto.notas}</div>}

          {/* Info aprobacion */}
          {gasto.aprobado_por&&<div style={{ marginTop:10,fontSize:11,color:T.acc }}>Aprobado por: {gasto.aprobado_por}</div>}
          {gasto.rechazado_por&&<div style={{ marginTop:6,fontSize:11,color:T.red }}>Rechazado por: {gasto.rechazado_por}</div>}
          {gasto.motivo_rechazo&&<div style={{ fontSize:11,color:T.sub }}>{gasto.motivo_rechazo}</div>}

          {/* Asiento contable */}
          {gasto.estado==="aprobado"&&!gasto.contabilizado&&(
            <div style={{ marginTop:14,background:T.accDim,border:`1px solid ${T.acc}44`,borderRadius:10,padding:"10px 14px" }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.acc,marginBottom:6 }}>ASIENTO CONTABLE PENDIENTE</div>
              <div style={{ fontSize:11,color:T.sub }}>Debe: Gastos Operativos — Q {fmt(gasto.total)}</div>
              <div style={{ fontSize:11,color:T.sub }}>Haber: Caja/Banco — Q {fmt(gasto.total)}</div>
            </div>
          )}
          {gasto.contabilizado&&<div style={{ marginTop:10,padding:"8px 12px",background:T.greenDim,border:`1px solid ${T.green}44`,borderRadius:8,fontSize:11,color:T.green,fontWeight:600 }}>Asiento contable publicado</div>}
        </div>

        {/* Acciones */}
        <div style={{ padding:"14px 18px", borderTop:`1px solid ${T.bord}`, flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}>
          {gasto.estado==="pendiente"&&(
            <button onClick={()=>onAprobar(gasto,"en_revision")} style={{...S.btn("blue"),width:"100%"}}>Enviar a revision</button>
          )}
          {gasto.estado==="en_revision"&&(
            <>
              <button onClick={()=>onAprobar(gasto,"aprobado")} style={{...S.btn("primary"),width:"100%"}}>Aprobar gasto</button>
              {!showRechazo?(
                <button onClick={()=>setShowRechazo(true)} style={{...S.btn("danger"),width:"100%"}}>Rechazar</button>
              ):(
                <div>
                  <input style={{...S.inp,marginBottom:6}} value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)} placeholder="Motivo del rechazo..."/>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{onRechazar(gasto,motivoRechazo);setShowRechazo(false);setMotivoRechazo("");}} style={{...S.btn("danger"),flex:1}}>Confirmar rechazo</button>
                    <button onClick={()=>setShowRechazo(false)} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}
          {gasto.estado==="aprobado"&&!gasto.contabilizado&&(
            <button onClick={()=>onContabilizar(gasto)} style={{...S.btn("green"),width:"100%"}}>Publicar asiento contable</button>
          )}
          {gasto.estado==="rechazado"&&(
            <button onClick={()=>onAprobar(gasto,"pendiente")} style={{...S.btn("ghost"),width:"100%"}}>Reactivar como pendiente</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Formulario de gasto ──────────────────────────────────────────────────────
function FormGasto({ initial, empId, proveedores, vehiculos, reservas, empleados, onSave, onCancel, showToast }) {
  const [f, setF] = useState(initial ? {
    ...EF, ...initial,
    fecha: initial.fecha||today(),
    subtotal: initial.subtotal||"", impuestos: initial.impuestos||"", total: initial.total||"",
  } : {...EF});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const sf = (k,v) => setF(p=>({...p,[k]:v}));

  const calcTotal = (sub,imp) => {
    const t = (parseFloat(sub)||0)+(parseFloat(imp)||0);
    sf("total", t>0?t.toFixed(2):"");
  };

  const onFile = async (base64, tipo, nombre) => {
    sf("archivo_url", base64); sf("archivo_tipo", tipo);
    // Escaneo IA automático si hay clave configurada
    const key = localStorage.getItem("anthropic_key")||"";
    if (key && tipo.startsWith("image")) {
      setScanning(true);
      showToast("Escaneando con IA...");
      const datos = await escanearConIA(base64, tipo);
      setScanning(false);
      if (datos) {
        setF(p=>({...p,
          fecha: datos.fecha||p.fecha,
          numero_factura: datos.numero_factura||p.numero_factura,
          proveedor: datos.proveedor||p.proveedor,
          proveedor_nit: datos.proveedor_nit||p.proveedor_nit,
          subtotal: datos.subtotal||p.subtotal,
          impuestos: datos.impuestos||p.impuestos,
          total: datos.total||p.total,
          descripcion: datos.descripcion||p.descripcion,
          categoria: datos.categoria||p.categoria,
          moneda: datos.moneda||p.moneda,
        }));
        showToast("Datos extraidos automaticamente");
      } else {
        showToast("Completa los datos manualmente", "err");
      }
    }
  };

  const guardar = async () => {
    if (!f.descripcion.trim()||!(parseFloat(f.total)>0)) { showToast("Descripcion y total son requeridos","err"); return; }
    setSaving(true);
    const payload = {
      empresa_id:empId, fecha:f.fecha, categoria:f.categoria, descripcion:f.descripcion,
      proveedor:f.proveedor||"", proveedor_nit:f.proveedor_nit||"",
      numero_factura:f.numero_factura||"", subtotal:parseFloat(f.subtotal)||0,
      impuestos:parseFloat(f.impuestos)||0, total:parseFloat(f.total)||0,
      metodo_pago:f.metodo_pago, referencia:f.referencia||"",
      estado:f.estado||"pendiente", empleado_nombre:f.empleado_nombre||"",
      vehiculo_id:f.vehiculo_id||null, vehiculo_nombre:f.vehiculo_nombre||"",
      reserva_id:f.reserva_id||null, notas:f.notas||"",
      archivo_url:f.archivo_url||"", archivo_tipo:f.archivo_tipo||"",
      moneda:f.moneda||"GTQ",
    };
    const r = initial?.id ? await dbUpd("gastos",initial.id,payload) : await dbIns("gastos",payload);
    if (r?.error) { showToast("Error: "+r.error,"err"); setSaving(false); return; }
    showToast("Gasto guardado"); setSaving(false); onSave();
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div style={{ fontSize:14,fontWeight:700,color:T.acc }}>{initial?.id?"Editar gasto":"Nuevo gasto"}</div>
        <button onClick={onCancel} style={S.btn("ghost")}>Volver</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
        {/* Columna izq */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

          {/* Subir documento */}
          <div style={S.card}>
            <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:10 }}>DOCUMENTO / FACTURA</div>
            <FileUpload onFile={onFile} preview={f.archivo_url} tipo={f.archivo_tipo}/>
            {scanning&&<div style={{ marginTop:8,fontSize:12,color:T.acc,textAlign:"center" }}>Analizando documento con IA...</div>}
            {!localStorage.getItem("anthropic_key")&&(
              <div style={{ marginTop:8,fontSize:11,color:T.sub }}>
                Para escaneo automatico: guarda tu clave Claude en Settings.
                <button onClick={()=>{const k=prompt("Pega tu Anthropic API key:");if(k)localStorage.setItem("anthropic_key",k);}} style={{...S.btn("ghost"),fontSize:10,marginLeft:8,padding:"2px 6px"}}>Configurar</button>
              </div>
            )}
          </div>

          {/* Datos del gasto */}
          <div style={S.card}>
            <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:12 }}>DATOS DEL GASTO</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
              <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
              <Fld label="CATEGORIA">
                <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
                  {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </Fld>
              <Fld label="DESCRIPCION" span2><input style={S.inp} value={f.descripcion} onChange={e=>sf("descripcion",e.target.value)} placeholder="Descripcion del gasto"/></Fld>
              <Fld label="PROVEEDOR"><input style={S.inp} value={f.proveedor} onChange={e=>sf("proveedor",e.target.value)} placeholder="Nombre proveedor"/></Fld>
              <Fld label="NIT PROVEEDOR"><input style={S.inp} value={f.proveedor_nit} onChange={e=>sf("proveedor_nit",e.target.value)} placeholder="1234567-8"/></Fld>
              <Fld label="NO. FACTURA"><input style={S.inp} value={f.numero_factura} onChange={e=>sf("numero_factura",e.target.value)} placeholder="FAC-0001"/></Fld>
              <Fld label="METODO PAGO">
                <select style={S.sel} value={f.metodo_pago} onChange={e=>sf("metodo_pago",e.target.value)}>
                  {["efectivo","transferencia","deposito","tarjeta","cheque","credito"].map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </Fld>
              <Fld label="REFERENCIA"><input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="No. doc..."/></Fld>
            </div>
          </div>

          {/* Montos */}
          <div style={S.card}>
            <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:12 }}>MONTOS (GTQ)</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11 }}>
              <Fld label="SUBTOTAL">
                <input style={S.inp} type="number" step="0.01" value={f.subtotal} onChange={e=>{sf("subtotal",e.target.value);calcTotal(e.target.value,f.impuestos);}} placeholder="0.00"/>
              </Fld>
              <Fld label="IMPUESTOS (IVA)">
                <input style={S.inp} type="number" step="0.01" value={f.impuestos} onChange={e=>{sf("impuestos",e.target.value);calcTotal(f.subtotal,e.target.value);}} placeholder="0.00"/>
              </Fld>
              <Fld label="TOTAL">
                <input style={{...S.inp,fontWeight:700,color:T.red}} type="number" step="0.01" value={f.total} onChange={e=>sf("total",e.target.value)} placeholder="0.00"/>
              </Fld>
            </div>
          </div>
        </div>

        {/* Columna der */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

          {/* Asociaciones */}
          <div style={S.card}>
            <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:12 }}>ASOCIAR A</div>
            <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
              <Fld label="EMPLEADO (quien realizo el gasto)">
                {empleados.length>0?(
                  <select style={S.sel} value={f.empleado_nombre} onChange={e=>sf("empleado_nombre",e.target.value)}>
                    <option value="">Sin empleado</option>
                    {empleados.map(e=><option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                ):(
                  <input style={S.inp} value={f.empleado_nombre} onChange={e=>sf("empleado_nombre",e.target.value)} placeholder="Nombre del empleado"/>
                )}
              </Fld>
              <Fld label="VEHICULO">
                <select style={S.sel} value={f.vehiculo_id} onChange={e=>{sf("vehiculo_id",e.target.value);const v=vehiculos.find(x=>x.id===e.target.value);if(v)sf("vehiculo_nombre",(v.marca||"")+" "+(v.modelo||"")+" ("+v.placa+")");}}>
                  <option value="">Sin vehiculo</option>
                  {vehiculos.map(v=><option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.placa}</option>)}
                </select>
              </Fld>
              <Fld label="RESERVA / TRASLADO">
                <select style={S.sel} value={f.reserva_id} onChange={e=>sf("reserva_id",e.target.value)}>
                  <option value="">Sin reserva</option>
                  {reservas.map(r=><option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre}</option>)}
                </select>
              </Fld>
            </div>
          </div>

          {/* Estado inicial */}
          <div style={S.card}>
            <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:12 }}>ESTADO INICIAL</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {["pendiente","en_revision"].map(est=>{
                const e = ESTADOS[est];
                return (
                  <button key={est} onClick={()=>sf("estado",est)}
                    style={{ ...S.btn(f.estado===est?"primary":"ghost"), fontSize:11, padding:"6px 12px" }}>
                    {e.l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div style={S.card}>
            <Fld label="NOTAS / OBSERVACIONES">
              <textarea style={{...S.inp,minHeight:80,resize:"vertical"}} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones adicionales sobre este gasto..."/>
            </Fld>
          </div>

          {/* Resumen */}
          {parseFloat(f.total)>0&&(
            <div style={{ background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:14,padding:"16px 18px" }}>
              <div style={{ fontSize:11,color:T.mut,marginBottom:4 }}>TOTAL DEL GASTO</div>
              <div style={{ fontSize:26,fontWeight:900,color:T.red }}>Q {fmt(f.total)}</div>
              {f.empleado_nombre&&<div style={{ fontSize:11,color:T.sub,marginTop:4 }}>Por: {f.empleado_nombre}</div>}
              {f.vehiculo_nombre&&<div style={{ fontSize:11,color:T.sub }}>Vehiculo: {f.vehiculo_nombre}</div>}
            </div>
          )}

          <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),width:"100%",padding:12,fontSize:13}}>
            {saving?"Guardando...":initial?.id?"Actualizar gasto":"Registrar gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Módulo principal de Gastos ───────────────────────────────────────────────
function ModGastos({ empId, showToast, vehiculos, reservas, empleados, proveedores }) {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState("lista"); // lista | form | reporte
  const [editItem,  setEditItem]  = useState(null);
  const [panelItem, setPanelItem] = useState(null);
  const [filtroEst, setFiltroEst] = useState("todos");
  const [filtroEmp, setFiltroEmp] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [filtroPer, setFiltroPer] = useState(""); // YYYY-MM
  const [userName]                = useState(() => { try { return JSON.parse(localStorage.getItem("tzunun_session"))?.user?.email?.split("@")[0]||"Usuario"; } catch { return "Usuario"; } });

  const load = async () => {
    setLoading(true);
    const d = await dbGet("gastos");
    setRows(Array.isArray(d)?d:[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  // ── Aprobaciones ──
  const cambiarEstado = async (gasto, nuevoEstado) => {
    const upd = { estado: nuevoEstado };
    if (nuevoEstado==="aprobado") { upd.aprobado_por=userName; upd.aprobado_en=new Date().toISOString(); }
    await dbUpd("gastos", gasto.id, upd);
    setPanelItem(null);
    showToast(nuevoEstado==="aprobado"?"Gasto aprobado":"Estado actualizado");
    load();
  };
  const rechazar = async (gasto, motivo) => {
    await dbUpd("gastos", gasto.id, { estado:"rechazado", rechazado_por:userName, motivo_rechazo:motivo });
    setPanelItem(null); showToast("Gasto rechazado"); load();
  };
  const contabilizar = async (gasto) => {
    // Crear asiento contable
    await dbIns("asientos_contables", {
      empresa_id:empId, gasto_id:gasto.id, fecha:gasto.fecha,
      descripcion:`Gasto: ${gasto.descripcion} — ${gasto.proveedor||""}`,
      referencia:gasto.numero_factura||gasto.id,
      cuenta_debe:"5101 - Gastos Operativos", debe:parseFloat(gasto.total)||0,
      cuenta_haber:"1101 - Caja/Banco", haber:parseFloat(gasto.total)||0,
    });
    await dbUpd("gastos", gasto.id, { contabilizado:true, estado:"contabilizado" });
    setPanelItem(null); showToast("Asiento contable publicado"); load();
  };
  const del = async id => {
    if(!confirm("Eliminar este gasto?"))return;
    await dbDel("gastos",id); showToast("Eliminado"); load();
  };

  // ── Filtros ──
  const filtered = rows.filter(r=>{
    if (filtroEst!=="todos"&&r.estado!==filtroEst) return false;
    if (filtroEmp&&r.empleado_nombre!==filtroEmp) return false;
    if (filtroCat!=="todas"&&r.categoria!==filtroCat) return false;
    if (filtroPer&&!(r.fecha||"").startsWith(filtroPer)) return false;
    return true;
  });

  const totalFil = filtered.reduce((s,r)=>s+(parseFloat(r.total)||0),0);

  // ── Estadísticas para reporte ──
  const statsEmp = [...new Set(rows.map(r=>r.empleado_nombre).filter(Boolean))].map(emp=>({
    emp, total:rows.filter(r=>r.empleado_nombre===emp).reduce((s,r)=>s+(parseFloat(r.total)||0),0)
  })).sort((a,b)=>b.total-a.total);

  if (vista==="form") return (
    <FormGasto initial={editItem} empId={empId} showToast={showToast}
      proveedores={proveedores} vehiculos={vehiculos} reservas={reservas} empleados={empleados}
      onSave={()=>{setVista("lista");setEditItem(null);load();}}
      onCancel={()=>{setVista("lista");setEditItem(null);}}/>
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18 }}>
        {[
          { l:"Total gastos",   v:`Q ${fmt(rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0))}`, c:T.red  },
          { l:"Pendientes",     v:rows.filter(r=>r.estado==="pendiente").length,                 c:T.mut  },
          { l:"En revision",    v:rows.filter(r=>r.estado==="en_revision").length,               c:T.blue },
          { l:"Aprobados",      v:rows.filter(r=>r.estado==="aprobado").length,                  c:T.acc  },
          { l:"Contabilizados", v:rows.filter(r=>r.contabilizado).length,                        c:T.green},
        ].map((s,i)=>(
          <div key={i} style={{ background:T.surf,borderRadius:10,padding:14,textAlign:"center" }}>
            <div style={{ fontSize:i===0?14:20,fontWeight:800,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10,color:T.sub,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtros y acciones */}
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
        {/* Estados */}
        {["todos",...Object.keys(ESTADOS)].map(est=>(
          <button key={est} onClick={()=>setFiltroEst(est)} style={{...S.btn(filtroEst===est?"primary":"ghost"),fontSize:11,padding:"4px 10px"}}>
            {est==="todos"?"Todos":(ESTADOS[est]?.l||est)}
          </button>
        ))}
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center" }}>
        {/* Sub-filtros */}
        <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)}>
          <option value="todas">Todas las categorias</option>
          {CAT_GASTO.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        {empleados.length>0&&(
          <select style={{...S.sel,width:"auto",fontSize:11,padding:"5px 10px"}} value={filtroEmp} onChange={e=>setFiltroEmp(e.target.value)}>
            <option value="">Todos los empleados</option>
            {empleados.map(e=><option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
        )}
        <input type="month" style={{...S.inp,width:150,fontSize:11,padding:"5px 10px"}} value={filtroPer} onChange={e=>setFiltroPer(e.target.value)}/>

        <div style={{ marginLeft:"auto",display:"flex",gap:6 }}>
          <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>Actualizar</button>
          <button onClick={()=>exportarPDF(filtered,`Estado: ${filtroEst} · Cat: ${filtroCat}`)} style={{...S.btn("blue"),fontSize:11}}>PDF</button>
          <button onClick={()=>exportarExcel(filtered)} style={{...S.btn("green"),fontSize:11}}>Excel</button>
          <button onClick={()=>setVista("reporte")} style={{...S.btn("ghost"),fontSize:11}}>Reportes</button>
          <button onClick={()=>{setEditItem(null);setVista("form");}} style={{...S.btn("primary"),fontSize:12}}>+ Nuevo gasto</button>
        </div>
      </div>

      {/* Total filtrado */}
      {filtered.length>0&&(
        <div style={{ background:T.redDim,border:`1px solid ${T.red}44`,borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13 }}>
          <span style={{ color:T.sub }}>{filtered.length} gasto{filtered.length!==1?"s":""} filtrado{filtered.length!==1?"s":""}</span>
          <span style={{ fontWeight:800,color:T.red }}>Total: Q {fmt(totalFil)}</span>
        </div>
      )}

      {/* Lista */}
      {loading?<Spinner/>:filtered.length===0?<Empty icon="G" msg="Sin gastos registrados" action="+ Registrar gasto" onAction={()=>setVista("form")}/>:(
        <div style={S.card}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr>{["Fecha","Descripcion","Categoria","Empleado","Vehiculo","Proveedor","Total","Estado",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r=>{
                const e = ESTADOS[r.estado]||ESTADOS.pendiente;
                const c = CC[r.categoria]||T.mut;
                return(
                  <tr key={r.id} onClick={()=>setPanelItem(r)} style={{ cursor:"pointer" }}
                    onMouseEnter={el=>el.currentTarget.style.background=T.surf}
                    onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                    <td style={{...S.td,fontSize:11,color:T.sub,whiteSpace:"nowrap"}}>{fmtD(r.fecha)}</td>
                    <td style={{...S.td,maxWidth:160}}>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:155,fontWeight:500 }}>{r.descripcion}</div>
                      {r.numero_factura&&<div style={{ fontSize:9,color:T.mut,fontFamily:"monospace" }}>FAC: {r.numero_factura}</div>}
                    </td>
                    <td style={S.td}>
                      <span style={{ padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:600,background:c+"22",color:c }}>{r.categoria}</span>
                    </td>
                    <td style={{...S.td,fontSize:11,color:T.sub}}>{r.empleado_nombre||"—"}</td>
                    <td style={{...S.td,fontSize:11,color:T.sub}}>{r.vehiculo_nombre?r.vehiculo_nombre.split("(")[0].trim():"—"}</td>
                    <td style={{...S.td,fontSize:11,color:T.sub}}>{r.proveedor||"—"}</td>
                    <td style={{...S.td,fontWeight:700,color:T.red,whiteSpace:"nowrap"}}>Q {fmt(r.total)}</td>
                    <td style={S.td}>
                      <span style={{ padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:e.bg,color:e.c }}>{e.l}</span>
                      {r.archivo_url&&<div style={{ fontSize:9,color:T.blue,marginTop:2 }}>Doc adjunto</div>}
                    </td>
                    <td style={S.td} onClick={ev=>ev.stopPropagation()}>
                      <div style={{ display:"flex",gap:4 }}>
                        <button onClick={()=>{setEditItem(r);setVista("form");}} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>Editar</button>
                        <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:T.surf }}>
                <td colSpan={6} style={{ padding:"9px 10px",fontSize:12,fontWeight:700,color:T.sub }}>TOTAL FILTRADO</td>
                <td style={{ padding:"9px 10px",fontWeight:800,color:T.red,fontSize:14 }}>Q {fmt(totalFil)}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Panel de detalle/aprobacion */}
      {panelItem&&(
        <GastoPanel gasto={panelItem} userName={userName}
          onClose={()=>setPanelItem(null)}
          onAprobar={cambiarEstado}
          onRechazar={rechazar}
          onContabilizar={contabilizar}
          empId={empId}/>
      )}

      {/* Vista de reportes */}
      {vista==="reporte"&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300 }} onClick={()=>setVista("lista")}>
          <div style={{ position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",width:"min(720px,95vw)",background:T.card,borderRadius:16,border:`1px solid ${T.bord}`,maxHeight:"80vh",overflowY:"auto" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"16px 20px",borderBottom:`1px solid ${T.bord}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ fontSize:15,fontWeight:700,color:T.acc }}>Reporte de Gastos</div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>exportarPDF(rows,"Reporte completo")} style={{...S.btn("blue"),fontSize:11}}>Exportar PDF</button>
                <button onClick={()=>exportarExcel(rows)} style={{...S.btn("green"),fontSize:11}}>Exportar Excel</button>
                <button onClick={()=>setVista("lista")} style={{...S.btn("ghost"),fontSize:11}}>Cerrar</button>
              </div>
            </div>
            <div style={{ padding:"16px 20px" }}>
              {/* Por empleado */}
              {statsEmp.length>0&&(
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.mut,marginBottom:10 }}>GASTOS POR EMPLEADO</div>
                  {statsEmp.map(({emp,total})=>{
                    const pct=rows.reduce((s,r)=>s+(parseFloat(r.total)||0),0);
                    return(
                      <div key={emp} style={{ marginBottom:8 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}>
                          <span style={{ color:T.sub }}>{emp}</span>
                          <span style={{ fontWeight:600,color:T.red }}>Q {fmt(total)}</span>
                        </div>
                        <div style={{ background:T.surf,borderRadius:4,height:6,overflow:"hidden" }}>
                          <div style={{ height:"100%",borderRadius:4,background:T.red,width:`${pct>0?Math.round((total/pct)*100):0}%` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Por estado */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
                {Object.entries(ESTADOS).map(([key,val])=>{
                  const tot = rows.filter(r=>r.estado===key).reduce((s,r)=>s+(parseFloat(r.total)||0),0);
                  const cnt = rows.filter(r=>r.estado===key).length;
                  if(!cnt)return null;
                  return(
                    <div key={key} style={{ background:val.bg,border:`1px solid ${val.c}44`,borderRadius:10,padding:"12px 14px",textAlign:"center" }}>
                      <div style={{ fontSize:16,fontWeight:800,color:val.c }}>Q {fmt(tot)}</div>
                      <div style={{ fontSize:10,color:T.sub,marginTop:2 }}>{val.l} ({cnt})</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Módulo de Proveedores (compacto) ─────────────────────────────────────────
function ModProveedores({ empId, showToast }) {
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);const [editItem,setEditItem]=useState(null);const [saving,setSaving]=useState(false);
  const EFP={nombre:"",nit:"",categoria:"combustible",contacto:"",telefono:"",email:"",direccion:"",credito_limite:"",notas:""};
  const [f,setF]=useState({...EFP}); const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const load=async()=>{setLoading(true);const d=await dbGet("proveedores");setRows(Array.isArray(d)?d:[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const guardar=async()=>{if(!f.nombre.trim()){showToast("Nombre requerido","err");return;}setSaving(true);const p={empresa_id:empId,...f,credito_limite:parseFloat(f.credito_limite)||0,activo:true};if(editItem?.id)await dbUpd("proveedores",editItem.id,p);else await dbIns("proveedores",p);showToast("Guardado");setSaving(false);setShowForm(false);setEditItem(null);setF({...EFP});load();};
  const del=async id=>{if(!confirm("Eliminar?"))return;await dbDel("proveedores",id);showToast("Eliminado");load();};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14,gap:8}}>
        <button onClick={load} style={{...S.btn("ghost"),fontSize:11}}>Actualizar</button>
        <button onClick={()=>{setEditItem(null);setF({...EFP});setShowForm(!showForm);}} style={{...S.btn(showForm?"warn":"primary"),fontSize:12}}>{showForm?"Cancelar":"+ Nuevo proveedor"}</button>
      </div>
      {showForm&&<div style={{...S.card,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <Fld label="NOMBRE" span2><input style={S.inp} value={f.nombre} onChange={e=>sf("nombre",e.target.value)} placeholder="Razon social"/></Fld>
          <Fld label="NIT"><input style={S.inp} value={f.nit} onChange={e=>sf("nit",e.target.value)} placeholder="1234567-8"/></Fld>
          <Fld label="CATEGORIA"><select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>{CAT_GASTO.map(c=><option key={c} value={c}>{c}</option>)}</select></Fld>
          <Fld label="CONTACTO"><input style={S.inp} value={f.contacto} onChange={e=>sf("contacto",e.target.value)}/></Fld>
          <Fld label="TELEFONO"><input style={S.inp} value={f.telefono} onChange={e=>sf("telefono",e.target.value)}/></Fld>
          <Fld label="EMAIL"><input style={S.inp} value={f.email} onChange={e=>sf("email",e.target.value)}/></Fld>
          <Fld label="CREDITO LIMITE"><input style={S.inp} type="number" value={f.credito_limite} onChange={e=>sf("credito_limite",e.target.value)}/></Fld>
          <Fld label="DIRECCION" span2><input style={S.inp} value={f.direccion} onChange={e=>sf("direccion",e.target.value)}/></Fld>
          <div style={{gridColumn:"span 2",display:"flex",gap:8}}>
            <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>{saving?"...":"Guardar"}</button>
            <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
          </div>
        </div>
      </div>}
      {loading?<Spinner/>:rows.length===0?<Empty icon="P" msg="Sin proveedores"/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {rows.map(p=>(
            <div key={p.id} style={{...S.card,borderTop:`3px solid ${CC[p.categoria]||T.mut}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><div style={{fontSize:14,fontWeight:700}}>{p.nombre}</div><div style={{fontSize:10,color:T.sub}}>NIT: {p.nit||"—"}</div></div>
                <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(CC[p.categoria]||T.mut)+"22",color:CC[p.categoria]||T.mut}}>{p.categoria}</span>
              </div>
              {p.telefono&&<div style={{fontSize:11,color:T.sub,marginBottom:4}}>{p.telefono}</div>}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <button onClick={()=>{setEditItem(p);setF({nombre:p.nombre,nit:p.nit||"",categoria:p.categoria||"otros",contacto:p.contacto||"",telefono:p.telefono||"",email:p.email||"",direccion:p.direccion||"",credito_limite:p.credito_limite||"",notas:p.notas||""});setShowForm(true);}} style={{...S.btn("ghost"),fontSize:11,padding:"4px 10px"}}>Editar</button>
                <button onClick={()=>del(p.id)} style={{...S.btn("danger"),fontSize:11,padding:"4px 10px"}}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PageGastos({ showToast, empId }) {
  const [tab, setTab] = useState("gastos");
  const [vehiculos,  setVehiculos]  = useState([]);
  const [reservas,   setReservas]   = useState([]);
  const [proveedores,setProveedores]= useState([]);
  const [empleados,  setEmpleados]  = useState([]);

  useEffect(()=>{
    Promise.all([
      dbGet("vehiculos","&select=id,marca,modelo,placa"),
      dbGet("reservas","&estado=in.(confirmada,en_curso)&select=id,numero,cliente_nombre"),
      dbGet("proveedores","&select=id,nombre"),
      dbGet("empleados","&select=id,nombre").catch(()=>[]),
    ]).then(([v,r,p,e])=>{
      setVehiculos(Array.isArray(v)?v:[]);
      setReservas(Array.isArray(r)?r:[]);
      setProveedores(Array.isArray(p)?p:[]);
      setEmpleados(Array.isArray(e)?e:[]);
    });
  },[]);

  return (
    <div>
      <div style={{ display:"flex",gap:0,borderBottom:`1px solid ${T.bord}`,marginBottom:16 }}>
        {[["gastos","Gastos y Compras"],["proveedores","Proveedores"]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"10px 16px",background:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===id?T.acc:T.sub,borderBottom:tab===id?`2px solid ${T.acc}`:"2px solid transparent" }}>{l}</button>
        ))}
      </div>
      {tab==="gastos"&&<ModGastos empId={empId} showToast={showToast} vehiculos={vehiculos} reservas={reservas} empleados={empleados} proveedores={proveedores}/>}
      {tab==="proveedores"&&<ModProveedores empId={empId} showToast={showToast}/>}
    </div>
  );
}