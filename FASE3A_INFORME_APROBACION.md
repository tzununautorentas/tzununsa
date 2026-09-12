# FASE 3A — Informe de aprobación previa a implementación

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Alcance: solo análisis (código + PostgREST read-only). Sin modificaciones, sin ejecución, sin deploys.

---

## 1. CORRECCIÓN DEL MODELO DE IDEMPOTENCIA

**Decisión definitiva: el modelo de FASE 3 tuvo un error.** Proponía una columna `idempotencia` como concepto separado. Se descarta.

La identidad canónica es exactamente la definida en FASE 2.1:

> **(empresa_id, origen_tipo, origen_id, evento_tipo)**

Respuestas A–G:

- **A) ¿Columna `idempotencia`?** — **NO.** Es redundancia: duplica información que ya está en `(origen_tipo, origen_id, evento_tipo)` y crea dos formas de violar la clave. La clave única compuesta ES la idempotencia.
- **B) ¿Basta el índice único compuesto?** — **SÍ**, con un matiz: debe ser **parcial** para no bloquear reenvíos después de una anulación y para no exigir `origen_id` a las entradas manuales:
  ```sql
  CREATE UNIQUE INDEX uq_asientos_identidad
    ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
    WHERE estado = 'activo' AND origen_id IS NOT NULL;
  ```
- **C) `modulo_origen`** — Renombrar a **`origen_tipo`**. Valores permitidos (constraint): `factura | cotizacion | reserva | gasto | pago_recibido | pago_proveedor | movimiento_bancario | transferencia | manual`. Hoy solo existe `'manual'` (3 asientos).
- **D) ¿Renombrar posteriormente?** — Renombrar **ahora en el plan** (migración 3.2, atómica con el cambio de código). Dejar el nombre viejo solo alarga la deuda. `RENAME COLUMN ... TO` respeta permisos/RLS existentes.
- **E) Los 3 asientos manuales históricos** — Backfill determinista: `origen_tipo='manual', origen_id=NULL, evento_tipo='manual'`. Quedan **fuera** del índice único (`origen_id` NULL). No se toca su `estado`.
- **F) Asiento anulado no bloquea** — `WHERE estado='activo'` del índice parcial lo garantiza: un row `anulado` no participa, así que al anular el original liberas la clave para re-generar. Anular **nunca borra**; conserva líneas y el nuevo asiento válido con la misma identidad es legal.
- **G) Reversa** — Una reversa es un **asiento nuevo** con `evento_tipo='reversa'`, `origen_tipo='asiento'`, `origen_id=<id del asiento original>` → identidad `(empresa, 'asiento', <asiento_original_id>, 'reversa')` única (una reversa por asiento). El original pasa a `estado='reversado'`. La reversa "empareja" con lo que revierte:

  | evento_tipo | origen_tipo | origen_id | Ejemplo |
  |---|---|---|---|
  | `devengo` | `gasto` | gasto.id | Gasto aprobado (débito gasto / crédito CxP) |
  | `tesoreria` | `pago_proveedor` | pago.id | Egreso que liquida CxP |
  | `tesoreria` | `pago_cliente` | pago.id | Ingreso que reduce CxC |
  | `tesoreria` | `transferencia` | transferencia.id | Débito destino / crédito origen |
  | `reversa` | `asiento` | asiento_original.id | Revierte un asiento (anulación con dinero movido) |
  | `manual` | `manual` | NULL | Captura manual (excluida del índice) |

**SQL propuesto (NO ejecutar):**
```sql
-- 1) columnas de identidad
ALTER TABLE asientos_contables ADD COLUMN origen_tipo text;
ALTER TABLE asientos_contables ADD COLUMN evento_tipo text;
ALTER TABLE asientos_contables ADD COLUMN estado text NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo','anulado','reversado'));
-- 2) backfill histórico
UPDATE asientos_contables SET origen_tipo='manual', evento_tipo='manual' WHERE origen_tipo IS NULL;
-- 3) renombrar módulo (migración 3.2, con cambio de código)
ALTER TABLE asientos_contables RENAME COLUMN modulo_origen TO origen_tipo;
-- 4) índice único de identidad (parcial)
CREATE UNIQUE INDEX uq_asientos_identidad
  ON asientos_contables (empresa_id, origen_tipo, origen_id, evento_tipo)
  WHERE estado = 'activo' AND origen_id IS NOT NULL;
-- 5) reversa (ilustrativo; requiere el UPDATE del original a estado='reversado')
-- INSERT INTO asientos_contables (empresa_id, fecha, descripcion, origen_tipo, origen_id, evento_tipo, estado)
-- VALUES ( <emp>, now(), 'Reversa asiento <id>', 'asiento', <id_original>, 'reversa', 'activo');
-- + líneas invertidas.
```

