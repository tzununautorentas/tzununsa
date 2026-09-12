# Auditoría de Integración Contable + Flujo de Efectivo — Tz'ununSA

Fecha: 2026-09-11
Alcance: FASE 1 (auditoría) + FASE 2 (arquitectura propuesta). **Sin cambios de código ni de BD.**
Fuentes: código fuente en `src/` + esquema real de Supabase introspectado vía PostgREST (modo lectura, misma API anónima que usa la app).

---

## FASE 1 — INFORME DE AUDITORÍA

### 1.1 Stack y modelo de datos

- React SPA (Vite) + PWA; acceso a Supabase PostgREST con **API key anónima** (`src/config.js:1-4`).
- Los helpers `dbGet/dbIns/dbUpd/dbDel` y la cabecera `H` usan la key anónima, **no el token de sesión** del usuario guardado en `localStorage` (`App.jsx:655`). Por tanto las políticas RLS basadas en `auth.uid()` no aplican a estas llamadas → el aislamiento multiempresa no existe en la práctica (ver 1.5.K).
- `.empresa_id`: presente en casi todas las tablas excepto `asiento_lineas`.
- El esquema base **no está versionado** en el repo (los SQL de `sql/` son ALTER); el esquema real se obtuvo por introspección.

### 1.2 Inventario de tablas relevantes (columnas reales)

| Tabla | Rol | Columnas clave | Multiempresa |
|---|---|---|---|
| `empresas` | Maestro empresa; series (`ultima_factura`…), `serie_facturas`, `tasa_iva/tasa_cambio/moneda_def`, cuentas bancarias texto, `firmante`, `cierre_corporativo` | `id, nombre, nit, …` | — |
| `clientes` | Directorio | `id, empresa_id, codigo, nombre, nit, dir…` | ✓ (col) |
| `proveedores` | Proveedores | `id, empresa_id, nit, codigo, activo…` | ✓ |
| `vehiculos` | Flota (precios, seguro, deducible, foto) | `id, empresa_id, placa, tarifa_dia/semana/mes` | ✓ |
| `servicios` | Catálogo | `id, empresa_id, precio_*` | ✓ |
| `cotizaciones` | Presupuesto (origen de reserva) | `id, empresa_id, cliente_id, tipo, total_gtq, reserva_id, estado, comision…, cuentas_pago, condiciones` | ✓ |
| `reservas` | Orden de servicio; **CxC denormalizado** | `id, empresa_id, cliente_id, cotizacion_id, monto, anticipo, saldo, total_gtq, estado, …` | ✓ |
| `facturas` | Debe/cobro | `id, empresa_id, cliente_id, cotizacion_id, reserva_id, numero, numero_factura, serie, numero_dte, numero_autorizacion, nombre_receptor, nit_receptor, cliente_nombre, cliente_nit, subtotal, total, saldo_pendiente, anticipo_aplicado, estado` | ✓ (pero lecturas sin filtro) |
| `pagos_recibidos` | Cobros de cliente | `id, empresa_id, fecha, monto, metodo, referencia, concepto, banco, cliente_nombre, factura_id, reserva_id, cotizacion_id, cuenta_bancaria_id` — **sin `cliente_id` ni `numero` ni `movimiento_id`** | ✓ |
| `gastos` | Gasto/aprobación/contabilización | `id, empresa_id, proveedor_id, vehiculo_id, reserva_id, categoria, subtotal, impuestos, total, metodo_pago, estado, contabilizado, aprobado, …` — **sin `fecha_pago` ni saldo pendiente** | ✓ |
| `cuentas_bancarias` | Maestro de bancos (incluye saldo) | `id, empresa_id, banco, numero_cuenta, tipo_cuenta, moneda, saldo_inicial, saldo_actual, titular` | ✓ |
| `movimientos_bancarios` | Movimiento de caja/banco | `id, empresa_id, cuenta_id, fecha, tipo, descripcion, monto, referencia, categoria, factura_id, cotizacion_id, conciliado` — **sin `pago_id`, `origen_tipo/origen_id`, `tipo_flujo`, ni `cuenta_contraparte`** | ✓ |
| `cuentas_contables` | Catálogo contable | `id, empresa_id, codigo, nombre, tipo(activo/pasivo/capital/ingreso/costo/gasto), categoria, nivel, cuenta_padre_id, activa` | ✓ |
| `asientos_contables` | Cabecera de asiento | `id, empresa_id, fecha, descripcion, referencia, modulo_origen, origen_id, estado(activo/anulado)` — **ya soporta trazabilidad de origen** | ✓ |
| `asiento_lineas` | Partidas | `id, asiento_id, cuenta_id, descripcion, debe, haber` — **sin `empresa_id`** | ✗ col no existe |
| `contratos`/`mantenimientos`/`empleados` | Documentos operativos con montos | `contratos.total_gtq/anticipo/saldo`; `mantenimientos.costo_total` | ✓ |
| `usuarios_sistema`/`roles` | Usuarios y permisos | `usuarios_sistema` (vacía); `roles(nombre, permisos)` | parcial |

