import test from "node:test";
import assert from "node:assert/strict";
import {
  esEmailValido,
  validarNuevaPassword,
  mensajeSolicitudNeutral,
  detectarTipoEnlace,
  limpiarUrlRecuperacion,
  PASSWORD_MIN,
  RECOVERY_PATH,
} from "./recuperacion.js";

// ─── Validación de correo ────────────────────────────────────────
test("acepta correos con formato razonable", () => {
  assert.equal(esEmailValido("usuario@empresa.com"), true);
  assert.equal(esEmailValido("  a.b+c@sub.dominio.gt "), true);
});

test("rechaza correos inválidos o vacíos", () => {
  assert.equal(esEmailValido(""), false);
  assert.equal(esEmailValido("   "), false);
  assert.equal(esEmailValido("sin-arroba.com"), false);
  assert.equal(esEmailValido("a@b"), false);
  assert.equal(esEmailValido("a@b."), false);
  assert.equal(esEmailValido("@empresa.com"), false);
  assert.equal(esEmailValido("usuario@"), false);
});

// ─── Validación de contraseña ────────────────────────────────────
test("exige que la contraseña cumpla el mínimo", () => {
  const corta = validarNuevaPassword("123", "123");
  assert.equal(corta.ok, false);
  assert.match(corta.error, new RegExp(String(PASSWORD_MIN)));
});

test("rechaza contraseñas que no coinciden", () => {
  const r = validarNuevaPassword("abcdefgh", "abcdefgX");
  assert.equal(r.ok, false);
  assert.match(r.error, /coinciden/i);
});

test("rechaza contraseña vacía", () => {
  const r = validarNuevaPassword("", "");
  assert.equal(r.ok, false);
  assert.ok(r.error.length > 0);
});

test("acepta contraseñas válidas y coincidentes", () => {
  const r = validarNuevaPassword("claveSegura1", "claveSegura1");
  assert.equal(r.ok, true);
  assert.equal(r.error, "");
});

// ─── Mensaje neutral ─────────────────────────────────────────────
test("el mensaje de solicitud es neutral (no revela si el correo existe)", () => {
  const msg = mensajeSolicitudNeutral();
  assert.match(msg, /si el correo está registrado/i);
  assert.doesNotMatch(msg, /no existe|no está registrado|inexistente/i);
});

// ─── Detección de enlace ─────────────────────────────────────────
test("detecta el tipo de enlace de recuperación en el fragmento", () => {
  const r = detectarTipoEnlace("#access_token=abc&type=recovery&refresh_token=def", "");
  assert.equal(r.type, "recovery");
  assert.equal(r.hasAccessToken, true);
});

test("detecta el flujo PKCE con code en el query", () => {
  const r = detectarTipoEnlace("", "?code=xyz123");
  assert.equal(r.hasCode, true);
});

test("detecta enlaces con error/expiración", () => {
  const r = detectarTipoEnlace("#error=access_denied&error_code=otp_expired", "");
  assert.equal(r.error, "access_denied");
  assert.equal(r.errorCode, "otp_expired");
});

test("sin parámetros no detecta nada", () => {
  const r = detectarTipoEnlace("", "");
  assert.equal(r.type, "");
  assert.equal(r.hasCode, false);
  assert.equal(r.hasAccessToken, false);
});

// ─── Limpieza de URL ─────────────────────────────────────────────
test("limpiarUrlRecuperacion elimina tokens y deja solo el path", () => {
  assert.equal(
    limpiarUrlRecuperacion("#access_token=secreto&type=recovery", "?code=secreto", "/reset-password"),
    "/reset-password"
  );
});

test("la ruta de recuperación es pública y estable", () => {
  assert.equal(RECOVERY_PATH, "/reset-password");
});
