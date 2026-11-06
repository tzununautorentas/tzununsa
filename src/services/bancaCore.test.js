import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  crearPayloadCuentaBancaria,
  crearParametrosMovimientoBancario,
  crearParametrosTransferencia,
  ejecutarRpcBancaria,
  ejecutarUnaVez,
  obtenerOperacionId,
  prepararDiagnosticoPostgres,
} from "./bancaCore.js";

const cuentaA = { id: "cuenta-a", moneda: "GTQ" };
const cuentaB = { id: "cuenta-b", moneda: "GTQ" };
const baseMovimiento = {
  fecha: "2026-10-31",
  tipo: "egreso",
  tipo_flujo: "OPERATIVA",
  descripcion: "Pago de servicio",
  monto: "250.75",
  referencia: "REF-01",
  categoria: "servicios",
  notas: "Detalle",
};

test("el payload administrativo de cuentas no escribe saldo_actual", () => {
  assert.deepEqual(crearPayloadCuentaBancaria({
    empresaId: "empresa-a",
    formulario: {
      banco: "Banco de prueba",
      saldo_inicial: "1250.50",
      saldo_actual: "999999",
    },
  }), {
    banco: "Banco de prueba",
    saldo_inicial: 1250.5,
    empresa_id: "empresa-a",
  });
});

test("mapea el movimiento manual al contrato RPC confirmado", () => {
  assert.deepEqual(crearParametrosMovimientoBancario({
    operacionId: "op-1",
    empresaId: "empresa-1",
    cuentaId: cuentaA.id,
    formulario: baseMovimiento,
  }), {
    p_operacion_id: "op-1",
    p_empresa_id: "empresa-1",
    p_cuenta_id: "cuenta-a",
    p_fecha: "2026-10-31",
    p_tipo: "egreso",
    p_descripcion: "Pago de servicio",
    p_monto: 250.75,
    p_referencia: "REF-01",
    p_categoria: "servicios",
    p_notas: "Detalle",
    p_origen_tipo: "manual",
    p_tipo_flujo: "OPERATIVA",
    p_factura_id: null,
    p_cotizacion_id: null,
  });
});

test("rechaza tipo o monto inválidos y flujo no admitido", () => {
  assert.throws(() => crearParametrosMovimientoBancario({
    operacionId: "op-1", empresaId: "empresa-1", cuentaId: cuentaA.id,
    formulario: { ...baseMovimiento, tipo: "ajuste" },
  }), /ingreso o egreso/);
  for (const monto of ["0", "-1", "abc", "Infinity"]) {
    assert.throws(() => crearParametrosMovimientoBancario({
      operacionId: "op-1", empresaId: "empresa-1", cuentaId: cuentaA.id,
      formulario: { ...baseMovimiento, monto },
    }), /mayor que cero/);
  }
  assert.throws(() => crearParametrosMovimientoBancario({
    operacionId: "op-1", empresaId: "empresa-1", cuentaId: cuentaA.id,
    formulario: { ...baseMovimiento, tipo_flujo: "OTRO" },
  }), /tipo de flujo válido/);
});

test("mapea transferencia con nombres y parámetros RPC exactos", () => {
  assert.deepEqual(crearParametrosTransferencia({
    operacionId: "op-transferencia",
    empresaId: "empresa-1",
    formulario: {
      cuenta_origen_id: cuentaA.id,
      cuenta_destino_id: cuentaB.id,
      fecha: "2026-10-31",
      monto: "100",
      descripcion: "Traspaso",
      referencia: "TR-1",
    },
    cuentas: [cuentaA, cuentaB],
  }), {
    p_operacion_id: "op-transferencia",
    p_empresa_id: "empresa-1",
    p_cuenta_origen_id: "cuenta-a",
    p_cuenta_destino_id: "cuenta-b",
    p_fecha: "2026-10-31",
    p_monto: 100,
    p_descripcion: "Traspaso",
    p_referencia: "TR-1",
  });
});

test("rechaza transferencia a la misma cuenta, cuentas ajenas o moneda distinta", () => {
  const formulario = {
    cuenta_origen_id: cuentaA.id,
    cuenta_destino_id: cuentaA.id,
    fecha: "2026-10-31",
    monto: "1",
    descripcion: "Traspaso",
  };
  assert.throws(() => crearParametrosTransferencia({
    operacionId: "op-1", empresaId: "empresa-1", formulario, cuentas: [cuentaA],
  }), /deben ser distintas/);
  assert.throws(() => crearParametrosTransferencia({
    operacionId: "op-1", empresaId: "empresa-1",
    formulario: { ...formulario, cuenta_destino_id: "otra" }, cuentas: [cuentaA],
  }), /no pertenecen/);
  assert.throws(() => crearParametrosTransferencia({
    operacionId: "op-1", empresaId: "empresa-1",
    formulario: { ...formulario, cuenta_destino_id: "cuenta-usd" },
    cuentas: [cuentaA, { id: "cuenta-usd", moneda: "USD" }],
  }), /distinta moneda/);
  assert.throws(() => crearParametrosTransferencia({
    operacionId: "op-1", empresaId: "empresa-1",
    formulario: { ...formulario, cuenta_destino_id: "cuenta-sin-moneda" },
    cuentas: [cuentaA, { id: "cuenta-sin-moneda" }],
  }), /determinar la moneda/);
});

