import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const DARK = {
  name: 'dark',
  bg:      '#0A0F1E',
  surf:    '#111827',
  card:    '#162032',
  bord:    '#1E3A5F',

  acc:     '#00D4AA', accD:    '#00D4AA22', accDim:    '#00D4AA22',
  sec:     '#F59E0B', secD:    '#F59E0B22', secDim:    '#F59E0B22',
  red:     '#EF4444', redD:    '#EF444422', redDim:    '#EF444422',
  blue:    '#3B82F6', blueD:   '#3B82F622', blueDim:   '#3B82F622',
  purple:  '#A855F7', purpleD: '#A855F722', purpleDim: '#A855F722',
  green:   '#22C55E', greenD:  '#22C55E22', greenDim:  '#22C55E22',

  txt: '#F1F5F9',
  mut: '#64748B',
  sub: '#94A3B8',

  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.75)',
  splashBg: '#0A0F1E',
};

export const LIGHT = {
  name: 'light',
  bg:      '#F1F5F9',
  surf:    '#FFFFFF',
  card:    '#FFFFFF',
  bord:    '#E2E8F0',

  acc:     '#0D9488', accD:    '#0D948818', accDim:    '#0D948818',
  sec:     '#D97706', secD:    '#D9770618', secDim:    '#D9770618',
  red:     '#DC2626', redD:    '#DC262618', redDim:    '#DC262618',
  blue:    '#2563EB', blueD:   '#2563EB18', blueDim:   '#2563EB18',
  purple:  '#7C3AED', purpleD: '#7C3AED18', purpleDim: '#7C3AED18',
  green:   '#16A34A', greenD:  '#16A34A18', greenDim:  '#16A34A18',

  txt: '#1E293B',
  mut: '#94A3B8',
  sub: '#64748B',

  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(0,0,0,0.1)',
  overlay: 'rgba(0,0,0,0.5)',
  splashBg: '#0D9488',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('tzunun_theme');
      if (saved === 'light' || saved === 'dark') return saved === 'light' ? LIGHT : DARK;
    } catch {}
    return DARK;
  });

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t.name === 'dark' ? LIGHT : DARK;
      localStorage.setItem('tzunun_theme', next.name);
      return next;
    });
  }, []);

  const isDark = theme.name === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      if (k !== 'name') root.style.setProperty(`--theme-${k}`, v);
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? '#0A0F1E' : '#F1F5F9';
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Shared styles builder — recibe el tema activo
export function buildStyles(T) {
  return {
    card: {
      background: T.card,
      border: `1px solid ${T.bord}`,
      borderRadius: 14,
      padding: 18,
    },
    inp: {
      width: '100%', background: T.surf, border: `1px solid ${T.bord}`,
      borderRadius: 8, padding: '9px 12px', color: T.txt, fontSize: 13,
      outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    },
    sel: {
      width: '100%', background: T.surf, border: `1px solid ${T.bord}`,
      borderRadius: 8, padding: '9px 12px', color: T.txt, fontSize: 13,
      outline: 'none', boxSizing: 'border-box',
    },
    lbl: {
      fontSize: 11, color: T.mut, display: 'block', marginBottom: 4, fontWeight: 600,
    },
    th: {
      textAlign: 'left', fontSize: 11, color: T.mut, padding: '7px 10px',
      fontWeight: 600, background: T.surf, borderBottom: `1px solid ${T.bord}`,
    },
    td: { padding: '9px 10px', borderBottom: `1px solid ${T.bord}22`, fontSize: 13 },
    btn: (v) => ({
      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
      border: v === 'ghost' ? `1px solid ${T.bord}` : 'none',
      background:
        v === 'primary' ? T.acc    : v === 'danger'  ? T.red    :
        v === 'blue'    ? T.blue   : v === 'purple'   ? T.purple :
        v === 'green'   ? T.green  : v === 'warn'     ? T.sec    : T.card,
      color: (v === 'primary' || v === 'green') ? '#fff' : T.txt,
    }),
    srow: (hi) => ({
      display: 'flex', justifyContent: 'space-between',
      fontSize: 13, padding: '4px 0',
      color: hi ? T.acc : T.sub,
      fontWeight: hi ? 700 : 400,
    }),
    kpi: (c) => ({
      position: 'relative', overflow: 'hidden',
      background: T.card, border: `1px solid ${T.bord}`,
      borderRadius: 14, padding: 18,
    }),
  };
}
