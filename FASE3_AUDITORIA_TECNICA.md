# FASE 3 — Auditoría técnica y plan de implementación

Proyecto: ERP Tz'unun · Supabase `fmijbpatkddkbxlkfoza`
Alcance: solo lectura e inspección (PostgREST + código). Sin modificaciones, sin commits, sin deploy.

---

## 1. Estado real de la autenticación y la empresa activa

**No existe AuthContext ni `DEFAULT_EMPRESA_ID`.** La auth vive inline en `App.jsx` y la empresa NO se persiste en `localStorage`.

| Aspecto | Hallazgo (file:line) |
|---|---|
| Login | `src/App.jsx:387` → `sbLogin(email, pass)` de Supabase Auth |
| Sesión | guardada en `localStorage('tzunun_session')` (`App.jsx:655-656`); se restaura al abrir (`:593`) |
| Logout | `App.jsx:661-662` |
| Empresa activa | estado `empId` (`:597`); se obtiene una sola vez con `getEmpId()` = `dbGet("empresas","&select=id&limit=1")` (`config.js:95-96`, `App.jsx:643`) → **siempre la primera empresa de la tabla** |
| SDK/helpers | `config.js`: `dbGet`/`dbIns`/`dbUpd`/`dbDel` — todos usan el header **anon key** `H` (`:4`), **no el token de sesión** |
| Numeración | `siguienteNumero` (`config.js:33-53`) hace `UPDATE empresas SET ultima_*` + fallback `number.desc&limit=1` |

**Datos reales (PostgREST):** `empresas` = **1** (Transportes Tz'unun, NIT 66907853). `usuarios_sistema` = **0 filas** (existe pero vacía). `roles` = 3 (super_admin/admin/usuario con `permisos` jsonb). → No hay ningún usuario mapeado en `usuarios_sistema`; los que entran existen solo en Supabase Auth. No existe columna `auth_id` y la sesión no viaja en los helpers.

**Consecuencias (respuestas A–J):**
- A) No hay empresa activa real; se "elige" por defecto la primera. Empresa e id en `localStorage` no existen (`tzunun_session` sí).
- B) No hay respaldo de empresa en caché → cada arranque re-consulta.
- C) El token anon (`SK`) va en TODAS las solicitudes de datos (`dashboardService.js:3-13`, `usePaginacion.js`, etc.) → **cualquiera que lea la key de la app tiene acceso a todas las tablas de todas las empresas** (RLS inexistente).
- D) Login/Logout no invalidan JWT client-side salvo limpiar `localStorage`.
- E) `usuarios_sistema` debería ser el mapeo `auth_id ↔ empresa_id ↔ rol`; hoy es tabla huérfana sin uso.
- F) `siguienteNumero` no contempla empresa ni concurrencia (riesgo de choque al correr varios navegadores).

---

## 2. Auditoría RLS por esquema

