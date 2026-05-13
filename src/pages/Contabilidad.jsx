import React from 'react';
import { T } from '../config.js';
export default function PageContabilidad({ showToast }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:60, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
      <div style={{ fontSize:18, fontWeight:700, color:T.txt, marginBottom:8 }}>Contabilidad</div>
      <div style={{ fontSize:14, color:T.sub }}>Módulo en desarrollo.</div>
    </div>
  );
}