### 1.3 Funciones de creación/actualización por módulo

**Facturación** (`Facturacion.jsx`)
- INSERT `facturas` con 16 columnas (`guardar`, `:195-212`) — incluye `empresa_id`, `numero_factura` (generado por timestamp, **no secuencial**, `:197`), `reserva_id` pero **sin traer reserva** (formulario en blanco, `:147-152`).
- No inicializa `saldo_pendiente`; `cambiarEstado` hace PATCH solo `{estado}` (`:252-263`). Botones: borrador→emitida→pagada→anulada. **No hay paso a `certificada`** salvo el importador SAT.
- **Cero integración contable/bancaria** en Facturación. "Marcar cobrada" (`emitida→pagada`) solo cambia estado, **sin** tocar banco, saldo ni asiento — convive con el otro camino (Pagos) que sí mueve dinero. Estado incoherente; doble vía.
- `saldo_pendiente` solo se materializa desde `Pagos.jsx:121-122`.

**Pagos** (`Pagos.jsx`, cobros de cliente)
- `guardar` (`:82-128`): INSERT `pagos_recibidos` → (solo si es nuevo) INSERT `movimientos_bancarios` (tipo `ingreso`, categoria `ventas`) → UPDATE `saldo_actual` (incremental, `:114-115`) → UPDATE `facturas.saldo_pendiente/estado` (`:121-122`).
- **Pagos parciales: sí funcionan** vía saldo de factura (monto libre; saldo baja; estado `pagada`/`parcial`).
- **Editar pago no corrige** el movimiento ni el saldo; **eliminar pago no borra** el movimiento ni revierte el saldo (`:135-138`) → `saldo_actual` y Banca quedan desincronizados.
- El `usePaginacion` busca en columnas `['numero', …]` que **no existen** en `pagos_recibidos`.

**Gastos** (`Gastos.jsx`)
- `guardar` (`:451-471`): INSERT `gastos` (22 columnas). Estados: `pendiente → en_revision → aprobado → contabilizado` (y `rechazado`) — es **flujo de aprobación**, no de pago. **No existe `fecha_pago` ni distinción pagado/pendiente de pago**; el select `metodo_pago='credito'` no tiene respaldo.
- `contabilizar` (`:697-747`): crea asiento con `modulo_origen:'gastos'`, `origen_id:gasto.id`, débito = cuenta por categoría (`:24-30`), crédito = cuenta fija `1.1.1` (caja). Marca `contabilizado=true`. **No genera movimiento bancario ni toca saldo**; **sin idempotencia** (doble clic ⇒ asiento duplicado; `Contabilidad.jsx:116` sí bloquea doble clic, Gastos no).

