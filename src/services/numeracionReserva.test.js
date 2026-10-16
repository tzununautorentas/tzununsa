import test from "node:test";
import assert from "node:assert/strict";
import { resolverNumeroReserva } from "./numeracionReserva.js";

test("usa el helper de numeracion con modulo 'reservas' y la empresa activa", async () => {
  const calls = [];
  const fakeSiguienteNumero = async (tabla, empId) => {
    calls.push([tabla, empId]);
    return "RES-000005";
  };
  const numero = await resolverNumeroReserva(fakeSiguienteNumero, "emp-1");
  assert.equal(numero, "RES-000005");
  assert.deepEqual(calls, [["reservas", "emp-1"]]);
});

test("se detiene (lanza) si la numeracion falla, sin devolver numero", async () => {
  const fakeSiguienteNumero = async () => {
    throw new Error("Sin autorizacion para asignar correlativos de esta empresa");
  };
  await assert.rejects(
    () => resolverNumeroReserva(fakeSiguienteNumero, "emp-1"),
    /Sin autorizacion para asignar correlativos/
  );
});

test("se detiene si no hay empresa activa y NO llama al helper", async () => {
  let called = false;
  const fakeSiguienteNumero = async () => {
    called = true;
    return "RES-000001";
  };
  await assert.rejects(
    () => resolverNumeroReserva(fakeSiguienteNumero, null),
    /empresa activa/
  );
  assert.equal(called, false);
});

test("se detiene si el helper no devuelve un correlativo valido", async () => {
  const fakeSiguienteNumero = async () => "";
  await assert.rejects(
    () => resolverNumeroReserva(fakeSiguienteNumero, "emp-1"),
    /No se pudo asignar el número de reserva/
  );
});
