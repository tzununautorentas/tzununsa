import React, { useState } from "react";
import { T, S } from "../config.js";
import { Empty } from "../components/shared.jsx";

export default function PageBanca({ showToast, empId }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.acc, marginBottom: 16 }}>La Banca</div>
      <Empty icon="🏦" msg="Módulo de Banca (Estructura base generada)" />
    </div>
  );
}
