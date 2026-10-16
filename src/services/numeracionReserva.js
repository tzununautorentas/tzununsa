// Resolucion del numero de reserva al convertir una cotizacion.
//
// SIEMPRE reserva el correlativo con el helper de numeracion atomica
// (`siguienteNumero` -> RPC `api_siguiente_numero`). Nunca deriva el numero
// desde `cot.numero` en el cliente.
//
// Si no hay empresa activa autorizada, o la numeracion falla, LANZA un error
// para que el llamador detenga la conversion y NO inserte la reserva.
export async function resolverNumeroReserva(siguienteNumero, empresaId) {
  if (empresaId === undefined || empresaId === null || empresaId === "") {
    throw new Error("La empresa activa todavía no está disponible. Espera unos segundos y vuelve a intentarlo");
  }
  const numero = await siguienteNumero("reservas", empresaId);
  if (typeof numero !== "string" || numero.trim() === "") {
    throw new Error("No se pudo asignar el número de reserva");
  }
  return numero;
}
