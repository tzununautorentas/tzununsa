import React, { useState, useEffect } from 'react';
import { T, S, fmt, dbGet, dbIns, dbUpd, dbDel, CATALOGO } from '../config.js';
import { Spinner, Fld } from '../components/shared.jsx';

const SECCIONES = [
  { id: "org",      label: "Organización",     icon: "🏢", sub: [
    { id: "empresa",    label: "Empresa" },
    { id: "perfil",     label: "Perfil" },
    { id: "marca",      label: "Personalización" },
    { id: "suscripcion",label: "Suscripción" },
  ]},
  { id: "usuarios", label: "Usuarios y Roles",  icon: "👥", sub: [
    { id: "usuarios",   label: "Usuarios" },
    { id: "roles",      label: "Roles" },
  ]},
  { id: "fiscal",   label: "Impuestos",         icon: "💰", sub: [
    { id: "impuestos",  label: "Impuestos" },
  ]},
  { id: "config",   label: "Configuración",     icon: "⚙️", sub: [
    { id: "general",    label: "General" },
    { id: "monedas",    label: "Monedas" },
    { id: "terminos",   label: "Términos de pago" },
    { id: "recordatorios", label: "Recordatorios" },
  ]},
  { id: "portal",   label: "Portal del Cliente",icon: "🌐", sub: [
    { id: "portal",     label: "Personalización" },
  ]},
  { id: "series",   label: "Series",            icon: "🔢", sub: [
    { id: "series",     label: "Series de números" },
  ]},
  { id: "pdf",      label: "Plantillas PDF",    icon: "📄", sub: [
    { id: "pdf",        label: "Plantillas PDF" },
  ]},
  { id: "notif",    label: "Notificaciones",    icon: "🔔", sub: [
    { id: "notif",      label: "Correo electrónico" },
  ]},
];

const ORDEN_PROP = { propio: 0, socio: 1, alquilado: 2 };