---

## 2. FAC-221920 — INVESTIGACIÓN PROFUNDA

**Evidencia encontrada (cadenas verificadas en vivo):**

| Fuente | Hallazgo |
|---|---|
| `facturas` FAC-221920 | total **6,750.00** = subtotal 6,428.57 + IVA 321.43 (5%). Receptor CONAVIGUA, NIT 23747358, dirección 8va Av 2-29 z1, cliente_id=`28c4d8cd`. Estado `parcial`, saldo **1,687.50**, `fecha_emision`=2026-04-25. Descripción: *"traslado … hacia Palencia, luego a Ixcún Quiché, Cobán, Alta Verapaz y de regreso… fechas 20 al 23 de abril 2026"* |
| `clientes` 28c4d8cd | `tipo=gobierno`, nombre CONAVIGUA, NIT 23747358, misma dirección → **misma entidad que el receptor de la factura** ✓ |
| `cotizaciones` COT-595070 | CONAVIGUA, total **6,750.00** (mismos subtotal 6,428.57, IVA 5%, USD 876.62), dept **Quiché / Ixcún**, `dias=4`, emitida 2026-04-15, estado `orden_venta`, **coincide 1:1 con la factura** ✓ |
| `movimientos_bancarios` (id `9aa1bee7`) | **"Anticipo traslado a Ixcún - Cobán 20 al 23 abril 2026"** Q5,062.50, fecha 2026-04-20, ref `1218989`, `cuenta_id=NULL`, `categoria=ventas`, creado 2026-04-25T04:52 (13 min antes que la factura) |
| `movimientos_bancarios` (id `ce00ea20`) | **"Pago FAC-221920"** Q6,750.00, fecha 2026-04-25, ref `FAC-221920`, `cuenta_id=NULL`, `conciliado=true`, creado 2026-04-25T05:00:37 (**15 s después** de crear la factura) |
| `pagos_recibidos` | **Ningún pago referenciado** a FAC-221920 (4 pagos con `factura_id=NULL`) |
| `reservas` | Sin reserva para el viaje de abril (las reservas CONAVIGUA son junio/julio) |
| `contratos` | Ninguno referencia COT-595070 ni FAC-221920 |
| `gastos` | Ninguno referencia el viaje ni la factura |
| Otros movimientos | No existe ningún otro monto 5,062.50 / 1,687.50 / 6,750 |

**Evidencia faltante:**
- **Estado de cuenta bancario del período abril 2026** (no hay movimientos importados; los 2 movimientos están fuera de cualquier cuenta → el `conciliado=true` es un marcado manual, no un cotejo bancario).
- Registro de abono en `pagos_recibidos` (módulo de Pagos) para esta factura.

**Hipótesis:**
- **H1 — Doble conteo real:** se cobró total 6,750 (movimiento B = depósito total) y el saldo 1,687.50 es residuo de un cálculo viejo `total − anticipo(5,062.50)`. → saldo correcto sería **0**.
- **H2 — Solo anticipo:** se cobró únicamente 5,062.50 (movimiento A); el movimiento B es un "comprobante" del monto de la factura, no dinero nuevo. → saldo 1,687.50 **correcto**, y B es un fantasma a excluir del flujo.
- **H3 — División real:** anticipo 5,062.50 + restante 1,687.50 = 6,750; B es el agregado. → **0**, pero exige el soporte del banco.

La matemática del saldo (6,750 − 5,062.50 = 1,687.50) favorece H2; el `conciliado=true` y la etiqueta de B favorecen H1/H3. **No hay forma de dirimir sin el banco.**

