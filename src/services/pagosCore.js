export function crearParametrosPagoRecibido({ pagoId, empresaId, formulario }) {
  const parametros = {
    p_empresa_id: empresaId,
    p_fecha: formulario.fecha,
    p_cliente_nombre: formulario.cliente_nombre,
    p_monto: Number(formulario.monto),
    p_metodo: formulario.metodo,
    p_referencia: formulario.referencia || "",
    p_concepto: formulario.concepto || "",
    p_reserva_id: formulario.reserva_id || null,
    p_factura_id: formulario.factura_id || null,
    p_cotizacion_id: formulario.cotizacion_id || null,
    p_cuenta_bancaria_id: formulario.cuenta_bancaria_id || null,
    p_emisor_id: formulario.emisor_id || null,
    p_notas: formulario.notas || "",
  };
  return pagoId ? { p_pago_id: pagoId, ...parametros } : parametros;
}

export function obtenerPagoIdIntento(ref, parametros, crearId) {
  const key = JSON.stringify(parametros);
  if (ref.current?.key === key) return ref.current.pagoId;

  const pagoId = crearId();
  ref.current = { key, pagoId };
  return pagoId;
}

export async function registrarPagoRecibido(rpc, parametros) {
  const resultado = await rpc("api_registrar_pago_recibido", parametros);
  if (resultado?.error) {
    const mensaje = typeof resultado.error === "string"
      ? resultado.error
      : resultado.error.mensaje || resultado.error.message;
    throw new Error(mensaje || "No se pudo registrar el pago.");
  }

  const data = resultado?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("La respuesta del servidor no tiene el formato esperado para el pago.");
  }
  if (data.error) {
    const detalle = typeof data.error === "string"
      ? data.error
      : data.error.mensaje || data.error.message || data.message;
    throw new Error(detalle || "La operación de pago fue rechazada por el servidor.");
  }
  if (data.success === false || data.ok === false) {
    throw new Error(data.mensaje || data.message || "La operación de pago fue rechazada por el servidor.");
  }
  if (typeof data.creado !== "boolean" || !data.pago_id || !data.movimiento_id) {
    throw new Error("La respuesta del servidor no confirma el pago y su movimiento asociado.");
  }
  if (!esUuid(data.pago_id) || String(data.pago_id).toLowerCase() !== String(parametros.p_pago_id).toLowerCase()) {
    throw new Error("La respuesta del servidor no coincide con el identificador de este pago.");
  }
  if (!esUuid(data.movimiento_id)) {
    throw new Error("El servidor no devolvió un identificador válido para el movimiento bancario del pago.");
  }

  return data;
}

function esUuid(valor) {
  return typeof valor === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}
