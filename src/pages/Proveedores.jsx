import React, { useState } from "react";
import { T, S } from "../config.js";
import { Empty } from "../components/shared.jsx";

export default function PageProveedores({ showToast, empId }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.acc, marginBottom: 16 }}>Proveedores</div>
      <Empty icon="🏭" msg="Módulo de Proveedores (Estructura base generada)" />
    </div>
  );
}

