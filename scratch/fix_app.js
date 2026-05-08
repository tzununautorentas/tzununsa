const fs = require('fs');
const path = require('path');

const replacements = {
  "├í": "á", "├®": "é", "├¡": "í", "├│": "ó", "├║": "ú", "├▒": "ñ", "├ô": "Ó",
  "┬À": "·", "ÔÇö": "—", "ÔÜá": "⚠️", "Ôå║": "↺", "Ô£ö": "✔", "ÔØî": "❌",
  "Ô£à": "✅", "ÔÅ│": "⏳", "­ƒôè": "📊", "­ƒº«": "🧮", "­ƒôï": "📋",
  "­ƒôà": "📅", "­ƒÜù": "🚗", "­ƒöº": "🔧", "­ƒæÑ": "👥", "­ƒôª": "📦",
  "­ƒº¥": "🧾", "­ƒÅª": "🏦", "­ƒÆ©": "🛍️", "­ƒÆ░": "💰", "­ƒÅ¡": "🏢",
  "­ƒôê": "📈", "­ƒæñ": "👤", "­ƒÜ¬": "🚪", "­ƒÉª": "🐦", "ÔåÆ": "→",
  "├ôrdenes": "Órdenes", "Cat├ílogo": "Catálogo", "Facturaci├│n": "Facturación",
  "AN├üLISIS": "ANÁLISIS", "contrase├▒a": "contraseña", "p├íginas": "páginas",
  "Ingresa correo y contrase├▒a": "Ingresa correo y contraseña",
  "Credenciales incorrectas": "Credenciales incorrectas",
  "Verifica tu correo y contrase├▒a": "Verifica tu correo y contraseña",
  "Gesti├│n": "Gestión"
};

const pagesDir = 'C:\\Users\\Usuario\\tzununsa\\src\\pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix encoding
  for (const [key, val] of Object.entries(replacements)) {
    content = content.split(key).join(val);
  }
  
  // Add fmtK to imports if used but not imported
  if (content.includes('fmtK(') && !content.includes(', fmtK')) {
    content = content.replace('fmtD,', 'fmtD, fmtK,');
  }
  
  // Also remove any local fmtK definitions to avoid conflicts
  content = content.replace(/const fmtK\s*=\s*n\s*=>.*?;/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

// Also fix App.jsx and shared.jsx
['C:\\Users\\Usuario\\tzununsa\\src\\App.jsx', 'C:\\Users\\Usuario\\tzununsa\\src\\components\\shared.jsx'].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [key, val] of Object.entries(replacements)) {
      content = content.split(key).join(val);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