**Recomendación:** **NO TOCAR.** FAC-221920 queda en **GRUPO C** (no automatizar), catalogada como *"pendiente de verificación bancaria"* y se resuelve con el estado de cuenta real o criterio del negocio. **No** se le aplicará la regla de recálculo de saldo (si se le aplicara subiría a 6,750, incorrecto).

---

## 3. LOS DOS MOVIMIENTOS HUÉRFANOS

| | A — "Anticipo traslado a Ixcún" | B — "Pago FAC-221920" |
|---|---|---|
| id | `9aa1bee7-60db-45ba-ae5b-e5c8a0eb745b` | `ce00ea20-a05c-4f7b-adf5-0769f657543a` |
| Fecha | 2026-04-20 (anticipo, pre-viaje) | 2026-04-25 |
| Descripción | Traslado Ixcún-Cobán 20-23 abr | Pago de factura |
| Referencia | `1218989` | `FAC-221920` |
| Monto | 5,062.50 | 6,750.00 |
| Categoría | ventas | ventas |
| Relación | Coincide con FAC-221920 (mismo viaje) | Referencia explícita a la factura |
| Cuenta asignada | NULL | NULL |

Ambos se relacionan **indirectamente confirmado** con FAC-221920/COT-595070, pero **ninguno puede asignarse a una cuenta bancaria con certeza**: en la BD no existe abono bancario que los respalde (las cuentas 0e5733e4 y demás no los muestran; el saldo de 0e5733e4 cuadra exacto sin ellos).

**Decisión:** no asignar `cuenta_id` automáticamente. Se marcan a revisión **sin modificación** (se documenta su identidad para resolverlos en FASE 4 contra el estado de cuenta real). Opcional (solo con aprobación): vista `vw_movimientos_por_revisar` — **no se crea aún**.

---

## 4. CATÁLOGO CONTABLE — MODELO HÍBRIDO

**Análisis de las 47 cuentas (verificado en vivo):** 46 con `empresa_id=NULL` (maestro) + 1 con empresa adc5… (`5.2.1 Car Wash`, única creada por el usuario). **Sin códigos duplicados.** Cobertura completa del PCGA básico:

- **Activo (11):** Caja `1.1.1`, Bancos `1.1.2`, CxC Clientes `1.1.3`, IVA Crédito Fiscal `1.1.4`, Anticipos y Depósitos `1.1.5`, Vehículos `1.2.1`, Equipo `1.2.2`, Dep. Acumulada `1.2.3`.
- **Pasivo (9):** CxP Proveedores `2.1.1`, IVA Débito `2.1.2`, ISR `2.1.3`, Sueldos `2.1.4`, IGSS `2.1.5`, Préstamos L/P `2.2.1`.
- **Patrimonio (4):** Capital `3.1`, Utilid. Retenidas `3.2`, Resultado del Período `3.3`.
- **Ingresos (5):** 4.1 Renta Vehículos, 4.2 Transporte, 4.3 Servicios, 4.4 Otros.
- **Costos (6):** 5.1 Combustible, 5.2 Mantenimiento (+ `5.2.1` del usuario), 5.3 Neumáticos, 5.4 Seguros.
- **Gastos (12):** 6.1–6.11 (sueldos, IGSS, alquiler, servicios, papelería, comunicaciones, representación, depreciaciones, impuestos, financieros, varios).
- Notas: `cuenta_padre_id` está NULL en todas (la jerarquía vive solo en el código `1.1.1`); **Bancos no está desglosado por banco** (FASE 4: bancos/caja serán hijos operativos de `1.1.2`/`1.1.1` vía `cuentas_bancarias.cuenta_contable_id`).

**Modelo recomendado: C) HÍBRIDO** — *maestro global + extensión por empresa*:

