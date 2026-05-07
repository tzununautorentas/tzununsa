import React, { useState } from "react";
import { T, S } from "../config.js";
import { Empty } from "../components/shared.jsx";

export default function PageFlota({ showToast, empId }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.acc, marginBottom: 16 }}>Flota</div>
      <Empty icon="🚗" msg="Módulo de Flota (Estructura base generada)" />
    </div>
  );
}