**Banca** (`Banca.jsx`)
- CRUD `cuentas_bancarias` (INSERT con `saldo_inicial=saldo_actual`, `:377-386`) y `movimientos_bancarios` (`:426-437`).
- `recalcularSaldo` (`:325-339`): **recálculo total** (`saldo_inicial + Σ ingresos − Σ egresos`) — paradigma distinto al incremental de Pagos → coexisten dos lógicas para el mismo saldo.
- **No existe transferencia entre cuentas propias** (no hay cuenta origen/destino ni doble partida; `tipo` solo `ingreso`/`egreso`).
- El origen del movimiento es descriptivo (`categoria` + `descripcion` + `referencia`); sin FK formales. El `usePaginacion` busca `concepto`, columna que **no existe** en `movimientos_bancarios` (`concepto` no existe; solo `descripcion`).
- `conciliar` definido pero **sin UI** que lo llame (`:445-448`). Importador bancario sin deduplicación.
- **No genera asientos.**

**Contabilidad** (`Contabilidad.jsx`)
- Catálogo, asientos manuales (`modulo_origen='manual'`, `:130`), Libro Diario/Mayor/Balance/Resultados, export PDF (via `generarPDF`) y CSV.
- Balance (`:215-237`) y Resultados (`:240-267`) se calculan sobre `asiento_lineas` con saldos en cliente. **Solo hay asientos si se registran a mano o se contabiliza un gasto** (el mayor/balance/resultados hoy están casi vacíos a menos que se alimenten manualmente).

**Dashboard / Reportes / Notificaciones**
- `dashboardService.js` carga **9 tablas completas sin empresa** (`:17-25`) y agrega en cliente: ingresos/egresos = `movimientos_bancarios.tipo` (`:48-49`), saldo = Σ`saldo_actual` GTQ (`:52-53`), facturado = Σ`facturas.total` (`:56-57`), top-10 CxC (`:108-116`, **sin total**). No lee `gastos`, `pagos_recibidos` ni contabilidad.
- Reportes.jsx es un **stub** ("Módulo en desarrollo").
- Notificaciones consulta 5 tablas sin `empresa_id`; solo cobros por cobrar, nada de cuentas por pagar.

### 1.4 Flujo de datos actual

```
Cotización → Resumen monto → Reserva (monto/anticipo/saldo) ──→ [NO factura automática]
                                                                      ↓ manual
Facturación (formulario en blanco) ──────────────────→ facturas (estado, sin saldo inicial)
      │                                                         ↑
      ▼                                                          │ cobro manual en Pagos
Estado 'pagada' (solo PATCH, sin dinero)                  pagos_recibidos +
                                                         movimientos_bancarios(ingreso) +
                                                         saldo_actual +
                                                         facturas.saldo_pendiente↓
Gasto → aprobación → contabilizar ⇒ asiento (debe gasto / haber caja 1.1.1)  [sin banco, sin fecha_pago]
Banca → movimientos manuales (ingreso/egreso/categoria) → recalcularSaldo
Dashboard = agregación propia sobre movimientos + cuentas + facturas (semántica de caja mezclada con devengo)
```

### 1.5 Problemas encontrados (priorizados)

