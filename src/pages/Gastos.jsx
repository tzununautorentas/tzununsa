import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, S, SB, H, fmt, fmtD, dbGet, dbIns, dbUpd, dbDel, today, CAT_GASTO } from '../config.js';
import { Spinner, Empty, Fld, CatBadge } from '../components/shared.jsx';
import ImportadorSAT from '../components/ImportadorSAT.jsx';

// ─── Estados del gasto ────────────────────────────────────────────
const ESTADOS = {
  pendiente:     { c: T.mut,   bg: "#1E293B",  l: "Pendiente"     },
  en_revision:   { c: T.blue,  bg: T.blueDim,  l: "En revision"   },
  aprobado:      { c: T.acc,   bg: T.accDim,   l: "Aprobado"      },
  rechazado:     { c: T.red,   bg: T.redDim,   l: "Rechazado"     },
  contabilizado: { c: T.green, bg: T.greenDim, l: "Contabilizado" },
};

const CC = {
  combustible:"#F59E0B", mantenimiento:"#3B82F6", seguros:"#A855F7",
  salarios:"#22C55E", impuestos:"#EF4444", servicios:"#00D4AA",
  llantas:"#EF4444", repuestos:"#3B82F6", hospedaje:"#8B5CF6",
  alimentacion:"#F97316", peajes:"#6B7280", oficina:"#64748B", otros:"#94A3B8",
};

// Mapa categoria → codigo de cuenta contable (catalogo Tz'unun)
const CATEGORIA_CUENTA = {
  combustible: "5.1", mantenimiento: "5.2", llantas: "5.3",
  repuestos: "5.3", seguros: "5.4", salarios: "6.1",
  servicios: "6.4", oficina: "6.5", papeleria: "6.5",
  alimentacion: "6.7", hospedaje: "6.7", impuestos: "6.9",
  peajes: "6.11", otros: "6.11",
};

const EF = {
  fecha: today(), categoria: "combustible", descripcion: "",
  proveedor: "", proveedor_id: "", proveedor_nit: "",
  numero_factura: "", subtotal: "", impuestos: "", total: "",
  metodo_pago: "efectivo", referencia: "", estado: "pendiente",
  empleado_nombre: "", vehiculo_id: "", vehiculo_nombre: "",
  reserva_id: "", notas: "", archivo_url: "", archivo_tipo: "", moneda: "GTQ",
};

// ─── API helper ───────────────────────────────────────────────────
async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) }, ...rest,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// OCR GRATUITO — Tesseract.js + PDF.js (sin API key)
// ═══════════════════════════════════════════════════════════════════
const cargarScript = (url) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
  const s = document.createElement('script');
  s.src = url; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

const parsearTextoFactura = (texto) => {
  const result = { proveedor: '', proveedor_nit: '', fecha: '', numero_factura: '', subtotal: 0, impuestos: 0, total: 0, descripcion: '' };

  // NIT Guatemala: XXXXXXXX-X o XXXXXXXXX
  const nitMatch = texto.match(/(?:nit|n\.i\.t\.?)[:\s]*([0-9]{5,8}[-–]?[0-9kK])/i);
  if (nitMatch) result.proveedor_nit = nitMatch[1].replace('–', '-');

  // Fecha: dd/mm/yyyy o dd-mm-yyyy o yyyy-mm-dd
  const f1 = texto.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
  const f2 = texto.match(/(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/);
  if (f1) result.fecha = `${f1[3]}-${f1[2].padStart(2,'0')}-${f1[1].padStart(2,'0')}`;
  else if (f2) result.fecha = `${f2[1]}-${f2[2]}-${f2[3]}`;

  // Numero de factura / serie
  const facMatch = texto.match(/(?:factura|serie|doc|no\.?|numero)[:\s#]*([A-Z0-9\-]{4,20})/i);
  if (facMatch) result.numero_factura = facMatch[1].trim();

  // Total
  const totMatch = texto.match(/(?:total\s*(?:a\s*pagar)?|gran\s*total)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (totMatch) result.total = parseFloat(totMatch[1].replace(/,/g, '')) || 0;

  // IVA / impuesto
  const ivaMatch = texto.match(/(?:iva|impuesto(?:\s*12%)?)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (ivaMatch) result.impuestos = parseFloat(ivaMatch[1].replace(/,/g, '')) || 0;

  // Subtotal
  const subMatch = texto.match(/(?:subtotal|sub[\s\-]total)[:\s]*Q?\s*([\d,]+\.?\d{0,2})/i);
  if (subMatch) result.subtotal = parseFloat(subMatch[1].replace(/,/g, '')) || 0;
  else if (result.total && result.impuestos) result.subtotal = result.total - result.impuestos;

  // Descripcion (primeras lineas utiles)
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 4 && l.length < 80);
  result.descripcion = lineas.slice(0, 2).join(' — ').slice(0, 100);

  return result;
};

const escanearImagen = async (base64, setProgreso) => {
  try {
    setProgreso("Cargando motor OCR...");
