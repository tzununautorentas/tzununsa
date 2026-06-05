# Seguimiento de trabajo — PlanificadorRutas

## Último cambio (05 Jun 2026)
Se intentó arreglar la falta de interacción (no se puede escribir ni hacer clic) en los inputs/selects/buttons del componente `PlanificadorRutas` dentro de la pestaña "Traslado / Viaje" de la Calculadora.

## Cambios aplicados

### `src/components/PlanificadorRutas.jsx`
- **"Mi ubicación" ahora usa GPS real** (`navigator.geolocation.getCurrentPosition`) en vez de una dirección fija de negocio.
- Se agregó **cierrey de sugerencias al hacer click fuera** (click-away listener via `useEffect` + `mousedown`).
- Se eliminó `position: relative` y `zIndex: 1` del contenedor principal.
- Se agregó `pointerEvents: "auto"` explícito en todos los `input`, `select`, `button`.
- Se agregó `type="button"` en todos los `<button>`.
- `PuntoSelector` envuelto en `React.memo`.
- `actualizar` envuelto en `useCallback(() => ..., [])` para referencia estable.
- Sugerencias usan `onMouseDown` en vez de `onClick`.
- Se eliminó dependencia de `MI_UBICACION` y `MUNICIPIOS` en imports.
- Ya no se importa `getDepto` ni `MUNICIPIOS` en `Calculadora.jsx`.
- `onChange` en Calculadora ahora usa `origenNombre`/`destinoNombre`.

### `src/pages/Calculadora.jsx`
- Se eliminó import de `getMuni` y `getDepto`.
- El handler de `PlanificadorRutas.onChange` usa `data.origenNombre` y `data.destinoNombre`.

## Problema pendiente
El usuario reporta que NO puede interactuar con los elementos del PlanificadorRutas (no puede escribir en inputs, no puede hacer clic en selects ni botones). El componente se renderiza (se ve) pero no responde a clics o tecleo. La consola del navegador muestra un error (no se ha podido leer el texto del error porque la herramienta no soporta imágenes).

## Posibles causas (sin confirmar)
- Error de JavaScript en la consola que impide la interacción.
- Conflicto de z-index/stacking context.
- Problema con eventos de React (stale closures, aunque se usó useCallback/memo).
- Algo en el CSS inyectado dinámicamente o en el theme que bloquee eventos.
- Las sugerencias de Nominatim despliegan un dropdown `position: absolute` que cubre otros elementos.

## Próximos pasos
1. El usuario copiará el texto exacto del error de la consola del navegador (F12 → Console).
2. Con base en el error, determinar la causa raíz y corregirla.
3. Probar nuevamente la interacción en "Traslado / Viaje".

## Archivos relevantes
- `src/components/PlanificadorRutas.jsx` (componente principal)
- `src/pages/Calculadora.jsx` (página que lo usa)
- `src/services/ruteoService.js` (OSRM, Nominatim, geocoding)
- `src/data/municipios.js` (catálogo geográfico)