No se puede inspeccionar `pg_policies`/`information_schema` con la anon key (el OpenAPI `GET /rest/v1/` exige service_role → 401). Verificación propuesta para el **SQL Editor** (solo lectura, sin ejecutar cambios ahora):

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
SELECT count(*) FROM pg_policies;                       -- 0 = nada protegido
SELECT rolname FROM pg_roles WHERE rolname LIKE 'postgrest%';
```

**Clasificación por esquema actual (20 tablas sondeadas vía PostgREST, todas responden a anon):**

- **A (expuestas y con datos):** `empresas`, `clientes`(113), `proveedores`(9), `vehiculos`(12), `servicios`(1), `cotizaciones`(123), `reservas`(86), `facturas`(17), `pagos_recibidos`(4), `gastos`(20), `cuentas_bancarias`(6), `movimientos_bancarios`(32), `cuentas_contables`(47), `asientos_contables`(3), `asiento_lineas`(6), `contratos`(6), `empleados`(8), `mantenimientos`(3), `roles`(3).
- **B (expuestas, vacías):** `usuarios_sistema` (0).
- **F (inexistentes):** `notificaciones` (¡la app no tiene tabla de notificaciones!; el componente `Notificaciones.jsx:17-23` lee reservas/vehiculos/mantenimientos/cotizaciones/facturas sin filtro de empresa), `importaciones_bancarias`, `movimientos_importados`, `conciliaciones`, `transferencias` (propuestas para fases futuras).

Hoy: **ningún dato está protegido** y **todas las tablas son legibles por anon** → clasificación efectiva A+FL (full leak). Es el riesgo #1. Se corrige con JWT real + RLS en el paso 3.1/3.2.

---

## 3. Auditoría de `asiento_lineas` (esquema + datos + SQL propuesto)

**Hallazgos:**
- Columnas reales: `asiento_lineas(id, asiento_id, cuenta_id, descripcion, debe, haber, created_at)` → **NO tiene `empresa_id`** *(412/42703 confirmado en vivo)*. `asientos_contables` sí tiene `empresa_id`.
- Los 3 asientos existentes son `modulo_origen='manual'`, `origen_id=NULL`; los 3 cuadran (debe=haber=60). **Uno está anulado (`7c6e0861`) pero conserva sus 2 líneas** (correcto para auditoría).
- **Duplicado real:** `68e1badd` y `dff6b2e1` (mismo "CarWash Mahindra" Q60) creados con 7s de diferencia y ambos `activo` → evidencia de doble envío / falta de idempotencia.
- Gastos: 20/20 con `contabilizado=false` → el botón de `Gastos.jsx:698-747` aún no se usó en producción; la consulta `api('/cuentas_contables?codigo=eq.X&select=*')` es **sin `empresa_id`** y el INSERT de asiento tampoco valida idempotencia.

**SQL propuesto (SOLO para tu revisión — no ejecutar en esta sesión):**
```sql
-- A) empresa_id en líneas + backfill desde el padre
ALTER TABLE asiento_lineas ADD COLUMN empresa_id uuid REFERENCES empresas(id);
UPDATE asiento_lineas l SET empresa_id = a.empresa_id
FROM asientos_contables a WHERE a.id = l.asiento_id;
ALTER TABLE asiento_lineas ALTER COLUMN empresa_id SET NOT NULL;
-- B) idempotencia (protege contra dobles clics / reintentos)
ALTER TABLE asientos_contables ADD COLUMN evento_tipo text; -- devengo|tesoreria|reversa|cierre|apertura|manual
ALTER TABLE asientos_contables ADD COLUMN idempotencia text;
UPDATE asientos_contables SET evento_tipo='manual', idempotencia='manual-'||id WHERE evento_tipo IS NULL;
CREATE UNIQUE INDEX uq_asientos_idempotencia
  ON asientos_contables (empresa_id, modulo_origen, origen_id, evento_tipo)
  WHERE estado <> 'anulado' AND modulo_origen <> 'manual';
-- C) verificación de consistencia
SELECT a.id, count(l.id) lineas, sum(l.debe), sum(l.haber), sum(l.debe)-sum(l.haber) dif
FROM asientos_contables a LEFT JOIN asiento_lineas l ON l.asiento_id=a.id
GROUP BY a.id HAVING (sum(l.debe)-sum(l.haber))<>0 OR count(l.id)=0;
```
Clave de idempotencia canónica: `(empresa_id, modulo_origen, origen_id, evento_tipo)`.

---

## 4. Auditoría de `facturas` y `saldo_pendiente`

**Números reales (dry-run):**
- 17 facturas · total Q45,093.70 · suma `saldo_pendiente` = **Q2,317.50**.
- Estados: 14 `certificada` (todas FEL, `saldo_pendiente`=0 ✓), 1 `parcial` (FAC-221920: total 6,750 / saldo 1,687.50), 2 `anulada` (FAC-054325: 630 con saldo 630 → **anulada con saldo ≠ 0, inconsistencia**; FAC-000129: 0 ✓).
- `pagos_recibidos`: **4 pagos, NINGUNO con `factura_id`** (todos apuntan a `reserva_id`+`cotizacion_id`). Total Q7,077.50.
- En `movimientos_bancarios` existe "Pago FAC-221920" por 6,750 (`conciliado=true`) **sin `cuenta_id`** → dinero cobrado que no está en ninguna cuenta, y la factura sigue "parcial". **Conciliar**: si 6,750 es abono a FAC-221920, el saldo debería ser 0 (no 1,687.50).

**Inconsistencias a investigar (total Q2,317.50):** FAC-221920 (1,687.50) y FAC-054325 (630). Regla propuesta de recálculo: `saldo_pendiente = total - suma(abonos no anulados)` para `certificada/parcial`; **`anulada` → 0**; `borrador` → sin saldo.

**SQL propuesto (revisión):**
```sql
CREATE UNIQUE INDEX uq_facturas_emp_numero ON facturas (empresa_id, numero);          -- prevención de duplicados
ALTER TABLE facturas ADD COLUMN cliente_id uuid REFERENCES clientes(id);               -- FEL no lo trae
-- reshape canónico de receptor (ver sección 6)
UPDATE facturas SET nombre_receptor = NULL WHERE nombre_receptor = cliente_nombre
  AND cliente_nombre IS NOT NULL;   -- evitar duplicación tras el backfill
