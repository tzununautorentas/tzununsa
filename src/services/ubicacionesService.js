import { dbIns, dbGet, dbDel } from '../config.js';

export async function listarUbicaciones(empId) {
  if (!empId) return [];
  return dbGet("ubicaciones_personalizadas", `&empresa_id=eq.${empId}`);
}

export async function guardarUbicacion(data) {
  return dbIns("ubicaciones_personalizadas", data);
}

export async function eliminarUbicacion(id) {
  return dbDel("ubicaciones_personalizadas", id);
}