- **47 cuentas base** (empresa_id NULL) = "catálogo maestro", inmutable por las empresas, editable solo por super_admin.
- **Cuentas operativas por empresa** (empresa_id NOT NULL) = bancos/caja por cuenta, subcuentas propias de cada negocio (caso actual `5.2.1`).
- Justificación: clonar 47 filas × empresa (B) duplica y diverge (mantenimiento de impuestos/cuentas base inconsistente); catálogo 100% global (A) impide configuraciones diferenciadas por empresa (ya hay evidencia: `5.2.1` es específica).
- **Restricción:** `UNIQUE NULLS NOT DISTINCT (empresa_id, codigo)` → el mismo código puede existir en el maestro y en varias empresas, pero **no duplicado dentro de la misma empresa**.
- **RLS del catálogo:** visible para una empresa = `empresa_id IS NULL OR empresa_id IN (empresas autorizadas)`.

```sql
-- (NO ejecutar) propuesta de constraint + política
ALTER TABLE cuentas_contables ADD CONSTRAINT uq_cuenta_empresa_codigo
  UNIQUE NULLS NOT DISTINCT (empresa_id, codigo);
-- política: USING (empresa_id IS NULL OR empresa_id IN (auth.fn_empresas_autorizadas()))
```

---

## 5. USUARIOS_SISTEMA — ESTRUCTURA Y MODELO MULTIEMPRESA

**Estructura real (sondeo en vivo con la anon key; hoy la tabla está vacía):**

| Columna | Existe |
|---|---|
| `id`, `nombre`, `email`, `rol_id`, `empresa_id`, `auth_id`, `activo`, `created_at` | ✅ |
| `password`, `pass`, `usuario`, `rol`, `telefono`, `estado`, `updated_at`, `ultimo_acceso`, `permisos` | ❌ |

**Hallazgo importante:** la estructura ya trae `auth_id`, `empresa_id`, `rol_id`, `activo` — lo necesario para multiempresa **de un solo slot por usuario**. Falta:

- **Verificar en SQL Editor** (no expuesto por anon): tipos (`auth_id uuid?`), `NOT NULL`, índices únicos (email? auth_id?), FKs hacia `empresas`, `roles`.
- **Multiempresa (1 persona → N empresas):** un solo `empresa_id` no alcanza. Modelo propuesto — **2 capas**:
  ```sql
  -- (NO ejecutar)
  CREATE TABLE usuario_empresas (
    usuario_id uuid NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
    empresa_id uuid NOT NULL REFERENCES empresas(id),
    rol_id     int  NOT NULL REFERENCES roles(id),
    activo     boolean NOT NULL DEFAULT true,
    PRIMARY KEY (usuario_id, empresa_id)
  );
  -- usuarios_sistema.empresa_id queda como "empresa principal" (back-compat);
  -- la autorización viene de usuario_empresas.
  ```
