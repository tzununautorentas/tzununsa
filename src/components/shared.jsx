import React, { useState, useEffect, useRef, Component } from "react";
import { T, S, fmt, fmtD, dbGet, dbIns } from "../config.js";

// --- Error Boundary ---
export class ErrBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ ...S.card, margin: 16 }}>
        <div style={{ color: T.red, fontWeight: 700, marginBottom: 8 }}>Error en este modulo</div>
        <div style={{ fontSize: 12, color: T.sub, fontFamily: "monospace", marginBottom: 12 }}>{String(this.state.err)}</div>
        <button onClick={() => this.setState({ err: null })} style={S.btn("primary")}>Reintentar</button>
      </div>
    );
    return this.props.children;
  }
}

// --- PDF Helper (html2canvas+jsPDF) ---
export function cargarScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function generarPDF({ html, css, filename, margin, format, orientation, raw }) {
  if (typeof window.html2canvas === "undefined") {
    try {
      await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    } catch {
      alert("No se pudo cargar el generador de PDF. Verifica tu conexión.");
      return;
    }
  }
  if (typeof window.jspdf === "undefined") {
    try {
      await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    } catch {
      alert("No se pudo cargar el generador de PDF. Verifica tu conexión.");
      return;
    }
  }
  if (!html || !html.trim()) {
    alert("Error: no hay contenido para generar el PDF");
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;width:750px;opacity:0.01;z-index:-1;pointer-events:none;background:#fff;font-family:Arial,Helvetica,sans-serif;";
  wrapper.innerHTML = raw ? html : `<style>${css}</style>${html}`;
  document.body.appendChild(wrapper);
  const imgs = Array.from(wrapper.querySelectorAll("img"));
  if (imgs.length > 0) {
    await Promise.all(
      imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if (img.complete && img.naturalWidth === 0) {
          img.src = img.src;
          return new Promise(r => { img.onload = r; img.onerror = r; });
        }
        return new Promise(r => { img.onload = r; img.onerror = r; });
      })
    );
  }
  await new Promise(r => setTimeout(r, 600));
  // Subir opacidad a 1 justo antes de capturar
  wrapper.style.opacity = "1";
  await new Promise(r => requestAnimationFrame(r));

  const isMobile = window.innerWidth < 768;
  const scale = isMobile ? 1.5 : 2;
  try {
    const canvas = await window.html2canvas(wrapper, {
      scale, useCORS: true, allowTaint: true, logging: false,
      width: 750,
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: format || "letter", orientation: orientation || "portrait" });
    const pw = pdf.internal.pageSize.getWidth() - 16;
    const ph = pdf.internal.pageSize.getHeight() - 16;
    const cw = canvas.width;
    const ch = canvas.height;
    const pxPerMm = cw / pw;
    const pagePxH = Math.floor(ph * pxPerMm);
    const overlap = 4;
    let y0 = 0;
    while (y0 < ch) {
      if (y0 > 0) pdf.addPage();
      const cropH = Math.min(pagePxH + overlap, ch - y0);
      const tmp = document.createElement("canvas");
      tmp.width = cw; tmp.height = cropH;
      tmp.getContext("2d").drawImage(canvas, 0, y0, cw, cropH, 0, 0, cw, cropH);
      pdf.addImage(tmp.toDataURL("image/jpeg", 0.92), "JPEG", 8, 8, pw, (cropH * pw) / cw, undefined, "FAST");
      y0 += pagePxH;
    }
    pdf.save(filename || "documento.pdf");
  } catch (err) {
    console.error("PDF error:", err);
    alert("Error al generar PDF: " + (err.message || err));
  }
  wrapper.style.opacity = "0.01";
  document.body.removeChild(wrapper);
}

// --- Toast ---
export function Toast({ msg, type }) {
  if (!msg) return null;
  const c = type === "err" ? T.red : T.acc;
  return (
    <div style={{ background: T.card, border: `1px solid ${c}`, borderRadius: 10, padding: "11px 18px", fontSize: 13, color: c, fontWeight: 600, marginBottom: 14 }}>
      {type === "err" ? "[X]" : "[OK]"} {msg}
    </div>
  );
}

// --- Spinner ---
export function Spinner() {
  return <div style={{ textAlign: "center", padding: 48, color: T.sub, fontSize: 14 }}>Cargando...</div>;
}

