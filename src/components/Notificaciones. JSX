import React, { useState, useEffect, useCallback } from 'react';
import { T, S, dbGet, fmtD, fmt } from '../config.js';

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useNotificaciones() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const alertas = [];
    const hoy    = new Date();
    const en3    = new Date(); en3.setDate(hoy.getDate() + 3);

    try {
      const [reservas, vehiculos, mantos, cotizaciones, facturas] = await Promise.all([
        dbGet("reservas",      "&estado=in.(confirmada,pendiente)&select=id,numero,cliente_nombre,vehiculo_nombre,fecha_inicio,estado"),
        dbGet("vehiculos",     "&select=id,marca,modelo,placa,km_actual,estado"),
        dbGet("mantenimientos","&estado=eq.completado&select=id,vehiculo_id,km_salida,fecha_salida&order=km_salida.desc"),
        dbGet("cotizaciones",  "&estado=eq.enviada&select=id,numero,cliente_nombre,created_at,total_gtq"),
        dbGet("facturas",      "&estado=in.(emitida,certificada,parcial)&select=id,numero,nombre_receptor,saldo_pendiente"),
      ]);

      // ── 1. Reservas próximas (0-3 días) ───────────────────────────────────
      (Array.isArray(reservas) ? reservas : []).forEach(r => {
        if (!r.fecha_inicio) return;
        const fi = new Date(r.fecha_inicio);
        const dias = Math.ceil((fi - hoy) / (1000 * 60 * 60 * 24));
        if (dias >= 0 && dias <= 3) {
          alertas.push({
            id: "res_" + r.id, tipo: "reserva",
            nivel: dias === 0 ? "danger" : "warning",
            titulo: dias === 0 ? "Reserva HOY" : `Reserva en ${dias} dia${dias === 1 ? "" : "s"}`,
            msg: `${r.cliente_nombre} — ${r.vehiculo_nombre || "Sin vehiculo asignado"} — ${fmtD(r.fecha_inicio)}`,
          });
        }
      });

      // ── 2. Mantenimiento por kilometraje ──────────────────────────────────
      const vehs    = Array.isArray(vehiculos)   ? vehiculos   : [];
      const manList = Array.isArray(mantos)       ? mantos      : [];
      vehs.forEach(v => {
        const ultManto = manList
          .filter(m => m.vehiculo_id === v.id)
          .sort((a, b) => (b.km_salida || 0) - (a.km_salida || 0))[0];
        const kmUlt    = ultManto?.km_salida || 0;
        const kmActual = v.km_actual || 0;
        const kmDesde  = kmActual - kmUlt;
        const nombre   = `${v.marca || ""} ${v.modelo || ""} (${v.placa || "Sin placa"})`.trim();

        if (kmDesde >= 5000) {
          alertas.push({
            id: "manto_" + v.id, tipo: "mantenimiento",
            nivel: kmDesde >= 8000 ? "danger" : "warning",
            titulo: kmDesde >= 8000 ? "Mantenimiento URGENTE" : "Mantenimiento requerido",
            msg: `${nombre} — ${kmDesde.toLocaleString()} km desde ultimo servicio (limite: 5,000 km)`,
          });
        } else if (kmDesde >= 4000) {
          alertas.push({
            id: "manto_prox_" + v.id, tipo: "mantenimiento", nivel: "info",
            titulo: "Mantenimiento proximo",
            msg: `${nombre} — faltan ${(5000 - kmDesde).toLocaleString()} km para el proximo servicio`,
          });
        }
      });

      // ── 3. Cotizaciones sin respuesta (> 3 días) ──────────────────────────
      (Array.isArray(cotizaciones) ? cotizaciones : []).forEach(c => {
        if (!c.created_at) return;
        const dias = Math.floor((Date.now() - new Date(c.created_at)) / (1000 * 60 * 60 * 24));
        if (dias >= 3) {
          alertas.push({
            id: "cot_" + c.id, tipo: "cobro",
            nivel: dias >= 7 ? "danger" : "warning",
            titulo: "Cotizacion sin respuesta",
            msg: `${c.numero} — ${c.cliente_nombre} — ${dias} dias esperando aprobacion — Q ${fmt(c.total_gtq)}`,
          });
        }
      });

      // ── 4. Saldos pendientes de cobro ─────────────────────────────────────
      (Array.isArray(facturas) ? facturas : []).forEach(fa => {
        const saldo = parseFloat(fa.saldo_pendiente) || 0;
        if (saldo > 0) {
          alertas.push({
            id: "fac_" + fa.id, tipo: "cobro", nivel: "danger",
            titulo: "Cobro pendiente",
            msg: `${fa.numero} — ${fa.nombre_receptor} — Q ${saldo.toFixed(2)} por cobrar`,
          });
        }
      });

    } catch (e) {
      console.error("Error cargando notificaciones:", e);
    }

    // Ordenar: danger → warning → info
    const orden = { danger: 0, warning: 1, info: 2 };
    alertas.sort((a, b) => (orden[a.nivel] || 2) - (orden[b.nivel] || 2));
    setAlerts(alertas);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    alerts, loading, reload: load,
    count:   alerts.length,
    danger:  alerts.filter(a => a.nivel === "danger").length,
    warning: alerts.filter(a => a.nivel === "warning").length,
  };
}

