# Seguimiento de trabajo — Estado actual

## ✅ Completado

### 1. Calendario responsive (Dashboard)
- Días acortados: `Dom Lu Ma Mi Ju Vi Sa`
- `gap` reducido de 2 → 1px
- `minWidth: 0` en celdas para evitar desbordamiento
- Card con `overflow: hidden`
- Bordes `transparent` eliminados de celdas no-hoy

### 2. PlanificadorRutas funcional
- Inputs/selects/buttons ya son interactivos
- GPS real con `navigator.geolocation`
- Click-away para cerrar sugerencias
- `useCallback`/`memo`/`pointerEvents: auto` para estabilidad

### 3. Ubicaciones personalizadas
- Servicio CRUD: `src/services/ubicacionesService.js`
- Botón "Guardar ubicación" cuando hay coordenadas válidas
- Lista "Mis ubicaciones" con carga/uso/eliminación
- Requiere SQL manual en Supabase Dashboard (ver `sql/crear_ubicaciones_personalizadas.sql`)

## Pendiente
- Nada por el momento (user-driven)
