import React, { useRef, useEffect } from 'react';

export default function MapaRuta({ points, geometria, style }) {
  const mapRef = useRef(null);
  const instRef = useRef(null);

  useEffect(() => {
    if (instRef.current) return;
    if (typeof L === 'undefined') return;
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    instRef.current = map;
  }, []);

  useEffect(() => {
    const map = instRef.current;
    if (!map) return;
    map.eachLayer(l => {
      if (l._isTzMarker || l._isTzRoute) map.removeLayer(l);
    });

    if (!points || points.length === 0) return;

    const bounds = [];
    const colores = ['#22C55E', '#3B82F6', '#EF4444'];

    points.forEach((p, i) => {
      const color = i === 0 ? colores[0] : i === points.length - 1 ? colores[2] : colores[1];
      const label = i === 0 ? 'O' : i === points.length - 1 ? 'D' : String(i + 1);
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};color:#fff;
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;border:2px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          cursor:default;
        ">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const mk = L.marker([p.lat, p.lng], { icon }).addTo(map);
      mk._isTzMarker = true;
      if (p.nombre) mk.bindTooltip(p.nombre, { direction: 'top', offset: [0, -16] });
      bounds.push([p.lat, p.lng]);
    });

    if (geometria?.coordinates?.length >= 2) {
      const coords = geometria.coordinates.map(c => [c[1], c[0]]);
      const poly = L.polyline(coords, {
        color: '#3B82F6', weight: 4, opacity: 0.8,
      }).addTo(map);
      poly._isTzRoute = true;
      coords.forEach(c => bounds.push(c));
    }

    if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, geometria]);

  return <div ref={mapRef} style={{ height: 300, borderRadius: 12, ...style }} />;
}