-- consultas de control (para el SQL Editor, luego de backfill):
-- 1) activas sin saldo    2) pagadas sin saldo_cero    3) parciales con saldo=0    4) anuladas con saldo<>0
```
Nota: el payload de guardar en `Facturacion.jsx:195-212` no incluye `saldo_pendiente` (columna agregada después por la migración) y el `numero_factura` se autogenera por timestamp → el backfill canónico debe recalcular los saldos de las 17 facturas al migrar.

---

## 5. Auditoría de `cuentas_bancarias` / `movimientos_bancarios`

**Hallazgos:**
- 6 cuentas (2 en uso real: BANRURAL 3309159475 y 853-000016-8; 1 histórica 3099347613). Columnas: `id, empresa_id, banco, numero_cuenta, tipo_cuenta, moneda, saldo_actual, activa, saldo_inicial, titular` → **NO tienen `cuenta_contable_id`**.
- `movimientos_bancarios` (32): **NO tienen `origen_tipo/origen_id/estado`**; sí tienen `cuenta_id, tipo, monto, categoria, factura_id, cotizacion_id, conciliado, referencia`.
- **Dry-run de saldos — reconstrucción `saldo_inicial + sum(ingresos) - sum(egresos)` = `saldo_actual` en 6/6 cuentas (diff 0.00)** ✓. El `recalcularSaldo` de `Banca.jsx:325-339` hoy funciona; el riesgo está en que se ejecuta incrementalmente.
- **Datos huérfanos:** 2 movimientos sin `cuenta_id` (Q11,812.50): "Anticipo traslado a Ixcún" (5,062.50) y "Pago FAC-221920" (6,750, conciliado). Q6,750 ya cobrado **no está en el saldo de ninguna cuenta bancaria**.
- `ImportadorBancario` (`Banca.jsx:59+`) inserta por fila **sin dedupe** → repetir archivo duplica saldos. `guardarCuenta` (`:377-386`) define `saldo_inicial=saldo_actual` y no enlaza cuenta contable.

**Hallazgo de `Pagos.jsx`:** lógica incremental de saldo (INSERT movimiento + `UPDATE cuentas_bancarias.saldo_actual` y `facturas.saldo_pendiente/estado`) **sin corrección al editar/anular**; y `usePaginacion` con columnas `['numero','cliente_nombre','concepto','referencia','notas']` donde **`numero` no existe** en `pagos_recibidos`.

**SQL propuesto (revisión):**
```sql
ALTER TABLE cuentas_bancarias ADD COLUMN cuenta_contable_id uuid REFERENCES cuentas_contables(id);
ALTER TABLE cuentas_bancarias ADD CHECK (tipo_cuenta IN ('monetaria','ahorro','monetaria_usd','caja'));
ALTER TABLE movimientos_bancarios ADD COLUMN estado text NOT NULL DEFAULT 'activo';
ALTER TABLE movimientos_bancarios ADD COLUMN origen_tipo text;
ALTER TABLE movimientos_bancarios ADD COLUMN origen_id uuid;
ALTER TABLE movimientos_bancarios ADD COLUMN tipo_flujo text DEFAULT 'operativo'; -- 'transferencia_interna' excluida del neto
ALTER TABLE movimientos_bancarios ADD COLUMN dedupe_key text;
CREATE UNIQUE INDEX uq_movs_dedupe ON movimientos_bancarios (empresa_id, cuenta_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
-- backfill de huérfanos: reasignar cuenta_id de "Pago FAC-221920" y "Anticipo Ixcún" según criterio del negocio
-- recálculo verificado vía (sección 8)
```
Para FASE 4 (banca) se crean `importaciones_bancarias`/`movimientos_importados`/`conciliaciones` — fuera del alcance de FASE 3.

---

## 6. Columnas canónicas

**Duplicación real verificada:**
- `facturas`: 14 FEL tienen `cliente_nombre`/`cliente_nit` (receptor NULL); las 3 no-FEL (`FAC-*`) tienen `nombre_receptor`/`nit_receptor` (cliente NULL).
- El catálogo contable: 46/47 cuentas con `empresa_id = NULL` (catálogo "global") y **1 cuenta creada por el usuario con empresa adc5…** (5.2.1 Car Wash), con `cuenta_padre_id` NULL en todas (sin jerarquía real por FK) a pesar de `nivel` 1–3.

**Propuesta de canonización (para la migración mínima):**
- Cliente/Factura → canónico: `nombre_receptor`, `nit_receptor` (nombres del FEL). Backfill: `nombre_receptor=cliente_nombre` donde NULL; `cliente_nombre` se conserva como alias de búsqueda. Igual con `nit_receptor/cliente_nit`.
- Documentos → canónico: **`numero`** (las FEL lo traen igual a `numero_factura`; para `FAC-*` solo existe `numero`). Backfill: `facturas.numero_factura=numero` donde NULL (solo para no-FEL con FEL real no disponible).
- Saldos → `saldo_pendiente` recomputada por la regla de la sección 4 (nunca manual).
- Movimientos de dinero → `origen_tipo/origen_id` (sección 5).
- Asientos → `empresa_id` en líneas + `evento_tipo`/idempotencia (sección 3).

---

## 7. Inventario de lecturas globales (dashboard y notificaciones)

| Archivo | Lectura | Filtro empresa |
|---|---|---|
| `services/dashboardService.js:15-26` | vehiculos, reservas, cotizaciones, facturas, movimientos_bancarios, cuentas_bancarias, clientes, mantenimientos, contratos + agregados de ingresos por tipo | **Ninguno** |
| `hooks/usePaginacion.js` | `select=*&order=…` + Range/Prefer | **Ninguno** |
| `components/Notificaciones.jsx:17-23` | reservas, vehiculos, mantenimientos, cotizaciones, facturas (estado=…) | **Ninguno** |
| `pages/Contabilidad.jsx` | cuentas_contables, asientos por fecha | **Ninguno** |
| `pages/Gastos.jsx:702-703` | cuentas_contables por código | **Ninguno** |
| `pages/Banca.jsx`, `pages/Pagos.jsx`, `pages/Facturacion.jsx` | cuentas/movimientos/pagos/facturas | **Ninguno** |

→ **Todos los reads y writes son globales.** Con 1 sola empresa hoy no hay fuga visible, pero al meter la segunda empresa todo se mezclará. El RLS + `empresa_id` por tabla es obligatorio antes de activar la empresa 2.

---

## 8. Plan de migración histórica mínima

Backup → dry-run → aplicar → verificar → rollback (si falla verificación).

```sql
-- Backup (en SQL Editor): exportar ya está cubierto por el dump; además crear tabla-paralela
CREATE TABLE backup_facturas_saldos AS SELECT * FROM facturas;
CREATE TABLE backup_asientos AS SELECT * FROM asientos_contables;
CREATE TABLE backup_asiento_lineas AS SELECT * FROM asiento_lineas;
CREATE TABLE backup_movimientos AS SELECT * FROM movimientos_bancarios;
-- Dry-run (SELECTs, NO UPDATE): replicar el cálculo de saldos propuesto en una consulta de simulación
SELECT f.id, f.estado, f.total,
       coalesce(f.saldo_pendiente,0) actual,
       CASE WHEN f.estado='anulada' THEN 0
            ELSE f.total - coalesce((SELECT sum(m.monto) FROM pagos_recibidos p
                                     JOIN movimientos_bancarios m ON m.origen_id=p.id
                                     WHERE p.factura_id=f.id AND m.estado='activo'),0)
       END nuevo
FROM facturas f;   -- expect: FAC-221920 0 vs 1687.50, FAC-054325 0 vs 630
```
Verificaciones de control al final:
```sql
-- saldos bancarios
SELECT c.id, c.saldo_inicial + coalesce(sum(CASE WHEN m.tipo='ingreso' THEN m.monto WHEN m.tipo='egreso' THEN -m.monto END),0) - c.saldo_actual dif
FROM cuentas_bancarias c LEFT JOIN movimientos_bancarios m ON m.cuenta_id=c.id AND m.estado='activo'
GROUP BY c.id HAVING dif<>0;                       -- expect: 0 filas (hoy ya da 0 filas ✓)
-- facturas
SELECT count(*) FROM facturas WHERE estado='anulada' AND saldo_pendiente<>0;          -- expect: 0
SELECT count(*) FROM facturas WHERE estado='certificada' AND saldo_pendiente<>0;      -- expect: 0
-- asientos
SELECT count(*) FROM asiento_lineas WHERE empresa_id IS NULL;                         -- expect: 0
-- CONCLUSIÓN: aplicar los scripts 3,4,5 (solo tras tu aprobación)
```
Rollback: `DROP` de la columna nueva + `UPDATE facturas SET saldo_pendiente=(SELECT … FROM backup_facturas_saldos)` + restaurar backups. Con `empresa_id` en líneas el backfill es idempotente (`UPDATE…FROM asientos`).

**Regla de oro (validada con FASE 2.1):** sin generación retroactiva de asientos; solo presentes a futuro. La reconstrucción de libros históricos se hará (si acaso) con el mismo generador sobre documentos originales en orden de fecha + dry-run.

---

## 9. Backup + dry-run: diseño y verificaciones concretas

Ya cubierto en la sección 8. Resumen ejecutivo:
- **Backup:** dump de Supabase existente + 4 tablas-paralelas `backup_*` en SQL Editor (0 riesgo).
- **Dry-run:** consultas SELECT "simuladoras" (sección 8) → se corren primero, se muestran las diferencias, se aprueban, y solo entonces se aplica el cambio real idempotente.
- **Verificación post-aplicación:** 4 sentencias de control (saldos=0 dif, anuladas sin saldo, sin líneas huérfanas).
- **Rollback:** DROP columna + UPDATE desde tabla backup.

---

## 10. Orden de implementación dentro de FASE 3

Complejidad: **baja (B)** / **media (M)** / **alta (A)**.

1. **Seguridad base – JWT real en helpers** (`config.js` `dbGet/dbIns/dbUpd/dbDel` + `App.jsx` sesión): cambiar anon por token; `siguienteNumero`, `getEmpId` aceptan `emp_id`. **[M]** — requisito para todo lo demás.
2. **`auth_id` en `usuarios_sistema` + registro de los 3 roles en usuarios existentes.** **[M]**
3. **Backfill mínimo de columnas** (5, 6): empresa_id en cuentas (catálogo global NULL → mapear a empresa act o dejar global y declarar política), `nombre_receptor/nit_receptor`, `numero_factura`, `asiento_lineas.empresa_id`. **[B]**
4. **Recálculo de saldos** (facturas y bancos) según secciones 4–5 (hoy bancos ya cuadran ✓; facturas → corregir 2,317.50). **[B]**
5. **RLS activo por `auth.uid()` vía `usuarios_sistema`** en ~19 tablas + revocar anon por defecto. **[A]**
6. **Filtro `empresa_id` en lecturas** (`dashboardService`, `usePaginacion`, `Notificaciones`, páginas) + persistir `empresa_activa` en `localStorage` con selector de empresa tras login. **[M]**
7. **Idempotencia en `contabilizar` (Gastos), registrar pagos y movimientos** (clave sección 3-B). **[M]**
8. **Correcciones puntuales de UI** (search columns en Pagos; `siguienteNumero` con empresa; anulación de asiento ≠ borrar). **[B]**
9. **Migración histórica mínima con backup+dry-run+verificación+rollback** (sección 8). **[M]**
10. **Plan de pruebas integral** (sección 11). **[B/M]**

**Salida de FASE 3 → FASE 4** (banca/conciliación) y **FASE 5** (generador de asientos con idempotencia) queda preparada estructuralmente (columnas, índices, claves) sin activarla.

---

## 11. Criterios de aceptación (14 ítems del usuario → estado)

| # | Criterio | Estado actual | Plan en FASE 3 |
|---|---|---|---|
| 1 | Acceso por usuario autenticado | ❌ solo Supabase Auth, sin mapa | Paso 2 (auth_id + usuarios_sistema) |
| 2 | Empresa activa determinada por usuario | ❌ `limit=1` a primera empresa | Paso 2+6 (empresa_activa en sesión) |
| 3 | Datos aislados por empresa (RLS) | ❌ sin políticas, anon total | Paso 5 (RLS por auth.uid) |
| 4 | Helpers usan token de sesión | ❌ anon key | Paso 1 (JWT en dbGet/dbIns/dbUpd/dbDel) |
| 5 | Columnas canónicas consistentes | ⚠️ duplicado FAC*/FEL | Paso 3 (backfill) |
| 6 | Saldos consistentes (facturas) | ❌ 2,317.50 en inconsistencia | Paso 4 (recalcular) |
| 7 | Saldos consistentes (bancos) | ✅ 6/6 cuadran (2 movs sin cuenta = 11,812.50 a revisar) | Paso 4+5 (huérfanos) |
| 8 | Caja tiene cuenta tipo caja | ❌ no existe tipo `caja` | Paso 3 (check constraint en la tabla cuentas) |
| 9 | Asiento comprobado y balanceado | ⚠️ cuadran pero 1 duplicado por doble envío | Paso 7 (idempotencia) |
| 10 | Asiento reversible/anulable sin borrado | ⚠️ anulado pero conserva líneas (correcto) | Paso 7 (evento_tipo reversa) |
| 11 | Conciliación no rompe saldo | ❌ conciliado=true sin cuenta | Paso 5 (huérfanos + reglas) |
| 12 | Importador sin duplicados | ❌ sin dedupe | Paso 7 (dedupe_key) |
| 13 | No se editan/borran movs conciliados | ⚠️ UI lo permite hoy | Paso 7 (guardas) |
| 14 | Dashboard/flujo aislado por empresa | ❌ lecturas globales | Paso 6 (filtros) |

---

## 12. Panel de decisiones (pendientes del cliente)

1. **Catálogo de cuentas:** ¿global compartido (NULL) o clonado por empresa? (dato: 46 global + 1 específica).
2. **Empresa activa:** ¿selector en login para usuarios multiempresa, o primera con permisos?
3. **Factura FAC-221920 (Q6,750 cobrados, parcial, `cuenta_id` NULL):** ¿aplicar abono→certificarla y llevarla a la cuenta bancaria real, o dejarla como está para FASE 4?
4. **Cuentas bancarias inactivas (0/ históricas):** ¿desactivar (`activa=false`) para limpiar el flujo?
5. **`usuarios_sistema`:** ¿cuántos usuarios reales y con qué rol (los 3 roles ya existen)?
6. **Orden/prioridad:** FASE 3 secuencial (1→10) o ¿empezar por un subconjunto (1-6) que desbloquea multiempresa y dejas idempotencia para FASE 5?
7. **Script consolidado:** ¿preparar el script SQL único de FASE 3 (backups + backfills + recálculos + RLS, idempotente y con dry-run) para ejecutarlo tú en el SQL Editor?