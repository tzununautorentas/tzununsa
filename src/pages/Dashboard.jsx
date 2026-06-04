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

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const navigate = (dir) => {
    const d = new Date(anio, mes + dir, 1);
    setMes(d.getMonth());
    setAnio(d.getFullYear());
  };

  const primerDia = new Date(anio, mes, 1).getDay();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  const countMap = {};
  (reservas || []).forEach(r => {
    if (!r.fecha_inicio || ['cancelada','completada'].includes(r.estado)) return;
    const f = r.fecha_inicio;
    countMap[f] = (countMap[f] || 0) + 1;
  });

  const todayStr = hoy.toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < primerDia; i++) cells.push(null);
  for (let d = 1; d <= ultimoDia; d++) {
    const dateStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count = countMap[dateStr] || 0;
    const isToday = dateStr === todayStr;
    cells.push({ day: d, count, isToday });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'transparent', border: 'none', color: T.sub, cursor: 'pointer',
          fontSize: 16, fontWeight: 600, padding: '4px 8px',
        }}>&larr;</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>
          {meses[mes]} {anio}
        </div>
        <button onClick={() => navigate(1)} style={{
          background: 'transparent', border: 'none', color: T.sub, cursor: 'pointer',
          fontSize: 16, fontWeight: 600, padding: '4px 8px',
        }}>&rarr;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {diasSemana.map(d => (
          <div key={d} style={{
            fontSize: 9, fontWeight: 700, color: T.mut, textAlign: 'center',
            padding: '4px 0',
          }}>{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div key={i} style={{
            aspectRatio: '1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, fontSize: 11, fontWeight: 500,
            background: cell?.isToday ? T.acc + '22' : 'transparent',
            color: cell ? (cell.isToday ? T.acc : T.txt) : T.mut,
            border: cell?.isToday ? `1px solid ${T.acc}44` : '1px solid transparent',
            position: 'relative',
          }}>
            {cell && (
              <>
                <span style={{ fontWeight: cell.isToday ? 700 : 400 }}>{cell.day}</span>
                {cell.count > 0 && (
                  <span style={{
                    position: 'absolute', bottom: 2, fontSize: 8, fontWeight: 700,
                    color: '#fff', background: cell.count >= 3 ? T.red : T.acc,
                    borderRadius: 6, padding: '0 4px', lineHeight: '14px', minWidth: 14,
                    textAlign: 'center',
                  }}>{cell.count}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Seccion de alertas rápidas ────────────────────────────────────
function AlertasRapidas({ alertas }) {
  const readVer = useSyncExternalStore(
    cb => { window.addEventListener('readstatechange', cb); return () => window.removeEventListener('readstatechange', cb); },
    () => localStorage.getItem('tzunun_read'),
  );
  const readMap = readVer ? JSON.parse(readVer) : {};
  const pendientes = (alertas || []).filter(a => !(a.id in readMap));
  if (pendientes.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.mut, letterSpacing: 1, marginBottom: 2 }}>
        ALERTAS OPERATIVAS
      </div>
      {pendientes.map((a, i) => <AlertaItem key={a.id || i} alerta={a} />)}
    </div>
  );
}

// ─── Tabla de mantenimientos críticos ──────────────────────────────
function MantenimientosCriticos({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconWrench />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>Mantenimientos</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Vehiculo', 'Placa', 'Estado', 'KM'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map((m, i) => {
            const color = m.tipo === 'urgente' ? T.red : m.tipo === 'requerido' ? T.sec : m.tipo === 'en_mantenimiento' ? T.sec : T.blue;
            const label = m.tipo === 'urgente' ? 'URGENTE' : m.tipo === 'requerido' ? 'Requiere' : m.tipo === 'en_mantenimiento' ? 'En taller' : 'Proximo';
            const kmLabel = m.tipo === 'en_mantenimiento' ? `${(m.km || 0).toLocaleString()} km` : `${(m.kmDesde || 0).toLocaleString()} km desde ultimo servicio`;
            return (
              <tr key={m.id || i}
                onMouseEnter={e => e.currentTarget.style.background = T.surf}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...S.td, fontWeight: 600 }}>{m.nombre}</td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{m.placa || '—'}</td>
                <td style={S.td}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700, color, background: color + '22' }}>
                    {label}
                  </span>
                </td>
                <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{kmLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagos pendientes ──────────────────────────────────────────────
function PagosPendientes({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconMoney />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>Pagos pendientes de cobro</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Factura', 'Cliente', 'Saldo'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 6).map((p, i) => (
            <tr key={p.id || i}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: T.acc, fontWeight: 600 }}>{p.numero}</td>
              <td style={{ ...S.td, fontSize: 12 }}>{p.cliente}</td>
              <td style={{ ...S.td, fontWeight: 700, color: T.red }}>Q {fmt(p.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Contratos pendientes de firma ─────────────────────────────────
function ContratosPendientes({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconContract />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>Contratos pendientes de firma</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['No.', 'Cliente', 'Total'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map((c, i) => (
            <tr key={c.id || i}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: T.sec, fontWeight: 600 }}>{c.numero}</td>
              <td style={{ ...S.td, fontSize: 12 }}>{c.cliente}</td>
              <td style={{ ...S.td, fontWeight: 700, color: T.sec }}>Q {fmt(c.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Proximas reservas ─────────────────────────────────────────────
function ProximasReservas({ reservas }) {
  const hoy = today();
  const prox = (reservas || [])
    .filter(r => r.fecha_inicio >= hoy && !['cancelada', 'completada'].includes(r.estado))
    .sort((a, b) => a.fecha_inicio?.localeCompare(b.fecha_inicio))
    .slice(0, 6);

  if (prox.length === 0) return null;
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <IconCalendar />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>Proximas reservas</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Cliente', 'Vehiculo', 'Inicio', 'Fin', 'Total'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {prox.map((r, i) => (
            <tr key={r.id || i}
              onMouseEnter={e => e.currentTarget.style.background = T.surf}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ ...S.td, fontWeight: 600 }}>{r.cliente_nombre || '—'}</td>
              <td style={{ ...S.td, fontSize: 11, color: T.sub }}>{r.vehiculo_nombre || '—'}</td>
              <td style={{ ...S.td, fontSize: 11, whiteSpace: 'nowrap' }}>{fmtD(r.fecha_inicio)}</td>
              <td style={{ ...S.td, fontSize: 11, whiteSpace: 'nowrap', color: T.sub }}>{fmtD(r.fecha_fin) || '—'}</td>
              <td style={{ ...S.td, fontWeight: 700, color: T.acc }}>Q {fmt(r.total_gtq)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Panel de estado rápido de vehiculos ───────────────────────────
function EstadoFlota({ data }) {
  if (!data) return null;
  const total = data.vDisp + data.vRent + data.vMant;
  const pctDisp = total > 0 ? Math.round((data.vDisp / total) * 100) : 0;
  const pctRent = total > 0 ? Math.round((data.vRent / total) * 100) : 0;
  const pctMant = total > 0 ? Math.round((data.vMant / total) * 100) : 0;

  return (
    <div style={S.card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconVehiculo />
        Estado de la flota
      </div>
      {/* Barra de progreso */}
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14, gap: 2 }}>
        {data.vDisp > 0 && <div style={{ flex: pctDisp, background: T.acc, borderRadius: '5px 0 0 5px', transition: 'flex .3s' }} />}
        {data.vRent > 0 && <div style={{ flex: pctRent, background: T.blue, transition: 'flex .3s' }} />}
        {data.vMant > 0 && <div style={{ flex: pctMant, background: T.sec, borderRadius: '0 5px 5px 0', transition: 'flex .3s' }} />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Disponibles', value: data.vDisp, color: T.acc, pct: pctDisp },
          { label: 'Rentados', value: data.vRent, color: T.blue, pct: pctRent },
          { label: 'Mantenimiento', value: data.vMant, color: T.sec, pct: pctMant },
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: 'center',
            background: T.surf,
            borderRadius: 10,
            padding: '10px 6px',
            border: `1px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: T.sub }}>{s.label}</div>
            <div style={{ fontSize: 9, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grafico ───────────────────────────────────────────────────────
function GraficoIngresos({ data }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.txt, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconTrendUp />
        Ingresos vs Egresos
      </div>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.acc} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={T.acc} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="egGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.red} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={T.red} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="mes" tick={{ fill: T.mut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.mut, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v / 1000) + 'k' : v} />
            <Tooltip
              contentStyle={{
                background: T.surf,
                border: `1px solid ${T.bord}`,
                borderRadius: 8,
                fontSize: 11,
                color: T.txt,
              }}
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
