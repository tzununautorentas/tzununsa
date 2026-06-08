import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const DARK = {
  name: 'dark',
  bg:      '#0A0F1E',
  surf:    '#111827',
  card:    '#162032',
  bord:    '#1E3A5F',

  acc:     '#5EEAD4', accD:    '#5EEAD422', accDim:    '#5EEAD422',
  sec:     '#FCD34D', secD:    '#FCD34D22', secDim:    '#FCD34D22',
  red:     '#FCA5A5', redD:    '#FCA5A522', redDim:    '#FCA5A522',
  blue:    '#93C5FD', blueD:   '#93C5FD22', blueDim:   '#93C5FD22',
  purple:  '#C4B5FD', purpleD: '#C4B5FD22', purpleDim: '#C4B5FD22',
  green:   '#86EFAC', greenD:  '#86EFAC22', greenDim:  '#86EFAC22',

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

  acc:     '#2DD4BF', accD:    '#2DD4BF18', accDim:    '#2DD4BF18',
  sec:     '#FBBF24', secD:    '#FBBF2418', secDim:    '#FBBF2418',
  red:     '#F87171', redD:    '#F8717118', redDim:    '#F8717118',
  blue:    '#60A5FA', blueD:   '#60A5FA18', blueDim:   '#60A5FA18',
  purple:  '#A78BFA', purpleD: '#A78BFA18', purpleDim: '#A78BFA18',
  green:   '#34D399', greenD:  '#34D39918', greenDim:  '#34D39918',

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
