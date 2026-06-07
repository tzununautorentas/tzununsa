import React, { useState, useEffect } from 'react';
import { T, S, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today } from '../config.js';
import { Spinner, Empty, Fld, Badge, ModalExportar, Paginador, Buscador } from '../components/shared.jsx';
import { usePaginacion } from '../hooks/usePaginacion.js';

const METODOS = ["efectivo","transferencia","deposito","tarjeta","cheque"];
const MC = { efectivo:T.acc, transferencia:T.blue, deposito:T.green, tarjeta:T.purple, cheque:T.sec };

const EF = {
  fecha:today(), cliente_nombre:"", monto:"", metodo:"efectivo",
  referencia:"", concepto:"", reserva_id:"", factura_id:"",
  cotizacion_id:"", cuenta_bancaria_id:"", notas:"",
};

export default function PagePagos({ showToast, empId }) {
  const [reservas, setReservas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [cots,     setCots]     = useState([]);
  const [cuentas,  setCuentas]  = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [exportar, setExportar] = useState(false);
  const [filtroM,  setFiltroM]  = useState("todos");
  const [busqueda, setBusqueda] = useState('');
  const [f, setF] = useState({...EF});
  const sf = (k,v) => setF(p=>({...p,[k]:v}));

  const query = filtroM && filtroM !== 'todos' ? 'metodo=eq.'+filtroM : '';

  const pag = usePaginacion({
    table: 'pagos_recibidos',
    query,
    search: busqueda,
    columns: ['numero', 'cliente_nombre', 'concepto', 'referencia', 'notas'],
    order: 'fecha.desc',
  });

  useEffect(() => {
    (async () => {
      const [r,fa,co,cu] = await Promise.all([
        dbGet("reservas","&estado=in.(confirmada,en_curso,completada)&select=id,numero,cliente_nombre,monto"),
        dbGet("facturas","&estado=not.in.(anulada,borrador)&select=id,numero,nombre_receptor,total,saldo_pendiente"),
        dbGet("cotizaciones","&estado=in.(aprobada,orden_venta)&select=id,numero,cliente_nombre,total_gtq"),
        dbGet("cuentas_bancarias"),
      ]);
      setReservas(Array.isArray(r)?r:[]);
      setFacturas(Array.isArray(fa)?fa:[]);
      setCots(Array.isArray(co)?co:[]);
      setCuentas(Array.isArray(cu)?cu:[]);
    })();
  }, []);

  // Auto-seleccionar Banrural cuando el método es tarjeta
  const onMetodo = (v) => {
    sf("metodo", v);
    if (v === "tarjeta") {
      const banrural = cuentas.find(c => (c.banco||"").toLowerCase().includes("banrural"));
      if (banrural) sf("cuenta_bancaria_id", banrural.id);
    }
  };

  // Auto-llenar desde reserva
  const onReserva = (id) => {
    sf("reserva_id", id);
    const r = reservas.find(x=>x.id===id);
    if (r) { sf("cliente_nombre", r.cliente_nombre||""); sf("concepto","Pago reserva "+r.numero); sf("monto", r.monto||""); }
  };
  // Auto-llenar desde factura
  const onFactura = (id) => {
    sf("factura_id", id);
    const fa = facturas.find(x=>x.id===id);
    if (fa) { sf("cliente_nombre", fa.nombre_receptor||""); sf("concepto","Pago factura "+fa.numero); sf("monto", fa.saldo_pendiente||fa.total||""); }
  };
  // Auto-llenar desde cotización
  const onCot = (id) => {
    sf("cotizacion_id", id);
    const co = cots.find(x=>x.id===id);
    if (co) { sf("cliente_nombre", co.cliente_nombre||""); sf("concepto","Anticipo cotizacion "+co.numero); sf("monto",""); }
  };

  const guardar = async () => {
    if (!f.cliente_nombre.trim() || !(parseFloat(f.monto)>0)) {
      showToast("Cliente y monto son requeridos","err"); return;
    }
    if (!f.cuenta_bancaria_id) {
      showToast("Selecciona la cuenta bancaria que recibe el pago","err"); return;
    }
    setSaving(true);
    const monto = parseFloat(f.monto);
    const payload = {
      empresa_id:empId, fecha:f.fecha, cliente_nombre:f.cliente_nombre,
      monto, metodo:f.metodo, referencia:f.referencia||"",
      concepto:f.concepto||"", reserva_id:f.reserva_id||null,
      factura_id:f.factura_id||null, cotizacion_id:f.cotizacion_id||null,
      cuenta_bancaria_id:f.cuenta_bancaria_id||null, notas:f.notas||"",
    };
    let result;
    if (editId) result = await dbUpd("pagos_recibidos", editId, payload);
    else        result = await dbIns("pagos_recibidos", payload);
    if (result?.error) { showToast("Error: "+result.error,"err"); setSaving(false); return; }

    if (!editId) {
      // Crear movimiento bancario automático
      const cuenta = cuentas.find(c=>c.id===f.cuenta_bancaria_id);
      if (cuenta) {
        await dbIns("movimientos_bancarios",{
          empresa_id:empId, cuenta_id:f.cuenta_bancaria_id,
          fecha:f.fecha, tipo:"ingreso",
          descripcion:(f.concepto||"Pago de "+f.cliente_nombre),
          monto, referencia:f.referencia||"", categoria:"ventas",
          conciliado:false,
        });
        const nuevoSaldo = (parseFloat(cuenta.saldo_actual)||0) + monto;
        await dbUpd("cuentas_bancarias", cuenta.id, {saldo_actual:nuevoSaldo});
      }
      // Actualizar saldo de factura vinculada
      if (f.factura_id) {
        const fac = facturas.find(x=>x.id===f.factura_id);
        if (fac) {
          const ns = Math.max(0,(parseFloat(fac.saldo_pendiente)||parseFloat(fac.total)||0)-monto);
          await dbUpd("facturas",f.factura_id,{saldo_pendiente:ns, estado:ns<=0?"pagada":"parcial"});
        }
      }
    }
    showToast(editId?"Pago actualizado":"Pago registrado — movimiento creado en Banca");
    setSaving(false); setShowForm(false); setEditId(null); setF({...EF}); pag.reload();
  };

  const abrirEditar = r => {
    setEditId(r.id);
    setF({fecha:r.fecha||today(),cliente_nombre:r.cliente_nombre||"",monto:r.monto||"",metodo:r.metodo||"efectivo",referencia:r.referencia||"",concepto:r.concepto||"",reserva_id:r.reserva_id||"",factura_id:r.factura_id||"",cotizacion_id:r.cotizacion_id||"",cuenta_bancaria_id:r.cuenta_bancaria_id||"",notas:r.notas||""});
    setShowForm(true);
  };
  const del = async id => {
    if(!confirm("Eliminar este pago?"))return;
    await dbDel("pagos_recibidos",id); showToast("Eliminado"); pag.reload();
  };

  const totalGral = pag.data.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const totalMes  = pag.data.filter(r=>(r.fecha||"").slice(0,7)===today().slice(0,7)).reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
  const porM = METODOS.map(m=>({m,t:pag.data.filter(r=>r.metodo===m).reduce((s,r)=>s+(parseFloat(r.monto)||0),0)})).filter(x=>x.t>0);

  return (
    <div>
      {exportar&&<ModalExportar titulo="Pagos Recibidos" datos={pag.data}
        campos={[{label:"Fecha",key:"fecha"},{label:"Cliente",key:"cliente_nombre"},{label:"Concepto",key:"concepto"},{label:"Monto",key:"monto"},{label:"Metodo",key:"metodo"},{label:"Referencia",key:"referencia"}]}
        onClose={()=>setExportar(false)}/>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:12,marginBottom:18}}>
        {[
          {l:"Total recibido",v:`Q ${fmt(totalGral)}`,c:T.acc,bg:T.accDim},
          {l:"Este mes",      v:`Q ${fmt(totalMes)}`, c:T.blue,bg:T.blueDim},
          {l:"Registros",    v:pag.total,           c:T.purple,bg:T.purpleDim},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.c}44`,borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:11,color:T.mut}}>{s.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:16}}>
        <div>
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["todos",...METODOS].map(m=>(
              <button key={m} onClick={()=>setFiltroM(m)} style={{...S.btn(filtroM===m?"primary":"ghost"),fontSize:11,padding:"5px 10px"}}>
                {m==="todos"?"Todos":m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
            <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar pago..." />
            <button onClick={pag.reload} style={{...S.btn("ghost"),fontSize:11}}>Actualizar</button>
            <button onClick={()=>setExportar(true)} style={{...S.btn("ghost"),fontSize:11}}>Exportar</button>
            <button onClick={()=>{if(showForm&&!editId){setShowForm(false);}else{setEditId(null);setF({...EF});setShowForm(true);}}}
              style={{...S.btn(showForm&&!editId?"warn":"primary"),fontSize:12,marginLeft:"auto"}}>
              {showForm&&!editId?"Cancelar":"+ Registrar pago"}
            </button>
          </div>

          {/* Formulario */}
          {showForm&&(
            <div style={{...S.card,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:T.acc,marginBottom:14}}>{editId?"Editar pago":"Registrar pago recibido"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>

                {/* Vincular origen */}
                <div style={{gridColumn:"span 2"}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>VINCULAR A (elige uno)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <div>
                      <label style={S.lbl}>RESERVA</label>
                      <select style={S.sel} value={f.reserva_id} onChange={e=>onReserva(e.target.value)}>
                        <option value="">Sin vinculacion</option>
                        {reservas.map(r=><option key={r.id} value={r.id}>{r.numero} — {r.cliente_nombre?.slice(0,15)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.lbl}>FACTURA</label>
                      <select style={S.sel} value={f.factura_id} onChange={e=>onFactura(e.target.value)}>
                        <option value="">Sin vinculacion</option>
                        {facturas.map(fa=><option key={fa.id} value={fa.id}>{fa.numero} — Saldo Q{fmt(fa.saldo_pendiente||fa.total)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.lbl}>COTIZACION</label>
                      <select style={S.sel} value={f.cotizacion_id} onChange={e=>onCot(e.target.value)}>
                        <option value="">Sin vinculacion</option>
                        {cots.map(co=><option key={co.id} value={co.id}>{co.numero} — {co.cliente_nombre?.slice(0,15)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <Fld label="CLIENTE / QUIEN PAGA" span2>
                  <input style={S.inp} value={f.cliente_nombre} onChange={e=>sf("cliente_nombre",e.target.value)} placeholder="Nombre del cliente"/>
                </Fld>
                <Fld label="CONCEPTO / DESCRIPCION" span2>
                  <input style={S.inp} value={f.concepto} onChange={e=>sf("concepto",e.target.value)} placeholder="Ej: Anticipo reserva RES-001, saldo FAC-002..."/>
                </Fld>

                <Fld label="FECHA"><input style={S.inp} type="date" value={f.fecha} onChange={e=>sf("fecha",e.target.value)}/></Fld>
                <Fld label="MONTO RECIBIDO (GTQ)">
                  <input style={{...S.inp,fontWeight:700,color:T.acc}} type="number" step="0.01" value={f.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00"/>
                </Fld>

                <div style={{gridColumn:"span 2"}}>
                  <label style={S.lbl}>METODO DE PAGO</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {METODOS.map(m=>(
                      <button key={m} onClick={()=>onMetodo(m)} style={{...S.btn(f.metodo===m?"primary":"ghost"),fontSize:11,padding:"6px 12px"}}>
                        {m.charAt(0).toUpperCase()+m.slice(1)}
                        {m==="tarjeta"&&<span style={{fontSize:9,color:T.acc,marginLeft:4}}>(→ Banrural)</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuenta bancaria destino */}
                <Fld label="DEPOSITAR EN CUENTA BANCARIA" span2>
                  <select style={{...S.sel, border: f.cuenta_bancaria_id ? `1px solid ${T.acc}` : `1px solid ${T.red}`}} value={f.cuenta_bancaria_id} onChange={e=>sf("cuenta_bancaria_id",e.target.value)}>
                    <option value="">Seleccionar cuenta que recibe el pago...</option>
                    {cuentas.map(c=>(
                      <option key={c.id} value={c.id}>
                        {c.banco} — {c.numero_cuenta} ({c.moneda}) — Saldo: Q {fmt(c.saldo_actual)}
                      </option>
                    ))}
                  </select>
                  {f.metodo==="tarjeta"&&f.cuenta_bancaria_id&&(
                    <div style={{fontSize:11,color:T.acc,marginTop:4}}>
                      Tarjetas se depositan automaticamente en Banrural
                    </div>
                  )}
                </Fld>

                <Fld label="N. REFERENCIA / BOLETA">
                  <input style={S.inp} value={f.referencia} onChange={e=>sf("referencia",e.target.value)} placeholder="No. transferencia, boleta deposito..."/>
                </Fld>
                <Fld label="NOTAS">
                  <input style={S.inp} value={f.notas} onChange={e=>sf("notas",e.target.value)} placeholder="Observaciones..."/>
                </Fld>

                <div style={{gridColumn:"span 2",display:"flex",gap:8,marginTop:4}}>
                  <button onClick={guardar} disabled={saving} style={{...S.btn("primary"),flex:1}}>
                    {saving?"Guardando...":editId?"Actualizar pago":"Registrar pago + mover a Banca"}
                  </button>
                  <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{...S.btn("ghost"),flex:1}}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Cards */}
          {pag.loading?<Spinner/>:pag.data.length===0?(
            <Empty icon="P" msg="Sin pagos registrados" action="+ Registrar primer pago" onAction={()=>{setEditId(null);setF({...EF});setShowForm(true);}}/>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {pag.data.map(r=>{
                const cuenta = cuentas.find(c=>c.id===r.cuenta_bancaria_id);
                const c = MC[r.metodo]||T.mut;
                const vinculo = r.reserva_id?{l:"Reserva",c:T.blue}:r.factura_id?{l:"Factura",c:T.acc}:r.cotizacion_id?{l:"Cotizacion",c:T.purple}:null;
                return (
                  <div key={r.id} style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:600,color:T.txt,fontSize:14}}>
                          {r.cliente_nombre}
                          {vinculo&&<span style={{fontSize:9,color:vinculo.c,marginLeft:8,fontWeight:600}}>• {vinculo.l}</span>}
                        </div>
                        <div style={{fontSize:11,color:T.sub,marginTop:2}}>{r.concepto||"—"}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <div style={{fontSize:18,fontWeight:800,color:T.acc}}>Q {fmt(r.monto)}</div>
                        <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:c+"22",color:c}}>{r.metodo||"—"}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:11,color:T.mut}}>
                        <span>{fmtD(r.fecha)}</span>
                        {cuenta&&<span>{cuenta.banco}</span>}
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>abrirEditar(r)} style={{...S.btn("ghost"),padding:"3px 8px",fontSize:10}}>Editar</button>
                        <button onClick={()=>del(r.id)} style={{...S.btn("danger"),padding:"3px 8px",fontSize:10}}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px"}}>
                <span style={{fontSize:12,color:T.sub}}>{pag.data.length} pagos</span>
                <span style={{fontWeight:800,color:T.acc,fontSize:16}}>Q {fmt(pag.data.reduce((s,r)=>s+(parseFloat(r.monto)||0),0))}</span>
              </div>
            </div>
          )}
          {pag.data.length > 0 && (
            <Paginador page={pag.page} totalPages={pag.totalPages} total={pag.total} desde={pag.desde} hasta={pag.hasta} pageSize={pag.pageSize} onPage={pag.setPage} onPageSize={pag.setPageSize} />
          )}
        </div>

        {/* Sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:12}}>POR METODO</div>
            {porM.map(({m,t})=>{
              const c=MC[m]||T.mut;
              const pct=totalGral>0?Math.round((t/totalGral)*100):0;
              return(
                <div key={m} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:T.sub}}>{m.charAt(0).toUpperCase()+m.slice(1)}</span>
                    <span style={{fontSize:11,fontWeight:600,color:c}}>Q {fmt(t)}</span>
                  </div>
                  <div style={{background:T.surf,borderRadius:4,height:5,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:4,background:c,width:`${pct}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:10}}>CUENTAS</div>
            {cuentas.map(c=>(
              <div key={c.id} style={{marginBottom:8,padding:"8px 10px",background:T.surf,borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:600}}>{c.banco}</div>
                <div style={{fontSize:10,color:T.sub}}>{c.numero_cuenta}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.acc,marginTop:3}}>Q {fmt(c.saldo_actual)}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,color:T.mut,marginBottom:8}}>ESTE MES</div>
            <div style={{fontSize:22,fontWeight:800,color:T.acc}}>Q {fmt(totalMes)}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:4}}>{pag.data.filter(r=>(r.fecha||"").slice(0,7)===today().slice(0,7)).length} pagos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
