// IMPORTADOR SAT GUATEMALA — Tz'ununSA
// Compatible con exportaciones de Agencia Virtual SAT Guatemala
// Soporta: facturas emitidas (ventas) y facturas recibidas (compras)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import { T, S, SB, H, fmt, today } from '../config.js';

async function api(path, opts = {}) {
  const { extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB}/rest/v1${path}`, {
    headers: { ...H, ...(extraHeaders || {}) }, ...rest,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || JSON.parse(text).hint || text; } catch {}
    throw new Error(msg);
  }
  try { return JSON.parse(text); } catch { return null; }
}

// ─── Cargar SheetJS desde CDN ─────────────────────────────────────
const cargarXLSX = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error('No se pudo cargar el lector de Excel'));
  document.head.appendChild(s);
});

// ─── Normalizar NIT ───────────────────────────────────────────────
const normNIT = (v) => String(v || '').trim().replace(/\s+/g, '').toUpperCase();

const normText = (v) => String(v || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

// ─── Normalizar fecha SAT (dd/mm/yyyy → yyyy-mm-dd) ───────────────
const normFecha = (v) => {
  if (!v) return today();
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) return s.slice(0, 10);
  const m1 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  const m2 = s.match(/^(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})$/);
  if (m2) return s.slice(0,10);
  return today();
};

// ─── Normalizar monto ─────────────────────────────────────────────
const normMonto = (v) => parseFloat(String(v||'0').replace(/[Q,\s]/g,'').replace(/[^0-9.-]/g,'')) || 0;

// ─── Buscar índice de columna por palabras clave ──────────────────
const findCol = (headers, claves) => {
  const h = headers.map(normText);
  for (const c of claves) {
    const needle = normText(c);
    const idx = h.findIndex(x => x === needle);
    if (idx >= 0) return idx;
  }
  for (const c of claves) {
    const needle = normText(c);
    const idx = h.findIndex(x => x.includes(needle));
    if (idx >= 0) return idx;
  }
  return -1;
};

const getVal = (row, idx) => idx >= 0 ? String(row[idx] || '').trim() : '';
const pick = (row, headers, claves) => getVal(row, findCol(headers, claves));

// ─── Detectar tipo de archivo SAT ─────────────────────────────────
// SAT exporta dos tipos:
// VENTAS  → columnas: NIT RECEPTOR, NOMBRE RECEPTOR, SERIE, NO. DOCUMENTO...
// COMPRAS → columnas: NIT EMISOR/VENDEDOR, NOMBRE EMISOR/VENDEDOR, SERIE, NO. DOCUMENTO...
const detectarTipo = (headers) => {
  const h = normText(headers.join(' '));
  if (h.includes('id del receptor') && h.includes('nit del emisor')) return 'ventas';
  if (h.includes('nit del emisor') && h.includes('nombre completo del emisor')) return 'compras';
  if (h.includes('receptor') || h.includes('comprador')) return 'ventas';
  if (h.includes('emisor')   || h.includes('vendedor') || h.includes('proveedor')) return 'compras';
  return 'desconocido';
};

// ─── Parsear fila de VENTAS (facturas emitidas) ───────────────────
const parsearVenta = (row, headers) => {
  const autorizacion = pick(row, headers, ['numero de autorizacion', 'autorizacion']);
  const nitRec    = normNIT(pick(row, headers, ['id del receptor', 'nit del receptor', 'nit receptor', 'nit comprador']));
  const nombreRec = pick(row, headers, ['nombre completo del receptor', 'nombre del receptor', 'nombre receptor', 'comprador', 'cliente']);
  const serie     = pick(row, headers, ['serie']);
  const numDoc    = pick(row, headers, ['numero del dte', 'numero dte', 'numero de dte', 'no. documento', 'numero documento']).replace(/^0+/,'');
  const fecha     = normFecha(pick(row, headers, ['fecha de emision', 'fecha emision', 'emision', 'fecha']));
  const granTotal = normMonto(pick(row, headers, ['gran total (moneda original)', 'gran total', 'total']));
  const iva       = normMonto(pick(row, headers, ['iva (monto de este impuesto)', 'iva']));
