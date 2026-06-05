# Seguimiento de trabajo — Tz'ununSA

> Fecha: 05 Junio 2026

---

## Resumen general

Sistema ERP para gestión de renta de vehículos, traslados y servicios de movilidad. Construido sobre **Supabase + Vite/React**. Despliegue en Vercel.

---

## Últimos cambios aplicados

### 1. Búsqueda inteligente multi-columna (13 módulos)

Se expandieron las columnas de búsqueda en todos los módulos con listados para que busquen en **todos los campos relevantes** de cada tabla, no solo en 2-3 columnas.

| Módulo | Columnas de búsqueda actuales |
|--------|------------------------------|
| **Cotizaciones** | numero, cliente_nombre, cliente_nit, cliente_dir, vehiculo_nombre, descripcion_servicio, notas |
| **Reservas** | cliente_nombre, numero, vehiculo_nombre, destino, origen, departamento, municipio, conductor_nombre, notas |
| **Clientes** | nombre, codigo, nit, telefono, email, direccion, contacto, notas |
| **Flota** | marca, modelo, placa, codigo, color, tipo, vin, notas |
| **Proveedores** | nombre, nit, telefono, email, direccion, contacto_nombre, contacto_tel, notas |
| **Empleados** | nombre, codigo, telefono, puesto, dpi, nit, email, direccion, notas |
| **Catálogo** | nombre, codigo, tipo, descripcion, notas |
| **Mantenimiento** | vehiculo_nombre, placa, tipo, descripcion, taller, mecanico, notas |
| **Pagos** | numero, cliente_nombre, concepto, referencia, notas |
| **Gastos** | descripcion, proveedor, empleado_nombre, numero_factura, categoria, referencia, notas, vehiculo_nombre |
| **Contratos** | numero, cliente_nombre, vehiculo_nombre, vehiculo_placa, cliente_nit, vehiculo_marca, vehiculo_modelo, concepto, observaciones, factura_nombre, factura_nit |
| **Facturación** | numero, nombre_receptor, nit_receptor, serie, descripcion |
| **Banca** | concepto, referencia, descripcion, categoria, notas, tipo |

### 2. Corrección cálculo de días en Calculadora

**Archivo:** `src/pages/Calculadora.jsx`

- `calcDias` corregido: de `Math.ceil((d2-d1)/86400000)` a `Math.floor((d2-d1)/86400000) + 1`
- Ahora 19/Jun → 21/Jun = **3 días** (inclusivo, contando el día inicial)
- El comportamiento anterior daba 2 días (resta matemática)

### 3. Auto-completado de datos del cliente en Calculadora

**Archivo:** `src/pages/Calculadora.jsx`, `src/components/shared.jsx`

- `BuscadorCliente` ahora acepta prop `onSelect` que devuelve el objeto completo del cliente
- Al seleccionar un cliente en la calculadora, se auto-completan:
  - **NIT**
  - **Dirección**
  - **Código**
  - **Saludo personalizado** (según tipo de cliente)
- Todos los campos quedan editables
- Misma lógica aplicada en el formulario de `Cotizaciones.jsx`

### 4. Saludo personalizado auto-generado

**Archivos:** `src/pages/Calculadora.jsx`, `src/pages/Cotizaciones.jsx`

Se genera automáticamente según el tipo de cliente:

| Tipo | Saludo generado |
|------|----------------|
| persona | "Estimado(a) cliente, en Transportes Tz'unun..." |
| empresa | "Estimados clientes, en Transportes Tz'unun..." |
| gobierno | "Distinguidos señores, en Transportes Tz'unun..." |
| ong | "Estimados miembros, en Transportes Tz'unun..." |

El texto completo del saludo es:

> "en Transportes Tz'unun, nos enfocamos en brindarle la mejor experiencia de viaje con servicios de alta calidad y tarifas competitivas, el mercado de renta de vehículos, viajes de turismo y traslado de personas a diferentes lugares de Guatemala y Centroamérica."

