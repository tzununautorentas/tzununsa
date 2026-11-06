import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  crearParametrosPagoRecibido,
  obtenerPagoIdIntento,
  registrarPagoRecibido,
} from "./pagosCore.js";

const formulario = {
  fecha: "2026-10-31",
  cliente_nombre: "Cliente de prueba",
  monto: "125.50",
  metodo: "transferencia",
  referencia: "REF-001",
  concepto: "Pago de factura",
  reserva_id: "",
  factura_id: "22222222-2222-4222-8222-222222222222",
  cotizacion_id: "",
  cuenta_bancaria_id: "33333333-3333-4333-8333-333333333333",
  emisor_id: "44444444-4444-4444-8444-444444444444",
  notas: "Nota",
};

const pagoId = "11111111-1111-4111-8111-111111111111";

test("mapea el formulario al contrato RPC completo y con nombres exactos", () => {
  assert.deepEqual(crearParametrosPagoRecibido({
    pagoId,
    empresaId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    formulario,
  }), {
    p_pago_id: pagoId,
    p_empresa_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    p_fecha: "2026-10-31",
    p_cliente_nombre: "Cliente de prueba",
    p_monto: 125.5,
    p_metodo: "transferencia",
    p_referencia: "REF-001",
    p_concepto: "Pago de factura",
    p_reserva_id: null,
    p_factura_id: "22222222-2222-4222-8222-222222222222",
    p_cotizacion_id: null,
    p_cuenta_bancaria_id: "33333333-3333-4333-8333-333333333333",
    p_emisor_id: "44444444-4444-4444-8444-444444444444",
    p_notas: "Nota",
  });
});

test("reutiliza el UUID para reintentos idénticos y genera otro si cambian los datos", () => {
  const intento = { current: null };
  let secuencia = 0;
  const crearId = () => `pago-${++secuencia}`;

  assert.equal(obtenerPagoIdIntento(intento, { p_monto: 10 }, crearId), "pago-1");
  assert.equal(obtenerPagoIdIntento(intento, { p_monto: 10 }, crearId), "pago-1");
  assert.equal(obtenerPagoIdIntento(intento, { p_monto: 20 }, crearId), "pago-2");
  assert.equal(secuencia, 2);
});

test("acepta creado=true y devuelve el resultado transaccional", async () => {
  const respuesta = {
    creado: true,
    pago_id: pagoId,
    movimiento_id: "55555555-5555-4555-8555-555555555555",
    saldo_factura: 0,
  };
  let llamada;
  const resultado = await registrarPagoRecibido(async (...args) => {
    llamada = args;
    return { data: respuesta };
  }, { p_pago_id: pagoId });

  assert.deepEqual(llamada, ["api_registrar_pago_recibido", { p_pago_id: pagoId }]);
  assert.equal(resultado, respuesta);
});

test("acepta creado=false como respuesta idempotente sin duplicar", async () => {
  const respuesta = {
    creado: false,
    pago_id: pagoId,
    movimiento_id: "55555555-5555-4555-8555-555555555555",
    saldo_factura: 0,
  };
  assert.equal(
    await registrarPagoRecibido(async () => ({ data: respuesta }), { p_pago_id: pagoId }),
    respuesta
  );
});

test("propaga errores RPC como errores claros", async () => {
  await assert.rejects(
    registrarPagoRecibido(async () => ({ error: { mensaje: "Saldo insuficiente" } }), { p_pago_id: pagoId }),
    /Saldo insuficiente/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({ error: "Fallo HTTP de RPC" }), { p_pago_id: pagoId }),
    /Fallo HTTP de RPC/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({ data: { error: { message: "Factura anulada" } } }), { p_pago_id: pagoId }),
    /Factura anulada/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({ data: { error: "Cuenta inactiva" } }), { p_pago_id: pagoId }),
    /Cuenta inactiva/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({ data: { success: false, message: "Operación rechazada" } }), { p_pago_id: pagoId }),
    /Operación rechazada/
  );
});

test("el flujo de Pagos no hace escrituras REST secundarias", async () => {
  const fuente = await readFile(new URL("../pages/Pagos.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(fuente, /\bdb(?:Ins|Upd|Del)\s*\(/);
});

test("el flujo de Pagos bloquea un segundo envío mientras el primero está activo", async () => {
  const fuente = await readFile(new URL("../pages/Pagos.jsx", import.meta.url), "utf8");
  assert.match(fuente, /if \(savingRef\.current\) return;/);
  assert.match(fuente, /savingRef\.current = true;/);
  assert.match(fuente, /savingRef\.current = false;/);
});

test("rechaza respuestas incompletas o vinculadas a otro identificador", async () => {
  await assert.rejects(
    registrarPagoRecibido(async () => ({ data: { creado: true } }), { p_pago_id: pagoId }),
    /no confirma el pago/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({
      data: {
        creado: true,
        pago_id: "99999999-9999-4999-8999-999999999999",
        movimiento_id: "55555555-5555-4555-8555-555555555555",
      },
    }), { p_pago_id: pagoId }),
    /no coincide/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({
      data: { creado: true, pago_id: pagoId, movimiento_id: null },
    }), { p_pago_id: pagoId }),
    /no confirma el pago/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({
      data: { creado: false, pago_id: pagoId, movimiento_id: "inválido" },
    }), { p_pago_id: pagoId }),
    /identificador válido para el movimiento/
  );
  await assert.rejects(
    registrarPagoRecibido(async () => ({
      data: { creado: true, pago_id: pagoId, movimiento_id: "55555555-5555-4555-8555-555555555555" },
    }), { p_pago_id: "no-es-uuid" }),
    /no coincide/
  );
});