test("maneja respuestas creado true, false y errores RPC", async () => {
  assert.deepEqual(await ejecutarRpcBancaria(async () => ({ data: { creado: true, movimiento_id: "mov-1" } }), "fn", {}), {
    creado: true, movimiento_id: "mov-1",
  });
  assert.equal((await ejecutarRpcBancaria(async () => ({ data: { creado: false, movimiento_id: "mov-1" } }), "fn", {})).creado, false);
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ error: { mensaje: "Cuenta inactiva" } }), "fn", {}),
    /Cuenta inactiva/
  );
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ error: "Fallo HTTP de RPC" }), "fn", {}),
    /Fallo HTTP de RPC/
  );
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ data: { error: { message: "Cuenta bloqueada" } } }), "fn", {}),
    /Cuenta bloqueada/
  );
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ data: { error: "Transferencia rechazada" } }), "fn", {}),
    /Transferencia rechazada/
  );
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ data: { success: false, message: "Operación fallida" } }), "fn", {}),
    /Operación fallida/
  );
  await assert.rejects(
    ejecutarRpcBancaria(async () => ({ data: null }), "fn", {}),
    /formato esperado/
  );
});

test("captura el diagnóstico Postgres sanitizado sin reemplazar el mensaje original", async () => {
  let diagnosticoCapturado;
  const mensajeOriginal = "permission denied for table movimientos_bancarios";
  const errorLanzado = await ejecutarRpcBancaria(
      async () => ({
        error: {
          mensaje: mensajeOriginal,
          postgresDiagnostics: {
            sqlstate: "42501",
            message: mensajeOriginal,
            detail: "No autorizado para usuario@example.com",
            hint: null,
            context: "PL/pgSQL function private.fn() line 42 at SQL statement",
            schema: "public",
            table: "movimientos_bancarios",
            routine: "aclcheck_error",
            line: 42,
          },
        },
      }),
      "api_crear_movimiento_bancario",
      { p_notas: "no debe registrarse" },
      diagnostico => { diagnosticoCapturado = diagnostico; }
    ).then(
      () => assert.fail("Se esperaba un error RPC"),
      error => error
    );
  assert.ok(errorLanzado instanceof Error);
  assert.equal(errorLanzado.message, mensajeOriginal);
  assert.equal(errorLanzado.cause.postgresDiagnostics.sqlstate, "42501");
  assert.equal(diagnosticoCapturado.sqlstate, "42501");
  assert.equal(diagnosticoCapturado.message, mensajeOriginal);
  assert.equal(diagnosticoCapturado.detail, "No autorizado para [REDACTED_EMAIL]");
  assert.equal(diagnosticoCapturado.context, "PL/pgSQL function private.fn() line 42 at SQL statement");
  assert.equal(diagnosticoCapturado.line, 42);
  assert.equal(JSON.stringify(diagnosticoCapturado).includes("no debe registrarse"), false);
});

test("redacta tokens, UUID y datos de contacto del diagnóstico", () => {
  const diagnostico = prepararDiagnosticoPostgres({
    message: "Bearer secret eyJabc.def.ghi",
    detail: "id=123e4567-e89b-12d3-a456-426614174000 tel +1 (555) 222-3333",
  });
  assert.equal(diagnostico.message, "Bearer [REDACTED] [REDACTED_TOKEN]");
  assert.equal(diagnostico.detail, "id=[REDACTED_UUID] tel [REDACTED_NUMBER]");
});

test("reutiliza el identificador de operación solo para datos idénticos", () => {
  const ref = { current: null };
  let secuencia = 0;
  const crearId = () => `operacion-${++secuencia}`;
  assert.equal(obtenerOperacionId(ref, { p_monto: 20 }, crearId), "operacion-1");
  assert.equal(obtenerOperacionId(ref, { p_monto: 20 }, crearId), "operacion-1");
  assert.equal(obtenerOperacionId(ref, { p_monto: 21 }, crearId), "operacion-2");
});

test("impide dos envíos simultáneos", async () => {
  const ref = { current: false };
  let liberar;
  const first = ejecutarUnaVez(ref, () => new Promise(resolve => { liberar = resolve; }));
  const second = await ejecutarUnaVez(ref, async () => {
    assert.fail("No debe iniciar el segundo envío");
  });
  assert.equal(second, false);
  liberar();
  assert.equal(await first, true);
  assert.equal(ref.current, false);
});

test("Banca no crea movimientos ni modifica saldos o movimientos por REST", async () => {
  const fuente = await readFile(new URL("../pages/Banca.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(fuente, /\bdbIns\s*\(\s*["']movimientos_bancarios/);
  assert.doesNotMatch(fuente, /\bdbUpd\s*\(\s*["']movimientos_bancarios/);
  assert.doesNotMatch(fuente, /\bdbDel\s*\(\s*["']movimientos_bancarios/);
  assert.doesNotMatch(fuente, /\bdbUpd\s*\(\s*["']cuentas_bancarias["'][^)]*saldo_actual/);
  assert.doesNotMatch(fuente, /recalcularSaldo/);
  const inicioImportador = fuente.indexOf("function ImportadorBancario");
  const finImportador = fuente.indexOf("export default function PageBanca");
  const importador = fuente.slice(inicioImportador, finImportador);
  assert.doesNotMatch(importador, /\bdbIns\s*\(/);
  assert.match(importador, /FASE 4\.3/);
  assert.match(fuente, /Anulación pendiente/);
  assert.match(fuente, /Edición no disponible/);
});