### 5. Calendario de reservas mejorado (Dashboard)

**Archivo:** `src/pages/Dashboard.jsx`

El `CalendarioMensual` ahora:

- **Chips de reserva**: cada día muestra chips de colores con el tipo (T=Traslado/R=Renta) y vehículo
- **Código de colores**: Traslado en púrpura `#818CF8`, Renta en teal `#00D4AA`
- **Click para detalle**: al pinchar un chip se abre un modal con: cliente, número, tipo, vehículo, fechas, días, total, estado, destino, notas
- **Tamaño ampliado**: celdas de 96px min-height, fuentes más grandes para mejor legibilidad
- **Scroll horizontal en mobile**: el grid se desliza táctilmente en pantallas pequeñas

### 6. Planificador de Rutas

**Archivos:** `src/components/PlanificadorRutas.jsx`, `src/services/ruteoService.js`, `src/data/municipios.js`

- Componente de planificación de rutas con geocodificación (Nominatim) y cálculo de distancias (OSRM)
- Selector de puntos de origen/destino con autocompletado
- "Mi ubicación" usa GPS real del navegador
- Integrado en la pestaña "Traslado / Viaje" de la Calculadora

---

## Pendientes / Próximos pasos

1. **Conciliación bancaria** — Módulo para conciliar movimientos bancarios importados vs. registros del sistema
2. **Mejora de tipos de cliente** — Agregar campo `genero` o `tratamiento` a tabla `clientes` para saludos más precisos ("Estimada" vs "Estimado")
3. **Pruebas exhaustivas** — Verificar que la búsqueda multi-columna funcione correctamente en producción

---

## Arquitectura técnica

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + REST API)
- **Autenticación:** Supabase Auth
- **Despliegue:** Vercel
- **Paginación:** Server-side con `Range` header + `Prefer: count=exact`
- **Búsqueda:** `or(col1.ilike.*term*,col2.ilike.*term*)` directo a Supabase REST API
- **Tema:** CSS Variables + Proxy en `config.js` para reactividad claro/oscuro
- **Notificaciones:** `localStorage` + `CustomEvent` para estado de lectura cross-componente

---

## Estructura de directorios relevante

```
src/
├── components/
│   ├── shared.jsx          # Paginador, Buscador, BuscadorCliente, Fld, Badge, etc.
│   └── PlanificadorRutas.jsx
├── hooks/
│   └── usePaginacion.js    # Hook de paginación server-side con Range header
├── pages/
│   ├── Dashboard.jsx       # Centro de control con KPIs, alertas, calendario
│   ├── Calculadora.jsx     # Presupuestos rápidos (renta/traslado)
│   ├── Cotizaciones.jsx    # Gestión completa de cotizaciones
│   ├── Reservas.jsx        # Gestión de reservas
│   ├── Clientes.jsx        # CRUD clientes con búsqueda paginada
│   ├── Flota.jsx           # CRUD vehículos
│   ├── Proveedores.jsx     # CRUD proveedores
│   ├── Empleados.jsx       # CRUD empleados
│   ├── Catalogo.jsx        # Catálogo de servicios/precios
│   ├── Mantenimiento.jsx   # Control de mantenimientos
│   ├── Pagos.jsx           # Pagos recibidos
│   ├── Gastos.jsx          # Gestión de gastos
│   ├── Contratos.jsx       # Contratos de arrendamiento
│   ├── Facturacion.jsx     # Facturación/FEL
│   └── Banca.jsx           # Cuentas y movimientos bancarios
├── services/
│   ├── dashboardService.js # Carga paralela de datos del dashboard
│   ├── readState.js        # Estado de lectura de notificaciones
│   └── ruteoService.js     # OSRM, Nominatim, geocoding
├── config.js               # Config global, T (Proxy CSS vars), S (styles)
└── config/
    └── theme.jsx           # ThemeProvider, temas DARK/LIGHT
```