function PanelEmpresa({ emp, setEmp, guardarEmp, saving }) {
  const se = (k, v) => setEmp(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Datos de la Empresa</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Fld label="NOMBRE"><input style={S.inp} value={emp.nombre || ""} onChange={e => se("nombre", e.target.value)} placeholder="Tz'unun AutoRentas" /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <Fld label="NIT"><input style={S.inp} value={emp.nit || ""} onChange={e => se("nit", e.target.value)} placeholder="16693949" /></Fld>
            <Fld label="TELÉFONO"><input style={S.inp} value={emp.telefono || ""} onChange={e => se("telefono", e.target.value)} placeholder="502-31221538" /></Fld>
          </div>
          <Fld label="EMAIL"><input style={S.inp} value={emp.email || ""} onChange={e => se("email", e.target.value)} placeholder="tzununautorentas@gmail.com" /></Fld>
          <Fld label="DIRECCIÓN"><input style={S.inp} value={emp.direccion || ""} onChange={e => se("direccion", e.target.value)} placeholder="2da. Avenida 0-68, Col. Bran, Zona 3" /></Fld>
          <Fld label="ESLOGAN"><input style={S.inp} value={emp.eslogan || ""} onChange={e => se("eslogan", e.target.value)} placeholder="MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS" /></Fld>
          <button onClick={guardarEmp} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 12 }}>Vista previa</div>
          <div style={{ background: T.surf, borderRadius: 10, padding: 16, border: `1px solid ${T.bord}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: T.accDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: T.acc }}>T</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.acc }}>{emp.nombre || "Tz'unun AutoRentas"}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{emp.eslogan || "MAS COMODIDAD, RAPIDEZ Y MEJORES PRECIOS"}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.8 }}>
              <div>{emp.direccion || "2da. Av. 0-68, Col. Bran, Zona 3"}</div>
              <div>{emp.telefono || "502-31221538"}</div>
              <div>{emp.email || "tzununautorentas@gmail.com"}</div>
              <div>NIT: {emp.nit || "16693949"}</div>
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 12 }}>Cuentas bancarias</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Fld label="BANCO 1"><input style={S.inp} value={emp.banco1 || ""} onChange={e => se("banco1", e.target.value)} placeholder="Banco Industrial - 853-000016-8" /></Fld>
            <Fld label="BANCO 2"><input style={S.inp} value={emp.banco2 || ""} onChange={e => se("banco2", e.target.value)} placeholder="Banrural - 3309159475" /></Fld>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelPerfil({ emp, setEmp, guardarEmp, saving }) {
  const se = (k, v) => setEmp(p => ({ ...p, [k]: v }));
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Información de contacto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Fld label="PERSONA DE CONTACTO"><input style={S.inp} value={emp.contacto || ""} onChange={e => se("contacto", e.target.value)} placeholder="Oscar Gálvez" /></Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <Fld label="TEL. CONTACTO"><input style={S.inp} value={emp.tel_contacto || ""} onChange={e => se("tel_contacto", e.target.value)} placeholder="502-31221538" /></Fld>
            <Fld label="EMAIL CONTACTO"><input style={S.inp} value={emp.email_contacto || ""} onChange={e => se("email_contacto", e.target.value)} placeholder="oscar@tzununsa.com" /></Fld>
          </div>
          <Fld label="SITIO WEB"><input style={S.inp} value={emp.web || ""} onChange={e => se("web", e.target.value)} placeholder="https://tzununsa.com" /></Fld>
          <button onClick={guardarEmp} disabled={saving} style={{ ...S.btn("primary"), width: "100%" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelMarca({ theme, setTheme, showToast }) {
  const colores = [
    { key: "acc", label: "Color principal", desc: "Botones, enlaces, acentos" },
    { key: "sec", label: "Color secundario", desc: "Etiquetas, destacados" },
    { key: "red", label: "Rojo", desc: "Peligro, cancelación" },
    { key: "blue", label: "Azul", desc: "Información, acción" },
    { key: "green", label: "Verde", desc: "Éxito, completado" },
    { key: "purple", label: "Púrpura", desc: "Especial" },
  ];
  const paletas = [
    { l: "Pastel (actual)", c: { acc: "#5EEAD4", sec: "#FCD34D", red: "#FCA5A5", blue: "#93C5FD", green: "#86EFAC", purple: "#C4B5FD" } },
    { l: "Oceano", c: { acc: "#00D4AA", sec: "#F59E0B", red: "#EF4444", blue: "#3B82F6", green: "#22C55E", purple: "#8B5CF6" } },
    { l: "Bosque", c: { acc: "#34D399", sec: "#FBBF24", red: "#F87171", blue: "#60A5FA", green: "#4ADE80", purple: "#A78BFA" } },
    { l: "Atardecer", c: { acc: "#F472B6", sec: "#FB923C", red: "#FB7185", blue: "#67E8F9", green: "#86EFAC", purple: "#C084FC" } },
  ];
  const [activePal, setActivePal] = useState(null);
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Paletas predefinidas</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {paletas.map((p, i) => (
            <button key={i} onClick={() => { setActivePal(i); Object.entries(p.c).forEach(([k, v]) => setTheme(k, v)); }}
              style={{
                padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600,
                background: activePal === i ? T.accDim : T.surf,
                border: `1px solid ${activePal === i ? T.acc : T.bord}`, color: activePal === i ? T.acc : T.sub,
              }}>
              {p.l}
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Colores personalizados</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {colores.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={theme[c.key] || "#5EEAD4"}
                onChange={e => setTheme(c.key, e.target.value)}
                style={{ width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer", background: "transparent" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.txt }}>{c.label}</div>
                <div style={{ fontSize: 10, color: T.mut }}>{c.desc}</div>
              </div>
              <input style={{ ...S.inp, width: 90, fontSize: 11, fontFamily: "monospace" }}
                value={theme[c.key] || ""}
                onChange={e => setTheme(c.key, e.target.value)}
                placeholder="#HEX" />
            </div>
          ))}
        </div>
        <button onClick={() => showToast("Colores guardados en el tema")} style={{ ...S.btn("primary"), marginTop: 16, width: "100%" }}>
          Aplicar colores
        </button>
      </div>
    </div>
  );
}

function PanelSuscripcion({ empId }) {
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Suscripción</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>
          Plan actual: <strong style={{ color: T.green }}>Gratuito</strong>
        </div>
        <div style={{ background: T.surf, borderRadius: 10, padding: 16, border: `1px solid ${T.bord}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: T.sub }}>Empresas</span>
            <span style={{ fontWeight: 600 }}>1 / 1</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: T.sub }}>Usuarios</span>
            <span style={{ fontWeight: 600 }}>Ilimitado</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: T.sub }}>Almacenamiento</span>
            <span style={{ fontWeight: 600 }}>Ilimitado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelUsuarios({ showToast, empId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const cargar = () => {
    setCargando(true);
    dbGet("usuarios_sistema", `&select=*,rol:rol_id(*)&empresa_id=eq.${empId}`).then(d => {
      setUsuarios(Array.isArray(d) ? d : []);
      setCargando(false);
    });
  };
  useEffect(() => { if (empId) cargar(); }, [empId]);
  if (cargando) return <Spinner />;
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Usuarios del sistema ({usuarios.length})</div>
      </div>
      <div style={S.card}>
        {usuarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: T.mut, fontSize: 13 }}>
            No hay usuarios registrados en esta empresa.
            <div style={{ marginTop: 8, fontSize: 11 }}>Los usuarios se vinculan desde Supabase Auth con la tabla usuarios_sistema.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {usuarios.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.surf, borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{u.nombre}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{u.email} · {u.rol?.nombre || "—"}</div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: u.activo ? T.greenDim : T.redDim, color: u.activo ? T.green : T.red }}>
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelRoles({ showToast }) {
  const [roles, setRoles] = useState([]);
  useEffect(() => { dbGet("roles", "&order=id.asc").then(d => setRoles(Array.isArray(d) ? d : [])); }, []);
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Roles y permisos</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {roles.length === 0 ? (
          <div style={S.card}>
            <div style={{ textAlign: "center", padding: 24, color: T.mut, fontSize: 13 }}>No hay roles configurados.</div>
          </div>
        ) : roles.map(r => (
          <div key={r.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>{r.nombre === "super_admin" ? "🔒 Super Admin" : r.nombre === "admin" ? "👤 Admin" : "👤 Usuario"}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{r.descripcion}</div>
              </div>
              {r.nombre === "super_admin" && <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: T.accDim, color: T.acc }}>Acceso total</span>}
            </div>
            {r.permisos && typeof r.permisos === 'object' && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(r.permisos).map(([k, v]) => (
                  <span key={k} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: v ? T.greenDim : T.redDim, color: v ? T.green : T.red }}>
                    {k} · {v ? "✓" : "✗"}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelImpuestos({ empId, showToast }) {
  const [iva, setIva] = useState(5);
  const [exch, setExch] = useState(7.70);
  useEffect(() => {
    dbGet("empresas", `&select=id&id=eq.${empId}`).then(d => {
      if (d?.[0]) {
        if (d[0].tasa_iva) setIva(d[0].tasa_iva);
        if (d[0].tasa_cambio) setExch(d[0].tasa_cambio);
      }
    });
  }, [empId]);
  const guardar = async () => {
    await dbUpd("empresas", empId, { tasa_iva: iva, tasa_cambio: exch });
    showToast("Configuración fiscal guardada");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 640 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Tasa de Cambio</div>
        <label style={S.lbl}>GTQ por 1 USD</label>
        <input style={{ ...S.inp, fontSize: 20, fontWeight: 700, color: T.acc }}
          type="number" step="0.01" value={exch} onChange={e => setExch(parseFloat(e.target.value) || 7.70)} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "10px 14px", background: T.surf, borderRadius: 9, fontSize: 14 }}>
          <span style={{ color: T.sub }}>1 USD =</span>
          <span style={{ fontWeight: 800, color: T.acc }}>Q {fmt(exch)}</span>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Régimen Fiscal (IVA)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { v: 12, l: "12% - Régimen General" },
            { v: 5, l: "5% - Pequeño Contribuyente" },
            { v: 0, l: "Sin IVA" },
          ].map(o => (
            <button key={o.v} onClick={() => setIva(o.v)}
              style={{ ...S.btn(iva === o.v ? "primary" : "ghost"), textAlign: "left", justifyContent: "flex-start" }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ gridColumn: "span 2" }}>
        <button onClick={guardar} style={{ ...S.btn("primary"), width: "100%" }}>Guardar configuración fiscal</button>
      </div>
    </div>
  );
}

function PanelGeneral({ empId, showToast }) {
  const [moneda, setMoneda] = useState("GTQ");
  const [pagoDef, setPagoDef] = useState("efectivo");
  useEffect(() => {
    dbGet("empresas", `&select=id&id=eq.${empId}`).then(d => {
      if (d?.[0]) {
        if (d[0].moneda_def) setMoneda(d[0].moneda_def);
        if (d[0].pago_def) setPagoDef(d[0].pago_def);
      }
    });
  }, [empId]);
  const guardar = async () => {
    await dbUpd("empresas", empId, { moneda_def: moneda, pago_def: pagoDef });
    showToast("Configuración general guardada");
  };
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Configuración general</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Fld label="MONEDA PREDETERMINADA">
            <select style={S.sel} value={moneda} onChange={e => setMoneda(e.target.value)}>
              <option value="GTQ">GTQ — Quetzal Guatemalteco</option>
              <option value="USD">USD — Dólar Americano</option>
            </select>
          </Fld>
          <Fld label="MÉTODO DE PAGO PREDETERMINADO">
            <select style={S.sel} value={pagoDef} onChange={e => setPagoDef(e.target.value)}>
              <option value="efectivo">Efectivo / Transferencia</option>
              <option value="tarjeta">Tarjeta Crédito/Débito</option>
              <option value="mixto">Mixto</option>
            </select>
          </Fld>
          <button onClick={guardar} style={{ ...S.btn("primary"), width: "100%" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function PanelMonedas() {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Monedas soportadas</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Código", "Nombre", "Símbolo", "Tasa (a GTQ)"].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {[
            { c: "GTQ", n: "Quetzal Guatemalteco", s: "Q", t: "1.00" },
            { c: "USD", n: "Dólar Americano", s: "$", t: "7.70" },
          ].map(m => (
            <tr key={m.c}>
              <td style={{ ...S.td, fontWeight: 700, color: T.acc }}>{m.c}</td>
              <td style={S.td}>{m.n}</td>
              <td style={S.td}>{m.s}</td>
              <td style={S.td}>{m.t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelTerminos({ empId, showToast }) {
  const [seleccion, setSeleccion] = useState("50% anticipo");
  useEffect(() => {
    dbGet("empresas", `&select=termino_pago_def&id=eq.${empId}`).then(d => {
      if (d?.[0]?.termino_pago_def) setSeleccion(d[0].termino_pago_def);
    });
  }, [empId]);
  const guardar = async (v) => {
    setSeleccion(v);
    await dbUpd("empresas", empId, { termino_pago_def: v });
    showToast("Término de pago actualizado: " + v);
  };
  const OPCIONES = ["Contado", "7 días", "15 días", "30 días", "50% anticipo", "75% anticipo"];
  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Términos de pago</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>Seleccioná el plazo por defecto para cotizaciones y facturas.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {OPCIONES.map(t => (
          <button key={t} onClick={() => guardar(t)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: seleccion === t ? T.accDim : T.surf,
              border: `1px solid ${seleccion === t ? T.acc : T.bord}`,
              color: seleccion === t ? T.acc : T.sub,
            }}>
            {t} {seleccion === t ? "✓" : ""}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: T.mut }}>Predeterminado: <strong>{seleccion}</strong></div>
    </div>
  );
}

function PanelRecordatorios() {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Recordatorios automáticos</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>Configura los recordatorios para eventos importantes.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { l: "Recordar vencimiento de seguro", v: "30 días antes" },
          { l: "Recordar mantenimiento por km", v: "Al alcanzar límite" },
          { l: "Recordar saldos pendientes", v: "Al vencerse" },
          { l: "Recordar cotizaciones sin respuesta", v: "3 días después" },
        ].map(r => (
          <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.surf, borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: T.txt }}>{r.l}</span>
            <span style={{ fontSize: 11, color: T.acc }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelPortal() {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Portal del Cliente</div>
      <div style={{ fontSize: 12, color: T.sub }}>
        Portal del cliente disponible próximamente. Los clientes podrán ver sus cotizaciones, reservas y facturas en línea.
      </div>
    </div>
  );
}

function PanelSeries({ empId, showToast }) {
  const [series, setSeries] = useState({ cotizaciones: "", reservas: "", facturas: "" });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!empId) return;
    dbGet("empresas", `&select=ultima_cotizacion,ultima_reserva,ultima_factura&id=eq.${empId}`).then(d => {
      if (d?.[0]) setSeries({
        cotizaciones: d[0].ultima_cotizacion || "COT-000000",
        reservas: d[0].ultima_reserva || "RES-000000",
        facturas: d[0].ultima_factura || "FEL-000000",
      });
      setLoading(false);
    });
  }, [empId]);
  const guardar = async (k, v) => {
    const campo = k === 'cotizaciones' ? 'ultima_cotizacion' : k === 'reservas' ? 'ultima_reserva' : 'ultima_factura';
    setSeries(p => ({ ...p, [k]: v }));
    await dbUpd("empresas", empId, { [campo]: v });
    showToast(`Serie ${k} actualizada`);
  };
  if (loading) return <Spinner />;
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 10 }}>Series de números de transacción</div>
        <div style={{ fontSize: 11, color: T.mut, marginBottom: 14 }}>
          Editá el último número usado. El sistema generará el siguiente automáticamente.
          <br/>Ej: si ponés <strong>COT-000050</strong>, la próxima cotización será <strong>COT-000051</strong>.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(series).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.txt, minWidth: 110, textTransform: "capitalize" }}>{k}</span>
              <input style={{ ...S.inp, fontFamily: "monospace", fontWeight: 700, flex: 1 }}
                value={v} onChange={e => setSeries(p => ({ ...p, [k]: e.target.value }))}
                placeholder={k === 'cotizaciones' ? "COT-000000" : k === 'reservas' ? "RES-000000" : "FEL-000000"} />
              <button onClick={() => guardar(k, v)} style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: 11 }}>Guardar</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: T.mut, background: T.surf, borderRadius: 8, padding: "10px 14px" }}>
          El número se incrementa automáticamente con cada cotización, reserva o factura nueva.
        </div>
      </div>
    </div>
  );
}