- **Población:** solo al tener la lista real (GRUPO B con mapeo por email → primera empresa). No se inventan usuarios; los 3 roles ya existen.
- **Permisos:** `roles.permisos` (jsonb) gobierna el UI por módulo; `usuario_empresas` da el alcance por empresa (un usuario puede ser `admin` en Tz'unun y `usuario` en R&G).

---

## 6. RLS — MODELO EXACTO

**Decisión:** sí se necesita una **función auxiliar** (evita repetir la subconsulta en ~19 políticas y facilita mantenimiento).

```sql
-- (NO ejecutar) núcleo RLS
CREATE SCHEMA IF NOT EXISTS authz;
CREATE OR REPLACE FUNCTION authz.empresas_autorizadas()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT ue.empresa_id
  FROM public.usuario_empresas ue
  JOIN public.usuarios_sistema us ON us.id = ue.usuario_id
  WHERE us.auth_id = auth.uid() AND us.activo AND ue.activo;
$$;
```

**Cómo responde a tus preguntas:**
- **1 usuario → 1..N empresas:** `usuario_empresas` (N:M). Autorización = filas de `usuario_empresas` para `auth.uid()`, no el `empresa_id` de `usuarios_sistema`.
- **Empresa activa:** competencia de la app (sección 7). RLS no elige, solo acota.
- **Evitar ver otra empresa:** toda política usa la función → filas de otras empresas ni se ven.
- **Evitar modificar `empresa_id` para escalar:** en INSERT/UPDATE de cada tabla, `WITH CHECK (empresa_id IN (authz.empresas_autorizadas()))`. Cambiar a empresa no autorizada = fila rechazada. `usuarios_sistema`/`usuario_empresas` se protegen con política solo-super_admin.
- **Tabla hija `asiento_lineas`:** tras el backfill con `empresa_id`, doble protección:
  ```sql
  -- (NO ejecutar)
  ALTER POLICY select_asi_lineas ON asiento_lineas USING (
    empresa_id IN (SELECT authz.empresas_autorizadas())
  );
  ALTER POLICY write_asi_lineas ON asiento_lineas WITH CHECK (
    empresa_id IN (SELECT authz.empresas_autorizadas())
    AND empresa_id = (SELECT a.empresa_id FROM asientos_contables a WHERE a.id = asiento_id)
  );
  ```
  (Alternativa equivalente `EXISTS` contra el padre si no se quiere depender del backfill.)

**Clasificación de políticas (por tabla):**

| Tablas de negocio (empresa_id NOT NULL) | Catálogos (empresa_id NULL = visible) | Usuarios/roles/Auth |
|---|---|---|
| `clientes, proveedores, vehiculos, servicios, cotizaciones, reservas, facturas, pagos_recibidos, gastos, cuentas_bancarias, movimientos_bancarios, asientos_contables, asiento_lineas, contratos, empleados, mantenimientos` | `cuentas_contables` (`empresa_id IS NULL OR IN (fn)`) · `empresas` (SELECT solo para las autorizadas) | `usuarios_sistema` (SELECT propia fila; UPDATE solo super_admin) · `usuario_empresas` (SELECT propias; escritura super_admin) · `roles` (SELECT para todos) |

En cada tabla de negocio: `SELECT · INSERT · UPDATE · DELETE` con `USING(...) + WITH CHECK(...)`. El catálogo se protege igual pero sin escritura por las empresas. Por defecto **deny** en todas (enable RLS de fábrica + solo las políticas listadas).

---

## 7. EMPRESA ACTIVA vs RLS — FLUJO

RLS = **seguridad**. `empresa_id` en React = **selección de vista**. Flujo:

```
LOGIN (sbLogin)
  ↓  (jwt → auth.uid())
obtener empresas autorizadas  →  RLS: SELECT empresa_id FROM usuario_empresas (protegido)
  ↓
1 empresa  →  empresa activa = esa
N empresas →  selector en UI
  ↓
guardar empresa_activa en localStorage (SOLO UX)
  ↓
cada consulta filtra ?empresa_id=eq.<activa>   (máscara de vista)
  ↓
RLS valida SIEMPRE: empresa activa ∉ autorizadas → 0 filas / 403
```

- **Por qué es seguro el `localStorage`:** solo cambia **qué empresa se pide ver**. Si el usuario fuerza un ID no autorizado, la query vuelve vacía/error y la app recae en la anterior. La evidencia de acceso vive en `usuario_empresas` + `auth.uid()`, que el frontend no puede falsear.
- **Reglas:** en login se borra `empresa_activa`; al cambiar de empresa se re-valida contra la lista autorizada **en cada sesión**; ningún helper acepta un `empresa_id` no verificado (lo verifica DB vía RLS).
- **Diseño:** el `empresa_id` de la factura/línea **no se puede editar hacia otra empresa** (WITH CHECK de la sección 6).

---

## 8. JWT EN LOS HELPERS — ARQUITECTURA

`config.js` expone `sbLogin` (supabase-js Auth) pero `dbGet/dbIns/dbUpd/dbDel` usan `fetch` con la **anon key**. Arquitectura recomendada (sin implementar):

1. **Módulo `services/session.js`:** una sola fuente de la sesión en memoria.
   - `getToken()` → `supabase.auth.getSession()` (memory + SSO); sin sesión → error de login.
   - `refreshSiExpira()` → si `expires_at` < 60 s → `supabase.auth.refreshSession()` con **single-flight** (una sola llamada compartida por promesa mientras N requests concurrentes esperan el mismo refresh).
   - `logout()` → `signOut()` + limpieza de memoria (nunca cachear token muerto).
2. **Helpers:** inyectan `Authorization: Bearer <token>` (y mantienen `apikey` solo como requisito del gateway) antes de cada llamada; **retry una vez** si el server responde 401 (expiró entre check y request, o el refresh ocurrió).
3. **Expiración/refresh:** supabase-js renueva en background; la app debe **forzar logout** si `refreshSession` falla (`invalid_grant`). Persistencia en `localStorage('tzunun_session')` permite restaurar y refrescar al abrir.
4. **Concurrencia:** `getSession` es read-only; el refresh se deduce con single-flight. Nunca refrescar en cada request.
5. **Decisión:** mantener los helpers REST (cambio contenido) y centralizar token en `session.js`; alternativa futura: migrar a `supabase.from(...).select()` (refresh/RLS nativos). Se elige la primera por homogeneidad con el código actual.

**Por qué importa el orden:** sin este paso, al activar RLS todos los helpers seguirían mandando anon y perderían acceso. Es la FASE 3.1, antes de 3.6.

---

## 9. SALDOS BANCARIOS — MODELO DEFINITIVO

Confirmado tu modelo:

```
saldo_contable = saldo_inicial + Σ movimientos_bancarios(empresa, cuenta) [estado = 'activo']
saldo_banco    = estado de cuenta importado (movimientos_importados)   [FASE 4]
Diferencia     = conciliación (marcada, nunca ajusta el ERP)
```

- **`saldo_actual`:** queda como **caché de `saldo_contable`** (nombre legado se conserva; renombrar a `saldo_contable` rompería código — se desaconseja ahora, se documenta).
- **Cálculo atómico:** función + `AFTER INSERT/UPDATE/DELETE OF movimientos_bancarios` con `pg_advisory_xact_lock` (evita carreras y el bug incremental de Pagos/Banca que quedaba desfasado al editar/anular).
  ```sql
  -- (NO ejecutar)
  CREATE FUNCTION fn_recalcular_saldo_cuenta() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('fn_saldo:'||coalesce(NEW.cuenta_id,OLD.cuenta_id)::text));
    UPDATE cuentas_bancarias c SET saldo_actual =
      c.saldo_inicial + coalesce((
        SELECT sum(CASE WHEN m.tipo='ingreso' THEN m.monto ELSE -m.monto END)
        FROM movimientos_bancarios m
        WHERE m.cuenta_id = c.id AND m.estado='activo'
      ),0)
    WHERE c.id = coalesce(NEW.cuenta_id, OLD.cuenta_id);
    RETURN COALESCE(NEW, OLD);
  END $$;
  CREATE TRIGGER trg_mov_saldo AFTER INSERT OR UPDATE OR DELETE ON movimientos_bancarios
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_saldo_cuenta();
  ```
- **Regla dura:** ningún movimiento importado, ajuste de conciliación ni transferencia interna toca `saldo_contable` salvo un movimiento ERP (`tipo_flujo='operativo'`). Transferencias internas (`tipo_flujo='transferencia_interna'`) se EXCLUYEN del neto del período (FASE 2.1, sección 5).
- **Estado actual (verificado): 6/6 cuentas cuadran** → hoy `saldo_actual` ya cumple la definición; el trigger protege contra el futuro.

---

## 10. MIGRACIÓN HISTÓRICA — CLASIFICACIÓN A/B/C

### GRUPO A — SEGURO AUTOMÁTICO (determinista, sin interpretación)
1. `asiento_lineas`: `ADD COLUMN empresa_id` + backfill `FROM asientos_contables` + `SET NOT NULL`. *(6 líneas, 1-1 con el padre)*
2. `facturas`: `numero_factura = numero` donde NULL (3 FAC) — rename canónico.
3. `facturas`: `nombre_receptor = cliente_nombre` y `nit_receptor = cliente_nit` donde NULL (14 FEL).
4. `asientos_contables`: `ADD origen_tipo` + `ADD evento_tipo` + backfill `('manual','manual')` para los 3 actuales.
5. Índices únicos parciales (idempotencia, `uq_facturas_emp_numero`, `uq_movs_dedupe`) — con pre-guardado de duplicados (hoy no hay).
6. Constraints `CHECK` de `estado` (asientos, movimientos) y `tipo_cuenta` (incluye `'caja'`).
7. Función + trigger de recálculo de saldo (solo esquema).
8. Tabla nueva `usuario_empresas` (vacía) + función RLS `authz.empresas_autorizadas()` (esquema).

### GRUPO B — AUTOMÁTICO CON VALIDACIÓN (calcular, mostrar y aplicar tras aprobación)
1. Saldo `facturas`: `anulada → saldo_pendiente=0`. Impacto previsto: **FAC-054325 (630 → 0)**; el resto invariante. **FAC-221920 queda excluida (C).**
2. Backfill de **usuarios reales** desde Auth → `usuarios_sistema` + `usuario_empresas` (mostrar mapeo email→empresa antes de insertar).
3. Habilitar **RLS** + aplicar las políticas (mostrar cobertura tabla a tabla y el efecto).

### GRUPO C — NO AUTOMATIZAR (requieren criterio humano)
1. **FAC-221920** — saldo (1,687.50), movimiento B (6,750), relación bancaria. Reconciliar con el estado de cuenta. **NO TOCAR.**
2. **Movimientos huérfanos** (`9aa1bee7` y `ce00ea20`) — asignación de `cuenta_id`. **NO asignar.**
3. Backfill `origen_tipo/origen_id` de movimientos "ventas" (los 8 pagos antiguos) — requiere emparejarlos con cotizaciones/reservas/pagos.
4. Asiento duplicado `dff6b2e1` (CarWash doble) — anulación manual confirmada por negocio.
5. Registro/rol real de cada usuario (lista de personas).
6. Política de la cuenta `5.2.1` (maestra vs operativa) y desactivación de cuentas bancarias inactivas.

---

## 11. ORDEN DEFINITIVO DE IMPLEMENTACIÓN

Cada paso: objetivo · archivos · tablas · SQL · riesgo · rollback · prueba de aceptación.

### FASE 3.1 — Sesión/JWT en helpers *(código, sin tablas)*
- Objetivo: helpers autenticados con token real + refresh single-flight (sección 8). Desbloquea 3.6.
- Archivos: `config.js`, nuevo `services/session.js`, `App.jsx` (logout/login).
- Riesgo: **medio** (afecta todas las lecturas). Rollback: revert git del commit 3.1.
- Prueba: login→dashboard carga; token expirado→refresh→retry ok; logout→403.

### FASE 3.2 — Backfill estructural A (ítems 1–6 y 8 de GRUPO A)
- Tablas: `asiento_lineas`, `asientos_contables`, `facturas`, `cuentas_bancarias`, `movimientos_bancarios`, `cuentas_contables`, + `usuario_empresas` (vacía) + función RLS.
- SQL: bloques individuales (1, 2, 3, 4, 5, 6, 8). Riesgo: **bajo**.
- Rollback: `DROP COLUMN` / `DROP INDEX` / `DROP TABLE usuario_empresas` / `DROP FUNCTION`.
- Prueba: `SELECT count(*) FROM asiento_lineas WHERE empresa_id IS NULL` = **0**; índices creados.

### FASE 3.3 — Recálculo de saldo facturas (GRUPO B.1)
- Tablas: `facturas`. Riesgo: **bajo**. Rollback: `UPDATE facturas SET saldo_pendiente=…` desde `backup_facturas_saldos`.
- Prueba: `anulada AND saldo<>0` = 0; certificadas/parciales invariantes salvo FAC-221920.

### FASE 3.4 — Multiempresa datos (GRUPO B.2)
- Requiere: lista real de usuarios + aprobación del mapeo. Rollback: `TRUNCATE usuario_empresas` + `usuarios_sistema` (hoy vacía).
- Prueba: cada usuario ve sus empresas autorizadas.

### FASE 3.5 — Catálogo híbrido + empresa activa + filtros
- Archivos: `App.jsx` (selector), `dashboardService.js`, `usePaginacion.js`, `Notificaciones.jsx`, páginas; tabla `cuentas_contables` (constraint de unicidad) y **decisión pendiente de `5.2.1`**.
- Riesgo: **medio**. Rollback: revert git + `DROP CONSTRAINT`. Prueba: con 2 empresas la vista muestra solo la activa.

### FASE 3.6 — Activar RLS (GRUPO B.3)
- Tablas: las 19 + catálogos + usuarios. Riesgo: **alto** (cambio global de comportamiento).
- Rollback: `ALTER TABLE … DISABLE ROW LEVEL SECURITY` por tabla.
- Prueba: usuario A no lee filas de empresa B (`count` = 0); INSERT con empresa ajena → error.

### FASE 3.7 — Correcciones de reglas/UI
- Pagos search columns (columna inexistente `numero`), `siguienteNumero` con empresa+concurrencia, protección de movimientos conciliados/anulados, anulación de asiento con `evento_tipo='reversa'`. Riesgo: bajo/medio. Pruebas funcionales por módulo.

### FASE 3.8 — Trigger de saldos (GRUPO A.7)
- Activación del recálculo atómico. Prueba: editar/anular un movimiento y comprobar recálculo (diff 0).

### FASE 3.9 — Panel de revisión GRUPO C
- Reporte/screen con: FAC-221920, huérfanos A/B, duplicado `dff6b2e1`, movimientos sin origen; resolver con el negocio, no con código.

### FASE 3.10 — Pruebas de aceptación integrales + snapshot para FASE 4/5.

---

## 12. ENTREGABLE — Especificaciones de aceptación

**Decisiones definitivas de esta FASE 3A:**
1. Idempotencia = clave canónica compuesta sin columna extra (índice parcial `estado='activo' AND origen_id IS NOT NULL`).
2. `modulo_origen` → `origen_tipo` (renombrar en 3.2); historial manual con `evento_tipo='manual'`.
3. FAC-221920 y huérfanos = **GRUPO C**, no tocar, conciliar con banco.
4. Catálogo **híbrido** (maestro global + extensión por empresa).
5. Multiempresa con **`usuario_empresas`** N:M + función RLS única.
6. RLS por políticas `SELECT/INSERT/UPDATE/DELETE` con `WITH CHECK` anti-escalamiento.
7. `saldo_contable` derivado de movimientos activos; `saldo_banco` desde importaciones; `saldo_actual` = caché.
8. JWT centralizado en `session.js` (refresh single-flight, retry 401, logout forzado).
9. Migraciones **pequeñas, por bloques, con backup previo y verificaciones** — nunca un script monstruo.

**Decisiones pendientes (a tu criterio, antes de 3.5/3.6/3.9):**
- P1. Resolución FAC-221920 (con banco/cliente) y asignación de huérfanos.
- P2. Usuarios reales y sus roles/empresas.
- P3. Política de `5.2.1` (maestra vs operativa).
- P4. Desactivar cuentas bancarias inactivas.
- P5. Anular el asiento duplicado `dff6b2e1`.
- P6. Confirmar el orden (3.1–3.8 secuencial o subconjunto primero).

**Rollback por bloque (resumen):** código → revert git; esquema/backfill → `DROP COLUMN/INDEX/CONSTRAINT/FUNCTION` o `DROP TABLE usuario_empresas`; datos → `UPDATE` desde `backup_*`; RLS → `DISABLE ROW LEVEL SECURITY`; trigger → `DROP TRIGGER`.

**Pruebas de aceptación (checklist verificable):**
1. `SELECT count(*) FROM asiento_lineas WHERE empresa_id IS NULL` = **0**.
2. `SELECT count(*) FROM facturas WHERE estado='anulada' AND saldo_pendiente<>0` = **0**.
3. Saldo bancario reconstruido = `saldo_actual` en **todas** las cuentas (hoy 6/6 ✓).
4. Usuario A: `count` de filas de empresa B = **0**; `INSERT`/`UPDATE` con `empresa_id` ajeno = error.
5. Doble clic en "Contabilizar gasto" → 1 solo asiento (índice idempotencia).
6. Refresh de token en vuelo + 401 de un helper → retry ok, sin doble petición.
7. Caja/bancos: cuenta `tipo_cuenta='caja'` visible en catálogo y movilizable.
8. `asientos_contables` balanceados (Σdebe = Σhaber) post-reversa.

---

He respetado la regla absoluta: **cero cambios** en código, BD o repositorio durante el análisis. Este documento es el resultado de la revisión FASE 3A para tu aprobación previa a implementación.