- **A. No hay capa única de efectos financieros.** Cada módulo hace lo suyo (o nada): factura sin devengo; cobro mueve banco pero sin asiento; gasto hace asiento contra caja sin banco; Banca sin asientos.
- **B. INGRESO≠COBRO y GASTO≠PAGO no son distinguibles.** `facturas.estado='pagada'` se alcanza por dos caminos (botón de Facturación sin dinero, o Pagos con dinero). Los gastos no tienen "pagado vs pendiente".
- **C. CxC/CxP:** CxC es `facturas.saldo_pendiente` (no inicializado al emitir). CxP **no existe** (ni tabla ni estado).
- **D. Sin Flujo de Efectivo**; el dashboard mezcla caja y devengo y duplica el concepto del Estado de Resultados con semántica distinta (`dashboardService.js:48-49` vs `Contabilidad.jsx:256-264`).
- **E. Sin transferencias propias** (no hay doble partida banco→banco).
- **F. Idempotencia insuficiente:** `contabilizar` de Gastos duplica asientos; importador bancario duplica; no hay rastreo "¿ya generé el asiento/movimiento?".
- **G. `saldo_actual` denormalizado con dos paradigmas** (Banca recalcula; Pagos suma) y sin reversión al editar/eliminar pagos.
- **H. Esquema desordenado en `facturas`/`pagos`/`movimientos`:** dos familias de columnas para el mismo concepto (`numero` vs `numero_factura`; `nombre_receptor` vs `cliente_nombre`; `nit_receptor` vs `cliente_nit`); búsquedas sobre columnas inexistentes (`pagos: numero`, `banca: concepto`); numeración por timestamp en vez de secuencial; `anticipo_aplicado`/`fecha_certificacion`/`numero_autorizacion` = 0 usos reales; `serie_facturas` muerta.
- **I. `asiento_lineas` sin `empresa_id`** y lookups de `cuentas_contables` sin filtro (`Gastos.jsx:702-703`) → puede contabilizar con la cuenta de otra empresa.
- **J. Contabilidad depende de alimentación manual o del único flujo automático (gastos).**
- **K. Multiempresa roto integralmente:** (1) `empId` = **primera empresa** (`App.jsx:641-647`, `getEmpId` con `limit=1`); (2) sin selector de empresa en la UI; (3) lecturas de Contabilidad, Dashboard, Banca, Pagos, Notificaciones y `usePaginacion` **sin `empresa_id`**; (4) las llamadas usan la key anónima, no el JWT de sesión → políticas RLS por usuario no aplican. Aislamiento efectivo = 0 salvo convención manual.

### 1.6 Qué existe y es reutilizable / qué falta

**Reutilizable (no crear duplicados):**
- `asientos_contables` con `modulo_origen` + `origen_id` + `empresa_id` + `estado(activo/anulado)` = **la capa de asiento y trazabilidad ya está** (hoy solo la usa Gastos).
- `asiento_lineas` = capa de partidas.
- `movimientos_bancarios` = **la capa de caja/banco** (falta origen genérico y clasificación de flujo).
- `pagos_recibidos` = origen de cobros (con `factura_id/reserva_id/cotizacion_id/cuenta_bancaria_id`).
- `gastos` = origen de gastos (con flag `contabilizado`).
- `cuentas_bancarias` + `cuentas_contables` + `facturas(saldo_pendiente)`.
- Estructura equivalente a "transacción financiera origen": **los propios documentos** (factura/pago/gasto/movimiento) con sus FK; el asiento referencia via `origen_id`.

**Falta (justifica creación/ampliación):**
- Salidas de dinero (pagos a proveedores) → no existe (hay `pagos_recibidos`, no `pagos_realizados`).
- CxP con soporte de pagos parciales → no existe (ni columna en `gastos`).
- Clasificación de flujo (operativa/inversión/financiamiento/transferencia) → no existe.
- Caja como entidad → se puede modelar como `cuentas_bancarias.tipo_cuenta='caja'` (sin tabla nueva).
- Trazabilidad origen en movimientos y pagos (FK faltantes).

---

## FASE 2 — ARQUITECTURA PROPUESTA

### 2.1 Principio rector
Una operación se registra **una sola vez** en su módulo origen; sus efectos (asiento, movimiento de caja, flujo) se **derivan** con reglas idempotentes, sin formularios paralelos.

```
OPERACIÓN (documento origen: factura | pago recibido | gasto+pago realizado | movimiento bancario | transferencia | préstamo)
   │
   ├─(si afecta devengo)→ GENERADOR DE ASIENTO (montos + plantilla por tipo) ─→ asientos_contables / asiento_lineas ─→ Libro Diario → Mayor → Balance / Resultados
   │
   └─(si hay dinero real)→ GENERADOR DE MOVIMIENTO DE CAJA/BANCO ─→ movimientos_bancarios (+ clasificación de flujo) ─→ Flujo de Efectivo
        └→ y ese movimiento genera su ASIENTO (Banco/Caja ↔ contrapartida)

Trazabilidad: un COBRO es un pago (origen) que genera movimiento (caja) y asiento (Banco ↔ CxC);
un GASTO registrado sin pagar genera asiento (Gasto ↔ CxP) y CERO movimiento de caja.
```

