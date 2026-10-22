import React, { useState, useEffect, useRef } from "react";
import { T, S } from "../config.js";
import { validarNuevaPassword, PASSWORD_MIN, limpiarUrlRecuperacion } from "../services/recuperacion.js";

// ─── Pantalla pública de restablecimiento de contraseña ───────────
// Recibe el enlace de recuperación de Supabase Auth. El cliente usa
// `detectSessionInUrl: false`, por lo que esta pantalla procesa el enlace
// EXPLÍCITAMENTE (procesarEnlace) para crear la sesión temporal de recuperación
// y solo permite cambiar la clave si esa sesión existe.
//
// Props:
//   onDone()            -> volver al inicio de sesión (estado seguro)
//   procesarEnlace()    -> () => Promise<{ok}|{error:{code}}>  procesa la URL
//   hasSession()        -> () => Promise<boolean>   sesión de recuperación válida
//   updatePassword(pwd) -> ({ user } | { error })
export default function ResetPassword({ onDone, procesarEnlace, hasSession, updatePassword }) {
  const [estado, setEstado] = useState("verificando"); // verificando|lista|aprobado|error
  const [motivo, setMotivo] = useState("");             // enlace_vencido|enlace_invalido|sin_sesion
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const montado = useRef(true);

  // Elimina tokens/parámetros sensibles de la URL, dejando solo el path.
  function limpiarYReemplazar() {
    try {
      const limpia = limpiarUrlRecuperacion(window.location.hash, window.location.search, window.location.pathname);
      window.history.replaceState(null, "", limpia);
    } catch {}
  }

  useEffect(() => {
    montado.current = true;
    (async () => {
      try {
        // 1) Procesar el enlace (hash implicit o ?code PKCE) explícitamente.
        let res = { ok: false, error: { code: "SIN_ENLACE" } };
        try { res = await procesarEnlace(); } catch { res = { error: { code: "ERROR" } }; }

        // 2) Cualquier error de enlace se traduce a estado/motivo claros.
        if (res && res.error && res.error.code !== "SIN_ENLACE") {
          const c = res.error.code;
          if (!montado.current) return;
          setEstado("error");
          setMotivo(c === "ENLACE_VENCIDO" ? "enlace_vencido" : "enlace_invalido");
          limpiarYReemplazar();
          return;
        }

        // 3) La verdad final la da la sesión real (no asumir por el hash).
        const ok = await Promise.resolve(hasSession && hasSession()) === true;
        if (!montado.current) return;
        if (ok) setEstado("lista");
        else { setEstado("error"); setMotivo("sin_sesion"); }
        limpiarYReemplazar();
      } catch {
        if (!montado.current) return;
        setEstado("error"); setMotivo("sin_sesion"); limpiarYReemplazar();
      }
    })();
    return () => { montado.current = false; };
  }, [hasSession, procesarEnlace]);

  const guardar = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    const v = validarNuevaPassword(pwd, confirm);
    if (!v.ok) { setError(v.error); return; }
    // Bloquea el cambio si no hay sesión de recuperación válida.
    let okSesion = false;
    try { okSesion = await (hasSession && hasSession()) === true; } catch { okSesion = false; }
    if (!okSesion) { setEstado("error"); setMotivo("sin_sesion"); return; }
    setSaving(true);
    const res = await updatePassword(pwd);
    setSaving(false);
    if (res?.error) {
      const msg = String(res.error).toLowerCase();
      if (msg.includes("expired") || msg.includes("expir")) {
        setEstado("error"); setMotivo("enlace_vencido");
      } else if (msg.includes("session") || msg.includes("jwt")) {
        setEstado("error"); setMotivo("sin_sesion");
      } else {
        setError("No se pudo actualizar la contraseña. Intenta nuevamente.");
      }
      return;
    }
    // No conservar la contraseña en memoria tras el éxito.
    setPwd(""); setConfirm("");
    setEstado("aprobado");
    limpiarYReemplazar();
  };

  const irALogin = () => { try { onDone && onDone(); } catch {} };

  const msgMotivo = {
    enlace_vencido: "El enlace de recuperación venció. Solicita uno nuevo desde la pantalla de inicio de sesión.",
    enlace_invalido: "El enlace de recuperación no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.",
    sin_sesion: "No hay una sesión de recuperación válida. Abre el enlace del correo o solicita uno nuevo.",
  }[motivo] || "No se pudo validar el enlace de recuperación.";

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/icons/Logo-Tzunun-Autorentas_.png" alt="Tz'unun AutoRentas"
            style={{ width: "100%", maxWidth: 240, height: "auto", margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontSize: 13, color: T.sub }}>Restablecer contraseña</div>
        </div>

        {estado === "verificando" && (
          <div style={{ ...S.card, textAlign: "center", color: T.sub, fontSize: 13 }}>
            Verificando el enlace…
          </div>
        )}

        {estado === "error" && (
          <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red }}>
              {msgMotivo}
            </div>
            <button type="button" onClick={irALogin} style={{ ...S.btn("primary"), padding: 14, fontSize: 14 }}>
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {estado === "lista" && (
          <form onSubmit={guardar} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={S.lbl}>NUEVA CONTRASEÑA</label>
              <input style={S.inp} type="password" value={pwd}
                onChange={e => setPwd(e.target.value)} placeholder="••••••••" autoFocus autoComplete="new-password" />
            </div>
            <div>
              <label style={S.lbl}>CONFIRMAR CONTRASEÑA</label>
              <input style={S.inp} type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div style={{ fontSize: 11, color: T.mut }}>
              Mínimo {PASSWORD_MIN} caracteres.
            </div>
            {error && (
              <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={saving} style={{ ...S.btn("primary"), padding: 14, fontSize: 14 }}>
              {saving ? "Guardando…" : "Cambiar contraseña"}
            </button>
            <button type="button" onClick={irALogin} style={{ ...S.btn("ghost"), fontSize: 12 }}>
              Cancelar
            </button>
          </form>
        )}

        {estado === "aprobado" && (
          <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.green }}>
              Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
            </div>
            <button type="button" onClick={irALogin} style={{ ...S.btn("primary"), padding: 14, fontSize: 14 }}>
              Ir al inicio de sesión
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.mut }}>
          tzununsa.vercel.app
        </div>
      </div>
    </div>
  );
}
