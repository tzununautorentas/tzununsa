// Motor de rutas — OSRM + Nominatim + cálculo manual
// Usa OSRM público para rutas automáticas y Nominatim para geocodificación

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

// Ubicación predefinida de la empresa
export const MI_UBICACION = {
  nombre: "Tz'unun AutoRentas",
  direccion: "2da. Av. 0-68 Apto. A, Col. Bran, Zona 3, Guatemala",
  lat: 14.6328,
  lng: -90.5069,
};

// Geocodificación usando Nominatim (OpenStreetMap)
// Busca direcciones, lugares, hoteles, etc. y devuelve coordenadas
let ultimaGeo = 0;
export async function geocodificar(query) {
  if (!query?.trim()) return null;
  // Rate limit: 1 req/s
  const ahora = Date.now();
  if (ahora - ultimaGeo < 1100) await new Promise(r => setTimeout(r, 1100 - (ahora - ultimaGeo)));
  ultimaGeo = Date.now();
  try {
    const r = await fetch(`${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=5`, {
      headers: { "User-Agent": "TzununAutoRentas/1.0" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    return j.map(p => ({
      nombre: p.display_name?.split(",")[0]?.trim() || query,
      direccion: p.display_name || query,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lon),
    }));
  } catch {
    return null;
  }
}

// Reverse geocoding: coordenadas → dirección (Nominatim /reverse)
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;
  const ahora = Date.now();
  if (ahora - ultimaGeo < 1100) await new Promise(r => setTimeout(r, 1100 - (ahora - ultimaGeo)));
  ultimaGeo = Date.now();
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { "User-Agent": "TzununAutoRentas/1.0" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.error) return null;
    const nombre = j.name || j.address?.road || j.address?.town || j.address?.city || j.display_name?.split(",")[0]?.trim() || `${lat}, ${lng}`;
    return {
      nombre,
      direccion: j.display_name || nombre,
      lat: parseFloat(j.lat) || lat,
      lng: parseFloat(j.lon) || lng,
    };
  } catch {
    return null;
  }
}

// Detecta si un texto parece coordenadas (ej: "14.6328, -90.5069" o "14.6328 -90.5069")
const RE_COORDS = /^\s*([+-]?\d+\.?\d*)\s*[,;\s]+\s*([+-]?\d+\.?\d*)\s*$/;
export function esCoordenadas(texto) {
  if (!texto?.trim()) return null;
  const m = texto.trim().match(RE_COORDS);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

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
// alternativas: número de rutas alternativas a solicitar (0 = solo la principal)
// Retorna { routes: [{ km, minutos, geometria, nombre }], selected: 0 } o null
export async function consultarOSRM(points, alternativas = 0) {
  if (points.length < 2) return null;
  const coords = points.map(p => `${p[1]},${p[0]}`).join(";");
  try {
    const altParam = alternativas > 0 ? `&alternatives=${Math.min(alternativas, 3)}` : "";
    const r = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson${altParam}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.routes || j.routes.length === 0) return null;
    const routes = j.routes.map((ruta, i) => ({
      km: Math.round(ruta.distance / 100) / 10,
      minutos: Math.round(ruta.duration / 60),
      geometria: ruta.geometry,
      nombre: i === 0 ? "Principal" : `Alternativa ${i}`,
    }));
    return { routes, selected: 0 };
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
