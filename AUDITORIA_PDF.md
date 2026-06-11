# Auditoría de Generación PDF — Tz'ununSA

Fecha: 2026-06-11
Commit: `94e491f` (HEAD, origin/main)

---

## Resumen

| Módulo | Función | Método | window.print | window.open | about:blank | Estado |
|--------|---------|--------|:---:|:---:|:---:|:---:|
| **Cotizaciones.jsx** | `generarPDFPremium` | **html2pdf.js** (CDN) | ❌ No | ❌ No | ❌ No | ✅ OK |
| shared.jsx | `ModalExportar` (PDF) | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |
| Contratos.jsx | `generarPDF` | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |
| Contabilidad.jsx | `exportarPDF` | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |
| Empleados.jsx | `exportarPDF` | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |
| Gastos.jsx | `exportarPDF` | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |
| Facturacion.jsx | `facturaPDF` | window.open + print | ✅ Sí | ✅ Sí | ✅ Sí | ❌ |

---

## Auditoría detallada — Cotizaciones.jsx

### ¿`generarPDFPremium` usa `window.print()`?
**NO.** No hay ninguna llamada a `window.print()` en la función ni en el componente.

### ¿Usa `html2pdf.js`?
**SÍ.** Carga dinámicamente `html2pdf.bundle.min.js` v0.10.1 desde CDN:
```js
await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
```
Luego usa:
```js
await window.html2pdf()
  .set({ margin, filename, image, html2canvas, jsPDF, pagebreak })
  .from(wrapper)
  .save();
```

### ¿Usa `jsPDF`?
**Indirectamente.** jsPDF v2.5.1 está en `package.json` y se carga globalmente en `index.html`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```
html2pdf.js incluye jsPDF internamente, así que la dependencia global es redundante.

### Flujo exacto (botón "Ver PDF" → descarga)

```
1. Usuario hace clic en "Ver PDF"
   → `onClick={() => generarPDFPremium(makePDFData(r), empId)}`

2. makePDFData(r) transforma registro SQL → objeto plano
   (numero, fecha, cliente, nit, saludo, vehiculo, servicios, sub, total, etc.)

3. generarPDFPremium(data, empId):
   a. Obtiene datos de la empresa (logo, banco, firma, etc.) via dbGet()
   b. Verifica si window.html2pdf existe. Si no, lo carga desde CDN.
      - Si falla → alerta y return (sin ventanas, sin about:blank)
   c. Busca foto del vehículo en la tabla vehiculos (match por nombre)
   d. Construye HTML completo con CSS inline (tamaño Letter)
   e. Crea div oculto: position:fixed;left:-9999px;top:0;width:750px
   f. Inyecta `<style>${css}</style>${htmlContent}` en el div
   g. Espera que carguen todas las imágenes (<img>)
   h. Espera 300ms adicionales
   i. Ejecuta html2pdf().set({...}).from(wrapper).save()
      - margin: [8, 10, 8, 10] mm
      - format: "letter"
      - orientation: "portrait"
      - scale: 2 (html2canvas)
      - filename: "COT-XXXXXX-NombreCliente.pdf"
   j. Captura errores → alerta
   k. Elimina el div oculto del DOM

4. RESULTADO: Descarga directa del archivo PDF
   SIN: about:blank, ventana nueva, diálogo de impresión
```

### Código exacto de generación (líneas 296-310)

```js
const sanitizar = s => (s || "").replace(/[^a-zA-Z0-9À-ÿ\-_ ]/g, "").trim().replace(/\s+/g, "_").slice(0, 40);
const filename = `${d.numero || "COT"}-${sanitizar(d.cliente)}.pdf`;

try {
  await window.html2pdf()
    .set({
      margin: [8, 10, 8, 10],
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, letterRendering: true },
      jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    })
    .from(wrapper)
    .save();
} catch (err) {
  alert("Error al generar el PDF: " + (err.message || err));
}
```

---

## Dependencias instaladas para PDF

### package.json
```json
"dependencies": {
  "jspdf": "^2.5.1"
}
```

### index.html (CDN)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

### html2pdf.bundle.min.js
**No está en el proyecto local.** Se carga dinámicamente desde CDN:
```
https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
```

### jsPDF eliminado de index.html
jsPDF ya no se carga globalmente. html2pdf.js incluye jsPDF internamente.
- Antes: `<script src="...jspdf/2.5.1/jspdf.umd.min.js"></script>` en index.html
- Ahora: Eliminado (redundante)

### Alternativa recomendada (cuando haya npm disponible)
```bash
npm install html2pdf.js
```
Luego importarlo en lugar de CDN dinámico. Elimina latencia de red y fallos de CDN.

---

## Problemas detectados

### 1. html2pdf.js vía CDN (riesgo de conectividad)
Si el usuario no tiene internet o el CDN está caído, el PDF no se genera. La alerta informa del error, pero no hay fallback.
**Estado: Se mantiene CDN (sin npm disponible en este equipo).**

### 2. PDF vacío en móvil (CORREGIDO)
html2canvas con `scale: 2` puede agotar memoria en móviles → canvas vacío.
**Solución aplicada:** Detección automática de móvil (`window.innerWidth < 768`) → `scale: 1.2`.

### 3. jsPDF global redundante (CORREGIDO)
Se cargaba jsPDF desde CDN en `index.html` + html2pdf.js incluye su propia copia.
**Solución aplicada:** Eliminada la línea `<script src="...jspdf...">` de `index.html:55`.

### 4. Posición del div oculto (CORREGIDO)
`position:fixed;left:-9999px` puede causar que algunos navegadores móviles no rendericen contenido.
**Solución aplicada:** Cambiado a `position:fixed;left:0;top:0;opacity:0.01;z-index:-1;pointer-events:none`.

### 5. Tiempo de espera de imágenes (CORREGIDO)
300ms era insuficiente para carga de imágenes base64 grandes.
**Solución aplicada:** Aumentado a 400ms.

### 6. Los demás módulos aún usan window.print + window.open
Contratos, Contabilidad, Empleados, Gastos, Facturacion y el ModalExportar de shared.jsx siguen usando el patrón antiguo.
**Estado:** Pendiente de migrar.

---

## Recomendaciones

1. **En el equipo con npm disponible:** Instalar html2pdf.js localmente:
   ```bash
   cd ruta-del-proyecto
   npm install html2pdf.js
   ```
   Luego cambiar `cargarScript(CDN)` por `import html2pdf from 'html2pdf.js'` al inicio del archivo.

2. **Migrar los otros módulos** (Contratos, Contabilidad, Empleados, Gastos, Facturacion, shared.jsx) al mismo patrón html2pdf.js para eliminar todos los `window.print()`.

3. **Verificar el Service Worker** que cachea la app (`public/sw.js`). Si hay versión antigua cacheada, forzar actualización incrementando `CACHE` a `"tzununsa-v2"`.