### 2.2 Componentes propuestos (sin tocar UI salvo lo necesario)

1. **Generador de asientos** (`crearAsiento({tipo, origen, fecha, empresa, lineas, plantilla})`) con **idempotencia**: verificar `asientos_contables` por `(empresa_id, modulo_origen, origen_id)` antes de crear; si existe, reutilizar; nunca duplicar. El `estado` soporta anulación (no borrado).
2. **Generador de movimientos de caja/banco** análogo: `(origen_tipo, origen_id)` único por tipo; `tipo_flujo` obligatorio para clasificar.
3. **Clasificador de flujo** (por operación, independiente del catálogo): `OPERATIVA`, `INVERSION`, `FINANCIAMIENTO`, `TRANSFERENCIA_INTERNA`; cada una con `ENTRADA` / `SALIDA` / `NO_AFECTA_NETO`.
4. **Cuentas por pagar** = `gastos` con estado de pago (`fecha_pago`, `saldo_pendiente`, `estado_pago`) + **`pagos_realizados`** (salida) que liquida parcialmente.
5. **Transferencias internas**: en `movimientos_bancarios` con `cuenta_contraparte_id` y `tipo` propio (`transferencia`); neto 0, sin ingreso/gasto.
6. **Reporte Flujo de Efectivo** = vista calculada sobre `movimientos_bancarios` (+ cuentas tipo caja/banco) con `Desde/Hasta/Exportar`; **automático**, sin re-registro.

### 2.3 Tablas: nuevas vs reutilizadas

| Propuesta | Decisión |
|---|---|
| `asientos_contables` + `asiento_lineas` | **Reutilizar** (ya tienen `modulo_origen/origen_id`). Añadir `empresa_id` a `asiento_lineas` (migración) e índice único parcial `(empresa_id, modulo_origen, origen_id) WHERE origen_id IS NOT NULL`. |
| `movimientos_bancarios` | **Reutilizar** (es la capa de caja/banco): añadir `origen_tipo`, `origen_id`, `tipo_flujo`, `cuenta_contraparte_id` (transferencias) y `movimiento_contraparte_id`. |
| `pagos_recibidos` | **Reutilizar**: añadir `cliente_id` y `movimiento_bancario_id`. |
| `gastos` | **Reutilizar** como CxP: añadir `estado_pago`, `fecha_pago`, `saldo_pendiente`, `cuenta_bancaria_id`, `fecha_vencimiento`. |
| `pagos_realizados` (pagos a proveedores) | **Nueva** (espejo de `pagos_recibidos`): no existe equivalente. |
| `caja` | **No crear** tabla: modelar como `cuentas_bancarias` con `tipo_cuenta='caja'` (mismo motor de movimientos). |
| `flujo_efectivo` | **No crear** tabla de almacenamiento: **vista** sobre movimientos clasificados (opcional en SQL). |
| `transacciones financieras` central | **No crear**: la operación origen + sus FK ya cumplen ese rol; crear otra tabla duplicaría a `asientos`/`movimientos`. |

Razón de no crear la "tabla paraguas": la capa de movimiento ya existe y solo necesita **columnas de origen + clasificación**, no infraestructura paralela.

### 2.4 Relaciones y reglas contables objetivo (plantillas)

