// Motor de rutas — OSRM + cálculo manual
// Usa OSRM público para rutas automáticas, permite override manual

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// Haversine ≈ km entre dos coordenadas (para fallback)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Consulta OSRM para una ruta con múltiples puntos
// points: [[lat,lng], ...]
// Retorna { km, minutos } o null
export async function consultarOSRM(points) {
  if (points.length < 2) return null;
  const coords = points.map(p => `${p[1]},${p[0]}`).join(";");
  try {
    const r = await fetch(`${OSRM_BASE}/${coords}?overview=false`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.routes || j.routes.length === 0) return null;
    const ruta = j.routes[0];
    return {
      km: Math.round(ruta.distance / 100) / 10,       // redondeado a 0.1 km
      minutos: Math.round(ruta.duration / 60),
    };
  } catch {
    return null;
  }
}

// Calcula distancia total entre puntos usando haversine (fallback)
export function distanciaHaversine(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return Math.round(total * 10) / 10;
}

// Calcula combustible
export function calcularCombustible(km, kmPorGalon, precioGalon) {
  const kpg = parseFloat(kmPorGalon) || 1;
  const pg = parseFloat(precioGalon) || 0;
  const galones = km / kpg;
  return {
    galones: Math.round(galones * 100) / 100,
    costo: Math.round(galones * pg * 100) / 100,
  };
}

// Calcula días estimados según km (propuesta)
export function estimarDias(km) {
  if (km <= 150) return 1;
  if (km <= 350) return 2;
  if (km <= 600) return 3;
  return 4;
}

// Calcula hora de salida estimada
export function estimarHorario(minutos, horaSalida = "06:00") {
  const [h, m] = horaSalida.split(":").map(Number);
  const totalMin = h * 60 + m + minutos;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMinutes(totalMin);
  const dia = Math.floor(totalMin / 1440);
  const hr = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return { hora: `${hr}:${mn}`, diasExtra: dia };
}
