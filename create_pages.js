const fs = require('fs');
const path = require('path');

const pages = [
  'Dashboard', 'Calculadora', 'Flota', 'Mantenimiento', 'Clientes',
  'Facturacion', 'Banca', 'Gastos', 'Contabilidad', 'Reportes', 'Proveedores'
];

const dir = path.join(__dirname, 'src', 'pages');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

pages.forEach(p => {
  const content = `import React, { useState, useEffect } from "react";
import { T, S, dbGet } from "../config.js";
import { Toast, Spinner, Empty, Fld } from "../components/shared.jsx";

export default function Page${p}({ showToast, empId }) {
  const [loading, setLoading] = useState(false);

  return (
    <div style={S.card}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.acc, marginBottom: 16 }}>${p}</div>
      <div style={{ color: T.sub, fontSize: 13 }}>
        Módulo de ${p} (Estructura base generada).
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${p}.jsx`), content, 'utf8');
});

console.log('Páginas creadas.');
