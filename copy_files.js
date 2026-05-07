const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:', 'Users', 'Usuario', 'OneDrive', 'Documentos', 'Cocainegh', '01_Tz´unun', 'Tz´unun 2026', 'App Tzunun', 'app tzunun', 'files');
const destDir = path.join(__dirname, 'src', 'pages');

const files = ['Catalogo.jsx', 'Cotizaciones.jsx', 'Pagos.jsx', 'Reservas.jsx'];

files.forEach(f => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  
  if (fs.existsSync(dest)) {
    try {
      fs.chmodSync(dest, 0o666);
    } catch (e) {
      console.error('Error changing permissions for', dest, e.message);
    }
  }
  
  try {
    fs.copyFileSync(src, dest);
    console.log('Copied', f);
  } catch (e) {
    console.error('Error copying', f, e.message);
  }
});