function PanelPDF({ emp, setEmp }) {
  const se = (k, v) => setEmp(p => ({ ...p, [k]: v }));
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 14 }}>Información para documentos PDF</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Fld label="NOMBRE DEL FIRMANTE"><input style={S.inp} value={emp.firmante || ""} onChange={e => se("firmante", e.target.value)} placeholder="Oscar Gálvez" /></Fld>
          <Fld label="TELÉFONO DEL FIRMANTE"><input style={S.inp} value={emp.tel_firmante || ""} onChange={e => se("tel_firmante", e.target.value)} placeholder="502-31221538" /></Fld>
          <Fld label="NOTA DE PIE DE PÁGINA"><input style={S.inp} value={emp.nota_pie || ""} onChange={e => se("nota_pie", e.target.value)} placeholder="Muchas gracias por su preferencia." /></Fld>
          <div style={{ background: T.surf, borderRadius: 10, padding: 12, fontSize: 11, color: T.sub, border: `1px solid ${T.bord}` }}>
            <div style={{ fontWeight: 700, color: T.acc, marginBottom: 4 }}>Ejemplo de firma en PDF:</div>
            <div>{emp.firmante || "Oscar Gálvez"}</div>
            <div>{emp.tel_firmante || "502-31221538"}</div>
            <div style={{ marginTop: 6, fontStyle: "italic" }}>"{emp.nota_pie || "Muchas gracias por su preferencia."}"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelNotif() {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Notificaciones por correo electrónico</div>
      <div style={{ fontSize: 12, color: T.sub }}>
        Configuración de correo electrónico disponible próximamente.
      </div>
    </div>
  );
}