// ─── Constantes de color ──────────────────────────────────────────────────────
const NIVEL_COLOR = { danger: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
const NIVEL_BG    = { danger: "#EF444422", warning: "#F59E0B22", info: "#3B82F622" };
const TIPO_LETRA  = { reserva: "R", mantenimiento: "M", cobro: "$" };
const TIPO_LABEL  = { reserva: "Reservas", mantenimiento: "Mantenimiento", cobro: "Cobros" };

// ─── Componente Bell (insertar en el header de App.jsx) ───────────────────────
export function NotificacionesBell({ isMobile = false }) {
  const { alerts, loading, reload, count, danger, warning } = useNotificaciones();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const badgeColor = danger > 0 ? NIVEL_COLOR.danger : warning > 0 ? NIVEL_COLOR.warning : T.acc;

  const filtered = filtro === "todos" ? alerts : alerts.filter(a => a.tipo === filtro);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => { if (!open) reload(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [open, reload]);

  return (
    <div style={{ position: "relative" }}>
      {/* Botón campana */}
      <button onClick={() => { setOpen(!open); if (!open) reload(); }}
        style={{ position: "relative", background: open ? T.accDim : "transparent", border: `1px solid ${open ? T.acc : T.bord}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
        {/* SVG campana */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke={count > 0 ? badgeColor : T.sub} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <div style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, background: badgeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "white", padding: "0 3px" }}>
            {count > 9 ? "9+" : count}
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
          <div style={{
            position: isMobile ? "fixed" : "absolute",
            top: isMobile ? 62 : 46,
            right: isMobile ? 8 : 0,
            width: isMobile ? "calc(100vw - 16px)" : 370,
            background: "#111827",
            border: `1px solid ${T.bord}`,
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(0,0,0,.6)",
            zIndex: 200,
            maxHeight: 520,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.bord}`, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Notificaciones</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{count} alerta{count !== 1 ? "s" : ""} activa{count !== 1 ? "s" : ""}</div>
                </div>
                <button onClick={() => reload()} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 8px" }}>
                  {loading ? "..." : "Actualizar"}
                </button>
              </div>

              {/* Resumen rápido */}
              {count > 0 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {[["danger", "Urgentes"], ["warning", "Avisos"], ["info", "Info"]].map(([niv, lbl]) => {
                    const n = alerts.filter(a => a.nivel === niv).length;
                    if (!n) return null;
                    const c = NIVEL_COLOR[niv];
                    return (
                      <div key={niv} style={{ flex: 1, background: c + "18", border: `1px solid ${c}33`, borderRadius: 8, padding: "5px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{n}</div>
                        <div style={{ fontSize: 9, color: T.sub }}>{lbl}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filtros */}
            {count > 0 && (
              <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${T.bord}`, flexShrink: 0 }}>
                {["todos", "reserva", "mantenimiento", "cobro"].map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    style={{ ...S.btn(filtro === f ? "primary" : "ghost"), fontSize: 10, padding: "3px 8px" }}>
                    {f === "todos" ? "Todas" : TIPO_LABEL[f]}
                  </button>
                ))}
              </div>
            )}

            {/* Lista de alertas */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: "center", color: T.sub, fontSize: 13 }}>Verificando alertas...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 36, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.acc, marginBottom: 10 }}>OK</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>Todo en orden</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Sin alertas pendientes</div>
                </div>
              ) : filtered.map(a => {
                const c  = NIVEL_COLOR[a.nivel] || T.acc;
                const bg = NIVEL_BG[a.nivel]    || T.accDim;
                return (
                  <div key={a.id} style={{ padding: "11px 14px", borderBottom: `1px solid ${T.bord}18`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${c}33` }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: c }}>{TIPO_LETRA[a.tipo] || "!"}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c, marginBottom: 2 }}>{a.titulo}</div>
                      <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.45, wordBreak: "break-word" }}>{a.msg}</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0, marginTop: 5 }} />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.bord}`, flexShrink: 0, fontSize: 10, color: T.mut, textAlign: "center" }}>
              Actualizacion automatica cada 5 minutos · {new Date().toLocaleTimeString("es-GT")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