- **Factura Q10,000 sin pago** → asiento *Devengo*: Débito CxC 10,000 / Crédito Ingresos 10,000 (`modulo_origen='factura', origen_id=…`). **Flujo: 0.** Inicializar `facturas.saldo_pendiente = total` al emitir.
- **Cobro de Q10,000** (pagos_recibidos) → movimiento ingreso (Banco +10,000, `tipo_flujo=operativa/entrada`) + asiento *Caja*: Débito Banco/Caja 10,000 / Crédito CxC 10,000 (`origen=pago`). **No re-reconocer ingreso**; baja `saldo_pendiente`.
- **Pago parcial Q4,000** → idem con monto parcial; `saldo_pendiente` resta.
- **Gasto Q800 pagado al momento** → asiento *Devengo*: Débito Gasto 800 / Crédito CxP 800; pago realizado: movimiento egreso (Banco −800) + asiento Débito CxP 800 / Crédito Banco 800. Flujo −800.
- **Gasto Q5,000 sin pagar** → asiento *Devengo* (Gasto↔CxP) y **sin movimiento**; flujo 0. Pago posterior → movimiento egreso + asiento CxP↔Banco. Sin duplicar gasto.
- **Transferencia Banco A→B Q5,000** → un movimiento por cuenta con `cuenta_contraparte_id`, `tipo_flujo=transferencia_interna`; neto 0, sin ingreso/gasto.
- **Compra de vehículo** → Débito Activo (vehículo) / Crédito Banco; `tipo_flujo=inversion/salida`. **Préstamo recibido** → Débito Banco / Crédito Pasivo; `financiamiento/entrada`.
- Regla general: **devengo y cobro/pago son asientos/pasos distintos**; nadie re-registra la operación.

### 2.5 Multiempresa
- `empId` debe dejar de ser "primera empresa": usar empresa activa (session/contexto + selector) o RLS por sesión real (enviar el JWT del usuario en `Authorization`, no la key anónima).
- Toda lectura incorpora `empresa_id=eq.<empId>`; todo INSERT/UPDATE lo setea. Añadir `empresa_id` a `asiento_lineas`. Lookups de `cuentas_contables`/cuentas caja filtrados por empresa.

### 2.6 Riesgos de modificación
1. `dbGet/dbIns/...` son compartidos: cambios de semántica impactan todo → no tocar los helpers; encapsular los generadores.
2. Asientos automáticos sobre datos históricos: **generar hacia adelante** (nuevas operaciones) y no re-procesar históricos sin bandera explícita (`contabilizado` ya existe en gastos) para no duplicar.
3. Unificar estado de factura (dos caminos a `pagada`) requiere migración de saldos existentes (`emitida/certificada` sin `saldo_pendiente` → `saldo=total`).
4. `saldo_actual`: unificar a un solo método (recalcular) y corregir editar/eliminar de Pagos.
5. Numeración secuencial de facturas (hoy por timestamp) y uso de `serie_facturas`.
6. No cambio visual salvo lo necesario para la integración.

### 2.7 Plan de implementación sugerido (por pasos, pequeño y controlado)
1. **Fundaciones**: `empresa_id` en `asiento_lineas`; índice único en `asientos_contables`; `empresa_id` en lecturas de Contabilidad/Dashboard/Banca/Pagos/Notificaciones; empresa activa en App.
2. **Caja/Banca**: columnas `origen_tipo/origen_id/tipo_flujo/cuenta_contraparte` en `movimientos_bancarios`; transferencias; unificar saldo (recalcular).
3. **Generador de asientos + plantillas** por tipo (factura devengo, cobro, gasto devengo, pago, transferencia, préstamo, compra/venta activo) con idempotencia.
4. **CxC**: inicializar `saldo_pendiente` al emitir facturas; corregir la doble vía de `pagada`.
5. **CxP**: columnas de pago en `gastos` + `pagos_realizados` + liquidación parcial.
6. **Contabilidad**: habilitar asientos automáticos en Libro Diario (flag AUTOMÁTICO/MANUAL con origen navegable); mantener los manuales.
7. **Flujo de Efectivo**: nueva pestaña con Desde/Hasta, saldo inicial, entradas/salidas por clasificación, neto, saldo final, export Excel/PDF.
8. **Pruebas**, **multiempresa** y **snapshot RLS** al final.

---

## Pendientes que requieren acción externa
- Ejecutar `sql/migracion_cotizaciones_condiciones.sql` en el SQL Editor de Supabase (fix del campo `condiciones` que hoy falla en producción).
- Aprobación de esta arquitectura antes de iniciar cualquier implementación (FASES 3+).