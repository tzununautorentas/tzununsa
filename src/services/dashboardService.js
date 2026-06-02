import { SB, H } from '../config.js';

const api = async (path, opts = {}) => {
  try {
    const res = await fetch(`${SB}/rest/v1${path}`, {
      headers: { ...H, ...(opts.headers || {}) },
      ...opts,
    });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
};

export async function loadDashboardData() {
  const [vehiculos, reservas, cotizaciones, facturas, movimientos, cuentas, clientes, mantenimientos, contratos] = await Promise.all([
    api('/vehiculos?order=created_at.desc'),
    api('/reservas?order=fecha_inicio.desc'),
    api('/cotizaciones?order=created_at.desc'),
    api('/facturas?order=created_at.desc'),
    api('/movimientos_bancarios?order=fecha.desc'),
    api('/cuentas_bancarias?select=*'),
    api('/clientes?order=nombre.asc'),
    api('/mantenimientos?order=created_at.desc'),
    api('/contratos?order=created_at.desc'),
  ]);

  const v = Array.isArray(vehiculos) ? vehiculos : [];
  const r = Array.isArray(reservas) ? reservas : [];
  const c = Array.isArray(cotizaciones) ? cotizaciones : [];
  const f = Array.isArray(facturas) ? facturas : [];
  const m = Array.isArray(movimientos) ? movimientos : [];

  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);

  // Vehiculos
  const vDisp = v.filter(x => x.estado === 'disponible').length;
  const vRent = v.filter(x => x.estado === 'rentado').length;
  const vMant = v.filter(x => x.estado === 'mantenimiento').length;

  // Ingresos del día
  const ingresosHoy = m
    .filter(x => x.tipo === 'ingreso' && x.fecha === hoyStr)
    .reduce((s, x) => s + (parseFloat(x.monto) || 0), 0);

  // Ingresos totales
  const ing = m.filter(x => x.tipo === 'ingreso').reduce((s, x) => s + (parseFloat(x.monto) || 0), 0);
  const eg  = m.filter(x => x.tipo === 'egreso').reduce((s, x) => s + (parseFloat(x.monto) || 0), 0);

  // Saldo bancario GTQ
  const cuentasArr = Array.isArray(cuentas) ? cuentas : [];
  const saldo = cuentasArr.filter(x => x.moneda === 'GTQ').reduce((s, x) => s + (parseFloat(x.saldo_actual) || 0), 0);

  // Facturado
  const facTot = f.filter(x => !['anulada', 'borrador'].includes(x.estado))
    .reduce((s, x) => s + (parseFloat(x.total) || 0), 0);

  // Reservas activas (en curso o confirmada)
  const rAct = r.filter(x => ['en_curso', 'confirmada'].includes(x.estado)).length;
  const rPend = r.filter(x => x.estado === 'pendiente').length;

  // Reservas próximas (0-7 días)
  const proxSemana = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const count = r.filter(x =>
      x.fecha_inicio === ds && !['cancelada', 'completada'].includes(x.estado)
    ).length;
    proxSemana.push({ fecha: ds, dia: d.toLocaleDateString('es-GT', { weekday: 'short' }), count });
  }

  // Mantenimientos críticos (próximos 500km)
  const mantosCriticos = [];
  const mantosList = Array.isArray(mantenimientos) ? mantenimientos : [];
  v.forEach(veh => {
    if (veh.estado === 'mantenimiento') {
      mantosCriticos.push({
        id: veh.id,
        nombre: `${veh.marca || ''} ${veh.modelo || ''}`.trim() || veh.placa || 'Sin nombre',
        placa: veh.placa || '',
        tipo: 'en_mantenimiento',
        km: veh.km_actual || 0,
      });
      return;
    }
    const ultimoManto = mantosList
      .filter(m => m.vehiculo_id === veh.id)
      .sort((a, b) => (b.km_salida || 0) - (a.km_salida || 0))[0];
    const kmUlt = ultimoManto?.km_salida || 0;
    const kmActual = veh.km_actual || 0;
    const kmDesde = kmActual - kmUlt;
    if (kmDesde >= 4000) {
      mantosCriticos.push({
        id: veh.id,
        nombre: `${veh.marca || ''} ${veh.modelo || ''}`.trim() || veh.placa || 'Sin nombre',
        placa: veh.placa || '',
        tipo: kmDesde >= 8000 ? 'urgente' : kmDesde >= 5000 ? 'requerido' : 'proximo',
        km: kmActual,
        kmDesde,
      });
    }
  });

  // Pagos pendientes (facturas con saldo pendiente)
  const pagosPend = f
    .filter(x => parseFloat(x.saldo_pendiente) > 0)
    .slice(0, 10)
    .map(x => ({
      id: x.id,
      numero: x.numero,
      cliente: x.nombre_receptor || '—',
      saldo: parseFloat(x.saldo_pendiente) || 0,
    }));

  // Cotizaciones sin respuesta (>2 días)
  const cotsPend = c
    .filter(x => {
      if (x.estado !== 'enviada') return false;
      if (!x.created_at) return false;
      const dias = Math.floor((Date.now() - new Date(x.created_at)) / 86400000);
      return dias >= 2;
    })
    .slice(0, 5)
    .map(x => ({
      id: x.id,
      numero: x.numero,
      cliente: x.cliente_nombre || '—',
      total: parseFloat(x.total_gtq) || 0,
      dias: Math.floor((Date.now() - new Date(x.created_at)) / 86400000),
    }));

  // Contratos pendientes de firma
  const contratosArr = Array.isArray(contratos) ? contratos : [];
  const contratosPend = contratosArr
    .filter(x => x.estado === 'pendiente_firma')
    .slice(0, 5)
    .map(x => ({
      id: x.id,
      numero: x.numero,
      cliente: x.cliente_nombre || '—',
      total: parseFloat(x.total_gtq) || 0,
    }));

  // Alertas combinadas (con id único para seguimiento de lectura)
  const alertas = [];
  if (vMant > 0) alertas.push({ id: `dash_mt_${vMant}`, icon: 'MT', msg: `${vMant} vehiculo${vMant > 1 ? 's' : ''} en mantenimiento`, nivel: 'warning' });
  if (rPend > 0) alertas.push({ id: `dash_rs_${rPend}`, icon: 'RS', msg: `${rPend} reserva${rPend > 1 ? 's' : ''} pendiente${rPend > 1 ? 's' : ''} de confirmacion`, nivel: 'info' });
  if (cotsPend.length > 0) alertas.push({ id: `dash_ct_cots_${cotsPend.length}`, icon: 'CT', msg: `${cotsPend.length} cotizacion${cotsPend.length > 1 ? 'es' : ''} esperando respuesta`, nivel: 'warning' });
  if (pagosPend.length > 0) alertas.push({ id: `dash_pg_${pagosPend.length}`, icon: 'PG', msg: `${pagosPend.length} pago${pagosPend.length > 1 ? 's' : ''} pendiente${pagosPend.length > 1 ? 's' : ''} de cobro`, nivel: 'danger' });
  if (contratosPend.length > 0) alertas.push({ id: `dash_ct_contratos_${contratosPend.length}`, icon: 'CT', msg: `${contratosPend.length} contrato${contratosPend.length > 1 ? 's' : ''} pendiente${contratosPend.length > 1 ? 's' : ''} de firma`, nivel: 'warning' });
  const urgCount = mantosCriticos.filter(x => x.tipo === 'urgente').length;
  if (urgCount > 0) alertas.push({
    id: `dash_ur_${urgCount}`, icon: 'UR', msg: `${urgCount} vehiculo${urgCount > 1 ? 's' : ''} requiere${urgCount === 1 ? '' : 'n'} mantenimiento URGENTE`, nivel: 'danger',
  });

  // Datos para gráfico mensual
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const chart = meses.map((mes, i) => ({
    mes,
    Ingresos: Math.round(m.filter(x => x.tipo === 'ingreso' && new Date(x.fecha).getMonth() === i).reduce((s, x) => s + (parseFloat(x.monto) || 0), 0)),
    Egresos: Math.round(m.filter(x => x.tipo === 'egreso' && new Date(x.fecha).getMonth() === i).reduce((s, x) => s + (parseFloat(x.monto) || 0), 0)),
  })).filter(x => x.Ingresos > 0 || x.Egresos > 0);

  // Estado de flota para gráfico de pastel
  const pie = [
    { name: 'Disponible', value: vDisp, color: '#00D4AA' },
    { name: 'Rentado', value: vRent, color: '#3B82F6' },
    { name: 'Mantenimiento', value: vMant, color: '#F59E0B' },
  ].filter(x => x.value > 0);

  return {
    vehiculos: v,
    reservas: r,
    clientes: Array.isArray(clientes) ? clientes : [],
    vDisp, vRent, vMant,
    rAct, rPend,
    ingresosHoy, ing, eg, saldo, facTot,
    mantosCriticos,
    pagosPend,
    cotsPend,
    contratosPend,
    proxSemana,
    alertas,
    chart,
    pie,
    totalVehiculos: v.length,
    totalClientes: Array.isArray(clientes) ? clientes.length : 0,
    totalReservas: r.length,
  };
}