// --- Empty ---
export function Empty({ icon, msg, action, onAction }) {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: 48, color: T.sub }}>
      {React.isValidElement(icon) ? icon
        : typeof icon === "function"
          ? React.createElement(icon, { size: 40, color: T.mut })
          : <div style={{ fontSize: 36, marginBottom: 12 }}>{icon || "📭"}</div>
      }
      <div style={{ fontSize: 14, marginBottom: action ? 16 : 0 }}>{msg}</div>
      {action && <button onClick={onAction} style={{ ...S.btn("primary"), marginTop: 4 }}>{action}</button>}
    </div>
  );
}

// --- Fld (Field wrapper) ---
export function Fld({ label, children, span2 }) {
  return (
    <div style={span2 ? { gridColumn: "span 2" } : {}} className="fld-wrap">
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}

// --- Badge ---
export function Badge({ c, bg, l, small }) {
  return (
    <span style={{ display: "inline-block", padding: small ? "2px 8px" : "3px 10px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 700, color: c, background: bg }}>
      {l}
    </span>
  );
}

// --- Modal Exportar ---
export function ModalExportar({ titulo, datos, campos, onClose, extraEncabezado }) {
  const [formato, setFormato] = useState("csv");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");

  const filtered = datos.filter(r => {
    const f = r.fecha || r.created_at || r.fecha_inicio || "";
    if (fi && f < fi) return false;
    if (ff && f > ff) return false;
    return true;
  });

  const exportar = () => {
    if (formato === "pdf") {
      const tds = r => campos.map(c => `<td${c.cls ? ` class="${c.cls}"` : ""}>${c.render ? c.render(r) : (r[c.key] ?? "")}</td>`).join("");
      const html = `<div style="padding:20px;font-size:11px">
      <h2 style="margin-bottom:2px;color:#1B2D5C">Tz'unun AutoRentas - ${titulo}</h2>
      ${extraEncabezado ? `<div style="font-size:10px;color:#666;margin-bottom:16px">${extraEncabezado}</div>` : `<p style="margin-top:0">${filtered.length} registros - ${new Date().toLocaleDateString("es-GT")}</p>`}
      <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#1B2D5C;color:#fff">${campos.map(c => `<th style="padding:6px 8px;text-align:left;white-space:nowrap">${c.label}</th>`).join("")}</tr></thead>
      <tbody>${filtered.map(r => `<tr>${tds(r)}</tr>`).join("")}</tbody>
      </table></div>`;
      const css = `body{font-family:Arial,sans-serif;margin:0;padding:0}td{padding:5px 8px;border-bottom:1px solid #E2E8F0;white-space:nowrap;font-size:11px}.der{text-align:right}.mono{font-family:'Courier New',monospace}`;
      generarPDF({ html, css, filename: `${titulo}.pdf` });
    } else {
      const sep = formato === "csv" ? "," : "\t";
      const bom = "\uFEFF";
      const rows = [
        campos.map(c => c.label).join(sep),
        ...filtered.map(r => campos.map(c => {
          const v = c.key ? (r[c.key] ?? "") : (c.render ? c.render(r) : "");
          return `"${String(v).replace(/"/g, '""')}"`;
        }).join(sep))
      ].join("\n");
      const blob = new Blob([bom + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = titulo.replace(/\s+/g, "_") + (formato === "csv" ? ".csv" : ".xls");
      a.click(); URL.revokeObjectURL(url);
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Exportar - {titulo}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.sub, cursor: "pointer", fontSize: 22 }}>X</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <Fld label="DESDE"><input style={S.inp} type="date" value={fi} onChange={e => setFi(e.target.value)} /></Fld>
          <Fld label="HASTA"><input style={S.inp} type="date" value={ff} onChange={e => setFf(e.target.value)} /></Fld>
        </div>
        <Fld label="FORMATO">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[["csv", "CSV (Excel compatible)"], ["xls", "XLS (Microsoft Excel)"], ["pdf", "PDF (imprimir)"]].map(([v, l]) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "9px 12px", borderRadius: 8, background: formato === v ? T.accD : T.surf, border: `1px solid ${formato === v ? T.acc : T.bord}` }}>
                <input type="radio" name="fmt" checked={formato === v} onChange={() => setFormato(v)} style={{ accentColor: T.acc }} />
                <span style={{ fontSize: 13 }}>{l}</span>
              </label>
            ))}
          </div>
        </Fld>
        <div style={{ fontSize: 11, color: T.mut, marginBottom: 14, padding: "8px 12px", background: T.surf, borderRadius: 6 }}>
          Se exportaran <b style={{ color: T.acc }}>{filtered.length}</b> registros
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportar} style={{ ...S.btn("primary"), flex: 2, padding: 11, fontSize: 13 }}>Exportar</button>
          <button onClick={onClose} style={{ ...S.btn("ghost"), flex: 1, padding: 11 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// --- Buscador de Clientes ---
export function BuscadorCliente({ value, onChange, onSelect, empId }) {
  const [clientes, setClientes] = useState([]);
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    dbGet("clientes", "&order=nombre.asc").then(d => setClientes(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = value.length > 0
    ? clientes.filter(c => c.nombre?.toLowerCase().includes(value.toLowerCase()) || c.codigo?.toLowerCase().includes(value.toLowerCase()))
    : clientes.slice(0, 8);

  const agregar = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    const r = await dbIns("clientes", { nombre: newNombre, tipo: "empresa", empresa_id: empId });
    if (!r.error) {
      setClientes(p => [...p, r]);
      onChange(newNombre);
      setShowNew(false);
      setNewNombre("");
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={S.inp}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Escribe nombre o codigo del cliente..."
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: `1px solid ${T.bord}`, borderRadius: 8, zIndex: 100, maxHeight: 240, overflowY: "auto", marginTop: 2 }}>
          {filtered.map((c, i) => (
            <div key={i} onClick={() => { onChange(c.nombre); onSelect?.(c); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${T.bord}22`, display: "flex", justifyContent: "space-between" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span>{c.nombre}</span>
              <span style={{ fontSize: 11, color: T.mut }}>{c.codigo || ""}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "8px 12px", fontSize: 12, color: T.mut }}>No encontrado</div>
          )}
          {!showNew ? (
            <div
              onClick={() => { setShowNew(true); setNewNombre(value); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, color: T.acc, fontWeight: 600, borderTop: `1px solid ${T.bord}` }}>
              + Agregar nuevo cliente
            </div>
          ) : (
            <div style={{ padding: 10, borderTop: `1px solid ${T.bord}` }}>
              <input
                style={{ ...S.inp, marginBottom: 6, fontSize: 12 }}
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                placeholder="Nombre del cliente"
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={agregar} disabled={saving} style={{ ...S.btn("primary"), flex: 1, fontSize: 11, padding: 6 }}>
                  {saving ? "..." : "Guardar"}
                </button>
                <button onClick={() => setShowNew(false)} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11, padding: 6 }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- CatBadge (badge de categoría con color) ---
const CAT_COLORS = {
  combustible: "#F59E0B", mantenimiento: "#3B82F6", salarios: "#22C55E",
  seguros: "#A855F7", servicios: "#00D4AA", ventas: "#00D4AA",
  oficina: "#64748B", alimentacion: "#F97316", llantas: "#EF4444",
  repuestos: "#3B82F6", hospedaje: "#8B5CF6", peajes: "#6B7280",
  impuestos: "#DC2626", otros: "#94A3B8",
};
export function CatBadge({ cat }) {
  const c = CAT_COLORS[cat] || "#94A3B8";
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: c + "22", color: c, whiteSpace: "nowrap" }}>
      {cat || "—"}
    </span>
  );
}

// --- Paginador ---
export function Paginador({ page, totalPages, total, desde, hasta, pageSize, onPage, onPageSize }) {
  if (total <= 1) return null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const Btn = ({ n, l, disabled, active }) => (
    <button disabled={disabled} onClick={() => onPage(n)}
      style={{
        padding: isMobile ? '8px 12px' : '5px 10px', borderRadius: 6, border: active ? 'none' : `1px solid ${T.bord}`,
        background: active ? T.acc : 'transparent', color: active ? '#fff' : T.sub,
        cursor: disabled ? 'default' : 'pointer', fontSize: 11, fontWeight: 600,
        opacity: disabled ? 0.3 : 1, fontFamily: 'inherit', minHeight: 36,
      }}>{l || n}</button>
  );
  const pages = [];
  const maxVisible = isMobile ? 3 : 5;
  let s = Math.max(1, page - Math.floor(maxVisible / 2));
  let e = Math.min(totalPages, s + maxVisible - 1);
  if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1);
  for (let i = s; i <= e; i++) pages.push(i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
      <div style={{ fontSize: 11, color: T.mut }}>
        <b style={{ color: T.txt }}>{desde}</b>–<b style={{ color: T.txt }}>{hasta}</b> de <b style={{ color: T.txt }}>{total}</b>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Btn n={1} l="«" disabled={page === 1} />
        <Btn n={page - 1} l="‹" disabled={page === 1} />
        {s > 1 && <span style={{ color: T.mut, fontSize: 11 }}>…</span>}
        {pages.map(i => <Btn key={i} n={i} active={i === page} />)}
        {e < totalPages && <span style={{ color: T.mut, fontSize: 11 }}>…</span>}
        <Btn n={page + 1} l="›" disabled={page === totalPages} />
        <Btn n={totalPages} l="»" disabled={page === totalPages} />
      </div>
      <select value={pageSize} onChange={e => onPageSize(parseInt(e.target.value))}
        style={{ ...S.sel, width: 'auto', padding: '4px 8px', fontSize: 11, minHeight: 36 }}>
        <option value={25}>25 / pag</option>
        <option value={50}>50 / pag</option>
        <option value={100}>100 / pag</option>
      </select>
    </div>
  );
}

// --- Buscador estandar ---
export function Buscador({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <input type="search" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...S.inp, maxWidth: 320, width: '100%', padding: '10px 12px', fontSize: 14 }}
      className="buscador-input"
    />
  );
}

// --- Tabla responsiva con card view en mobile ---
export function TablaResponsiva({ children, style, cols, datos }) {
  if (cols && datos) {
    return <TablaDinamica cols={cols} datos={datos} style={style} />;
  }
  return (
    <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', ...style }}>
      {children}
    </div>
  );
}

// --- Tabla Dinamica: table en desktop, cards en mobile ---
function TablaDinamica({ cols, datos, style }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div className="table-wrap" style={{ ...style }}>
      {/* Table view (desktop) */}
      <table style={{
        width: '100%', borderCollapse: 'collapse', fontSize: 12,
        display: isMobile ? 'none' : 'table',
      }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.bord}`, background: T.surf }}>
            {cols.map((c, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '8px 10px', fontWeight: 700,
                color: T.sub, fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 0.5, whiteSpace: 'nowrap',
                ...(c.cls === 'der' ? { textAlign: 'right' } : {}),
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((r, ri) => (
            <tr key={ri} style={{
              borderBottom: `1px solid ${T.bord}`, transition: 'background .1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map((c, ci) => (
                <td key={ci} style={{
                  padding: '8px 10px', color: T.txt, whiteSpace: 'nowrap',
                  ...(c.cls === 'der' ? { textAlign: 'right' } : {}),
                }}>
                  {c.render ? c.render(r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Card view (mobile) */}
      <div style={{ display: isMobile ? 'flex' : 'none', flexDirection: 'column', gap: 12 }}>
        {datos.map((r, ri) => (
          <div key={ri} style={{
            background: T.card, border: `1px solid ${T.bord}`,
            borderRadius: 14, padding: '14px', display: 'flex',
            flexDirection: 'column', gap: 8,
          }}>
            {cols.map((c, ci) => (
              <div key={ci} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.mut, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                  {c.label}
                </span>
                <span style={{ fontSize: 13, color: T.txt, textAlign: 'right' }}>
                  {c.render ? c.render(r) : (r[c.key] ?? '—')}
                </span>
              </div>
            ))}
          </div>
        ))}
        {datos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: T.mut, fontSize: 13 }}>Sin registros</div>
        )}
      </div>
    </div>
  );
}

// --- Boton de accion compacto y consistente ---
export function BtnAccion({ label, color = 'primary', size = 'sm', onClick, disabled, title, icon: Icon }) {
  const sizes = {
    xs: { padding: '4px 8px', fontSize: 11 },
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 13 },
  };
  const s = sizes[size] || sizes.sm;
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        ...S.btn(color), ...s, whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        minHeight: 36, fontFamily: 'inherit',
      }}>
      {Icon && <Icon size={size === 'xs' ? 14 : 16} color="currentColor" />}
      {label}
    </button>
  );
}

// --- Botones Compartir ---
export function BotonesCompartir({ numero, total, tipo }) {
  const msg = `Tz'unun AutoRentas - ${tipo} ${numero} por Q ${fmt(total)}. Mas informacion: 502-31221538`;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button
        onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), background: "#25D366", color: "#fff", fontSize: 11, padding: "5px 10px" }}>
        WhatsApp
      </button>
      <button
        onClick={() => window.open("mailto:?subject=" + encodeURIComponent(tipo + " " + numero) + "&body=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), fontSize: 11, padding: "5px 10px" }}>
        Correo
      </button>
      <button
        onClick={() => window.open("tg://msg?text=" + encodeURIComponent(msg))}
        style={{ ...S.btn("ghost"), background: "#2CA5E0", color: "#fff", fontSize: 11, padding: "5px 10px" }}>
        Telegram
      </button>
    </div>
  );
}
