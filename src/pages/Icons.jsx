// src/components/Icons.jsx
// ══════════════════════════════════════════════════════════════════
// Libreria centralizada de iconos SVG — Tz'ununSA
// Uso: import { IconEdit, IconDelete } from '../components/Icons.jsx'
// Todos los iconos reciben: size (default 16), color (default "currentColor")
// ══════════════════════════════════════════════════════════════════

const ic = (paths, viewBox = "0 0 24 24") =>
  ({ size = 16, color = "currentColor", style = {} }) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}>
      {paths}
    </svg>
  );

// ─── Acciones generales ───────────────────────────────────────────
export const IconEdit = ic(<>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</>);

export const IconDelete = ic(<>
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</>);

export const IconSave = ic(<>
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
  <polyline points="17 21 17 13 7 13 7 21"/>
  <polyline points="7 3 7 8 15 8"/>
</>);

export const IconBack = ic(<>
  <line x1="19" y1="12" x2="5" y2="12"/>
  <polyline points="12 19 5 12 12 5"/>
</>);

export const IconPlus = ic(<>
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</>);

export const IconSearch = ic(<>
  <circle cx="11" cy="11" r="8"/>
  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
</>);

export const IconRefresh = ic(<>
  <polyline points="23 4 23 10 17 10"/>
  <polyline points="1 20 1 14 7 14"/>
  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
</>);

export const IconClose = ic(<>
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</>);

export const IconCheck = ic(<>
  <polyline points="20 6 9 17 4 12"/>
</>);

export const IconFilter = ic(<>
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
</>);

// ─── Exportacion ──────────────────────────────────────────────────
export const IconPDF = ic(<>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</>);

export const IconExcel = ic(<>
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <path d="M3 9h18M3 15h18M9 3v18"/>
</>);

export const IconPrint = ic(<>
  <polyline points="6 9 6 2 18 2 18 9"/>
  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
  <rect x="6" y="14" width="12" height="8"/>
</>);

// ─── Vehiculos / Flota ────────────────────────────────────────────
export const IconCar = ic(<>
  <rect x="1" y="3" width="15" height="13" rx="2"/>
  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
  <circle cx="5.5" cy="18.5" r="2.5"/>
  <circle cx="18.5" cy="18.5" r="2.5"/>
</>);

export const IconWrench = ic(<>
  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
</>);

export const IconKey = ic(<>
  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
</>);

// ─── Personas ─────────────────────────────────────────────────────
export const IconUser = ic(<>
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</>);

export const IconUsers = ic(<>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M23 21v-2a4 4 0 0 1-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</>);

export const IconEmployee = ic(<>
  <rect x="2" y="7" width="20" height="14" rx="2"/>
  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  <line x1="12" y1="12" x2="12" y2="16"/>
  <line x1="10" y1="14" x2="14" y2="14"/>
</>);

// ─── Finanzas ─────────────────────────────────────────────────────
export const IconMoney = ic(<>
  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
  <line x1="1" y1="10" x2="23" y2="10"/>
</>);

export const IconBank = ic(<>
  <line x1="3" y1="22" x2="21" y2="22"/>
  <line x1="6" y1="18" x2="6" y2="11"/>
  <line x1="10" y1="18" x2="10" y2="11"/>
  <line x1="14" y1="18" x2="14" y2="11"/>
  <line x1="18" y1="18" x2="18" y2="11"/>
  <polygon points="12 2 20 7 4 7"/>
</>);

export const IconCard = ic(<>
  <rect x="1" y="4" width="22" height="16" rx="2"/>
  <line x1="1" y1="10" x2="23" y2="10"/>
</>);

export const IconArrowUp = ic(<>
  <line x1="12" y1="19" x2="12" y2="5"/>
  <polyline points="5 12 12 5 19 12"/>
</>);

export const IconArrowDown = ic(<>
  <line x1="12" y1="5" x2="12" y2="19"/>
  <polyline points="19 12 12 19 5 12"/>
</>);

