import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { T, S, fmt, fmtD, fmtK, today } from '../config.js';
import { markRead } from '../services/readState.js';

import { loadDashboardData } from '../services/dashboardService.js';
import { Spinner } from '../components/shared.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// ─── Mini iconos SVG ───────────────────────────────────────────────
const IconVehiculo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconWrench = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IconContract = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconTrendUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

// ─── KPI Card ──────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color, bg, trend }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.bord}`,
      borderRadius: 14,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform .15s, box-shadow .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: bg || `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: trend >= 0 ? T.green : T.red,
            background: trend >= 0 ? T.greenD : T.redD,
            padding: '2px 6px', borderRadius: 6,
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: T.mut, marginTop: 4, fontWeight: 500 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Alerta ────────────────────────────────────────────────────────
function AlertaItem({ alerta }) {
  const nivelColor = alerta.nivel === 'danger' ? '#EF4444' : alerta.nivel === 'warning' ? '#F59E0B' : '#3B82F6';
  const nivelBg = alerta.nivel === 'danger' ? '#EF444418' : alerta.nivel === 'warning' ? '#F59E0B18' : '#3B82F618';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      background: nivelBg,
      border: `1px solid ${nivelColor}33`,
      fontSize: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: nivelColor + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: nivelColor, flexShrink: 0,
      }}>
        {alerta.icon}
      </div>
      <span style={{ color: '#CBD5E1', flex: 1 }}>{alerta.msg}</span>
      <button onClick={() => markRead(alerta.id)} title="Descartar" style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: nivelColor, padding: 2, display: 'flex', alignItems: 'center',
        opacity: 0.5, fontSize: 14, lineHeight: 1,
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
        ✕
      </button>
    </div>
  );
}

// ─── Calendario mensual de reservas ───────────────────────────────
function CalendarioMensual({ reservas }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [popup, setPopup] = useState(null);

  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  const coloresBurbuja = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const navigate = (dir) => {
    const d = new Date(anio, mes + dir, 1);
    setMes(d.getMonth());
    setAnio(d.getFullYear());
  };

  const primerDia = new Date(anio, mes, 1).getDay();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  const dayMap = {};
  (reservas || []).forEach(r => {
    if (!r.fecha_inicio || ['cancelada','completada'].includes(r.estado)) return;
    const start = new Date(r.fecha_inicio);
    const end = r.fecha_fin ? new Date(r.fecha_fin) : new Date(r.fecha_inicio);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(r);
    }
  });

  const todayStr = hoy.toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < primerDia; i++) cells.push(null);
  for (let d = 1; d <= ultimoDia; d++) {
    const dateStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRes = dayMap[dateStr] || [];
    const isToday = dateStr === todayStr;
    cells.push({ day: d, reservas: dayRes, isToday });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'transparent', border: 'none', color: T.sub, cursor: 'pointer',
          fontSize: 18, fontWeight: 600, padding: '4px 10px',
        }}>&larr;</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>
          {meses[mes]} {anio}
        </div>
        <button onClick={() => navigate(1)} style={{
          background: 'transparent', border: 'none', color: T.sub, cursor: 'pointer',
          fontSize: 18, fontWeight: 600, padding: '4px 10px',
        }}>&rarr;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, width: '100%', minWidth: 0 }}>
        {diasSemana.map(d => (
          <div key={d} style={{
            fontSize: 9, fontWeight: 700, color: T.mut, textAlign: 'center',
            padding: '3px 0',
          }}>{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div key={i} onClick={() => cell?.reservas?.length > 0 && setPopup(cell.reservas)}
            style={{
              display: 'flex', flexDirection: 'column',
              borderRadius: 6, fontSize: 11, fontWeight: 500, minWidth: 0,
              background: cell?.isToday ? T.acc + '22' : 'transparent',
              color: cell ? (cell.isToday ? T.acc : T.txt) : 'transparent',
              padding: '3px 2px', position: 'relative',
              cursor: cell?.reservas?.length > 0 ? 'pointer' : 'default',
              minHeight: 42,
            }}>
            {cell && (
              <>
                <span style={{ fontWeight: cell.isToday ? 700 : 400, fontSize: 10, marginBottom: 2 }}>{cell.day}</span>
                {cell.reservas.slice(0, 2).map((r, ri) => (
                  <span key={r.id || ri} style={{
                    display: 'inline-block',
                    fontSize: 7, fontWeight: 600, lineHeight: '14px', color: '#fff',
                    background: coloresBurbuja[ri % coloresBurbuja.length],
                    borderRadius: 7, padding: '0 5px', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>{r.cliente_nombre || '—'}</span>
                ))}
                {cell.reservas.length > 2 && (
                  <span key="more" style={{
                    fontSize: 7, fontWeight: 700, color: T.acc, marginTop: 1,
                  }}>+{cell.reservas.length - 2}</span>
                )}
              />
            <Area type="monotone" dataKey="Ingresos" stroke={T.acc} fill="url(#ingGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Egresos" stroke={T.red} fill="url(#egGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: T.mut, fontSize: 13 }}>
          Sin movimientos registrados
        </div>
      )}
    </div>
  );
}

// ─── Centro de control principal ───────────────────────────────────
export default function PageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const d = await loadDashboardData();
    setData(d);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh cada 2 minutos
  useEffect(() => {
    const interval = setInterval(load, 120000);
    return () => clearInterval(interval);
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos dias' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${T.acc}, ${T.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, color: 'white',
        }}>T</div>
        <div style={{ color: T.mut, fontSize: 14 }}>Cargando centro de control...</div>
        <div style={{
          width: 160, height: 3, background: T.bord, borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: T.acc, borderRadius: 2,
            animation: 'loadBar 1.5s ease infinite',
            width: '30%',
          }} />
        </div>
        <style>{`@keyframes loadBar { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
      </div>
    );
  }

  if (!data) return <Spinner />;

  return (
    <div>
      {/* Encabezado */}
      <div style={{
        ...S.card,
        marginBottom: 16,
        background: `linear-gradient(135deg, ${T.card}, ${T.bord}88)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.sub }}>{saludo},</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginTop: 2 }}>
              Centro de Control
            </div>
            <div style={{ fontSize: 11, color: T.acc, marginTop: 2 }}>
              Tz'unun AutoRentas · {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button onClick={load} style={{
            ...S.btn('ghost'), fontSize: 11, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <IconRefresh />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        {lastUpdate && (
          <div style={{ fontSize: 9, color: T.mut, marginTop: 8 }}>
            Ultima actualizacion: {lastUpdate.toLocaleTimeString('es-GT')}
            {loading && ' (actualizando...)'}
          </div>
        )}
      </div>

      {/* Alertas operativas */}
      <AlertasRapidas alertas={data.alertas} />

      {/* KPIs operativos - Fila 1: Flota */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 8 }}>
        FLOTA
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPICard
          icon={<IconVehiculo />}
          label="Total vehiculos"
          value={data.totalVehiculos}
          color={T.txt}
          bg={T.surf}
        />
        <KPICard
          icon={<IconCheck />}
          label="Disponibles"
          value={data.vDisp}
          color={T.acc}
          sub={`${data.totalVehiculos > 0 ? Math.round((data.vDisp / data.totalVehiculos) * 100) : 0}% de la flota`}
        />
        <KPICard
          icon={<IconVehiculo />}
          label="Rentados"
          value={data.vRent}
          color={T.blue}
        />
        <KPICard
          icon={<IconCalendar />}
          label="Reservas activas"
          value={data.rAct}
          color={T.purple}
        />
        <KPICard
          icon={<IconWrench />}
          label="En mantenimiento"
          value={data.vMant}
          color={T.sec}
        />
      </div>

      {/* KPIs - Fila 2: Finanzas */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 8 }}>
        FINANZAS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPICard
          icon={<IconMoney />}
          label="Ingresos hoy"
          value={`Q ${fmt(data.ingresosHoy)}`}
          color={T.acc}
          sub={data.ingresosHoy > 0 ? 'Del dia de hoy' : 'Sin ingresos hoy'}
        />
        <KPICard
          icon={<IconTrendUp />}
          label="Ingresos totales"
          value={fmtK(data.ing)}
          color={T.acc}
        />
        <KPICard
          icon={<IconMoney />}
          label="Egresos"
          value={fmtK(data.eg)}
          color={T.red}
        />
        <KPICard
          icon={<IconMoney />}
          label="Saldo GTQ"
          value={fmtK(data.saldo)}
          color={T.acc}
        />
        <KPICard
          icon={<IconContract />}
          label="Facturado"
          value={fmtK(data.facTot)}
          color={T.purple}
        />
      </div>

      {/* Calendario mensual */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 8 }}>
        CALENDARIO DE RESERVAS — {new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).toUpperCase()}
      </div>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <CalendarioMensual reservas={data.reservas} />
      </div>

      {/* Panel central: responsive 1-2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EstadoFlota data={data} />
          <MantenimientosCriticos data={data.mantosCriticos} />
          <ContratosPendientes data={data.contratosPend} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GraficoIngresos data={data.chart} />
          <PagosPendientes data={data.pagosPend} />
          <ProximasReservas reservas={data.reservas} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: 10, color: T.mut, textAlign: 'center', padding: '16px 0' }}>
        Tz'unun AutoRentas — Centro de Control Operativo
      </div>
    </div>
  );
}