const PANELS = {
  empresa: PanelEmpresa, perfil: PanelPerfil, marca: PanelMarca, suscripcion: PanelSuscripcion,
  usuarios: PanelUsuarios, roles: PanelRoles,
  impuestos: PanelImpuestos,
  general: PanelGeneral, monedas: PanelMonedas, terminos: PanelTerminos, recordatorios: PanelRecordatorios,
  portal: PanelPortal,
  series: PanelSeries,
  pdf: PanelPDF,
  notif: PanelNotif,
};

export default function PageConfiguracion({ showToast }) {
  const [sec, setSec] = useState("org");
  const [sub, setSub] = useState("empresa");
  const [emp, setEmp] = useState({});
  const [empId, setEmpId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState({
    acc: "#5EEAD4", sec: "#FCD34D", red: "#FCA5A5", blue: "#93C5FD", green: "#86EFAC", purple: "#C4B5FD",
  });

  useEffect(() => {
    dbGet("empresas", "&select=*&limit=1").then(d => {
      if (d && d[0]) { setEmp(d[0]); setEmpId(d[0].id); }
    });
  }, []);

  const guardarEmp = async () => {
    if (!emp.nombre?.trim()) { showToast("Nombre requerido", "err"); return; }
    setSaving(true);
    if (empId) await dbUpd("empresas", empId, {
      nombre: emp.nombre, nit: emp.nit, direccion: emp.direccion,
      telefono: emp.telefono, email: emp.email,
      eslogan: emp.eslogan, banco1: emp.banco1, banco2: emp.banco2,
      contacto: emp.contacto, tel_contacto: emp.tel_contacto,
      email_contacto: emp.email_contacto, web: emp.web,
      firmante: emp.firmante, tel_firmante: emp.tel_firmante, nota_pie: emp.nota_pie,
    });
    showToast("Guardado");
    setSaving(false);
  };

  const setTheme = (key, val) => {
    setThemeState(p => ({ ...p, [key]: val }));
    document.documentElement.style.setProperty(`--theme-${key}`, val);
  };

  const seccion = SECCIONES.find(s => s.id === sec);
  const Panel = PANELS[sub] || PanelEmpresa;
  const panelProps = { emp, setEmp, guardarEmp, saving, showToast, empId, theme, setTheme };

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 100px)" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, flexShrink: 0, background: T.surf, borderRadius: 12,
        border: `1px solid ${T.bord}`, overflow: "hidden", alignSelf: "flex-start",
      }}>
        {SECCIONES.map(s => (
          <div key={s.id}>
            {sec === s.id && (
              <div style={{ background: T.accDim, borderLeft: `3px solid ${T.acc}` }}>
                <div style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: T.acc, letterSpacing: 0.5 }}>
                  {s.icon} {s.label}
                </div>
                {s.sub.map(sb => (
                  <button key={sb.id} onClick={() => { setSec(s.id); setSub(sb.id); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "7px 14px 7px 24px",
                      background: sub === sb.id ? T.accDim : "transparent",
                      color: sub === sb.id ? T.acc : T.sub, fontSize: 12, fontWeight: sub === sb.id ? 600 : 400,
                      border: "none", cursor: "pointer",
                      borderBottom: `1px solid ${T.bord}22`,
                    }}>
                    {sb.label}
                  </button>
                ))}
              </div>
            )}
            {sec !== s.id && (
              <button onClick={() => { setSec(s.id); setSub(s.sub[0]?.id || s.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer",
                  color: T.sub, fontSize: 12, fontWeight: 500,
                  borderBottom: `1px solid ${T.bord}22`,
                }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, marginLeft: 20, overflow: "auto" }}>
        <Panel {...panelProps} />
      </div>
    </div>
  );
}