export const IconTrendUp = ic(<>
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
  <polyline points="17 6 23 6 23 12"/>
</>);

// ─── Documentos ───────────────────────────────────────────────────
export const IconDocument = ic(<>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <line x1="10" y1="9" x2="8" y2="9"/>
</>);

export const IconInvoice = ic(<>
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="12" y1="18" x2="12" y2="12"/>
  <line x1="9" y1="15" x2="15" y2="15"/>
</>);

export const IconUpload = ic(<>
  <polyline points="16 16 12 12 8 16"/>
  <line x1="12" y1="12" x2="12" y2="21"/>
  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
</>);

export const IconScan = ic(<>
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</>);

// ─── Navegacion y UI ──────────────────────────────────────────────
export const IconDashboard = ic(<>
  <rect x="3" y="3" width="7" height="7"/>
  <rect x="14" y="3" width="7" height="7"/>
  <rect x="14" y="14" width="7" height="7"/>
  <rect x="3" y="14" width="7" height="7"/>
</>);

export const IconCalendar = ic(<>
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8" y1="2" x2="8" y2="6"/>
  <line x1="3" y1="10" x2="21" y2="10"/>
</>);

export const IconSettings = ic(<>
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</>);

export const IconChevronRight = ic(<>
  <polyline points="9 18 15 12 9 6"/>
</>);

export const IconMenu = ic(<>
  <line x1="3" y1="12" x2="21" y2="12"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <line x1="3" y1="18" x2="21" y2="18"/>
</>);

export const IconAlert = ic(<>
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</>);

export const IconInfo = ic(<>
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="16" x2="12" y2="12"/>
  <line x1="12" y1="8" x2="12.01" y2="8"/>
</>);

export const IconTag = ic(<>
  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
  <line x1="7" y1="7" x2="7.01" y2="7"/>
</>);

export const IconList = ic(<>
  <line x1="8" y1="6" x2="21" y2="6"/>
  <line x1="8" y1="12" x2="21" y2="12"/>
  <line x1="8" y1="18" x2="21" y2="18"/>
  <line x1="3" y1="6" x2="3.01" y2="6"/>
  <line x1="3" y1="12" x2="3.01" y2="12"/>
  <line x1="3" y1="18" x2="3.01" y2="18"/>
</>);

export const IconApprove = ic(<>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
  <polyline points="22 4 12 14.01 9 11.01"/>
</>);

export const IconReject = ic(<>
  <circle cx="12" cy="12" r="10"/>
  <line x1="15" y1="9" x2="9" y2="15"/>
  <line x1="9" y1="9" x2="15" y2="15"/>
</>);

export const IconPause = ic(<>
  <rect x="6" y="4" width="4" height="16"/>
  <rect x="14" y="4" width="4" height="16"/>
</>);

export const IconProvider = ic(<>
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</>);

export const IconReport = ic(<>
  <line x1="18" y1="20" x2="18" y2="10"/>
  <line x1="12" y1="20" x2="12" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="14"/>
</>);

// ─── Componente Btn con icono (uso comun) ─────────────────────────
export function BtnIcon({ icon: Icon, label, onClick, variant = "ghost", size = 14, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...S_BTN(variant), display: "inline-flex", alignItems: "center", gap: 5, ...style }}>
      <Icon size={size} />
      {label && <span>{label}</span>}
    </button>
  );
}

const S_BTN = (v) => ({
  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
  fontSize: 12, fontWeight: 600, fontFamily: "inherit",
  border: v === "ghost" ? "1px solid #1E3A5F" : "none",
  background:
    v === "primary" ? "#00D4AA" : v === "danger" ? "#EF4444" :
    v === "blue"    ? "#3B82F6" : v === "green"  ? "#22C55E" :
    v === "warn"    ? "#F59E0B" : "#162032",
  color: (v === "primary" || v === "green") ? "#0A0F1E" : "#F1F5F9",
});
