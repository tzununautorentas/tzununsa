export const TIPOS_FLUJO_BANCARIO = ["OPERATIVA", "INVERSION", "FINANCIAMIENTO"];

export function crearPayloadCuentaBancaria({ empresaId, formulario }) {
  const { saldo_actual: _saldoActual, ...datosAdministrativos } = formulario;
  return {
    ...datosAdministrativos,
    empresa_id: empresaId,
    saldo_inicial: Number(formulario.saldo_inicial) || 0,
  };
}

function validarMonto(monto) {
  const valor = Number(monto);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("El monto debe ser un número mayor que cero.");
  }
  return valor;
}

export function crearParametrosMovimientoBancario({ operacionId, empresaId, cuentaId, formulario }) {
  if (!["ingreso", "egreso"].includes(formulario.tipo)) {
    throw new Error("El tipo de movimiento debe ser ingreso o egreso.");
  }
  if (!TIPOS_FLUJO_BANCARIO.includes(formulario.tipo_flujo)) {
    throw new Error("Selecciona un tipo de flujo válido.");
  }
  if (!empresaId || !cuentaId) {
    throw new Error("La empresa y la cuenta activa son necesarias para registrar el movimiento.");
  }
  if (!formulario.descripcion?.trim()) {
    throw new Error("La descripción del movimiento es obligatoria.");
  }

  return {
    p_operacion_id: operacionId,
    p_empresa_id: empresaId,
    p_cuenta_id: cuentaId,
    p_fecha: formulario.fecha,
    p_tipo: formulario.tipo,
    p_descripcion: formulario.descripcion.trim(),
    p_monto: validarMonto(formulario.monto),
    p_referencia: formulario.referencia || "",
    p_categoria: formulario.categoria || "otros",
    p_notas: formulario.notas || "",
    p_origen_tipo: "manual",
    p_tipo_flujo: formulario.tipo_flujo,
    p_factura_id: null,
    p_cotizacion_id: null,
  };
}

export function crearParametrosTransferencia({ operacionId, empresaId, formulario, cuentas }) {
  if (!empresaId) throw new Error("No hay una empresa autorizada activa para registrar la transferencia.");
  if (!formulario.cuenta_origen_id || !formulario.cuenta_destino_id) {
    throw new Error("Selecciona las cuentas de origen y destino.");
  }
  if (formulario.cuenta_origen_id === formulario.cuenta_destino_id) {
    throw new Error("La cuenta de origen y destino deben ser distintas.");
  }
  const origen = cuentas.find(cuenta => cuenta.id === formulario.cuenta_origen_id);
  const destino = cuentas.find(cuenta => cuenta.id === formulario.cuenta_destino_id);
  if (!origen || !destino) {
    throw new Error("Las cuentas seleccionadas no pertenecen a la empresa activa.");
  }
  if (!origen.moneda || !destino.moneda) {
    throw new Error("No se pudo determinar la moneda de ambas cuentas.");
  }
  if (origen.moneda.toUpperCase() !== destino.moneda.toUpperCase()) {
    throw new Error("No se pueden transferir fondos entre cuentas de distinta moneda.");
  }
  if (!formulario.descripcion?.trim()) {
    throw new Error("La descripción de la transferencia es obligatoria.");
  }

  return {
    p_operacion_id: operacionId,
    p_empresa_id: empresaId,
    p_cuenta_origen_id: formulario.cuenta_origen_id,
    p_cuenta_destino_id: formulario.cuenta_destino_id,
    p_fecha: formulario.fecha,
    p_monto: validarMonto(formulario.monto),
    p_descripcion: formulario.descripcion.trim(),
    p_referencia: formulario.referencia || "",
  };
}

export function obtenerOperacionId(ref, parametros, crearId) {
  const key = JSON.stringify(parametros);
  if (ref.current?.key === key) return ref.current.operacionId;

  const operacionId = crearId();
  ref.current = { key, operacionId };
  return operacionId;
}

function redactarTextoDiagnostico(valor) {
  return String(valor)
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi, "[REDACTED_UUID]")
    .replace(/\+?\d(?:[\d(). -]{6,}\d)/g, "[REDACTED_NUMBER]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1[REDACTED]");
}

export function prepararDiagnosticoPostgres(diagnostico) {
  if (!diagnostico || typeof diagnostico !== "object") return null;

  const campos = [
    "sqlstate", "message", "detail", "hint", "context",
    "schema", "table", "column", "constraint", "routine", "line", "file",
  ];
  return Object.fromEntries(campos.map(campo => {
    const valor = diagnostico[campo];
    return [
      campo,
      typeof valor === "string" ? redactarTextoDiagnostico(valor) : valor ?? null,
    ];
  }));
}

export async function ejecutarRpcBancaria(rpc, nombreFuncion, parametros, onRpcError) {
  const resultado = await rpc(nombreFuncion, parametros);
  if (resultado?.error) {
    onRpcError?.(prepararDiagnosticoPostgres(resultado.error.postgresDiagnostics));
    const mensaje = typeof resultado.error === "string"
      ? resultado.error
      : resultado.error.mensaje || resultado.error.message;
    throw new Error(
      mensaje || "No se pudo completar la operación bancaria.",
      { cause: resultado.error }
    );
  }

  const data = resultado?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("La respuesta del servidor no tiene el formato esperado para la operación bancaria.");
  }
  if (data.error) {
    const detalle = typeof data.error === "string"
      ? data.error
      : data.error.mensaje || data.error.message || data.message;
    throw new Error(detalle || "La operación bancaria fue rechazada por el servidor.");
  }
  if (data.success === false || data.ok === false) {
    throw new Error(data.mensaje || data.message || "La operación bancaria fue rechazada por el servidor.");
  }
  if (typeof data.creado !== "boolean") {
    throw new Error("La respuesta del servidor no tiene el formato esperado para la operación bancaria.");
  }
  return data;
}

export async function ejecutarUnaVez(ref, operacion) {
  if (ref.current) return false;
  ref.current = true;
  try {
    await operacion();
    return true;
  } finally {
    ref.current = false;
  }
}
